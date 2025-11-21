"""Embedding model orchestration for Krira AI."""

from __future__ import annotations

import asyncio
import threading
from typing import Iterable, List

from ..config import get_settings
from ..schemas.embedding import EmbeddingModel
from ..utils import get_logger


logger = get_logger(__name__)


OPENAI_MODEL_MAP: dict[EmbeddingModel, str] = {
    "openai-small": "openai/text-embedding-3-small",
    "openai-large": "openai/text-embedding-3-large",
}


class EmbeddingServiceError(Exception):
    """Raised when embedding generation fails."""


class EmbeddingModelService:
    """Service responsible for generating embeddings via different providers."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._openai_client = None
        self._hf_model = None
        self._hf_lock = threading.Lock()

    async def generate(self, model: EmbeddingModel, texts: Iterable[str]) -> List[List[float]]:
        """Generate embeddings for the provided texts."""

        payload = [text.strip() for text in texts if text and text.strip()]
        if not payload:
            return []

        if model in OPENAI_MODEL_MAP:
            return await asyncio.to_thread(self._generate_openai, model, payload)
        if model == "huggingface":
            return await asyncio.to_thread(self._generate_huggingface, payload)
        raise EmbeddingServiceError(f"Unsupported embedding model '{model}'")

    # ---------------------------------------------------------------------
    # Provider-specific handlers
    # ---------------------------------------------------------------------
    def _generate_openai(self, model: EmbeddingModel, payload: list[str]) -> List[List[float]]:
        """Generate embeddings using OpenAI via FastRouter."""

        model_name = OPENAI_MODEL_MAP[model]
        api_key = self._settings.fastrouter_api_key or self._settings.openai_api_key
        if not api_key:
            raise EmbeddingServiceError("FastRouter or OpenAI API key is not configured on the server")

        try:
            from openai import OpenAI
        except ImportError as exc:  # pragma: no cover - import-time failure
            raise EmbeddingServiceError("openai package is required for OpenAI embeddings") from exc

        if self._openai_client is None:
            # Use FastRouter base URL for OpenAI embeddings
            self._openai_client = OpenAI(
                base_url="https://go.fastrouter.ai/v1",
                api_key=api_key
            )

        client: OpenAI = self._openai_client

        embeddings: list[list[float]] = []
        batch_size = 64
        for index in range(0, len(payload), batch_size):
            batch = payload[index : index + batch_size]
            logger.debug("Requesting OpenAI embeddings via FastRouter", extra={"model": model_name, "batch": len(batch)})
            response = client.embeddings.create(model=model_name, input=batch)
            embeddings.extend([item.embedding for item in response.data])

        return embeddings

    def _generate_huggingface(self, payload: list[str]) -> List[List[float]]:
        """Generate embeddings using HuggingFace SentenceTransformers."""

        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as exc:  # pragma: no cover - import-time failure
            raise EmbeddingServiceError(
                "sentence-transformers package is required for Hugging Face embeddings"
            ) from exc

        with self._hf_lock:
            if self._hf_model is None:
                logger.debug("Loading Hugging Face embedding model", extra={"model": "all-MiniLM-L6-v2"})
                self._hf_model = SentenceTransformer(
                    "sentence-transformers/all-MiniLM-L6-v2",
                    device="cpu",
                )
            model: SentenceTransformer = self._hf_model

        vectors = model.encode(
            payload,
            batch_size=32,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        if hasattr(vectors, "tolist"):
            return vectors.tolist()
        return [vector.tolist() if hasattr(vector, "tolist") else list(vector) for vector in vectors]
