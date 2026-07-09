const CACHE_NAME = 'kss-v5';

// Install: skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: delete ALL old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - /_next/static/  → cache-first (content-hashed, truly immutable)
// - Everything else → network-first (HTML pages, RSC payloads, API)
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Only intercept same-origin GET requests
  if (event.request.method !== 'GET' || !url.startsWith(self.location.origin)) return;

  if (url.includes('/_next/static/')) {
    // Cache-first for immutable hashed assets
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((res) => {
            if (res.status === 200) cache.put(event.request, res.clone());
            return res;
          });
        })
      )
    );
  } else {
    // Network-first for HTML, RSC, and API so deploys take effect immediately
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
