from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class MetricPoint(BaseModel):
    date: str
    value: float


class PlatformMetrics(BaseModel):
    platform: str
    followers: int
    follower_growth: float       # percent change
    impressions: int
    reach: int
    engagement_rate: float
    posts_count: int
    avg_likes: float
    avg_comments: float
    avg_shares: float


class DashboardSummary(BaseModel):
    total_followers: int
    followers_change_pct: float
    total_reach: int
    reach_change_pct: float
    avg_engagement_rate: float
    engagement_change_pct: float
    posts_scheduled: int
    posts_published_this_week: int
    platforms_connected: int
    ai_insights: List[str]


class NLQRequest(BaseModel):
    question: str


class NLQResponse(BaseModel):
    answer: str
    chart_type: Optional[str] = None     # line|bar|pie|table|none
    chart_data: Optional[List[Dict[str, Any]]] = None
    chart_labels: Optional[List[str]] = None
