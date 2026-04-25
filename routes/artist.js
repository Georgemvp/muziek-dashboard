// ── Artist API Routes ─────────────────────────────────────────────────────────

module.exports = function(app, deps) {
  const { getMBZArtist, albumInPlex, artistInPlex, getAlbumRatingKey, getCache, setCache, getSimilarArtists, getPlexArtistsByGenre, getWikipediaExtract, getGaps, getArtistGaps, getDeezerArtist, getDeezerArtistAlbums, getDeezerArtistTopTracks } = deps;

  // ── Helper: bouw albumlijst op basis van Deezer albumdata ─────────────────
  // Filtert studio-albums en singles, mapt naar het interne formaat.
  async function buildAlbumList(artistName, deezerArtistId, limit = 5) {
    if (!deezerArtistId) return [];
    try {
      const albums = await getDeezerArtistAlbums(deezerArtistId);
      // Geef voorkeur aan studio-albums boven singles/compilaties
      const filtered = albums
        .filter(a => a.title && a.title !== '(null)' && a.title !== '[unknown]')
        .filter(a => !a.record_type || ['album', 'ep'].includes(a.record_type))
        .slice(0, limit);

      return filtered.map(a => {
        const inPlex = albumInPlex(artistName, a.title);
        return {
          name:      a.title,
          image:     a.cover_medium || null,
          playcount: 0,
          inPlex,
          ratingKey: inPlex ? getAlbumRatingKey(artistName, a.title) : null
        };
      });
    } catch {
      return [];
    }
  }

  // ── /api/artist/:name/info ────────────────────────────────────────────────
  app.get('/api/artist/:name/info', async (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const cacheKey = `artist:info:${name.toLowerCase()}`;

    // ── Check cache eerst (TTL: 1 uur) ─────────────────────────────────────
    const cached = getCache(cacheKey, 1 * 3_600_000);
    if (cached) {
      res.set('Cache-Control', 'private, max-age=3600');
      return res.json(cached);
    }

    try {
      // Haal Deezer artiest op (bevat ID voor verdere calls) en MusicBrainz parallel
      const [deezerR, mbzR] = await Promise.allSettled([
        getDeezerArtist(name),
        getMBZArtist(name)
      ]);

      let image    = null;
      let imageXl  = null;
      let deezerId = null;

      if (deezerR.status === 'fulfilled' && deezerR.value) {
        const d = deezerR.value;
        if (d.picture_medium && !d.picture_medium.includes('/artist//')) {
          image   = d.picture_medium;
          imageXl = d.picture_xl || d.picture_medium;
        }
        deezerId = d.id || null;
      }

      // Haal albums op via Deezer (geen Last.fm meer nodig)
      const albums = await buildAlbumList(name, deezerId, 5);

      const mbz = mbzR.status === 'fulfilled' ? mbzR.value : null;
      const result = {
        image, imageXl, albums,
        inPlex:    artistInPlex(name),
        country:   mbz?.country   || null,
        startYear: mbz?.startYear || null,
        tags:      mbz?.tags      || [],
        mbid:      mbz?.mbid      || null
      };

      // ── Cache succesvolle response (1 uur TTL) ────────────────────────────
      setCache(cacheKey, result);

      // ── Voeg browser cache header toe ──────────────────────────────────
      res.set('Cache-Control', 'private, max-age=3600');
      res.json(result);
    } catch (e) {
      // ── Geen caching bij errors ────────────────────────────────────────
      res.status(500).json({ error: e.message, image: null, imageXl: null, albums: [], inPlex: false, tags: [] });
    }
  });

  // ── /api/artist/:name (alias to /info) ─────────────────────────────────────
  app.get('/api/artist/:name', async (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const cacheKey = `artist:info:${name.toLowerCase()}`;

    // ── Check cache eerst (TTL: 1 uur) ─────────────────────────────────────
    const cached = getCache(cacheKey, 1 * 3_600_000);
    if (cached) {
      res.set('Cache-Control', 'private, max-age=3600');
      return res.json(cached);
    }

    try {
      // Haal Deezer artiest op (bevat ID voor verdere calls) en MusicBrainz parallel
      const [deezerR, mbzR] = await Promise.allSettled([
        getDeezerArtist(name),
        getMBZArtist(name)
      ]);

      let image    = null;
      let imageXl  = null;
      let deezerId = null;

      if (deezerR.status === 'fulfilled' && deezerR.value) {
        const d = deezerR.value;
        if (d.picture_medium && !d.picture_medium.includes('/artist//')) {
          image   = d.picture_medium;
          imageXl = d.picture_xl || d.picture_medium;
        }
        deezerId = d.id || null;
      }

      // Haal albums op via Deezer (geen Last.fm meer nodig)
      const albums = await buildAlbumList(name, deezerId, 5);

      const mbz = mbzR.status === 'fulfilled' ? mbzR.value : null;
      const result = {
        image, imageXl, albums,
        inPlex:    artistInPlex(name),
        country:   mbz?.country   || null,
        startYear: mbz?.startYear || null,
        tags:      mbz?.tags      || [],
        mbid:      mbz?.mbid      || null
      };

      // ── Cache succesvolle response (1 uur TTL) ────────────────────────────
      setCache(cacheKey, result);

      // ── Voeg browser cache header toe ──────────────────────────────────
      res.set('Cache-Control', 'private, max-age=3600');
      res.json(result);
    } catch (e) {
      // ── Geen caching bij errors ────────────────────────────────────────
      res.status(500).json({ error: e.message, image: null, imageXl: null, albums: [], inPlex: false, tags: [] });
    }
  });

  // ── /api/artist/:name/similar ──────────────────────────────────────────────
  // Retourneert gelijkaardige artiesten via Deezer related artists.
  // Fallback naar Plex genres als Deezer geen resultaten oplevert.
  app.get('/api/artist/:name/similar', async (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const { getSimilarArtists, getPlexArtistsByGenre } = deps;

    let similar = [];
    let source = 'deezer';

    try {
      // PRIMAIR: Deezer related artists (snel, geen API-key, geen throttle)
      similar = await getSimilarArtists(name, 6);

      // Als Deezer 0 resultaten oplevert, probeer Plex-fallback
      if (!similar || similar.length === 0) {
        try {
          // FALLBACK: Zoek artiesten met dezelfde genres in Plex
          similar = await getPlexArtistsByGenre(name, 6);
          if (similar && similar.length > 0) {
            source = 'plex';
          }
        } catch (plexErr) {
          // Stille fout voor Plex-fallback
          console.debug('Plex genre-fallback mislukt voor', name, ':', plexErr.message);
        }
      }

      res.set('Cache-Control', 'private, max-age=300');
      res.json({
        similar: similar || [],
        source,
        count: (similar || []).length
      });
    } catch (e) {
      // Deezer faalt geheel → retourneer lege lijst + error flag
      console.warn(`Similar artists (Deezer) faalt voor "${name}":`, e.message);
      res.set('Cache-Control', 'private, max-age=60');
      res.json({
        similar: [],
        source: 'error',
        error: e.message
      });
    }
  });

  // ── /api/preview ───────────────────────────────────────────────────────────
  app.get('/api/preview', async (req, res) => {
    const artist = (req.query.artist || '').trim();
    const track  = (req.query.track  || '').trim();
    if (!artist || !track) {
      res.set('Cache-Control', 'private, max-age=86400');
      return res.json({ preview: null });
    }

    const cacheKey = `preview:${artist.toLowerCase()}:${track.toLowerCase()}`;
    const cached = getCache(cacheKey, 7 * 24 * 60 * 60 * 1000); // 7 dagen TTL
    if (cached) {
      res.set('Cache-Control', 'private, max-age=86400');
      return res.json(cached);
    }

    try {
      const q   = `artist:"${artist}" track:"${track}"`;
      const url = `https://api.deezer.com/search/track?q=${encodeURIComponent(q)}&limit=3`;
      const data = await fetch(url, { signal: AbortSignal.timeout(5_000) }).then(r => r.json());
      const results = data?.data || [];
      const hit = results.find(t => t.preview) || null;

      const result = hit ? {
        preview: hit.preview,
        title:   hit.title,
        artist:  hit.artist?.name || artist,
        album:   hit.album?.title || '',
        cover:   hit.album?.cover_medium || null
      } : { preview: null };

      setCache(cacheKey, result);
      res.set('Cache-Control', 'private, max-age=86400');
      res.json(result);
    } catch (e) {
      res.set('Cache-Control', 'private, max-age=86400');
      res.json({ preview: null });
    }
  });

  // ── /api/artist/:name/full ────────────────────────────────────────────────
  // Comprehensive artist endpoint: combines info, wikipedia, similar, gaps
  app.get('/api/artist/:name/full', async (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const cacheKey = `artist:full:${name.toLowerCase()}`;

    // ── Check cache eerst (TTL: 1 uur) ─────────────────────────────────────
    const cached = getCache(cacheKey, 1 * 3_600_000);
    if (cached) {
      res.set('Cache-Control', 'private, max-age=3600');
      return res.json(cached);
    }

    try {
      // ── Parallel fetch: artist info, wikipedia, similar artists, gaps, top tracks ──────────
      const [infoR, wikiR, similarR, gapsR, tracksR] = await Promise.allSettled([
        // Artist info: Deezer image + Deezer albums + MusicBrainz metadata
        (async () => {
          const [deezerR, mbzR] = await Promise.allSettled([
            getDeezerArtist(name),
            getMBZArtist(name)
          ]);

          let image    = null;
          let imageXl  = null;
          let deezerId = null;

          if (deezerR.status === 'fulfilled' && deezerR.value) {
            const d = deezerR.value;
            if (d.picture_medium && !d.picture_medium.includes('/artist//')) {
              image   = d.picture_medium;
              imageXl = d.picture_xl || d.picture_medium;
            }
            deezerId = d.id || null;
          }

          // Haal albums op via Deezer
          const albums = await buildAlbumList(name, deezerId, 5);

          const mbz = mbzR.status === 'fulfilled' ? mbzR.value : null;
          return {
            image, imageXl, albums,
            inPlex:    artistInPlex(name),
            country:   mbz?.country   || null,
            startYear: mbz?.startYear || null,
            tags:      mbz?.tags      || [],
            mbid:      mbz?.mbid      || null
          };
        })(),

        // Wikipedia extract
        getWikipediaExtract(name),

        // Gerelateerde artiesten via Deezer (vervangt Last.fm artist.getsimilar)
        getSimilarArtists(name, 6),

        // Artist-specific gaps
        getArtistGaps(name),

        // Top tracks via Deezer (vervangt Last.fm artist.gettoptracks)
        (async () => {
          try {
            const deezerArtist = await getDeezerArtist(name);
            if (!deezerArtist?.id) return [];

            const tracks = await getDeezerArtistTopTracks(deezerArtist.id);
            return tracks
              .filter(t => t.title && t.title !== '(null)')
              .map(t => ({
                name:      t.title,
                playcount: t.rank || 0,   // Deezer rank als vervanger van playcount
                listeners: 0,             // Deezer geeft geen listeners-telling
                url:       null
              }));
          } catch (e) {
            console.warn(`Deezer top tracks mislukt voor "${name}":`, e.message);
            return [];
          }
        })()
      ]);

      // ── Extract results ───────────────────────────────────────────────────
      let info = {
        image: null, imageXl: null, albums: [],
        inPlex: false, country: null,
        startYear: null, tags: [], mbid: null
      };
      if (infoR.status === 'fulfilled') {
        info = infoR.value;
      }

      let wikipedia = null;
      if (wikiR.status === 'fulfilled' && wikiR.value) {
        wikipedia = wikiR.value;
      }

      let similar = [];
      if (similarR.status === 'fulfilled' && similarR.value) {
        similar = similarR.value;
      }

      // ── Get artist-specific gaps data ──────────────────────────────────────
      let gaps = {};
      if (gapsR.status === 'fulfilled' && gapsR.value) {
        gaps = gapsR.value;
      } else if (gapsR.reason) {
        gaps = { error: gapsR.reason.message, owned: [], missing: [] };
      }

      // ── Get top tracks data ────────────────────────────────────────────────
      let topTracks = [];
      if (tracksR.status === 'fulfilled' && tracksR.value) {
        topTracks = tracksR.value;
      }

      // ── Combine all results ───────────────────────────────────────────────
      const result = {
        name,
        info,
        wikipedia,
        similar: {
          artists: similar,
          count: similar.length
        },
        gaps,
        topTracks
      };

      // ── Cache succesvolle response (1 uur TTL) ────────────────────────────
      setCache(cacheKey, result);

      // ── Voeg browser cache header toe ──────────────────────────────────
      res.set('Cache-Control', 'private, max-age=3600');
      res.json(result);
    } catch (e) {
      res.status(500).json({
        error: e.message,
        name,
        info: { image: null, imageXl: null, albums: [], inPlex: false, country: null, startYear: null, tags: [], mbid: null },
        wikipedia: null,
        similar: { artists: [], count: 0 },
        gaps: { status: 'error', message: e.message },
        topTracks: []
      });
    }
  });

  // ── /api/artist/:name/wikipedia ───────────────────────────────────────────
  // Haalt Wikipedia extract op voor een artiest
  app.get('/api/artist/:name/wikipedia', async (req, res) => {
    const name = decodeURIComponent(req.params.name);

    try {
      const wikipedia = await getWikipediaExtract(name);
      res.set('Cache-Control', 'private, max-age=86400');
      res.json(wikipedia || null);
    } catch (e) {
      res.set('Cache-Control', 'private, max-age=60');
      res.json(null);
    }
  });

  // ── /api/artist/:name/tracks ──────────────────────────────────────────────
  // Haalt top tracks op voor een artiest via Deezer (vervangt Last.fm artist.gettoptracks)
  app.get('/api/artist/:name/tracks', async (req, res) => {
    const name = decodeURIComponent(req.params.name);

    try {
      const deezerArtist = await getDeezerArtist(name);
      if (!deezerArtist?.id) {
        res.set('Cache-Control', 'private, max-age=3600');
        return res.json([]);
      }

      const tracks = await getDeezerArtistTopTracks(deezerArtist.id);
      const result = tracks
        .filter(t => t.title && t.title !== '(null)')
        .map(t => ({
          name:      t.title,
          playcount: t.rank || 0,
          listeners: 0,
          url:       null
        }));

      res.set('Cache-Control', 'private, max-age=3600');
      res.json(result);
    } catch (e) {
      console.warn(`Deezer top tracks mislukt voor "${name}":`, e.message);
      res.set('Cache-Control', 'private, max-age=60');
      res.json([]);
    }
  });

  // ── /api/gaps/:artist ─────────────────────────────────────────────────────
  // Haalt gaps (missing albums) op voor een specifieke artiest
  app.get('/api/gaps/:artist', async (req, res) => {
    const artistName = decodeURIComponent(req.params.artist);
    const { getArtistGaps } = deps;

    if (!getArtistGaps) {
      return res.status(500).json({ error: 'getArtistGaps service niet beschikbaar' });
    }

    try {
      const gaps = await getArtistGaps(artistName);

      res.set('Cache-Control', 'private, max-age=3600');
      res.json({
        artist: artistName,
        ...gaps
      });
    } catch (e) {
      console.error(`Gaps API error for "${artistName}":`, e.message);
      res.status(500).json({
        error: e.message,
        artist: artistName,
        owned: [],
        missing: [],
        ownedCount: 0,
        totalCount: 0,
        completeness: 0
      });
    }
  });
};
