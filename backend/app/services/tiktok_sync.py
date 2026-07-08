"""Sync TikTok account info (display name, open_id) from the TikTok Open API."""
import httpx
import logging
from datetime import datetime, timezone

log = logging.getLogger(__name__)

TIKTOK_API = "https://open.tiktokapis.com/v2"


def sync_tiktok_account(db, account) -> bool:
    """Fetch live profile info for one TikTok account and update the DB.

    Uses user.info.basic scope — returns open_id, display_name, avatar_url.
    Returns True if the sync succeeded.
    """
    if not account.access_token:
        return False

    try:
        with httpx.Client(timeout=15) as client:
            resp = client.get(
                f"{TIKTOK_API}/user/info/",
                params={"fields": "open_id,display_name,avatar_url"},
                headers={"Authorization": f"Bearer {account.access_token}"},
            )
            data = resp.json()
    except Exception as e:
        log.warning("TikTok sync failed for account %s: %s", account.id, e)
        return False

    if data.get("error", {}).get("code", "ok") != "ok":
        log.warning("TikTok API error for account %s: %s", account.id, data.get("error"))
        return False

    user = data.get("data", {}).get("user", {})
    open_id = user.get("open_id", "")
    display_name = user.get("display_name", "")
    avatar_url = user.get("avatar_url", "")

    # Use display_name if available, else fall back to open_id so it's never "pending"
    handle = display_name or open_id or account.handle
    if handle and handle != "pending":
        account.handle = handle
    if open_id and account.platform_user_id in ("", "pending"):
        account.platform_user_id = open_id
    if avatar_url:
        account.avatar_url = avatar_url

    account.last_synced_at = datetime.now(timezone.utc)
    db.commit()
    log.info("Synced TikTok %s: handle=%s", account.id, account.handle)
    return True
