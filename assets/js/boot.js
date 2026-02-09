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
const APP_VERSION = '1.5';
const WHATS_NEW_ITEMS = [
    { icon: 'palette', title: '13 PDF Templates', desc: 'Modern, Clean, Executive, Nord, American, and 8 more professionally designed templates.' },
    { icon: 'bookmark-plus', title: 'Save as Template', desc: 'Save any proposal as a reusable template for quick future use.' },
    { icon: 'braces', title: 'Insert Variables', desc: 'Use {{client.name}}, {{proposal.total}}, and more in your sections.' },
    { icon: 'kanban', title: 'Kanban Board View', desc: 'Visualize proposals as a drag-and-drop board by status.' }
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
    wrap.innerHTML = `<div class="modal" style="width:420px" onclick="event.stopPropagation()">
        <div style="text-align:center;margin-bottom:16px"><span style="font-size:28px">&#127881;</span></div>
        <div class="modal-t" style="text-align:center">What's New in ProposalKit</div>
        <div class="modal-d" style="text-align:center">Version ${APP_VERSION}</div>
        <div class="wn-list">${items}</div>
        <div class="modal-foot" style="justify-content:center"><button class="btn-sm" onclick="dismissWhatsNew()">Got it</button></div>
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
