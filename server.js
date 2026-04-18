// ── Startup validatie ──────────────────────────────────────────────────────
if (!process.env.LASTFM_API_KEY || !process.env.LASTFM_USER) {
  console.error('FOUT: LASTFM_API_KEY en LASTFM_USER zijn verplicht. Controleer je .env bestand.');
  process.exit(1);
}

const express = require('express');
const path    = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app     = express();
const PORT    = process.env.PORT || 80;

// ── Tidarr UI proxy ────────────────────────────────────────────────────────
// Alle verzoeken naar /tidarr-ui/ worden doorgestuurd naar de Tidarr container.
const TIDARR_BASE = (process.env.TIDARR_URL || 'http://tidarr:8484').replace(/\/$/, '');
app.use('/tidarr-ui', createProxyMiddleware({
  target:       TIDARR_BASE,
  changeOrigin: true,
  pathRewrite:  { '^/tidarr-ui': '' },
  on: {
    // Verwijder headers die het tonen in een iframe blokkeren
    proxyRes: (proxyRes) => {
      delete proxyRes.headers['x-frame-options'];
      delete proxyRes.headers['content-security-policy'];
      delete proxyRes.headers['x-content-type-options'];
    },
    error: (err, req, res) => {
      res.status(502).send(`
        <div style="font-family:sans-serif;padding:40px;color:#ccc;background:#1a1a2e;height:100vh;box-sizing:border-box">
          <h2>⚠️ Tidarr niet bereikbaar</h2>
          <p>Tidarr is nog niet opgestart of er is een fout opgetreden.</p>
          <p style="color:#888;font-size:13px">Fout: ${err.message}</p>
          <button onclick="location.reload()" style="margin-top:16px;padding:8px 20px;background:#4a9eff;color:#fff;border:none;border-radius:6px;cursor:pointer">↻ Opnieuw proberen</button>
        </div>
      `);
    }
  }
}));

// ── Services ───────────────────────────────────────────────────────────────
const { lfm, getSimilarArtists }                                    = require('./services/lastfm');
const { plexGet, syncPlexLibrary, artistInPlex, albumInPlex, getPlexStatus, getPlexArtistNames, getPlexLibrary, PLEX_TOKEN } = require('./services/plex');
const { getMBZArtist }                                              = require('./services/musicbrainz');
const { getDeezerImage }                                            = require('./services/deezer');
const { getDiscover, refreshDiscover, initDiscover }               = require('./services/discover');
const { getGaps, refreshGaps, initGaps }                           = require('./services/gaps');
const { getReleases, refreshReleases, initReleases }               = require('./services/releases');
const { searchTidal, findBestAlbum, findTopAlbums, addToQueue, getQueue, getHistory, removeFromQueue, getTidarrStatus } = require('./services/tidarr');
const { getCache, setCache, getCacheAge, getWishlist, addToWishlist, removeFromWishlist, addDownload, getDownloads, getDownloadKeys, removeDownload } = require('./db');
const { TIDARR_URL, TIDARR_API_KEY } = require('./services/tidarr');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ── API: Last.fm ───────────────────────────────────────────────────────────

app.get('/api/user', async (req, res) => {
  try { res.json(await lfm({ method: 'user.getinfo' })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/recent', async (req, res) => {
  try {
    const cached = getCache('api:recent', 120_000); // STAP 11: 2 min TTL
    if (cached) return res.json(cached);
    const data = await lfm({ method: 'user.getrecenttracks', limit: 20 });
    setCache('api:recent', data);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/topartists', async (req, res) => {
  try {
    const period = req.query.period || '7day';
    const cacheKey = `api:topartists:${period}`;
    const cached = getCache(cacheKey, 300_000); // STAP 11: 5 min TTL
    if (cached) return res.json(cached);
    const data = await lfm({ method: 'user.gettopartists', period, limit: 20 });
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/toptracks', async (req, res) => {
  try {
    const period = req.query.period || '7day';
    const cacheKey = `api:toptracks:${period}`;
    const cached = getCache(cacheKey, 300_000); // STAP 11: 5 min TTL
    if (cached) return res.json(cached);
    const data = await lfm({ method: 'user.gettoptracks', period, limit: 20 });
    setCache(cacheKey, data);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/loved', async (req, res) => {
  try {
    const cached = getCache('api:loved', 600_000); // STAP 11: 10 min TTL
    if (cached) return res.json(cached);
    const data = await lfm({ method: 'user.getlovedtracks', limit: 20 });
    setCache('api:loved', data);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── API: Artiest info ──────────────────────────────────────────────────────

app.get('/api/artist/:name/info', async (req, res) => {
  const name = decodeURIComponent(req.params.name);
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
          return {
            name:      a.name,
            image:     (img && !img.includes('2a96cbd8b46e442fc41c2b86b821562f')) ? img : null,
            playcount: parseInt(a.playcount) || 0,
            inPlex:    albumInPlex(name, a.name)
          };
        });
    }

    const mbz = mbzR.status === 'fulfilled' ? mbzR.value : null;
    res.json({
      image, albums,
      inPlex:    artistInPlex(name),
      country:   mbz?.country   || null,
      startYear: mbz?.startYear || null,
      tags:      mbz?.tags      || [],
      mbid:      mbz?.mbid      || null
    });
  } catch (e) {
    res.status(500).json({ error: e.message, image: null, albums: [], inPlex: false, tags: [] });
  }
});

// ── API: Deezer preview ────────────────────────────────────────────────────

app.get('/api/preview', async (req, res) => {
  const artist = (req.query.artist || '').trim();
  const track  = (req.query.track  || '').trim();
  if (!artist || !track) return res.json({ preview: null });

  const cacheKey = `preview:${artist.toLowerCase()}:${track.toLowerCase()}`;
  const cached = getCache(cacheKey, 7 * 24 * 60 * 60 * 1000); // 7 dagen TTL
  if (cached) return res.json(cached);

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
    res.json(result);
  } catch (e) {
    res.json({ preview: null });
  }
});

// ── API: Aanbevelingen ─────────────────────────────────────────────────────

app.get('/api/recs', async (req, res) => {
  try {
    // Cache key rotates every 2 hours to ensure fresh seed rotation
    const cacheKeyRotation = Math.floor(Date.now() / 7_200_000);
    const cacheKey = `api:recs:${cacheKeyRotation}`;
    const cached = getCache(cacheKey, 900_000); // 15 min TTL per key
    if (cached) return res.json(cached);

    await syncPlexLibrary();
    const top        = await lfm({ method: 'user.gettopartists', period: '3month', limit: 30 });
    const topArtists = (top.topartists?.artist || []).map(a => a.name);

    // ── 1. SEED-DIVERSITEIT: Top-5 + 5 random uit posities 10-30 ──────────
    const seedArtists = [];
    // Top-5 seeds
    seedArtists.push(...topArtists.slice(0, 5));
    // 5 random uit posities 10-30
    const candidateRange = topArtists.slice(10, 30);
    if (candidateRange.length > 0) {
      const randomIndices = new Set();
      while (randomIndices.size < Math.min(5, candidateRange.length)) {
        randomIndices.add(Math.floor(Math.random() * candidateRange.length));
      }
      randomIndices.forEach(idx => seedArtists.push(candidateRange[idx]));
    }

    // ── Genre tracking voor genre-spreiding ──────────────────────────────
    const genreCount = {}; // { 'rock': 2, 'pop': 1, ... }
    const stopwords = new Set(['seen live', 'listened', 'favourite', 'favorites', 'love', 'loved', 'awesome', 'cool', 'good', 'great']);

    // Verzamel genres van seed artiesten
    const seedGenreResults = await Promise.allSettled(
      seedArtists.map(artist =>
        lfm({ method: 'artist.gettoptags', artist }, { includeUser: false })
      )
    );
    for (const result of seedGenreResults) {
      if (result.status === 'fulfilled') {
        const tags = (result.value.toptags?.tag || []).slice(0, 3);
        for (const tag of tags) {
          const name = tag.name.toLowerCase().trim();
          if (name.length > 2 && !stopwords.has(name) && !/^\d+$/.test(name)) {
            genreCount[name] = (genreCount[name] || 0) + 1;
          }
        }
      }
    }

    // ── Artiest-aanbevelingen ──────────────────────────────────────────
    let recs = [];
    const simResults = await Promise.all(
      seedArtists.map(async artist => {
        try {
          // 2. MAX PER SEED: Beperk tot 3 similar artists (in plaats van 15)
          return { artist, similar: await getSimilarArtists(artist, 3) };
        }
        catch { return { artist, similar: [] }; }
      })
    );

    for (const { artist, similar } of simResults) {
      for (const s of similar) {
        if (!topArtists.includes(s.name) && !recs.find(x => x.name === s.name)) {
          const inPlex = artistInPlex(s.name);
          let adjustedMatch = parseFloat(s.match) * (inPlex ? 0.9 : 1.4); // 4. NIEUW-VOORKEUR: 1.15 → 1.4

          // ── 3. GENRE-SPREIDING: Penaliseer artiesten met oververtegenwoordigde genres ──
          try {
            const tagsResult = await lfm({ method: 'artist.gettoptags', artist: s.name }, { includeUser: false });
            const tags = (tagsResult.toptags?.tag || []).slice(0, 3);
            let hasOnlyCommonGenres = true;
            let commonGenreCount = 0;

            for (const tag of tags) {
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
          } catch {
            // Genre-check fout: gebruik ongewijzigde adjustedMatch
          }

          recs.push({
            name: s.name,
            reason: artist,
            match: parseFloat(s.match),
            adjustedMatch,
            inPlex
          });
        }
      }
    }

    recs.sort((a, b) => b.adjustedMatch - a.adjustedMatch);
    const topRecs = recs.slice(0, 30);

    // ── Album-aanbevelingen ───────────────────────────────────────────────
    const top8 = topRecs.slice(0, 8);
    const albumResults = await Promise.allSettled(
      top8.map(async rec => {
        try {
          const data = await lfm({ method: 'artist.gettopalbums', artist: rec.name, limit: 3 }, { includeUser: false });
          const albums = (data.topalbums?.album || [])
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
          return albums;
        } catch { return []; }
      })
    );
    const albumRecs = albumResults
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .slice(0, 20);

    // ── Track-aanbevelingen ───────────────────────────────────────────────
    const trackResults = await Promise.allSettled(
      top8.map(async rec => {
        try {
          const data = await lfm({ method: 'artist.gettoptracks', artist: rec.name, limit: 3 }, { includeUser: false });
          const tracks = (data.toptracks?.track || []).map(t => ({
            track:     t.name,
            artist:    rec.name,
            reason:    rec.reason,
            playcount: parseInt(t.playcount) || 0,
            url:       t.url || null
          }));
          return tracks;
        } catch { return []; }
      })
    );
    const trackRecs = trackResults
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .slice(0, 20);

    const { ok, artistCount } = getPlexStatus();
    const result = {
      recommendations:  topRecs,
      albumRecs,
      trackRecs,
      basedOn:          topArtists,
      seedArtists:      seedArtists, // Transparantie: laat zien welke seeds gebruikt zijn
      plexConnected:    ok,
      plexArtistCount:  artistCount
    };
    setCache(cacheKey, result); // Cache per 2-uur rotatie
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── API: Discover & Gaps ───────────────────────────────────────────────────

app.get('/api/discover',          (req, res) => res.json(getDiscover()));
app.get('/api/gaps',              (req, res) => res.json(getGaps()));
app.get('/api/releases',          (req, res) => res.json(getReleases()));
app.post('/api/discover/refresh', (req, res) => res.json(refreshDiscover()));
app.post('/api/gaps/refresh',     (req, res) => res.json(refreshGaps()));
app.post('/api/releases/refresh', (req, res) => res.json(refreshReleases()));

// ── API: Plex ──────────────────────────────────────────────────────────────

app.get('/api/plex/status', async (req, res) => {
  if (!PLEX_TOKEN) return res.json({ connected: false, reason: 'Geen PLEX_TOKEN' });
  try {
    await syncPlexLibrary(true);
    const { ok, artistCount, albumCount, lastSync } = getPlexStatus();
    res.json({ connected: ok, artists: artistCount, albums: albumCount, lastSync: new Date(lastSync).toISOString() });
  } catch (e) { res.json({ connected: false, reason: e.message }); }
});

app.get('/api/plex/nowplaying', async (req, res) => {
  if (!PLEX_TOKEN) return res.json({ playing: false });
  try {
    const data  = await plexGet('/status/sessions');
    const music = (data?.MediaContainer?.Metadata || []).find(s => s.type === 'track');
    if (!music) return res.json({ playing: false });
    res.json({ playing: true, track: music.title, artist: music.grandparentTitle || music.originalTitle, album: music.parentTitle });
  } catch { res.json({ playing: false }); }
});

app.post('/api/plex/refresh', async (req, res) => {
  if (!PLEX_TOKEN) return res.json({ connected: false, reason: 'Geen PLEX_TOKEN' });
  try {
    await syncPlexLibrary(true);
    const { ok, artistCount, albumCount, lastSync } = getPlexStatus();
    res.json({ connected: ok, artists: artistCount, albums: albumCount, lastSync: new Date(lastSync).toISOString() });
  } catch (e) { res.json({ connected: false, reason: e.message }); }
});

app.get('/api/plex/library', (req, res) => {
  if (!PLEX_TOKEN) return res.json({ connected: false, artistCount: 0, albumCount: 0, library: [] });
  const { ok, artistCount, albumCount } = getPlexStatus();
  const library = getPlexLibrary();
  res.json({ connected: ok, artistCount, albumCount: library.length, library });
});

// ── API: Zoeken ────────────────────────────────────────────────────────────

app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ results: [] });
  try {
    const [searchR, deezerR] = await Promise.allSettled([
      lfm({ method: 'artist.search', artist: q, limit: 6 }, { includeUser: false }),
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
    res.json({ results });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── API: Vergelijkbare artiesten ───────────────────────────────────────────

app.get('/api/artist/:name/similar', async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  try {
    const similar = await getSimilarArtists(name, 6);
    res.json({ similar });
  } catch (e) { res.status(500).json({ error: e.message, similar: [] }); }
});

// ── API: Statistieken ──────────────────────────────────────────────────────

app.get('/api/stats', async (req, res) => {
  try {
    const cached = getCache('stats', 3_600_000);
    if (cached) return res.json(cached);

    const [recentR, topR] = await Promise.allSettled([
      lfm({ method: 'user.getrecenttracks', limit: 200 }),
      lfm({ method: 'user.gettopartists', period: '1month', limit: 15 })
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
    setCache('stats', result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── API: Verlanglijst ──────────────────────────────────────────────────────

app.get('/api/wishlist', (req, res) => res.json(getWishlist()));

app.post('/api/wishlist', (req, res) => {
  const { type, name, artist, image } = req.body || {};
  if (!type || !name) return res.status(400).json({ error: 'type en name zijn verplicht' });
  const id = addToWishlist(type, name, artist || null, image || null);
  res.json({ id, added: true });
});

app.delete('/api/wishlist/:id', (req, res) => {
  removeFromWishlist(parseInt(req.params.id));
  res.json({ removed: true });
});

// ── API: Tidarr ────────────────────────────────────────────────────────────

app.get('/api/tidarr/status', async (req, res) => {
  try { res.json(await getTidarrStatus()); }
  catch (e) { res.status(500).json({ connected: false, reason: e.message }); }
});

app.get('/api/tidarr/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ results: [] });
  try { res.json(await searchTidal(q)); }
  catch (e) { res.status(500).json({ error: e.message, results: [] }); }
});

// Slim album-zoeken met meerdere strategieën en fuzzy matching.
// Geeft het best passende album terug, of 404 als niets gevonden.
app.get('/api/tidarr/find', async (req, res) => {
  const artist = (req.query.artist || '').trim();
  const album  = (req.query.album  || '').trim();
  if (!album) return res.status(400).json({ error: 'album is verplicht' });
  try {
    const match = await findBestAlbum(artist, album);
    if (!match) return res.status(404).json({ error: 'Niet gevonden', artist, album });
    res.json(match);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Geeft de top-3 kandidaten terug zodat de frontend een keuze-dialog kan tonen.
app.get('/api/tidarr/candidates', async (req, res) => {
  const artist = (req.query.artist || '').trim();
  const album  = (req.query.album  || '').trim();
  if (!album) return res.status(400).json({ error: 'album is verplicht' });
  try {
    const candidates = await findTopAlbums(artist, album, 3);
    if (!candidates.length) return res.status(404).json({ error: 'Niet gevonden', artist, album });
    res.json({ candidates });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tidarr/download', async (req, res) => {
  const { url, type, title, artist, id, quality } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is verplicht' });
  const validQualities = ['max', 'high', 'normal', 'low'];
  const q = validQualities.includes(quality) ? quality : null;
  try {
    const result = await addToQueue(url, type || 'album', title || '', artist || '', id || '', q);
    // Sla op in de persistente download-geschiedenis
    addDownload({ tidal_id: id || null, artist: artist || '', title: title || '', url, quality: q || process.env.LOCK_QUALITY || 'high' });
    res.json({ ok: true, result });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/tidarr/queue', async (req, res) => {
  try { res.json(await getQueue()); }
  catch (e) { res.status(500).json({ error: e.message, items: [] }); }
});

app.delete('/api/tidarr/queue/:id', async (req, res) => {
  try {
    const result = await removeFromQueue(req.params.id);
    res.json({ ok: true, result });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/tidarr/history', async (req, res) => {
  try { res.json(await getHistory()); }
  catch (e) { res.status(500).json({ error: e.message, items: [] }); }
});

// ── Download-geschiedenis (persistente SQLite-opslag) ──────────────────────

app.get('/api/downloads', (req, res) => {
  try { res.json(getDownloads()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/downloads/keys', (req, res) => {
  try { res.json([...getDownloadKeys()]); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/downloads', (req, res) => {
  const { tidal_id, artist, title, url, quality } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is verplicht' });
  try {
    addDownload({ tidal_id, artist, title, url, quality });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/downloads/:id', (req, res) => {
  try {
    removeDownload(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Tidarr SSE-proxy: stuurt real-time queue updates door naar de browser ──
app.get('/api/tidarr/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const tidarrBase = (process.env.TIDARR_URL || 'http://localhost:8484').replace(/\/$/, '');
  const apiKey     = process.env.TIDARR_API_KEY || '';
  const sseUrl     = `${tidarrBase}/api/stream-processing${apiKey ? `?apikey=${encodeURIComponent(apiKey)}` : ''}`;

  const ac = new AbortController();
  req.on('close', () => ac.abort());

  try {
    const upstream = await fetch(sseUrl, { signal: ac.signal });
    const reader   = upstream.body.getReader();
    const dec      = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(dec.decode(value, { stream: true }));
    }
  } catch { /* verbinding gesloten */ }
  res.end();
});

// ── Health check ───────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  const { ok: plexConnected } = getPlexStatus();
  const discoverAge = getCacheAge('discover');
  const gapsAge     = getCacheAge('gaps');
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    plexConnected,
    cache: {
      discover: discoverAge < Infinity ? Math.round(discoverAge / 1000) + 's' : 'leeg',
      gaps:     gapsAge     < Infinity ? Math.round(gapsAge     / 1000) + 's' : 'leeg'
    }
  });
});

// ── Start ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`App draait op poort ${PORT}`);
  syncPlexLibrary(true).catch(() => {});
  initDiscover();
  initGaps();
  initReleases();
  // Automatische Plex achtergrond-sync elke 30 minuten
  setInterval(() => {
    syncPlexLibrary(true).catch(e => console.warn('Plex achtergrond-sync mislukt:', e.message));
  }, 30 * 60 * 1_000);
});
