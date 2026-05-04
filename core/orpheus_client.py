"""
orpheus_client.py — HTTP client voor de OrpheusDL service (poort 5000).

Port van de OrpheusDL-laag in deps.js (searchOrpheus, downloadOrpheus, …).
"""
from __future__ import annotations

import logging
import os

import requests

log = logging.getLogger(__name__)

ORPHEUS_BASE = (os.environ.get("ORPHEUS_URL") or "http://localhost:5000").rstrip("/")
_TIMEOUT     = 15


def get_status() -> dict:
    try:
        r = requests.get(f"{ORPHEUS_BASE}/api/status", timeout=_TIMEOUT)
        r.raise_for_status()
        return {"connected": True, **r.json()}
    except Exception as exc:
        return {"connected": False, "reason": str(exc)}


def search(query: str, platform: str, search_type: str = "album") -> dict:
    """
    Zoek via OrpheusDL op een specifiek platform.

    Returns { results: [...], jobId: str|None }
    """
    try:
        r = requests.get(
            f"{ORPHEUS_BASE}/api/search",
            params={"query": query, "platform": platform, "type": search_type},
            timeout=_TIMEOUT,
        )
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        log.warning("Orpheus search mislukt (%s): %s", platform, exc)
        return {"results": [], "jobId": None}


def download(url: str, quality: str) -> dict:
    """Start een download via URL."""
    r = requests.post(
        f"{ORPHEUS_BASE}/api/download",
        json={"url": url, "quality": quality},
        timeout=_TIMEOUT,
    )
    r.raise_for_status()
    return r.json()


def download_from_search(job_id: str, index: int, quality: str) -> dict:
    """Start een download vanuit een eerder zoekresultaat (jobId + index)."""
    r = requests.post(
        f"{ORPHEUS_BASE}/api/download/search",
        json={"jobId": job_id, "index": index, "quality": quality},
        timeout=_TIMEOUT,
    )
    r.raise_for_status()
    return r.json()


def get_download_status(job_id: str) -> dict:
    try:
        r = requests.get(f"{ORPHEUS_BASE}/api/download/{job_id}", timeout=_TIMEOUT)
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        return {"error": str(exc)}
