// ── Artist API Routes ─────────────────────────────────────────────────────────

module.exports = function(app, deps) {
  const { lfm, getMBZArtist, albumInPlex, artistInPlex, getAlbumRatingKey, getCache, setCache, getSimilarArtists, getPlexArtistsByGenre } = deps;

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
        fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=3`, { signal: AbortSignal.timeout(5_000) }).then(r => r.json()),
        lfm({ method: 'artist.gettopalbums', artist: name, limit: 6 }, { includeUser: false }),
        getMBZArtist(name)
      ]);

      let image = null;
      if (deezerR.status === 'fulfilled') {
        const results = deezerR.value?.data || [];
        const exact   = results.find(a => a.name.toLowerCase() === name.toLowerCase());
        const best    = exact || results[0];
        if (best?.picture_medium && !best.picture_medium.includes('/artist//')) image = best.picture_medium;
      }

      let albums = [];
      if (albumsR.status === 'fulfilled') {
        albums = (albumsR.value.topalbums?.album || [])
          .filter(a => a.name && a.name !== '(null)' && a.name !== '[unknown]')
          .slice(0, 5)
          .map(a => {
            const img = a.image?.find(i => i.size === 'medium')?.['#text'] || null;
            const inPlex = albumInPlex(name, a.name);
            return {
              name:      a.name,
              image:     (img && !img.includes('2a96cbd8b46e442fc41c2b86b821562f')) ? img : null,
              playcount: parseInt(a.playcount) || 0,
              inPlex,
              ratingKey: inPlex ? getAlbumRatingKey(name, a.name) : null,
            };
          });
      }

      const mbz = mbzR.status === 'fulfilled' ? mbzR.value : null;
      const result = {
        image, albums,
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
      res.status(500).json({ error: e.message, image: null, albums: [], inPlex: false, tags: [] });
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
};
