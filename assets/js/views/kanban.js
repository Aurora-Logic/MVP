// ════════════════════════════════════════
// KANBAN BOARD VIEW
// ════════════════════════════════════════

function setViewMode(mode) {
    viewMode = mode;
    safeLsSet('pk_viewMode', mode);
    renderProposals();
}

function renderKanban() {
    const wrap = document.getElementById('propListWrap');
    if (!wrap) return;

    const cols = [
        { status: 'draft', label: 'Draft', icon: 'file-text', color: 'var(--text3)', bg: 'var(--muted)' },
        { status: 'sent', label: 'Sent', icon: 'send', color: 'var(--blue)', bg: 'var(--blue-bg)' },
        { status: 'accepted', label: 'Won', icon: 'check-circle', color: 'var(--green)', bg: 'var(--green-bg)' }
    ];

    const active = activeDB();
    const html = `<div class="kanban-board">${cols.map(col => {
        const items = active.filter(p => p.status === col.status);
        const colValue = items.reduce((a, p) => a + (p.lineItems || []).reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0), 0);
        return `<div class="kanban-col" data-status="${col.status}">
            <div class="kanban-col-head">
                <div class="kanban-col-title"><i data-lucide="${col.icon}" style="width:14px;height:14px;color:${col.color}"></i> ${col.label} <span class="kanban-count">${items.length}</span></div>
                <div class="kanban-col-val">${fmtCur(colValue, defaultCurrency())}</div>
            </div>
            <div class="kanban-col-body" data-status="${col.status}">
                ${items.map(p => kanbanCard(p)).join('')}
                ${!items.length ? '<div class="kanban-empty">No proposals</div>' : ''}
            </div>
        </div>`;
    }).join('')}</div>`;

    wrap.innerHTML = html;
    lucide.createIcons();
    initKanbanDrag();
}

function kanbanCard(p) {
    const val = (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0);
    const ts = p.updatedAt || p.createdAt;
    return `<div class="kanban-card" draggable="true" data-id="${escAttr(p.id)}" onclick="loadEditor('${escAttr(p.id)}')">
        <div class="kanban-card-title">${esc(p.title || 'Untitled')}</div>
        <div class="kanban-card-meta">
            ${p.client?.name ? '<span>' + esc(p.client.name) + '</span>' : ''}
            ${val ? '<span class="mono">' + fmtCur(val, p.currency) + '</span>' : ''}
        </div>
        <div class="kanban-card-time">${ts ? timeAgo(ts) : ''}</div>
    </div>`;
}

function initKanbanDrag() {
    let dragCard = null;
    document.querySelectorAll('.kanban-card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
            dragCard = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.dataset.id);
        });
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            document.querySelectorAll('.kanban-col-body').forEach(c => c.classList.remove('kanban-drop-target'));
        });
    });

    document.querySelectorAll('.kanban-col-body').forEach(col => {
        col.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!dragCard) return;
            col.classList.add('kanban-drop-target');
        });
        col.addEventListener('dragleave', () => {
            col.classList.remove('kanban-drop-target');
        });
        col.addEventListener('drop', (e) => {
            e.preventDefault();
            col.classList.remove('kanban-drop-target');
            if (!dragCard) return;
            const id = dragCard.dataset.id;
            const newStatus = col.dataset.status;
            const p = DB.find(x => x.id === id);
            if (p && p.status !== newStatus) {
                p.status = newStatus;
                persist();
                renderKanban();
                toast(`Moved to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
            }
            dragCard = null;
        });
    });
}
