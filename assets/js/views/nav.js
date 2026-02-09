// ════════════════════════════════════════
// NAVIGATION + MOBILE + KEYBOARD
// ════════════════════════════════════════

function goNav(view) {
    closeMobileSidebar();
    const titles = { dashboard: 'Dashboard', proposals: 'Proposals', clients: 'Clients', analytics: 'Analytics', settings: 'Settings' };
    document.title = (titles[view] || 'ProposalKit') + ' — ProposalKit';
    const topSearch = document.getElementById('topSearch');
    if (topSearch) topSearch.style.display = (view === 'analytics' || view === 'settings') ? 'none' : '';
    document.querySelectorAll('[data-nav]').forEach(b => b.classList.remove('on'));
    const btn = document.querySelector(`[data-nav="${view}"]`);
    if (btn) btn.classList.add('on');
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

// Collapsible sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    safeLsSet('pk_sidebarCollapsed', sidebar.classList.contains('collapsed') ? 'true' : 'false');
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
            // Dynamic modals (remove from DOM)
            const dynamicModals = ['shortcutsModal', 'completenessModal', 'clientModal', 'cpModal', 'libModal', 'tcModal', 'tplModal', 'emailTplModal', 'shareModal', 'dupClientModal', 'confirmModal', 'csvModal'];
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
    });
}
