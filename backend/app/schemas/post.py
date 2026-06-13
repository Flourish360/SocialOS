from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PostCreate(BaseModel):
    caption: str
    hashtags: List[str] = []
    media_urls: List[str] = []
    media_type: str = "none"
    platform_account_ids: List[str]
    scheduled_at: Optional[datetime] = None


class PostUpdate(BaseModel):
    caption: Optional[str] = None
    hashtags: Optional[List[str]] = None
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = None


class PostResponse(BaseModel):
    id: str
    caption: str
    hashtags: List[str]
    media_urls: List[str]
    media_type: str
    status: str
    scheduled_at: Optional[datetime]
    published_at: Optional[datetime]
    ai_generated: bool
    predicted_engagement_score: Optional[float]
    sentiment: Optional[str]
    total_impressions: int
    total_engagements: int
    content_roi_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class AIGenerateRequest(BaseModel):
    topic: str
    platform: str
    tone: str = "casual"
    include_hashtags: bool = True
    keywords: List[str] = []


class AIRewriteRequest(BaseModel):
    text: str
    target_platform: str
    tone: str = "casual"


class HashtagSuggestRequest(BaseModel):
    caption: str
    platform: str
    count: int = 15
