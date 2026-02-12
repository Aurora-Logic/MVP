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
const APP_VERSION = '2.12.0';
const APP_BUILD = '20260212';
const WHATS_NEW_ITEMS = [
    { icon: 'type', title: 'SF Pro Typography', desc: 'System font stack with SF Pro Display, Helvetica Neue, and -0.02em letter-spacing.' },
    { icon: 'search', title: 'Quick Search Button', desc: 'New search icon next to Quick Create opens the command palette instantly.' },
    { icon: 'message-square-warning', title: 'Send Feedback', desc: 'Report bugs, suggest features, or share thoughts — right from the sidebar.' },
    { icon: 'sun', title: 'Light Mode Default', desc: 'App now defaults to light mode. Dark mode available in settings.' }
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
        <div class="modal-t wn-center">What's New in ${typeof appName === 'function' ? appName() : 'ProposalKit'}</div>
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
