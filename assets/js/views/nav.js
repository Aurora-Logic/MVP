// ════════════════════════════════════════
// NAVIGATION + MOBILE + KEYBOARD
// ════════════════════════════════════════

/* exported goNav, toggleMobileSidebar, toggleSidebar, initSidebarState, initKeyboardShortcuts, openFeedbackModal, selectFbType, submitFeedback */
function destroyAllEditors() {
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

function goNav(view) {
    closeMobileSidebar();
    const titles = { dashboard: 'Dashboard', proposals: 'Proposals', clients: 'Clients', analytics: 'Analytics', settings: 'Settings' };
    const an = typeof appName === 'function' ? appName() : 'ProposalKit';
    document.title = (titles[view] || an) + ' \u2014 ' + an;
    const topSearch = document.getElementById('topSearch');
    if (topSearch) topSearch.style.display = (view === 'analytics' || view === 'settings') ? 'none' : '';
    document.querySelectorAll('[data-nav]').forEach(b => b.classList.remove('on'));
    const btn = document.querySelector(`[data-nav="${view}"]`);
    if (btn) btn.classList.add('on');
    // Reset breadcrumb root to app name
    const root = document.getElementById('breadcrumbRoot');
    if (root) { root.textContent = an; root.onclick = () => goNav('dashboard'); }
    // Destroy EditorJS instances when leaving editor
    if (view !== 'editor') destroyAllEditors();
    // Hide TOC on non-editor views
    if (view !== 'editor' && typeof hideTOC === 'function') hideTOC();
    if (view === 'dashboard') renderDashboard();
    else if (view === 'editor') { if (CUR) loadEditor(CUR); else renderProposals(); }
    else if (view === 'clients') renderClients();
    else if (view === 'settings') renderSettings();
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
            const persistentModals = ['newModal'];
            for (const modalId of persistentModals) {
                const modal = document.getElementById(modalId);
                if (modal && modal.classList.contains('show')) { modal.classList.remove('show'); return; }
            }
            // What's New modal — must save seen state before removing
            const wnModal = document.getElementById('whatsNewModal');
            if (wnModal) { if (typeof dismissWhatsNew === 'function') dismissWhatsNew(); else wnModal.remove(); return; }
            // Dynamic modals (remove from DOM)
            const dynamicModals = ['feedbackModal', 'shortcutsModal', 'completenessModal', 'clientModal', 'cpModal', 'libModal', 'tcModal', 'tplModal', 'emailTplModal', 'shareModal', 'dupClientModal', 'confirmModal', 'csvModal'];
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

// ── Send Feedback modal ──
function openFeedbackModal() {
    const existing = document.getElementById('feedbackModal');
    if (existing) existing.remove();
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'feedbackModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    wrap.innerHTML = `<div class="modal" style="max-width:440px" onclick="event.stopPropagation()">
        <div class="modal-t">Send Feedback</div>
        <div class="modal-d" style="margin-bottom:12px">Report a bug, suggest a feature, or share your thoughts.</div>
        <div style="display:flex;gap:8px;margin-bottom:16px">
            <button class="btn-sm-outline fb-type-btn on" data-type="bug" onclick="selectFbType(this)"><i data-lucide="bug"></i>Bug</button>
            <button class="btn-sm-outline fb-type-btn" data-type="feature" onclick="selectFbType(this)"><i data-lucide="lightbulb"></i>Feature</button>
            <button class="btn-sm-outline fb-type-btn" data-type="other" onclick="selectFbType(this)"><i data-lucide="message-circle"></i>Other</button>
        </div>
        <textarea id="fbText" rows="4" placeholder="Describe the issue or suggestion..." style="width:100%;resize:vertical"></textarea>
        <div class="modal-foot" style="margin-top:16px">
            <button class="btn-sm-ghost" onclick="document.getElementById('feedbackModal').remove()">Cancel</button>
            <button class="btn-sm" onclick="submitFeedback()">Send Feedback</button>
        </div>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
    document.getElementById('fbText')?.focus();
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
    // Store locally (future: send to API)
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
        <button class="side-user-menu-item" onclick="toggleTheme();document.querySelector('.side-user-menu')?.remove()"><i data-lucide="sun" class="theme-icon-light"></i><i data-lucide="moon" class="theme-icon-dark"></i>Theme</button>
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
