"""LLM integration services leveraging FastRouter and LangChain."""

from __future__ import annotations

import asyncio
import base64
import binascii
import csv
import inspect
import json
import math
import os
import tempfile
import threading
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from statistics import fmean
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union, cast, get_args

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_openai.chat_models.base import BaseChatOpenAI
from openai import OpenAI

from ..config import get_settings
from ..schemas import (
    LLMModelOption,
    LLMModelsResponse,
    LLMProviderOption,
    ProviderLiteral,
)
from ..schemas.embedding import EmbeddingModel, PineconeConfig, VectorStore
from ..utils import get_logger
from .embedding_models import EmbeddingModelService, EmbeddingServiceError
from .vectorstores import RetrievedContext, VectorStoreService, VectorStoreServiceError


logger = get_logger(__name__)


_TOKEN_USAGE_KEYS = (
    "prompt_tokens",
    "completion_tokens",
    "total_tokens",
    "input_tokens",
    "output_tokens",
)


def normalize_usage(raw_usage: Optional[Dict[str, Any]]) -> Tuple[Dict[str, int], Dict[str, Any]]:
    """Normalize token usage dictionaries to int values, defaulting to zero.

    Returns a tuple of (normalized_core_usage, passthrough_metadata).
    """

    if not isinstance(raw_usage, dict):
        if raw_usage is not None:
            logger.debug("Token usage payload malformed (%s); defaulting to zeros", type(raw_usage).__name__)
        raw_usage = {}

    normalized: Dict[str, int] = {}
    metadata: Dict[str, Any] = {}
    numeric_keys = set(_TOKEN_USAGE_KEYS)

    for key, value in raw_usage.items():
        if key in numeric_keys:
            normalized[key] = _coerce_usage_value(value, key)
        else:
            # Preserve additional provider metadata without coercion.
            metadata[key] = value

    for key in numeric_keys:
        normalized.setdefault(key, 0)

    return normalized, metadata


def _coerce_usage_value(value: Any, field: str) -> int:
    if value is None:
        logger.warning("Token usage field %s is None; coercing to 0", field)
        return 0
    if isinstance(value, bool):
        logger.warning("Token usage field %s is boolean %s; coercing to 0", field, value)
        return 0
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        logger.warning("Token usage field %s is float=%s; rounding to int", field, value)
        return int(value)
    if isinstance(value, str):
        try:
            parsed = float(value.strip())
            logger.warning("Token usage field %s is string='%s'; parsed to %s", field, value, parsed)
            return int(parsed)
        except ValueError:
            logger.warning("Token usage field %s string '%s' invalid; coercing to 0", field, value)
            return 0

    logger.warning("Token usage field %s has unsupported type %s; coercing to 0", field, type(value).__name__)
    return 0


def _normalize_result_usage(self, result):
    llm_output = result.llm_output or {}
    raw_usage = llm_output.get("token_usage")
    normalized_usage, metadata = normalize_usage(raw_usage)
    if raw_usage != normalized_usage:
        logger.debug(
            "Normalized token usage for model %s: raw=%s normalized=%s",
            getattr(self, "model_name", getattr(self, "model", "unknown")),
            raw_usage,
            normalized_usage,
        )
    llm_output["token_usage"] = normalized_usage
    if metadata:
        llm_output["token_usage_meta"] = metadata
    result.llm_output = llm_output
    return result


PROVIDER_METADATA: Dict[ProviderLiteral, Dict[str, str]] = {
    "openai": {
        "label": "OpenAI",
        "description": "GPT series via FastRouter",
    },
    "anthropic": {
        "label": "Anthropic",
        "description": "Claude family via FastRouter",
    },
    "google": {
        "label": "Google Gemini",
        "description": "Gemini models served through FastRouter",
    },
    "grok": {
        "label": "Grok",
        "description": "xAI Grok models via FastRouter",
    },
    "deepseek": {
        "label": "DeepSeek",
        "description": "DeepSeek reasoning models via FastRouter",
    },
    "perplexity": {
        "label": "Perplexity",
        "description": "Perplexity Sonar models via FastRouter",
    },
    "glm": {
        "label": "GLM (z-ai)",
        "description": "Z-AI GLM family models served via FastRouter",
    },
}

MODEL_ENV_PREFIXES: Dict[ProviderLiteral, str] = {
    "openai": "FASTROUTER_OPENAI_MODEL_",
    "anthropic": "FASTROUTER_ANTHROPIC_MODEL_",
    "google": "FASTROUTER_GEMINI_MODEL_",
    "grok": "FASTROUTER_GROK_MODEL_",
    "deepseek": "FASTROUTER_DEEPSEEK_MODEL_",
    "perplexity": "FASTROUTER_PERPLEXITY_MODEL_",
    "glm": "FASTROUTER_GLM_MODEL_",
}

# Default model fallbacks in case environment variables are not present.
# This ensures the `/llm/models` endpoint has sensible defaults in dev or
# containerized environments where .env entries may not be loaded.
DEFAULT_MODELS: Dict[ProviderLiteral, List[str]] = {
    "openai": [
        "openai/gpt-5",
        "openai/gpt-oss-120b",
        "openai/gpt-5.1",
        "openai/gpt-4.1",
    ],
    "anthropic": [
        "anthropic/claude-4.5-sonnet",
        "anthropic/claude-3-7-sonnet-20250219:thinking",
        "anthropic/claude-opus-4.1",
        "anthropic/claude-opus-4-20250514",
    ],
    "google": [
        "google/gemini-2.5-pro",
        "google/gemini-2.5-flash",
    ],
    "perplexity": [
        "perplexity/sonar-reasoning-pro",
        "perplexity/sonar-pro",
        "perplexity/sonar-deep-research",
    ],
    "grok": [
        "x-ai/grok-4",
        "x-ai/grok-3-mini-beta",
    ],
    "deepseek": [
        "deepseek-ai/DeepSeek-R1",
        "deepseek/deepseek-v3.1",
    ],
    "glm": [
        "z-ai/glm-4.6",
        "z-ai/glm-4.5",
    ],
}

# Known model tiers (Paid / Free) for display in the UI. If a discovered
# model is not present here, no badge will be returned and the UI can decide
# how to label it.
MODEL_TIERS: Dict[str, str] = {
    # OpenAI
    "openai/gpt-5": "Paid",
    # Note: updated from .env comments — some models are free
    "openai/gpt-oss-120b": "Free",
    "openai/gpt-5.1": "Paid",
    "openai/gpt-4.1": "Free",
    # Anthropic
    "anthropic/claude-4.5-sonnet": "Paid",
    "anthropic/claude-3-7-sonnet-20250219:thinking": "Paid",
    "anthropic/claude-opus-4.1": "Paid",
    "anthropic/claude-opus-4-20250514": "Paid",
    # Google
    "google/gemini-2.5-pro": "Paid",
    "google/gemini-2.5-flash": "Free",
    # Perplexity
    "perplexity/sonar-reasoning-pro": "Paid",
    "perplexity/sonar-pro": "Paid",
    "perplexity/sonar-deep-research": "Paid",
    # Grok
    "x-ai/grok-4": "Paid",
    "x-ai/grok-3-mini-beta": "Paid",
    # DeepSeek
    "deepseek-ai/DeepSeek-R1": "Free",
    "deepseek/deepseek-v3.1": "Paid",
    # GLM
    "z-ai/glm-4.6": "Free",
    "z-ai/glm-4.5": "Free",
}

DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant that uses retrieved enterprise knowledge to answer questions accurately."

MAX_CONTEXT_PREVIEW = 5
PROJECT_ROOT = Path(__file__).resolve().parents[3]
TEST_DIRECTORY = PROJECT_ROOT / "test"


EVALUATION_SYSTEM_PROMPT = (
    "You are an advanced evaluation system for retrieval-augmented generation (RAG) assistants. "
    "Your goal is to assess whether the assistant correctly satisfies the user's information need using the provided context. "
    "\n\n"
    "## Core Evaluation Principles\n"
    "1. Semantic Correctness Over Exact Matching: Judge based on meaning and information accuracy, not word-for-word similarity\n"
    "2. Context Fidelity: Reward answers grounded in context; penalize hallucinations and unsupported claims\n"
    "3. Practical Utility: Assess whether the answer actually helps the user, regardless of stylistic differences from the reference\n"
    "4. Appropriate Scope: Expect answers to match the depth/breadth that the context supports\n"
    "\n\n"
    "## Detailed Scoring Guidelines\n\n"
    "**verdict** ('correct' | 'partial' | 'incorrect'):\n"
    "- 'correct': Answer conveys the same core information as expected answer, semantically equivalent\n"
    "- 'partial': Answer has the right direction but misses some key details or has minor inaccuracies\n"
    "- 'incorrect': Answer is wrong, contradicts expected answer, or completely misses the point\n"
    "\n"
    "**accuracy** (0-100):\n"
    "- 100: Core facts match expected answer (different wording is fine)\n"
    "- 90-99: Correct information but minor differences in completeness or presentation\n"
    "- 70-89: Mostly correct but missing some important details\n"
    "- 50-69: Partially correct with significant gaps or minor errors\n"
    "- Below 50: Major errors or mostly incorrect\n"
    "- Focus on INFORMATION CORRECTNESS, not format or style\n"
    "\n"
    "**evaluation_score** (0-100):\n"
    "- Holistic quality: correctness + helpfulness + professionalism\n"
    "- 100: Perfect answer that fully satisfies the user's need\n"
    "- Deduct for: verbosity without value, poor structure, unhelpful tone\n"
    "- Reward: clarity, directness, appropriate detail level\n"
    "\n"
    "**semantic_accuracy** (0-100):\n"
    "- 100: Meaning perfectly aligns with expected answer\n"
    "- Ignore differences in: word choice, sentence structure, formatting\n"
    "- Focus on: whether the same information is conveyed\n"
    "- Examples of 100 score: '23' vs '23 employees' vs 'The count is 23' vs 'There are twenty-three'\n"
    "\n"
    "**faithfulness** (0-100):\n"
    "- 100: Every claim is verifiable in the provided context\n"
    "- Heavily penalize: fabricated details, assumptions presented as facts, unsupported elaborations\n"
    "- Reward: appropriate use of context, staying within context boundaries\n"
    "- Note: Brevity when context is limited should score 100, not be penalized\n"
    "\n"
    "**answer_relevancy** (0-100):\n"
    "- 100: Directly addresses the question without tangents\n"
    "- Deduct for: off-topic content, excessive preambles, irrelevant information\n"
    "- Reward: focused, on-point responses\n"
    "\n"
    "**content_precision** (0-100):\n"
    "- 100: Appropriate level of detail given the context and question\n"
    "- Penalize: vagueness when specifics are available, over-elaboration beyond context, unsupported details\n"
    "- Reward: specific answers when warranted, concise answers when appropriate\n"
    "\n"
    "**context_recall** (0-100):\n"
    "- 100: Appropriately uses all relevant information from context\n"
    "- Deduct for: missing key context elements that should be included\n"
    "- Note: Not using irrelevant context should NOT be penalized\n"
    "\n\n"
    "## Common Evaluation Mistakes to Avoid\n"
    "DO NOT:\n"
    "- Penalize different phrasings of the same fact\n"
    "- Expect elaborate answers when simple ones are sufficient\n"
    "- Penalize brevity when context is limited\n"
    "- Focus on style over substance\n"
    "\n"
    "DO:\n"
    "- Reward factual correctness regardless of format\n"
    "- Heavily penalize only actual hallucinations\n"
    "- Judge whether the answer serves the user's need\n"
    "\n\n"
    "## Response Format\n"
    "Respond ONLY with a valid JSON object (no markdown fences) containing:\n"
    "- verdict: string ('correct' | 'partial' | 'incorrect')\n"
    "- accuracy: number (0-100)\n"
    "- evaluation_score: number (0-100)\n"
    "- semantic_accuracy: number (0-100)\n"
    "- faithfulness: number (0-100)\n"
    "- answer_relevancy: number (0-100)\n"
    "- content_precision: number (0-100)\n"
    "- context_recall: number (0-100)\n"
    "- reasoning: string (2-3 sentences summarizing the evaluation)\n"
    "- recommended_fix: string (specific suggestion if score < 95, empty string otherwise)\n"
    "- metric_breakdown: object with one-sentence justification for each metric\n"
    "\n"
    "Evaluate fairly and consistently. Focus on whether the answer is correct and useful, not whether it matches a specific style."
)

METRIC_RESPONSE_KEY_MAP: Dict[str, str] = {
    "accuracy": "accuracy",
    "evaluationScore": "evaluation_score",
    "semanticAccuracy": "semantic_accuracy",
    "faithfulness": "faithfulness",
    "answerRelevancy": "answer_relevancy",
    "contentPrecision": "content_precision",
    "contextRecall": "context_recall",
}

METRIC_LABELS: Dict[str, str] = {
    "accuracy": "Accuracy",
    "evaluationScore": "Evaluation Score",
    "semanticAccuracy": "Semantic Accuracy",
    "faithfulness": "Faithfulness",
    "answerRelevancy": "Answer Relevancy",
    "contentPrecision": "Content Precision",
    "contextRecall": "Context Recall",
}

ALLOWED_VERDICTS = {"correct", "partial", "incorrect"}
MAX_CONTEXT_SNIPPETS = 3

TEST_DIRECTORY.mkdir(parents=True, exist_ok=True)


@dataclass(slots=True)
class EvaluationCsvRow:
    number: str
    question: str
    expected_answer: str


def _normalize_header(name: str) -> str:
    cleaned = (name or "").strip().lower()
    return "".join(char for char in cleaned if char.isalnum())


def _load_evaluation_csv(path: Path) -> List[EvaluationCsvRow]:
    rows: List[EvaluationCsvRow] = []

    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        fieldnames = reader.fieldnames or []

        normalized_map = {_normalize_header(field): field for field in fieldnames}

        srno_key = next(
            (
                normalized_map[key]
                for key in ("srno", "srnumber", "serialnumber", "serial", "id", "number", "sr")
                if key in normalized_map
            ),
            None,
        )

        question_key = next(
            (normalized_map[key] for key in ("input", "question", "prompt", "query") if key in normalized_map),
            None,
        )
        answer_key = next(
            (normalized_map[key] for key in ("output", "expectedanswer", "answer", "groundtruth", "expected") if key in normalized_map),
            None,
        )

        if not question_key or not answer_key:
            raise ValueError("CSV file must include 'input' and 'output' columns")

        for index, row in enumerate(reader, start=1):
            question_raw = (row.get(question_key) or "").strip()
            answer_raw = (row.get(answer_key) or "").strip()
            srno_raw = (row.get(srno_key) or "").strip() if srno_key else ""

            if not question_raw and not answer_raw:
                continue

            if not question_raw or not answer_raw:
                raise ValueError(f"Row {index} must include both input and output values")

            number = srno_raw or str(index)
            rows.append(EvaluationCsvRow(number=number, question=question_raw, expected_answer=answer_raw))

    return rows


def _extract_json_object(text: str) -> str:
    stripped = (text or "").strip()
    if not stripped:
        raise ValueError("Empty response from evaluator")

    if stripped.startswith("```"):
        # Remove optional markdown fences such as ```json ... ```
        lines = [line for line in stripped.splitlines() if not line.strip().startswith("```")]
        stripped = "\n".join(lines).strip()

    start = stripped.find("{")
    end = stripped.rfind("}")

    if start == -1 or end == -1 or end < start:
        raise ValueError("Evaluator response did not contain a JSON object")

    return stripped[start : end + 1]


def _percentage_or_none(value: Any) -> Optional[float]:
    if value is None:
        return None

    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        try:
            numeric = float(stripped)
        except ValueError:
            return None
    else:
        numeric = _safe_float(value)

    numeric = max(0.0, min(100.0, numeric))
    return numeric


def _mean(values: Sequence[float]) -> float:
    if not values:
        return 0.0
    return float(fmean(values))


def _prepare_context_snippets(chunks: Sequence[RetrievedContext]) -> List[str]:
    snippets: List[str] = []
    for chunk in chunks:
        text = (chunk.text or "").strip()
        if not text:
            continue
        snippets.append(text)
        if len(snippets) >= MAX_CONTEXT_SNIPPETS:
            break
    return snippets


def _round_percentage(value: Optional[float]) -> Optional[float]:
    if value is None:
        return None
    return round(value, 1)


class LLMServiceError(Exception):
    """Raised when the LLM service is unable to complete a request."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


class LLMService:
    """Expose helper methods for listing and invoking LLM providers via FastRouter."""

    def __init__(
        self,
        embedding_service: EmbeddingModelService,
        vector_store_service: VectorStoreService,
    ) -> None:
        self._settings = get_settings()
        self._embedding_service = embedding_service
        self._vector_store_service = vector_store_service
        self._fastrouter_client: Optional[OpenAI] = None
        self._fastrouter_model = (
            os.getenv("FASTROUTER_OPENAI_MODEL_1")
            or os.getenv("FASTROUTER_OPENAI_MODEL")
            or "openai/gpt-5"
        )
        self._evaluation_roots = self._build_evaluation_roots()

    # ------------------------------------------------------------------
    # Model listing
    # ------------------------------------------------------------------
    def list_models(self) -> LLMModelsResponse:
        """Return the available providers and their configured models."""

        providers: List[LLMProviderOption] = []
        environment = os.environ

        for provider_id, metadata in PROVIDER_METADATA.items():
            prefix = MODEL_ENV_PREFIXES.get(provider_id)
            models: List[LLMModelOption] = []

            if prefix:
                # Read raw environment values and strip inline comments or trailing notes.
                raw_values = [value for key, value in environment.items() if key.startswith(prefix) and value]
                cleaned: List[str] = []
                for val in raw_values:
                    # Remove anything after a '#' (inline comment) and trim whitespace.
                    sanitized = val.split("#", 1)[0].strip()
                    if sanitized:
                        cleaned.append(sanitized)

                # If environment does not contain any entries for this provider,
                # fall back to a curated list of defaults so UI can show options.
                if not cleaned:
                    cleaned = DEFAULT_MODELS.get(provider_id, [])

                for model_id in sorted(set(cleaned), key=str.lower):
                    models.append(
                        LLMModelOption(
                            id=model_id,
                            label=self._format_model_label(model_id),
                            badge=MODEL_TIERS.get(model_id),
                        )
                    )

            providers.append(
                LLMProviderOption(
                    id=cast("ProviderLiteral", provider_id),
                    label=metadata["label"],
                    description=metadata.get("description"),
                    models=models,
                )
            )

        return LLMModelsResponse(providers=providers)

    # ------------------------------------------------------------------
    # Invocation helpers
    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _build_chain(self, *, model: str, api_key: str, base_url: str, system_prompt: str):
        llm = ChatOpenAI(
            model=model,
            api_key=api_key,
            base_url=base_url,
            max_tokens=self._settings.llm_max_tokens,
        )

        prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            system_prompt
            + "\n\n## ABSOLUTE GROUNDING REQUIREMENT"
            + "\nYou must answer questions using ONLY information explicitly present in the provided context."
            + "\nEvery fact, name, number, or detail in your response must be directly traceable to specific text in the context."
            + "\nGive the answer which is present in the given context only.don't elabroate it until and unless user tell in the input"
            + "\n When use greets you also want to greet the user with respect."
            + "\n\n## CRITICAL RULES - NO EXCEPTIONS"
            + "\n\n### Rule 1: Hallucination Prevention"
            + "\n- DO NOT generate, infer, assume, or extrapolate any information beyond what is explicitly stated"
            + "\n- DO NOT mention names, numbers, dates, or facts unless they appear in the context"
            + "\n- DO NOT make calculations or derive information unless the context provides it"
            + "\n- DO NOT use general knowledge if the specific information is not in the context"
            + "\n\n### Rule 2: Singular vs. Multiple Responses"
            + "\n- Questions asking for 'THE' or using singular form require EXACTLY ONE answer"
            + "\n- Questions asking for 'ALL' or using plural form require multiple answers if they exist in context"
            + "\n- Provide multiple answers ONLY when the question explicitly requests multiple OR the context explicitly states a tie"
            + "\n- Default behavior: When in doubt, provide one answer only"
            + "\n\n### Rule 3: Context Completeness"
            + "\n- Treat the provided context as the complete and only source of information"
            + "\n- DO NOT assume additional data exists beyond what is shown"
            + "\n- If context shows limited or sample data, work only with what is provided"
            + "\n\n### Rule 4: Answer Precision"
            + "\n- For simple questions: provide simple, direct answers"
            + "\n- For complex questions: provide detailed answers using only context information"
            + "\n- DO NOT add elaboration, examples, lists, or breakdowns unless they are explicitly in the context"
            + "\n- Match the scope of your answer to what the question asks and the context supports"
            + "\n\n### Rule 5: Handling Insufficient Context"
            + "\n- If context contains the answer: provide it directly"
            + "\n- If context partially answers: provide what you can and acknowledge limitations if relevant"
            + "\n- If context lacks the answer: state the information is not available in the provided context"
            + "\n- NEVER fill gaps with assumptions or general knowledge"
            + "\n\n## MANDATORY PRE-RESPONSE VERIFICATION"
            + "\nBefore responding, verify:"
            + "\n1. Every entity/name I mention is visible in the context"
            + "\n2. Every number I state is present in the context"
            + "\n3. The question asks for one answer or multiple"
            + "\n4. I am not adding information beyond what is stated"
            + "\n5. Each claim is traceable to a specific sentence in the context"
            + "\n\n## QUALITY PRINCIPLES"
            + "\n- Accuracy over completeness: a brief, correct answer is better than a detailed, partially-invented one"
            + "\n- Faithfulness over helpfulness: staying grounded in context is paramount"
            + "\n- Precision over elaboration: exact answers from context are better than expanded explanations"
            + "\n- Simplicity over complexity: if a simple answer suffices, provide it"
        ),
        (
            "user",
            "Question: {question}"
            + "\n\nContext:\n{context}"
            + "\n\nIMPORTANT: Answer using ONLY information explicitly stated in the context above. If the question asks for one item, provide one. If it asks for multiple, provide multiple only if they exist in context. Do not add any information not present in the context. Verify each fact against the context before responding.",
        ),
    ]
)

        return prompt | llm

    def _get_fastrouter_client(self) -> OpenAI:
        api_key = self._settings.fastrouter_api_key
        base_url = self._settings.fastrouter_base_url

        if not api_key:
            raise LLMServiceError("FastRouter API key is not configured")

        if not base_url:
            raise LLMServiceError("FastRouter base URL is not configured")

        if self._fastrouter_client is None:
            self._fastrouter_client = OpenAI(api_key=api_key, base_url=base_url)

        return self._fastrouter_client

    def _build_evaluation_roots(self) -> List[Path]:
        roots: List[Path] = []

        def _append(candidate: Path | str | None) -> None:
            if not candidate:
                return
            try:
                resolved = Path(candidate).expanduser().resolve()
            except Exception:  # pragma: no cover - defensive path resolution
                return
            if resolved not in roots:
                roots.append(resolved)

        _append(TEST_DIRECTORY)

        project_root = PROJECT_ROOT.resolve()
        repo_root = project_root.parent

        # Project-local test directories
        _append(project_root / "test")
        _append(project_root / "backend" / "test")

        # Parent-level fallbacks in case Node/Express runs from parent dir
        _append(repo_root / "test")
        _append(repo_root / "backend" / "test")

        env_override = os.getenv("EVALUATION_DIRECTORY") or os.getenv("EVALUATION_DIR")
        _append(env_override)

        if self._settings.environment.lower() == "production":
            _append(Path("/tmp/test"))
        else:
            tmp_dir = os.getenv("TMPDIR")
            if tmp_dir:
                _append(Path(tmp_dir) / "test")

        return roots or [TEST_DIRECTORY.resolve()]

    @staticmethod
    def _is_within_directory(path: Path, parent: Path) -> bool:
        try:
            path.relative_to(parent)
            return True
        except ValueError:
            return False

    def _resolve_csv_path(self, csv_path: str) -> Path:
        candidate = Path(csv_path)
        if not candidate.is_absolute():
            candidate = (PROJECT_ROOT / candidate).resolve()
        else:
            candidate = candidate.resolve()

        allowed_roots = self._evaluation_roots or [TEST_DIRECTORY.resolve()]
        if not any(self._is_within_directory(candidate, root) for root in allowed_roots):
            allowed_paths = ", ".join(str(root) for root in allowed_roots)
            raise LLMServiceError(
                "Evaluation CSV must reside within one of the allowed directories: " + allowed_paths
            )

        if not candidate.exists() or not candidate.is_file():
            raise LLMServiceError(f"Evaluation CSV file '{candidate}' was not found")

        if candidate.suffix.lower() != ".csv":
            raise LLMServiceError("Evaluation file must be a CSV")

        return candidate

    def _materialize_csv_content(self, csv_content: str, original_filename: Optional[str]) -> Path:
        """Decode base64 CSV content into a temporary file accessible to this service."""

        try:
            decoded = base64.b64decode(csv_content, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise LLMServiceError("Evaluation CSV payload is invalid; provide base64 content") from exc

        if not decoded.strip():
            raise LLMServiceError("Evaluation CSV content is empty")

        suffix = Path(original_filename or "evaluation.csv").suffix or ".csv"
        temp_root = (self._evaluation_roots[0] if self._evaluation_roots else TEST_DIRECTORY).resolve()

        try:
            temp_root.mkdir(parents=True, exist_ok=True)
        except OSError as exc:  # pragma: no cover - filesystem guard
            logger.error("Unable to create evaluation directory %s: %s", temp_root, exc)
            raise LLMServiceError("Unable to prepare evaluation workspace") from exc

        with tempfile.NamedTemporaryFile(prefix="evaluation-", suffix=suffix, dir=temp_root, delete=False) as handle:
            handle.write(decoded)
            temp_path = Path(handle.name).resolve()

        return temp_path

    async def _score_answer_with_fastrouter(
        self,
        *,
        client: OpenAI,
        question: str,
        expected_answer: str,
        model_answer: str,
        context_snippets: Sequence[str],
    ) -> Dict[str, Any]:
        joined_context = (
            "\n".join(f"- {snippet}" for snippet in context_snippets)
            if context_snippets
            else "- No retrieved context"
        )

        user_message = (
            "Evaluate the assistant's answer against the reference using the provided context."
            "\n\nQuestion:\n"
            f"{question.strip()}"
            "\n\nExpected Answer:\n"
            f"{expected_answer.strip()}"
            "\n\nAssistant Answer:\n"
            f"{model_answer.strip()}"
            "\n\nRetrieved Context:\n"
            f"{joined_context}"
            "\n\nReturn the JSON object described in the system prompt."
        )

        try:
            response = await asyncio.to_thread(
                client.chat.completions.create,
                model=self._fastrouter_model,
                messages=[
                    {"role": "system", "content": EVALUATION_SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.0,
                max_tokens=900,
            )
        except Exception as exc:  # pragma: no cover - network dependent
            logger.error("FastRouter evaluation failed: %s", exc)
            raise LLMServiceError("Failed to score model answers with FastRouter") from exc

        try:
            content = response.choices[0].message.content if response.choices else ""
        except (AttributeError, IndexError):  # pragma: no cover - defensive
            content = ""

        try:
            json_payload = _extract_json_object(content)
            parsed = json.loads(json_payload)
        except Exception as exc:  # pragma: no cover - defensive parsing
            logger.error("Unable to parse evaluator response: %s", content)
            raise LLMServiceError("Evaluator response could not be parsed") from exc

        if not isinstance(parsed, dict):
            raise LLMServiceError("Evaluator response was not a JSON object")

        return cast(Dict[str, Any], parsed)

    async def _retrieve_context(
        self,
        vector_store: VectorStore,
        embedding_model: EmbeddingModel,
        query_vector: List[float],
        *,
        top_k: int,
        dataset_ids: Optional[List[str]],
        pinecone: Optional[PineconeConfig],
    ) -> List[RetrievedContext]:
        try:
            return await self._vector_store_service.query(
                vector_store,
                query_vector,
                embedding_model=embedding_model,
                top_k=top_k,
                pinecone=pinecone,
                dataset_ids=dataset_ids,
            )
        except VectorStoreServiceError as exc:
            raise LLMServiceError(str(exc), status_code=502) from exc

    def _build_context_window(self, chunks: List[RetrievedContext]) -> str:
        if not chunks:
            return "No external docs available."

        seen: set[str] = set()
        ordered: List[str] = []
        for chunk in chunks:
            text = chunk.text.strip()
            if not text or text in seen:
                continue
            seen.add(text)
            ordered.append(text)

        return "\n\n".join(ordered) if ordered else "No external docs available."

    def _format_model_label(self, model_id: str) -> str:
        candidate = model_id.split("/")[-1] if model_id else model_id
        candidate = candidate.replace("-", " ").replace("_", " ")
        formatted = " ".join(word.upper() if word in {"gpt", "llama", "oss", "xai"} else word.capitalize() for word in candidate.split())
        return formatted or model_id

    async def test_configuration(
        self,
        provider: ProviderLiteral,
        model_id: str,
        system_prompt: str,
        embedding_model: EmbeddingModel,
        vector_store: VectorStore,
        dataset_ids: List[str],
        top_k: int,
        test_question: str,
        embedding_dimension: Optional[int] = None,
        pinecone: Optional[PineconeConfig] = None,
    ) -> Dict[str, Any]:
        """Test LLM configuration with a sample question."""
        
        try:
            # Use FastRouter credentials (all providers use FastRouter)
            api_key = self._settings.fastrouter_api_key
            base_url = self._settings.fastrouter_base_url
            
            if not api_key:
                raise LLMServiceError("FastRouter API key not configured")
            
            # Create test chain
            test_chain = self._build_chain(
                model=model_id,
                api_key=api_key,
                base_url=base_url,
                system_prompt=system_prompt
            )
            
            # Get embeddings for the test question
            question_vectors = await self._embedding_service.generate(
                embedding_model,
                [test_question],
                dimensions=embedding_dimension,
            )
            question_vector = question_vectors[0] if question_vectors else []
            
            # Retrieve relevant context
            context_chunks = await self._retrieve_context(
                vector_store,
                embedding_model,
                question_vector,
                top_k=top_k,
                dataset_ids=dataset_ids,
                pinecone=pinecone,
            )
            
            # Generate answer using the LLM
            context_text = self._build_context_window(context_chunks)
            llm_response = await test_chain.ainvoke({
                "question": test_question,
                "context": context_text
            })
            
            generated_answer = llm_response.content if hasattr(llm_response, 'content') else str(llm_response)
            
            return {
                "question": test_question,
                "answer": generated_answer,
                "context_chunks_found": len(context_chunks),
                "model_used": model_id,
                "provider": provider,
                "context": [
                    {"text": chunk.text, "score": chunk.score, "metadata": {}} 
                    for chunk in context_chunks[:5]
                ]
            }
            
        except Exception as e:
            logger.error(f"Error in configuration test: {e}")
            raise LLMServiceError(f"Configuration test failed: {str(e)}")


    async def public_chat(
        self,
        *,
        provider: str,
        model_id: str,
        system_prompt: Optional[str],
        vector_store: Optional[str],
        embedding_model: Optional[str],
        embedding_dimension: Optional[int],
        dataset_ids: Sequence[str],
        top_k: int,
        question: str,
        pinecone: Optional[PineconeConfig],
    ) -> Dict[str, Any]:
        provider_candidate = (provider or "").strip().lower()
        if provider_candidate not in PROVIDER_METADATA:
            raise LLMServiceError(f"Unsupported provider '{provider}'")
        provider_literal = cast(ProviderLiteral, provider_candidate)

        if not model_id or not model_id.strip():
            raise LLMServiceError("Model identifier is required for chat")

        dataset_id_list = [str(entry).strip() for entry in (dataset_ids or []) if str(entry).strip()]

        embedding_literal: Optional[EmbeddingModel] = None
        vector_literal: Optional[VectorStore] = None
        if dataset_id_list and embedding_model and vector_store:
            embedding_candidate = embedding_model.strip()
            if embedding_candidate not in get_args(EmbeddingModel):
                raise LLMServiceError(f"Unsupported embedding model '{embedding_model}'")
            embedding_literal = cast(EmbeddingModel, embedding_candidate)

            vector_candidate = vector_store.strip()
            if vector_candidate not in get_args(VectorStore):
                raise LLMServiceError(f"Unsupported vector store '{vector_store}'")
            vector_literal = cast(VectorStore, vector_candidate)

        api_key = self._settings.fastrouter_api_key
        base_url = self._settings.fastrouter_base_url
        if not api_key:
            raise LLMServiceError("FastRouter API key is not configured")

        resolved_prompt = (system_prompt or "").strip() or DEFAULT_SYSTEM_PROMPT
        answer_chain = self._build_chain(
            model=model_id,
            api_key=api_key,
            base_url=base_url,
            system_prompt=resolved_prompt,
        )

        context_snippets: List[str] = []
        context_text = ""
        contexts: List[RetrievedContext] = []

        # Convert Pinecone config if it's a dict (from Node backend)
        if isinstance(pinecone, dict):
            try:
                # Map camelCase to snake_case
                pinecone_data = {
                    "api_key": pinecone.get("apiKey") or pinecone.get("api_key"),
                    "index_name": pinecone.get("indexName") or pinecone.get("index_name"),
                    "namespace": pinecone.get("namespace"),
                }
                pinecone = PineconeConfig(**pinecone_data)
            except Exception as exc:
                logger.warning(f"Failed to convert Pinecone config: {exc}")

        if embedding_literal and vector_literal and dataset_id_list:
            try:
                question_vector = await self._embedding_service.generate(
                    embedding_literal,
                    [question],
                    dimensions=embedding_dimension,
                )
                
                contexts = await self._retrieve_context(
                    vector_literal,
                    embedding_literal,
                    question_vector[0],
                    top_k=max(1, int(top_k) if isinstance(top_k, (int, float)) else 30),
                    dataset_ids=dataset_id_list,
                    pinecone=pinecone,
                )

                context_snippets = _prepare_context_snippets(contexts)
                context_text = self._build_context_window(contexts)
            except Exception as exc:  # pragma: no cover - defensive guard
                logger.warning("Context retrieval failed for public chat: %s", exc)

        llm_response = await answer_chain.ainvoke({"question": question, "context": context_text})
        model_answer = getattr(llm_response, "content", None) or str(llm_response)

        return {
            "answer": model_answer.strip(),
            "provider": provider_literal,
            "model": model_id,
            "context_snippets": context_snippets,
            "context": contexts,
        }


    async def evaluate_from_csv(
        self,
        *,
        provider: str,
        model_id: str,
        system_prompt: str,
        embedding_model: str,
        vector_store: str,
        dataset_ids: Sequence[str],
        top_k: int,
        embedding_dimension: Optional[int] = None,
        csv_path: str,
        csv_content: Optional[str],
        pinecone: Optional[PineconeConfig],
        original_filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Run automated evaluation using a labeled CSV file."""

        provider_candidate = (provider or "").strip().lower()
        if provider_candidate not in PROVIDER_METADATA:
            raise LLMServiceError(f"Unsupported provider '{provider}'")
        provider_literal = cast(ProviderLiteral, provider_candidate)

        if not model_id or not model_id.strip():
            raise LLMServiceError("Model identifier is required for evaluation")

        embedding_candidate = (embedding_model or "").strip()
        if embedding_candidate not in get_args(EmbeddingModel):
            raise LLMServiceError(f"Unsupported embedding model '{embedding_model}'")
        embedding_literal = cast(EmbeddingModel, embedding_candidate)

        vector_candidate = (vector_store or "").strip()
        if vector_candidate not in get_args(VectorStore):
            raise LLMServiceError(f"Unsupported vector store '{vector_store}'")
        vector_literal = cast(VectorStore, vector_candidate)

        dataset_id_list = [str(entry).strip() for entry in (dataset_ids or []) if str(entry).strip()]
        if not dataset_id_list:
            raise LLMServiceError("At least one dataset must be selected for evaluation")

        csv_file: Path
        temp_csv_path: Optional[Path] = None

        try:
            csv_path_candidate = (csv_path or "").strip()

            if csv_content:
                temp_csv_path = self._materialize_csv_content(csv_content, original_filename)
                csv_file = temp_csv_path
            else:
                if not csv_path_candidate:
                    raise LLMServiceError("Evaluation CSV path or content must be provided")
                csv_file = self._resolve_csv_path(csv_path_candidate)

            csv_rows = _load_evaluation_csv(csv_file)
        except ValueError as exc:
            raise LLMServiceError(str(exc)) from exc
        finally:
            if temp_csv_path:
                try:
                    temp_csv_path.unlink(missing_ok=True)
                except OSError:  # pragma: no cover - cleanup guard
                    logger.warning("Failed to remove temporary evaluation CSV %s", temp_csv_path)

        if not csv_rows:
            raise LLMServiceError("Evaluation CSV is empty; add at least one row")

        api_key = self._settings.fastrouter_api_key
        base_url = self._settings.fastrouter_base_url
        if not api_key:
            raise LLMServiceError("FastRouter API key is not configured")

        resolved_prompt = (system_prompt or "").strip() or DEFAULT_SYSTEM_PROMPT
        answer_chain = self._build_chain(
            model=model_id,
            api_key=api_key,
            base_url=base_url,
            system_prompt=resolved_prompt,
        )

        question_texts = [row.question for row in csv_rows]
        question_vectors = await self._embedding_service.generate(
            embedding_literal,
            question_texts,
            dimensions=embedding_dimension,
        )
        vector_map = {index: vector for index, vector in enumerate(question_vectors)}

        metric_values: Dict[str, List[Tuple[float, str]]] = {
            key: [] for key in METRIC_RESPONSE_KEY_MAP
        }
        metric_messages: Dict[str, List[str]] = {
            key: [] for key in METRIC_RESPONSE_KEY_MAP
        }

        evaluation_rows: List[Dict[str, Any]] = []
        correct_count = 0

        fastrouter_client = self._get_fastrouter_client()
        evaluated_rows = 0

        try:
            safe_top_k = max(1, int(top_k))
        except (TypeError, ValueError):
            safe_top_k = 30

        for index, row in enumerate(csv_rows):
            query_vector = vector_map.get(index, [])
            contexts = await self._retrieve_context(
                vector_literal,
                embedding_literal,
                query_vector,
                top_k=safe_top_k,
                dataset_ids=dataset_id_list,
                pinecone=pinecone,
            )

            context_snippets = _prepare_context_snippets(contexts)
            context_text = self._build_context_window(contexts)

            llm_response = await answer_chain.ainvoke(
                {
                    "question": row.question,
                    "context": context_text,
                }
            )
            model_answer = getattr(llm_response, "content", None) or str(llm_response)

            evaluation_payload = await self._score_answer_with_fastrouter(
                client=fastrouter_client,
                question=row.question,
                expected_answer=row.expected_answer,
                model_answer=model_answer,
                context_snippets=context_snippets,
            )

            verdict_raw = str(evaluation_payload.get("verdict", "")).strip().lower()
            verdict = verdict_raw if verdict_raw in ALLOWED_VERDICTS else "incorrect"
            if verdict == "correct":
                correct_count += 1

            metric_breakdown = evaluation_payload.get("metric_breakdown") or {}
            row_metric_map: Dict[str, Optional[float]] = {}

            for metric_key, response_key in METRIC_RESPONSE_KEY_MAP.items():
                value = _percentage_or_none(evaluation_payload.get(response_key))
                if metric_key == "accuracy" and value is None:
                    if verdict == "correct":
                        value = 100.0
                    elif verdict == "partial":
                        value = 50.0
                    else:
                        value = 0.0

                if value is not None:
                    metric_values[metric_key].append((value, row.number))

                explanation = metric_breakdown.get(response_key) or metric_breakdown.get(metric_key)
                if isinstance(explanation, str) and explanation.strip():
                    metric_messages[metric_key].append(explanation.strip())

                row_metric_map[metric_key] = _round_percentage(value)

            reasoning = evaluation_payload.get("reasoning")
            recommended_fix = evaluation_payload.get("recommended_fix")
            notes_parts = []
            if isinstance(reasoning, str) and reasoning.strip():
                notes_parts.append(reasoning.strip())
            if isinstance(recommended_fix, str) and recommended_fix.strip():
                notes_parts.append(f"Suggested fix: {recommended_fix.strip()}")
            notes = " ".join(notes_parts).strip() or None

            evaluation_rows.append(
                {
                    "questionNumber": row.number,
                    "question": row.question,
                    "expectedAnswer": row.expected_answer,
                    "modelAnswer": model_answer.strip(),
                    "verdict": verdict,
                    "llmScore": row_metric_map.get("evaluationScore") or 0.0,
                    "semanticScore": row_metric_map.get("semanticAccuracy"),
                    "faithfulness": row_metric_map.get("faithfulness"),
                    "answerRelevancy": row_metric_map.get("answerRelevancy"),
                    "contentPrecision": row_metric_map.get("contentPrecision"),
                    "contextRecall": row_metric_map.get("contextRecall"),
                    "contextSnippets": context_snippets,
                    "notes": notes,
                }
            )

            evaluated_rows += 1

        metrics_summary: Dict[str, float] = {}
        for metric_key in METRIC_RESPONSE_KEY_MAP:
            values = [entry[0] for entry in metric_values[metric_key]]
            metrics_summary[metric_key] = round(_mean(values), 1) if values else 0.0

        total_rows = evaluated_rows or 1
        accuracy_percentage = metrics_summary.get("accuracy", 0.0)
        if metric_values["accuracy"]:
            # Recompute accuracy using verdicts to reinforce binary scoring.
            accuracy_percentage = round((correct_count / total_rows) * 100, 1)
            metrics_summary["accuracy"] = accuracy_percentage

        justifications: Dict[str, str] = {}
        for metric_key, label in METRIC_LABELS.items():
            values = metric_values[metric_key]
            if not values:
                justifications[metric_key] = "No evaluation data available."
                continue

            average = metrics_summary.get(metric_key, 0.0)
            worst = min(values, key=lambda item: item[0])
            worst_value, worst_number = worst
            explanation = metric_messages[metric_key][0] if metric_messages[metric_key] else ""

            base_message = (
                f"Average {label.lower()} {average:.1f}% across {total_rows} example{'s' if total_rows != 1 else ''}."
            )
            worst_message = f" Lowest score {worst_value:.1f}% on example #{worst_number}."
            detail_message = f" {explanation}" if explanation else ""
            justifications[metric_key] = (base_message + worst_message + detail_message).strip()

        try:
            csv_reference = str(csv_file.relative_to(PROJECT_ROOT))
        except ValueError:
            csv_reference = str(csv_file)

        return {
            "metrics": {
                "accuracy": metrics_summary.get("accuracy", 0.0),
                "evaluationScore": metrics_summary.get("evaluationScore", 0.0),
                "semanticAccuracy": metrics_summary.get("semanticAccuracy", 0.0),
                "faithfulness": metrics_summary.get("faithfulness", 0.0),
                "answerRelevancy": metrics_summary.get("answerRelevancy", 0.0),
                "contentPrecision": metrics_summary.get("contentPrecision", 0.0),
                "contextRecall": metrics_summary.get("contextRecall", 0.0),
            },
            "rows": evaluation_rows,
            "justifications": justifications,
            "source": {
                "csv": csv_reference,
                "filename": original_filename or csv_file.name,
                "total": evaluated_rows,
                "provider": provider_literal,
                "model": model_id,
            },
        }

def _safe_float(value: Any) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return 0.0
    if not math.isfinite(numeric):
        return 0.0
    return numeric


