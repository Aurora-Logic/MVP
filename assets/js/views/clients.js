// ════════════════════════════════════════
// CUSTOMER DATABASE
// ════════════════════════════════════════

/* exported INDIAN_STATES, SALUTATIONS, matchClient, openAddClient, initStateDropdown, saveClient, editClient, delClient, showClientPicker, pickClient, filterClients, setClientFilter, toggleClientView */

const INDIAN_STATES = [
    { value: 'AN', label: 'Andaman & Nicobar' }, { value: 'AP', label: 'Andhra Pradesh' }, { value: 'AR', label: 'Arunachal Pradesh' },
    { value: 'AS', label: 'Assam' }, { value: 'BR', label: 'Bihar' }, { value: 'CH', label: 'Chandigarh' },
    { value: 'CT', label: 'Chhattisgarh' }, { value: 'DL', label: 'Delhi' }, { value: 'GA', label: 'Goa' }, { value: 'GJ', label: 'Gujarat' },
    { value: 'HR', label: 'Haryana' }, { value: 'HP', label: 'Himachal Pradesh' }, { value: 'JK', label: 'Jammu & Kashmir' },
    { value: 'JH', label: 'Jharkhand' }, { value: 'KA', label: 'Karnataka' }, { value: 'KL', label: 'Kerala' }, { value: 'LA', label: 'Ladakh' },
    { value: 'MP', label: 'Madhya Pradesh' }, { value: 'MH', label: 'Maharashtra' }, { value: 'MN', label: 'Manipur' },
    { value: 'ML', label: 'Meghalaya' }, { value: 'MZ', label: 'Mizoram' }, { value: 'NL', label: 'Nagaland' }, { value: 'OD', label: 'Odisha' },
    { value: 'PB', label: 'Punjab' }, { value: 'RJ', label: 'Rajasthan' }, { value: 'SK', label: 'Sikkim' }, { value: 'TN', label: 'Tamil Nadu' },
    { value: 'TG', label: 'Telangana' }, { value: 'TR', label: 'Tripura' }, { value: 'UP', label: 'Uttar Pradesh' },
    { value: 'UK', label: 'Uttarakhand' }, { value: 'WB', label: 'West Bengal' }
];
const SALUTATIONS = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
let _clientFilter = 'all';
let _clientView = 'table';

function renderClients() {
    CUR = null;
    document.getElementById('topTitle').textContent = 'Customers';
    document.getElementById('topRight').innerHTML = '';
    const body = document.getElementById('bodyScroll');
    if (!CLIENTS.length) {
        body.innerHTML = `<div class="empty" style="padding:60px 20px">
            <dotlottie-wc src="https://assets-v2.lottiefiles.com/a/421db1cc-118a-11ee-aed5-fb6b0052b9aa/1KyamM2lee.lottie" autoplay loop speed="0.8" style="width:200px;height:200px;margin:0 auto"></dotlottie-wc>
            <div class="empty-t">Build your customer database</div>
            <div class="empty-d">Save customer details once, reuse on every proposal.</div>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:16px">
                <button class="btn-sm" onclick="openAddClient()"><i data-lucide="plus"></i> New</button>
            </div>
        </div>`;
        lucide.createIcons(); return;
    }
    const cur = defaultCurrency();
    let totalValue = 0, wonProps = 0, decidedProps = 0, bizCount = 0, indCount = 0;
    const clientData = CLIENTS.map((c, i) => {
        const isBiz = (c.customerType || 'business') === 'business';
        if (isBiz) bizCount++; else indCount++;
        const props = DB.filter(p => matchClient(p, c));
        let val = 0;
        props.forEach(p => {
            val += (p.lineItems || []).reduce((a, it) => a + (it.qty || 0) * (it.rate || 0), 0);
            if (p.status === 'accepted') wonProps++;
            if (p.status === 'accepted' || p.status === 'declined') decidedProps++;
        });
        totalValue += val;
        const last = props.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))[0];
        const displayName = c.displayName || c.companyName || ((c.firstName || '') + ' ' + (c.lastName || '')).trim() || c.name || 'Unnamed';
        const ini = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const winRate = props.length ? Math.round(props.filter(p => p.status === 'accepted').length / props.length * 100) : 0;
        return { c, i, displayName, ini, props: props.length, val, last, email: c.email || '', isBiz, winRate };
    });
    const filtered = _clientFilter === 'all' ? clientData : _clientFilter === 'business' ? clientData.filter(d => d.isBiz) : clientData.filter(d => !d.isBiz);

    // Table rows
    const rows = filtered.map(d => `<tr class="nt-row" onclick="showClientInsightFull(${d.i})">
      <td class="nt-cell"><div class="cl-cell-name"><div class="cc-avi" style="background:var(--blue-bg);color:var(--blue)">${d.ini}</div><div><div class="cc-name">${esc(d.displayName)}</div><div class="cc-email">${esc(d.email)}</div></div></div></td>
      <td class="nt-cell cl-cell-email">${esc(d.email)}</td>
      <td class="nt-cell">${d.props}</td>
      <td class="nt-cell nt-cell-value mono">${fmtCur(d.val, cur)}</td>
      <td class="nt-cell nt-cell-date">${d.last ? timeAgo(d.last.updatedAt || d.last.createdAt) : '\u2014'}</td>
      <td class="nt-cell nt-cell-actions"><div class="prop-actions">
        <button class="prop-act-btn" onclick="event.stopPropagation();editClient(${d.i})" data-tooltip="Edit" data-side="bottom"><i data-lucide="pencil"></i></button>
        <button class="prop-act-btn" onclick="event.stopPropagation();delClient(${d.i})" data-tooltip="Delete" data-side="bottom"><i data-lucide="trash-2"></i></button>
      </div></td>
    </tr>`).join('');

    // Card items — richer with win rate, last active, type badge
    const cards = filtered.map(d => {
        const typeBadge = d.isBiz ? '<span class="cl-card-badge">Business</span>' : '<span class="cl-card-badge cl-card-badge-ind">Individual</span>';
        const lastActive = d.last ? timeAgo(d.last.updatedAt || d.last.createdAt) : 'No activity';
        return `<div class="cl-card" onclick="showClientInsightFull(${d.i})">
      <div class="cl-card-head"><div class="cc-avi" style="background:var(--blue-bg);color:var(--blue)">${d.ini}</div>
        <div style="flex:1;min-width:0"><div class="cc-name">${esc(d.displayName)}</div><div class="cc-email">${esc(d.email)}</div></div>
        ${typeBadge}</div>
      <div class="cl-card-body">
        <div class="cl-card-stat"><span class="cl-card-stat-label">Proposals</span><span class="cl-card-stat-val">${d.props}</span></div>
        <div class="cl-card-stat"><span class="cl-card-stat-label">Value</span><span class="cl-card-stat-val mono">${fmtCur(d.val, cur)}</span></div>
        <div class="cl-card-stat"><span class="cl-card-stat-label">Win rate</span><span class="cl-card-stat-val">${d.winRate}%</span></div>
      </div>
      <div class="cl-card-foot"><i data-lucide="clock" style="width:12px;height:12px"></i> ${lastActive}</div>
    </div>`;
    }).join('');

    const ft = (key, label, count) => `<button class="filter-tab${_clientFilter === key ? ' on' : ''}${!count ? ' dimmed' : ''}" onclick="setClientFilter('${key}')">${label} <span class="fc">${count}</span></button>`;
    const tv = (v, icon) => `<button class="btn-sm-icon-ghost${_clientView === v ? ' on' : ''}" onclick="toggleClientView('${v}')" data-tooltip="${v === 'table' ? 'Table' : 'Cards'}" data-side="bottom"><i data-lucide="${icon}"></i></button>`;

    body.innerHTML = `<div class="cl-container">
      <div class="cl-toolbar">
        <div class="prop-filters" role="tablist">${ft('all', 'All', CLIENTS.length)}${ft('business', 'Business', bizCount)}${ft('individual', 'Individual', indCount)}</div>
        <div class="cl-toolbar-right">
          <div class="cl-view-toggle">${tv('table', 'list')}${tv('card', 'layout-grid')}</div>
          <div class="cl-search-wrap"><i data-lucide="search"></i><input type="text" class="cl-search" id="clientSearch" placeholder="Search..." oninput="filterClients()"></div>
          <button class="btn-sm" onclick="openAddClient()"><i data-lucide="plus"></i> New</button>
        </div>
      </div>
      <div id="clTableView" style="${_clientView !== 'table' ? 'display:none' : ''}">
        <div class="nt-wrap"><table class="nt-table"><thead><tr class="nt-head">
          <th class="nt-th">Customer</th><th class="nt-th cl-th-email">Email</th><th class="nt-th">Proposals</th><th class="nt-th nt-th-value">Value</th><th class="nt-th nt-th-date">Last active</th><th class="nt-th nt-th-actions"></th>
        </tr></thead><tbody id="clientTable">${rows}</tbody></table></div>
      </div>
      <div id="clCardView" style="${_clientView !== 'card' ? 'display:none' : ''}">
        <div class="cl-card-grid">${cards}</div>
      </div>
    </div>`;
    lucide.createIcons();
}

function setClientFilter(f) { _clientFilter = f; renderClients(); }

function toggleClientView(v) {
    _clientView = v;
    document.getElementById('clTableView').style.display = v === 'table' ? '' : 'none';
    document.getElementById('clCardView').style.display = v === 'card' ? '' : 'none';
    document.querySelectorAll('.cl-view-toggle button').forEach(b => b.classList.remove('on'));
    document.querySelector(`.cl-view-toggle button[onclick*="${v}"]`)?.classList.add('on');
    lucide.createIcons();
}

function filterClients() {
    const q = (document.getElementById('clientSearch')?.value || '').toLowerCase().trim();
    document.querySelectorAll('#clientTable .nt-row').forEach(row => {
        row.style.display = q && !row.textContent.toLowerCase().includes(q) ? 'none' : '';
    });
    document.querySelectorAll('.cl-card').forEach(card => {
        card.style.display = q && !card.textContent.toLowerCase().includes(q) ? 'none' : '';
    });
}

function matchClient(p, c) {
    const clientName = c.displayName || c.companyName || ((c.firstName || '') + ' ' + (c.lastName || '')).trim() || c.name || '';
    return p.client?.name === clientName || p.client?.email === c.email;
}

function openAddClient(idx) {
    const isEdit = idx !== undefined;
    const c = isEdit ? CLIENTS[idx] : {};
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'clientModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    const salItems = [...SALUTATIONS.map(s => ({ value: s, label: s })), { value: '', label: 'None' }];
    const isBiz = (c.customerType || 'business') === 'business';
    wrap.innerHTML = `<div class="modal acm-modal" onclick="event.stopPropagation()">
      <div class="acm-header">
        <div><div class="modal-t">${isEdit ? 'Edit' : 'New'} customer</div>
          <div class="modal-d" style="margin-bottom:0">Complete customer details for proposals and invoices</div></div>
        <div class="acm-type-toggle">
          <button class="filter-tab${isBiz ? ' on' : ''}" type="button" onclick="this.parentElement.querySelectorAll('.filter-tab').forEach(b=>b.classList.remove('on'));this.classList.add('on');document.querySelector('input[name=acType][value=business]').checked=true;document.getElementById('acCompanyRow').style.display=''">Business</button>
          <button class="filter-tab${!isBiz ? ' on' : ''}" type="button" onclick="this.parentElement.querySelectorAll('.filter-tab').forEach(b=>b.classList.remove('on'));this.classList.add('on');document.querySelector('input[name=acType][value=individual]').checked=true;document.getElementById('acCompanyRow').style.display='none'">Individual</button>
        </div>
        <input type="radio" name="acType" value="business" ${isBiz ? 'checked' : ''} style="display:none">
        <input type="radio" name="acType" value="individual" ${!isBiz ? 'checked' : ''} style="display:none">
      </div>
      <div class="acm-body">
        <div class="acm-section-label">Contact details</div>
        <div class="fg"><label class="fl">Primary contact</label>
          <div style="display:flex;gap:8px"><div id="acSalutation" style="width:80px;flex-shrink:0"></div>
            <input type="text" id="acFirstName" value="${esc(c.firstName || '')}" placeholder="First name" style="flex:1">
            <input type="text" id="acLastName" value="${esc(c.lastName || '')}" placeholder="Last name" style="flex:1"></div>
        </div>
        <div class="fg" id="acCompanyRow" style="${!isBiz ? 'display:none;' : ''}"><label class="fl">Company name</label><input type="text" id="acCompanyName" value="${esc(c.companyName || c.name || '')}"></div>
        <div class="fg"><label class="fl">Display name</label><input type="text" id="acDisplayName" value="${esc(c.displayName || '')}" placeholder="Auto-generated if blank"></div>
        <div class="acm-divider"></div>
        <div class="acm-section-label">Communication</div>
        <div class="fg"><label class="fl">Email address</label><input type="email" id="acEmail" value="${esc(c.email || '')}"></div>
        <div class="fr"><div class="fg"><label class="fl">Work phone</label><input type="tel" id="acWorkPhone" value="${esc(c.workPhone || c.phone || '')}"></div>
          <div class="fg"><label class="fl">Mobile</label><input type="tel" id="acMobile" value="${esc(c.mobile || '')}"></div></div>
        <div class="fg"><label class="fl">Attention</label><input type="text" id="acAttention" value="${esc(c.attention || '')}" placeholder="e.g. Accounts Dept"></div>
        <div class="acm-divider"></div>
        <div class="acm-section-label">Billing address</div>
        <div class="fg"><label class="fl">Country / Region</label><div id="acCountry"></div></div>
        <div class="fg"><label class="fl">Address</label>
          <input type="text" id="acStreet1" value="${esc(c.street1 || '')}" placeholder="Street 1" style="margin-bottom:8px">
          <input type="text" id="acStreet2" value="${esc(c.street2 || '')}" placeholder="Street 2"></div>
        <div class="fr"><div class="fg"><label class="fl">City</label><input type="text" id="acCity" value="${esc(c.city || '')}"></div>
          <div class="fg"><label class="fl">State</label><div id="acState"></div></div></div>
        <div class="fr"><div class="fg"><label class="fl">Pin code</label><input type="text" id="acPinCode" value="${esc(c.pinCode || '')}" maxlength="10"></div>
          <div class="fg"><label class="fl">GST number</label><input type="text" id="acGst" value="${esc(c.gstNumber || '')}" maxlength="15" placeholder="e.g. 22AAAAA0000A1Z5"></div></div>
      </div>
      <div class="acm-foot">
        <button class="btn-sm-ghost" onclick="document.getElementById('clientModal').remove()">Cancel</button>
        <button class="btn-sm" onclick="saveClient(${isEdit ? idx : -1})">${isEdit ? 'Update' : 'Add customer'}</button>
      </div>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    if (typeof csel === 'function') {
        csel(document.getElementById('acSalutation'), {
            value: c.salutation || '', placeholder: 'Title',
            items: salItems
        });
        csel(document.getElementById('acCountry'), {
            value: c.country || '', placeholder: 'Select country', searchable: true,
            items: typeof OB_COUNTRIES !== 'undefined' ? OB_COUNTRIES : [],
            onChange: (val) => { initStateDropdown(val, c.state || ''); }
        });
        initStateDropdown(c.country || '', c.state || '');
    }
    lucide.createIcons();
}

function initStateDropdown(country, val) {
    const el = document.getElementById('acState');
    if (!el || typeof csel !== 'function') return;
    el.innerHTML = '';
    if (country === 'IN') {
        csel(el, { value: val, placeholder: 'Select state', searchable: true, items: INDIAN_STATES });
    } else {
        el.innerHTML = `<input type="text" id="acStateInput" value="${esc(val)}" placeholder="State / Province">`;
    }
}

function saveClient(idx) {
    const type = document.querySelector('input[name="acType"]:checked')?.value || 'business';
    const firstName = document.getElementById('acFirstName')?.value?.trim() || '';
    const lastName = document.getElementById('acLastName')?.value?.trim() || '';
    const companyName = document.getElementById('acCompanyName')?.value?.trim() || '';
    const displayName = document.getElementById('acDisplayName')?.value?.trim() || '';
    const fullName = (firstName + ' ' + lastName).trim();
    const autoDisplay = type === 'individual' ? fullName : (companyName || fullName);
    const stateEl = document.getElementById('acState');
    const stateVal = stateEl ? (typeof cselGetValue === 'function' ? cselGetValue(stateEl) : '') : '';
    const stateInputEl = document.getElementById('acStateInput');
    const state = stateVal || (stateInputEl ? stateInputEl.value.trim() : '');
    const countryEl = document.getElementById('acCountry');
    const country = countryEl && typeof cselGetValue === 'function' ? cselGetValue(countryEl) : '';
    if (!autoDisplay && !displayName) { toast('Name or company is required', 'error'); return; }
    const c = {
        customerType: type, salutation: (typeof cselGetValue === 'function' ? cselGetValue(document.getElementById('acSalutation')) : '') || '',
        firstName, lastName, companyName, displayName: displayName || autoDisplay, name: displayName || autoDisplay,
        email: document.getElementById('acEmail')?.value?.trim() || '',
        workPhone: document.getElementById('acWorkPhone')?.value?.trim() || '',
        mobile: document.getElementById('acMobile')?.value?.trim() || '',
        phone: document.getElementById('acWorkPhone')?.value?.trim() || '',
        attention: document.getElementById('acAttention')?.value?.trim() || '',
        country, state, street1: document.getElementById('acStreet1')?.value?.trim() || '',
        street2: document.getElementById('acStreet2')?.value?.trim() || '',
        city: document.getElementById('acCity')?.value?.trim() || '',
        pinCode: document.getElementById('acPinCode')?.value?.trim() || '',
        gstNumber: document.getElementById('acGst')?.value?.trim() || ''
    };
    if (idx >= 0) { c.id = CLIENTS[idx].id; CLIENTS[idx] = c; }
    else {
        if (typeof enforceLimit === 'function' && !enforceLimit('clients')) return;
        c.id = uid(); CLIENTS.push(c);
    }
    saveClients(); document.getElementById('clientModal')?.remove();
    renderClients(); toast(idx >= 0 ? 'Customer updated' : 'Customer added');
}

function editClient(i) { openAddClient(i); }

function delClient(i) {
    const c = CLIENTS[i]; if (!c) return;
    const clientName = c.displayName || c.name || 'this customer';
    const propCount = DB.filter(p => matchClient(p, c)).length;
    const msg = propCount > 0 ? `Delete ${clientName}? ${propCount} proposal(s) reference this customer.` : `Delete ${clientName}?`;
    confirmDialog(msg, () => {
        CLIENTS.splice(i, 1); saveClients();
        renderClients(); toast('Customer deleted');
    }, { title: 'Delete customer', confirmText: 'Delete' });
}

function showClientPicker() {
    if (!CLIENTS.length) { toast('No saved customers. Add one in the Customers tab.'); return; }
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'cpModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    const items = CLIENTS.map((c, i) => {
        const name = c.displayName || c.name || '';
        return `<div class="cp-item" role="button" tabindex="0" onclick="pickClient(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}"><span class="cp-item-name">${esc(name)}</span><span class="cp-item-email">${esc(c.email || '')}</span></div>`;
    }).join('');
    wrap.innerHTML = `<div class="modal modal-sm" onclick="event.stopPropagation()"><div class="modal-t">Select customer</div><div class="modal-d">Pick a saved customer to auto-fill</div><div style="max-height:250px;overflow-y:auto;display:flex;flex-direction:column;gap:3px">${items}</div><div class="modal-foot"><button class="btn-sm-outline" onclick="document.getElementById('cpModal').remove()">Cancel</button></div></div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
}

function pickClient(i) {
    const c = CLIENTS[i]; if (!c) return;
    const name = c.displayName || c.companyName || c.name || '';
    const contact = c.salutation ? c.salutation + ' ' : '';
    const fullContact = contact + ((c.firstName || '') + ' ' + (c.lastName || '')).trim() || c.contact || '';
    document.getElementById('fCNa').value = name;
    document.getElementById('fCCo').value = fullContact;
    document.getElementById('fCEm').value = c.email || '';
    document.getElementById('fCPh').value = c.workPhone || c.mobile || c.phone || '';
    document.getElementById('cpModal')?.remove();
    dirty(); toast('Customer filled');
}
