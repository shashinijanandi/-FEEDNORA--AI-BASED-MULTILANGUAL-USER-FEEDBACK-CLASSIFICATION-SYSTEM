"""
API Test Suite — FeedbackAI Platform
Run: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import get_db, Base

# ─── Test DB Setup ────────────────────────────────────────────────────────────

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture(scope="module")
def auth_headers(client):
    # Register and login
    client.post("/api/v1/auth/register", json={
        "email": "test@example.com", "full_name": "Test User", "password": "testpass123"
    })
    resp = client.post("/api/v1/auth/login", json={
        "email": "test@example.com", "password": "testpass123"
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ─── Tests ────────────────────────────────────────────────────────────────────

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_register(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "new@example.com", "full_name": "New User", "password": "password123"
    })
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == "new@example.com"


def test_register_duplicate_email(client, auth_headers):
    r = client.post("/api/v1/auth/register", json={
        "email": "test@example.com", "full_name": "Dup", "password": "pass123"
    })
    assert r.status_code == 400


def test_login(client):
    r = client.post("/api/v1/auth/login", json={
        "email": "test@example.com", "password": "testpass123"
    })
    assert r.status_code == 200
    assert "access_token" in r.json()
    assert "refresh_token" in r.json()


def test_login_wrong_password(client):
    r = client.post("/api/v1/auth/login", json={
        "email": "test@example.com", "password": "wrongpassword"
    })
    assert r.status_code == 401


def test_me(client, auth_headers):
    r = client.get("/api/v1/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["email"] == "test@example.com"


def test_submit_feedback_negative(client, auth_headers):
    r = client.post("/api/v1/feedback/submit", headers=auth_headers, json={
        "text": "My order is delayed and stuck in transit for 5 days. Very frustrated.",
        "language": "EN", "product_category": "Electronics"
    })
    assert r.status_code == 201
    data = r.json()
    assert data["sentiment"] in ["positive", "neutral", "negative"]
    assert "generated_response" in data
    assert data["evaluation"]["bleu_score"] >= 0


def test_submit_feedback_positive(client, auth_headers):
    r = client.post("/api/v1/feedback/submit", headers=auth_headers, json={
        "text": "Excellent quality product! Very satisfied with the fast delivery.",
        "language": "EN",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["sentiment"] == "positive"


def test_submit_feedback_empty(client, auth_headers):
    r = client.post("/api/v1/feedback/submit", headers=auth_headers, json={"text": "  "})
    assert r.status_code == 422


def test_my_feedback(client, auth_headers):
    r = client.get("/api/v1/feedback/my", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "total" in data
    assert "items" in data


def test_dashboard_unauthenticated(client):
    r = client.get("/api/v1/analytics/dashboard")
    assert r.status_code == 401


def test_dashboard_authenticated(client, auth_headers):
    r = client.get("/api/v1/analytics/dashboard", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "kpi" in data
    assert "sentiment_dist" in data


def test_evaluation_metrics(client, auth_headers):
    r = client.get("/api/v1/analytics/evaluation", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["proposed"]["accuracy"] > data["baseline"]["accuracy"]
    assert data["proposed"]["bleu"] > data["baseline"]["bleu"]
