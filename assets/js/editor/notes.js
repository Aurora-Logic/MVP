// ════════════════════════════════════════
// NOTES TAB
// ════════════════════════════════════════

/* exported addNote, deleteNote */
function renderNotes(p) {
    const notes = p.notes || [];
    let html = `<div class="card card-p">
    <div class="card-head"><div><div class="card-t">Internal notes</div><div class="card-d">Only visible to you — not included in PDF</div></div></div>
    <div style="display:flex;gap:8px;margin-bottom:14px">
      <input type="text" id="noteInput" placeholder="Add a note..." style="flex:1" onkeydown="if(event.key==='Enter')addNote()">
      <button class="btn-sm-outline" onclick="addNote()"><i data-lucide="plus"></i> Add</button>
    </div>
    <div id="notesList">`;
    if (!notes.length) html += '<div class="empty empty-sm"><div class="empty-icon"><i data-lucide="sticky-note"></i></div><div class="empty-t">No notes yet</div><div class="empty-d">Keep internal notes about this proposal. Track progress, reminders, or client preferences.</div></div>';
    else notes.slice().reverse().forEach((n, revIdx) => {
        const realIdx = notes.length - 1 - revIdx;
        const icon = n.type === 'system' ? '\u26A1' : (CONFIG?.name || 'U').charAt(0).toUpperCase();
        html += `<div class="note-item">
            <div class="note-avi">${icon}</div>
            <div class="note-body">
                <div class="note-meta">${n.type === 'system' ? 'System' : (CONFIG?.name || 'You')} \u00B7 ${timeAgo(n.time)}</div>
                <div class="note-text">${esc(n.text)}</div>
            </div>
            <div class="note-actions">
                <button class="note-del" onclick="deleteNote(${realIdx})" data-tooltip="Delete note" data-side="bottom" data-align="center"><i data-lucide="trash-2"></i></button>
            </div>
        </div>`;
    });
    html += '</div></div>';
    document.getElementById('edNotes').innerHTML = html;
    lucide.createIcons();
}

function addNote() {
    const inp = document.getElementById('noteInput');
    const text = inp.value.trim();
    if (!text) return;
    const p = cur(); if (!p) return;
    p.notes = p.notes || [];
    p.notes.push({ text, time: Date.now(), type: 'user' });
    persist();
    inp.value = '';
    renderNotes(p);
}

function deleteNote(idx) {
    confirmDialog('Delete this note?', () => {
        const p = cur(); if (!p) return;
        p.notes.splice(idx, 1);
        persist();
        renderNotes(p);
    }, { title: 'Delete Note', confirmText: 'Delete' });
}
