from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


def _publish_due_posts():
    from .db.database import SessionLocal
    from .models.post import Post

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        due = db.query(Post).filter(
            Post.status == "scheduled",
            Post.scheduled_at <= now,
        ).all()

        for post in due:
            # Production: call each platform API using platform_account_ids + stored OAuth tokens
            # For now: mark as published so the UI reflects the change
            post.status = "published"
            post.published_at = now
            logger.info("Auto-published post %s", post.id)

        if due:
            db.commit()
            logger.info("Published %d scheduled post(s)", len(due))
    except Exception:
        logger.exception("Scheduler error during publish run")
        db.rollback()
    finally:
        db.close()


scheduler = BackgroundScheduler(timezone="UTC")
scheduler.add_job(_publish_due_posts, "interval", minutes=1, id="publish_scheduled_posts")
