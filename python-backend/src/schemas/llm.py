"""Schemas for LLM selection and testing endpoints."""

from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


ProviderLiteral = Literal[
    "openai",
    "anthropic",
    "google",
    "grok",
    "deepseek",
    "perplexity",
    "glm",
]


class LLMModelOption(BaseModel):
    """Represents an individual LLM model option exposed to the client."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., min_length=1)
    label: str = Field(..., min_length=1)
    # Optional badge indicating whether the model is paid or free
    badge: Optional[str] = None


class LLMProviderOption(BaseModel):
    """Collection of models for a specific provider."""

    id: ProviderLiteral
    label: str = Field(..., min_length=1)
    description: Optional[str] = None
    models: List[LLMModelOption] = Field(default_factory=list)


class LLMModelsResponse(BaseModel):
    """Response payload containing available providers and their models."""

    providers: List[LLMProviderOption] = Field(default_factory=list)

