// ════════════════════════════════════════
// SERVICE WORKER — Offline Support
// ════════════════════════════════════════

const CACHE_NAME = 'proposalkit-v14';
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

// Install — cache static assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', (e) => {
  // Skip non-GET and CDN requests
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests (HTML pages) — SPA fallback to /index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Assets (JS, CSS, images) — network first, cache fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
