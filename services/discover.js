// ── Discover service ─────────────────────────────────────────────────────────
const { lfm, getSimilarArtists }           = require('./lastfm');
const { syncPlexLibrary, artistInPlex, albumInPlex, getPlexStatus } = require('./plex');
const { getMBZArtist, getMBZAlbums }       = require('./musicbrainz');
const { getDeezerImage }                   = require('./deezer');
const { getCache, setCache, getCacheAge }  = require('../db');

const CACHE_TTL = 86_400_000; // 24 uur
let buildPromise = null;

async function buildDiscoverCache() {
  console.log('Discover cache bouwen...');
  // STAP 12: Bewaar oude cache voor error recovery
  const oldCache = getCache('discover');
  try {
    await syncPlexLibrary();
    const topData    = await lfm({ method: 'user.gettopartists', period: '6month', limit: 20 });
    const topArtists = (topData.topartists?.artist || []).map(a => a.name);

    // Gelijkaardige artiesten parallel ophalen
    const candidateMap = new Map();
    const similar = await Promise.all(
      topArtists.slice(0, 20).map(async artist => {
        try { return { artist, similar: await getSimilarArtists(artist, 15) }; }
        catch { return { artist, similar: [] }; }
      })
    );
    for (const { artist, list } of similar.map(r => ({ artist: r.artist, list: r.similar }))) {
      for (const s of list) {
        if (!topArtists.includes(s.name) && !candidateMap.has(s.name)) {
          candidateMap.set(s.name, { name: s.name, match: parseFloat(s.match), reason: artist, inPlex: artistInPlex(s.name) });
        }
      }
    }

    const sorted = Array.from(candidateMap.values())
      .sort((a, b) => (b.match * (b.inPlex ? 0.8 : 1.2)) - (a.match * (a.inPlex ? 0.8 : 1.2)))
      .slice(0, 50);

    // Verrijken met MBZ + Deezer — parallel (mbzEnqueue regelt rate limiting)
    const enriched = await Promise.all(sorted.map(async c => {
      try {
        const [mbz, image] = await Promise.all([
          getMBZArtist(c.name).catch(() => null),
          getDeezerImage(c.name)
        ]);
        let albums = [];
        if (mbz?.mbid) {
          const raw = await getMBZAlbums(mbz.mbid).catch(() => []);
          albums    = raw.map(a => ({ ...a, inPlex: albumInPlex(c.name, a.title) }));
        }
        return {
          ...c,
          mbid:         mbz?.mbid    || null,
          country:      mbz?.country || null,
          startYear:    mbz?.startYear || null,
          tags:         mbz?.tags    || [],
          image,
          albums,
          missingCount: albums.filter(a => !a.inPlex).length,
          totalAlbums:  albums.length
        };
      } catch {
        return { ...c, tags: [], albums: [], missingCount: 0, totalAlbums: 0 };
      }
    }));

    setCache('discover', { artists: enriched, basedOn: topArtists, builtAt: Date.now() });
    console.log(`Discover cache klaar: ${enriched.length} artiesten`);
  } catch (e) {
    console.error('Discover cache mislukt:', e.message);
    // STAP 12: Error recovery — bewaar oude cache bij fout
    if (oldCache) {
      setCache('discover', oldCache);
      console.log('Discover: oude cache hersteld na fout.');
    }
  }
}

/** Geeft gecachede discover-data terug (of { status: 'building' } als nog bezig). */
function getDiscover() {
  if (getCacheAge('discover') > CACHE_TTL && !buildPromise) {
    buildPromise = buildDiscoverCache().finally(() => { buildPromise = null; });
  }
  const data = getCache('discover');
  if (!data) return { status: 'building', message: 'Muziekontdekkingen worden geanalyseerd (ca. 30 sec)...' };
  return { status: 'ok', ...data, plexConnected: getPlexStatus().ok };
}

/** Forceer een rebuild van de discover-cache. */
function refreshDiscover() {
  if (!buildPromise) {
    buildPromise = buildDiscoverCache().finally(() => { buildPromise = null; });
  }
  return { ok: true, building: true };
}

/** Start de achtergrond-build bij opstarten (met vertraging zodat Plex eerst kan synchroniseren). */
function initDiscover() {
  setTimeout(() => {
    if (getCacheAge('discover') > CACHE_TTL && !buildPromise) {
      buildPromise = buildDiscoverCache().finally(() => { buildPromise = null; });
    }
  }, 8_000);
}

module.exports = { getDiscover, refreshDiscover, initDiscover };
