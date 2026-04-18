// ── Discover service ─────────────────────────────────────────────────────────
const { lfm, getSimilarArtists }           = require('./lastfm');
const { syncPlexLibrary, artistInPlex, albumInPlex, getPlexStatus } = require('./plex');
const { getMBZArtist, getMBZAlbums }       = require('./musicbrainz');
const { getDeezerImage }                   = require('./deezer');
const { getCache, setCache, getCacheAge }  = require('../db');

const CACHE_TTL = 86_400_000; // 24 uur
let buildPromise = null;

// Verschillende periodes voor afwisseling — elke build pikt er willekeurig een
const SEED_PERIODS = ['1month', '3month', '6month', '12month', 'overall'];

/** Fisher-Yates shuffle — geeft een nieuwe geschudde array terug. */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function buildDiscoverCache() {
  // Kies elke build een andere combinatie van periodes voor variatie
  const period1 = SEED_PERIODS[Math.floor(Math.random() * SEED_PERIODS.length)];
  const period2 = SEED_PERIODS[Math.floor(Math.random() * SEED_PERIODS.length)];
  console.log(`Discover cache bouwen (periodes: ${period1} + ${period2})...`);
  try {
    await syncPlexLibrary();

    // Haal top-artiesten op uit twee willekeurige periodes
    const [data1, data2] = await Promise.all([
      lfm({ method: 'user.gettopartists', period: period1, limit: 30 }),
      lfm({ method: 'user.gettopartists', period: period2, limit: 30 }).catch(() => ({ topartists: { artist: [] } }))
    ]);

    const names1 = (data1.topartists?.artist || []).map(a => a.name);
    const names2 = (data2.topartists?.artist || []).map(a => a.name);

    // Combineer en shuffle voor variatie — niet altijd dezelfde volgorde
    const combined  = [...new Set([...names1, ...names2])];
    const topArtists = shuffle(combined).slice(0, 30); // 30 seed-artiesten ipv 20

    // Gelijkaardige artiesten parallel ophalen — meer per artiest voor grotere pool
    const candidateMap = new Map();
    const similar = await Promise.all(
      topArtists.map(async artist => {
        try { return { artist, similar: await getSimilarArtists(artist, 20) }; }
        catch { return { artist, similar: [] }; }
      })
    );
    for (const { artist, list } of similar.map(r => ({ artist: r.artist, list: r.similar }))) {
      for (const s of list) {
        if (!topArtists.includes(s.name) && !candidateMap.has(s.name)) {
          candidateMap.set(s.name, {
            name:   s.name,
            match:  parseFloat(s.match),
            reason: artist,
            inPlex: artistInPlex(s.name)
          });
        }
      }
    }

    // Sorteer op match-score (niet-Plex artiesten krijgen voorrang als ontdekkingen),
    // voeg dan wat toeval toe door de top-200 te shufflen voor altijd wisselende volgorde
    const allCandidates = Array.from(candidateMap.values())
      .sort((a, b) => (b.match * (b.inPlex ? 0.8 : 1.2)) - (a.match * (a.inPlex ? 0.8 : 1.2)));

    // Splits in top-helft en onderste helft, shuffle beide en pak de beste 60
    const half    = Math.ceil(allCandidates.length / 2);
    const topHalf = shuffle(allCandidates.slice(0, half));
    const botHalf = shuffle(allCandidates.slice(half));
    const pool    = [...topHalf, ...botHalf].slice(0, 60);

    // Verrijken met MBZ + Deezer — parallel (mbzEnqueue regelt rate limiting)
    const enriched = await Promise.all(pool.map(async c => {
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
          mbid:         mbz?.mbid      || null,
          country:      mbz?.country   || null,
          startYear:    mbz?.startYear || null,
          tags:         mbz?.tags      || [],
          image,
          albums,
          missingCount: albums.filter(a => !a.inPlex).length,
          totalAlbums:  albums.length
        };
      } catch {
        return { ...c, tags: [], albums: [], missingCount: 0, totalAlbums: 0 };
      }
    }));

    setCache('discover', { artists: enriched, basedOn: topArtists, builtAt: Date.now(), periods: [period1, period2] });
    console.log(`Discover cache klaar: ${enriched.length} artiesten (periodes: ${period1} + ${period2})`);
  } catch (e) {
    console.error('Discover cache mislukt:', e.message);
    // Oude cache blijft onaangetast in de DB — timestamp NIET resetten,
    // zodat het systeem de volgende keer opnieuw probeert ipv 24u wacht.
    console.log('Discover: oude cache blijft actief (timestamp behouden voor volgende poging).');
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
