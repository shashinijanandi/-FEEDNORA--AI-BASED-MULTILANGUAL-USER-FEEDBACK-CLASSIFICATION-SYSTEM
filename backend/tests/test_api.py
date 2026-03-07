"""
Integration tests for the API endpoints.
Run: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# ─── Test DB Setup ────────────────────────────────────────────────────────────
SQLALCHEMY_TEST_URL = "sqlite:///./test.db"
test_engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

# ─── Auth Tests ───────────────────────────────────────────────────────────────
def test_register_user():
    response = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "TestPass123",
        "full_name": "Test User"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["role"] == "user"


def test_register_duplicate_email():
    client.post("/api/v1/auth/register", json={
        "email": "dup@example.com", "username": "dup1", "password": "TestPass123"
    })
    response = client.post("/api/v1/auth/register", json={
        "email": "dup@example.com", "username": "dup2", "password": "TestPass123"
    })
    assert response.status_code == 400


def test_login_success():
    client.post("/api/v1/auth/register", json={
        "email": "login@example.com", "username": "loginuser", "password": "TestPass123"
    })
    response = client.post("/api/v1/auth/login", json={
        "email": "login@example.com", "password": "TestPass123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_wrong_password():
    response = client.post("/api/v1/auth/login", json={
        "email": "login@example.com", "password": "WrongPass999"
    })
    assert response.status_code == 401


def get_auth_token():
    client.post("/api/v1/auth/register", json={
        "email": "feedback@example.com", "username": "fbuser", "password": "TestPass123"
    })
    resp = client.post("/api/v1/auth/login", json={
        "email": "feedback@example.com", "password": "TestPass123"
    })
    return resp.json()["access_token"]


# ─── Feedback Tests ───────────────────────────────────────────────────────────
def test_submit_feedback():
    token = get_auth_token()
    response = client.post(
        "/api/v1/feedback/submit",
        json={"text": "This product is absolutely amazing! I love it so much."},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "sentiment" in data
    assert "generated_response" in data
    assert "topics" in data
    assert data["sentiment"]["confidence"] > 0


def test_submit_empty_feedback():
    token = get_auth_token()
    response = client.post(
        "/api/v1/feedback/submit",
        json={"text": "  "},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 422


def test_get_my_feedbacks():
    token = get_auth_token()
    client.post(
        "/api/v1/feedback/submit",
        json={"text": "Great service!"},
        headers={"Authorization": f"Bearer {token}"},
    )
    response = client.get(
        "/api/v1/feedback/my",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


def test_unauthenticated_access():
    response = client.post("/api/v1/feedback/submit", json={"text": "Test"})
    assert response.status_code == 401


# ─── Health Test ─────────────────────────────────────────────────────────────
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


# ─── Analytics Tests ──────────────────────────────────────────────────────────
def test_get_analytics():
    token = get_auth_token()
    response = client.get(
        "/api/v1/analytics/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "overall" in data
    assert "sentiment_distribution" in data


def test_get_trending_topics():
    token = get_auth_token()
    response = client.get(
        "/api/v1/topics/trending",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "topics" in data
