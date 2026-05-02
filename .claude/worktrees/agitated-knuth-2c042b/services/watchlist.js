// ── Watchlist Service — Artiestenmonitoring met release tracking ───────────────
// Monitort artiesten op nieuwe releases via MusicBrainz en vergelijkt met Plex.
// Ondersteunt per-artiest configuratie, auto-download en similar-artist discovery.
'use strict';

const logger = require('../logger').child({ service: 'watchlist' });
const events = require('./events');
const { mbzGet } = require('./musicbrainz');
const { getSimilarArtists } = require('./lastfm');
const { albumInPlex, artistInPlex } = require('./plex');
const {
  getAllWatchlist, getWatchlistItem, getWatchlistByName,
  addWatchlistItem, updateWatchlistItem, removeWatchlistItem, markWatchlistScanned,
  getWatchlistReleases, addWatchlistRelease, updateWatchlistReleaseStatus,
  getDueWatchlistItems, getCache, setCache,
} = require('../db');

// ── MBID lookup (gecacht, hergebruikt patroon uit releases.js) ─────────────────
async function resolveArtistMBID(name) {
  const cacheKey = 'mbid:' + name.toLowerCase();
  const cached = getCache(cacheKey, Infinity);
  if (cached !== null) return cached === false ? null : cached;

  try {
    const q    = encodeURIComponent(`artist:"${name.replace(/"/g, '')}"`);
    const data = await mbzGet(`/artist?query=${q}&limit=4&fmt=json`);
    const list  = data.artists || [];
    const exact = list.find(a => a.name.toLowerCase() === name.toLowerCase());
    const best  = exact || list[0];
    const mbid  = best?.id || null;
    setCache(cacheKey, mbid !== null ? mbid : false);
    return mbid;
  } catch {
    return null;
  }
}

// ── Cover Art Archive ────────────────────────────────────────────────────────
async function resolveCAAcover(rgid) {
  if (!rgid) return null;
  const cacheKey = `caa:cover:${rgid}`;
  const cached = getCache(cacheKey, 30 * 86_400_000);
  if (cached !== null) return cached === false ? null : cached;
  try {
    const resp = await fetch(`https://coverartarchive.org/release-group/${rgid}/front-250`, {
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (resp.ok) {
      setCache(cacheKey, resp.url);
      return resp.url;
    }
    setCache(cacheKey, false);
    return null;
  } catch {
    return null;
  }
}

// ── MBZ release-groups ophalen ────────────────────────────────────────────────
async function fetchReleaseGroupsSince(mbid, since) {
  if (!mbid) return [];
  const cutoffStr = since.toISOString().slice(0, 10);
  const query = encodeURIComponent(
    `arid:${mbid} AND firstreleasedate:[${cutoffStr} TO *]`
  );
  try {
    const data   = await mbzGet(`/release-group?query=${query}&limit=50&fmt=json`);
    const groups = data['release-groups'] || [];
    return groups.map(rg => ({
      rgid:        rg.id,
      title:       rg.title,
      releaseDate: rg['first-release-date'] || null,
      primaryType: (rg['primary-type'] || '').toLowerCase(),
      secondaryTypes: (rg['secondary-types'] || []).map(t => t.toLowerCase()),
    })).filter(rg => rg.releaseDate && new Date(rg.releaseDate) >= since);
  } catch {
    return [];
  }
}

// ── Filter toepassen o.b.v. artiest-configuratie ──────────────────────────────
function applyFilters(groups, config) {
  return groups.filter(rg => {
    const { primaryType, secondaryTypes } = rg;

    // Type-filter
    if (primaryType === 'album' && !config.watch_albums) return false;
    if (primaryType === 'ep'    && !config.watch_eps)    return false;
    if (primaryType === 'single'&& !config.watch_singles)return false;
    if (!['album', 'ep', 'single'].includes(primaryType)) return false;

    // Exclusies
    if (config.exclude_live         && secondaryTypes.includes('live'))        return false;
    if (config.exclude_remixes      && secondaryTypes.includes('remix'))       return false;
    if (config.exclude_compilations && secondaryTypes.includes('compilation')) return false;

    return true;
  });
}

// ── Publieke API ──────────────────────────────────────────────────────────────

/**
 * Haal alle watchlist artiesten op inclusief statistieken.
 */
function getAll() {
  return getAllWatchlist();
}

/**
 * Voeg een artiest toe aan de watchlist.
 * @param {string} artistName
 * @param {object} [config] - Optionele per-artiest instellingen
 * @returns {object} De nieuwe entry
 */
async function add(artistName, config = {}) {
  const trimmed = artistName.trim();
  if (!trimmed) throw new Error('Artiestnaam is verplicht');

  // Controleer op duplicaat
  const existing = getWatchlistByName(trimmed);
  if (existing) throw new Error(`${trimmed} staat al in de watchlist`);

  // Probeer MBID alvast op te halen (niet-blokkerend)
  let mbid = null;
  try { mbid = await resolveArtistMBID(trimmed); } catch {}

  const id = addWatchlistItem({ artist_name: trimmed, mbid, ...config });
  logger.info({ id, artist: trimmed, mbid }, 'Artiest toegevoegd aan watchlist');
  return getWatchlistItem(id);
}

/**
 * Verwijder een artiest uit de watchlist.
 * @param {number} id
 */
function remove(id) {
  removeWatchlistItem(id);
}

/**
 * Update de configuratie van een watchlist-entry.
 * @param {number} id
 * @param {object} config
 */
function update(id, config) {
  updateWatchlistItem(id, config);
  return getWatchlistItem(id);
}

/**
 * Scan één artiest op nieuwe releases.
 * @param {number} id  - Watchlist entry ID
 * @returns {{ newReleases: Array, total: number }}
 */
async function scan(id) {
  const entry = getWatchlistItem(id);
  if (!entry) throw new Error(`Watchlist item ${id} niet gevonden`);

  logger.info({ id, artist: entry.artist_name }, 'Watchlist scan gestart');

  // MBID ophalen of hergebruiken
  let mbid = entry.mbid || await resolveArtistMBID(entry.artist_name);

  if (!mbid) {
    logger.warn({ artist: entry.artist_name }, 'Geen MBID gevonden — scan overgeslagen');
    markWatchlistScanned(id, null);
    return { newReleases: [], total: 0 };
  }

  // Bepaal cutoff: 1 jaar terug (ruim genoeg voor initiële scan)
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  const allGroups  = await fetchReleaseGroupsSince(mbid, cutoff);
  const filtered   = applyFilters(allGroups, entry);

  const newReleases = [];
  const existingReleases = getWatchlistReleases(id);
  const existingTitles   = new Set(existingReleases.map(r => r.release_title.toLowerCase()));

  for (const rg of filtered) {
    // Vergelijk met Plex library
    const inPlex = albumInPlex(entry.artist_name, rg.title);
    const status  = inPlex ? 'in_library' : 'new';

    // Haal cover op (enkel voor nieuwe releases, rate-limit bewust)
    let coverUrl = null;
    if (!existingTitles.has(rg.title.toLowerCase())) {
      coverUrl = await resolveCAAcover(rg.rgid);
    }

    const { id: releaseId, isNew } = addWatchlistRelease(id, {
      release_title: rg.title,
      release_type:  rg.primaryType,
      release_date:  rg.releaseDate,
      mbid:          rg.rgid,
      cover_url:     coverUrl,
      status,
    });

    if (isNew && status === 'new') {
      newReleases.push({
        id:           releaseId,
        watchlist_id: id,
        artist:       entry.artist_name,
        title:        rg.title,
        type:         rg.primaryType,
        date:         rg.releaseDate,
        cover_url:    coverUrl,
      });
    }
  }

  // Markeer artiest als gescand
  markWatchlistScanned(id, mbid);

  // Emit event voor nieuwe releases
  if (newReleases.length > 0) {
    logger.info({ artist: entry.artist_name, count: newReleases.length }, 'Nieuwe releases gevonden');
    events.emit('watchlist:new_release', {
      artist:  entry.artist_name,
      releases: newReleases,
    });

    // Auto-download triggeren indien ingesteld
    if (entry.auto_download) {
      for (const rel of newReleases) {
        try {
          events.emit('watchlist:trigger_download', {
            artist:  entry.artist_name,
            album:   rel.title,
            quality: entry.download_quality || 'flac',
          });
        } catch (e) {
          logger.warn({ artist: entry.artist_name, album: rel.title, err: e }, 'Auto-download trigger mislukt');
        }
      }
    }
  }

  return { newReleases, total: filtered.length };
}

/**
 * Scan alle artiesten waarvan de scan-interval verlopen is.
 * @returns {{ scanned: number, newReleases: number }}
 */
async function scanAll() {
  const due = getDueWatchlistItems();
  logger.info({ count: due.length }, 'Watchlist scan-all gestart');

  let totalNew = 0;

  for (const entry of due) {
    try {
      const result = await scan(entry.id);
      totalNew += result.newReleases.length;
      // Korte pauze om MBZ rate-limit te respecteren
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      logger.warn({ id: entry.id, artist: entry.artist_name, err: e }, 'Scan mislukt voor artiest');
    }
  }

  logger.info({ scanned: due.length, newReleases: totalNew }, 'Watchlist scan-all klaar');
  return { scanned: due.length, newReleases: totalNew };
}

/**
 * Voeg similar artists (via Last.fm) toe aan de watchlist.
 * Slaat artiesten over die al in de watchlist staan.
 * @param {string} artistName
 * @param {object} [config] - Configuratie voor de nieuwe entries
 * @returns {{ added: string[], skipped: string[] }}
 */
async function autoDiscover(artistName, config = {}) {
  logger.info({ artist: artistName }, 'Auto-discover similar artists gestart');

  let similar = [];
  try {
    similar = await getSimilarArtists(artistName, 20);
  } catch (e) {
    logger.warn({ artist: artistName, err: e }, 'getSimilarArtists mislukt');
    throw new Error('Kon vergelijkbare artiesten niet ophalen');
  }

  const added   = [];
  const skipped = [];

  for (const s of similar) {
    const name = s.name || s;
    if (!name) continue;
    const exists = getWatchlistByName(name);
    if (exists) {
      skipped.push(name);
      continue;
    }
    try {
      await add(name, config);
      added.push(name);
      // Kleine pauze om MBID-lookups te spreiden
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      logger.warn({ artist: name, err: e }, 'Kon artiest niet toevoegen bij auto-discover');
      skipped.push(name);
    }
  }

  logger.info({ source: artistName, added: added.length, skipped: skipped.length }, 'Auto-discover klaar');
  return { added, skipped };
}

/**
 * Haal alle releases op voor één watchlist-entry.
 * @param {number} id
 */
function getReleases(id) {
  return getWatchlistReleases(id);
}

/**
 * Update de status van een release.
 * @param {number} releaseId
 * @param {string} status - 'new'|'downloaded'|'skipped'|'in_library'
 */
function updateReleaseStatus(releaseId, status) {
  updateWatchlistReleaseStatus(releaseId, status);
}

module.exports = {
  getAll,
  add,
  remove,
  update,
  scan,
  scanAll,
  autoDiscover,
  getReleases,
  updateReleaseStatus,
};
