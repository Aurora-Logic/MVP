// ════════════════════════════════════════
// NAVIGATION + MOBILE + KEYBOARD
// ════════════════════════════════════════

/* exported goNav, toggleMobileSidebar, toggleSidebar, initSidebarState, initKeyboardShortcuts, openFeedbackModal, setFbTab, selectFbType, submitFeedback, openGuide */
function _destroyAllEditors() {
    // Destroy section editors
    if (typeof sectionEditors === 'object' && sectionEditors) {
        Object.values(sectionEditors).forEach(e => {
            if (e && typeof e.destroy === 'function') try { e.destroy(); } catch (err) { }
        });
        sectionEditors = {};
    }
    // Destroy payment terms editor
    if (paymentTermsEditor && typeof paymentTermsEditor.destroy === 'function') {
        try { paymentTermsEditor.destroy(); } catch (e) { }
        paymentTermsEditor = null;
    }
    // Destroy line item editors
    document.querySelectorAll('.li-desc-editor').forEach(el => {
        if (el._editor && typeof el._editor.destroy === 'function') {
            try { el._editor.destroy(); } catch (e) { }
            el._editor = null;
        }
    });
}

function goNav(view, opts) {
    const paths = { dashboard: '/dashboard', proposals: '/proposals', clients: '/clients', profile: '/profile', settings: '/settings' };
    // 'editor' with no CUR → go to proposals list (preserve filter in URL)
    if (view === 'editor' && !CUR) {
        const params = new URLSearchParams();
        if (typeof currentFilter !== 'undefined' && currentFilter !== 'all') params.set('filter', currentFilter);
        const qs = params.toString();
        navigate('/proposals' + (qs ? '?' + qs : ''), opts);
    } else if (view === 'editor' && CUR) {
        navigate('/proposals/' + CUR, opts);
    } else {
        navigate(paths[view] || '/dashboard', opts);
    }
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sideOverlay');
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('show');
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sideOverlay');
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('show');
}

// Collapsible sidebar (desktop) / offcanvas (mobile)
function toggleSidebar() {
    if (window.innerWidth <= 768) {
        toggleMobileSidebar();
    } else {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
        safeLsSet('pk_sidebarCollapsed', sidebar.classList.contains('collapsed') ? 'true' : 'false');
    }
}

function initSidebarState() {
    const sidebar = document.getElementById('sidebar');
    if (localStorage.getItem('pk_sidebarCollapsed') === 'true') {
        sidebar.classList.add('collapsed');
    }
}

// Global keyboard handlers
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when typing in inputs
        const tag = e.target.tagName;
        const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;

        // ? key — open shortcuts panel (only when not in input)
        if (e.key === '?' && !isInput) {
            e.preventDefault();
            openShortcutsPanel();
            return;
        }

        // ESC key — exit focus mode first, then close topmost modal or preview
        if (e.key === 'Escape') {
            if (focusMode && typeof exitFocusMode === 'function') { exitFocusMode(); return; }
            const prevPanel = document.getElementById('prevPanel');
            if (prevPanel && prevPanel.classList.contains('show')) {
                closePreview();
                return;
            }
            // Persistent modals (toggle class, don't remove from DOM)
            // Command palette
            const cmdDialog = document.getElementById('cmdDialog');
            if (cmdDialog && cmdDialog.open) { closeCommandPalette(); return; }
            // Create drawer
            const createDrawer = document.getElementById('createDrawer');
            if (createDrawer && createDrawer.classList.contains('show')) { closeCreateDrawer(); return; }
            // What's New modal — must save seen state before removing
            const wnModal = document.getElementById('whatsNewModal');
            if (wnModal) { if (typeof dismissWhatsNew === 'function') dismissWhatsNew(); else wnModal.remove(); return; }
            // Dynamic modals (remove from DOM)
            const dynamicModals = ['settingsModal', 'guideModal', 'feedbackModal', 'npsModal', 'shortcutsModal', 'completenessModal', 'clientModal', 'cpModal', 'libModal', 'tcModal', 'tplModal', 'emailTplModal', 'shareModal', 'dupClientModal', 'confirmModal', 'csvModal'];
            for (const modalId of dynamicModals) {
                const modal = document.getElementById(modalId);
                if (modal) { modal.remove(); return; }
            }
            closeMobileSidebar();
        }

        // CMD/CTRL shortcuts
        if (e.metaKey || e.ctrlKey) {
            if (e.key === 'k') {
                e.preventDefault();
                openCommandPalette();
            }
            if (e.key === 'n') {
                e.preventDefault();
                openNewModal();
            }
            if (e.key === 'p' && CUR) {
                e.preventDefault();
                openPreview();
            }
            if (e.key === 'e' && CUR) {
                e.preventDefault();
                doExport('proposal');
            }
            if (e.key === 's') {
                e.preventDefault();
                if (CUR) { dirty(); toast('Saved'); }
            }
            // Undo: Cmd+Z
            if (e.key === 'z' && !e.shiftKey && CUR) {
                e.preventDefault();
                undo();
            }
            // Redo: Cmd+Shift+Z
            if (e.key === 'z' && e.shiftKey && CUR) {
                e.preventDefault();
                redo();
            }
            if (e.key === 'y' && !e.shiftKey && CUR) {
                e.preventDefault();
                redo();
            }
            // Focus mode: Cmd+.
            if (e.key === '.' && typeof toggleFocusMode === 'function') {
                e.preventDefault();
                toggleFocusMode();
            }
        }
    });

    // Click to close context menus
    document.addEventListener('click', () => {
        hideCtx();
        // Close user menu on outside click
        const um = document.querySelector('.side-user-menu');
        if (um) um.remove();
    });
}

// ── How to use guide modal ──
function openGuide() {
    const existing = document.getElementById('guideModal');
    if (existing) existing.remove();
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'guideModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    wrap.innerHTML = `<div class="modal" style="max-width:540px" onclick="event.stopPropagation()">
        <div class="modal-t">How to use</div>
        <div class="modal-d" style="margin-bottom:16px">A quick guide to get you started with ${typeof appName === 'function' ? appName() : 'ProposalKit'}.</div>
        <div style="display:flex;flex-direction:column;gap:12px;max-height:400px;overflow-y:auto;padding-right:4px">
            <div class="guide-step"><div class="guide-num">1</div><div><div class="guide-step-t">Create a proposal</div><div class="guide-step-d">Click "New proposal" or press <kbd>Cmd+N</kbd>. Choose a blank proposal or start from a template.</div></div></div>
            <div class="guide-step"><div class="guide-num">2</div><div><div class="guide-step-t">Add your content</div><div class="guide-step-d">Fill in client details, add sections with rich text, and build your pricing table with line items.</div></div></div>
            <div class="guide-step"><div class="guide-num">3</div><div><div class="guide-step-t">Preview and export</div><div class="guide-step-d">Press <kbd>Cmd+P</kbd> to preview. Choose from 13 PDF templates, then export as PDF or share a link.</div></div></div>
            <div class="guide-step"><div class="guide-num">4</div><div><div class="guide-step-t">Manage clients</div><div class="guide-step-d">Save client details once in the Clients tab. Pick them when creating proposals to auto-fill fields.</div></div></div>
            <div class="guide-step"><div class="guide-num">5</div><div><div class="guide-step-t">Track progress</div><div class="guide-step-d">Use the dashboard to monitor proposal status, revenue, and win rates at a glance.</div></div></div>
        </div>
        <div style="margin-top:16px;padding:12px;background:var(--muted);border-radius:var(--r);font-size:14px;color:var(--text3)">Press <kbd>Cmd+K</kbd> to open the command palette for quick access to all actions.</div>
        <div class="modal-foot" style="margin-top:16px"><button class="btn-sm" onclick="document.getElementById('guideModal').remove()">Got it</button></div>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
}

// ── Help & Feedback hub modal (tabbed: Feedback / My Tickets / New Ticket) ──
let _fbTab = 'feedback';

function openFeedbackModal(tab) {
    const existing = document.getElementById('feedbackModal');
    if (existing) existing.remove();
    _fbTab = tab || 'feedback';
    const unread = typeof hasUnreadTickets === 'function' && hasUnreadTickets();
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'feedbackModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    wrap.innerHTML = `<div class="modal" style="max-width:480px;padding:0" onclick="event.stopPropagation()">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px 0">
            <div class="modal-t" style="margin:0">Help & Feedback</div>
            <button class="btn-sm-icon-ghost" onclick="document.getElementById('feedbackModal').remove()"><i data-lucide="x" style="width:16px;height:16px"></i></button>
        </div>
        <div style="display:flex;border-bottom:1px solid var(--border);padding:0 20px;gap:0;margin-top:12px">
            <button class="fb-tab${_fbTab === 'feedback' ? ' on' : ''}" onclick="setFbTab('feedback')">Feedback</button>
            <button class="fb-tab${_fbTab === 'tickets' ? ' on' : ''}" onclick="setFbTab('tickets')">My Tickets${unread ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--red);margin-left:6px;vertical-align:middle"></span>' : ''}</button>
            <button class="fb-tab${_fbTab === 'new' ? ' on' : ''}" onclick="setFbTab('new')">New Ticket</button>
        </div>
        <div id="fbTabBody" style="padding:20px;max-height:420px;overflow-y:auto"></div>
    </div>`;
    // Inject tab styles once
    if (!document.getElementById('fbTabStyle')) {
        const style = document.createElement('style');
        style.id = 'fbTabStyle';
        style.textContent = '.fb-tab{padding:8px 12px;border:none;background:none;font-size:13px;cursor:pointer;color:var(--muted-foreground);border-bottom:2px solid transparent;transition:all 200ms;white-space:nowrap}.fb-tab.on{color:var(--foreground);font-weight:600;border-bottom-color:var(--primary)}';
        document.head.appendChild(style);
    }
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
    _renderFbTab();
}

function setFbTab(tab) {
    _fbTab = tab;
    document.querySelectorAll('.fb-tab').forEach(b => {
        const match = (tab === 'feedback' && b.textContent.startsWith('Feedback')) ||
                      (tab === 'tickets' && b.textContent.startsWith('My Tickets')) ||
                      (tab === 'new' && b.textContent.startsWith('New Ticket'));
        b.classList.toggle('on', match);
    });
    _renderFbTab();
}

function _renderFbTab() {
    const body = document.getElementById('fbTabBody');
    if (!body) return;
    if (_fbTab === 'feedback') _renderFeedbackForm(body);
    else if (_fbTab === 'tickets') { if (typeof loadMyTickets === 'function') loadMyTickets(body); }
    else if (_fbTab === 'new') _renderNewTicketForm(body);
}

function _renderFeedbackForm(body) {
    body.innerHTML = `<div style="margin-bottom:12px;font-size:13px;color:var(--muted-foreground)">Report a bug, suggest a feature, or share your thoughts.</div>
        <div style="display:flex;gap:8px;margin-bottom:16px">
            <button class="btn-sm-outline fb-type-btn on" data-type="bug" onclick="selectFbType(this)"><i data-lucide="bug"></i>Bug</button>
            <button class="btn-sm-outline fb-type-btn" data-type="feature" onclick="selectFbType(this)"><i data-lucide="lightbulb"></i>Feature</button>
            <button class="btn-sm-outline fb-type-btn" data-type="other" onclick="selectFbType(this)"><i data-lucide="message-circle"></i>Other</button>
        </div>
        <textarea id="fbText" rows="4" placeholder="Describe the issue or suggestion..." style="width:100%;resize:vertical"></textarea>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
            <button class="btn-sm-ghost" onclick="document.getElementById('feedbackModal').remove()">Cancel</button>
            <button class="btn-sm" onclick="submitFeedback()">Send feedback</button>
        </div>`;
    lucide.createIcons();
    document.getElementById('fbText')?.focus();
}

function _renderNewTicketForm(body) {
    body.innerHTML = `<div style="display:flex;flex-direction:column;gap:14px">
        <div><label class="fl">Subject</label><input id="spSubj" placeholder="Brief summary" style="font-size:13px"></div>
        <div><label class="fl">Category</label><div id="spCat"></div></div>
        <div><label class="fl">Description</label><textarea id="spDesc" rows="5" placeholder="Describe your issue\u2026" style="font-size:13px;resize:vertical"></textarea></div>
        <button class="btn-sm" onclick="if(typeof submitNewTicket==='function')submitNewTicket()" style="align-self:flex-start">Submit Ticket</button>
    </div>`;
    if (typeof csel === 'function') {
        csel(document.getElementById('spCat'), { value: 'general', items: [
            { value: 'general', label: 'General' }, { value: 'bug', label: 'Bug Report' },
            { value: 'feature', label: 'Feature Request' }, { value: 'billing', label: 'Billing' }
        ] });
    }
}

function selectFbType(btn) {
    btn.closest('div').querySelectorAll('.fb-type-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}

function submitFeedback() {
    const text = document.getElementById('fbText')?.value?.trim();
    if (!text) { toast('Please describe your feedback', 'error'); return; }
    const type = document.querySelector('.fb-type-btn.on')?.dataset?.type || 'bug';
    const payload = { type, text, version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '', ts: new Date().toISOString() };
    const fb = safeGetStorage('pk_feedback', []);
    fb.push(payload);
    safeLsSet('pk_feedback', JSON.stringify(fb));
    document.getElementById('feedbackModal')?.remove();
    toast('Thank you for your feedback!');
}

// ── User menu dropdown (shadcn NavUser) ──
function toggleUserMenu() {
    const existing = document.querySelector('.side-user-menu');
    if (existing) { existing.remove(); return; }
    const btn = document.getElementById('sideUserBtn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'side-user-menu';
    const name = CONFIG.name || 'User';
    const email = CONFIG.email || '';
    const initial = name.charAt(0).toUpperCase();
    // Team members
    let teamHtml = '';
    if (CONFIG.team && CONFIG.team.length > 1) {
        const curId = CONFIG.activeUserId;
        teamHtml = '<div class="side-user-menu-sep"></div>' + CONFIG.team.filter(m => m.id !== curId).slice(0, 3).map(m =>
            `<button class="side-user-menu-item" onclick="typeof switchUser==='function'&&switchUser('${escAttr(m.id)}');document.querySelector('.side-user-menu')?.remove()"><i data-lucide="user"></i>${esc(m.name)}</button>`
        ).join('');
    }
    menu.innerHTML = `
        <div class="side-user-menu-header">
            <div class="side-user-avatar">${initial}</div>
            <div class="side-user-menu-header-info">
                <span class="side-user-name">${esc(name)}</span>
                ${email ? `<span class="side-user-email">${esc(email)}</span>` : ''}
            </div>
        </div>
        <div class="side-user-menu-sep"></div>
        <button class="side-user-menu-item" onclick="goNav('settings');document.querySelector('.side-user-menu')?.remove()"><i data-lucide="settings"></i>Settings</button>
        ${teamHtml}
        <div class="side-user-menu-sep"></div>
        <button class="side-user-menu-item" onclick="logoutApp()"><i data-lucide="log-out"></i>Log out</button>`;
    menu.style.position = 'fixed';
    menu.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
    menu.style.left = rect.left + 'px';
    document.body.appendChild(menu);
    lucide.createIcons();
    // Prevent immediate close from the same click
    setTimeout(() => {
        const close = (e) => {
            if (!menu.contains(e.target) && e.target !== btn) {
                menu.remove();
                document.removeEventListener('click', close);
            }
        };
        document.addEventListener('click', close);
    }, 10);
}
