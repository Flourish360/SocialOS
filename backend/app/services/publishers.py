"""Platform-specific post publishers."""
import httpx
import logging
import time

log = logging.getLogger(__name__)

IG_API = "https://graph.instagram.com/v21.0"


def publish_to_instagram(access_token: str, ig_user_id: str, caption: str, media_url: str | None) -> dict:
    """Publish a single image post to Instagram.

    Three-step flow:
    1. POST /{ig-user-id}/media — create a media container
    2. GET /{container-id}?fields=status_code — poll until FINISHED
    3. POST /{ig-user-id}/media_publish — publish the container

    Returns {"success": True, "post_id": "..."} or {"success": False, "error": "..."}.
    Requires a public HTTPS image URL.
    """
    if not media_url:
        return {"success": False, "error": "Instagram requires a media URL"}

    try:
        with httpx.Client(timeout=30) as client:
            # Step 1: create container
            container_resp = client.post(
                f"{IG_API}/{ig_user_id}/media",
                data={
                    "image_url": media_url,
                    "caption": caption,
                    "access_token": access_token,
                },
            )
            container_data = container_resp.json()
            if "id" not in container_data:
                return {"success": False, "error": container_data.get("error", {}).get("message", "Failed to create media container")}

            creation_id = container_data["id"]

            # Step 2: poll container status until FINISHED (or timeout after ~30s)
            for _ in range(15):
                status_resp = client.get(
                    f"{IG_API}/{creation_id}",
                    params={"fields": "status_code", "access_token": access_token},
                )
                status = status_resp.json().get("status_code")
                if status == "FINISHED":
                    break
                if status in ("ERROR", "EXPIRED"):
                    return {"success": False, "error": f"Container {status}"}
                time.sleep(2)
            else:
                return {"success": False, "error": "Container processing timeout"}

            # Step 3: publish
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
