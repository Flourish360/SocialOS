from fastapi import APIRouter, Depends
from ..api.deps import get_current_user
from ..models.user import User
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


@router.post("/generate-caption")
def generate_caption(body: AIGenerateRequest, current_user: User = Depends(get_current_user)):
    if settings.OPENAI_API_KEY:
        # TODO: call OpenAI GPT-4o
        pass

    caption = MOCK_CAPTIONS.get(body.tone, MOCK_CAPTIONS["casual"])
    limit = PLATFORM_CHAR_LIMITS.get(body.platform, 2200)
    hashtags = MOCK_HASHTAGS.get(body.platform, MOCK_HASHTAGS["instagram"])[:body.count if hasattr(body, "count") else 10]

    return {
        "caption": caption,
        "hashtags": hashtags if body.include_hashtags else [],
        "char_count": len(caption),
        "char_limit": limit,
        "sentiment": "positive",
        "readability_score": 72,
        "predicted_engagement_score": 78,
        "ai_model": "mock" if not settings.OPENAI_API_KEY else "gpt-4o",
    }


@router.post("/rewrite")
def rewrite_text(body: AIRewriteRequest, current_user: User = Depends(get_current_user)):
    if settings.OPENAI_API_KEY:
        pass

    platform_styles = {
        "twitter": f"{body.text[:240]}... [adapted for Twitter/X — concise, punchy]",
        "linkedin": f"I've been thinking about this a lot lately.\n\n{body.text}\n\nWhat's your take? Let me know in the comments 👇",
        "instagram": f"{body.text} ✨\n\nDouble tap if you agree! 👇",
        "tiktok": f"POV: {body.text[:100]}... #fyp",
    }

    rewritten = platform_styles.get(body.target_platform, body.text)
    return {
        "original": body.text,
        "rewritten": rewritten,
        "platform": body.target_platform,
        "tone": body.tone,
        "char_count": len(rewritten),
    }


@router.post("/hashtags")
def suggest_hashtags(body: HashtagSuggestRequest, current_user: User = Depends(get_current_user)):
    base = MOCK_HASHTAGS.get(body.platform, MOCK_HASHTAGS["instagram"])
    return {
        "hashtags": base[:body.count],
        "trending": base[:3],
        "niche": base[3:7],
        "evergreen": base[7:],
        "platform": body.platform,
    }


@router.get("/best-time")
def best_time(platform: str = "instagram", current_user: User = Depends(get_current_user)):
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
        "platform": platform,
        "windows": windows,
        "next_optimal": f"Today at {windows[0]['time']}",
        "timezone": "Africa/Lagos",
    }


@router.post("/captions")
def generate_captions(body: dict, current_user: User = Depends(get_current_user)):
    topic = body.get("topic", "our latest product")
    tone = body.get("tone", "casual")
    platform = body.get("platform", "instagram")

    TEMPLATES = {
        "casual": [
            f"Okay so {topic} is literally changing the game and I can't stop thinking about it 🔥 Drop a comment if you're feeling this too!",
            f"Not gonna lie — {topic} just became my new obsession 👀 Who else?? Repost if you agree!",
            f"We need to talk about {topic} because nobody is talking about this enough fr fr 🙌",
        ],
        "professional": [
            f"Excited to share our latest insights on {topic}. This is reshaping how we approach growth — read more in the link below.",
            f"At its core, {topic} is about creating real value. Here's how we're thinking about it and what it means for the industry.",
            f"We've spent months researching {topic}. The findings are clear: teams that embrace this see 3× faster results.",
        ],
        "funny": [
            f"Me explaining {topic} to my team at 9 AM on a Monday: 👉 [insert chaos] 😅 But honestly? Worth it.",
            f"Nobody: \nAbsolutely nobody: \nUs: let's do a whole thing about {topic} 🙃 And we regret nothing.",
            f"Hot take: {topic} is just adulting with extra steps. Change my mind. 💀",
        ],
        "inspirational": [
            f"Every big journey starts with a single step. For us, that step was {topic}. What's yours? ✨",
            f"The world changes when people stop waiting and start doing. {topic} is our way of doing. What's yours?",
            f"We didn't set out to be different. We set out to be better. That's what {topic} means to us — and it starts today. 🚀",
        ],
        "educational": [
            f"Did you know? {topic} can increase your results by up to 40%. Here's the 3-step framework we use 🧵 [Thread]",
            f"Most people get {topic} wrong. Here's what the data actually shows — and how to use it to your advantage.",
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

    return {
        "captions": [c + platform_suffix for c in captions],
        "topic": topic,
        "tone": tone,
        "platform": platform,
    }


@router.post("/analyze-sentiment")
def analyze_sentiment(body: dict, current_user: User = Depends(get_current_user)):
    text = body.get("text", "")
    positive_words = ["excited", "love", "amazing", "great", "best", "happy", "thrilled"]
    negative_words = ["bad", "terrible", "hate", "awful", "worst", "disappointed"]
    score = sum(1 for w in positive_words if w in text.lower()) - sum(1 for w in negative_words if w in text.lower())
    sentiment = "positive" if score > 0 else ("negative" if score < 0 else "neutral")
    return {"sentiment": sentiment, "score": score, "text_length": len(text)}
