// ════════════════════════════════════════
// ROUTER — History API with clean URLs
// ════════════════════════════════════════

/* exported navigate, replaceUrl, handleRoute, render404, buildUrl */

// ── Route definitions ──
const ROUTES = [
    { path: '/',             view: 'dashboard' },
    { path: '/dashboard',    view: 'dashboard' },
    { path: '/proposals',    view: 'proposals' },
    { path: '/proposals/:id', view: 'editor' },
    { path: '/clients',      view: 'clients' },
    { path: '/profile',      view: 'profile' },
    { path: '/settings',     view: 'settings' }
];

// Flag to prevent loadEditor/renderProposals from calling replaceUrl during handleRoute
let _routing = false;

// ── Match URL path to a route ──
function matchRoute(pathname) {
    const clean = pathname.replace(/\/+$/, '') || '/';
    for (const route of ROUTES) {
        if (route.path === clean) return { route, params: {} };
        // Parameterized routes (e.g. /proposals/:id)
        if (route.path.includes(':')) {
            const routeParts = route.path.split('/');
            const pathParts = clean.split('/');
            if (routeParts.length !== pathParts.length) continue;
            const params = {};
            let match = true;
            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) {
                    params[routeParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
                } else if (routeParts[i] !== pathParts[i]) {
                    match = false; break;
                }
            }
            if (match) return { route, params };
        }
    }
    return null;
}

// ── Navigate to a path (creates history entry) ──
function navigate(path, opts) {
    const fullPath = path.split('?')[0];
    const search = path.includes('?') ? '?' + path.split('?')[1] : '';
    const url = fullPath + search;

    if (opts && opts.replace) {
        history.replaceState({ path: url }, '', url);
    } else {
        history.pushState({ path: url }, '', url);
    }
    handleRoute();
}

// ── Replace current URL without history entry ──
function replaceUrl(path) {
    if (_routing) return; // Prevent recursive URL updates during route handling
    history.replaceState({ path }, '', path);
}

// ── Build a URL with optional query params ──
function buildUrl(basePath, params) {
    if (!params || Object.keys(params).length === 0) return basePath;
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== null && v !== undefined && v !== '') qs.set(k, v);
    }
    const str = qs.toString();
    return str ? basePath + '?' + str : basePath;
}

// ── Handle current URL — render correct view ──
function handleRoute() {
    const pathname = window.location.pathname;
    const result = matchRoute(pathname);

    if (typeof closeMobileSidebar === 'function') closeMobileSidebar();

    if (!result) { render404(pathname); return; }

    const { route, params } = result;
    const view = route.view;
    const an = typeof appName === 'function' ? appName() : 'ProposalKit';
    const titles = { dashboard: 'Dashboard', proposals: 'Proposals', clients: 'Customers', settings: 'Settings', profile: 'My Profile' };

    // Update document title
    document.title = (titles[view] || an) + ' — ' + an;

    // Toggle search visibility
    const topSearch = document.getElementById('topSearch');
    if (topSearch) topSearch.style.display = (view === 'settings') ? 'none' : '';

    // Update sidebar active state
    const navKey = (view === 'editor' || view === 'proposals') ? 'editor' : view;
    document.querySelectorAll('[data-nav]').forEach(b => b.classList.remove('on'));
    const btn = document.querySelector(`[data-nav="${navKey}"]`);
    if (btn) btn.classList.add('on');

    // Reset breadcrumb root
    const root = document.getElementById('breadcrumbRoot');
    if (root) { root.textContent = an; root.onclick = () => navigate('/dashboard'); }

    // Destroy editors when leaving editor view
    if (view !== 'editor') {
        if (typeof destroyAllEditors === 'function') destroyAllEditors();
    }
    // Hide TOC on non-editor views
    if (view !== 'editor' && typeof hideTOC === 'function') hideTOC();

    _routing = true;
    try {
        if (view === 'dashboard') {
            renderDashboard();
        } else if (view === 'proposals') {
            // Read filter/sort/page from query params
            const qs = new URLSearchParams(window.location.search);
            if (qs.has('filter')) currentFilter = qs.get('filter');
            if (qs.has('page')) currentPage = parseInt(qs.get('page'), 10) || 1;
            renderProposals();
        } else if (view === 'editor') {
            const id = params.id;
            // Verify proposal exists
            const proposal = DB.find(p => p.id === id);
            if (!proposal) { _routing = false; render404(pathname); return; }
            loadEditor(id);
        } else if (view === 'clients') {
            renderClients();
        } else if (view === 'profile') {
            if (typeof renderProfile === 'function') renderProfile();
            else if (typeof openSettings === 'function') openSettings();
        } else if (view === 'settings') {
            if (typeof openSettings === 'function') openSettings();
        }
    } finally {
        _routing = false;
    }
}

// ── 404 Page ──
function render404(path) {
    const an = typeof appName === 'function' ? appName() : 'ProposalKit';
    document.title = 'Page not found — ' + an;
    document.querySelectorAll('[data-nav]').forEach(b => b.classList.remove('on'));
    const body = document.getElementById('bodyScroll');
    body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:60vh;padding:32px">
            <div class="card" style="max-width:420px;text-align:center;padding:48px 32px">
                <div style="font-size:64px;font-weight:700;color:var(--text4);line-height:1">404</div>
                <div style="font-size:18px;font-weight:600;margin-top:12px;color:var(--foreground)">Page not found</div>
                <div style="font-size:14px;color:var(--text3);margin-top:8px">The page <code style="font-size:13px;padding:2px 6px;background:var(--muted);border-radius:6px">${typeof esc === 'function' ? esc(path || '') : (path || '')}</code> doesn't exist.</div>
                <button class="btn" style="margin-top:24px" onclick="navigate('/dashboard')"><i data-lucide="arrow-left"></i> Go to Dashboard</button>
            </div>
        </div>`;
    if (typeof lucideScope === 'function') lucideScope(body); else if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ── Listen for browser back/forward ──
window.addEventListener('popstate', handleRoute);
