// ════════════════════════════════════════
// COMPLETENESS SCORE (Phase 1.4)
// ════════════════════════════════════════

function calcCompleteness(p) {
    if (!p) return { score: 0, missing: [], checks: [] };
    const checks = [];
    const missing = [];

    // Title (10pts)
    if (p.title && p.title !== 'Untitled Proposal' && p.title !== 'Untitled') {
        checks.push({ label: 'Title', done: true });
    } else {
        checks.push({ label: 'Title', done: false });
        missing.push('Add a descriptive title');
    }

    // Client name (15pts)
    if (p.client?.name) {
        checks.push({ label: 'Client', done: true });
    } else {
        checks.push({ label: 'Client', done: false });
        missing.push('Add client name');
    }

    // At least 1 section (15pts)
    if ((p.sections || []).length > 0 && p.sections.some(s => s.title)) {
        checks.push({ label: 'Sections', done: true });
    } else {
        checks.push({ label: 'Sections', done: false });
        missing.push('Add at least one content section');
    }

    // At least 1 line item (15pts)
    if ((p.lineItems || []).length > 0 && p.lineItems.some(i => i.desc)) {
        checks.push({ label: 'Line items', done: true });
    } else {
        checks.push({ label: 'Line items', done: false });
        missing.push('Add at least one line item');
    }

    // Payment terms (10pts)
    const hasPT = p.paymentTerms && (typeof p.paymentTerms === 'string' ? p.paymentTerms.trim() : (p.paymentTerms.blocks && p.paymentTerms.blocks.length > 0));
    if (hasPT) {
        checks.push({ label: 'Payment terms', done: true });
    } else {
        checks.push({ label: 'Payment terms', done: false });
        missing.push('Add payment terms');
    }

    // Valid-until date (10pts)
    if (p.validUntil) {
        checks.push({ label: 'Valid until', done: true });
    } else {
        checks.push({ label: 'Valid until', done: false });
        missing.push('Set a valid-until date');
    }

    // Sender info (10pts)
    if (p.sender?.company && p.sender?.email) {
        checks.push({ label: 'Sender info', done: true });
    } else {
        checks.push({ label: 'Sender info', done: false });
        missing.push('Complete your company details');
    }

    // Client email (5pts)
    if (p.client?.email) {
        checks.push({ label: 'Client email', done: true });
    } else {
        checks.push({ label: 'Client email', done: false });
        missing.push('Add client email');
    }

    // Cover page (5pts)
    if (p.coverPage) {
        checks.push({ label: 'Cover page', done: true });
    } else {
        checks.push({ label: 'Cover page', done: false });
        missing.push('Enable cover page');
    }

    // Proposal number (5pts)
    if (p.number) {
        checks.push({ label: 'Proposal #', done: true });
    } else {
        checks.push({ label: 'Proposal #', done: false });
        missing.push('Add proposal number');
    }

    const done = checks.filter(c => c.done).length;
    const total = checks.length;
    const score = Math.round((done / total) * 100);

    return { score, missing, checks };
}

function getCompletenessColor(score) {
    if (score < 40) return 'var(--red)';
    if (score <= 70) return 'var(--amber)';
    return 'var(--green)';
}

function buildCompletenessHtml(p) {
    const { score, missing } = calcCompleteness(p);
    const color = getCompletenessColor(score);
    const tooltip = missing.length ? missing.slice(0, 3).join(', ') : 'Looking good!';

    return `<div class="completeness-bar" title="${esc(tooltip)}" onclick="showCompletenessDetail()">
        <div class="completeness-ring" style="--score:${score};--color:${color}">
            <svg width="28" height="28" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="var(--border)" stroke-width="3"/>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="${color}" stroke-width="3"
                    stroke-dasharray="${score}, 100" stroke-linecap="round"/>
            </svg>
        </div>
        <span style="font-size:12px;font-weight:600;color:${color}">${score}%</span>
    </div>`;
}

function showCompletenessDetail() {
    const p = cur();
    if (!p) return;
    const { score, checks, missing } = calcCompleteness(p);
    const color = getCompletenessColor(score);

    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap show';
    wrap.id = 'completenessModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };

    const checkItems = checks.map(c =>
        `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13px">
            <i data-lucide="${c.done ? 'check-circle' : 'circle'}" style="width:16px;height:16px;color:${c.done ? 'var(--green)' : 'var(--text4)'}"></i>
            <span style="color:${c.done ? 'var(--text)' : 'var(--text3)'}">${c.label}</span>
        </div>`
    ).join('');

    wrap.innerHTML = `
        <div class="modal modal-sm" onclick="event.stopPropagation()">
            <div class="modal-t">Proposal Completeness</div>
            <div style="display:flex;align-items:center;gap:12px;margin:16px 0">
                <div style="font-size:32px;font-weight:800;color:${color}">${score}%</div>
                <div style="flex:1;height:6px;background:var(--muted);border-radius:3px;overflow:hidden">
                    <div style="width:${score}%;height:100%;background:${color};border-radius:3px;transition:width .3s"></div>
                </div>
            </div>
            <div style="margin-bottom:16px">${checkItems}</div>
            ${missing.length ? `<div style="padding:10px;background:var(--muted);border-radius:8px;font-size:12px;color:var(--text3)">
                <strong style="color:var(--text)">To improve:</strong> ${esc(missing.slice(0, 3).join('. '))}
            </div>` : '<div style="padding:10px;background:var(--green-bg);border-radius:8px;font-size:12px;color:var(--green);font-weight:500">Your proposal looks complete!</div>'}
            <div class="modal-foot" style="margin-top:12px">
                <button class="btn-sm-outline" onclick="document.getElementById('completenessModal').remove()">Close</button>
            </div>
        </div>`;

    document.body.appendChild(wrap);
    lucide.createIcons();
}
