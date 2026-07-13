from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)


def _publish_due_posts():
    from .db.database import SessionLocal
    from .models.post import Post
    from .models.social_account import SocialAccount
    from .services.publishers import publish_to_instagram, publish_to_twitter, publish_to_tiktok, publish_to_linkedin

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
                    from .services.token_refresh import ensure_tiktok_token
                    if not ensure_tiktok_token(account, db):
                        logger.warning("Scheduled post %s: TikTok token expired and refresh failed", post.id)
                        continue
                    result = publish_to_tiktok(
                        access_token=account.access_token,
                        caption=full_caption,
                        media_urls=post.media_urls or [],
                    )
                elif platform == "linkedin":
                    result = publish_to_linkedin(
                        access_token=account.access_token,
                        platform_user_id=account.platform_user_id,
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


def _capture_follower_snapshots():
    """Once a day, snapshot follower counts for every connected account so
    the follower growth chart has real historical data to plot."""
    from .db.database import SessionLocal
    from .models.social_account import SocialAccount
    from .models.follower_snapshot import FollowerSnapshot

    db = SessionLocal()
    try:
        accounts = db.query(SocialAccount).filter(
            SocialAccount.is_connected == True,
        ).all()
        for account in accounts:
            if account.follower_count:
                db.add(FollowerSnapshot(
                    user_id=account.user_id,
                    platform=account.platform,
                    follower_count=account.follower_count,
                ))
        db.commit()
        logger.info("Captured follower snapshots for %d account(s)", len(accounts))
    except Exception:
        logger.exception("Scheduler error during follower snapshot capture")
        db.rollback()
    finally:
        db.close()


def _refresh_instagram_tokens():
    """Weekly: refresh long-lived Instagram tokens before their 60-day expiry.

    Runs proactively for any token expiring within 14 days OR with no expiry
    recorded (tokens issued before we started tracking expiry).
    """
    from .db.database import SessionLocal
    from .models.social_account import SocialAccount
    from .services.instagram_sync import refresh_instagram_token

    db = SessionLocal()
    try:
        threshold = datetime.now(timezone.utc) + timedelta(days=14)
        accounts = db.query(SocialAccount).filter(
            SocialAccount.platform == "instagram",
            SocialAccount.is_connected == True,
        ).all()
        refreshed = 0
        for account in accounts:
            needs_refresh = (
                account.token_expires_at is None
                or account.token_expires_at <= threshold
            )
            if not needs_refresh or not account.access_token:
                continue
            result = refresh_instagram_token(account.access_token)
            if result and result.get("access_token"):
                account.access_token = result["access_token"]
                expires_in = result.get("expires_in", 5_184_000)  # default 60 days
                account.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
                refreshed += 1
        if refreshed:
            db.commit()
            logger.info("Refreshed %d Instagram token(s)", refreshed)
    except Exception:
        logger.exception("Scheduler error during Instagram token refresh")
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
scheduler.add_job(_capture_follower_snapshots, "interval", hours=24, id="capture_follower_snapshots")
scheduler.add_job(_capture_audience_snapshots, "interval", hours=24, id="capture_audience_snapshots")
scheduler.add_job(_refresh_instagram_tokens, "interval", hours=24 * 7, id="refresh_instagram_tokens")
