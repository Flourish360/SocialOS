from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


def _publish_due_posts():
    from .db.database import SessionLocal
    from .models.post import Post
    from .models.social_account import SocialAccount
    from .services.publishers import publish_to_instagram, publish_to_twitter, publish_to_tiktok

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
                elif platform == "tiktok":
                    result = publish_to_tiktok(
                        access_token=account.access_token,
                        caption=full_caption,
                        media_urls=post.media_urls or [],
                    )
                    if result.get("success"):
                        any_success = True
                        if result.get("post_id"):
                            ids = dict(post.platform_post_ids or {})
                            ids["tiktok"] = result["post_id"]
                            post.platform_post_ids = ids
                        logger.info("Scheduled post %s sent to TikTok inbox: %s", post.id, result.get("post_id"))
                    else:
                        logger.warning("Scheduled post %s failed on TikTok: %s", post.id, result.get("error"))

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


def _capture_audience_snapshots():
    """Once a day, capture each connected Instagram account's real hourly online-follower
    activity so /ai/best-time and /analytics/heatmap can build a genuine weekly pattern
    instead of guessing — accuracy improves as snapshots accumulate over the week."""
    from .db.database import SessionLocal
    from .models.social_account import SocialAccount
    from .models.audience_snapshot import AudienceSnapshot
    from .services.instagram_sync import fetch_online_followers

    db = SessionLocal()
    try:
        accounts = db.query(SocialAccount).filter(
            SocialAccount.platform == "instagram",
            SocialAccount.is_connected == True,
        ).all()
        captured = 0
        for account in accounts:
            if not account.access_token or not account.platform_user_id:
                continue
            hourly = fetch_online_followers(account.access_token, account.platform_user_id)
            if not hourly:
                continue
            now = datetime.now(timezone.utc)
            db.add(AudienceSnapshot(
                account_id=account.id,
                platform="instagram",
                day_of_week=now.weekday(),
                hourly_counts=hourly,
            ))
            captured += 1
        if captured:
            db.commit()
            logger.info("Captured %d audience snapshot(s)", captured)
    except Exception:
        logger.exception("Scheduler error during audience snapshot capture")
        db.rollback()
    finally:
        db.close()


scheduler = BackgroundScheduler()
scheduler.add_job(_publish_due_posts, "interval", minutes=1, id="publish_scheduled_posts")
scheduler.add_job(_sync_all_instagram_accounts, "interval", hours=1, id="sync_instagram_accounts")
scheduler.add_job(_capture_audience_snapshots, "interval", hours=24, id="capture_audience_snapshots")
