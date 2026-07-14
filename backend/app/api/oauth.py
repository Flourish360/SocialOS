from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
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
            f"&redirect_uri={TWITTER_CALLBACK}"
            f"&scope=tweet.read+tweet.write+users.read+offline.access+media.write"
            f"&state={uid}&code_challenge=challenge&code_challenge_method=plain"
        ) if settings.TWITTER_CLIENT_ID else None,
        "linkedin": (
            f"https://www.linkedin.com/oauth/v2/authorization"
            f"?response_type=code&client_id={settings.LINKEDIN_CLIENT_ID}"
            f"&redirect_uri={LINKEDIN_CALLBACK}"
            f"&scope=openid+profile+email+w_member_social&state={uid}"
        ) if settings.LINKEDIN_CLIENT_ID else None,
        "tiktok": (
            f"https://www.tiktok.com/v2/auth/authorize"
            f"?client_key={settings.TIKTOK_CLIENT_ID}"
            f"&response_type=code&scope=user.info.basic,video.upload"
            f"&redirect_uri={TIKTOK_CALLBACK}&state={uid}"
        ) if settings.TIKTOK_CLIENT_ID else None,
        "facebook": (
            f"https://www.facebook.com/v21.0/dialog/oauth"
            f"?client_id={settings.META_APP_ID}"
            f"&redirect_uri={FACEBOOK_CALLBACK}"
            f"&scope=pages_manage_posts,pages_read_engagement,pages_show_list"
            f"&state={uid}&response_type=code"
        ) if settings.META_APP_ID else None,
    }
    url = urls.get(platform)
    if not url:
        raise HTTPException(400, f"Platform '{platform}' not configured or not supported")
    return {"url": url}


def _upsert_account(db: Session, user_id: str, platform: str, access_token: str,
                    refresh_token: str | None = None, handle: str = "", platform_user_id: str = "",
                    token_expires_at: datetime | None = None):
    is_new = False
    account = db.query(SocialAccount).filter(
        SocialAccount.user_id == user_id,
        SocialAccount.platform == platform,
    ).first()
    if not account:
        is_new = True
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
    if token_expires_at:
        account.token_expires_at = token_expires_at
    account.is_connected = True
    db.commit()
    if is_new:
        _seed_historical_data(db, account)
    return account


# ── Seeding ───────────────────────────────────────────────────────────────────

_HOURLY_BASE: dict[str, list[int]] = {
    "instagram": [8, 5, 3, 2, 2, 4, 10, 20, 32, 44, 54, 58, 52, 47, 50, 55, 58, 65, 70, 62, 50, 38, 26, 16],
    "facebook":  [6, 4, 2, 2, 2, 3, 8, 16, 26, 36, 44, 48, 50, 46, 43, 46, 50, 54, 56, 50, 40, 30, 20, 12],
    "twitter":   [10, 7, 4, 3, 3, 6, 16, 32, 46, 54, 50, 46, 44, 40, 38, 40, 44, 48, 50, 44, 36, 28, 20, 14],
    "linkedin":  [2, 1, 1, 1, 1, 2, 5, 14, 34, 48, 54, 50, 44, 36, 40, 44, 38, 28, 16, 9, 5, 3, 2, 1],
    "tiktok":    [14, 9, 6, 4, 3, 5, 9, 16, 24, 30, 34, 40, 42, 44, 48, 52, 56, 62, 70, 72, 64, 54, 38, 22],
}

_WEEKEND_MULT: dict[str, float] = {
    "instagram": 1.15, "tiktok": 1.20, "facebook": 1.05,
    "twitter": 0.85, "linkedin": 0.25,
}


def _seed_historical_data(db: Session, account: SocialAccount) -> None:
    """Seed 30 days of follower snapshots + 7 days of audience snapshots for a newly connected account."""
    import random
    from ..models.follower_snapshot import FollowerSnapshot
    from ..models.audience_snapshot import AudienceSnapshot

    # Guard: don't re-seed if data already exists
    if db.query(FollowerSnapshot).filter(
        FollowerSnapshot.user_id == account.user_id,
        FollowerSnapshot.platform == account.platform,
    ).first():
        return

    now = datetime.now(timezone.utc)
    base_followers = account.follower_count or 1000

    # 30 daily follower snapshots: smooth growth curve + noise
    for days_ago in range(30, 0, -1):
        fraction = (30 - days_ago) / 30
        count = max(0, round(base_followers * (0.82 + 0.18 * fraction) + random.randint(-30, 30)))
        snap = FollowerSnapshot(
            user_id=account.user_id,
            platform=account.platform,
            follower_count=count,
        )
        snap.captured_at = now - timedelta(days=days_ago)
        db.add(snap)

    # 7 audience snapshots (one per day_of_week) with realistic hourly patterns
    base = _HOURLY_BASE.get(account.platform, _HOURLY_BASE["instagram"])
    for dow in range(7):
        is_weekend = dow >= 5
        mult = _WEEKEND_MULT.get(account.platform, 1.0) if is_weekend else 1.0
        hourly = {
            str(h): max(1, round(val * mult * random.uniform(0.85, 1.15)))
            for h, val in enumerate(base)
        }
        snap_a = AudienceSnapshot(
            account_id=account.id,
            platform=account.platform,
            day_of_week=dow,
            hourly_counts=hourly,
        )
        snap_a.captured_at = now - timedelta(days=(7 - dow))
        db.add(snap_a)

    db.commit()


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

    expires_in = long_data.get("expires_in") if "access_token" in long_data else None
    ig_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in) if expires_in else None
    account = _upsert_account(
        db, state, "instagram",
        access_token=long_token,
        platform_user_id=user_id,
        token_expires_at=ig_expiry,
    )

    # Fetch real follower count right away so the dashboard shows live data
    from ..services.instagram_sync import sync_instagram_account
    sync_instagram_account(db, account)

    return RedirectResponse(_settings_redirect("instagram"))


# ── Twitter / X ───────────────────────────────────────────────────────────────

TWITTER_CALLBACK = "https://socialos-production-1712.up.railway.app/api/oauth/twitter/callback"


@router.get("/twitter")
def twitter_auth(current_user: User = Depends(get_current_user)):
    if not settings.TWITTER_CLIENT_ID:
        raise HTTPException(400, "TWITTER_CLIENT_ID not configured — add it to Railway variables")
    url = (
        f"https://twitter.com/i/oauth2/authorize"
        f"?response_type=code"
        f"&client_id={settings.TWITTER_CLIENT_ID}"
        f"&redirect_uri={TWITTER_CALLBACK}"
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
    redirect_uri = TWITTER_CALLBACK
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

LINKEDIN_CALLBACK = "https://socialos-production-1712.up.railway.app/api/oauth/linkedin/callback"


@router.get("/linkedin")
def linkedin_auth(current_user: User = Depends(get_current_user)):
    if not settings.LINKEDIN_CLIENT_ID:
        raise HTTPException(400, "LINKEDIN_CLIENT_ID not configured — add it to Railway variables")
    url = (
        f"https://www.linkedin.com/oauth/v2/authorization"
        f"?response_type=code"
        f"&client_id={settings.LINKEDIN_CLIENT_ID}"
        f"&redirect_uri={LINKEDIN_CALLBACK}"
        f"&scope=openid+profile+email+w_member_social"
        f"&state={current_user.id}"
    )
    return RedirectResponse(url)


@router.get("/linkedin/callback")
async def linkedin_callback(code: str, state: str = "", db: Session = Depends(get_db)):
    if not state or not settings.LINKEDIN_CLIENT_ID:
        return RedirectResponse(_error_redirect("oauth_failed"))

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": settings.LINKEDIN_CLIENT_ID,
                "client_secret": settings.LINKEDIN_CLIENT_SECRET,
                "redirect_uri": LINKEDIN_CALLBACK,
            },
        )
        data = resp.json()

    if "access_token" not in data:
        return RedirectResponse(_error_redirect("token_exchange_failed"))

    handle, platform_user_id = "", ""
    async with httpx.AsyncClient() as client:
        profile = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {data['access_token']}"},
        )
        p = profile.json()
        handle = p.get("name", "")
        platform_user_id = p.get("sub", "")

    # LinkedIn access tokens expire in 60 days
    token_expires_at = datetime.now(timezone.utc) + timedelta(days=60)
    _upsert_account(db, state, "linkedin", data["access_token"], data.get("refresh_token"),
                    handle, platform_user_id, token_expires_at=token_expires_at)
    return RedirectResponse(_settings_redirect("linkedin"))


# ── TikTok ────────────────────────────────────────────────────────────────────

TIKTOK_CALLBACK = "https://socialos-production-1712.up.railway.app/api/oauth/tiktok/callback"


@router.get("/tiktok")
def tiktok_auth(current_user: User = Depends(get_current_user)):
    if not settings.TIKTOK_CLIENT_ID:
        raise HTTPException(400, "TIKTOK_CLIENT_ID not configured — add it to Railway variables")
    url = (
        f"https://www.tiktok.com/v2/auth/authorize"
        f"?client_key={settings.TIKTOK_CLIENT_ID}"
        f"&response_type=code"
        f"&scope=user.info.basic,video.upload"
        f"&redirect_uri={TIKTOK_CALLBACK}"
        f"&state={current_user.id}"
    )
    return RedirectResponse(url)


@router.get("/tiktok/callback")
async def tiktok_callback(code: str, state: str = "", db: Session = Depends(get_db)):
    if not state or not settings.TIKTOK_CLIENT_ID:
        return RedirectResponse(_error_redirect("oauth_failed"))

    redirect_uri = TIKTOK_CALLBACK
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

    # Fetch TikTok display name / username
    handle = ""
    open_id = data.get("open_id", "")
    async with httpx.AsyncClient() as client:
        me = await client.get(
            "https://open.tiktokapis.com/v2/user/info/",
            params={"fields": "open_id,username,display_name"},
            headers={"Authorization": f"Bearer {data['access_token']}"},
        )
        user_data = me.json().get("data", {}).get("user", {})
        if not open_id:
            open_id = user_data.get("open_id", "")
        # display_name is available with user.info.basic; fall back to open_id so
        # the handle is never left as "pending" (sandbox accounts may have no display name)
        handle = user_data.get("display_name") or open_id or ""

    expires_in = int(data.get("expires_in", 86400))
    token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    _upsert_account(db, state, "tiktok", data["access_token"], data.get("refresh_token"),
                    handle=handle, platform_user_id=open_id, token_expires_at=token_expires_at)
    return RedirectResponse(_settings_redirect("tiktok"))


# ── Facebook ──────────────────────────────────────────────────────────────────

FACEBOOK_CALLBACK = "https://socialos-production-1712.up.railway.app/api/oauth/facebook/callback"
FB_GRAPH = "https://graph.facebook.com/v21.0"


@router.get("/facebook")
def facebook_auth(current_user: User = Depends(get_current_user)):
    if not settings.META_APP_ID:
        raise HTTPException(400, "META_APP_ID not configured — add it to Railway variables")
    url = (
        f"https://www.facebook.com/v21.0/dialog/oauth"
        f"?client_id={settings.META_APP_ID}"
        f"&redirect_uri={FACEBOOK_CALLBACK}"
        f"&scope=pages_manage_posts,pages_read_engagement,pages_show_list"
        f"&state={current_user.id}"
        f"&response_type=code"
    )
    return {"url": url}


@router.get("/facebook/callback")
async def facebook_callback(code: str, state: str = "", db: Session = Depends(get_db)):
    if not state or not settings.META_APP_ID:
        return RedirectResponse(_error_redirect("oauth_failed"))

    async with httpx.AsyncClient() as client:
        # Exchange code for short-lived user token
        token_resp = await client.get(
            f"{FB_GRAPH}/oauth/access_token",
            params={
                "client_id": settings.META_APP_ID,
                "client_secret": settings.META_APP_SECRET,
                "redirect_uri": FACEBOOK_CALLBACK,
                "code": code,
            },
        )
        token_data = token_resp.json()

    if "access_token" not in token_data:
        return RedirectResponse(_error_redirect("token_exchange_failed"))

    short_token = token_data["access_token"]

    # Exchange for long-lived user token (~60 days)
    async with httpx.AsyncClient() as client:
        long_resp = await client.get(
            f"{FB_GRAPH}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": settings.META_APP_ID,
                "client_secret": settings.META_APP_SECRET,
                "fb_exchange_token": short_token,
            },
        )
        long_data = long_resp.json()
        long_token = long_data.get("access_token", short_token)

    # Get the user's Facebook Pages — we publish to the first Page found.
    # Page tokens from /me/accounts are permanent (never expire).
    async with httpx.AsyncClient() as client:
        pages_resp = await client.get(
            f"{FB_GRAPH}/me/accounts",
            params={"access_token": long_token, "fields": "id,name,access_token"},
        )
        pages_data = pages_resp.json()

    pages = pages_data.get("data") or []
    if not pages:
        # No pages — fall back to connecting the personal profile (limited publishing)
        async with httpx.AsyncClient() as client:
            me_resp = await client.get(
                f"{FB_GRAPH}/me",
                params={"access_token": long_token, "fields": "id,name"},
            )
            me = me_resp.json()
        page_id = me.get("id", "")
        page_name = me.get("name", "Facebook Profile")
        page_token = long_token
    else:
        page = pages[0]
        page_id = page["id"]
        page_name = page.get("name", "Facebook Page")
        page_token = page.get("access_token", long_token)

    _upsert_account(
        db, state, "facebook",
        access_token=page_token,
        platform_user_id=page_id,
        handle=page_name,
    )
    return RedirectResponse(_settings_redirect("facebook"))
