'use strict';
// ── Deezer enrichment worker ──────────────────────────────────────────────────
// API: https://api.deezer.com  — gratis, geen auth nodig
// Highlights: BPM voor tracks, label + record_type voor albums
// Rate limit: conservatief 1 req/sec
// Fuzzy matching threshold: 0.80

const DEEZER_BASE    = 'https://api.deezer.com';
const RATE_INTERVAL  = 1100; // ms
const FUZZY_THRESHOLD = 0.80;

// ── Fuzzy helper (Dice-coëfficiënt) ─────────────────────────────────────────
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
    intersection += Math.min(cnt, bMap.get(bg) || 0);
  }
  const total = a.length + b.length - 2;
  return total > 0 ? (2 * intersection) / total : 0;
}

class DeezerWorker {
  constructor(db, log) {
    this.db        = db;
    this.log       = log.child ? log.child({ worker: 'deezer' }) : log;
    this._lastCall = 0;
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────

  async _rateLimit() {
    const wait = Math.max(0, RATE_INTERVAL - (Date.now() - this._lastCall));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    this._lastCall = Date.now();
  }

  async _get(path) {
    await this._rateLimit();
    const url = `${DEEZER_BASE}${path}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal:  AbortSignal.timeout(12_000),
    });
    if (res.status === 429) throw new Error('Deezer rate limit bereikt');
    if (!res.ok) throw new Error(`Deezer HTTP ${res.status} bij ${path}`);
    const json = await res.json();
    // Deezer geeft foutobject terug bij ongeldige ID's
    if (json.error) throw new Error(`Deezer fout: ${json.error.message || JSON.stringify(json.error)}`);
    return json;
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

      if (!data) return { ok: false, error: 'Geen Deezer-resultaat gevonden' };
      return { ok: true, data };
    } catch (err) {
      this.log.warn({ err: err.message, entity: entity.entity_name }, 'Deezer worker mislukt');
      return { ok: false, error: err.message };
    }
  }

  // ── Artiest ───────────────────────────────────────────────────────────────

  async _processArtist(name) {
    const json = await this._get(`/search/artist?q=${encodeURIComponent(name)}&limit=5`);
    const items = json.data || [];
    if (!items.length) return null;

    const best = this._fuzzyBest(items, name, a => a.name);
    if (!best) return null;

    // Haal volledige artiest-details op
    let full;
    try {
      full = await this._get(`/artist/${best.id}`);
    } catch {
      full = best;
    }

    // Deezer heeft geen genres op artiest-niveau — haal top albums genres op
    let genres = [];
    try {
      const albumData = await this._get(`/artist/${best.id}/albums?limit=10`);
      const albumGenres = (albumData.data || [])
        .flatMap(al => (al.genres?.data || []).map(g => g.name));
      genres = [...new Set(albumGenres)].slice(0, 8);
    } catch { /* genres blijven leeg */ }

    return {
      deezer_id:    full.id,
      name:         full.name,
      artwork_url:  full.picture_xl || full.picture_big || full.picture || null,
      nb_album:     full.nb_album   ?? null,
      nb_fan:       full.nb_fan     ?? null,
      radio:        full.radio      ?? null,
      deezer_url:   full.link       || null,
      genres,
      source:       'deezer',
      fetchedAt:    Date.now(),
    };
  }

  // ── Album ─────────────────────────────────────────────────────────────────

  async _processAlbum(name) {
    const json  = await this._get(`/search/album?q=${encodeURIComponent(name)}&limit=5`);
    const items = json.data || [];
    if (!items.length) return null;

    const best = this._fuzzyBest(items, name, a => a.title);
    if (!best) return null;

    // Haal volledige album-details op (bevat label, genres, record_type)
    let full;
    try {
      full = await this._get(`/album/${best.id}`);
    } catch {
      full = best;
    }

    const genres = (full.genres?.data || []).map(g => g.name);

    return {
      deezer_id:    full.id,
      title:        full.title,
      artwork_url:  full.cover_xl  || full.cover_big || full.cover || null,
      label:        full.label     || null,
      genres,
      explicit:     full.explicit_lyrics ?? null,
      record_type:  full.record_type     || null,
      release_date: full.release_date    || null,
      nb_tracks:    full.nb_tracks       ?? null,
      deezer_url:   full.link            || null,
      upc:          full.upc             || null,
      source:       'deezer',
      fetchedAt:    Date.now(),
    };
  }

  // ── Track ─────────────────────────────────────────────────────────────────

  async _processTrack(name) {
    const json  = await this._get(`/search?q=${encodeURIComponent(name)}&limit=5`);
    const items = json.data || [];
    if (!items.length) return null;

    const best = this._fuzzyBest(items, name, t => t.title);
    if (!best) return null;

    // Haal volledige track-details op voor BPM (crown jewel)
    let full;
    try {
      full = await this._get(`/track/${best.id}`);
    } catch {
      full = best;
    }

    return {
      deezer_id:    full.id,
      title:        full.title,
      bpm:          full.bpm              || null, // ← Deezer's BPM
      duration:     full.duration         || null,
      explicit:     full.explicit_lyrics  ?? full.explicit_content_lyrics ?? null,
      gain:         full.gain             ?? null,  // replay gain
      preview_url:  full.preview          || null,
      artwork_url:  full.album?.cover_xl  || full.album?.cover_big || null,
      deezer_url:   full.link             || null,
      isrc:         full.isrc             || null,
      rank:         full.rank             ?? null,
      source:       'deezer',
      fetchedAt:    Date.now(),
    };
  }

  // ── Hulpfuncties ──────────────────────────────────────────────────────────

  _fuzzyBest(items, query, nameGetter) {
    const norm  = s => (s || '').toLowerCase().trim();
    const exact = items.find(i => norm(nameGetter(i)) === norm(query));
    if (exact) return exact;

    let best = null;
    let bestScore = 0;
    for (const item of items) {
      const score = _fuzzyScore(nameGetter(item), query);
      if (score > bestScore) { bestScore = score; best = item; }
    }
    return bestScore >= FUZZY_THRESHOLD ? best : null;
  }
}

module.exports = { DeezerWorker };
