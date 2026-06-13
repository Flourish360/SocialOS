from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api import auth, accounts, posts, analytics, ai, automation
from .db.database import engine, Base
from .models import user, social_account, post  # ensure models are registered

# Create all tables on startup (SQLite dev mode; use Alembic migrations for production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Social Platform API",
    version="0.1.0",
    description="AI-powered social media management platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
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


@app.get("/health")
def health():
    return {"status": "ok", "mock_mode": settings.USE_MOCK_DATA}
