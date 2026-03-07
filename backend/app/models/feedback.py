from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class SentimentLabel(str, enum.Enum):
    happiness = "happiness"
    sadness = "sadness"
    anger = "anger"
    disgust = "disgust"
    fear = "fear"
    surprise = "surprise"
    neutral = "neutral"


class FeedbackStatus(str, enum.Enum):
    pending = "pending"
    processed = "processed"
    failed = "failed"


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Input
    original_text = Column(Text, nullable=False)
    detected_language = Column(String(10), default="en")
    translated_text = Column(Text, nullable=True)

    # AI Output — Sentiment
    sentiment = Column(Enum(SentimentLabel), nullable=True)
    confidence_score = Column(Float, nullable=True)
    sentiment_probabilities = Column(JSON, nullable=True)

    # AI Output — Generated Response
    generated_response = Column(Text, nullable=True)

    # Topic Modeling Output
    extracted_topics = Column(JSON, nullable=True)
    dominant_topic = Column(String(100), nullable=True)

    # Metadata
    status = Column(Enum(FeedbackStatus), default=FeedbackStatus.pending)
    source = Column(String(50), default="web")
    category = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="feedbacks")

    def __repr__(self):
        return f"<Feedback id={self.id} sentiment={self.sentiment} user_id={self.user_id}>"
