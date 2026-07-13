import random
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..api.deps import get_current_user
from ..db.database import get_db
from ..models.user import User
from ..models.automation_rule import AutomationRule
from ..models.competitor import Competitor
from ..models.post import Post
from ..models.social_account import SocialAccount
from ..mock.data import MOCK_AUTOMATIONS, MOCK_INBOX, MOCK_COMPETITORS
from ..core.config import settings

router = APIRouter(prefix="/automation", tags=["automation"])


# ── Automation rules ───────────────────────────────────────────────────────────

@router.get("/rules")
def list_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.USE_MOCK_DATA:
        return MOCK_AUTOMATIONS
    rules = db.query(AutomationRule).filter(
        AutomationRule.user_id == current_user.id,
    ).order_by(AutomationRule.created_at.desc()).all()
    return [_rule_dict(r) for r in rules]


@router.post("/rules", status_code=201)
def create_rule(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.USE_MOCK_DATA:
        rule = {"id": f"auto-{len(MOCK_AUTOMATIONS)+1}", "run_count": 0, "last_run": None, **body}
        MOCK_AUTOMATIONS.append(rule)
        return rule
    rule = AutomationRule(
        user_id=current_user.id,
        name=body.get("name", "Untitled Rule"),
        trigger_type=body.get("trigger_type", "post_likes"),
        action_type=body.get("action_type", "notify"),
        description=body.get("description"),
        is_active=body.get("is_active", True),
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return _rule_dict(rule)


@router.patch("/rules/{rule_id}/toggle")
def toggle_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.USE_MOCK_DATA:
        for rule in MOCK_AUTOMATIONS:
            if rule["id"] == rule_id:
                rule["is_active"] = not rule["is_active"]
                return rule
        return {"error": "not found"}
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.user_id == current_user.id,
    ).first()
    if not rule:
        raise HTTPException(404, "Rule not found")
    rule.is_active = not rule.is_active
    db.commit()
    return _rule_dict(rule)


@router.delete("/rules/{rule_id}", status_code=204)
def delete_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.user_id == current_user.id,
    ).first()
    if rule:
        db.delete(rule)
        db.commit()


# ── Unified inbox ──────────────────────────────────────────────────────────────

@router.get("/inbox")
def unified_inbox(
    priority: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.USE_MOCK_DATA:
        msgs = MOCK_INBOX
        if priority:
            msgs = [m for m in msgs if m["priority"] == priority]
        return msgs

    messages = _fetch_instagram_comments(db, current_user.id)
    if priority:
        messages = [m for m in messages if m["priority"] == priority]
    return messages


@router.post("/inbox/{message_id}/reply")
def reply_to_message(
    message_id: str,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    text = (body.get("text") or "").strip()
    if text:
        account = db.query(SocialAccount).filter(
            SocialAccount.user_id == current_user.id,
            SocialAccount.platform == "instagram",
            SocialAccount.is_connected == True,
        ).first()
        if account and account.access_token:
            import httpx as _httpx
            import logging as _logging
            _log = _logging.getLogger(__name__)
            try:
                with _httpx.Client(timeout=15) as client:
                    resp = client.post(
                        f"https://graph.instagram.com/v21.0/{message_id}/replies",
                        params={"message": text, "access_token": account.access_token},
                    )
                if resp.status_code not in (200, 201):
                    _log.warning("Instagram reply HTTP %s: %s", resp.status_code, resp.text[:200])
            except Exception as e:
                _log.warning("Instagram reply request failed: %s", e)
    return {"status": "sent", "message_id": message_id, "reply": text}


# ── Competitors ────────────────────────────────────────────────────────────────

@router.get("/competitors")
def list_competitors(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.USE_MOCK_DATA:
        return MOCK_COMPETITORS
    comps = db.query(Competitor).filter(
        Competitor.user_id == current_user.id,
    ).order_by(Competitor.created_at.desc()).all()
    return [_comp_dict(c) for c in comps]


@router.post("/competitors", status_code=201)
def add_competitor(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    name = (body.get("name") or "").strip()
    handle = (body.get("handle") or "").strip()
    if not name or not handle:
        raise HTTPException(400, "name and handle are required")
    if not handle.startswith("@"):
        handle = f"@{handle}"
    comp = Competitor(
        user_id=current_user.id,
        name=name,
        handle=handle,
        platform=body.get("platform", "instagram"),
        # Seed with realistic placeholder stats — real follower data requires
        # scraping or a paid data provider.
        followers=random.randint(5_000, 500_000),
        follower_growth_pct=round(random.uniform(-2.0, 12.0), 1),
        posts_per_week=round(random.uniform(1.0, 14.0), 1),
        avg_engagement=round(random.uniform(1.0, 6.0), 1),
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return _comp_dict(comp)


@router.delete("/competitors/{comp_id}", status_code=204)
def delete_competitor(
    comp_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comp = db.query(Competitor).filter(
        Competitor.id == comp_id,
        Competitor.user_id == current_user.id,
    ).first()
    if comp:
        db.delete(comp)
        db.commit()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _rule_dict(rule: AutomationRule) -> dict:
    return {
        "id": rule.id,
        "name": rule.name,
        "trigger_type": rule.trigger_type,
        "action_type": rule.action_type,
        "description": rule.description,
        "is_active": rule.is_active,
        "run_count": rule.run_count,
        "last_run": rule.last_run.isoformat() if rule.last_run else None,
    }


def _comp_dict(comp: Competitor) -> dict:
    return {
        "id": comp.id,
        "name": comp.name,
        "handle": comp.handle,
        "platform": comp.platform,
        "followers": comp.followers,
        "follower_growth_pct": str(comp.follower_growth_pct),
        "posts_per_week": comp.posts_per_week,
        "avg_engagement": str(comp.avg_engagement),
    }


_URGENT = {"help", "problem", "issue", "broken", "error", "fail", "wrong", "fix",
           "asap", "urgent", "emergency", "cant", "not working", "scam", "refund"}
_OPPORTUNITY = {"collab", "collaboration", "partner", "sponsor", "deal", "business",
                "how much", "price", "buy", "purchase", "interested", "dm me", "quote"}
_SPAM = {"follow for follow", "f4f", "check my", "visit my", "free followers",
         "dm for promo", "sub4sub", "like for like", "click link"}


def _classify(text: str) -> str:
    lower = text.lower()
    for kw in _SPAM:
        if kw in lower:
            return "spam"
    for kw in _URGENT:
        if kw in lower:
            return "urgent"
    for kw in _OPPORTUNITY:
        if kw in lower:
            return "opportunity"
    return "general"


def _rel_time(ts: str) -> str:
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        delta = datetime.now(timezone.utc) - dt
        if delta.total_seconds() < 3600:
            return f"{max(1, int(delta.total_seconds() // 60))}m ago"
        if delta.total_seconds() < 86400:
            return f"{int(delta.total_seconds() // 3600)}h ago"
        return f"{int(delta.days)}d ago"
    except Exception:
        return "recently"


def _fetch_instagram_comments(db: Session, user_id: str) -> list[dict]:
    """Pull comments from the user's most recent Instagram posts via Graph API."""
    from ..services.instagram_sync import fetch_instagram_comments

    account = db.query(SocialAccount).filter(
        SocialAccount.user_id == user_id,
        SocialAccount.platform == "instagram",
        SocialAccount.is_connected == True,
    ).first()
    if not account or not account.access_token:
        return []

    posts = db.query(Post).filter(
        Post.user_id == user_id,
        Post.status == "published",
        Post.platform_post_ids.isnot(None),
    ).order_by(Post.published_at.desc()).limit(10).all()

    messages: list[dict] = []
    for post in posts:
        ig_media_id = (post.platform_post_ids or {}).get("instagram")
        if not ig_media_id:
            continue
        for c in fetch_instagram_comments(account.access_token, ig_media_id, limit=20):
            messages.append({
                "id": c["id"],
                "platform": "instagram",
                "sender": c.get("username", "unknown"),
                "message": c.get("text", ""),
                "time": _rel_time(c.get("timestamp", "")),
                "type": "comment",
                "priority": _classify(c.get("text", "")),
                "replied": False,
            })

    return messages
