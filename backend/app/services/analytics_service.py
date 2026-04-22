from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta, timezone
from app.models.models import Feedback, Topic, TopicTimeSeries, SentimentLabel


def get_dashboard_kpi(db: Session) -> dict:
    total = db.query(func.count(Feedback.id)).scalar() or 0

    pos = db.query(func.count(Feedback.id)).filter(Feedback.sentiment == SentimentLabel.positive).scalar() or 0
    neg = db.query(func.count(Feedback.id)).filter(Feedback.sentiment == SentimentLabel.negative).scalar() or 0

    satisfaction = round((pos / total * 100), 1) if total else 0.0
    negative_pct = round((neg / total * 100), 1) if total else 0.0

    today = datetime.now(timezone.utc).date()
    ai_today = db.query(func.count(Feedback.id)).filter(
        func.date(Feedback.created_at) == today,
        Feedback.generated_response.isnot(None),
    ).scalar() or 0

    avg_bleu = db.query(func.avg(Feedback.bleu_score)).filter(Feedback.bleu_score.isnot(None)).scalar()
    avg_conf = db.query(func.avg(Feedback.model_confidence)).filter(Feedback.model_confidence.isnot(None)).scalar()

    return {
        "total_feedback":     total,
        "satisfaction_rate":  satisfaction,
        "negative_percent":   negative_pct,
        "ai_responses_today": ai_today,
        "avg_bleu":           round(float(avg_bleu or 0.0), 3),
        "avg_confidence":     round(float(avg_conf or 0.0), 1),
    }


def get_sentiment_distribution(db: Session) -> list:
    total = db.query(func.count(Feedback.id)).scalar() or 1
    rows = db.query(
        Feedback.sentiment,
        func.count(Feedback.id).label("cnt")
    ).group_by(Feedback.sentiment).all()

    color_map = {
        SentimentLabel.positive: "#34d399",
        SentimentLabel.neutral:  "#64748b",
        SentimentLabel.negative: "#f87171",
    }
    label_map = {
        SentimentLabel.positive: "Positive",
        SentimentLabel.neutral:  "Neutral",
        SentimentLabel.negative: "Negative",
    }

    return [
        {
            "name":  label_map.get(r.sentiment, str(r.sentiment)),
            "value": round(r.cnt / total * 100, 1),
            "color": color_map.get(r.sentiment, "#64748b"),
        }
        for r in rows if r.sentiment
    ]


def get_topic_distribution(db: Session) -> list:
    total = db.query(func.count(Feedback.id)).scalar() or 1
    rows = db.query(
        Feedback.detected_topic,
        func.count(Feedback.id).label("cnt")
    ).filter(
        Feedback.detected_topic.isnot(None)
    ).group_by(Feedback.detected_topic).order_by(func.count(Feedback.id).desc()).limit(8).all()

    return [
        {
            "topic": r.detected_topic,
            "count": r.cnt,
            "pct":   round(r.cnt / total * 100, 1),
        }
        for r in rows
    ]


def get_recent_feedback(db: Session, limit: int = 10) -> list:
    return (
        db.query(Feedback)
        .order_by(Feedback.created_at.desc())
        .limit(limit)
        .all()
    )
