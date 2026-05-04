// ── Spotify API Routes — redirect stubs ───────────────────────────────────────
//
// Deze routes zijn gemigreerd naar de Python Core backend
// (core/routes/spotify.py).  De stubs hieronder zorgen voor
// backwards-compatibiliteit van bestaande bookmarks/links.
//
// De frontend gebruikt nu direct /api/core/spotify/* (bijgewerkt in de JS-views).

module.exports = function(app, _deps) {
  app.get('/api/spotify/recs',   (req, res) => res.redirect(302, `/api/core/spotify/recs${req.url.slice('/api/spotify/recs'.length)}`));
  app.get('/api/spotify/status', (req, res) => res.redirect(302, '/api/core/spotify/status'));
};
