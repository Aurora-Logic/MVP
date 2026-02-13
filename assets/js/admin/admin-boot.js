// ════════════════════════════════════════
// ADMIN-BOOT — Initialization
// ════════════════════════════════════════

(function() {
    // 1. Set up error capture FIRST
    var errorLog = safeGet('pk_admin_errors', []);
    window.onerror = function(msg, src, line, col, err) {
        errorLog.push({
            ts: Date.now(),
            msg: String(msg),
            src: String(src || ''),
            line: line || 0,
            col: col || 0,
            stack: (err && err.stack) ? err.stack : ''
        });
        while (errorLog.length > 100) errorLog.shift();
        try { localStorage.setItem('pk_admin_errors', JSON.stringify(errorLog)); } catch (e) { /* full */ }
    };
    window.onunhandledrejection = function(e) {
        var reason = e.reason || {};
        errorLog.push({
            ts: Date.now(),
            msg: reason.message || String(e.reason),
            src: 'promise',
            line: 0,
            col: 0,
            stack: reason.stack || ''
        });
        while (errorLog.length > 100) errorLog.shift();
        try { localStorage.setItem('pk_admin_errors', JSON.stringify(errorLog)); } catch (ex) { /* full */ }
    };

    // 2. Load data from localStorage
    adminLoad();

    // 3. Apply theme
    var theme = localStorage.getItem('pk_theme') || 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');

    // 4. Init Supabase + check session, then boot admin
    bootAdminAsync();

    function bootAdminAsync() {
        // Init Supabase client (reuses supabase.js loaded from main app core)
        if (typeof initSupabase === 'function') {
            initSupabase();
        }

        // Try to get existing session from Supabase
        if (typeof sb === 'function' && sb()) {
            sb().auth.getSession().then(function(result) {
                if (result && result.data && result.data.session) {
                    sbSession = result.data.session;
                }
                finishBoot();
            }).catch(function() {
                finishBoot();
            });
        } else {
            finishBoot();
        }
    }

    function finishBoot() {
        // Check admin access (now with Supabase session available)
        if (!checkAdminAccess()) {
            renderAdminGate();
            lucide.createIcons();
            return;
        }

        // Unlock admin shell
        unlockAdmin();
        renderAdminSidebar();
        adminNav('dashboard');
        lucide.createIcons();

        // Multi-tab sync — selective reload for the changed key
        var _syncTimer = null;
        window.addEventListener('storage', function(e) {
            if (!e.key || e.key.indexOf('pk_') !== 0) return;
            // Debounce rapid multi-key changes (e.g. factory reset)
            clearTimeout(_syncTimer);
            _syncTimer = setTimeout(function() {
                adminReload();
                if (A_CURRENT_SECTION && A_CURRENT_SECTION !== 'tests') adminNav(A_CURRENT_SECTION);
            }, 100);
        });

        // Audit login
        if (typeof auditLog === 'function') {
            var user = activeAdminUser();
            var detail = user ? user.name + ' (' + user.email + ')' : 'unknown';
            auditLog('admin_login', 'session', 'Admin panel opened by ' + detail);
        }

        console.log('%c ProposalKit Admin Panel ', 'background:#800020;color:#fff;border-radius:4px;padding:2px 8px;font-weight:bold');
    }
})();
