from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from .core.config import settings
from .api import auth, accounts, posts, analytics, ai, automation
from .api import media, oauth
from .db.database import engine, Base
from .models import user, social_account, post, audience_snapshot, follower_snapshot, automation_rule, competitor
from .scheduler import scheduler

try:
    Base.metadata.create_all(bind=engine)
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


# ── Rate limiter ───────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

# ── App ────────────────────────────────────────────────────────────────────────
_is_production = not settings.SECRET_KEY.startswith("dev-")

app = FastAPI(
    title="SocialOS API",
    version="1.0.0",
    description="AI-powered social media management platform",
    lifespan=lifespan,
    # Disable interactive docs in production
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
    openapi_url=None if _is_production else "/openapi.json",
)

# Expose the limiter on app.state so route decorators can access it
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


# ── Security headers middleware ────────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"]  = "nosniff"
        response.headers["X-Frame-Options"]          = "DENY"
        response.headers["X-XSS-Protection"]         = "1; mode=block"
        response.headers["Referrer-Policy"]           = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"]        = "geolocation=(), microphone=(), camera=()"
        if _is_production:
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        return response

app.add_middleware(SecurityHeadersMiddleware)


# ── CORS ──────────────────────────────────────────────────────────────────────
_frontend_origin = settings.FRONTEND_URL.rstrip("/")
_allowed_origins = [_frontend_origin, "http://localhost:3000", "http://localhost:3001"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    # Restrict to the specific SocialOS Vercel project, not all of *.vercel.app
    allow_origin_regex=r"https://social(os|os-[a-z0-9\-]+)\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(posts.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(automation.router, prefix="/api")
app.include_router(media.router, prefix="/api")
app.include_router(oauth.router, prefix="/api")


# ── Public routes ─────────────────────────────────────────────────────────────
@app.get("/tiktokUa8acPuFtCCajoI4A6FIz32AiSnbh7of.txt", response_class=PlainTextResponse, include_in_schema=False)
def tiktok_domain_verification():
    return "tiktok-developers-site-verification=Ua8acPuFtCCajoI4A6FIz32AiSnbh7of"


@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok", "mock_mode": settings.USE_MOCK_DATA, "scheduler": scheduler.running}
