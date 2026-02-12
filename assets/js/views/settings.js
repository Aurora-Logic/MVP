// ════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════

/* exported exportData, importData, applyWhiteLabel, scrollToSection */
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

function buildAccountCard() {
    const user = sbSession?.user;
    if (!user) return '';
    const email = user.email || '';
    const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
    const since = user.created_at ? fmtDate(user.created_at) : '';
    const statusLabel = navigator.onLine ? (syncStatus === 'syncing' ? 'Syncing...' : 'Synced') : 'Offline';
    const statusIcon = navigator.onLine ? (syncStatus === 'syncing' ? 'refresh-cw' : 'check-circle') : 'wifi-off';
    return `<div class="card card-p" style="margin-bottom:14px">
        <div class="card-head"><div><div class="card-t">Account</div><div class="card-d">Signed in as ${esc(email)}</div></div>
            <span class="acct-sync"><i data-lucide="${statusIcon}" style="width:14px;height:14px"></i> ${statusLabel}</span>
        </div>
        ${name ? `<div style="font-size:13px;color:var(--text3);margin-bottom:8px">${esc(name)}</div>` : ''}
        ${since ? `<div style="font-size:12px;color:var(--text4);margin-bottom:12px">Member since ${since}</div>` : ''}
        <div class="sec-header-actions">
            <button class="btn-sm-outline" onclick="if(typeof pushToCloud==='function')pushToCloud().then(()=>toast('Data synced'))"><i data-lucide="refresh-cw"></i> Sync Now</button>
            <button class="btn-sm-destructive" onclick="logoutApp()"><i data-lucide="log-out"></i> Sign Out</button>
        </div>
    </div>`;
}

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initSettingsScrollSpy() {
    const scroller = document.getElementById('bodyScroll');
    if (!scroller) return;
    const sections = scroller.querySelectorAll('.settings-section[id]');
    const navItems = document.querySelectorAll('.settings-nav-item');
    if (!sections.length || !navItems.length) return;
    scroller.addEventListener('scroll', () => {
        let activeId = '';
        sections.forEach(s => { if (s.getBoundingClientRect().top <= 100) activeId = s.id; });
        navItems.forEach(n => n.classList.toggle('on', n.dataset.sec === activeId));
    }, { passive: true });
}

function settingsNavHtml() {
    const loggedIn = typeof isLoggedIn === 'function' && isLoggedIn();
    const items = [
        ...(loggedIn ? [['account', 'user-circle', 'Account']] : []),
        ['profile', 'building-2', 'Profile'],
        ['payments', 'landmark', 'Payments'],
        ['email', 'mail', 'Email'],
        ...(typeof renderTeamSettings === 'function' ? [['team', 'users', 'Team']] : []),
        ...(typeof renderAiSettingsCard === 'function' ? [['ai', 'sparkles', 'AI Assistant']] : []),
        ['branding', 'palette', 'Branding'],
        ['signature', 'pen-tool', 'Signature'],
        ['data', 'database', 'Data']
    ];
    const ver = `${typeof appName === 'function' ? appName() : 'ProposalKit'} v${typeof APP_VERSION !== 'undefined' ? APP_VERSION : '?'} (build ${typeof APP_BUILD !== 'undefined' ? APP_BUILD : '?'})`;
    return `<nav class="settings-nav">${items.map(([id, icon, label], i) =>
        `<button class="settings-nav-item${i === 0 ? ' on' : ''}" data-sec="sec-${id}" onclick="scrollToSection('sec-${id}')"><i data-lucide="${icon}"></i> ${label}</button>`
    ).join('')}<div class="settings-nav-version">${ver}</div></nav>`;
}

function renderSettings() {
    CUR = null;
    document.getElementById('topTitle').textContent = 'Settings';
    document.getElementById('topRight').innerHTML = '';
    const b = CONFIG?.bank || {};
    const body = document.getElementById('bodyScroll');
    const loggedIn = typeof isLoggedIn === 'function' && isLoggedIn();

    body.innerHTML = `<div class="settings-layout">${settingsNavHtml()}
    <div class="settings-content">
      ${loggedIn ? `<div class="settings-section" id="sec-account">${buildAccountCard()}</div>` : ''}
      <div class="settings-section" id="sec-profile">
        <div class="settings-section-head"><div class="settings-section-t">Profile</div><div class="settings-section-d">Auto-filled into every new proposal</div></div>
        <div class="fg"><label class="fl">Company Name</label><input type="text" id="setCo" value="${esc(CONFIG?.company)}" oninput="saveSettings()"></div>
        <div class="fr"><div class="fg"><label class="fl">Your Name</label><input type="text" id="setName" value="${esc(CONFIG?.name)}" oninput="saveSettings()"></div>
          <div class="fg"><label class="fl">Email</label><input type="email" id="setEmail" value="${esc(CONFIG?.email)}" oninput="saveSettings()"></div></div>
        <div class="fr"><div class="fg"><label class="fl">Phone</label><input type="tel" id="setPhone" value="${esc(CONFIG?.phone)}" oninput="saveSettings()"></div>
          <div class="fg"><label class="fl">Country</label><div id="setCountry"></div></div></div>
        <div class="fg"><label class="fl">Address</label><input type="text" id="setAddr" value="${esc(CONFIG?.address)}" oninput="saveSettings()"></div>
        <div class="fg"><label class="fl">Website</label><input type="url" id="setWebsite" value="${esc(CONFIG?.website)}" oninput="saveSettings()"></div>
        <div id="setTaxFields">${getCountryTaxHtml()}</div>
      </div>
      <div class="settings-section" id="sec-payments">
        <div class="settings-section-head"><div class="settings-section-t">Payments</div><div class="settings-section-d">Bank details shown on proposals</div></div>
        <div class="fr"><div class="fg"><label class="fl">Bank Name</label><input type="text" id="setBankName" value="${esc(b.name)}" oninput="saveSettings()"></div>
          <div class="fg"><label class="fl">Account Holder</label><input type="text" id="setBankHolder" value="${esc(b.holder)}" oninput="saveSettings()"></div></div>
        <div class="fg"><label class="fl">Account Number</label><input type="text" id="setBankAccount" value="${esc(b.account)}" oninput="saveSettings()"></div>
        <div class="fr"><div class="fg"><label class="fl">IFSC / Sort Code</label><input type="text" id="setBankIfsc" value="${esc(b.ifsc)}" oninput="saveSettings()"></div>
          <div class="fg"><label class="fl">SWIFT / BIC</label><input type="text" id="setBankSwift" value="${esc(b.swift)}" oninput="saveSettings()"></div></div>
        ${CONFIG?.country === 'IN' ? `<div class="fg"><label class="fl">UPI ID</label><input type="text" id="setBankUpi" value="${esc(b.upi || '')}" placeholder="e.g. business@upi" oninput="saveSettings()"><div class="fh">Shown as QR code on PDFs (India only)</div></div>` : ''}
      </div>
      <div class="settings-section" id="sec-email">
        <div class="settings-section-head"><div class="settings-section-t">Email Templates</div><div class="settings-section-d">Quick emails for sending proposals</div></div>
        <button class="btn-sm-outline" onclick="addEmailTemplate()" style="margin-bottom:12px"><i data-lucide="plus"></i> Add Template</button>
        <div id="emailTplList"></div>
      </div>
      ${typeof renderTeamSettings === 'function' ? `<div class="settings-section" id="sec-team">${renderTeamSettings()}</div>` : ''}
      ${typeof renderAiSettingsCard === 'function' ? `<div class="settings-section" id="sec-ai">${renderAiSettingsCard()}</div>` : ''}
      <div class="settings-section" id="sec-branding">
        <div class="settings-section-head"><div class="settings-section-t">Branding</div><div class="settings-section-d">Logo and colors for your proposals</div></div>
        <div class="fg"><label class="fl">Logo</label>
          <div class="brand-logo-box" onclick="document.getElementById('setLogoInput').click()" id="setLogoBox">${CONFIG?.logo ? '<img src="' + esc(CONFIG.logo) + '" alt="Company logo">' : '<i data-lucide="image-plus"></i>'}</div>
          <input type="file" id="setLogoInput" accept="image/*" style="display:none" onchange="handleLogo(this);saveSettings()"><div class="fh">PNG, JPG, or SVG</div></div>
        <div class="fg"><div class="color-row" id="setColors"></div></div>
        <div class="fg"><label class="fl">Font Family</label><div id="setFont"></div></div>
        <div class="fg" style="margin-top:8px;padding-top:12px;border-top:1px solid var(--border)">
          <label class="fl">White Label</label>
          <label class="toggle-row"><input type="checkbox" id="setWhiteLabel" ${CONFIG?.whiteLabel ? 'checked' : ''} onchange="saveSettings();applyWhiteLabel()"><span class="toggle-label">Remove ProposalKit branding</span></label>
          <div class="fh">Replaces ProposalKit name with your company name in sidebar, page titles, client portal, and exports</div>
        </div>
      </div>
      <div class="settings-section" id="sec-signature">
        <div class="settings-section-head"><div class="settings-section-t">Signature</div><div class="settings-section-d">Draw your signature to include in proposals</div></div>
        <div class="sig-wrap" id="sigWrap"><div id="sigDisplay"></div></div>
      </div>
      <div class="settings-danger-divider"><span class="settings-danger-label">Danger Zone</span></div>
      <div class="settings-section" id="sec-data">
        <div class="settings-section-head"><div class="settings-section-t">Data Management</div><div class="settings-section-d">Export, import, or clear your local data</div></div>
        <div class="fg"><label class="fl">Webhook URL</label>
          <input type="url" id="setWebhookUrl" value="${esc(CONFIG?.webhookUrl || '')}" placeholder="https://..." oninput="saveSettings()">
          <div class="fh">POST proposal data to this URL on export</div></div>
        <div class="sec-header-actions">
          <button class="btn-sm-outline" onclick="exportData()"><i data-lucide="download"></i> Export</button>
          <button class="btn-sm-outline" onclick="importData()"><i data-lucide="upload"></i> Import</button>
          <button class="btn-sm-destructive" onclick="confirmDialog('Delete all proposals? This cannot be undone.',()=>{DB=[];persist();renderDashboard();toast('All data cleared');},{title:'Clear All Data',confirmText:'Delete All'})"><i data-lucide="trash-2"></i> Clear All</button>
        </div>
      </div>
    </div></div>`;
    renderColorSwatches('setColors', CONFIG?.color);
    document.querySelectorAll('#setColors .color-swatch').forEach(s => {
        const orig = s.onclick;
        s.onclick = () => { orig(); saveSettings(); };
    });
    csel(document.getElementById('setCountry'), {
        value: CONFIG?.country || '', placeholder: 'Select country', searchable: true,
        items: OB_COUNTRIES, onChange: (val) => { CONFIG.country = val; document.getElementById('setTaxFields').innerHTML = getCountryTaxHtml(); saveSettings(); }
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
    initSignaturePad();
    renderEmailTemplates();
    initSettingsScrollSpy();
    lucide.createIcons();
}

// Email template functions in settings-templates.js

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
    // Clear stale tax fields from other countries
    const c = CONFIG.country;
    if (c !== 'IN') { CONFIG.gstin = ''; CONFIG.pan = ''; CONFIG.udyam = ''; CONFIG.lut = ''; }
    if (c !== 'US') { CONFIG.ein = ''; }
    if (!['GB','DE','FR','NL','SE','IE'].includes(c)) { CONFIG.vatNumber = ''; }
    if (c !== 'AU') { CONFIG.abn = ''; }
    // Country-specific tax fields with validation
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
    // Bank details
    if (!CONFIG.bank) CONFIG.bank = {};
    CONFIG.bank.name = v('setBankName', CONFIG.bank.name);
    CONFIG.bank.holder = v('setBankHolder', CONFIG.bank.holder);
    CONFIG.bank.account = v('setBankAccount', CONFIG.bank.account);
    CONFIG.bank.ifsc = v('setBankIfsc', CONFIG.bank.ifsc);
    CONFIG.bank.swift = v('setBankSwift', CONFIG.bank.swift);
    CONFIG.bank.upi = v('setBankUpi', CONFIG.bank.upi);
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

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (!data || typeof data !== 'object') throw new Error('Invalid format');
                const counts = [];
                if (data.config && typeof data.config === 'object') {
                    Object.assign(CONFIG, data.config);
                    localStorage.setItem('pk_config', JSON.stringify(CONFIG));
                    counts.push('config');
                }
                if (Array.isArray(data.proposals) && data.proposals.length) {
                    const existingIds = new Set(DB.map(p => p.id));
                    let added = 0;
                    data.proposals.forEach(p => {
                        if (p.id && !existingIds.has(p.id)) { DB.push(p); added++; }
                    });
                    persist();
                    counts.push(added + ' proposals');
                }
                if (Array.isArray(data.clients) && data.clients.length) {
                    const existingIds = new Set(CLIENTS.map(cl => cl.id));
                    let added = 0;
                    data.clients.forEach(cl => {
                        if (cl.id && !existingIds.has(cl.id)) { CLIENTS.push(cl); added++; }
                    });
                    localStorage.setItem('pk_clients', JSON.stringify(CLIENTS));
                    counts.push(added + ' clients');
                }
                if (Array.isArray(data.sectionLibrary)) localStorage.setItem('pk_seclib', JSON.stringify(data.sectionLibrary));
                if (Array.isArray(data.tcLibrary)) localStorage.setItem('pk_tclib', JSON.stringify(data.tcLibrary));
                if (Array.isArray(data.emailTemplates)) localStorage.setItem('pk_email_tpl', JSON.stringify(data.emailTemplates));
                if (Array.isArray(data.proposalTemplates)) localStorage.setItem('pk_templates', JSON.stringify(data.proposalTemplates));
                toast('Imported: ' + (counts.join(', ') || 'data'));
                if (typeof renderSettings === 'function') renderSettings();
            } catch (e) {
                toast('Invalid file — could not parse JSON', 'error');
            }
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
