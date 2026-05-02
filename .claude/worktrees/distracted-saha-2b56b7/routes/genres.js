'use strict';
// ── Genre Explorer Routes ─────────────────────────────────────────────────────

module.exports = function(app, deps) {
  const { getGenreMap, getGenreDeepDive, refreshGenres } = deps;

  // ── GET /api/genres ────────────────────────────────────────────────────────
  // Geeft het genre-overzicht: alle genres met count, topArtists en kleur.
  app.get('/api/genres', (req, res) => {
    res.set('Cache-Control', 'private, max-age=3600');
    res.json(getGenreMap());
  });

  // ── POST /api/genres/refresh ──────────────────────────────────────────────
  // Moet vóór de :genre-route geregistreerd worden zodat "refresh" niet als
  // genre-naam wordt geïnterpreteerd.
  app.post('/api/genres/refresh', (req, res) => {
    res.json(refreshGenres());
  });

  // ── GET /api/genres/:genre ────────────────────────────────────────────────
  // Genre deep dive: artiesten + albums + top tracks + related genres.
  app.get('/api/genres/:genre', (req, res) => {
    const genre = decodeURIComponent(req.params.genre || '').trim();
    if (!genre) return res.status(400).json({ error: 'genre parameter vereist' });
    res.set('Cache-Control', 'private, max-age=1800');
    res.json(getGenreDeepDive(genre));
  });
};
