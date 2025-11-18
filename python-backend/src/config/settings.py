"""Configuration module for Krira AI Python backend."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

# Ensure .env variables are loaded into the process environment so os.environ
# lookups (used elsewhere in the codebase) can access FastRouter model entries.
CURRENT_DIR = Path(__file__).resolve()
ENV_CANDIDATES = [
    CURRENT_DIR.parents[2] / ".env",  # python-backend/.env
    CURRENT_DIR.parents[3] / ".env",  # project root .env (if present)
]
for env_file in ENV_CANDIDATES:
    load_dotenv(env_file, override=False)


class Settings(BaseSettings):
    """Application settings sourced from environment variables."""

    environment: str = Field("development", validation_alias="ENVIRONMENT")
    uploads_directory: Optional[Path] = Field(None, validation_alias="UPLOADS_DIRECTORY")
    openai_api_key: Optional[str] = Field(None, validation_alias="OPENAI_API_KEY")
    pinecone_api_key: Optional[str] = Field(None, validation_alias="PINECONE_API_KEY")
    pinecone_environment: Optional[str] = Field(None, validation_alias="PINECONE_ENVIRONMENT")
    chroma_directory: Path = Field(Path("vector_store/chroma"), validation_alias="CHROMA_DIRECTORY")
    fastrouter_api_key: Optional[str] = Field(None, validation_alias="FASTROUTER_API_KEY")
    fastrouter_base_url: str = Field("https://go.fastrouter.ai/api/v1", validation_alias="FASTROUTER_BASE_URL")
    llm_max_tokens: int = Field(validation_alias="LLM_MAX_TOKENS")
    evaluation_concurrency: int = Field(3, ge=1, le=16, validation_alias="EVALUATION_CONCURRENCY")

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings instance."""

    return Settings()  # type: ignore[call-arg]
