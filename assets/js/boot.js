// ════════════════════════════════════════
// BOOT — App initialization (loaded last)
// ════════════════════════════════════════
/* exported submitNpsScore, closeNpsPrompt */

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
    handleRoute();
    initKeyboardShortcuts();
    if (typeof checkAnnouncements === 'function') checkAnnouncements();
    if (typeof trackEvent === 'function') trackEvent('app_open');
    lucide.createIcons();
    patchAriaLabels();
    checkWhatsNew();
    checkNpsPrompt();
}

// Auto-derive aria-label from data-tooltip for icon-only buttons missing accessible names
function patchAriaLabels() {
    document.querySelectorAll('[data-tooltip]:not([aria-label])').forEach(el => {
        el.setAttribute('aria-label', el.getAttribute('data-tooltip'));
    });
}
// Patch after every lucide.createIcons() call via observer
const _origCreateIcons = lucide.createIcons.bind(lucide);
lucide.createIcons = function(opts) {
    _origCreateIcons(opts);
    patchAriaLabels();
};
/** Scope icon creation to a container — avoids full-DOM rescan */
function lucideScope(el) {
    if (el) lucide.createIcons({ nodes: [el] });
}

// ════════════════════════════════════════
// WHAT'S NEW MODAL
// ════════════════════════════════════════
const APP_VERSION = '2.15.4';
const APP_BUILD = '20260213';
const WHATS_NEW_ITEMS = [
    { icon: 'settings', title: 'Settings Modal', desc: 'Settings now opens as a Notion-style modal overlay with sidebar navigation.' },
    { icon: 'columns-2', title: 'Customer Split View', desc: 'Click any customer to see details in a side panel without leaving the list.' },
    { icon: 'layout-grid', title: 'Card & Table Toggle', desc: 'Switch between table and card views on the Customers page.' },
    { icon: 'type', title: 'System Font Stack', desc: 'Switched to native system fonts for faster rendering and a native feel.' }
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

// ════════════════════════════════════════
// NPS PROMPT (periodic satisfaction survey)
// ════════════════════════════════════════
function checkNpsPrompt() {
    const last = safeGetStorage('pk_feedback_asked', 0);
    if (Date.now() - last < 30 * 86400000) return; // ask at most once per 30 days
    if (DB.filter(p => !p.archived).length < 5) return; // wait until 5 proposals
    setTimeout(() => showNpsPrompt(), 2000);
}

function showNpsPrompt() {
    // Don't show if the feedback modal is already open
    if (document.getElementById('feedbackModal')) return;
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'npsModal';
    wrap.onclick = (e) => { if (e.target === wrap) closeNpsPrompt(); };
    const scores = Array.from({ length: 11 }, (_, i) =>
        `<button class="fb-score" onclick="submitNpsScore(${i})" style="width:32px;height:32px;border:1px solid var(--border);border-radius:8px;background:none;cursor:pointer;font-size:13px;font-weight:500;color:var(--foreground);transition:all 200ms" onmouseenter="this.style.background='var(--primary)';this.style.color='#fff'" onmouseleave="this.style.background='none';this.style.color='var(--foreground)'">${i}</button>`
    ).join('');
    wrap.innerHTML = `<div class="modal" style="max-width:440px" onclick="event.stopPropagation()">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div class="modal-t">Quick Feedback</div>
            <button class="btn-sm-icon-ghost" onclick="closeNpsPrompt()"><i data-lucide="x"></i></button>
        </div>
        <p style="font-size:13px;color:var(--muted-foreground);margin-bottom:16px">How likely are you to recommend ${typeof appName === 'function' ? appName() : 'ProposalKit'}? (0 = not likely, 10 = very likely)</p>
        <div style="display:flex;gap:4px;justify-content:center;margin-bottom:16px">${scores}</div>
        <textarea id="npsComment" rows="2" placeholder="Any comments? (optional)" style="width:100%;font-size:13px;resize:none;padding:8px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px"></textarea>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

function submitNpsScore(score) {
    const comment = document.getElementById('npsComment')?.value?.trim() || '';
    const feedback = safeGetStorage('pk_feedback', []);
    feedback.push({
        id: uid(), score, comment, ts: Date.now(),
        userId: CONFIG?.activeUserId || '',
        userName: CONFIG?.name || '',
        userEmail: CONFIG?.email || '',
        plan: typeof getCurrentPlan === 'function' ? getCurrentPlan() : 'free',
        proposals: DB.filter(p => !p.archived).length
    });
    try { localStorage.setItem('pk_feedback', JSON.stringify(feedback)); } catch (e) { /* full */ }
    try { localStorage.setItem('pk_feedback_asked', JSON.stringify(Date.now())); } catch (e) { /* full */ }
    closeNpsPrompt();
    toast(score >= 7 ? 'Thanks for the kind words!' : 'Thanks for your feedback!');
}

function closeNpsPrompt() {
    document.getElementById('npsModal')?.remove();
    try { localStorage.setItem('pk_feedback_asked', JSON.stringify(Date.now())); } catch (e) { /* full */ }
}

// Start the app
initApp();
