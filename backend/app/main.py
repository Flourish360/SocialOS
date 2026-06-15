from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .core.config import settings
from .api import auth, accounts, posts, analytics, ai, automation
from .api import media, oauth
from .db.database import engine, Base
from .models import user, social_account, post  # ensure models are registered
from .scheduler import scheduler

Base.metadata.create_all(bind=engine)


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
app.include_router(media.router, prefix="/api")
app.include_router(oauth.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "mock_mode": settings.USE_MOCK_DATA, "scheduler": scheduler.running}
