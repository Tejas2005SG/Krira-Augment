"""Schemas for dataset upload workflow."""

from __future__ import annotations

from typing import List, Literal, Optional
import re

from pydantic import BaseModel, Field, validator


DatasetType = Literal["csv", "json", "website", "pdf"]


class UploadDatasetRequest(BaseModel):
    """Request payload for dataset chunking."""

    dataset_type: DatasetType = Field(..., description="Type of dataset to process")
    chunk_size: Optional[int] = Field(1000, gt=0, description="Characters per chunk")
    chunk_overlap: Optional[int] = Field(200, ge=0, description="Overlap between chunks")
    file_path: Optional[str] = Field(None, description="Relative path to uploaded file")
    urls: Optional[List[str]] = Field(None, description="List of website URLs to ingest")
    file_name: Optional[str] = Field(None, description="Original name of the uploaded file")

    @validator("chunk_overlap")
    def validate_overlap(cls, value: int | None, values: dict[str, object]) -> int | None:
        chunk_size = values.get("chunk_size")
        if value is not None and chunk_size is not None and value >= chunk_size:
            raise ValueError("Chunk overlap must be less than chunk size")
        return value

    @validator("urls")
    def validate_urls(cls, value: List[str] | None, values: dict[str, object]) -> List[str] | None:
        dataset_type = values.get("dataset_type")
        
        # URLs are required for website dataset type
        if dataset_type == "website":
            if not value:
                raise ValueError("At least one URL is required for website datasets")
            
            # Validate each URL format
            url_pattern = re.compile(
                r'^https?://'  # http:// or https://
                r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
                r'localhost|'  # localhost...
                r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
                r'(?::\d+)?'  # optional port
                r'(?:/?|[/?]\S+)$', re.IGNORECASE)
            
            valid_urls = []
            for url in value:
                url = url.strip()
                if not url:
                    continue
                    
                # Add protocol if missing
                if not url.startswith(('http://', 'https://')):
                    url = f'https://{url}'
                
                # Basic URL format validation
                if url_pattern.match(url):
                    valid_urls.append(url)
                else:
                    raise ValueError(f"Invalid URL format: {url}")
            
            if not valid_urls:
                raise ValueError("No valid URLs provided for website dataset")
            
            return valid_urls
        
        return value


class ChunkItem(BaseModel):
    """Single chunk representation."""

    order: int = Field(..., ge=0, description="Sequential order of the chunk")
    text: str = Field(..., description="Chunk text content")


class DatasetChunksResponse(BaseModel):
    """Response returned after dataset chunking."""

    dataset_type: DatasetType = Field(..., description="Dataset type processed")
    chunk_size: int = Field(..., description="Chunk size used")
    chunk_overlap: int = Field(..., description="Chunk overlap used")
    total_chunks: int = Field(..., ge=0, description="Total number of generated chunks")
    chunks: List[ChunkItem] = Field(..., description="Ordered list of chunks")
