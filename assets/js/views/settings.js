// ════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════

function getCountryTaxHtml() {
    const c = CONFIG?.country;
    if (c === 'IN') return `
        <div class="fg"><label class="fl">GSTIN</label><input type="text" id="setGstin" value="${esc(CONFIG?.gstin || '')}" oninput="saveSettings()" maxlength="15"><div class="fh">15-digit GST Identification Number</div></div>
        <div class="fr">
            <div class="fg"><label class="fl">PAN</label><input type="text" id="setPan" value="${esc(CONFIG?.pan || '')}" oninput="saveSettings()" maxlength="10"><div class="fh">Permanent Account Number</div></div>
            <div class="fg"><label class="fl">UDYAM Registration</label><input type="text" id="setUdyam" value="${esc(CONFIG?.udyam || '')}" oninput="saveSettings()"><div class="fh">MSME Registration Number</div></div>
        </div>`;
    if (c === 'US') return `
        <div class="fg"><label class="fl">EIN</label><input type="text" id="setEin" value="${esc(CONFIG?.ein || '')}" oninput="saveSettings()" maxlength="10"><div class="fh">Federal Employer Identification Number</div></div>`;
    if (['GB','DE','FR','NL','SE','IE'].includes(c)) return `
        <div class="fg"><label class="fl">VAT Number</label><input type="text" id="setVat" value="${esc(CONFIG?.vatNumber || '')}" oninput="saveSettings()"><div class="fh">Value Added Tax Registration</div></div>`;
    if (c === 'AU') return `
        <div class="fg"><label class="fl">ABN</label><input type="text" id="setAbn" value="${esc(CONFIG?.abn || '')}" oninput="saveSettings()" maxlength="14"><div class="fh">Australian Business Number</div></div>`;
    return `<div class="fg"><label class="fl">Tax / Registration ID</label><input type="text" id="setTaxId" value="${esc(CONFIG?.taxId || '')}" oninput="saveSettings()"></div>`;
}

function renderSettings() {
    CUR = null;
    document.getElementById('topTitle').textContent = 'Settings';
    document.getElementById('topRight').innerHTML = '';
    const b = CONFIG?.bank || {};
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
            <div class="fg"><label class="fl">Country</label><div id="setCountry"></div></div>
          </div>
          <div class="fg"><label class="fl">Address</label><input type="text" id="setAddr" value="${esc(CONFIG?.address)}" oninput="saveSettings()"></div>
          <div class="fg"><label class="fl">Website</label><input type="url" id="setWebsite" value="${esc(CONFIG?.website)}" oninput="saveSettings()"></div>
          <div id="setTaxFields">${getCountryTaxHtml()}</div>
        </div>
        <div class="card card-p" style="margin-bottom:14px">
          <div class="card-head"><div><div class="card-t">Bank / Payment Details</div><div class="card-d">Shown on proposals for client payments</div></div></div>
          <div class="fr">
            <div class="fg"><label class="fl">Bank Name</label><input type="text" id="setBankName" value="${esc(b.name)}" oninput="saveSettings()"></div>
            <div class="fg"><label class="fl">Account Holder</label><input type="text" id="setBankHolder" value="${esc(b.holder)}" oninput="saveSettings()"></div>
          </div>
          <div class="fg"><label class="fl">Account Number</label><input type="text" id="setBankAccount" value="${esc(b.account)}" oninput="saveSettings()"></div>
          <div class="fr">
            <div class="fg"><label class="fl">IFSC / Sort Code</label><input type="text" id="setBankIfsc" value="${esc(b.ifsc)}" oninput="saveSettings()"></div>
            <div class="fg"><label class="fl">SWIFT / BIC</label><input type="text" id="setBankSwift" value="${esc(b.swift)}" oninput="saveSettings()"></div>
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
              ${CONFIG?.logo ? '<img src="' + esc(CONFIG.logo) + '">' : '<i data-lucide="image-plus"></i>'}
            </div>
            <input type="file" id="setLogoInput" accept="image/*" style="display:none" onchange="handleLogo(this);saveSettings()">
            <div class="fh">PNG, JPG, or SVG</div>
          </div>
          <div class="fg"><div class="color-row" id="setColors"></div></div>
          <div class="fg"><label class="fl">Font Family</label><div id="setFont"></div></div>
          <div class="fg" style="margin-top:8px;padding-top:12px;border-top:1px solid var(--border)">
            <label class="fl">White Label</label>
            <label class="toggle-row">
              <input type="checkbox" id="setWhiteLabel" ${CONFIG?.whiteLabel ? 'checked' : ''} onchange="saveSettings();applyWhiteLabel()">
              <span class="toggle-label">Remove ProposalKit branding</span>
            </label>
            <div class="fh">Replaces ProposalKit name with your company name in sidebar, page titles, client portal, and exports</div>
          </div>
        </div>
        <div class="card card-p" style="margin-bottom:14px">
          <div class="card-head"><div><div class="card-t">Your Signature</div><div class="card-d">Draw your signature to include in proposals</div></div></div>
          <div class="sig-wrap" id="sigWrap"><div id="sigDisplay"></div></div>
        </div>
        <div class="card card-p">
          <div class="card-head"><div><div class="card-t">Data Management</div><div class="card-d">Export or clear your local data</div></div></div>
          <div class="sec-header-actions">
            <button class="btn-sm-outline" onclick="exportData()"><i data-lucide="download"></i> Export All Data</button>
            <button class="btn-sm-destructive" onclick="confirmDialog('Delete all proposals? This cannot be undone.',()=>{DB=[];persist();renderDashboard();toast('All data cleared');},{title:'Clear All Data',confirmText:'Delete All'})"><i data-lucide="trash-2"></i> Clear All Data</button>
          </div>
        </div>
      </div>
    </div>`;
    renderColorSwatches('setColors', CONFIG?.color);
    document.querySelectorAll('#setColors .color-swatch').forEach(s => {
        const orig = s.onclick;
        s.onclick = () => { orig(); saveSettings(); };
    });
    const countryItems = OB_COUNTRIES;
    csel(document.getElementById('setCountry'), {
        value: CONFIG?.country || '', placeholder: 'Select country', searchable: true,
        items: countryItems, onChange: (val) => { CONFIG.country = val; document.getElementById('setTaxFields').innerHTML = getCountryTaxHtml(); saveSettings(); }
    });
    csel(document.getElementById('setFont'), {
        value: CONFIG?.font || 'Inter',
        items: [
            { value: 'Inter', label: 'Inter', desc: 'Modern' }, { value: 'Roboto', label: 'Roboto', desc: 'Standard' },
            { value: 'Lato', label: 'Lato', desc: 'Friendly' }, { value: 'Playfair Display', label: 'Playfair Display', desc: 'Elegant' },
            { value: 'Merriweather', label: 'Merriweather', desc: 'Classic' }, { value: 'Courier Prime', label: 'Courier Prime', desc: 'Typewriter' }
        ],
        onChange: (val) => { saveSettings(); applyFont(val); }
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
            <div class="modal-t">${isEdit ? 'Edit' : 'New'} Email Template</div>
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
    let saved = safeGetStorage('pk_email_tpl', []);
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

function saveSettings() {
    const v = (id, fb) => { const el = document.getElementById(id); return el ? el.value : fb; };
    CONFIG.company = v('setCo', CONFIG.company);
    CONFIG.name = v('setName', CONFIG.name);
    CONFIG.email = v('setEmail', CONFIG.email);
    CONFIG.phone = v('setPhone', CONFIG.phone);
    CONFIG.country = cselGetValue(document.getElementById('setCountry')) || CONFIG.country;
    CONFIG.address = v('setAddr', CONFIG.address);
    CONFIG.website = v('setWebsite', CONFIG.website);
    CONFIG.font = cselGetValue(document.getElementById('setFont')) || CONFIG.font || 'Inter';
    const wlEl = document.getElementById('setWhiteLabel');
    if (wlEl) CONFIG.whiteLabel = wlEl.checked;
    // Country-specific tax fields with validation
    const c = CONFIG.country;
    if (c === 'IN') {
        const gstin = v('setGstin', CONFIG.gstin), pan = v('setPan', CONFIG.pan), udyam = v('setUdyam', CONFIG.udyam);
        CONFIG.gstin = gstin; CONFIG.pan = pan; CONFIG.udyam = udyam;
        if (gstin && !validateTaxId('gstin', gstin)) markInvalid('setGstin', 'Invalid GSTIN'); else clearInvalid('setGstin');
        if (pan && !validateTaxId('pan', pan)) markInvalid('setPan', 'Invalid PAN'); else clearInvalid('setPan');
        if (udyam && !validateTaxId('udyam', udyam)) markInvalid('setUdyam', 'Invalid UDYAM'); else clearInvalid('setUdyam');
    } else if (c === 'US') {
        const ein = v('setEin', CONFIG.ein); CONFIG.ein = ein;
        if (ein && !validateTaxId('ein', ein)) markInvalid('setEin', 'Invalid EIN'); else clearInvalid('setEin');
    } else if (['GB','DE','FR','NL','SE','IE'].includes(c)) { CONFIG.vatNumber = v('setVat', CONFIG.vatNumber); }
    else if (c === 'AU') {
        const abn = v('setAbn', CONFIG.abn); CONFIG.abn = abn;
        if (abn && !validateTaxId('abn', abn)) markInvalid('setAbn', 'Invalid ABN'); else clearInvalid('setAbn');
    } else { CONFIG.taxId = v('setTaxId', CONFIG.taxId); }
    // Bank details
    if (!CONFIG.bank) CONFIG.bank = {};
    CONFIG.bank.name = v('setBankName', CONFIG.bank.name);
    CONFIG.bank.holder = v('setBankHolder', CONFIG.bank.holder);
    CONFIG.bank.account = v('setBankAccount', CONFIG.bank.account);
    CONFIG.bank.ifsc = v('setBankIfsc', CONFIG.bank.ifsc);
    CONFIG.bank.swift = v('setBankSwift', CONFIG.bank.swift);
    // Color
    const sel = document.querySelector('#setColors .color-swatch.on');
    if (sel) { CONFIG.color = rgbToHex(sel.style.background) || sel.style.background; }
    else {
        const hexInp = document.querySelector('#setColors .color-hex-input');
        if (hexInp && /^#[0-9a-fA-F]{6}$/.test(hexInp.value.trim())) CONFIG.color = hexInp.value.trim();
    }
    saveConfig();
}

function markInvalid(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = 'var(--red)';
    const hint = el.parentElement?.querySelector('.fh');
    if (hint) { hint.textContent = msg; hint.style.color = 'var(--red)'; }
}

function clearInvalid(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = '';
    const hint = el.parentElement?.querySelector('.fh');
    if (hint) { hint.style.color = ''; }
}

function exportData() {
    const data = {
        config: CONFIG, proposals: DB, clients: CLIENTS,
        sectionLibrary: safeGetStorage('pk_seclib', []),
        tcLibrary: safeGetStorage('pk_tclib', []),
        emailTemplates: safeGetStorage('pk_email_tpl', []),
        proposalTemplates: safeGetStorage('pk_templates', [])
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const slug = CONFIG?.whiteLabel && CONFIG?.company ? CONFIG.company.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'proposalkit';
    a.download = slug + '-export.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Data exported');
}

function applyWhiteLabel() {
    const brand = document.querySelector('.side-brand');
    if (brand) brand.textContent = CONFIG?.whiteLabel ? (CONFIG?.company || 'ProposalKit') : 'ProposalKit';
    refreshSide();
}

function appName() {
    return CONFIG?.whiteLabel && CONFIG?.company ? CONFIG.company : 'ProposalKit';
}
