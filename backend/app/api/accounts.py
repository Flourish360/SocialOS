from fastapi import APIRouter, Depends, HTTPException
import httpx
from sqlalchemy.orm import Session

from ..api.deps import get_current_user
from ..db.database import get_db
from ..models.user import User
from ..models.social_account import SocialAccount
from ..services.instagram_sync import sync_instagram_account
from ..mock.data import MOCK_ACCOUNTS
from ..core.config import settings

router = APIRouter(prefix="/accounts", tags=["accounts"])


def _serialize(a: SocialAccount) -> dict:
    return {
        "id": a.id,
        "platform": a.platform,
        "handle": a.handle,
        "platform_user_id": a.platform_user_id,
        "is_connected": a.is_connected,
        "follower_count": a.follower_count or 0,
        "following_count": a.following_count or 0,
        "post_count": a.post_count or 0,
        "avg_engagement_rate": a.avg_engagement_rate or 0.0,
        "health_score": a.health_score or 100.0,
        "last_synced_at": a.last_synced_at.isoformat() if a.last_synced_at else None,
    }


@router.get("")
def list_accounts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if settings.USE_MOCK_DATA:
        return MOCK_ACCOUNTS
    accounts = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.is_connected == True,
    ).all()
    for a in accounts:
        if a.platform == "instagram" and a.last_synced_at is None:
            sync_instagram_account(db, a)
    return [_serialize(a) for a in accounts]


@router.post("/sync-stats")
def sync_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Force-refresh cached Instagram stats from the Graph API."""
    accounts = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.is_connected == True,
        SocialAccount.platform == "instagram",
    ).all()
    if not accounts:
        raise HTTPException(status_code=400, detail="No Instagram account connected")
    errors = []
    synced = 0
    for a in accounts:
        ok = sync_instagram_account(db, a)
        if ok:
            synced += 1
        else:
            errors.append(f"handle={a.handle} user_id={a.platform_user_id}")
    if synced == 0:
        detail = "Instagram sync failed"
        if errors:
            detail += f": {'; '.join(errors)}"
        raise HTTPException(status_code=502, detail=detail)
    return {"synced": synced, "accounts": [_serialize(a) for a in accounts]}


@router.get("/debug-instagram")
def debug_instagram(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return DB state + raw Instagram API response to diagnose sync issues."""
    account = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.platform == "instagram",
        SocialAccount.is_connected == True,
    ).first()
    if not account:
        return {"error": "No Instagram account found in DB"}
    info = {
        "platform_user_id": account.platform_user_id,
        "handle": account.handle,
        "follower_count": account.follower_count,
        "last_synced_at": account.last_synced_at.isoformat() if account.last_synced_at else None,
        "has_token": bool(account.access_token),
        "token_length": len(account.access_token or ""),
    }
    if account.access_token and account.platform_user_id:
        try:
            with httpx.Client(timeout=15) as client:
                resp = client.get(
                    f"https://graph.instagram.com/v21.0/{account.platform_user_id}",
                    params={"fields": "username,followers_count,media_count", "access_token": account.access_token},
                )
                info["api_status"] = resp.status_code
                info["api_response"] = resp.json()
        except Exception as e:
            info["api_error"] = str(e)
    return info


@router.delete("/{account_id}")
def disconnect_account(account_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not settings.USE_MOCK_DATA:
        account = db.query(SocialAccount).filter(
            SocialAccount.id == account_id,
            SocialAccount.user_id == current_user.id,
        ).first()
        if account:
            account.is_connected = False
            db.commit()
    return {"message": "Account disconnected", "account_id": account_id}
