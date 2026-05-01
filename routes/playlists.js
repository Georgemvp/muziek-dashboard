// ── Playlist API Routes ───────────────────────────────────────────────────────
// Endpoints voor het genereren, cachen en afspelen van gepersonaliseerde playlists.

'use strict';

const logger = require('../logger');
const {
  generateReleaseRadar,
  generateDiscoveryWeekly,
  generateSeasonalPlaylist,
  generateDecadePlaylist,
  generateGenrePlaylist,
  generateForgottenFavorites,
  generateHiddenGems,
  generateDailyMix,
  generateCustomPlaylist,
  getAvailableGenres,
  currentSeason,
  SEASON_TAGS,
} = require('../services/playlists');
const {
  savePlaylist,
  getPlaylist,
  getAllSavedPlaylists,
  pruneExpiredPlaylists,
  PLAYLIST_TTL,
} = require('../db');

// ── Playlist-definitie-catalogus ─────────────────────────────────────────────
const PLAYLIST_CATALOG = [
  {
    type:        'discovery_weekly',
    name:        'Discovery Weekly',
    description: 'Nieuwe artiesten gebaseerd op je luistergewoonten',
    icon:        '🔭',
    params:      null,
    ttl:         PLAYLIST_TTL.discovery_weekly,
  },
  {
    type:        'release_radar',
    name:        'Release Radar',
    description: 'Nieuwe releases van artiesten die je volgt',
    icon:        '📡',
    params:      null,
    ttl:         PLAYLIST_TTL.release_radar,
  },
  {
    type:        'daily_mix',
    name:        'Daily Mix',
    description: 'Dagelijkse mix op basis van recent luistergedrag',
    icon:        '🎯',
    params:      null,
    ttl:         PLAYLIST_TTL.daily_mix,
  },
  {
    type:        'forgotten_favorites',
    name:        'Forgotten Favorites',
    description: 'Nummers die je vroeger draaide maar niet meer luistert',
    icon:        '🕰️',
    params:      null,
    ttl:         PLAYLIST_TTL.forgotten_favorites,
  },
  {
    type:        'hidden_gems',
    name:        'Hidden Gems',
    description: 'Onontdekte tracks van je favoriete artiesten',
    icon:        '💎',
    params:      null,
    ttl:         PLAYLIST_TTL.hidden_gems,
  },
];

// Decade types
const DECADES = [1960, 1970, 1980, 1990, 2000, 2010, 2020];
for (const dec of DECADES) {
  PLAYLIST_CATALOG.push({
    type:        'decade',
    name:        `${dec}s`,
    description: `De beste muziek uit de jaren ${dec}`,
    icon:        '📅',
    params:      { decade: dec },
    ttl:         PLAYLIST_TTL.decade,
  });
}

// Seasonal types
for (const [season, tags] of Object.entries(SEASON_TAGS)) {
  PLAYLIST_CATALOG.push({
    type:        'seasonal',
    name:        seasonName(season),
    description: `Muziek voor ${seasonName(season).toLowerCase()}`,
    icon:        seasonEmoji(season),
    params:      { season },
    ttl:         PLAYLIST_TTL.seasonal,
  });
}

function seasonName(s) {
  const names = {
    spring: 'Lente', summer: 'Zomer', autumn: 'Herfst', winter: 'Winter',
    halloween: 'Halloween', christmas: 'Kerstmis', valentines: 'Valentijnsdag',
  };
  return names[s] || s;
}

function seasonEmoji(s) {
  const emojis = {
    spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️',
    halloween: '🎃', christmas: '🎄', valentines: '❤️',
  };
  return emojis[s] || '🎵';
}

// ── Generator map ─────────────────────────────────────────────────────────────
async function runGenerator(type, params) {
  switch (type) {
    case 'discovery_weekly':   return generateDiscoveryWeekly();
    case 'release_radar':      return generateReleaseRadar();
    case 'daily_mix':          return generateDailyMix();
    case 'forgotten_favorites':return generateForgottenFavorites();
    case 'hidden_gems':        return generateHiddenGems();
    case 'decade':             return generateDecadePlaylist(params?.decade);
    case 'seasonal':           return generateSeasonalPlaylist(params?.season);
    case 'genre':              return generateGenrePlaylist(params?.genre);
    case 'custom':             return generateCustomPlaylist(params?.seeds || []);
    default: throw new Error(`Onbekend playlist-type: ${type}`);
  }
}

function playlistDisplayName(type, params) {
  switch (type) {
    case 'decade':   return `${params?.decade || ''}s`;
    case 'seasonal': return seasonName(params?.season || '');
    case 'genre':    return `${params?.genre || 'Genre'} Mix`;
    case 'custom':   return `Mix: ${(params?.seeds || []).slice(0, 2).join(', ')}`;
    default:
      return PLAYLIST_CATALOG.find(p => p.type === type && !p.params)?.name || type;
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────
module.exports = function(app, deps) {

  // GET /api/playlists — alle bekende playlist-types + genre-lijst
  app.get('/api/playlists', async (req, res) => {
    try {
      const saved = getAllSavedPlaylists();
      const savedMap = new Map(
        saved.map(p => [`${p.type}:${p.params ? JSON.stringify(p.params) : ''}`, p])
      );

      const catalog = PLAYLIST_CATALOG.map(def => {
        const key = `${def.type}:${def.params ? JSON.stringify(def.params) : ''}`;
        const cached = savedMap.get(key);
        return {
          ...def,
          cached:      !!cached,
          track_count: cached?.track_count || 0,
          generated_at:cached?.generated_at || null,
          expires_at:  cached?.expires_at || null,
        };
      });

      // Beschikbare genres uit Last.fm/Plex (async, best-effort)
      let genres = [];
      try {
        genres = await getAvailableGenres();
      } catch {}

      res.setHeader('Cache-Control', 'private, max-age=60');
      res.json({
        catalog,
        genres,
        current_season: currentSeason(),
        saved_count: saved.length,
      });
    } catch (err) {
      logger.error({ err }, 'GET /api/playlists mislukt');
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/playlists/cached — alle gecachede playlists (metadata only)
  app.get('/api/playlists/cached', (req, res) => {
    try {
      const saved = getAllSavedPlaylists();
      res.setHeader('Cache-Control', 'private, max-age=30');
      res.json({ playlists: saved });
    } catch (err) {
      logger.error({ err }, 'GET /api/playlists/cached mislukt');
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/playlists/generate/:type — genereer een playlist (met cache)
  app.get('/api/playlists/generate/:type', async (req, res) => {
    const { type } = req.params;
    const { decade, genre, season, seeds, force } = req.query;

    // Bouw params-object
    let params = null;
    if (type === 'decade')   params = { decade: parseInt(decade, 10) || 1990 };
    if (type === 'seasonal') params = { season: season || currentSeason() };
    if (type === 'genre')    params = { genre: genre || 'rock' };
    if (type === 'custom')   params = { seeds: seeds ? seeds.split(',').map(s => s.trim()) : [] };

    // Check cache (tenzij force=true)
    if (force !== 'true') {
      const cached = getPlaylist(type, params);
      if (cached) {
        logger.debug({ type, params }, 'Playlist uit cache geserveerd');
        res.setHeader('Cache-Control', 'private, max-age=300');
        return res.json({ cached: true, ...cached });
      }
    }

    // Genereer nieuwe playlist
    logger.info({ type, params }, 'Playlist genereren gestart');
    const startTime = Date.now();

    try {
      const tracks = await runGenerator(type, params);
      const name   = playlistDisplayName(type, params);
      const dur    = Date.now() - startTime;

      // Sla op in database
      savePlaylist(type, name, tracks, params);

      logger.info({ type, params, tracks: tracks.length, durationMs: dur }, 'Playlist gegenereerd');

      res.setHeader('Cache-Control', 'private, max-age=300');
      const saved = getPlaylist(type, params);
      res.json({ cached: false, ...saved });
    } catch (err) {
      logger.error({ type, params, err }, 'Playlist generatie mislukt');
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/playlists/refresh/:type — forceer regeneratie (achtergrond)
  app.post('/api/playlists/refresh/:type', async (req, res) => {
    const { type } = req.params;
    const { decade, genre, season } = req.query;
    const { seeds } = req.body || {};

    let params = null;
    if (type === 'decade')   params = { decade: parseInt(decade, 10) || 1990 };
    if (type === 'seasonal') params = { season: season || currentSeason() };
    if (type === 'genre')    params = { genre: genre || 'rock' };
    if (type === 'custom')   params = { seeds: seeds || [] };

    // Start async regeneratie, return meteen
    res.json({ ok: true, building: true, type, params });

    // Achtergrond
    (async () => {
      try {
        logger.info({ type, params }, 'Playlist refresh gestart');
        const tracks = await runGenerator(type, params);
        const name   = playlistDisplayName(type, params);
        savePlaylist(type, name, tracks, params);
        logger.info({ type, params, tracks: tracks.length }, 'Playlist refresh klaar');
      } catch (err) {
        logger.error({ type, params, err }, 'Playlist refresh mislukt');
      }
    })();
  });

  // POST /api/playlists/play/:type — genereer en start afspelen via Plex
  app.post('/api/playlists/play/:type', async (req, res) => {
    const { type } = req.params;
    const { machineId, decade, genre, season } = req.query;
    const { seeds } = req.body || {};

    if (!machineId) {
      return res.status(400).json({ error: 'machineId is vereist' });
    }

    let params = null;
    if (type === 'decade')   params = { decade: parseInt(decade, 10) || 1990 };
    if (type === 'seasonal') params = { season: season || currentSeason() };
    if (type === 'genre')    params = { genre };
    if (type === 'custom')   params = { seeds: seeds || [] };

    try {
      // Haal de playlist op (of genereer hem)
      let playlist = getPlaylist(type, params);
      if (!playlist) {
        const tracks = await runGenerator(type, params);
        const name   = playlistDisplayName(type, params);
        savePlaylist(type, name, tracks, params);
        playlist = getPlaylist(type, params);
      }

      if (!playlist?.tracks?.length) {
        return res.status(404).json({ error: 'Geen tracks gevonden in playlist' });
      }

      // Pak de eerste track met een plex_key
      const firstTrack = playlist.tracks.find(t => t.plex_key);
      if (!firstTrack) {
        return res.status(422).json({
          error: 'Geen afspeelbare tracks (geen plex_key). Discovery-playlists zijn alleen ter ontdekking.',
        });
      }

      const { playOnClient } = deps;
      await playOnClient(machineId, firstTrack.plex_key);

      res.json({ ok: true, playing: firstTrack, track_count: playlist.tracks.length });
    } catch (err) {
      logger.error({ type, params, err }, 'Playlist afspelen mislukt');
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/playlists/:type — verwijder gecachede playlist
  app.delete('/api/playlists/:type', (req, res) => {
    const { type } = req.params;
    const { decade, genre, season } = req.query;

    let params = null;
    if (type === 'decade')   params = { decade: parseInt(decade, 10) };
    if (type === 'seasonal') params = { season };
    if (type === 'genre')    params = { genre };

    try {
      pruneExpiredPlaylists();
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};
