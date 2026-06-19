from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..api.deps import get_current_user
from ..db.database import get_db
from ..models.user import User
from ..models.social_account import SocialAccount
from ..mock.data import MOCK_ACCOUNTS
from ..core.config import settings

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("")
def list_accounts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if settings.USE_MOCK_DATA:
        return MOCK_ACCOUNTS
    accounts = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.is_connected == True,
    ).all()
    return [
        {
            "id": a.id,
            "platform": a.platform,
            "handle": a.handle,
            "platform_user_id": a.platform_user_id,
            "is_connected": a.is_connected,
        }
        for a in accounts
    ]


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
