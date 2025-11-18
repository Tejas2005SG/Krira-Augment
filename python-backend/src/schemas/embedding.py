"""Schemas for embedding pipeline requests and responses."""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field, model_validator


EmbeddingModel = Literal["openai-small", "openai-large", "huggingface"]
VectorStore = Literal["pinecone", "chroma"]


class ChunkPayload(BaseModel):
    """Payload for an individual chunk destined for embedding."""

    order: int = Field(..., ge=0, description="Sequential position of the chunk")
    text: str = Field(..., min_length=1, description="Content of the chunk")


class DatasetEmbeddingPayload(BaseModel):
    """Dataset with associated chunks ready for embedding."""

    id: str = Field(..., min_length=1, description="Unique dataset identifier")
    label: str = Field(..., min_length=1, description="Human readable dataset label")
    dataset_type: Literal["csv", "json", "website", "pdf"] = Field(..., description="Dataset origin")
    chunk_size: int = Field(..., gt=0, description="Chunk size used during preprocessing")
    chunk_overlap: int = Field(..., ge=0, description="Chunk overlap used during preprocessing")
    chunks: List[ChunkPayload] = Field(..., min_length=1, description="Chunks to embed")


class PineconeConfig(BaseModel):
    """Configuration payload for Pinecone vector store."""

    api_key: str = Field(..., min_length=1, description="Pinecone API key")
    index_name: str = Field(..., min_length=1, description="Target Pinecone index")
    namespace: Optional[str] = Field(None, description="Optional namespace for multi-tenancy")


class EmbeddingRequest(BaseModel):
    """Request body for embedding datasets."""

    embedding_model: EmbeddingModel = Field(..., description="Embedding model identifier")
    vector_store: VectorStore = Field(..., description="Vector database target")
    datasets: List[DatasetEmbeddingPayload] = Field(..., min_length=1, description="Datasets queued for embedding")
    pinecone: Optional[PineconeConfig] = Field(None, description="Pinecone credentials when applicable")

    @model_validator(mode="after")
    def validate_vector_store(self) -> "EmbeddingRequest":  # noqa: D401
        """Ensure Pinecone configuration is present when required."""

        if self.vector_store == "pinecone" and not self.pinecone:
            raise ValueError("Pinecone configuration is required when vector_store is 'pinecone'")
        return self


class EmbeddedDatasetSummary(BaseModel):
    """Summary of a successfully embedded dataset."""

    dataset_id: str = Field(..., description="Dataset identifier")
    label: str = Field(..., description="Dataset label")
    vector_store: VectorStore = Field(..., description="Target vector database")
    embedding_model: EmbeddingModel = Field(..., description="Embedding model used")
    chunks_processed: int = Field(..., ge=0, description="Total chunks processed")
    chunks_embedded: int = Field(..., ge=0, description="Chunks successfully embedded")


class EmbeddingError(BaseModel):
    """Payload describing a dataset embedding failure."""

    dataset_id: str = Field(..., description="Dataset identifier")
    label: str = Field(..., description="Dataset label")
    message: str = Field(..., description="Error message")


class EmbeddingResponse(BaseModel):
    """Response returned after embedding pipeline execution."""

    results: List[EmbeddedDatasetSummary] = Field(default_factory=list, description="Successful embedding summaries")
    errors: List[EmbeddingError] = Field(default_factory=list, description="Datasets that failed to embed")
