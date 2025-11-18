"""File cleaning utilities for the Krira AI RAG ingestion pipeline."""

from __future__ import annotations

import re
import unicodedata
from typing import Final

WHITESPACE_PATTERN: Final[re.Pattern[str]] = re.compile(r"\s+", flags=re.MULTILINE)


def clean_text(text: str) -> str:
    """Return text stripped of control characters and redundant whitespace."""

    normalized = unicodedata.normalize("NFKC", text)
    sanitized = normalized.replace("\x00", "").replace("\ufeff", "")
    collapsed = WHITESPACE_PATTERN.sub(" ", sanitized)
    return collapsed.strip()
