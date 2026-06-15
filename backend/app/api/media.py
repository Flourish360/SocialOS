from fastapi import APIRouter, Depends
from ..api.deps import get_current_user
from ..models.user import User
from ..core.config import settings
import uuid

router = APIRouter(prefix="/media", tags=["media"])


@router.post("/upload-url")
def get_upload_url(body: dict, current_user: User = Depends(get_current_user)):
    filename = body.get("filename", "upload")
    content_type = body.get("content_type", "image/jpeg")

    if not (settings.AWS_ACCESS_KEY_ID and settings.AWS_S3_BUCKET):
        seed = uuid.uuid4().hex[:8]
        return {
            "upload_url": None,
            "public_url": f"https://picsum.photos/seed/{seed}/800/600",
            "key": f"mock/{current_user.id}/{seed}/{filename}",
            "mock": True,
        }

    import boto3
    from botocore.config import Config

    s3 = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
        config=Config(signature_version="s3v4"),
    )
    key = f"media/{current_user.id}/{uuid.uuid4().hex}/{filename}"
    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.AWS_S3_BUCKET, "Key": key, "ContentType": content_type},
        ExpiresIn=3600,
    )
    public_url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
    return {"upload_url": upload_url, "public_url": public_url, "key": key, "mock": False}


@router.delete("/{key:path}")
def delete_media(key: str, current_user: User = Depends(get_current_user)):
    if not (settings.AWS_ACCESS_KEY_ID and settings.AWS_S3_BUCKET):
        return {"deleted": True, "mock": True}

    import boto3

    s3 = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
    s3.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=key)
    return {"deleted": True, "key": key}
