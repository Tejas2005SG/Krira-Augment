"""Domain-specific exceptions for the Krira AI RAG services."""

from __future__ import annotations


class ExtractionError(RuntimeError):
    """Raised when a dataset extractor cannot parse file contents."""


class ChunkingError(RuntimeError):
    """Raised when text cannot be chunked into embeddings-ready segments."""


class VectorStoreError(RuntimeError):
    """Raised when the vector database rejects an upsert operation."""
