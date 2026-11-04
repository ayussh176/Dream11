from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.api.api import api_router
from app.database.base import Base
from app.database.session import engine, SessionLocal
from app.models.match import Match
from app.database.seed import seed_demo_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schemas on startup
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed demo match if not present
    db = SessionLocal()
    try:
        match = db.get(Match, "demo-t20-m01")
        if not match:
            seed_demo_data(db)
    finally:
        db.close()
    
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for DugoutAI — AI-Powered Cricket Tactical Companion",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
origins = list(set([settings.FRONTEND_ORIGIN] + settings.ALLOWED_ORIGINS))
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Centralized Exception Handlers
register_exception_handlers(app)

# Include API Router under /api prefix
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/", tags=["Root"])
def root():
    return {
        "name": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "health_check": f"{settings.API_PREFIX}/health",
        "documentation": "/docs",
    }
