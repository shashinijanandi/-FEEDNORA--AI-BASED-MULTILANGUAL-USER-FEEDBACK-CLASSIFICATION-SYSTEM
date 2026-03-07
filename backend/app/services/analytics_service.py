from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta
from typing import Dict, List
from app.models.feedback import Feedback, SentimentLabel, FeedbackStatus
from app.models.user import User
import logging

logger = logging.getLogger(__name__)


def get_dashboard_analytics(db: Session, days: int = 30) -> Dict:
    since = datetime.utcnow() - timedelta(days=days)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Overall stats
    total_feedbacks = db.query(func.count(Feedback.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0
    processed_today = db.query(func.count(Feedback.id)).filter(
        Feedback.created_at >= today_start,
        Feedback.status == FeedbackStatus.processed
    ).scalar() or 0
    avg_conf = db.query(func.avg(Feedback.confidence_score)).scalar()
    avg_confidence = round(float(avg_conf), 4) if avg_conf else 0.0

    # Sentiment distribution
    sentiment_counts = db.query(
        Feedback.sentiment, func.count(Feedback.id).label("cnt")
    ).filter(
        Feedback.created_at >= since,
        Feedback.sentiment.isnot(None)
    ).group_by(Feedback.sentiment).all()

    total_sentiment = sum(r.cnt for r in sentiment_counts) or 1
    sentiment_distribution = [
        {
            "label": r.sentiment.value if r.sentiment else "unknown",
            "count": r.cnt,
            "percentage": round(r.cnt / total_sentiment * 100, 1),
        }
        for r in sentiment_counts
    ]

    most_common = max(sentiment_distribution, key=lambda x: x["count"])["label"] if sentiment_distribution else "neutral"

    # Daily trends (last 7 days)
    daily_trends = []
    for i in range(7, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        rows = db.query(
            Feedback.sentiment, func.count(Feedback.id).label("cnt")
        ).filter(
            Feedback.created_at >= day_start,
            Feedback.created_at < day_end,
        ).group_by(Feedback.sentiment).all()

        sentiment_day = {r.sentiment.value if r.sentiment else "neutral": r.cnt for r in rows}
        daily_trends.append({
            "date": day.strftime("%Y-%m-%d"),
            "total": sum(sentiment_day.values()),
            "happiness": sentiment_day.get("happiness", 0),
            "sadness": sentiment_day.get("sadness", 0),
            "anger": sentiment_day.get("anger", 0),
            "disgust": sentiment_day.get("disgust", 0),
            "fear": sentiment_day.get("fear", 0),
            "surprise": sentiment_day.get("surprise", 0),
            "neutral": sentiment_day.get("neutral", 0),
        })

    # Recent feedbacks
    recent_feedbacks = db.query(Feedback).order_by(
        Feedback.created_at.desc()
    ).limit(10).all()

    recent_list = [
        {
            "id": f.id,
            "text_preview": f.original_text[:80] + "..." if len(f.original_text) > 80 else f.original_text,
            "sentiment": f.sentiment.value if f.sentiment else "processing",
            "confidence": f.confidence_score,
            "created_at": f.created_at.isoformat(),
            "language": f.detected_language,
        }
        for f in recent_feedbacks
    ]

    # Language distribution
    lang_counts = db.query(
        Feedback.detected_language, func.count(Feedback.id).label("cnt")
    ).group_by(Feedback.detected_language).all()

    lang_dist = [{"language": r.detected_language, "count": r.cnt} for r in lang_counts]

    return {
        "overall": {
            "total_feedbacks": total_feedbacks,
            "total_users": total_users,
            "processed_today": processed_today,
            "avg_confidence": avg_confidence,
            "most_common_sentiment": most_common,
            "dominant_topic": "Product Quality & Durability",
        },
        "sentiment_distribution": sentiment_distribution,
        "daily_trends": daily_trends,
        "top_topics": [],  # populated by topic service
        "recent_feedbacks": recent_list,
        "language_distribution": lang_dist or [{"language": "en", "count": total_feedbacks}],
    }
