from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
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

    # Sync any Instagram account that has never fetched live data
    from ..services.instagram_sync import sync_instagram_account
    for a in accounts:
        if a.platform == "instagram" and a.last_synced_at is None:
            sync_instagram_account(db, a)

    total_impressions = sum(p.total_impressions or 0 for p in published)
    total_reach = sum(p.total_reach or 0 for p in published)
    total_engagements = sum(p.total_engagements or 0 for p in published)
    total_followers = sum(a.follower_count or 0 for a in accounts)

    return {
        "total_posts": len(published),
        "posts_scheduled": scheduled,
        "total_impressions": total_impressions,
        "total_reach": total_reach,
        "total_engagements": total_engagements,
        "total_followers": total_followers,
        "avg_engagement_rate": round((total_engagements / max(total_reach, 1)) * 100, 2),
        "follower_growth_pct": 0,
        "top_platform": "instagram" if published else None,
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
):
    if settings.USE_MOCK_DATA:
        return MOCK_ENGAGEMENT_SERIES[-days:]
    return []


@router.get("/follower-series")
def follower_series(
    days: int = 30,
    current_user: User = Depends(get_current_user),
):
    if settings.USE_MOCK_DATA:
        return MOCK_FOLLOWER_SERIES[-days:]
    return []


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
def natural_language_query(body: NLQRequest, current_user: User = Depends(get_current_user)):
    """Natural-language analytics. Routes to Claude in production with the user's metrics as context."""
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

    return NLQResponse(
        answer="Not enough data yet — publish a few more posts and check back. I'll have insights once Instagram analytics roll in.",
        chart_type="none",
    )
