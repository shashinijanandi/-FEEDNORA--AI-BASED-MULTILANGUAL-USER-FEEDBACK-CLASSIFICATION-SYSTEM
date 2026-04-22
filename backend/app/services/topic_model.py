import json
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any

import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import get_settings

logger = logging.getLogger(__name__)


class TopicModel:
    def __init__(
        self,
        model: SentenceTransformer,
        schema: List[Dict[str, Any]],
        threshold_high: float,
        threshold_medium: float,
    ):
        self.model = model
        self.schema = schema
        self.threshold_high = threshold_high
        self.threshold_medium = threshold_medium
        self._topic_embeddings: Optional[np.ndarray] = None
        self._build_topic_embeddings()

    def _build_topic_embeddings(self) -> None:
        texts: List[str] = []
        for t in self.schema:
            name = t.get("topic_name", "")
            desc = t.get("description", "")
            keywords = t.get("keywords", "")
            txt = f"{name}. {desc} Keywords: {keywords}"
            texts.append(txt.strip())

        if not texts:
            logger.warning("Topic schema is empty; topic model will be disabled.")
            self._topic_embeddings = None
            return

        logger.info("Encoding %d topics for semantic similarity", len(texts))
        emb = self.model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        self._topic_embeddings = np.asarray(emb, dtype="float32")

    def _infer_distribution(self, text: str) -> Optional[Dict[str, Any]]:
        if self._topic_embeddings is None or not self.schema:
            return None

        text = (text or "").strip()
        if not text:
            return None

        emb = self.model.encode([text], convert_to_numpy=True, normalize_embeddings=True)[0]
        sims = np.dot(self._topic_embeddings, emb)

        if sims.size == 0:
            return None

        top_idx = int(np.argmax(sims))
        top_sim = float(sims[top_idx])

        # Softmax over similarities to get a pseudo-probability distribution
        # Temperature chosen to give a reasonably sharp distribution.
        logits = sims / 0.05
        exp = np.exp(logits - np.max(logits))
        probs = exp / np.sum(exp)

        # Build ranked topics list (top 8 for UI)
        order = np.argsort(probs)[::-1]
        top_k = order[:8]
        all_topics = []
        for idx in top_k:
            t = self.schema[int(idx)]
            all_topics.append(
                {
                    "name": t.get("topic_name", f"Topic {t.get('cluster_id', idx)}"),
                    "prob": round(float(probs[int(idx)] * 100.0), 1),
                    "color": "#64748b",
                }
            )

        top_topic = self.schema[top_idx]
        keywords_raw = top_topic.get("keywords") or ""
        keywords = [k.strip() for k in str(keywords_raw).split(",") if k.strip()]

        return {
            "name": top_topic.get("topic_name", f"Topic {top_topic.get('cluster_id', top_idx)}"),
            "probability": round(float(probs[top_idx] * 100.0), 1),
            "keywords": keywords[:5],
            "all_topics": all_topics,
            "similarity": top_sim,
        }

    def infer_topic(self, text: str) -> Optional[Dict[str, Any]]:
        try:
            return self._infer_distribution(text)
        except Exception as e:
            logger.error("Topic inference error: %s", e)
            return None


_topic_model: Optional[TopicModel] = None


def get_topic_model() -> Optional[TopicModel]:
    global _topic_model
    if _topic_model is not None:
        return _topic_model

    try:
        settings = get_settings()

        schema_path = Path(settings.TOPIC_SCHEMA_PATH)
        config_path = Path(settings.TOPIC_CONFIG_PATH)
        model_dir = Path(settings.TOPIC_SENTENCE_MODEL_DIR)

        if not (schema_path.exists() and config_path.exists() and model_dir.exists()):
            logger.warning(
                "Topic model artifacts missing. Expected files at %s, %s and %s",
                schema_path,
                config_path,
                model_dir,
            )
            return None

        with schema_path.open("r", encoding="utf-8") as f:
            schema = json.load(f)

        with config_path.open("r", encoding="utf-8") as f:
            cfg = json.load(f)

        threshold_high = float(cfg.get("threshold_high", 0.7))
        threshold_medium = float(cfg.get("threshold_medium", 0.4))

        logger.info("Loading sentence-transformer from %s", model_dir)
        model = SentenceTransformer(str(model_dir))

        _topic_model = TopicModel(
            model=model,
            schema=schema,
            threshold_high=threshold_high,
            threshold_medium=threshold_medium,
        )
        logger.info("✅ Topic model loaded from artifacts directory")
    except Exception as e:
        logger.error("Failed to initialize topic model: %s", e)
        _topic_model = None

    return _topic_model

