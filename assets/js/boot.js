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
const APP_VERSION = '2.3';
const APP_BUILD = '20260210';
const WHATS_NEW_ITEMS = [
    { icon: 'upload', title: 'Import Data', desc: 'Import proposals, clients, and settings from a JSON backup file.' },
    { icon: 'indian-rupee', title: 'UPI & QR Payments', desc: 'Add your UPI ID and auto-generate QR codes on PDF invoices.' },
    { icon: 'wallet', title: 'Payment Tracking', desc: 'Record multiple payments per proposal, track dues, and generate receipts.' },
    { icon: 'layout-template', title: 'Landing Page', desc: 'New marketing landing page with features showcase, pricing, and FAQ.' },
    { icon: 'wand-2', title: 'Onboarding Polish', desc: 'Skip any step, celebration animation, and smarter empty states throughout.' }
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
