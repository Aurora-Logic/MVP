// ════════════════════════════════════════
// PAYMENT SCHEDULE — Milestones (Phase 2.3)
// ════════════════════════════════════════

function renderPaymentSchedule(p) {
    const el = document.getElementById('payScheduleSection');
    if (!el) return;
    const milestones = p.paymentSchedule || [];
    const mode = p.paymentScheduleMode || 'percentage';
    const t = calcTotals(p);
    const c = p.currency || '₹';

    let rows = '';
    milestones.forEach((m, i) => {
        const amtVal = mode === 'percentage' ? Math.round(t.grand * (m.percentage || 0) / 100) : (m.amount || 0);
        rows += `<div class="ps-row">
            <div class="ps-row-num">${i + 1}</div>
            <div class="ps-row-body">
                <div class="ps-row-top">
                    <input type="text" class="ps-name" value="${esc(m.name)}" placeholder="Milestone name" oninput="dirty()">
                    <div class="ps-row-values">
                        ${mode === 'percentage'
                            ? `<div class="ps-pct-wrap"><input type="number" class="ps-pct" value="${m.percentage || 0}" min="0" max="100" step="5" oninput="updateScheduleBar();dirty()"><span class="ps-pct-sign">%</span></div><span class="ps-amt-preview">${fmtCur(amtVal, c)}</span>`
                            : `<input type="number" class="ps-amt" value="${m.amount || 0}" min="0" step="500" oninput="updateScheduleBar();dirty()">`
                        }
                        <input type="text" class="ps-date" data-datepicker id="psDate${i}" data-value="${m.dueDate || ''}" oninput="dirty()">
                    </div>
                    <button class="btn-sm-icon-ghost" onclick="removeMilestone(${i})" data-tooltip="Remove" data-side="bottom" data-align="center"><i data-lucide="x"></i></button>
                </div>
                <div class="ps-row-bottom">
                    <input type="text" class="ps-desc" value="${esc(m.desc || '')}" placeholder="Description (optional)" oninput="dirty()">
                </div>
            </div>
        </div>`;
    });

    const barHtml = buildScheduleBarHtml(milestones, mode, t.grand, c);

    el.innerHTML = `<div class="card card-p">
        <div class="card-head">
            <div><div class="card-t">Payment Schedule</div><div class="card-d">Milestone-based payments</div></div>
            <div style="display:flex;gap:6px;align-items:center">
                <div class="ps-mode-toggle">
                    <button class="ps-mode-btn ${mode === 'percentage' ? 'on' : ''}" onclick="toggleScheduleMode('percentage')">%</button>
                    <button class="ps-mode-btn ${mode === 'amount' ? 'on' : ''}" onclick="toggleScheduleMode('amount')">${c}</button>
                </div>
                <button class="btn-sm-outline" onclick="addMilestone()"><i data-lucide="plus"></i> Add</button>
            </div>
        </div>
        <div id="scheduleBar">${barHtml}</div>
        <div id="scheduleBody">${rows || '<div class="ps-empty">No milestones yet. Click "Add" to create a payment schedule.</div>'}</div>
        <div id="scheduleValidation"></div>
    </div>`;
    lucide.createIcons();
    initDatePickers();
    validateSchedule();
}

function buildScheduleBarHtml(milestones, mode, total, c) {
    if (!milestones.length) return '';
    const colors = ['#007AFF', '#AF52DE', '#34C759', '#FF9500', '#FF3B30', '#5AC8FA'];
    let segments = '';
    let sum = 0;
    milestones.forEach((m, i) => {
        const pct = mode === 'percentage' ? (m.percentage || 0) : (total > 0 ? Math.round((m.amount || 0) / total * 100) : 0);
        sum += pct;
        if (pct > 0) {
            segments += `<div class="ps-bar-seg" style="width:${pct}%;background:${colors[i % colors.length]}" title="${esc(m.name || 'Milestone ' + (i+1))}: ${pct}%"></div>`;
        }
    });
    return `<div class="ps-bar-wrap"><div class="ps-bar">${segments}</div><div class="ps-bar-label">${sum}% allocated</div></div>`;
}

function addMilestone() {
    const p = cur(); if (!p) return;
    if (!p.paymentSchedule) p.paymentSchedule = [];
    const names = ['Advance', 'Midpoint', 'On Delivery', 'Final'];
    const name = names[p.paymentSchedule.length] || 'Milestone ' + (p.paymentSchedule.length + 1);
    p.paymentSchedule.push({ name, amount: 0, percentage: 0, dueDate: '', desc: '' });
    persist();
    renderPaymentSchedule(p);
}

function removeMilestone(idx) {
    const p = cur(); if (!p || !p.paymentSchedule) return;
    p.paymentSchedule.splice(idx, 1);
    persist();
    renderPaymentSchedule(p);
    dirty();
}

function toggleScheduleMode(mode) {
    const p = cur(); if (!p) return;
    p.paymentScheduleMode = mode;
    persist();
    renderPaymentSchedule(p);
}

function updateScheduleBar() {
    const p = cur(); if (!p) return;
    collectPaymentScheduleData(p);
    const t = calcTotals(p);
    const c = p.currency || '₹';
    const barEl = document.getElementById('scheduleBar');
    if (barEl) barEl.innerHTML = buildScheduleBarHtml(p.paymentSchedule || [], p.paymentScheduleMode || 'percentage', t.grand, c);
    // Update amount previews for percentage mode
    if ((p.paymentScheduleMode || 'percentage') === 'percentage') {
        document.querySelectorAll('.ps-amt-preview').forEach((el, i) => {
            const pct = p.paymentSchedule[i]?.percentage || 0;
            el.textContent = fmtCur(Math.round(t.grand * pct / 100), c);
        });
    }
    validateSchedule();
}

function validateSchedule() {
    const p = cur(); if (!p) return;
    const el = document.getElementById('scheduleValidation');
    if (!el) return;
    const milestones = p.paymentSchedule || [];
    if (!milestones.length) { el.innerHTML = ''; return; }
    const mode = p.paymentScheduleMode || 'percentage';
    const t = calcTotals(p);
    if (mode === 'percentage') {
        const sum = milestones.reduce((s, m) => s + (m.percentage || 0), 0);
        if (sum === 100) {
            el.innerHTML = '<div class="ps-valid"><i data-lucide="check-circle" style="width:14px;height:14px"></i> Schedule adds up to 100%</div>';
        } else {
            el.innerHTML = `<div class="ps-warn"><i data-lucide="alert-triangle" style="width:14px;height:14px"></i> Schedule totals ${sum}% (should be 100%)</div>`;
        }
    } else {
        const sum = milestones.reduce((s, m) => s + (m.amount || 0), 0);
        const c = p.currency || '₹';
        if (sum === t.grand) {
            el.innerHTML = `<div class="ps-valid"><i data-lucide="check-circle" style="width:14px;height:14px"></i> Schedule matches total ${fmtCur(t.grand, c)}</div>`;
        } else {
            el.innerHTML = `<div class="ps-warn"><i data-lucide="alert-triangle" style="width:14px;height:14px"></i> Schedule total ${fmtCur(sum, c)} ≠ proposal total ${fmtCur(t.grand, c)}</div>`;
        }
    }
    lucide.createIcons();
}

function collectPaymentScheduleData(p) {
    const rows = document.querySelectorAll('.ps-row');
    if (!rows.length && !document.getElementById('scheduleBody')) return;
    const mode = p.paymentScheduleMode || 'percentage';
    p.paymentSchedule = [];
    rows.forEach(row => {
        p.paymentSchedule.push({
            name: row.querySelector('.ps-name')?.value || '',
            desc: row.querySelector('.ps-desc')?.value || '',
            percentage: mode === 'percentage' ? (parseFloat(row.querySelector('.ps-pct')?.value) || 0) : 0,
            amount: mode === 'amount' ? (parseFloat(row.querySelector('.ps-amt')?.value) || 0) : 0,
            dueDate: row.querySelector('.ps-date')?.dataset?.value || row.querySelector('.ps-date')?.value || ''
        });
    });
}

function buildSchedulePdfHtml(p, c, bc) {
    const milestones = (p.paymentSchedule || []).filter(m => m.name);
    if (!milestones.length) return '';
    const cur = c || '₹';
    const mode = p.paymentScheduleMode || 'percentage';
    const t = calcTotals(p);
    const colors = ['#007AFF', '#AF52DE', '#34C759', '#FF9500', '#FF3B30', '#5AC8FA'];

    let h = `<div style="margin-top:20px"><div style="font-size:14px;font-weight:700;margin-bottom:10px;padding-bottom:5px;border-bottom:2px solid ${bc};color:${bc}">Payment Schedule</div>`;
    // Progress bar
    h += '<div style="display:flex;height:8px;border-radius:4px;overflow:hidden;margin-bottom:12px;background:#f4f4f5">';
    milestones.forEach((m, i) => {
        const pct = mode === 'percentage' ? (m.percentage || 0) : (t.grand > 0 ? Math.round((m.amount || 0) / t.grand * 100) : 0);
        if (pct > 0) h += `<div style="width:${pct}%;background:${colors[i % colors.length]}"></div>`;
    });
    h += '</div>';
    // Table
    h += '<table style="width:100%;border-collapse:collapse"><thead><tr>';
    h += '<th style="text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.6px;font-weight:700;padding:7px 0;border-bottom:1px solid #e4e4e7;color:#a1a1aa">Milestone</th>';
    h += '<th style="text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:.6px;font-weight:700;padding:7px 0;border-bottom:1px solid #e4e4e7;color:#a1a1aa">Amount</th>';
    h += '<th style="text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:.6px;font-weight:700;padding:7px 0;border-bottom:1px solid #e4e4e7;color:#a1a1aa">Due Date</th>';
    h += '</tr></thead><tbody>';
    milestones.forEach((m, i) => {
        const amt = mode === 'percentage' ? Math.round(t.grand * (m.percentage || 0) / 100) : (m.amount || 0);
        const pctLabel = mode === 'percentage' ? ` (${m.percentage}%)` : '';
        h += `<tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors[i % colors.length]};margin-right:8px"></span>${esc(m.name)}${m.desc ? '<div style="font-size:11px;color:#a1a1aa;margin-left:16px">' + esc(m.desc) + '</div>' : ''}</td>`;
        h += `<td style="padding:8px 0;border-bottom:1px solid #f4f4f5;text-align:right;font-family:var(--mono);font-weight:500">${cur}${amt.toLocaleString('en-IN')}${pctLabel}</td>`;
        h += `<td style="padding:8px 0;border-bottom:1px solid #f4f4f5;text-align:right;font-size:12px;color:#71717a">${m.dueDate ? fmtDate(m.dueDate) : '—'}</td></tr>`;
    });
    h += '</tbody></table></div>';
    return h;
}
