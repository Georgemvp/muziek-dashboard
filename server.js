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
const { plexGet, syncPlexLibrary, artistInPlex, albumInPlex, getPlexStatus, PLEX_TOKEN } = require('./services/plex');
const { getMBZArtist }                                              = require('./services/musicbrainz');
const { getDeezerImage }                                            = require('./services/deezer');
const { getDiscover, refreshDiscover, initDiscover }               = require('./services/discover');
const { getGaps, refreshGaps, initGaps }                           = require('./services/gaps');

app.use(express.static(path.join(__dirname, 'public')));

// ── API: Last.fm ───────────────────────────────────────────────────────────

app.get('/api/user', async (req, res) => {
  try { res.json(await lfm({ method: 'user.getinfo' })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/recent', async (req, res) => {
  try { res.json(await lfm({ method: 'user.getrecenttracks', limit: 20 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/topartists', async (req, res) => {
  try { res.json(await lfm({ method: 'user.gettopartists', period: req.query.period || '7day', limit: 20 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/toptracks', async (req, res) => {
  try { res.json(await lfm({ method: 'user.gettoptracks', period: req.query.period || '7day', limit: 20 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/loved', async (req, res) => {
  try { res.json(await lfm({ method: 'user.getlovedtracks', limit: 20 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
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
    await syncPlexLibrary();
    const top        = await lfm({ method: 'user.gettopartists', period: '1month', limit: 5 });
    const topArtists = (top.topartists?.artist || []).map(a => a.name);

    let recs = [];
    const results = await Promise.all(
      topArtists.slice(0, 3).map(async artist => {
        try { return { artist, similar: await getSimilarArtists(artist, 8) }; }
        catch { return { artist, similar: [] }; }
      })
    );
    for (const { artist, similar } of results) {
      for (const s of similar) {
        if (!topArtists.includes(s.name) && !recs.find(x => x.name === s.name)) {
          const inPlex = artistInPlex(s.name);
          recs.push({ name: s.name, reason: artist, match: parseFloat(s.match), adjustedMatch: parseFloat(s.match) * (inPlex ? 0.9 : 1.15), inPlex });
        }
      }
    }
    recs.sort((a, b) => b.adjustedMatch - a.adjustedMatch);

    const { ok, artistCount } = getPlexStatus();
    res.json({ recommendations: recs.slice(0, 12), basedOn: topArtists, plexConnected: ok, plexArtistCount: artistCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── API: Discover & Gaps ───────────────────────────────────────────────────

app.get('/api/discover',          (req, res) => res.json(getDiscover()));
app.get('/api/gaps',              (req, res) => res.json(getGaps()));
app.post('/api/discover/refresh', (req, res) => res.json(refreshDiscover()));
app.post('/api/gaps/refresh',     (req, res) => res.json(refreshGaps()));

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

// ── Start ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`App draait op poort ${PORT}`);
  syncPlexLibrary(true).catch(() => {});
  initDiscover();
  initGaps();
});
