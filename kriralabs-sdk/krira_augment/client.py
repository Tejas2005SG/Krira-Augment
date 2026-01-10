"""HTTP client for interacting with the Krira Augment public API."""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests
from requests import Response
from requests.exceptions import ConnectionError as RequestsConnectionError
from requests.exceptions import Timeout as RequestsTimeout

from .exceptions import (
    AuthenticationError,
    KriraAugmentError,
    PermissionDeniedError,
    RateLimitError,
    ServerError,
    TransportError,
)

DEFAULT_BASE_URL = "https://rag-python-backend.onrender.com/v1"
USER_AGENT = "krira-augment-sdk/1.0.0"

# Default timeout increased to 60s to account for Render cold starts
DEFAULT_TIMEOUT = 60.0
# Number of retries for timeout errors
DEFAULT_RETRIES = 2


@dataclass(slots=True)
class ChatResponse:
    """Normalized response returned by ``KriraAugment.ask``."""

    answer: str
    pipeline_name: str
    conversation_id: Optional[str]
    raw: Dict[str, Any]


class KriraAugment:
    """Thin wrapper around the Krira Augment public chat API."""

    def __init__(
        self,
        *,
        api_key: str,
        pipeline_name: str,
        base_url: str | None = None,
        timeout: float = DEFAULT_TIMEOUT,
        retries: int = DEFAULT_RETRIES,
        session: Optional[requests.Session] = None,
    ) -> None:
        if not api_key or not api_key.strip():
            raise ValueError("api_key is required")
        if not pipeline_name or not pipeline_name.strip():
            raise ValueError("pipeline_name is required")
        if timeout <= 0:
            raise ValueError("timeout must be greater than zero")

        self.api_key = api_key.strip()
        self.pipeline_name = pipeline_name.strip()
        self.base_url = (base_url or DEFAULT_BASE_URL).rstrip("/")
        self.timeout = timeout
        self.retries = max(0, retries)
        self._session = session or requests.Session()
        self._session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        })

    def ask(
        self,
        question: str,
        *,
        conversation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        timeout: Optional[float] = None,
    ) -> ChatResponse:
        """Send a user question to the pipeline and return the model answer."""

        if not question or not question.strip():
            raise ValueError("question must be a non-empty string")

        payload: Dict[str, Any] = {
            "pipeline_name": self.pipeline_name,
            "query": question.strip(),
        }
        if conversation_id:
            payload["conversation_id"] = conversation_id
        if metadata:
            payload["metadata"] = metadata

        response = self._post("/chat", payload, timeout or self.timeout)
        data = self._parse_response(response)
        answer = data.get("answer")
        if not isinstance(answer, str) or not answer:
            raise ServerError("Chat response payload is missing the 'answer' field")

        return ChatResponse(
            answer=answer,
            pipeline_name=data.get("pipeline_name", self.pipeline_name),
            conversation_id=data.get("conversation_id"),
            raw=data,
        )

    def close(self) -> None:
        """Close the underlying HTTP session."""

        self._session.close()

    # ---------------------------------------------------------------------
    # Internal helpers
    # ---------------------------------------------------------------------
    def _post(self, path: str, payload: Dict[str, Any], timeout: float) -> Response:
        """POST with automatic retry on timeout (handles Render cold starts)."""
        url = f"{self.base_url}{path}"
        last_error: Optional[Exception] = None
        
        for attempt in range(self.retries + 1):
            try:
                return self._session.post(url, json=payload, timeout=timeout)
            except RequestsTimeout as exc:
                last_error = exc
                if attempt < self.retries:
                    # Exponential backoff: 2s, 4s, 8s...
                    wait_time = 2 ** (attempt + 1)
                    time.sleep(wait_time)
                    continue
            except RequestsConnectionError as exc:
                raise TransportError("Unable to reach Krira Augment API") from exc
        
        # All retries exhausted
        raise TransportError(
            f"Request to Krira Augment timed out after {self.retries + 1} attempts. "
            "The server may be waking up from cold start - please try again."
        ) from last_error

    def _parse_response(self, response: Response) -> Dict[str, Any]:
        if response.status_code == 401:
            raise AuthenticationError("API key is invalid or has been revoked")
        if response.status_code == 403:
            raise PermissionDeniedError("API key lacks permission to access this pipeline")
        if response.status_code == 429:
            raise RateLimitError("API rate limit exceeded. Slow down your requests.")
        if 400 <= response.status_code < 500:
            raise KriraAugmentError(self._extract_error_message(response) or "Invalid request")
        if response.status_code >= 500:
            raise ServerError("Krira Augment service is temporarily unavailable")

        try:
            return response.json()
        except ValueError as exc:  # pragma: no cover - defensive
            raise ServerError("Received a non-JSON response from Krira Augment") from exc

    @staticmethod
    def _extract_error_message(response: Response) -> str:
        try:
            payload = response.json()
            if isinstance(payload, dict):
                return str(payload.get("message") or payload.get("detail") or "")
            return str(payload)
        except ValueError:
            return response.text.strip()


# Alternate export names for convenience.
KriraPipeline = KriraAugment
KriraAugmentClient = KriraAugment
