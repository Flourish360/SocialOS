from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
import uuid
from ..db.database import Base


class AutomationLog(Base):
    """One row per fired trigger event — the idempotency guard so a rule's
    5-minute poll never re-fires on the same comment/post/drop episode twice,
    and the real data behind AutomationRule.run_count / last_run."""

    __tablename__ = "automation_logs"
    __table_args__ = (UniqueConstraint("rule_id", "external_ref", name="uq_automation_log_rule_ref"),)

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    rule_id = Column(String, ForeignKey("automation_rules.id"), nullable=False)
    external_ref = Column(String, nullable=False)
    fired_at = Column(DateTime(timezone=True), server_default=func.now())
