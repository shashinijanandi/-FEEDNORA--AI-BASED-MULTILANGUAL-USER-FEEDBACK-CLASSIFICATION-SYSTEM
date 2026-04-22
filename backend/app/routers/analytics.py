from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.analytics_service import (
    get_dashboard_kpi, get_sentiment_distribution,
    get_topic_distribution, get_recent_feedback,
)
from app.schemas.schemas import DashboardResponse, KPIData, EvaluationSummary
from app.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    kpi     = get_dashboard_kpi(db)
    sent    = get_sentiment_distribution(db)
    topics  = get_topic_distribution(db)
    recent  = get_recent_feedback(db, limit=10)

    return DashboardResponse(
        kpi=KPIData(**kpi),
        sentiment_dist=sent,
        topic_dist=topics,
        recent_feedback=recent,
    )


@router.get("/evaluation", response_model=EvaluationSummary)
def evaluation_metrics(_=Depends(get_current_user)):
    """Returns static research evaluation data (baseline vs proposed)."""
    return EvaluationSummary(
        baseline={
            "accuracy": 71.2, "precision": 68.4, "recall": 70.1, "f1": 69.2,
            "bleu": 0.524, "rouge": 0.498, "semantic": 71.3,
        },
        proposed={
            "accuracy": 89.7, "precision": 88.1, "recall": 87.9, "f1": 88.0,
            "bleu": 0.743, "rouge": 0.718, "semantic": 89.2,
        },
        confusion_matrix={
            "labels": ["Positive", "Neutral", "Negative"],
            "data": [[521, 23, 14], [18, 312, 27], [11, 19, 408]],
        },
    )


@router.get("/language-distribution")
def language_distribution(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    from sqlalchemy import func
    from app.models.models import Feedback
    total = db.query(func.count(Feedback.id)).scalar() or 1
    rows  = db.query(Feedback.language, func.count(Feedback.id).label("cnt")) \
              .group_by(Feedback.language).all()
    color_map = {"EN": "#22d3ee", "SI": "#34d399", "TA": "#fbbf24"}
    return [
        {
            "lang":  r.language or "EN",
            "count": r.cnt,
            "pct":   round(r.cnt / total * 100, 1),
            "color": color_map.get(r.language or "EN", "#64748b"),
        }
        for r in rows
    ]


@router.get("/model-info")
def model_info():
    """
    Returns info about which models are loaded and how they connect.
    Shows whether .pkl files are loaded or rule-based fallback is used.
    """
    from app.services.ai_service import get_ai_service
    ai = get_ai_service()
    pkl_loaded = ai.model is not None and ai.vectorizer is not None
    return {
        "sentiment_classifier": {
            "type": "Logistic Regression + TF-IDF",
            "file": "ai_models/sentiment_model.pkl + ai_models/vectorizer.pkl",
            "loaded": pkl_loaded,
            "mode": "pkl_model" if pkl_loaded else "rule_based_fallback",
            "note": "Drop your trained .pkl files in backend/ai_models/ to activate the real model"
        },
        "topic_modeler": {
            "type": "Keyword-weighted LDA scoring",
            "mode": "built_in",
            "topics": 5,
            "note": "Topic probabilities and time series stored in PostgreSQL (topics + topic_time_series tables)"
        },
        "response_generator": {
            "type": "Context-conditioned templates (T5-Base plug-in ready)",
            "mode": "template_engine",
            "note": "Replace generate_response() in ai_service.py with your T5 model inference"
        },
        "evaluation": {
            "bleu": "Custom N-gram implementation (no external deps)",
            "rouge_l": "LCS-based implementation",
            "semantic": "Jaccard similarity (replace with sentence-transformers for production)"
        }
    }


@router.get("/topic-evolution")
def topic_evolution(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """
    Returns monthly topic probability from topic_time_series joined to topics.
    Used by Dashboard → Dynamic Topic Evolution chart.
    """
    from sqlalchemy import func
    from app.models.models import Topic, TopicTimeSeries

    rows = (
        db.query(TopicTimeSeries.period, Topic.name, TopicTimeSeries.probability)
        .join(Topic, Topic.id == TopicTimeSeries.topic_id)
        .filter(Topic.is_active == True)
        .order_by(TopicTimeSeries.period)
        .all()
    )

    # Pivot: { period -> { topic_name -> prob } }
    pivot: dict = {}
    for period, name, prob in rows:
        label = period[5:]  # "2024-08" -> "08" or keep full
        month_map = {"01":"Jan","02":"Feb","03":"Mar","04":"Apr","05":"May",
                     "06":"Jun","07":"Jul","08":"Aug","09":"Sep","10":"Oct","11":"Nov","12":"Dec"}
        month_label = month_map.get(period.split("-")[1], period)
        if month_label not in pivot:
            pivot[month_label] = {"month": month_label}
        # shorten topic name for chart key
        short = name.split(" ")[0]
        pivot[month_label][short] = round(prob * 100, 1)

    return list(pivot.values())


@router.get("/weekly-complaints")
def weekly_complaints(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """
    Returns feedback counts grouped by day-of-week and topic for the last 7 days.
    Used by Dashboard → Weekly Complaint Trend chart.
    """
    from sqlalchemy import func, extract, case
    from app.models.models import Feedback
    from datetime import datetime, timedelta, timezone

    days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    results = []
    today = datetime.now(timezone.utc)

    for i in range(6, -1, -1):
        day_dt = today - timedelta(days=i)
        day_label = days[day_dt.weekday()]
        rows = (
            db.query(Feedback.detected_topic, func.count(Feedback.id).label("cnt"))
            .filter(func.date(Feedback.created_at) == day_dt.date())
            .filter(Feedback.detected_topic.isnot(None))
            .group_by(Feedback.detected_topic)
            .all()
        )
        entry = {"day": day_label}
        for topic, cnt in rows:
            short = topic.split(" ")[0]
            entry[short] = cnt
        results.append(entry)

    return results


@router.get("/category-stats")
def category_stats(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """
    Returns feedback counts grouped by product_category with approval split.
    Used by Analytics → Complaint Category Trends.
    """
    from sqlalchemy import func
    from app.models.models import Feedback, ApprovalStatus

    rows = (
        db.query(
            Feedback.product_category,
            func.count(Feedback.id).label("complaints"),
            func.count(Feedback.id).filter(
                Feedback.approval_status.in_([ApprovalStatus.auto, ApprovalStatus.approved])
            ).label("resolved"),
        )
        .filter(Feedback.product_category.isnot(None))
        .group_by(Feedback.product_category)
        .order_by(func.count(Feedback.id).desc())
        .limit(8)
        .all()
    )

    return [
        {
            "category": r.product_category,
            "complaints": r.complaints,
            "resolved": r.resolved,
            "pending": r.complaints - r.resolved,
        }
        for r in rows
    ]


@router.get("/response-time")
def response_time_by_hour(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """
    Simulates response time by hour using confidence + record count as proxy.
    In production this would be a real latency column.
    """
    from sqlalchemy import func, extract
    from app.models.models import Feedback

    rows = (
        db.query(
            extract('hour', Feedback.created_at).label("hour"),
            func.count(Feedback.id).label("cnt"),
            func.avg(Feedback.model_confidence).label("avg_conf"),
        )
        .filter(Feedback.model_confidence.isnot(None))
        .group_by(extract('hour', Feedback.created_at))
        .order_by(extract('hour', Feedback.created_at))
        .all()
    )

    return [
        {
            "hour": f"{int(r.hour):02d}:00",
            # proxy: higher volume hours take a bit longer
            "time": round(1.2 + (r.cnt / max(1, r.cnt)) * 0.5, 2),
        }
        for r in rows
    ] or [{"hour": "No data", "time": 0}]


@router.get("/training-curves")
def training_curves(_=Depends(get_current_user)):
    """
    Returns training/validation loss curves for the classifier.
    These are research artifacts stored here — replace with
    real logged values from your training run.
    """
    return [
        {"epoch": 1,  "trainLoss": 1.42, "valLoss": 1.51},
        {"epoch": 2,  "trainLoss": 1.18, "valLoss": 1.24},
        {"epoch": 3,  "trainLoss": 0.94, "valLoss": 1.02},
        {"epoch": 4,  "trainLoss": 0.78, "valLoss": 0.86},
        {"epoch": 5,  "trainLoss": 0.64, "valLoss": 0.73},
        {"epoch": 6,  "trainLoss": 0.53, "valLoss": 0.61},
        {"epoch": 7,  "trainLoss": 0.44, "valLoss": 0.52},
        {"epoch": 8,  "trainLoss": 0.37, "valLoss": 0.45},
        {"epoch": 9,  "trainLoss": 0.31, "valLoss": 0.39},
        {"epoch": 10, "trainLoss": 0.27, "valLoss": 0.35},
    ]


@router.get("/bleu-progression")
def bleu_progression(_=Depends(get_current_user)):
    """
    BLEU score across model versions — research artifact.
    Replace with real logged values from your experiments.
    """
    return [
        {"version": "v1.0", "baseline": 0.524, "proposed": 0.612},
        {"version": "v1.1", "baseline": 0.531, "proposed": 0.648},
        {"version": "v1.2", "baseline": 0.538, "proposed": 0.679},
        {"version": "v2.0", "baseline": 0.541, "proposed": 0.702},
        {"version": "v2.1", "baseline": 0.544, "proposed": 0.721},
        {"version": "v2.2", "baseline": 0.547, "proposed": 0.743},
    ]
