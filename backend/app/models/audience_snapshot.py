from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
import uuid
from ..db.database import Base


class AudienceSnapshot(Base):
    """A daily capture of an account's hourly online-follower activity (Instagram
    Graph API `online_followers` insight). Accumulated over time to build a real
    weekly best-time-to-post heatmap, instead of guessing."""

    __tablename__ = "audience_snapshots"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = Column(String, ForeignKey("social_accounts.id"), nullable=False)
    platform = Column(String, nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday ... 6=Sunday (UTC)
    hourly_counts = Column(JSON, nullable=False)   # {"0": 12, "1": 8, ..., "23": 40}
    captured_at = Column(DateTime(timezone=True), server_default=func.now())
