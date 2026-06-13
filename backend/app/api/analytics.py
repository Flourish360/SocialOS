from fastapi import APIRouter, Depends
from ..api.deps import get_current_user
from ..models.user import User
from ..schemas.analytics import NLQRequest, NLQResponse
from ..mock.data import (
    MOCK_DASHBOARD_SUMMARY, MOCK_PLATFORM_METRICS,
    MOCK_ENGAGEMENT_SERIES, MOCK_FOLLOWER_SERIES, HEATMAP_DATA,
)
from ..core.config import settings

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def dashboard_summary(current_user: User = Depends(get_current_user)):
    return MOCK_DASHBOARD_SUMMARY


@router.get("/platforms")
def platform_metrics(current_user: User = Depends(get_current_user)):
    return MOCK_PLATFORM_METRICS


@router.get("/engagement-series")
def engagement_series(days: int = 30, current_user: User = Depends(get_current_user)):
    return MOCK_ENGAGEMENT_SERIES[-days:]


@router.get("/follower-series")
def follower_series(days: int = 30, current_user: User = Depends(get_current_user)):
    return MOCK_FOLLOWER_SERIES[-days:]


@router.get("/heatmap")
def audience_heatmap(current_user: User = Depends(get_current_user)):
    return HEATMAP_DATA


@router.post("/ask", response_model=NLQResponse)
def natural_language_query(body: NLQRequest, current_user: User = Depends(get_current_user)):
    """
    Natural language analytics query. In production, feeds to GPT-4o
    with the user's aggregated metrics as context.
    """
    q = body.question.lower()

    if "grew" in q or "growth" in q:
        return NLQResponse(
            answer="TikTok grew the most last month with +8.2% follower growth (≈ +3,900 followers). LinkedIn was second at +3.6%.",
            chart_type="bar",
            chart_data=[
                {"platform": "TikTok", "growth": 8.2},
                {"platform": "LinkedIn", "growth": 3.6},
                {"platform": "Instagram", "growth": 2.1},
                {"platform": "YouTube", "growth": 1.2},
                {"platform": "Twitter/X", "growth": -0.4},
            ],
            chart_labels=["platform", "growth"],
        )

    if "save" in q or "instagram" in q:
        return NLQResponse(
            answer="On Instagram, carousel posts get 3.1× more saves than single images. Educational carousels top the list with an average of 1,240 saves per post.",
            chart_type="bar",
            chart_data=[
                {"type": "Carousel", "avg_saves": 1240},
                {"type": "Video/Reel", "avg_saves": 890},
                {"type": "Single Image", "avg_saves": 400},
                {"type": "Text Only", "avg_saves": 120},
            ],
            chart_labels=["type", "avg_saves"],
        )

    if "top" in q and "post" in q:
        return NLQResponse(
            answer="Your top 3 posts by engagement rate in the last 90 days were all video or carousel content, averaging 6.8% engagement rate vs 2.4% for static images.",
            chart_type="table",
            chart_data=MOCK_PLATFORM_METRICS,
            chart_labels=["platform", "engagement_rate", "reach"],
        )

    return NLQResponse(
        answer=f"I analyzed your data for: \"{body.question}\". Your overall engagement rate is 5.0%, up 1.2% vs last month. TikTok is your strongest platform right now.",
        chart_type="none",
    )
