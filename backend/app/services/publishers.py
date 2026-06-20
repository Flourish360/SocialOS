"""Platform-specific post publishers."""
import httpx
import logging

log = logging.getLogger(__name__)


def publish_to_instagram(access_token: str, ig_user_id: str, caption: str, media_url: str | None) -> dict:
    """Publish a single image post to Instagram via the Instagram Graph API.

    Returns {"success": True, "post_id": "..."} or {"success": False, "error": "..."}.
    Requires a public HTTPS image URL (from Cloudinary).
    """
    if not media_url:
        return {"success": False, "error": "Instagram requires a media URL"}

    try:
        # Step 1: create media container
        with httpx.Client(timeout=30) as client:
            container_resp = client.post(
                f"https://graph.instagram.com/v21.0/{ig_user_id}/media",
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

            # Step 2: publish the container
            publish_resp = client.post(
                f"https://graph.instagram.com/v21.0/{ig_user_id}/media_publish",
                data={"creation_id": creation_id, "access_token": access_token},
            )
            publish_data = publish_resp.json()
            if "id" not in publish_data:
                return {"success": False, "error": publish_data.get("error", {}).get("message", "Failed to publish")}

            return {"success": True, "post_id": publish_data["id"]}
    except Exception as e:
        log.warning("Instagram publish failed: %s", e)
        return {"success": False, "error": str(e)}
