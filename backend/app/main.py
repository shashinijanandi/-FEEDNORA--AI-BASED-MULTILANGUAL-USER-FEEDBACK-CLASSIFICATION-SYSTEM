from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import logging

from app.config import settings
from app.database import create_tables
from app.utils.logger import setup_logging
from app.routers.auth import router as auth_router
from app.routers.feedback import router as feedback_router
from app.routers.users import router as users_router
from app.routers.topics_analytics import topics_router, analytics_router

# ─── Startup / Shutdown ───────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger = logging.getLogger(__name__)
    logger.info("🚀 Starting AI Feedback Analytics Platform...")

    # Initialize DB tables
    create_tables()
    logger.info("✅ Database tables ready")

    # Pre-load AI models
    from app.services.ai_service import get_sentiment_service
    from app.services.topic_service import get_topic_service
    from app.services.feednora_service import get_feednora_service
    get_sentiment_service()
    get_topic_service()
    get_feednora_service()  
    logger.info("✅ AI services initialized")

    yield

    logger.info("⛔ Shutting down...")


# ─── App Instance ─────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## AI-Based Multilingual Feedback Analytics Platform

### Research Components
- **Component 1**: Personalized Feedback Response Generation (NLP Sentiment Analysis)
- **Component 2**: Dynamic Topic Modeling (LDA-based trending topic extraction)

### Features
- JWT-based authentication with role-based access control
- Real-time sentiment analysis with 7 emotion categories
- AI-generated personalized responses
- Dynamic topic extraction from feedback corpus
- Multilingual support (EN, SI, TA)
- Comprehensive analytics dashboard
    """,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ─── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_timing_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)
    response.headers["X-Process-Time-Ms"] = str(duration)
    return response


# ─── Global Exception Handlers ────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger = logging.getLogger(__name__)
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred"},
    )


# ─── Routers ──────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(feedback_router, prefix=API_PREFIX)
app.include_router(users_router, prefix=API_PREFIX)
app.include_router(topics_router, prefix=API_PREFIX)
app.include_router(analytics_router, prefix=API_PREFIX)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    from app.services.ai_service import get_sentiment_service
    service = get_sentiment_service()
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "ai_model_loaded": service.model is not None,
        "vectorizer_loaded": service.vectorizer is not None,
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "AI Feedback Analytics Platform API",
        "docs": "/api/docs",
        "health": "/health",
        "version": settings.APP_VERSION,
    }
