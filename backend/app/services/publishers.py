"""Platform-specific post publishers."""
import httpx
import logging
import time
import urllib.parse
from urllib.parse import urlsplit
from ..core.config import settings

log = logging.getLogger(__name__)

IG_API = "https://graph.instagram.com/v21.0"
BACKEND_BASE = "https://socialos-production-1712.up.railway.app"


def _cloudinary_ready() -> bool:
    return bool(settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET)


def _configure_cloudinary():
    import cloudinary

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    return cloudinary


def _ensure_instagram_jpeg(image_url: str) -> str:
    """Re-encode an image through Cloudinary as JPEG for Instagram.

    Instagram's Content Publishing API only accepts JPEG for image_url,
    its own docs explicitly exclude even other JPEG variants like MPO/JPS,
    let alone WebP or PNG. A connected store that serves WebP (Real Okrika
    does, for its own site's performance) would otherwise fail on every
    single-image or carousel post. Runs unconditionally rather than trying
    to sniff the source format from the URL, which is unreliable (no
    extension, a CDN query string, a redirect). On any failure, falls back
    to the original URL so a Cloudinary hiccup doesn't newly break sources
    that were already JPEG.
    """
    if not _cloudinary_ready():
        return image_url
    try:
        import cloudinary.uploader

        _configure_cloudinary()
        result = cloudinary.uploader.upload(
            image_url,
            folder="socialos/instagram-jpeg",
            resource_type="image",
            format="jpg",
        )
        return result["secure_url"]
    except Exception as e:
        log.warning("Instagram JPEG conversion failed for %s: %s", image_url, e)
        return image_url


def stamp_sold_photo(image_url: str) -> str:
    """Stamp a SOLD badge onto a product photo, returned as JPEG.

    Used for product_sold posts: the caption text already says "Sold on...",
    but nobody reads captions scrolling a feed grid, so an active listing and
    a sold item looked identical at a glance. This is deliberately just a
    corner badge, not the full branded template (logo, colored frame) that
    was scoped out earlier. Same graceful-fallback shape as
    _ensure_instagram_jpeg: any failure returns the original URL untouched.
    """
    if not _cloudinary_ready():
        return image_url
    try:
        import cloudinary.uploader
        import cloudinary.utils

        _configure_cloudinary()
        uploaded = cloudinary.uploader.upload(
            image_url,
            folder="socialos/sold-stamp",
            resource_type="image",
        )
        url, _ = cloudinary.utils.cloudinary_url(
            uploaded["public_id"],
            format="jpg",
            transformation=[
                {
                    "overlay": {
                        "font_family": "Arial",
                        "font_size": 56,
                        "font_weight": "bold",
                        "text": "SOLD",
                    },
                    "color": "white",
                    "background": "#c0392b",
                },
                {"radius": 10},
                {"gravity": "south_east", "x": 24, "y": 24, "flags": "layer_apply"},
            ],
        )
        return url
    except Exception as e:
        log.warning("Sold stamp failed for %s: %s", image_url, e)
        return image_url


def _wait_for_container(client: httpx.Client, container_id: str, access_token: str, max_attempts: int = 30) -> str | None:
    """Poll container status until FINISHED. Returns status_code or None on timeout."""
    for _ in range(max_attempts):
        resp = client.get(
            f"{IG_API}/{container_id}",
            params={"fields": "status_code", "access_token": access_token},
        )
        status = resp.json().get("status_code")
        if status == "FINISHED":
            return "FINISHED"
        if status in ("ERROR", "EXPIRED"):
            return status
        time.sleep(2)
    return None


def publish_to_instagram(
    access_token: str,
    ig_user_id: str,
    caption: str,
    media_url: str | None = None,
    media_urls: list[str] | None = None,
    media_type: str = "image",
) -> dict:
    """Publish an image, carousel, or reel to Instagram.

    - media_type="image": single image, uses media_url
    - media_type="carousel": multiple images, uses media_urls (2-10 items)
    - media_type="video" or "reel": video reel, uses media_url (must be .mp4)

    Returns {"success": True, "post_id": "..."} or {"success": False, "error": "..."}.
    """
    media_urls = media_urls or ([media_url] if media_url else [])
    if not media_urls:
        return {"success": False, "error": "Instagram requires at least one media URL"}

    try:
        with httpx.Client(timeout=60) as client:
            if media_type in ("video", "reel"):
                # ── Reel flow ────────────────────────────────────────────────
                container_resp = client.post(
                    f"{IG_API}/{ig_user_id}/media",
                    data={
                        "media_type": "REELS",
                        "video_url": media_urls[0],
                        "caption": caption,
                        "access_token": access_token,
                    },
                )
                container_data = container_resp.json()
                if "id" not in container_data:
                    return {"success": False, "error": container_data.get("error", {}).get("message", "Failed to create reel container")}

                creation_id = container_data["id"]
                # Reels take longer to process
                status = _wait_for_container(client, creation_id, access_token, max_attempts=60)
                if status != "FINISHED":
                    return {"success": False, "error": f"Reel container {status or 'timeout'}"}

            elif media_type == "carousel" and len(media_urls) > 1:
                # ── Carousel flow ────────────────────────────────────────────
                if len(media_urls) > 10:
                    return {"success": False, "error": "Instagram carousels support max 10 items"}

                child_ids: list[str] = []
                for url in media_urls:
                    child_resp = client.post(
                        f"{IG_API}/{ig_user_id}/media",
                        data={
                            "image_url": _ensure_instagram_jpeg(url),
                            "is_carousel_item": "true",
                            "access_token": access_token,
                        },
                    )
                    child_data = child_resp.json()
                    if "id" not in child_data:
                        return {"success": False, "error": child_data.get("error", {}).get("message", "Failed to create carousel child")}
                    child_ids.append(child_data["id"])

                # Wait for all child containers
                for cid in child_ids:
                    status = _wait_for_container(client, cid, access_token)
                    if status != "FINISHED":
                        return {"success": False, "error": f"Carousel child {status or 'timeout'}"}

                # Create parent carousel container
                parent_resp = client.post(
                    f"{IG_API}/{ig_user_id}/media",
                    data={
                        "media_type": "CAROUSEL",
                        "children": ",".join(child_ids),
                        "caption": caption,
                        "access_token": access_token,
                    },
                )
                parent_data = parent_resp.json()
                if "id" not in parent_data:
                    return {"success": False, "error": parent_data.get("error", {}).get("message", "Failed to create carousel container")}
                creation_id = parent_data["id"]
                status = _wait_for_container(client, creation_id, access_token)
                if status != "FINISHED":
                    return {"success": False, "error": f"Carousel container {status or 'timeout'}"}

            else:
                # ── Single image flow ────────────────────────────────────────
                container_resp = client.post(
                    f"{IG_API}/{ig_user_id}/media",
                    data={
                        "image_url": _ensure_instagram_jpeg(media_urls[0]),
                        "caption": caption,
                        "access_token": access_token,
                    },
                )
                container_data = container_resp.json()
                if "id" not in container_data:
                    return {"success": False, "error": container_data.get("error", {}).get("message", "Failed to create media container")}

                creation_id = container_data["id"]
                status = _wait_for_container(client, creation_id, access_token)
                if status != "FINISHED":
                    return {"success": False, "error": f"Container {status or 'timeout'}"}

            # ── Publish container ────────────────────────────────────────────
            publish_resp = client.post(
                f"{IG_API}/{ig_user_id}/media_publish",
                data={"creation_id": creation_id, "access_token": access_token},
            )
            publish_data = publish_resp.json()
            if "id" not in publish_data:
                return {"success": False, "error": publish_data.get("error", {}).get("message", "Failed to publish")}

            return {"success": True, "post_id": publish_data["id"]}
    except Exception as e:
        log.warning("Instagram publish failed: %s", e)
        return {"success": False, "error": str(e)}


def _upload_twitter_media(access_token: str, media_url: str) -> str | None:
    """Download media from a URL and upload it via X API v2. Returns media_id or None.

    The old v1.1 media/upload.json endpoint was deprecated (retired after
    March 2026, see https://docs.x.com/x-api/media/upload-media); this uses
    the current POST /2/media/upload endpoint instead, which accepts the same
    OAuth 2.0 Bearer token already used for posting tweets (media.write scope,
    already requested at connect time)."""
    try:
        with httpx.Client(timeout=60) as client:
            dl = client.get(media_url)
            dl.raise_for_status()
            content_type = dl.headers.get("content-type", "image/jpeg")
            media_category = "tweet_gif" if content_type == "image/gif" else "tweet_image"
            resp = client.post(
                "https://api.x.com/2/media/upload",
                headers={"Authorization": f"Bearer {access_token}"},
                files={"media": ("media", dl.content, content_type)},
                data={"media_category": media_category},
            )
            data = resp.json()
            media_id = data.get("data", {}).get("id")
            if media_id:
                return media_id
            log.warning("Twitter media upload error: %s", data)
    except Exception as e:
        log.warning("Twitter media upload failed for %s: %s", media_url, e)
    return None


def publish_to_twitter(
    access_token: str,
    caption: str,
    media_urls: list[str] | None = None,
) -> dict:
    """Publish a tweet via Twitter API v2.

    Supports text-only and image tweets (up to 4 images).
    Caption is truncated to 280 characters.
    Returns {"success": True, "post_id": "..."} or {"success": False, "error": "..."}.
    """
    text = caption if len(caption) <= 280 else caption[:277] + "..."

    media_ids: list[str] = []
    for url in (media_urls or [])[:4]:
        mid = _upload_twitter_media(access_token, url)
        if mid:
            media_ids.append(mid)

    payload: dict = {"text": text}
    if media_ids:
        payload["media"] = {"media_ids": media_ids}

    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post(
                "https://api.twitter.com/2/tweets",
                json=payload,
                headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
            )
            data = resp.json()

        if "data" in data and "id" in data["data"]:
            return {"success": True, "post_id": data["data"]["id"]}

        errors = data.get("errors", [])
        detail = data.get("detail", "")
        error_msg = detail or (errors[0].get("message") if errors else str(data))
        return {"success": False, "error": error_msg}
    except Exception as e:
        log.warning("Twitter publish failed: %s", e)
        return {"success": False, "error": str(e)}


def _tiktok_media_url(raw_url: str) -> str:
    # TikTok only trusts URLs on a domain we've verified ownership of, so route
    # anything not already on our own backend (e.g. a third-party store's
    # product photo CDN) through our proxy. Host comparison, not substring
    # matching, so a URL like https://evil.com/?x=<our-domain> can't slip
    # through unproxied. A URL already on our host is returned unchanged, which
    # also prevents double-proxying or an infinite wrap loop, since a proxied
    # URL's host is always our own.
    backend_host = urlsplit(BACKEND_BASE).netloc
    return (
        raw_url if urlsplit(raw_url).netloc == backend_host
        else f"{BACKEND_BASE}/api/media/proxy?url={urllib.parse.quote(raw_url, safe='')}"
    )


def _poll_tiktok_status(publish_id: str, headers: dict) -> dict:
    """Poll TikTok's publish status endpoint until the content reaches the
    user's inbox (or fails), for up to ~2 minutes. Shared by video and photo
    posting, since both go through the same publish_id/status system."""
    for _ in range(40):
        time.sleep(3)
        with httpx.Client(timeout=15) as client:
            status_resp = client.post(
                "https://open.tiktokapis.com/v2/post/publish/status/fetch/",
                headers=headers,
                json={"publish_id": publish_id},
            )
            status_data = status_resp.json()

        status = status_data.get("data", {}).get("status", "")
        log.info("TikTok publish_id=%s status=%s", publish_id, status)
        if status in ("SEND_TO_USER_INBOX", "PUBLISH_COMPLETE"):
            return {"success": True, "post_id": publish_id, "tiktok_status": status}
        if status == "FAILED":
            reason = status_data.get("data", {}).get("fail_reason", "Unknown")
            return {"success": False, "error": f"TikTok processing failed: {reason}"}

    return {"success": False, "error": "TikTok upload timed out after 2 minutes"}


def _publish_video_to_tiktok(access_token: str, media_urls: list[str]) -> dict:
    """Send a video to the user's TikTok inbox via Content Posting API (PULL_FROM_URL).

    The video appears as a draft in the user's TikTok app, they tap Post to publish.
    No audit approval required. Caption must be added by the user in the TikTok app.
    """
    video_url = _tiktok_media_url(media_urls[0])
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; charset=UTF-8",
    }

    # TikTok PULL_FROM_URL requires the exact file size upfront
    video_size = 0
    try:
        with httpx.Client(timeout=30) as client:
            head = client.head(video_url, follow_redirects=True)
            video_size = int(head.headers.get("content-length", 0))
    except Exception:
        pass

    if not video_size:
        return {"success": False, "error": "Could not determine video file size, ensure the URL returns a Content-Length header"}

    try:
        with httpx.Client(timeout=60) as client:
            resp = client.post(
                "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/",
                json={
                    "source_info": {
                        "source": "PULL_FROM_URL",
                        "video_url": video_url,
                        "video_size": video_size,
                        "chunk_size": video_size,
                        "total_chunk_count": 1,
                    }
                },
                headers=headers,
            )
            data = resp.json()

        err = data.get("error", {})
        if err.get("code", "ok") != "ok":
            return {"success": False, "error": err.get("message", str(data))}

        publish_id = data.get("data", {}).get("publish_id")
        if not publish_id:
            return {"success": False, "error": f"No publish_id returned: {data}"}

        return _poll_tiktok_status(publish_id, headers)
    except Exception as e:
        log.warning("TikTok video publish failed: %s", e)
        return {"success": False, "error": str(e)}


def _publish_photo_to_tiktok(access_token: str, media_urls: list[str]) -> dict:
    """Send photo(s) to the user's TikTok inbox via the Content Posting API's
    photo endpoint (PULL_FROM_URL, MEDIA_UPLOAD mode, uses the same
    video.upload scope as the video flow, no app audit required)."""
    photo_urls = [_tiktok_media_url(u) for u in media_urls[:35]]
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; charset=UTF-8",
    }

    try:
        with httpx.Client(timeout=60) as client:
            resp = client.post(
                "https://open.tiktokapis.com/v2/post/publish/content/init/",
                json={
                    "post_mode": "MEDIA_UPLOAD",
                    "media_type": "PHOTO",
                    "source_info": {
                        "source": "PULL_FROM_URL",
                        "photo_cover_index": 0,
                        "photo_images": photo_urls,
                    },
                },
                headers=headers,
            )
            data = resp.json()

        err = data.get("error", {})
        if err.get("code", "ok") != "ok":
            return {"success": False, "error": err.get("message", str(data))}

        publish_id = data.get("data", {}).get("publish_id")
        if not publish_id:
            return {"success": False, "error": f"No publish_id returned: {data}"}

        return _poll_tiktok_status(publish_id, headers)
    except Exception as e:
        log.warning("TikTok photo publish failed: %s", e)
        return {"success": False, "error": str(e)}


def publish_to_tiktok(
    access_token: str,
    caption: str,
    media_urls: list[str] | None = None,
    media_type: str = "video",
) -> dict:
    """Send video or photo(s) to the user's TikTok inbox via the Content
    Posting API (PULL_FROM_URL). Routes to the video or photo endpoint based
    on media_type ("video" default for backward compatibility with existing
    callers that don't pass it; "image"/"carousel"/"photo" go to the photo
    endpoint). Caption must be added by the user in the TikTok app.
    Returns {"success": True, "post_id": "...", "tiktok_status": "..."} or
            {"success": False, "error": "..."}.
    """
    if not media_urls:
        return {"success": False, "error": "TikTok requires at least one photo or video URL"}

    if media_type in ("image", "carousel", "photo"):
        return _publish_photo_to_tiktok(access_token, media_urls)
    return _publish_video_to_tiktok(access_token, media_urls)


def _upload_linkedin_image(access_token: str, owner_urn: str, image_url: str) -> str | None:
    """Download an image and upload it to LinkedIn. Returns the image URN or None."""
    try:
        with httpx.Client(timeout=60) as client:
            # Step 1: initialize upload
            init_resp = client.post(
                "https://api.linkedin.com/rest/images?action=initializeUpload",
                json={"initializeUploadRequest": {"owner": owner_urn}},
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "LinkedIn-Version": "202411",
                    "Content-Type": "application/json",
                },
            )
            init_data = init_resp.json()
            upload_url = init_data.get("value", {}).get("uploadUrl")
            image_urn = init_data.get("value", {}).get("image")
            if not upload_url or not image_urn:
                log.warning("LinkedIn image init failed: %s", init_data)
                return None

            # Step 2: download source image
            dl = client.get(image_url)
            dl.raise_for_status()

            # Step 3: PUT binary to LinkedIn's upload URL
            put_resp = client.put(
                upload_url,
                content=dl.content,
                headers={"Content-Type": dl.headers.get("content-type", "image/jpeg")},
            )
            if put_resp.status_code not in (200, 201):
                log.warning("LinkedIn image PUT failed: %s", put_resp.status_code)
                return None

        return image_urn
    except Exception as e:
        log.warning("LinkedIn image upload failed: %s", e)
        return None


def publish_to_linkedin(
    access_token: str,
    platform_user_id: str,
    caption: str,
    media_urls: list[str] | None = None,
) -> dict:
    """Publish a text or image post to LinkedIn via the Posts REST API.

    Supports text-only and single-image posts. Caption limit is 3000 characters.
    Returns {"success": True, "post_id": "..."} or {"success": False, "error": "..."}.
    """
    owner_urn = f"urn:li:person:{platform_user_id}"
    text = caption if len(caption) <= 3000 else caption[:2997] + "..."
    headers = {
        "Authorization": f"Bearer {access_token}",
        "LinkedIn-Version": "202411",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
    }

    payload: dict = {
        "author": owner_urn,
        "commentary": text,
        "visibility": "PUBLIC",
        "distribution": {
            "feedDistribution": "MAIN_FEED",
            "targetEntities": [],
            "thirdPartyDistributionChannels": [],
        },
        "lifecycleState": "PUBLISHED",
        "isReshareDisabledByAuthor": False,
    }

    # Attach image if provided
    if media_urls:
        image_urn = _upload_linkedin_image(access_token, owner_urn, media_urls[0])
        if image_urn:
            payload["content"] = {"media": {"id": image_urn}}

    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post(
                "https://api.linkedin.com/rest/posts",
                json=payload,
                headers=headers,
            )

        if resp.status_code in (200, 201):
            post_id = resp.headers.get("x-restli-id", resp.headers.get("X-RestLi-Id", ""))
            return {"success": True, "post_id": post_id or "published"}

        error_body = resp.json() if resp.content else {}
        msg = error_body.get("message") or error_body.get("serviceErrorCode") or f"HTTP {resp.status_code}"
        return {"success": False, "error": str(msg)}
    except Exception as e:
        log.warning("LinkedIn publish failed: %s", e)
        return {"success": False, "error": str(e)}


FB_API = "https://graph.facebook.com/v21.0"


def publish_to_facebook(
    access_token: str,
    page_id: str,
    caption: str,
    media_urls: list[str] | None = None,
) -> dict:
    """Publish a text or photo post to a Facebook Page via the Graph API.

    Page tokens (stored during OAuth) are long-lived and never expire.
    Returns {"success": True, "post_id": "..."} or {"success": False, "error": "..."}.
    """
    text = caption if len(caption) <= 63206 else caption[:63203] + "..."

    try:
        with httpx.Client(timeout=30) as client:
            if media_urls:
                # Photo post, publishes the image and the caption together
                resp = client.post(
                    f"{FB_API}/{page_id}/photos",
                    params={
                        "url": media_urls[0],
                        "caption": text,
                        "access_token": access_token,
                    },
                )
            else:
                # Text-only post
                resp = client.post(
                    f"{FB_API}/{page_id}/feed",
                    params={
                        "message": text,
                        "access_token": access_token,
                    },
                )

        data = resp.json() if resp.content else {}
        if "id" in data:
            return {"success": True, "post_id": data["id"]}
        error = (data.get("error") or {}).get("message") or f"HTTP {resp.status_code}"
        return {"success": False, "error": str(error)}
    except Exception as e:
        log.warning("Facebook publish failed: %s", e)
        return {"success": False, "error": str(e)}


def fetch_instagram_insights(access_token: str, media_id: str, media_type: str = "image") -> dict:
    """Fetch real engagement metrics for a published Instagram post.

    Returns a dict of {impressions, reach, likes, comments, saves, shares}, zeros if unavailable.
    """
    # Different metrics are available for different media types
    if media_type in ("video", "reel"):
        metrics = "reach,likes,comments,saves,shares,plays,total_interactions"
    else:
        metrics = "reach,likes,comments,saves,shares,views,total_interactions"

    try:
        with httpx.Client(timeout=20) as client:
            resp = client.get(
                f"{IG_API}/{media_id}/insights",
                params={"metric": metrics, "access_token": access_token},
            )
            data = resp.json()
            insights: dict[str, int] = {}
            for item in data.get("data", []):
                name = item.get("name")
                values = item.get("values", [])
                if values:
                    insights[name] = values[0].get("value", 0)
            return {
                "impressions": insights.get("views", insights.get("plays", 0)),
                "reach": insights.get("reach", 0),
                "likes": insights.get("likes", 0),
                "comments": insights.get("comments", 0),
                "saves": insights.get("saves", 0),
                "shares": insights.get("shares", 0),
                "total_interactions": insights.get("total_interactions", 0),
            }
    except Exception as e:
        log.warning("Instagram insights fetch failed: %s", e)
        return {"impressions": 0, "reach": 0, "likes": 0, "comments": 0, "saves": 0, "shares": 0, "total_interactions": 0}



# Meta (Instagram/Facebook) returns these in a plain "error" string, not a
# distinct HTTP status, when the stored token is no longer valid: the user
# revoked the app's access, or Meta expired it. Neither platform has a
# proactive refresh like Twitter/TikTok's ensure_*_token (Meta's long-lived
# tokens don't rotate the way those do), so this is the only signal we get,
# and until now nothing acted on it: the account stayed "connected" in
# Settings forever while every post silently failed.
_META_TOKEN_INVALID_SIGNATURES = (
    "error validating access token",
    "has not authorized application",
    "invalid oauth access token",
)


def _mark_disconnected_if_token_invalid(account, db, result: dict, platform: str) -> dict:
    if result.get("success"):
        return result
    error = (result.get("error") or "").lower()
    if not any(sig in error for sig in _META_TOKEN_INVALID_SIGNATURES):
        return result
    account.is_connected = False
    db.commit()
    label = platform.capitalize()
    return {**result, "error": f"{label} authorization was revoked, reconnect {label} in Settings"}


def publish_to_platform(db, user_id: str, platform: str, caption: str, media_urls: list[str], media_type: str = "image") -> dict:
    """Look up the user's connected account for `platform` and publish to it.
    Shared dispatch used by both the manual Compose flow and the ecommerce
    product/sale endpoints so "publish now" always means a real platform call,
    never a fabricated success. Returns {"platform", "success", "post_id"?, "error"?}."""
    from ..models.social_account import SocialAccount
    from .token_refresh import ensure_tiktok_token, ensure_twitter_token

    account = db.query(SocialAccount).filter(
        SocialAccount.user_id == user_id,
        SocialAccount.platform == platform,
        SocialAccount.is_connected == True,
    ).first()
    if not account or not account.access_token:
        return {"platform": platform, "success": False, "error": "Not connected"}

    if platform == "instagram":
        result = publish_to_instagram(
            access_token=account.access_token,
            ig_user_id=account.platform_user_id,
            caption=caption,
            media_urls=media_urls,
            media_type=media_type,
        )
        return {"platform": platform, **_mark_disconnected_if_token_invalid(account, db, result, platform)}
    if platform == "twitter":
        if not ensure_twitter_token(account, db):
            return {"platform": "twitter", "success": False, "error": "Twitter token expired, reconnect Twitter in Settings"}
        return {"platform": platform, **publish_to_twitter(
            access_token=account.access_token,
            caption=caption,
            media_urls=media_urls,
        )}
    if platform == "tiktok":
        if not ensure_tiktok_token(account, db):
            return {"platform": "tiktok", "success": False, "error": "TikTok token expired, reconnect TikTok in Settings"}
        return {"platform": platform, **publish_to_tiktok(
            access_token=account.access_token,
            caption=caption,
            media_urls=media_urls,
            media_type=media_type,
        )}
    if platform == "linkedin":
        return {"platform": platform, **publish_to_linkedin(
            access_token=account.access_token,
            platform_user_id=account.platform_user_id,
            caption=caption,
            media_urls=media_urls,
        )}
    if platform == "facebook":
        result = publish_to_facebook(
            access_token=account.access_token,
            page_id=account.platform_user_id,
            caption=caption,
            media_urls=media_urls,
        )
        return {"platform": platform, **_mark_disconnected_if_token_invalid(account, db, result, platform)}
    return {"platform": platform, "success": False, "error": f"{platform} publishing not implemented yet"}
