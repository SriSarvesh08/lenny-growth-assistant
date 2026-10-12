import os
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Agent / LLM Settings
    AGENT_PROVIDER: Literal["local", "cloud"] = Field(
        default="local",
        description="Active LLM provider: 'local' for Ollama, 'cloud' for Anthropic Claude"
    )
    ANTHROPIC_API_KEY: str | None = Field(
        default=None,
        description="API key for Anthropic Claude (required when AGENT_PROVIDER is cloud)"
    )
    ANTHROPIC_MODEL_NAME: str = Field(
        default="claude-3-5-sonnet-20241022",
        description="Claude model to use in cloud mode"
    )
    ANTHROPIC_BASE_URL: str | None = Field(
        default=None,
        description="Custom Anthropic API base URL (e.g. for LiteLLM proxy in local mode)"
    )

    # Local Ollama Settings
    OLLAMA_BASE_URL: str = Field(
        default="http://localhost:11434",
        description="URL for local Ollama instance"
    )
    OLLAMA_MODEL_NAME: str = Field(
        default="llama3.2:3b",
        description="Primary local Ollama model"
    )
    OLLAMA_FALLBACK_MODEL: str = Field(
        default="qwen2.5-coder:1.5b",
        description="Fallback local Ollama model if primary fails"
    )
    LITELLM_PROXY_PORT: int = Field(
        default=4000,
        description="Port for local LiteLLM proxy"
    )

    # Embedding Settings
    EMBEDDING_PROVIDER: str = Field(
        default="fake",
        description="Embedding provider ('fake', 'local', etc.)"
    )
    EMBEDDING_MODEL_NAME: str = Field(
        default="nomic-embed-text",
        description="Embedding model name"
    )
    EMBEDDING_DIMENSION: int = Field(
        default=768,
        description="Vector dimension matching database schema"
    )

    # Database Settings
    POSTGRES_USER: str = Field(default="postgres")
    POSTGRES_PASSWORD: str = Field(default="postgres")
    POSTGRES_DB: str = Field(default="lenny_assistant")
    POSTGRES_HOST: str = Field(default="localhost")
    POSTGRES_PORT: int = Field(default=5433)

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
