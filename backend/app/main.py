from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import get_settings
from app.database import create_tables, SessionLocal
from app.utils.logger import setup_logging
from app.routers import auth, feedback, topics, analytics, users

logger = logging.getLogger(__name__)
settings = get_settings()


def seed_topics(db):
    """Seed initial topic data if topics table is empty."""
    from app.models.models import Topic, TopicTimeSeries, TrendDirection

    if db.query(Topic).count() > 0:
        return

    seed_data = [
        {
            "name": "Delivery & Shipping", "color": "#22d3ee",
            "probability": 0.277, "doc_count": 6840,
            "trend": TrendDirection.Rising, "trend_delta": 4.2,
            "keywords": [
                {"word": "delivery", "weight": 0.91}, {"word": "delayed", "weight": 0.89},
                {"word": "tracking", "weight": 0.84}, {"word": "shipping", "weight": 0.81},
                {"word": "courier", "weight": 0.76}, {"word": "transit", "weight": 0.72},
                {"word": "dispatch", "weight": 0.68}, {"word": "logistics", "weight": 0.65},
            ],
            "time_series": [
                ("2024-08", 0.28, 890), ("2024-09", 0.30, 920), ("2024-10", 0.25, 810),
                ("2024-11", 0.34, 1050), ("2024-12", 0.44, 1420), ("2025-01", 0.32, 980),
                ("2025-02", 0.29, 890), ("2025-03", 0.27, 840),
            ],
        },
        {
            "name": "Product Quality", "color": "#34d399",
            "probability": 0.220, "doc_count": 5423,
            "trend": TrendDirection.Stable, "trend_delta": -0.8,
            "keywords": [
                {"word": "quality", "weight": 0.93}, {"word": "defective", "weight": 0.85},
                {"word": "material", "weight": 0.79}, {"word": "broken", "weight": 0.77},
                {"word": "damaged", "weight": 0.74}, {"word": "authentic", "weight": 0.71},
                {"word": "genuine", "weight": 0.67}, {"word": "counterfeit", "weight": 0.63},
            ],
            "time_series": [
                ("2024-08", 0.24, 720), ("2024-09", 0.22, 680), ("2024-10", 0.26, 790),
                ("2024-11", 0.20, 630), ("2024-12", 0.18, 560), ("2025-01", 0.21, 650),
                ("2025-02", 0.23, 700), ("2025-03", 0.22, 680),
            ],
        },
        # ... Add other topics as needed
    ]

    for td in seed_data:
        topic = Topic(
            name=td["name"], color=td["color"],
            probability=td["probability"], doc_count=td["doc_count"],
            trend=td["trend"], trend_delta=td["trend_delta"],
            keywords=td["keywords"],
        )
        db.add(topic)
        db.flush()
        for period, prob, count in td["time_series"]:
            db.add(TopicTimeSeries(topic_id=topic.id, period=period, probability=prob, doc_count=count))

    db.commit()
    logger.info("✅ Topics seeded")


def seed_feedback(db):
    """Seed sample feedback records if empty."""
    from app.models.models import Feedback, SentimentLabel, ApprovalStatus

    if db.query(Feedback).count() > 0:
        return

    samples = [
        {
            "text": "My order has been stuck in transit for 5 days without any tracking update. Very frustrating.",
            "language": "EN", "product_category": "Electronics",
            "sentiment": SentimentLabel.negative, "sentiment_conf": 94.2,
            "detected_topic": "Delivery & Shipping", "topic_probability": 91.7,
            "topic_keywords": ["stuck", "transit", "tracking", "update"],
            "generated_response": "We sincerely apologize for the delay. Our logistics team will investigate immediately.",
            "approval_status": ApprovalStatus.needs_review,
            "bleu_score": 0.782, "rouge_l_score": 0.741, "semantic_similarity": 87.4, "model_confidence": 94.2,
        },
        {
            "text": "Excellent quality product! Arrived earlier than expected and packaging was perfect.",
            "language": "EN", "product_category": "Fashion",
            "sentiment": SentimentLabel.positive, "sentiment_conf": 97.1,
            "detected_topic": "Product Quality", "topic_probability": 88.4,
            "topic_keywords": ["excellent", "quality", "packaging"],
            "generated_response": "Thank you for your wonderful feedback! We are delighted the product met your expectations.",
            "approval_status": ApprovalStatus.auto,
            "bleu_score": 0.814, "rouge_l_score": 0.779, "semantic_similarity": 91.2, "model_confidence": 97.1,
        },
        # ... Add other sample feedbacks as needed
    ]

    for s in samples:
        db.add(Feedback(**s))

    db.commit()
    logger.info("✅ Sample feedbacks seeded")


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(settings.DEBUG)
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    create_tables()
    db = SessionLocal()
    try:
        seed_topics(db)
        seed_feedback(db)
    finally:
        db.close()
    yield
    logger.info("👋 Shutting down")


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered multilingual feedback analytics platform for e-commerce",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
for router_module in [auth, feedback, topics, analytics, users]:
    app.include_router(router_module.router, prefix=settings.API_PREFIX)


@app.get("/health")
def health():
    return {"status": "healthy", "version": settings.APP_VERSION, "service": settings.APP_NAME}


@app.get("/")
def root():
    return {"message": f"Welcome to {settings.APP_NAME}", "docs": f"{settings.API_PREFIX}/docs"}