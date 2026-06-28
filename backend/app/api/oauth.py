from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import httpx, uuid, base64

from ..api.deps import get_current_user
from ..db.database import get_db
from ..models.user import User
from ..models.social_account import SocialAccount
from ..core.config import settings

router = APIRouter(prefix="/oauth", tags=["oauth"])


def _settings_redirect(platform: str):
    return f"{settings.FRONTEND_URL}/settings?connected={platform}"


def _error_redirect(msg: str):
    return f"{settings.FRONTEND_URL}/settings?error={msg}"


@router.get("/{platform}/url")
def get_oauth_url(platform: str, current_user: User = Depends(get_current_user)):
    """Return the OAuth authorization URL for the given platform as JSON."""
    uid = current_user.id
    urls = {
        "instagram": (
            f"https://api.instagram.com/oauth/authorize"
            f"?client_id={settings.INSTAGRAM_CLIENT_ID}"
            f"&redirect_uri={INSTAGRAM_CALLBACK}"
            f"&scope=instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments"
            f"&response_type=code&state={uid}"
        ) if settings.INSTAGRAM_CLIENT_ID else None,
        "twitter": (
            f"https://twitter.com/i/oauth2/authorize"
            f"?response_type=code&client_id={settings.TWITTER_CLIENT_ID}"
            f"&redirect_uri={settings.FRONTEND_URL}/api/oauth/twitter/callback"
            f"&scope=tweet.read+tweet.write+users.read+offline.access+media.write"
            f"&state={uid}&code_challenge=challenge&code_challenge_method=plain"
        ) if settings.TWITTER_CLIENT_ID else None,
        "linkedin": (
            f"https://www.linkedin.com/oauth/v2/authorization"
            f"?response_type=code&client_id={settings.LINKEDIN_CLIENT_ID}"
            f"&redirect_uri={settings.FRONTEND_URL}/api/oauth/linkedin/callback"
            f"&scope=openid+profile+email+w_member_social&state={uid}"
        ) if settings.LINKEDIN_CLIENT_ID else None,
        "tiktok": (
            f"https://www.tiktok.com/v2/auth/authorize"
            f"?client_key={settings.TIKTOK_CLIENT_ID}"
            f"&response_type=code&scope=user.info.basic,video.publish"
            f"&redirect_uri={settings.FRONTEND_URL}/api/oauth/tiktok/callback&state={uid}"
        ) if settings.TIKTOK_CLIENT_ID else None,
    }
    url = urls.get(platform)
    if not url:
        raise HTTPException(400, f"Platform '{platform}' not configured or not supported")
    return {"url": url}


def _upsert_account(db: Session, user_id: str, platform: str, access_token: str,
                    refresh_token: str | None = None, handle: str = "", platform_user_id: str = ""):
    account = db.query(SocialAccount).filter(
        SocialAccount.user_id == user_id,
        SocialAccount.platform == platform,
    ).first()
    if not account:
        account = SocialAccount(
            id=str(uuid.uuid4()),
            user_id=user_id,
            platform=platform,
            platform_user_id=platform_user_id or "pending",
            handle=handle or "pending",
        )
        db.add(account)
    account.access_token = access_token
    account.refresh_token = refresh_token
    if handle:
        account.handle = handle
    if platform_user_id:
        account.platform_user_id = platform_user_id
    account.is_connected = True
    db.commit()
    return account


# ── Instagram (Meta) ──────────────────────────────────────────────────────────

INSTAGRAM_CALLBACK = "https://socialos-production-1712.up.railway.app/api/oauth/instagram/callback"


@router.get("/instagram")
def instagram_auth(current_user: User = Depends(get_current_user)):
    if not settings.INSTAGRAM_CLIENT_ID:
        raise HTTPException(400, "INSTAGRAM_CLIENT_ID not configured — add it to Railway variables")
    url = (
        f"https://api.instagram.com/oauth/authorize"
        f"?client_id={settings.INSTAGRAM_CLIENT_ID}"
        f"&redirect_uri={INSTAGRAM_CALLBACK}"
        f"&scope=instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments"
        f"&response_type=code"
        f"&state={current_user.id}"
    )
    return RedirectResponse(url)


@router.get("/instagram/callback")
async def instagram_callback(code: str, state: str = "", db: Session = Depends(get_db)):
    if not state or not settings.INSTAGRAM_CLIENT_ID:
        return RedirectResponse(_error_redirect("oauth_failed"))

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.instagram.com/oauth/access_token",
            data={
                "client_id": settings.INSTAGRAM_CLIENT_ID,
                "client_secret": settings.INSTAGRAM_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "redirect_uri": INSTAGRAM_CALLBACK,
                "code": code,
            },
        )
        data = resp.json()

    if "access_token" not in data:
        return RedirectResponse(_error_redirect("token_exchange_failed"))

    short_token = data["access_token"]
    user_id = str(data.get("user_id", ""))

    # Exchange short-lived (1h) token for long-lived (60 days) token
    long_token = short_token
    async with httpx.AsyncClient() as client:
        long_resp = await client.get(
            "https://graph.instagram.com/access_token",
            params={
                "grant_type": "ig_exchange_token",
                "client_secret": settings.INSTAGRAM_CLIENT_SECRET,
                "access_token": short_token,
            },
        )
        long_data = long_resp.json()
        if "access_token" in long_data:
            long_token = long_data["access_token"]

    account = _upsert_account(
        db, state, "instagram",
        access_token=long_token,
        platform_user_id=user_id,
    )

    # Fetch real follower count right away so the dashboard shows live data
    from ..services.instagram_sync import sync_instagram_account
    sync_instagram_account(db, account)

    return RedirectResponse(_settings_redirect("instagram"))


# ── Twitter / X ───────────────────────────────────────────────────────────────

@router.get("/twitter")
def twitter_auth(current_user: User = Depends(get_current_user)):
    if not settings.TWITTER_CLIENT_ID:
        raise HTTPException(400, "TWITTER_CLIENT_ID not configured — add it to backend/.env")
    redirect_uri = f"{settings.FRONTEND_URL}/api/oauth/twitter/callback"
    url = (
        f"https://twitter.com/i/oauth2/authorize"
        f"?response_type=code"
        f"&client_id={settings.TWITTER_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=tweet.read+tweet.write+users.read+offline.access+media.write"
        f"&state={current_user.id}"
        f"&code_challenge=challenge&code_challenge_method=plain"
    )
    return RedirectResponse(url)


@router.get("/twitter/callback")
async def twitter_callback(code: str, state: str = "", db: Session = Depends(get_db)):
    if not state or not settings.TWITTER_CLIENT_ID:
        return RedirectResponse(_error_redirect("oauth_failed"))

    creds = base64.b64encode(
        f"{settings.TWITTER_CLIENT_ID}:{settings.TWITTER_CLIENT_SECRET}".encode()
    ).decode()
    redirect_uri = f"{settings.FRONTEND_URL}/api/oauth/twitter/callback"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.twitter.com/2/oauth2/token",
            headers={"Authorization": f"Basic {creds}", "Content-Type": "application/x-www-form-urlencoded"},
            data={"code": code, "grant_type": "authorization_code", "redirect_uri": redirect_uri, "code_verifier": "challenge"},
        )
        data = resp.json()

    if "access_token" not in data:
        return RedirectResponse(_error_redirect("token_exchange_failed"))

    # Fetch Twitter username
    handle = ""
    async with httpx.AsyncClient() as client:
        me = await client.get(
            "https://api.twitter.com/2/users/me",
            headers={"Authorization": f"Bearer {data['access_token']}"},
        )
        me_data = me.json().get("data", {})
        handle = me_data.get("username", "")
        platform_user_id = me_data.get("id", "")

    _upsert_account(db, state, "twitter", data["access_token"], data.get("refresh_token"), handle, platform_user_id)
    return RedirectResponse(_settings_redirect("twitter"))


# ── LinkedIn ──────────────────────────────────────────────────────────────────

@router.get("/linkedin")
def linkedin_auth(current_user: User = Depends(get_current_user)):
    if not settings.LINKEDIN_CLIENT_ID:
        raise HTTPException(400, "LINKEDIN_CLIENT_ID not configured — add it to backend/.env")
    redirect_uri = f"{settings.FRONTEND_URL}/api/oauth/linkedin/callback"
    url = (
        f"https://www.linkedin.com/oauth/v2/authorization"
        f"?response_type=code"
        f"&client_id={settings.LINKEDIN_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=openid+profile+email+w_member_social"
        f"&state={current_user.id}"
    )
    return RedirectResponse(url)


@router.get("/linkedin/callback")
async def linkedin_callback(code: str, state: str = "", db: Session = Depends(get_db)):
    if not state or not settings.LINKEDIN_CLIENT_ID:
        return RedirectResponse(_error_redirect("oauth_failed"))

    redirect_uri = f"{settings.FRONTEND_URL}/api/oauth/linkedin/callback"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": settings.LINKEDIN_CLIENT_ID,
                "client_secret": settings.LINKEDIN_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
            },
        )
        data = resp.json()

    if "access_token" not in data:
        return RedirectResponse(_error_redirect("token_exchange_failed"))

    # Fetch LinkedIn profile
    handle, platform_user_id = "", ""
    async with httpx.AsyncClient() as client:
        profile = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {data['access_token']}"},
        )
        p = profile.json()
        handle = p.get("name", "")
        platform_user_id = p.get("sub", "")

    _upsert_account(db, state, "linkedin", data["access_token"], None, handle, platform_user_id)
    return RedirectResponse(_settings_redirect("linkedin"))


# ── TikTok ────────────────────────────────────────────────────────────────────

@router.get("/tiktok")
def tiktok_auth(current_user: User = Depends(get_current_user)):
    if not settings.TIKTOK_CLIENT_ID:
        raise HTTPException(400, "TIKTOK_CLIENT_ID not configured — add it to backend/.env")
    redirect_uri = f"{settings.FRONTEND_URL}/api/oauth/tiktok/callback"
    url = (
        f"https://www.tiktok.com/v2/auth/authorize"
        f"?client_key={settings.TIKTOK_CLIENT_ID}"
        f"&response_type=code"
        f"&scope=user.info.basic,video.publish"
        f"&redirect_uri={redirect_uri}"
        f"&state={current_user.id}"
    )
    return RedirectResponse(url)


@router.get("/tiktok/callback")
async def tiktok_callback(code: str, state: str = "", db: Session = Depends(get_db)):
    if not state or not settings.TIKTOK_CLIENT_ID:
        return RedirectResponse(_error_redirect("oauth_failed"))

    redirect_uri = f"{settings.FRONTEND_URL}/api/oauth/tiktok/callback"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://open.tiktokapis.com/v2/oauth/token/",
            data={
                "client_key": settings.TIKTOK_CLIENT_ID,
                "client_secret": settings.TIKTOK_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
        )
        data = resp.json()

    if "access_token" not in data:
        return RedirectResponse(_error_redirect("token_exchange_failed"))

    _upsert_account(db, state, "tiktok", data["access_token"], data.get("refresh_token"),
                    platform_user_id=data.get("open_id", ""))
    return RedirectResponse(_settings_redirect("tiktok"))
