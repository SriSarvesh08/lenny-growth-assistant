import pytest
from app.config import settings
from app.llm_provider import LLMProvider, ProviderError


def test_provider_status_local(monkeypatch):
    monkeypatch.setattr(settings, "AGENT_PROVIDER", "local")
    provider = LLMProvider()
    status = provider.get_status()
    assert status["active_provider"] == "local"
    assert "local_primary_model" in status
    assert status["local_primary_model"] == settings.OLLAMA_MODEL_NAME


def test_provider_cloud_missing_key_raises(monkeypatch):
    monkeypatch.setattr(settings, "AGENT_PROVIDER", "cloud")
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
    with pytest.raises(ProviderError) as exc_info:
        LLMProvider()
    assert "ANTHROPIC_API_KEY is not set" in str(exc_info.value)


def test_provider_cloud_placeholder_key_raises(monkeypatch):
    monkeypatch.setattr(settings, "AGENT_PROVIDER", "cloud")
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "your_anthropic_api_key_here")
    with pytest.raises(ProviderError) as exc_info:
        LLMProvider()
    assert "placeholder" in str(exc_info.value)


def test_ollama_health_live():
    provider = LLMProvider()
    health = provider.check_ollama_health()
    assert health["status"] == "healthy"
    assert health["primary_model_available"] is True
