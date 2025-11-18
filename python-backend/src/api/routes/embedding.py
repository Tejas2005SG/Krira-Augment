"""Embedding pipeline routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ...schemas import EmbeddingError, EmbeddingRequest, EmbeddingResponse, EmbeddedDatasetSummary
from ...services import EmbeddingModelService, EmbeddingServiceError, VectorStoreService, VectorStoreServiceError
from ...utils import get_logger
from ..dependencies import get_embedding_service, get_vector_store_service


logger = get_logger(__name__)

router = APIRouter(tags=["embedding"])


@router.post("/embed", response_model=EmbeddingResponse)
async def embed_datasets(
    payload: EmbeddingRequest,
    embedding_service: EmbeddingModelService = Depends(get_embedding_service),
    vector_store_service: VectorStoreService = Depends(get_vector_store_service),
) -> EmbeddingResponse:
    """Generate embeddings for the supplied datasets and persist them into the vector store."""

    results: list[EmbeddedDatasetSummary] = []
    errors: list[EmbeddingError] = []

    for dataset in payload.datasets:
        valid_chunks = [chunk for chunk in dataset.chunks if chunk.text and chunk.text.strip()]
        if not valid_chunks:
            errors.append(
                EmbeddingError(
                    dataset_id=dataset.id,
                    label=dataset.label,
                    message="Dataset does not contain any non-empty chunks",
                )
            )
            continue

        trimmed_dataset = dataset.model_copy(update={"chunks": valid_chunks})

        try:
            texts = [chunk.text for chunk in valid_chunks]
            embeddings = await embedding_service.generate(payload.embedding_model, texts)

            if len(embeddings) != len(valid_chunks):
                raise EmbeddingServiceError("Embedding count does not match chunk count")

            vectors_written = await vector_store_service.upsert(
                payload.vector_store,
                trimmed_dataset,
                embeddings,
                embedding_model=payload.embedding_model,
                pinecone=payload.pinecone,
            )

            results.append(
                EmbeddedDatasetSummary(
                    dataset_id=dataset.id,
                    label=dataset.label,
                    vector_store=payload.vector_store,
                    embedding_model=payload.embedding_model,
                    chunks_processed=len(dataset.chunks),
                    chunks_embedded=vectors_written,
                )
            )
        except (EmbeddingServiceError, VectorStoreServiceError) as exc:
            logger.warning(
                "Embedding pipeline error for dataset %s (store=%s, model=%s): %s",
                dataset.id,
                payload.vector_store,
                payload.embedding_model,
                exc,
            )
            errors.append(EmbeddingError(dataset_id=dataset.id, label=dataset.label, message=str(exc)))
        except Exception as exc:  # noqa: BLE001
            logger.exception(
                "Unexpected embedding failure",
                extra={
                    "dataset": dataset.id,
                    "vector_store": payload.vector_store,
                    "embedding_model": payload.embedding_model,
                },
            )
            errors.append(
                EmbeddingError(
                    dataset_id=dataset.id,
                    label=dataset.label,
                    message="Failed to embed dataset",
                )
            )

    return EmbeddingResponse(results=results, errors=errors)
