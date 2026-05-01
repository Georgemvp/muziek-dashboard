// ── Mirrored Playlists Service ────────────────────────────────────────────────
// Spiegelt playlists van Spotify, Deezer, YouTube Music en Tidal.
// Matcht tracks met de Plex-bibliotheek en initieert downloads via de orchestrator.

'use strict';

const logger = require('../logger');
const { normalize, matchTrack } = require('../utils/matching');

const {
  getAllMirroredPlaylists, getMirroredPlaylist, getMirroredPlaylistByUrl,
  createMirroredPlaylist, updateMirroredPlaylist, deleteMirroredPlaylist,
  getDueMirroredPlaylists, getMirroredTracks, getPendingMirroredTracks,
  getUnmatchedMirroredTracks, upsertMirroredTrack, updateMirroredTrackMatch,
  updateMirroredTrackStatus, setMirroredTrackUnmatched,
  deleteMirroredTracksByPlaylist, getMirroredPlaylistCounts, getMirroredTrack,
} = require('../db');

// ── Tekst-normalisatie helpers ────────────────────────────────────────────────
// Lokale alias voor backwards-compat (intern gebruik)
const normText = normalize;

// ── Platform-detector ─────────────────────────────────────────────────────────

/**
 * Detecteer het platform aan de hand van de URL.
 * @returns {'spotify'|'deezer'|'youtube'|'tidal'|null}
 */
function detectPlatform(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes('spotify.com'))                        return 'spotify';
  if (u.includes('deezer.com'))                         return 'deezer';
  if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('music.youtube.com')) return 'youtube';
  if (u.includes('tidal.com'))                          return 'tidal';
  return null;
}

/**
 * Extraheer het playlist-ID uit een URL.
 */
function extractPlaylistId(url, platform) {
  try {
    const u = new URL(url);
    switch (platform) {
      case 'spotify': {
        // https://open.spotify.com/playlist/{id}
        const m = u.pathname.match(/\/playlist\/([A-Za-z0-9]+)/);
        return m ? m[1] : null;
      }
      case 'deezer': {
        // https://www.deezer.com/playlist/{id} of /nl/playlist/{id}
        const m = u.pathname.match(/\/playlist\/(\d+)/);
        return m ? m[1] : null;
      }
      case 'youtube': {
        // https://www.youtube.com/playlist?list={id}
        return u.searchParams.get('list') || null;
      }
      case 'tidal': {
        // https://tidal.com/browse/playlist/{uuid}
        const m = u.pathname.match(/\/playlist\/([a-f0-9-]+)/i);
        return m ? m[1] : null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// ── Platform fetchers ─────────────────────────────────────────────────────────

/**
 * Haal tracks op van een Spotify-playlist.
 * Gebruikt de Client Credentials flow via services/spotify.js.
 * @returns {{ name: string, tracks: Array<{title,artist,album,source_id}> }}
 */
async function fetchSpotifyPlaylist(playlistId) {
  // Laad Spotify service dynamisch (wordt alleen gebruikt als credentials aanwezig zijn)
  let spotifyGet;
  try {
    const spotifyService = require('./spotify');
    spotifyGet = spotifyService._spotifyGet;
    if (!spotifyGet) {
      // Fallback: bouw eigen getToken/get op basis van omgevingsvariabelen
      const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
      const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
      if (!CLIENT_ID || !CLIENT_SECRET) throw new Error('Spotify credentials niet geconfigureerd');

      let _token = null, _tokenExp = 0;
      async function getToken() {
        if (_token && Date.now() < _tokenExp - 60_000) return _token;
        const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
        const res = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'grant_type=client_credentials',
          signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) throw new Error(`Spotify token fout ${res.status}`);
        const d = await res.json();
        _token = d.access_token;
        _tokenExp = Date.now() + d.expires_in * 1000;
        return _token;
      }
      spotifyGet = async (path, params = {}) => {
        const token = await getToken();
        const url = new URL(`https://api.spotify.com${path}`);
        for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
        const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) });
        if (!res.ok) throw new Error(`Spotify API fout ${res.status}`);
        return res.json();
      };
    }
  } catch (err) {
    throw new Error(`Spotify service niet beschikbaar: ${err.message}`);
  }

  // Haal playlist-metadata op
  const meta   = await spotifyGet(`/v1/playlists/${playlistId}`, { fields: 'name,description' });
  const name   = meta.name || 'Spotify Playlist';
  const tracks = [];

  // Pagineer door alle tracks (max 100 per request)
  let offset = 0;
  const limit = 100;
  while (true) {
    const data = await spotifyGet(`/v1/playlists/${playlistId}/tracks`, {
      fields: 'next,items(track(id,name,artists,album(name)))',
      limit,
      offset,
    });
    const items = data.items || [];
    for (const item of items) {
      const t = item.track;
      if (!t || !t.name) continue;
      tracks.push({
        title:     t.name,
        artist:    t.artists?.[0]?.name || '',
        album:     t.album?.name || null,
        source_id: t.id,
      });
    }
    if (!data.next || items.length < limit) break;
    offset += limit;
    if (offset > 2000) break; // veiligheidsgrens
  }

  return { name, tracks };
}

/**
 * Haal tracks op van een Deezer-playlist (publieke API, geen auth vereist).
 */
async function fetchDeezerPlaylist(playlistId) {
  const base = `https://api.deezer.com/playlist/${playlistId}`;
  const metaRes = await fetch(base, { signal: AbortSignal.timeout(10_000) });
  if (!metaRes.ok) throw new Error(`Deezer API fout ${metaRes.status}`);
  const meta = await metaRes.json();
  if (meta.error) throw new Error(`Deezer: ${meta.error.message || JSON.stringify(meta.error)}`);

  const name   = meta.title || 'Deezer Playlist';
  const tracks = [];

  // Pagineer
  let url = `${base}/tracks?limit=100&index=0`;
  while (url) {
    const res  = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) break;
    const data = await res.json();
    const items = data.data || [];
    for (const t of items) {
      if (!t.title) continue;
      tracks.push({
        title:     t.title,
        artist:    t.artist?.name || '',
        album:     t.album?.title || null,
        source_id: String(t.id),
      });
    }
    url = data.next || null;
    if (tracks.length > 2000) break; // veiligheidsgrens
  }

  return { name, tracks };
}

/**
 * Haal tracks op van een YouTube Music playlist via yt-dlp (JSON metadata, geen download).
 * Vereist dat yt-dlp aanwezig is in de container.
 */
async function fetchYouTubePlaylist(playlistId) {
  const { execFile } = require('child_process');
  const { promisify } = require('util');
  const execFileAsync = promisify(execFile);

  const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;

  let stdout;
  try {
    const result = await execFileAsync('yt-dlp', [
      '--flat-playlist',
      '--dump-single-json',
      '--no-warnings',
      '--extractor-args', 'youtube:lang=nl',
      playlistUrl,
    ], { timeout: 60_000, maxBuffer: 50 * 1024 * 1024 });
    stdout = result.stdout;
  } catch (err) {
    throw new Error(`yt-dlp mislukt: ${err.message}`);
  }

  let meta;
  try { meta = JSON.parse(stdout); }
  catch { throw new Error('yt-dlp retourneerde geen geldige JSON'); }

  const name   = meta.title || 'YouTube Playlist';
  const tracks = [];

  for (const entry of (meta.entries || [])) {
    if (!entry) continue;
    // YouTube Music-titels hebben vaak het formaat "Titel - Artiest"
    const rawTitle = entry.title || '';
    let title  = rawTitle;
    let artist = entry.uploader || entry.channel || '';

    // Probeer "Titel - Artiest" of "Artiest - Titel" te parsen
    const dashMatch = rawTitle.match(/^(.+?)\s+[-–—]\s+(.+)$/);
    if (dashMatch) {
      // Heuristiek: tweede deel is vaak artiest als het korter is
      title  = dashMatch[1].trim();
      artist = dashMatch[2].trim();
    }

    tracks.push({
      title,
      artist,
      album:     null,
      source_id: entry.id || null,
    });
  }

  return { name, tracks };
}

/**
 * Haal tracks op van een Tidal-playlist via de Tidarr API.
 * Als Tidarr geen playlist-endpoint biedt, probeer dan via OrpheusDL.
 */
async function fetchTidalPlaylist(playlistId, deps = {}) {
  const TIDARR_URL = process.env.TIDARR_URL || 'http://localhost:8484';
  const TIDARR_API_KEY = process.env.TIDARR_API_KEY || '';

  const headers = {};
  if (TIDARR_API_KEY) headers['X-Api-Key'] = TIDARR_API_KEY;

  // Probeer Tidarr playlist-endpoint
  try {
    const res = await fetch(`${TIDARR_URL}/api/playlist/${playlistId}`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const data = await res.json();
      const name   = data.title || data.name || 'Tidal Playlist';
      const items  = data.tracks || data.items || [];
      const tracks = items.map(t => ({
        title:     t.title || t.name || '',
        artist:    t.artist?.name || t.artistName || '',
        album:     t.album?.title || t.albumName || null,
        source_id: String(t.id || ''),
      })).filter(t => t.title);
      return { name, tracks };
    }
  } catch {
    // Tidarr heeft geen playlist-endpoint, probeer OrpheusDL
  }

  // Fallback: OrpheusDL playlist info
  const ORPHEUS_URL = process.env.ORPHEUS_URL || 'http://localhost:5000';
  try {
    const res = await fetch(`${ORPHEUS_URL}/api/url-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: `https://tidal.com/browse/playlist/${playlistId}` }),
      signal: AbortSignal.timeout(20_000),
    });
    if (res.ok) {
      const data   = await res.json();
      const name   = data.name || data.title || 'Tidal Playlist';
      const items  = data.tracks || [];
      const tracks = items.map(t => ({
        title:     t.name || t.title || '',
        artist:    t.artist || '',
        album:     t.album || null,
        source_id: String(t.id || ''),
      })).filter(t => t.title);
      return { name, tracks };
    }
  } catch {
    // OrpheusDL ook niet beschikbaar
  }

  throw new Error('Tidal playlist ophalen mislukt: Tidarr noch OrpheusDL beschikbaar');
}

// ── Plex matching ─────────────────────────────────────────────────────────────

/**
 * Match een track-lijst met de Plex-bibliotheek.
 * Gebruikt de matching engine voor consistente fuzzy matching.
 * Stap 1: artiest-herkenning via in-memory Plex-artistmap.
 * Stap 2: track-zoeken via Plex search API + matchTrack-scoring.
 *
 * @param {Array<{id, source_title, source_artist}>} tracks
 * @param {object} deps - { getPlexArtistNames, getPlexLibrary, plexGet }
 * @returns {Promise<Array<{id, match_status, matched_plex_key, match_confidence}>>}
 */
async function matchTracksWithPlex(tracks, deps) {
  const { getPlexArtistNames, getPlexLibrary } = deps;

  const artistMap = getPlexArtistNames ? getPlexArtistNames() : new Map();
  const results   = [];

  // Cache de muziek-sectie eenmalig
  let musicSectionKey = null;
  try {
    const sections = deps.plexGet ? await deps.plexGet('/library/sections') : null;
    const music    = sections?.MediaContainer?.Directory?.find(s => s.type === 'artist');
    musicSectionKey = music?.key ?? null;
  } catch {
    // Plex niet bereikbaar – valt terug op artiest-only score
  }

  for (const track of tracks) {
    const query = {
      artist: track.source_artist || '',
      title:  track.source_title  || '',
    };

    // ── Stap 1: Artiest-matching tegen Plex-artiestenlijst ─────────────────
    let bestArtistScore = 0;
    for (const [plexName] of artistMap) {
      const result = matchTrack(
        { artist: query.artist, title: query.title },
        { artist: plexName,     title: query.title }, // titel gelijk houden → isoleert artiest-score
      );
      // Haal de artiest-deelScore uit de confidence (artiest telt 35%)
      // Eenvoudiger: match alleen op artiest door een perfecte titelmatch in te voeren
      if (result.confidence > bestArtistScore) {
        bestArtistScore = result.confidence;
      }
    }

    if (bestArtistScore >= 0.65 && musicSectionKey && deps.plexGet) {
      // ── Stap 2: Zoek track via Plex search API ────────────────────────────
      try {
        const searchRes = await deps.plexGet(
          `/library/sections/${musicSectionKey}/search?type=10&query=${encodeURIComponent(track.source_title)}&limit=8`
        );
        const candidates = (searchRes?.MediaContainer?.Metadata || []).map(c => ({
          _plexKey: c.ratingKey,
          artist:   c.grandparentTitle || c.originalTitle || '',
          title:    c.title || '',
          duration: c.duration ? Math.round(c.duration / 1000) : undefined,
        }));

        let bestCandidate  = null;
        let bestConfidence = 0;

        for (const c of candidates) {
          const { confidence } = matchTrack(query, c);
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestCandidate  = c;
          }
        }

        if (bestCandidate && bestConfidence >= 0.65) {
          results.push({
            id:               track.id,
            match_status:     'matched',
            matched_plex_key: bestCandidate._plexKey,
            match_confidence: Math.round(bestConfidence * 100) / 100,
          });
          continue;
        }
      } catch (err) {
        logger.debug({ err, track: track.source_title }, 'Plex track search fout, gebruik artiest-score');
      }
    }

    // Artiest herkend maar track niet gevonden, of artiest onbekend
    results.push({
      id:               track.id,
      match_status:     'unmatched',
      matched_plex_key: null,
      match_confidence: Math.round(bestArtistScore * 0.5 * 100) / 100,
    });
  }

  return results;
}

// ── Service API ───────────────────────────────────────────────────────────────

/**
 * Voeg een nieuwe playlist toe. Detecteert platform, haalt tracks op en matcht.
 * @param {string} url - De bron-URL van de playlist
 * @param {object} [options] - { auto_sync, sync_interval_hours, auto_download, download_quality }
 * @param {object} deps - Gedeelde dependencies (plexGet, enz.)
 * @returns {object} De aangemaakte playlist
 */
async function add(url, options = {}, deps = {}) {
  const platform = detectPlatform(url);
  if (!platform) throw new Error(`Onbekend platform voor URL: ${url}`);

  // Voorkom duplicaten
  const existing = getMirroredPlaylistByUrl(url);
  if (existing) throw new Error(`Playlist bestaat al (id ${existing.id})`);

  const playlistId = extractPlaylistId(url, platform);
  if (!playlistId) throw new Error(`Kan playlist-ID niet extraheren uit: ${url}`);

  logger.info({ platform, playlistId }, 'Mirrored playlist toevoegen');

  // Haal tracks op van de bron
  let fetchResult;
  switch (platform) {
    case 'spotify': fetchResult = await fetchSpotifyPlaylist(playlistId, deps); break;
    case 'deezer':  fetchResult = await fetchDeezerPlaylist(playlistId);        break;
    case 'youtube': fetchResult = await fetchYouTubePlaylist(playlistId);       break;
    case 'tidal':   fetchResult = await fetchTidalPlaylist(playlistId, deps);   break;
    default: throw new Error(`Niet ondersteund platform: ${platform}`);
  }

  const { name, tracks } = fetchResult;

  // Sla playlist op
  const playlist = createMirroredPlaylist({
    name,
    source_platform: platform,
    source_url:      url,
    source_id:       playlistId,
    auto_sync:           options.auto_sync           ?? 1,
    sync_interval_hours: options.sync_interval_hours ?? 24,
    auto_download:       options.auto_download       ?? 0,
    download_quality:    options.download_quality    ?? 'flac',
  });

  // Sla tracks op
  for (const t of tracks) {
    upsertMirroredTrack({
      playlist_id:  playlist.id,
      source_title: t.title,
      source_artist: t.artist,
      source_album: t.album || null,
      source_id:    t.source_id || null,
    });
  }

  // Match met Plex
  await matchTracks(playlist.id, deps);

  // Update tellers
  const { total, matched } = getMirroredPlaylistCounts(playlist.id);
  updateMirroredPlaylist(playlist.id, {
    track_count:   total,
    matched_count: matched,
    last_synced:   Math.floor(Date.now() / 1000),
  });

  logger.info({ playlistId: playlist.id, name, total, matched }, 'Mirrored playlist toegevoegd');
  return getMirroredPlaylist(playlist.id);
}

/**
 * Sync één playlist: haal nieuwe tracks op en match ontbrekenden.
 */
async function sync(playlistId, deps = {}) {
  const playlist = getMirroredPlaylist(playlistId);
  if (!playlist) throw new Error(`Playlist niet gevonden: ${playlistId}`);

  logger.info({ playlistId, platform: playlist.source_platform }, 'Syncing mirrored playlist');

  let fetchResult;
  switch (playlist.source_platform) {
    case 'spotify': fetchResult = await fetchSpotifyPlaylist(playlist.source_id, deps); break;
    case 'deezer':  fetchResult = await fetchDeezerPlaylist(playlist.source_id);        break;
    case 'youtube': fetchResult = await fetchYouTubePlaylist(playlist.source_id);       break;
    case 'tidal':   fetchResult = await fetchTidalPlaylist(playlist.source_id, deps);   break;
    default: throw new Error(`Niet ondersteund platform: ${playlist.source_platform}`);
  }

  const { name, tracks } = fetchResult;

  // Verwijder bestaande tracks en voeg nieuwe in (volledige refresh)
  deleteMirroredTracksByPlaylist(playlistId);
  for (const t of tracks) {
    upsertMirroredTrack({
      playlist_id:   playlistId,
      source_title:  t.title,
      source_artist: t.artist,
      source_album:  t.album || null,
      source_id:     t.source_id || null,
    });
  }

  // Match met Plex
  await matchTracks(playlistId, deps);

  // Update metadata
  const { total, matched } = getMirroredPlaylistCounts(playlistId);
  const updated = updateMirroredPlaylist(playlistId, {
    name,
    track_count:   total,
    matched_count: matched,
    last_synced:   Math.floor(Date.now() / 1000),
  });

  logger.info({ playlistId, total, matched }, 'Mirrored playlist gesynchroniseerd');
  return updated;
}

/**
 * Sync alle playlists waarvan de sync-interval verstreken is.
 */
async function syncAll(deps = {}) {
  const due = getDueMirroredPlaylists();
  logger.info({ count: due.length }, 'Auto-sync mirrored playlists');

  const results = [];
  for (const pl of due) {
    try {
      const result = await sync(pl.id, deps);
      results.push({ id: pl.id, success: true, result });
    } catch (err) {
      logger.warn({ id: pl.id, err }, 'Mirrored playlist sync mislukt');
      results.push({ id: pl.id, success: false, error: err.message });
    }
  }
  return results;
}

/**
 * Match alle pending/unmatched tracks van een playlist met Plex.
 */
async function matchTracks(playlistId, deps = {}) {
  const tracks = getMirroredTracks(playlistId).filter(
    t => t.match_status === 'pending' || (t.match_status === 'unmatched' && !t.unmatched)
  );

  if (!tracks.length) return { matched: 0, unmatched: 0 };

  const results = await matchTracksWithPlex(tracks, deps);
  let matched = 0, unmatched = 0;

  for (const r of results) {
    updateMirroredTrackMatch(r.id, {
      match_status:     r.match_status,
      matched_plex_key: r.matched_plex_key,
      match_confidence: r.match_confidence,
    });
    if (r.match_status === 'matched') matched++;
    else unmatched++;
  }

  // Herbereken tellers
  const counts = getMirroredPlaylistCounts(playlistId);
  updateMirroredPlaylist(playlistId, {
    track_count:   counts.total,
    matched_count: counts.matched,
  });

  return { matched, unmatched };
}

/**
 * Download alle unmatched tracks via de download-orchestrator.
 */
async function downloadMissing(playlistId, deps = {}) {
  const playlist = getMirroredPlaylist(playlistId);
  if (!playlist) throw new Error(`Playlist niet gevonden: ${playlistId}`);

  const tracks  = getUnmatchedMirroredTracks(playlistId);
  const quality = playlist.download_quality || 'flac';

  logger.info({ playlistId, count: tracks.length, quality }, 'Downloading missing tracks');

  const jobs = [];
  for (const track of tracks) {
    try {
      // Markeer als downloading
      updateMirroredTrackStatus(track.id, 'downloading');

      // Gebruik orchestrator als beschikbaar
      if (deps.downloadOrchestrator) {
        const job = await deps.downloadOrchestrator.queueDownload({
          query:   `${track.source_artist} ${track.source_title}`,
          artist:  track.source_artist,
          album:   track.source_album || undefined,
          quality,
          source:  `mirrored_playlist:${playlistId}`,
          metadata: { mirroredTrackId: track.id, playlistId },
        });
        jobs.push({ trackId: track.id, jobId: job?.id });
      } else {
        // Geen orchestrator: markeer terug als unmatched
        updateMirroredTrackStatus(track.id, 'unmatched');
      }
    } catch (err) {
      logger.warn({ trackId: track.id, err }, 'Download queuen mislukt');
      updateMirroredTrackStatus(track.id, 'unmatched');
    }
  }

  return { queued: jobs.length, total: tracks.length };
}

/**
 * Haal een playlist op inclusief bijgewerkte track-statistieken.
 */
function getPlaylistWithStats(playlistId) {
  const playlist = getMirroredPlaylist(playlistId);
  if (!playlist) return null;
  const counts = getMirroredPlaylistCounts(playlistId);
  return { ...playlist, track_count: counts.total, matched_count: counts.matched };
}

module.exports = {
  add,
  sync,
  syncAll,
  matchTracks,
  downloadMissing,
  detectPlatform,
  getPlaylistWithStats,
  // DB-wrappers (voor routes)
  getAllMirroredPlaylists,
  getMirroredPlaylist,
  deleteMirroredPlaylist,
  getMirroredTracks,
  setMirroredTrackUnmatched,
  updateMirroredPlaylist,
  getMirroredPlaylistCounts,
};
