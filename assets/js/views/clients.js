// ════════════════════════════════════════
// CLIENT DATABASE
// ════════════════════════════════════════

/* exported INDIAN_STATES, SALUTATIONS, matchClient, openAddClient, initStateDropdown, saveClient, editClient, delClient, showClientPicker, pickClient, showClientInsight, buildClientHistory, createProposalForClient, filterClients */

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

function renderClients() {
    CUR = null;
    document.getElementById('topTitle').textContent = 'Clients';
    document.getElementById('topRight').innerHTML = '<button class="btn-sm" onclick="openAddClient()"><i data-lucide="user-plus"></i> Add client</button>';
    const body = document.getElementById('bodyScroll');
    if (!CLIENTS.length) {
        body.innerHTML = `<div class="empty" style="padding:60px 20px">
            <dotlottie-wc src="https://assets-v2.lottiefiles.com/a/421db1cc-118a-11ee-aed5-fb6b0052b9aa/1KyamM2lee.lottie" autoplay loop speed="0.8" style="width:200px;height:200px;margin:0 auto"></dotlottie-wc>
            <div class="empty-t">Build your client database</div>
            <div class="empty-d">Save client details once, reuse on every proposal. No more retyping names and emails.</div>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:16px">
                <button class="btn-sm" onclick="openAddClient()"><i data-lucide="user-plus"></i> Add client</button>
            </div>
            <div style="display:flex;gap:24px;justify-content:center;margin-top:32px;color:var(--text4);font-size:14px">
                <span><i data-lucide="zap" style="width:14px;height:14px;vertical-align:-2px"></i> Auto-fill proposals</span>
                <span><i data-lucide="bar-chart-3" style="width:14px;height:14px;vertical-align:-2px"></i> Track per-client stats</span>
                <span><i data-lucide="repeat" style="width:14px;height:14px;vertical-align:-2px"></i> Reuse across proposals</span>
            </div>
        </div>`;
        lucide.createIcons(); return;
    }
    // Compute metrics
    let totalValue = 0, wonProps = 0, decidedProps = 0;
    const cur = defaultCurrency();
    const clientData = CLIENTS.map((c, i) => {
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
        return { c, i, displayName, ini, props: props.length, val, last, email: c.email || '' };
    });
    const avgValue = CLIENTS.length ? totalValue / CLIENTS.length : 0;
    const winRate = decidedProps > 0 ? Math.round(wonProps / decidedProps * 100) : 0;

    const rows = clientData.map(d => `<tr class="nt-row" onclick="showClientInsight(${d.i})">
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

    body.innerHTML = `<div class="cl-container">
      <div class="cl-metric-grid">
        <div class="cl-metric-card"><div class="cl-metric-label">Total clients</div><div class="cl-metric-value">${CLIENTS.length}</div></div>
        <div class="cl-metric-card"><div class="cl-metric-label">Total value</div><div class="cl-metric-value">${fmtCur(totalValue, cur)}</div></div>
        <div class="cl-metric-card"><div class="cl-metric-label">Avg per client</div><div class="cl-metric-value">${fmtCur(avgValue, cur)}</div></div>
        <div class="cl-metric-card"><div class="cl-metric-label">Win rate</div><div class="cl-metric-value">${winRate}%</div></div>
      </div>
      <div class="cl-toolbar">
        <div class="cl-search-wrap"><i data-lucide="search"></i><input type="text" class="cl-search" id="clientSearch" placeholder="Search clients..." oninput="filterClients()"></div>
        <span class="cl-count">${CLIENTS.length} client${CLIENTS.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="nt-wrap"><table class="nt-table"><thead><tr class="nt-head">
        <th class="nt-th">Client</th><th class="nt-th cl-th-email">Email</th><th class="nt-th">Proposals</th><th class="nt-th nt-th-value">Value</th><th class="nt-th nt-th-date">Last active</th><th class="nt-th nt-th-actions"></th>
      </tr></thead><tbody id="clientTable">${rows}</tbody></table></div>
    </div>`;
    lucide.createIcons();
}

function filterClients() {
    const q = (document.getElementById('clientSearch')?.value || '').toLowerCase().trim();
    document.querySelectorAll('#clientTable .nt-row').forEach(row => {
        row.style.display = q && !row.textContent.toLowerCase().includes(q) ? 'none' : '';
    });
}

function matchClient(p, c) {
    const clientName = c.displayName || c.companyName || ((c.firstName || '') + ' ' + (c.lastName || '')).trim() || c.name || '';
    return p.client?.name === clientName || p.client?.email === c.email;
}

function openAddClient(idx) {
    const isEdit = idx !== undefined;
    const c = isEdit ? CLIENTS[idx] : {};
    const clientName = isEdit ? (c.displayName || c.name || 'Edit client') : 'Add client';
    const body = document.getElementById('bodyScroll');
    document.getElementById('topTitle').textContent = clientName;
    document.getElementById('topRight').innerHTML = `<div style="display:flex;gap:8px">
      <button class="btn-sm-outline" onclick="renderClients()"><i data-lucide="arrow-left"></i> Back</button>
      <button class="btn-sm" onclick="saveClient(${isEdit ? idx : -1})"><i data-lucide="check"></i> ${isEdit ? 'Update' : 'Save'}</button></div>`;
    const salOpts = SALUTATIONS.map(s => `<option value="${s}"${c.salutation === s ? ' selected' : ''}>${s}</option>`).join('');
    const isBiz = (c.customerType || 'business') === 'business';
    body.innerHTML = `<div class="acm-container">
      <div class="card card-p acm-card">
        <div class="set-head"><div class="set-head-icon" style="background:#007AFF18;color:#007AFF"><i data-lucide="user-plus"></i></div><div><div class="set-head-t">${isEdit ? 'Edit' : 'New'} client</div><div class="set-head-d">Complete client details for proposals and invoices</div></div></div>
        <div class="acm-type-toggle">
          <button class="filter-tab${isBiz ? ' on' : ''}" type="button" onclick="this.parentElement.querySelectorAll('.filter-tab').forEach(b=>b.classList.remove('on'));this.classList.add('on');document.querySelector('input[name=acType][value=business]').checked=true;document.getElementById('acCompanyRow').style.display=''">Business</button>
          <button class="filter-tab${!isBiz ? ' on' : ''}" type="button" onclick="this.parentElement.querySelectorAll('.filter-tab').forEach(b=>b.classList.remove('on'));this.classList.add('on');document.querySelector('input[name=acType][value=individual]').checked=true;document.getElementById('acCompanyRow').style.display='none'">Individual</button>
          <input type="radio" name="acType" value="business" ${isBiz ? 'checked' : ''} style="display:none">
          <input type="radio" name="acType" value="individual" ${!isBiz ? 'checked' : ''} style="display:none">
        </div>
      </div>
      <div class="card card-p acm-card">
        <div class="acm-section-label">Contact details</div>
        <div class="fg"><label class="fl">Primary contact</label>
          <div style="display:flex;gap:8px"><select id="acSalutation" style="width:80px;flex-shrink:0">${salOpts}<option value="">None</option></select>
            <input type="text" id="acFirstName" value="${esc(c.firstName || '')}" placeholder="First name" style="flex:1">
            <input type="text" id="acLastName" value="${esc(c.lastName || '')}" placeholder="Last name" style="flex:1"></div>
        </div>
        <div class="fg" id="acCompanyRow" style="${!isBiz ? 'display:none;' : ''}"><label class="fl">Company name</label><input type="text" id="acCompanyName" value="${esc(c.companyName || c.name || '')}"></div>
        <div class="fg"><label class="fl">Display name</label><input type="text" id="acDisplayName" value="${esc(c.displayName || '')}" placeholder="Auto-generated if blank"></div>
      </div>
      <div class="card card-p acm-card">
        <div class="acm-section-label">Communication</div>
        <div class="fg"><label class="fl">Email address</label><input type="email" id="acEmail" value="${esc(c.email || '')}"></div>
        <div class="fr"><div class="fg"><label class="fl">Work phone</label><input type="tel" id="acWorkPhone" value="${esc(c.workPhone || c.phone || '')}"></div>
          <div class="fg"><label class="fl">Mobile</label><input type="tel" id="acMobile" value="${esc(c.mobile || '')}"></div></div>
        <div class="fg"><label class="fl">Attention</label><input type="text" id="acAttention" value="${esc(c.attention || '')}" placeholder="e.g. Accounts Dept"></div>
      </div>
      <div class="card card-p acm-card">
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
    </div>`;
    lucide.createIcons();
    if (typeof csel === 'function') {
        csel(document.getElementById('acCountry'), {
            value: c.country || '', placeholder: 'Select country', searchable: true,
            items: typeof OB_COUNTRIES !== 'undefined' ? OB_COUNTRIES : [],
            onChange: (val) => { initStateDropdown(val, c.state || ''); }
        });
        initStateDropdown(c.country || '', c.state || '');
    }
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
        customerType: type, salutation: document.getElementById('acSalutation')?.value || '',
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
    else { c.id = uid(); CLIENTS.push(c); }
    saveClients(); renderClients(); toast(idx >= 0 ? 'Client updated' : 'Client added');
}

function editClient(i) { openAddClient(i); }

function delClient(i) {
    const c = CLIENTS[i]; if (!c) return;
    const clientName = c.displayName || c.name || 'this client';
    const propCount = DB.filter(p => matchClient(p, c)).length;
    const msg = propCount > 0 ? `Delete ${clientName}? ${propCount} proposal(s) reference this client.` : `Delete ${clientName}?`;
    confirmDialog(msg, () => {
        CLIENTS.splice(i, 1); saveClients(); renderClients(); toast('Client deleted');
    }, { title: 'Delete client', confirmText: 'Delete' });
}

function showClientPicker() {
    if (!CLIENTS.length) { toast('No saved clients. Add one in the Clients tab.'); return; }
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'cpModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    const items = CLIENTS.map((c, i) => {
        const name = c.displayName || c.name || '';
        return `<div class="cp-item" role="button" tabindex="0" onclick="pickClient(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}"><span class="cp-item-name">${esc(name)}</span><span class="cp-item-email">${esc(c.email || '')}</span></div>`;
    }).join('');
    wrap.innerHTML = `<div class="modal modal-sm" onclick="event.stopPropagation()"><div class="modal-t">Select client</div><div class="modal-d">Pick a saved client to auto-fill</div><div style="max-height:250px;overflow-y:auto;display:flex;flex-direction:column;gap:3px">${items}</div><div class="modal-foot"><button class="btn-sm-outline" onclick="document.getElementById('cpModal').remove()">Cancel</button></div></div>`;
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
    dirty(); toast('Client filled');
}

function showClientInsight(idx) {
    const c = CLIENTS[idx]; if (!c) return;
    const clientName = c.displayName || c.name || 'Unnamed';
    const props = activeDB().filter(p => matchClient(p, c));
    const accepted = props.filter(p => p.status === 'accepted');
    const declined = props.filter(p => p.status === 'declined');
    const totalVal = props.reduce((s, p) => s + (p.lineItems || []).reduce((a, it) => a + (it.qty || 0) * (it.rate || 0), 0), 0);
    const closedTimes = accepted.filter(p => p.clientResponse?.respondedAt && p.createdAt)
        .map(p => Math.round((p.clientResponse.respondedAt - p.createdAt) / 86400000));
    const avgDays = closedTimes.length ? Math.round(closedTimes.reduce((a, b) => a + b, 0) / closedTimes.length) : 0;
    const ini = clientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const addrParts = [c.street1, c.street2, c.city, c.state, c.pinCode].filter(Boolean);
    const addr = addrParts.join(', ');
    const cur = props[0]?.currency || defaultCurrency();
    const body = document.getElementById('bodyScroll');
    document.getElementById('topTitle').textContent = clientName;
    document.getElementById('topRight').innerHTML = `<button class="btn-sm-outline" onclick="renderClients()"><i data-lucide="arrow-left"></i> Back</button>`;
    body.innerHTML = `<div class="ci-container">
      <div class="card ci-header-card">
        <div class="ci-header">
          <div class="ci-avi">${ini}</div>
          <div class="ci-header-info">
            <div class="ci-name">${esc(clientName)}</div>
            <div class="ci-email">${esc(c.email || '')}${c.workPhone ? ' &middot; ' + esc(c.workPhone) : ''}</div>
            ${c.companyName && c.customerType !== 'individual' ? `<div class="ci-detail">${esc(c.companyName)}</div>` : ''}
            ${addr ? `<div class="ci-detail">${esc(addr)}</div>` : ''}
            ${c.gstNumber ? `<div class="ci-detail">GST: ${esc(c.gstNumber)}</div>` : ''}
          </div>
          <div class="ci-header-actions">
            <button class="btn-sm-outline" onclick="editClient(${idx})"><i data-lucide="pencil"></i> Edit</button>
            <button class="btn-sm" onclick="createProposalForClient(${idx})"><i data-lucide="plus"></i> New proposal</button>
          </div>
        </div>
      </div>
      <div class="ci-metric-grid">
        <div class="ci-mc ci-mc-total"><div class="ci-mc-label">Total proposals</div><div class="ci-mc-val">${props.length}</div></div>
        <div class="ci-mc ci-mc-accepted"><div class="ci-mc-label">Accepted</div><div class="ci-mc-val" style="color:var(--green)">${accepted.length}</div></div>
        <div class="ci-mc ci-mc-declined"><div class="ci-mc-label">Declined</div><div class="ci-mc-val" style="color:var(--red)">${declined.length}</div></div>
        <div class="ci-mc ci-mc-value"><div class="ci-mc-label">Total value</div><div class="ci-mc-val">${fmtCur(totalVal, cur)}</div></div>
        <div class="ci-mc ci-mc-response"><div class="ci-mc-label">Avg response</div><div class="ci-mc-val">${avgDays > 0 ? avgDays + 'd' : '\u2014'}</div></div>
      </div>
      <div class="ci-history-section">
        <div class="ci-history-title">Proposal history</div>
        ${buildClientHistory(props)}
      </div>
    </div>`;
    lucide.createIcons();
}

function buildClientHistory(props) {
    if (!props.length) return '<div class="empty" style="padding:30px"><div class="empty-t">No proposals yet</div><div class="empty-d">Create a proposal for this client to see it here.</div></div>';
    const sorted = [...props].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const rows = sorted.map(p => {
        const val = (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0);
        const st = p.status;
        const statusLabel = st.charAt(0).toUpperCase() + st.slice(1);
        return `<tr class="nt-row" onclick="loadEditor('${escAttr(p.id)}')">
            <td class="nt-cell"><span class="nt-title-text">${esc(p.title || 'Untitled')}</span></td>
            <td class="nt-cell nt-cell-status"><span class="badge badge-${st}"><span class="badge-dot"></span> ${statusLabel}</span></td>
            <td class="nt-cell nt-cell-value mono">${fmtCur(val, p.currency)}</td>
            <td class="nt-cell nt-cell-date">${fmtDate(p.createdAt)}</td>
        </tr>`;
    }).join('');
    return `<div class="nt-wrap"><table class="nt-table"><thead><tr class="nt-head">
      <th class="nt-th">Title</th><th class="nt-th nt-th-status">Status</th><th class="nt-th nt-th-value">Value</th><th class="nt-th nt-th-date">Date</th>
    </tr></thead><tbody>${rows}</tbody></table></div>`;
}

function createProposalForClient(idx) {
    const c = CLIENTS[idx]; if (!c) return;
    const id = uid(), num = nextPropNumber();
    const today = new Date().toISOString().split('T')[0];
    const valid = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const clientName = c.displayName || c.companyName || c.name || '';
    const contact = (c.salutation ? c.salutation + ' ' : '') + ((c.firstName || '') + ' ' + (c.lastName || '')).trim();
    const addrParts = [c.street1, c.street2, c.city, c.state, c.pinCode].filter(Boolean);
    const p = {
        id, status: 'draft', title: 'Proposal for ' + clientName, number: num, date: today, validUntil: valid,
        sender: { company: CONFIG?.company || '', email: CONFIG?.email || '', address: CONFIG?.address || '' },
        client: { name: clientName, contact, email: c.email || '', phone: c.workPhone || c.mobile || '', address: addrParts.join(', '), gstNumber: c.gstNumber || '' },
        sections: [], lineItems: [], currency: defaultCurrency(), paymentTerms: '', version: 1, coverPage: false,
        packagesEnabled: false, packages: null, packageFeatures: [], addOns: [], paymentSchedule: [], paymentScheduleMode: 'percentage',
        notes: [{ text: 'Proposal created for ' + clientName, time: Date.now(), type: 'system' }], createdAt: Date.now()
    };
    DB.unshift(p); persist(); loadEditor(id);
    toast('Proposal created for ' + clientName);
}
