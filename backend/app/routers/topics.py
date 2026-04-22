from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Topic, TopicTimeSeries
from app.schemas.schemas import TopicOut, KeywordWeight, TimeSeriesPoint
from app.dependencies import get_current_user

router = APIRouter(prefix="/topics", tags=["Topics"])


def _serialize_topic(t: Topic) -> TopicOut:
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
