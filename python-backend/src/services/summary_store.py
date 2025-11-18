"""In-memory dataset summary store."""

from __future__ import annotations

from dataclasses import dataclass, field
from threading import Lock
from typing import Dict, Set


@dataclass
class DatasetRegistry:
    """Thread-safe registry for uploaded dataset names."""

    _datasets: Dict[str, Set[str]] = field(default_factory=dict)
    _lock: Lock = field(default_factory=Lock)

    def register(self, dataset_type: str, name: str) -> bool:
        """Register dataset; return False if already present."""

        normalized = name.strip().lower()
        if not normalized:
            return True

        with self._lock:
            catalog = self._datasets.setdefault(dataset_type, set())
            if normalized in catalog:
                return False
            catalog.add(normalized)
        return True

    def has(self, dataset_type: str, name: str) -> bool:
        """Check if dataset already registered."""

        normalized = name.strip().lower()
        if not normalized:
            return False
        with self._lock:
            return normalized in self._datasets.get(dataset_type, set())


registry = DatasetRegistry()
