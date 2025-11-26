"""Entry point for Krira AI FastAPI application."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import embedding_router, llm_router, public_router, upload_router
from .config import get_settings
from .utils import get_logger

settings = get_settings()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Preload heavy models at startup to avoid request timeouts on cold starts."""
    logger.info("Starting up - preloading models...")
    try:
        from sentence_transformers import SentenceTransformer
        SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", device="cpu")
        logger.info("HuggingFace embedding model preloaded successfully")
    except Exception as e:
        logger.warning(f"Model preload failed (will load on first request): {e}")
    
    yield
    
    logger.info("Shutting down...")


def create_app() -> FastAPI:
    """Instantiate and configure the FastAPI application."""

    application = FastAPI(
        title="Krira AI RAG Backend",
        version="1.0.0",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(upload_router)
    application.include_router(embedding_router)
    application.include_router(llm_router, prefix="/api")
    application.include_router(public_router)
    return application


app = create_app()


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """Return application health status."""

    logger.info("Health check invoked", extra={"environment": settings.environment})
    return {"status": "ok", "environment": settings.environment}

