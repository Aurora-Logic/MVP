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
    const _pending = props.filter(p => p.status === 'sent');
    const totalVal = props.reduce((s, p) => s + (p.lineItems || []).reduce((a, it) => a + (it.qty || 0) * (it.rate || 0), 0), 0);
    const ini = clientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const cur = props[0]?.currency || defaultCurrency();
    const winRate = props.length ? Math.round(accepted.length / props.length * 100) : 0;
    const body = document.getElementById('bodyScroll');
    document.getElementById('topTitle').textContent = clientName;
    document.getElementById('topRight').innerHTML = `<button class="btn-sm-outline" onclick="renderClients()"><i data-lucide="arrow-left"></i> Back</button>`;

    // Contact info
    const contact = ((c.salutation ? c.salutation + ' ' : '') + ((c.firstName || '') + ' ' + (c.lastName || '')).trim()).trim();
    const phone = c.workPhone || c.mobile || '';
    const addrParts = [c.street1, c.street2, c.city, c.state, c.pinCode].filter(Boolean);
    const addr = addrParts.join(', ');
    const typeBadge = (c.customerType || 'business') === 'business'
        ? '<span class="cl-card-badge">Business</span>'
        : '<span class="cl-card-badge cl-card-badge-ind">Individual</span>';

    const contactRows = [];
    if (contact) contactRows.push(`<div class="ci-info-row"><i data-lucide="user" style="width:14px;height:14px;color:var(--text4)"></i><span>${esc(contact)}</span></div>`);
    if (c.email) contactRows.push(`<div class="ci-info-row"><i data-lucide="mail" style="width:14px;height:14px;color:var(--text4)"></i><span>${esc(c.email)}</span></div>`);
    if (phone) contactRows.push(`<div class="ci-info-row"><i data-lucide="phone" style="width:14px;height:14px;color:var(--text4)"></i><span>${esc(phone)}</span></div>`);
    if (addr) contactRows.push(`<div class="ci-info-row"><i data-lucide="map-pin" style="width:14px;height:14px;color:var(--text4)"></i><span>${esc(addr)}</span></div>`);
    if (c.gstNumber) contactRows.push(`<div class="ci-info-row"><i data-lucide="hash" style="width:14px;height:14px;color:var(--text4)"></i><span>GST: ${esc(c.gstNumber)}</span></div>`);

    body.innerHTML = `<div class="ci-container">
      <div class="card ci-header-card"><div class="ci-header"><div class="ci-avi">${ini}</div>
        <div class="ci-header-info"><div style="display:flex;align-items:center;gap:8px"><div class="ci-name">${esc(clientName)}</div>${typeBadge}</div>
          ${contactRows.length ? `<div class="ci-info-list">${contactRows.join('')}</div>` : ''}
        </div>
        <div class="ci-header-actions">
          <button class="btn-sm-outline" onclick="editClient(${idx})"><i data-lucide="pencil"></i> Edit</button>
          <button class="btn-sm" onclick="createProposalForClient(${idx})"><i data-lucide="plus"></i> New proposal</button>
        </div></div></div>
      <div class="ci-metric-grid">
        <div class="ci-mc ci-mc-total"><div class="ci-mc-label">Total proposals</div><div class="ci-mc-val">${props.length}</div></div>
        <div class="ci-mc ci-mc-accepted"><div class="ci-mc-label">Accepted</div><div class="ci-mc-val">${accepted.length}</div></div>
        <div class="ci-mc ci-mc-declined"><div class="ci-mc-label">Declined</div><div class="ci-mc-val">${declined.length}</div></div>
        <div class="ci-mc ci-mc-value"><div class="ci-mc-label">Total value</div><div class="ci-mc-val">${fmtCur(totalVal, cur)}</div></div>
        <div class="ci-mc ci-mc-response"><div class="ci-mc-label">Win rate</div><div class="ci-mc-val">${winRate}%</div></div>
      </div>
      <div class="ci-history-section">
        <div class="ci-history-title">Proposal history</div>
        ${buildClientHistory(props)}
      </div>
    </div>`;
    lucide.createIcons();
}

function buildClientHistory(props) {
    if (!props.length) return '<div class="card" style="padding:40px;text-align:center"><div class="empty-t">No proposals yet</div><div class="empty-d">Create a proposal for this customer to see it here.</div></div>';
    const sorted = [...props].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const rows = sorted.map(p => {
        const val = (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0);
        const st = p.status, statusLabel = st.charAt(0).toUpperCase() + st.slice(1);
        return `<tr class="nt-row" onclick="loadEditor('${escAttr(p.id)}')">
            <td class="nt-cell"><span class="nt-title-text">${esc(p.title || 'Untitled')}</span></td>
            <td class="nt-cell nt-cell-status"><span class="badge badge-${st}"><i data-lucide="${statusIcon(st)}" style="width:12px;height:12px"></i> ${statusLabel}</span></td>
            <td class="nt-cell nt-cell-value mono">${fmtCur(val, p.currency)}</td>
            <td class="nt-cell nt-cell-date">${fmtDate(p.createdAt)}</td></tr>`;
    }).join('');
    return `<div class="nt-wrap"><table class="nt-table"><thead><tr class="nt-head">
      <th class="nt-th">Title</th><th class="nt-th nt-th-status">Status</th><th class="nt-th nt-th-value">Value</th><th class="nt-th nt-th-date">Date</th>
    </tr></thead><tbody>${rows}</tbody></table></div>`;
}

function createProposalForClient(idx) {
    if (typeof openCreateDrawer === 'function') openCreateDrawer(idx);
    else navigate('/proposals/new?client=' + idx);
}
