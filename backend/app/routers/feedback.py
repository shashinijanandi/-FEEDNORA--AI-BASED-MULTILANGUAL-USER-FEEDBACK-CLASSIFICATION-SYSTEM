from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.database import get_db
from app.models.feedback import Feedback, SentimentLabel, FeedbackStatus
from app.models.user import User, UserRole
from app.schemas.feedback import FeedbackSubmit, FeedbackResponse, FeedbackListResponse, FeedbackAnalysis
from app.services.ai_service import get_sentiment_service
from app.services.topic_service import get_topic_service
from app.dependencies import get_current_active_user, require_admin
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/feedback", tags=["Feedback"])


def _detect_language(text: str) -> str:
    """Simple language detection heuristic (replace with langdetect in production)."""
    sinhala_chars = any('\u0D80' <= c <= '\u0DFF' for c in text)
    tamil_chars = any('\u0B80' <= c <= '\u0BFF' for c in text)
    if sinhala_chars:
        return "si"
    if tamil_chars:
        return "ta"
    return "en"


@router.post("/submit", response_model=FeedbackAnalysis, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    payload: FeedbackSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Submit feedback text. Automatically:
    - Detects language
    - Analyzes sentiment (Component 1)
    - Generates personalized response (Component 1)
    - Extracts topics (Component 2)
    """
    ai_service = get_sentiment_service()
    topic_service = get_topic_service()

    detected_lang = _detect_language(payload.text)
    analysis = ai_service.analyze(payload.text)
    topics = topic_service.analyze_single(payload.text)
    dominant_topic = topics[0]["label"] if topics else None

    sentiment_enum = None
    try:
        sentiment_enum = SentimentLabel(analysis["sentiment"])
    except ValueError:
        sentiment_enum = SentimentLabel.neutral

    feedback_record = Feedback(
        user_id=current_user.id,
        original_text=payload.text,
        detected_language=detected_lang,
        sentiment=sentiment_enum,
        confidence_score=analysis["confidence"],
        sentiment_probabilities=analysis["probabilities"],
        generated_response=analysis["generated_response"],
        extracted_topics=topics,
        dominant_topic=dominant_topic,
        status=FeedbackStatus.processed,
        source=payload.source or "web",
        category=payload.category,
        processed_at=datetime.utcnow(),
    )

    db.add(feedback_record)
    db.commit()
    db.refresh(feedback_record)
    logger.info(f"Feedback {feedback_record.id} processed: {analysis['sentiment']} ({analysis['confidence']:.2%})")

    return FeedbackAnalysis(
        feedback_id=feedback_record.id,
        sentiment={
            "label": sentiment_enum,
            "confidence": analysis["confidence"],
            "probabilities": analysis["probabilities"],
        },
        generated_response=analysis["generated_response"],
        topics=topics,
        detected_language=detected_lang,
        processing_time_ms=analysis["processing_time_ms"],
    )


@router.get("/my", response_model=FeedbackListResponse)
async def get_my_feedbacks(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sentiment: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get current user's feedback history with pagination."""
    query = db.query(Feedback).filter(Feedback.user_id == current_user.id)
    if sentiment:
        try:
            query = query.filter(Feedback.sentiment == SentimentLabel(sentiment))
        except ValueError:
            pass

    total = query.count()
    items = query.order_by(Feedback.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return FeedbackListResponse(total=total, page=page, page_size=page_size, items=items)


@router.get("/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific feedback record."""
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if feedback.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Access denied")
    return feedback


@router.get("/", response_model=FeedbackListResponse, dependencies=[Depends(require_admin)])
async def list_all_feedbacks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sentiment: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """[Admin Only] List all feedback records."""
    query = db.query(Feedback)
    if sentiment:
        try:
            query = query.filter(Feedback.sentiment == SentimentLabel(sentiment))
        except ValueError:
            pass
    if user_id:
        query = query.filter(Feedback.user_id == user_id)

    total = query.count()
    items = query.order_by(Feedback.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return FeedbackListResponse(total=total, page=page, page_size=page_size, items=items)


@router.delete("/{feedback_id}", status_code=204)
async def delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete own feedback (or admin can delete any)."""
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Not found")
    if feedback.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Access denied")
    db.delete(feedback)
    db.commit()
