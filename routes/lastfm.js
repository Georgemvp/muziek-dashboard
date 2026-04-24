// ── Last.fm API Routes ────────────────────────────────────────────────────────

const logger = require('../logger');

// Last.fm bereikbaarheidsstatus
let lastFmDown = false;
let lastFmDownSince = null;

function markLastFmDown() {
  if (!lastFmDown) { lastFmDown = true; lastFmDownSince = Date.now(); }
}

function markLastFmUp() {
  lastFmDown = false; lastFmDownSince = null;
}

/**
 * Geeft stale gecachede data terug als Last.fm onbereikbaar is,
 * met een _stale: true vlag zodat de frontend dit kan tonen.
 */
function staleOrError(cacheKey, err, res, { getCache }) {
  const stale = getCache(cacheKey, Infinity);
  if (stale) {
    markLastFmDown();
    return res.json({ ...stale, _stale: true, _staleReason: err.message });
  }
  markLastFmDown();
  res.status(503).json({ error: 'Last.fm is tijdelijk niet bereikbaar en er is geen gecachede data beschikbaar.', _lfmDown: true });
}

module.exports = function(app, deps) {
  const { lfm, getSimilarArtists, getCache, setCache } = deps;

  // ── /api/user ──────────────────────────────────────────────────────────────
  app.get('/api/user', async (req, res) => {
    try {
      // Cache-check gebeurt nu in lfm() zelf (voor throttle)
      const data = await lfm(
        { method: 'user.getinfo' },
        { cacheKey: 'api:user', cacheTTL: 300_000 }
      );
      markLastFmUp();
      res.set('Cache-Control', 'private, max-age=600');
      res.json(data);
    } catch (e) { staleOrError('api:user', e, res, deps); }
  });

  // ── /api/recent ────────────────────────────────────────────────────────────
  app.get('/api/recent', async (req, res) => {
    try {
      // Cache-check gebeurt nu in lfm() zelf (voor throttle)
      const data = await lfm(
        { method: 'user.getrecenttracks', limit: 20 },
        { cacheKey: 'api:recent', cacheTTL: 120_000 }
      );
      markLastFmUp();
      res.set('Cache-Control', 'private, max-age=30');
      res.json(data);
    } catch (e) { staleOrError('api:recent', e, res, deps); }
  });

  // ── /api/topartists ────────────────────────────────────────────────────────
  app.get('/api/topartists', async (req, res) => {
    try {
      const period = req.query.period || '7day';
      const cacheKey = `api:topartists:${period}`;
      // Cache-check gebeurt nu in lfm() zelf (voor throttle)
      const data = await lfm(
        { method: 'user.gettopartists', period, limit: 20 },
        { cacheKey, cacheTTL: 300_000 }
      );
      markLastFmUp();
      res.set('Cache-Control', 'private, max-age=300');
      res.json(data);
    } catch (e) { staleOrError(`api:topartists:${req.query.period || '7day'}`, e, res, deps); }
  });

  // ── /api/top/artists — artiesten + topTag voor genre donut ───────────────
  app.get('/api/top/artists', async (req, res) => {
    try {
      const period   = req.query.period || '7day';
      const cacheKey = `api:top:artists:${period}`;

      // Korte aggregate-cache (5 min)
      const cached = getCache(cacheKey, 300_000);
      if (cached) {
        res.set('Cache-Control', 'private, max-age=300');
        return res.json(cached);
      }

      // Haal top-artiesten op (gedeelde cache met /api/topartists)
      const artistData = await lfm(
        { method: 'user.gettopartists', period, limit: 20 },
        { cacheKey: `api:topartists:${period}`, cacheTTL: 300_000 }
      );
      markLastFmUp();

      const stopwords = new Set([
        'seen live', 'listened', 'favourite', 'favorites', 'love', 'loved',
        'awesome', 'cool', 'good', 'great', 'american', 'british', 'german',
        'swedish', 'norwegian', 'dutch', 'canadian', 'australian',
      ]);

      const artists = (artistData.topartists?.artist || []).slice(0, 20);

      // Haal tags parallel op — 24-uurs cache per artiest
      const tagResults = await Promise.allSettled(
        artists.map(a => lfm(
          { method: 'artist.gettoptags', artist: a.name },
          { includeUser: false, cacheKey: `tags:${a.name.toLowerCase()}`, cacheTTL: 86_400_000 }
        ))
      );

      const enriched = artists.map((a, i) => {
        let topTag = null;
        if (tagResults[i].status === 'fulfilled') {
          const tags = tagResults[i].value?.toptags?.tag || [];
          for (const tag of tags) {
            const name = (tag.name || '').toLowerCase().trim();
            if (name.length > 2 && !stopwords.has(name) && !/^\d+$/.test(name)) {
              topTag = tag.name;
              break;
            }
          }
        }
        return { ...a, topTag };
      });

      const result = {
        ...artistData,
        topartists: { ...artistData.topartists, artist: enriched },
      };

      setCache(cacheKey, result);
      res.set('Cache-Control', 'private, max-age=300');
      res.json(result);
    } catch (e) { staleOrError(`api:top:artists:${req.query.period || '7day'}`, e, res, deps); }
  });

  // ── /api/toptracks ────────────────────────────────────────────────────────
  app.get('/api/toptracks', async (req, res) => {
    try {
      const period = req.query.period || '7day';
      const cacheKey = `api:toptracks:${period}`;
      // Cache-check gebeurt nu in lfm() zelf (voor throttle)
      const data = await lfm(
        { method: 'user.gettoptracks', period, limit: 20 },
        { cacheKey, cacheTTL: 300_000 }
      );
      markLastFmUp();
      res.set('Cache-Control', 'private, max-age=300');
      res.json(data);
    } catch (e) { staleOrError(`api:toptracks:${req.query.period || '7day'}`, e, res, deps); }
  });

  // ── /api/loved ─────────────────────────────────────────────────────────────
  app.get('/api/loved', async (req, res) => {
    try {
      // Cache-check gebeurt nu in lfm() zelf (voor throttle)
      const data = await lfm(
        { method: 'user.getlovedtracks', limit: 20 },
        { cacheKey: 'api:loved', cacheTTL: 600_000 }
      );
      markLastFmUp();
      res.set('Cache-Control', 'private, max-age=600');
      res.json(data);
    } catch (e) { staleOrError('api:loved', e, res, deps); }
  });

  // ── /api/recs ──────────────────────────────────────────────────────────────
  app.get('/api/recs', async (req, res) => {
    const t0 = Date.now();
    try {
      // Cache key rotates every 2 hours to ensure fresh seed rotation
      const cacheKeyRotation = Math.floor(Date.now() / 7_200_000);
      const cacheKey = `api:recs:${cacheKeyRotation}`;
      const cached = getCache(cacheKey, 900_000); // 15 min TTL per key
      if (cached) {
        res.set('Cache-Control', 'private, max-age=300');
        return res.json(cached);
      }

      const { syncPlexLibrary, artistInPlex, albumInPlex } = deps;
      await syncPlexLibrary();

      // Probeer seeds uit Plex play history
      let topArtists = [];
      try {
        const { getPlayHistory, aggregateTopArtists } = deps;
        if (getPlayHistory) {
          const history = await getPlayHistory('3month');
          topArtists = aggregateTopArtists(history, 30).map(a => a.name);
        }
      } catch (e) {
        logger.warn({ err: e }, 'Plex history voor recs seeds mislukt, fallback naar Last.fm');
      }

      // Fallback naar Last.fm als Plex seeds onvoldoende
      if (topArtists.length < 5) {
        const top = await lfm(
          { method: 'user.gettopartists', period: '3month', limit: 30 },
          { cacheKey: 'api:recs:topArtists', cacheTTL: 3_600_000 }
        );
        topArtists = (top.topartists?.artist || []).map(a => a.name);
      }

      // ── 1. SEED-DIVERSITEIT: Top-5 + 5 random uit posities 10-30 ──────────
      const seedArtists = [];
      seedArtists.push(...topArtists.slice(0, 5));
      const candidateRange = topArtists.slice(10, 30);
      if (candidateRange.length > 0) {
        const randomIndices = new Set();
        while (randomIndices.size < Math.min(5, candidateRange.length)) {
          randomIndices.add(Math.floor(Math.random() * candidateRange.length));
        }
        randomIndices.forEach(idx => seedArtists.push(candidateRange[idx]));
      }

      // ── Genre tracking voor genre-spreiding ──────────────────────────────
      const genreCount = {};
      const stopwords = new Set(['seen live', 'listened', 'favourite', 'favorites', 'love', 'loved', 'awesome', 'cool', 'good', 'great']);

      // Helper: haal top-3 tags op met 24-uurs cache per artiest
      // Cache-check gebeurt nu in lfm() zelf (voor throttle)
      async function getArtistTags(artist) {
        const tagCacheKey = `tags:${artist.toLowerCase()}`;
        const result = await lfm(
          { method: 'artist.gettoptags', artist },
          { includeUser: false, cacheKey: tagCacheKey, cacheTTL: 86_400_000 } // 24 uur TTL
        );
        const tags = (result.toptags?.tag || []).slice(0, 3);
        return tags;
      }

      // Verzamel genres van seed artiesten (parallel)
      const seedGenreResults = await Promise.allSettled(
        seedArtists.map(artist => getArtistTags(artist))
      );
      for (const result of seedGenreResults) {
        if (result.status === 'fulfilled') {
          for (const tag of result.value) {
            const name = tag.name.toLowerCase().trim();
            if (name.length > 2 && !stopwords.has(name) && !/^\d+$/.test(name)) {
              genreCount[name] = (genreCount[name] || 0) + 1;
            }
          }
        }
      }

      // ── Artiest-aanbevelingen ──────────────────────────────────────────
      const simResults = await Promise.all(
        seedArtists.map(async artist => {
          try {
            return { artist, similar: await getSimilarArtists(artist, 3) };
          }
          catch { return { artist, similar: [] }; }
        })
      );

      // Verzamel unieke kandidaten (deduplicatie vóór tag-calls)
      const candidates = [];
      const seenNames  = new Set();
      for (const { artist, similar } of simResults) {
        for (const s of similar) {
          if (!topArtists.includes(s.name) && !seenNames.has(s.name)) {
            seenNames.add(s.name);
            candidates.push({ name: s.name, reason: artist, match: parseFloat(s.match) });
          }
        }
      }

      // ── 2. BATCH genre-tags: max 5 concurrent, 24h gecached ──────────────
      const { limitConcurrency } = deps;
      const tagTasks   = candidates.map(c => () => getArtistTags(c.name));
      const tagResults = await limitConcurrency(tagTasks, 5);

      // Bereken adjustedMatch met genre-penalisatie
      const recs = candidates.map((c, i) => {
        const inPlex = artistInPlex(c.name);
        let adjustedMatch = c.match * (inPlex ? 0.9 : 1.4);

        const tagResult = tagResults[i];
        if (tagResult?.status === 'fulfilled') {
          let hasOnlyCommonGenres = true;
          let commonGenreCount    = 0;

          for (const tag of tagResult.value) {
            const name = tag.name.toLowerCase().trim();
            if (name.length > 2 && !stopwords.has(name) && !/^\d+$/.test(name)) {
              const count = genreCount[name] || 0;
              if (count < 3) {
                hasOnlyCommonGenres = false;
                break;
              } else {
                commonGenreCount++;
              }
            }
          }

          // Als alle genres al 3+ keer voorkomen, penaliseer met 50%
          if (hasOnlyCommonGenres && commonGenreCount > 0) {
            adjustedMatch *= 0.5;
          }
        }

        return { name: c.name, reason: c.reason, match: c.match, adjustedMatch, inPlex };
      });

      recs.sort((a, b) => b.adjustedMatch - a.adjustedMatch);
      const topRecs = recs.slice(0, 30);
      const top8    = topRecs.slice(0, 8);

      // ── 3. Album- én track-aanbevelingen PARALLEL ────────────────────────
      const [albumResults, trackResults] = await Promise.all([
        Promise.allSettled(
          top8.map(async rec => {
            try {
              // Cache per artiest (12 uur TTL)
              const data = await lfm(
                { method: 'artist.gettopalbums', artist: rec.name, limit: 3 },
                { includeUser: false, cacheKey: `albums:${rec.name.toLowerCase()}`, cacheTTL: 43_200_000 }
              );
              return (data.topalbums?.album || [])
                .filter(a => a.name && a.name !== '(null)' && a.name !== '[unknown]')
                .map(a => {
                  const img = a.image?.find(i => i.size === 'large')?.['#text'] || a.image?.find(i => i.size === 'medium')?.['#text'] || null;
                  return {
                    album:  a.name,
                    artist: rec.name,
                    reason: rec.reason,
                    image:  (img && !img.includes('2a96cbd8b46e442fc41c2b86b821562f')) ? img : null,
                    inPlex: albumInPlex(rec.name, a.name)
                  };
                });
            } catch { return []; }
          })
        ),
        Promise.allSettled(
          top8.map(async rec => {
            try {
              // Cache per artiest (12 uur TTL)
              const data = await lfm(
                { method: 'artist.gettoptracks', artist: rec.name, limit: 3 },
                { includeUser: false, cacheKey: `tracks:${rec.name.toLowerCase()}`, cacheTTL: 43_200_000 }
              );
              return (data.toptracks?.track || []).map(t => ({
                track:     t.name,
                artist:    rec.name,
                reason:    rec.reason,
                playcount: parseInt(t.playcount) || 0,
                url:       t.url || null
              }));
            } catch { return []; }
          })
        )
      ]);

      const albumRecs = albumResults
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .slice(0, 20);

      const trackRecs = trackResults
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .slice(0, 20);

      const { getPlexStatus } = deps;
      const { ok, artistCount } = getPlexStatus();
      const result = {
        recommendations:  topRecs,
        albumRecs,
        trackRecs,
        basedOn:          topArtists,
        seedArtists,      // Transparantie: laat zien welke seeds gebruikt zijn
        plexConnected:    ok,
        plexArtistCount:  artistCount
      };
      markLastFmUp();
      setCache(cacheKey, result); // Cache per 2-uur rotatie
      logger.info({ ms: Date.now() - t0 }, '/api/recs voltooid');
      res.set('Cache-Control', 'private, max-age=300');
      res.json(result);
    } catch (e) {
      markLastFmDown();
      logger.error({ err: e, ms: Date.now() - t0 }, '/api/recs fout');
      // Probeer huidige rotatie-sleutel (stale), daarna vorige rotatie
      const currentKey  = `api:recs:${Math.floor(Date.now() / 7_200_000)}`;
      const previousKey = `api:recs:${Math.floor(Date.now() / 7_200_000) - 1}`;
      const stale = getCache(currentKey, Infinity) || getCache(previousKey, Infinity);
      if (stale) {
        res.set('Cache-Control', 'private, max-age=300');
        return res.json({ ...stale, _stale: true, _staleReason: e.message });
      }
      res.set('Cache-Control', 'private, max-age=300');
      res.status(503).json({ error: 'Last.fm is tijdelijk niet bereikbaar en er is geen gecachede data beschikbaar.', _lfmDown: true });
    }
  });

  // ── /api/search ────────────────────────────────────────────────────────────
  app.get('/api/search', async (req, res) => {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.json({ results: [] });
    }
    try {
      // Cache per zoekterm (1 uur TTL)
      const [searchR, deezerR] = await Promise.allSettled([
        lfm(
          { method: 'artist.search', artist: q, limit: 6 },
          { includeUser: false, cacheKey: `search:${q.toLowerCase()}`, cacheTTL: 3_600_000 }
        ),
        fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}&limit=6`, { signal: AbortSignal.timeout(5_000) }).then(r => r.json())
      ]);
      const artists = searchR.status === 'fulfilled'
        ? (searchR.value.results?.artistmatches?.artist || []).slice(0, 6)
        : [];
      const deezerMap = {};
      if (deezerR.status === 'fulfilled') {
        for (const d of (deezerR.value?.data || [])) {
          if (d.picture_medium && !d.picture_medium.includes('/artist//'))
            deezerMap[d.name.toLowerCase()] = d.picture_medium;
        }
      }
      const results = artists.map(a => ({
        name: a.name,
        listeners: parseInt(a.listeners) || 0,
        image: deezerMap[a.name.toLowerCase()] || null
      }));
      res.set('Cache-Control', 'private, max-age=300');
      res.json({ results });
    } catch (e) {
      // Zoeken werkt gedeeltelijk zonder Last.fm (alleen Deezer-afbeeldingen)
      res.set('Cache-Control', 'private, max-age=300');
      res.json({ results: [], _lfmDown: true, error: e.message });
    }
  });

  // ── /api/stats ─────────────────────────────────────────────────────────────
  app.get('/api/stats', async (req, res) => {
    try {
      // Cache-check gebeurt nu in lfm() zelf (voor throttle)
      const [recentR, topR] = await Promise.allSettled([
        lfm(
          { method: 'user.getrecenttracks', limit: 200 },
          { cacheKey: 'stats:recent', cacheTTL: 1_800_000 } // 30 min
        ),
        lfm(
          { method: 'user.gettopartists', period: '1month', limit: 15 },
          { cacheKey: 'stats:top', cacheTTL: 1_800_000 } // 30 min
        )
      ]);

      // Dagelijkse scrobbles
      const tracks = recentR.status === 'fulfilled'
        ? (recentR.value.recenttracks?.track || []).filter(t => t.date?.uts)
        : [];
      const now = Date.now();
      const days = {};
      for (let i = 6; i >= 0; i--) {
        const key = new Date(now - i * 86_400_000).toISOString().split('T')[0];
        days[key] = 0;
      }
      for (const t of tracks) {
        const key = new Date(parseInt(t.date.uts) * 1000).toISOString().split('T')[0];
        if (key in days) days[key]++;
      }
      const dailyScrobbles = Object.entries(days).map(([date, count]) => ({ date, count }));

      // Top artiesten deze maand
      const topArtists = topR.status === 'fulfilled'
        ? (topR.value.topartists?.artist || []).slice(0, 10).map(a => ({
            name: a.name, playcount: parseInt(a.playcount) || 0
          }))
        : [];

      // Genre-verdeling via artiest-tags
      const stopwords = new Set(['seen live','listened','favourite','favorites','love','loved','awesome','cool','good','great']);
      const tagCounts = {};
      const tagResults = await Promise.allSettled(
        topArtists.slice(0, 8).map(a =>
          lfm({ method: 'artist.gettoptags', artist: a.name }, { includeUser: false })
        )
      );
      for (const r of tagResults) {
        if (r.status !== 'fulfilled') continue;
        for (const tag of (r.value.toptags?.tag || []).slice(0, 3)) {
          const name = tag.name.toLowerCase().trim();
          if (name.length > 2 && !stopwords.has(name) && !/^\d+$/.test(name))
            tagCounts[name] = (tagCounts[name] || 0) + 1;
        }
      }
      const genres = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([name, count]) => ({ name, count }));

      const result = { dailyScrobbles, topArtists, genres };
      markLastFmUp();
      // Individual API calls zijn nu gecached in lfm() (voor throttle)
      res.set('Cache-Control', 'private, max-age=900');
      res.json(result);
    } catch (e) { staleOrError('stats', e, res, deps); }
  });

  // Export status functions for server.js to use
  return { markLastFmDown, markLastFmUp, lastFmDown: () => lastFmDown, lastFmDownSince: () => lastFmDownSince };
};
