from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..db.database import get_db
from ..models.user import User
from ..schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserProfile
from ..core.security import hash_password, verify_password, create_access_token
from .deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

_MAX_ATTEMPTS = 5
_LOCKOUT_MINUTES = 15


def _check_lockout(user: User) -> None:
    """Raise 429 if the account is currently locked out."""
    if user.lockout_until and user.lockout_until > datetime.now(timezone.utc):
        remaining = int((user.lockout_until - datetime.now(timezone.utc)).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account temporarily locked. Try again in {remaining} minute(s).",
        )


def _record_failure(db: Session, user: User) -> None:
    """Increment failed attempts; lock the account after MAX_ATTEMPTS."""
    user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
    if user.failed_login_attempts >= _MAX_ATTEMPTS:
        user.lockout_until = datetime.now(timezone.utc) + timedelta(minutes=_LOCKOUT_MINUTES)
        user.failed_login_attempts = 0
    db.commit()


def _record_success(db: Session, user: User) -> None:
    """Reset failure counter on successful login."""
    if user.failed_login_attempts or user.lockout_until:
        user.failed_login_attempts = 0
        user.lockout_until = None
        db.commit()


@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit("5/minute")
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user_id=user.id, email=user.email, full_name=user.full_name)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()

    # Use a generic error so attackers can't enumerate which emails exist
    invalid = HTTPException(status_code=401, detail="Invalid credentials")

    if not user:
        raise invalid

    _check_lockout(user)

    if not verify_password(body.password, user.hashed_password):
        _record_failure(db, user)
        raise invalid

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    _record_success(db, user)
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user_id=user.id, email=user.email, full_name=user.full_name)


@router.get("/me", response_model=UserProfile)
def me(current_user: User = Depends(get_current_user)):
    return current_user
