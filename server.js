const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;
const API_KEY  = process.env.LASTFM_API_KEY;
const USERNAME = process.env.LASTFM_USER;
const LASTFM   = 'https://ws.audioscrobbler.com/2.0/';
const PLEX_URL   = (process.env.PLEX_URL || 'http://localhost:32400').replace(/\/$/, '');
const PLEX_TOKEN = process.env.PLEX_TOKEN || '';
const MBZ_BASE   = 'https://musicbrainz.org/ws/2';
const MBZ_UA     = 'LastfmPlexDiscovery/2.0 (muziek-ontdekkingen)';

// ── Startup validatie ──────────────────────────────────────────────────────
if (!API_KEY || !USERNAME) {
  console.error('FOUT: LASTFM_API_KEY en LASTFM_USER zijn verplicht. Controleer je .env bestand.');
  process.exit(1);
}

app.use(express.static(path.join(__dirname, 'public')));

// ── Last.fm ────────────────────────────────────────────────────────────────

async function lfm(params, { includeUser = true } = {}) {
  const url = new URL(LASTFM);
  const base = { api_key: API_KEY, format: 'json', ...(includeUser ? { user: USERNAME } : {}) };
  Object.entries({ ...base, ...params })
    .forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.error) throw new Error(data.message || `Last.fm fout ${data.error}`);
  return data;
}

async function getSimilarArtists(artist, limit = 8) {
  const data = await lfm({ method: 'artist.getsimilar', artist, limit }, { includeUser: false });
  return data.similarartists?.artist || [];
}

// ── Plex ──────────────────────────────────────────────────────────────────

let plexArtists    = new Set();
let plexAlbums     = new Set();
let plexAlbumsNorm = new Set();
let plexSectionId  = null;
let plexLastSync   = 0;
let plexSyncOk     = false;

// Normaliseer albumtitels voor fuzzy matching (Plex vs MBZ)
function normStr(s) {
  return (s || '').toLowerCase()
    .replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '')
    .replace(/\b(deluxe|edition|remastered|expanded|anniversary|bonus|special|version|disc|disk|vol|volume)\b/g, '')
    .replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

async function plexGet(urlPath) {
  const res = await fetch(`${PLEX_URL}${urlPath}`, {
    headers: { 'X-Plex-Token': PLEX_TOKEN, 'Accept': 'application/json' },
    timeout: 8000
  });
  if (!res.ok) throw new Error(`Plex HTTP ${res.status}`);
  return res.json();
}

async function syncPlexLibrary(force = false) {
  if (!PLEX_TOKEN) return;
  if (!force && Date.now() - plexLastSync < 3_600_000) return;
  try {
    const sections = await plexGet('/library/sections');
    const music = (sections?.MediaContainer?.Directory || []).find(s => s.type === 'artist');
    if (!music) { console.warn('Plex: geen muziekbibliotheek gevonden'); return; }
    plexSectionId = music.key;

    const [artistData, albumData] = await Promise.all([
      plexGet(`/library/sections/${plexSectionId}/all?type=8`),
      plexGet(`/library/sections/${plexSectionId}/all?type=9`)
    ]);

    plexArtists = new Set(
      (artistData?.MediaContainer?.Metadata || []).map(a => a.title.toLowerCase())
    );
    const albumMeta = albumData?.MediaContainer?.Metadata || [];
    plexAlbums = new Set(albumMeta.map(a =>
      `${(a.parentTitle || '').toLowerCase()}||${a.title.toLowerCase()}`
    ));
    plexAlbumsNorm = new Set(albumMeta.map(a =>
      `${normStr(a.parentTitle)}||${normStr(a.title)}`
    ));

    plexLastSync = Date.now(); plexSyncOk = true;
    console.log(`Plex: ${plexArtists.size} artiesten, ${plexAlbums.size} albums gesynchroniseerd`);
  } catch (e) {
    console.warn('Plex sync mislukt:', e.message);
    plexSyncOk = false;
  }
}

function artistInPlex(name) {
  return plexArtists.has((name || '').toLowerCase());
}
function albumInPlex(artist, album) {
  const orig = `${(artist || '').toLowerCase()}||${(album || '').toLowerCase()}`;
  const norm = `${normStr(artist)}||${normStr(album)}`;
  return plexAlbums.has(orig) || plexAlbumsNorm.has(norm);
}

syncPlexLibrary(true).catch(() => {});

// ── MusicBrainz (rate-limited: 1 req/1.2s) ────────────────────────────────

const mbzCache = new Map();  // urlPath → { data, time }
let mbzChain = Promise.resolve();
let mbzLastCallTime = 0;

// Ruim verlopen MBZ-cache entries elk uur op
setInterval(() => {
  const cutoff = Date.now() - 86_400_000;
  for (const [key, { time }] of mbzCache) {
    if (time < cutoff) mbzCache.delete(key);
  }
}, 3_600_000);

function mbzEnqueue(fn) {
  const p = mbzChain.then(async () => {
    const wait = Math.max(0, 1250 - (Date.now() - mbzLastCallTime));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    mbzLastCallTime = Date.now();
    return fn();
  });
  mbzChain = p.catch(() => {});
  return p;
}

async function mbzGet(urlPath) {
  const cached = mbzCache.get(urlPath);
  if (cached && Date.now() - cached.time < 86_400_000) return cached.data;
  return mbzEnqueue(async () => {
    const res = await fetch(`${MBZ_BASE}${urlPath}`, {
      headers: { 'User-Agent': MBZ_UA, 'Accept': 'application/json' },
      timeout: 12000
    });
    if (!res.ok) throw new Error(`MBZ ${res.status} — ${urlPath}`);
    const data = await res.json();
    mbzCache.set(urlPath, { data, time: Date.now() });
    return data;
  });
}

async function getMBZArtist(name) {
  const q = encodeURIComponent(`artist:"${name.replace(/"/g, '')}"`);
  const data = await mbzGet(`/artist?query=${q}&limit=4&fmt=json`);
  const artists = data.artists || [];
  const exact = artists.find(a => a.name.toLowerCase() === name.toLowerCase());
  const best  = exact || artists[0];
  if (!best) return null;
  return {
    mbid:           best.id,
    name:           best.name,
    country:        best.country || null,
    startYear:      best['life-span']?.begin?.slice(0, 4) || null,
    tags:           (best.tags || []).sort((a, b) => b.count - a.count).slice(0, 6).map(t => t.name),
    disambiguation: best.disambiguation || null
  };
}

async function getMBZAlbums(mbid) {
  if (!mbid) return [];
  const data = await mbzGet(`/release-group?artist=${mbid}&type=album&limit=25&fmt=json`);
  return (data['release-groups'] || [])
    .filter(rg => rg['primary-type'] === 'Album')
    .map(rg => ({
      mbid:     rg.id,
      title:    rg.title,
      year:     rg['first-release-date']?.slice(0, 4) || null,
      coverUrl: `https://coverartarchive.org/release-group/${rg.id}/front-250`
    }))
    .sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
}

async function getDeezerImage(name) {
  try {
    const data = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=3`
    ).then(r => r.json());
    const results = data?.data || [];
    const exact = results.find(a => a.name.toLowerCase() === name.toLowerCase());
    const best  = exact || results[0];
    if (best?.picture_medium && !best.picture_medium.includes('/artist//')) return best.picture_medium;
  } catch (e) {}
  return null;
}

// ── Discovery cache ────────────────────────────────────────────────────────

let discoverCache        = null;
let discoverCacheTime    = 0;
let discoverBuildPromise = null;

async function buildDiscoverCache() {
  console.log('Discover cache bouwen...');
  try {
    await syncPlexLibrary();

    const topData = await lfm({ method: 'user.gettopartists', period: '3month', limit: 10 });
    const topArtists = (topData.topartists?.artist || []).map(a => a.name);

    // Gelijkaardige artiesten parallel ophalen via helper
    const candidateMap = new Map();
    const discoverSimilar = await Promise.all(
      topArtists.slice(0, 5).map(async artist => {
        try { return { artist, similar: await getSimilarArtists(artist, 8) }; }
        catch (e) { return { artist, similar: [] }; }
      })
    );
    for (const { artist, similar } of discoverSimilar) {
      for (const s of similar) {
        if (!topArtists.includes(s.name) && !candidateMap.has(s.name)) {
          candidateMap.set(s.name, {
            name: s.name, match: parseFloat(s.match), reason: artist,
            inPlex: artistInPlex(s.name)
          });
        }
      }
    }

    // Sorteer: nieuwe artiesten (niet in Plex) eerst, dan match-score
    const sorted = Array.from(candidateMap.values())
      .sort((a, b) => (b.match * (b.inPlex ? 0.8 : 1.2)) - (a.match * (a.inPlex ? 0.8 : 1.2)))
      .slice(0, 10);

    // Verrijken met MBZ + Deezer — parallel (mbzEnqueue regelt rate limiting)
    const enriched = await Promise.all(sorted.map(async c => {
      try {
        const [mbz, image] = await Promise.all([
          getMBZArtist(c.name).catch(() => null),
          getDeezerImage(c.name)
        ]);
        let albums = [];
        if (mbz?.mbid) {
          const raw = await getMBZAlbums(mbz.mbid).catch(() => []);
          albums = raw.map(a => ({ ...a, inPlex: albumInPlex(c.name, a.title) }));
        }
        return {
          ...c,
          mbid:        mbz?.mbid || null,
          country:     mbz?.country || null,
          startYear:   mbz?.startYear || null,
          tags:        mbz?.tags || [],
          image,
          albums,
          missingCount: albums.filter(a => !a.inPlex).length,
          totalAlbums:  albums.length
        };
      } catch (e) {
        return { ...c, tags: [], albums: [], missingCount: 0, totalAlbums: 0 };
      }
    }));

    discoverCache     = { artists: enriched, basedOn: topArtists, builtAt: Date.now() };
    discoverCacheTime = Date.now();
    console.log(`Discover cache klaar: ${enriched.length} artiesten`);
  } catch (e) {
    console.error('Discover cache mislukt:', e.message);
  }
}

// ── Gaps cache ─────────────────────────────────────────────────────────────

let gapsCache        = null;
let gapsCacheTime    = 0;
let gapsBuildPromise = null;

async function buildGapsCache() {
  console.log('Gaps cache bouwen...');
  try {
    await syncPlexLibrary();

    const topData = await lfm({ method: 'user.gettopartists', period: 'overall', limit: 20 });
    const topArtists = (topData.topartists?.artist || []).map(a => a.name);
    const plexTop = topArtists.filter(name => artistInPlex(name)).slice(0, 8);

    const gapArtists = [];
    for (const name of plexTop) {
      try {
        const [mbz, image] = await Promise.all([
          getMBZArtist(name).catch(() => null),
          getDeezerImage(name)
        ]);
        if (!mbz?.mbid) continue;

        const raw = await getMBZAlbums(mbz.mbid).catch(() => []);
        const albums  = raw.map(a => ({ ...a, inPlex: albumInPlex(name, a.title) }));
        const missing = albums.filter(a => !a.inPlex);
        if (missing.length === 0) continue;

        gapArtists.push({
          name, image,
          mbid:          mbz.mbid,
          country:       mbz.country,
          startYear:     mbz.startYear,
          tags:          mbz.tags,
          allAlbums:     albums,
          missingAlbums: missing,
          ownedCount:    albums.filter(a => a.inPlex).length,
          totalCount:    albums.length
        });
      } catch (e) {}
    }

    gapsCache     = { artists: gapArtists, builtAt: Date.now() };
    gapsCacheTime = Date.now();
    console.log(`Gaps cache klaar: ${gapArtists.length} artiesten met gaten`);
  } catch (e) {
    console.error('Gaps cache mislukt:', e.message);
  }
}

// ── API: Last.fm standaard ─────────────────────────────────────────────────

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

// Artiest info (Deezer foto + Last.fm albums + MBZ metadata + Plex check)
app.get('/api/artist/:name/info', async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  try {
    const [deezerR, albumsR, mbzR] = await Promise.allSettled([
      fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=3`).then(r => r.json()),
      lfm({ method: 'artist.gettopalbums', artist: name, limit: 6 }, { includeUser: false }),
      getMBZArtist(name)
    ]);

    let image = null;
    if (deezerR.status === 'fulfilled') {
      const results = deezerR.value?.data || [];
      const exact = results.find(a => a.name.toLowerCase() === name.toLowerCase());
      const best  = exact || results[0];
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
            name: a.name,
            image: (img && !img.includes('2a96cbd8b46e442fc41c2b86b821562f')) ? img : null,
            playcount: parseInt(a.playcount) || 0,
            inPlex: albumInPlex(name, a.name)
          };
        });
    }

    const mbz = mbzR.status === 'fulfilled' ? mbzR.value : null;
    res.json({
      image, albums,
      inPlex:    artistInPlex(name),
      country:   mbz?.country || null,
      startYear: mbz?.startYear || null,
      tags:      mbz?.tags || [],
      mbid:      mbz?.mbid || null
    });
  } catch (e) {
    res.status(500).json({ error: e.message, image: null, albums: [], inPlex: false, tags: [] });
  }
});

// Snelle aanbevelingen (Last.fm + Plex, geen MBZ-wachttijd)
app.get('/api/recs', async (req, res) => {
  try {
    await syncPlexLibrary();
    const top = await lfm({ method: 'user.gettopartists', period: '1month', limit: 5 });
    const topArtists = (top.topartists?.artist || []).map(a => a.name);

    let recs = [];
    const similarResults = await Promise.all(
      topArtists.slice(0, 3).map(async artist => {
        try { return { artist, similar: await getSimilarArtists(artist, 8) }; }
        catch (e) { return { artist, similar: [] }; }
      })
    );
    for (const { artist, similar } of similarResults) {
      for (const s of similar) {
        if (!topArtists.includes(s.name) && !recs.find(x => x.name === s.name)) {
          const inPlex = artistInPlex(s.name);
          recs.push({
            name: s.name, reason: artist,
            match: parseFloat(s.match),
            adjustedMatch: parseFloat(s.match) * (inPlex ? 0.9 : 1.15),
            inPlex
          });
        }
      }
    }

    recs.sort((a, b) => b.adjustedMatch - a.adjustedMatch);
    res.json({
      recommendations: recs.slice(0, 12),
      basedOn: topArtists,
      plexConnected: plexSyncOk,
      plexArtistCount: plexArtists.size
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── API: Discovery & Gaps ──────────────────────────────────────────────────

app.get('/api/discover', async (req, res) => {
  const stale = Date.now() - discoverCacheTime > 86_400_000;
  if (stale && !discoverBuildPromise) {
    discoverBuildPromise = buildDiscoverCache().finally(() => { discoverBuildPromise = null; });
  }
  if (!discoverCache) return res.json({ status: 'building', message: 'Muziekontdekkingen worden geanalyseerd (ca. 30 sec)...' });
  res.json({ status: 'ok', ...discoverCache, plexConnected: plexSyncOk });
});

app.get('/api/gaps', async (req, res) => {
  const stale = Date.now() - gapsCacheTime > 86_400_000;
  if (stale && !gapsBuildPromise) {
    gapsBuildPromise = buildGapsCache().finally(() => { gapsBuildPromise = null; });
  }
  if (!gapsCache) return res.json({ status: 'building', message: 'Collectiegaten worden gezocht...' });
  res.json({ status: 'ok', ...gapsCache, plexConnected: plexSyncOk });
});

// Forceer cache refresh
app.post('/api/discover/refresh', (req, res) => {
  discoverCacheTime = 0;
  if (!discoverBuildPromise) {
    discoverBuildPromise = buildDiscoverCache().finally(() => { discoverBuildPromise = null; });
  }
  res.json({ ok: true, building: true });
});
app.post('/api/gaps/refresh', (req, res) => {
  gapsCacheTime = 0;
  if (!gapsBuildPromise) {
    gapsBuildPromise = buildGapsCache().finally(() => { gapsBuildPromise = null; });
  }
  res.json({ ok: true, building: true });
});

// ── API: Plex ──────────────────────────────────────────────────────────────

app.get('/api/plex/status', async (req, res) => {
  if (!PLEX_TOKEN) return res.json({ connected: false, reason: 'Geen PLEX_TOKEN' });
  try {
    await syncPlexLibrary(true);
    res.json({ connected: plexSyncOk, artists: plexArtists.size, albums: plexAlbums.size, lastSync: new Date(plexLastSync).toISOString() });
  } catch (e) { res.json({ connected: false, reason: e.message }); }
});

app.get('/api/plex/nowplaying', async (req, res) => {
  if (!PLEX_TOKEN) return res.json({ playing: false });
  try {
    const data = await plexGet('/status/sessions');
    const music = (data?.MediaContainer?.Metadata || []).find(s => s.type === 'track');
    if (!music) return res.json({ playing: false });
    res.json({ playing: true, track: music.title, artist: music.grandparentTitle || music.originalTitle, album: music.parentTitle });
  } catch (e) { res.json({ playing: false }); }
});

// ── Start ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`App draait op poort ${PORT}`);
  setTimeout(() => { discoverBuildPromise = buildDiscoverCache().finally(() => { discoverBuildPromise = null; }); }, 8_000);
  setTimeout(() => { gapsBuildPromise    = buildGapsCache().finally(() => { gapsBuildPromise = null; }); }, 15_000);
});
