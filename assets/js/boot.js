// ════════════════════════════════════════
// BOOT — App initialization (loaded last)
// ════════════════════════════════════════

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
const APP_VERSION = '2.4';
const APP_BUILD = '20260210';
const WHATS_NEW_ITEMS = [
    { icon: 'cloud', title: 'Cloud Sync', desc: 'Your proposals, clients, and settings now sync across all your devices automatically.' },
    { icon: 'log-in', title: 'User Accounts', desc: 'Sign in with Google or email to access your data from anywhere.' },
    { icon: 'share-2', title: 'Cloud Sharing', desc: 'Shared proposal links now work across devices — no same-browser requirement.' },
    { icon: 'shield-check', title: 'Secure & Private', desc: 'Row-level security ensures only you can access your data.' },
    { icon: 'wifi-off', title: 'Offline Mode', desc: 'Continue working offline — data syncs automatically when you reconnect.' }
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
