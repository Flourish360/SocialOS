"""Platform-specific post publishers."""
import httpx
import logging
import time

log = logging.getLogger(__name__)

IG_API = "https://graph.instagram.com/v21.0"


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
