from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.database import get_db
from app.models.feedback import Feedback, FeedbackStatus
from app.services.topic_service import get_topic_service
from app.services.analytics_service import get_dashboard_analytics
from app.dependencies import get_current_active_user, require_admin
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

# ─── Topics Router ────────────────────────────────────────────────────────────
topics_router = APIRouter(prefix="/topics", tags=["Topic Modeling"])


@topics_router.get("/trending")
async def get_trending_topics(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get dynamically extracted trending topics from recent feedback."""
    from datetime import timedelta
    since = datetime.utcnow() - timedelta(days=days)

    feedbacks = db.query(Feedback.original_text).filter(
        Feedback.created_at >= since,
        Feedback.status == FeedbackStatus.processed,
    ).limit(500).all()

    texts = [f.original_text for f in feedbacks]
    service = get_topic_service()

    if not texts:
        # Return sample topics if no data
        texts = [
            "The product quality is excellent and very durable",
            "Customer service was slow to respond",
            "Delivery was late by two days",
            "Pricing is very reasonable for the quality",
            "The app interface is confusing to navigate",
        ]

    topics = service.analyze_batch(texts)
    return {
        "generated_at": datetime.utcnow().isoformat(),
        "period_days": days,
        "total_feedbacks_analyzed": len(texts),
        "topics": topics,
    }


@topics_router.get("/for-feedback/{feedback_id}")
async def get_feedback_topics(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get topics extracted for a specific feedback."""
    from app.models.user import UserRole
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Feedback not found")
    if feedback.user_id != current_user.id and current_user.role != UserRole.admin:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "feedback_id": feedback_id,
        "topics": feedback.extracted_topics or [],
        "dominant_topic": feedback.dominant_topic,
    }


# ─── Analytics Router ─────────────────────────────────────────────────────────
analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])


@analytics_router.get("/dashboard")
async def get_analytics_dashboard(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get full analytics dashboard data."""
    data = get_dashboard_analytics(db, days=days)

    # Enrich with trending topics
    service = get_topic_service()
    feedbacks = db.query(Feedback.original_text).filter(
        Feedback.status == FeedbackStatus.processed
    ).limit(200).all()
    texts = [f.original_text for f in feedbacks] or ["placeholder feedback for topic modeling"]
    topics = service.analyze_batch(texts)
    data["top_topics"] = [
        {
            "label": t["label"],
            "count": t.get("document_count", 0),
            "trend": t.get("trend", "stable"),
            "keywords": [kw["word"] for kw in t["keywords"][:4]],
            "avg_sentiment": "positive",
        }
        for t in topics[:6]
    ]
    return data


@analytics_router.get("/sentiment-summary")
async def sentiment_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Quick sentiment distribution summary."""
    from sqlalchemy import func
    from app.models.feedback import SentimentLabel
    results = db.query(
        Feedback.sentiment, func.count(Feedback.id).label("count")
    ).group_by(Feedback.sentiment).all()

    total = sum(r.count for r in results) or 1
    return {
        "distribution": [
            {
                "label": r.sentiment.value if r.sentiment else "processing",
                "count": r.count,
                "percentage": round(r.count / total * 100, 1),
            }
            for r in results
        ],
        "total": total,
    }


@analytics_router.get("/users", dependencies=[Depends(require_admin)])
async def get_user_analytics(db: Session = Depends(get_db)):
    """[Admin Only] Get user registration and activity analytics."""
    from app.models.user import User
    from sqlalchemy import func
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
    }
