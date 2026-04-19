// ── Gaps service ─────────────────────────────────────────────────────────────
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
  console.log(`Gaps cache bouwen (periode: ${period})...`);
  try {
    await syncPlexLibrary();

    // Haal top-artiesten op uit twee periodes tegelijk voor meer dekking
    const [topData, recentData] = await Promise.all([
      lfm({ method: 'user.gettopartists', period: 'overall', limit: 40 }),
      lfm({ method: 'user.gettopartists', period: period, limit: 30 }).catch(() => ({ topartists: { artist: [] } }))
    ]);

    const overallNames = (topData.topartists?.artist || []).map(a => a.name);
    const recentNames  = (recentData.topartists?.artist || []).map(a => a.name);

    // Combineer: recent eerst (voor afwisseling), daarna overall, dedupliceer
    const combined = [...new Set([...recentNames, ...overallNames])];
    const plexTop  = combined.filter(name => artistInPlex(name)).slice(0, 25);

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
          name, image,
          mbid:          mbz.mbid,
          country:       mbz.country,
          startYear:     mbz.startYear,
          tags:          mbz.tags,
          allAlbums:     albums,
          missingAlbums: missing,
          ownedCount:    albums.filter(a =>  a.inPlex).length,
          totalCount:    albums.length
        };
      } catch (e) {
        console.error(`Fout bij verwerken artiest ${name}:`, e.message);
        return null;
      }
    });

    // Voer tasks parallel uit met concurrency-limit van 4 (MusicBrainz rate limiting)
    const results = await limitConcurrency(tasks, 4);

    // Filter en map de resultaten
    const gapArtists = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value);

    setCache('gaps', { artists: gapArtists, builtAt: Date.now(), period });
    console.log(`Gaps cache klaar: ${gapArtists.length} artiesten met gaten (periode: ${period})`);
  } catch (e) {
    console.error('Gaps cache mislukt:', e.message);
    // Oude cache blijft onaangetast in de DB — timestamp NIET resetten,
    // zodat het systeem de volgende keer opnieuw probeert ipv 24u wacht.
    console.log('Gaps: oude cache blijft actief (timestamp behouden voor volgende poging).');
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
