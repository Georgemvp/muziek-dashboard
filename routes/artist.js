// ── Artist API Routes ─────────────────────────────────────────────────────────

module.exports = function(app, deps) {
  const { lfm, getMBZArtist, albumInPlex, artistInPlex, getAlbumRatingKey, getCache, setCache, getSimilarArtists, getPlexArtistsByGenre, getWikipediaExtract, getGaps, getArtistGaps } = deps;

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
      const [deezerR, albumsR, mbzR] = await Promise.allSettled([
        fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`, { signal: AbortSignal.timeout(5_000) }).then(r => r.json()),
        lfm({ method: 'artist.gettopalbums', artist: name, limit: 6 }, { includeUser: false }),
        getMBZArtist(name)
      ]);

      let image = null;
      let imageXl = null;
      if (deezerR.status === 'fulfilled') {
        const results = deezerR.value?.data || [];
        const best    = results[0];
        if (best?.picture_medium && !best.picture_medium.includes('/artist//')) {
          image = best.picture_medium;
          imageXl = best.picture_xl || best.picture_medium;
        }
      }

      // Helper: fetch album cover van Deezer als fallback
      const getDeezerAlbumCover = async (albumName) => {
        try {
          const q = `artist:"${name}" album:"${albumName}"`;
          const url = `https://api.deezer.com/search/album?q=${encodeURIComponent(q)}&limit=1`;
          const res = await fetch(url, { signal: AbortSignal.timeout(3_000) }).then(r => r.json());
          const album = res?.data?.[0];
          return album?.cover_medium || null;
        } catch {
          return null;
        }
      };

      let albums = [];
      if (albumsR.status === 'fulfilled') {
        const albumList = (albumsR.value.topalbums?.album || [])
          .filter(a => a.name && a.name !== '(null)' && a.name !== '[unknown]')
          .slice(0, 5);

        // Parallel fetch images voor albums zonder cover
        albums = await Promise.all(albumList.map(async a => {
          let img = a.image?.find(i => i.size === 'medium')?.['#text'] || null;

          // Fallback: als Last.fm image placeholder is, probeer Deezer
          if (!img || img.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
            img = await getDeezerAlbumCover(a.name);
          }

          const inPlex = albumInPlex(name, a.name);
          return {
            name:      a.name,
            image:     img,
            playcount: parseInt(a.playcount) || 0,
            inPlex,
            ratingKey: inPlex ? getAlbumRatingKey(name, a.name) : null,
          };
        }));
      }

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
      const [deezerR, albumsR, mbzR] = await Promise.allSettled([
        fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`, { signal: AbortSignal.timeout(5_000) }).then(r => r.json()),
        lfm({ method: 'artist.gettopalbums', artist: name, limit: 6 }, { includeUser: false }),
        getMBZArtist(name)
      ]);

      let image = null;
      let imageXl = null;
      if (deezerR.status === 'fulfilled') {
        const results = deezerR.value?.data || [];
        const best    = results[0];
        if (best?.picture_medium && !best.picture_medium.includes('/artist//')) {
          image = best.picture_medium;
          imageXl = best.picture_xl || best.picture_medium;
        }
      }

      // Helper: fetch album cover van Deezer als fallback
      const getDeezerAlbumCover = async (albumName) => {
        try {
          const q = `artist:"${name}" album:"${albumName}"`;
          const url = `https://api.deezer.com/search/album?q=${encodeURIComponent(q)}&limit=1`;
          const res = await fetch(url, { signal: AbortSignal.timeout(3_000) }).then(r => r.json());
          const album = res?.data?.[0];
          return album?.cover_medium || null;
        } catch {
          return null;
        }
      };

      let albums = [];
      if (albumsR.status === 'fulfilled') {
        const albumList = (albumsR.value.topalbums?.album || [])
          .filter(a => a.name && a.name !== '(null)' && a.name !== '[unknown]')
          .slice(0, 5);

        // Parallel fetch images voor albums zonder cover
        albums = await Promise.all(albumList.map(async a => {
          let img = a.image?.find(i => i.size === 'medium')?.['#text'] || null;

          // Fallback: als Last.fm image placeholder is, probeer Deezer
          if (!img || img.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
            img = await getDeezerAlbumCover(a.name);
          }

          const inPlex = albumInPlex(name, a.name);
          return {
            name:      a.name,
            image:     img,
            playcount: parseInt(a.playcount) || 0,
            inPlex,
            ratingKey: inPlex ? getAlbumRatingKey(name, a.name) : null,
          };
        }));
      }

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
  // Retourneert gelijkaardige artiesten voor een gegeven artiestnaam.
  // Probeert eerst Last.fm API → fallback naar Plex genres als Last.fm faalt.
  app.get('/api/artist/:name/similar', async (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const { getSimilarArtists, getPlexArtistsByGenre } = deps;

    let similar = [];
    let source = 'lastfm';

    try {
      // PRIMAIR: Probeer Last.fm similar artists (met 8 sec timeout inbegrepen in lfm())
      similar = await getSimilarArtists(name, 6);

      // Als Last.fm 0 resultaten oplevert, probeer Plex-fallback
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
      // Last.fm API faalt geheel → retourneer lege lijst + error flag
      console.warn(`Similar artists API faalt voor "${name}":`, e.message);
      res.set('Cache-Control', 'private, max-age=60');
      res.json({
        similar: [],
        source: 'error',
        error: e.message,
        _lfmDown: true
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
        // Artist info: Deezer image + Last.fm albums + MusicBrainz metadata
        (async () => {
          const [deezerR, albumsR, mbzR] = await Promise.allSettled([
            fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`, { signal: AbortSignal.timeout(5_000) }).then(r => r.json()),
            lfm({ method: 'artist.gettopalbums', artist: name, limit: 6 }, { includeUser: false }),
            getMBZArtist(name)
          ]);

          let image = null;
          let imageXl = null;
          if (deezerR.status === 'fulfilled') {
            const results = deezerR.value?.data || [];
            const best    = results[0];
            if (best?.picture_medium && !best.picture_medium.includes('/artist//')) {
              image = best.picture_medium;
              imageXl = best.picture_xl || best.picture_medium;
            }
          }

          // Helper: fetch album cover van Deezer als fallback
          const getDeezerAlbumCover = async (albumName) => {
            try {
              const q = `artist:"${name}" album:"${albumName}"`;
              const url = `https://api.deezer.com/search/album?q=${encodeURIComponent(q)}&limit=1`;
              const res = await fetch(url, { signal: AbortSignal.timeout(3_000) }).then(r => r.json());
              const album = res?.data?.[0];
              return album?.cover_medium || null;
            } catch {
              return null;
            }
          };

          let albums = [];
          if (albumsR.status === 'fulfilled') {
            const albumList = (albumsR.value.topalbums?.album || [])
              .filter(a => a.name && a.name !== '(null)' && a.name !== '[unknown]')
              .slice(0, 5);

            // Parallel fetch images voor albums zonder cover
            albums = await Promise.all(albumList.map(async a => {
              let img = a.image?.find(i => i.size === 'medium')?.['#text'] || null;

              // Fallback: als Last.fm image placeholder is, probeer Deezer
              if (!img || img.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
                img = await getDeezerAlbumCover(a.name);
              }

              const inPlex = albumInPlex(name, a.name);
              return {
                name:      a.name,
                image:     img,
                playcount: parseInt(a.playcount) || 0,
                inPlex,
                ratingKey: inPlex ? getAlbumRatingKey(name, a.name) : null,
              };
            }));
          }

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

        // Similar artists
        getSimilarArtists(name, 6),

        // Artist-specific gaps
        getArtistGaps(name),

        // Top tracks
        (async () => {
          try {
            const tracksData = await lfm({ method: 'artist.gettoptracks', artist: name, limit: 10 }, { includeUser: false });
            const tracks = (tracksData?.toptracks?.track || [])
              .filter(t => t.name && t.name !== '(null)' && t.name !== '[unknown]')
              .slice(0, 10)
              .map(t => ({
                name: t.name,
                playcount: parseInt(t.playcount) || 0,
                listeners: parseInt(t.listeners) || 0,
                url: t.url || null
              }));
            return tracks;
          } catch (e) {
            console.warn(`Top tracks API failed for "${name}":`, e.message);
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
