// ── Gaps service ─────────────────────────────────────────────────────────────
const logger = require('../logger');
const { lfm }                                     = require('./lastfm');
const { syncPlexLibrary, artistInPlex, albumInPlex, getPlexStatus } = require('./plex');
const { getMBZArtist, getMBZAlbums }              = require('./musicbrainz');
const { getDeezerImage }                          = require('./deezer');
const { getCache, setCache, getCacheAge }         = require('../db');

const CACHE_TTL = 86_400_000; // 24 uur
let buildPromise = null;

// Roteer periodes zodat je afwisselend andere artiesten ziet
const PERIODS = ['overall', '12month', '6month', '3month'];

// ── Concurrency limiter (gekopieerd uit server.js) ──────────────────────────
/**
 * Voert `tasks` (een array van functies die een Promise teruggeven) uit
 * met maximaal `limit` gelijktijdige uitvoeringen.
 * Geeft een array van PromiseSettledResult-objecten terug (zelfde interface als Promise.allSettled).
 */
function limitConcurrency(tasks, limit) {
  return new Promise((resolve) => {
    if (tasks.length === 0) return resolve([]);
    const results = new Array(tasks.length);
    let started   = 0;
    let completed = 0;

    function runNext() {
      while (started < tasks.length && (started - completed) < limit) {
        const idx = started++;
        Promise.resolve()
          .then(() => tasks[idx]())
          .then(
            (val) => { results[idx] = { status: 'fulfilled', value: val }; },
            (err) => { results[idx] = { status: 'rejected',  reason: err }; }
          )
          .finally(() => {
            completed++;
            if (completed === tasks.length) resolve(results);
            else runNext();
          });
      }
    }
    runNext();
  });
}

async function buildGapsCache() {
  // Kies willekeurig een periode voor afwisseling
  const period = PERIODS[Math.floor(Math.random() * PERIODS.length)];
  logger.info({ period }, 'Gaps cache bouwen');
  try {
    await syncPlexLibrary();

    // Haal top-artiesten op uit twee periodes en loved tracks tegelijk voor meer dekking
    const [topData, recentData, lovedData] = await Promise.all([
      lfm({ method: 'user.gettopartists', period: 'overall', limit: 40 }),
      lfm({ method: 'user.gettopartists', period: period, limit: 30 }).catch(() => ({ topartists: { artist: [] } })),
      lfm({ method: 'user.getlovedtracks', limit: 50 }).catch(() => ({ lovedtracks: { track: [] } }))
    ]);

    const overallNames = (topData.topartists?.artist || []).map(a => a.name);
    const recentNames  = (recentData.topartists?.artist || []).map(a => a.name);
    const lovedNames   = (lovedData.lovedtracks?.track || []).map(a => a.artist.name);

    // Combineer: loved eerst (voor prioriteit), recent, daarna overall, dedupliceer
    const combined = [...new Set([...lovedNames, ...recentNames, ...overallNames])];
    const plexTop  = combined.filter(name => artistInPlex(name)).slice(0, 40);

    // Converteer naar array van async tasks voor parallel processing met limit van 4
    const tasks = plexTop.map(name => async () => {
      try {
        const [mbz, image] = await Promise.all([
          getMBZArtist(name).catch(() => null),
          getDeezerImage(name)
        ]);
        if (!mbz?.mbid) return null;

        const raw     = await getMBZAlbums(mbz.mbid).catch(() => []);
        const albums  = raw.map(a => ({ ...a, inPlex: albumInPlex(name, a.title) }));
        const missing = albums.filter(a => !a.inPlex);
        if (missing.length === 0) return null;

        return {
          artistId:   mbz.mbid,
          title:      name,
          thumb:      image,
          country:    mbz.country,
          startYear:  mbz.startYear,
          genres:     mbz.tags,
          missing:    missing,
          owned:      albums.filter(a => a.inPlex),
          ownedCount: albums.filter(a => a.inPlex).length,
          totalCount: albums.length
        };
      } catch (e) {
        logger.error({ err: e, artist: name }, 'Gaps: fout bij verwerken artiest');
        return null;
      }
    });

    // Voer tasks parallel uit met concurrency-limit van 4 (MusicBrainz rate limiting)
    const results = await limitConcurrency(tasks, 4);

    // Filter en map de resultaten
    const gapArtists = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value);

    setCache('gaps', { gaps: gapArtists, builtAt: Date.now(), period });
    logger.info({ gaps: gapArtists.length, period }, 'Gaps cache klaar');
  } catch (e) {
    logger.error({ err: e }, 'Gaps cache mislukt');
    // Oude cache blijft onaangetast in de DB — timestamp NIET resetten,
    // zodat het systeem de volgende keer opnieuw probeert ipv 24u wacht.
    logger.info('Gaps: oude cache blijft actief (timestamp behouden voor volgende poging)');
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

// ═══════════════════════════════════════════════════════════════════════════
// Per-artiest gaps functie voor individuele artist detail pages
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Haalt gaps voor een specifieke artiest op.
 * @param {string} artistName - Artiestnaam
 * @returns {Promise<Object>} { owned, missing, ownedCount, totalCount, completeness }
 */
async function getArtistGaps(artistName) {
  const cacheKey = `gaps:artist:${artistName.toLowerCase()}`;
  const ARTIST_CACHE_TTL = 3_600_000; // 1 uur

  // Check cache eerst
  const cached = getCache(cacheKey);
  const cacheAge = getCacheAge(cacheKey);
  if (cached && cacheAge < ARTIST_CACHE_TTL) {
    return cached;
  }

  try {
    // Check of artiest in Plex staat
    if (!artistInPlex(artistName)) {
      return { owned: [], missing: [], ownedCount: 0, totalCount: 0, completeness: 0, notInPlex: true };
    }

    // Haal MusicBrainz MBID op
    const mbz = await getMBZArtist(artistName);
    if (!mbz || !mbz.mbid) {
      logger.warn({ artist: artistName }, 'MusicBrainz MBID niet gevonden');
      return { owned: [], missing: [], ownedCount: 0, totalCount: 0, completeness: 0, mbidNotFound: true };
    }

    // Haal alle albums op van MusicBrainz
    const allAlbums = await getMBZAlbums(mbz.mbid);

    // Check per album of het in Plex staat (parallel processing met limit van 8)
    const albumTasks = allAlbums.map(album => async () => {
      const inPlex = albumInPlex(artistName, album.title);
      return { ...album, inPlex };
    });

    const results = await limitConcurrency(albumTasks, 8);
    const checkedAlbums = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    // Verdeel in owned en missing
    const owned = checkedAlbums.filter(a => a.inPlex);
    const missing = checkedAlbums.filter(a => !a.inPlex);

    const result = {
      owned,
      missing,
      ownedCount: owned.length,
      totalCount: checkedAlbums.length,
      completeness: checkedAlbums.length > 0
        ? Math.round((owned.length / checkedAlbums.length) * 100)
        : 0
    };

    // Cache het resultaat
    setCache(cacheKey, result);
    logger.debug({ artist: artistName, owned: owned.length, missing: missing.length }, 'Artist gaps opgehaald');

    return result;
  } catch (err) {
    logger.error({ err, artist: artistName }, 'Fout bij ophalen artist gaps');
    throw err;
  }
}

module.exports = { getGaps, refreshGaps, initGaps, getArtistGaps };
