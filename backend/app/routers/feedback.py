from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.models import Feedback, User, ApprovalStatus, SentimentLabel
from app.schemas.schemas import (
    FeedbackSubmit, FeedbackAnalysisResult, FeedbackOut,
    FeedbackApprove, FeedbackListResponse, TopicResult, EvaluationMetrics
)
from app.services.ai_service import get_ai_service
from app.dependencies import get_current_user, require_admin, get_optional_user

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("/submit", response_model=FeedbackAnalysisResult, status_code=201)
def submit_feedback(
    payload: FeedbackSubmit,
    db:      Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    ai = get_ai_service()
    result = ai.run_pipeline(payload.text)

    feedback = Feedback(
        user_id          = current_user.id if current_user else None,
        text             = payload.text,
        language         = payload.language or "EN",
        product_category = payload.product_category,
        sentiment        = SentimentLabel(result["sentiment"]),
        sentiment_conf   = result["sentiment_conf"],
        detected_topic   = result["topic"]["name"],
        topic_probability= result["topic"]["probability"],
        topic_keywords   = result["topic"]["keywords"],
        generated_response = result["generated_response"],
        approval_status  = ApprovalStatus(result["approval_status"]),
        bleu_score       = result["evaluation"]["bleu_score"],
        rouge_l_score    = result["evaluation"]["rouge_l_score"],
        semantic_similarity = result["evaluation"]["semantic_similarity"],
        model_confidence = result["evaluation"]["model_confidence"],
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return FeedbackAnalysisResult(
        id               = feedback.id,
        text             = feedback.text,
        sentiment        = feedback.sentiment,
        sentiment_conf   = feedback.sentiment_conf,
        topic            = TopicResult(
            name        = result["topic"]["name"],
            probability = result["topic"]["probability"],
            keywords    = result["topic"]["keywords"],
            all_topics  = result["topic"]["all_topics"],
        ),
        generated_response = feedback.generated_response,
        approval_status  = feedback.approval_status,
        evaluation       = EvaluationMetrics(
            bleu_score          = feedback.bleu_score,
            rouge_l_score       = feedback.rouge_l_score,
            semantic_similarity = feedback.semantic_similarity,
            model_confidence    = feedback.model_confidence,
        ),
        created_at = feedback.created_at,
    )


@router.get("/my", response_model=FeedbackListResponse)
def my_feedback(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db:   Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Feedback).filter(Feedback.user_id == current_user.id).order_by(Feedback.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * size).limit(size).all()
    return FeedbackListResponse(total=total, items=items, page=page, size=size)


@router.get("/", response_model=FeedbackListResponse)
def all_feedback(
    page:      int = Query(1, ge=1),
    size:      int = Query(20, ge=1, le=100),
    sentiment: Optional[str] = None,
    topic:     Optional[str] = None,
    db:        Session = Depends(get_db),
    _:         User = Depends(require_admin),
):
    q = db.query(Feedback).order_by(Feedback.created_at.desc())
    if sentiment:
        q = q.filter(Feedback.sentiment == sentiment)
    if topic:
        q = q.filter(Feedback.detected_topic.ilike(f"%{topic}%"))
    total = q.count()
    items = q.offset((page - 1) * size).limit(size).all()
    return FeedbackListResponse(total=total, items=items, page=page, size=size)


@router.get("/{feedback_id}", response_model=FeedbackOut)
def get_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if fb.user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    return fb


@router.post("/{feedback_id}/approve", response_model=FeedbackOut)
def approve_feedback(
    feedback_id: int,
    payload: FeedbackApprove,
    db: Session = Depends(get_db),
    _:  User = Depends(require_admin),
):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    fb.approval_status = ApprovalStatus.approved
    if payload.response:
        fb.approved_response = payload.response
    db.commit()
    db.refresh(fb)
    return fb


@router.post("/{feedback_id}/regenerate", response_model=FeedbackOut)
def regenerate_response(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")

    ai = get_ai_service()
    new_response = ai.generate_response(
        fb.text,
        fb.sentiment.value if fb.sentiment else "neutral",
        fb.detected_topic or "General",
        fb.topic_keywords or [],
    )
    eval_result = ai.evaluate(fb.text, new_response)

    fb.generated_response = new_response
    fb.bleu_score         = eval_result["bleu_score"]
    fb.rouge_l_score      = eval_result["rouge_l_score"]
    fb.semantic_similarity= eval_result["semantic_similarity"]
    fb.model_confidence   = eval_result["model_confidence"]
    fb.approval_status    = ApprovalStatus.needs_review
    db.commit()
    db.refresh(fb)
    return fb
