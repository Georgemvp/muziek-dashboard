# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # esbuild watch mode — rebuilds public/app.js + public/styles.css on save
npm run build:frontend   # production minified bundle with code splitting
npm run build            # alias for build:frontend
npm test                 # run all tests (Node native --test runner)
npm run test:watch       # continuous test run
npm run lint             # ESLint on *.js, routes/, services/

NODE_ENV=development LOG_LEVEL=debug node server.js   # run server locally
```

To run a single test file:
```bash
node --test tests/api.test.js
```

Docker:
```bash
docker compose up -d --build        # build + start
docker compose logs -f app          # follow app logs
docker compose exec app sh          # shell into container
docker compose down -v              # destroy container + data volume (clears SQLite cache)
```

## Architecture

**lastfm-app** is a Node.js/Express music dashboard bundled in a single Docker container. Three processes run under supervisord:

| Process | Port | Description |
|---------|------|-------------|
| lastfm (Express) | 80 | Main dashboard — backend + vanilla JS SPA |
| Tidarr (Node) | 8484 | Tidal downloader (git subtree in `tidarr/`) |
| OrpheusDL (Python) | 5000 | Multi-platform downloader (9 services) |

Two additional Python services are embedded as subdirectories:
- **`audiomuse/`** — Flask app backed by Jellyfin, Redis, PostgreSQL; AI-powered playlist clustering (CLAP embeddings)
- **`mediasage/`** — Flask app; LLM-powered playlist & album recommendations against Plex library

These are third-party projects included verbatim. Changes to them should be made carefully.

### Dependency injection

All services are assembled once in `middleware/deps.js` into a single `deps` object, then passed as a second argument to every route module:

```javascript
module.exports = function(app, deps) {
  const { plexGet, getCache, setCache } = deps;
  app.get('/api/...', async (req, res) => { ... });
};
```

`server.js` auto-discovers all route files via `fs.readdirSync('routes/')` and calls them with `(app, deps)`. The `lastfm.js` route is loaded first because it provides `lastFmDown`/`lastFmDownSince` flags that `misc.js` (health check) needs.

### Download system

`services/downloadOrchestrator.js` unifies Tidarr and OrpheusDL downloads:
- Accepts generic quality values (`flac`, `mp3_320`, `mp3_128`) and maps them to platform-specific ones
- Emits events via `services/events.js` (a simple Node EventEmitter singleton)
- `services/postprocess.js` (PostProcessor) listens for `download:complete` events to run post-download steps (AcoustID fingerprinting etc.)

### Frontend routing

`public/src/router.js` uses hash-based routing (`#/viewname`). Views are **lazily loaded** via dynamic `import()` — each view module is only fetched when the user navigates to it. To add a view: add one entry to `viewMeta` and one to `viewLoaders` in `router.js`, then create `public/src/views/{name}.js`.

### State management

`public/src/state.js` exports a plain mutable object. Components import it directly and mutate it. There is no reactivity layer — DOM updates must be triggered manually. This is intentional to keep the bundle small.

### Caching (3 tiers)

1. **SQLite** (`db.js`): key-value store with TTL. Max 2000 rows, 14-day TTL, pruned every 100 writes. Persists across restarts via `/data` volume.
2. **HTTP headers**: `Cache-Control` set per-route (60s–86400s). Chunks get `immutable`.
3. **localStorage**: frontend-only (theme, quality preference).

When external APIs fail, services return stale SQLite data with `_stale: true`. Frontend shows a "cached" indicator.

### Background jobs (startup)

`middleware/startup.js` runs on boot and starts these in parallel:
- Plex library sync (also runs every 30 min)
- Discovery/Gaps/Releases/Genres initialization
- SoulSync playlist engine
- ListenBrainz client
- Automation engine + Enrichment manager
- Mirrored playlist sync (every hour)

### Key services

| Service | Role |
|---------|------|
| `services/plex.js` | Plex library — maintains in-memory Sets/Maps for artist/album lookups; ~1200 lines |
| `services/downloadOrchestrator.js` | Unified download facade over Tidarr + OrpheusDL |
| `services/automation.js` | Rule-based automation engine |
| `services/enrichment/` | Background metadata enrichment pipeline |
| `services/scrobbler.js` | Scrobbling to Last.fm + ListenBrainz |
| `services/playlists.js` | SoulSync playlist engine |
| `services/mirroredPlaylists.js` | Keeps Plex playlists in sync with external sources |
| `services/events.js` | Shared EventEmitter for cross-service communication |
| `services/postprocess.js` | Post-download processing (AcoustID, tagging) |
| `services/logStream.js` | WebSocket log streaming (ws://host/logs) |

### Environment variables

Required: `LASTFM_API_KEY`, `LASTFM_USER`, `PLEX_URL`, `PLEX_TOKEN`

Optional: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `TIDARR_URL`, `TIDARR_API_KEY`, `ORPHEUS_URL`, `PORT` (default 80), `LOG_LEVEL` (default info), `DATA_DIR` (default `/data`), `CACHE_MAX_ROWS`, `CACHE_MAX_AGE_MS`

Logs are Pino JSON in production, pretty-printed in dev (`NODE_ENV=development`). Each request gets a unique `requestId` for tracing.
