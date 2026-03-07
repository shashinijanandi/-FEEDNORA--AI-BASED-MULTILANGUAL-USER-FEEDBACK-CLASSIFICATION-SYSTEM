from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.feedback import SentimentLabel, FeedbackStatus


class FeedbackSubmit(BaseModel):
    text: str = Field(..., min_length=5, max_length=5000, description="Feedback text")
    category: Optional[str] = Field(None, max_length=100)
    source: Optional[str] = Field("web", max_length=50)

    @validator("text")
    def text_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Feedback text cannot be empty")
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "text": "The product quality is excellent! I'm very happy with my purchase.",
                "category": "product",
                "source": "web"
            }
        }


class SentimentResult(BaseModel):
    label: SentimentLabel
    confidence: float
    probabilities: Dict[str, float]


class TopicResult(BaseModel):
    topic_id: int
    label: str
    keywords: List[Dict[str, Any]]
    probability: float


class FeedbackResponse(BaseModel):
    id: int
    original_text: str
    detected_language: str
    translated_text: Optional[str]
    sentiment: Optional[SentimentLabel]
    confidence_score: Optional[float]
    sentiment_probabilities: Optional[Dict[str, float]]
    generated_response: Optional[str]
    extracted_topics: Optional[List[Dict]]
    dominant_topic: Optional[str]
    status: FeedbackStatus
    category: Optional[str]
    source: str
    created_at: datetime
    processed_at: Optional[datetime]

    class Config:
        from_attributes = True


class FeedbackListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[FeedbackResponse]


class FeedbackAnalysis(BaseModel):
    feedback_id: int
    sentiment: SentimentResult
    generated_response: str
    topics: List[TopicResult]
    detected_language: str
    processing_time_ms: float
