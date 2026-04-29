/**
 * tests/mocks.js
 * Globale fetch-mock voor integration tests.
 * Onderschept aanroepen naar Last.fm, Deezer en MusicBrainz
 * op basis van URL-patroon en query-parameters.
 */

'use strict';

// ── Mock-data ──────────────────────────────────────────────────────────────

const MOCK_ARTISTS = [
  { name: 'Radiohead',   playcount: '500', match: '0.9' },
  { name: 'Portishead',  playcount: '400', match: '0.8' },
  { name: 'Massive Attack', playcount: '350', match: '0.75' },
];

const MOCK_TRACKS = [
  { name: 'Creep', artist: { '#text': 'Radiohead', mbid: '' }, playcount: '800', url: 'https://www.last.fm/music/Radiohead/_/Creep',
    date: { uts: String(Math.floor(Date.now() / 1000) - 3600) } },
];

const MOCK_ALBUMS = [
  { name: 'OK Computer', playcount: '1200',
    image: [{ size: 'medium', '#text': 'https://example.com/ok-computer.jpg' }] },
];

const MOCK_TAGS = [
  { name: 'alternative rock', count: 100 },
  { name: 'electronic',       count: 80  },
  { name: 'trip hop',         count: 60  },
];

// ── Per-methode Last.fm responses ──────────────────────────────────────────

function lastFmResponse(searchParams) {
  const method = searchParams.get('method');

  switch (method) {
    case 'user.getinfo':
      return { user: { name: 'testuser', playcount: '12345', country: 'NL', image: [] } };

    case 'user.getrecenttracks':
      return { recenttracks: { track: MOCK_TRACKS, '@attr': { user: 'testuser', total: '1' } } };

    case 'user.gettopartists':
      return { topartists: { artist: MOCK_ARTISTS, '@attr': { user: 'testuser' } } };

    case 'user.gettoptracks':
      return { toptracks: { track: MOCK_TRACKS, '@attr': { user: 'testuser' } } };

    case 'user.getlovedtracks':
      return { lovedtracks: { track: [], '@attr': { user: 'testuser', total: '0' } } };

    case 'artist.search':
      return {
        results: {
          artistmatches: {
            artist: MOCK_ARTISTS.map(a => ({ ...a, listeners: '5000000', mbid: '' }))
          }
        }
      };

    case 'artist.getsimilar':
      return {
        similarartists: {
          artist: [
            { name: 'Björk',       match: '0.85' },
            { name: 'Aphex Twin',  match: '0.70' },
          ]
        }
      };

    case 'artist.gettoptags':
      return { toptags: { tag: MOCK_TAGS } };

    case 'artist.gettopalbums':
      return { topalbums: { album: MOCK_ALBUMS } };

    case 'artist.gettoptracks':
      return { toptracks: { track: MOCK_TRACKS } };

    default:
      return {};
  }
}

// ── Deezer responses ───────────────────────────────────────────────────────

function deezerResponse(url) {
  if (url.includes('/search/artist')) {
    return {
      data: [{ name: 'Radiohead', picture_medium: 'https://example.com/radiohead.jpg' }]
    };
  }
  if (url.includes('/search/track')) {
    return {
      data: [
        {
          title: 'Creep',
          preview: 'https://example.com/preview.mp3',
          artist: { name: 'Radiohead' },
          album:  { title: 'Pablo Honey', cover_medium: 'https://example.com/cover.jpg' }
        }
      ]
    };
  }
  return { data: [] };
}

// ── MusicBrainz response ───────────────────────────────────────────────────

function musicBrainzResponse() {
  return {
    artists: [
      {
        id:    'a74b1b7f-71a5-4011-9441-d0b5e4122711',
        name:  'Radiohead',
        country: 'GB',
        'life-span': { begin: '1985' },
        tags: [{ name: 'alternative rock', count: 5 }]
      }
    ]
  };
}

// ── OrpheusDL responses ───────────────────────────────────────────────────

const ORPHEUS_PLATFORMS = [
  { id: 'tidal',       name: 'Tidal',       authenticated: true,  qualities: ['atmos','hifi','lossless','high','low'] },
  { id: 'qobuz',       name: 'Qobuz',       authenticated: true,  qualities: ['hifi','lossless','high'] },
  { id: 'deezer',      name: 'Deezer',      authenticated: false, qualities: ['lossless','high','low'] },
  { id: 'spotify',     name: 'Spotify',     authenticated: false, qualities: ['high','low'] },
  { id: 'soundcloud',  name: 'SoundCloud',  authenticated: false, qualities: ['high'] },
  { id: 'applemusic',  name: 'Apple Music', authenticated: false, qualities: ['high'] },
  { id: 'beatport',    name: 'Beatport',    authenticated: false, qualities: ['lossless','high','low'] },
  { id: 'beatsource',  name: 'Beatsource',  authenticated: false, qualities: ['lossless','high','low'] },
  { id: 'youtube',     name: 'YouTube',     authenticated: true,  qualities: ['lossless','high','low'] },
];

const ORPHEUS_SEARCH_RESULTS = {
  tidal: {
    albums: [
      { id: '12345', title: 'OK Computer', artist: 'Radiohead', year: 1997, quality: 'lossless', url: 'https://tidal.com/album/12345' },
    ],
    tracks: [
      { id: '67890', title: 'Creep', artist: 'Radiohead', album: 'Pablo Honey', url: 'https://tidal.com/track/67890' },
    ],
  },
  qobuz: {
    albums: [
      { id: 'q-111', title: 'OK Computer', artist: 'Radiohead', year: 1997, quality: 'hifi', url: 'https://www.qobuz.com/album/q-111' },
    ],
    tracks: [
      { id: 'q-222', title: 'Creep', artist: 'Radiohead', album: 'Pablo Honey', url: 'https://www.qobuz.com/track/q-222' },
    ],
  },
};

function orpheusResponse(url, method = 'GET', body = null) {
  // Status
  if (url.endsWith('/api/status') || url.endsWith('/status')) {
    return { ok: true, version: '1.0.0', uptime: 3600 };
  }
  // Platforms
  if (url.includes('/api/platforms') || url.includes('/platforms')) {
    return { platforms: ORPHEUS_PLATFORMS };
  }
  // Search
  if (url.includes('/api/search') || url.includes('/search')) {
    const parsed = new URL(url);
    const platform = parsed.searchParams.get('platform') || 'tidal';
    const type     = parsed.searchParams.get('type')     || 'album';
    const source   = ORPHEUS_SEARCH_RESULTS[platform] || ORPHEUS_SEARCH_RESULTS.tidal;
    return { results: source[type + 's'] || source.albums || [] };
  }
  // Download (POST)
  if ((url.includes('/api/download') || url.includes('/download')) && method === 'POST') {
    return { jobId: 'mock-job-42', status: 'queued', message: 'Download queued' };
  }
  // Job status
  if (url.match(/\/job\/[^/]+$/) && method === 'GET') {
    return { jobId: 'mock-job-42', status: 'completed', progress: 100, file: '/music/Radiohead - OK Computer.flac' };
  }
  // Job stop
  if (url.match(/\/job\/[^/]+\/stop$/) && method === 'POST') {
    return { jobId: 'mock-job-42', status: 'cancelled' };
  }
  return {};
}

// ── Hoofd mock-functie ─────────────────────────────────────────────────────

/**
 * Bouw een mock JSON-response object.
 */
function mockJson(data, status = 200) {
  return {
    ok:     status >= 200 && status < 300,
    status,
    json:   () => Promise.resolve(data),
    text:   () => Promise.resolve(JSON.stringify(data)),
    headers: new Map(),
    body:   null,
  };
}

/**
 * Installeer de globale fetch-mock.
 * Aanroepen naar audioscrobbler, deezer en musicbrainz worden onderschept.
 * Alle andere URLs (bijv. Plex, Tidarr) krijgen een lege 200-response.
 */
function setupMocks() {
  global.fetch = async (url, options) => {
    const urlStr = String(url);
    const method = (options && options.method) ? options.method.toUpperCase() : 'GET';
    let body = null;
    if (options && options.body) {
      try { body = JSON.parse(options.body); } catch { body = options.body; }
    }

    // ── Last.fm ───────────────────────────────────────────────────────────
    if (urlStr.includes('audioscrobbler.com')) {
      const parsed = new URL(urlStr);
      return mockJson(lastFmResponse(parsed.searchParams));
    }

    // ── Deezer ────────────────────────────────────────────────────────────
    if (urlStr.includes('deezer.com')) {
      return mockJson(deezerResponse(urlStr));
    }

    // ── MusicBrainz ───────────────────────────────────────────────────────
    if (urlStr.includes('musicbrainz.org')) {
      return mockJson(musicBrainzResponse());
    }

    // ── Spotify ───────────────────────────────────────────────────────────
    if (urlStr.includes('spotify.com') || urlStr.includes('spotify.io')) {
      return mockJson({ access_token: 'mock-token', expires_in: 3600, token_type: 'Bearer' });
    }

    // ── OrpheusDL ─────────────────────────────────────────────────────────
    if (urlStr.includes('localhost:5000') || urlStr.includes('orpheus')) {
      return mockJson(orpheusResponse(urlStr, method, body));
    }

    // ── Alles overige (Plex, Tidarr, …): lege success-response ───────────
    return mockJson({});
  };
}

/**
 * Herstel de originele fetch (handig voor teardown).
 */
function teardownMocks() {
  delete global.fetch;
}

module.exports = { setupMocks, teardownMocks, mockJson };
