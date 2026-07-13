from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
import uuid
from ..db.database import Base


class Competitor(Base):
    __tablename__ = "competitors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    handle = Column(String, nullable=False)
    platform = Column(String, nullable=False, default="instagram")
    followers = Column(Integer, default=0)
    follower_growth_pct = Column(Float, default=0.0)
    posts_per_week = Column(Float, default=0.0)
    avg_engagement = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
