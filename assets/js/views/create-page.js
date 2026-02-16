// ════════════════════════════════════════
// CREATE DRAWER — Slide-out proposal creation
// ════════════════════════════════════════

/* exported openCreateDrawer, closeCreateDrawer, renderCreatePage, setDrawerStep, selectTemplate, setCreateClientMode, selectCreateClient, updateNewClientField, doCreateProposal, setCreateCat, searchCreateClients */

const _createState = {
    step: 1, // 1=Template, 2=Client, 3=Review
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

function openCreateDrawer(clientIdx = null) {
    try {
        // Reset state
        _createState.step = 1;
        _createState.template = 'blank';
        _createState.clientMode = 'skip';
        _createState.client = null;
        _createState.clientSearch = '';
        _createState.category = 'all';
        _createState.font = CONFIG?.font || 'System';
        _createState.color = CONFIG?.color || (typeof COLORS !== 'undefined' ? COLORS[0] : '#800020');

        // Pre-fill client if provided
        if (clientIdx !== null && CLIENTS[parseInt(clientIdx)]) {
            const c = CLIENTS[parseInt(clientIdx)];
            _createState.clientMode = 'existing';
            _createState.client = {
                name: c.displayName || c.companyName || c.name || '',
                contact: ((c.salutation || '') + ' ' + ((c.firstName || '') + ' ' + (c.lastName || '')).trim()).trim() || c.contact || '',
                email: c.email || '',
                phone: c.workPhone || c.mobile || c.phone || ''
            };
            _createState.step = 2; // Start on client step
        }

        // Set initial template sections
        const tpl = TPLS[_createState.template] || TPLS.blank;
        _createState.sections = (tpl.sections || []).map(s => ({ ...s, enabled: true }));
        _createState.lineItems = tpl.lineItems || [];
        _createState.paymentTerms = tpl.paymentTerms || '';

        // Create drawer
        const existing = document.getElementById('createDrawer');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'drawer-overlay';
        overlay.id = 'createDrawer';
        overlay.onclick = (e) => { if (e.target === overlay) closeCreateDrawer(); };

        overlay.innerHTML = `
            <div class="drawer" onclick="event.stopPropagation()">
                <div class="drawer-header">
                    <div class="drawer-title">New Proposal</div>
                    <button class="btn-sm-icon-ghost" onclick="closeCreateDrawer()"><i data-lucide="x"></i></button>
                </div>
                <div class="drawer-body" id="drawerBody"></div>
                <div class="drawer-footer" id="drawerFooter"></div>
            </div>`;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));

        _renderDrawerContent();
        if (typeof lucideScope === 'function') lucideScope(overlay);
        else lucide.createIcons();
    } catch (error) {
        if (CONFIG?.debug) console.error('[CreateDrawer] Failed to open:', error);
        if (typeof toast === 'function') toast('Failed to open creation drawer. Please try again.', 'error');
    }
}

function closeCreateDrawer() {
    const drawer = document.getElementById('createDrawer');
    if (drawer) {
        drawer.classList.remove('show');
        setTimeout(() => drawer.remove(), 200);
    }
}

function renderCreatePage() {
    try {
        // Legacy compatibility — redirect to drawer
        const qs = new URLSearchParams(window.location.search);
        const clientIdx = qs.get('client');
        openCreateDrawer(clientIdx);
        // Navigate back to previous route
        history.back();
    } catch (error) {
        if (CONFIG?.debug) console.error('[CreatePage] Failed to render:', error);
        if (typeof toast === 'function') toast('Failed to load create page. Please try again.', 'error');
        if (typeof navigate === 'function') navigate('/proposals');
    }
}

function _renderDrawerContent() {
    try {
        const body = document.getElementById('drawerBody');
        const footer = document.getElementById('drawerFooter');
        if (!body || !footer) return;

        // Steps indicator
        const steps = [
            { num: 1, label: 'Template' },
            { num: 2, label: 'Client' },
            { num: 3, label: 'Review' }
        ];
        const stepsHtml = steps.map(s => {
            const classes = ['drawer-step'];
            if (s.num === _createState.step) classes.push('active');
            if (s.num < _createState.step) classes.push('completed');
            return `<div class="${classes.join(' ')}"><div class="drawer-step-num">${s.num < _createState.step ? '<i data-lucide="check" style="width:14px;height:14px"></i>' : s.num}</div><span class="drawer-step-label">${s.label}</span></div>`;
        }).join('');

        // Render content based on step
        let content = '';
        if (_createState.step === 1) content = _buildTemplateStep();
        else if (_createState.step === 2) content = _buildClientStep();
        else if (_createState.step === 3) content = _buildReviewStep();

        body.innerHTML = `<div class="drawer-steps">${stepsHtml}</div>${content}`;

        // Render footer buttons
        const backBtn = _createState.step > 1 ? '<button class="btn-sm-outline" onclick="setDrawerStep(' + (_createState.step - 1) + ')"><i data-lucide="arrow-left"></i> Back</button>' : '';
        const nextBtn = _createState.step < 3 ? '<button class="btn-sm" onclick="setDrawerStep(' + (_createState.step + 1) + ')">Next <i data-lucide="arrow-right"></i></button>' : '<button class="btn" onclick="doCreateProposal()"><i data-lucide="plus"></i> Create Proposal</button>';
        footer.innerHTML = backBtn + nextBtn;

        if (typeof lucideScope === 'function') lucideScope(document.getElementById('createDrawer'));
        else lucide.createIcons();
    } catch (error) {
        if (CONFIG?.debug) console.error('[CreateDrawer] Failed to render content:', error);
        if (typeof toast === 'function') toast('Failed to render drawer content', 'error');
    }
}

function setDrawerStep(step) {
    _createState.step = Math.max(1, Math.min(3, step));
    _renderDrawerContent();
}

function _buildTemplateStep() {
    const curCat = _createState.category;
    const tabs = TPL_CATEGORIES.slice(0, 4).map(c => `<button class="filter-tab${c.key === curCat ? ' on' : ''}" onclick="setCreateCat('${c.key}')"><i data-lucide="${c.icon}"></i> ${c.label}</button>`).join('');

    let cards = '';
    if (curCat === 'saved') {
        const saved = safeGetStorage('pk_templates', []);
        if (!saved.length) cards = '<div class="empty empty-sm"><div class="empty-t">No saved templates</div><div class="empty-d">Save a proposal as a template from the editor.</div></div>';
        else cards = saved.map((t, i) => _drawerTplCard('saved_' + i, t.title, 'bookmark', (t.sections || []).length + ' sections')).join('');
    } else {
        cards = Object.entries(TPLS).filter(([, v]) => curCat === 'all' || v.category === curCat).slice(0, 8).map(([key, t]) => {
            const desc = t.desc || _CREATE_TPL_DESC[key] || '';
            const secs = (t.sections || []).length;
            return _drawerTplCard(key, t.title.replace(' Proposal', ''), t.icon || 'file', esc(desc.split('.')[0]) + (secs ? ' · ' + secs + ' sections' : ''));
        }).join('');
    }

    return `<div class="drawer-section"><div class="drawer-section-label"><i data-lucide="layout-template"></i> Choose Template</div><div class="create-tpl-tabs" style="margin-bottom:16px">${tabs}</div><div class="drawer-tpl-grid">${cards}</div></div>`;
}

function _drawerTplCard(key, name, icon, meta) {
    const sel = _createState.template === key ? ' selected' : '';
    return `<div class="drawer-tpl-card${sel}" onclick="selectTemplate('${key}')"><div class="drawer-tpl-ic"><i data-lucide="${icon}"></i></div><div class="drawer-tpl-info"><div class="drawer-tpl-name">${esc(name)}</div><div class="drawer-tpl-meta">${meta}</div></div></div>`;
}

function _buildClientStep() {
    const mode = _createState.clientMode;
    const modeButtons = [
        ['existing', 'Existing', 'users'],
        ['new', 'New', 'user-plus'],
        ['skip', 'Skip', 'arrow-right']
    ].map(([k, l, ic]) => `<button class="filter-tab${k === mode ? ' on' : ''}" onclick="setCreateClientMode('${k}')"><i data-lucide="${ic}"></i> ${l}</button>`).join('');

    let content = '';
    if (mode === 'existing') {
        if (!CLIENTS.length) {
            content = '<div class="drawer-client-empty">No saved clients. Add one in the Customers tab or use "New".</div>';
        } else {
            const q = (_createState.clientSearch || '').toLowerCase();
            const filtered = q ? CLIENTS.filter(c => (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.displayName || '').toLowerCase().includes(q)) : CLIENTS;
            if (_createState.client) {
                content = `<div class="drawer-client-selected"><span>${esc(_createState.client.name)}</span><button class="btn-sm-icon-ghost" onclick="selectCreateClient(-1)"><i data-lucide="x"></i></button></div>`;
            } else {
                content = `<input type="text" class="drawer-client-search" placeholder="Search clients…" value="${esc(_createState.clientSearch)}" oninput="searchCreateClients(this.value)"><div class="drawer-client-list">${filtered.slice(0, 10).map((c, i) => `<div class="drawer-client-item" onclick="selectCreateClient(${i})"><span class="drawer-client-item-name">${esc(c.displayName || c.companyName || c.name || '')}</span><span class="drawer-client-item-email">${esc(c.email || '')}</span></div>`).join('')}</div>`;
            }
        }
    } else if (mode === 'new') {
        const cl = _createState.client || {};
        content = `<div class="drawer-client-form"><input type="text" placeholder="Company or client name" value="${esc(cl.name || '')}" oninput="updateNewClientField('name', this.value)"><input type="email" placeholder="Email address" value="${esc(cl.email || '')}" oninput="updateNewClientField('email', this.value)"><input type="tel" placeholder="Phone number" value="${esc(cl.phone || '')}" oninput="updateNewClientField('phone', this.value)"></div>`;
    } else {
        content = '<div class="drawer-client-skip">You can add client details later in the proposal editor.</div>';
    }

    return `<div class="drawer-section"><div class="drawer-section-label"><i data-lucide="user"></i> Client Details</div><div class="drawer-client-modes">${modeButtons}</div>${content}</div>`;
}

function _buildReviewStep() {
    const tpl = _createState.template.startsWith('saved_')
        ? safeGetStorage('pk_templates', [])[parseInt(_createState.template.replace('saved_', ''))]
        : TPLS[_createState.template];
    const tplName = tpl?.title || 'Blank';
    const clientName = _createState.client?.name || 'Not set';
    const sectionCount = _createState.sections?.filter(s => s.enabled).length || 0;

    return `<div class="drawer-section"><div class="drawer-section-label"><i data-lucide="check-circle"></i> Review & Create</div><div style="display:flex;flex-direction:column;gap:16px"><div class="card" style="padding:16px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong style="font-size:14px">Template</strong><button class="btn-sm-ghost" onclick="setDrawerStep(1)" style="font-size:12px">Edit</button></div><div style="color:var(--muted-foreground);font-size:14px">${esc(tplName)}</div></div><div class="card" style="padding:16px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong style="font-size:14px">Client</strong><button class="btn-sm-ghost" onclick="setDrawerStep(2)" style="font-size:12px">Edit</button></div><div style="color:var(--muted-foreground);font-size:14px">${esc(clientName)}</div></div><div class="card" style="padding:16px"><div style="margin-bottom:8px"><strong style="font-size:14px">Content</strong></div><div style="color:var(--muted-foreground);font-size:14px">${sectionCount} section${sectionCount !== 1 ? 's' : ''} · ${(_createState.lineItems || []).length} line item${(_createState.lineItems || []).length !== 1 ? 's' : ''}</div></div></div></div>`;
}


// ── Actions ──

function setCreateCat(cat) {
    _createState.category = cat;
    _renderDrawerContent();
}

function selectTemplate(key) {
    const tpl = key.startsWith('saved_') ? safeGetStorage('pk_templates', [])[parseInt(key.replace('saved_', ''))] : TPLS[key];
    if (!tpl) return;
    _createState.template = key;
    _createState.sections = (tpl.sections || []).map(s => ({ ...s, enabled: true }));
    _createState.lineItems = tpl.lineItems || [];
    _createState.paymentTerms = tpl.paymentTerms || '';
    _renderDrawerContent();
}

function setCreateClientMode(mode) {
    _createState.clientMode = mode;
    _createState.clientSearch = '';
    _createState.client = mode === 'new' ? { name: '', contact: '', email: '', phone: '' } : null;
    _renderDrawerContent();
}

function selectCreateClient(idx) {
    if (idx < 0) {
        _createState.client = null;
    } else {
        const c = CLIENTS[idx];
        if (!c) return;
        _createState.client = {
            name: c.displayName || c.companyName || c.name || '',
            contact: ((c.salutation || '') + ' ' + ((c.firstName || '') + ' ' + (c.lastName || '')).trim()).trim() || c.contact || '',
            email: c.email || '',
            phone: c.workPhone || c.mobile || c.phone || ''
        };
    }
    _renderDrawerContent();
}

function searchCreateClients(q) {
    _createState.clientSearch = q;
    _renderDrawerContent();
}

function updateNewClientField(field, val) {
    if (!_createState.client) _createState.client = { name: '', contact: '', email: '', phone: '' };
    _createState.client[field] = val;
}

async function doCreateProposal() {
    try {
        // Check usage limits
        if (typeof canCreateProposal === 'function') {
            const limitsCheck = await canCreateProposal();
            if (!limitsCheck.allowed) {
                const limit = limitsCheck.limit;
                const current = limitsCheck.current;

                confirmDialog(
                    `You've reached your proposal limit (${current}/${limit}). Upgrade to create more proposals.`,
                    () => {
                        // Navigate to pricing/upgrade
                        closeCreateDrawer();
                        navigate('/pricing');
                    },
                    {
                        confirmText: 'Upgrade Plan',
                        cancelText: 'Cancel',
                        type: 'warning'
                    }
                );
                return;
            }
        }

        if (typeof createPropFromPage === 'function') {
            createPropFromPage(_createState);
        } else {
            const tpl = _createState.template.startsWith('saved_')
                ? safeGetStorage('pk_templates', [])[parseInt(_createState.template.replace('saved_', ''))]
                : TPLS[_createState.template];
            createProp(tpl || TPLS.blank);
        }
        closeCreateDrawer();

        // Increment proposal count (async, fire-and-forget)
        if (typeof incrementProposalCount === 'function') {
            incrementProposalCount().catch(err => {
                if (CONFIG?.debug) console.error('Failed to increment count:', err);
            });
        }
    } catch (error) {
        if (CONFIG?.debug) console.error('[CreateProposal] Failed to create proposal:', error);
        if (typeof toast === 'function') toast('Failed to create proposal. Please try again.', 'error');
    }
}

