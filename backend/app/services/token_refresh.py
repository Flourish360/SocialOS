"""Token refresh helpers for platforms with short-lived access tokens."""
import httpx
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from ..core.config import settings

log = logging.getLogger(__name__)


def refresh_tiktok_token(account, db: Session) -> bool:
    """Exchange TikTok refresh token for a new access token.

    TikTok access tokens expire after 24 hours; refresh tokens are valid 365 days.
    Updates account.access_token, refresh_token, and token_expires_at in-place and commits.
    Returns True on success.
    """
    if not account.refresh_token:
        log.warning("TikTok account %s has no refresh token — user must reconnect", account.id)
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
        still_valid = account.token_expires_at > now + timedelta(minutes=5)
        if still_valid:
            return True
        log.info("TikTok token for account %s is expired or expiring soon — refreshing", account.id)
    else:
        # No expiry stored yet (account connected before we tracked this).
        # Attempt a refresh; if it fails we'll learn from the publish error.
        log.info("TikTok account %s has no token_expires_at — attempting proactive refresh", account.id)

    return refresh_tiktok_token(account, db)
