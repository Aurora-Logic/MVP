// ════════════════════════════════════════
// CREATE PAGE — Full-page proposal creation
// ════════════════════════════════════════

/* exported renderCreatePage, selectTemplate, toggleCreateSection, setCreateClientMode, selectCreateClient, updateNewClientField, doCreateProposal, setCreateCat, toggleAllCreateSections, pickCreateColor, searchCreateClients */

let _createState = {
    template: 'blank',
    sections: [],
    lineItems: [],
    paymentTerms: '',
    client: null,
    clientMode: 'skip',
    font: 'System',
    color: '#800020',
    category: 'all',
    clientSearch: ''
};

const _CREATE_TPL_DESC = {
    blank: 'Start from scratch', web: 'Website & app projects', design: 'Branding & UI/UX',
    consulting: 'Advisory & strategy', saas: 'Cloud software products', marketing: 'Campaigns & SEO',
    photography: 'Shoots & editing', ecommerce: 'Online store builds', mobile: 'iOS & Android apps',
    india: 'GST/TDS compliant', us: 'W-9 & Net 30 terms', uk: 'VAT & IR35 ready',
    pack_saas: '8 sections for SaaS products', pack_agency: '8 sections for creative agencies',
    pack_consulting: '8 sections for consulting', pack_freelancer: '8 sections for freelancers'
};

function renderCreatePage() {
    console.log('[CREATE PAGE] Rendering create page...');
    _createState.font = CONFIG?.font || 'System';
    _createState.color = CONFIG?.color || (typeof COLORS !== 'undefined' ? COLORS[0] : '#800020');

    // Check if navigated from client detail with ?client=IDX
    const qs = new URLSearchParams(window.location.search);
    const clientIdx = qs.get('client');
    if (clientIdx !== null && CLIENTS[parseInt(clientIdx)]) {
        const c = CLIENTS[parseInt(clientIdx)];
        _createState.clientMode = 'existing';
        _createState.client = {
            name: c.displayName || c.companyName || c.name || '',
            contact: ((c.salutation || '') + ' ' + ((c.firstName || '') + ' ' + (c.lastName || '')).trim()).trim() || c.contact || '',
            email: c.email || '',
            phone: c.workPhone || c.mobile || c.phone || ''
        };
    }

    // Set initial template sections
    const tpl = TPLS[_createState.template] || TPLS.blank;
    _createState.sections = (tpl.sections || []).map(s => ({ ...s, enabled: true }));
    _createState.lineItems = tpl.lineItems || [];
    _createState.paymentTerms = tpl.paymentTerms || '';

    const body = document.getElementById('bodyScroll');
    body.className = 'body-scroll'; body.style.padding = '0';
    body.innerHTML = `<div class="create-page"><div class="create-left" id="createLeft">${_buildCreateHeader()}${_buildTemplateSection()}${_buildClientSection()}${_buildSectionsChecklist()}${_buildAppearanceSection()}${_buildCreateFooter()}</div><div class="create-right" id="createRight"><div class="create-preview-frame"><div class="create-preview-label">Preview</div><div class="create-preview-scroll"><div class="create-preview-doc prev-doc" id="createPreviewDoc"><div style="padding:40px;color:var(--text4);text-align:center">Select a template to see preview</div></div></div></div></div></div>`;

    const fontEl = document.getElementById('createFontSelect');
    if (fontEl) csel(fontEl, { value: _createState.font, items: [
        { value: 'System', label: 'System (SF Pro)', desc: 'Default' }, { value: 'Roboto', label: 'Roboto', desc: 'Standard' },
        { value: 'Lato', label: 'Lato', desc: 'Friendly' }, { value: 'Playfair Display', label: 'Playfair Display', desc: 'Elegant' },
        { value: 'Merriweather', label: 'Merriweather', desc: 'Classic' }, { value: 'Courier Prime', label: 'Courier Prime', desc: 'Typewriter' }
    ], onChange: (val) => { _createState.font = val; _schedulePreview(); } });

    if (typeof lucideScope === 'function') lucideScope(body);
    else lucide.createIcons();

    // Build initial preview
    _schedulePreview();
}

function _buildCreateHeader() {
    return '<div class="create-header"><button class="btn-sm-icon-ghost" onclick="history.back()" data-tooltip="Back"><i data-lucide="arrow-left"></i></button><div class="create-title">New Proposal</div></div>';
}

function _buildTemplateSection() {
    const curCat = _createState.category;
    const tabs = TPL_CATEGORIES.map(c => `<button class="filter-tab${c.key === curCat ? ' on' : ''}" onclick="setCreateCat('${c.key}')"><i data-lucide="${c.icon}"></i> ${c.label}</button>`).join('');
    let cards = '';
    if (curCat === 'saved') {
        const saved = safeGetStorage('pk_templates', []);
        if (!saved.length) cards = '<div class="empty empty-sm"><div class="empty-t">No saved templates</div><div class="empty-d">Save a proposal as a template from the editor.</div></div>';
        else cards = saved.map((t, i) => _tplCard('saved_' + i, t.title, 'bookmark', '', (t.sections || []).length + ' sections, ' + (t.lineItems || []).length + ' items')).join('');
    } else {
        cards = Object.entries(TPLS).filter(([, v]) => curCat === 'all' || v.category === curCat).map(([key, t]) => {
            const desc = t.desc || _CREATE_TPL_DESC[key] || '';
            const secs = (t.sections || []).length, items = (t.lineItems || []).length;
            const badge = t.countryLabel ? `<span class="tpl-badge">${esc(t.countryLabel)}</span>` : '';
            return _tplCard(key, t.title.replace(' Proposal', '') + badge, t.icon || 'file', '', esc(desc) + (secs ? ' \u00b7 ' + secs + 's' : '') + (items ? ', ' + items + ' items' : ''));
        }).join('');
    }
    return `<div class="create-section"><div class="create-section-label"><i data-lucide="layout-template"></i> Template</div><div class="create-tpl-tabs">${tabs}</div><div class="create-tpl-grid" id="createTplGrid">${cards}</div></div>`;
}

function _tplCard(key, name, icon, badge, meta) {
    const sel = _createState.template === key ? ' selected' : '';
    return `<div class="create-tpl-card${sel}" onclick="selectTemplate('${key}')"><div class="create-tpl-ic"><i data-lucide="${icon}"></i></div><div class="create-tpl-info"><div class="create-tpl-name">${name.includes('<') ? name : esc(name)}</div><div class="create-tpl-meta">${meta}</div></div></div>`;
}

function _buildClientSection() {
    const mode = _createState.clientMode;
    const modeButtons = [['existing', 'Pick existing', 'users'], ['new', 'New client', 'user-plus'], ['skip', 'Skip', 'arrow-right']].map(([k, l, ic]) =>
        `<button class="filter-tab${k === mode ? ' on' : ''}" onclick="setCreateClientMode('${k}')"><i data-lucide="${ic}"></i> ${l}</button>`).join('');
    let content = '';
    if (mode === 'existing') {
        if (!CLIENTS.length) { content = '<div class="create-client-empty">No saved clients. Add one in the Customers tab or use "New client".</div>'; }
        else {
            const q = (_createState.clientSearch || '').toLowerCase();
            const filtered = q ? CLIENTS.filter(c => (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.displayName || '').toLowerCase().includes(q)) : CLIENTS;
            content = `<input type="text" class="create-client-search" placeholder="Search clients\u2026" value="${esc(_createState.clientSearch)}" oninput="searchCreateClients(this.value)">`;
            if (_createState.client) content += `<div class="create-client-selected"><span>${esc(_createState.client.name)}</span><span class="create-client-email">${esc(_createState.client.email)}</span><button class="btn-sm-icon-ghost" onclick="selectCreateClient(-1)" data-tooltip="Remove"><i data-lucide="x"></i></button></div>`;
            else content += `<div class="create-client-list" id="createClientList">${filtered.map((c, i) => `<div class="create-client-item" onclick="selectCreateClient(${i})"><span class="create-client-item-name">${esc(c.displayName || c.companyName || c.name || '')}</span><span class="create-client-item-email">${esc(c.email || '')}</span></div>`).join('')}</div>`;
        }
    } else if (mode === 'new') {
        const cl = _createState.client || {};
        content = `<div class="create-client-form"><div class="create-client-row"><input type="text" placeholder="Company or client name" value="${esc(cl.name || '')}" oninput="updateNewClientField('name', this.value)"></div><div class="create-client-row"><input type="email" placeholder="Email address" value="${esc(cl.email || '')}" oninput="updateNewClientField('email', this.value)"></div><div class="create-client-row"><input type="tel" placeholder="Phone number" value="${esc(cl.phone || '')}" oninput="updateNewClientField('phone', this.value)"></div></div>`;
    } else { content = '<div class="create-client-skip">You can add client info later in the editor.</div>'; }
    return `<div class="create-section"><div class="create-section-label"><i data-lucide="user"></i> Client</div><div class="create-client-modes">${modeButtons}</div><div id="createClientContent">${content}</div></div>`;
}

function _buildSectionsChecklist() {
    const secs = _createState.sections;
    if (!secs.length) return `<div class="create-section" id="createSecSection"><div class="create-section-label"><i data-lucide="list-checks"></i> Sections <span class="cnt">0</span></div><div class="create-sec-empty">Select a template with sections to customize.</div></div>`;
    const enabledCount = secs.filter(s => s.enabled).length;
    const allOn = enabledCount === secs.length;
    const items = secs.map((s, i) => {
        const preview = (s.content || '').replace(/<[^>]*>/g, '').slice(0, 80);
        return `<label class="create-sec-item"><input type="checkbox" ${s.enabled ? 'checked' : ''} onchange="toggleCreateSection(${i})"><div class="create-sec-content"><div class="create-sec-title">${esc(s.title || 'Untitled')}</div>${preview ? `<div class="create-sec-preview">${esc(preview)}${(s.content || '').length > 80 ? '\u2026' : ''}</div>` : ''}</div></label>`;
    }).join('');
    return `<div class="create-section" id="createSecSection"><div class="create-section-label"><i data-lucide="list-checks"></i> Sections <span class="cnt">${enabledCount}</span><button class="create-sec-toggle" onclick="toggleAllCreateSections()">${allOn ? 'Deselect all' : 'Select all'}</button></div><div class="create-sec-list">${items}</div></div>`;
}

function _buildAppearanceSection() {
    const swatches = COLORS.map(c => `<div class="nm-swatch${c === _createState.color ? ' on' : ''}" style="background:${c}" onclick="pickCreateColor('${c}')"></div>`).join('');
    return `<div class="create-section"><div class="create-section-label"><i data-lucide="paintbrush"></i> Appearance</div><div class="create-appear-row"><div class="create-appear-col"><label class="fl" style="margin-bottom:6px">Font</label><div id="createFontSelect"></div></div><div class="create-appear-col"><label class="fl" style="margin-bottom:6px">Brand Color</label><div class="nm-swatches">${swatches}</div></div></div></div>`;
}

function _buildCreateFooter() {
    return '<div class="create-footer"><button class="btn create-btn" onclick="doCreateProposal()"><i data-lucide="plus"></i> Create Proposal</button></div>';
}

// ── Actions ──

function setCreateCat(cat) {
    _createState.category = cat;
    _rerenderSection('template');
}

function selectTemplate(key) {
    const tpl = key.startsWith('saved_') ? safeGetStorage('pk_templates', [])[parseInt(key.replace('saved_', ''))] : TPLS[key];
    if (!tpl) return;
    _createState.template = key;
    _createState.sections = (tpl.sections || []).map(s => ({ ...s, enabled: true }));
    _createState.lineItems = tpl.lineItems || [];
    _createState.paymentTerms = tpl.paymentTerms || '';
    _rerenderSection('template'); _rerenderSection('sections'); _schedulePreview();
}

function toggleCreateSection(idx) {
    if (_createState.sections[idx]) { _createState.sections[idx].enabled = !_createState.sections[idx].enabled; _schedulePreview(); }
}

function toggleAllCreateSections() {
    const allOn = _createState.sections.every(s => s.enabled);
    _createState.sections.forEach(s => { s.enabled = !allOn; });
    _rerenderSection('sections'); _schedulePreview();
}

function setCreateClientMode(mode) {
    _createState.clientMode = mode; _createState.clientSearch = '';
    _createState.client = mode === 'new' ? { name: '', contact: '', email: '', phone: '' } : null;
    _rerenderSection('client'); _schedulePreview();
}

function selectCreateClient(idx) {
    if (idx < 0) { _createState.client = null; }
    else {
        const c = CLIENTS[idx]; if (!c) return;
        _createState.client = { name: c.displayName || c.companyName || c.name || '', contact: ((c.salutation || '') + ' ' + ((c.firstName || '') + ' ' + (c.lastName || '')).trim()).trim() || c.contact || '', email: c.email || '', phone: c.workPhone || c.mobile || c.phone || '' };
    }
    _rerenderSection('client'); _schedulePreview();
}

function searchCreateClients(q) { _createState.clientSearch = q; _rerenderSection('client'); }

function updateNewClientField(field, val) {
    if (!_createState.client) _createState.client = { name: '', contact: '', email: '', phone: '' };
    _createState.client[field] = val; _schedulePreview();
}

function pickCreateColor(c) {
    _createState.color = c;
    document.querySelectorAll('.create-page .nm-swatch').forEach(s => s.classList.toggle('on', s.style.background === c));
    _schedulePreview();
}

function doCreateProposal() {
    if (typeof createPropFromPage === 'function') createPropFromPage(_createState);
    else createProp(TPLS[_createState.template] || TPLS.blank);
}

// ── Internal helpers ──

function _rerenderSection(which) {
    const builders = { template: _buildTemplateSection, client: _buildClientSection, sections: _buildSectionsChecklist };
    const fn = builders[which]; if (!fn) return;
    let target;
    if (which === 'sections') target = document.getElementById('createSecSection');
    else { const idx = which === 'template' ? 0 : 1; target = document.querySelectorAll('#createLeft > .create-section')[idx]; }
    if (!target) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = fn();
    target.replaceWith(tmp.firstElementChild);
    const left = document.getElementById('createLeft');
    if (typeof lucideScope === 'function') lucideScope(left); else lucide.createIcons();
}

let _createPreviewTimer = null;
function _schedulePreview() {
    clearTimeout(_createPreviewTimer);
    _createPreviewTimer = setTimeout(() => {
        if (typeof buildCreatePreview === 'function') buildCreatePreview(_createState);
    }, 300);
}
