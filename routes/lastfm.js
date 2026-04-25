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
  const { lfm, getSimilarArtists, getCache, setCache, getMBZArtist, getDeezerArtist, getDeezerArtistAlbums, getDeezerArtistTopTracks, searchDeezerArtist } = deps;

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
  // Tags worden nu opgehaald via MusicBrainz (vervangt Last.fm artist.gettoptags)
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

      // Haal tags parallel op via MusicBrainz — 7-daags cache per artiest
      // MusicBrainz is vrij van rate-limiting en geeft genre-tags terug
      const tagResults = await Promise.allSettled(
        artists.map(a => getMBZArtist(a.name))
      );

      const enriched = artists.map((a, i) => {
        let topTag = null;
        if (tagResults[i].status === 'fulfilled') {
          const tags = tagResults[i].value?.tags || [];
          for (const tag of tags) {
            const tagName = (tag.name || '').toLowerCase().trim();
            if (tagName.length > 2 && !stopwords.has(tagName) && !/^\d+$/.test(tagName)) {
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

  // ── /api/top/tracks (alias) ────────────────────────────────────────────────
  app.get('/api/top/tracks', async (req, res) => {
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

  // ── /api/top/albums ────────────────────────────────────────────────────────
  app.get('/api/top/albums', async (req, res) => {
    try {
      const period = req.query.period || 'overall';
      const cacheKey = `api:top:albums:${period}`;
      const cached = getCache(cacheKey, 600_000);
      if (cached) {
        res.set('Cache-Control', 'private, max-age=600');
        return res.json(cached);
      }

      const data = await lfm(
        { method: 'user.gettopalbums', period, limit: 50 },
        { cacheKey, cacheTTL: 600_000 }
      );
      markLastFmUp();

      // Transform to simpler format
      const albums = (data.topalbums?.album || []).map(a => ({
        name: a.name,
        artist: a.artist?.name || a.artist || '',
        playcount: parseInt(a.playcount, 10) || 0,
        url: a.url,
        image: a.image
      }));

      const result = { topalbums: { album: albums } };
      setCache(cacheKey, result);
      res.set('Cache-Control', 'private, max-age=600');
      res.json(result);
    } catch (e) { staleOrError(`api:top:albums:${req.query.period || 'overall'}`, e, res, deps); }
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

      // Helper: haal top-3 tags op via MusicBrainz (vervangt Last.fm artist.gettoptags)
      // MusicBrainz heeft 7-daagse cache in getMBZArtist
      async function getArtistTags(artist) {
        try {
          const mbz = await getMBZArtist(artist);
          return (mbz?.tags || []).slice(0, 3);
        } catch {
          return [];
        }
      }

      // Verzamel genres van seed artiesten (parallel)
      const seedGenreResults = await Promise.allSettled(
        seedArtists.map(artist => getArtistTags(artist))
      );
      for (const result of seedGenreResults) {
        if (result.status === 'fulfilled') {
          for (const tag of result.value) {
            const name = (tag.name || '').toLowerCase().trim();
            if (name.length > 2 && !stopwords.has(name) && !/^\d+$/.test(name)) {
              genreCount[name] = (genreCount[name] || 0) + 1;
            }
          }
        }
      }

      // ── Artiest-aanbevelingen via Deezer related artists ──────────────────
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

      // ── 2. BATCH genre-tags via MusicBrainz: max 5 concurrent ────────────
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
            const name = (tag.name || '').toLowerCase().trim();
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

      // ── 3. Album- én track-aanbevelingen PARALLEL via Deezer ─────────────
      // Vervangt Last.fm artist.gettopalbums en artist.gettoptracks
      const [albumResults, trackResults] = await Promise.all([
        Promise.allSettled(
          top8.map(async rec => {
            try {
              // Zoek Deezer ID op en haal albums op
              const deezerArtist = await getDeezerArtist(rec.name);
              if (!deezerArtist?.id) return [];

              const albums = await getDeezerArtistAlbums(deezerArtist.id);
              return albums
                .filter(a => a.title && a.title !== '(null)' && a.title !== '[unknown]')
                .filter(a => !a.record_type || ['album', 'ep'].includes(a.record_type))
                .slice(0, 3)
                .map(a => ({
                  album:  a.title,
                  artist: rec.name,
                  reason: rec.reason,
                  image:  a.cover_medium || null,
                  inPlex: albumInPlex(rec.name, a.title)
                }));
            } catch { return []; }
          })
        ),
        Promise.allSettled(
          top8.map(async rec => {
            try {
              // Zoek Deezer ID op en haal top tracks op
              const deezerArtist = await getDeezerArtist(rec.name);
              if (!deezerArtist?.id) return [];

              const tracks = await getDeezerArtistTopTracks(deezerArtist.id);
              return tracks.slice(0, 3).map(t => ({
                track:     t.title,
                artist:    rec.name,
                reason:    rec.reason,
                playcount: t.rank || 0,
                url:       null
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
  // Gebruikt Deezer als primaire zoekbron (vervangt Last.fm artist.search)
  app.get('/api/search', async (req, res) => {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
      res.set('Cache-Control', 'private, max-age=300');
      return res.json({ results: [] });
    }
    try {
      // Gebruik alleen Deezer voor zoeken — sneller, geen API-key, geen throttle
      const deezerArtists = await searchDeezerArtist(q);

      const results = deezerArtists.map(a => ({
        name:      a.name,
        listeners: a.nb_fan || 0,   // Deezer nb_fan als vervanger van Last.fm listeners
        image:     a.picture_medium || null
      }));

      res.set('Cache-Control', 'private, max-age=300');
      res.json({ results });
    } catch (e) {
      res.set('Cache-Control', 'private, max-age=300');
      res.json({ results: [], error: e.message });
    }
  });

  // ── /api/stats ─────────────────────────────────────────────────────────────
  // Genre-verdeling via MusicBrainz tags (vervangt Last.fm artist.gettoptags)
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

      // Genre-verdeling via MusicBrainz tags (vervangt Last.fm artist.gettoptags)
      const stopwords = new Set(['seen live','listened','favourite','favorites','love','loved','awesome','cool','good','great']);
      const tagCounts = {};
      const tagResults = await Promise.allSettled(
        topArtists.slice(0, 8).map(a => getMBZArtist(a.name))
      );
      for (const r of tagResults) {
        if (r.status !== 'fulfilled') continue;
        for (const tag of (r.value?.tags || []).slice(0, 3)) {
          const name = (tag.name || '').toLowerCase().trim();
          if (name.length > 2 && !stopwords.has(name) && !/^\d+$/.test(name))
            tagCounts[name] = (tagCounts[name] || 0) + 1;
        }
      }
      const genres = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([name, count]) => ({ name, count }));

      const result = { dailyScrobbles, topArtists, genres };
      markLastFmUp();
      res.set('Cache-Control', 'private, max-age=900');
      res.json(result);
    } catch (e) { staleOrError('stats', e, res, deps); }
  });

  // ── /api/activity – Plex + Last.fm combined ────────────────────────────────
  app.get('/api/activity', async (req, res) => {
    try {
      const period = req.query.period || '7day';
      const cacheKey = `api:activity:${period}`;

      // Check cache (10 minuten TTL)
      const cached = getCache(cacheKey, 600_000);
      if (cached) {
        res.set('Cache-Control', 'private, max-age=600');
        return res.json(cached);
      }

      // Probeer eerst Plex data
      let result = null;
      try {
        const { getPlayHistory, aggregateDailyPlays } = deps;
        if (getPlayHistory) {
          const history = await getPlayHistory(period);
          if (history && history.length > 0) {
            // Plex data beschikbaar
            const dailyData = aggregateDailyPlays(history, 28);
            const totalPlays = history.length;

            result = {
              dailyPlays: dailyData,
              recentTracks: history.slice(0, 20).map(t => ({
                title: t.title,
                artist: t.artist,
                album: t.album,
                viewedAt: t.viewedAt,
                thumb: t.thumb,
                ratingKey: t.ratingKey
              })),
              totalPlays,
              source: 'plex'
            };
            markLastFmUp();
            setCache(cacheKey, result);
            res.set('Cache-Control', 'private, max-age=600');
            return res.json(result);
          }
        }
      } catch (e) {
        logger.warn({ err: e }, 'Plex play history mislukt, fallback naar Last.fm');
      }

      // Fallback: Last.fm
      try {
        const { periodToTimestamp } = deps;
        const sinceTimestamp = periodToTimestamp(period);
        const fromDate = Math.floor(sinceTimestamp);

        const data = await lfm(
          { method: 'user.getrecenttracks', limit: 200, from: fromDate },
          { cacheKey: `api:activity:lastfm:${period}`, cacheTTL: 600_000 }
        );

        const tracks = (data.recenttracks?.track || []).filter(t => t.date?.uts);

        // Groepeer per dag en tel minuten (3.5 minuten per track)
        const dailyMap = new Map();
        for (const track of tracks) {
          if (!track.date?.uts) continue;
          const date = new Date(parseInt(track.date.uts) * 1000);
          const dateStr = date.toISOString().split('T')[0];

          if (!dailyMap.has(dateStr)) {
            dailyMap.set(dateStr, { date: dateStr, count: 0, minutes: 0 });
          }
          const entry = dailyMap.get(dateStr);
          entry.count += 1;
          entry.minutes += 3.5; // ~3.5 minuten per track
        }

        const dailyPlays = [...dailyMap.values()]
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        const recentTracks = tracks.slice(0, 20).map(t => ({
          title: t.name || '',
          artist: t.artist?.name || (typeof t.artist === 'string' ? t.artist : ''),
          album: t.album?.['#text'] || t.album || '',
          viewedAt: t.date?.uts ? parseInt(t.date.uts) : 0,
          thumb: t.image?.find(i => i.size === 'medium')?.['#text'] || null,
          ratingKey: null
        }));

        result = {
          dailyPlays,
          recentTracks,
          totalPlays: tracks.length,
          source: 'lastfm'
        };

        markLastFmUp();
        setCache(cacheKey, result);
        res.set('Cache-Control', 'private, max-age=600');
        return res.json(result);
      } catch (e) {
        logger.warn({ err: e }, 'Last.fm activity mislukt');
      }

      // Graceful fallback: lege data als beide mislukt
      markLastFmDown();
      result = {
        dailyPlays: [],
        recentTracks: [],
        totalPlays: 0,
        source: null,
        error: 'Zowel Plex als Last.fm zijn onbereikbaar'
      };
      res.status(503).json(result);
    } catch (e) {
      logger.error({ err: e }, '/api/activity onverwachte fout');
      markLastFmDown();
      res.status(500).json({ error: 'Internal server error', _lfmDown: true });
    }
  });

  // Export status functions for server.js to use
  return { markLastFmDown, markLastFmUp, lastFmDown: () => lastFmDown, lastFmDownSince: () => lastFmDownSince };
};
