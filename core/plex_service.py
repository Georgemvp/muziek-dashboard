"""
plex_service.py — HTTP-gebaseerde Plex service voor de Core backend.

Port van services/plex.js: onderhoudt in-memory bibliotheekstaat,
biedt bibliotheeksync, afspeelbesturing, playlist- en zoekfuncties.
Gebruikt requests (geen plexapi) zodat het volledig onafhankelijk is
van plex_client.py dat voor discovery wordt gebruikt.
"""
from __future__ import annotations

import logging
import re
import threading
import time
import unicodedata
from datetime import datetime
from typing import Any

import requests

import core.database as db
from core import config

log = logging.getLogger(__name__)

PLEX_URL   = (config.PLEX_URL  or "").rstrip("/")
PLEX_TOKEN = config.PLEX_TOKEN or ""

# ── In-memory bibliotheekstaat ─────────────────────────────────────────────────
_lock             = threading.Lock()
_artists: set[str]              = set()
_artist_map: dict[str, str]     = {}          # lowercase → origineel
_artist_genres: dict[str, list] = {}          # lowercase → [genre-strings]
_albums: set[str]               = set()       # "artist||album" exact lowercase
_albums_norm: set[str]          = set()       # genormaliseerd
_albums_by_artist: dict[str, set[str]] = {}   # norm_artist → set norm_album
_library: list[dict]            = []          # [{artist, album, ratingKey, thumb, addedAt}]
_track_count: int               = 0
_last_sync: float               = 0.0
_sync_ok: bool                  = False

_music_section_key: str | None  = None

# Client-cache
_clients_cache: list[dict]      = []
_clients_cache_time: float      = 0.0
_command_id: int                = 0


# ── Normalisatie ───────────────────────────────────────────────────────────────

def _normalize(s: str) -> str:
    if not s:
        return ""
    s = s.lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^\w\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def _fuzzy_score(query: str, target: str) -> float:
    q = _normalize(query)
    t = _normalize(target)
    if not q or not t:
        return 0.0
    if q == t:
        return 1.0
    if t.startswith(q) or q.startswith(t):
        return 0.9
    if q in t or t in q:
        return 0.85
    max_len = max(len(q), len(t))
    if max_len == 0:
        return 1.0
    dist = _levenshtein(q, t)
    ratio = 1 - dist / max_len
    return max(0.0, ratio * 0.85)


def _levenshtein(a: str, b: str) -> int:
    if len(a) < len(b):
        a, b = b, a
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1,
                           prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


# ── HTTP helpers ───────────────────────────────────────────────────────────────

def _headers() -> dict:
    return {"X-Plex-Token": PLEX_TOKEN, "Accept": "application/json"}


def plex_get(path: str, timeout: int = 8) -> dict:
    r = requests.get(f"{PLEX_URL}{path}", headers=_headers(), timeout=timeout)
    r.raise_for_status()
    return r.json()


def plex_post(path: str, timeout: int = 8) -> dict:
    r = requests.post(f"{PLEX_URL}{path}", headers=_headers(), timeout=timeout)
    r.raise_for_status()
    if r.headers.get("content-length") == "0" or not r.content:
        return {}
    try:
        return r.json()
    except Exception:
        return {}


def plex_put(path: str, timeout: int = 8) -> bool:
    r = requests.put(f"{PLEX_URL}{path}", headers=_headers(), timeout=timeout)
    r.raise_for_status()
    return True


# ── Bibliotheeksync ────────────────────────────────────────────────────────────

def _restore_from_cache() -> None:
    global _track_count, _last_sync, _sync_ok
    cached = db.get_cache("plex", 3_600_000)
    if not cached:
        return
    with _lock:
        _artists.update(cached.get("artists") or [])
        _artist_map.update(cached.get("artistMap") or {})
        _artist_genres.update(cached.get("artistGenres") or {})
        _albums.update(cached.get("albums") or [])
        _albums_norm.update(cached.get("albumsNorm") or [])
        raw_by_artist = cached.get("albumsByArtist") or {}
        for k, v in raw_by_artist.items():
            _albums_by_artist[k] = set(v)
        _library.extend(cached.get("library") or [])
        _track_count = cached.get("trackCount") or 0
        _last_sync   = cached.get("lastSync")  or 0.0
        _sync_ok     = cached.get("syncOk")    or False
    log.info("Plex: geladen uit SQLite-cache — %d artiesten, %d albums", len(_artists), len(_albums))


_restore_from_cache()


def sync_library(force: bool = False) -> None:
    global _track_count, _last_sync, _sync_ok
    if not PLEX_TOKEN:
        return
    if not force and (time.time() * 1000 - _last_sync) < 3_600_000:
        return
    try:
        sections   = plex_get("/library/sections")
        music      = next((s for s in (sections.get("MediaContainer", {}).get("Directory") or [])
                           if s.get("type") == "artist"), None)
        if not music:
            log.warning("Plex: geen muziekbibliotheek gevonden")
            return

        key = music["key"]
        artist_data, album_data, track_count_data = (
            plex_get(f"/library/sections/{key}/all?type=8"),
            plex_get(f"/library/sections/{key}/all?type=9"),
            plex_get(f"/library/sections/{key}/all?type=10&X-Plex-Container-Start=0&X-Plex-Container-Size=0"),
        )

        artist_meta = artist_data.get("MediaContainer", {}).get("Metadata") or []
        album_meta  = album_data.get("MediaContainer",  {}).get("Metadata") or []

        new_artists: set[str]          = set()
        new_artist_map: dict[str, str] = {}
        new_artist_genres: dict[str, list] = {}
        for a in artist_meta:
            lk = (a.get("title") or "").lower()
            new_artists.add(lk)
            new_artist_map[lk] = a.get("title") or ""
            genres = [g.get("tag") or g for g in (a.get("Genre") or []) if g]
            if genres:
                new_artist_genres[lk] = genres

        new_albums: set[str]              = set()
        new_albums_norm: set[str]         = set()
        new_albums_by_artist: dict[str, set[str]] = {}
        new_library: list[dict]           = []

        for a in album_meta:
            parent = a.get("parentTitle") or ""
            title  = a.get("title")       or ""

            new_albums.add(f"{parent.lower()}||{title.lower()}")

            na = _normalize(parent)
            nb = _normalize(title)
            norm_key = f"{na}||{nb}"
            new_albums_norm.add(norm_key)

            if na not in new_albums_by_artist:
                new_albums_by_artist[na] = set()
            new_albums_by_artist[na].add(nb)

            new_library.append({
                "artist":    parent,
                "album":     title,
                "ratingKey": a.get("ratingKey"),
                "thumb":     a.get("thumb"),
                "addedAt":   a.get("addedAt") or 0,
            })

        new_library.sort(key=lambda x: x["artist"].lower())
        new_track_count = (track_count_data.get("MediaContainer") or {}).get("totalSize") or 0
        now_ms = int(time.time() * 1000)

        with _lock:
            _artists.clear();         _artists.update(new_artists)
            _artist_map.clear();      _artist_map.update(new_artist_map)
            _artist_genres.clear();   _artist_genres.update(new_artist_genres)
            _albums.clear();          _albums.update(new_albums)
            _albums_norm.clear();     _albums_norm.update(new_albums_norm)
            _albums_by_artist.clear();_albums_by_artist.update(new_albums_by_artist)
            _library.clear();         _library.extend(new_library)
            _track_count = new_track_count
            _last_sync   = now_ms
            _sync_ok     = True

        db.set_cache("plex", {
            "artists":      list(_artists),
            "artistMap":    dict(_artist_map),
            "artistGenres": dict(_artist_genres),
            "albums":       list(_albums),
            "albumsNorm":   list(_albums_norm),
            "albumsByArtist": {k: list(v) for k, v in _albums_by_artist.items()},
            "library":      _library,
            "trackCount":   _track_count,
            "lastSync":     _last_sync,
            "syncOk":       _sync_ok,
        })

        log.info("Plex: gesynchroniseerd — %d artiesten, %d albums, %d tracks",
                 len(_artists), len(_albums), _track_count)

    except Exception as exc:
        with _lock:
            _sync_ok = False
        log.warning("Plex sync mislukt: %s", exc)


# ── Lookups ────────────────────────────────────────────────────────────────────

def artist_in_plex(name: str) -> bool:
    return (name or "").lower() in _artists


def album_in_plex(artist: str, album: str) -> bool:
    al = (artist or "").lower()
    bl = (album  or "").lower()
    if f"{al}||{bl}" in _albums:
        return True
    na = _normalize(artist)
    nb = _normalize(album)
    for pa, pbs in _albums_by_artist.items():
        if not (na == pa or (na and pa in na) or (pa and na in pa)):
            continue
        for pb in pbs:
            if nb == pb or (nb and pb in nb) or (pb and nb in pb):
                return True
    return False


def get_status() -> dict:
    return {
        "ok":          _sync_ok,
        "artistCount": len(_artists),
        "albumCount":  len(_albums),
        "trackCount":  _track_count,
        "lastSync":    _last_sync,
    }


def get_library() -> list[dict]:
    with _lock:
        return list(_library)


def get_album_rating_key(artist: str, album: str) -> str | None:
    na = _normalize(artist)
    nb = _normalize(album)
    for entry in _library:
        ea = _normalize(entry["artist"])
        eb = _normalize(entry["album"])
        if (na == ea or (na and ea in na) or (ea and na in ea)) and \
           (nb == eb or (nb and eb in nb) or (eb and nb in eb)):
            return entry.get("ratingKey")
    return None


# ── Library scan ───────────────────────────────────────────────────────────────

def trigger_scan() -> None:
    global _music_section_key
    if not PLEX_TOKEN:
        return
    if not _music_section_key:
        sections = plex_get("/library/sections")
        music = next((s for s in (sections.get("MediaContainer", {}).get("Directory") or [])
                      if s.get("type") == "artist"), None)
        if music:
            _music_section_key = music["key"]
    if _music_section_key:
        requests.post(
            f"{PLEX_URL}/library/sections/{_music_section_key}/refresh",
            headers={"X-Plex-Token": PLEX_TOKEN},
            timeout=5,
        )
        log.info("Plex: library scan getriggerd (sectie %s)", _music_section_key)


# ── Clients & afspeelbesturing ─────────────────────────────────────────────────

def get_clients(force: bool = False) -> list[dict]:
    global _clients_cache, _clients_cache_time
    if not force and _clients_cache and (time.time() - _clients_cache_time) < 30:
        return _clients_cache

    seen: dict[str, dict] = {}

    try:
        sessions = plex_get("/status/sessions")
        for m in (sessions.get("MediaContainer", {}).get("Metadata") or []):
            p = m.get("Player")
            if not p or not p.get("machineIdentifier"):
                continue
            mid = p["machineIdentifier"]
            seen[mid] = {
                "name":      p.get("title") or p.get("product") or "Onbekend",
                "machineId": mid,
                "product":   p.get("product") or "",
                "state":     p.get("state")   or "playing",
                "host":      p.get("address") or None,
                "port":      int(p.get("port") or 32500),
            }
    except Exception as e:
        log.warning("Plex: sessies ophalen mislukt: %s", e)

    try:
        data = plex_get("/clients")
        for c in (data.get("MediaContainer", {}).get("Server") or []):
            mid = c.get("machineIdentifier")
            if not mid or mid in seen:
                continue
            seen[mid] = {
                "name":      c.get("name") or c.get("title") or "Onbekend",
                "machineId": mid,
                "product":   c.get("product") or "",
                "state":     "idle",
                "host":      c.get("host") or None,
                "port":      int(c.get("port") or 32500),
            }
    except Exception as e:
        log.warning("Plex: /clients ophalen mislukt: %s", e)

    clients = list(seen.values())
    _clients_cache      = clients
    _clients_cache_time = time.time()
    return clients


def _player_cmd(machine_id: str, command: str, extra: dict | None = None) -> bool:
    global _command_id
    if machine_id == "__web__":
        raise ValueError("Plex web player kan niet op afstand bestuurd worden.")

    _command_id += 1
    params = {"commandID": str(_command_id), **(extra or {})}
    qs = "&".join(f"{k}={v}" for k, v in params.items())

    try:
        r = requests.get(
            f"{PLEX_URL}/player/playback/{command}?{qs}",
            headers={
                **_headers(),
                "X-Plex-Target-Client-Identifier": machine_id,
                "X-Plex-Client-Identifier":        "lastfm-app-server",
                "X-Plex-Device-Name":              "LastFM App",
                "X-Plex-Product":                  "LastFM App",
            },
            timeout=5,
        )
        if r.ok or r.status_code == 204:
            return True
    except Exception as e:
        log.warning("Plex relay mislukt: %s", e)

    # Fallback: direct naar client-IP
    clients = _clients_cache or get_clients(True)
    client  = next((c for c in clients if c["machineId"] == machine_id), None)
    if not client or not client.get("host"):
        raise RuntimeError(f"Plex: geen route naar client '{machine_id}'.")

    for port in {32500, client["port"]}:
        try:
            direct_qs = f"X-Plex-Token={PLEX_TOKEN}&" + qs
            r = requests.get(
                f"http://{client['host']}:{port}/player/playback/{command}?{direct_qs}",
                headers={"X-Plex-Token": PLEX_TOKEN, "X-Plex-Client-Identifier": "lastfm-app-server"},
                timeout=5,
            )
            if r.ok or r.status_code == 204:
                return True
        except Exception:
            pass

    raise RuntimeError(f"Plex direct commando mislukt voor '{machine_id}'.")


def play_on_client(machine_id: str, rating_key: str, media_type: str = "music") -> bool:
    identity = plex_get("/identity")
    server_mid = (identity.get("MediaContainer") or {}).get("machineIdentifier") or ""
    from urllib.parse import urlparse
    p = urlparse(PLEX_URL)
    return _player_cmd(machine_id, "playMedia", {
        "key":               f"/library/metadata/{rating_key}",
        "offset":            "0",
        "machineIdentifier": server_mid,
        "address":           p.hostname or "",
        "port":              str(p.port or ("443" if p.scheme == "https" else "80")),
        "protocol":          p.scheme or "http",
        "type":              media_type,
    })


def pause_client(machine_id: str)  -> bool: return _player_cmd(machine_id, "pause")
def stop_client(machine_id: str)   -> bool: return _player_cmd(machine_id, "stop")
def skip_next(machine_id: str)     -> bool: return _player_cmd(machine_id, "skipNext")
def skip_prev(machine_id: str)     -> bool: return _player_cmd(machine_id, "skipPrevious")


def rate_item(rating_key: str, rating: int) -> bool:
    plex_put(f"/:/rate?key={rating_key}&identifier=com.plexapp.plugins.library&rating={rating}")
    return True


# ── Playlists ──────────────────────────────────────────────────────────────────

def get_playlists() -> list[dict]:
    data = plex_get("/playlists?playlistType=audio")
    return [
        {
            "ratingKey":  p.get("ratingKey"),
            "title":      p.get("title"),
            "duration":   p.get("duration"),
            "trackCount": p.get("leafCount"),
            "thumb":      (f"{PLEX_URL}{p['composite']}?X-Plex-Token={PLEX_TOKEN}"
                           if p.get("composite") else None),
            "smart":      bool(p.get("smart")),
        }
        for p in ((data.get("MediaContainer") or {}).get("Metadata") or [])
    ]


def get_playlist_tracks(rating_key: str) -> list[dict]:
    data = plex_get(f"/playlists/{rating_key}/items")
    return [
        {
            "ratingKey": t.get("ratingKey"),
            "title":     t.get("title"),
            "artist":    t.get("grandparentTitle") or t.get("originalTitle") or "",
            "album":     t.get("parentTitle") or "",
            "duration":  t.get("duration"),
            "thumb":     (f"{PLEX_URL}{t['parentThumb']}?X-Plex-Token={PLEX_TOKEN}"
                          if t.get("parentThumb") else None),
        }
        for t in ((data.get("MediaContainer") or {}).get("Metadata") or [])
    ]


def get_album_tracks(album_rating_key: str) -> list[dict]:
    data = plex_get(f"/library/metadata/{album_rating_key}/children")
    return [
        {
            "ratingKey":   t.get("ratingKey"),
            "title":       t.get("title"),
            "trackNumber": t.get("index"),
            "duration":    t.get("duration"),
            "artist":      t.get("grandparentTitle") or t.get("originalTitle") or "",
        }
        for t in ((data.get("MediaContainer") or {}).get("Metadata") or [])
    ]


# ── Zoeken ─────────────────────────────────────────────────────────────────────

def _get_music_section_key() -> str | None:
    try:
        sections = plex_get("/library/sections")
        music = next((s for s in (sections.get("MediaContainer", {}).get("Directory") or [])
                      if s.get("type") == "artist"), None)
        return music["key"] if music else None
    except Exception:
        return None


def search_library(q: str, limit: int = 5) -> dict:
    if not q or len(q) < 2:
        return {"artists": [], "albums": [], "tracks": [], "playlists": []}

    query = q.lower().strip()
    results: dict[str, list] = {"artists": [], "albums": [], "tracks": [], "playlists": []}

    # ── Artiesten (uit in-memory cache) ──
    scored = sorted(
        [{"name": orig, "score": _fuzzy_score(query, orig)}
         for orig in _artist_map.values() if _fuzzy_score(query, orig) > 0],
        key=lambda x: -x["score"],
    )[:limit]
    sec_key = _get_music_section_key()
    if sec_key:
        for item in scored:
            try:
                data = plex_get(f"/library/sections/{sec_key}/all?type=8&title={requests.utils.quote(item['name'])}")
                meta = ((data.get("MediaContainer") or {}).get("Metadata") or [None])[0]
                if meta:
                    results["artists"].append({
                        "ratingKey": meta.get("ratingKey"),
                        "title":     item["name"],
                        "thumb":     (f"{PLEX_URL}{meta['thumb']}?X-Plex-Token={PLEX_TOKEN}"
                                      if meta.get("thumb") else None),
                    })
            except Exception:
                pass

    # ── Albums (uit in-memory bibliotheek) ──
    album_scored = sorted(
        [{**a, "score": max(_fuzzy_score(query, a["album"]), _fuzzy_score(query, a["artist"]))}
         for a in _library if max(_fuzzy_score(query, a["album"]), _fuzzy_score(query, a["artist"])) > 0],
        key=lambda x: -x["score"],
    )[:limit]
    results["albums"] = [
        {
            "ratingKey": a.get("ratingKey"),
            "title":     a["album"],
            "artist":    a["artist"],
            "thumb":     (f"{PLEX_URL}{a['thumb']}?X-Plex-Token={PLEX_TOKEN}"
                          if (a.get("thumb") and not a["thumb"].startswith("http"))
                          else a.get("thumb")),
        }
        for a in album_scored
    ]

    # ── Tracks (via Plex API) ──
    if sec_key:
        try:
            data = plex_get(f"/library/sections/{sec_key}/search?type=10&query={requests.utils.quote(q)}&limit={limit * 2}")
            results["tracks"] = [
                {
                    "ratingKey": t.get("ratingKey"),
                    "title":     t.get("title"),
                    "artist":    t.get("grandparentTitle") or t.get("originalTitle") or "",
                    "album":     t.get("parentTitle") or "",
                    "duration":  t.get("duration"),
                    "thumb":     (f"{PLEX_URL}{t['parentThumb']}?X-Plex-Token={PLEX_TOKEN}"
                                  if t.get("parentThumb") else None),
                }
                for t in (((data.get("MediaContainer") or {}).get("Metadata") or [])[:limit])
            ]
        except Exception:
            pass

    # ── Playlists ──
    try:
        playlists = get_playlists()
        pl_scored = sorted(
            [{**p, "score": _fuzzy_score(query, p["title"])} for p in playlists if _fuzzy_score(query, p["title"]) > 0],
            key=lambda x: -x["score"],
        )[:limit]
        results["playlists"] = [
            {"ratingKey": p["ratingKey"], "title": p["title"], "trackCount": p.get("trackCount") or 0, "thumb": p.get("thumb")}
            for p in pl_scored
        ]
    except Exception:
        pass

    return results


# ── Afspeelgeschiedenis & statistieken ─────────────────────────────────────────

def _period_to_timestamp(period: str) -> int:
    now = time.time()
    if period == "today":
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        return int(today.timestamp())
    days_map = {"7day": 7, "1month": 30, "3month": 90, "12month": 365, "overall": 3650}
    days = days_map.get(period, 365)
    return int(now - days * 86400)


def get_play_history(period: str = "7day") -> list[dict]:
    cache_key = f"play_history_{period}"
    cached = db.get_cache(cache_key, 600_000)
    if cached is not None:
        return cached

    try:
        since_ts = _period_to_timestamp(period)
        history  = []
        start    = 0
        page_size = 500
        has_more  = True
        use_sort  = True

        while has_more:
            qs = f"X-Plex-Container-Start={start}&X-Plex-Container-Size={page_size}"
            if use_sort:
                qs += "&sort=viewedAt:desc"
            data = plex_get(f"/status/sessions/history/all?{qs}")
            metadata = (data.get("MediaContainer") or {}).get("Metadata") or []

            if not metadata:
                if use_sort and start == 0:
                    use_sort = False
                    continue
                has_more = False
                break

            for m in metadata:
                if m.get("type") != "track":
                    continue
                viewed_at = m.get("viewedAt") or 0
                if viewed_at and viewed_at < since_ts:
                    has_more = False
                    break
                thumb_path = m.get("parentThumb") or m.get("thumb")
                thumb = f"{PLEX_URL}{thumb_path}?X-Plex-Token={PLEX_TOKEN}" if thumb_path else None
                history.append({
                    "title":     m.get("title") or "",
                    "artist":    m.get("grandparentTitle") or m.get("originalTitle") or "",
                    "album":     m.get("parentTitle") or "",
                    "viewedAt":  viewed_at,
                    "duration":  m.get("duration") or 0,
                    "thumb":     thumb,
                    "ratingKey": m.get("ratingKey"),
                })

            if len(metadata) < page_size:
                has_more = False
            else:
                start += page_size

        db.set_cache(cache_key, history)
        return history

    except Exception as exc:
        log.warning("Play history ophalen mislukt: %s", exc)
        return []


def aggregate_top_artists(history: list[dict], limit: int = 20) -> list[dict]:
    counts: dict[str, int] = {}
    for item in history:
        if item.get("artist"):
            counts[item["artist"]] = counts.get(item["artist"], 0) + 1
    return sorted(
        [{"name": n, "playcount": c} for n, c in counts.items()],
        key=lambda x: -x["playcount"],
    )[:limit]


def aggregate_top_tracks(history: list[dict], limit: int = 20) -> list[dict]:
    tracks: dict[str, dict] = {}
    for item in history:
        if not item.get("title") or not item.get("artist"):
            continue
        key = f"{item['artist']}||{item['title']}"
        if key not in tracks:
            tracks[key] = {"title": item["title"], "artist": item["artist"],
                           "album": item.get("album") or "", "playcount": 0,
                           "thumb": item.get("thumb")}
        tracks[key]["playcount"] += 1
    return sorted(tracks.values(), key=lambda x: -x["playcount"])[:limit]


def aggregate_daily_plays(history: list[dict], days: int = 28) -> list[dict]:
    daily: dict[str, dict] = {}
    now = datetime.now()
    for i in range(days):
        d = datetime(now.year, now.month, now.day) if i == 0 else None
        if d is None:
            from datetime import timedelta
            d = datetime(now.year, now.month, now.day) - timedelta(days=i) + timedelta(days=0)
        from datetime import timedelta
        date = (datetime(now.year, now.month, now.day) - timedelta(days=i)).strftime("%Y-%m-%d")
        daily[date] = {"date": date, "count": 0, "minutes": 0}
    for item in history:
        if not item.get("viewedAt"):
            continue
        date = datetime.fromtimestamp(item["viewedAt"]).strftime("%Y-%m-%d")
        if date in daily:
            daily[date]["count"] += 1
            daily[date]["minutes"] += (
                (item["duration"] // 60000) if item.get("duration") and item["duration"] > 0 else 4
            )
    return sorted(daily.values(), key=lambda x: x["date"], reverse=True)


def enrich_artists_with_thumbs(top_artists: list[dict]) -> list[dict]:
    if not top_artists:
        return top_artists
    cache_key = "plex:artist_thumbs_cache"
    cached = db.get_cache(cache_key, 3_600_000) or {}
    thumb_cache: dict[str, Any] = dict(cached)
    sec_key = _get_music_section_key()
    result = []
    for artist in top_artists:
        name = artist["name"]
        if name in thumb_cache:
            result.append({**artist, "thumb": thumb_cache[name]})
            continue
        thumb = None
        if sec_key:
            try:
                data = plex_get(f"/library/sections/{sec_key}/all?type=8&title={requests.utils.quote(name)}")
                meta = ((data.get("MediaContainer") or {}).get("Metadata") or [None])[0]
                if meta and meta.get("thumb"):
                    thumb = f"{PLEX_URL}{meta['thumb']}?X-Plex-Token={PLEX_TOKEN}"
            except Exception:
                pass
        thumb_cache[name] = thumb
        result.append({**artist, "thumb": thumb})
    db.set_cache(cache_key, thumb_cache)
    return result


def get_genres_from_plex(top_artists: list[dict]) -> list[dict]:
    genre_counts: dict[str, int] = {}
    for artist in top_artists:
        genres = _artist_genres.get(artist["name"].lower()) or []
        for g in genres:
            genre_counts[g] = genre_counts.get(g, 0) + (artist.get("playcount") or 1)
    return sorted(
        [{"name": n, "count": c} for n, c in genre_counts.items()],
        key=lambda x: -x["count"],
    )[:8]
