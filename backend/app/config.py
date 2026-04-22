from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List, ClassVar
from pydantic import ConfigDict

class Settings(BaseSettings):
    # App
    APP_NAME: str = "FeedbackAI Platform"
    APP_VERSION: str = "3.0.0"
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str

    # Optional DB env vars
    POSTGRES_USER: str | None = None
    POSTGRES_PASSWORD: str | None = None
    POSTGRES_DB: str | None = None

    # AI Models
    SENTIMENT_MODEL_PATH: str = "ai_models/sentiment_model.pkl"
    VECTORIZER_PATH: str = "ai_models/vectorizer.pkl"
    TOPIC_CONFIG_PATH: str = "ai_models/config.json"
    TOPIC_SCHEMA_PATH: str = "ai_models/topic_schema.json"
    TOPIC_SENTENCE_MODEL_DIR: str = "ai_models/sentence_model"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    # Pydantic v2 settings
    model_config = ConfigDict(
        extra="ignore",            # ignore unknown env vars
        env_file=".env",           # specify .env
        case_sensitive=True
    )

@lru_cache()
def get_settings() -> Settings:
    return Settings()