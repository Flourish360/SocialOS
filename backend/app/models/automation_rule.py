from sqlalchemy import Column, String, Boolean, Integer, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
import uuid
from ..db.database import Base


class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    trigger_type = Column(String, nullable=False, default="post_likes")
    action_type = Column(String, nullable=False, default="notify")
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    run_count = Column(Integer, default=0)
    last_run = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
