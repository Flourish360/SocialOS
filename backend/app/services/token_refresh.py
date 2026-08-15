"""Token refresh helpers for platforms with short-lived access tokens."""
import base64
import httpx
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from ..core.config import settings

log = logging.getLogger(__name__)


def _as_aware_utc(dt: datetime) -> datetime:
    """SQLite round-trips DateTime(timezone=True) columns as naive even when
    stored tz-aware (Postgres preserves it correctly via TIMESTAMPTZ), so
    normalize before any comparison against a tz-aware "now"."""
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def refresh_tiktok_token(account, db: Session) -> bool:
    """Exchange TikTok refresh token for a new access token.

    TikTok access tokens expire after 24 hours; refresh tokens are valid 365 days.
    Updates account.access_token, refresh_token, and token_expires_at in-place and commits.
    Returns True on success.
    """
    if not account.refresh_token:
        log.warning("TikTok account %s has no refresh token, user must reconnect", account.id)
        return False

    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post(
                "https://open.tiktokapis.com/v2/oauth/token/",
                data={
                    "client_key": settings.TIKTOK_CLIENT_ID,
                    "client_secret": settings.TIKTOK_CLIENT_SECRET,
                    "grant_type": "refresh_token",
                    "refresh_token": account.refresh_token,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            data = resp.json()
    except Exception as e:
        log.warning("TikTok token refresh request failed for account %s: %s", account.id, e)
        return False

    if "access_token" not in data:
        log.warning("TikTok token refresh returned no access_token for account %s: %s", account.id, data)
        return False

    account.access_token = data["access_token"]
    if data.get("refresh_token"):
        account.refresh_token = data["refresh_token"]
    expires_in = int(data.get("expires_in", 86400))
    account.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    db.commit()
    log.info("Refreshed TikTok token for account %s (expires in %ds)", account.id, expires_in)
    return True


def ensure_tiktok_token(account, db: Session) -> bool:
    """Return True if the account has a usable TikTok token, refreshing if needed.

    Refreshes proactively when the token is within 5 minutes of expiry, or has
    already expired, so there's no window where a publish attempt gets a stale token.
    Returns False if the token cannot be refreshed (user must reconnect).
    """
    now = datetime.now(timezone.utc)
    if account.token_expires_at:
        still_valid = _as_aware_utc(account.token_expires_at) > now + timedelta(minutes=5)
        if still_valid:
            return True
        log.info("TikTok token for account %s is expired or expiring soon, refreshing", account.id)
    else:
        # No expiry stored yet (account connected before we tracked this).
        # Attempt a refresh; if it fails we'll learn from the publish error.
        log.info("TikTok account %s has no token_expires_at, attempting proactive refresh", account.id)

    return refresh_tiktok_token(account, db)


def refresh_twitter_token(account, db: Session) -> bool:
    """Exchange a Twitter/X refresh token for a new access token.

    X's OAuth 2.0 user-context access tokens expire in ~2 hours (expires_in in
    the token response, typically 7200s); refresh tokens rotate on each use.
    Updates account.access_token, refresh_token, and token_expires_at in-place
    and commits. Returns True on success.
    """
    if not account.refresh_token:
        log.warning("Twitter account %s has no refresh token, user must reconnect", account.id)
        return False

    creds = base64.b64encode(
        f"{settings.TWITTER_CLIENT_ID}:{settings.TWITTER_CLIENT_SECRET}".encode()
    ).decode()

    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post(
                "https://api.twitter.com/2/oauth2/token",
                headers={"Authorization": f"Basic {creds}", "Content-Type": "application/x-www-form-urlencoded"},
                data={"grant_type": "refresh_token", "refresh_token": account.refresh_token},
            )
            data = resp.json()
    except Exception as e:
        log.warning("Twitter token refresh request failed for account %s: %s", account.id, e)
        return False

    if "access_token" not in data:
        log.warning("Twitter token refresh returned no access_token for account %s: %s", account.id, data)
        return False

    account.access_token = data["access_token"]
    if data.get("refresh_token"):
        account.refresh_token = data["refresh_token"]
    expires_in = int(data.get("expires_in", 7200))
    account.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    db.commit()
    log.info("Refreshed Twitter token for account %s (expires in %ds)", account.id, expires_in)
    return True


def ensure_twitter_token(account, db: Session) -> bool:
    """Return True if the account has a usable Twitter/X token, refreshing if needed.

    Same proactive-refresh shape as ensure_tiktok_token: refresh when within 5
    minutes of expiry, or immediately if no expiry was ever recorded (every
    account connected before this fix has token_expires_at = None, since the
    OAuth callback never captured expires_in until now).
    """
    now = datetime.now(timezone.utc)
    if account.token_expires_at:
        still_valid = _as_aware_utc(account.token_expires_at) > now + timedelta(minutes=5)
        if still_valid:
            return True
        log.info("Twitter token for account %s is expired or expiring soon, refreshing", account.id)
    else:
        log.info("Twitter account %s has no token_expires_at, attempting proactive refresh", account.id)

    return refresh_twitter_token(account, db)
