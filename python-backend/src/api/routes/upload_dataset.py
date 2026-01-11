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
    print(f"[Python] Received upload_dataset request: type={payload.dataset_type}, size={payload.chunk_size}")

    try:
        options = ChunkingOptions(
            chunk_size=payload.chunk_size or 1000,
            chunk_overlap=payload.chunk_overlap or 200,
        )

        # Handle file_content (base64) by saving to temp file
        file_path_to_use = payload.file_path
        temp_file_path = None
        
        if payload.file_content and not payload.file_path:
            import base64
            import tempfile
            import os
            
            try:
                # Decode base64 content
                file_bytes = base64.b64decode(payload.file_content)
                
                # Create temp file with appropriate extension
                extension = ""
                if payload.dataset_type == "csv":
                    extension = ".csv"
                elif payload.dataset_type == "json":
                    extension = ".json"
                elif payload.dataset_type == "pdf":
                    extension = ".pdf"
                
                # Create temp file
                fd, temp_file_path = tempfile.mkstemp(suffix=extension, dir=loader.uploads_dir)
                os.write(fd, file_bytes)
                os.close(fd)
                
                file_path_to_use = temp_file_path
                print(f"[Python] Saved base64 content to temp file: {temp_file_path} ({len(file_bytes)} bytes)")
                
            except Exception as e:
                print(f"[Python] Failed to decode/save file content: {e}")
                raise ValueError(f"Failed to process file content: {str(e)}")

        chunks = await loader.load_and_chunk(
            dataset_type=payload.dataset_type,
            options=options,
            file_path=file_path_to_use,
            urls=payload.urls,
        )
        
        # Clean up temp file if created
        if temp_file_path:
            try:
                import os
                os.unlink(temp_file_path)
                print(f"[Python] Cleaned up temp file: {temp_file_path}")
            except Exception as e:
                print(f"[Python] Warning: Failed to cleanup temp file: {e}")
                
    except DatasetNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except UnsupportedDatasetError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except PermissionError as exc:
        print(f"[Python] Permission denied: {exc}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"File access denied: {str(exc)}") from exc
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
