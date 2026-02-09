// ════════════════════════════════════════
// KEYBOARD SHORTCUTS PANEL (Phase 1.3)
// ════════════════════════════════════════

function openShortcutsPanel() {
    // Remove existing
    document.getElementById('shortcutsModal')?.remove();

    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.id = 'shortcutsModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };

    wrap.innerHTML = `
        <div class="modal" style="max-width:520px" onclick="event.stopPropagation()">
            <div class="modal-t" style="display:flex;align-items:center;gap:8px">
                <i data-lucide="keyboard" style="width:20px;height:20px"></i>
                Keyboard Shortcuts
            </div>
            <div class="modal-d">Press <kbd class="kbd">?</kbd> to toggle this panel</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:16px">
                <div>
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text4);margin-bottom:8px">Navigation</div>
                    <div class="sc-list">
                        ${shortcutRow('⌘ K', 'Command palette')}
                        ${shortcutRow('⌘ N', 'New proposal')}
                        ${shortcutRow('Esc', 'Close panel / modal')}
                    </div>
                </div>
                <div>
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text4);margin-bottom:8px">Editor</div>
                    <div class="sc-list">
                        ${shortcutRow('⌘ Z', 'Undo')}
                        ${shortcutRow('⌘ ⇧ Z', 'Redo')}
                        ${shortcutRow('⌘ S', 'Force save')}
                        ${shortcutRow('⌘ .', 'Focus mode')}
                    </div>
                </div>
                <div>
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text4);margin-bottom:8px">Actions</div>
                    <div class="sc-list">
                        ${shortcutRow('⌘ P', 'Preview')}
                        ${shortcutRow('⌘ E', 'Export PDF')}
                        ${shortcutRow('?', 'Shortcuts')}
                    </div>
                </div>
                <div>
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text4);margin-bottom:8px">Dashboard</div>
                    <div class="sc-list">
                        ${shortcutRow('1-5', 'Filter by status')}
                        ${shortcutRow('/', 'Focus search')}
                    </div>
                </div>
            </div>
            <div class="modal-foot" style="margin-top:16px">
                <button class="btn-sm-outline" onclick="document.getElementById('shortcutsModal').remove()">Close</button>
            </div>
        </div>`;

    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

function shortcutRow(key, desc) {
    const keys = key.split(' ').map(k => `<kbd class="kbd">${k}</kbd>`).join(' ');
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px">
        <span style="color:var(--text3)">${esc(desc)}</span>
        <span class="inline-flex items-center gap-1">${keys}</span>
    </div>`;
}
