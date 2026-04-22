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
  global.fetch = async (url, _options) => {
    const urlStr = String(url);

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
