from fastapi import APIRouter, Depends, Request, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from ..api.deps import get_current_user
from ..db.database import get_db
from ..models.user import User
from ..models.media import Media
from ..core.config import settings
from ..services.url_safety import resolve_and_validate, UnsafeUrlError
import uuid, httpx, urllib.parse

router = APIRouter(prefix="/media", tags=["media"])
limiter = Limiter(key_func=get_remote_address)

_ALLOWED_MEDIA_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "video/mp4", "video/quicktime",
}
_MAX_PROXY_BYTES = 100 * 1024 * 1024  # 100MB


@router.get("/proxy")
@limiter.limit("20/minute")
def proxy_media(request: Request, url: str):
    """Re-serve an external image/video under our own (TikTok-verified) domain.

    Unauthenticated, TikTok's PULL_FROM_URL fetches this directly without
    credentials, and TikTok only trusts URLs on a domain we've verified
    ownership of. Since this now accepts arbitrary caller-supplied URLs (not
    just our own Cloudinary bucket), it's SSRF-guarded via url_safety and kept
    to no-redirect, image/video-only, size-capped fetches. See
    backend/app/services/url_safety.py for the threat model and tradeoffs.
    """
    try:
        resolve_and_validate(url)
    except UnsafeUrlError as e:
        raise HTTPException(400, str(e))

    # Validate off the GET response's own headers rather than a separate HEAD
    # request: many third-party store CDNs don't support HEAD reliably (405/501),
    # which would otherwise reject a perfectly safe, fetchable URL. The stream is
    # opened here (request sent, headers received) but the body isn't consumed
    # until the StreamingResponse below iterates it.
    client = httpx.Client(timeout=60)
    stream_ctx = client.stream("GET", url, follow_redirects=False)
    try:
        resp = stream_ctx.__enter__()
        resp.raise_for_status()
    except Exception as e:
        stream_ctx.__exit__(None, None, None)
        client.close()
        raise HTTPException(502, f"Failed to fetch media: {e}")

    content_type = resp.headers.get("content-type", "").split(";")[0].strip().lower()
    content_length = resp.headers.get("content-length")
    if content_type not in _ALLOWED_MEDIA_TYPES or (content_length and int(content_length) > _MAX_PROXY_BYTES):
        stream_ctx.__exit__(None, None, None)
        client.close()
        if content_type not in _ALLOWED_MEDIA_TYPES:
            raise HTTPException(400, f"Unsupported media type: {content_type or 'unknown'}")
        raise HTTPException(400, "Media exceeds the 100MB size limit")

    headers = {}
    if content_length:
        headers["Content-Length"] = content_length

    def _stream():
        sent = 0
        try:
            for chunk in resp.iter_bytes(chunk_size=65536):
                sent += len(chunk)
                if sent > _MAX_PROXY_BYTES:
                    break  # misbehaving origin lied about/omitted Content-Length
                yield chunk
        finally:
            stream_ctx.__exit__(None, None, None)
            client.close()

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
