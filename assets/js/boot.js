// ════════════════════════════════════════
// BOOT — App initialization (loaded last)
// ════════════════════════════════════════

// Global error boundary
/* exported APP_BUILD */
window.onerror = function(msg, src, line, col, err) {
    const info = `${msg} at ${src}:${line}:${col}`;
    console.error('[ProposalKit Error]', info, err);
    if (typeof toast === 'function') toast('Something went wrong. Please refresh.', 'error');
    return false;
};
window.addEventListener('unhandledrejection', function(e) {
    console.error('[ProposalKit Unhandled Promise]', e.reason);
    if (typeof toast === 'function') toast('Something went wrong. Please refresh.', 'error');
});

function initApp() {
    if (typeof initAuth === 'function') {
        initAuth();
    } else {
        // Offline fallback (Supabase CDN not loaded)
        if (CONFIG) {
            document.getElementById('onboard').classList.add('hide');
            document.getElementById('appShell').style.display = 'flex';
            bootApp();
        } else {
            renderOnboarding();
        }
    }
}

function bootApp() {
    initSidebarState();
    if (typeof initTeam === 'function') initTeam();
    refreshSide();
    goNav('dashboard');
    initKeyboardShortcuts();
    lucide.createIcons();
    checkWhatsNew();
}

// ════════════════════════════════════════
// WHAT'S NEW MODAL
// ════════════════════════════════════════
const APP_VERSION = '2.14.0';
const APP_BUILD = '20260213';
const WHATS_NEW_ITEMS = [
    { icon: 'sliders-horizontal', title: 'Settings Redesign', desc: 'Settings now uses horizontal tabs instead of sidebar scroll. Each section is its own focused page.' },
    { icon: 'table', title: 'Client Table View', desc: 'Clients page rebuilt as a Notion-style table with metric strip, search, and inline actions.' },
    { icon: 'bar-chart-3', title: 'Client Metrics', desc: 'New metric cards at the top of Clients showing total clients, total value, average, and win rate.' },
    { icon: 'user-plus', title: 'Improved Add Client', desc: 'Add client modal now has organized sections (Contact, Communication, Billing) with a pill toggle for type.' }
];

function checkWhatsNew() {
    const seen = localStorage.getItem('pk_whatsnew_ver');
    if (seen === APP_VERSION) return;
    setTimeout(() => showWhatsNew(), 800);
}

function showWhatsNew() {
    const items = WHATS_NEW_ITEMS.map(i => `
        <div class="wn-item">
            <div class="wn-icon"><i data-lucide="${i.icon}"></i></div>
            <div><div class="wn-title">${i.title}</div><div class="wn-desc">${i.desc}</div></div>
        </div>`).join('');
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'whatsNewModal';
    wrap.onclick = (e) => { if (e.target === wrap) dismissWhatsNew(); };
    wrap.innerHTML = `<div class="modal wn-modal" onclick="event.stopPropagation()">
        <div class="wn-emoji">&#127881;</div>
        <div class="modal-t wn-center">What's new in ${typeof appName === 'function' ? appName() : 'ProposalKit'}</div>
        <div class="modal-d wn-center">Version ${APP_VERSION}</div>
        <div class="wn-list">${items}</div>
        <div class="modal-foot wn-center"><button class="btn-sm" onclick="dismissWhatsNew()">Got it</button></div>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

function dismissWhatsNew() {
    safeLsSet('pk_whatsnew_ver', APP_VERSION);
    document.getElementById('whatsNewModal')?.remove();
}

// Start the app
initApp();
