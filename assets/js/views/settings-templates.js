// ════════════════════════════════════════
// SETTINGS — Email Templates
// ════════════════════════════════════════

/* exported addEmailTemplate, editEmailTemplate, deleteEmailTemplate, saveEmailTemplate, getEmailTemplates */
const DEFAULT_TEMPLATES = [
    { id: 'intro', name: 'Introduction', subject: 'Proposal: {{proposal.title}}', body: 'Hi {{client.name}},\n\nPlease find attached our proposal for {{proposal.title}}.\n\nWe look forward to discussing this with you.\n\nBest regards,\n{{sender.name}}' },
    { id: 'followup', name: 'Follow-up', subject: 'Following up: {{proposal.title}}', body: 'Hi {{client.name}},\n\nI wanted to follow up on the proposal I sent for {{proposal.title}}.\n\nDo you have any questions I can help answer?\n\nBest,\n{{sender.name}}' },
    { id: 'thanks', name: 'Thank You', subject: 'Thank you for accepting our proposal', body: 'Hi {{client.name}},\n\nThank you for accepting our proposal for {{proposal.title}}!\n\nWe are excited to get started and will be in touch shortly with next steps.\n\nBest regards,\n{{sender.name}}' }
];

function getEmailTemplates() {
    const saved = safeGetStorage('pk_email_tpl', []);
    return [...DEFAULT_TEMPLATES.map(t => ({ ...t, isDefault: true })), ...saved];
}

function renderEmailTemplates() {
    const list = document.getElementById('emailTplList');
    if (!list) return;
    const templates = getEmailTemplates();
    if (!templates.length) { list.innerHTML = '<div class="tpl-empty">No email templates. Add one to get started.</div>'; return; }
    list.innerHTML = templates.map(t => `
        <div class="tpl-item">
            <div>
                <div class="tpl-name">${esc(t.name)} ${t.isDefault ? '<span class="tpl-badge">(Default)</span>' : ''}</div>
                <div class="tpl-subject">Subject: ${esc(t.subject)}</div>
            </div>
            <div class="tpl-actions">
                <button class="btn-sm-icon-ghost" onclick="editEmailTemplate('${escAttr(t.id)}')" data-tooltip="Edit" data-side="bottom" data-align="center"><i data-lucide="edit-3"></i></button>
                ${!t.isDefault ? `<button class="btn-sm-icon-ghost" onclick="deleteEmailTemplate('${escAttr(t.id)}')" data-tooltip="Delete" data-side="bottom" data-align="center"><i data-lucide="trash-2"></i></button>` : ''}
            </div>
        </div>`).join('');
    lucide.createIcons();
}

function addEmailTemplate() { showTemplateModal(); }

function editEmailTemplate(id) {
    const tpl = getEmailTemplates().find(t => t.id === id);
    if (tpl) showTemplateModal(tpl);
}

function deleteEmailTemplate(id) {
    confirmDialog('Delete this template?', () => {
        let saved = safeGetStorage('pk_email_tpl', []);
        saved = saved.filter(t => t.id !== id);
        safeLsSet('pk_email_tpl', saved);
        renderEmailTemplates();
        toast('Template deleted');
    }, { title: 'Delete Template', confirmText: 'Delete' });
}

function showTemplateModal(tpl = null) {
    const isEdit = !!tpl;
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'tplModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    wrap.innerHTML = `
        <div class="modal" onclick="event.stopPropagation()">
            <div class="modal-t">${isEdit ? 'Edit' : 'New'} email template</div>
            <div class="modal-d">Use {{client.name}}, {{proposal.title}}, {{sender.name}} as variables</div>
            <div class="fg" style="margin-top:12px"><label class="fl">Name</label><input type="text" id="tplName" value="${esc(tpl?.name || '')}"></div>
            <div class="fg"><label class="fl">Subject</label><input type="text" id="tplSubject" value="${esc(tpl?.subject || '')}"></div>
            <div class="fg"><label class="fl">Body</label><textarea id="tplBody" style="min-height:120px">${esc(tpl?.body || '')}</textarea></div>
            <div class="modal-foot">
                <button class="btn-sm-outline" onclick="document.getElementById('tplModal').remove()">Cancel</button>
                <button class="btn-sm" onclick="saveEmailTemplate(${tpl && !tpl.isDefault ? `'${escAttr(tpl.id)}'` : 'null'})">${isEdit && !tpl?.isDefault ? 'Save' : 'Save as New'}</button>
            </div>
        </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
}

function saveEmailTemplate(existingId) {
    const name = document.getElementById('tplName')?.value.trim();
    const subject = document.getElementById('tplSubject')?.value.trim();
    const body = document.getElementById('tplBody')?.value.trim();
    if (!name || !subject || !body) { toast('Please fill all fields'); return; }
    const saved = safeGetStorage('pk_email_tpl', []);
    const id = existingId || 'tpl_' + Date.now();
    if (existingId) {
        const idx = saved.findIndex(t => t.id === existingId);
        if (idx >= 0) saved[idx] = { id, name, subject, body };
        else saved.push({ id, name, subject, body });
    } else {
        saved.push({ id, name, subject, body });
    }
    safeLsSet('pk_email_tpl', saved);
    document.getElementById('tplModal')?.remove();
    renderEmailTemplates();
    toast('Template saved');
}
