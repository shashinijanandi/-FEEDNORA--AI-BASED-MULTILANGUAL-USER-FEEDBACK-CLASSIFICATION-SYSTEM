import csv
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.models import Topic, TopicTimeSeries, TrendDirection

logger = logging.getLogger(__name__)

TOPIC_COLORS = [
    "#22d3ee", "#34d399", "#fbbf24", "#a78bfa", "#f472b6",
    "#60a5fa", "#fb7185", "#4ade80", "#f59e0b", "#2dd4bf",
]


@dataclass
class TopicModelMetadata:
    model_version: Optional[str]
    trained_at: Optional[str]
    dataset_size: Optional[int]


def _read_csv_rows(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def _as_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _as_int(value: Any, default: int = 0) -> int:
    try:
        if value is None or value == "":
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _get_first(data: Dict[str, str], keys: Iterable[str], default: Any = None) -> Any:
    for key in keys:
        if key in data and data[key] not in (None, ""):
            return data[key]
    return default


def _parse_keywords(raw: Any) -> List[Dict[str, Any]]:
    if raw is None:
        return []
    values = [part.strip() for part in str(raw).split(",") if part.strip()]
    if not values:
        return []
    size = max(len(values), 1)
    return [{"word": word, "weight": round((size - idx) / size, 3)} for idx, word in enumerate(values[:12])]


def _to_trend(raw: Any) -> TrendDirection:
    value = str(raw or "").strip().lower()
    if value == "rising":
        return TrendDirection.Rising
    if value == "falling":
        return TrendDirection.Falling
    return TrendDirection.Stable


def get_trained_topic_metadata() -> TopicModelMetadata:
    settings = get_settings()
    topics_csv = Path(settings.TOPIC_OUTPUT_CSV_PATH)
    dataset_csv = Path(settings.TOPIC_DATASET_CSV_PATH)

    model_version = settings.TOPIC_MODEL_VERSION or "trained-model"
    trained_at: Optional[str] = None
    dataset_size: Optional[int] = None

    if topics_csv.exists():
        trained_at = datetime.fromtimestamp(topics_csv.stat().st_mtime, tz=timezone.utc).isoformat()

    if dataset_csv.exists():
        # Subtract one to avoid counting CSV header
        dataset_size = max(sum(1 for _ in dataset_csv.open("r", encoding="utf-8", errors="ignore")) - 1, 0)

    return TopicModelMetadata(
        model_version=model_version,
        trained_at=trained_at,
        dataset_size=dataset_size,
    )


def sync_topics_from_artifacts(db: Session) -> int:
    """
    Read trained topic output CSV and upsert data into topics tables.
    Returns number of active topics synced.
    """
    settings = get_settings()
    topics_csv = Path(settings.TOPIC_OUTPUT_CSV_PATH)
    rows = _read_csv_rows(topics_csv)

    if not rows:
        logger.info("No topic artifacts found at %s; skipping sync", topics_csv)
        return 0

    logger.info("Syncing %d topics from %s", len(rows), topics_csv)

    # Soft reset all topics before repopulating model snapshot.
    db.query(TopicTimeSeries).delete()
    db.query(Topic).delete()

    active_topics = 0
    for idx, row in enumerate(rows, start=1):
        name = _get_first(row, ["topic_name", "label", "name"], f"Topic {idx}")
        doc_count = _as_int(_get_first(row, ["document_count", "doc_count", "count", "size"], 0), 0)
        probability_raw = _as_float(_get_first(row, ["probability", "pct", "percentage", "share"], 0.0), 0.0)
        probability = probability_raw / 100.0 if probability_raw > 1.0 else probability_raw

        topic = Topic(
            name=str(name),
            color=TOPIC_COLORS[(idx - 1) % len(TOPIC_COLORS)],
            keywords=_parse_keywords(_get_first(row, ["keywords", "top_keywords"], "")),
            probability=probability,
            doc_count=doc_count,
            trend=_to_trend(_get_first(row, ["trend", "trend_direction"], "stable")),
            trend_delta=_as_float(_get_first(row, ["trend_delta", "delta"], 0.0), 0.0),
            is_active=True,
        )
        db.add(topic)
        db.flush()

        period = _get_first(row, ["period", "month"], datetime.now(timezone.utc).strftime("%Y-%m"))
        db.add(
            TopicTimeSeries(
                topic_id=topic.id,
                period=str(period),
                probability=probability,
                doc_count=doc_count,
            )
        )
        active_topics += 1

    db.commit()
    return active_topics
