// ============================================================
// Muziek Dashboard — Service Worker (PWA v2)
// Verbeterde caching strategie voor Progressive Web App
// ============================================================

const CACHE_VERSION = 'v2';
const CACHE_STATIC = `muziek-dashboard-static-${CACHE_VERSION}`;
const CACHE_API = `muziek-dashboard-api-${CACHE_VERSION}`;
const CACHE_IMAGES = `muziek-dashboard-images-${CACHE_VERSION}`;

// Bestanden die direct bij installatie worden gecached (statische assets)
const PRECACHE_URLS = [
  '/index.html',
  '/manifest.json',
  '/style.css',
  '/app.js',
  '/icon-192.png',
  '/icon-512.png',
];

// ── Helpers ──────────────────────────────────────────────────

function isStaticAsset(url) {
  return url.pathname.match(/\.(css|js|woff2?|ttf|ico|png|svg|webp|jpg|jpeg|gif)$/) !== null
    && !url.hostname.includes('deezer')
    && !url.hostname.includes('cdns-images')
    && !url.hostname.includes('cdnjs.cloudflare.com');
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
  console.log('[SW] Installeren... cache versie:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Activeer meteen zonder te wachten op oude clients
  self.skipWaiting();
});

// ── Activatie: oude caches opruimen ──────────────────────────

self.addEventListener('activate', (event) => {
  console.log('[SW] Activeren... opruimen oude caches');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => {
            // Verwijder oude versies
            const isOldVersion =
              key.includes('muziek-dashboard') &&
              !key.includes(CACHE_VERSION);
            return isOldVersion;
          })
          .map((key) => {
            console.log('[SW] Oude cache verwijderd:', key);
            return caches.delete(key);
          })
      );
    })
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
      caches.open(CACHE_IMAGES).then(async (cache) => {
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

  // ── Strategie 2: Static assets — Cache First ──
  // Alle CSS, JS, fonts, PNG's, SVG's uit /public worden gecached
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE_STATIC).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          return cached;
        }
        // Niet in cache: haal op en sla op
        try {
          const response = await fetch(event.request);
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        } catch (err) {
          console.warn('[SW] Offline - kan statische asset niet laden:', event.request.url);
          return new Response('Offline - asset niet beschikbaar', { status: 503 });
        }
      })
    );
    return;
  }

  // ── Strategie 3: Snel veranderende API — Network First, 3s timeout ──
  if (isApiEndpoint(url.pathname) && isFastChangingApi(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_API).then(async (cache) => {
        try {
          const response = await fetchWithTimeout(event.request, 3000);
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        } catch (err) {
          console.warn('[SW] Network timeout of offline - terugvallen op cache:', event.request.url);
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

  // ── Strategie 4: Stabiele API — Stale-While-Revalidate ──
  // Geeft direct cached response terug, ververst op achtergrond
  if (isApiEndpoint(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_API).then(async (cache) => {
        const cached = await cache.match(event.request);
        // Altijd op achtergrond verversen
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => null);
        // Cached beschikbaar? Direct teruggeven
        if (cached) return cached;
        // Geen cache: wacht op netwerk
        const response = await networkFetch;
        return response || new Response(JSON.stringify({ error: 'Offline', cached: false }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
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
      Promise.all([
        caches.delete(CACHE_STATIC),
        caches.delete(CACHE_API),
        caches.delete(CACHE_IMAGES),
      ]).then(() => {
        console.log('[SW] Alle caches gewist');
        // Bevestig aan de afzender
        if (event.source) {
          event.source.postMessage({ type: 'CACHE_CLEARED', caches: [CACHE_STATIC, CACHE_API, CACHE_IMAGES] });
        }
      })
    );
  }
});

console.log('[SW] Service Worker geladen, versie:', CACHE_VERSION);
