// ════════════════════════════════════════
// CLIENT DATABASE
// ════════════════════════════════════════

function renderClients() {
    CUR = null;
    document.getElementById('topTitle').textContent = 'Clients';
    document.getElementById('topRight').innerHTML = '<button class="btn-sm" onclick="openAddClient()"><i data-lucide="user-plus"></i> Add Client</button>';
    const body = document.getElementById('bodyScroll');

    if (!CLIENTS.length) {
        body.innerHTML = `<div class="empty"><div class="empty-icon"><i data-lucide="users"></i></div><div class="empty-t">No clients yet</div><div class="empty-d">Add clients to quickly fill proposal details. They'll appear when creating new proposals.</div><button class="btn-sm" onclick="openAddClient()"><i data-lucide="user-plus"></i> Add Client</button></div>`;
        lucide.createIcons(); return;
    }

    let cards = CLIENTS.map((c, i) => {
        const ini = (c.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const propCount = DB.filter(p => p.client.name === c.name || p.client.email === c.email).length;
        const totalVal = DB.filter(p => p.client.name === c.name || p.client.email === c.email).reduce((s, p) => s + (p.lineItems || []).reduce((a, it) => a + (it.qty || 0) * (it.rate || 0), 0), 0);
        return `<div class="client-card" onclick="showClientInsight(${i})">
      <div class="cc-head">
        <div class="cc-avi" style="background:var(--blue-bg);color:var(--blue)">${ini}</div>
        <div><div class="cc-name">${esc(c.name)}</div><div class="cc-email">${esc(c.email)}</div></div>
        <div class="cc-actions">
          <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();editClient(${i})" data-tooltip="Edit" data-side="bottom" data-align="center"><i data-lucide="pencil"></i></button>
          <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();delClient(${i})" data-tooltip="Delete" data-side="bottom" data-align="center"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <div class="cc-stats">
        <div class="cc-stat"><strong>${propCount}</strong> proposals</div>
        <div class="cc-stat"><strong>${fmtCur(totalVal, DB.find(p => p.client.name === c.name || p.client.email === c.email)?.currency || defaultCurrency())}</strong> total value</div>
      </div>
    </div>`;
    }).join('');

    body.innerHTML = `<div class="client-grid">${cards}</div>`;
    const cntEl = document.getElementById('clientCnt');
    if (cntEl) cntEl.textContent = CLIENTS.length;
    lucide.createIcons();
}

function openAddClient(idx) {
    const isEdit = idx !== undefined;
    const c = isEdit ? CLIENTS[idx] : { name: '', contact: '', email: '', phone: '' };
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'clientModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    wrap.innerHTML = `<div class="modal modal-sm" onclick="event.stopPropagation()">
    <div class="modal-t">${isEdit ? 'Edit' : 'Add'} Client</div>
    <div class="modal-d">Save client details for quick access</div>
    <div class="fg"><label class="fl">Company / Name</label><input type="text" id="acName" value="${esc(c.name)}"></div>
    <div class="fr">
      <div class="fg"><label class="fl">Contact Person</label><input type="text" id="acContact" value="${esc(c.contact)}"></div>
      <div class="fg"><label class="fl">Email</label><input type="email" id="acEmail" value="${esc(c.email)}"></div>
    </div>
    <div class="fg"><label class="fl">Phone</label><input type="tel" id="acPhone" value="${esc(c.phone)}"></div>
    <div class="modal-foot">
      <button class="btn-sm-outline" onclick="document.getElementById('clientModal').remove()">Cancel</button>
      <button class="btn-sm" onclick="saveClient(${isEdit ? idx : -1})">${isEdit ? 'Update' : 'Add Client'}</button>
    </div>
  </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
}

function saveClient(idx) {
    const c = {
        name: document.getElementById('acName').value,
        contact: document.getElementById('acContact').value,
        email: document.getElementById('acEmail').value,
        phone: document.getElementById('acPhone').value
    };
    if (!c.name) { toast('Name is required'); return; }
    if (idx >= 0) CLIENTS[idx] = c;
    else CLIENTS.push(c);
    saveClients();
    document.getElementById('clientModal')?.remove();
    renderClients();
    toast(idx >= 0 ? 'Client updated' : 'Client added');
}

function editClient(i) { openAddClient(i); }

function delClient(i) {
    confirmDialog('Delete this client?', () => {
        CLIENTS.splice(i, 1); saveClients(); renderClients(); toast('Client deleted');
    }, { title: 'Delete Client', confirmText: 'Delete' });
}

// Client picker for proposal editor
function showClientPicker() {
    if (!CLIENTS.length) { toast('No saved clients. Add one in the Clients tab.'); return; }
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'cpModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    let items = CLIENTS.map((c, i) => `<div class="cp-item" onclick="pickClient(${i})"><span class="cp-item-name">${esc(c.name)}</span><span class="cp-item-email">${esc(c.email)}</span></div>`).join('');
    wrap.innerHTML = `<div class="modal modal-sm" onclick="event.stopPropagation()"><div class="modal-t">Select Client</div><div class="modal-d">Pick a saved client to auto-fill</div><div style="max-height:250px;overflow-y:auto;display:flex;flex-direction:column;gap:3px">${items}</div><div class="modal-foot"><button class="btn-sm-outline" onclick="document.getElementById('cpModal').remove()">Cancel</button></div></div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
}

function pickClient(i) {
    const c = CLIENTS[i]; if (!c) return;
    document.getElementById('fCNa').value = c.name || '';
    document.getElementById('fCCo').value = c.contact || '';
    document.getElementById('fCEm').value = c.email || '';
    document.getElementById('fCPh').value = c.phone || '';
    document.getElementById('cpModal')?.remove();
    dirty();
    toast('Client filled');
}

// Client Insights (Phase 3.2)
function showClientInsight(idx) {
    const c = CLIENTS[idx]; if (!c) return;
    const props = activeDB().filter(p => p.client.name === c.name || p.client.email === c.email);
    const accepted = props.filter(p => p.status === 'accepted');
    const declined = props.filter(p => p.status === 'declined');
    const totalVal = props.reduce((s, p) => s + (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0), 0);
    const closedTimes = accepted.filter(p => p.clientResponse?.respondedAt && p.createdAt)
        .map(p => Math.round((p.clientResponse.respondedAt - p.createdAt) / 86400000));
    const avgDays = closedTimes.length ? Math.round(closedTimes.reduce((a, b) => a + b, 0) / closedTimes.length) : 0;
    const ini = (c.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const body = document.getElementById('bodyScroll');
    document.getElementById('topTitle').textContent = c.name;
    document.getElementById('topRight').innerHTML = `<button class="btn-sm-outline" onclick="renderClients()"><i data-lucide="arrow-left"></i> Back</button><button class="btn-sm" onclick="createProposalForClient(${idx})"><i data-lucide="plus"></i> New Proposal</button>`;

    body.innerHTML = `
    <div class="ci-header">
        <div class="ci-avi">${ini}</div>
        <div>
            <div class="ci-name">${esc(c.name)}</div>
            <div class="ci-email">${esc(c.email)}${c.phone ? ' · ' + esc(c.phone) : ''}</div>
        </div>
    </div>
    <div class="ci-metrics">
        <div class="ci-metric"><div class="ci-metric-val">${props.length}</div><div class="ci-metric-label">Total</div></div>
        <div class="ci-metric"><div class="ci-metric-val" style="color:var(--green)">${accepted.length}</div><div class="ci-metric-label">Accepted</div></div>
        <div class="ci-metric"><div class="ci-metric-val" style="color:var(--red)">${declined.length}</div><div class="ci-metric-label">Declined</div></div>
        <div class="ci-metric"><div class="ci-metric-val">${fmtCur(totalVal, props[0]?.currency || defaultCurrency())}</div><div class="ci-metric-label">Total Value</div></div>
        <div class="ci-metric"><div class="ci-metric-val">${avgDays > 0 ? avgDays + 'd' : '—'}</div><div class="ci-metric-label">Avg Response</div></div>
    </div>
    <div style="font-size:14px;font-weight:700;margin-bottom:10px">Proposal History</div>
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
            <span class="badge badge-${p.status}" style="font-size:10px;padding:2px 7px"><span class="badge-dot" style="width:5px;height:5px"></span> ${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span>
        </div>`;
    }).join('') + '</div>';
}

function createProposalForClient(idx) {
    const c = CLIENTS[idx]; if (!c) return;
    const id = uid();
    const existingNums = DB.map(p => { const m = (p.number || '').match(/PROP-(\d+)/); return m ? parseInt(m[1]) : 0; });
    const num = 'PROP-' + String((existingNums.length ? Math.max(...existingNums) : 0) + 1).padStart(3, '0');
    const today = new Date().toISOString().split('T')[0];
    const valid = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const p = {
        id, status: 'draft', title: 'Proposal for ' + c.name, number: num, date: today, validUntil: valid,
        sender: { company: CONFIG?.company || '', email: CONFIG?.email || '', address: CONFIG?.address || '' },
        client: { name: c.name || '', contact: c.contact || '', email: c.email || '', phone: c.phone || '' },
        sections: [], lineItems: [], currency: defaultCurrency(), paymentTerms: '', version: 1, coverPage: false,
        packagesEnabled: false, packages: null, packageFeatures: [], addOns: [], paymentSchedule: [],
        paymentScheduleMode: 'percentage',
        notes: [{ text: 'Proposal created for ' + c.name, time: Date.now(), type: 'system' }],
        createdAt: Date.now()
    };
    DB.unshift(p); persist();
    loadEditor(id);
    toast('Proposal created for ' + c.name);
}
