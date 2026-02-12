// ════════════════════════════════════════
// CLIENT DATABASE
// ════════════════════════════════════════

/* exported INDIAN_STATES, SALUTATIONS, matchClient, openAddClient, initStateDropdown, saveClient, editClient, delClient, showClientPicker, pickClient, showClientInsight, buildClientHistory, createProposalForClient */

const INDIAN_STATES = [
    { value: 'AN', label: 'Andaman & Nicobar' }, { value: 'AP', label: 'Andhra Pradesh' }, { value: 'AR', label: 'Arunachal Pradesh' },
    { value: 'AS', label: 'Assam' }, { value: 'BR', label: 'Bihar' }, { value: 'CH', label: 'Chandigarh' },
    { value: 'CT', label: 'Chhattisgarh' }, { value: 'DL', label: 'Delhi' }, { value: 'GA', label: 'Goa' },
    { value: 'GJ', label: 'Gujarat' }, { value: 'HR', label: 'Haryana' }, { value: 'HP', label: 'Himachal Pradesh' },
    { value: 'JK', label: 'Jammu & Kashmir' }, { value: 'JH', label: 'Jharkhand' }, { value: 'KA', label: 'Karnataka' },
    { value: 'KL', label: 'Kerala' }, { value: 'LA', label: 'Ladakh' }, { value: 'MP', label: 'Madhya Pradesh' },
    { value: 'MH', label: 'Maharashtra' }, { value: 'MN', label: 'Manipur' }, { value: 'ML', label: 'Meghalaya' },
    { value: 'MZ', label: 'Mizoram' }, { value: 'NL', label: 'Nagaland' }, { value: 'OD', label: 'Odisha' },
    { value: 'PB', label: 'Punjab' }, { value: 'RJ', label: 'Rajasthan' }, { value: 'SK', label: 'Sikkim' },
    { value: 'TN', label: 'Tamil Nadu' }, { value: 'TG', label: 'Telangana' }, { value: 'TR', label: 'Tripura' },
    { value: 'UP', label: 'Uttar Pradesh' }, { value: 'UK', label: 'Uttarakhand' }, { value: 'WB', label: 'West Bengal' }
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

    const cards = CLIENTS.map((c, i) => {
        const displayName = c.displayName || c.companyName || ((c.firstName || '') + ' ' + (c.lastName || '')).trim() || c.name || 'Unnamed';
        const ini = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const propCount = DB.filter(p => matchClient(p, c)).length;
        const totalVal = DB.filter(p => matchClient(p, c)).reduce((s, p) => s + (p.lineItems || []).reduce((a, it) => a + (it.qty || 0) * (it.rate || 0), 0), 0);
        const email = c.email || '';
        const type = c.customerType || 'business';
        return `<div class="client-card" role="button" tabindex="0" onclick="showClientInsight(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">
      <div class="cc-head">
        <div class="cc-avi" style="background:var(--blue-bg);color:var(--blue)">${ini}</div>
        <div>
          <div class="cc-name">${esc(displayName)}</div>
          <div class="cc-email">${esc(email)}${type === 'individual' ? '' : c.companyName ? ' · ' + esc(c.companyName) : ''}</div>
        </div>
        <div class="cc-actions">
          <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();editClient(${i})" data-tooltip="Edit" data-side="bottom" data-align="center"><i data-lucide="pencil"></i></button>
          <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();delClient(${i})" data-tooltip="Delete" data-side="bottom" data-align="center"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <div class="cc-stats">
        <div class="cc-stat"><strong>${propCount}</strong> proposals</div>
        <div class="cc-stat"><strong>${fmtCur(totalVal, DB.find(p => matchClient(p, c))?.currency || defaultCurrency())}</strong> total value</div>
      </div>
    </div>`;
    }).join('');

    body.innerHTML = `<div class="client-grid">${cards}</div>`;
    const cntEl = document.getElementById('clientCnt');
    if (cntEl) cntEl.textContent = CLIENTS.length;
    lucide.createIcons();
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
    const salOpts = SALUTATIONS.map(s => `<option value="${s}"${c.salutation === s ? ' selected' : ''}>${s}</option>`).join('');
    wrap.innerHTML = `<div class="modal" style="max-width:560px" onclick="event.stopPropagation()">
    <div class="modal-t">${isEdit ? 'Edit' : 'Add'} client</div>
    <div class="modal-d">Complete client details for proposals and invoices</div>
    <div class="fg" style="margin-bottom:12px">
      <label class="fl">Customer type</label>
      <div style="display:flex;gap:8px">
        <label class="toggle-row" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:var(--r-pill);cursor:pointer;text-align:center;font-size:14px;transition:all var(--t)"><input type="radio" name="acType" value="business" ${(c.customerType || 'business') === 'business' ? 'checked' : ''} style="display:none" onchange="document.getElementById('acCompanyRow').style.display=''"> Business</label>
        <label class="toggle-row" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:var(--r-pill);cursor:pointer;text-align:center;font-size:14px;transition:all var(--t)"><input type="radio" name="acType" value="individual" ${c.customerType === 'individual' ? 'checked' : ''} style="display:none" onchange="document.getElementById('acCompanyRow').style.display='none'"> Individual</label>
      </div>
    </div>
    <div class="fg" style="margin-bottom:12px"><label class="fl">Primary contact</label>
      <div style="display:flex;gap:8px">
        <select id="acSalutation" style="width:80px;flex-shrink:0">${salOpts}<option value="">None</option></select>
        <input type="text" id="acFirstName" value="${esc(c.firstName || '')}" placeholder="First name" style="flex:1">
        <input type="text" id="acLastName" value="${esc(c.lastName || '')}" placeholder="Last name" style="flex:1">
      </div>
    </div>
    <div class="fg" id="acCompanyRow" style="${c.customerType === 'individual' ? 'display:none;' : ''}margin-bottom:12px"><label class="fl">Company name</label><input type="text" id="acCompanyName" value="${esc(c.companyName || c.name || '')}"></div>
    <div class="fg" style="margin-bottom:12px"><label class="fl">Display name</label><input type="text" id="acDisplayName" value="${esc(c.displayName || '')}" placeholder="Auto-generated if blank"></div>
    <div class="fg" style="margin-bottom:12px"><label class="fl">Email address</label><input type="email" id="acEmail" value="${esc(c.email || '')}"></div>
    <div class="fr" style="margin-bottom:12px">
      <div class="fg"><label class="fl">Work phone</label><input type="tel" id="acWorkPhone" value="${esc(c.workPhone || c.phone || '')}"></div>
      <div class="fg"><label class="fl">Mobile</label><input type="tel" id="acMobile" value="${esc(c.mobile || '')}"></div>
    </div>
    <div class="fg" style="margin-bottom:12px"><label class="fl">Attention</label><input type="text" id="acAttention" value="${esc(c.attention || '')}" placeholder="e.g. Accounts Dept"></div>
    <div class="fg" style="margin-bottom:12px"><label class="fl">Country / Region</label><div id="acCountry"></div></div>
    <div class="fg" style="margin-bottom:12px"><label class="fl">Address</label>
      <input type="text" id="acStreet1" value="${esc(c.street1 || '')}" placeholder="Street 1" style="margin-bottom:8px">
      <input type="text" id="acStreet2" value="${esc(c.street2 || '')}" placeholder="Street 2">
    </div>
    <div class="fr" style="margin-bottom:12px">
      <div class="fg"><label class="fl">City</label><input type="text" id="acCity" value="${esc(c.city || '')}"></div>
      <div class="fg"><label class="fl">State</label><div id="acState"></div></div>
    </div>
    <div class="fr" style="margin-bottom:12px">
      <div class="fg"><label class="fl">Pin code</label><input type="text" id="acPinCode" value="${esc(c.pinCode || '')}" maxlength="10"></div>
      <div class="fg"><label class="fl">GST number</label><input type="text" id="acGst" value="${esc(c.gstNumber || '')}" maxlength="15" placeholder="e.g. 22AAAAA0000A1Z5"></div>
    </div>
    <div class="modal-foot">
      <button class="btn-sm-outline" onclick="document.getElementById('clientModal').remove()">Cancel</button>
      <button class="btn-sm" onclick="saveClient(${isEdit ? idx : -1})">${isEdit ? 'Update' : 'Add client'}</button>
    </div>
  </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    // Init country dropdown
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
        customerType: type,
        salutation: document.getElementById('acSalutation')?.value || '',
        firstName, lastName, companyName,
        displayName: displayName || autoDisplay,
        name: displayName || autoDisplay,
        email: document.getElementById('acEmail')?.value?.trim() || '',
        workPhone: document.getElementById('acWorkPhone')?.value?.trim() || '',
        mobile: document.getElementById('acMobile')?.value?.trim() || '',
        phone: document.getElementById('acWorkPhone')?.value?.trim() || '',
        attention: document.getElementById('acAttention')?.value?.trim() || '',
        country, state,
        street1: document.getElementById('acStreet1')?.value?.trim() || '',
        street2: document.getElementById('acStreet2')?.value?.trim() || '',
        city: document.getElementById('acCity')?.value?.trim() || '',
        pinCode: document.getElementById('acPinCode')?.value?.trim() || '',
        gstNumber: document.getElementById('acGst')?.value?.trim() || ''
    };
    if (idx >= 0) { c.id = CLIENTS[idx].id; CLIENTS[idx] = c; }
    else { c.id = uid(); CLIENTS.push(c); }
    saveClients();
    document.getElementById('clientModal')?.remove();
    renderClients();
    toast(idx >= 0 ? 'Client updated' : 'Client added');
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

// Client picker for proposal editor
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
    dirty();
    toast('Client filled');
}

// Client Insights (Phase 3.2)
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

    const body = document.getElementById('bodyScroll');
    document.getElementById('topTitle').textContent = clientName;
    document.getElementById('topRight').innerHTML = `<button class="btn-sm-outline" onclick="renderClients()"><i data-lucide="arrow-left"></i> Back</button><button class="btn-sm" onclick="createProposalForClient(${idx})"><i data-lucide="plus"></i> New proposal</button>`;

    // Build address string
    const addrParts = [c.street1, c.street2, c.city, c.state, c.pinCode].filter(Boolean);
    const addr = addrParts.join(', ');

    body.innerHTML = `
    <div class="ci-header">
        <div class="ci-avi">${ini}</div>
        <div>
            <div class="ci-name">${esc(clientName)}</div>
            <div class="ci-email">${esc(c.email || '')}${c.workPhone ? ' · ' + esc(c.workPhone) : ''}</div>
            ${c.companyName && c.customerType !== 'individual' ? `<div style="font-size:14px;color:var(--text3);margin-top:2px">${esc(c.companyName)}</div>` : ''}
            ${addr ? `<div style="font-size:14px;color:var(--text4);margin-top:2px">${esc(addr)}</div>` : ''}
            ${c.gstNumber ? `<div style="font-size:14px;color:var(--text4);margin-top:2px">GST: ${esc(c.gstNumber)}</div>` : ''}
        </div>
    </div>
    <div class="ci-metrics">
        <div class="ci-metric"><div class="ci-metric-val">${props.length}</div><div class="ci-metric-label">Total</div></div>
        <div class="ci-metric"><div class="ci-metric-val" style="color:var(--green)">${accepted.length}</div><div class="ci-metric-label">Accepted</div></div>
        <div class="ci-metric"><div class="ci-metric-val" style="color:var(--red)">${declined.length}</div><div class="ci-metric-label">Declined</div></div>
        <div class="ci-metric"><div class="ci-metric-val">${fmtCur(totalVal, props[0]?.currency || defaultCurrency())}</div><div class="ci-metric-label">Total value</div></div>
        <div class="ci-metric"><div class="ci-metric-val">${avgDays > 0 ? avgDays + 'd' : '\u2014'}</div><div class="ci-metric-label">Avg response</div></div>
    </div>
    <div style="font-size:14px;font-weight:700;margin-bottom:10px">Proposal history</div>
    ${buildClientHistory(props)}`;
    lucide.createIcons();
}

function buildClientHistory(props) {
    if (!props.length) return '<div class="empty" style="padding:30px"><div class="empty-t">No proposals yet</div><div class="empty-d">Create a proposal for this client to see it here.</div></div>';
    const sorted = [...props].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return '<div class="ci-history">' + sorted.map(p => {
        const val = (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0);
        return `<div class="ci-prop" onclick="loadEditor('${escAttr(p.id)}')">
            <div style="flex:1">
                <div class="ci-prop-title">${esc(p.title || 'Untitled')}</div>
                <div class="ci-prop-meta">${esc(p.number)} · ${fmtDate(p.createdAt)}</div>
            </div>
            <div class="ci-prop-val">${fmtCur(val, p.currency)}</div>
            <span class="badge badge-${p.status}"><span class="badge-dot"></span> ${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span>
        </div>`;
    }).join('') + '</div>';
}

function createProposalForClient(idx) {
    const c = CLIENTS[idx]; if (!c) return;
    const id = uid();
    const num = nextPropNumber();
    const today = new Date().toISOString().split('T')[0];
    const valid = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const clientName = c.displayName || c.companyName || c.name || '';
    const contact = (c.salutation ? c.salutation + ' ' : '') + ((c.firstName || '') + ' ' + (c.lastName || '')).trim();
    const addrParts = [c.street1, c.street2, c.city, c.state, c.pinCode].filter(Boolean);
    const p = {
        id, status: 'draft', title: 'Proposal for ' + clientName, number: num, date: today, validUntil: valid,
        sender: { company: CONFIG?.company || '', email: CONFIG?.email || '', address: CONFIG?.address || '' },
        client: { name: clientName, contact: contact, email: c.email || '', phone: c.workPhone || c.mobile || '', address: addrParts.join(', '), gstNumber: c.gstNumber || '' },
        sections: [], lineItems: [], currency: defaultCurrency(), paymentTerms: '', version: 1, coverPage: false,
        packagesEnabled: false, packages: null, packageFeatures: [], addOns: [], paymentSchedule: [],
        paymentScheduleMode: 'percentage',
        notes: [{ text: 'Proposal created for ' + clientName, time: Date.now(), type: 'system' }],
        createdAt: Date.now()
    };
    DB.unshift(p); persist();
    loadEditor(id);
    toast('Proposal created for ' + clientName);
}
