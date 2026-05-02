'use strict';
// ── Spotify enrichment worker ─────────────────────────────────────────────────
// API: https://api.spotify.com/v1  — Client Credentials flow (geen user-auth)
// Rate limit: 1 req/sec conservatief; respecteer Retry-After headers
// Vereist: SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET in process.env

const RATE_INTERVAL = 1100; // ms tussen calls (iets boven 1/sec)
const FUZZY_THRESHOLD = 0.80;
const DAILY_CAP = 3000;     // max Spotify-calls per dag

// ── Token-beheer (gedeeld met bestaande spotify.js service) ──────────────────
let _token    = null;
let _tokenExp = 0;
let _dailyCount = 0;
let _dailyDate  = '';

async function _getToken() {
  if (_token && Date.now() < _tokenExp - 5 * 60_000) return _token;

  const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error('Spotify credentials niet geconfigureerd');

  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res   = await fetch('https://accounts.spotify.com/api/token', {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body:   'grant_type=client_credentials',
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`Spotify token fout ${res.status}`);
  const data  = await res.json();
  _token      = data.access_token;
  _tokenExp   = Date.now() + data.expires_in * 1000;
  return _token;
}

// ── Fuzzy string matching (Dice-coëfficiënt, vergelijkbaar met SequenceMatcher) ──
function _fuzzyScore(a, b) {
  a = (a || '').toLowerCase().trim();
  b = (b || '').toLowerCase().trim();
  if (a === b) return 1.0;
  if (a.length < 2 || b.length < 2) return 0.0;

  const bigrams = (s) => {
    const m = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      m.set(bg, (m.get(bg) || 0) + 1);
    }
    return m;
  };

  const aMap = bigrams(a);
  const bMap = bigrams(b);
  let intersection = 0;

  for (const [bg, cnt] of aMap) {
    const bCnt = bMap.get(bg) || 0;
    intersection += Math.min(cnt, bCnt);
  }

  const total = a.length + b.length - 2;
  return total > 0 ? (2 * intersection) / total : 0;
}

class SpotifyWorker {
  constructor(db, log) {
    this.db        = db;
    this.log       = log.child ? log.child({ worker: 'spotify' }) : log;
    this._lastCall = 0;
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────

  async _rateLimit(retryAfter = 0) {
    const wait = Math.max(retryAfter * 1000, RATE_INTERVAL - (Date.now() - this._lastCall));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    this._lastCall = Date.now();
  }

  _checkDailyBudget() {
    const today = new Date().toISOString().slice(0, 10);
    if (_dailyDate !== today) { _dailyDate = today; _dailyCount = 0; }
    if (_dailyCount >= DAILY_CAP) throw new Error(`Spotify daily budget van ${DAILY_CAP} bereikt`);
    _dailyCount++;
  }

  async _get(path, params = {}) {
    this._checkDailyBudget();
    await this._rateLimit();

    const token = await _getToken();
    const url   = new URL(`https://api.spotify.com${path}`);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal:  AbortSignal.timeout(12_000),
    });

    // Respecteer Retry-After bij 429
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '5', 10);
      this.log.warn({ retryAfter }, 'Spotify rate limit — wacht');
      await this._rateLimit(retryAfter);
      return this._get(path, params); // één retry
    }

    if (!res.ok) throw new Error(`Spotify HTTP ${res.status} bij ${path}`);
    return res.json();
  }

  // ── Hoofdverwerker ────────────────────────────────────────────────────────

  async process(entity) {
    try {
      const type = entity.entity_type;
      let data;

      if (type === 'artist') {
        data = await this._processArtist(entity.entity_name);
      } else if (type === 'album') {
        data = await this._processAlbum(entity.entity_name);
      } else if (type === 'track') {
        data = await this._processTrack(entity.entity_name);
      } else {
        return { ok: false, error: `Onbekend entity_type: ${type}` };
      }

      if (!data) return { ok: false, error: 'Geen resultaat gevonden' };
      return { ok: true, data };
    } catch (err) {
      this.log.warn({ err: err.message, entity: entity.entity_name }, 'Spotify worker mislukt');
      return { ok: false, error: err.message };
    }
  }

  // ── Artiest ───────────────────────────────────────────────────────────────

  async _processArtist(name) {
    const results = await this._get('/v1/search', { q: name, type: 'artist', limit: 5 });
    const items   = results.artists?.items || [];
    if (!items.length) return null;

    const best = this._fuzzyBest(items, name, a => a.name);
    if (!best) return null;

    return {
      spotify_id:   best.id,
      genres:       best.genres || [],
      popularity:   best.popularity ?? null,
      artwork_url:  best.images?.[0]?.url || null,
      spotify_url:  best.external_urls?.spotify || null,
      followers:    best.followers?.total ?? null,
      source:       'spotify',
      fetchedAt:    Date.now(),
    };
  }

  // ── Album ─────────────────────────────────────────────────────────────────

  async _processAlbum(name) {
    const results = await this._get('/v1/search', { q: name, type: 'album', limit: 5 });
    const items   = results.albums?.items || [];
    if (!items.length) return null;

    const best = this._fuzzyBest(items, name, a => a.name);
    if (!best) return null;

    return {
      spotify_id:   best.id,
      artwork_url:  best.images?.[0]?.url || null,
      genres:       best.genres || [],
      release_date: best.release_date || null,
      total_tracks: best.total_tracks ?? null,
      spotify_url:  best.external_urls?.spotify || null,
      source:       'spotify',
      fetchedAt:    Date.now(),
    };
  }

  // ── Track ─────────────────────────────────────────────────────────────────

  async _processTrack(name) {
    const results = await this._get('/v1/search', { q: name, type: 'track', limit: 5 });
    const items   = results.tracks?.items || [];
    if (!items.length) return null;

    const best = this._fuzzyBest(items, name, t => t.name);
    if (!best) return null;

    return {
      spotify_id:   best.id,
      preview_url:  best.preview_url || null,
      popularity:   best.popularity ?? null,
      duration_ms:  best.duration_ms ?? null,
      explicit:     best.explicit ?? null,
      artwork_url:  best.album?.images?.[0]?.url || null,
      spotify_url:  best.external_urls?.spotify || null,
      source:       'spotify',
      fetchedAt:    Date.now(),
    };
  }

  // ── Hulpfuncties ──────────────────────────────────────────────────────────

  /**
   * Kies het beste item uit een lijst via fuzzy matching.
   * @param {Array}    items
   * @param {string}   query
   * @param {Function} nameGetter  item → string
   * @returns het beste item, of null als onder threshold
   */
  _fuzzyBest(items, query, nameGetter) {
    // Eerst exacte match (case-insensitive)
    const norm  = s => (s || '').toLowerCase().trim();
    const exact = items.find(i => norm(nameGetter(i)) === norm(query));
    if (exact) return exact;

    // Dan fuzzy
    let best = null;
    let bestScore = 0;
    for (const item of items) {
      const score = _fuzzyScore(nameGetter(item), query);
      if (score > bestScore) { bestScore = score; best = item; }
    }

    if (bestScore >= FUZZY_THRESHOLD) return best;
    return null;
  }

  /** Valideer dat een Spotify ID correct is (alfanumeriek, 22 tekens). */
  _isValidSpotifyId(id) {
    return typeof id === 'string' && /^[a-zA-Z0-9]{22}$/.test(id);
  }
}

module.exports = { SpotifyWorker };
