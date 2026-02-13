// ════════════════════════════════════════
// CUSTOMER DETAIL — Full-page insight + history
// ════════════════════════════════════════

/* exported showClientInsightFull, buildClientHistory, createProposalForClient */

function showClientInsightFull(idx) {
    const c = CLIENTS[idx]; if (!c) return;
    const clientName = c.displayName || c.name || 'Unnamed';
    const props = activeDB().filter(p => matchClient(p, c));
    const accepted = props.filter(p => p.status === 'accepted');
    const declined = props.filter(p => p.status === 'declined');
    const totalVal = props.reduce((s, p) => s + (p.lineItems || []).reduce((a, it) => a + (it.qty || 0) * (it.rate || 0), 0), 0);
    const ini = clientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const cur = props[0]?.currency || defaultCurrency();
    const body = document.getElementById('bodyScroll');
    document.getElementById('topTitle').textContent = clientName;
    document.getElementById('topRight').innerHTML = `<button class="btn-sm-outline" onclick="renderClients()"><i data-lucide="arrow-left"></i> Back</button>`;
    body.innerHTML = `<div class="ci-container">
      <div class="card ci-header-card"><div class="ci-header"><div class="ci-avi">${ini}</div>
        <div class="ci-header-info"><div class="ci-name">${esc(clientName)}</div><div class="ci-email">${esc(c.email || '')}</div></div>
        <div class="ci-header-actions">
          <button class="btn-sm-outline" onclick="editClient(${idx})"><i data-lucide="pencil"></i> Edit</button>
          <button class="btn-sm" onclick="createProposalForClient(${idx})"><i data-lucide="plus"></i> New proposal</button>
        </div></div></div>
      <div class="ci-metric-grid">
        <div class="ci-mc"><div class="ci-mc-label">Total</div><div class="ci-mc-val">${props.length}</div></div>
        <div class="ci-mc"><div class="ci-mc-label">Accepted</div><div class="ci-mc-val" style="color:var(--green)">${accepted.length}</div></div>
        <div class="ci-mc"><div class="ci-mc-label">Declined</div><div class="ci-mc-val" style="color:var(--red)">${declined.length}</div></div>
        <div class="ci-mc"><div class="ci-mc-label">Value</div><div class="ci-mc-val">${fmtCur(totalVal, cur)}</div></div>
      </div>
      <div class="ci-history-section"><div class="ci-history-title">Proposal history</div>${buildClientHistory(props)}</div>
    </div>`;
    lucide.createIcons();
}

function buildClientHistory(props) {
    if (!props.length) return '<div class="empty" style="padding:30px"><div class="empty-t">No proposals yet</div></div>';
    const sorted = [...props].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const rows = sorted.map(p => {
        const val = (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0);
        const st = p.status, statusLabel = st.charAt(0).toUpperCase() + st.slice(1);
        return `<tr class="nt-row" onclick="loadEditor('${escAttr(p.id)}')">
            <td class="nt-cell"><span class="nt-title-text">${esc(p.title || 'Untitled')}</span></td>
            <td class="nt-cell nt-cell-status"><span class="badge badge-${st}"><span class="badge-dot"></span> ${statusLabel}</span></td>
            <td class="nt-cell nt-cell-value mono">${fmtCur(val, p.currency)}</td>
            <td class="nt-cell nt-cell-date">${fmtDate(p.createdAt)}</td></tr>`;
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
