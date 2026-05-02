// ── ListenBrainz Routes ───────────────────────────────────────────────────────
// Endpoints voor het ophalen en importeren van ListenBrainz playlists.
//
// GET  /api/listenbrainz/playlists        – Alle playlists + aanbevelingen
// GET  /api/listenbrainz/playlists/:id    – Detail van één playlist (tracks + Plex match)
// POST /api/listenbrainz/import/:id       – Importeer als Discovery Engine playlist

'use strict';

const logger = require('../logger');
const {
  getUserPlaylists,
  getRecommendedPlaylists,
  getPlaylistDetail,
  importPlaylist,
} = require('../services/listenbrainz-playlists');
const { savePlaylist, PLAYLIST_TTL } = require('../db');

// ── Haal ListenBrainz gebruikersnaam op ──────────────────────────────────────
function getLbzUser(req) {
  // Voorkeur: query param → env variabele LISTENBRAINZ_USER → Last.fm gebruiker
  return req.query.username
    || process.env.LISTENBRAINZ_USER
    || process.env.LASTFM_USER
    || null;
}

function getLbzToken(req) {
  return req.query.token
    || process.env.LISTENBRAINZ_TOKEN
    || null;
}

// ── Routes ────────────────────────────────────────────────────────────────────
module.exports = function(app, deps) {

  // GET /api/listenbrainz/playlists — alle playlists + aanbevelingen
  app.get('/api/listenbrainz/playlists', async (req, res) => {
    const username = getLbzUser(req);
    if (!username) {
      return res.status(400).json({
        error: 'Geen ListenBrainz gebruikersnaam geconfigureerd. Stel LISTENBRAINZ_USER of LASTFM_USER in.',
      });
    }

    const token = getLbzToken(req);

    try {
      const [own, recommended] = await Promise.allSettled([
        getUserPlaylists(username, token),
        getRecommendedPlaylists(username, token),
      ]);

      res.setHeader('Cache-Control', 'private, max-age=300');
      res.json({
        username,
        own:         own.status         === 'fulfilled' ? own.value         : [],
        recommended: recommended.status === 'fulfilled' ? recommended.value : [],
        own_error:        own.status         === 'rejected' ? own.reason?.message         : null,
        recommended_error:recommended.status === 'rejected' ? recommended.reason?.message : null,
      });
    } catch (err) {
      logger.error({ err, username }, 'GET /api/listenbrainz/playlists mislukt');
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/listenbrainz/playlists/:id — detail van één playlist
  app.get('/api/listenbrainz/playlists/:id', async (req, res) => {
    const { id } = req.params;
    const token  = getLbzToken(req);

    if (!id) return res.status(400).json({ error: 'id is verplicht' });

    try {
      const detail = await getPlaylistDetail(id, token);
      res.setHeader('Cache-Control', 'private, max-age=600');
      res.json(detail);
    } catch (err) {
      logger.error({ err, id }, 'GET /api/listenbrainz/playlists/:id mislukt');
      const status = err.message.includes('HTTP 404') ? 404 : 500;
      res.status(status).json({ error: err.message });
    }
  });

  // POST /api/listenbrainz/import/:id — importeer als Discovery Engine playlist
  app.post('/api/listenbrainz/import/:id', async (req, res) => {
    const { id } = req.params;
    const token  = getLbzToken(req);

    if (!id) return res.status(400).json({ error: 'id is verplicht' });

    try {
      const imported = await importPlaylist(id, token);

      if (!imported.tracks.length) {
        return res.status(422).json({
          error:        'Geen afspeelbare tracks in Plex gevonden.',
          matchedCount: 0,
          totalCount:   imported.totalCount,
          matchPercent: 0,
        });
      }

      // Sla op in discovery engine onder type 'listenbrainz'
      const playlistName = `[LBZ] ${imported.name}`;
      savePlaylist('listenbrainz', playlistName, imported.tracks, { lbz_id: id });

      logger.info({
        id,
        name:         playlistName,
        matchedCount: imported.matchedCount,
        totalCount:   imported.totalCount,
      }, 'ListenBrainz playlist geïmporteerd');

      res.json({
        ok:           true,
        name:         playlistName,
        matchedCount: imported.matchedCount,
        totalCount:   imported.totalCount,
        matchPercent: imported.matchPercent,
        track_count:  imported.tracks.length,
        // Toon ook de niet-gematchte tracks ter info
        unmatched: imported.allTracks
          .filter(t => !t.in_plex)
          .map(t => ({ artist: t.artist, title: t.title }))
          .slice(0, 20),
      });
    } catch (err) {
      logger.error({ err, id }, 'POST /api/listenbrainz/import/:id mislukt');
      const status = err.message.includes('HTTP 404') ? 404 : 500;
      res.status(status).json({ error: err.message });
    }
  });
};
