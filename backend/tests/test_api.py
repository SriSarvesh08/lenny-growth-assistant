import pytest
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "llm_provider" in data
    assert data["app"] == "The Lenny Growth Assistant"


def test_chat_endpoint_empty_message_rejected():
    response = client.post("/api/chat", json={"message": ""})
    assert response.status_code == 400


def test_tools_essay_endpoint():
    response = client.post(
        "/api/tools/essay",
        json={"topic": "B2B SaaS Churn Reduction", "framework": "atomic"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["topic"] == "B2B SaaS Churn Reduction"
    assert "The Unspoken Rule" in data["headline"]
    assert "markdown_content" in data
    assert data["word_count"] > 0


def test_tools_search_endpoint():
    response = client.post(
        "/api/tools/search",
        json={"query": "onboarding", "limit": 3},
    )
    assert response.status_code == 200
    data = response.json()
    assert "query" in data
    assert "results" in data
    assert "formatted_context" in data


def test_sessions_list_endpoint():
    response = client.get("/api/sessions")
    assert response.status_code == 200
    data = response.json()
    assert "sessions" in data
    assert isinstance(data["sessions"], list)
