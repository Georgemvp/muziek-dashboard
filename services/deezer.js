// ── Deezer service ───────────────────────────────────────────────────────────
const { getCache, setCache } = require('../db');
const logger = require('../logger');

/** Haal een artiestfoto op via de Deezer API. Geeft null terug bij mislukking. */
async function getDeezerImage(name) {
  try {
    const data = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=3`,
      { signal: AbortSignal.timeout(5_000) }
    ).then(r => r.json());
    const results = data?.data || [];
    const exact   = results.find(a => a.name.toLowerCase() === name.toLowerCase());
    const best    = exact || results[0];
    if (best?.picture_medium && !best.picture_medium.includes('/artist//')) return best.picture_medium;
  } catch { /* stilletjes mislukken */ }
  return null;
}

/**
 * Zoek een artiest op Deezer op naam.
 * Geeft het beste resultaat terug met id, name, picture_medium, picture_xl, nb_album, nb_fan.
 * Cache TTL: 7 dagen.
 */
async function getDeezerArtist(name) {
  const cacheKey = `deezer:artist:${name.toLowerCase()}`;
  const cached = getCache(cacheKey, 7 * 86_400_000);
  if (cached) return cached;

  try {
    const data = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=3`,
      { signal: AbortSignal.timeout(5_000) }
    ).then(r => r.json());

    const results = data?.data || [];
    const exact   = results.find(a => a.name.toLowerCase() === name.toLowerCase());
    const best    = exact || results[0];
    if (!best) return null;

    const result = {
      id:             best.id,
      name:           best.name,
      picture_medium: best.picture_medium || null,
      picture_xl:     best.picture_xl     || null,
      nb_album:       best.nb_album       || 0,
      nb_fan:         best.nb_fan         || 0
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    logger.debug({ err: e, name }, 'getDeezerArtist mislukt');
    return null;
  }
}

/**
 * Haal artiestdata op via Deezer artiest-ID.
 * Cache TTL: 7 dagen.
 */
async function getDeezerArtistById(id) {
  const cacheKey = `deezer:artist:id:${id}`;
  const cached = getCache(cacheKey, 7 * 86_400_000);
  if (cached) return cached;

  try {
    const result = await fetch(
      `https://api.deezer.com/artist/${id}`,
      { signal: AbortSignal.timeout(5_000) }
    ).then(r => r.json());

    if (!result?.id) return null;
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    logger.debug({ err: e, id }, 'getDeezerArtistById mislukt');
    return null;
  }
}

/**
 * Haal gerelateerde artiesten op via Deezer artiest-ID.
 * Geeft array van artiest-objecten terug.
 * Cache TTL: 24 uur.
 */
async function getDeezerRelatedArtists(artistId) {
  const cacheKey = `deezer:related:${artistId}`;
  const cached = getCache(cacheKey, 86_400_000);
  if (cached) return cached;

  try {
    const data = await fetch(
      `https://api.deezer.com/artist/${artistId}/related?limit=20`,
      { signal: AbortSignal.timeout(5_000) }
    ).then(r => r.json());

    const results = data?.data || [];
    setCache(cacheKey, results);
    return results;
  } catch (e) {
    logger.debug({ err: e, artistId }, 'getDeezerRelatedArtists mislukt');
    return [];
  }
}

/**
 * Haal albums op voor een artiest via Deezer artiest-ID.
 * Geeft array terug met id, title, cover_medium, release_date, record_type.
 * Cache TTL: 7 dagen.
 */
async function getDeezerArtistAlbums(artistId) {
  const cacheKey = `deezer:albums:${artistId}`;
  const cached = getCache(cacheKey, 7 * 86_400_000);
  if (cached) return cached;

  try {
    const data = await fetch(
      `https://api.deezer.com/artist/${artistId}/albums?limit=50`,
      { signal: AbortSignal.timeout(5_000) }
    ).then(r => r.json());

    const albums = (data?.data || []).map(a => ({
      id:           a.id,
      title:        a.title,
      cover_medium: a.cover_medium || null,
      release_date: a.release_date || null,
      record_type:  a.record_type  || null
    }));
    setCache(cacheKey, albums);
    return albums;
  } catch (e) {
    logger.debug({ err: e, artistId }, 'getDeezerArtistAlbums mislukt');
    return [];
  }
}

/**
 * Haal de top-tracks op voor een artiest via Deezer artiest-ID.
 * Geeft array terug met title, duration, rank, preview, album.
 * Cache TTL: 24 uur.
 */
async function getDeezerArtistTopTracks(artistId) {
  const cacheKey = `deezer:toptracks:${artistId}`;
  const cached = getCache(cacheKey, 86_400_000);
  if (cached) return cached;

  try {
    const data = await fetch(
      `https://api.deezer.com/artist/${artistId}/top?limit=10`,
      { signal: AbortSignal.timeout(5_000) }
    ).then(r => r.json());

    const tracks = (data?.data || []).map(t => ({
      title:    t.title,
      duration: t.duration  || 0,
      rank:     t.rank      || 0,
      preview:  t.preview   || null,
      album:    t.album ? { title: t.album.title, cover_medium: t.album.cover_medium || null } : null
    }));
    setCache(cacheKey, tracks);
    return tracks;
  } catch (e) {
    logger.debug({ err: e, artistId }, 'getDeezerArtistTopTracks mislukt');
    return [];
  }
}

/**
 * Zoek artiesten op Deezer op naam (vrije zoekterm).
 * Geeft array van artiestresultaten terug.
 * Cache TTL: 1 uur.
 */
async function searchDeezerArtist(query) {
  const cacheKey = `deezer:search:${query.toLowerCase()}`;
  const cached = getCache(cacheKey, 3_600_000);
  if (cached) return cached;

  try {
    const data = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}&limit=10`,
      { signal: AbortSignal.timeout(5_000) }
    ).then(r => r.json());

    const results = (data?.data || []).map(a => ({
      id:             a.id,
      name:           a.name,
      picture_medium: a.picture_medium && !a.picture_medium.includes('/artist//') ? a.picture_medium : null,
      nb_fan:         a.nb_fan || 0
    }));
    setCache(cacheKey, results);
    return results;
  } catch (e) {
    logger.debug({ err: e, query }, 'searchDeezerArtist mislukt');
    return [];
  }
}

/**
 * Geeft vergelijkbare artiesten terug via Deezer related artists.
 * Vervangt de Last.fm artist.getsimilar functie.
 * Output-formaat: [{ name, match, image }] — identiek aan de vroegere Last.fm versie.
 * Cache TTL: 24 uur (via getDeezerArtist + getDeezerRelatedArtists).
 */
async function getSimilarArtists(name, limit = 8) {
  try {
    // Stap 1: zoek het Deezer artiest-ID op
    const artist = await getDeezerArtist(name);
    if (!artist?.id) return [];

    // Stap 2: haal gerelateerde artiesten op
    const related = await getDeezerRelatedArtists(artist.id);
    if (!related || related.length === 0) return [];

    // Stap 3: map naar hetzelfde formaat als de vroegere Last.fm variant
    return related.slice(0, limit).map(a => ({
      name:  a.name,
      match: '1.0',  // Deezer geeft geen match-score, gebruik 1.0 als standaard
      image: (a.picture_medium && !a.picture_medium.includes('/artist//')) ? a.picture_medium : null
    }));
  } catch (e) {
    logger.debug({ err: e, name }, 'getSimilarArtists (Deezer) mislukt');
    return [];
  }
}

module.exports = {
  getDeezerImage,
  getDeezerArtist,
  getDeezerArtistById,
  getDeezerRelatedArtists,
  getDeezerArtistAlbums,
  getDeezerArtistTopTracks,
  searchDeezerArtist,
  getSimilarArtists
};
