const CACHE_NAME = 'kss-v7';

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
// - Everything else → network-first, but cache successful GETs so previously
//   visited pages (e.g. /pos) still load with no connection.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Only intercept same-origin GET requests
  if (event.request.method !== 'GET' || !url.startsWith(self.location.origin)) return;

  if (url.includes('/_next/static/')) {
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
    // Network-first. Only cache a SAFE allowlist for offline fallback — never
    // authenticated pages/APIs, which would leak one signed-in user's data to
    // the next user on a shared device.
    const path = new URL(url).pathname;
    const cacheable =
      path === '/pos' || path === '/' || path === '/login' ||
      path === '/manifest.webmanifest' || path === '/api/products' ||
      path.startsWith('/icon');
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (cacheable && res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

// ── Offline POS: Background Sync ────────────────────────────────────────────────
// When connectivity returns, drain the local sale outbox directly from the
// worker — so queued sales sync even if the app was fully closed (Chromium).
// The POST carries the same-origin session cookie automatically.

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('kss-pos'); // no version — never create/upgrade schema here
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPending(db) {
  return new Promise((resolve, reject) => {
    const req = db.transaction('outbox', 'readonly').objectStore('outbox').getAll();
    req.onsuccess = () => resolve((req.result || []).filter((r) => r.status === 'pending'));
    req.onerror = () => reject(req.error);
  });
}

function idbMarkSynced(db, row) {
  return new Promise((resolve) => {
    const t = db.transaction('outbox', 'readwrite');
    row.status = 'synced';
    row.syncedAt = new Date().toISOString();
    t.objectStore('outbox').put(row);
    t.oncomplete = () => resolve();
    t.onerror = () => resolve();
  });
}

function idbMarkFailed(db, row, err) {
  return new Promise((resolve) => {
    const t = db.transaction('outbox', 'readwrite');
    row.status = 'failed';
    row.failedAt = new Date().toISOString();
    row.lastError = err;
    t.objectStore('outbox').put(row);
    t.oncomplete = () => resolve();
    t.onerror = () => resolve();
  });
}

async function flushOutbox() {
  // Don't create the DB from here — only touch it if the app already made it.
  try {
    const dbs = indexedDB.databases ? await indexedDB.databases() : [];
    if (!dbs.some((d) => d.name === 'kss-pos')) return;
  } catch { return; }

  let db;
  try { db = await idbOpen(); } catch { return; }
  if (!db.objectStoreNames.contains('outbox')) return;

  let pending;
  try { pending = await idbPending(db); } catch { return; }

  for (const txn of pending) {
    try {
      const res = await fetch('/api/pos/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientTxnId: txn.clientTxnId,
          deviceId: txn.deviceId,
          receiptNumber: txn.receiptNumber,
          items: txn.items,
          total: txn.total,
          method: txn.method,
          paymentRef: txn.paymentRef,
          posType: txn.posType,
          clientCreatedAt: txn.clientCreatedAt,
        }),
      });
      if (res.ok) {
        await idbMarkSynced(db, txn);
      } else if (res.status >= 400 && res.status < 500 && res.status !== 401) {
        await idbMarkFailed(db, txn, 'HTTP ' + res.status); // quarantine, don't jam
      } else {
        break; // 401/5xx — stop; the next sync/foreground trigger retries
      }
    } catch {
      break;
    }
  }

  // Nudge any open tab to refresh its pending badge.
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((c) => c.postMessage({ type: 'flush-outbox' }));
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'pos-outbox') event.waitUntil(flushOutbox());
});
