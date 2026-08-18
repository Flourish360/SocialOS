import hashlib
import hmac
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import cast, String
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..models.user import User
from ..models.social_account import SocialAccount
from ..models.post import Post, PostPlatformTarget
from ..models.api_key import ApiKey
from ..api.deps import get_current_user
from ..core.config import settings
from ..services.publishers import publish_to_platform
from .ecommerce_templates import pick_template, get_platform_prompt

router = APIRouter(prefix="/ecommerce", tags=["ecommerce"])

MODEL = "claude-opus-4-8"
SUPPORTED_PLATFORMS = ["instagram", "tiktok", "twitter", "linkedin", "facebook"]

# Injected into every Claude system prompt — enforced globally.
_STYLE_RULES = (
    "Never use em dashes (the character —) anywhere in the caption. "
    "Use a comma, colon, or period instead. "
    "Never use the word 'stunning' or generic filler phrases. "
    "Be specific, direct, and on-brand. "
    "Return only the caption text with no explanation, no label, no surrounding quotes."
)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _hash_key(raw: str) -> str:
    return hmac.new(
        settings.API_KEY_SECRET.encode(),
        raw.encode(),
        hashlib.sha256,
    ).hexdigest()


def _claude_client():
    if settings.ANTHROPIC_API_KEY:
        import anthropic
        return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return None


def _safe_call(fn):
    try:
        return fn()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Claude call failed: %s", e)
        return None


def _text(response) -> str:
    for block in response.content:
        if block.type == "text":
            return block.text.strip()
    return ""


def _generate_caption(client, system_prompt: str, context: str) -> str | None:
    full_system = system_prompt + "\n\n" + _STYLE_RULES
    resp = _safe_call(lambda: client.messages.create(
        model=MODEL,
        max_tokens=400,
        system=full_system,
        messages=[{"role": "user", "content": context}],
    ))
    return _text(resp) if resp else None


def _resolve_api_key(raw: str, db: Session) -> tuple[User, ApiKey]:
    """Validate X-Api-Key, update last_used_at, return (user, key_record)."""
    if not raw:
        raise HTTPException(status_code=401, detail="Missing X-Api-Key header")
    record = db.query(ApiKey).filter(
        ApiKey.key_hash == _hash_key(raw),
        ApiKey.is_active == True,
    ).first()
    if not record:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")
    user = db.query(User).filter(User.id == record.user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="Account not found")
    record.last_used_at = datetime.now(timezone.utc)
    db.commit()
    return user, record


def _fallback_product(name: str, price: float, currency: str, platform: str) -> str:
    p = f"{currency} {price:,.2f}"
    return {
        "instagram": f"New drop: {name} at {p}. Shop now, link in bio. #NewProduct #ShopNow",
        "tiktok": f"Just dropped: {name} for {p}! Check the link in bio. #fyp #newdrop",
        "twitter": f"New: {name} at {p}. Shop now.",
        "linkedin": f"We just listed {name} at {p}. Check it out.",
        "facebook": f"New arrival: {name} at {p}. Shop now!",
    }.get(platform, f"New: {name} at {p}")


def _fallback_sale(name: str, price: float, currency: str, template_key: str, platform: str, units_remaining: int | None) -> str:
    p = f"{currency} {price:,.2f}"
    if template_key == "unique_item":
        return f"{name} has found its forever home. Thank you to the collector. One of one."
    if template_key == "sold_out":
        return f"{name} is sold out! Follow for restock updates."
    if template_key == "scarcity":
        rem = f"Only {units_remaining} left!" if units_remaining else "Almost gone!"
        return f"{rem} {name} at {p}. Grab yours now."
    if template_key == "milestone":
        return f"Another milestone! {name} keeps selling. Thank you all."
    return f"Just sold: {name} at {p}. Still available, shop now!"


def _create_posts(
    db: Session,
    user: User,
    captions: dict[str, str],
    media_urls: list[str],
    platform_filter: list[str] | None,
    action: str,
    event_tag: str,
    order_id: str | None = None,
) -> list[dict]:
    accounts = db.query(SocialAccount).filter(
        SocialAccount.user_id == user.id,
        SocialAccount.is_connected == True,
        SocialAccount.platform.in_(SUPPORTED_PLATFORMS),
    ).all()

    if platform_filter:
        accounts = [a for a in accounts if a.platform in platform_filter]

    if not accounts:
        raise HTTPException(
            status_code=422,
            detail="No connected social accounts for the requested platforms. Connect accounts in Settings first.",
        )

    now = datetime.now(timezone.utc)
    is_live = action == "post_now"
    results = []

    for account in accounts:
        caption = captions.get(account.platform) or captions.get("instagram", "")

        # "post_now" means publish for real, right now — never fabricate a
        # "published" status without actually calling the platform's API.
        publish_result = (
            publish_to_platform(db, user.id, account.platform, caption, media_urls, "image" if media_urls else "none")
            if is_live else None
        )
        succeeded = bool(publish_result and publish_result.get("success"))
        platform_post_id = publish_result.get("post_id") if publish_result else None
        error_message = publish_result.get("error") if publish_result and not succeeded else None

        post = Post(
            user_id=user.id,
            caption=caption,
            media_urls=media_urls,
            media_type="image" if media_urls else "none",
            status=("published" if succeeded else "failed") if is_live else "scheduled",
            published_at=now if succeeded else None,
            scheduled_at=None if is_live else now,
            # One Post row per platform here, so this is always a single-item
            # list — kept as a list of platform NAMES (not account IDs) so the
            # scheduler's _publish_due_posts can match SocialAccount.platform.
            platform_account_ids=[account.platform],
            platform_post_ids=(
                {**({"_order_id": order_id} if order_id else {}), account.platform: platform_post_id}
                if platform_post_id else ({"_order_id": order_id} if order_id else {})
            ),
            ai_generated=True,
            content_type_tag=event_tag,
        )
        db.add(post)
        db.flush()

        target = PostPlatformTarget(
            post_id=post.id,
            account_id=account.id,
            platform=account.platform,
            status=("published" if succeeded else "failed") if is_live else "pending",
            platform_post_id=platform_post_id,
            published_at=now if succeeded else None,
            error_message=error_message,
        )
        db.add(target)

        results.append({
            "platform": account.platform,
            "post_id": post.id,
            "status": target.status,
            "caption_preview": caption[:120] + ("..." if len(caption) > 120 else ""),
        })

    db.commit()
    return results


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateKeyRequest(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def name_valid(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Store name is required")
        if len(v) > 80:
            raise ValueError("Store name must be 80 characters or fewer")
        return v


class ProductRequest(BaseModel):
    name: str
    price: float
    currency: str = "USD"
    description: str = ""
    images: list[str] = []
    url: str = ""
    attributes: dict = {}
    platforms: list[str] | None = None
    action: str = "queue"       # post_now | queue
    template: str | None = None

    @field_validator("action")
    @classmethod
    def action_valid(cls, v: str) -> str:
        if v not in ("post_now", "queue"):
            raise ValueError("action must be 'post_now' or 'queue'")
        return v


class SaleRequest(BaseModel):
    order_id: str
    order_status: str  # must be "confirmed" — we reject everything else
    product_name: str
    price: float
    currency: str = "USD"
    image: str | None = None
    quantity_sold: int = 1
    units_remaining: int | None = None
    is_unique: bool = False
    buyer_location: str | None = None
    url: str = ""
    attributes: dict = {}
    platforms: list[str] | None = None
    action: str = "post_now"    # post_now | queue
    template: str | None = None

    @field_validator("order_status")
    @classmethod
    def status_must_be_confirmed(cls, v: str) -> str:
        if v != "confirmed":
            raise ValueError(
                f"order_status '{v}' rejected. "
                "SocialOS only posts on confirmed orders. "
                "Never call this endpoint on payment initiation — "
                "wait for your payment provider's order.confirmed webhook."
            )
        return v

    @field_validator("action")
    @classmethod
    def action_valid(cls, v: str) -> str:
        if v not in ("post_now", "queue"):
            raise ValueError("action must be 'post_now' or 'queue'")
        return v


# ── Key management endpoints (JWT auth) ───────────────────────────────────────

@router.get("/keys")
def list_keys(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    keys = (
        db.query(ApiKey)
        .filter(ApiKey.user_id == current_user.id, ApiKey.is_active == True)
        .order_by(ApiKey.created_at.desc())
        .all()
    )
    return [
        {
            "id": k.id,
            "name": k.name,
            "key_preview": k.key_prefix + "••••",
            "created_at": k.created_at.isoformat() if k.created_at else None,
            "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
        }
        for k in keys
    ]


@router.post("/keys", status_code=201)
def create_key(
    body: CreateKeyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Generating a new key rotates out any existing one, only one key is ever
    # usable at a time, but the user doesn't have to revoke manually first.
    db.query(ApiKey).filter(
        ApiKey.user_id == current_user.id,
        ApiKey.is_active == True,
    ).update({"is_active": False})

    raw = "sk_live_" + secrets.token_hex(24)
    key = ApiKey(
        user_id=current_user.id,
        name=body.name,
        key_hash=_hash_key(raw),
        key_prefix=raw[:16],
    )
    db.add(key)
    db.commit()
    db.refresh(key)
    return {
        "id": key.id,
        "name": key.name,
        "key": raw,                          # returned ONCE, never stored plain
        "key_preview": key.key_prefix + "••••",
        "created_at": key.created_at.isoformat(),
        "warning": "Copy this key now. It will not be shown again.",
    }


@router.delete("/keys/{key_id}", status_code=204)
def revoke_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    key = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.user_id == current_user.id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    key.is_active = False
    db.commit()


# ── Store feed (JWT auth) ─────────────────────────────────────────────────────

@router.get("/feed")
def store_feed(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    posts = (
        db.query(Post)
        .filter(
            Post.user_id == current_user.id,
            Post.content_type_tag.in_(["product_listed", "product_sold"]),
        )
        .order_by(Post.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": p.id,
            "caption": p.caption,
            "media_urls": p.media_urls or [],
            "status": p.status,
            "event": p.content_type_tag,
            "platforms": [t.platform for t in p.platform_targets],
            "error_message": next((t.error_message for t in p.platform_targets if t.error_message), None),
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in posts
    ]


# ── Product endpoint (X-Api-Key auth) ─────────────────────────────────────────

@router.post("/product", status_code=201)
def ingest_product(
    body: ProductRequest,
    x_api_key: str = Header(..., alias="X-Api-Key"),
    db: Session = Depends(get_db),
):
    user, api_key = _resolve_api_key(x_api_key, db)
    client = _claude_client()

    attrs_str = ", ".join(f"{k}: {v}" for k, v in body.attributes.items()) if body.attributes else ""
    context = "\n".join(filter(None, [
        f"Product name: {body.name}",
        f"Price: {body.currency} {body.price:,.2f}",
        f"Description: {body.description}" if body.description else None,
        f"URL: {body.url}" if body.url else None,
        f"Attributes: {attrs_str}" if attrs_str else None,
    ]))

    platform_prompts = {
        "instagram": (
            f"Write an Instagram caption announcing a new product called '{body.name}' "
            f"priced at {body.currency} {body.price:,.2f}. "
            f"{'Include this context: ' + body.description + '. ' if body.description else ''}"
            f"{'Attributes: ' + attrs_str + '. ' if attrs_str else ''}"
            "Make it exciting. Add 5 to 8 relevant hashtags at the end. "
            "Finish with 'Link in bio.' on its own line."
        ),
        "tiktok": (
            f"Write a TikTok caption for a new product '{body.name}' at {body.currency} {body.price:,.2f}. "
            "Start with a punchy hook. Keep it under 150 characters. 2 to 3 emojis. "
            "End with a CTA pointing to the link in bio."
        ),
        "twitter": (
            f"Write a tweet announcing new product '{body.name}' at {body.currency} {body.price:,.2f}. "
            "Under 240 characters. Concise and punchy. 1 emoji max."
        ),
        "linkedin": (
            f"Write a LinkedIn post announcing '{body.name}' at {body.currency} {body.price:,.2f}. "
            "Professional tone. 2 to 3 sentences. No hashtags."
        ),
        "facebook": (
            f"Write a Facebook post for new product '{body.name}' at {body.currency} {body.price:,.2f}. "
            "Friendly and casual. 1 to 2 emojis. Clear CTA. Under 200 characters."
        ),
    }

    captions: dict[str, str] = {}
    if client:
        for platform, prompt in platform_prompts.items():
            caption = _generate_caption(client, prompt, context)
            captions[platform] = caption or _fallback_product(body.name, body.price, body.currency, platform)
    else:
        for platform in platform_prompts:
            captions[platform] = _fallback_product(body.name, body.price, body.currency, platform)

    results = _create_posts(
        db=db, user=user,
        captions=captions,
        media_urls=body.images,
        platform_filter=body.platforms,
        action=body.action,
        event_tag="product_listed",
    )

    return {
        "job_id": api_key.id,
        "store": api_key.name,
        "posts_created": len(results),
        "action": body.action,
        "results": results,
    }


# ── Sale endpoint (X-Api-Key auth) ────────────────────────────────────────────

@router.post("/sale", status_code=201)
def ingest_sale(
    body: SaleRequest,
    x_api_key: str = Header(..., alias="X-Api-Key"),
    db: Session = Depends(get_db),
):
    user, api_key = _resolve_api_key(x_api_key, db)

    # Deduplicate: same order_id should never generate two posts.
    # order_id is stored in platform_post_ids->_order_id at creation time.
    duplicate = db.query(Post).filter(
        Post.user_id == user.id,
        Post.content_type_tag == "product_sold",
        cast(Post.platform_post_ids["_order_id"], String) == f'"{body.order_id}"',
    ).first()
    if duplicate:
        raise HTTPException(
            status_code=409,
            detail=f"Order '{body.order_id}' has already been posted. Duplicate webhook ignored.",
        )

    template_key = pick_template(
        units_remaining=body.units_remaining,
        buyer_location=body.buyer_location,
        quantity_sold=body.quantity_sold,
        is_unique=body.is_unique,
        override=body.template,
    )

    client = _claude_client()
    attrs_str = ", ".join(f"{k}: {v}" for k, v in body.attributes.items()) if body.attributes else ""
    context = "\n".join(filter(None, [
        f"Product: {body.product_name}",
        f"Price: {body.currency} {body.price:,.2f}",
        f"Quantity sold: {body.quantity_sold}",
        f"Units remaining: {body.units_remaining}" if body.units_remaining is not None else None,
        f"One of a kind: {body.is_unique}",
        f"Buyer location: {body.buyer_location}" if body.buyer_location else None,
        f"Attributes: {attrs_str}" if attrs_str else None,
    ]))

    captions: dict[str, str] = {}
    if client:
        for platform in SUPPORTED_PLATFORMS:
            base_prompt = get_platform_prompt(template_key, platform)
            # Inject real values so the prompt is fully concrete
            prompt = (
                base_prompt
                .replace("{units_remaining}", str(body.units_remaining or ""))
                .replace("{product_name}", body.product_name)
                .replace("{price}", f"{body.currency} {body.price:,.2f}")
                .replace("{buyer_location}", body.buyer_location or "")
                .replace("{quantity_sold}", str(body.quantity_sold))
            )
            caption = _generate_caption(client, prompt, context)
            captions[platform] = caption or _fallback_sale(
                body.product_name, body.price, body.currency, template_key, platform, body.units_remaining
            )
    else:
        for platform in SUPPORTED_PLATFORMS:
            captions[platform] = _fallback_sale(
                body.product_name, body.price, body.currency, template_key, platform, body.units_remaining
            )

    results = _create_posts(
        db=db, user=user,
        captions=captions,
        media_urls=[body.image] if body.image else [],
        platform_filter=body.platforms,
        action=body.action,
        event_tag="product_sold",
        order_id=body.order_id,
    )

    return {
        "job_id": api_key.id,
        "store": api_key.name,
        "posts_created": len(results),
        "action": body.action,
        "template_used": template_key,
        "results": results,
    }
