"""Public chat API consumed by the external SDK."""

from __future__ import annotations

import time
from typing import Any, Dict, Optional

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from ...config import Settings, get_settings
from ...services import LLMService, LLMServiceError
from ..dependencies import get_llm_service


router = APIRouter(prefix="/v1", tags=["public"])


class ChatRequest(BaseModel):
    """Request model for chat API - accepts pipeline_name from new SDK."""
    pipeline_name: str = Field(..., min_length=4, description="The name/ID of the RAG pipeline to use")
    query: str = Field(..., min_length=1)
    conversation_id: Optional[str] = Field(default=None, max_length=64)
    metadata: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    """Response model for chat API - returns pipeline_name for new SDK."""
    pipeline_name: str
    answer: str
    latency_ms: int
    conversation_id: Optional[str] = None
    context_snippets: Optional[list[str]] = None


async def _verify_api_key(
    *,
    api_key: str,
    pipeline_name: str,
    settings: Settings,
) -> Dict[str, Any]:
    """Verify API key with the Node.js backend."""
    if not settings.service_api_secret:
        raise HTTPException(status_code=500, detail="SERVICE_API_SECRET is not configured")

    verify_url = settings.api_verification_url.rstrip("/")
    # Forward pipeline_name to Node.js backend
    payload = {"apiKey": api_key, "pipelineName": pipeline_name}

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(
                verify_url,
                json=payload,
                headers={"x-service-key": settings.service_api_secret},
            )
        except httpx.RequestError as exc:  # pragma: no cover - network guard
            raise HTTPException(status_code=502, detail="Unable to verify API key") from exc

    if response.status_code == status.HTTP_200_OK:
        return response.json()

    detail = response.json().get("message") if response.headers.get("content-type") == "application/json" else response.text
    raise HTTPException(status_code=response.status_code, detail=detail or "API key verification failed")


async def _track_usage(
    *,
    api_key: str,
    pipeline_name: str,
    settings: Settings,
    tokens: int = 0,
) -> None:
    """Track usage for SDK API calls."""
    if not settings.service_api_secret:
        return  # Skip tracking if not configured

    # Build the track-usage URL from the verification URL
    base_url = settings.api_verification_url.rsplit("/", 1)[0]
    track_url = f"{base_url}/track-usage"
    
    payload = {"apiKey": api_key, "pipelineName": pipeline_name, "tokens": tokens}

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(
                track_url,
                json=payload,
                headers={"x-service-key": settings.service_api_secret},
            )
            if response.status_code == 402:
                # User has exceeded their limit
                data = response.json()
                raise HTTPException(status_code=402, detail=data.get("message", "Request limit reached"))
        except httpx.RequestError:
            # Don't fail the request if usage tracking fails
            pass


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Authorization header")
    return token


@router.post("/chat", response_model=ChatResponse)
async def chat_with_pipeline(
    payload: ChatRequest,
    authorization: str | None = Header(default=None),
    llm_service: LLMService = Depends(get_llm_service),
    settings: Settings = Depends(get_settings),
) -> ChatResponse:
    """Chat with a RAG pipeline using the Krira Augment SDK."""
    api_key = _extract_bearer_token(authorization)
    verification = await _verify_api_key(api_key=api_key, pipeline_name=payload.pipeline_name, settings=settings)

    # Support both new 'pipeline' and legacy 'bot' response structures
    pipeline_config = verification.get("pipeline") or verification.get("bot") or {}
    llm_config = pipeline_config.get("llm") or {}
    embedding_config = pipeline_config.get("embedding") or {}

    if not llm_config:
        raise HTTPException(status_code=400, detail="Pipeline is not configured with an LLM")

    start = time.perf_counter()
    try:
        chat_result = await llm_service.public_chat(
            provider=llm_config.get("provider"),
            model_id=llm_config.get("model"),
            system_prompt=llm_config.get("systemPrompt"),
            vector_store=embedding_config.get("vectorStore"),
            embedding_model=embedding_config.get("model"),
            embedding_dimension=embedding_config.get("dimension"),
            dataset_ids=embedding_config.get("datasetIds") or [],
            top_k=llm_config.get("topK", 30),
            question=payload.query,
            pinecone=embedding_config.get("pineconeConfig"),
        )
    except LLMServiceError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    latency_ms = int((time.perf_counter() - start) * 1000)
    
    # Track usage after successful chat
    await _track_usage(
        api_key=api_key,
        pipeline_name=payload.pipeline_name,
        settings=settings,
        tokens=0,  # TODO: Get actual token count from chat_result if available
    )
    
    return ChatResponse(
        pipeline_name=payload.pipeline_name,
        answer=chat_result["answer"],
        latency_ms=latency_ms,
        conversation_id=payload.conversation_id,
        context_snippets=chat_result.get("context_snippets"),
    )
