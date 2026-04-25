# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**lastfm-app** is a containerized Node.js music dashboard that integrates Last.fm, Plex, Spotify, and Tidarr (Tidal downloader). The application runs as two coordinated services in a single Docker container orchestrated by supervisord:

- **Muziekdashboard (port 80)**: Express.js backend + vanilla JavaScript frontend
- **Tidarr (port 8484)**: React frontend + Node API for Tidal music downloads (embedded)

The frontend is a single-page application with multiple tabs (home, artists, albums, downloads, discover, gaps) and real-time features like Plex webhook support and Now Playing syncing.

---

## Tech Stack

**Backend:**
- **Runtime**: Node.js 20 (Alpine)
- **Framework**: Express.js 4.18
- **Database**: SQLite (better-sqlite3) for persistent caching
- **Logging**: Pino (structured JSON logs in production, pretty-printed in dev)
- **HTTP Utilities**: compression, http-proxy-middleware, express-rate-limit
- **Image Processing**: sharp (external image proxy/caching)

**Frontend:**
- **Bundler**: esbuild (ES modules, code splitting via chunks)
- **Language**: Vanilla JavaScript (no framework)
- **Styling**: CSS with CSS custom properties (--theme, --color-*)
- **Charts**: Chart.js 4.4 (via CDN)
- **State Management**: In-memory object (public/src/state.js)

**Infrastructure:**
- **Container**: Docker (multi-stage build with Python layer for Tidarr)
- **Process Manager**: supervisord (manages both Tidarr and lastfm-app)
- **Package Management**: npm for lastfm-app, yarn for Tidarr

**External APIs:**
- Last.fm (user stats, scrobbles, artist data)
- Plex (library management, playback control, webhooks)
- Spotify (mood-based recommendations)
- Tidarr (Tidal search and downloads)
- MusicBrainz (artist metadata)
- Deezer (artist images)

---

## Directory Structure

```
lastfm-app/
├── server.js                 # Express app entry point + route registration
├── db.js                     # SQLite cache + wishlist/downloads persistence
├── logger.js                 # Pino logger + request tracking middleware
│
├── routes/                   # Express route handlers (dependency injection pattern)
│   ├── lastfm.js            # Last.fm API endpoints (/api/user, /api/recent, /api/top/*)
│   ├── artist.js            # Artist detail endpoints (/api/artist/:name, /api/artist/:name/info)
│   ├── plex.js              # Plex control & library endpoints + SSE webhooks
│   ├── tidarr.js            # Tidarr search & download endpoints
│   ├── spotify.js           # Spotify mood recommendations (/api/spotify/recommendations)
│   └── misc.js              # Health checks, utility endpoints
│
├── services/                 # Business logic & external API clients
│   ├── lastfm.js            # Last.fm API wrapper with caching
│   ├── plex.js              # Plex library sync (1156 lines: complex state management)
│   ├── tidarr.js            # Tidarr API wrapper
│   ├── spotify.js           # Spotify auth & recommendations
│   ├── musicbrainz.js       # MusicBrainz metadata lookups
│   ├── deezer.js            # Deezer image proxying
│   ├── discover.js          # New artist discovery algorithm
│   ├── gaps.js              # Missing album detection
│   ├── releases.js          # New release tracking
│   └── imageproxy.js        # Image caching + sharp processing
│
├── public/                   # Static assets (served by Express)
│   ├── index.html           # SPA shell (no build step required)
│   ├── app.js               # Esbuild-compiled frontend (minified, chunks)
│   ├── styles.css           # Compiled from public/src/styles.css
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service worker (offline/caching)
│   ├── chunks/              # Code-split bundles (loaded dynamically)
│   └── fonts/               # Inter font files
│
├── public/src/              # Frontend source (esbuild entry: public/src/main.js)
│   ├── main.js              # Initialization (theme, auth, routing, state)
│   ├── state.js             # Global app state (reactive object)
│   ├── api.js               # API fetch wrapper + cache layer
│   ├── cache.js             # Browser localStorage cache
│   ├── router.js            # SPA routing (hash-based, switchView)
│   ├── helpers.js           # DOM utilities, string helpers
│   ├── events.js            # Global event delegation system
│   │
│   ├── components/          # Reusable UI components
│   │   ├── sidebar.js       # Nav + settings panel
│   │   ├── player.js        # Plex playback control (27KB source)
│   │   ├── plexRemote.js    # Zone picker + playback UI
│   │   ├── panel.js         # Artist detail modal
│   │   ├── search.js        # Search bar + results
│   │   ├── wishlist.js      # Wishlist badge + UI
│   │   └── ambient.js       # Ambient background color from album art
│   │
│   ├── tabs/                # Tab modules (legacy structure, being phased out)
│   │   ├── nu.js            # Now playing
│   │   ├── downloads.js     # Download queue
│   │   └── ontdek.js        # Discovery tab
│   │
│   ├── views/               # Full-page views (loaded by router)
│   │   ├── home.js          # Homepage (66KB: featured artists, playlists, top tracks)
│   │   ├── bibliotheek.js   # Library browser (83KB: artist/album grid)
│   │   ├── albums.js        # Album grid view (25KB)
│   │   ├── ontdek.js        # Discovery (30KB)
│   │   ├── downloads.js     # Download manager (27KB)
│   │   ├── gaps.js          # Missing albums
│   │   ├── genres.js        # Genre browser
│   │   ├── artists.js       # Artist listing
│   │   ├── tracks.js        # Track listing
│   │   ├── nu.js            # Now playing (22KB)
│   │   ├── history.js       # Play history
│   │   ├── radio.js         # Smart playlists
│   │   ├── tags.js          # Genre tags
│   │   ├── folders.js       # Folder view
│   │   ├── composers.js     # Classical metadata
│   │   └── listen-later.js  # Wishlist view
│   │
│   └── styles.css           # Global CSS (preprocessed by esbuild)
│
├── tests/                   # Jest/Node test suite
│   ├── api.test.js          # Integration tests for /api routes
│   ├── setup.js             # Test helpers
│   └── mocks.js             # Mock services
│
├── docs/
│   └── performance-audit-2026-04-22.md  # Bundle size analysis + optimization plan
│
├── tidarr/                  # Tidarr submodule (git subtree)
│   ├── api/                 # Tidarr Node backend
│   ├── app/                 # Tidarr React frontend
│   ├── docker/              # Docker entrypoint + deps
│   └── compose.yml          # Dev compose for Tidarr only
│
├── data/                    # Volume mount (persistent data)
│   ├── cache.db             # SQLite cache file
│   ├── image-cache/         # Cached album art images
│   └── tidarr/              # Tidarr config & downloads
│
├── .env.example             # Template for environment variables
├── .env                     # Runtime secrets (not committed)
├── docker-compose.yml       # Orchestration config
├── Dockerfile               # Multi-stage build
├── supervisord.conf         # Process manager config
├── package.json             # Node dependencies
├── LOGGING.md               # Logging guide + troubleshooting
└── README.md                # User documentation (Dutch)
```

---

## Architecture Patterns

### 1. **Dependency Injection (routes/ modules)**

Routes receive dependencies as a second parameter, enabling loose coupling and testability:

```javascript
// routes/plex.js
module.exports = function(app, deps) {
  const { plexGet, plexPost, getCache, setCache } = deps;
  
  app.get('/api/plex/status', async (req, res) => {
    // use deps
  });
};
```

Dependencies are assembled in `server.js` and passed to each route module. This allows:
- Easy mocking in tests
- Decoupling routes from service implementation
- Hot-reloading during development

### 2. **Caching Strategy (3-tier)**

**Database Cache (SQLite):**
- Long-lived (14 days default, pruned every 100 writes)
- Key-value store in SQLite with TTL metadata
- Used by services for expensive API calls (Plex sync, Last.fm artist info)
- Survives container restarts

**HTTP Cache (Express headers):**
- Short-lived (`max-age=60` to `max-age=86400`)
- Private vs public (authenticated endpoints use `private`)
- Browser/CDN respects these headers

**Browser Cache (localStorage):**
- State like current theme, download quality
- Used by frontend for instant UI persistence

### 3. **Plex Library State Management**

`services/plex.js` maintains in-memory collections (Set/Map) for fast lookups:
- `plexArtists` / `plexArtistMap`: Artist name normalization
- `plexAlbums` / `plexAlbumsNorm`: Album deduplication
- `plexLibrary`: Sorted artist-album pairs for display
- Synced every 30 minutes + on-demand

Initialization loads from SQLite cache on startup to avoid Plex hammering on boot.

### 4. **Frontend State Management**

`public/src/state.js` exports a single reactive object:

```javascript
export const state = {
  user: null,
  recentTracks: [],
  selectedArtist: null,
  theme: 'light',
  // ...
};
```

Components import and mutate this object directly. Changes trigger DOM updates via event listeners (no virtual DOM). This keeps the bundle small (~28 KB gzipped) but trades reactivity for simplicity.

### 5. **Request Logging & Tracing**

Every request gets a unique ID via middleware:
- Stored in `req.id` and passed to logger
- Enables tracing across logs for distributed debugging
- Skips health checks and static files for cleaner logs

### 6. **Service Worker + PWA**

`public/sw.js` caches static assets for offline support:
- Cache-first for fonts, icons, CSS
- Network-first for API calls
- Fallback UI for offline state

---

## Common Development Tasks

### Frontend Development

**Start esbuild watch mode:**
```bash
npm run dev
```
This watches `public/src/**` and rebuilds `public/app.js` + `public/styles.css` on changes. Browser auto-refresh requires a separate tool (e.g., live-server or browser extension).

**Build for production:**
```bash
npm run build:frontend
```
Creates minified, code-split bundles with immutable cache headers.

**Key files to modify:**
- Add new tab/view: Create `public/src/views/{name}.js`, export render function
- Add new API endpoint: Modify `routes/{domain}.js` and `services/{domain}.js`
- Update styles: Edit `public/src/styles.css` (esbuild processes CSS as module)

### Backend Development

**Run server locally:**
```bash
NODE_ENV=development LOG_LEVEL=debug node server.js
```
Requires `.env` with valid API keys. Logs are pretty-printed in dev mode.

**Test a single route:**
```bash
npm test -- tests/api.test.js
```
Uses Node's native `--test` runner (Node 18+).

**Run all tests:**
```bash
npm test
npm run test:watch       # Continuous testing
```

### Docker Development

**Build image locally:**
```bash
docker build -t lastfm-app:dev .
```

**Run container with local code:**
```bash
docker compose up -d --build
```

**View logs:**
```bash
docker compose logs -f app          # LastFM app only
docker compose logs -f tidarr       # Tidarr only
docker compose logs -f              # Both
```

**Rebuild and restart:**
```bash
docker compose down
docker compose up -d --build
```

**Execute command in running container:**
```bash
docker compose exec app npm run build:frontend
docker compose exec app node -e "require('better-sqlite3')('/data/cache.db').prepare('SELECT COUNT(*) FROM cache').all()"
```

### Database Operations

**SQLite schema inspection:**
```bash
docker compose exec app sqlite3 /data/cache.db ".schema"
docker compose exec app sqlite3 /data/cache.db "SELECT key, LENGTH(data) FROM cache LIMIT 5;"
```

**Clear cache:**
```bash
docker compose down -v    # Remove volume + container
docker compose up -d      # Start fresh
```

**Backup database:**
```bash
docker compose exec app cat /data/cache.db > cache.db.backup
```

---

## Key Configuration Files

### `.env.example` → `.env`

**Required:**
- `LASTFM_API_KEY` — Last.fm API key (https://www.last.fm/api/account/create)
- `LASTFM_USER` — Last.fm username
- `PLEX_URL` — Plex server address (e.g., `http://localhost:32400`)
- `PLEX_TOKEN` — Plex API token (get from Plex web UI settings)

**Optional:**
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — For mood recommendations (hidden in UI if absent)
- `TIDARR_URL` — Internal Tidarr address (defaults to `http://localhost:8484`)
- `TIDARR_API_KEY` — Tidarr authentication
- `PORT` — Server port (default: 80)
- `LOG_LEVEL` — Log verbosity (default: info)
- `NODE_ENV` — Affects logging format (default: production in Docker)

### `docker-compose.yml`

Single service `muziekdashboard` with:
- Port: 9090 (external) → 80 (internal)
- Volume: `./data:/data` (persistent cache + Tidarr config)
- Extra volume: `/Volumes/4tbdrive/Muziek:/music` (host Tidal downloads)
- Health check: HTTP GET on `/health` endpoint
- Environment: Tidarr proxy URL, Plex credentials passed through

### `Dockerfile`

**Multi-stage build:**
1. **tidarr_builder** — Builds Tidarr React frontend + Node API
2. **app_builder** — Builds lastfm-app frontend bundle + npm ci
3. **final** — Python 3.13 Alpine base with Node 20 binary copied from builders

Key optimizations:
- Layer caching: `package.json` copied before source files
- Native module ABI matching: Node binary copied from builder to avoid version mismatches
- `npm prune --production`: Removes dev dependencies before final image
- supervisord: Manages both Tidarr and lastfm-app as systemd-like services

### `supervisord.conf`

Runs two programs:
- **tidarr** (priority 10): Node app + Python Tidal downloader
- **lastfm** (priority 20): Express server + Plex webhooks

Both redirect stdout/stderr to `/dev/stdout` for Docker log driver capture.

---

## Performance Considerations

### Frontend Bundle Size

From `docs/performance-audit-2026-04-22.md`:
- Current: 28.4 KB gzipped (115 KB raw)
- Bottleneck: `home.js` (66 KB), `bibliotheek.js` (83 KB) bundled upfront
- Recommendation: Dynamic imports for heavy views to reduce initial JS by 30–50%

Current implementation uses esbuild `--splitting` to create multiple chunks, but all are loaded on initial page load. Future optimization could gate chunk loading to view activation.

### API Caching & Rate Limiting

- Global rate limiter: 300 req/min per IP
- API rate limiter: 120 req/min per IP
- Endpoints return `Cache-Control` headers (60–86400s depending on volatility)
- Plex library syncs every 30 minutes in background

### Image Proxy

`services/imageproxy.js` caches external images locally (artist photos from Deezer, album art):
- Avoids external redirects and hotlinking
- sharp resizes on-the-fly
- Disk cache survives restarts

---

## Testing Strategy

**Test files:**
- `tests/api.test.js` — Integration tests for major routes (Last.fm, Plex, etc.)
- `tests/setup.js` — Test helpers (fake responses)
- `tests/mocks.js` — Mock external APIs

**Run tests:**
```bash
npm test              # Single run
npm run test:watch    # Continuous
```

Tests use Node's native `--test` runner; assertions via standard library. Mocks replace real HTTP calls to external APIs.

**Coverage:**
Currently covers main Happy Path routes. Missing:
- Error boundary testing
- Plex webhook parsing edge cases
- Cache pruning logic

---

## Logging & Debugging

**Log levels (low to high verbosity):**
- `fatal` — Unrecoverable crash
- `error` — Request-level failures
- `warn` — Degraded functionality (Plex offline, rate limit)
- `info` — Initialization, cache hits, user actions
- `debug` — Request/response details, service lifecycle
- `trace` — Database ops, cache miss/hit details

**Set log level:**
```bash
LOG_LEVEL=debug docker compose up -d app
```

**View logs in production:**
```bash
docker compose logs -f app | grep -i error
docker compose logs -f app | jq '.method, .path, .status'  # Parse JSON logs
```

**Request tracking:**
Each request gets a unique ID logged in all related messages. Use `requestId` field to trace a single request through all logs.

**See LOGGING.md** for detailed logging guide.

---

## Common Pitfalls & Solutions

### Plex Library Fails to Sync

**Symptoms:** `/api/plex/status` returns `syncOk: false`

**Causes:**
1. `PLEX_URL` or `PLEX_TOKEN` incorrect → test connection directly:
   ```bash
   curl -H "X-Plex-Token: <token>" http://your-plex:32400/library/sections
   ```
2. Plex server is offline
3. Music library ID doesn't exist (pass correct library ID to sync)

**Solution:** Check logs with `LOG_LEVEL=debug` for Plex connection errors.

### Tidarr UI Not Loading (`/tidarr-ui` returns 502)

**Causes:**
1. Tidarr container failed to start
2. Tidarr takes >30s to boot (health check timeout)

**Debug:**
```bash
docker compose logs -f tidarr
docker compose ps
```

### Cache Growing Unbounded

**Solution:** SQLite auto-prunes every 100 writes (configurable via `CACHE_MAX_ROWS` and `CACHE_MAX_AGE_MS`). If cache.db exceeds size limits:
```bash
docker compose down -v    # Removes data/ volume
docker compose up -d
```

### Last.fm API Returning 503 or Stale Data

The app falls back to stale-while-revalidate pattern:
- Returns cached data with `_stale: true` flag
- Frontend shows "cached" indicator
- Retries automatically

No action needed; wait for Last.fm recovery.

### Service Worker Blocking Updates

If frontend changes aren't visible after deploy:
1. Clear browser cache + unregister service worker:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
   ```
2. Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Linux/Windows)

---

## Important Notes for Claude

### State Management Caveats

The app uses in-memory state (no reactive framework). When modifying views:
- Import `state.js` and check current state before rendering
- Mutate state directly; DOM updates rely on event listeners
- No automatic re-render on state change — manually call view functions or dispatch events

### Adding New API Endpoints

1. Add handler in `routes/{domain}.js`
2. Extract business logic to `services/{domain}.js`
3. Apply cache headers in route handler
4. Add rate limiting if needed (via `app.use('/api/*', apiLimiter)`)
5. Log important operations with context
6. Test with `npm test` or manual curl

### Frontend Code Splitting

esbuild is configured with `--splitting` but all chunks are loaded on page init. To optimize:
- Wrap heavy view modules in dynamic `import()` in `router.js`
- Load chunks only when the corresponding tab/view is activated
- See `performance-audit-2026-04-22.md` for details

### Docker Image Size & Build Time

The multi-stage Dockerfile is optimized for layer caching:
- `package.json` layer changes → full `npm ci` re-run
- Source code changes → no npm install re-run
- Node binary is copied (not installed) to avoid ABI mismatches with native modules

If build times are slow:
- Check if `package-lock.json` changed (triggers npm ci)
- Prune unused dependencies in `package.json`
- Consider using BuildKit: `DOCKER_BUILDKIT=1 docker build .`

### Secrets & Security

- Never commit `.env` (added to `.gitignore`)
- API keys in environment variables only
- Rate limiting enabled on all `/api/*` routes
- No session storage; stateless API design
- CORS not configured (assuming same-origin or reverse proxy)

### Handling External API Failures

All external API calls wrap failures in try-catch:
- Log error with context (service name, request params)
- Return cached data if available (marked `_stale: true`)
- Return 503 if no cache available
- Plex/Last.fm status flags broadcast to frontend for UI feedback

---

## Future Improvements (from audit)

From `docs/performance-audit-2026-04-22.md`:

1. **Code split heavy views** — target 20 KB gzip for initial payload
2. **Add immutable cache headers** for versioned assets (`Cache-Control: public, max-age=31536000, immutable`)
3. **Performance budgets** in CI (fail build if bundle > threshold)
4. **Server-Timing headers** on slow API routes for observability
5. **Percentile dashboards** for request latency (p50/p95/p99)

---

## Useful Commands Reference

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Build frontend | `npm run build:frontend` |
| Run tests | `npm test` |
| Watch tests | `npm run test:watch` |
| Start Docker | `docker compose up -d --build` |
| View logs | `docker compose logs -f app` |
| SSH into container | `docker compose exec app sh` |
| Clear cache | `docker compose down -v && docker compose up -d` |
| Query cache DB | `docker compose exec app sqlite3 /data/cache.db` |
| Check Plex connection | `curl -H "X-Plex-Token: $TOKEN" http://localhost:32400/library/sections` |
| Set debug logs | `LOG_LEVEL=debug docker compose up -d` |
| Rebuild image | `docker compose up -d --build` |

---

