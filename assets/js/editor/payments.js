// ════════════════════════════════════════
// PAYMENTS — Payment Recording & Tracking
// ════════════════════════════════════════

/* exported addPayment, removePayment, updatePaymentSummary, paymentStatusBadge, buildPaymentsReceiptHtml, quickRecordPayment, saveQuickPayment, showPaymentPickerMenu */
const PAYMENT_METHODS = ['Bank', 'UPI', 'Cash', 'Cheque', 'Card', 'Other'];

function paymentTotals(p) {
    const t = (typeof calcTotals === 'function') ? calcTotals(p) : { grand: 0 };
    const amountPaid = (p.payments || []).reduce((s, pay) => s + (pay.amount || 0), 0);
    const balanceDue = Math.max(0, t.grand - amountPaid);
    const status = amountPaid <= 0 ? 'unpaid' : (balanceDue <= 0 ? 'paid' : 'partial');
    return { grand: t.grand, amountPaid, balanceDue, status };
}

function renderPayments(p) {
    const el = document.getElementById('paymentsSection');
    if (!el) return;
    const payments = p.payments || [];
    const pt = paymentTotals(p);
    const c = p.currency || defaultCurrency();
    let rows = '';
    payments.forEach((pay, i) => {
        rows += `<div class="pay-row" data-pay-id="${pay.id || ''}">
            <div class="pay-row-num">${i + 1}</div>
            <div class="pay-row-body">
                <div class="pay-row-top">
                    <input type="text" class="pay-date" data-datepicker id="payDate${i}" data-value="${pay.date || ''}" oninput="dirty()">
                    <input type="number" class="pay-amt" value="${pay.amount || 0}" min="0" step="500" oninput="updatePaymentSummary();dirty()">
                    <div class="pay-method-sel" id="payMethod${i}" data-init-val="${esc(pay.method || 'Bank')}"></div>
                    <button class="btn-sm-icon-ghost" onclick="removePayment(${i})" data-tooltip="Remove" data-side="bottom"><i data-lucide="x"></i></button>
                </div>
                <input type="text" class="pay-note" value="${esc(pay.note || '')}" placeholder="Note (optional)" oninput="dirty()">
            </div>
        </div>`;
    });

    const statusCls = { unpaid: 'declined', partial: 'expired', paid: 'accepted' };
    const statusLabels = { unpaid: 'Unpaid', partial: 'Partially Paid', paid: 'Fully Paid' };

    el.innerHTML = `<div class="card card-p">
        <div class="card-head">
            <div><div class="card-t">Payments received</div><div class="card-d">Record actual payments from client</div></div>
            <div style="display:flex;gap:8px;align-items:center">
                <span class="badge badge-${statusCls[pt.status]}"><span class="badge-dot"></span> ${statusLabels[pt.status]}</span>
                <button class="btn-sm-outline" onclick="addPayment()"><i data-lucide="plus"></i> Record</button>
            </div>
        </div>
        <div id="paymentsBody">${rows || '<div class="ps-empty">No payments recorded yet. Click "Record" to log a payment.</div>'}</div>
        <div id="paymentSummary">${buildPaymentSummaryHtml(pt, c)}</div>
    </div>`;
    lucide.createIcons();
    if (typeof initDatePickers === 'function') initDatePickers();
    if (typeof csel === 'function') {
        el.querySelectorAll('.pay-method-sel').forEach(sel => {
            csel(sel, { value: sel.dataset.initVal || 'Bank', small: true, items: PAYMENT_METHODS.map(m => ({ value: m, label: m })), onChange: () => dirty() });
        });
    }
}

function buildPaymentSummaryHtml(pt, c) {
    if (pt.amountPaid <= 0 && pt.grand <= 0) return '';
    return `<div class="pay-summary">
        <div class="pay-summary-row"><span>Total Amount</span><span class="mono">${fmtCur(pt.grand, c)}</span></div>
        <div class="pay-summary-row"><span>Amount Paid</span><span class="mono" style="color:var(--green)">${fmtCur(pt.amountPaid, c)}</span></div>
        <div class="pay-summary-row pay-summary-balance"><span>Balance Due</span><span class="mono" style="color:${pt.balanceDue > 0 ? 'var(--red)' : 'var(--green)'}">${fmtCur(pt.balanceDue, c)}</span></div>
    </div>`;
}

function addPayment() {
    const p = cur(); if (!p) return;
    if (!p.payments) p.payments = [];
    const today = new Date().toISOString().split('T')[0];
    const pt = paymentTotals(p);
    p.payments.push({
        id: 'pay_' + Date.now(),
        date: today,
        amount: pt.balanceDue > 0 ? pt.balanceDue : 0,
        method: 'Bank',
        note: ''
    });
    dirty();
    renderPayments(p);
}

function removePayment(idx) {
    const p = cur(); if (!p || !p.payments) return;
    const pay = p.payments[idx];
    if (pay && pay.amount > 0) {
        confirmDialog('Remove this payment record?', () => {
            p.payments.splice(idx, 1);
            dirty();
            renderPayments(p);
        }, { title: 'Remove Payment', confirmText: 'Remove', destructive: true });
        return;
    }
    p.payments.splice(idx, 1);
    dirty();
    renderPayments(p);
}

function updatePaymentSummary() {
    const p = cur(); if (!p) return;
    collectPaymentsData(p);
    const c = p.currency || defaultCurrency();
    const pt = paymentTotals(p);
    const el = document.getElementById('paymentSummary');
    if (el) el.innerHTML = buildPaymentSummaryHtml(pt, c);
}

function collectPaymentsData(p) {
    const rows = document.querySelectorAll('.pay-row');
    if (!rows.length && !document.getElementById('paymentsBody')) return;
    p.payments = [];
    rows.forEach(row => {
        p.payments.push({
            id: row.dataset.payId || ('pay_' + Date.now() + Math.random().toString(36).slice(2, 5)),
            date: row.querySelector('.pay-date')?.dataset?.value || row.querySelector('.pay-date')?.value || '',
            amount: Math.max(0, parseFloat(row.querySelector('.pay-amt')?.value) || 0),
            method: (typeof cselGetValue === 'function' ? cselGetValue(row.querySelector('.pay-method-sel')) : row.querySelector('.pay-method')?.value) || 'Bank',
            note: row.querySelector('.pay-note')?.value || ''
        });
    });
}

function paymentStatusBadge(p) {
    if (p.status !== 'accepted') return '';
    const pt = paymentTotals(p);
    const cls = { unpaid: 'declined', partial: 'expired', paid: 'accepted' };
    const labels = { unpaid: 'Unpaid', partial: 'Partial', paid: 'Paid' };
    return `<span class="badge badge-${cls[pt.status]}" style="font-size:10px;padding:2px 8px"><span class="badge-dot"></span> ${labels[pt.status]}</span>`;
}

function buildPaymentsReceiptHtml(p, c, bc) {
    const payments = (p.payments || []).filter(pay => pay.amount > 0);
    if (!payments.length) return '';
    const mono = "'JetBrains Mono',monospace";
    let h = `<div style="margin:20px 0;page-break-inside:avoid;break-inside:avoid"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:${bc};margin-bottom:8px">Payments received</div>`;
    h += '<table style="width:100%;border-collapse:collapse"><thead><tr>';
    h += '<th style="text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;padding:7px 0;border-bottom:1px solid #e4e4e7;color:#a1a1aa">Date</th>';
    h += `<th style="text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;padding:7px 0;border-bottom:1px solid #e4e4e7;color:#a1a1aa">Amount</th>`;
    h += '<th style="text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;padding:7px 8px;border-bottom:1px solid #e4e4e7;color:#a1a1aa">Method</th>';
    h += '<th style="text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;padding:7px 0;border-bottom:1px solid #e4e4e7;color:#a1a1aa">Note</th>';
    h += '</tr></thead><tbody>';
    payments.forEach(pay => {
        h += `<tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:12px">${pay.date ? fmtDate(pay.date) : '\u2014'}</td>`;
        h += `<td style="padding:8px 0;border-bottom:1px solid #f4f4f5;text-align:right;font-family:${mono};font-weight:500">${fmtCur(pay.amount, c)}</td>`;
        h += `<td style="padding:8px 8px;border-bottom:1px solid #f4f4f5;font-size:12px">${esc(pay.method)}</td>`;
        h += `<td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:11px;color:#71717a">${esc(pay.note || '')}</td></tr>`;
    });
    h += '</tbody></table></div>';
    return h;
}

function quickRecordPayment(pid) {
    const p = DB.find(x => x.id === pid);
    if (!p) return;
    const pt = paymentTotals(p);
    const c = p.currency || defaultCurrency();
    const today = new Date().toISOString().split('T')[0];
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal" style="max-width:420px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <div class="modal-t">Record payment</div>
            <button class="btn-sm-icon-ghost" onclick="this.closest('.modal-wrap').remove()"><i data-lucide="x"></i></button>
        </div>
        <div style="margin-bottom:12px;font-size:13px;color:var(--text3)">${esc(p.title || 'Untitled')} — Balance: <strong style="color:var(--red)">${fmtCur(pt.balanceDue, c)}</strong></div>
        <div class="fg"><label class="fl">Amount</label><input type="number" id="qpAmt" value="${pt.balanceDue}" min="0" step="500"></div>
        <div class="fr">
            <div class="fg"><label class="fl">Date</label><input type="text" id="qpDate" data-datepicker data-value="${today}"></div>
            <div class="fg"><label class="fl">Method</label><div id="qpMethod"></div></div>
        </div>
        <div class="fg"><label class="fl">Note</label><input type="text" id="qpNote" placeholder="Optional"></div>
        <div class="modal-foot"><button class="btn" onclick="saveQuickPayment('${pid}')">Save Payment</button></div>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
    if (typeof initDatePickers === 'function') initDatePickers();
    if (typeof csel === 'function') {
        csel(document.getElementById('qpMethod'), { value: 'Bank', items: PAYMENT_METHODS.map(m => ({ value: m, label: m })) });
    }
}

function saveQuickPayment(pid) {
    const p = DB.find(x => x.id === pid);
    if (!p) return;
    if (!p.payments) p.payments = [];
    const amt = Math.max(0, parseFloat(document.getElementById('qpAmt')?.value) || 0);
    if (amt <= 0) { toast('Enter a valid amount', 'error'); return; }
    const dateEl = document.getElementById('qpDate');
    p.payments.push({
        id: 'pay_' + Date.now(),
        date: dateEl?.dataset?.value || dateEl?.value || '',
        amount: amt,
        method: (typeof cselGetValue === 'function' ? cselGetValue(document.getElementById('qpMethod')) : document.getElementById('qpMethod')?.value) || 'Bank',
        note: document.getElementById('qpNote')?.value || ''
    });
    persist();
    document.querySelector('.modal-wrap')?.remove();
    toast('Payment recorded');
    if (typeof renderProposals === 'function') renderProposals();
}

function showPaymentPickerMenu(event) {
    event.stopPropagation();
    const existing = document.querySelector('.status-dropdown');
    if (existing) existing.remove();
    const dues = DB.filter(p => !p.archived && p.status === 'accepted' && paymentTotals(p).balanceDue > 0);
    if (!dues.length) { toast('No outstanding dues'); return; }
    const dd = document.createElement('div');
    dd.className = 'status-dropdown';
    dd.style.maxHeight = '300px'; dd.style.overflowY = 'auto'; dd.style.minWidth = '240px';
    dd.innerHTML = dues.slice(0, 10).map(p => {
        const pt = paymentTotals(p);
        const c = p.currency || defaultCurrency();
        return `<button class="status-opt" onclick="quickRecordPayment('${p.id}')" style="flex-direction:column;align-items:flex-start;gap:2px"><span style="font-weight:600;font-size:12px">${esc(p.title || 'Untitled')}</span><span style="font-size:11px;color:var(--red)">Due: ${fmtCur(pt.balanceDue, c)}</span></button>`;
    }).join('');
    dd.style.left = Math.min(event.clientX, window.innerWidth - 260) + 'px';
    dd.style.top = Math.min(event.clientY + 8, window.innerHeight - 320) + 'px';
    document.body.appendChild(dd);
    const close = () => { dd.remove(); document.removeEventListener('click', close); };
    setTimeout(() => document.addEventListener('click', close), 10);
}
