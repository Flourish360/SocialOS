from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey, Integer, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from ..db.database import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    caption = Column(Text, nullable=False)
    hashtags = Column(JSON, default=list)        # list of strings
    media_urls = Column(JSON, default=list)      # list of S3 URLs
    media_type = Column(String, default="none")  # none|image|video|carousel|gif

    status = Column(String, default="draft")     # draft|scheduled|published|failed|paused
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)

    # Denormalized platform list for quick querying without joining platform_targets
    platform_account_ids = Column(JSON, default=list)

    # Maps platform name → published post ID on that platform (e.g. {"instagram": "17841..."})
    platform_post_ids = Column(JSON, default=dict)

    # AI metadata
    ai_generated = Column(Boolean, default=False)
    predicted_engagement_score = Column(Float, nullable=True)
    sentiment = Column(String, nullable=True)     # positive|neutral|negative
    readability_score = Column(Float, nullable=True)
    content_type_tag = Column(String, nullable=True)  # educational|promotional|meme|quote|product

    # Performance (aggregated after publish)
    total_impressions = Column(Integer, default=0)
    total_reach = Column(Integer, default=0)
    total_engagements = Column(Integer, default=0)
    total_clicks = Column(Integer, default=0)
    engagement_velocity = Column(Float, default=0.0)  # engagements in first hour
    content_roi_score = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="posts")
    platform_targets = relationship("PostPlatformTarget", back_populates="post", cascade="all, delete-orphan")


class PostPlatformTarget(Base):
    """One row per platform this post was/will be published to."""
    __tablename__ = "post_platform_targets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String, ForeignKey("posts.id"), nullable=False)
    account_id = Column(String, ForeignKey("social_accounts.id"), nullable=False)
    platform = Column(String, nullable=False)

    platform_post_id = Column(String, nullable=True)   # ID returned by platform API
    platform_url = Column(String, nullable=True)
    status = Column(String, default="pending")          # pending|published|failed

    # Per-platform metrics
    impressions = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    saves = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    video_views = Column(Integer, default=0)
    watch_time_seconds = Column(Integer, default=0)

    published_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    post = relationship("Post", back_populates="platform_targets")
    account = relationship("SocialAccount", back_populates="posts")


class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    trigger_type = Column(String, nullable=False)   # post_likes|follower_drop|schedule|comment_keyword
    trigger_config = Column(JSON, default=dict)
    condition_config = Column(JSON, default=dict)
    action_type = Column(String, nullable=False)    # repost|send_email|generate_post|notify
    action_config = Column(JSON, default=dict)

    run_count = Column(Integer, default=0)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
