// ── Tidarr service ───────────────────────────────────────────────────────────
// Integratie met Tidarr (https://github.com/cstaelen/tidarr) voor het zoeken
// en downloaden van muziek via Tidal.
const { getCache, setCache } = require('../db');

const TIDARR_URL     = (process.env.TIDARR_URL || 'http://tidarr:8484').replace(/\/$/, '');
const TIDARR_API_KEY = process.env.TIDARR_API_KEY || '';

/** Doe een Tidarr-API-aanroep met timeout en optionele X-API-KEY header. */
async function tidarrFetch(urlPath, options = {}) {
  const headers = {
    'Accept':       'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (TIDARR_API_KEY) headers['x-api-key'] = TIDARR_API_KEY;

  const res = await fetch(`${TIDARR_URL}${urlPath}`, {
    ...options,
    headers,
    signal: AbortSignal.timeout(options.timeout || 15_000)
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Tidarr HTTP ${res.status}${body ? ` - ${body.slice(0, 120)}` : ''}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

/** Haal de countryCode op uit Tidarr's tiddl config (nodig voor TIDAL API calls). */
let _cachedCountryCode = null;
async function getTidalCountryCode() {
  if (_cachedCountryCode) return _cachedCountryCode;
  try {
    const settings = await tidarrFetch('/api/settings', { timeout: 5_000 });
    _cachedCountryCode = settings?.tiddl_config?.auth?.country_code || 'NL';
  } catch {
    _cachedCountryCode = 'NL';
  }
  return _cachedCountryCode;
}

// ── String-normalisatie voor fuzzy matching ────────────────────────────────

/** Strip accenten, leestekens en edition-achtervoegsels voor vergelijking. */
function normalizeStr(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // accenten weg
    .replace(/[''`]/g, '')                               // aanhalingstekens
    .replace(/[^a-z0-9\s]/g, ' ')                        // leestekens → spatie
    .replace(/\b(deluxe|edition|remastered|remaster|live|bonus|expanded|anniversary|version|special|limited|ep)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Score hoeveel woorden van `target` voorkomen in `candidate` (0–1).
 * Korte woorden (<= 2 tekens) tellen niet mee om ruis te vermijden.
 */
function titleScore(candidate, target) {
  const cWords = new Set(normalizeStr(candidate).split(' ').filter(w => w.length > 2));
  const tWords =           normalizeStr(target).split(' ').filter(w => w.length > 2);
  if (tWords.length === 0) return 0;
  const hits = tWords.filter(w => cWords.has(w)).length;
  return hits / tWords.length;
}

/** Artiest-score: kijk of kandidaat-artiest overeenkomt met gezochte artiest. */
function artistScore(candidate, target) {
  const c = normalizeStr(candidate);
  const t = normalizeStr(target);
  if (!c || !t) return 0.5; // onbekend → neutraal
  if (c === t) return 1;
  if (c.includes(t) || t.includes(c)) return 0.8;
  return titleScore(c, t);
}

// ── Ruwe TIDAL-zoekopdracht ────────────────────────────────────────────────

/**
 * Zoek op Tidal via Tidarr's TIDAL-proxy (/proxy/tidal/v2/search).
 * Retourneert genormaliseerde resultaten; wordt intern door findBestAlbum gebruikt.
 */
async function rawSearch(query, limit = 50) {
  const q = (query || '').trim();
  if (q.length < 2) return [];

  const cacheKey = `tidarr:raw:${q.toLowerCase()}:${limit}`;
  const cached   = getCache(cacheKey, 300_000);
  if (cached) return cached;

  try {
    const countryCode = await getTidalCountryCode();
    const params = new URLSearchParams({
      query:       q,
      countryCode: countryCode,
      deviceType:  'BROWSER',
      locale:      'en_US',
      limit:       String(limit),
      offset:      '0'
    });
    const data = await tidarrFetch(`/proxy/tidal/v2/search?${params}`);

    const albums = (data?.albums?.items || []).map(a => ({
      type:   'album',
      id:     String(a.id),
      title:  a.title || '',
      artist: (a.artists?.[0]?.name) || (a.artist?.name) || '',
      image:  a.cover ? `https://resources.tidal.com/images/${String(a.cover).replace(/-/g, '/')}/320x320.jpg` : null,
      url:    a.url || `http://www.tidal.com/album/${a.id}`,
      year:   a.releaseDate ? String(a.releaseDate).slice(0, 4) : null,
    }));

    setCache(cacheKey, albums);
    return albums;
  } catch {
    return [];
  }
}

/**
 * Publieke zoekfunctie: retourneert albums + tracks voor de Tidal-zoektab.
 */
async function searchTidal(query) {
  const q = (query || '').trim();
  if (q.length < 2) return { results: [] };

  const cacheKey = `tidarr:search:${q.toLowerCase()}`;
  const cached   = getCache(cacheKey, 300_000);
  if (cached) return cached;

  try {
    const countryCode = await getTidalCountryCode();
    const params = new URLSearchParams({
      query:       q,
      countryCode: countryCode,
      deviceType:  'BROWSER',
      locale:      'en_US',
      limit:       '50',
      offset:      '0'
    });
    const data = await tidarrFetch(`/proxy/tidal/v2/search?${params}`);

    const albums = (data?.albums?.items || []).map(a => ({
      type:   'album',
      id:     String(a.id),
      title:  a.title || '',
      artist: (a.artists?.[0]?.name) || (a.artist?.name) || '',
      image:  a.cover ? `https://resources.tidal.com/images/${String(a.cover).replace(/-/g, '/')}/320x320.jpg` : null,
      url:    a.url || `http://www.tidal.com/album/${a.id}`,
      year:   a.releaseDate ? String(a.releaseDate).slice(0, 4) : null,
      tracks: a.numberOfTracks || null
    }));
    const tracks = (data?.tracks?.items || []).map(t => ({
      type:     'track',
      id:       String(t.id),
      title:    t.title || '',
      artist:   (t.artists?.[0]?.name) || (t.artist?.name) || '',
      album:    t.album?.title || '',
      image:    t.album?.cover ? `https://resources.tidal.com/images/${String(t.album.cover).replace(/-/g, '/')}/320x320.jpg` : null,
      url:      t.url || `http://www.tidal.com/track/${t.id}`,
      duration: t.duration || null
    }));

    const result = { results: [...albums, ...tracks] };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    return { error: e.message, results: [] };
  }
}

// ── Slimme album-zoeker (multi-strategie) ─────────────────────────────────

/**
 * Scoor een kandidaat-album op hoe goed het past bij de gezochte artiest+titel.
 * Geeft een gecombineerde score terug (0–1); hoger = betere match.
 */
function scoreAlbum(candidate, wantedArtist, wantedTitle) {
  const ts = titleScore(candidate.title,  wantedTitle);
  const as = artistScore(candidate.artist, wantedArtist);
  // Gewogen: titel is belangrijker dan artiest
  return ts * 0.65 + as * 0.35;
}

/**
 * Zoek het best passende album voor een artiest + albumtitel via meerdere strategieën.
 * Strategie 1: zoek op "artiest album"  → score alle albumresultaten
 * Strategie 2: zoek op alleen "album"   → score (als strategie 1 te laag scoort)
 * Strategie 3: zoek op alleen "artiest" → filter albums op titelmatch
 *
 * Geeft het best scorende album terug, of null als niets gevonden.
 */
async function findBestAlbum(artist, album) {
  const GOOD_SCORE   = 0.55;  // zeker genoeg → direct gebruiken
  const MIN_SCORE    = 0.25;  // absolute ondergrens
  const wantedArtist = (artist || '').trim();
  const wantedTitle  = (album  || '').trim();

  if (!wantedTitle) return null;

  let best = null;
  let bestScore = -1;

  // Hulpfunctie: update best als kandidaat beter scoort
  function consider(candidates) {
    for (const c of candidates) {
      const s = scoreAlbum(c, wantedArtist, wantedTitle);
      if (s > bestScore) { bestScore = s; best = c; }
    }
  }

  // ── Strategie 1: artiest + albumtitel ─────────────────────────────────
  const q1 = [wantedArtist, wantedTitle].filter(Boolean).join(' ');
  const r1  = await rawSearch(q1);
  consider(r1);
  if (bestScore >= GOOD_SCORE) return best;

  // ── Strategie 2: alleen albumtitel ────────────────────────────────────
  if (wantedTitle.split(' ').length >= 2) {  // skip voor 1-woord titels (te vaag)
    const r2 = await rawSearch(wantedTitle);
    consider(r2);
    if (bestScore >= GOOD_SCORE) return best;
  }

  // ── Strategie 3: genormaliseerde variantie van artiest + titel ─────────
  // Verwijder alles tussen haakjes uit de albumtitel en probeer opnieuw
  const strippedTitle = wantedTitle.replace(/\s*[\(\[].+?[\)\]]/g, '').trim();
  if (strippedTitle && strippedTitle !== wantedTitle) {
    const r3 = await rawSearch([wantedArtist, strippedTitle].filter(Boolean).join(' '));
    consider(r3);
    if (bestScore >= GOOD_SCORE) return best;
  }

  // ── Strategie 4: alleen artiestna, filter op albumtitel ───────────────
  if (wantedArtist) {
    const r4 = await rawSearch(wantedArtist, 100); // meer resultaten = meer keuze
    consider(r4);
  }

  return bestScore >= MIN_SCORE ? best : null;
}

/**
 * Zoek de top-N best scorende albums voor artiest + albumtitel.
 * Doorloopt dezelfde strategieën als findBestAlbum maar geeft een gesorteerde lijst terug,
 * zodat de frontend de gebruiker een keuze kan bieden.
 */
async function findTopAlbums(artist, album, topN = 3) {
  const MIN_SCORE    = 0.15;  // ruimere ondergrens zodat we altijd wat tonen
  const wantedArtist = (artist || '').trim();
  const wantedTitle  = (album  || '').trim();

  if (!wantedTitle) return [];

  // Verzamel unieke kandidaten (op id) met hun score
  const seen   = new Map(); // id → { candidate, score }

  function consider(candidates) {
    for (const c of candidates) {
      const s = scoreAlbum(c, wantedArtist, wantedTitle);
      if (!seen.has(c.id) || s > seen.get(c.id).score) {
        seen.set(c.id, { candidate: c, score: s });
      }
    }
  }

  // Dezelfde vier strategieën als findBestAlbum
  const q1 = [wantedArtist, wantedTitle].filter(Boolean).join(' ');
  consider(await rawSearch(q1));

  if (wantedTitle.split(' ').length >= 2) {
    consider(await rawSearch(wantedTitle));
  }

  const strippedTitle = wantedTitle.replace(/\s*[\(\[].+?[\)\]]/g, '').trim();
  if (strippedTitle && strippedTitle !== wantedTitle) {
    consider(await rawSearch([wantedArtist, strippedTitle].filter(Boolean).join(' ')));
  }

  if (wantedArtist) {
    consider(await rawSearch(wantedArtist, 100));
  }

  return Array.from(seen.values())
    .filter(x => x.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(x => ({ ...x.candidate, score: Math.round(x.score * 100) }));
}

/**
 * Voeg een album of track toe aan de Tidarr download-queue.
 * Tidarr verwacht POST /api/save met een volledig ProcessingItemType-object.
 */
async function addToQueue(url, type = 'album', title = '', artist = '', id = '', quality = null) {
  if (!url) throw new Error('URL is verplicht');
  const itemId = id || url.split('/').filter(Boolean).pop() || String(Date.now());
  const item = {
    id:      itemId,
    title,
    artist,
    type,
    quality: quality || process.env.LOCK_QUALITY || 'high',
    status:  'queue_download',
    loading: true,
    error:   false,
    url
  };
  return tidarrFetch('/api/save', {
    method: 'POST',
    body:   JSON.stringify({ item })
  });
}

/** Geeft de queue-status terug (Tidarr heeft geen REST-lijst, alleen SSE). */
async function getQueue() {
  try {
    const status = await tidarrFetch('/api/queue/status', { timeout: 5_000 });
    return { items: [], isPaused: status?.isPaused ?? false };
  } catch (e) {
    return { error: e.message, items: [] };
  }
}

/** Geeft de download-historie terug (array van TIDAL-IDs als strings). */
async function getHistory() {
  try {
    const data = await tidarrFetch('/api/history/list');
    const items = (Array.isArray(data) ? data : []).map(id => ({ id: String(id) }));
    return { items };
  } catch (e) {
    return { error: e.message, items: [] };
  }
}

/** Verwijder een item uit de queue op basis van id. */
async function removeFromQueue(id) {
  if (!id) throw new Error('id is verplicht');
  return tidarrFetch('/api/remove', {
    method: 'DELETE',
    body:   JSON.stringify({ id })
  });
}

/** Status / health-check tegen Tidarr. */
async function getTidarrStatus() {
  try {
    const data = await tidarrFetch('/api/settings', { timeout: 5_000 });
    return {
      connected:   true,
      url:         TIDARR_URL,
      version:     data?.version || null,
      quality:     data?.LOCK_QUALITY || data?.quality || null,
      noToken:     data?.noToken ?? false
    };
  } catch (e) {
    return { connected: false, url: TIDARR_URL, reason: e.message };
  }
}

module.exports = {
  searchTidal,
  findBestAlbum,
  findTopAlbums,
  addToQueue,
  getQueue,
  getHistory,
  removeFromQueue,
  getTidarrStatus,
  TIDARR_URL
};
