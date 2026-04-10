// ── Releases service — recente releases van beluisterde artiesten ─────────────
const { lfm }                              = require('./lastfm');
const { artistInPlex, albumInPlex }        = require('./plex');
const { getCache, setCache, getCacheAge }  = require('../db');

const CACHE_TTL   = 86_400_000; // 24 uur
const CUTOFF_DAYS = 30;
let   buildPromise = null;

/**
 * Haal één artiest-ID op via Deezer search.
 * Geeft null terug bij mislukking of geen match.
 */
async function getDeezerArtistId(name) {
  try {
    const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6_000) });
    if (!res.ok) return null;
    const json = await res.json();
    const results = json?.data || [];
    const exact = results.find(a => a.name.toLowerCase() === name.toLowerCase());
    const best  = exact || results[0];
    return best?.id || null;
  } catch {
    return null;
  }
}

/**
 * Haal de recentste albums van een Deezer artiest-ID op.
 * Geeft [] terug bij mislukking.
 */
async function getDeezerAlbums(artistId) {
  try {
    const url = `https://api.deezer.com/artist/${artistId}/albums?limit=5&order=release_date`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6_000) });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data || [];
  } catch {
    return [];
  }
}

/**
 * Bouw de releases-cache op door:
 * 1. Top artiesten op te halen (3m + 12m) → unieke set
 * 2. Per artiest Deezer te bevragen
 * 3. Albums te filteren op release_date ≥ CUTOFF_DAYS geleden
 */
async function buildReleasesCache() {
  console.log('Releases cache bouwen...');
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - CUTOFF_DAYS);

    // Haal top-artiesten op uit twee periodes
    const [r3m, r12m] = await Promise.allSettled([
      lfm({ method: 'user.gettopartists', period: '3month',  limit: 30 }),
      lfm({ method: 'user.gettopartists', period: '12month', limit: 50 })
    ]);

    const names3m  = r3m.status  === 'fulfilled' ? (r3m.value.topartists?.artist  || []).map(a => a.name) : [];
    const names12m = r12m.status === 'fulfilled' ? (r12m.value.topartists?.artist || []).map(a => a.name) : [];

    // Unieke set (behoud volgorde, 3m eerst)
    const seen    = new Set();
    const artists = [];
    for (const n of [...names3m, ...names12m]) {
      if (!seen.has(n)) { seen.add(n); artists.push(n); }
    }

    // Batch in groepen van 5 om Deezer niet te overbelasten
    const releases = [];

    for (let i = 0; i < artists.length; i += 5) {
      const batch = artists.slice(i, i + 5);
      const batchResults = await Promise.allSettled(
        batch.map(async name => {
          const id = await getDeezerArtistId(name);
          if (!id) return [];
          const albums = await getDeezerAlbums(id);
          return albums
            .filter(a => {
              if (!a.release_date) return false;
              const rel = new Date(a.release_date);
              return rel >= cutoff;
            })
            .map(a => ({
              album:       a.title,
              artist:      name,
              releaseDate: a.release_date,
              image:       a.cover_medium || null,
              type:        a.record_type  || 'album',
              inPlex:      albumInPlex(name, a.title),
              artistInPlex: artistInPlex(name),
              deezerUrl:   a.link || null
            }));
        })
      );
      for (const r of batchResults) {
        if (r.status === 'fulfilled') releases.push(...r.value);
      }
    }

    // Sorteren op datum (nieuwste eerst)
    releases.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

    setCache('releases', { releases, builtAt: Date.now() });
    console.log(`Releases cache klaar: ${releases.length} releases`);
  } catch (e) {
    console.error('Releases cache mislukt:', e.message);
  }
}

/** Geeft gecachede releases-data terug (of { status: 'building' } als nog bezig). */
function getReleases() {
  if (getCacheAge('releases') > CACHE_TTL && !buildPromise) {
    buildPromise = buildReleasesCache().finally(() => { buildPromise = null; });
  }
  const data = getCache('releases');
  if (!data) return { status: 'building', message: 'Recente releases worden opgehaald (ca. 30 sec)...' };
  return { status: 'ok', ...data };
}

/** Forceer een rebuild van de releases-cache. */
function refreshReleases() {
  if (!buildPromise) {
    buildPromise = buildReleasesCache().finally(() => { buildPromise = null; });
  }
  return { ok: true, building: true };
}

/** Start de achtergrond-build bij opstarten (met vertraging). */
function initReleases() {
  setTimeout(() => {
    if (getCacheAge('releases') > CACHE_TTL && !buildPromise) {
      buildPromise = buildReleasesCache().finally(() => { buildPromise = null; });
    }
  }, 15_000);
}

module.exports = { getReleases, refreshReleases, initReleases };
