// ── Releases service — recente releases van Plex-artiesten via MusicBrainz ──
const logger = require('../logger');
const { lfm }                                        = require('./lastfm');
const { artistInPlex, albumInPlex, getPlexArtistNames } = require('./plex');
const { mbzGet }                                     = require('./musicbrainz');
const { getCache, setCache, getCacheAge }            = require('../db');

const CACHE_TTL    = 86_400_000; // 24 uur
const CUTOFF_DAYS  = 30;
const LOG_INTERVAL = 100;        // log elke N artiesten
let   buildPromise = null;

// ── MBID-lookup (permanent gecached) ──────────────────────────────────────

/**
 * Geeft de MusicBrainz-artiest-ID (MBID) terug voor `name`.
 * Slaat het resultaat permanent op in SQLite (key: `mbid:{lowercase naam}`).
 * Geeft null terug als de artiest niet gevonden wordt; slaat dan `false` op
 * om herhaaldelijke vergeefse lookups te voorkomen.
 */
async function getArtistMBID(name) {
  const cacheKey = 'mbid:' + name.toLowerCase();
  const cached   = getCache(cacheKey, Infinity); // null = nog nooit gecached
  if (cached !== null) return cached === false ? null : cached;

  try {
    const q    = encodeURIComponent(`artist:"${name.replace(/"/g, '')}"`);
    const data = await mbzGet(`/artist?query=${q}&limit=4&fmt=json`);
    const list  = data.artists || [];
    const exact = list.find(a => a.name.toLowerCase() === name.toLowerCase());
    const best  = exact || list[0];
    const mbid  = best?.id || null;
    // Sla op: geldige MBID als string, niet-gevonden als `false`
    setCache(cacheKey, mbid !== null ? mbid : false);
    return mbid;
  } catch {
    // Netwerk-/API-fout: niet cachen zodat de volgende run het opnieuw probeert
    return null;
  }
}

// ── Release-group search via MusicBrainz ─────────────────────────────────

/**
 * Zoekt via de MBZ search-API naar release-groups van `mbid` met een
 * `first-release-date` ≥ `cutoffDate`. Filtert compilaties, live-albums etc.
 * Geeft [] terug bij mislukking.
 */
async function getRecentReleaseGroups(mbid, cutoffDate) {
  if (!mbid) return [];

  const cutoffStr = cutoffDate.toISOString().slice(0, 10); // YYYY-MM-DD
  const query     = encodeURIComponent(
    `arid:${mbid} AND firstreleasedate:[${cutoffStr} TO *]`
  );

  try {
    const data   = await mbzGet(`/release-group?query=${query}&limit=25&fmt=json`);
    const groups = data['release-groups'] || [];

    return groups.filter(rg => {
      // Alleen relevante primaire types
      const pt = rg['primary-type'];
      if (!['Album', 'Single', 'EP'].includes(pt)) return false;
      // Geen compilaties, live, soundtracks, spoken-word, etc.
      const st = rg['secondary-types'] || [];
      if (st.some(t =>
        ['Compilation', 'Live', 'Soundtrack', 'Spokenword',
         'Interview', 'Audiobook', 'Remix'].includes(t)
      )) return false;
      // Datum nogmaals lokaal controleren (MBZ search is niet altijd exact)
      const date = rg['first-release-date'] || '';
      return date && new Date(date) >= cutoffDate;
    }).map(rg => ({
      rgid:        rg.id,
      title:       rg.title,
      releaseDate: rg['first-release-date'] || null,
      type:        (rg['primary-type'] || 'album').toLowerCase(),
      // Cover Art Archive primair; Deezer niet nodig — frontend kan 404 opvangen
      image: `https://coverartarchive.org/release-group/${rg.id}/front-250`
    }));
  } catch {
    return [];
  }
}

// ── Last.fm playcounts (voor sortering) ───────────────────────────────────

/**
 * Haalt top-artiesten op via Last.fm en bouwt een Map lowercase→playcount.
 * Niet-kritisch: bij fout geeft het een lege Map terug.
 */
async function getLastfmPlaycounts() {
  const playcountMap = new Map();
  try {
    const [r3m, r12m] = await Promise.allSettled([
      lfm({ method: 'user.gettopartists', period: '3month',  limit: 1000 }),
      lfm({ method: 'user.gettopartists', period: '12month', limit: 1000 })
    ]);
    const a3m  = r3m.status  === 'fulfilled' ? (r3m.value.topartists?.artist  || []) : [];
    const a12m = r12m.status === 'fulfilled' ? (r12m.value.topartists?.artist || []) : [];
    // 3m-periode heeft hogere gewicht; stop bij eerste hit per artiest
    for (const a of [...a3m, ...a12m]) {
      const key = a.name.toLowerCase();
      if (!playcountMap.has(key)) playcountMap.set(key, parseInt(a.playcount) || 0);
    }
  } catch {
    // Sorteren op playcount valt terug op 0 voor iedereen
  }
  return playcountMap;
}

// ── Incrementele cache-build ───────────────────────────────────────────────

async function buildReleasesCache() {
  logger.info('Releases cache bouwen (Plex + MusicBrainz)');

  const oldCache = getCache('releases');

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - CUTOFF_DAYS);

    // STAP 1 — Artiestenbron: Plex
    const plexMap       = getPlexArtistNames(); // Map<lowercase → origineel>
    const allArtists    = [...plexMap.values()]; // originele namen, ~1500 stuks
    const total         = allArtists.length;

    if (total === 0) {
      logger.warn('Releases: geen artiesten in Plex — is syncPlexLibrary al gedraaid?');
      return;
    }
    logger.info({ total }, 'Releases: Plex-artiesten gevonden');

    // STAP 2 — Last.fm playcounts voor sortering
    const playcountMap = await getLastfmPlaycounts();
    logger.info({ playcounts: playcountMap.size }, 'Releases: Last.fm-playcounts opgehaald');

    // STAP 3 — Controleer of er een vorige, onvoltooide run is
    const wip = getCache('releases:wip', Infinity);
    let processedSet = new Set();
    let releases     = [];

    if (wip && !wip.completed && Array.isArray(wip.artistsDone) && wip.total === total) {
      processedSet = new Set(wip.artistsDone);
      releases     = wip.releases || [];
      logger.info({ done: processedSet.size, total, releases: releases.length }, 'Releases: WIP gevonden, hervat vorige run');
    } else {
      // Verse run
      setCache('releases:wip', { completed: false, artistsDone: [], releases: [], total, startedAt: Date.now() });
    }

    // Sla tussentijdse voortgang op in SQLite
    function saveWip() {
      setCache('releases:wip', {
        completed:   false,
        artistsDone: [...processedSet],
        releases,
        total,
        startedAt:   wip?.startedAt || Date.now()
      });
    }

    // STAP 4 — Per artiest: MBID ophalen + recente releases zoeken
    // MBZ rate-limit (1 req/1.25 s) wordt bewaakt via mbzGet → mbzEnqueue in musicbrainz.js
    let count = processedSet.size;

    for (const name of allArtists) {
      if (processedSet.has(name)) continue; // al verwerkt in een vorige run

      // 4a. MBID ophalen (gecached na eerste lookup)
      const mbid = await getArtistMBID(name);

      // 4b. Recente release-groups ophalen
      if (mbid) {
        const newRgs    = await getRecentReleaseGroups(mbid, cutoff);
        const playcount = playcountMap.get(name.toLowerCase()) || 0;

        for (const rg of newRgs) {
          releases.push({
            album:           rg.title,
            artist:          name,
            releaseDate:     rg.releaseDate,
            image:           rg.image,
            type:            rg.type,
            inPlex:          albumInPlex(name, rg.title),
            artistInPlex:    artistInPlex(name),
            artistPlaycount: playcount
          });
        }
      }

      processedSet.add(name);
      count++;

      // Log + WIP opslaan elke LOG_INTERVAL artiesten
      if (count % LOG_INTERVAL === 0) {
        logger.info({ count, total, releases: releases.length }, 'Releases: voortgang');
        saveWip();
      }
    }

    logger.info({ total, releases: releases.length }, 'Releases: alle artiesten verwerkt');

    // STAP 5 — Sorteren: playcount desc, dan datum desc
    releases.sort((a, b) => {
      const pd = (b.artistPlaycount || 0) - (a.artistPlaycount || 0);
      if (pd !== 0) return pd;
      return new Date(b.releaseDate) - new Date(a.releaseDate);
    });

    // STAP 6 — Detecteer nieuwe releases t.o.v. vorige cache
    const prevKeys      = new Set((oldCache?.releases || []).map(r => `${r.artist}::${r.album}`));
    const newReleaseIds = releases
      .filter(r => !prevKeys.has(`${r.artist}::${r.album}`))
      .map(r => `${r.artist}::${r.album}`);

    // Schrijf finale cache en markeer WIP als voltooid
    setCache('releases', { releases, builtAt: Date.now(), newReleaseIds });
    setCache('releases:wip', { completed: true, total, finishedAt: Date.now() });

    logger.info({ releases: releases.length, newReleases: newReleaseIds.length }, 'Releases cache klaar');
  } catch (e) {
    logger.error({ err: e }, 'Releases cache mislukt');
    // Error recovery: herstel de oude cache zodat de frontend niet leeg blijft
    if (oldCache) {
      setCache('releases', oldCache);
      logger.info('Releases: oude cache hersteld na fout');
    }
  }
}

// ── Publieke API ──────────────────────────────────────────────────────────

/**
 * Geeft gecachede releases-data terug.
 * - Als nog geen data beschikbaar is: `{ status: 'building', progress, message }`
 * - Als data beschikbaar is: `{ status: 'ok', releases, builtAt, newCount }`
 *
 * Bij een actieve rebuild is `status` altijd 'ok' (oude data wordt getoond)
 * zodat de frontend niet leeg valt.
 */
function getReleases() {
  // Start rebuild als cache verlopen is en er geen build loopt
  if (getCacheAge('releases') > CACHE_TTL && !buildPromise) {
    buildPromise = buildReleasesCache().finally(() => { buildPromise = null; });
  }

  const data = getCache('releases');

  if (!data) {
    // Eerste build — haal WIP-voortgang op
    const wip      = getCache('releases:wip', Infinity);
    const done     = wip?.artistsDone?.length ?? 0;
    const wipTotal = wip?.total ?? 0;
    const progress = wipTotal > 0
      ? { current: done, total: wipTotal, percent: Math.round((done / wipTotal) * 100) }
      : null;

    return {
      status:   'building',
      message:  `Recente releases worden opgehaald (~30 min voor ${wipTotal || '?'} artiesten)...`,
      progress
    };
  }

  return {
    status:   'ok',
    ...data,
    newCount: (data.newReleaseIds || []).length
  };
}

/** Forceer een rebuild van de releases-cache (b.v. via de refresh-knop in de UI). */
function refreshReleases() {
  if (!buildPromise) {
    // Reset WIP zodat de volgende run altijd opnieuw begint
    setCache('releases:wip', { completed: true, total: 0, finishedAt: 0 });
    buildPromise = buildReleasesCache().finally(() => { buildPromise = null; });
  }
  return { ok: true, building: true };
}

/**
 * Start de achtergrond-build bij opstarten (na 15 s om andere services de kans
 * te geven te initialiseren). Hervat ook een onvoltooide WIP automatisch.
 */
function initReleases() {
  setTimeout(() => {
    const wip              = getCache('releases:wip', Infinity);
    const hasIncompleteWip = wip && !wip.completed;
    if ((getCacheAge('releases') > CACHE_TTL || hasIncompleteWip) && !buildPromise) {
      buildPromise = buildReleasesCache().finally(() => { buildPromise = null; });
    }
  }, 15_000);
}

module.exports = { getReleases, refreshReleases, initReleases };
