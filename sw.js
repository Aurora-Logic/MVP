// ════════════════════════════════════════
// SERVICE WORKER — Offline Support
// ════════════════════════════════════════

const CACHE_NAME = 'proposalkit-v20';
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

// Inline offline fallback page (when cache + network both fail)
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

// Plan check helper — service worker can't access localStorage, so we check via message
let hasOfflineAccess = false;

// Listen for plan updates from the main app
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'CHECK_PLAN') {
    hasOfflineAccess = e.data.hasOffline;
    if (!hasOfflineAccess) {
      // Free user detected — unregister immediately
      self.registration.unregister().then(() => {
        self.clients.matchAll().then(clients => {
          clients.forEach(client => client.navigate(client.url));
        });
      });
    }
  }
});

// Install — cache static assets (only for paid plans)
self.addEventListener('install', (e) => {
  // Note: The main app will unregister this SW before install completes for free users
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

// Fetch — network first, cache fallback, offline page last resort
self.addEventListener('fetch', (e) => {
  // Skip non-GET and CDN requests
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests (HTML pages) — SPA fallback to /index.html
  if (e.request.mode === 'navigate') {
    const path = url.pathname;
    // Known HTML files served directly; all other paths are SPA routes
    const htmlFiles = ['/client.html', '/landing.html', '/privacy.html', '/terms.html'];
    const spaExclude = ['/client', '/landing', '/privacy', '/terms'];
    const isHtmlFile = path === '/' || path === '/index.html' || htmlFiles.includes(path);
    const isExcluded = spaExclude.includes(path);
    const hasExtension = path.includes('.') && !path.endsWith('/');

    if (!isHtmlFile && !isExcluded && !hasExtension) {
      // SPA route (e.g. /dashboard, /proposals/abc123) — always serve index.html
      e.respondWith(
        caches.match('/index.html')
          .then(cached => cached || fetch('/index.html'))
          .catch(() => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html' } }))
      );
      return;
    }

    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() =>
          caches.match(e.request)
            .then(r => r || caches.match('/index.html'))
            .then(r => r || new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html' } }))
        )
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
