"""Routes for configuring and testing LLM providers."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError

from ...schemas import (
    LLMModelsResponse,
)
from ...schemas.embedding import PineconeConfig
from ...services import LLMService, LLMServiceError
from ...utils import get_logger
from ..dependencies import get_llm_service


logger = get_logger(__name__)

router = APIRouter(tags=["llm"])


@router.get("/llm/models", response_model=LLMModelsResponse)
async def list_llm_models(llm_service: LLMService = Depends(get_llm_service)) -> LLMModelsResponse:
    """Return the configured LLM providers and their models."""

    try:
        return llm_service.list_models()
    except LLMServiceError as exc:  # pragma: no cover - defensive guard
        logger.error("LLM model listing failed: %s", exc)
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/llm/test")
async def test_llm_configuration(
    request: dict,
    llm_service: LLMService = Depends(get_llm_service)
):
    """Test LLM configuration with a sample query."""
    
    try:
        # Extract request parameters
        provider = request.get("provider")
        model_id = request.get("modelId")
        system_prompt = request.get("systemPrompt", "")
        embedding_model = request.get("embeddingModel")
        vector_store = request.get("vectorStore")
        dataset_ids = request.get("datasetIds", [])
        top_k = request.get("topK", 30)
        pinecone_payload = request.get("pinecone")
        test_question = request.get("question")  # Get the actual question from frontend
        
        # Validate required parameters
        if not all([provider, model_id, embedding_model, vector_store, test_question]):
            raise HTTPException(
                status_code=400, 
                detail="Missing required parameters: provider, modelId, embeddingModel, vectorStore, question"
            )
        
        # Parse Pinecone configuration if provided
        pinecone_config = PineconeConfig.model_validate(pinecone_payload) if pinecone_payload else None
        
        # Call the LLM service test method
        result = await llm_service.test_configuration(
            provider=provider,
            model_id=model_id,
            system_prompt=system_prompt,
            embedding_model=embedding_model,
            vector_store=vector_store,
            dataset_ids=dataset_ids,
            top_k=top_k,
            test_question=test_question,
            pinecone=pinecone_config
        )
        
        # Return the result directly in the format the frontend expects
        return result
        
    except ValidationError as exc:
        logger.error("Invalid Pinecone configuration: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.errors()) from exc
    except HTTPException:
        raise
    except LLMServiceError as exc:
        logger.error("LLM test failed: %s", exc)
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Unexpected error during LLM test: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error during test") from exc


@router.post("/llm/evaluate")
async def evaluate_llm_configuration(
    request: dict,
    llm_service: LLMService = Depends(get_llm_service),
):
    """Evaluate LLM responses using a labeled CSV file."""

    try:
        pinecone_payload = request.get("pinecone")
        pinecone_config = PineconeConfig.model_validate(pinecone_payload) if pinecone_payload else None

        dataset_ids_raw = request.get("datasetIds") or []
        if not isinstance(dataset_ids_raw, list):
            dataset_ids_raw = [dataset_ids_raw]
        dataset_ids = [str(item).strip() for item in dataset_ids_raw if str(item).strip()]

        result = await llm_service.evaluate_from_csv(
            provider=request.get("provider", ""),
            model_id=request.get("modelId", ""),
            system_prompt=request.get("systemPrompt", ""),
            embedding_model=request.get("embeddingModel", ""),
            vector_store=request.get("vectorStore", ""),
            dataset_ids=dataset_ids,
            top_k=request.get("topK", 30),
            csv_path=request.get("csvPath", ""),
            pinecone=pinecone_config,
            original_filename=request.get("originalFilename"),
        )
        return result
    except ValidationError as exc:
        logger.error("Invalid Pinecone configuration: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.errors()) from exc
    except LLMServiceError as exc:
        logger.error("LLM evaluation failed: %s", exc)
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        logger.error("Unexpected error during evaluation: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error during evaluation") from exc


