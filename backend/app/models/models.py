from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text,
    ForeignKey, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    admin = "admin"
    user  = "user"

class SentimentLabel(str, enum.Enum):
    positive = "positive"
    neutral  = "neutral"
    negative = "negative"

class ApprovalStatus(str, enum.Enum):
    auto         = "auto"
    needs_review = "needs_review"
    approved     = "approved"
    rejected     = "rejected"

class TrendDirection(str, enum.Enum):
    Rising  = "Rising"
    Stable  = "Stable"
    Falling = "Falling"


# ─── User ─────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id           = Column(Integer, primary_key=True, index=True)
    email        = Column(String(255), unique=True, index=True, nullable=False)
    full_name    = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role         = Column(SAEnum(UserRole), default=UserRole.user, nullable=False)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    feedbacks    = relationship("Feedback", back_populates="user")


# ─── Feedback ─────────────────────────────────────────────────────────────────

class Feedback(Base):
    __tablename__ = "feedbacks"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=True)
    text             = Column(Text, nullable=False)
    language         = Column(String(10), default="EN")
    product_category = Column(String(100), nullable=True)

    # AI Results
    sentiment        = Column(SAEnum(SentimentLabel), nullable=True)
    sentiment_conf   = Column(Float, nullable=True)
    detected_topic   = Column(String(100), nullable=True)
    topic_probability = Column(Float, nullable=True)
    topic_keywords   = Column(JSON, nullable=True)          # list of strings

    # Generated response
    generated_response = Column(Text, nullable=True)
    approval_status    = Column(SAEnum(ApprovalStatus), default=ApprovalStatus.needs_review)
    approved_response  = Column(Text, nullable=True)

    # Evaluation metrics
    bleu_score        = Column(Float, nullable=True)
    rouge_l_score     = Column(Float, nullable=True)
    semantic_similarity = Column(Float, nullable=True)
    model_confidence  = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="feedbacks")


# ─── Topic ────────────────────────────────────────────────────────────────────

class Topic(Base):
    __tablename__ = "topics"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100), unique=True, nullable=False)
    color       = Column(String(20), default="#22d3ee")
    keywords    = Column(JSON, nullable=True)   # [{"word": str, "weight": float}]
    probability = Column(Float, default=0.0)
    doc_count   = Column(Integer, default=0)
    trend       = Column(SAEnum(TrendDirection), default=TrendDirection.Stable)
    trend_delta = Column(Float, default=0.0)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    time_series = relationship("TopicTimeSeries", back_populates="topic", cascade="all, delete")


class TopicTimeSeries(Base):
    __tablename__ = "topic_time_series"

    id          = Column(Integer, primary_key=True, index=True)
    topic_id    = Column(Integer, ForeignKey("topics.id"), nullable=False)
    period      = Column(String(20), nullable=False)   # e.g. "2024-08"
    probability = Column(Float, default=0.0)
    doc_count   = Column(Integer, default=0)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    topic = relationship("Topic", back_populates="time_series")


# ─── Analytics Snapshot ───────────────────────────────────────────────────────

class AnalyticsSnapshot(Base):
    __tablename__ = "analytics_snapshots"

    id                   = Column(Integer, primary_key=True, index=True)
    snapshot_date        = Column(DateTime(timezone=True), server_default=func.now())
    total_feedback       = Column(Integer, default=0)
    positive_count       = Column(Integer, default=0)
    neutral_count        = Column(Integer, default=0)
    negative_count       = Column(Integer, default=0)
    ai_responses_today   = Column(Integer, default=0)
    avg_bleu             = Column(Float, default=0.0)
    avg_confidence       = Column(Float, default=0.0)
    avg_response_time_ms = Column(Float, default=0.0)
