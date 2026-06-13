from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from ..db.database import Base


PLATFORMS = [
    "instagram", "facebook", "twitter", "tiktok",
    "linkedin", "youtube", "pinterest", "threads", "snapchat",
]


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    platform = Column(String, nullable=False)          # one of PLATFORMS
    platform_user_id = Column(String, nullable=False)
    handle = Column(String, nullable=False)
    display_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    # OAuth tokens (AES-256 encrypted in production)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_connected = Column(Boolean, default=True)

    # Cached metrics (refreshed hourly)
    follower_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    post_count = Column(Integer, default=0)
    avg_engagement_rate = Column(Float, default=0.0)
    health_score = Column(Float, default=100.0)   # 0–100

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_synced_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="accounts")
    posts = relationship("PostPlatformTarget", back_populates="account")
