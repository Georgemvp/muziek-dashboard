// ── ListenBrainz Playlist Service ────────────────────────────────────────────
// Haalt aanbevolen en eigen playlists op via de ListenBrainz API en matcht
// tracks tegen de Plex-bibliotheek via artiest- en titelovereenkomst.
//
// API docs: https://listenbrainz.readthedocs.io/en/latest/users/api/playlist.html
//
// Geïmporteerde playlists worden omgezet naar het standaard track-formaat:
//   { artist, title, album, duration, plex_key, cover_url, mbid }

'use strict';

const https  = require('https');
const logger = require('../logger');
const { getCache, setCache } = require('../db');
const { artistInPlex, getPlexLibrary } = require('./plex');

const LBZ_BASE    = 'https://api.listenbrainz.org/1';
const CACHE_TTL   = 6 * 3600 * 1000; // 6 uur

// ── HTTP helper ───────────────────────────────────────────────────────────────

/** Eenvoudige HTTPS-GET, geeft parsed JSON terug. */
function lbzFetch(path, token = null) {
  return new Promise((resolve, reject) => {
    const url     = `${LBZ_BASE}${path}`;
    const headers = { 'User-Agent': 'lastfm-app/1.0 (https://github.com/user/lastfm-app)' };
    if (token) headers['Authorization'] = `Token ${token}`;

    const req = https.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', d => { body += d; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          return reject(new Error(`ListenBrainz HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
        }
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`ListenBrainz JSON parse fout: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('ListenBrainz timeout')); });
  });
}

// ── Normalisatie helpers ──────────────────────────────────────────────────────

function norm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '').trim();
}

function thumbUrl(thumb) {
  if (!thumb) return null;
  if (thumb.startsWith('http')) return thumb;
  return `/api/plex/thumb?path=${encodeURIComponent(thumb)}`;
}

// ── Track matching ────────────────────────────────────────────────────────────

/**
 * Probeer een ListenBrainz track te matchen aan de Plex-bibliotheek.
 * Strategie:
 *   1. Exacte artiest + albumtitel match
 *   2. Artiest aanwezig → pak het eerste album
 *   3. Geen match → plex_key = null
 */
function matchTrackToPlex(lbzTrack) {
  const library = getPlexLibrary();
  const artist  = lbzTrack.artist || lbzTrack.creator || '';
  const title   = lbzTrack.title  || lbzTrack.identifier || '';
  const album   = lbzTrack.album  || '';

  const normArtist = norm(artist);
  const normTitle  = norm(title);
  const normAlbum  = norm(album);

  // Zoek album in Plex op artiest + album naam
  let plexAlb = null;

  if (normAlbum) {
    plexAlb = library.find(a =>
      norm(a.artist) === normArtist &&
      norm(a.album).includes(normAlbum.slice(0, 8))
    );
  }

  if (!plexAlb) {
    // Fallback: eerste album van de artiest
    plexAlb = library.find(a => norm(a.artist) === normArtist);
  }

  return {
    artist:    artist,
    title:     title,
    album:     plexAlb?.album || album || null,
    duration:  lbzTrack.duration ? parseInt(lbzTrack.duration, 10) * 1000 : null,
    plex_key:  plexAlb?.ratingKey || null,
    cover_url: thumbUrl(plexAlb?.thumb),
    mbid:      lbzTrack.identifier?.replace('https://musicbrainz.org/recording/', '') || null,
    in_plex:   !!plexAlb,
  };
}

/**
 * Zet een JSPF-playlist (ListenBrainz formaat) om naar ons track-formaat.
 * @param {object} jspf - { playlist: { track: [...] } }
 * @returns {{ tracks, matchedCount, totalCount }}
 */
function parseJspfPlaylist(jspf) {
  const rawTracks = jspf?.playlist?.track || jspf?.track || [];
  const tracks    = rawTracks.map(t => {
    // JSPF: creator = artiest, title = titel, album = album
    const lbzTrack = {
      artist:     t.creator   || '',
      title:      t.title     || '',
      album:      t.album     || '',
      duration:   t.duration  || null,
      identifier: Array.isArray(t.identifier) ? t.identifier[0] : (t.identifier || ''),
    };
    return matchTrackToPlex(lbzTrack);
  });

  const matchedCount = tracks.filter(t => t.in_plex).length;
  return { tracks, matchedCount, totalCount: tracks.length };
}

// ── Publieke API ──────────────────────────────────────────────────────────────

/**
 * Haal alle playlists op voor een gebruiker (eigen + collaboratief).
 * @param {string} username - ListenBrainz gebruikersnaam
 * @param {string} [token]  - Optioneel auth-token voor private playlists
 * @returns {Array} [{ id, title, description, trackCount, creator, url }]
 */
async function getUserPlaylists(username, token = null) {
  if (!username) throw new Error('username is verplicht');

  const cacheKey = `lbz:playlists:${username}`;
  const cached   = getCache(cacheKey, CACHE_TTL);
  if (cached) return cached;

  try {
    const data = await lbzFetch(`/user/${encodeURIComponent(username)}/playlists`, token);
    const playlists = (data.playlists || []).map(p => ({
      id:          p.playlist?.identifier?.split('/').pop() || p.playlist?.identifier,
      title:       p.playlist?.title || 'Naamloos',
      description: p.playlist?.annotation || null,
      trackCount:  p.playlist?.track?.length || 0,
      creator:     p.playlist?.creator || username,
      url:         p.playlist?.identifier || null,
      isPublic:    p.playlist?.extension?.['https://musicbrainz.org/doc/jspf#playlist']?.public ?? true,
    }));

    setCache(cacheKey, playlists);
    return playlists;
  } catch (err) {
    logger.warn({ err, username }, 'ListenBrainz getUserPlaylists mislukt');
    throw err;
  }
}

/**
 * Haal aanbevolen playlists op voor een gebruiker.
 * @param {string} username
 * @param {string} [token]
 * @returns {Array}
 */
async function getRecommendedPlaylists(username, token = null) {
  if (!username) throw new Error('username is verplicht');

  const cacheKey = `lbz:recommendations:${username}`;
  const cached   = getCache(cacheKey, CACHE_TTL);
  if (cached) return cached;

  try {
    const data = await lbzFetch(
      `/user/${encodeURIComponent(username)}/playlists/recommendations`,
      token
    );
    const playlists = (data.playlists || []).map(p => ({
      id:          p.playlist?.identifier?.split('/').pop() || p.playlist?.identifier,
      title:       p.playlist?.title || 'Aanbevolen Playlist',
      description: p.playlist?.annotation || null,
      trackCount:  p.playlist?.track?.length || 0,
      creator:     p.playlist?.creator || 'ListenBrainz',
      url:         p.playlist?.identifier || null,
      isRecommended: true,
    }));

    setCache(cacheKey, playlists);
    return playlists;
  } catch (err) {
    logger.warn({ err, username }, 'ListenBrainz getRecommendedPlaylists mislukt');
    // Veel gebruikers hebben geen aanbevelingen → return lege array ipv error
    return [];
  }
}

/**
 * Haal een specifieke playlist op en match de tracks met Plex.
 * @param {string} playlistMbid - De playlist MBID (UUID)
 * @param {string} [token]
 * @returns {{ id, title, description, creator, tracks, matchedCount, totalCount }}
 */
async function getPlaylistDetail(playlistMbid, token = null) {
  if (!playlistMbid) throw new Error('playlistMbid is verplicht');

  const cacheKey = `lbz:playlist:${playlistMbid}`;
  const cached   = getCache(cacheKey, CACHE_TTL);
  if (cached) return cached;

  try {
    const data = await lbzFetch(`/playlist/${encodeURIComponent(playlistMbid)}`, token);
    const jspf = data.playlist || data;

    const { tracks, matchedCount, totalCount } = parseJspfPlaylist({ playlist: jspf });

    const result = {
      id:          playlistMbid,
      title:       jspf.title       || 'Naamloos',
      description: jspf.annotation  || null,
      creator:     jspf.creator     || null,
      tracks,
      matchedCount,
      totalCount,
      matchPercent: totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0,
    };

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    logger.error({ err, playlistMbid }, 'ListenBrainz getPlaylistDetail mislukt');
    throw err;
  }
}

/**
 * Importeer een ListenBrainz playlist als Discovery Engine playlist.
 * Slaat alleen tracks op die in Plex beschikbaar zijn.
 * @param {string} playlistMbid
 * @param {string} [token]
 * @returns {{ name, tracks, matchedCount, totalCount }}
 */
async function importPlaylist(playlistMbid, token = null) {
  const detail = await getPlaylistDetail(playlistMbid, token);

  // Filter: alleen tracks die in Plex zijn (voor opslaan in discovery engine)
  const plexTracks = detail.tracks.filter(t => t.in_plex).map(({ in_plex, mbid, ...t }) => t);

  return {
    name:         detail.title,
    tracks:       plexTracks,
    allTracks:    detail.tracks,
    matchedCount: detail.matchedCount,
    totalCount:   detail.totalCount,
    matchPercent: detail.matchPercent,
  };
}

module.exports = {
  getUserPlaylists,
  getRecommendedPlaylists,
  getPlaylistDetail,
  importPlaylist,
};
