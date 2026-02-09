// ════════════════════════════════════════
// EMAIL
// ════════════════════════════════════════

function emailProposal(id) {
    const p = DB.find(x => x.id === id);
    if (!p) return;

    const templates = getEmailTemplates();

    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.id = 'emailTplModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };

    const tplOptions = templates.map(t =>
        `<div class="tpl-item" style="cursor:pointer" onclick="sendWithTemplate('${escAttr(t.id)}', '${escAttr(id)}')">
            <div>
                <div class="tpl-name">${esc(t.name)}</div>
                <div class="tpl-subject">${esc(t.subject)}</div>
            </div>
            <i data-lucide="chevron-right" style="width:16px;height:16px;color:var(--text4)"></i>
        </div>`
    ).join('');

    wrap.innerHTML = `
        <div class="modal modal-sm" onclick="event.stopPropagation()">
            <div class="modal-t">Send Proposal via Email</div>
            <div class="modal-d">Select an email template</div>
            <div style="max-height:300px;overflow-y:auto;margin-top:12px">${tplOptions}</div>
            <div class="modal-foot">
                <button class="btn-sm-outline" onclick="document.getElementById('emailTplModal').remove()">Cancel</button>
            </div>
        </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

function sendWithTemplate(tplId, propId) {
    const templates = getEmailTemplates();
    const tpl = templates.find(t => t.id === tplId);
    const p = DB.find(x => x.id === propId);
    if (!tpl || !p) return;

    const replace = (str) => str
        .replace(/\{\{client\.name\}\}/g, p.client?.name || 'there')
        .replace(/\{\{proposal\.title\}\}/g, p.title || 'Proposal')
        .replace(/\{\{sender\.name\}\}/g, p.sender?.company || CONFIG?.name || 'Your Company')
        .replace(/\{\{proposal\.number\}\}/g, p.number || '');

    const subject = encodeURIComponent(replace(tpl.subject));
    const body = encodeURIComponent(replace(tpl.body));

    document.getElementById('emailTplModal')?.remove();
    window.open(`mailto:${p.client?.email || ''}?subject=${subject}&body=${body}`, '_blank');
}
