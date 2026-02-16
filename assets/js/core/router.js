// ════════════════════════════════════════
// ROUTER — History API with clean URLs
// ════════════════════════════════════════

/* exported navigate, replaceUrl, handleRoute, render404, renderErrorPage, buildUrl */

// ── Route definitions ──
const ROUTES = [
    { path: '/',             view: 'dashboard' },
    { path: '/dashboard',    view: 'dashboard' },
    { path: '/proposals',    view: 'proposals' },
    { path: '/proposals/new', view: 'create' },
    { path: '/proposals/:id', view: 'editor' },
    { path: '/clients',      view: 'clients' },
    { path: '/profile',      view: 'profile' },
    { path: '/settings',     view: 'settings' },
    { path: '/pricing',      view: 'pricing' },
    { path: '/my-tickets',   view: 'my-tickets' },
    { path: '/admin',        view: 'admin' }
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
async function handleRoute() {
    const pathname = window.location.pathname;
    const result = matchRoute(pathname);

    if (typeof closeMobileSidebar === 'function') closeMobileSidebar();

    if (!result) { render404(pathname); return; }

    const { route, params } = result;
    const view = route.view;
    const an = typeof appName === 'function' ? appName() : 'ProposalKit';
    const titles = { dashboard: 'Dashboard', proposals: 'Proposals', create: 'New Proposal', clients: 'Customers', settings: 'Settings', profile: 'My Profile', pricing: 'Pricing', 'my-tickets': 'My Tickets', admin: 'Admin Panel' };

    // AUTH GUARD: Protected routes require authentication
    const protectedRoutes = ['dashboard', 'proposals', 'editor', 'create', 'clients', 'profile', 'settings', 'my-tickets', 'admin'];
    const isProtected = protectedRoutes.includes(view);

    if (isProtected) {
        // Check if user is authenticated
        const hasSession = typeof sbSession !== 'undefined' && sbSession !== null;
        const hasConfig = typeof CONFIG !== 'undefined' && CONFIG !== null;

        // If no session and no local config, redirect to login
        if (!hasSession && !hasConfig) {
            if (typeof renderAuthScreen === 'function') {
                renderAuthScreen();
            } else {
                window.location.href = '/';
            }
            return;
        }

        // ADMIN-ONLY: Check admin access for admin panel
        if (view === 'admin') {
            const checkAdmin = typeof isAdmin === 'function' ? await isAdmin() : false;
            if (!checkAdmin) {
                render404(pathname);
                if (typeof toast === 'function') toast('Access denied: Admin privileges required', 'error');
                return;
            }
        }
    }

    // Update document title
    document.title = (titles[view] || an) + ' — ' + an;

    // Toggle search visibility
    const topSearch = document.getElementById('topSearch');
    if (topSearch) topSearch.style.display = (view === 'settings' || view === 'create') ? 'none' : '';

    // Update sidebar active state
    const navKey = (view === 'editor' || view === 'proposals' || view === 'create') ? 'editor' : view;
    document.querySelectorAll('[data-nav]').forEach(b => { b.classList.remove('on'); b.removeAttribute('aria-current'); });
    const btn = document.querySelector(`[data-nav="${navKey}"]`);
    if (btn) { btn.classList.add('on'); btn.setAttribute('aria-current', 'page'); }

    // Reset breadcrumb root
    const root = document.getElementById('breadcrumbRoot');
    if (root) { root.textContent = an; root.onclick = () => navigate('/dashboard'); }

    // Destroy editors when leaving editor view
    if (view !== 'editor') {
        if (typeof destroyAllEditors === 'function') destroyAllEditors();
    }
    // Hide TOC on non-editor views
    if (view !== 'editor' && typeof hideTOC === 'function') hideTOC();
    // Close preview panel when navigating away
    if (view === 'create') {
        if (typeof closePreview === 'function') closePreview();
    }

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
        } else if (view === 'create') {
            if (CONFIG?.debug) console.log('[ROUTER] Navigating to create page, renderCreatePage available:', typeof renderCreatePage);
            if (typeof renderCreatePage === 'function') renderCreatePage();
            else if (CONFIG?.debug) console.error('[ROUTER] renderCreatePage function not found!');
        } else if (view === 'settings') {
            if (typeof openSettings === 'function') openSettings();
        } else if (view === 'pricing') {
            if (typeof renderPricing === 'function') renderPricing();
        } else if (view === 'my-tickets') {
            if (typeof renderMyTickets === 'function') renderMyTickets();
        } else if (view === 'admin') {
            if (typeof renderAdmin === 'function') renderAdmin();
        }
    } finally {
        _routing = false;
    }
}

// ── 404 Page ──
function render404(path) {
    const an = typeof appName === 'function' ? appName() : 'ProposalKit';
    document.title = 'Page not found — ' + an;
    document.querySelectorAll('[data-nav]').forEach(b => { b.classList.remove('on'); b.removeAttribute('aria-current'); });
    const body = document.getElementById('bodyScroll');
    const safePath = typeof esc === 'function' ? esc(path || '') : (path || '');
    body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:60vh;padding:32px">
            <div class="card" style="max-width:440px;text-align:center;padding:48px 32px">
                <div style="font-size:56px;font-weight:800;color:var(--text4);line-height:1">404</div>
                <div style="font-size:20px;font-weight:700;color:var(--foreground);margin:12px 0 6px">Page not found</div>
                <div style="font-size:14px;color:var(--text3);line-height:1.5">The page <code style="font-size:13px;padding:2px 6px;background:var(--muted);border-radius:6px">${safePath}</code> doesn't exist or may have been moved.</div>
                <div style="display:flex;gap:8px;justify-content:center;margin-top:24px">
                    <button class="btn" onclick="navigate('/dashboard')"><i data-lucide="arrow-left"></i> Go to Dashboard</button>
                    <button class="btn-outline" onclick="navigate('/proposals')"><i data-lucide="file-text"></i> Proposals</button>
                </div>
            </div>
        </div>`;
    if (typeof lucideScope === 'function') lucideScope(body); else if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ── Error Pages (called from anywhere) ──
function renderErrorPage(type) {
    const body = document.getElementById('bodyScroll');
    if (!body) return;
    const an = typeof appName === 'function' ? appName() : 'ProposalKit';
    const pages = {
        offline: { icon: 'wifi-off', title: 'You\'re offline', desc: 'Check your internet connection and try again.', btn: 'Retry', action: 'window.location.reload()' },
        error: { icon: 'alert-triangle', title: 'Something went wrong', desc: 'An unexpected error occurred. Try refreshing the page.', btn: 'Refresh', action: 'window.location.reload()' },
        forbidden: { icon: 'shield-off', title: 'Access denied', desc: 'You don\'t have permission to view this page.', btn: 'Go Home', action: 'navigate(\'/dashboard\')' },
        maintenance: { icon: 'wrench', title: 'Under maintenance', desc: an + ' is being updated. Please check back in a few minutes.', btn: 'Retry', action: 'window.location.reload()' }
    };
    const p = pages[type] || pages.error;
    document.title = p.title + ' — ' + an;
    body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:60vh;padding:32px">
            <div class="card" style="max-width:440px;text-align:center;padding:48px 32px">
                <div style="width:64px;height:64px;margin:0 auto 20px;background:var(--muted);border-radius:16px;display:flex;align-items:center;justify-content:center"><i data-lucide="${p.icon}" style="width:28px;height:28px;color:var(--text4)"></i></div>
                <div style="font-size:20px;font-weight:700;color:var(--foreground);margin-bottom:6px">${p.title}</div>
                <div style="font-size:14px;color:var(--text3);line-height:1.5">${p.desc}</div>
                <button class="btn" style="margin-top:24px" onclick="${p.action}"><i data-lucide="refresh-cw"></i> ${p.btn}</button>
            </div>
        </div>`;
    if (typeof lucideScope === 'function') lucideScope(body); else if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ── Listen for browser back/forward ──
window.addEventListener('popstate', handleRoute);
