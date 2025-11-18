"""Dataset upload route for Krira AI."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ...schemas import DatasetChunksResponse, UploadDatasetRequest
from ...services import (
    ChunkingOptions,
    DatasetLoader,
    DatasetNotFoundError,
    UnsupportedDatasetError,
)
from ..dependencies import get_dataset_loader

router = APIRouter(tags=["dataset"])


@router.post("/uploaddataset", response_model=DatasetChunksResponse)
async def upload_dataset(
    payload: UploadDatasetRequest,
    loader: DatasetLoader = Depends(get_dataset_loader),
) -> DatasetChunksResponse:
    """Process dataset according to user-selected options and return generated chunks."""

    try:
        options = ChunkingOptions(
            chunk_size=payload.chunk_size or 1000,
            chunk_overlap=payload.chunk_overlap or 200,
        )

        chunks = await loader.load_and_chunk(
            dataset_type=payload.dataset_type,
            options=options,
            file_path=payload.file_path,
            urls=payload.urls,
        )
    except DatasetNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except UnsupportedDatasetError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process dataset") from exc

    return DatasetChunksResponse(
        dataset_type=payload.dataset_type,
        chunk_size=options.chunk_size,
        chunk_overlap=options.chunk_overlap,
        total_chunks=len(chunks),
        chunks=chunks,
    )
