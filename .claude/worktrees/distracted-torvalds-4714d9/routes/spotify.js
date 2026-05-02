// ── Spotify API Routes ────────────────────────────────────────────────────────

const logger = require('../logger');

module.exports = function(app, deps) {
  const { lfm, SPOTIFY_OK, MOODS, searchArtistId, getRecommendations, getCache, setCache } = deps;

  // ── /api/spotify/recs ─────────────────────────────────────────────────────
  // GET /api/spotify/recs?mood=chill
  // Haalt top-5 artiesten van Last.fm, zoekt hun Spotify IDs, en roept de
  // Recommendations-API aan met mood-specifieke audio features.
  // Cache per mood, 30 minuten TTL. Graceful fallback: [] bij fout.

  app.get('/api/spotify/recs', async (req, res) => {
    if (!SPOTIFY_OK) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.json([]);
    }

    const mood = (req.query.mood || '').toLowerCase().trim();
    const audioFeatures = MOODS[mood];
    if (!audioFeatures) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.status(400).json({ error: `Onbekende mood: ${mood}. Kies uit: ${Object.keys(MOODS).join(', ')}` });
    }

    const cacheKey = `spotify:recs:${mood}`;
    const cached   = getCache(cacheKey, 30 * 60 * 1000); // 30 min TTL
    if (cached) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.json(cached);
    }

    try {
      // Haal top-5 artiesten van Last.fm (3 maanden periode)
      const top        = await lfm({ method: 'user.gettopartists', period: '3month', limit: 10 });
      const topNames   = (top.topartists?.artist || []).slice(0, 5).map(a => a.name);

      // Zoek Spotify IDs parallel
      const idResults  = await Promise.all(topNames.map(n => searchArtistId(n)));
      const seedIds    = idResults.filter(Boolean);

      if (!seedIds.length) {
        setCache(cacheKey, []);
        res.set('Cache-Control', 'private, max-age=300');
        return res.json([]);
      }

      // Haal aanbevelingen op
      const tracks = await getRecommendations(seedIds, audioFeatures);

      // Normaliseer naar bruikbaar formaat
      const result = tracks.map(t => ({
        name:        t.name,
        artist:      t.artists?.[0]?.name || '',
        album:       t.album?.name || '',
        image:       t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || null,
        preview_url: t.preview_url || null,
        spotify_url: t.external_urls?.spotify || null
      }));

      setCache(cacheKey, result);
      res.set('Cache-Control', 'private, max-age=300');
      res.json(result);
    } catch (e) {
      logger.warn({ err: e }, 'Spotify recs fout (graceful fallback)');
      res.set('Cache-Control', 'private, max-age=300');
      res.json([]);
    }
  });

  // ── /api/spotify/status ───────────────────────────────────────────────────
  app.get('/api/spotify/status', (req, res) => {
    res.set('Cache-Control', 'private, max-age=600');
    res.json({ enabled: SPOTIFY_OK, moods: SPOTIFY_OK ? Object.keys(MOODS) : [] });
  });
};
