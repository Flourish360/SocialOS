from fastapi import APIRouter, Depends, UploadFile, File
from ..api.deps import get_current_user
from ..models.user import User
from ..core.config import settings
import uuid, time, hashlib

router = APIRouter(prefix="/media", tags=["media"])


def _cloudinary_configured() -> bool:
    return bool(
        settings.CLOUDINARY_CLOUD_NAME
        and settings.CLOUDINARY_API_KEY
        and settings.CLOUDINARY_API_SECRET
    )


@router.post("/upload-url")
def get_upload_url(body: dict, current_user: User = Depends(get_current_user)):
    """Return a signed Cloudinary upload payload the frontend can POST a file to directly."""
    if not _cloudinary_configured():
        seed = uuid.uuid4().hex[:8]
        return {
            "upload_url": None,
            "public_url": f"https://picsum.photos/seed/{seed}/800/600",
            "key": f"mock/{current_user.id}/{seed}",
            "mock": True,
        }

    timestamp = int(time.time())
    folder = f"socialos/{current_user.id}"
    to_sign = f"folder={folder}&timestamp={timestamp}{settings.CLOUDINARY_API_SECRET}"
    signature = hashlib.sha1(to_sign.encode()).hexdigest()

    return {
        "upload_url": f"https://api.cloudinary.com/v1_1/{settings.CLOUDINARY_CLOUD_NAME}/auto/upload",
        "params": {
            "api_key": settings.CLOUDINARY_API_KEY,
            "timestamp": timestamp,
            "folder": folder,
            "signature": signature,
        },
        "mock": False,
    }


@router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Server-side upload to Cloudinary — accepts a file from the frontend and uploads it."""
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
    return {
        "public_url": result["secure_url"],
        "key": result["public_id"],
        "format": result.get("format"),
        "width": result.get("width"),
        "height": result.get("height"),
        "mock": False,
    }


@router.delete("/{key:path}")
def delete_media(key: str, current_user: User = Depends(get_current_user)):
    if not _cloudinary_configured():
        return {"deleted": True, "mock": True}

    import cloudinary
    import cloudinary.uploader

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
    )
    cloudinary.uploader.destroy(key)
    return {"deleted": True, "key": key}
