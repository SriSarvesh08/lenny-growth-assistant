import logging
from typing import Any, Dict, List, Optional
import httpx
try:
    import litellm
    litellm.suppress_debug_info = True
    HAS_LITELLM = True
except ImportError:
    litellm = None  # type: ignore
    HAS_LITELLM = False

from .config import settings

logger = logging.getLogger(__name__)


class ProviderError(Exception):
    """Raised when an LLM provider fails or is misconfigured."""
    pass


class LLMProvider:
    """
    Manages LLM routing between local Ollama and cloud Anthropic.
    Ensures graceful fallbacks and clear error reporting.
    """

    def __init__(self):
        self.provider = settings.AGENT_PROVIDER
        self._validate_configuration()

    def _validate_configuration(self) -> None:
        """Validates that credentials exist for the selected provider."""
        if self.provider == "cloud":
            if not settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY.strip() in ("", "your_anthropic_api_key_here", "placeholder"):
                raise ProviderError(
                    "ANTHROPIC_API_KEY is not set or is a placeholder. "
                    "To run without cloud credentials, set AGENT_PROVIDER=local in your environment."
                )

    def check_ollama_health(self) -> Dict[str, Any]:
        """Checks if local Ollama is running and lists available models."""
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                if res.status_code == 200:
                    models = [m.get("name") for m in res.json().get("models", [])]
                    return {
                        "status": "healthy",
                        "available_models": models,
                        "primary_model_available": any(settings.OLLAMA_MODEL_NAME in m for m in models),
                        "fallback_model_available": any(settings.OLLAMA_FALLBACK_MODEL in m for m in models),
                    }
                return {"status": "unhealthy", "code": res.status_code}
        except Exception as e:
            return {"status": "unreachable", "error": str(e)}

    def get_status(self) -> Dict[str, Any]:
        """Returns overall LLM provider readiness and metadata."""
        ollama_status = self.check_ollama_health()
        has_cloud_key = bool(
            settings.ANTHROPIC_API_KEY
            and settings.ANTHROPIC_API_KEY.strip() not in ("", "your_anthropic_api_key_here", "placeholder")
        )
        return {
            "active_provider": self.provider,
            "cloud_ready": has_cloud_key,
            "cloud_model": settings.ANTHROPIC_MODEL_NAME,
            "local_ready": ollama_status.get("status") == "healthy",
            "local_primary_model": settings.OLLAMA_MODEL_NAME,
            "local_fallback_model": settings.OLLAMA_FALLBACK_MODEL,
            "ollama_details": ollama_status,
        }

    async def complete(
        self,
        messages: List[Dict[str, str]],
        system: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> Dict[str, Any]:
        """
        Executes a completion using the active provider with automatic fallback.
        """
        formatted_messages = []
        if system:
            formatted_messages.append({"role": "system", "content": system})
        formatted_messages.extend(messages)

        if self.provider == "cloud":
            return await self._complete_cloud(formatted_messages, tools, temperature, max_tokens)
        else:
            return await self._complete_local(formatted_messages, tools, temperature, max_tokens)

    async def _complete_cloud(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]],
        temperature: float,
        max_tokens: int,
    ) -> Dict[str, Any]:
        """Executes completion via Anthropic Claude."""
        try:
            kwargs: Dict[str, Any] = {
                "model": settings.ANTHROPIC_MODEL_NAME,
                "messages": messages,
                "api_key": settings.ANTHROPIC_API_KEY,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if settings.ANTHROPIC_BASE_URL:
                kwargs["api_base"] = settings.ANTHROPIC_BASE_URL
            if tools:
                kwargs["tools"] = tools

            response = await litellm.acompletion(**kwargs)
            choice = response.choices[0]
            return {
                "provider": "cloud",
                "model": settings.ANTHROPIC_MODEL_NAME,
                "content": choice.message.content or "",
                "tool_calls": getattr(choice.message, "tool_calls", None),
                "finish_reason": choice.finish_reason,
            }
        except Exception as e:
            logger.error("Cloud LLM call failed: %s", e)
            # Check if local fallback is viable
            ollama_health = self.check_ollama_health()
            if ollama_health.get("status") == "healthy":
                logger.warning("Falling back to local Ollama after cloud failure")
                return await self._complete_local(messages, tools, temperature, max_tokens)
            raise ProviderError(f"Cloud LLM request failed and local Ollama is unavailable: {e}")

    async def _complete_local(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]],
        temperature: float,
        max_tokens: int,
    ) -> Dict[str, Any]:
        """Executes completion via local Ollama with fallback to second model."""
        target_model = f"ollama/{settings.OLLAMA_MODEL_NAME}"
        if HAS_LITELLM and litellm is not None:
            try:
                kwargs: Dict[str, Any] = {
                    "model": target_model,
                    "messages": messages,
                    "api_base": settings.OLLAMA_BASE_URL,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
                if tools:
                    kwargs["tools"] = tools

                response = await litellm.acompletion(**kwargs)
                choice = response.choices[0]
                return {
                    "provider": "local",
                    "model": settings.OLLAMA_MODEL_NAME,
                    "content": choice.message.content or "",
                    "tool_calls": getattr(choice.message, "tool_calls", None),
                    "finish_reason": choice.finish_reason,
                }
            except Exception as e:
                logger.warning("litellm completion failed: %s. Falling back to direct Ollama HTTP API.", e)

        # Direct Ollama HTTP API fallback with strict timeout to preserve responsive UX on 8GB RAM
        async with httpx.AsyncClient(timeout=8.0) as client:
            for model_name in [settings.OLLAMA_FALLBACK_MODEL, settings.OLLAMA_MODEL_NAME]:
                try:
                    payload = {
                        "model": model_name,
                        "messages": messages,
                        "stream": False,
                        "options": {
                            "temperature": temperature,
                            "num_predict": min(max_tokens, 250),
                        },
                    }
                    res = await client.post(f"{settings.OLLAMA_BASE_URL}/api/chat", json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        content = data.get("message", {}).get("content", "")
                        return {
                            "provider": "local",
                            "model": model_name,
                            "content": content,
                            "tool_calls": None,
                            "finish_reason": "stop",
                        }
                except Exception as model_err:
                    logger.warning("Direct Ollama model %s failed: %s", model_name, model_err)

        raise ProviderError(
            f"Both primary model ({settings.OLLAMA_MODEL_NAME}) and fallback ({settings.OLLAMA_FALLBACK_MODEL}) failed via direct Ollama API."
        )


# Global singleton instance
llm_provider = LLMProvider()
