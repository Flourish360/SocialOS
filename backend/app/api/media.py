from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..api.deps import get_current_user
from ..db.database import get_db
from ..models.user import User
from ..models.media import Media
from ..core.config import settings
import uuid, httpx, urllib.parse

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/proxy")
def proxy_media(url: str):
    """Re-serve a Cloudinary file under our own domain (unauthenticated — TikTok's
    PULL_FROM_URL fetches this without credentials, and TikTok only trusts URLs
    on a domain we've verified ownership of)."""
    if not url.startswith("https://res.cloudinary.com/"):
        raise HTTPException(400, "Only Cloudinary URLs are allowed")

    try:
        head = httpx.head(url, follow_redirects=True, timeout=30)
        head.raise_for_status()
    except Exception as e:
        raise HTTPException(502, f"Failed to fetch media: {e}")

    content_type = head.headers.get("content-type", "application/octet-stream")
    headers = {}
    if "content-length" in head.headers:
        headers["Content-Length"] = head.headers["content-length"]

    def _stream():
        with httpx.stream("GET", url, follow_redirects=True, timeout=60) as resp:
            resp.raise_for_status()
            for chunk in resp.iter_bytes(chunk_size=65536):
                yield chunk

    return StreamingResponse(_stream(), media_type=content_type, headers=headers)


def _cloudinary_configured() -> bool:
    return bool(
        settings.CLOUDINARY_CLOUD_NAME
        and settings.CLOUDINARY_API_KEY
        and settings.CLOUDINARY_API_SECRET
    )


def _serialize(m: Media) -> dict:
    return {
        "id": m.id,
        "name": m.name,
        "public_url": m.public_url,
        "key": m.cloudinary_key,
        "type": m.media_type,
        "size_bytes": m.size_bytes,
        "width": m.width,
        "height": m.height,
        "format": m.format,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


@router.get("")
def list_media(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(Media).filter(Media.user_id == current_user.id).order_by(Media.created_at.desc()).all()
    return [_serialize(m) for m in items]


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload to Cloudinary and persist a Media record."""
    media_type = "image" if (file.content_type or "").startswith("image/") else \
                 "video" if (file.content_type or "").startswith("video/") else "document"

    if not _cloudinary_configured():
        seed = uuid.uuid4().hex[:8]
        return {
            "public_url": f"https://picsum.photos/seed/{seed}/800/600",
            "key": f"mock/{current_user.id}/{seed}",
            "mock": True,
        }

    import cloudinary
    import cloudinary.uploader

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )

    contents = await file.read()
    result = cloudinary.uploader.upload(
        contents,
        folder=f"socialos/{current_user.id}",
        resource_type="auto",
    )

    media = Media(
        user_id=current_user.id,
        name=file.filename or "upload",
        public_url=result["secure_url"],
        cloudinary_key=result["public_id"],
        media_type=media_type,
        size_bytes=len(contents),
        width=result.get("width"),
        height=result.get("height"),
        format=result.get("format"),
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return _serialize(media)


@router.post("/generate")
def generate_image(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate an image from a prompt using Pollinations.ai (free, no API key) and store in Cloudinary."""
    prompt = (body.get("prompt") or "").strip()
    if not prompt:
        raise HTTPException(400, "Prompt required")

    encoded = urllib.parse.quote(prompt)
    seed = uuid.uuid4().hex[:8]
    pollinations_url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&seed={seed}&nologo=true"

    try:
        with httpx.Client(timeout=60) as client:
            resp = client.get(pollinations_url, follow_redirects=True)
            resp.raise_for_status()
            image_bytes = resp.content
    except Exception as e:
        raise HTTPException(502, f"Image generation failed: {e}")

    if not _cloudinary_configured():
        # Fallback: return Pollinations URL directly
        return {
            "public_url": pollinations_url,
            "key": f"pollinations/{seed}",
            "type": "image",
            "mock": True,
        }

    import cloudinary
    import cloudinary.uploader

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )

    result = cloudinary.uploader.upload(
        image_bytes,
        folder=f"socialos/{current_user.id}/ai",
        resource_type="image",
    )

    media = Media(
        user_id=current_user.id,
        name=f"AI: {prompt[:60]}",
        public_url=result["secure_url"],
        cloudinary_key=result["public_id"],
        media_type="image",
        size_bytes=len(image_bytes),
        width=result.get("width"),
        height=result.get("height"),
        format=result.get("format"),
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return _serialize(media)


@router.delete("/{media_id}")
def delete_media(media_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    media = db.query(Media).filter(Media.id == media_id, Media.user_id == current_user.id).first()
    if not media:
        raise HTTPException(404, "Media not found")

    if _cloudinary_configured() and media.cloudinary_key:
        import cloudinary
        import cloudinary.uploader
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
        )
        try:
            cloudinary.uploader.destroy(media.cloudinary_key)
        except Exception:
            pass

    db.delete(media)
    db.commit()
    return {"deleted": True, "id": media_id}
