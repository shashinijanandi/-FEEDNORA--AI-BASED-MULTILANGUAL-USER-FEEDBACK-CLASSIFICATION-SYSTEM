from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any
from datetime import datetime
from app.models.models import UserRole, SentimentLabel, ApprovalStatus, TrendDirection


# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email:     EmailStr
    full_name: str
    password:  str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str


# ─── User ─────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id:         int
    email:      str
    full_name:  str
    role:       UserRole
    is_active:  bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role: UserRole


# ─── Feedback ─────────────────────────────────────────────────────────────────

class FeedbackSubmit(BaseModel):
    text:             str
    language:         Optional[str] = "EN"
    product_category: Optional[str] = None

    @field_validator("text")
    @classmethod
    def text_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Feedback text cannot be empty")
        return v.strip()

class TopicResult(BaseModel):
    name:        str
    probability: float
    keywords:    List[str]
    all_topics:  List[dict]

class EvaluationMetrics(BaseModel):
    bleu_score:          float
    rouge_l_score:       float
    semantic_similarity: float
    model_confidence:    float

class FeedbackAnalysisResult(BaseModel):
    id:                 int
    text:               str
    sentiment:          SentimentLabel
    sentiment_conf:     float
    topic:              TopicResult
    generated_response: str
    approval_status:    ApprovalStatus
    evaluation:         EvaluationMetrics
    created_at:         datetime

class FeedbackOut(BaseModel):
    id:                 int
    text:               str
    language:           Optional[str]
    product_category:   Optional[str]
    sentiment:          Optional[SentimentLabel]
    sentiment_conf:     Optional[float]
    detected_topic:     Optional[str]
    topic_probability:  Optional[float]
    topic_keywords:     Optional[List[str]]
    generated_response: Optional[str]
    approval_status:    ApprovalStatus
    bleu_score:         Optional[float]
    rouge_l_score:      Optional[float]
    semantic_similarity:Optional[float]
    model_confidence:   Optional[float]
    created_at:         datetime

    class Config:
        from_attributes = True

class FeedbackApprove(BaseModel):
    response: Optional[str] = None   # override response text (optional)

class FeedbackListResponse(BaseModel):
    total:  int
    items:  List[FeedbackOut]
    page:   int
    size:   int


# ─── Topics ───────────────────────────────────────────────────────────────────

class KeywordWeight(BaseModel):
    word:   str
    weight: float

class TimeSeriesPoint(BaseModel):
    period:      str
    probability: float
    doc_count:   int

class TopicOut(BaseModel):
    id:          int
    name:        str
    color:       str
    keywords:    Optional[List[KeywordWeight]]
    probability: float
    doc_count:   int
    trend:       TrendDirection
    trend_delta: float
    time_series: Optional[List[TimeSeriesPoint]] = []
    model_version: Optional[str] = None
    trained_at: Optional[str] = None
    dataset_size: Optional[int] = None

    class Config:
        from_attributes = True


# ─── Analytics / Dashboard ────────────────────────────────────────────────────

class KPIData(BaseModel):
    total_feedback:        int
    satisfaction_rate:     float
    negative_percent:      float
    ai_responses_today:    int
    avg_bleu:              float
    avg_confidence:        float

class SentimentDist(BaseModel):
    name:  str
    value: float
    color: str

class TopicDist(BaseModel):
    topic: str
    count: int
    pct:   float

class DashboardResponse(BaseModel):
    kpi:                 KPIData
    sentiment_dist:      List[SentimentDist]
    topic_dist:          List[TopicDist]
    recent_feedback:     List[FeedbackOut]

class EvaluationSummary(BaseModel):
    baseline: dict
    proposed: dict
    confusion_matrix: dict
