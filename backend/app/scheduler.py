from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)


def _publish_due_posts():
    from .db.database import SessionLocal
    from .models.post import Post
    from .models.social_account import SocialAccount
    from .services.publishers import publish_to_instagram, publish_to_twitter, publish_to_tiktok, publish_to_linkedin, publish_to_facebook

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        due = db.query(Post).filter(
            Post.status.in_(["scheduled", "queued"]),
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
                    from .services.token_refresh import ensure_twitter_token
                    if not ensure_twitter_token(account, db):
                        logger.warning("Scheduled post %s: Twitter token expired and refresh failed", post.id)
                        continue
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
                        media_type=post.media_type or "image",
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
                            ids["linkedin"] = result["post_id"]
                            post.platform_post_ids = ids
                        logger.info("Scheduled post %s published to LinkedIn: %s", post.id, result.get("post_id"))
                    else:
                        logger.warning("Scheduled post %s failed on LinkedIn: %s", post.id, result.get("error"))
                elif platform == "facebook":
                    result = publish_to_facebook(
                        access_token=account.access_token,
                        page_id=account.platform_user_id,
                        caption=full_caption,
                        media_urls=post.media_urls or [],
                    )
                    if result.get("success"):
                        any_success = True
                        if result.get("post_id"):
                            ids = dict(post.platform_post_ids or {})
                            ids["facebook"] = result["post_id"]
                            post.platform_post_ids = ids
                        logger.info("Scheduled post %s published to Facebook: %s", post.id, result.get("post_id"))
                    else:
                        logger.warning("Scheduled post %s failed on Facebook: %s", post.id, result.get("error"))

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
            # SQLite round-trips DateTime(timezone=True) as naive even when
            # stored tz-aware (Postgres preserves it correctly), so normalize
            # before comparing against a tz-aware threshold.
            expires_at = account.token_expires_at
            if expires_at and not expires_at.tzinfo:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            needs_refresh = expires_at is None or expires_at <= threshold
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


def _log_and_bump(db, rule, external_ref: str) -> bool:
    """Record an AutomationLog row for this (rule, external_ref) pair and bump
    the rule's run_count/last_run. Returns False (no-op) if this event was
    already handled. APScheduler runs this job with max_instances=1, so a
    plain existence check is safe here — no rollback() mid-loop, which would
    otherwise wipe out every other uncommitted change from earlier rules in
    the same evaluation pass. The DB unique constraint on AutomationLog stays
    as a last-resort guard, not the primary mechanism."""
    from .models.automation_log import AutomationLog

    exists = db.query(AutomationLog).filter(
        AutomationLog.rule_id == rule.id,
        AutomationLog.external_ref == external_ref,
    ).first()
    if exists:
        return False
    db.add(AutomationLog(rule_id=rule.id, external_ref=external_ref))
    rule.run_count = (rule.run_count or 0) + 1
    rule.last_run = datetime.now(timezone.utc)
    return True


def _dispatch_notify(db, user_id: str, rule, title: str, body: str):
    from .models.notification import Notification
    db.add(Notification(
        user_id=user_id,
        title=title,
        body=body,
        icon_key=rule.trigger_type,
        rule_id=rule.id,
    ))


def _evaluate_automation_rules():
    """Every 5 minutes: evaluate every active AutomationRule and fire its
    action (notify / auto_reply) when the trigger condition is met. Each
    fired event is deduped via AutomationLog so re-polling never repeats it."""
    from .db.database import SessionLocal
    from .models.automation_rule import AutomationRule
    from .models.social_account import SocialAccount
    from .models.post import Post
    from .models.follower_snapshot import FollowerSnapshot
    from .services.instagram_sync import fetch_instagram_comments
    from .services.publishers import fetch_instagram_insights
    from .api.automation import send_instagram_reply

    db = SessionLocal()
    try:
        rules = db.query(AutomationRule).filter(AutomationRule.is_active == True).all()
        fired = 0

        for rule in rules:
            config = rule.config or {}

            if rule.trigger_type == "comment_keyword":
                keyword = (config.get("keyword") or "").strip().lower()
                if not keyword:
                    continue
                account = db.query(SocialAccount).filter(
                    SocialAccount.user_id == rule.user_id,
                    SocialAccount.platform == "instagram",
                    SocialAccount.is_connected == True,
                ).first()
                if not account or not account.access_token:
                    continue
                posts = db.query(Post).filter(
                    Post.user_id == rule.user_id,
                    Post.status == "published",
                    Post.platform_post_ids.isnot(None),
                ).order_by(Post.published_at.desc()).limit(10).all()

                for post in posts:
                    ig_media_id = (post.platform_post_ids or {}).get("instagram")
                    if not ig_media_id:
                        continue
                    for c in fetch_instagram_comments(account.access_token, ig_media_id, limit=20):
                        comment_id = c.get("id")
                        text = (c.get("text") or "")
                        if not comment_id or keyword not in text.lower():
                            continue
                        if not _log_and_bump(db, rule, external_ref=comment_id):
                            continue
                        if rule.action_type == "auto_reply":
                            reply = (config.get("reply_message") or "Thanks for your comment!").strip()
                            send_instagram_reply(db, rule.user_id, comment_id, reply)
                        elif rule.action_type == "notify":
                            _dispatch_notify(db, rule.user_id, rule, rule.name, f'New comment matched "{keyword}": {text[:140]}')
                        fired += 1

            elif rule.trigger_type == "follower_drop":
                threshold_pct = config.get("threshold_pct")
                window_days = config.get("window_days", 7)
                platform = config.get("platform", "instagram")
                if not threshold_pct:
                    continue
                latest = db.query(FollowerSnapshot).filter(
                    FollowerSnapshot.user_id == rule.user_id,
                    FollowerSnapshot.platform == platform,
                ).order_by(FollowerSnapshot.captured_at.desc()).first()
                cutoff = datetime.now(timezone.utc) - timedelta(days=window_days)
                baseline = db.query(FollowerSnapshot).filter(
                    FollowerSnapshot.user_id == rule.user_id,
                    FollowerSnapshot.platform == platform,
                    FollowerSnapshot.captured_at <= cutoff,
                ).order_by(FollowerSnapshot.captured_at.desc()).first()
                if not latest or not baseline or baseline.follower_count <= 0:
                    continue
                drop_pct = (baseline.follower_count - latest.follower_count) / baseline.follower_count * 100
                if drop_pct < threshold_pct:
                    continue
                # One notification per day per drop episode, not once per 5-min tick.
                day_key = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                if not _log_and_bump(db, rule, external_ref=f"drop-{day_key}"):
                    continue
                _dispatch_notify(db, rule.user_id, rule, rule.name, f"Followers dropped {drop_pct:.1f}% over the last {window_days} days.")
                fired += 1

            elif rule.trigger_type == "schedule":
                interval_hours = config.get("interval_hours", 24)
                anchor = rule.last_run or rule.created_at
                if anchor and datetime.now(timezone.utc) < anchor.replace(tzinfo=timezone.utc) + timedelta(hours=interval_hours):
                    continue
                run_key = datetime.now(timezone.utc).isoformat()
                if not _log_and_bump(db, rule, external_ref=f"schedule-{run_key}"):
                    continue
                _dispatch_notify(db, rule.user_id, rule, rule.name, rule.description or "Scheduled automation ran.")
                fired += 1

            elif rule.trigger_type == "post_likes":
                threshold = config.get("threshold")
                if not threshold:
                    continue
                account = db.query(SocialAccount).filter(
                    SocialAccount.user_id == rule.user_id,
                    SocialAccount.platform == "instagram",
                    SocialAccount.is_connected == True,
                ).first()
                if not account or not account.access_token:
                    continue
                posts = db.query(Post).filter(
                    Post.user_id == rule.user_id,
                    Post.status == "published",
                    Post.platform_post_ids.isnot(None),
                ).order_by(Post.published_at.desc()).limit(10).all()

                for post in posts:
                    ig_media_id = (post.platform_post_ids or {}).get("instagram")
                    if not ig_media_id:
                        continue
                    insights = fetch_instagram_insights(account.access_token, ig_media_id, post.media_type or "image")
                    if (insights.get("likes") or 0) < threshold:
                        continue
                    if not _log_and_bump(db, rule, external_ref=post.id):
                        continue
                    _dispatch_notify(db, rule.user_id, rule, rule.name, f'"{post.caption[:60]}" reached {insights.get("likes")} likes.')
                    fired += 1

        db.commit()
        if fired:
            logger.info("Automation engine fired %d action(s)", fired)
    except Exception:
        logger.exception("Scheduler error during automation rule evaluation")
        db.rollback()
    finally:
        db.close()


scheduler = BackgroundScheduler()
scheduler.add_job(_publish_due_posts, "interval", minutes=1, id="publish_scheduled_posts")
scheduler.add_job(_sync_all_instagram_accounts, "interval", hours=1, id="sync_instagram_accounts")
scheduler.add_job(_capture_follower_snapshots, "interval", hours=24, id="capture_follower_snapshots")
scheduler.add_job(_capture_audience_snapshots, "interval", hours=24, id="capture_audience_snapshots")
scheduler.add_job(_refresh_instagram_tokens, "interval", hours=24 * 7, id="refresh_instagram_tokens")
scheduler.add_job(_evaluate_automation_rules, "interval", minutes=5, id="evaluate_automation_rules")
