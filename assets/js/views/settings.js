// ════════════════════════════════════════
// SETTINGS — Modal overlay (Notion-style)
// ════════════════════════════════════════

/* exported openSettings, closeSettings, renderSettings, exportData, importData, applyWhiteLabel, scrollToSection, setTab */
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
    return `<div class="set-section-title">Account</div>
        ${name ? `<div style="font-size:14px;color:var(--text3);margin-bottom:4px">${esc(name)}</div>` : ''}
        <div style="font-size:14px;color:var(--text4);margin-bottom:4px">${esc(email)}</div>
        ${since ? `<div style="font-size:14px;color:var(--text4);margin-bottom:12px">Member since ${since}</div>` : ''}
        <span class="acct-sync" style="display:inline-flex;align-items:center;gap:6px;font-size:14px;color:var(--text3);margin-bottom:12px"><i data-lucide="${statusIcon}" style="width:14px;height:14px"></i> ${statusLabel}</span>
        <div class="sec-header-actions">
            <button class="btn-sm-outline" onclick="if(typeof pushToCloud==='function')pushToCloud().then(()=>toast('Data synced'))"><i data-lucide="refresh-cw"></i> Sync now</button>
            <button class="btn-sm-destructive" onclick="logoutApp()"><i data-lucide="log-out"></i> Sign out</button>
        </div>`;
}

function scrollToSection(id) {
    const key = id.replace('sec-', '');
    openSettings();
    setTimeout(() => {
        const btn = document.querySelector(`.sn-item[data-key="${key}"]`);
        if (btn) setTab(btn, key);
    }, 100);
}

function openSettings() {
    const existing = document.getElementById('settingsModal');
    if (existing) { existing.classList.add('show'); return; }
    const loggedIn = typeof isLoggedIn === 'function' && isLoggedIn();
    const hasTeam = typeof renderTeamSettings === 'function';
    const hasAi = typeof renderAiSettingsCard === 'function';
    let navHtml = '';
    if (loggedIn) navHtml += `<div class="sn-group"><div class="sn-group-label">Account</div>
        <button class="sn-item on" data-key="account" onclick="setTab(this,'account')"><i data-lucide="user-circle"></i> ${esc(CONFIG?.name || 'My account')}</button>
        <button class="sn-item" data-key="profile" onclick="setTab(this,'profile')"><i data-lucide="building-2"></i> Profile</button>
        <button class="sn-item" data-key="payments" onclick="setTab(this,'payments')"><i data-lucide="landmark"></i> Payments</button></div>`;
    else navHtml += `<div class="sn-group"><div class="sn-group-label">Account</div>
        <button class="sn-item on" data-key="profile" onclick="setTab(this,'profile')"><i data-lucide="building-2"></i> Profile</button>
        <button class="sn-item" data-key="payments" onclick="setTab(this,'payments')"><i data-lucide="landmark"></i> Payments</button></div>`;
    navHtml += `<div class="sn-group"><div class="sn-group-label">Workspace</div>
        <button class="sn-item" data-key="email" onclick="setTab(this,'email')"><i data-lucide="mail"></i> Email</button>
        ${hasTeam ? '<button class="sn-item" data-key="team" onclick="setTab(this,\'team\')"><i data-lucide="users"></i> Team</button>' : ''}
        ${hasAi ? '<button class="sn-item" data-key="ai" onclick="setTab(this,\'ai\')"><i data-lucide="sparkles"></i> AI</button>' : ''}
        <button class="sn-item" data-key="branding" onclick="setTab(this,'branding')"><i data-lucide="palette"></i> Branding</button>
        <button class="sn-item" data-key="pdfTemplate" onclick="setTab(this,'pdfTemplate')"><i data-lucide="file-type"></i> PDF Template</button>
        <button class="sn-item" data-key="signature" onclick="setTab(this,'signature')"><i data-lucide="pen-tool"></i> Signature</button></div>`;
    navHtml += `<div class="sn-group"><div class="sn-group-label">System</div>
        <button class="sn-item" data-key="data" onclick="setTab(this,'data')"><i data-lucide="database"></i> Data</button></div>`;
    const defaultTab = loggedIn ? 'account' : 'profile';
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'settingsModal';
    wrap.onclick = (e) => { if (e.target === wrap) closeSettings(); };
    wrap.innerHTML = `<div class="modal modal-settings" onclick="event.stopPropagation()">
      <button class="modal-x" onclick="closeSettings()"><i data-lucide="x"></i></button>
      <div class="set-layout">
        <nav class="sn-nav">${navHtml}</nav>
        <div class="set-content" id="setPanel"></div>
      </div>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
    setTab(null, defaultTab);
}

function closeSettings() { document.getElementById('settingsModal')?.remove(); }
function renderSettings() { openSettings(); }

function setTab(btn, key) {
    document.querySelectorAll('.sn-item').forEach(t => t.classList.remove('on'));
    if (btn) btn.classList.add('on');
    else document.querySelector(`.sn-item[data-key="${key}"]`)?.classList.add('on');
    const panel = document.getElementById('setPanel');
    const b = CONFIG?.bank || {};
    const sh = (t) => `<div class="set-section-title">${t}</div>`;
    const sep = '<div class="set-sep"></div>';
    const panels = {
        account: () => buildAccountCard(),
        profile: () => `${sh('Profile')}
            <div class="fg"><label class="fl">Company name</label><input type="text" id="setCo" value="${esc(CONFIG?.company)}" oninput="saveSettings()"></div>
            <div class="fr"><div class="fg"><label class="fl">Your name</label><input type="text" id="setName" value="${esc(CONFIG?.name)}" oninput="saveSettings()"></div>
              <div class="fg"><label class="fl">Email</label><input type="email" id="setEmail" value="${esc(CONFIG?.email)}" oninput="saveSettings()"></div></div>
            <div class="fr"><div class="fg"><label class="fl">Phone</label><input type="tel" id="setPhone" value="${esc(CONFIG?.phone)}" oninput="saveSettings()"></div>
              <div class="fg"><label class="fl">Country</label><div id="setCountry"></div></div></div>
            <div class="fg"><label class="fl">Address</label><input type="text" id="setAddr" value="${esc(CONFIG?.address)}" oninput="saveSettings()"></div>
            <div class="fg"><label class="fl">Website</label><input type="url" id="setWebsite" value="${esc(CONFIG?.website)}" oninput="saveSettings()"></div>
            ${sep}<div class="set-section-title">Tax information</div>
            <div id="setTaxFields">${getCountryTaxHtml()}</div>`,
        payments: () => `${sh('Payments')}
            <div class="fr"><div class="fg"><label class="fl">Bank name</label><input type="text" id="setBankName" value="${esc(b.name)}" oninput="saveSettings()"></div>
              <div class="fg"><label class="fl">Account holder</label><input type="text" id="setBankHolder" value="${esc(b.holder)}" oninput="saveSettings()"></div></div>
            <div class="fg"><label class="fl">Account number</label><input type="text" id="setBankAccount" value="${esc(b.account)}" oninput="saveSettings()"></div>
            <div class="fr"><div class="fg"><label class="fl">IFSC / Sort code</label><input type="text" id="setBankIfsc" value="${esc(b.ifsc)}" oninput="saveSettings()"></div>
              <div class="fg"><label class="fl">SWIFT / BIC</label><input type="text" id="setBankSwift" value="${esc(b.swift)}" oninput="saveSettings()"></div></div>
            ${CONFIG?.country === 'IN' ? `<div class="fg"><label class="fl">UPI ID</label><input type="text" id="setBankUpi" value="${esc(b.upi || '')}" placeholder="e.g. business@upi" oninput="saveSettings()"><div class="fh">Shown as QR code on PDFs (India only)</div></div>` : ''}`,
        email: () => `${sh('Email templates')}<div style="margin-bottom:12px"><button class="btn-sm-outline" onclick="addEmailTemplate()"><i data-lucide="plus"></i> Add template</button></div><div id="emailTplList"></div>`,
        team: () => typeof renderTeamSettings === 'function' ? renderTeamSettings() : '',
        ai: () => typeof renderAiSettingsCard === 'function' ? renderAiSettingsCard() : '',
        branding: () => `${sh('Branding')}
            <div class="fg"><label class="fl">Logo</label>
              <div class="brand-logo-box" onclick="document.getElementById('setLogoInput').click()" id="setLogoBox">${CONFIG?.logo ? '<img src="' + esc(CONFIG.logo) + '" alt="Company logo">' : '<i data-lucide="image-plus"></i>'}</div>
              <input type="file" id="setLogoInput" accept="image/*" style="display:none" onchange="handleLogo(this);saveSettings()"><div class="fh">PNG, JPG, or SVG</div></div>
            <div class="fg"><label class="fl">Accent color</label><div class="color-row" id="setColors"></div></div>
            <div class="fg"><label class="fl">Font family</label><div id="setFont"></div></div>
            ${sep}${sh('White label')}
            <div class="fg"><label class="toggle-row"><input type="checkbox" id="setWhiteLabel" ${CONFIG?.whiteLabel ? 'checked' : ''} onchange="saveSettings();applyWhiteLabel()"><span class="toggle-label">Remove ProposalKit branding</span></label>
              <div class="fh">Replaces ProposalKit name with your company name everywhere</div></div>`,
        pdfTemplate: () => {
            const html = typeof renderPdfCustomizer === 'function' ? renderPdfCustomizer() : '<div class="empty"><div class="empty-t">PDF Customizer not loaded</div></div>';
            setTimeout(() => { if (typeof initPdfCustomizerSelects === 'function') initPdfCustomizerSelects(); lucide.createIcons(); }, 50);
            return html;
        },
        signature: () => `${sh('Signature')}<div class="sig-wrap" id="sigWrap"><div id="sigDisplay"></div></div>`,
        data: () => `${sh('Data management')}
            <div class="fg"><label class="fl">Webhook URL</label>
              <input type="url" id="setWebhookUrl" value="${esc(CONFIG?.webhookUrl || '')}" placeholder="https://..." oninput="saveSettings()">
              <div class="fh">POST proposal data to this URL on export</div></div>
            ${sep}<div class="set-section-title" style="color:var(--red)">Danger zone</div>
            <div class="sec-header-actions">
              <button class="btn-sm-outline" onclick="exportData()"><i data-lucide="download"></i> Export</button>
              <button class="btn-sm-outline" onclick="importData()"><i data-lucide="upload"></i> Import</button>
              <button class="btn-sm-destructive" onclick="confirmDialog('Delete all proposals? This cannot be undone.',()=>{DB=[];persist();closeSettings();renderDashboard();toast('All data cleared');},{title:'Clear All Data',confirmText:'Delete All'})"><i data-lucide="trash-2"></i> Clear all</button>
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
                { value: 'System', label: 'System (Default)', desc: 'Default' }, { value: 'Roboto', label: 'Roboto', desc: 'Standard' },
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
    // Branding features (font, whiteLabel) require Pro/Team plan
    const hasBranding = typeof checkLimit === 'function' ? checkLimit('branding').allowed : true;
    const newFont = cselGetValue(document.getElementById('setFont')) || CONFIG.font || 'System';
    if (newFont !== CONFIG.font && !hasBranding) {
        if (typeof showUpgradeModal === 'function') showUpgradeModal('branding', checkLimit('branding'));
    } else {
        CONFIG.font = newFont;
    }
    const wlEl = /** @type {HTMLInputElement} */ (document.getElementById('setWhiteLabel'));
    if (wlEl) {
        const newWhiteLabel = wlEl.checked;
        if (newWhiteLabel && !CONFIG.whiteLabel && !hasBranding) {
            wlEl.checked = false;
            if (typeof showUpgradeModal === 'function') showUpgradeModal('branding', checkLimit('branding'));
        } else {
            CONFIG.whiteLabel = newWhiteLabel;
        }
    }
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
    // Strip sensitive keys (API key, signature image) from exported config
    const safeConfig = CONFIG ? Object.fromEntries(Object.entries(CONFIG).filter(([k]) => !['aiApiKey'].includes(k))) : null;
    const data = {
        config: safeConfig, proposals: DB, clients: CLIENTS,
        sectionLibrary: safeGetStorage('pk_seclib', []), tcLibrary: safeGetStorage('pk_tclib', []),
        emailTemplates: safeGetStorage('pk_email_tpl', []), proposalTemplates: safeGetStorage('pk_templates', [])
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    const slug = CONFIG?.whiteLabel && CONFIG?.company ? CONFIG.company.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'proposalkit';
    a.download = slug + '-export.json'; a.click(); URL.revokeObjectURL(a.href);
    toast('Data exported');
}

// Sanitize all string values in an object tree (for imported data)
function sanitizeImportStrings(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeImportStrings);
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string') result[k] = sanitizeHtml(v);
        else if (typeof v === 'object' && v !== null) result[k] = sanitizeImportStrings(v);
        else result[k] = v;
    }
    return result;
}

function importData() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = () => {
        const file = input.files?.[0]; if (!file) return;
        if (file.size > 10 * 1024 * 1024) { toast('File too large (max 10MB)', 'error'); return; }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid format');
                const counts = [];
                if (data.config && typeof data.config === 'object' && !Array.isArray(data.config)) {
                    const safeConfig = sanitizeImportStrings(data.config);
                    Object.assign(CONFIG, safeConfig);
                    localStorage.setItem('pk_config', JSON.stringify(CONFIG));
                    counts.push('config');
                }
                if (Array.isArray(data.proposals) && data.proposals.length) {
                    const ids = new Set(DB.map(p => p.id)); let added = 0;
                    data.proposals.forEach(p => {
                        if (p.id && typeof p.id === 'string' && !ids.has(p.id)) {
                            DB.push(sanitizeImportStrings(p)); added++;
                        }
                    });
                    persist(); counts.push(added + ' proposals');
                }
                if (Array.isArray(data.clients) && data.clients.length) {
                    const ids = new Set(CLIENTS.map(cl => cl.id)); let added = 0;
                    data.clients.forEach(cl => {
                        if (cl.id && typeof cl.id === 'string' && !ids.has(cl.id)) {
                            CLIENTS.push(sanitizeImportStrings(cl)); added++;
                        }
                    });
                    localStorage.setItem('pk_clients', JSON.stringify(CLIENTS)); counts.push(added + ' clients');
                }
                if (Array.isArray(data.sectionLibrary)) localStorage.setItem('pk_seclib', JSON.stringify(data.sectionLibrary.map(sanitizeImportStrings)));
                if (Array.isArray(data.tcLibrary)) localStorage.setItem('pk_tclib', JSON.stringify(data.tcLibrary.map(sanitizeImportStrings)));
                if (Array.isArray(data.emailTemplates)) localStorage.setItem('pk_email_tpl', JSON.stringify(data.emailTemplates.map(sanitizeImportStrings)));
                if (Array.isArray(data.proposalTemplates)) localStorage.setItem('pk_templates', JSON.stringify(data.proposalTemplates.map(sanitizeImportStrings)));
                toast('Imported: ' + (counts.join(', ') || 'data'));
                closeSettings(); openSettings();
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
