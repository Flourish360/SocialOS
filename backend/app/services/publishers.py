"""Platform-specific post publishers."""
import httpx
import logging
import time
import urllib.parse

log = logging.getLogger(__name__)

IG_API = "https://graph.instagram.com/v21.0"
BACKEND_BASE = "https://socialos-production-1712.up.railway.app"


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
                            "image_url": url,
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
                        "image_url": media_urls[0],
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
    """Download media from a URL and upload it to Twitter. Returns media_id_string or None."""
    try:
        with httpx.Client(timeout=60) as client:
            dl = client.get(media_url)
            dl.raise_for_status()
            content_type = dl.headers.get("content-type", "image/jpeg")
            resp = client.post(
                "https://upload.twitter.com/1.1/media/upload.json",
                headers={"Authorization": f"Bearer {access_token}"},
                files={"media": ("media", dl.content, content_type)},
            )
            data = resp.json()
            if "media_id_string" in data:
                return data["media_id_string"]
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


def publish_to_tiktok(
    access_token: str,
    caption: str,
    media_urls: list[str] | None = None,
) -> dict:
    """Send a video to the user's TikTok inbox via Content Posting API (PULL_FROM_URL).

    The video appears as a draft in the user's TikTok app — they tap Post to publish.
    No audit approval required. Caption must be added by the user in the TikTok app.
    Polls the status endpoint to confirm delivery before returning success.
    Returns {"success": True, "post_id": "...", "tiktok_status": "INBOX"} or
            {"success": False, "error": "..."}.
    """
    if not media_urls:
        return {"success": False, "error": "TikTok requires a video URL"}

    raw_url = media_urls[0]
    # TikTok only trusts URLs on a domain we've verified ownership of, so route
    # Cloudinary URLs through our own backend proxy.
    video_url = (
        f"{BACKEND_BASE}/api/media/proxy?url={urllib.parse.quote(raw_url, safe='')}"
        if "cloudinary.com" in raw_url else raw_url
    )

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
        return {"success": False, "error": "Could not determine video file size — ensure the URL returns a Content-Length header"}

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

        # Poll until TikTok confirms the video reached the inbox (up to ~2 min).
        # Inbox flow success status is SEND_TO_USER_INBOX; direct post uses PUBLISH_COMPLETE.
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
    except Exception as e:
        log.warning("TikTok publish failed: %s", e)
        return {"success": False, "error": str(e)}


def fetch_instagram_insights(access_token: str, media_id: str, media_type: str = "image") -> dict:
    """Fetch real engagement metrics for a published Instagram post.

    Returns a dict of {impressions, reach, likes, comments, saves, shares} — zeros if unavailable.
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
