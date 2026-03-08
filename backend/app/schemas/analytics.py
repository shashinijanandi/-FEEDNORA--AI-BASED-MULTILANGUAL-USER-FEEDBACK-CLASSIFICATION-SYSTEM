from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime


class SentimentDistribution(BaseModel):
    label: str
    count: int
    percentage: float


class DailyTrend(BaseModel):
    date: str
    total: int
    happiness: int
    sadness: int
    anger: int
    disgust: int
    fear: int
    surprise: int
    neutral: int


class TopicSummary(BaseModel):
    label: str
    count: int
    trend: str
    keywords: List[str]
    avg_sentiment: Optional[str]


class OverallStats(BaseModel):
    total_feedbacks: int
    total_users: int
    processed_today: int
    avg_confidence: float
    most_common_sentiment: str
    dominant_topic: str


class AnalyticsDashboard(BaseModel):
    overall: OverallStats
    sentiment_distribution: List[SentimentDistribution]
    daily_trends: List[DailyTrend]
    top_topics: List[TopicSummary]
    recent_feedbacks: List[Dict]
    language_distribution: List[Dict]


class TopicListResponse(BaseModel):
    total: int
    topics: List[Dict]
    generated_at: datetime
