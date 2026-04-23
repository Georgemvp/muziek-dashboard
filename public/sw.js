// ============================================================
// Muziek — Service Worker (PWA)
// Caching strategie:
// - API: Network First
// - Statische assets + afbeeldingen: Cache First
// ============================================================

const CACHE_VERSION = 'v3';
const CACHE_STATIC = `muziek-static-${CACHE_VERSION}`;
const CACHE_API = `muziek-api-${CACHE_VERSION}`;
const CACHE_IMAGES = `muziek-images-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/style.css',
  '/app.js',
  '/icon-192.png',
  '/icon-512.png',
  '/chunks/bibliotheek-5BFDVPGD.js',
  '/chunks/bibliotheek-P56AV6J2.js',
  '/chunks/bibliotheek-SQWBF5BI.js',
  '/chunks/bibliotheek-SV5UJHPJ.js',
  '/chunks/bibliotheek-VONXGZIA.js',
  '/chunks/chunk-4E6U7I7I.js',
  '/chunks/chunk-5VRNHLFG.js',
  '/chunks/chunk-ANAONK2Y.js',
  '/chunks/chunk-H7SZLMAB.js',
  '/chunks/chunk-HNNUXXVH.js',
  '/chunks/chunk-MC7OSVHJ.js',
  '/chunks/chunk-P2NR46FN.js',
  '/chunks/chunk-RRZ2Q5W2.js',
  '/chunks/chunk-ZCOZCGLD.js',
  '/chunks/downloads-AGCGBRV5.js',
  '/chunks/downloads-P6AJSGC5.js',
  '/chunks/downloads-VJS5IKKD.js',
  '/chunks/ontdek-AYAQP6LC.js',
  '/chunks/ontdek-PUNTF7RD.js',
  '/chunks/ontdek-XA67VTVU.js',
  '/chunks/player.js',
  '/chunks/plexRemote-5WHTXVL3.js',
  '/chunks/plexRemote-WRO7SQ43.js',
];

function isApiRequest(url) {
  return url.origin === self.location.origin && url.pathname.startsWith('/api/');
}

function isImageRequest(request, url) {
  return request.destination === 'image'
    || /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname);
}

function isStaticRequest(request, url) {
  if (url.origin !== self.location.origin) return false;
  return request.destination === 'style'
    || request.destination === 'script'
    || request.destination === 'font'
    || request.destination === 'document'
    || url.pathname.startsWith('/chunks/')
    || /\.(css|js|woff2?|ttf)$/i.test(url.pathname);
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key.startsWith('muziek-') && !key.endsWith(CACHE_VERSION))
        .map(key => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // API: network-first met fallback naar cache
  if (isApiRequest(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_API);
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    })());
    return;
  }

  // Afbeeldingen: cache-first
  if (isImageRequest(event.request, url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_IMAGES);
      const cached = await cache.match(event.request);
      if (cached) return cached;

      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })());
    return;
  }

  // Statische assets: cache-first
  if (isStaticRequest(event.request, url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_STATIC);
      const cached = await cache.match(event.request);
      if (cached) return cached;

      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })());
  }
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'CLEAR_CACHE') return;

  event.waitUntil(
    Promise.all([
      caches.delete(CACHE_STATIC),
      caches.delete(CACHE_API),
      caches.delete(CACHE_IMAGES),
    ]).then(() => {
      event.source?.postMessage({
        type: 'CACHE_CLEARED',
        caches: [CACHE_STATIC, CACHE_API, CACHE_IMAGES],
      });
    }),
  );
});
