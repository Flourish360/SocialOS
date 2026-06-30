"""Sync Instagram account stats (followers, media count, handle) from the Graph API."""
import httpx
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

log = logging.getLogger(__name__)

IG_API = "https://graph.instagram.com/v21.0"


def sync_instagram_account(db: Session, account) -> bool:
    """Fetch live profile data for one Instagram account and cache it in the DB.

    Returns True if the sync succeeded.
    """
    if not account.access_token or not account.platform_user_id:
        return False

    try:
        with httpx.Client(timeout=15) as client:
            resp = client.get(
                f"{IG_API}/{account.platform_user_id}",
                params={
                    "fields": "username,followers_count,follows_count,media_count,biography",
                    "access_token": account.access_token,
                },
            )
            data = resp.json()
    except Exception as e:
        log.warning("Instagram sync failed for account %s: %s", account.id, e)
        return False

    if "error" in data:
        log.warning("Instagram API error for %s: %s", account.id, data["error"].get("message"))
        return False

    if "username" in data:
        account.handle = f"@{data['username']}"
    if "followers_count" in data:
        account.follower_count = data["followers_count"]
    if "follows_count" in data:
        account.following_count = data["follows_count"]
    if "media_count" in data:
        account.post_count = data["media_count"]

    account.last_synced_at = datetime.now(timezone.utc)
    db.commit()
    log.info("Synced Instagram %s: %d followers", account.handle, account.follower_count or 0)
    return True


def fetch_online_followers(access_token: str, ig_user_id: str) -> dict[str, int] | None:
    """Fetch Instagram's `online_followers` insight — real hourly breakdown of how many
    of this account's followers were online today, keyed by hour-of-day (0-23, UTC).

    Requires a Business/Creator account with at least 100 followers (Meta's minimum
    for audience insights). Returns None if unavailable.
    """
    try:
        with httpx.Client(timeout=15) as client:
            resp = client.get(
                f"{IG_API}/{ig_user_id}/insights",
                params={"metric": "online_followers", "period": "lifetime", "access_token": access_token},
            )
            data = resp.json()
    except Exception as e:
        log.warning("Instagram online_followers fetch failed for %s: %s", ig_user_id, e)
        return None

    values = (data.get("data") or [{}])[0].get("values") if data.get("data") else None
    if not values:
        return None

    latest = values[-1].get("value") or {}
    if not latest:
        return None
    return {str(h): int(latest.get(str(h), 0)) for h in range(24)}
