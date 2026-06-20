from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


def _publish_due_posts():
    from .db.database import SessionLocal
    from .models.post import Post
    from .models.social_account import SocialAccount
    from .services.publishers import publish_to_instagram

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        due = db.query(Post).filter(
            Post.status == "scheduled",
            Post.scheduled_at <= now,
        ).all()

        for post in due:
            full_caption = post.caption + ("\n\n" + " ".join(post.hashtags) if post.hashtags else "")
            media_url = post.media_urls[0] if post.media_urls else None
            any_success = False

            for platform in (post.platform_account_ids or []):
                account = db.query(SocialAccount).filter(
                    SocialAccount.user_id == post.user_id,
                    SocialAccount.platform == platform,
                    SocialAccount.is_connected == True,
                ).first()
                if not account or not account.access_token:
                    logger.warning("Post %s: %s not connected", post.id, platform)
                    continue

                if platform == "instagram":
                    result = publish_to_instagram(
                        access_token=account.access_token,
                        ig_user_id=account.platform_user_id,
                        caption=full_caption,
                        media_url=media_url,
                    )
                    if result.get("success"):
                        any_success = True
                        logger.info("Scheduled post %s published to Instagram: %s", post.id, result.get("post_id"))
                    else:
                        logger.warning("Scheduled post %s failed on Instagram: %s", post.id, result.get("error"))

            post.status = "published" if any_success else "failed"
            post.published_at = now if any_success else None

        if due:
            db.commit()
            logger.info("Processed %d scheduled post(s)", len(due))
    except Exception:
        logger.exception("Scheduler error during publish run")
        db.rollback()
    finally:
        db.close()


scheduler = BackgroundScheduler()
scheduler.add_job(_publish_due_posts, "interval", minutes=1, id="publish_scheduled_posts")
