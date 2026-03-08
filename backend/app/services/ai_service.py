import joblib
import os
import time
import logging
from typing import Dict, List, Tuple, Optional
import numpy as np

logger = logging.getLogger(__name__)

# ─── Response Templates ───────────────────────────────────────────────────────
RESPONSE_TEMPLATES = {
    "happiness": [
        "Thank you so much for your wonderful feedback! 😊 We are thrilled to hear that you had such a positive experience. Your satisfaction means the world to us, and we look forward to continuing to exceed your expectations.",
        "We are absolutely delighted to receive your positive feedback! 🌟 Knowing that our service brought you happiness truly motivates us to keep striving for excellence. Thank you for taking the time to share this with us.",
    ],
    "sadness": [
        "We sincerely apologize that your experience did not meet your expectations. 💙 Your feelings are completely valid, and we take full responsibility for any shortcomings. Please know that we are committed to making this right for you.",
        "We are truly sorry to hear about your disappointing experience. 🙏 Your feedback is invaluable to us as it helps us identify areas for improvement. We would love the opportunity to resolve this and restore your confidence in us.",
    ],
    "anger": [
        "We deeply apologize for the frustration and inconvenience you have experienced. 😔 Your anger is completely justified, and we take your concerns very seriously. We are taking immediate action to investigate and resolve this issue.",
        "We sincerely apologize that you have had such a negative experience with us. We understand your frustration and want you to know that we are committed to resolving this matter urgently. Your feedback has been escalated to our management team.",
    ],
    "disgust": [
        "We are truly sorry and deeply concerned to hear about your experience. 🙏 The issues you've described are absolutely unacceptable by our standards. We are launching an immediate investigation and will take corrective action to ensure this never happens again.",
        "We sincerely apologize for the unacceptable experience you encountered. Your feedback has shocked and saddened us, and we are treating this with the highest priority. Please allow us the opportunity to make this right.",
    ],
    "fear": [
        "Thank you for bringing your concerns to our attention. 💚 Your safety and peace of mind are our highest priorities, and we want to assure you that we are taking your concerns very seriously. We will investigate this matter thoroughly.",
        "We understand your concerns and want to reassure you that your well-being is our top priority. 🛡️ Thank you for trusting us with this feedback. We are reviewing the situation carefully and will provide you with a full update shortly.",
    ],
    "surprise": [
        "Thank you for your candid feedback! 😲 We appreciate you taking the time to share your unexpected experience with us. We're reviewing what happened and will use your insights to improve our services.",
        "We appreciate your honest feedback about this unexpected experience! 💫 Your insights help us understand where we can do better. We are reviewing this matter and will make appropriate improvements.",
    ],
    "neutral": [
        "Thank you for taking the time to share your feedback with us. 📝 We value every piece of input from our customers as it helps us continually improve our services. We'll review your comments carefully.",
        "We appreciate you sharing your thoughts with us. Your feedback is an important part of how we improve and grow. Thank you for being a valued customer.",
    ],
}

# Sentiment emojis for display
SENTIMENT_EMOJIS = {
    "happiness": "😊",
    "sadness": "😢",
    "anger": "😠",
    "disgust": "🤢",
    "fear": "😨",
    "surprise": "😲",
    "neutral": "😐",
}


class SentimentAnalysisService:
    """
    AI Service for sentiment classification and personalized response generation.
    Loads the trained Logistic Regression + TF-IDF model.
    Falls back to a rule-based mock if model files are not present.
    """

    def __init__(self, model_path: str, vectorizer_path: str):
        self.model = None
        self.vectorizer = None
        self.classes = []
        self._load_models(model_path, vectorizer_path)

    def _load_models(self, model_path: str, vectorizer_path: str):
        try:
            if os.path.exists(model_path) and os.path.exists(vectorizer_path):
                self.model = joblib.load(model_path)
                self.vectorizer = joblib.load(vectorizer_path)
                self.classes = list(self.model.classes_)
                logger.info(f"✅ AI models loaded. Classes: {self.classes}")
            else:
                logger.warning(
                    f"Model files not found at {model_path} / {vectorizer_path}. "
                    "Using rule-based fallback."
                )
        except Exception as e:
            logger.error(f"Failed to load AI models: {e}. Using fallback.")

    def _rule_based_predict(self, text: str) -> Tuple[str, float, Dict[str, float]]:
        """Simple keyword-based fallback when model is not available."""
        text_lower = text.lower()
        keyword_map = {
            "happiness": ["happy", "great", "excellent", "love", "amazing", "fantastic", "wonderful", "best", "awesome"],
            "anger":     ["angry", "terrible", "awful", "horrible", "worst", "hate", "furious", "disgusting", "pathetic"],
            "sadness":   ["sad", "disappointed", "unhappy", "sorry", "regret", "miss", "unfortunate", "depressed"],
            "fear":      ["worried", "scared", "afraid", "concern", "risk", "danger", "unsafe", "anxious"],
            "disgust":   ["disgusting", "gross", "revolting", "nasty", "repulsive", "filthy"],
            "surprise":  ["surprised", "unexpected", "shock", "unbelievable", "wow", "amazing", "suddenly"],
        }
        scores = {label: 0.0 for label in keyword_map}
        for label, keywords in keyword_map.items():
            for kw in keywords:
                if kw in text_lower:
                    scores[label] += 1.0

        total = sum(scores.values())
        if total == 0:
            probs = {k: 1 / len(scores) for k in scores}
            predicted = "neutral"
            confidence = 0.5
        else:
            probs = {k: v / total for k, v in scores.items()}
            predicted = max(probs, key=probs.get)
            confidence = probs[predicted]

        probs["neutral"] = probs.get("neutral", 0.05)
        return predicted, round(confidence, 4), {k: round(v, 4) for k, v in probs.items()}

    def predict(self, text: str) -> Tuple[str, float, Dict[str, float]]:
        """Returns (sentiment_label, confidence, probabilities_dict)."""
        if self.model is None or self.vectorizer is None:
            return self._rule_based_predict(text)

        try:
            vec = self.vectorizer.transform([text])
            prediction = self.model.predict(vec)[0]
            proba = self.model.predict_proba(vec)[0]
            probs = {cls: round(float(p), 4) for cls, p in zip(self.classes, proba)}
            confidence = round(float(max(proba)), 4)
            return str(prediction), confidence, probs
        except Exception as e:
            logger.error(f"Model prediction error: {e}. Falling back.")
            return self._rule_based_predict(text)

    def generate_response(self, sentiment: str) -> str:
        """Generate a personalized response based on detected sentiment."""
        import random
        templates = RESPONSE_TEMPLATES.get(sentiment, RESPONSE_TEMPLATES["neutral"])
        return random.choice(templates)

    def analyze(self, text: str) -> Dict:
        """Full analysis: sentiment + response generation."""
        start = time.time()
        sentiment, confidence, probs = self.predict(text)
        response = self.generate_response(sentiment)
        elapsed_ms = round((time.time() - start) * 1000, 2)

        return {
            "sentiment": sentiment,
            "confidence": confidence,
            "probabilities": probs,
            "generated_response": response,
            "emoji": SENTIMENT_EMOJIS.get(sentiment, "📝"),
            "processing_time_ms": elapsed_ms,
        }


# ─── Singleton ────────────────────────────────────────────────────────────────
_service_instance: Optional[SentimentAnalysisService] = None


def get_sentiment_service() -> SentimentAnalysisService:
    global _service_instance
    if _service_instance is None:
        from app.config import settings
        _service_instance = SentimentAnalysisService(
            model_path=settings.MODEL_PATH,
            vectorizer_path=settings.VECTORIZER_PATH,
        )
    return _service_instance
