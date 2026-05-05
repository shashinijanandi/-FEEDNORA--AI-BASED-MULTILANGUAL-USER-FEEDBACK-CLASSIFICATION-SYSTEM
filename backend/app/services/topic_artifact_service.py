import csv
import logging
from dataclasses import dataclass
from functools import lru_cache
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


@lru_cache(maxsize=1)
def get_trained_topic_metadata() -> TopicModelMetadata:
    """
    Cached: counting labeled_feedback.csv lines is O(rows) and must not run once per topic
    (list view serializes 1000+ topics → was exceeding the HTTP client 30s timeout).
    """
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


def clear_trained_topic_metadata_cache() -> None:
    get_trained_topic_metadata.cache_clear()


def _unique_topic_name(
    base_name: str,
    cluster_id: Optional[str],
    row_index: int,
    used_lower: set,
) -> str:
    """
    topics.name is UNIQUE in the DB; BERTopic-style exports can repeat topic_name
    for different cluster_id values. First row keeps the label; collisions get
    a stable suffix from cluster_id or row index.
    """
    raw = str(base_name).strip() if base_name else ""
    if not raw:
        raw = f"Topic {row_index}"
    key = raw.lower()
    if key not in used_lower:
        used_lower.add(key)
        return raw
    cid = str(cluster_id).strip() if cluster_id not in (None, "") else ""
    if cid:
        candidate = f"{raw} (cluster {cid})"
    else:
        candidate = f"{raw} (#{row_index})"
    # Extremely rare: still duplicate after suffix
    candidate_key = candidate.lower()
    n = 2
    while candidate_key in used_lower:
        candidate = f"{raw} (cluster {cid or row_index}-{n})"
        candidate_key = candidate.lower()
        n += 1
    used_lower.add(candidate_key)
    return candidate


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

    # Pre-compute corpus share from n_items / document counts when probability is absent.
    doc_counts: List[int] = []
    for row in rows:
        doc_counts.append(
            _as_int(
                _get_first(
                    row,
                    ["n_items", "document_count", "doc_count", "count", "size"],
                    0,
                ),
                0,
            )
        )
    total_docs = sum(doc_counts)
    used_names_lower: set = set()
    active_topics = 0
    for idx, row in enumerate(rows, start=1):
        base_label = _get_first(row, ["topic_name", "label", "name"], f"Topic {idx}")
        cluster_id = _get_first(row, ["cluster_id", "topic_id", "id"], None)
        name = _unique_topic_name(base_label, cluster_id, idx, used_names_lower)
        doc_count = doc_counts[idx - 1]

        probability_raw = _as_float(
            _get_first(row, ["probability", "pct", "percentage", "share"], 0.0), 0.0
        )
        if probability_raw > 0:
            probability = probability_raw / 100.0 if probability_raw > 1.0 else probability_raw
        elif total_docs > 0 and doc_count > 0:
            probability = doc_count / total_docs
        else:
            probability = 0.0

        topic = Topic(
            name=name,
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
    clear_trained_topic_metadata_cache()
    return active_topics
