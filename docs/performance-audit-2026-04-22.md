# Performance audit (2026-04-22)

## Scope
- Audit type: quick code + build artefact audit (no browser-lab metrics).
- Repository: `muziek-dashboard`.
- Date: 2026-04-22.

## Method
1. Production bundle generated with `npm run build`.
2. Static artefact sizes measured (`wc -c`, `gzip -c`).
3. Bundle composition inspected via esbuild metafile.
4. Backend/server config reviewed for caching/compression/rate limiting.

## Key measurements
- `public/app.js`: **115,936 bytes raw** and **28,389 bytes gzip**.
- `public/index.html`: **11,894 bytes raw** and **3,306 bytes gzip**.
- `public/style.css`: **1,400 bytes raw** and **470 bytes gzip**.
- Current JS bundle is moderate in gzip size, but includes all tab logic in one initial payload.

## Findings

### 1) Front-end JS is bundled as one entry (main bottleneck for first load)
- Build currently emits one browser bundle from `public/src/main.js` to `public/app.js`.
- Top contributors in source size are:
  - `public/src/tabs/ontdek.js` (~40 KB source)
  - `public/src/tabs/bibliotheek.js` (~40 KB source)
  - `public/src/tabs/downloads.js` (~26 KB source)
- This suggests users pay up-front for tabs they may not open in a session.

**Impact**
- Increased parse/compile cost and time-to-interactive on slower clients.

**Recommendation (high priority)**
- Introduce route/tab-level code splitting with dynamic imports (`import()`) for heavy tab modules.
- Target: reduce initial JS payload by 30–50% for first render path.

### 2) Compression is enabled on server (positive)
- Express compression middleware is active globally.

**Impact**
- Good baseline network transfer reduction for JS/HTML/API.

**Recommendation (keep + tune)**
- Keep compression enabled.
- Optionally set `threshold`/`level` explicitly to tune CPU-vs-bandwidth for low-power deployments.

### 3) Static asset cache policy is not explicitly optimized
- Static files are served via `express.static(...)` with default settings.
- API routes explicitly set cache headers, but static assets rely on defaults.

**Impact**
- Browser may revalidate static assets too often, reducing repeat-visit performance.

**Recommendation (high priority)**
- Add explicit cache policy for immutable built assets (e.g. hashed filenames + `Cache-Control: public, max-age=31536000, immutable`).
- For HTML, keep short/no-cache to allow fast rollout.

### 4) API has protective rate limiting and per-endpoint caching (positive)
- Global limiter and `/api` limiter are in place.
- Multiple API routes return cached payloads and `Cache-Control` headers.

**Impact**
- Reduces origin load and helps avoid external API pressure spikes.

**Recommendation (medium priority)**
- Add lightweight server timing headers (`Server-Timing`) for hotspots to make production perf regressions measurable.

### 5) Logging middleware tracks latency (positive)
- Request middleware logs method/path/status/duration.

**Impact**
- Good observability basis for performance work.

**Recommendation (medium priority)**
- Add percentile dashboards (p50/p95/p99 per route) and alerting thresholds.

## Prioritized action plan
1. **Code split tabs** (`ontdek`, `bibliotheek`, `downloads`) to reduce initial JS.
2. **Adopt long-lived immutable caching** for versioned static assets.
3. Add **performance budgets** in CI (max gzip bundle size + fail threshold).
4. Add **Server-Timing** + p95 route monitoring.

## Suggested acceptance criteria
- Initial JS gzip <= **20 KB** (from ~28 KB).
- Lighthouse mobile Performance +15 points versus current baseline.
- Repeat-visit transfer for JS near-zero (304 or cache hit) for unchanged assets.
- p95 for core API routes < 250 ms on target hardware.
