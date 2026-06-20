from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .core.config import settings
from .api import auth, accounts, posts, analytics, ai, automation
from .api import media, oauth
from .db.database import engine, Base
from .models import user, social_account, post  # ensure models are registered
from .scheduler import scheduler

try:
    Base.metadata.create_all(bind=engine)
    # Lightweight idempotent migrations for added columns (Postgres only).
    if engine.dialect.name == "postgresql":
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE posts ADD COLUMN IF NOT EXISTS platform_post_ids JSONB DEFAULT '{}'::jsonb"))
except Exception as e:
    import logging
    logging.getLogger(__name__).error("DB table creation failed: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not settings.USE_MOCK_DATA:
        scheduler.start()
    yield
    if scheduler.running:
        scheduler.shutdown()


app = FastAPI(
    title="SocialOS API",
    version="1.0.0",
    description="AI-powered social media management platform",
    lifespan=lifespan,
)

# Normalize configured origin (a trailing slash never matches the browser's Origin header).
_frontend_origin = settings.FRONTEND_URL.rstrip("/")
_allowed_origins = [_frontend_origin, "http://localhost:3000", "http://localhost:3001"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    # Also accept any Vercel deployment (production + preview URLs) for this project.
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(posts.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(automation.router, prefix="/api")
app.include_router(media.router, prefix="/api")
app.include_router(oauth.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "mock_mode": settings.USE_MOCK_DATA, "scheduler": scheduler.running}
