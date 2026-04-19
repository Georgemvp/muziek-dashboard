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
 * @param {object} params       - API-parameters (method, period, limit, …)
 * @param {object} [opts]
 * @param {boolean} [opts.includeUser=true] - Voeg user: USERNAME toe aan de aanroep
 */
async function lfm(params, { includeUser = true } = {}) {
  return _lfmSchedule(async () => {
    const url  = new URL(LASTFM);
    const base = { api_key: API_KEY, format: 'json', ...(includeUser ? { user: USERNAME } : {}) };
    Object.entries({ ...base, ...params }).forEach(([k, v]) => url.searchParams.set(k, v));
    const res  = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
    const data = await res.json();
    if (data.error) throw new Error(data.message || `Last.fm fout ${data.error}`);
    return data;
  });
}

/**
 * Geeft vergelijkbare artiesten terug voor een gegeven artiestnaam.
 * Cacheert resultaten 24 uur lang (TTL).
 * Haalt altijd 20 op van Last.fm (voor optimale cache-hit), slice daarna naar gewenste limit.
 */
async function getSimilarArtists(artist, limit = 8) {
  const cacheKey = `similar:${artist.toLowerCase()}`;
  const cached = getCache(cacheKey, 24 * 3_600_000); // 24 uur TTL
  if (cached) return cached.slice(0, limit);

  // Haal altijd 20 op van Last.fm (vollediger resultaat voor caching)
  const data = await lfm({ method: 'artist.getsimilar', artist, limit: 20 }, { includeUser: false });
  const similar = data.similarartists?.artist || [];

  // Cache het volledige resultaat
  setCache(cacheKey, similar);

  // Return alleen wat de caller nodig heeft
  return similar.slice(0, limit);
}

module.exports = { lfm, getSimilarArtists };
