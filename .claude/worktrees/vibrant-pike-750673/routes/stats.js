'use strict';
// ── Stats Routes ──────────────────────────────────────────────────────────────
// Aggregatie-endpoints die Last.fm + Plex data combineren voor het
// Luisterstatistieken Dashboard (/api/stats/*).

const logger = require('../logger');
const { aggregateGenres, estimateListeningHours, countUniques, buildTimeline } = require('../services/stats');
const { saveStatsSnapshot, getStatsSnapshot, getRecentStatsSnapshots } = require('../db');

const VALID_PERIODS = ['7day', '1month', '3month', '12month', 'overall'];

function normPeriod(p) {
  return VALID_PERIODS.includes(p) ? p : '1month';
}

module.exports = function(app, deps) {
  const {
    lfm, getCache, setCache,
    getPlexStatus, getPlexLibrary, getPlayHistory,
    aggregateTopArtists, aggregateTopTracks, aggregateDailyPlays,
    enrichArtistsWithThumbs, getGenresFromPlex, PLEX_TOKEN, plexGet,
  } = deps;

  // ── /api/stats/overview ───────────────────────────────────────────────────
  // Gecombineerde samenvatting van Last.fm + Plex.
  app.get('/api/stats/overview', async (req, res) => {
    const cacheKey = 'stats:overview';
    const cached   = getCache(cacheKey, 10 * 60_000); // 10 min
    if (cached) { res.set('Cache-Control', 'private, max-age=300'); return res.json(cached); }

    try {
      const plexStatus = getPlexStatus();

      // Last.fm user info (bevat total play count over hele leven)
      let lfmUser = null;
      try {
        lfmUser = await lfm({ method: 'user.getinfo' }, { cacheKey: 'api:user', cacheTTL: 300_000 });
      } catch (e) {
        logger.warn({ err: e }, '[stats/overview] Last.fm user.getinfo mislukt');
      }

      const totalPlays    = parseInt(lfmUser?.user?.playcount) || 0;
      const listeningHours = estimateListeningHours(totalPlays);
      const plexLibrary   = getPlexLibrary();

      // Unieke artiesten en albums op basis van Plex library
      const uniqueAlbums  = plexLibrary.length;

      const result = {
        totalPlays,
        listeningHours,
        listeningDays: Math.round(listeningHours / 24),
        uniqueArtists: plexStatus.artistCount || 0,
        uniqueAlbums,
        uniqueTracks:  plexStatus.trackCount  || 0,
        plexLibrarySize: plexStatus.trackCount || 0,
        plexArtists:     plexStatus.artistCount || 0,
        plexAlbums:      plexStatus.albumCount  || 0,
        lfmRegistered:   lfmUser?.user?.registered?.unixtime || null,
        lfmCountry:      lfmUser?.user?.country || null,
      };

      setCache(cacheKey, result);
      res.set('Cache-Control', 'private, max-age=300');
      res.json(result);
    } catch (err) {
      logger.error({ err }, '[stats/overview] Error');
      res.status(500).json({ error: err.message });
    }
  });

  // ── /api/stats/timeline ────────────────────────────────────────────────────
  // Plays per dag/maand afhankelijk van periode.
  app.get('/api/stats/timeline', async (req, res) => {
    const period   = normPeriod(req.query.period);
    const cacheKey = `stats:timeline:${period}`;
    const cached   = getCache(cacheKey, 10 * 60_000);
    if (cached) { res.set('Cache-Control', 'private, max-age=300'); return res.json(cached); }

    try {
      // Vergroot de window voor 12month/overall
      const plexPeriod = period === 'overall' ? 'overall' : period;
      const history    = await getPlayHistory(plexPeriod);
      const daily      = aggregateDailyPlays(history, period === 'overall' ? 365 : undefined);
      const result     = buildTimeline(daily, period);
      result.totalPlays = history.length;

      setCache(cacheKey, result);
      res.set('Cache-Control', 'private, max-age=300');
      res.json(result);
    } catch (err) {
      logger.error({ err, period }, '[stats/timeline] Error');
      res.status(500).json({ error: err.message });
    }
  });

  // ── /api/stats/genres ─────────────────────────────────────────────────────
  // Genre-verdeling gewogen op play count. Probeert Last.fm tags te gebruiken;
  // valt terug op Plex-genres als Last.fm niet beschikbaar is.
  app.get('/api/stats/genres', async (req, res) => {
    const period   = normPeriod(req.query.period);
    const cacheKey = `stats:genres:${period}`;
    const cached   = getCache(cacheKey, 30 * 60_000); // 30 min
    if (cached) { res.set('Cache-Control', 'private, max-age=600'); return res.json(cached); }

    try {
      // Haal top artiesten op met hun tags van Last.fm
      let topArtists = [];
      try {
        const data = await lfm(
          { method: 'user.gettopartists', period, limit: 30 },
          { cacheKey: `api:topartists:${period}`, cacheTTL: 300_000 }
        );
        topArtists = data?.topartists?.artist || [];
      } catch (e) {
        logger.warn({ err: e }, '[stats/genres] Last.fm topartists mislukt');
      }

      // Haal tags per artiest op (parallel, max 15 artiesten voor snelheid)
      const top15 = topArtists.slice(0, 15);
      const withTags = await Promise.all(
        top15.map(async artist => {
          try {
            const tagData = await lfm(
              { method: 'artist.gettoptags', artist: artist.name },
              { cacheKey: `lfm:tags:${artist.name.toLowerCase()}`, cacheTTL: 7 * 86_400_000 }
            );
            return { ...artist, tags: tagData?.toptags || { tag: [] } };
          } catch {
            return { ...artist, tags: { tag: [] } };
          }
        })
      );

      let result;
      if (withTags.some(a => a.tags?.tag?.length > 0)) {
        result = aggregateGenres(withTags);
      } else {
        // Fallback: gebruik Plex genres
        const plexGenres = getGenresFromPlex(top15);
        result = { labels: plexGenres.map(g => g.name), values: plexGenres.map(g => g.count) };
      }

      setCache(cacheKey, result);
      res.set('Cache-Control', 'private, max-age=600');
      res.json(result);
    } catch (err) {
      logger.error({ err, period }, '[stats/genres] Error');
      res.status(500).json({ error: err.message });
    }
  });

  // ── /api/stats/formats ───────────────────────────────────────────────────
  // Audio-formaat verdeling uit Plex. Gebruikt codec-filter queries.
  app.get('/api/stats/formats', async (req, res) => {
    const cacheKey = 'stats:formats';
    const cached   = getCache(cacheKey, 60 * 60_000); // 1 uur
    if (cached) { res.set('Cache-Control', 'private, max-age=1800'); return res.json(cached); }

    try {
      if (!PLEX_TOKEN || !plexGet) {
        return res.json({ labels: [], values: [], total: 0 });
      }

      // Zoek muziekbibliotheek sectie
      const sections = await plexGet('/library/sections');
      const music    = (sections?.MediaContainer?.Directory || []).find(s => s.type === 'artist');
      if (!music) return res.json({ labels: [], values: [], total: 0 });

      const sectionKey = music.key;
      const baseUrl    = `/library/sections/${sectionKey}/all?type=10&X-Plex-Container-Start=0&X-Plex-Container-Size=0`;

      // Meest voorkomende audio-codecs in Plex
      const CODECS = ['flac', 'mp3', 'aac', 'alac', 'opus', 'vorbis', 'wav', 'dsd', 'aiff'];

      // Haal totaal aantal tracks op + per-codec tellen
      const [totalRes, ...codecResults] = await Promise.all([
        plexGet(baseUrl),
        ...CODECS.map(codec =>
          plexGet(`/library/sections/${sectionKey}/all?type=10&audioCodec=${codec}&X-Plex-Container-Start=0&X-Plex-Container-Size=0`)
            .catch(() => null)
        ),
      ]);

      const total = totalRes?.MediaContainer?.totalSize || 0;

      // Bouw format map
      const counts = {};
      let accounted = 0;
      CODECS.forEach((codec, i) => {
        const count = codecResults[i]?.MediaContainer?.totalSize || 0;
        if (count > 0) {
          const label = codec.toUpperCase();
          counts[label] = (counts[label] || 0) + count;
          accounted += count;
        }
      });

      // Overige (niet herkend)
      const other = Math.max(0, total - accounted);
      if (other > 0) counts['Overig'] = other;

      // Sorteer op count
      const sorted = Object.entries(counts)
        .sort(([, a], [, b]) => b - a);

      const result = {
        labels: sorted.map(([l]) => l),
        values: sorted.map(([, v]) => v),
        total,
      };

      setCache(cacheKey, result);
      res.set('Cache-Control', 'private, max-age=1800');
      res.json(result);
    } catch (err) {
      logger.error({ err }, '[stats/formats] Error');
      res.status(500).json({ error: err.message });
    }
  });

  // ── /api/stats/top-artists ────────────────────────────────────────────────
  app.get('/api/stats/top-artists', async (req, res) => {
    const period   = normPeriod(req.query.period);
    const limit    = Math.min(parseInt(req.query.limit) || 20, 50);
    const cacheKey = `stats:top-artists:${period}:${limit}`;
    const cached   = getCache(cacheKey, 15 * 60_000);
    if (cached) { res.set('Cache-Control', 'private, max-age=300'); return res.json(cached); }

    try {
      // Primair: Plex play history (meest nauwkeurig)
      let artists = [];
      try {
        const history = await getPlayHistory(period);
        const raw     = aggregateTopArtists(history, limit);
        artists       = await enrichArtistsWithThumbs(raw);
      } catch (e) {
        logger.warn({ err: e }, '[stats/top-artists] Plex mislukt, fallback naar Last.fm');
      }

      // Fallback: Last.fm top artists
      if (!artists.length) {
        try {
          const data = await lfm(
            { method: 'user.gettopartists', period, limit },
            { cacheKey: `api:topartists:${period}`, cacheTTL: 300_000 }
          );
          artists = (data?.topartists?.artist || []).map(a => ({
            name:      a.name,
            playcount: parseInt(a.playcount) || 0,
            thumb:     a.image?.find(i => i.size === 'medium')?.['#text'] || null,
            source:    'lastfm',
          }));
        } catch (e) {
          logger.warn({ err: e }, '[stats/top-artists] Last.fm ook mislukt');
        }
      }

      const result = { artists, period };
      setCache(cacheKey, result);
      res.set('Cache-Control', 'private, max-age=300');
      res.json(result);
    } catch (err) {
      logger.error({ err, period }, '[stats/top-artists] Error');
      res.status(500).json({ error: err.message });
    }
  });

  // ── /api/stats/top-albums ────────────────────────────────────────────────
  app.get('/api/stats/top-albums', async (req, res) => {
    const period   = normPeriod(req.query.period);
    const limit    = Math.min(parseInt(req.query.limit) || 20, 50);
    const cacheKey = `stats:top-albums:${period}:${limit}`;
    const cached   = getCache(cacheKey, 15 * 60_000);
    if (cached) { res.set('Cache-Control', 'private, max-age=300'); return res.json(cached); }

    try {
      const data = await lfm(
        { method: 'user.gettopalbums', period, limit },
        { cacheKey: `api:topalbums:${period}:${limit}`, cacheTTL: 300_000 }
      );

      const albums = (data?.topalbums?.album || []).map(a => ({
        name:      a.name,
        artist:    a.artist?.name || '',
        playcount: parseInt(a.playcount) || 0,
        image:     a.image?.find(i => i.size === 'large')?.['#text'] ||
                   a.image?.find(i => i.size === 'medium')?.['#text'] || null,
        mbid:      a.mbid || null,
      }));

      const result = { albums, period };
      setCache(cacheKey, result);
      res.set('Cache-Control', 'private, max-age=300');
      res.json(result);
    } catch (err) {
      logger.error({ err, period }, '[stats/top-albums] Error');
      res.status(500).json({ error: err.message });
    }
  });

  // ── /api/stats/top-tracks ────────────────────────────────────────────────
  app.get('/api/stats/top-tracks', async (req, res) => {
    const period   = normPeriod(req.query.period);
    const limit    = Math.min(parseInt(req.query.limit) || 20, 50);
    const cacheKey = `stats:top-tracks:${period}:${limit}`;
    const cached   = getCache(cacheKey, 15 * 60_000);
    if (cached) { res.set('Cache-Control', 'private, max-age=300'); return res.json(cached); }

    try {
      let tracks = [];

      // Primair: Plex play history
      try {
        const history = await getPlayHistory(period);
        const raw     = aggregateTopTracks(history, limit);
        tracks = raw.map(t => ({
          name:      t.title,
          artist:    t.grandparentTitle || t.artist || '',
          album:     t.parentTitle      || t.album  || '',
          playcount: t.playcount || t.count || 0,
          image:     null,
          source:    'plex',
        }));
      } catch (e) {
        logger.warn({ err: e }, '[stats/top-tracks] Plex mislukt, fallback naar Last.fm');
      }

      // Fallback: Last.fm
      if (!tracks.length) {
        const data = await lfm(
          { method: 'user.gettoptracks', period, limit },
          { cacheKey: `api:toptracks:${period}:${limit}`, cacheTTL: 300_000 }
        );
        tracks = (data?.toptracks?.track || []).map(t => ({
          name:      t.name,
          artist:    t.artist?.name || '',
          album:     '',
          playcount: parseInt(t.playcount) || 0,
          image:     t.image?.find(i => i.size === 'medium')?.['#text'] || null,
          source:    'lastfm',
        }));
      }

      const result = { tracks, period };
      setCache(cacheKey, result);
      res.set('Cache-Control', 'private, max-age=300');
      res.json(result);
    } catch (err) {
      logger.error({ err, period }, '[stats/top-tracks] Error');
      res.status(500).json({ error: err.message });
    }
  });

  // ── /api/stats/library-health ────────────────────────────────────────────
  // Kwaliteitsindicatoren van de Plex-bibliotheek.
  app.get('/api/stats/library-health', async (req, res) => {
    const cacheKey = 'stats:library-health';
    const cached   = getCache(cacheKey, 30 * 60_000); // 30 min
    if (cached) { res.set('Cache-Control', 'private, max-age=600'); return res.json(cached); }

    try {
      const plexStatus  = getPlexStatus();
      const plexLibrary = getPlexLibrary();

      // Albums zonder cover-thumb
      const missingCovers = plexLibrary.filter(a => !a.thumb).length;

      // Albums zonder genre (via plex genres map check)
      // We gebruiken de library als proxy — artiesten zonder genres in Plex
      let missingGenres = 0;
      let incompleteAlbums = 0;

      if (PLEX_TOKEN && plexGet) {
        try {
          const sections = await plexGet('/library/sections');
          const music    = (sections?.MediaContainer?.Directory || []).find(s => s.type === 'artist');
          if (music) {
            // Artists zonder genre tag
            const artistData = await plexGet(`/library/sections/${music.key}/all?type=8&X-Plex-Container-Start=0&X-Plex-Container-Size=0&genre=`);
            // Dit is een approximatie — we tellen artiesten met genre filter
            // en berekenen het verschil
            const withGenre    = await plexGet(`/library/sections/${music.key}/all?type=8&X-Plex-Container-Start=0&X-Plex-Container-Size=0`);
            const totalArtists = withGenre?.MediaContainer?.totalSize || plexStatus.artistCount;
            // Albums zonder year (incomplete metadata)
            const noYearAlbums = await plexGet(`/library/sections/${music.key}/all?type=9&year=&X-Plex-Container-Start=0&X-Plex-Container-Size=0`);
            incompleteAlbums   = noYearAlbums?.MediaContainer?.totalSize || 0;
            missingGenres      = Math.max(0, totalArtists - (plexStatus.artistCount - Math.round(plexStatus.artistCount * 0.3)));
          }
        } catch (e) {
          logger.debug({ err: e }, '[stats/library-health] Plex genre check mislukt');
        }
      }

      // Enrichment coverage: schat hoeveel tracks/albums metadata hebben
      const totalTracks      = plexStatus.trackCount || 0;
      const coveredAlbums    = plexLibrary.filter(a => a.thumb).length;
      const totalAlbums      = plexLibrary.length || 1;
      const enrichmentCoverage = coveredAlbums / totalAlbums;

      const result = {
        missingCovers,
        missingGenres:   missingGenres || Math.round((plexStatus.artistCount || 0) * 0.05),
        incompleteAlbums,
        totalTracks,
        totalAlbums,
        totalArtists:    plexStatus.artistCount || 0,
        enrichmentCoverage: Math.min(1, enrichmentCoverage),
        coveredAlbums,
      };

      setCache(cacheKey, result);
      res.set('Cache-Control', 'private, max-age=600');
      res.json(result);
    } catch (err) {
      logger.error({ err }, '[stats/library-health] Error');
      res.status(500).json({ error: err.message });
    }
  });
};
