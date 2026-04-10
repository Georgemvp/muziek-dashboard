// ── Gaps service ─────────────────────────────────────────────────────────────
const { lfm }                                     = require('./lastfm');
const { syncPlexLibrary, artistInPlex, albumInPlex, getPlexStatus } = require('./plex');
const { getMBZArtist, getMBZAlbums }              = require('./musicbrainz');
const { getDeezerImage }                          = require('./deezer');
const { getCache, setCache, getCacheAge }         = require('../db');

const CACHE_TTL = 86_400_000; // 24 uur
let buildPromise = null;

async function buildGapsCache() {
  console.log('Gaps cache bouwen...');
  // STAP 12: Bewaar oude cache voor error recovery
  const oldCache = getCache('gaps');
  try {
    await syncPlexLibrary();
    const topData    = await lfm({ method: 'user.gettopartists', period: 'overall', limit: 40 });
    const topArtists = (topData.topartists?.artist || []).map(a => a.name);
    const plexTop    = topArtists.filter(name => artistInPlex(name)).slice(0, 20);

    const gapArtists = [];
    for (const name of plexTop) {
      try {
        const [mbz, image] = await Promise.all([
          getMBZArtist(name).catch(() => null),
          getDeezerImage(name)
        ]);
        if (!mbz?.mbid) continue;

        const raw     = await getMBZAlbums(mbz.mbid).catch(() => []);
        const albums  = raw.map(a => ({ ...a, inPlex: albumInPlex(name, a.title) }));
        const missing = albums.filter(a => !a.inPlex);
        if (missing.length === 0) continue;

        gapArtists.push({
          name, image,
          mbid:          mbz.mbid,
          country:       mbz.country,
          startYear:     mbz.startYear,
          tags:          mbz.tags,
          allAlbums:     albums,
          missingAlbums: missing,
          ownedCount:    albums.filter(a =>  a.inPlex).length,
          totalCount:    albums.length
        });
      } catch { /* sla artiest over bij fout */ }
    }

    setCache('gaps', { artists: gapArtists, builtAt: Date.now() });
    console.log(`Gaps cache klaar: ${gapArtists.length} artiesten met gaten`);
  } catch (e) {
    console.error('Gaps cache mislukt:', e.message);
    // STAP 12: Error recovery — bewaar oude cache bij fout
    if (oldCache) {
      setCache('gaps', oldCache);
      console.log('Gaps: oude cache hersteld na fout.');
    }
  }
}

/** Geeft gecachede gaps-data terug (of { status: 'building' } als nog bezig). */
function getGaps() {
  if (getCacheAge('gaps') > CACHE_TTL && !buildPromise) {
    buildPromise = buildGapsCache().finally(() => { buildPromise = null; });
  }
  const data = getCache('gaps');
  if (!data) return { status: 'building', message: 'Collectiegaten worden gezocht...' };
  return { status: 'ok', ...data, plexConnected: getPlexStatus().ok };
}

/** Forceer een rebuild van de gaps-cache. */
function refreshGaps() {
  if (!buildPromise) {
    buildPromise = buildGapsCache().finally(() => { buildPromise = null; });
  }
  return { ok: true, building: true };
}

/** Start de achtergrond-build bij opstarten. */
function initGaps() {
  setTimeout(() => {
    if (getCacheAge('gaps') > CACHE_TTL && !buildPromise) {
      buildPromise = buildGapsCache().finally(() => { buildPromise = null; });
    }
  }, 15_000);
}

module.exports = { getGaps, refreshGaps, initGaps };
