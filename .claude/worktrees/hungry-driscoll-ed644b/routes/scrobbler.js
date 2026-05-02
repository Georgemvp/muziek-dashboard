// ── Scrobbler Routes ──────────────────────────────────────────────────────────
// Beheert scrobble-instellingen, log-weergave, retry en Last.fm OAuth.
'use strict';

const logger = require('../logger');

module.exports = function(app, deps) {
  const { scrobbler, getSetting, setSetting } = deps;

  if (!scrobbler) {
    logger.warn('Scrobbler niet beschikbaar; routes worden overgeslagen');
    return;
  }

  // ── GET /api/scrobbles ────────────────────────────────────────────────────
  // Geeft de laatste 50 scrobbles terug met hun status.
  app.get('/api/scrobbles', (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const rows  = scrobbler.db.getRecentScrobbles(limit);
      res.set('Cache-Control', 'private, no-cache');
      res.json({ scrobbles: rows, total: rows.length });
    } catch (err) {
      logger.error({ err }, 'GET /api/scrobbles mislukt');
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/scrobbles/retry/:id ─────────────────────────────────────────
  // Verstuur één gefaalde scrobble opnieuw.
  app.post('/api/scrobbles/retry/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Ongeldig id' });

    try {
      const row = scrobbler.db.getScrobble(id);
      if (!row) return res.status(404).json({ error: 'Scrobble niet gevonden' });

      // Reset status naar pending zodat de retry-lus hem oppikt
      if (row.lastfm_status !== 'ok')        scrobbler.db.updateScrobbleLastfm(id, 'pending');
      if (row.listenbrainz_status !== 'ok')  scrobbler.db.updateScrobbleLB(id, 'pending');

      // Verstuur direct
      await Promise.all([
        row.lastfm_status !== 'ok'
          ? scrobbler._sendLastfm(id, { artist: row.artist, track: row.track, album: row.album, timestamp: row.timestamp })
          : Promise.resolve(),
        row.listenbrainz_status !== 'ok'
          ? scrobbler._sendListenBrainz(id, { artist: row.artist, track: row.track, album: row.album, timestamp: row.timestamp })
          : Promise.resolve(),
      ]);

      const updated = scrobbler.db.getScrobble(id);
      res.json({ ok: true, scrobble: updated });
    } catch (err) {
      logger.error({ err, id }, 'Scrobble retry mislukt');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/listenbrainz/recommendations ─────────────────────────────────
  // Haal ListenBrainz aanbevelingen op voor de geconfigureerde gebruiker.
  app.get('/api/listenbrainz/recommendations', async (req, res) => {
    try {
      const playlists = await scrobbler.getLBRecommendations();
      res.set('Cache-Control', 'private, max-age=3600');
      res.json({ playlists });
    } catch (err) {
      logger.error({ err }, 'ListenBrainz recommendations ophalen mislukt');
      res.status(502).json({ error: err.message });
    }
  });

  // ── GET /api/scrobbler/settings ───────────────────────────────────────────
  // Geeft de huidige scrobbler-instellingen terug (geen geheime tokens).
  app.get('/api/scrobbler/settings', (req, res) => {
    try {
      res.set('Cache-Control', 'private, no-cache');
      res.json({
        lastfm_enabled:        !!getSetting('scrobbler', 'lastfm_enabled'),
        lastfm_connected:      !!getSetting('scrobbler', 'lastfm_session_key'),
        lastfm_username:       getSetting('scrobbler', 'lastfm_username') || null,
        lb_enabled:            !!getSetting('scrobbler', 'lb_enabled'),
        lb_username:           getSetting('scrobbler', 'lb_username') || null,
        lb_token_set:          !!(getSetting('scrobbler', 'lb_token') || ''),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/scrobbler/settings ──────────────────────────────────────────
  // Sla scrobbler-instellingen op.
  app.post('/api/scrobbler/settings', (req, res) => {
    try {
      const allowed = ['lastfm_enabled', 'lb_enabled', 'lb_token', 'lb_username'];
      for (const key of allowed) {
        if (key in req.body) {
          setSetting('scrobbler', key, req.body[key]);
        }
      }
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, 'Scrobbler settings opslaan mislukt');
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/lastfm/auth ──────────────────────────────────────────────────
  // Start de Last.fm OAuth flow: redirect naar Last.fm autorisatiepagina.
  app.get('/api/lastfm/auth', (req, res) => {
    const apiKey = scrobbler.lastfmApiKey;
    if (!apiKey) {
      return res.status(400).json({ error: 'LASTFM_API_KEY niet geconfigureerd in .env' });
    }
    // Callback URL: dezelfde host + /api/lastfm/auth/callback
    const host     = `${req.protocol}://${req.get('host')}`;
    const callback = `${host}/api/lastfm/auth/callback`;
    const authUrl  = scrobbler.getLastfmAuthUrl(callback);
    res.redirect(authUrl);
  });

  // ── GET /api/lastfm/auth/callback ─────────────────────────────────────────
  // Last.fm stuurt de gebruiker hier naartoe na autorisatie.
  app.get('/api/lastfm/auth/callback', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).send('Last.fm gaf geen token terug.');

    try {
      await scrobbler.exchangeLastfmToken(token);

      // Probeer de gebruikersnaam op te halen
      try {
        const infoParams = new URLSearchParams({
          method:  'user.getInfo',
          api_key: scrobbler.lastfmApiKey,
          sk:      scrobbler.lastfmSessionKey,
          format:  'json',
        });
        const infoRes = await fetch(`https://ws.audioscrobbler.com/2.0/?${infoParams.toString()}`);
        const info    = await infoRes.json();
        if (info?.user?.name) {
          setSetting('scrobbler', 'lastfm_username', info.user.name);
        }
      } catch { /* niet-kritiek */ }

      // Sluit het popup-venster of redirect terug naar de app
      res.send(`
        <html><head><title>Last.fm verbonden</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:40px">
          <h2>✓ Last.fm succesvol verbonden!</h2>
          <p>Je kunt dit venster sluiten.</p>
          <script>
            if (window.opener) { window.opener.postMessage('lastfm_auth_ok', '*'); window.close(); }
            else { setTimeout(() => { window.location.href = '/'; }, 2000); }
          </script>
        </body></html>
      `);
    } catch (err) {
      logger.error({ err }, 'Last.fm OAuth callback mislukt');
      res.status(500).send(`Last.fm autorisatie mislukt: ${err.message}`);
    }
  });

  // ── DELETE /api/lastfm/auth ───────────────────────────────────────────────
  // Verwijder de Last.fm sessiesleutel (ontkoppelen).
  app.delete('/api/lastfm/auth', (req, res) => {
    try {
      setSetting('scrobbler', 'lastfm_session_key', null);
      setSetting('scrobbler', 'lastfm_username', null);
      setSetting('scrobbler', 'lastfm_enabled', false);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};
