// ════════════════════════════════════════
// SERVICE WORKER v26 — Production-Grade Caching
// ════════════════════════════════════════
// Strategy: Network-first with smart fallback + performance tracking

const CACHE_NAME = 'proposalkit-v26';
const CACHE_VERSION = 26;
const MAX_CACHE_SIZE = 50; // Maximum items in runtime cache
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// Core assets to precache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/js/vendor/tiptap.bundle.js',
  '/assets/js/editor/tiptap-menus.js',
  '/assets/js/vendor/lucide-0.460.0.js',
  '/assets/js/vendor/supabase-2.49.1.js',
  '/assets/js/vendor/qrcode-1.4.4.min.js',
  '/assets/css/variables.css',
  '/assets/css/components.css',
  '/assets/css/layout.css',
  '/assets/css/pages.css',
  '/assets/css/features.css',
  '/assets/css/pdf.css',
  '/assets/css/responsive.css',
  '/assets/css/print.css'
];

// Offline fallback page
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline — ProposalKit</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fafafa;color:#18181b;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:32px}.card{max-width:440px;text-align:center;background:#fff;padding:48px 32px;border-radius:16px;border:1px solid #e4e4e7}.icon{font-size:48px;margin-bottom:16px}.title{font-size:20px;font-weight:700;margin-bottom:8px}.desc{font-size:14px;color:#71717a;line-height:1.6;margin-bottom:24px}.btn{display:inline-block;padding:10px 24px;background:#18181b;color:#fff;border:none;border-radius:9999px;font-size:14px;font-weight:500;cursor:pointer;text-decoration:none}.btn:hover{opacity:.9}.hint{margin-top:16px;font-size:12px;color:#a1a1aa}</style></head>
<body><div class="card">
<div class="icon">&#128268;</div>
<div class="title">You're offline</div>
<div class="desc">ProposalKit can't connect to the server right now. Check your internet connection and try again.</div>
<button class="btn" onclick="window.location.reload()">Try again</button>
<div class="hint">Your saved data is still safe in your browser</div>
</div></body></html>`;

// Performance metrics
let metrics = { cacheHits: 0, cacheMisses: 0, networkSuccess: 0, networkFail: 0 };

// ══════════════════════════════════════════
// LIFECYCLE EVENTS
// ══════════════════════════════════════════

// Install — precache core assets
self.addEventListener('install', (e) => {
  console.log('[SW v24] Installing...');
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW v24] Precaching', STATIC_ASSETS.length, 'assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW v24] Install complete');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW v24] Install failed:', err);
      })
  );
});

// Activate — clean old caches + enable navigation preload
self.addEventListener('activate', (e) => {
  console.log('[SW v24] Activating...');
  e.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(keys => {
        const oldCaches = keys.filter(k => k !== CACHE_NAME);
        if (oldCaches.length > 0) {
          console.log('[SW v24] Deleting old caches:', oldCaches);
        }
        return Promise.all(oldCaches.map(k => caches.delete(k)));
      }),

      // Enable navigation preload (Chrome/Edge only, graceful fallback)
      self.registration.navigationPreload?.enable()
        .then(() => console.log('[SW v24] Navigation preload enabled'))
        .catch(() => console.log('[SW v24] Navigation preload not supported')),

      // Claim clients
      self.clients.claim()
    ]).then(() => {
      // Notify clients of update
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION, metrics });
        });
      });
    })
  );
});

// Message handler
self.addEventListener('message', (e) => {
  if (!e.data) return;

  // Skip waiting
  if (e.data.type === 'SKIP_WAITING') {
    console.log('[SW v24] Skip waiting requested');
    self.skipWaiting();
  }

  // Get metrics
  if (e.data.type === 'GET_METRICS') {
    e.ports[0].postMessage(metrics);
  }

  // Clear metrics
  if (e.data.type === 'CLEAR_METRICS') {
    metrics = { cacheHits: 0, cacheMisses: 0, networkSuccess: 0, networkFail: 0 };
  }

  // Plan check
  if (e.data.type === 'CHECK_PLAN' && !e.data.hasOffline) {
    console.log('[SW v24] Free plan detected, unregistering');
    self.registration.unregister().then(() => {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.navigate(client.url));
      });
    });
  }
});

// ══════════════════════════════════════════
// CACHE MANAGEMENT
// ══════════════════════════════════════════

// Trim cache to size limit
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;

  // Delete oldest entries
  const toDelete = keys.slice(0, keys.length - maxItems);
  await Promise.all(toDelete.map(key => cache.delete(key)));
  console.log('[SW v24] Trimmed cache, removed', toDelete.length, 'items');
}

// Check if response is valid and cacheable
function isValidResponse(response) {
  return response && response.status === 200 && response.type === 'basic';
}

// Add timestamp metadata to cached responses
function addCacheMetadata(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-at', Date.now().toString());
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

// Check if cached response is too old
function isCacheTooOld(response) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return false;
  return (Date.now() - parseInt(cachedAt, 10)) > MAX_CACHE_AGE;
}

// ══════════════════════════════════════════
// FETCH STRATEGIES
// ══════════════════════════════════════════

// Network-first with timeout (FIXED race condition)
async function networkFirstWithTimeout(request, cacheName, timeout = 1000) {
  const cache = await caches.open(cacheName);

  let timeoutId;
  let networkCompleted = false;

  // Network fetch with proper timeout
  const networkPromise = fetch(request)
    .then(response => {
      networkCompleted = true;
      clearTimeout(timeoutId);

      if (isValidResponse(response)) {
        metrics.networkSuccess++;
        const responseWithMeta = addCacheMetadata(response.clone());
        cache.put(request, responseWithMeta).then(() => trimCache(cacheName, MAX_CACHE_SIZE));
      }
      return response;
    })
    .catch(err => {
      networkCompleted = true;
      clearTimeout(timeoutId);
      metrics.networkFail++;
      throw err;
    });

  // Timeout that properly falls back to cache
  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutId = setTimeout(async () => {
      if (networkCompleted) return; // Network already finished

      const cached = await cache.match(request);
      if (cached && !isCacheTooOld(cached)) {
        console.log('[SW v24] Network timeout, serving from cache');
        metrics.cacheHits++;
        resolve(cached);
      } else {
        // No valid cache, wait for network
        metrics.cacheMisses++;
        try {
          const response = await networkPromise;
          resolve(response);
        } catch (err) {
          // Network failed and no cache
          reject(err);
        }
      }
    }, timeout);
  });

  return Promise.race([networkPromise, timeoutPromise]);
}

// Stale-while-revalidate (for assets)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch and update cache in background
  const fetchPromise = fetch(request)
    .then(response => {
      if (isValidResponse(response)) {
        metrics.networkSuccess++;
        const responseWithMeta = addCacheMetadata(response.clone());
        cache.put(request, responseWithMeta).then(() => trimCache(cacheName, MAX_CACHE_SIZE));
      }
      return response;
    })
    .catch(() => {
      metrics.networkFail++;
      return cached;
    });

  // Return cache immediately if available, otherwise wait for network
  if (cached && !isCacheTooOld(cached)) {
    metrics.cacheHits++;
    return cached;
  }

  metrics.cacheMisses++;
  return fetchPromise;
}

// ══════════════════════════════════════════
// FETCH HANDLER
// ══════════════════════════════════════════

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // ── NAVIGATION REQUESTS ──
  if (request.mode === 'navigate') {
    const path = url.pathname;
    const htmlFiles = ['/client.html', '/landing.html', '/privacy.html', '/terms.html'];
    const spaExclude = ['/client', '/landing', '/privacy', '/terms'];
    const isStandalonePage = htmlFiles.includes(path) || spaExclude.includes(path);
    const hasExtension = path.includes('.') && !path.endsWith('/');

    // SPA routes → serve index.html
    if (!isStandalonePage && !hasExtension) {
      e.respondWith(
        // Use navigation preload if available
        e.preloadResponse
          ? e.preloadResponse.then(preloadResponse => {
              if (preloadResponse) {
                console.log('[SW v24] Using navigation preload');
                metrics.networkSuccess++;
                return preloadResponse;
              }
              return networkFirstWithTimeout('/index.html', CACHE_NAME, 1000);
            })
          : networkFirstWithTimeout('/index.html', CACHE_NAME, 1000)
              .catch(() => new Response(OFFLINE_HTML, {
                headers: { 'Content-Type': 'text/html' }
              }))
      );
      return;
    }

    // Standalone pages
    e.respondWith(
      e.preloadResponse
        ? e.preloadResponse.then(preloadResponse => {
            if (preloadResponse) {
              metrics.networkSuccess++;
              return preloadResponse;
            }
            return networkFirstWithTimeout(request, CACHE_NAME, 1000);
          })
        : networkFirstWithTimeout(request, CACHE_NAME, 1000)
            .catch(() => new Response(OFFLINE_HTML, {
              headers: { 'Content-Type': 'text/html' }
            }))
    );
    return;
  }

  // ── STATIC ASSETS ──
  e.respondWith(
    staleWhileRevalidate(request, CACHE_NAME)
      .catch(() => caches.match(request))
  );
});

console.log('[SW v24] Loaded — Navigation preload enabled, cache limits enforced');
