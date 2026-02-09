// ════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════

function renderSettings() {
    CUR = null;
    document.getElementById('topTitle').textContent = 'Settings';
    document.getElementById('topRight').innerHTML = '';
    const body = document.getElementById('bodyScroll');
    body.innerHTML = `
    <div class="settings-grid">
      <div class="settings-col">
        <div class="card card-p" style="margin-bottom:14px">
          <div class="card-head"><div><div class="card-t">Organization Details</div><div class="card-d">Auto-filled into every new proposal</div></div></div>
          <div class="fg"><label class="fl">Company Name</label><input type="text" id="setCo" value="${esc(CONFIG?.company)}" oninput="saveSettings()"></div>
          <div class="fr">
            <div class="fg"><label class="fl">Your Name</label><input type="text" id="setName" value="${esc(CONFIG?.name)}" oninput="saveSettings()"></div>
            <div class="fg"><label class="fl">Email</label><input type="email" id="setEmail" value="${esc(CONFIG?.email)}" oninput="saveSettings()"></div>
          </div>
          <div class="fr">
            <div class="fg"><label class="fl">Phone</label><input type="tel" id="setPhone" value="${esc(CONFIG?.phone)}" oninput="saveSettings()"></div>
            <div class="fg"><label class="fl">Country</label>
              <select id="setCountry" onchange="saveSettings()">
                <option value="">Select country</option>
                <option value="IN" ${CONFIG?.country==='IN'?'selected':''}>India</option>
                <option value="US" ${CONFIG?.country==='US'?'selected':''}>United States</option>
                <option value="GB" ${CONFIG?.country==='GB'?'selected':''}>United Kingdom</option>
                <option value="CA" ${CONFIG?.country==='CA'?'selected':''}>Canada</option>
                <option value="AU" ${CONFIG?.country==='AU'?'selected':''}>Australia</option>
                <option value="DE" ${CONFIG?.country==='DE'?'selected':''}>Germany</option>
                <option value="FR" ${CONFIG?.country==='FR'?'selected':''}>France</option>
                <option value="SG" ${CONFIG?.country==='SG'?'selected':''}>Singapore</option>
                <option value="AE" ${CONFIG?.country==='AE'?'selected':''}>UAE</option>
                <option value="JP" ${CONFIG?.country==='JP'?'selected':''}>Japan</option>
                <option value="NL" ${CONFIG?.country==='NL'?'selected':''}>Netherlands</option>
                <option value="SE" ${CONFIG?.country==='SE'?'selected':''}>Sweden</option>
                <option value="CH" ${CONFIG?.country==='CH'?'selected':''}>Switzerland</option>
                <option value="NZ" ${CONFIG?.country==='NZ'?'selected':''}>New Zealand</option>
                <option value="IE" ${CONFIG?.country==='IE'?'selected':''}>Ireland</option>
                <option value="OTHER" ${CONFIG?.country==='OTHER'?'selected':''}>Other</option>
              </select>
            </div>
          </div>
          <div class="fg"><label class="fl">Address</label><input type="text" id="setAddr" value="${esc(CONFIG?.address)}" oninput="saveSettings()"></div>
          <div class="fr">
            <div class="fg"><label class="fl">GST / Tax ID</label><input type="text" id="setTaxId" value="${esc(CONFIG?.taxId)}" oninput="saveSettings()"><div class="fh">GSTIN, VAT, EIN, ABN, etc.</div></div>
            <div class="fg"><label class="fl">Website</label><input type="url" id="setWebsite" value="${esc(CONFIG?.website)}" oninput="saveSettings()"></div>
          </div>
        </div>
        <div class="card card-p" style="margin-bottom:14px">
          <div class="card-head">
            <div><div class="card-t">Email Templates</div><div class="card-d">Quick emails for sending proposals</div></div>
            <button class="btn-sm-outline" onclick="addEmailTemplate()"><i data-lucide="plus"></i> Add</button>
          </div>
          <div id="emailTplList"></div>
        </div>
      </div>
      <div class="settings-col">
        <div class="card card-p" style="margin-bottom:14px">
          <div class="card-head"><div><div class="card-t">Branding</div><div class="card-d">Logo and colors for your proposals</div></div></div>
          <div class="fg">
            <label class="fl">Logo</label>
            <div class="brand-logo-box" onclick="document.getElementById('setLogoInput').click()" id="setLogoBox">
              ${CONFIG?.logo ? '<img src="' + CONFIG.logo + '">' : '<i data-lucide="image-plus"></i>'}
            </div>
            <input type="file" id="setLogoInput" accept="image/*" style="display:none" onchange="handleLogo(this);saveSettings()">
            <div class="fh">PNG, JPG, or SVG</div>
          </div>
          <div class="fg">
            <label class="fl">Brand Color</label>
            <div class="color-row" id="setColors"></div>
          </div>
        </div>
        <div class="card card-p" style="margin-bottom:14px">
          <div class="card-head"><div><div class="card-t">Your Signature</div><div class="card-d">Draw your signature to include in proposals</div></div></div>
          <div class="sig-wrap" id="sigWrap">
            <div id="sigDisplay"></div>
          </div>
        </div>
        <div class="card card-p">
          <div class="card-head"><div><div class="card-t">Data Management</div><div class="card-d">Export or clear your local data</div></div></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn-sm-outline" onclick="exportData()"><i data-lucide="download"></i> Export All Data</button>
            <button class="btn-sm-destructive" onclick="confirmDialog('Delete all proposals? This cannot be undone.',()=>{DB=[];persist();renderDashboard();toast('All data cleared');},{title:'Clear All Data',confirmText:'Delete All'})"><i data-lucide="trash-2"></i> Clear All Data</button>
          </div>
        </div>
      </div>
    </div>
  `;
    renderColorSwatches('setColors', CONFIG?.color);
    document.querySelectorAll('#setColors .color-swatch').forEach(s => {
        const orig = s.onclick;
        s.onclick = () => { orig(); saveSettings(); };
    });
    initSignaturePad();
    renderEmailTemplates();
    lucide.createIcons();
}

// Email Templates
const DEFAULT_TEMPLATES = [
    { id: 'intro', name: 'Introduction', subject: 'Proposal: {{proposal.title}}', body: 'Hi {{client.name}},\n\nPlease find attached our proposal for {{proposal.title}}.\n\nWe look forward to discussing this with you.\n\nBest regards,\n{{sender.name}}' },
    { id: 'followup', name: 'Follow-up', subject: 'Following up: {{proposal.title}}', body: 'Hi {{client.name}},\n\nI wanted to follow up on the proposal I sent for {{proposal.title}}.\n\nDo you have any questions I can help answer?\n\nBest,\n{{sender.name}}' },
    { id: 'thanks', name: 'Thank You', subject: 'Thank you for accepting our proposal', body: 'Hi {{client.name}},\n\nThank you for accepting our proposal for {{proposal.title}}!\n\nWe are excited to get started and will be in touch shortly with next steps.\n\nBest regards,\n{{sender.name}}' }
];

function getEmailTemplates() {
    const saved = JSON.parse(localStorage.getItem('pk_email_tpl') || '[]');
    return [...DEFAULT_TEMPLATES.map(t => ({ ...t, isDefault: true })), ...saved];
}

function renderEmailTemplates() {
    const list = document.getElementById('emailTplList');
    if (!list) return;
    const templates = getEmailTemplates();
    if (!templates.length) {
        list.innerHTML = '<div class="tpl-empty">No email templates. Add one to get started.</div>';
        return;
    }
    list.innerHTML = templates.map((t, i) => `
        <div class="tpl-item">
            <div>
                <div class="tpl-name">${esc(t.name)} ${t.isDefault ? '<span style="font-size:10px;color:var(--text4)">(Default)</span>' : ''}</div>
                <div class="tpl-subject">Subject: ${esc(t.subject)}</div>
            </div>
            <div class="tpl-actions">
                <button class="btn-sm-icon-ghost" onclick="editEmailTemplate('${t.id}')" data-tooltip="Edit" data-side="bottom" data-align="center"><i data-lucide="edit-3"></i></button>
                ${!t.isDefault ? `<button class="btn-sm-icon-ghost" onclick="deleteEmailTemplate('${t.id}')" data-tooltip="Delete" data-side="bottom" data-align="center"><i data-lucide="trash-2"></i></button>` : ''}
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function addEmailTemplate() { showTemplateModal(); }

function editEmailTemplate(id) {
    const templates = getEmailTemplates();
    const tpl = templates.find(t => t.id === id);
    if (tpl) showTemplateModal(tpl);
}

function deleteEmailTemplate(id) {
    confirmDialog('Delete this template?', () => {
        let saved = JSON.parse(localStorage.getItem('pk_email_tpl') || '[]');
        saved = saved.filter(t => t.id !== id);
        localStorage.setItem('pk_email_tpl', JSON.stringify(saved));
        renderEmailTemplates();
        toast('Template deleted');
    }, { title: 'Delete Template', confirmText: 'Delete' });
}

function showTemplateModal(tpl = null) {
    const isEdit = !!tpl;
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap show';
    wrap.id = 'tplModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    wrap.innerHTML = `
        <div class="modal" onclick="event.stopPropagation()">
            <div class="modal-t">${isEdit ? 'Edit' : 'New'} Email Template</div>
            <div class="modal-d">Use {{client.name}}, {{proposal.title}}, {{sender.name}} as variables</div>
            <div class="fg" style="margin-top:12px"><label class="fl">Name</label><input type="text" id="tplName" value="${esc(tpl?.name || '')}"></div>
            <div class="fg"><label class="fl">Subject</label><input type="text" id="tplSubject" value="${esc(tpl?.subject || '')}"></div>
            <div class="fg"><label class="fl">Body</label><textarea id="tplBody" style="min-height:120px">${esc(tpl?.body || '')}</textarea></div>
            <div class="modal-foot">
                <button class="btn-sm-outline" onclick="document.getElementById('tplModal').remove()">Cancel</button>
                <button class="btn-sm" onclick="saveEmailTemplate(${tpl && !tpl.isDefault ? `'${tpl.id}'` : 'null'})">${isEdit && !tpl?.isDefault ? 'Save' : 'Save as New'}</button>
            </div>
        </div>`;
    document.body.appendChild(wrap);
}

function saveEmailTemplate(existingId) {
    const name = document.getElementById('tplName')?.value.trim();
    const subject = document.getElementById('tplSubject')?.value.trim();
    const body = document.getElementById('tplBody')?.value.trim();
    if (!name || !subject || !body) { toast('Please fill all fields'); return; }
    let saved = JSON.parse(localStorage.getItem('pk_email_tpl') || '[]');
    const id = existingId || 'tpl_' + Date.now();
    if (existingId) {
        const idx = saved.findIndex(t => t.id === existingId);
        if (idx >= 0) saved[idx] = { id, name, subject, body };
        else saved.push({ id, name, subject, body });
    } else {
        saved.push({ id, name, subject, body });
    }
    localStorage.setItem('pk_email_tpl', JSON.stringify(saved));
    document.getElementById('tplModal')?.remove();
    renderEmailTemplates();
    toast('Template saved');
}

function initSignaturePad() {
    const display = document.getElementById('sigDisplay');
    if (!display) return;

    const savedSig = CONFIG?.signature;
    if (savedSig) {
        display.innerHTML = `
            <img src="${savedSig}" class="sig-saved" alt="Your signature">
            <div class="sig-controls">
                <button class="btn-sm-ghost" onclick="editSignature()"><i data-lucide="edit-3"></i> Edit</button>
                <button class="btn-sm-destructive" onclick="clearSignature()"><i data-lucide="trash-2"></i> Clear</button>
            </div>`;
    } else {
        showSignatureCanvas();
    }
    lucide.createIcons();
}

function showSignatureCanvas() {
    const display = document.getElementById('sigDisplay');
    display.innerHTML = `
        <canvas id="sigCanvas" class="sig-canvas" width="400" height="150"></canvas>
        <div class="sig-controls">
            <button class="btn-sm-ghost" onclick="clearSigCanvas()"><i data-lucide="eraser"></i> Clear</button>
            <button class="btn-sm" onclick="saveSignature()"><i data-lucide="save"></i> Save</button>
        </div>
        <div class="sig-placeholder">Draw your signature above</div>`;
    lucide.createIcons();
    setupSigCanvas();
}

function setupSigCanvas() {
    const canvas = document.getElementById('sigCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let lastX = 0, lastY = 0;

    ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#fafafa' : '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        return { x, y };
    };

    const start = (e) => { drawing = true; const pos = getPos(e); lastX = pos.x; lastY = pos.y; };
    const draw = (e) => { if (!drawing) return; e.preventDefault(); const pos = getPos(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(pos.x, pos.y); ctx.stroke(); lastX = pos.x; lastY = pos.y; };
    const stop = () => { drawing = false; };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseleave', stop);
    canvas.addEventListener('touchstart', start);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stop);
}

function clearSigCanvas() {
    const canvas = document.getElementById('sigCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function saveSignature() {
    const canvas = document.getElementById('sigCanvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    CONFIG.signature = dataUrl;
    saveConfig();
    initSignaturePad();
    toast('Signature saved');
}

function editSignature() { showSignatureCanvas(); }

function clearSignature() {
    confirmDialog('Remove your saved signature?', () => {
        CONFIG.signature = null;
        saveConfig();
        showSignatureCanvas();
        toast('Signature cleared');
    }, { title: 'Clear Signature', confirmText: 'Remove' });
}

function saveSettings() {
    const getVal = (id, fallback) => { const el = document.getElementById(id); return el ? el.value : fallback; };
    CONFIG.company = getVal('setCo', CONFIG.company);
    CONFIG.name = getVal('setName', CONFIG.name);
    CONFIG.email = getVal('setEmail', CONFIG.email);
    CONFIG.phone = getVal('setPhone', CONFIG.phone);
    CONFIG.country = getVal('setCountry', CONFIG.country);
    CONFIG.address = getVal('setAddr', CONFIG.address);
    CONFIG.taxId = getVal('setTaxId', CONFIG.taxId);
    CONFIG.website = getVal('setWebsite', CONFIG.website);
    const sel = document.querySelector('#setColors .color-swatch.on');
    if (sel) CONFIG.color = sel.style.background;
    saveConfig();
}

function exportData() {
    const data = {
        config: CONFIG,
        proposals: DB,
        clients: CLIENTS,
        sectionLibrary: JSON.parse(localStorage.getItem('pk_seclib') || '[]'),
        tcLibrary: JSON.parse(localStorage.getItem('pk_tclib') || '[]'),
        emailTemplates: JSON.parse(localStorage.getItem('pk_email_tpl') || '[]')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'proposalkit-export.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Data exported');
}
