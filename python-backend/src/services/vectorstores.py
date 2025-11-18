"""Vector store persistence helpers for embeddings."""

from __future__ import annotations

import asyncio
import sys
from importlib import import_module
from pathlib import Path
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Sequence

try:  # Pinecone v7 SDK import (fails fast if missing)
    from pinecone import Pinecone, ServerlessSpec  # noqa: F401
    try:
        from pinecone.exceptions import PineconeApiException
    except ImportError:
        from pinecone.core.client.exceptions import PineconeApiException  # type: ignore[assignment]
except ImportError as exc:  # pragma: no cover - import-time failure
    Pinecone = None  # type: ignore[assignment]
    ServerlessSpec = None  # type: ignore[assignment]
    PineconeApiException = Exception  # type: ignore[assignment]
    _pinecone_import_error: Optional[Exception] = exc
else:
    _pinecone_import_error = None

try:
    import chromadb
    try:
        from chromadb.config import Settings as ChromaConfigSettings
    except ImportError:  # pragma: no cover - compatibility shim
        ChromaConfigSettings = None  # type: ignore[assignment]
    ChromaSettingsType = ChromaConfigSettings or getattr(chromadb, "Settings", None)
except ImportError as exc:  # pragma: no cover - import-time failure
    raise ImportError("The chromadb package is required. Install with `pip install chromadb`.") from exc

from ..config import get_settings
from ..schemas.embedding import DatasetEmbeddingPayload, EmbeddingModel, PineconeConfig, VectorStore
from ..utils import get_logger


logger = get_logger(__name__)


@dataclass(slots=True)
class RetrievedContext:
    """Represents a chunk retrieved from the vector store."""

    text: str
    score: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class VectorStoreServiceError(Exception):
    """Raised when vector store persistence fails."""


class VectorStoreService:
    """Persist embeddings into the configured vector database."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._pinecone_clients: Dict[str, Pinecone] = {}
        self._chroma_client = None

    async def upsert(
        self,
        vector_store: VectorStore,
        dataset: DatasetEmbeddingPayload,
        embeddings: List[List[float]],
        *,
        embedding_model: EmbeddingModel,
        pinecone: Optional[PineconeConfig] = None,
        dataset_ids: Optional[Sequence[str]] = None,
    ) -> int:
        """Persist embeddings and return the number of vectors stored."""

        if not embeddings:
            return 0

        if vector_store == "pinecone":
            if not pinecone:
                raise VectorStoreServiceError("Pinecone configuration missing")
            return await asyncio.to_thread(
                self._upsert_pinecone,
                pinecone,
                dataset,
                embeddings,
                embedding_model,
            )

        if vector_store == "chroma":
            return await asyncio.to_thread(
                self._upsert_chroma,
                dataset,
                embeddings,
                embedding_model,
            )

        raise VectorStoreServiceError(f"Unsupported vector store '{vector_store}'")

    async def query(
        self,
        vector_store: VectorStore,
        query_vector: Sequence[float],
        *,
        embedding_model: EmbeddingModel,
        top_k: int = 3,
        pinecone: Optional[PineconeConfig] = None,
        dataset_ids: Optional[Sequence[str]] = None,
    ) -> List[RetrievedContext]:
        """Retrieve the most relevant chunks for the given query vector."""

        if not query_vector:
            return []

        limit = max(1, min(top_k, 200))

        if vector_store == "pinecone":
            if not pinecone:
                raise VectorStoreServiceError("Pinecone configuration missing for retrieval")
            return await asyncio.to_thread(
                self._query_pinecone,
                pinecone,
                list(query_vector),
                limit,
                dataset_ids,
            )

        if vector_store == "chroma":
            return await asyncio.to_thread(
                self._query_chroma,
                embedding_model,
                list(query_vector),
                limit,
                dataset_ids,
            )

        raise VectorStoreServiceError(f"Unsupported vector store '{vector_store}'")

    # ------------------------------------------------------------------
    # Pinecone
    # ------------------------------------------------------------------
    def _ensure_pinecone_client(self, api_key: str) -> Pinecone:
        api_key = api_key.strip()
        if not api_key:
            raise VectorStoreServiceError("Pinecone API key cannot be empty")

        client = self._pinecone_clients.get(api_key)
        if Pinecone is None:  # pragma: no cover - defensive guard
            try:
                module = import_module("pinecone")
                globals()["Pinecone"] = getattr(module, "Pinecone")
                globals()["ServerlessSpec"] = getattr(module, "ServerlessSpec", None)
                try:
                    exc_module = import_module("pinecone.exceptions")
                    globals()["PineconeApiException"] = getattr(exc_module, "PineconeApiException")
                except ImportError:
                    try:
                        exc_module = import_module("pinecone.core.client.exceptions")
                        globals()["PineconeApiException"] = getattr(exc_module, "PineconeApiException")
                    except ImportError:
                        globals()["PineconeApiException"] = Exception
                global _pinecone_import_error
                _pinecone_import_error = None
            except ImportError as exc:
                detail = str(exc)
                if _pinecone_import_error is not None:
                    detail = f"{detail} | initial error: {_pinecone_import_error}"
                raise VectorStoreServiceError(
                    "Pinecone SDK is not available. Install it with `pip install pinecone`."
                    f" (Python executable: {sys.executable}) | {detail}"
                ) from exc

        if client is None:
            logger.debug("Creating Pinecone client", extra={"api_key_prefix": api_key[:4] + "***"})
            client = Pinecone(api_key=api_key)  # type: ignore[call-arg]
            self._pinecone_clients[api_key] = client
        return client

    def _upsert_pinecone(
        self,
        config: PineconeConfig,
        dataset: DatasetEmbeddingPayload,
        embeddings: List[List[float]],
        embedding_model: EmbeddingModel,
    ) -> int:
        client = self._ensure_pinecone_client(config.api_key)

        index_listing = client.list_indexes()
        if hasattr(index_listing, "names"):
            available_indexes = set(index_listing.names())
        elif isinstance(index_listing, dict) and "indexes" in index_listing:
            available_indexes = {
                entry.get("name")
                for entry in index_listing.get("indexes", [])
                if isinstance(entry, dict) and entry.get("name")
            }
        else:
            available_indexes = set()
            try:
                iterable_listing = list(index_listing or [])  # type: ignore[arg-type]
            except TypeError:
                iterable_listing = []
            for entry in iterable_listing:
                if isinstance(entry, str):
                    available_indexes.add(entry)
                else:
                    name = getattr(entry, "name", None)
                    if name:
                        available_indexes.add(name)

        if config.index_name not in available_indexes:
            raise VectorStoreServiceError(f"Pinecone index '{config.index_name}' does not exist")

        index = client.Index(config.index_name)

        expected_dimension = None
        try:
            description = client.describe_index(config.index_name)
            if hasattr(description, "dimension"):
                expected_dimension = description.dimension
            elif isinstance(description, dict):
                expected_dimension = description.get("dimension")
        except Exception:  # pragma: no cover - descriptive call best effort
            expected_dimension = None

        vectors = []
        for chunk, embedding in zip(dataset.chunks, embeddings, strict=False):
            vector_id = f"{dataset.id}::{chunk.order}"
            metadata = {
                "dataset_id": dataset.id,
                "dataset_label": dataset.label,
                "dataset_type": dataset.dataset_type,
                "chunk_order": chunk.order,
                "embedding_model": embedding_model,
                "chunk_text": chunk.text[:4096],
            }
            vectors.append({"id": vector_id, "values": embedding, "metadata": metadata})

        if expected_dimension is not None and vectors:
            actual_dimension = len(vectors[0]["values"])
            if expected_dimension != actual_dimension:
                raise VectorStoreServiceError(
                    "Pinecone index '%s' dimension %s does not match embedding dimension %s"
                    % (config.index_name, expected_dimension, actual_dimension)
                )

        logger.info(
            "Upserting vectors into Pinecone",
            extra={
                "index": config.index_name,
                "namespace": config.namespace,
                "dataset": dataset.id,
                "count": len(vectors),
            },
        )

        namespace = config.namespace or None
        initial_batch_size = 100
        total_batches = max(1, (len(vectors) + initial_batch_size - 1) // initial_batch_size)

        def send_batch(batch_vectors: List[dict], depth: int = 0) -> None:
            if not batch_vectors:
                return

            kwargs = {"vectors": batch_vectors}
            if namespace:
                kwargs["namespace"] = namespace

            try:
                index.upsert(**kwargs)
            except PineconeApiException as exc:  # pragma: no cover - network dependent
                detail = None
                if hasattr(exc, "body") and exc.body:
                    detail = exc.body
                elif exc.args:
                    detail = exc.args[0]

                message = str(detail or exc)
                lower_message = message.lower()

                if "message length too large" in lower_message and len(batch_vectors) > 1:
                    mid = len(batch_vectors) // 2
                    logger.warning(
                        "Pinecone batch too large, splitting",
                        extra={
                            "current_size": len(batch_vectors),
                            "depth": depth,
                            "index": config.index_name,
                        },
                    )
                    send_batch(batch_vectors[:mid], depth + 1)
                    send_batch(batch_vectors[mid:], depth + 1)
                    return

                raise VectorStoreServiceError(f"Pinecone upsert failed: {message}") from exc
            except Exception as exc:  # pragma: no cover - defensive
                raise VectorStoreServiceError("Unexpected error during Pinecone upsert") from exc

        for batch_number, start in enumerate(range(0, len(vectors), initial_batch_size), start=1):
            batch = vectors[start : start + initial_batch_size]
            if not batch:
                continue

            send_batch(batch)

            logger.info(
                "Pinecone batch upsert complete",
                extra={
                    "batch_number": batch_number,
                    "total_batches": total_batches,
                    "batch_size": len(batch),
                    "index": config.index_name,
                },
            )

        return len(vectors)

    def _query_pinecone(
        self,
        config: PineconeConfig,
        query_vector: Sequence[float],
        top_k: int,
        dataset_ids: Optional[Sequence[str]] = None,
    ) -> List[RetrievedContext]:
        client = self._ensure_pinecone_client(config.api_key)
        index = client.Index(config.index_name)

        kwargs = {
            "vector": list(query_vector),
            "top_k": top_k,
            "include_metadata": True,
        }
        if config.namespace:
            kwargs["namespace"] = config.namespace

        if dataset_ids:
            filters = [str(dataset_id).strip() for dataset_id in dataset_ids if str(dataset_id).strip()]
            if filters:
                kwargs["filter"] = {"dataset_id": {"$in": filters}}

        try:
            response = index.query(**kwargs)
        except PineconeApiException as exc:  # pragma: no cover - network dependent
            raise VectorStoreServiceError(f"Pinecone query failed: {exc}") from exc
        except Exception as exc:  # pragma: no cover - defensive guard
            raise VectorStoreServiceError("Unexpected error during Pinecone query") from exc

        matches = getattr(response, "matches", None)
        if matches is None and isinstance(response, dict):
            matches = response.get("matches", [])

        results: List[RetrievedContext] = []
        for match in matches or []:
            metadata_obj = getattr(match, "metadata", None)
            if metadata_obj is None and isinstance(match, dict):
                metadata_obj = match.get("metadata")

            metadata: Dict[str, Any] = dict(metadata_obj or {})
            text = metadata.get("chunk_text") or metadata.get("chunkText") or ""

            score_value = getattr(match, "score", None)
            if score_value is None and isinstance(match, dict):
                score_value = match.get("score")

            try:
                parsed_score = float(score_value) if score_value is not None else None
            except (TypeError, ValueError):  # pragma: no cover - defensive
                parsed_score = None

            results.append(
                RetrievedContext(
                    text=str(text or ""),
                    score=parsed_score,
                    metadata=metadata,
                )
            )

        return results

    # ------------------------------------------------------------------
    # Chroma
    # ------------------------------------------------------------------
    def _ensure_chroma_client(self):
        if self._chroma_client is None:
            storage_dir = self._settings.chroma_directory
            Path(storage_dir).mkdir(parents=True, exist_ok=True)
            try:
                self._chroma_client = chromadb.PersistentClient(path=str(storage_dir))
            except Exception as exc:
                logger.warning(
                    "Failed to initialize persistent Chroma client; falling back to direct Settings",
                    extra={"error": str(exc), "storage_dir": str(storage_dir)},
                )
                settings_kwargs = {
                    "anonymized_telemetry": False,
                    "is_persistent": True,
                    "persist_directory": str(storage_dir),
                    "allow_reset": True,
                    "chroma_api_impl": "chromadb.api.local.LocalAPI",
                }
                fallback_settings = None
                if ChromaSettingsType is not None:
                    try:
                        fallback_settings = ChromaSettingsType(**settings_kwargs)  # type: ignore[arg-type]
                    except TypeError:
                        # Some versions expect positional arguments; fall back to default init
                        pass

                if fallback_settings is not None:
                    self._chroma_client = chromadb.Client(fallback_settings)
                else:
                    self._chroma_client = chromadb.Client()

        return self._chroma_client

    def _upsert_chroma(
        self,
        dataset: DatasetEmbeddingPayload,
        embeddings: List[List[float]],
        embedding_model: EmbeddingModel,
    ) -> int:
        client = self._ensure_chroma_client()
        collection_name = f"krira__{embedding_model}".replace("-", "_")
        collection = client.get_or_create_collection(collection_name)

        ids = [f"{dataset.id}::{chunk.order}" for chunk in dataset.chunks]
        metadatas = [
            {
                "dataset_id": dataset.id,
                "dataset_label": dataset.label,
                "dataset_type": dataset.dataset_type,
                "chunk_order": chunk.order,
                "embedding_model": embedding_model,
            }
            for chunk in dataset.chunks
        ]
        documents = [chunk.text for chunk in dataset.chunks]

        logger.info(
            "Persisting vectors to Chroma",
            extra={"collection": collection_name, "dataset": dataset.id, "count": len(ids)},
        )

        collection.delete(where={"dataset_id": dataset.id})
        collection.add(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=documents)
        return len(ids)

    def _query_chroma(
        self,
        embedding_model: EmbeddingModel,
        query_vector: Sequence[float],
        top_k: int,
        dataset_ids: Optional[Sequence[str]] = None,
    ) -> List[RetrievedContext]:
        client = self._ensure_chroma_client()
        collection_name = f"krira__{embedding_model}".replace("-", "_")
        collection = client.get_or_create_collection(collection_name)

        where_filter = None
        if dataset_ids:
            filters = [str(dataset_id).strip() for dataset_id in dataset_ids if str(dataset_id).strip()]
            if filters:
                where_filter = {"dataset_id": {"$in": filters}}

        try:
            result = collection.query(
                query_embeddings=[list(query_vector)],
                n_results=top_k,
                where=where_filter,
                include=["documents", "metadatas", "distances"],
            )
        except Exception as exc:  # pragma: no cover - defensive
            raise VectorStoreServiceError("Chroma query failed") from exc

        documents = (result.get("documents") if isinstance(result, dict) else getattr(result, "documents", None)) or [[]]
        metadatas = (result.get("metadatas") if isinstance(result, dict) else getattr(result, "metadatas", None)) or [[]]
        distances = (result.get("distances") if isinstance(result, dict) else getattr(result, "distances", None)) or [[]]

        docs = documents[0] if documents else []
        metas = metadatas[0] if metadatas else []
        dists = distances[0] if distances else []

        results: List[RetrievedContext] = []
        for text, metadata, distance in zip(docs, metas, dists, strict=False):
            try:
                score = float(distance) if distance is not None else None
            except (TypeError, ValueError):  # pragma: no cover - defensive
                score = None

            metadata_dict: Dict[str, Any] = dict(metadata or {})
            results.append(
                RetrievedContext(
                    text=str(text or ""),
                    score=score,
                    metadata=metadata_dict,
                )
            )

        return results
