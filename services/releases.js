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
 * 1. Top artiesten op te halen (3m + 12m met hogere limieten) → unieke set
 * 2. Recente tracks ophalen voor extra artiesten die niet in top staan
 * 3. Per artiest Deezer te bevragen (met rate limiting)
 * 4. Albums te filteren op release_date ≥ CUTOFF_DAYS geleden
 * 5. Sorteren op artistPlaycount (desc), dan datum (desc)
 */
async function buildReleasesCache() {
  console.log('Releases cache bouwen...');

  // Bewaar oude cache voor error recovery (STAP 12)
  const oldCache = getCache('releases');

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - CUTOFF_DAYS);

    // STAP 1.1: Hogere limieten voor top-artiesten
    const [r3m, r12m, rRecent] = await Promise.allSettled([
      lfm({ method: 'user.gettopartists', period: '3month',  limit: 50 }),
      lfm({ method: 'user.gettopartists', period: '12month', limit: 200 }),
      lfm({ method: 'user.getrecenttracks', limit: 200 })
    ]);

    // STAP 1.3: Bouw playcountMap uit top-artiesten responses
    const playcountMap = new Map();
    const artists3m  = r3m.status  === 'fulfilled' ? (r3m.value.topartists?.artist  || []) : [];
    const artists12m = r12m.status === 'fulfilled' ? (r12m.value.topartists?.artist || []) : [];
    for (const a of [...artists3m, ...artists12m]) {
      if (!playcountMap.has(a.name)) {
        playcountMap.set(a.name, parseInt(a.playcount) || 0);
      }
    }

    const names3m  = artists3m.map(a => a.name);
    const names12m = artists12m.map(a => a.name);

    // Unieke set (behoud volgorde, 3m eerst)
    const seen    = new Set();
    const artists = [];
    for (const n of [...names3m, ...names12m]) {
      if (!seen.has(n)) { seen.add(n); artists.push(n); }
    }

    // STAP 1.2: Voeg artiesten uit recenttracks toe die nog niet in de set staan
    if (rRecent.status === 'fulfilled') {
      const recentTracks = rRecent.value.recenttracks?.track || [];
      for (const t of recentTracks) {
        const name = t.artist?.['#text'];
        if (name && !seen.has(name)) {
          seen.add(name);
          artists.push(name);
          // STAP 1.3: Artiesten uit recenttracks die niet in top staan krijgen playcount 1
          if (!playcountMap.has(name)) {
            playcountMap.set(name, 1);
          }
        }
      }
    }

    // STAP 1.5: Batch in groepen van 5 met 1500ms vertraging tussen batches
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
              album:          a.title,
              artist:         name,
              releaseDate:    a.release_date,
              image:          a.cover_big || a.cover_medium || null,  // STAP 13.3: cover_big
              type:           a.record_type  || 'album',
              inPlex:         albumInPlex(name, a.title),
              artistInPlex:   artistInPlex(name),
              deezerUrl:      a.link || null,
              artistPlaycount: playcountMap.get(name) || 1  // STAP 1.4
            }));
        })
      );
      for (const r of batchResults) {
        if (r.status === 'fulfilled') releases.push(...r.value);
      }

      // STAP 1.5: Rate limiting — wacht 1500ms na elke batch (behalve de laatste)
      if (i + 5 < artists.length) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    // STAP 1.6: Sorteer primair op artistPlaycount (desc), secundair op releaseDate (desc)
    releases.sort((a, b) => {
      const playDiff = (b.artistPlaycount || 0) - (a.artistPlaycount || 0);
      if (playDiff !== 0) return playDiff;
      return new Date(b.releaseDate) - new Date(a.releaseDate);
    });

    // STAP 10: Vergelijk met vorige cache om nieuwe releases te detecteren
    const prevReleases = oldCache?.releases || [];
    const prevKeys = new Set(prevReleases.map(r => `${r.artist}::${r.album}`));
    const newReleaseIds = releases
      .filter(r => !prevKeys.has(`${r.artist}::${r.album}`))
      .map(r => `${r.artist}::${r.album}`);

    setCache('releases', { releases, builtAt: Date.now(), newReleaseIds });
    console.log(`Releases cache klaar: ${releases.length} releases, ${newReleaseIds.length} nieuw`);
  } catch (e) {
    console.error('Releases cache mislukt:', e.message);
    // STAP 12: Error recovery — bewaar de oude cache als die beschikbaar was
    if (oldCache) {
      setCache('releases', oldCache);
      console.log('Releases: oude cache hersteld na fout.');
    }
  }
}

/** Geeft gecachede releases-data terug (of { status: 'building' } als nog bezig). */
function getReleases() {
  if (getCacheAge('releases') > CACHE_TTL && !buildPromise) {
    buildPromise = buildReleasesCache().finally(() => { buildPromise = null; });
  }
  const data = getCache('releases');
  if (!data) return { status: 'building', message: 'Recente releases worden opgehaald (ca. 30 sec)...' };
  // STAP 10: Voeg newCount toe aan response
  return {
    status: 'ok',
    ...data,
    newCount: (data.newReleaseIds || []).length
  };
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
