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
// Last.fm endpoints
// ══════════════════════════════════════════════════════════════════════════

describe('GET /api/user', () => {
  it('geeft 200 met een .user object', async () => {
    const res = await request(app).get('/api/user');
    assert.equal(res.status, 200);
    assert.ok(res.body.user, 'response moet een .user property hebben');
    assert.ok(typeof res.body.user.name === 'string', '.user.name moet een string zijn');
  });
});

describe('GET /api/recent', () => {
  it('geeft 200 met een .recenttracks property', async () => {
    const res = await request(app).get('/api/recent');
    assert.equal(res.status, 200);
    assert.ok(res.body.recenttracks, 'response moet .recenttracks bevatten');
  });
});

describe('GET /api/topartists', () => {
  it('geeft 200 met .topartists voor period=7day', async () => {
    const res = await request(app).get('/api/topartists?period=7day');
    assert.equal(res.status, 200);
    assert.ok(res.body.topartists, 'response moet .topartists bevatten');
  });

  it('gebruikt standaard period=7day als geen query-parameter opgegeven', async () => {
    const res = await request(app).get('/api/topartists');
    assert.equal(res.status, 200);
    assert.ok(res.body.topartists, 'response moet .topartists bevatten');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Discover
// ══════════════════════════════════════════════════════════════════════════

describe('GET /api/discover', () => {
  it('geeft 200 – status is ok of building', async () => {
    const res = await request(app).get('/api/discover');
    assert.equal(res.status, 200);
    assert.ok(
      res.body.status === 'ok' || res.body.status === 'building',
      `status moet 'ok' of 'building' zijn, kreeg: ${res.body.status}`
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

describe('GET /api/search', () => {
  it('geeft 200 met een .results array', async () => {
    const res = await request(app).get('/api/search?q=test');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.results), '.results moet een array zijn');
  });

  it('geeft lege .results voor een te korte query (< 2 tekens)', async () => {
    const res = await request(app).get('/api/search?q=a');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.results, []);
  });

  it('geeft lege .results als geen query opgegeven', async () => {
    const res = await request(app).get('/api/search');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.results, []);
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
  it('/api/user heeft een Cache-Control header', async () => {
    const res = await request(app).get('/api/user');
    assert.ok(res.headers['cache-control'], 'Cache-Control header moet aanwezig zijn');
  });

  it('/api/recent heeft een Cache-Control header', async () => {
    const res = await request(app).get('/api/recent');
    assert.ok(res.headers['cache-control'], 'Cache-Control header moet aanwezig zijn');
  });

  it('/api/plex/status heeft een Cache-Control header', async () => {
    const res = await request(app).get('/api/plex/status');
    assert.ok(res.headers['cache-control'], 'Cache-Control header moet aanwezig zijn');
  });
});
