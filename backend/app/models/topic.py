from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Text
from datetime import datetime
from app.database import Base


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, nullable=False)
    label = Column(String(200), nullable=False)
    keywords = Column(JSON, nullable=False)          # [{"word": "quality", "weight": 0.85}, ...]
    coherence_score = Column(Float, nullable=True)
    document_count = Column(Integer, default=0)
    trend_direction = Column(String(20), default="stable")  # rising, falling, stable
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Topic id={self.id} label={self.label}>"


class TopicTrend(Base):
    __tablename__ = "topic_trends"

    id = Column(Integer, primary_key=True, index=True)
    topic_label = Column(String(200), nullable=False)
    date = Column(DateTime, nullable=False)
    count = Column(Integer, default=0)
    avg_sentiment_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
