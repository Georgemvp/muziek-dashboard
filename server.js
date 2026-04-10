// ── Startup validatie ──────────────────────────────────────────────────────
if (!process.env.LASTFM_API_KEY || !process.env.LASTFM_USER) {
  console.error('FOUT: LASTFM_API_KEY en LASTFM_USER zijn verplicht. Controleer je .env bestand.');
  process.exit(1);
}

const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 80;

// ── Services ───────────────────────────────────────────────────────────────
const { lfm, getSimilarArtists }                                    = require('./services/lastfm');
const { plexGet, syncPlexLibrary, artistInPlex, albumInPlex, getPlexStatus, getPlexArtistNames, getPlexLibrary, PLEX_TOKEN } = require('./services/plex');
const { getMBZArtist }                                              = require('./services/musicbrainz');
const { getDeezerImage }                                            = require('./services/deezer');
const { getDiscover, refreshDiscover, initDiscover }               = require('./services/discover');
const { getGaps, refreshGaps, initGaps }                           = require('./services/gaps');
const { getReleases, refreshReleases, initReleases }               = require('./services/releases');
const { getCache, setCache, getCacheAge, getWishlist, addToWishlist, removeFromWishlist } = require('./db');

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

// ── API: Aanbevelingen ─────────────────────────────────────────────────────

app.get('/api/recs', async (req, res) => {
  try {
    const cached = getCache('api:recs', 900_000); // STAP 11: 15 min TTL
    if (cached) return res.json(cached);
    await syncPlexLibrary();
    const top        = await lfm({ method: 'user.gettopartists', period: '3month', limit: 15 });
    const topArtists = (top.topartists?.artist || []).map(a => a.name);

    // ── Artiest-aanbevelingen ─────────────────────────────────────────────
    let recs = [];
    const simResults = await Promise.all(
      topArtists.slice(0, 10).map(async artist => {
        try { return { artist, similar: await getSimilarArtists(artist, 15) }; }
        catch { return { artist, similar: [] }; }
      })
    );
    for (const { artist, similar } of simResults) {
      for (const s of similar) {
        if (!topArtists.includes(s.name) && !recs.find(x => x.name === s.name)) {
          const inPlex = artistInPlex(s.name);
          recs.push({ name: s.name, reason: artist, match: parseFloat(s.match), adjustedMatch: parseFloat(s.match) * (inPlex ? 0.9 : 1.15), inPlex });
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
      plexConnected:    ok,
      plexArtistCount:  artistCount
    };
    setCache('api:recs', result); // STAP 11: sla op in cache
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
