// ════════════════════════════════════════
// COMMAND PALETTE — ⌘K
// ════════════════════════════════════════

function openCommandPalette() {
    // Remove existing
    const existing = document.getElementById('cmdDialog');
    if (existing) { existing.close(); existing.remove(); }

    const dialog = document.createElement('dialog');
    dialog.id = 'cmdDialog';
    dialog.className = 'command-dialog';
    dialog.setAttribute('aria-label', 'Command menu');
    dialog.onclick = (e) => { if (e.target === dialog) closeCommandPalette(); };

    dialog.innerHTML = `
        <div class="command" style="max-width:520px;width:100%">
            <header>
                <i data-lucide="search" style="width:16px;height:16px;color:var(--text4);flex-shrink:0"></i>
                <input type="text" id="cmdInput" placeholder="Search proposals, actions..."
                    autocomplete="off" autocorrect="off" spellcheck="false"
                    aria-autocomplete="list" role="combobox"
                    aria-expanded="true" aria-controls="cmdMenu">
            </header>
            <div role="menu" id="cmdMenu" aria-orientation="vertical"
                data-empty="No results found." class="scrollbar">
                ${buildCommandItems()}
            </div>
        </div>`;

    document.body.appendChild(dialog);
    dialog.showModal();
    lucide.createIcons({ nameAttr: 'data-lucide' });

    const input = document.getElementById('cmdInput');
    input.focus();
    input.addEventListener('input', onCommandSearch);
    input.addEventListener('keydown', onCommandKeydown);
}

function closeCommandPalette() {
    const dialog = document.getElementById('cmdDialog');
    if (dialog) { dialog.close(); dialog.remove(); }
}

function buildCommandItems() {
    let html = '';

    // Quick Actions group
    html += `<div role="group" aria-labelledby="cmd-actions">
        <span role="heading" id="cmd-actions">Quick Actions</span>
        <div role="menuitem" data-filter="New proposal create" data-keywords="add blank" onclick="cmdRun(()=>openNewModal())">
            <i data-lucide="plus"></i>
            <span>New Proposal</span>
            <kbd class="kbd ml-auto">⌘</kbd><kbd class="kbd">N</kbd>
        </div>
        <div role="menuitem" data-filter="Preview proposal view" onclick="cmdRun(()=>{if(CUR)openPreview();else toast('Open a proposal first')})">
            <i data-lucide="eye"></i>
            <span>Preview</span>
            <kbd class="kbd ml-auto">⌘</kbd><kbd class="kbd">P</kbd>
        </div>
        <div role="menuitem" data-filter="Export PDF download" onclick="cmdRun(()=>{if(CUR)doExport('proposal');else toast('Open a proposal first')})">
            <i data-lucide="download"></i>
            <span>Export PDF</span>
            <kbd class="kbd ml-auto">⌘</kbd><kbd class="kbd">E</kbd>
        </div>
        <div role="menuitem" data-filter="Save force" onclick="cmdRun(()=>{if(CUR){dirty();toast('Saved')}})">
            <i data-lucide="save"></i>
            <span>Force Save</span>
            <kbd class="kbd ml-auto">⌘</kbd><kbd class="kbd">S</kbd>
        </div>
        <div role="menuitem" data-filter="Focus mode distraction free zen" data-keywords="focus distraction" onclick="cmdRun(()=>{if(typeof toggleFocusMode==='function')toggleFocusMode()})">
            <i data-lucide="maximize-2"></i>
            <span>${focusMode ? 'Exit Focus Mode' : 'Focus Mode'}</span>
            <kbd class="kbd ml-auto">⌘</kbd><kbd class="kbd">.</kbd>
        </div>
        <div role="menuitem" data-filter="Save as template reuse" data-keywords="template bookmark" onclick="cmdRun(()=>{if(CUR)saveAsTemplate();else toast('Open a proposal first')})">
            <i data-lucide="bookmark-plus"></i>
            <span>Save as Template</span>
        </div>
        <div role="menuitem" data-filter="Export Markdown md" data-keywords="markdown export" onclick="cmdRun(()=>{if(CUR&&typeof exportMarkdown==='function')exportMarkdown();else toast('Open a proposal first')})">
            <i data-lucide="file-text"></i>
            <span>Export Markdown</span>
        </div>
        <div role="menuitem" data-filter="Export CSV spreadsheet" data-keywords="csv export items" onclick="cmdRun(()=>{if(CUR&&typeof exportCsv==='function')exportCsv();else toast('Open a proposal first')})">
            <i data-lucide="table"></i>
            <span>Export CSV</span>
        </div>
        <div role="menuitem" data-filter="Export HTML standalone" data-keywords="html export" onclick="cmdRun(()=>{if(CUR&&typeof exportStandaloneHtml==='function')exportStandaloneHtml();else toast('Open a proposal first')})">
            <i data-lucide="code"></i>
            <span>Export HTML</span>
        </div>
        <div role="menuitem" data-filter="Compare versions diff history" data-keywords="compare diff versions" onclick="cmdRun(()=>{if(CUR&&typeof openDiffView==='function')openDiffView();else toast('Open a proposal first')})">
            <i data-lucide="git-compare"></i>
            <span>Compare Versions</span>
        </div>
    </div>`;

    // Navigation group
    html += `<hr role="separator">
    <div role="group" aria-labelledby="cmd-nav">
        <span role="heading" id="cmd-nav">Navigation</span>
        <div role="menuitem" data-filter="Dashboard home overview" onclick="cmdRun(()=>goNav('dashboard'))">
            <i data-lucide="layout-dashboard"></i>
            <span>Dashboard</span>
        </div>
        <div role="menuitem" data-filter="Clients contacts customers" onclick="cmdRun(()=>goNav('clients'))">
            <i data-lucide="users"></i>
            <span>Clients</span>
        </div>
        <div role="menuitem" data-filter="Settings preferences config" onclick="cmdRun(()=>goNav('settings'))">
            <i data-lucide="settings"></i>
            <span>Settings</span>
        </div>
        <div role="menuitem" data-filter="Keyboard shortcuts help" onclick="cmdRun(()=>{closeCommandPalette();openShortcutsPanel()})">
            <i data-lucide="keyboard"></i>
            <span>Keyboard Shortcuts</span>
            <kbd class="kbd ml-auto">?</kbd>
        </div>
    </div>`;

    // Proposals group (recent ones)
    const recent = [...DB].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)).slice(0, 8);
    if (recent.length) {
        html += `<hr role="separator">
        <div role="group" aria-labelledby="cmd-proposals">
            <span role="heading" id="cmd-proposals">Recent Proposals</span>`;
        recent.forEach(p => {
            const statusIcon = p.status === 'accepted' ? 'check-circle' : p.status === 'sent' ? 'send' : p.status === 'declined' ? 'x-circle' : 'file-text';
            const val = (p.lineItems || []).reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);
            html += `<div role="menuitem" data-filter="${esc(p.title)} ${esc(p.client?.name || '')} ${esc(p.number || '')}" data-keywords="${p.status}" onclick="cmdRun(()=>loadEditor('${escAttr(p.id)}'))">
                <i data-lucide="${statusIcon}"></i>
                <span>${esc(p.title || 'Untitled')}</span>
                <span style="margin-left:auto;font-size:11px;color:var(--text4);font-family:var(--mono)">${fmtCur(val, p.currency)}</span>
            </div>`;
        });
        html += '</div>';
    }

    return html;
}

function cmdRun(fn) {
    closeCommandPalette();
    fn();
}

function onCommandSearch(e) {
    const q = e.target.value.trim().toLowerCase();
    const menu = document.getElementById('cmdMenu');
    if (!menu) return;
    const items = menu.querySelectorAll('[role="menuitem"]');
    const groups = menu.querySelectorAll('[role="group"]');
    const seps = menu.querySelectorAll('[role="separator"]');
    let anyVisible = false;

    items.forEach(item => {
        if (!q) { item.hidden = false; anyVisible = true; return; }
        const filter = (item.dataset.filter || item.textContent).toLowerCase();
        const keywords = (item.dataset.keywords || '').toLowerCase();
        const match = filter.includes(q) || keywords.includes(q);
        item.hidden = !match;
        if (match) anyVisible = true;
    });

    // Hide empty groups
    groups.forEach(g => {
        const vis = g.querySelectorAll('[role="menuitem"]:not([hidden])');
        const heading = g.querySelector('[role="heading"]');
        if (heading) heading.hidden = vis.length === 0;
        g.hidden = vis.length === 0;
    });

    // Hide separators when filtering
    seps.forEach(s => { s.hidden = !!q; });

    // Show/hide empty state
    let emptyEl = menu.querySelector('[data-empty-msg]');
    if (!anyVisible && q) {
        if (!emptyEl) {
            emptyEl = document.createElement('div');
            emptyEl.setAttribute('data-empty-msg', '');
            emptyEl.textContent = 'No results found.';
            emptyEl.style.cssText = 'font-size:13px;color:var(--text4);text-align:center;padding:24px 16px';
            menu.appendChild(emptyEl);
        }
        emptyEl.hidden = false;
    } else if (emptyEl) {
        emptyEl.hidden = true;
    }
}

function onCommandKeydown(e) {
    if (e.key === 'Escape') {
        e.preventDefault();
        closeCommandPalette();
        return;
    }

    const menu = document.getElementById('cmdMenu');
    if (!menu) return;
    const items = [...menu.querySelectorAll('[role="menuitem"]:not([hidden])')];
    if (!items.length) return;

    const active = menu.querySelector('[role="menuitem"][data-active]');
    let idx = active ? items.indexOf(active) : -1;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (active) active.removeAttribute('data-active');
        idx = (idx + 1) % items.length;
        items[idx].setAttribute('data-active', '');
        items[idx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (active) active.removeAttribute('data-active');
        idx = idx <= 0 ? items.length - 1 : idx - 1;
        items[idx].setAttribute('data-active', '');
        items[idx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && active) {
        e.preventDefault();
        active.click();
    }
}
