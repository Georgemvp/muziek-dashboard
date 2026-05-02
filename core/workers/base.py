"""
base.py — BaseWorker interface voor alle enrichment workers.

Elke worker erft van BaseWorker en implementeert de process() methode.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any


class BaseWorker(ABC):
    """Basisklasse voor alle enrichment workers."""

    # Override in subklasse — wordt gebruikt als queue-source identifier
    source: str = ""

    def __init__(self, db, logger: logging.Logger):
        """
        Parameters
        ----------
        db     : database module (core.database) met enrichment DB-functies
        logger : logging.Logger instantie (eventueel met child context)
        """
        self.db = db
        self.log = logger.getChild(self.source) if self.source else logger

    @abstractmethod
    def process(self, item: dict) -> dict[str, Any]:
        """
        Verwerk één enrichment queue-item.

        Parameters
        ----------
        item : dict met velden uit enrichment_queue:
               id, entity_type, entity_name, entity_id, source, attempts, …

        Returns
        -------
        {"ok": True,  "data": {...}}   bij succes
        {"ok": False, "error": "..."}  bij mislukking
        """
        raise NotImplementedError

    # ── Fuzzy matching helper (Dice-coëfficiënt, zelfde als Node.js workers) ──

    @staticmethod
    def fuzzy_score(a: str, b: str) -> float:
        """Bereken Dice-coëfficiënt tussen twee strings (0.0–1.0)."""
        a = (a or "").lower().strip()
        b = (b or "").lower().strip()
        if a == b:
            return 1.0
        if len(a) < 2 or len(b) < 2:
            return 0.0

        def bigrams(s: str) -> dict:
            m: dict[str, int] = {}
            for i in range(len(s) - 1):
                bg = s[i:i + 2]
                m[bg] = m.get(bg, 0) + 1
            return m

        a_map = bigrams(a)
        b_map = bigrams(b)
        intersection = sum(min(cnt, b_map.get(bg, 0)) for bg, cnt in a_map.items())
        total = len(a) + len(b) - 2
        return (2 * intersection / total) if total > 0 else 0.0

    def fuzzy_best(self, items: list, query: str, name_fn, threshold: float = 0.80):
        """
        Kies het beste item via fuzzy matching.

        Parameters
        ----------
        items     : lijst van items om uit te kiezen
        query     : zoekterm
        name_fn   : callable(item) → str  (haalt de naam op uit een item)
        threshold : minimale score (0.0–1.0)

        Returns het beste item, of None als alles onder de threshold valt.
        """
        norm = lambda s: (s or "").lower().strip()
        # Exacte match eerst
        exact = next((i for i in items if norm(name_fn(i)) == norm(query)), None)
        if exact is not None:
            return exact

        best = None
        best_score = 0.0
        for item in items:
            score = self.fuzzy_score(name_fn(item), query)
            if score > best_score:
                best_score = score
                best = item

        return best if best_score >= threshold else None
