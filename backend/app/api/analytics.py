from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from ..api.deps import get_current_user
from ..db.database import get_db
from ..models.user import User
from ..models.post import Post
from ..models.social_account import SocialAccount
from ..schemas.analytics import NLQRequest, NLQResponse
from ..mock.data import (
    MOCK_DASHBOARD_SUMMARY, MOCK_PLATFORM_METRICS,
    MOCK_ENGAGEMENT_SERIES, MOCK_FOLLOWER_SERIES, HEATMAP_DATA,
)
from ..core.config import settings

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.USE_MOCK_DATA:
        return MOCK_DASHBOARD_SUMMARY

    published = db.query(Post).filter(
        Post.user_id == current_user.id,
        Post.status == "published",
    ).all()
    scheduled = db.query(Post).filter(
        Post.user_id == current_user.id,
        Post.status == "scheduled",
    ).count()
    accounts = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.is_connected == True,
    ).all()

    # Sync any account that has never fetched live data
    from ..services.instagram_sync import sync_instagram_account
    from ..services.tiktok_sync import sync_tiktok_account
    for a in accounts:
        if a.platform == "instagram" and a.last_synced_at is None:
            sync_instagram_account(db, a)
        if a.platform == "tiktok" and a.handle in ("", "pending", None):
            sync_tiktok_account(db, a)

    total_impressions = sum(p.total_impressions or 0 for p in published)
    total_reach = sum(p.total_reach or 0 for p in published)
    total_engagements = sum(p.total_engagements or 0 for p in published)
    total_followers = sum(a.follower_count or 0 for a in accounts)
    avg_eng_rate = round((total_engagements / max(total_reach, 1)) * 100, 2)

    # Follower growth: compare current followers to snapshot from ~30 days ago
    from ..models.follower_snapshot import FollowerSnapshot
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    old_snap = db.query(FollowerSnapshot).filter(
        FollowerSnapshot.user_id == current_user.id,
        FollowerSnapshot.captured_at <= thirty_days_ago,
    ).order_by(FollowerSnapshot.captured_at.desc()).first()
    old_total = old_snap.follower_count if old_snap else total_followers
    follower_growth_pct = round(((total_followers - old_total) / max(old_total, 1)) * 100, 2)

    # Health score: 0-100 based on posting frequency, engagement rate, account status
    posts_last_7 = sum(
        1 for p in published
        if p.published_at and p.published_at >= datetime.now(timezone.utc) - timedelta(days=7)
    )
    frequency_score = min(100, posts_last_7 * 14)  # 7 posts/week = 100
    engagement_score = min(100, avg_eng_rate * 10)  # 10% eng rate = 100
    connection_score = min(100, len(accounts) * 25)  # 4 platforms = 100
    health_score = round((frequency_score * 0.4) + (engagement_score * 0.4) + (connection_score * 0.2))

    # Top platform by engagements
    by_platform: dict[str, int] = {}
    for p in published:
        eng = p.total_engagements or 0
        for plat in (p.platform_account_ids or []):
            by_platform[plat] = by_platform.get(plat, 0) + eng
    top_platform = max(by_platform, key=by_platform.get) if by_platform else (accounts[0].platform if accounts else None)

    return {
        "total_posts": len(published),
        "posts_scheduled": scheduled,
        "total_impressions": total_impressions,
        "total_reach": total_reach,
        "total_engagements": total_engagements,
        "total_followers": total_followers,
        "avg_engagement_rate": avg_eng_rate,
        "follower_growth_pct": follower_growth_pct,
        "top_platform": top_platform,
        "health_score": health_score,
        "ai_insights": [],
    }


@router.get("/platforms")
def platform_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.USE_MOCK_DATA:
        return MOCK_PLATFORM_METRICS

    # Aggregate per-platform from posts
    posts = db.query(Post).filter(
        Post.user_id == current_user.id,
        Post.status == "published",
    ).all()
    accounts = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.is_connected == True,
    ).all()
    account_by_platform = {a.platform: a for a in accounts}

    by_platform: dict[str, dict] = {}
    for p in posts:
        for plat in (p.platform_account_ids or []):
            agg = by_platform.setdefault(plat, {
                "platform": plat,
                "posts": 0,
                "impressions": 0,
                "reach": 0,
                "engagements": 0,
                "followers": 0,
                "follower_growth": 0,
            })
            agg["posts"] += 1
            agg["impressions"] += p.total_impressions or 0
            agg["reach"] += p.total_reach or 0
            agg["engagements"] += p.total_engagements or 0

    # Merge in real follower counts from connected accounts
    for plat, acc in account_by_platform.items():
        agg = by_platform.setdefault(plat, {
            "platform": plat, "posts": 0, "impressions": 0,
            "reach": 0, "engagements": 0, "followers": 0, "follower_growth": 0,
        })
        agg["followers"] = acc.follower_count or 0

    for agg in by_platform.values():
        agg["engagement_rate"] = round((agg["engagements"] / max(agg["reach"], 1)) * 100, 2)

    return list(by_platform.values())


@router.get("/engagement-series")
def engagement_series(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.USE_MOCK_DATA:
        return MOCK_ENGAGEMENT_SERIES[-days:]

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    posts = db.query(Post).filter(
        Post.user_id == current_user.id,
        Post.status == "published",
        Post.published_at >= cutoff,
    ).all()

    by_date: dict[str, dict] = {}
    for post in posts:
        if not post.published_at:
            continue
        date_str = post.published_at.strftime("%Y-%m-%d")
        row = by_date.setdefault(date_str, {
            "date": date_str, "instagram": 0, "twitter": 0,
            "linkedin": 0, "tiktok": 0, "total": 0,
        })
        eng = post.total_engagements or 0
        for platform in (post.platform_account_ids or []):
            if platform in row:
                row[platform] += eng
        row["total"] += eng

    return sorted(by_date.values(), key=lambda r: r["date"])


@router.get("/follower-series")
def follower_series(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.USE_MOCK_DATA:
        return MOCK_FOLLOWER_SERIES[-days:]

    from ..models.follower_snapshot import FollowerSnapshot

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    snapshots = db.query(FollowerSnapshot).filter(
        FollowerSnapshot.user_id == current_user.id,
        FollowerSnapshot.captured_at >= cutoff,
    ).order_by(FollowerSnapshot.captured_at).all()

    if not snapshots:
        # No history yet — return today's current counts as a single data point
        accounts = db.query(SocialAccount).filter(
            SocialAccount.user_id == current_user.id,
            SocialAccount.is_connected == True,
        ).all()
        if not accounts:
            return []
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        row: dict = {"date": today, "instagram": 0, "twitter": 0, "linkedin": 0, "tiktok": 0, "total": 0}
        for a in accounts:
            if a.platform in row:
                row[a.platform] = a.follower_count or 0
            row["total"] += a.follower_count or 0
        return [row]

    # Aggregate snapshots by date
    by_date: dict[str, dict] = {}
    for snap in snapshots:
        date_str = snap.captured_at.strftime("%Y-%m-%d")
        row = by_date.setdefault(date_str, {
            "date": date_str, "instagram": 0, "twitter": 0,
            "linkedin": 0, "tiktok": 0, "total": 0,
        })
        if snap.platform in row:
            row[snap.platform] += snap.follower_count
        row["total"] += snap.follower_count

    return sorted(by_date.values(), key=lambda r: r["date"])


DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


@router.get("/heatmap")
def audience_heatmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.USE_MOCK_DATA:
        return HEATMAP_DATA

    from ..models.audience_snapshot import AudienceSnapshot

    account_ids = [
        a.id for a in db.query(SocialAccount).filter(
            SocialAccount.user_id == current_user.id,
            SocialAccount.platform == "instagram",
        ).all()
    ]
    if not account_ids:
        return []

    snapshots = db.query(AudienceSnapshot).filter(
        AudienceSnapshot.account_id.in_(account_ids),
    ).all()
    if not snapshots:
        return []

    # Average real online-follower counts per (day_of_week, hour) across all captured snapshots.
    sums: dict[tuple[int, int], int] = {}
    counts: dict[tuple[int, int], int] = {}
    for snap in snapshots:
        for hour_str, value in (snap.hourly_counts or {}).items():
            key = (snap.day_of_week, int(hour_str))
            sums[key] = sums.get(key, 0) + int(value)
            counts[key] = counts.get(key, 0) + 1

    return [
        {"day": DAY_LABELS[day], "hour": hour, "value": round(sums[(day, hour)] / counts[(day, hour)])}
        for (day, hour) in sums
    ]


@router.post("/ask", response_model=NLQResponse)
def natural_language_query(
    body: NLQRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Natural-language analytics powered by Claude — answers questions about the user's real data."""
    if settings.USE_MOCK_DATA:
        q = body.question.lower()
        if "grew" in q or "growth" in q:
            return NLQResponse(
                answer="TikTok grew the most last month with +8.2% follower growth.",
                chart_type="bar",
                chart_data=[{"platform": "TikTok", "growth": 8.2}, {"platform": "LinkedIn", "growth": 3.6}],
                chart_labels=["platform", "growth"],
            )
        return NLQResponse(answer=f"I analyzed your data for: \"{body.question}\".", chart_type="none")

    # Gather the user's real metrics to give Claude full context
    accounts = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.is_connected == True,
    ).all()
    published = db.query(Post).filter(
        Post.user_id == current_user.id,
        Post.status == "published",
    ).order_by(Post.published_at.desc()).limit(30).all()

    platform_lines = []
    for a in accounts:
        platform_lines.append(
            f"  - {a.platform}: {a.follower_count or 0:,} followers, {a.post_count or 0} posts, "
            f"handle={a.handle}"
        )

    total_eng = sum(p.total_engagements or 0 for p in published)
    total_reach = sum(p.total_reach or 0 for p in published)
    avg_eng = round((total_eng / max(total_reach, 1)) * 100, 2)
    posts_last_7 = sum(
        1 for p in published
        if p.published_at and p.published_at >= datetime.now(timezone.utc) - timedelta(days=7)
    )

    context = f"""User's social media data summary:
Connected platforms:
{chr(10).join(platform_lines) if platform_lines else "  (none connected yet)"}

Published posts (last 30): {len(published)}
Posts in last 7 days: {posts_last_7}
Total reach across all posts: {total_reach:,}
Total engagements: {total_eng:,}
Average engagement rate: {avg_eng}%"""

    from ..api.ai import _claude_client, _safe_claude_call, _text, MODEL
    client = _claude_client()
    if not client:
        return NLQResponse(
            answer="AI analysis requires ANTHROPIC_API_KEY — add it to Railway environment variables.",
            chart_type="none",
        )

    resp = _safe_claude_call(lambda: client.messages.create(
        model=MODEL,
        max_tokens=300,
        system=(
            "You are SocialOS AI, an expert social media analytics assistant. "
            "Answer the user's question concisely using their real data provided below. "
            "Be specific, actionable, and data-driven. Keep the answer under 200 words. "
            "If the data is sparse, acknowledge it and give general guidance. "
            f"\n\n{context}"
        ),
        messages=[{"role": "user", "content": body.question}],
    ))

    if resp:
        return NLQResponse(answer=_text(resp), chart_type="none")

    return NLQResponse(
        answer="Could not reach AI — check ANTHROPIC_API_KEY in Railway.",
        chart_type="none",
    )
