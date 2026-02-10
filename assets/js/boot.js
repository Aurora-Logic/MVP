// ════════════════════════════════════════
// BOOT — App initialization (loaded last)
// ════════════════════════════════════════

function initApp() {
    if (CONFIG) {
        document.getElementById('onboard').classList.add('hide');
        document.getElementById('appShell').style.display = 'flex';
        bootApp();
    } else {
        renderOnboarding();
    }
}

function bootApp() {
    initSidebarState();
    refreshSide();
    goNav('dashboard');
    initKeyboardShortcuts();
    lucide.createIcons();
    checkWhatsNew();
}

// ════════════════════════════════════════
// WHAT'S NEW MODAL
// ════════════════════════════════════════
const APP_VERSION = '2.1';
const WHATS_NEW_ITEMS = [
    { icon: 'pen-line', title: 'Digital Acceptance', desc: 'Clients can sign proposals with name and signature directly from the shared link.' },
    { icon: 'eye-off', title: 'White-Label Mode', desc: 'Remove ProposalKit branding from sidebar, page titles, exports, and client portal.' },
    { icon: 'mouse-pointer-click', title: 'Click to Change Status', desc: 'Click any status badge on the proposals page to quickly update it.' },
    { icon: 'shield-check', title: 'Accessibility & Polish', desc: 'ARIA roles, keyboard navigation, and dozens of UI refinements.' }
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
