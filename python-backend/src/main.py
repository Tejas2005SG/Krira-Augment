"""Entry point for Krira AI FastAPI application."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import embedding_router, llm_router, upload_router
from .config import get_settings
from .utils import get_logger

settings = get_settings()
logger = get_logger(__name__)


def create_app() -> FastAPI:
    """Instantiate and configure the FastAPI application."""

    application = FastAPI(title="Krira AI RAG Backend", version="1.0.0")
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
    return application


app = create_app()


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """Return application health status."""

    logger.info("Health check invoked", extra={"environment": settings.environment})
    return {"status": "ok", "environment": settings.environment}

