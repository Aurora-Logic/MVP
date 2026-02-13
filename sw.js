// ════════════════════════════════════════
// SERVICE WORKER v22 — Intelligent Caching + Auto-Update
// ════════════════════════════════════════
// Strategy: Stale-while-revalidate for instant loads + background updates

const CACHE_NAME = 'proposalkit-v23';
const CACHE_VERSION = 23; // Increment on breaking cache changes

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

// Inline offline fallback (when cache + network both fail)
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

// ══════════════════════════════════════════
// LIFECYCLE EVENTS
// ══════════════════════════════════════════

// Install — precache core assets
self.addEventListener('install', (e) => {
  console.log('[SW v22] Installing...');
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW v22] Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW v22] Install complete, skipping waiting');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(err => {
        console.error('[SW v22] Install failed:', err);
      })
  );
});

// Activate — clean old caches + claim clients
self.addEventListener('activate', (e) => {
  console.log('[SW v22] Activating...');
  e.waitUntil(
    caches.keys()
      .then(keys => {
        const oldCaches = keys.filter(k => k !== CACHE_NAME);
        if (oldCaches.length > 0) {
          console.log('[SW v22] Deleting old caches:', oldCaches);
        }
        return Promise.all(oldCaches.map(k => caches.delete(k)));
      })
      .then(() => {
        console.log('[SW v22] Claiming all clients');
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that update is ready
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_UPDATED',
              version: CACHE_VERSION
            });
          });
        });
      })
  );
});

// Message handler — receive commands from app
self.addEventListener('message', (e) => {
  if (!e.data) return;

  // Skip waiting (force activate new SW)
  if (e.data.type === 'SKIP_WAITING') {
    console.log('[SW v22] Received SKIP_WAITING, activating now');
    self.skipWaiting();
  }

  // Plan check (for premium offline access)
  if (e.data.type === 'CHECK_PLAN') {
    const hasOffline = e.data.hasOffline;
    if (!hasOffline) {
      console.log('[SW v22] Free plan detected, unregistering SW');
      self.registration.unregister().then(() => {
        self.clients.matchAll().then(clients => {
          clients.forEach(client => client.navigate(client.url));
        });
      });
    }
  }
});

// ══════════════════════════════════════════
// FETCH STRATEGIES
// ══════════════════════════════════════════

// Helper: Check if response is valid and cacheable
function isValidResponse(response) {
  return response && response.status === 200 && response.type === 'basic';
}

// Helper: Stale-while-revalidate pattern
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch in background and update cache
  const fetchPromise = fetch(request)
    .then(response => {
      if (isValidResponse(response)) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached); // Fallback to cache if network fails

  // Return cached immediately if available, otherwise wait for network
  return cached || fetchPromise;
}

// Helper: Network-first with fast timeout, then cache fallback
async function networkFirstWithTimeout(request, cacheName, timeout = 1000) {
  const cache = await caches.open(cacheName);

  // Race between network (with timeout) and cache
  return Promise.race([
    // Network fetch with timeout
    fetch(request)
      .then(response => {
        if (isValidResponse(response)) {
          cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return cache.match(request);
      }),

    // Timeout fallback to cache
    new Promise(resolve => {
      setTimeout(async () => {
        const cached = await cache.match(request);
        if (cached) {
          console.log('[SW v22] Network slow, serving from cache');
          resolve(cached);
          // Update cache in background
          fetch(request)
            .then(r => {
              if (isValidResponse(r)) cache.put(request, r.clone());
            })
            .catch(() => {});
        }
      }, timeout);
    })
  ]).then(response => {
    if (response) return response;
    // Final fallback
    return cache.match(request);
  });
}

// Main fetch handler
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // ── NAVIGATION REQUESTS (HTML pages) ──
  if (request.mode === 'navigate') {
    const path = url.pathname;

    // Known standalone HTML files
    const htmlFiles = ['/client.html', '/landing.html', '/privacy.html', '/terms.html'];
    const spaExclude = ['/client', '/landing', '/privacy', '/terms'];
    const isStandalonePage = htmlFiles.includes(path) || spaExclude.includes(path);
    const hasExtension = path.includes('.') && !path.endsWith('/');

    // SPA routes (e.g. /dashboard, /proposals/:id) → serve index.html
    if (!isStandalonePage && !hasExtension) {
      e.respondWith(
        networkFirstWithTimeout('/index.html', CACHE_NAME, 1000)
          .catch(() => new Response(OFFLINE_HTML, {
            headers: { 'Content-Type': 'text/html' }
          }))
      );
      return;
    }

    // Standalone pages → network-first with timeout
    e.respondWith(
      networkFirstWithTimeout(request, CACHE_NAME, 1000)
        .catch(() => new Response(OFFLINE_HTML, {
          headers: { 'Content-Type': 'text/html' }
        }))
    );
    return;
  }

  // ── STATIC ASSETS (JS, CSS, fonts, images) ──
  // Stale-while-revalidate: instant load + background update
  e.respondWith(
    staleWhileRevalidate(request, CACHE_NAME)
      .catch(() => caches.match(request)) // Final fallback to cache
  );
});

console.log('[SW v22] Loaded successfully');
