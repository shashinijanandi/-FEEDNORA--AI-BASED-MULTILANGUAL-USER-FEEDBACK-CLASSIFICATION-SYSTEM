"""
FEEDNORA Topic Modeling Service - IT22902184
Multilingual HDBSCAN pipeline for topic discovery.
Loads centroids.pkl + cluster_map.pkl from ai_models/
Uses sentence-transformers for multilingual embedding.
Falls back to keyword matching if model files not found.
"""
import os, pickle, json, re, logging, time
from typing import Dict, List, Optional
import numpy as np
from collections import Counter

logger = logging.getLogger(__name__)

FILLER = {
    "i","me","my","we","our","you","your","it","its","this","that",
    "the","a","an","and","or","but","so","for","in","on","at","to",
    "from","of","with","by","about","is","are","was","were","be",
    "been","have","has","had","do","does","did","will","would",
    "could","should","can","very","really","just","also","got",
    "get","go","went","came","bought","buy","use","used","feel",
    "bit","lot","thing","time","way","ever","one","two",
}

def clean_text(text: str) -> str:
    text = str(text).lower().strip()
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def quick_summary(text: str) -> str:
    words = [w for w in clean_text(text).split()
             if w not in FILLER and len(w) > 2]
    return " ".join(words[:4]) if words else "general feedback"

class FeednoraService:
    def __init__(self, models_dir: str = "ai_models"):
        self.models_dir = models_dir
        self.centroids = None
        self.cluster_map = None
        self.cid_list = []
        self.centroid_matrix = None
        self.embedding_model = None
        self.config = {}
        self._loaded = False
        self._load()

    def _load(self):
        try:
            cp = os.path.join(self.models_dir, "centroids.pkl")
            mp = os.path.join(self.models_dir, "cluster_map.pkl")
            cfg= os.path.join(self.models_dir, "config.json")
            sm = os.path.join(self.models_dir, "sentence_model")
            if not all(os.path.exists(x) for x in [cp, mp, cfg]):
                logger.warning("FEEDNORA: model files missing in %s."
                               " Using keyword fallback.", self.models_dir)
                return
            with open(cp, "rb") as f: self.centroids = pickle.load(f)
            with open(mp, "rb") as f: self.cluster_map = pickle.load(f)
            with open(cfg)      as f: self.config = json.load(f)
            self.cid_list = sorted(self.centroids.keys())
            self.centroid_matrix = np.stack(
                [self.centroids[c] for c in self.cid_list])
            from sentence_transformers import SentenceTransformer
            self.embedding_model = SentenceTransformer(
                sm if os.path.exists(sm) else self.config.get(
                "model_name",
                "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
            )
            self._loaded = True
            logger.info("FEEDNORA loaded. Topics: %d", len(self.cid_list))
        except Exception as e:
            logger.error("FEEDNORA load error: %s", e)

    def _embed(self, texts):
        return self.embedding_model.encode(
            texts, batch_size=32, convert_to_numpy=True,
            normalize_embeddings=True, show_progress_bar=False)

    def assign_topic(self, text: str, threshold: float = 0.40) -> Dict:
        if not self._loaded: return self._fallback(text)
        summary = quick_summary(text)
        emb  = self._embed([summary])
        sims = (emb @ self.centroid_matrix.T)[0]
        bi   = int(sims.argmax())
        bs_  = float(sims[bi])
        cid  = self.cid_list[bi]
        top3 = [{"topic": self.cluster_map.get(self.cid_list[i],"?"),
                 "score": round(float(sims[i]),4)}
                for i in sims.argsort()[::-1][:3]]
        return {
            "topic_name":   self.cluster_map.get(cid,"Unknown") if bs_>=threshold else "Uncategorized",
            "cluster_id":   int(cid) if bs_>=threshold else -1,
            "confidence":   round(bs_,4),
            "summary":      summary,
            "top3":         top3,
            "is_new_topic": bs_ < threshold,
        }

    def analyze_batch(self, texts: List[str], threshold=0.40) -> List[Dict]:
        if not self._loaded: return [self._fallback(t) for t in texts]
        summaries = [quick_summary(t) for t in texts]
        embs = self._embed(summaries)
        sims = embs @ self.centroid_matrix.T
        bi   = sims.argmax(axis=1)
        bs_  = sims.max(axis=1)
        return [{
            "text":         t[:200],
            "topic_name":   self.cluster_map.get(self.cid_list[bi[i]],"?") if bs_[i]>=threshold else "Uncategorized",
            "cluster_id":   int(self.cid_list[bi[i]]) if bs_[i]>=threshold else -1,
            "confidence":   round(float(bs_[i]),4),
            "is_new_topic": float(bs_[i]) < threshold,
        } for i,t in enumerate(texts)]

    def get_topic_stats(self, texts: List[str]) -> List[Dict]:
        assignments = self.analyze_batch(texts)
        counts = Counter(a["topic_name"] for a in assignments)
        total  = len(assignments) or 1
        return [{"topic_name":n,"count":c,
                 "percentage":round(c/total*100,1)}
                for n,c in counts.most_common()]

    def _fallback(self, text: str) -> Dict:
        return {"topic_name":"Models Not Loaded","cluster_id":-1,
                "confidence":0.0,"summary":quick_summary(text),
                "top3":[],"is_new_topic":True}

_instance: Optional[FeednoraService] = None
def get_feednora_service() -> FeednoraService:
    global _instance
    if _instance is None:
        _instance = FeednoraService(models_dir="ai_models")
    return _instance
