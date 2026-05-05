
""" from pathlib import Path
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Topic, Feedback, User
from app.schemas.schemas import TopicOut, KeywordWeight, TimeSeriesPoint
from app.dependencies import get_current_user
from app.config import get_settings
from app.services.topic_artifact_service import get_trained_topic_metadata, sync_topics_from_artifacts

router = APIRouter(prefix="/topics", tags=["Topics"])


def _serialize_topic(t: Topic) -> TopicOut:
    metadata = get_trained_topic_metadata()
    kw = []
    if t.keywords:
        kw = [KeywordWeight(word=k["word"], weight=k["weight"]) for k in t.keywords]
    ts = []
    if t.time_series:
        ts = [
            TimeSeriesPoint(period=s.period, probability=s.probability, doc_count=s.doc_count)
            for s in sorted(t.time_series, key=lambda x: x.period)
        ]
    return TopicOut(
        id=t.id, name=t.name, color=t.color, keywords=kw,
        probability=t.probability, doc_count=t.doc_count,
        trend=t.trend, trend_delta=t.trend_delta, time_series=ts,
        model_version=metadata.model_version,
        trained_at=metadata.trained_at,
        dataset_size=metadata.dataset_size,
    )


@router.get("/", response_model=List[TopicOut])
def list_topics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    from_user_feedback: bool = Query(
        False,
        description="If true, return only topics whose names appear as detected_topic on this user's analyzed feedback.",
    ),
):
    q = db.query(Topic).filter(Topic.is_active == True)
    if from_user_feedback:
        names = [
            row[0]
            for row in (
                db.query(Feedback.detected_topic)
                .filter(
                    Feedback.user_id == current_user.id,
                    Feedback.detected_topic.isnot(None),
                    Feedback.detected_topic != "",
                )
                .distinct()
                .all()
            )
        ]
        if not names:
            return []
        q = q.filter(Topic.name.in_(names))
    topics = q.order_by(Topic.probability.desc()).all()
    return [_serialize_topic(t) for t in topics]


@router.get("/{topic_id}", response_model=TopicOut)
def get_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Topic not found")
    return _serialize_topic(topic)


@router.post("/reload")
def reload_topics_from_artifacts(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    synced = sync_topics_from_artifacts(db)
    return {"synced_topics": synced, "source": "trained_artifacts_csv"}


@router.get("/artifacts")
def list_topic_artifacts(_=Depends(get_current_user)):
    settings = get_settings()
    artifact_dir = Path(settings.TOPIC_ARTIFACTS_DIR)
    names = [
        "evaluation_charts.png",
        "f1_accuracy_evaluation.png",
        "confusion_matrix.png",
        "threshold_analysis.png",
        "topic_distribution.png",
        "umap_cluster_plot.png",
    ]
    files = []
    for name in names:
        path = artifact_dir / name
        if path.exists():
            files.append({"name": name, "url": f"/artifacts/{name}"})
    return {"items": files}  """

from pathlib import Path
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Topic, Feedback, User
from app.schemas.schemas import TopicOut, KeywordWeight, TimeSeriesPoint
from app.dependencies import get_current_user
from app.config import get_settings
from app.services.topic_artifact_service import (
    get_trained_topic_metadata,
    sync_topics_from_artifacts,
    TOPIC_COLORS,
)

router = APIRouter(prefix="/topics", tags=["Topics"])


def _serialize_topic(t: Topic) -> TopicOut:
    metadata = get_trained_topic_metadata()
    kw = []
    if t.keywords:
        kw = [KeywordWeight(word=k["word"], weight=k["weight"]) for k in t.keywords]
    ts = []
    if t.time_series:
        ts = [
            TimeSeriesPoint(period=s.period, probability=s.probability, doc_count=s.doc_count)
            for s in sorted(t.time_series, key=lambda x: x.period)
        ]
    return TopicOut(
        id=t.id, name=t.name, color=t.color, keywords=kw,
        probability=t.probability, doc_count=t.doc_count,
        trend=t.trend, trend_delta=t.trend_delta, time_series=ts,
        model_version=metadata.model_version,
        trained_at=metadata.trained_at,
        dataset_size=metadata.dataset_size,
    )


@router.get("/", response_model=List[TopicOut])
def list_topics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    from_user_feedback: bool = Query(
        False,
        description="If true, return only topics whose names appear as detected_topic on this user's analyzed feedback.",
    ),
    latest_only: bool = Query(
        False,
        description="If true, return only the latest analyzed feedback topic for the current user.",
    ),
):
    q = db.query(Topic).filter(Topic.is_active == True)
    if latest_only:
        latest_feedback = (
            db.query(Feedback.detected_topic)
            .filter(
                Feedback.detected_topic.isnot(None),
                Feedback.detected_topic != "",
            )
            .order_by(Feedback.created_at.desc())
            .first()
        )
        if not latest_feedback or not latest_feedback[0]:
            return []
        q = q.filter(Topic.name == latest_feedback[0])
    elif from_user_feedback:
        names = [
            row[0]
            for row in (
                db.query(Feedback.detected_topic)
                .filter(
                    Feedback.user_id == current_user.id,
                    Feedback.detected_topic.isnot(None),
                    Feedback.detected_topic != "",
                )
                .distinct()
                .all()
            )
        ]
        if not names:
            return []
        q = q.filter(Topic.name.in_(names))
    topics = q.order_by(Topic.probability.desc()).all()
    return [_serialize_topic(t) for t in topics]


@router.get("/latest-from-feedback")
def latest_from_feedback(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Build the Topic Modeling page payload directly from the most recent
    `feedbacks` row (same record Dashboard shows as 'Last Analyzed Feedback').
    Independent of the `topics` table, so it works regardless of LDA sync state.
    """
    fb = (
        db.query(Feedback)
        .filter(Feedback.detected_topic.isnot(None), Feedback.detected_topic != "")
        .order_by(Feedback.created_at.desc())
        .first()
    )
    if not fb:
        return {"topic": None, "feedback": None}

    name = fb.detected_topic
    raw_kw = fb.topic_keywords or []
    if isinstance(raw_kw, str):
        raw_kw = [w.strip() for w in raw_kw.split(",") if w.strip()]
    n = max(len(raw_kw), 1)
    keywords = [
        {"word": str(w), "weight": round((n - i) / n, 3)}
        for i, w in enumerate(raw_kw[:12])
    ]

    raw_prob = float(fb.topic_probability or 0.0)
    probability = raw_prob / 100.0 if raw_prob > 1.0 else raw_prob

    doc_count = (
        db.query(func.count(Feedback.id))
        .filter(Feedback.detected_topic == name)
        .scalar()
        or 0
    )

    series_rows = (
        db.query(
            func.to_char(Feedback.created_at, "YYYY-MM").label("period"),
            func.count(Feedback.id).label("cnt"),
        )
        .filter(Feedback.detected_topic == name)
        .group_by("period")
        .order_by("period")
        .all()
    )
    total_cnt = sum(r[1] for r in series_rows) or 1
    time_series = [
        {
            "period": r[0],
            "probability": round(r[1] / total_cnt, 4),
            "doc_count": int(r[1]),
        }
        for r in series_rows
    ]

    color = TOPIC_COLORS[abs(hash(name)) % len(TOPIC_COLORS)]
    metadata = get_trained_topic_metadata()

    return {
        "topic": {
            "id": fb.id,
            "name": name,
            "color": color,
            "keywords": keywords,
            "probability": probability,
            "doc_count": int(doc_count),
            "trend": "Stable",
            "trend_delta": 0,
            "time_series": time_series,
            "model_version": metadata.model_version,
            "trained_at": metadata.trained_at,
            "dataset_size": metadata.dataset_size,
        },
        "feedback": {
            "id": fb.id,
            "text": fb.text,
            "sentiment": fb.sentiment.value if fb.sentiment else None,
            "created_at": fb.created_at,
        },
    }


@router.get("/{topic_id}", response_model=TopicOut)
def get_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Topic not found")
    return _serialize_topic(topic)


@router.post("/reload")
def reload_topics_from_artifacts(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    synced = sync_topics_from_artifacts(db)
    return {"synced_topics": synced, "source": "trained_artifacts_csv"}


@router.get("/artifacts")
def list_topic_artifacts(_=Depends(get_current_user)):
    settings = get_settings()
    artifact_dir = Path(settings.TOPIC_ARTIFACTS_DIR)
    names = [
        "evaluation_charts.png",
        "f1_accuracy_evaluation.png",
        "confusion_matrix.png",
        "threshold_analysis.png",
        "topic_distribution.png",
        "umap_cluster_plot.png",
    ]
    files = []
    for name in names:
        path = artifact_dir / name
        if path.exists():
            files.append({"name": name, "url": f"/artifacts/{name}"})
    return {"items": files}