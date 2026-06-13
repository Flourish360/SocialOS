from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    SECRET_KEY: str = "dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200
    FRONTEND_URL: str = "http://localhost:3000"

    # Default to SQLite for zero-config local dev; swap to PostgreSQL URL in .env for production
    DATABASE_URL: str = "sqlite:///./social_platform.db"
    REDIS_URL: str = "redis://localhost:6379"

    OPENAI_API_KEY: Optional[str] = None

    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    SENDGRID_API_KEY: Optional[str] = None

    META_APP_ID: Optional[str] = None
    META_APP_SECRET: Optional[str] = None
    TWITTER_CLIENT_ID: Optional[str] = None
    TWITTER_CLIENT_SECRET: Optional[str] = None
    LINKEDIN_CLIENT_ID: Optional[str] = None
    LINKEDIN_CLIENT_SECRET: Optional[str] = None
    TIKTOK_CLIENT_ID: Optional[str] = None
    TIKTOK_CLIENT_SECRET: Optional[str] = None
    YOUTUBE_CLIENT_ID: Optional[str] = None
    YOUTUBE_CLIENT_SECRET: Optional[str] = None

    USE_MOCK_DATA: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
