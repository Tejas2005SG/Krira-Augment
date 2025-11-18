"""Dependency wiring for FastAPI routes."""

from __future__ import annotations

from functools import lru_cache

from ..config import get_settings
from ..services import DatasetLoader, EmbeddingModelService, LLMService, VectorStoreService


@lru_cache(maxsize=1)
def get_dataset_loader() -> DatasetLoader:
    """Provide a singleton DatasetLoader instance."""

    settings = get_settings()
    return DatasetLoader(uploads_dir=settings.uploads_directory)


@lru_cache(maxsize=1)
def get_embedding_service() -> EmbeddingModelService:
    """Provide an embedding model service singleton."""

    return EmbeddingModelService()


@lru_cache(maxsize=1)
def get_vector_store_service() -> VectorStoreService:
    """Provide a vector store service singleton."""

    return VectorStoreService()


@lru_cache(maxsize=1)
def get_llm_service() -> LLMService:
    """Provide an LLM service singleton."""

    return LLMService(get_embedding_service(), get_vector_store_service())
