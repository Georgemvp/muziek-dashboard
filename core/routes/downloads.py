"""
core/routes/downloads.py — Download API routes als Flask Blueprint.

Port van routes/download.js. Alle endpoints onder /api/core/download/*.
"""
from __future__ import annotations

import logging

from flask import Blueprint, jsonify, request

import core.database as db
import core.download_orchestrator as orch
from core.download_orchestrator import DEFAULT_SOURCE_PRIORITY

log = logging.getLogger(__name__)

downloads_bp = Blueprint("downloads", __name__)


# ── POST /api/core/download ───────────────────────────────────────────────────

@downloads_bp.post("/api/core/download")
def start_download():
    body    = request.get_json(silent=True) or {}
    artist  = (body.get("artist") or "").strip()
    album   = (body.get("album")  or "").strip()
    track   = (body.get("track")  or "").strip()
    if not artist and not album and not track:
        return jsonify({"error": "artist, album of track is verplicht"}), 400
    try:
        result     = orch.download(
            artist=artist,
            album=album,
            track=track,
            item_type=body.get("type") or ("album" if album else "track"),
            quality=body.get("quality") or "flac",
            source=body.get("source") or "auto",
        )
        status_code = 200 if result["status"] == "completed" else (503 if result["status"] == "failed" else 202)
        return jsonify({
            "id":      result["id"],
            "status":  result["status"],
            "source":  result.get("source"),
            "message": (f"Download gestart via {result.get('source')}"
                        if result["status"] == "completed"
                        else result.get("error") or "Download gestart"),
        }), status_code, {"Cache-Control": "no-store"}
    except Exception as exc:
        log.error("Download orchestrator fout: %s", exc)
        return jsonify({"error": str(exc)}), 500


# ── GET /api/core/download/search ─────────────────────────────────────────────

@downloads_bp.get("/api/core/download/search")
def download_search():
    q    = (request.args.get("q") or "").strip()
    typ  = request.args.get("type") or "album"
    if len(q) < 2:
        return jsonify({"error": "Zoekterm moet minimaal 2 tekens zijn"}), 400
    try:
        data = orch.search_all(q, typ)
        return jsonify({**data, "query": q, "type": typ}), 200, {"Cache-Control": "private, max-age=120"}
    except Exception as exc:
        return jsonify({"error": str(exc), "results": []}), 500


# ── GET /api/core/download/status ─────────────────────────────────────────────

@downloads_bp.get("/api/core/download/status")
def download_status():
    try:
        data = orch.get_source_status()
        return jsonify(data), 200, {"Cache-Control": "private, max-age=30"}
    except Exception as exc:
        return jsonify({"error": str(exc), "sources": []}), 500


# ── GET /api/core/download/status/<job_id> ────────────────────────────────────

@downloads_bp.get("/api/core/download/status/<int:job_id>")
def download_job_status(job_id: int):
    try:
        job = db.get_download_job(job_id)
        if not job:
            return jsonify({"error": "Job niet gevonden"}), 404
        return jsonify(job), 200, {"Cache-Control": "no-store"}
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── GET /api/core/download/queue ──────────────────────────────────────────────

@downloads_bp.get("/api/core/download/queue")
def download_queue():
    try:
        jobs = db.get_active_download_jobs()
        return jsonify({"jobs": jobs}), 200, {"Cache-Control": "no-store"}
    except Exception as exc:
        return jsonify({"error": str(exc), "jobs": []}), 500


# ── GET /api/core/download/history ───────────────────────────────────────────

@downloads_bp.get("/api/core/download/history")
def download_history():
    limit = min(int(request.args.get("limit") or 50), 200)
    try:
        jobs = db.get_recent_download_jobs(limit)
        return jsonify({"jobs": jobs}), 200, {"Cache-Control": "private, max-age=60"}
    except Exception as exc:
        return jsonify({"error": str(exc), "jobs": []}), 500


# ── POST /api/core/download/retry/<job_id> ────────────────────────────────────

@downloads_bp.post("/api/core/download/retry/<int:job_id>")
def download_retry(job_id: int):
    job = db.get_download_job(job_id)
    if not job:
        return jsonify({"error": "Job niet gevonden"}), 404
    try:
        db.update_download_job(job_id, "pending", error_log=None)
        result = orch.download(
            artist=job.get("artist") or "",
            album=job.get("album") or "",
            track=job.get("track") or "",
            item_type=job.get("type") or "album",
            quality=job.get("quality") or "flac",
            source=job.get("source_requested") or "auto",
        )
        return jsonify({"ok": True, "result": result}), 200, {"Cache-Control": "no-store"}
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── POST /api/core/download/retry-all ────────────────────────────────────────

@downloads_bp.post("/api/core/download/retry-all")
def download_retry_all():
    try:
        result = orch.retry_failed()
        return jsonify({"ok": True, **result}), 200, {"Cache-Control": "no-store"}
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── GET /api/core/download/settings ──────────────────────────────────────────

@downloads_bp.get("/api/core/download/settings")
def download_settings_get():
    try:
        priority = db.get_setting("download", "source_priority")
        hybrid   = db.get_setting("download", "hybrid_mode")
        enabled  = {}
        for src in DEFAULT_SOURCE_PRIORITY:
            val = db.get_setting("download", f"source_enabled_{src}")
            enabled[src] = True if val is None else bool(val)
        return jsonify({
            "source_priority": priority or DEFAULT_SOURCE_PRIORITY,
            "hybrid_mode":     True if hybrid is None else bool(hybrid),
            "source_enabled":  enabled,
        }), 200, {"Cache-Control": "private, max-age=60"}
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── POST /api/core/download/settings ─────────────────────────────────────────

@downloads_bp.post("/api/core/download/settings")
def download_settings_post():
    body = request.get_json(silent=True) or {}
    try:
        if isinstance(body.get("source_priority"), list):
            db.set_setting("download", "source_priority", body["source_priority"])
        if "hybrid_mode" in body:
            db.set_setting("download", "hybrid_mode", bool(body["hybrid_mode"]))
        if isinstance(body.get("source_enabled"), dict):
            for src, val in body["source_enabled"].items():
                db.set_setting("download", f"source_enabled_{src}", bool(val))
        return jsonify({"ok": True}), 200, {"Cache-Control": "no-store"}
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
