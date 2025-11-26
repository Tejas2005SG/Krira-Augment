"""Embedding model orchestration for Krira AI."""

from __future__ import annotations

import asyncio
import threading
from typing import Iterable, List, Optional

from ..config import get_settings
from ..schemas.embedding import EmbeddingModel
from ..utils import get_logger


logger = get_logger(__name__)


OPENAI_MODEL_ALIASES: dict[EmbeddingModel, str] = {
    "openai-small": "openai-small",
    "text-embedding-3-small": "openai-small",
    "openai-large": "openai-large",
    "text-embedding-3-large": "openai-large",
}

OPENAI_TARGET_MODELS: dict[str, str] = {
    "openai-small": "openai/text-embedding-3-small",
    "openai-large": "openai/text-embedding-3-large",
}

OPENAI_DIMENSION_OPTIONS: dict[str, tuple[int, ...]] = {
    "openai-small": (1536, 512),
    "openai-large": (3072, 1024, 256),
}

HUGGINGFACE_DIMENSION = 384


class EmbeddingServiceError(Exception):
    """Raised when embedding generation fails."""


class EmbeddingModelService:
    """Service responsible for generating embeddings via different providers."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._openai_client = None
        self._hf_model = None
        self._hf_lock = threading.Lock()

    async def generate(
        self,
        model: EmbeddingModel,
        texts: Iterable[str],
        *,
        dimensions: Optional[int] = None,
    ) -> List[List[float]]:
        """Generate embeddings for the provided texts."""

        payload = [text.strip() for text in texts if text and text.strip()]
        if not payload:
            return []

        if model in OPENAI_MODEL_ALIASES:
            return await asyncio.to_thread(self._generate_openai, model, payload, dimensions)
        # NOTE: HuggingFace local embeddings disabled due to memory constraints on Render free tier
        # if model == "huggingface":
        #     if dimensions is not None and dimensions != HUGGINGFACE_DIMENSION:
        #         raise EmbeddingServiceError(
        #             f"Hugging Face embeddings use a fixed dimension of {HUGGINGFACE_DIMENSION}"
        #         )
        #     return await asyncio.to_thread(self._generate_huggingface, payload)
        if model == "huggingface":
            raise EmbeddingServiceError(
                "HuggingFace local embeddings are currently disabled. Please use OpenAI embeddings instead."
            )
        raise EmbeddingServiceError(f"Unsupported embedding model '{model}'")

    # ---------------------------------------------------------------------
    # Provider-specific handlers
    # ---------------------------------------------------------------------
    def _generate_openai(
        self,
        model: EmbeddingModel,
        payload: list[str],
        requested_dimension: Optional[int] = None,
    ) -> List[List[float]]:
        """Generate embeddings using OpenAI via FastRouter."""

        target_name = self._resolve_openai_model_name(model)
        dimension = self._resolve_openai_dimension(model, requested_dimension)
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
            logger.debug(
                "Requesting OpenAI embeddings via FastRouter",
                extra={"model": target_name, "batch": len(batch), "dimension": dimension},
            )
            response = client.embeddings.create(model=target_name, input=batch, dimensions=dimension)
            embeddings.extend([item.embedding for item in response.data])

        return embeddings

    # NOTE: HuggingFace local embeddings disabled due to memory constraints on Render free tier
    # def _generate_huggingface(self, payload: list[str]) -> List[List[float]]:
    #     """Generate embeddings using HuggingFace SentenceTransformers."""
    #
    #     try:
    #         from sentence_transformers import SentenceTransformer
    #     except ImportError as exc:  # pragma: no cover - import-time failure
    #         raise EmbeddingServiceError(
    #             "sentence-transformers package is required for Hugging Face embeddings"
    #         ) from exc
    #
    #     with self._hf_lock:
    #         if self._hf_model is None:
    #             logger.debug("Loading Hugging Face embedding model", extra={"model": "all-MiniLM-L6-v2"})
    #             self._hf_model = SentenceTransformer(
    #                 "sentence-transformers/all-MiniLM-L6-v2",
    #                 device="cpu",
    #             )
    #         model: SentenceTransformer = self._hf_model
    #
    #     vectors = model.encode(
    #         payload,
    #         batch_size=32,
    #         convert_to_numpy=True,
    #         normalize_embeddings=True,
    #         show_progress_bar=False,
    #     )
    #     if hasattr(vectors, "tolist"):
    #         return vectors.tolist()
    #     return [vector.tolist() if hasattr(vector, "tolist") else list(vector) for vector in vectors]

    def _resolve_openai_model_name(self, model: EmbeddingModel) -> str:
        canonical = OPENAI_MODEL_ALIASES.get(model)
        if not canonical:
            raise EmbeddingServiceError(f"Unsupported OpenAI embedding model '{model}'")
        try:
            return OPENAI_TARGET_MODELS[canonical]
        except KeyError as exc:  # pragma: no cover - defensive
            raise EmbeddingServiceError(f"No target model configured for '{canonical}'") from exc

    def _resolve_openai_dimension(self, model: EmbeddingModel, dimension: Optional[int]) -> int:
        canonical = OPENAI_MODEL_ALIASES.get(model)
        if not canonical:
            raise EmbeddingServiceError(f"Unsupported OpenAI embedding model '{model}'")
        options = OPENAI_DIMENSION_OPTIONS.get(canonical)
        if not options:
            raise EmbeddingServiceError(f"No dimension options configured for '{canonical}'")
        if dimension is None:
            return options[0]
        if dimension not in options:
            raise EmbeddingServiceError(
                f"Dimension {dimension} is not supported for {canonical} embeddings. "
                f"Choose one of {', '.join(str(option) for option in options)}."
            )
        return dimension
