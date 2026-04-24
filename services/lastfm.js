// ── Last.fm service ─────────────────────────────────────────────────────────
const API_KEY = process.env.LASTFM_API_KEY;
const USERNAME = process.env.LASTFM_USER;
const LASTFM   = 'https://ws.audioscrobbler.com/2.0/';
const { getCache, setCache } = require('../db.js');

// ── Outbound throttle: max 4 requests per seconde naar Last.fm ───────────────
// Alle aanroepen worden via een async-keten geserialiseerd met 260ms pauze
// tussen elke aanroep (~3.8/sec, iets onder de Last.fm limiet van 5/sec).
const LFM_MIN_INTERVAL = 260; // ms
let _lfmChain = Promise.resolve();

function _lfmSchedule(fn) {
  const result = _lfmChain.then(() => fn());
  // Vervolg de keten altijd na LFM_MIN_INTERVAL, ook bij fouten
  _lfmChain = result
    .then(  () => new Promise(r => setTimeout(r, LFM_MIN_INTERVAL)))
    .catch( () => new Promise(r => setTimeout(r, LFM_MIN_INTERVAL)));
  return result;
}

/**
 * Doe een Last.fm API-aanroep (automatisch gethrottled naar ≤4/sec).
 * Cache-checks gebeuren VOOR de throttle: cache-hits return direct zonder queue.
 *
 * @param {object} params       - API-parameters (method, period, limit, …)
 * @param {object} [opts]
 * @param {boolean} [opts.includeUser=true] - Voeg user: USERNAME toe aan de aanroep
 * @param {string} [opts.cacheKey]          - Cache-sleutel (optional); als ingesteld, check cache eerst
 * @param {number} [opts.cacheTTL]          - Cache TTL in ms; alleen gebruikt als cacheKey is ingesteld
 */
async function lfm(params, { includeUser = true, cacheKey, cacheTTL } = {}) {
  // ── Cache-check VOOR throttle: cache-hits gaan niet door de queue ─────────
  if (cacheKey) {
    const cached = getCache(cacheKey, cacheTTL);
    if (cached) return cached;
  }

  // ── Alleen echte Last.fm requests gaan door _lfmSchedule ──────────────────
  const data = await _lfmSchedule(async () => {
    const url  = new URL(LASTFM);
    const base = { api_key: API_KEY, format: 'json', ...(includeUser ? { user: USERNAME } : {}) };
    Object.entries({ ...base, ...params }).forEach(([k, v]) => url.searchParams.set(k, v));
    const res  = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
    const data = await res.json();
    if (data.error) throw new Error(data.message || `Last.fm fout ${data.error}`);
    return data;
  });

  // ── Cache het resultaat als cacheKey is ingesteld ────────────────────────
  if (cacheKey) {
    setCache(cacheKey, data);
  }

  return data;
}

/**
 * Geeft vergelijkbare artiesten terug voor een gegeven artiestnaam.
 * Cacheert resultaten 24 uur lang (TTL).
 * Haalt altijd 20 op van Last.fm (voor optimale cache-hit), slice daarna naar gewenste limit.
 * Cache-check gebeurt nu in lfm() zelf, voor de throttle.
 */
async function getSimilarArtists(artist, limit = 8) {
  const cacheKey = `similar:${artist.toLowerCase()}`;
  const cacheTTL = 24 * 3_600_000; // 24 uur TTL

  // lfm() zal cache checken VOOR throttle en direct returnen als hit
  const similar = await lfm(
    { method: 'artist.getsimilar', artist, limit: 20 },
    { includeUser: false, cacheKey, cacheTTL }
  );

  // Als dit een array is (cache-hit), return slice ervan
  // Als dit een object is (API-response), extract de artist array
  const similarArray = Array.isArray(similar) ? similar : (similar.similarartists?.artist || []);

  // Return alleen wat de caller nodig heeft
  return similarArray.slice(0, limit);
}

module.exports = { lfm, getSimilarArtists };
