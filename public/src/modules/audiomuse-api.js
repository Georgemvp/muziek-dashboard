// ── AudioMuse API module ────────────────────────────────────────────────────
// Centrale wrapper voor alle AudioMuse API-aanroepen.
// AudioMuse draait op localhost:8000, bereikbaar via /audiomuse/ proxy.

const BASE = '/audiomuse';

// ── Status polling ─────────────────────────────────────────────────────────

let _statusCache = null;
let _statusCacheTs = 0;
const STATUS_TTL_MS = 8000; // 8s cache

/**
 * Haal AudioMuse analyse-status op met korte cache.
 * @returns {Promise<{status: string, analyzed: number, total: number, percent: number}|null>}
 *   null = AudioMuse offline
 */
export async function getAnalysisStatus() {
  const now = Date.now();
  if (_statusCache && now - _statusCacheTs < STATUS_TTL_MS) {
    return _statusCache;
  }
  try {
    const res = await fetch(`${BASE}/analysis_status`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) { _statusCache = null; _statusCacheTs = now; return null; }
    _statusCache = await res.json();
    _statusCacheTs = now;
    return _statusCache;
  } catch {
    _statusCache = null;
    _statusCacheTs = now;
    return null;
  }
}

// ── Track zoeken ────────────────────────────────────────────────────────────

/**
 * Zoek een nummer op in AudioMuse en geef het eerste resultaat terug.
 * @param {string} artist
 * @param {string} title
 * @returns {Promise<{item_id: string|number, title: string, artist: string}|null>}
 */
export async function searchTrack(artist, title) {
  try {
    const q = encodeURIComponent(`${artist} ${title}`);
    const res = await fetch(`${BASE}/search?search_query=${q}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results = Array.isArray(data) ? data : (data.results || []);
    return results.length > 0 ? results[0] : null;
  } catch {
    return null;
  }
}

// ── Vergelijkbare nummers ───────────────────────────────────────────────────

/**
 * Haal vergelijkbare nummers op voor een known item_id.
 * @param {string|number} itemId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getSimilarTracks(itemId, limit = 20) {
  try {
    const res = await fetch(`${BASE}/similar?item_id=${itemId}&limit=${limit}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || data.tracks || []);
  } catch {
    return [];
  }
}

/**
 * Zoek een nummer op en haal daarna vergelijkbare nummers op.
 * Combineert searchTrack + getSimilarTracks in één stap.
 * @param {string} artist
 * @param {string} title
 * @param {number} limit
 * @returns {Promise<{source: {item_id, title, artist}, similar: Array}|null>}
 */
export async function findSimilarForTrack(artist, title, limit = 20) {
  const found = await searchTrack(artist, title);
  if (!found || found.item_id == null) return null;
  const similar = await getSimilarTracks(found.item_id, limit);
  return { source: found, similar };
}

// ── CLAP sonic search ───────────────────────────────────────────────────────

/**
 * Tekst-gebaseerde audio-semantische zoekopdracht via CLAP.
 * Voorbeeldquery: "calm piano music", "high energy electronic"
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function clapSearch(query, limit = 20) {
  try {
    const q = encodeURIComponent(query);
    const res = await fetch(`${BASE}/clap_search?query=${q}&limit=${limit}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || data.tracks || []);
  } catch {
    return [];
  }
}

// ── Smart Playlists (clusters) ──────────────────────────────────────────────

/**
 * Haal AudioMuse smart playlists (clustering-resultaten) op.
 * @returns {Promise<Array<{id, name, track_count, moods, tracks}>>}
 */
export async function getSmartPlaylists() {
  try {
    const res = await fetch(`${BASE}/playlists`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.playlists || []);
  } catch {
    return [];
  }
}

/**
 * Haal de tracks op voor een specifieke AudioMuse playlist.
 * @param {string|number} playlistId
 * @returns {Promise<Array>}
 */
export async function getSmartPlaylistTracks(playlistId) {
  try {
    const res = await fetch(`${BASE}/playlist/${playlistId}/tracks`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.tracks || []);
  } catch {
    return [];
  }
}

// ── UI-helpers ─────────────────────────────────────────────────────────────

/**
 * Genereer een "Vergelijkbare nummers" knop voor gebruik in track-renders.
 * Gebruik data-am-artist + data-am-title als triggers voor event delegation.
 * @param {string} artist
 * @param {string} title
 * @returns {string} HTML string
 */
export function similarBtn(artist, title) {
  const a = (artist || '').replace(/"/g, '&quot;');
  const t = (title  || '').replace(/"/g, '&quot;');
  return `<button
    class="am-similar-btn"
    data-am-artist="${a}"
    data-am-title="${t}"
    title="Vind vergelijkbare nummers via AudioMuse"
    aria-label="Vind vergelijkbare nummers voor ${a} - ${t}">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round"
         stroke-linejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  </button>`;
}

/**
 * Render een lijst van AudioMuse track-resultaten als compacte items.
 * Elke rij heeft een play-knop (Plex ratingKey via data-play-ratingkey indien bekend).
 * @param {Array} tracks - AudioMuse track-objecten
 * @returns {string} HTML string
 */
export function renderTrackList(tracks) {
  if (!tracks || tracks.length === 0) {
    return `<div class="am-empty">Geen nummers gevonden</div>`;
  }
  return tracks.map(t => {
    const artist = t.artist || t.album_artist || '';
    const title  = t.title  || t.name || '';
    const album  = t.album  || '';
    const score  = t.score  != null ? `<span class="am-score">${(t.score * 100).toFixed(0)}%</span>` : '';
    const ratingKey = t.plex_rating_key || t.rating_key || '';
    const playBtn = ratingKey
      ? `<button class="am-play-btn" data-play-ratingkey="${ratingKey}"
           title="Afspelen via Plex" aria-label="Speel af: ${title}">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
             <polygon points="5 3 19 12 5 21 5 3"/>
           </svg>
         </button>`
      : `<button class="am-play-btn am-play-search" data-am-artist="${(artist||'').replace(/"/g,'&quot;')}" data-am-title="${(title||'').replace(/"/g,'&quot;')}"
           title="Zoek en speel af via Plex" aria-label="Zoek en speel af: ${title}">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
             <polygon points="5 3 19 12 5 21 5 3"/>
           </svg>
         </button>`;
    return `
      <div class="am-track-item">
        ${playBtn}
        <div class="am-track-info">
          <span class="am-track-title">${title}</span>
          <span class="am-track-artist">${artist}${album ? ` · ${album}` : ''}</span>
        </div>
        ${score}
        ${similarBtn(artist, title)}
      </div>`;
  }).join('');
}
