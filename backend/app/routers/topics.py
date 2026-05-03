from pathlib import Path
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Topic, TopicTimeSeries
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
    _=Depends(get_current_user),
):
    topics = db.query(Topic).filter(Topic.is_active == True).order_by(Topic.probability.desc()).all()
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
    return {"items": files}
