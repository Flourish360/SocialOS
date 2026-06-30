from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..api.deps import get_current_user
from ..db.database import get_db
from ..models.user import User
from ..models.social_account import SocialAccount
from ..schemas.post import AIGenerateRequest, AIRewriteRequest, HashtagSuggestRequest
from ..core.config import settings

router = APIRouter(prefix="/ai", tags=["ai"])

PLATFORM_CHAR_LIMITS = {
    "twitter": 280, "linkedin": 3000, "instagram": 2200,
    "tiktok": 2200, "facebook": 63206, "threads": 500, "youtube": 5000,
}

MOCK_CAPTIONS = {
    "professional": "We're thrilled to share our latest innovation with you. After months of research and development, we've created something that truly makes a difference. Learn more and be among the first to experience it.",
    "casual": "Okay so we've been working on something super exciting and we can finally share it 👀 This is genuinely one of our favorite things we've ever made. Check it out!",
    "humorous": "We locked our team in a room for 3 months. No windows. Questionable snacks. The result? Possibly the best thing we've ever made. Judge for yourself 😅",
    "inspirational": "Every great product starts with a single question: what would make someone's day a little better? We asked that question. We answered it. This is the result.",
}

MOCK_HASHTAGS = {
    "instagram": ["#brand", "#newlaunch", "#innovation", "#productlaunch", "#entrepreneur", "#startup", "#marketing", "#business", "#growth", "#content"],
    "tiktok": ["#fyp", "#viral", "#trending", "#brand", "#newproduct", "#smallbusiness", "#entrepreneurlife", "#contentcreator", "#foryou", "#business"],
    "linkedin": ["#innovation", "#leadership", "#entrepreneurship", "#startup", "#marketing", "#business", "#growth", "#technology", "#productlaunch", "#futureofwork"],
    "twitter": ["#startup", "#marketing", "#launch", "#innovation", "#tech", "#business", "#growth", "#entrepreneur", "#brand", "#product"],
}

MOCK_CHAT_RESPONSES = [
    "Your engagement rate is trending up 12% this week - your Wednesday carousel post is leading the pack. Consider doubling down on that format.",
    "Based on your audience data, posting at 6 PM on weekdays gives you ~40% more reach. Your peak engagement window is Tuesday-Thursday.",
    "Your top-performing content type is educational carousels, averaging 6.8% engagement vs 2.4% for static images. Try more of those!",
    "TikTok is your fastest-growing platform (+8.2% last month). Your videos under 30 seconds perform 3x better than longer ones.",
    "I'd suggest focusing on Instagram Reels and TikTok for reach, LinkedIn for B2B leads, and Twitter/X for community building and real-time engagement.",
]

MODEL = "claude-opus-4-8"


def _claude_client():
    if settings.ANTHROPIC_API_KEY:
        import anthropic
        return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return None


def _safe_claude_call(fn):
    """Run a Claude API call, returning None on any error so callers fall back to mock."""
    try:
        return fn()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Claude API call failed: %s", e)
        return None


def _text(response) -> str:
    """Extract text content from a Claude message response."""
    for block in response.content:
        if block.type == "text":
            return block.text.strip()
    return ""


@router.post("/chat")
def ai_chat(body: dict, current_user: User = Depends(get_current_user)):
    message = body.get("message", "")
    history = body.get("history", [])

    client = _claude_client()
    if client:
        messages = [
            *[{"role": m["role"], "content": m["content"]} for m in history[-10:]],
            {"role": "user", "content": message},
        ]
        resp = _safe_claude_call(lambda: client.messages.create(
            model=MODEL,
            max_tokens=300,
            system=(
                "You are SocialOS AI, an expert social media strategist and content creator. "
                "Help users grow their brand, craft viral content, analyze metrics, and manage their social presence. "
                "Be concise, specific, and actionable. Use data when you can. Keep replies under 150 words unless asked for more."
            ),
            messages=messages,
        ))
        if resp:
            return {"reply": _text(resp), "model": MODEL}

    import random
    return {"reply": random.choice(MOCK_CHAT_RESPONSES), "model": "mock"}


@router.post("/generate-caption")
def generate_caption(body: AIGenerateRequest, current_user: User = Depends(get_current_user)):
    limit = PLATFORM_CHAR_LIMITS.get(body.platform, 2200)
    client = _claude_client()

    if client:
        resp = _safe_claude_call(lambda: client.messages.create(
            model=MODEL,
            max_tokens=500,
            system=(
                f"You are an expert social media copywriter. Write a {body.tone} caption for {body.platform}. "
                f"Keep it within {limit} characters. Return only the caption text - no quotes, no label, no explanation."
            ),
            messages=[{"role": "user", "content": f"Write a caption about: {body.topic}"}],
        ))
        if resp:
            caption = _text(resp)
            hashtags = []
            if body.include_hashtags:
                h_resp = _safe_claude_call(lambda: client.messages.create(
                    model=MODEL,
                    max_tokens=100,
                    system=f"Generate 10 relevant hashtags for {body.platform}. Return only hashtags separated by spaces, nothing else.",
                    messages=[{"role": "user", "content": caption}],
                ))
                hashtags = _text(h_resp).split() if h_resp else []
            return {
                "caption": caption,
                "hashtags": hashtags,
                "char_count": len(caption),
                "char_limit": limit,
                "sentiment": "positive",
                "readability_score": 82,
                "predicted_engagement_score": 86,
                "ai_model": MODEL,
            }

    caption = MOCK_CAPTIONS.get(body.tone, MOCK_CAPTIONS["casual"])
    hashtags = MOCK_HASHTAGS.get(body.platform, MOCK_HASHTAGS["instagram"])[:10]
    return {
        "caption": caption,
        "hashtags": hashtags if body.include_hashtags else [],
        "char_count": len(caption),
        "char_limit": limit,
        "sentiment": "positive",
        "readability_score": 72,
        "predicted_engagement_score": 78,
        "ai_model": "mock",
    }


@router.post("/rewrite")
def rewrite_text(body: AIRewriteRequest, current_user: User = Depends(get_current_user)):
    client = _claude_client()

    if client:
        limit = PLATFORM_CHAR_LIMITS.get(body.target_platform, 2200)
        resp = _safe_claude_call(lambda: client.messages.create(
            model=MODEL,
            max_tokens=500,
            system=(
                f"Rewrite the following text for {body.target_platform} in a {body.tone} tone. "
                f"Keep it under {limit} characters. Use platform-native conventions (e.g., threads for LinkedIn, "
                "hooks for TikTok, brevity for Twitter). Return only the rewritten text."
            ),
            messages=[{"role": "user", "content": body.text}],
        ))
        if resp:
            rewritten = _text(resp)
            return {"original": body.text, "rewritten": rewritten, "platform": body.target_platform, "tone": body.tone, "char_count": len(rewritten)}

    platform_styles = {
        "twitter": f"{body.text[:240]}... [adapted for Twitter/X - concise, punchy]",
        "linkedin": f"I've been thinking about this a lot lately.\n\n{body.text}\n\nWhat's your take? Let me know in the comments 👇",
        "instagram": f"{body.text} ✨\n\nDouble tap if you agree! 👇",
        "tiktok": f"POV: {body.text[:100]}... #fyp",
    }
    rewritten = platform_styles.get(body.target_platform, body.text)
    return {"original": body.text, "rewritten": rewritten, "platform": body.target_platform, "tone": body.tone, "char_count": len(rewritten)}


@router.post("/hashtags")
def suggest_hashtags(body: HashtagSuggestRequest, current_user: User = Depends(get_current_user)):
    client = _claude_client()

    if client:
        resp = _safe_claude_call(lambda: client.messages.create(
            model=MODEL,
            max_tokens=150,
            system=f"Generate {body.count} relevant hashtags for {body.platform} based on the caption. Return only hashtags separated by spaces.",
            messages=[{"role": "user", "content": body.caption}],
        ))
        if resp:
            all_tags = _text(resp).split()
            return {
                "hashtags": all_tags[:body.count],
                "trending": all_tags[:3],
                "niche": all_tags[3:7],
                "evergreen": all_tags[7:],
                "platform": body.platform,
            }

    base = MOCK_HASHTAGS.get(body.platform, MOCK_HASHTAGS["instagram"])
    return {"hashtags": base[:body.count], "trending": base[:3], "niche": base[3:7], "evergreen": base[7:], "platform": body.platform}


DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _hour_label(hour: int) -> str:
    period = "AM" if hour < 12 else "PM"
    display_hour = hour % 12 or 12
    return f"{display_hour}:00 {period}"


def _score_label(score: int) -> str:
    if score >= 90:
        return "Peak"
    if score >= 80:
        return "High"
    return "Good"


@router.get("/best-time")
def best_time(
    platform: str = "instagram",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if platform == "instagram":
        account = db.query(SocialAccount).filter(
            SocialAccount.user_id == current_user.id,
            SocialAccount.platform == "instagram",
            SocialAccount.is_connected == True,
        ).first()

        if account and account.access_token and account.platform_user_id:
            from ..models.audience_snapshot import AudienceSnapshot
            from datetime import datetime, timezone

            snapshots = db.query(AudienceSnapshot).filter(
                AudienceSnapshot.account_id == account.id,
            ).all()

            if snapshots:
                # Real weekly pattern, averaged from accumulated daily captures.
                sums: dict[tuple[int, int], float] = {}
                counts: dict[tuple[int, int], int] = {}
                for snap in snapshots:
                    for hour_str, value in (snap.hourly_counts or {}).items():
                        key = (snap.day_of_week, int(hour_str))
                        sums[key] = sums.get(key, 0) + int(value)
                        counts[key] = counts.get(key, 0) + 1
                averages = {k: sums[k] / counts[k] for k in sums}
                top = sorted(averages.items(), key=lambda kv: kv[1], reverse=True)[:3]
                if top and top[0][1] > 0:
                    max_val = top[0][1]
                    windows = [
                        {
                            "day": DAY_NAMES[day],
                            "time": _hour_label(hour),
                            "score": (score := round(min(99, 60 + (avg / max_val) * 39))),
                            "label": _score_label(score),
                        }
                        for (day, hour), avg in top
                    ]
                    return {
                        "platform": "instagram", "windows": windows,
                        "next_optimal": f"{windows[0]['day']} at {windows[0]['time']}",
                        "timezone": "UTC", "source": "real",
                        "data_points": len(snapshots),
                    }

            # No accumulated weekly history yet — fall back to today's live
            # online-follower curve so the data is still real, just not weekly.
            from ..services.instagram_sync import fetch_online_followers
            hourly = fetch_online_followers(account.access_token, account.platform_user_id)
            if hourly:
                top = sorted(hourly.items(), key=lambda kv: int(kv[1]), reverse=True)[:3]
                max_val = int(top[0][1]) if top else 0
                if max_val > 0:
                    today = DAY_NAMES[datetime.now(timezone.utc).weekday()]
                    windows = [
                        {
                            "day": today,
                            "time": _hour_label(int(hour_str)),
                            "score": (score := round(min(99, 60 + (int(value) / max_val) * 39))),
                            "label": _score_label(score),
                        }
                        for hour_str, value in top
                    ]
                    return {
                        "platform": "instagram", "windows": windows,
                        "next_optimal": f"Today at {windows[0]['time']}",
                        "timezone": "UTC", "source": "real_today",
                        "data_points": 1,
                    }

    # Fallback: industry-benchmark windows — used when there's no connected account
    # yet, or the platform's API doesn't expose audience activity data (Twitter,
    # TikTok, and LinkedIn don't offer this on standard developer access tiers as of 2026).
    WINDOWS = {
        "instagram": [
            {"day": "Monday", "time": "11:00 AM", "score": 85, "label": "High"},
            {"day": "Wednesday", "time": "3:00 PM", "score": 94, "label": "Peak"},
            {"day": "Friday", "time": "10:00 AM", "score": 88, "label": "High"},
        ],
        "twitter": [
            {"day": "Tuesday", "time": "9:00 AM", "score": 91, "label": "Peak"},
            {"day": "Thursday", "time": "12:00 PM", "score": 87, "label": "High"},
            {"day": "Saturday", "time": "8:00 PM", "score": 82, "label": "Good"},
        ],
        "linkedin": [
            {"day": "Tuesday", "time": "8:00 AM", "score": 93, "label": "Peak"},
            {"day": "Wednesday", "time": "12:00 PM", "score": 89, "label": "High"},
            {"day": "Thursday", "time": "5:00 PM", "score": 85, "label": "High"},
        ],
        "tiktok": [
            {"day": "Tuesday", "time": "7:00 PM", "score": 96, "label": "Peak"},
            {"day": "Thursday", "time": "9:00 PM", "score": 92, "label": "Peak"},
            {"day": "Saturday", "time": "11:00 AM", "score": 88, "label": "High"},
        ],
        "facebook": [
            {"day": "Wednesday", "time": "1:00 PM", "score": 86, "label": "High"},
            {"day": "Friday", "time": "3:00 PM", "score": 84, "label": "High"},
            {"day": "Sunday", "time": "12:00 PM", "score": 82, "label": "Good"},
        ],
    }
    windows = WINDOWS.get(platform, WINDOWS["instagram"])
    return {
        "platform": platform, "windows": windows,
        "next_optimal": f"Today at {windows[0]['time']}",
        "timezone": "Africa/Lagos", "source": "benchmark",
    }


@router.post("/captions")
def generate_captions(body: dict, current_user: User = Depends(get_current_user)):
    topic = body.get("topic", "our latest product")
    tone = body.get("tone", "casual")
    platform = body.get("platform", "instagram")
    client = _claude_client()

    if client:
        resp = _safe_claude_call(lambda: client.messages.create(
            model=MODEL,
            max_tokens=600,
            system=(
                f"You are an expert social media copywriter for {platform}. "
                f"Generate 3 distinct {tone} captions about the given topic. "
                "Each caption should be different in angle and structure. "
                'Return a JSON object with key "captions" containing an array of 3 strings. No other keys.'
            ),
            messages=[{"role": "user", "content": f"Topic: {topic}"}],
        ))
        if resp:
            import json
            try:
                text = _text(resp)
                # Strip markdown code fences if present
                if text.startswith("```"):
                    text = text.split("```")[1]
                    if text.startswith("json"):
                        text = text[4:]
                data = json.loads(text.strip())
                captions = data.get("captions", [])
                return {"captions": captions, "topic": topic, "tone": tone, "platform": platform, "ai_model": MODEL}
            except Exception:
                pass

    TEMPLATES = {
        "casual": [
            f"Okay so {topic} is literally changing the game and I can't stop thinking about it 🔥 Drop a comment if you're feeling this too!",
            f"Not gonna lie - {topic} just became my new obsession 👀 Who else?? Repost if you agree!",
            f"We need to talk about {topic} because nobody is talking about this enough fr fr 🙌",
        ],
        "professional": [
            f"Excited to share our latest insights on {topic}. This is reshaping how we approach growth - read more in the link below.",
            f"At its core, {topic} is about creating real value. Here's how we're thinking about it and what it means for the industry.",
            f"We've spent months researching {topic}. The findings are clear: teams that embrace this see 3x faster results.",
        ],
        "funny": [
            f"Me explaining {topic} to my team at 9 AM on a Monday: 👉 [insert chaos] 😅 But honestly? Worth it.",
            f"Nobody: \nAbsolutely nobody: \nUs: let's do a whole thing about {topic} 🙃 And we regret nothing.",
            f"Hot take: {topic} is just adulting with extra steps. Change my mind. 💀",
        ],
        "inspirational": [
            f"Every big journey starts with a single step. For us, that step was {topic}. What's yours? ✨",
            f"The world changes when people stop waiting and start doing. {topic} is our way of doing. What's yours?",
            f"We didn't set out to be different. We set out to be better. That's what {topic} means to us - and it starts today. 🚀",
        ],
        "educational": [
            f"Did you know? {topic} can increase your results by up to 40%. Here's the 3-step framework we use 🧵 [Thread]",
            f"Most people get {topic} wrong. Here's what the data actually shows - and how to use it to your advantage.",
            f"Breaking down {topic} so it actually makes sense: Step 1: understand the basics. Step 2: apply consistently. Step 3: measure and iterate. Save this!",
        ],
    }

    captions = TEMPLATES.get(tone, TEMPLATES["casual"])
    platform_suffix = {
        "instagram": "\n\n#content #socialmedia #growth",
        "twitter": "",
        "linkedin": "\n\nFollow for more insights.",
        "tiktok": " #fyp #viral #trending",
        "facebook": "",
    }.get(platform, "")

    return {"captions": [c + platform_suffix for c in captions], "topic": topic, "tone": tone, "platform": platform, "ai_model": "mock"}


@router.post("/analyze-sentiment")
def analyze_sentiment(body: dict, current_user: User = Depends(get_current_user)):
    text = body.get("text", "")
    client = _claude_client()

    if client:
        resp = _safe_claude_call(lambda: client.messages.create(
            model=MODEL,
            max_tokens=80,
            system='Analyze the sentiment of the text. Return a JSON object with keys: sentiment (positive/neutral/negative), score (-1.0 to 1.0), confidence (0.0 to 1.0). Return only the JSON, no explanation.',
            messages=[{"role": "user", "content": text}],
        ))
        if resp:
            import json
            try:
                raw = _text(resp)
                if raw.startswith("```"):
                    raw = raw.split("```")[1]
                    if raw.startswith("json"):
                        raw = raw[4:]
                data = json.loads(raw.strip())
                return {**data, "text_length": len(text), "ai_model": MODEL}
            except Exception:
                pass

    positive_words = ["excited", "love", "amazing", "great", "best", "happy", "thrilled", "fantastic", "excellent"]
    negative_words = ["bad", "terrible", "hate", "awful", "worst", "disappointed", "poor", "fail"]
    score = sum(1 for w in positive_words if w in text.lower()) - sum(1 for w in negative_words if w in text.lower())
    sentiment = "positive" if score > 0 else ("negative" if score < 0 else "neutral")
    return {"sentiment": sentiment, "score": min(max(score * 0.3, -1.0), 1.0), "confidence": 0.7, "text_length": len(text), "ai_model": "mock"}
