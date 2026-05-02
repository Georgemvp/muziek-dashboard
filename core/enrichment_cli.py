"""
enrichment_cli.py — Standalone enrichment runner.

Start als apart proces via supervisord:
    python -m core.enrichment_cli

Draait alle Python enrichment workers in threads.
Loopt oneindig — workers pollen de enrichment_queue tabel.
"""

import logging
import os
import sys

# ── Logging setup ──────────────────────────────────────────────────────────────
LOG_LEVEL = os.environ.get("LOG_LEVEL", "info").upper()
logging.basicConfig(
    stream=sys.stdout,
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)

logger = logging.getLogger("enrichment_cli")


def main() -> None:
    logger.info("Enrichment CLI gestart")

    # Importeer pas na logging-setup zodat sub-loggers de juiste config pakken
    from core.workers.manager import EnrichmentManager

    manager = EnrichmentManager()
    manager.start_all(blocking=True)   # blokkeert totdat KeyboardInterrupt / SIGTERM


if __name__ == "__main__":
    main()
