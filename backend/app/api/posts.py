from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..api.deps import get_current_user
from ..db.database import get_db
from ..models.user import User
from ..models.post import Post
from ..models.social_account import SocialAccount
from ..schemas.post import PostCreate, PostUpdate
from ..mock.data import MOCK_POSTS
from ..core.config import settings
from ..services.publishers import publish_to_instagram, publish_to_twitter, publish_to_tiktok, fetch_instagram_insights
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import uuid, random

router = APIRouter(prefix="/posts", tags=["posts"])


def _post_to_dict(p: Post) -> dict:
    return {
        "id": p.id,
        "caption": p.caption,
        "hashtags": p.hashtags or [],
        "media_urls": p.media_urls or [],
        "media_type": p.media_type,
        "status": p.status,
        "scheduled_at": p.scheduled_at.isoformat() if p.scheduled_at else None,
        "published_at": p.published_at.isoformat() if p.published_at else None,
        "ai_generated": p.ai_generated,
        "predicted_engagement_score": p.predicted_engagement_score,
        "sentiment": p.sentiment,
        "total_impressions": p.total_impressions,
        "total_engagements": p.total_engagements,
        "content_roi_score": p.content_roi_score,
        "platform_account_ids": p.platform_account_ids or [],
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


@router.get("")
def list_posts(
    status: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.USE_MOCK_DATA:
        posts = MOCK_POSTS
        if status:
            posts = [p for p in posts if p["status"] == status]
        return posts

    query = db.query(Post).filter(Post.user_id == current_user.id)
    if status:
        query = query.filter(Post.status == status)
    return [_post_to_dict(p) for p in query.order_by(Post.created_at.desc()).all()]


@router.get("/{post_id}/analytics")
def post_analytics(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Try real Instagram insights first
    if not settings.USE_MOCK_DATA:
        post = db.query(Post).filter(Post.id == post_id, Post.user_id == current_user.id).first()
        if post and post.platform_post_ids and post.platform_post_ids.get("instagram"):
            ig_account = db.query(SocialAccount).filter(
                SocialAccount.user_id == current_user.id,
                SocialAccount.platform == "instagram",
                SocialAccount.is_connected == True,
            ).first()
            if ig_account and ig_account.access_token:
                ig_post_id = post.platform_post_ids["instagram"]
                ins = fetch_instagram_insights(
                    access_token=ig_account.access_token,
                    media_id=ig_post_id,
                    media_type=post.media_type or "image",
                )
                impressions = ins["impressions"]
                reach = ins["reach"]
                likes = ins["likes"]
                comments = ins["comments"]
                saves = ins["saves"]
                shares = ins["shares"]
                eng_rate = round(((likes + comments + saves + shares) / max(reach, 1)) * 100, 2)
                return {
                    "post_id": post_id,
                    "impressions": impressions,
                    "reach": reach,
                    "likes": likes,
                    "comments": comments,
                    "saves": saves,
                    "shares": shares,
                    "engagement_rate": eng_rate,
                    "daily_series": [],
                    "platform_split": [{"platform": "instagram", "pct": 100, "impressions": impressions}],
                    "top_country": "—",
                    "top_age_group": "—",
                    "profile_visits": 0,
                    "link_clicks": 0,
                    "real": True,
                    "source": "instagram_graph_api",
                    "platform_post_id": ig_post_id,
                }

    # Fallback to mock for unpublished posts or posts without Instagram ID
    rng = random.Random(sum(ord(c) for c in post_id))
    impressions = rng.randint(1200, 45000)
    reach = int(impressions * rng.uniform(0.55, 0.85))
    likes = int(impressions * rng.uniform(0.03, 0.12))
    comments = int(likes * rng.uniform(0.05, 0.2))
    saves = int(likes * rng.uniform(0.1, 0.4))
    shares = int(likes * rng.uniform(0.05, 0.25))
    eng_rate = round((likes + comments + saves + shares) / max(reach, 1) * 100, 2)
    daily = []
    base = impressions // 7
    for i in range(7):
        day_impr = int(base * (1.8 if i == 0 else 1.3 if i == 1 else rng.uniform(0.5, 1.0)))
        daily.append({"day": f"Day {i+1}", "impressions": day_impr, "engagements": int(day_impr * rng.uniform(0.04, 0.12))})
    platforms = ["instagram", "twitter", "linkedin"]
    platform_split = []
    remaining = 100
    for j, p in enumerate(platforms):
        pct = rng.randint(20, 50) if j < len(platforms) - 1 else remaining
        remaining -= pct
        platform_split.append({"platform": p, "pct": max(pct, 0), "impressions": int(impressions * pct / 100)})
    return {
        "post_id": post_id,
        "impressions": impressions,
        "reach": reach,
        "likes": likes,
        "comments": comments,
        "saves": saves,
        "shares": shares,
        "engagement_rate": eng_rate,
        "daily_series": daily,
        "platform_split": platform_split,
        "top_country": "Nigeria",
        "top_age_group": "25–34",
        "profile_visits": int(impressions * rng.uniform(0.02, 0.08)),
        "link_clicks": int(impressions * rng.uniform(0.01, 0.05)),
    }


@router.get("/{post_id}")
def get_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.USE_MOCK_DATA:
        for p in MOCK_POSTS:
            if p["id"] == post_id:
                return p
        raise HTTPException(status_code=404, detail="Not found")

    post = db.query(Post).filter(Post.id == post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Not found")
    return _post_to_dict(post)


@router.post("", status_code=201)
def create_post(
    body: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.USE_MOCK_DATA:
        new_post = {
            "id": f"post-{uuid.uuid4().hex[:8]}",
            "caption": body.caption,
            "hashtags": body.hashtags,
            "media_urls": body.media_urls,
            "media_type": body.media_type,
            "status": "scheduled" if body.scheduled_at else "draft",
            "scheduled_at": body.scheduled_at.isoformat() if body.scheduled_at else None,
            "published_at": None,
            "ai_generated": False,
            "predicted_engagement_score": random.randint(60, 95),
            "sentiment": "positive",
            "total_impressions": 0,
            "total_engagements": 0,
            "content_roi_score": None,
            "platform_account_ids": body.platform_account_ids,
        }
        MOCK_POSTS.append(new_post)
        return new_post

    media_urls = body.media_urls or ([body.media_url] if body.media_url else [])
    full_caption = body.caption + ("\n\n" + " ".join(body.hashtags) if body.hashtags else "")
    # Auto-detect carousel if multiple images given
    effective_type = body.media_type
    if effective_type == "image" and len(media_urls) > 1:
        effective_type = "carousel"

    publish_results: list[dict] = []
    platform_post_ids: dict[str, str] = {}
    if not body.scheduled_at:
        def _publish_one(platform: str) -> dict:
            account = db.query(SocialAccount).filter(
                SocialAccount.user_id == current_user.id,
                SocialAccount.platform == platform,
                SocialAccount.is_connected == True,
            ).first()
            if not account or not account.access_token:
                return {"platform": platform, "success": False, "error": "Not connected"}
            if platform == "instagram":
                return {"platform": platform, **publish_to_instagram(
                    access_token=account.access_token,
                    ig_user_id=account.platform_user_id,
                    caption=full_caption,
                    media_urls=media_urls,
                    media_type=effective_type,
                )}
            if platform == "twitter":
                return {"platform": platform, **publish_to_twitter(
                    access_token=account.access_token,
                    caption=full_caption,
                    media_urls=media_urls,
                )}
            if platform == "tiktok":
                return {"platform": platform, **publish_to_tiktok(
                    access_token=account.access_token,
                    caption=full_caption,
                    media_urls=media_urls,
                )}
            return {"platform": platform, "success": False, "error": f"{platform} publishing not implemented yet"}

        with ThreadPoolExecutor() as pool:
            futures = {pool.submit(_publish_one, p): p for p in body.platform_account_ids}
            for future in as_completed(futures):
                result = future.result()
                publish_results.append(result)
                if result.get("success") and result.get("post_id"):
                    platform_post_ids[result["platform"]] = result["post_id"]

    any_success = any(r["success"] for r in publish_results)
    status = "scheduled" if body.scheduled_at else ("published" if any_success else "failed")

    post = Post(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        caption=body.caption,
        hashtags=body.hashtags,
        media_urls=media_urls,
        media_type=effective_type,
        status=status,
        scheduled_at=body.scheduled_at,
        published_at=datetime.utcnow() if any_success else None,
        platform_account_ids=body.platform_account_ids,
        platform_post_ids=platform_post_ids,
        ai_generated=False,
        predicted_engagement_score=random.randint(60, 95),
        sentiment="positive",
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    response = _post_to_dict(post)
    response["publish_results"] = publish_results
    return response


@router.post("/{post_id}/retry")
def retry_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Re-attempt publishing a failed post."""
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    full_caption = post.caption + ("\n\n" + " ".join(post.hashtags) if post.hashtags else "")

    def _retry_one(platform: str) -> dict:
        account = db.query(SocialAccount).filter(
            SocialAccount.user_id == current_user.id,
            SocialAccount.platform == platform,
            SocialAccount.is_connected == True,
        ).first()
        if not account or not account.access_token:
            return {"platform": platform, "success": False, "error": "Not connected"}
        if platform == "instagram":
            return {"platform": platform, **publish_to_instagram(
                access_token=account.access_token,
                ig_user_id=account.platform_user_id,
                caption=full_caption,
                media_urls=post.media_urls or [],
                media_type=post.media_type or "image",
            )}
        if platform == "twitter":
            return {"platform": platform, **publish_to_twitter(
                access_token=account.access_token,
                caption=full_caption,
                media_urls=post.media_urls or [],
            )}
        if platform == "tiktok":
            return {"platform": platform, **publish_to_tiktok(
                access_token=account.access_token,
                caption=full_caption,
                media_urls=post.media_urls or [],
            )}
        return {"platform": platform, "success": False, "error": f"{platform} publishing not implemented yet"}

    publish_results: list[dict] = []
    with ThreadPoolExecutor() as pool:
        futures = {pool.submit(_retry_one, p): p for p in (post.platform_account_ids or [])}
        for future in as_completed(futures):
            result = future.result()
            publish_results.append(result)
            if result.get("success") and result.get("post_id"):
                ids = dict(post.platform_post_ids or {})
                ids[result["platform"]] = result["post_id"]
                post.platform_post_ids = ids

    any_success = any(r["success"] for r in publish_results)
    post.status = "published" if any_success else "failed"
    if any_success:
        post.published_at = datetime.utcnow()
    db.commit()
    db.refresh(post)

    response = _post_to_dict(post)
    response["publish_results"] = publish_results
    return response


@router.post("/queue", status_code=201)
def add_to_queue(
    body: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    slots = ["9:00 AM", "12:00 PM", "3:00 PM", "6:00 PM", "9:00 PM"]
    if settings.USE_MOCK_DATA:
        queued = [p for p in MOCK_POSTS if p.get("status") == "queued"]
        slot = slots[len(queued) % len(slots)]
        new_post = {
            "id": f"q-{uuid.uuid4().hex[:8]}",
            "caption": body.caption,
            "hashtags": body.hashtags,
            "media_urls": body.media_urls or [],
            "media_type": body.media_type,
            "status": "queued",
            "scheduled_at": None,
            "queue_slot": slot,
            "queue_position": len(queued) + 1,
            "published_at": None,
            "ai_generated": False,
            "predicted_engagement_score": random.randint(60, 95),
            "sentiment": "positive",
            "total_impressions": 0,
            "total_engagements": 0,
            "platform_account_ids": body.platform_account_ids,
        }
        MOCK_POSTS.append(new_post)
        return new_post

    queued_count = db.query(Post).filter(Post.user_id == current_user.id, Post.status == "queued").count()
    slot = slots[queued_count % len(slots)]
    post = Post(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        caption=body.caption,
        hashtags=body.hashtags,
        media_urls=body.media_urls or [],
        media_type=body.media_type,
        status="queued",
        platform_account_ids=body.platform_account_ids,
        ai_generated=False,
        predicted_engagement_score=random.randint(60, 95),
        sentiment="positive",
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    result = _post_to_dict(post)
    result["queue_slot"] = slot
    result["queue_position"] = queued_count + 1
    return result


@router.patch("/{post_id}")
def update_post(
    post_id: str,
    body: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.USE_MOCK_DATA:
        for p in MOCK_POSTS:
            if p["id"] == post_id:
                if body.caption is not None:
                    p["caption"] = body.caption
                if body.status is not None:
                    p["status"] = body.status
                return p
        raise HTTPException(status_code=404, detail="Not found")

    post = db.query(Post).filter(Post.id == post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Not found")
    if body.caption is not None:
        post.caption = body.caption
    if body.status is not None:
        post.status = body.status
    if body.scheduled_at is not None:
        post.scheduled_at = body.scheduled_at
    db.commit()
    db.refresh(post)
    return _post_to_dict(post)


@router.delete("/{post_id}")
def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete from SocialOS. Note: Instagram Graph API does NOT support deleting
    published posts — users must delete those manually in the Instagram app."""
    if settings.USE_MOCK_DATA:
        global MOCK_POSTS
        MOCK_POSTS = [p for p in MOCK_POSTS if p["id"] != post_id]
        return {"deleted": True, "note": "Removed from SocialOS only — mock mode"}

    post = db.query(Post).filter(Post.id == post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    was_published_to_instagram = bool(post.platform_post_ids and post.platform_post_ids.get("instagram"))
    db.delete(post)
    db.commit()

    note = None
    if was_published_to_instagram:
        note = "Removed from SocialOS. Instagram does not allow deleting published posts via API — delete it manually in the Instagram app if needed."
    return {"deleted": True, "id": post_id, "note": note}
