"""Dataset loading and chunking services for Krira AI."""

from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import httpx
from bs4 import BeautifulSoup

from ..utils import clean_text, get_logger

logger = get_logger(__name__)


class UnsupportedDatasetError(ValueError):
    """Raised when the dataset type is not supported."""


class DatasetNotFoundError(FileNotFoundError):
    """Raised when the dataset file cannot be located."""


@dataclass(slots=True)
class ChunkingOptions:
    """Configuration for chunk generation."""

    chunk_size: int = 1000
    chunk_overlap: int = 200

    def __post_init__(self) -> None:
        if self.chunk_size <= 0:
            raise ValueError("Chunk size must be greater than zero")
        if not 0 <= self.chunk_overlap < self.chunk_size:
            raise ValueError("Chunk overlap must be non-negative and less than chunk size")


class DatasetLoader:
    """Load datasets from disk or remote sources and chunk their content."""

    SUPPORTED_DATASETS = {"csv", "json", "website", "pdf"}

    def __init__(self, uploads_dir: Path | None = None) -> None:
        """Initialise loader with uploads directory and HTTP client session."""

        default_uploads = Path(__file__).resolve().parents[3] / "uploads"
        base_path = uploads_dir or default_uploads
        self.uploads_dir = Path(base_path).resolve()
        self.uploads_dir.mkdir(parents=True, exist_ok=True)

    async def load_and_chunk(
        self,
        dataset_type: str,
        options: ChunkingOptions,
        file_path: str | None = None,
        urls: list[str] | None = None,
    ) -> list[dict[str, str | int]]:
        """Load data for the dataset type and return ordered chunks."""

        dataset_type = dataset_type.lower().strip()
        if dataset_type not in self.SUPPORTED_DATASETS:
            raise UnsupportedDatasetError(f"Unsupported dataset type: {dataset_type}")

        if dataset_type == "website":
            if not urls:
                raise ValueError("At least one URL is required for website datasets")
            
            # Filter out empty URLs
            filtered_urls = [url.strip() for url in urls if url and url.strip()]
            if not filtered_urls:
                raise ValueError("No valid URLs provided for website dataset")
                
            text = await self._load_from_urls(filtered_urls)
            return self._chunk_text(text, options)

        resolved_path = self._resolve_file_path(file_path)
        if dataset_type == "csv":
            rows = self._load_csv(resolved_path)
            return self._rows_to_chunks(rows)

        if dataset_type == "json":
            text = self._load_json(resolved_path)
        elif dataset_type == "pdf":
            text = self._load_pdf(resolved_path)
        else:
            raise UnsupportedDatasetError(f"Unsupported dataset type: {dataset_type}")

        return self._chunk_text(text, options)
    def _load_pdf(self, path: Path) -> str:
        """Extract text from PDF file."""

        import pdfplumber

        pages: list[str] = []
        with pdfplumber.open(path) as pdf:
            for index, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or ""
                text = clean_text(text)
                if text:
                    pages.append(text)
                else:
                    logger.warning("Empty PDF page", extra={"path": str(path), "page": index})

        if not pages:
            raise ValueError("PDF file does not contain extractable text")
        logger.info("Loaded PDF dataset", extra={"pages": len(pages), "path": str(path)})
        return "\n\n".join(pages)

    def _resolve_file_path(self, file_path: str | None) -> Path:
        """Resolve and validate file path inside uploads directory."""

        if not file_path:
            raise DatasetNotFoundError("File path is required for file uploads")

        candidate = Path(file_path)
        if not candidate.is_absolute():
            if candidate.parts and candidate.parts[0] == self.uploads_dir.name:
                candidate = self.uploads_dir.joinpath(*candidate.parts[1:])
            else:
                candidate = self.uploads_dir / candidate

        resolved = candidate.resolve()
        if not str(resolved).startswith(str(self.uploads_dir.resolve())):
            raise PermissionError("Access to the specified file path is not permitted")
        if not resolved.exists():
            raise DatasetNotFoundError(f"Dataset file not found at {resolved}")
        return resolved

    async def _load_from_urls(self, urls: Iterable[str]) -> str:
        """Fetch and aggregate textual content from the provided URLs."""

        contents: list[str] = []
        failures: list[str] = []
        default_headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/123.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        async with httpx.AsyncClient(timeout=15.0, headers=default_headers) as client:
            for url in urls:
                stripped_url = url.strip()
                if not stripped_url:
                    continue

                candidates: list[str] = []
                if stripped_url.startswith("https://"):
                    candidates = [stripped_url, "http://" + stripped_url[len("https://"):]]
                elif stripped_url.startswith("http://"):
                    candidates = [stripped_url, "https://" + stripped_url[len("http://"):]]
                else:
                    candidates = [f"https://{stripped_url}", f"http://{stripped_url}"]

                text_block: str | None = None
                last_error: str | None = None

                for candidate in candidates:
                    try:
                        response = await client.get(candidate, follow_redirects=True)
                        response.raise_for_status()
                        soup = BeautifulSoup(response.text, "html.parser")
                        candidate_text = clean_text(soup.get_text(separator=" ", strip=True))
                        if candidate_text:
                            text_block = candidate_text
                            logger.info(f"Successfully fetched content from {candidate} ({len(candidate_text)} characters)")
                            break
                    except Exception as exc:  # noqa: BLE001
                        last_error = str(exc)
                        logger.warning(f"Failed to fetch URL {candidate}: {last_error}")

                if text_block:
                    contents.append(text_block)
                else:
                    failures.append(f"{stripped_url}: {last_error or 'no textual content'}")

        if not contents:
            if failures:
                error_summary = "; ".join(failures[:3])
                if len(failures) > 3:
                    error_summary += f" (and {len(failures) - 3} more errors)"
                raise ValueError(f"Unable to retrieve content from provided URLs: {error_summary}")
            raise ValueError("No content retrieved from provided URLs")

        # Log partial failures but continue processing
        if failures:
            failure_summary = "; ".join(failures[:2])
            if len(failures) > 2:
                failure_summary += f" (and {len(failures) - 2} more failed)"
            logger.warning(f"Some URLs failed to load: {failure_summary}")
            logger.info(f"Successfully loaded content from {len(contents)} out of {len(contents) + len(failures)} URLs")

        return "\n\n".join(contents)

    def _load_csv(self, path: Path) -> list[str]:
        """Load CSV file and convert each record into a structured text row."""

        with path.open("r", encoding="utf-8", newline="") as csv_file:
            reader = csv.reader(csv_file)
            raw_rows = [
                [cell.strip() for cell in row]
                for row in reader
                if row and any(cell.strip() for cell in row)
            ]

        if not raw_rows:
            raise ValueError("CSV file is empty")

        headers_raw = raw_rows[0]
        headers = [
            (header.strip() or f"column_{index + 1}")
            for index, header in enumerate(headers_raw)
        ]

        structured_rows: list[str] = []
        for index, row in enumerate(raw_rows[1:], start=1):
            fields = []
            for column_index, value in enumerate(row):
                header = headers[column_index] if column_index < len(headers) else f"column_{column_index + 1}"
                value = value.strip()
                if not value:
                    continue
                fields.append(f"{header}: {value}")

            if not fields:
                continue

            row_text = f"Row {index}: " + "; ".join(fields)
            structured_rows.append(clean_text(row_text))

        if not structured_rows:
            raise ValueError("CSV file does not contain meaningful rows")

        logger.info(
            "Loaded CSV dataset",
            extra={"rows": len(structured_rows), "path": str(path)},
        )
        return structured_rows

    def _rows_to_chunks(self, rows: list[str]) -> list[dict[str, str | int]]:
        """Convert structured rows into discrete chunks preserving row boundaries."""

        chunks: list[dict[str, str | int]] = []
        for order, row_text in enumerate(rows):
            sanitized = clean_text(row_text)
            if not sanitized:
                continue
            chunks.append({"order": order, "text": sanitized})

        if not chunks:
            raise ValueError("No valid rows available for chunking")

        return chunks

    def _load_json(self, path: Path) -> str:
        """Flatten JSON file into key-value text representation."""

        with path.open("r", encoding="utf-8") as json_file:
            payload = json.load(json_file)

        flattened = list(self._flatten_json(payload))
        if not flattened:
            raise ValueError("JSON file does not contain extractable data")

        logger.info("Loaded JSON dataset", extra={"entries": len(flattened), "path": str(path)})
        return "\n".join(flattened)

    def _flatten_json(self, payload: object, prefix: str = "") -> Iterable[str]:
        """Yield flattened key-value pairs from nested JSON structures."""

        if isinstance(payload, dict):
            for key, value in payload.items():
                new_prefix = f"{prefix}.{key}" if prefix else str(key)
                yield from self._flatten_json(value, new_prefix)
        elif isinstance(payload, list):
            for index, value in enumerate(payload):
                new_prefix = f"{prefix}[{index}]" if prefix else f"[{index}]"
                yield from self._flatten_json(value, new_prefix)
        else:
            yield f"{prefix}: {payload}"

    def _chunk_text(self, text: str, options: ChunkingOptions) -> list[dict[str, str | int]]:
        """Chunk the provided text using sliding window strategy."""

        sanitized = clean_text(text)
        if not sanitized:
            raise ValueError("No textual content available for chunking")

        chunks: list[dict[str, str | int]] = []
        start = 0
        order = 0
        length = len(sanitized)

        while start < length:
            end = min(start + options.chunk_size, length)
            chunk_text = sanitized[start:end].strip()
            if chunk_text:
                chunks.append({"order": order, "text": chunk_text})
                order += 1

            if end >= length:
                break
            start = max(end - options.chunk_overlap, 0)

        logger.info("Generated chunks", extra={"count": len(chunks), "chunk_size": options.chunk_size})
        return chunks
