from fastapi import APIRouter, Depends
from ..api.deps import get_current_user
from ..models.user import User
from ..mock.data import MOCK_ACCOUNTS
from ..core.config import settings

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("")
def list_accounts(current_user: User = Depends(get_current_user)):
    if settings.USE_MOCK_DATA:
        return MOCK_ACCOUNTS
    # TODO: query db for real connected accounts
    return []


@router.delete("/{account_id}")
def disconnect_account(account_id: str, current_user: User = Depends(get_current_user)):
    return {"message": "Account disconnected", "account_id": account_id}


@router.get("/oauth/{platform}/url")
def get_oauth_url(platform: str, current_user: User = Depends(get_current_user)):
    """
    Returns the OAuth URL to redirect the user to for connecting a platform.
    Placeholder — real URLs built with platform-specific SDKs.
    """
    return {
        "platform": platform,
        "url": f"https://oauth.example.com/{platform}?user={current_user.id}",
        "note": "Replace with real OAuth URL from platform SDK",
    }
