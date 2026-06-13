"""
Mock data for development — all API endpoints return this when USE_MOCK_DATA=True.
Replace with real platform API calls when OAuth tokens are wired in.
"""
from datetime import datetime, timedelta
import random

NOW = datetime.utcnow()


def days_ago(n: int) -> str:
    return (NOW - timedelta(days=n)).strftime("%Y-%m-%d")


MOCK_ACCOUNTS = [
    {
        "id": "acc-ig-1",
        "platform": "instagram",
        "handle": "@yourband",
        "display_name": "Your Brand",
        "avatar_url": "https://api.dicebear.com/8.x/shapes/svg?seed=instagram",
        "follower_count": 24_800,
        "following_count": 412,
        "post_count": 389,
        "avg_engagement_rate": 4.2,
        "health_score": 87,
        "is_connected": True,
    },
    {
        "id": "acc-tw-1",
        "platform": "twitter",
        "handle": "@yourband",
        "display_name": "Your Brand",
        "avatar_url": "https://api.dicebear.com/8.x/shapes/svg?seed=twitter",
        "follower_count": 11_200,
        "following_count": 830,
        "post_count": 1_240,
        "avg_engagement_rate": 2.1,
        "health_score": 72,
        "is_connected": True,
    },
    {
        "id": "acc-li-1",
        "platform": "linkedin",
        "handle": "your-brand",
        "display_name": "Your Brand",
        "avatar_url": "https://api.dicebear.com/8.x/shapes/svg?seed=linkedin",
        "follower_count": 8_540,
        "following_count": 230,
        "post_count": 214,
        "avg_engagement_rate": 5.8,
        "health_score": 93,
        "is_connected": True,
    },
    {
        "id": "acc-tt-1",
        "platform": "tiktok",
        "handle": "@yourband",
        "display_name": "Your Brand",
        "avatar_url": "https://api.dicebear.com/8.x/shapes/svg?seed=tiktok",
        "follower_count": 52_100,
        "following_count": 89,
        "post_count": 132,
        "avg_engagement_rate": 9.4,
        "health_score": 96,
        "is_connected": True,
    },
    {
        "id": "acc-yt-1",
        "platform": "youtube",
        "handle": "YourBrand",
        "display_name": "Your Brand",
        "avatar_url": "https://api.dicebear.com/8.x/shapes/svg?seed=youtube",
        "follower_count": 6_300,
        "following_count": 0,
        "post_count": 47,
        "avg_engagement_rate": 3.7,
        "health_score": 81,
        "is_connected": True,
    },
]

# 30-day engagement time series
MOCK_ENGAGEMENT_SERIES = [
    {"date": days_ago(29 - i), "instagram": random.randint(800, 2200),
     "twitter": random.randint(200, 800), "linkedin": random.randint(300, 900),
     "tiktok": random.randint(1500, 6000), "total": 0}
    for i in range(30)
]
for row in MOCK_ENGAGEMENT_SERIES:
    row["total"] = row["instagram"] + row["twitter"] + row["linkedin"] + row["tiktok"]

MOCK_FOLLOWER_SERIES = [
    {
        "date": days_ago(29 - i),
        "instagram": 23_400 + i * 50 + random.randint(-20, 80),
        "twitter": 10_800 + i * 20 + random.randint(-10, 40),
        "linkedin": 8_100 + i * 20 + random.randint(-5, 30),
        "tiktok": 48_000 + i * 210 + random.randint(-100, 400),
    }
    for i in range(30)
]

MOCK_PLATFORM_METRICS = [
    {"platform": "Instagram", "followers": 24_800, "follower_growth": 2.1,
     "impressions": 148_200, "reach": 92_400, "engagement_rate": 4.2, "posts_count": 12,
     "avg_likes": 1_040, "avg_comments": 88, "avg_shares": 34},
    {"platform": "Twitter/X", "followers": 11_200, "follower_growth": -0.4,
     "impressions": 68_900, "reach": 41_000, "engagement_rate": 2.1, "posts_count": 48,
     "avg_likes": 212, "avg_comments": 42, "avg_shares": 89},
    {"platform": "LinkedIn", "followers": 8_540, "follower_growth": 3.6,
     "impressions": 34_100, "reach": 22_800, "engagement_rate": 5.8, "posts_count": 8,
     "avg_likes": 384, "avg_comments": 56, "avg_shares": 72},
    {"platform": "TikTok", "followers": 52_100, "follower_growth": 8.2,
     "impressions": 284_000, "reach": 201_000, "engagement_rate": 9.4, "posts_count": 14,
     "avg_likes": 3_800, "avg_comments": 320, "avg_shares": 540},
    {"platform": "YouTube", "followers": 6_300, "follower_growth": 1.2,
     "impressions": 21_400, "reach": 14_800, "engagement_rate": 3.7, "posts_count": 3,
     "avg_likes": 280, "avg_comments": 38, "avg_shares": 22},
]

MOCK_DASHBOARD_SUMMARY = {
    "total_followers": 102_940,
    "followers_change_pct": 3.8,
    "total_reach": 372_000,
    "reach_change_pct": 12.4,
    "avg_engagement_rate": 5.0,
    "engagement_change_pct": 1.2,
    "posts_scheduled": 14,
    "posts_published_this_week": 23,
    "platforms_connected": 5,
    "ai_insights": [
        "Your TikTok is outperforming all other platforms — engagement rate 9.4% vs 4.2% average. Double down on short-form video.",
        "Instagram engagement dropped 18% vs last week. Your last 4 posts published after 9 PM. Your audience peaks 7–11 AM.",
        "LinkedIn posts with questions in the caption average 2.3× more comments. Your last 3 posts had no question.",
        "You have no content scheduled for Wednesday or Thursday this week — prime engagement windows for your audience.",
    ],
}

MOCK_POSTS = [
    {
        "id": f"post-{i}",
        "caption": cap,
        "hashtags": tags,
        "media_type": mtype,
        "status": status,
        "scheduled_at": (NOW + timedelta(hours=h)).isoformat() if status == "scheduled" else None,
        "published_at": (NOW - timedelta(days=d)).isoformat() if status == "published" else None,
        "ai_generated": ai,
        "predicted_engagement_score": score,
        "sentiment": sent,
        "total_impressions": imp,
        "total_engagements": eng,
        "content_roi_score": roi,
    }
    for i, (cap, tags, mtype, status, h, d, ai, score, sent, imp, eng, roi) in enumerate([
        ("Excited to announce our new product line! 🚀 Quality you can feel.", ["#newproduct", "#launch", "#brand"], "image", "published", 0, 2, True, 82, "positive", 14_200, 592, 7.4),
        ("What's your biggest challenge with social media growth? Drop it below 👇", ["#marketing", "#socialmedia", "#growthhacks"], "none", "published", 0, 5, False, 74, "positive", 8_400, 440, 5.2),
        ("Behind the scenes of our content shoot 🎬 Swipe to see the chaos!", ["#bts", "#contentcreator", "#brand"], "carousel", "published", 0, 8, False, 68, "neutral", 11_800, 380, 4.8),
        ("5 ways to boost your engagement rate in 2024 🔥 [Thread]", ["#socialmediatips", "#engagement", "#marketing"], "none", "scheduled", 6, 0, True, 88, "positive", 0, 0, None),
        ("Our team working late so you don't have to 💪", ["#teamwork", "#startup", "#hustle"], "image", "scheduled", 24, 0, False, 61, "positive", 0, 0, None),
        ("AI is changing everything. Here's how we're using it for content.", ["#AI", "#contentmarketing", "#innovation"], "video", "draft", 0, 0, True, 91, "positive", 0, 0, None),
    ])
]

MOCK_INBOX = [
    {"id": "msg-1", "platform": "instagram", "sender": "sarah_designs", "message": "Love your content! How much for a collab?", "priority": "opportunity", "sentiment": "positive", "time": "2m ago", "replied": False},
    {"id": "msg-2", "platform": "twitter", "sender": "angry_customer_99", "message": "Your product broke after 2 days. Terrible quality.", "priority": "urgent", "sentiment": "negative", "time": "14m ago", "replied": False},
    {"id": "msg-3", "platform": "linkedin", "sender": "john_investor", "message": "Interesting business model. Would love to connect.", "priority": "opportunity", "sentiment": "positive", "time": "1h ago", "replied": False},
    {"id": "msg-4", "platform": "instagram", "sender": "fan_account_22", "message": "How much does this cost?", "priority": "general", "sentiment": "neutral", "time": "2h ago", "replied": False},
    {"id": "msg-5", "platform": "tiktok", "sender": "creator_mike", "message": "Your video got me😂 follow for follow?", "priority": "spam", "sentiment": "neutral", "time": "3h ago", "replied": True},
]

MOCK_AUTOMATIONS = [
    {"id": "auto-1", "name": "Viral Boost", "description": "When a post hits 500 likes → repost to Facebook & LinkedIn", "trigger_type": "post_likes", "is_active": True, "run_count": 7, "last_run": "3 days ago"},
    {"id": "auto-2", "name": "Monday Motivation", "description": "Every Monday 9AM → AI-generate motivational post for all platforms", "trigger_type": "schedule", "is_active": True, "run_count": 12, "last_run": "2 days ago"},
    {"id": "auto-3", "name": "DM Pricing Reply", "description": "When DM contains 'how much' or 'price' → auto-reply with pricing link", "trigger_type": "comment_keyword", "is_active": True, "run_count": 48, "last_run": "1 hour ago"},
    {"id": "auto-4", "name": "Follower Drop Alert", "description": "When followers drop >2% in a week → send email alert", "trigger_type": "follower_drop", "is_active": False, "run_count": 2, "last_run": "3 weeks ago"},
]

MOCK_COMPETITORS = [
    {"id": "comp-1", "name": "CompetitorA", "platform": "instagram", "handle": "@competitora", "followers": 38_200, "posts_per_week": 5.2, "avg_engagement": 3.1, "follower_growth_pct": 1.4},
    {"id": "comp-2", "name": "CompetitorB", "platform": "tiktok", "handle": "@competitorb", "followers": 89_000, "posts_per_week": 12.0, "avg_engagement": 7.8, "follower_growth_pct": 6.2},
    {"id": "comp-3", "name": "CompetitorC", "platform": "linkedin", "handle": "competitor-c", "followers": 14_100, "posts_per_week": 3.5, "avg_engagement": 4.9, "follower_growth_pct": 2.8},
]

HEATMAP_DATA = [
    {"day": day, "hour": hour, "value": random.randint(10, 100)}
    for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for hour in range(24)
]
# Spike activity 7-11 AM and 7-9 PM
for row in HEATMAP_DATA:
    if 7 <= row["hour"] <= 11:
        row["value"] = min(100, row["value"] + 40)
    if 19 <= row["hour"] <= 21:
        row["value"] = min(100, row["value"] + 30)
