from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..api.deps import get_current_user
from ..db.database import get_db
from ..models.user import User
from ..models.social_account import SocialAccount
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

    # Auto-sync any Instagram account that has never been synced before
    from ..services.instagram_sync import sync_instagram_account
    for a in accounts:
        if a.platform == "instagram" and a.last_synced_at is None:
            sync_instagram_account(db, a)

    return [_serialize(a) for a in accounts]


@router.post("/sync")
def sync_accounts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Force-refresh cached stats for all connected Instagram accounts."""
    from ..services.instagram_sync import sync_instagram_account
    accounts = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.is_connected == True,
        SocialAccount.platform == "instagram",
    ).all()
    synced = 0
    for a in accounts:
        if sync_instagram_account(db, a):
            synced += 1
    return {"synced": synced, "accounts": [_serialize(a) for a in accounts]}


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
