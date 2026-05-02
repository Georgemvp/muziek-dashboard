// ── Background Enrichment Engine ─────────────────────────────────────────────
// Verrijkt alle Plex-artiesten met metadata uit 10 bronnen.
// Resultaten worden permanent gecached (Infinity TTL) in SQLite via db.js.
// Concurrency: maximaal 3 artiesten tegelijk. Voortgang elke 50 artiesten.

'use strict';

const { getCache, setCache }      = require('../db');
const { lfm }                     = require('./lastfm');
const { getMBZArtist }            = require('./musicbrainz');
const { getDeezerArtist, getDeezerArtistTopTracks } = require('./deezer');
const { getPlexArtistNames }      = require('./plex');
const logger                      = require('../logger');

// ── Spotify credentials ──────────────────────────────────────────────────────
const SPOTIFY_CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const GENIUS_TOKEN          = process.env.GENIUS_API_TOKEN;
const DISCOGS_TOKEN         = process.env.DISCOGS_TOKEN;

const DISCOGS_UA = 'LastfmMusiekDashboard/1.0 +https://github.com/casperiv/lastfm-app';

// ── Spotify token cache (in-memory, 55 min TTL) ──────────────────────────────
let _spotifyToken    = null;
let _spotifyTokenExp = 0;

async function _getSpotifyToken() {
  if (_spotifyToken && Date.now() < _spotifyTokenExp) return _spotifyToken;
  const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res   = await fetch('https://accounts.spotify.com/api/token', {
    method:  'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    'grant_type=client_credentials',
    signal:  AbortSignal.timeout(8_000)
  });
  if (!res.ok) throw new Error(`Spotify token fout ${res.status}`);
  const data       = await res.json();
  _spotifyToken    = data.access_token;
  _spotifyTokenExp = Date.now() + 55 * 60 * 1000; // 55 min
  return _spotifyToken;
}

// ── Worker state ─────────────────────────────────────────────────────────────
let _paused      = false;
let _running     = false;
let _processed   = 0;
let _total       = 0;
let _errors      = 0;
let _startedAt   = null;
let _workerTimer = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Voer fn() uit met timeout; geeft null terug bij fout of timeout. */
async function _safe(name, fn, timeoutMs = 12_000) {
  try {
    return await Promise.race([
      fn(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs))
    ]);
  } catch (err) {
    logger.debug({ err: err.message, source: name }, 'enrichment: bron mislukt');
    return null;
  }
}

/** Wacht ms milliseconden (respects pause). */
function _sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Bron 1: Last.fm ──────────────────────────────────────────────────────────
async function _fetchLastfm(name) {
  const cacheKey = `enrich:lastfm:${name.toLowerCase()}`;
  if (getCache(cacheKey) !== null) return getCache(cacheKey);

  return _safe('lastfm', async () => {
    const data = await lfm(
      { method: 'artist.getinfo', artist: name },
      { includeUser: false }
    );
    const a = data?.artist;
    if (!a) return null;
    const result = {
      listeners:  parseInt(a.stats?.listeners) || 0,
      playcount:  parseInt(a.stats?.playcount)  || 0,
      bio:        a.bio?.summary?.replace(/<a[^>]*>.*?<\/a>/gi, '').trim() || null,
      tags:       (a.tags?.tag || []).map(t => t.name).slice(0, 8),
      similar:    (a.similar?.artist || []).map(s => s.name).slice(0, 6)
    };
    setCache(cacheKey, result);
    return result;
  });
}

// ── Bron 2: MusicBrainz ──────────────────────────────────────────────────────
async function _fetchMusicBrainz(name) {
  const cacheKey = `enrich:mbz:${name.toLowerCase()}`;
  if (getCache(cacheKey) !== null) return getCache(cacheKey);

  return _safe('musicbrainz', async () => {
    const data = await getMBZArtist(name);
    if (!data) return null;
    const result = {
      mbid:      data.mbid      || null,
      country:   data.country   || null,
      startYear: data.startYear || null,
      tags:      data.tags      || [],
      type:      data.type      || null
    };
    setCache(cacheKey, result);
    return result;
  });
}

// ── Bron 3: Deezer ────────────────────────────────────────────────────────────
async function _fetchDeezer(name) {
  const cacheKey = `enrich:deezer:${name.toLowerCase()}`;
  if (getCache(cacheKey) !== null) return getCache(cacheKey);

  return _safe('deezer', async () => {
    const artist = await getDeezerArtist(name);
    if (!artist?.id) return null;
    const topTracks = await getDeezerArtistTopTracks(artist.id).catch(() => []);
    const result = {
      id:          artist.id,
      nb_fan:      artist.nb_fan      || 0,
      nb_album:    artist.nb_album    || 0,
      picture:     artist.picture_xl  || artist.picture_medium || null,
      top_tracks:  (topTracks || []).slice(0, 5).map(t => t.title)
    };
    setCache(cacheKey, result);
    return result;
  });
}

// ── Bron 4: Spotify ───────────────────────────────────────────────────────────
async function getSpotifyArtist(name) {
  const cacheKey = `enrich:spotify:${name.toLowerCase()}`;
  if (getCache(cacheKey) !== null) return getCache(cacheKey);

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) return null;

  return _safe('spotify', async () => {
    const token = await _getSpotifyToken();
    const url   = `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`;
    const res   = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal:  AbortSignal.timeout(8_000)
    });
    if (!res.ok) throw new Error(`Spotify ${res.status}`);
    const data   = await res.json();
    const artist = data?.artists?.items?.[0];
    if (!artist) return null;
    const result = {
      spotify_id:  artist.id,
      popularity:  artist.popularity  || 0,
      genres:      artist.genres      || [],
      followers:   artist.followers?.total || 0,
      image:       artist.images?.[0]?.url || null
    };
    setCache(cacheKey, result);
    return result;
  });
}

// ── Bron 5: iTunes/Apple Music ───────────────────────────────────────────────
async function getITunesArtist(name) {
  const cacheKey = `enrich:itunes:${name.toLowerCase()}`;
  if (getCache(cacheKey) !== null) return getCache(cacheKey);

  return _safe('itunes', async () => {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=musicArtist&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) throw new Error(`iTunes ${res.status}`);
    const data   = await res.json();
    const artist = data?.results?.[0];
    if (!artist) return null;
    const result = {
      artistId:        artist.artistId        || null,
      primaryGenreName: artist.primaryGenreName || null,
      artistLinkUrl:   artist.artistLinkUrl   || null
    };
    setCache(cacheKey, result);
    return result;
  });
}

// ── Bron 6: Discogs ───────────────────────────────────────────────────────────
async function getDiscogsArtist(name) {
  const cacheKey = `enrich:discogs:${name.toLowerCase()}`;
  if (getCache(cacheKey) !== null) return getCache(cacheKey);

  return _safe('discogs', async () => {
    const url     = `https://api.discogs.com/database/search?q=${encodeURIComponent(name)}&type=artist&per_page=1`;
    const headers = { 'User-Agent': DISCOGS_UA };
    if (DISCOGS_TOKEN) headers.Authorization = `Discogs token=${DISCOGS_TOKEN}`;

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`Discogs ${res.status}`);
    const data   = await res.json();
    const artist = data?.results?.[0];
    if (!artist) return null;
    const result = {
      id:              artist.id             || null,
      profile:         artist.comment        || null,
      urls:            artist.uri            ? [`https://www.discogs.com${artist.uri}`] : [],
      namevariations:  artist.title          ? [artist.title] : []
    };
    setCache(cacheKey, result);
    return result;
  });
}

// ── Bron 7: TheAudioDB ────────────────────────────────────────────────────────
async function getAudioDBArtist(name) {
  const cacheKey = `enrich:audiodb:${name.toLowerCase()}`;
  if (getCache(cacheKey) !== null) return getCache(cacheKey);

  return _safe('audiodb', async () => {
    const url = `https://theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(name)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`AudioDB ${res.status}`);
    const data   = await res.json();
    const artist = data?.artists?.[0];
    if (!artist) return null;
    const result = {
      strMood:         artist.strMood          || null,
      strStyle:        artist.strStyle         || null,
      strGenre:        artist.strGenre         || null,
      strBiographyEN:  artist.strBiographyEN   || null,
      strCountry:      artist.strCountry       || null,
      intFormedYear:   artist.intFormedYear    || null,
      strThumb:        artist.strArtistThumb   || null
    };
    setCache(cacheKey, result);
    return result;
  });
}

// ── Bron 8: Genius ───────────────────────────────────────────────────────────
async function getGeniusArtist(name) {
  const cacheKey = `enrich:genius:${name.toLowerCase()}`;
  if (getCache(cacheKey) !== null) return getCache(cacheKey);

  if (!GENIUS_TOKEN) return null;

  return _safe('genius', async () => {
    const url = `https://api.genius.com/search?q=${encodeURIComponent(name)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${GENIUS_TOKEN}` },
      signal:  AbortSignal.timeout(8_000)
    });
    if (!res.ok) throw new Error(`Genius ${res.status}`);
    const data = await res.json();
    const hit  = data?.response?.hits?.find(h => h.type === 'song')?.result?.primary_artist;
    if (!hit) return null;
    const result = {
      id:          hit.id          || null,
      url:         hit.url         || null,
      image_url:   hit.image_url   || null,
      description: hit.description?.plain || null
    };
    setCache(cacheKey, result);
    return result;
  });
}

// ── Bron 9: Tidal ─────────────────────────────────────────────────────────────
async function getTidalArtist(name) {
  const cacheKey = `enrich:tidal:${name.toLowerCase()}`;
  if (getCache(cacheKey) !== null) return getCache(cacheKey);

  return _safe('tidal', async () => {
    const url = `https://api.tidal.com/v1/search?query=${encodeURIComponent(name)}&types=ARTISTS&limit=1&countryCode=NL`;
    const res = await fetch(url, {
      headers: { 'X-Tidal-Token': 'wdgaB1CilGA-S_s2' },
      signal:  AbortSignal.timeout(8_000)
    });
    if (!res.ok) throw new Error(`Tidal ${res.status}`);
    const data   = await res.json();
    const artist = data?.artists?.items?.[0];
    if (!artist) return null;
    const result = {
      id:         artist.id         || null,
      popularity: artist.popularity || 0,
      url:        artist.url        || null
    };
    setCache(cacheKey, result);
    return result;
  });
}

// ── Bron 10: Qobuz ───────────────────────────────────────────────────────────
async function getQobuzArtist(name) {
  const cacheKey = `enrich:qobuz:${name.toLowerCase()}`;
  if (getCache(cacheKey) !== null) return getCache(cacheKey);

  return _safe('qobuz', async () => {
    const url = `https://www.qobuz.com/api.json/0.2/artist/search?query=${encodeURIComponent(name)}&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) throw new Error(`Qobuz ${res.status}`);
    const data   = await res.json();
    const artist = data?.artists?.items?.[0];
    if (!artist) return null;
    const result = {
      id:           artist.id           || null,
      slug:         artist.slug         || null,
      albums_count: artist.albums_count || 0,
      image:        artist.picture      || null
    };
    setCache(cacheKey, result);
    return result;
  });
}

// ── enrichArtist: haal alle 10 bronnen parallel op ───────────────────────────

/**
 * Verrijkt één artiest met metadata uit alle 10 bronnen.
 * Bronnen met bestaande cache worden overgeslagen (zero API calls).
 * @returns {object} object met per-bron resultaten
 */
async function enrichArtist(name) {
  const [lastfm, mbz, deezer, spotify, itunes, discogs, audiodb, genius, tidal, qobuz] =
    await Promise.all([
      _fetchLastfm(name),
      _fetchMusicBrainz(name),
      _fetchDeezer(name),
      getSpotifyArtist(name),
      getITunesArtist(name),
      getDiscogsArtist(name),
      getAudioDBArtist(name),
      getGeniusArtist(name),
      getTidalArtist(name),
      getQobuzArtist(name)
    ]);

  return { name, lastfm, mbz, deezer, spotify, itunes, discogs, audiodb, genius, tidal, qobuz };
}

// ── getEnrichedArtist: gecombineerde artiestdata ──────────────────────────────

/**
 * Combineert alle 10 cache-entries tot één genormaliseerd artiest-object.
 * Leest alleen uit cache — doet geen API-calls.
 * @returns {object|null}
 */
function getEnrichedArtist(name) {
  const key = name.toLowerCase();
  const lastfm   = getCache(`enrich:lastfm:${key}`);
  const mbz      = getCache(`enrich:mbz:${key}`);
  const deezer   = getCache(`enrich:deezer:${key}`);
  const spotify  = getCache(`enrich:spotify:${key}`);
  const itunes   = getCache(`enrich:itunes:${key}`);
  const discogs  = getCache(`enrich:discogs:${key}`);
  const audiodb  = getCache(`enrich:audiodb:${key}`);
  const genius   = getCache(`enrich:genius:${key}`);
  const tidal    = getCache(`enrich:tidal:${key}`);
  const qobuz    = getCache(`enrich:qobuz:${key}`);

  // Genres: samengevoegd en gededupliceerd uit alle bronnen
  const genreSet = new Set([
    ...(lastfm?.tags    || []),
    ...(mbz?.tags       || []),
    ...(spotify?.genres || []),
    ...(itunes?.primaryGenreName ? [itunes.primaryGenreName] : []),
    ...(audiodb?.strGenre  ? [audiodb.strGenre]  : []),
    ...(audiodb?.strStyle  ? [audiodb.strStyle]  : []),
    ...(audiodb?.strMood   ? [audiodb.strMood]   : [])
  ].map(g => g.toLowerCase().trim()).filter(Boolean));

  return {
    name,
    mbid:       mbz?.mbid       || null,
    genres:     [...genreSet],
    popularity: spotify?.popularity ?? (deezer?.nb_fan ? Math.min(100, Math.round(deezer.nb_fan / 10_000)) : null),
    mood:       audiodb?.strMood    || null,
    style:      audiodb?.strStyle   || null,
    bio:        audiodb?.strBiographyEN || lastfm?.bio || null,
    country:    mbz?.country    || audiodb?.strCountry || null,
    startYear:  mbz?.startYear  || audiodb?.intFormedYear || null,
    image:      deezer?.picture || spotify?.image || audiodb?.strThumb || genius?.image_url || null,
    listeners:  lastfm?.listeners || 0,
    allIds: {
      lastfm:   name,
      mbid:     mbz?.mbid            || null,
      deezer:   deezer?.id           || null,
      spotify:  spotify?.spotify_id  || null,
      itunes:   itunes?.artistId     || null,
      discogs:  discogs?.id          || null,
      genius:   genius?.id           || null,
      tidal:    tidal?.id            || null,
      qobuz:    qobuz?.id            || null
    },
    _sources: {
      lastfm:  lastfm  !== null,
      mbz:     mbz     !== null,
      deezer:  deezer  !== null,
      spotify: spotify !== null,
      itunes:  itunes  !== null,
      discogs: discogs !== null,
      audiodb: audiodb !== null,
      genius:  genius  !== null,
      tidal:   tidal   !== null,
      qobuz:   qobuz   !== null
    }
  };
}

// ── Worker ────────────────────────────────────────────────────────────────────

/**
 * Voert enrichment uit voor alle Plex-artiesten met concurrency van 3.
 * Sla artiesten over die al volledig verrijkt zijn (alle 10 bronnen in cache).
 */
async function runEnrichmentWorker() {
  if (_running) {
    logger.debug('enrichment: worker is al actief, skip');
    return;
  }
  _running   = true;
  _startedAt = Date.now();

  const artistMap  = getPlexArtistNames(); // Map: lowercase → originele naam
  const allArtists = [...artistMap.values()];
  _total     = allArtists.length;
  _processed = 0;
  _errors    = 0;

  logger.info({ total: _total }, 'enrichment: worker gestart');

  const CONCURRENCY = 3;

  // Verwerk artiesten in batches van CONCURRENCY
  for (let i = 0; i < allArtists.length; i += CONCURRENCY) {
    if (_paused) {
      logger.info('enrichment: gepauzeerd, wachten...');
      while (_paused) await _sleep(2_000);
      logger.info('enrichment: hervat');
    }

    const batch = allArtists.slice(i, i + CONCURRENCY);

    await Promise.all(batch.map(async (name) => {
      // Controleer of alle 10 bronnen al gecached zijn — zo ja, skip
      const key = name.toLowerCase();
      const allCached = [
        `enrich:lastfm:${key}`, `enrich:mbz:${key}`,    `enrich:deezer:${key}`,
        `enrich:spotify:${key}`, `enrich:itunes:${key}`, `enrich:discogs:${key}`,
        `enrich:audiodb:${key}`, `enrich:genius:${key}`, `enrich:tidal:${key}`,
        `enrich:qobuz:${key}`
      ].every(k => getCache(k) !== null);

      if (allCached) {
        _processed++;
        return;
      }

      try {
        await enrichArtist(name);
      } catch (err) {
        _errors++;
        logger.warn({ err: err.message, name }, 'enrichment: artiest mislukt');
      }
      _processed++;
    }));

    // Voortgang elke 50 artiesten loggen
    if (Math.floor(_processed / 50) > Math.floor((_processed - CONCURRENCY) / 50)) {
      const pct = Math.round((_processed / _total) * 100);
      logger.info(
        { processed: _processed, total: _total, errors: _errors, pct },
        'enrichment: voortgang'
      );
    }

    // Kleine pauze tussen batches om APIs niet te overbelasten
    await _sleep(200);
  }

  const elapsed = Math.round((Date.now() - _startedAt) / 1000);
  logger.info(
    { processed: _processed, total: _total, errors: _errors, elapsed },
    'enrichment: worker voltooid'
  );
  _running = false;
}

// ── Pause / Resume ────────────────────────────────────────────────────────────

function pauseEnrichment()  { _paused = true;  logger.info('enrichment: gepauzeerd');  }
function resumeEnrichment() { _paused = false; logger.info('enrichment: hervat');       }

// ── Status ────────────────────────────────────────────────────────────────────

function getEnrichmentStatus() {
  return {
    running:   _running,
    paused:    _paused,
    processed: _processed,
    total:     _total,
    errors:    _errors,
    startedAt: _startedAt,
    pct:       _total > 0 ? Math.round((_processed / _total) * 100) : 0
  };
}

// ── Init: start worker na 20s delay, herstart elke 12 uur ────────────────────

function initEnrichment() {
  logger.info('enrichment: initialisatie, worker start over 20 seconden');

  setTimeout(() => {
    runEnrichmentWorker().catch(err =>
      logger.error({ err }, 'enrichment: worker crash bij opstarten')
    );
  }, 20_000);

  // Herstart elke 12 uur
  _workerTimer = setInterval(() => {
    if (_running) {
      logger.debug('enrichment: vorige run nog bezig, 12u-herstart overgeslagen');
      return;
    }
    logger.info('enrichment: geplande 12u-herstart');
    runEnrichmentWorker().catch(err =>
      logger.error({ err }, 'enrichment: worker crash bij herstart')
    );
  }, 12 * 3_600_000);
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  enrichArtist,
  getEnrichedArtist,
  runEnrichmentWorker,
  initEnrichment,
  pauseEnrichment,
  resumeEnrichment,
  getEnrichmentStatus,
  // Individuele bron-functies (voor directe aanroep of tests)
  getSpotifyArtist,
  getITunesArtist,
  getDiscogsArtist,
  getAudioDBArtist,
  getGeniusArtist,
  getTidalArtist,
  getQobuzArtist
};
