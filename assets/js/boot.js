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
const APP_VERSION = '2.2';
const WHATS_NEW_ITEMS = [
    { icon: 'sparkles', title: 'AI Writing Assistant', desc: 'Use Anthropic Claude to improve, expand, shorten, or fix grammar in any section.' },
    { icon: 'users', title: 'Team & Multi-User', desc: 'Create local team profiles with roles (Admin, Editor, Viewer) and switch between them.' },
    { icon: 'file-down', title: 'Export Formats', desc: 'Export proposals as Markdown, CSV, or standalone HTML. Send data via webhooks.' },
    { icon: 'file-plus-2', title: 'SOW, Contract & Receipt', desc: 'Generate Statement of Work, Service Agreement, or Payment Receipt from any proposal.' },
    { icon: 'git-compare', title: 'Version Comparison', desc: 'Compare proposal versions side by side to see what changed between snapshots.' }
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
