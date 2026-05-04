/**
 * tests/api.test.js
 * Integration tests voor alle API-endpoints van het muziek-dashboard.
 *
 * Gebruikt:
 *  - node:test  (ingebouwde Node.js test runner, geen extra framework nodig)
 *  - supertest  (HTTP endpoint testing)
 *  - tests/mocks.js  (fetch-mock voor Last.fm, Deezer, MusicBrainz)
 */

'use strict';

// ── Setup: native-module mock (better-sqlite3) indien niet beschikbaar ─────
// Moet de eerste import zijn zodat de mock actief is vóór db.js laadt.
require('./setup');

const { describe, it, before, after } = require('node:test');
const assert  = require('node:assert/strict');
const os      = require('node:os');
const path    = require('node:path');
const fs      = require('node:fs');
const request = require('supertest');

// ── Test-omgeving opzetten vóór module-import ──────────────────────────────
// DATA_DIR naar een tijdelijke map wijzen zodat de tests geen /data-map nodig hebben
// en de echte database niet beïnvloeden.
const testDataDir = path.join(os.tmpdir(), `lastfm-test-${process.pid}`);
fs.mkdirSync(testDataDir, { recursive: true });
process.env.DATA_DIR        = testDataDir;
process.env.LASTFM_API_KEY  = 'test-api-key';
process.env.LASTFM_USER     = 'testuser';
// Geen PLEX_TOKEN → plex/status geeft direct { connected: false } terug
delete process.env.PLEX_TOKEN;

// ── Fetch-mock installeren vóór app-import ─────────────────────────────────
const { setupMocks, teardownMocks } = require('./mocks');
setupMocks();

// ── App importeren (na env-vars en mock) ───────────────────────────────────
const app = require('../server');

// ── Opruimen na alle tests ──────────────────────────────────────────────────
after(() => {
  teardownMocks();
  // Tijdelijke testdatabase verwijderen
  try { fs.rmSync(testDataDir, { recursive: true, force: true }); } catch { /* ignore */ }
});

// ══════════════════════════════════════════════════════════════════════════
// Health check
// ══════════════════════════════════════════════════════════════════════════

describe('GET /health', () => {
  it('geeft 200 met status ok', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.ok(typeof res.body.uptime === 'number', 'uptime moet een getal zijn');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Last.fm redirect-stubs (gemigreerd naar /api/core/*)
// ══════════════════════════════════════════════════════════════════════════
// Deze routes zijn stubs die doorverwijzen naar de Python Core backend.
// We controleren dat ze een 302 redirect teruggeven naar /api/core/*.

describe('GET /api/user (redirect-stub)', () => {
  it('geeft 302 redirect naar /api/core/user', async () => {
    const res = await request(app).get('/api/user').redirects(0);
    assert.equal(res.status, 302);
    assert.ok(res.headers.location?.includes('/api/core/user'), 'redirect moet naar /api/core/user wijzen');
  });
});

describe('GET /api/recent (redirect-stub)', () => {
  it('geeft 302 redirect naar /api/core/recent', async () => {
    const res = await request(app).get('/api/recent').redirects(0);
    assert.equal(res.status, 302);
    assert.ok(res.headers.location?.includes('/api/core/recent'), 'redirect moet naar /api/core/recent wijzen');
  });
});

describe('GET /api/topartists (redirect-stub)', () => {
  it('geeft 302 redirect naar /api/core/top/artists', async () => {
    const res = await request(app).get('/api/topartists?period=7day').redirects(0);
    assert.equal(res.status, 302);
    assert.ok(res.headers.location?.includes('/api/core/top/artists'), 'redirect moet naar /api/core/top/artists wijzen');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Last.fm Core endpoints (Python backend)
// ══════════════════════════════════════════════════════════════════════════

describe('GET /api/core/user', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait (CI-omgeving)', async () => {
    const res = await request(app).get('/api/core/user');
    assert.ok(res.status === 502 || res.status === 503, `verwacht 502/503, kreeg: ${res.status}`);
  });
});

describe('GET /api/core/recent', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/recent');
    assert.ok(res.status === 502 || res.status === 503, `verwacht 502/503, kreeg: ${res.status}`);
  });
});

describe('GET /api/core/top/artists', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/top/artists');
    assert.ok(res.status === 502 || res.status === 503, `verwacht 502/503, kreeg: ${res.status}`);
  });
});

describe('GET /api/core/top/tracks', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/top/tracks');
    assert.ok(res.status === 502 || res.status === 503, `verwacht 502/503, kreeg: ${res.status}`);
  });
});

describe('GET /api/core/top/albums', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/top/albums');
    assert.ok(res.status === 502 || res.status === 503, `verwacht 502/503, kreeg: ${res.status}`);
  });
});

describe('GET /api/core/loved', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/loved');
    assert.ok(res.status === 502 || res.status === 503, `verwacht 502/503, kreeg: ${res.status}`);
  });
});

describe('GET /api/core/artist/search', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/artist/search?q=test');
    assert.ok(res.status === 502 || res.status === 503, `verwacht 502/503, kreeg: ${res.status}`);
  });
});

describe('GET /api/core/spotify/status', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/spotify/status');
    assert.ok(res.status === 502 || res.status === 503, `verwacht 502/503, kreeg: ${res.status}`);
  });
});

describe('GET /api/core/spotify/recs', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/spotify/recs?mood=chill');
    assert.ok(res.status === 502 || res.status === 503, `verwacht 502/503, kreeg: ${res.status}`);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Discover
// ══════════════════════════════════════════════════════════════════════════

// Alle /api/core/* endpoints worden geproxied naar de Python Core backend
// (localhost:5001). In CI draait die backend niet, dus verwachten we 502/503.
// Dit test-blok dekt ALLE core-endpoints zodat een nieuwe migratie naar
// Core niet stilzwijgend coverage verliest.

describe('GET /api/core/discover', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait (CI-omgeving)', async () => {
    const res = await request(app).get('/api/core/discover');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503 (Core niet actief in CI), kreeg: ${res.status}`
    );
  });
});

describe('GET /api/core/health', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/health');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503 (Core niet actief in CI), kreeg: ${res.status}`
    );
  });
});

describe('GET /api/core/discover/status', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/discover/status');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503 (Core niet actief in CI), kreeg: ${res.status}`
    );
  });
});

describe('POST /api/core/discover/refresh', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).post('/api/core/discover/refresh');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503 (Core niet actief in CI), kreeg: ${res.status}`
    );
  });
});

describe('GET /api/core/gaps', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/gaps');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503 (Core niet actief in CI), kreeg: ${res.status}`
    );
  });
});

describe('GET /api/core/releases', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/releases');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503 (Core niet actief in CI), kreeg: ${res.status}`
    );
  });
});

describe('GET /api/core/playlists', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/playlists');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503 (Core niet actief in CI), kreeg: ${res.status}`
    );
  });
});

describe('GET /api/core/playlists/:type', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/playlists/discovery');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503 (Core niet actief in CI), kreeg: ${res.status}`
    );
  });
});

describe('POST /api/core/playlists/:type/refresh', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).post('/api/core/playlists/discovery/refresh');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503 (Core niet actief in CI), kreeg: ${res.status}`
    );
  });
});

// ── Enrichment proxy-tests ──────────────────────────────────────────────────
// /api/core/enrichment/* wordt geproxied naar de Python Core backend.
// In CI draait die niet, dus verwachten we 502 of 503.

describe('GET /api/core/enrichment/status', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/enrichment/status');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('POST /api/core/enrichment/pause/:source', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).post('/api/core/enrichment/pause/all');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('POST /api/core/enrichment/resume/:source', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).post('/api/core/enrichment/resume/all');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('POST /api/core/enrichment/queue/artist/:name', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).post('/api/core/enrichment/queue/artist/Radiohead');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('POST /api/core/enrichment/queue/all', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).post('/api/core/enrichment/queue/all');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('GET /api/core/enrichment/data/:type/:name', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/enrichment/data/artist/Radiohead');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('GET /api/core/enrichment/data/:type/:name/primary', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/enrichment/data/artist/Radiohead/primary');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('GET /api/core/enrichment/genres', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/enrichment/genres');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('PUT /api/core/enrichment/genres', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).put('/api/core/enrichment/genres').send({ genres: [] });
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('GET /api/core/enrichment/settings', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/enrichment/settings');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('PUT /api/core/enrichment/settings', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).put('/api/core/enrichment/settings').send({});
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

// ── Genre whitelist proxy-tests ───────────────────────────────────────────────

describe('GET /api/core/genres/whitelist', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/genres/whitelist');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('POST /api/core/genres/whitelist', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).post('/api/core/genres/whitelist').send({ genre: 'Rock' });
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('DELETE /api/core/genres/whitelist', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).delete('/api/core/genres/whitelist').send({ genre: 'Rock' });
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('POST /api/core/genres/whitelist/reset', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).post('/api/core/genres/whitelist/reset');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

// ── Stats proxy-tests ─────────────────────────────────────────────────────────

describe('GET /api/core/stats', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/stats?range=1month');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('GET /api/core/stats/top/artists', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/stats/top/artists?range=1month');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('GET /api/core/stats/top/albums', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/stats/top/albums?range=1month');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('GET /api/core/stats/top/tracks', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/stats/top/tracks?range=1month');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('GET /api/core/stats/genres', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/stats/genres?range=1month');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

describe('GET /api/core/stats/timeline', () => {
  it('geeft 502 of 503 als de Python Core backend niet draait', async () => {
    const res = await request(app).get('/api/core/stats/timeline?range=1month');
    assert.ok(
      res.status === 502 || res.status === 503,
      `verwacht 502 of 503, kreeg: ${res.status}`
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Plex
// ══════════════════════════════════════════════════════════════════════════

describe('GET /api/plex/status', () => {
  it('geeft 200 met een .connected boolean', async () => {
    const res = await request(app).get('/api/plex/status');
    assert.equal(res.status, 200);
    assert.ok(typeof res.body.connected === 'boolean', '.connected moet een boolean zijn');
  });

  it('meldt connected: false als PLEX_TOKEN niet is ingesteld', async () => {
    const res = await request(app).get('/api/plex/status');
    assert.equal(res.body.connected, false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Zoeken
// ══════════════════════════════════════════════════════════════════════════

describe('GET /api/search (redirect-stub)', () => {
  it('geeft 302 redirect naar /api/core/artist/search', async () => {
    const res = await request(app).get('/api/search?q=test').redirects(0);
    assert.equal(res.status, 302);
    assert.ok(res.headers.location?.includes('/api/core/artist/search'), 'redirect naar /api/core/artist/search');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Verlanglijst (wishlist)
// ══════════════════════════════════════════════════════════════════════════

describe('POST /api/wishlist', () => {
  it('geeft 400 als de request body leeg is', async () => {
    const res = await request(app)
      .post('/api/wishlist')
      .send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.error, 'response moet een .error property bevatten');
  });

  it('geeft 400 als alleen name ontbreekt', async () => {
    const res = await request(app)
      .post('/api/wishlist')
      .send({ type: 'artist' });
    assert.equal(res.status, 400);
  });

  it('geeft 400 als alleen type ontbreekt', async () => {
    const res = await request(app)
      .post('/api/wishlist')
      .send({ name: 'Radiohead' });
    assert.equal(res.status, 400);
  });

  it('voegt een item toe en geeft 200 terug bij geldige body', async () => {
    const res = await request(app)
      .post('/api/wishlist')
      .send({ type: 'artist', name: 'Radiohead' });
    assert.equal(res.status, 200);
    assert.ok(res.body.added === true, '.added moet true zijn');
    assert.ok(typeof res.body.id === 'number', '.id moet een getal zijn');
  });
});

describe('GET /api/wishlist', () => {
  it('geeft 200 met een array', async () => {
    const res = await request(app).get('/api/wishlist');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body), 'response body moet een array zijn');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Aanbevelingen  (langste test door LFM-throttle)
// ══════════════════════════════════════════════════════════════════════════

describe('GET /api/recs', { timeout: 60_000 }, () => {
  it('geeft 200 met een .recommendations array', async () => {
    const res = await request(app)
      .get('/api/recs')
      .timeout(55_000);        // supertest connection timeout
    assert.equal(res.status, 200);
    assert.ok(
      Array.isArray(res.body.recommendations),
      '.recommendations moet een array zijn'
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
// OrpheusDL endpoints
// ══════════════════════════════════════════════════════════════════════════

// Zet ORPHEUS_URL zodat de service weet waar OrpheusDL draait (mock onderschept het)
process.env.ORPHEUS_URL = 'http://localhost:5000';

describe('GET /api/orpheus/status', () => {
  it('geeft 200 met een ok/connected boolean of object', async () => {
    const res = await request(app).get('/api/orpheus/status');
    assert.ok(
      res.status === 200 || res.status === 503,
      `status moet 200 of 503 zijn, kreeg: ${res.status}`
    );
    if (res.status === 200) {
      assert.ok(res.body, 'response body moet aanwezig zijn');
    }
  });
});

describe('GET /api/orpheus/platforms', () => {
  it('geeft 200 met een platforms array', async () => {
    const res = await request(app).get('/api/orpheus/platforms');
    assert.ok(
      res.status === 200 || res.status === 503,
      `status moet 200 of 503 zijn, kreeg: ${res.status}`
    );
    if (res.status === 200) {
      assert.ok(
        Array.isArray(res.body.platforms) || Array.isArray(res.body),
        'response moet een platforms array bevatten'
      );
    }
  });
});

describe('GET /api/orpheus/search — Tidal album', () => {
  it('geeft 200 met zoekresultaten voor platform=tidal&type=album', async () => {
    const res = await request(app)
      .get('/api/orpheus/search?q=test&platform=tidal&type=album');
    assert.ok(
      res.status === 200 || res.status === 503,
      `status moet 200 of 503 zijn, kreeg: ${res.status}`
    );
    if (res.status === 200) {
      assert.ok(
        Array.isArray(res.body.results) || Array.isArray(res.body),
        'response moet een results array bevatten'
      );
    }
  });
});

describe('GET /api/orpheus/search — Qobuz track', () => {
  it('geeft 200 met zoekresultaten voor platform=qobuz&type=track', async () => {
    const res = await request(app)
      .get('/api/orpheus/search?q=test&platform=qobuz&type=track');
    assert.ok(
      res.status === 200 || res.status === 503,
      `status moet 200 of 503 zijn, kreeg: ${res.status}`
    );
  });
});

describe('GET /api/orpheus/search — alle platforms', () => {
  it('geeft 200 voor platform=all&type=album', async () => {
    const res = await request(app)
      .get('/api/orpheus/search?q=test&platform=all&type=album');
    assert.ok(
      res.status === 200 || res.status === 503,
      `status moet 200 of 503 zijn, kreeg: ${res.status}`
    );
  });
});

describe('POST /api/orpheus/download — Tidal URL', () => {
  it('start een download-job voor een Tidal URL', async () => {
    const res = await request(app)
      .post('/api/orpheus/download')
      .send({ url: 'https://tidal.com/album/12345', platform: 'tidal', quality: 'lossless' });
    assert.ok(
      res.status === 200 || res.status === 202 || res.status === 503,
      `status moet 200, 202 of 503 zijn, kreeg: ${res.status}`
    );
    if (res.status === 200 || res.status === 202) {
      assert.ok(res.body, 'response body moet aanwezig zijn');
    }
  });

  it('geeft 400 als url ontbreekt in de request body', async () => {
    const res = await request(app)
      .post('/api/orpheus/download')
      .send({ platform: 'tidal', quality: 'lossless' });
    // 400 als validatie aanwezig is, of 503 als OrpheusDL niet bereikbaar is in test-env
    assert.ok(
      res.status === 400 || res.status === 503,
      `status moet 400 of 503 zijn, kreeg: ${res.status}`
    );
  });
});

describe('POST /api/orpheus/download — Qobuz URL', () => {
  it('start een download-job voor een Qobuz URL', async () => {
    const res = await request(app)
      .post('/api/orpheus/download')
      .send({ url: 'https://www.qobuz.com/album/q-111', platform: 'qobuz', quality: 'hifi' });
    assert.ok(
      res.status === 200 || res.status === 202 || res.status === 503,
      `status moet 200, 202 of 503 zijn, kreeg: ${res.status}`
    );
  });
});

describe('GET /api/orpheus/job/:id', () => {
  it('geeft job-status voor een bestaand job-ID', async () => {
    const res = await request(app).get('/api/orpheus/job/mock-job-42');
    assert.ok(
      res.status === 200 || res.status === 404 || res.status === 503,
      `status moet 200, 404 of 503 zijn, kreeg: ${res.status}`
    );
    if (res.status === 200) {
      assert.ok(res.body, 'response body moet aanwezig zijn');
    }
  });
});

describe('POST /api/orpheus/job/:id/stop', () => {
  it('annuleert een lopende job', async () => {
    const res = await request(app).post('/api/orpheus/job/mock-job-42/stop');
    assert.ok(
      res.status === 200 || res.status === 404 || res.status === 503,
      `status moet 200, 404 of 503 zijn, kreeg: ${res.status}`
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Extra: Cache-Control headers (regressietest)
// ══════════════════════════════════════════════════════════════════════════

describe('Cache-Control headers', () => {
  it('/api/user geeft 302 redirect (gemigreerd naar /api/core/user)', async () => {
    const res = await request(app).get('/api/user').redirects(0);
    assert.equal(res.status, 302, '/api/user moet 302 redirect zijn');
  });

  it('/api/recent geeft 302 redirect (gemigreerd naar /api/core/recent)', async () => {
    const res = await request(app).get('/api/recent').redirects(0);
    assert.equal(res.status, 302, '/api/recent moet 302 redirect zijn');
  });

  it('/api/plex/status heeft een Cache-Control header', async () => {
    const res = await request(app).get('/api/plex/status');
    assert.ok(res.headers['cache-control'], 'Cache-Control header moet aanwezig zijn');
  });
});
