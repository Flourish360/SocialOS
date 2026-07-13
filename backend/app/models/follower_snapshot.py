from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
import uuid
from ..db.database import Base


class FollowerSnapshot(Base):
    """Daily follower count per connected account — accumulated to build the
    follower growth series chart instead of returning an empty array."""

    __tablename__ = "follower_snapshots"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    platform = Column(String, nullable=False)
    follower_count = Column(Integer, nullable=False, default=0)
    captured_at = Column(DateTime(timezone=True), server_default=func.now())
