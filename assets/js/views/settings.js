// ════════════════════════════════════════
// SETTINGS — Tab-based layout
// ════════════════════════════════════════

/* exported exportData, importData, applyWhiteLabel, scrollToSection, setTab */
function getCountryTaxHtml() {
    const c = CONFIG?.country;
    if (c === 'IN') return `
        <div class="fg"><label class="fl">GSTIN</label><input type="text" id="setGstin" value="${esc(CONFIG?.gstin || '')}" oninput="saveSettings()" maxlength="15"><div class="fh">15-digit GST Identification Number</div></div>
        <div class="fr">
            <div class="fg"><label class="fl">PAN</label><input type="text" id="setPan" value="${esc(CONFIG?.pan || '')}" oninput="saveSettings()" maxlength="10"><div class="fh">Permanent Account Number</div></div>
            <div class="fg"><label class="fl">UDYAM Registration</label><input type="text" id="setUdyam" value="${esc(CONFIG?.udyam || '')}" oninput="saveSettings()"><div class="fh">MSME Registration Number</div></div>
        </div>
        <div class="fg"><label class="fl">LUT Number</label><input type="text" id="setLut" value="${esc(CONFIG?.lut || '')}" oninput="saveSettings()" maxlength="20"><div class="fh">Letter of Undertaking (for zero-rated exports)</div></div>`;
    if (c === 'US') return `
        <div class="fg"><label class="fl">EIN</label><input type="text" id="setEin" value="${esc(CONFIG?.ein || '')}" oninput="saveSettings()" maxlength="10"><div class="fh">Federal Employer Identification Number</div></div>`;
    if (['GB','DE','FR','NL','SE','IE'].includes(c)) return `
        <div class="fg"><label class="fl">VAT Number</label><input type="text" id="setVat" value="${esc(CONFIG?.vatNumber || '')}" oninput="saveSettings()"><div class="fh">Value Added Tax Registration</div></div>`;
    if (c === 'AU') return `
        <div class="fg"><label class="fl">ABN</label><input type="text" id="setAbn" value="${esc(CONFIG?.abn || '')}" oninput="saveSettings()" maxlength="14"><div class="fh">Australian Business Number</div></div>`;
    return `<div class="fg"><label class="fl">Tax / Registration ID</label><input type="text" id="setTaxId" value="${esc(CONFIG?.taxId || '')}" oninput="saveSettings()"></div>`;
}

const _secHead = (icon, title, desc, color) => `<div class="set-head"><div class="set-head-icon" style="background:${color}18;color:${color}"><i data-lucide="${icon}"></i></div><div><div class="set-head-t">${title}</div><div class="set-head-d">${desc}</div></div></div>`;

const SET_TABS = [
    { key: 'account', label: 'Account', icon: 'user-circle', auth: true },
    { key: 'profile', label: 'Profile', icon: 'building-2' },
    { key: 'payments', label: 'Payments', icon: 'landmark' },
    { key: 'email', label: 'Email', icon: 'mail' },
    { key: 'team', label: 'Team', icon: 'users', fn: 'renderTeamSettings' },
    { key: 'ai', label: 'AI', icon: 'sparkles', fn: 'renderAiSettingsCard' },
    { key: 'branding', label: 'Branding', icon: 'palette' },
    { key: 'signature', label: 'Signature', icon: 'pen-tool' },
    { key: 'data', label: 'Data', icon: 'database' }
];

function buildAccountCard() {
    const user = sbSession?.user;
    if (!user) return '';
    const email = user.email || '';
    const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
    const since = user.created_at ? fmtDate(user.created_at) : '';
    const statusLabel = navigator.onLine ? (syncStatus === 'syncing' ? 'Syncing...' : 'Synced') : 'Offline';
    const statusIcon = navigator.onLine ? (syncStatus === 'syncing' ? 'refresh-cw' : 'check-circle') : 'wifi-off';
    return `<div class="card card-p set-card set-card-blue">
        ${_secHead('user-circle', 'Account', 'Signed in as ' + esc(email), '#007AFF')}
        ${name ? `<div style="font-size:14px;color:var(--text3);margin-bottom:8px">${esc(name)}</div>` : ''}
        ${since ? `<div style="font-size:14px;color:var(--text4);margin-bottom:12px">Member since ${since}</div>` : ''}
        <span class="acct-sync" style="display:inline-flex;align-items:center;gap:6px;font-size:14px;color:var(--text3);margin-bottom:12px"><i data-lucide="${statusIcon}" style="width:14px;height:14px"></i> ${statusLabel}</span>
        <div class="sec-header-actions">
            <button class="btn-sm-outline" onclick="if(typeof pushToCloud==='function')pushToCloud().then(()=>toast('Data synced'))"><i data-lucide="refresh-cw"></i> Sync now</button>
            <button class="btn-sm-destructive" onclick="logoutApp()"><i data-lucide="log-out"></i> Sign out</button>
        </div>
    </div>`;
}

function scrollToSection(id) {
    const key = id.replace('sec-', '');
    const btn = document.querySelector(`.set-tabs .set-tab[data-key="${key}"]`);
    if (btn) setTab(btn, key);
}

function renderSettings() {
    CUR = null;
    document.getElementById('topTitle').textContent = 'Settings';
    document.getElementById('topRight').innerHTML = '';
    const body = document.getElementById('bodyScroll');
    const loggedIn = typeof isLoggedIn === 'function' && isLoggedIn();
    const tabs = SET_TABS.filter(t => {
        if (t.auth && !loggedIn) return false;
        if (t.fn && typeof window[t.fn] !== 'function') return false;
        return true;
    });
    const defaultTab = loggedIn ? 'account' : 'profile';
    body.innerHTML = `<div class="set-container">
      <div class="set-tabs" role="tablist">${tabs.map(t =>
        `<button class="set-tab${t.key === defaultTab ? ' on' : ''}" role="tab" data-key="${t.key}" onclick="setTab(this,'${t.key}')"><i data-lucide="${t.icon}"></i><span>${t.label}</span></button>`
      ).join('')}</div>
      <div id="setPanel"></div>
    </div>`;
    lucide.createIcons();
    setTab(null, defaultTab);
}

function setTab(btn, key) {
    if (btn) document.querySelectorAll('.set-tabs .set-tab').forEach(t => t.classList.remove('on'));
    if (btn) btn.classList.add('on');
    else document.querySelector(`.set-tabs .set-tab[data-key="${key}"]`)?.classList.add('on');
    const panel = document.getElementById('setPanel');
    const b = CONFIG?.bank || {};
    const panels = {
        account: () => buildAccountCard(),
        profile: () => `<div class="card card-p set-card set-card-blue">
            ${_secHead('building-2', 'Profile', 'Your business info, auto-filled into every proposal', '#007AFF')}
            <div class="fg"><label class="fl">Company name</label><input type="text" id="setCo" value="${esc(CONFIG?.company)}" oninput="saveSettings()"></div>
            <div class="fr"><div class="fg"><label class="fl">Your name</label><input type="text" id="setName" value="${esc(CONFIG?.name)}" oninput="saveSettings()"></div>
              <div class="fg"><label class="fl">Email</label><input type="email" id="setEmail" value="${esc(CONFIG?.email)}" oninput="saveSettings()"></div></div>
            <div class="fr"><div class="fg"><label class="fl">Phone</label><input type="tel" id="setPhone" value="${esc(CONFIG?.phone)}" oninput="saveSettings()"></div>
              <div class="fg"><label class="fl">Country</label><div id="setCountry"></div></div></div>
            <div class="fg"><label class="fl">Address</label><input type="text" id="setAddr" value="${esc(CONFIG?.address)}" oninput="saveSettings()"></div>
            <div class="fg"><label class="fl">Website</label><input type="url" id="setWebsite" value="${esc(CONFIG?.website)}" oninput="saveSettings()"></div>
            <div id="setTaxFields">${getCountryTaxHtml()}</div>
          </div>`,
        payments: () => `<div class="card card-p set-card set-card-green">
            ${_secHead('landmark', 'Payments', 'Bank details shown on proposals and invoices', '#34C759')}
            <div class="fr"><div class="fg"><label class="fl">Bank name</label><input type="text" id="setBankName" value="${esc(b.name)}" oninput="saveSettings()"></div>
              <div class="fg"><label class="fl">Account holder</label><input type="text" id="setBankHolder" value="${esc(b.holder)}" oninput="saveSettings()"></div></div>
            <div class="fg"><label class="fl">Account number</label><input type="text" id="setBankAccount" value="${esc(b.account)}" oninput="saveSettings()"></div>
            <div class="fr"><div class="fg"><label class="fl">IFSC / Sort code</label><input type="text" id="setBankIfsc" value="${esc(b.ifsc)}" oninput="saveSettings()"></div>
              <div class="fg"><label class="fl">SWIFT / BIC</label><input type="text" id="setBankSwift" value="${esc(b.swift)}" oninput="saveSettings()"></div></div>
            ${CONFIG?.country === 'IN' ? `<div class="fg"><label class="fl">UPI ID</label><input type="text" id="setBankUpi" value="${esc(b.upi || '')}" placeholder="e.g. business@upi" oninput="saveSettings()"><div class="fh">Shown as QR code on PDFs (India only)</div></div>` : ''}
          </div>`,
        email: () => `<div class="card card-p set-card set-card-orange">
            ${_secHead('mail', 'Email templates', 'Quick emails for sending proposals to clients', '#FF9500')}
            <button class="btn-sm-outline" onclick="addEmailTemplate()" style="margin-bottom:12px"><i data-lucide="plus"></i> Add template</button>
            <div id="emailTplList"></div>
          </div>`,
        team: () => typeof renderTeamSettings === 'function' ? renderTeamSettings() : '',
        ai: () => typeof renderAiSettingsCard === 'function' ? renderAiSettingsCard() : '',
        branding: () => `<div class="card card-p set-card set-card-purple">
            ${_secHead('palette', 'Branding', 'Logo, colors, and fonts for your proposals', '#AF52DE')}
            <div class="fg"><label class="fl">Logo</label>
              <div class="brand-logo-box" onclick="document.getElementById('setLogoInput').click()" id="setLogoBox">${CONFIG?.logo ? '<img src="' + esc(CONFIG.logo) + '" alt="Company logo">' : '<i data-lucide="image-plus"></i>'}</div>
              <input type="file" id="setLogoInput" accept="image/*" style="display:none" onchange="handleLogo(this);saveSettings()"><div class="fh">PNG, JPG, or SVG</div></div>
            <div class="fg"><div class="color-row" id="setColors"></div></div>
            <div class="fg"><label class="fl">Font family</label><div id="setFont"></div></div>
            <div class="set-divider"></div>
            <div class="fg"><label class="fl">White label</label>
              <label class="toggle-row"><input type="checkbox" id="setWhiteLabel" ${CONFIG?.whiteLabel ? 'checked' : ''} onchange="saveSettings();applyWhiteLabel()"><span class="toggle-label">Remove ProposalKit branding</span></label>
              <div class="fh">Replaces ProposalKit name with your company name everywhere</div></div>
          </div>`,
        signature: () => `<div class="card card-p set-card">
            ${_secHead('pen-tool', 'Signature', 'Draw your signature to include in proposals', '#18181b')}
            <div class="sig-wrap" id="sigWrap"><div id="sigDisplay"></div></div>
          </div>`,
        data: () => `<div class="card card-p set-card set-card-danger">
            ${_secHead('database', 'Data management', 'Export, import, or clear your local data', '#FF3B30')}
            <div class="fg"><label class="fl">Webhook URL</label>
              <input type="url" id="setWebhookUrl" value="${esc(CONFIG?.webhookUrl || '')}" placeholder="https://..." oninput="saveSettings()">
              <div class="fh">POST proposal data to this URL on export</div></div>
            <div class="sec-header-actions" style="margin-top:16px">
              <button class="btn-sm-outline" onclick="exportData()"><i data-lucide="download"></i> Export</button>
              <button class="btn-sm-outline" onclick="importData()"><i data-lucide="upload"></i> Import</button>
              <button class="btn-sm-destructive" onclick="confirmDialog('Delete all proposals? This cannot be undone.',()=>{DB=[];persist();renderDashboard();toast('All data cleared');},{title:'Clear All Data',confirmText:'Delete All'})"><i data-lucide="trash-2"></i> Clear all</button>
            </div>
          </div>`
    };
    panel.innerHTML = (panels[key] || panels.profile)();
    if (key === 'profile') {
        csel(document.getElementById('setCountry'), {
            value: CONFIG?.country || '', placeholder: 'Select country', searchable: true,
            items: OB_COUNTRIES, onChange: (val) => { CONFIG.country = val; document.getElementById('setTaxFields').innerHTML = getCountryTaxHtml(); lucide.createIcons(); saveSettings(); }
        });
    }
    if (key === 'branding') {
        renderColorSwatches('setColors', CONFIG?.color);
        document.querySelectorAll('#setColors .color-swatch').forEach(s => {
            const orig = s.onclick; s.onclick = () => { orig(); saveSettings(); };
        });
        csel(document.getElementById('setFont'), {
            value: CONFIG?.font || 'System',
            items: [
                { value: 'System', label: 'System (SF Pro)', desc: 'Default' }, { value: 'Roboto', label: 'Roboto', desc: 'Standard' },
                { value: 'Lato', label: 'Lato', desc: 'Friendly' }, { value: 'Playfair Display', label: 'Playfair Display', desc: 'Elegant' },
                { value: 'Merriweather', label: 'Merriweather', desc: 'Classic' }, { value: 'Courier Prime', label: 'Courier Prime', desc: 'Typewriter' }
            ],
            onChange: (val) => { saveSettings(); applyFont(val); }
        });
    }
    if (key === 'signature') initSignaturePad();
    if (key === 'email' && typeof renderEmailTemplates === 'function') renderEmailTemplates();
    lucide.createIcons();
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
    CONFIG.font = cselGetValue(document.getElementById('setFont')) || CONFIG.font || 'System';
    const wlEl = document.getElementById('setWhiteLabel');
    if (wlEl) CONFIG.whiteLabel = wlEl.checked;
    CONFIG.aiApiKey = v('setAiKey', CONFIG.aiApiKey);
    CONFIG.webhookUrl = v('setWebhookUrl', CONFIG.webhookUrl);
    const c = CONFIG.country;
    if (c !== 'IN') { CONFIG.gstin = ''; CONFIG.pan = ''; CONFIG.udyam = ''; CONFIG.lut = ''; }
    if (c !== 'US') { CONFIG.ein = ''; }
    if (!['GB','DE','FR','NL','SE','IE'].includes(c)) { CONFIG.vatNumber = ''; }
    if (c !== 'AU') { CONFIG.abn = ''; }
    if (c === 'IN') {
        const gstin = v('setGstin', CONFIG.gstin), pan = v('setPan', CONFIG.pan), udyam = v('setUdyam', CONFIG.udyam), lut = v('setLut', CONFIG.lut);
        CONFIG.gstin = gstin; CONFIG.pan = pan; CONFIG.udyam = udyam; CONFIG.lut = lut;
        if (gstin && !validateTaxId('gstin', gstin)) markInvalid('setGstin', 'Invalid GSTIN'); else clearInvalid('setGstin');
        if (pan && !validateTaxId('pan', pan)) markInvalid('setPan', 'Invalid PAN'); else clearInvalid('setPan');
        if (udyam && !validateTaxId('udyam', udyam)) markInvalid('setUdyam', 'Invalid UDYAM'); else clearInvalid('setUdyam');
        if (lut && !validateTaxId('lut', lut)) markInvalid('setLut', 'Invalid LUT'); else clearInvalid('setLut');
    } else if (c === 'US') {
        const ein = v('setEin', CONFIG.ein); CONFIG.ein = ein;
        if (ein && !validateTaxId('ein', ein)) markInvalid('setEin', 'Invalid EIN'); else clearInvalid('setEin');
    } else if (['GB','DE','FR','NL','SE','IE'].includes(c)) { CONFIG.vatNumber = v('setVat', CONFIG.vatNumber); }
    else if (c === 'AU') {
        const abn = v('setAbn', CONFIG.abn); CONFIG.abn = abn;
        if (abn && !validateTaxId('abn', abn)) markInvalid('setAbn', 'Invalid ABN'); else clearInvalid('setAbn');
    } else { CONFIG.taxId = v('setTaxId', CONFIG.taxId); }
    if (!CONFIG.bank) CONFIG.bank = {};
    CONFIG.bank.name = v('setBankName', CONFIG.bank.name);
    CONFIG.bank.holder = v('setBankHolder', CONFIG.bank.holder);
    CONFIG.bank.account = v('setBankAccount', CONFIG.bank.account);
    CONFIG.bank.ifsc = v('setBankIfsc', CONFIG.bank.ifsc);
    CONFIG.bank.swift = v('setBankSwift', CONFIG.bank.swift);
    CONFIG.bank.upi = v('setBankUpi', CONFIG.bank.upi);
    const sel = document.querySelector('#setColors .color-swatch.on');
    if (sel) { CONFIG.color = rgbToHex(sel.style.background) || sel.style.background; }
    else {
        const hexInp = document.querySelector('#setColors .color-hex-input');
        if (hexInp && /^#[0-9a-fA-F]{6}$/.test(hexInp.value.trim())) CONFIG.color = hexInp.value.trim();
    }
    saveConfig();
}

function markInvalid(id, msg) {
    const el = document.getElementById(id); if (!el) return;
    el.style.borderColor = 'var(--red)';
    const hint = el.parentElement?.querySelector('.fh');
    if (hint) { hint.textContent = msg; hint.style.color = 'var(--red)'; }
}
function clearInvalid(id) {
    const el = document.getElementById(id); if (!el) return;
    el.style.borderColor = '';
    const hint = el.parentElement?.querySelector('.fh');
    if (hint) { hint.style.color = ''; }
}

function exportData() {
    const data = {
        config: CONFIG, proposals: DB, clients: CLIENTS,
        sectionLibrary: safeGetStorage('pk_seclib', []), tcLibrary: safeGetStorage('pk_tclib', []),
        emailTemplates: safeGetStorage('pk_email_tpl', []), proposalTemplates: safeGetStorage('pk_templates', [])
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    const slug = CONFIG?.whiteLabel && CONFIG?.company ? CONFIG.company.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'proposalkit';
    a.download = slug + '-export.json'; a.click(); URL.revokeObjectURL(a.href);
    toast('Data exported');
}

function importData() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = () => {
        const file = input.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (!data || typeof data !== 'object') throw new Error('Invalid format');
                const counts = [];
                if (data.config && typeof data.config === 'object') { Object.assign(CONFIG, data.config); localStorage.setItem('pk_config', JSON.stringify(CONFIG)); counts.push('config'); }
                if (Array.isArray(data.proposals) && data.proposals.length) {
                    const ids = new Set(DB.map(p => p.id)); let added = 0;
                    data.proposals.forEach(p => { if (p.id && !ids.has(p.id)) { DB.push(p); added++; } });
                    persist(); counts.push(added + ' proposals');
                }
                if (Array.isArray(data.clients) && data.clients.length) {
                    const ids = new Set(CLIENTS.map(cl => cl.id)); let added = 0;
                    data.clients.forEach(cl => { if (cl.id && !ids.has(cl.id)) { CLIENTS.push(cl); added++; } });
                    localStorage.setItem('pk_clients', JSON.stringify(CLIENTS)); counts.push(added + ' clients');
                }
                if (Array.isArray(data.sectionLibrary)) localStorage.setItem('pk_seclib', JSON.stringify(data.sectionLibrary));
                if (Array.isArray(data.tcLibrary)) localStorage.setItem('pk_tclib', JSON.stringify(data.tcLibrary));
                if (Array.isArray(data.emailTemplates)) localStorage.setItem('pk_email_tpl', JSON.stringify(data.emailTemplates));
                if (Array.isArray(data.proposalTemplates)) localStorage.setItem('pk_templates', JSON.stringify(data.proposalTemplates));
                toast('Imported: ' + (counts.join(', ') || 'data'));
                if (typeof renderSettings === 'function') renderSettings();
            } catch (e) { toast('Invalid file — could not parse JSON', 'error'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

function applyWhiteLabel() {
    const brand = document.getElementById('sideBrand');
    if (brand) brand.textContent = CONFIG?.whiteLabel ? (CONFIG?.company || 'ProposalKit') : 'ProposalKit';
    refreshSide();
}

function appName() {
    return CONFIG?.whiteLabel && CONFIG?.company ? CONFIG.company : 'ProposalKit';
}
