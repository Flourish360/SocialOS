from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


def _publish_due_posts():
    from .db.database import SessionLocal
    from .models.post import Post
    from .models.social_account import SocialAccount
    from .services.publishers import publish_to_instagram, publish_to_twitter

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        due = db.query(Post).filter(
            Post.status == "scheduled",
            Post.scheduled_at <= now,
        ).all()

        for post in due:
            full_caption = post.caption + ("\n\n" + " ".join(post.hashtags) if post.hashtags else "")
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
                        media_urls=post.media_urls or [],
                        media_type=post.media_type or "image",
                    )
                    if result.get("success"):
                        any_success = True
                        if result.get("post_id"):
                            ids = dict(post.platform_post_ids or {})
                            ids["instagram"] = result["post_id"]
                            post.platform_post_ids = ids
                        logger.info("Scheduled post %s published to Instagram: %s", post.id, result.get("post_id"))
                    else:
                        logger.warning("Scheduled post %s failed on Instagram: %s", post.id, result.get("error"))
                elif platform == "twitter":
                    result = publish_to_twitter(
                        access_token=account.access_token,
                        caption=full_caption,
                        media_urls=post.media_urls or [],
                    )
                    if result.get("success"):
                        any_success = True
                        if result.get("post_id"):
                            ids = dict(post.platform_post_ids or {})
                            ids["twitter"] = result["post_id"]
                            post.platform_post_ids = ids
                        logger.info("Scheduled post %s published to Twitter: %s", post.id, result.get("post_id"))
                    else:
                        logger.warning("Scheduled post %s failed on Twitter: %s", post.id, result.get("error"))

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


def _sync_all_instagram_accounts():
    from .db.database import SessionLocal
    from .models.social_account import SocialAccount
    from .services.instagram_sync import sync_instagram_account

    db = SessionLocal()
    try:
        accounts = db.query(SocialAccount).filter(
            SocialAccount.platform == "instagram",
            SocialAccount.is_connected == True,
        ).all()
        for account in accounts:
            sync_instagram_account(db, account)
        if accounts:
            logger.info("Synced %d Instagram account(s)", len(accounts))
    except Exception:
        logger.exception("Scheduler error during Instagram account sync")
        db.rollback()
    finally:
        db.close()


scheduler = BackgroundScheduler()
scheduler.add_job(_publish_due_posts, "interval", minutes=1, id="publish_scheduled_posts")
scheduler.add_job(_sync_all_instagram_accounts, "interval", hours=1, id="sync_instagram_accounts")
