// ============================================================
// Muziek Dashboard — Service Worker
// Cache naam: muziek-dashboard-v1
// ============================================================

const CACHE_NAME = 'muziek-dashboard-v1';

// Bestanden die direct bij installatie worden gecached
const PRECACHE_URLS = [
  '/index.html',
  '/style.css',
  '/app.js',
];

// ── Helpers ──────────────────────────────────────────────────

function isStaticAsset(url) {
  return url.pathname.match(/\.(css|js|woff2?|ttf|ico|png|svg)$/) !== null
    && !url.hostname.includes('deezer')
    && !url.hostname.includes('cdns-images');
}

function isApiEndpoint(pathname) {
  return pathname.startsWith('/api/');
}

function isFastChangingApi(pathname) {
  return pathname === '/api/recent' || pathname === '/api/plex/nowplaying';
}

function isDeezerImage(url) {
  return url.hostname.includes('deezer') || url.hostname.includes('cdns-images');
}

// Fetch met timeout — gooit een error als de server te traag is
function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Network timeout')), timeoutMs);
    fetch(request).then(
      (response) => { clearTimeout(timer); resolve(response); },
      (err)      => { clearTimeout(timer); reject(err); }
    );
  });
}

// Sla een response op in de cache (clone verplicht — body mag maar 1x gelezen worden)
async function cacheResponse(cacheName, request, response) {
  if (!response || !response.ok) return response;
  const cache = await caches.open(cacheName);
  cache.put(request, response.clone());
  return response;
}

// ── Installatie: precache static assets ──────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Activeer meteen zonder te wachten op oude clients
  self.skipWaiting();
});

// ── Activatie: oude caches opruimen ──────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: routing per strategie ─────────────────────────────

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Alleen GET requests cachen
  if (event.request.method !== 'GET') return;

  // ── Strategie 1: Deezer CDN afbeeldingen — Cache First, 7 dagen TTL ──
  if (isDeezerImage(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          // Controleer leeftijd via Date header
          const dateHeader = cached.headers.get('sw-cached-at');
          if (dateHeader) {
            const age = Date.now() - parseInt(dateHeader, 10);
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (age < sevenDays) return cached;
          } else {
            return cached; // geen timestamp → accepteer
          }
        }
        // Niet in cache of verlopen: ophalen en opslaan met timestamp
        try {
          const response = await fetch(event.request);
          if (response.ok) {
            const headers = new Headers(response.headers);
            headers.set('sw-cached-at', Date.now().toString());
            const timestampedResponse = new Response(await response.blob(), {
              status: response.status,
              statusText: response.statusText,
              headers,
            });
            cache.put(event.request, timestampedResponse.clone());
            return timestampedResponse;
          }
          return response;
        } catch {
          return cached || new Response('Afbeelding niet beschikbaar', { status: 503 });
        }
      })
    );
    return;
  }

  // ── Strategie 2: Static assets — Cache First, update in achtergrond ──
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        // Altijd op de achtergrond vernieuwen
        const networkFetch = fetch(event.request).then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => null);

        return cached || networkFetch;
      })
    );
    return;
  }

  // ── Strategie 3: Snel veranderende API — Network First, 3s timeout ──
  if (isApiEndpoint(url.pathname) && isFastChangingApi(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetchWithTimeout(event.request, 3000);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch {
          const cached = await cache.match(event.request);
          return cached || new Response(JSON.stringify({ error: 'Offline', cached: false }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })
    );
    return;
  }

  // ── Strategie 4: Stabiele API endpoints — Stale While Revalidate ──
  if (isApiEndpoint(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        // Altijd op de achtergrond vernieuwen
        const networkFetch = fetch(event.request).then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => null);

        // Geef cache direct terug als die er is; anders wacht op netwerk
        return cached || networkFetch;
      })
    );
    return;
  }

  // ── Standaard: gewoon netwerk (geen caching) ──────────────
  // (navigatie requests, overige third-party calls)
});

// ── Message handler: cache invalidatie ───────────────────────

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        // Bevestig aan de afzender
        if (event.source) {
          event.source.postMessage({ type: 'CACHE_CLEARED', cache: CACHE_NAME });
        }
      })
    );
  }
});
