// ════════════════════════════════════════
// COMPLETENESS SCORE — Weighted (Phase 5.4)
// ════════════════════════════════════════

function calcCompleteness(p) {
    if (!p) return { score: 0, total: 100, missing: [], checks: [] };
    const checks = [];

    // Cover page (+5)
    checks.push({ label: 'Cover page', done: !!p.coverPage, weight: 5, tab: 'details', tip: 'Enable cover page' });
    // Title (+5)
    checks.push({ label: 'Title', done: !!(p.title && p.title !== 'Untitled Proposal' && p.title !== 'Untitled'), weight: 5, tab: 'details', tip: 'Add a descriptive title' });
    // Client name (+10)
    checks.push({ label: 'Client name', done: !!p.client?.name, weight: 10, tab: 'details', tip: 'Add client name' });
    // Sender info (+5)
    checks.push({ label: 'Sender info', done: !!(p.sender?.company && p.sender?.email), weight: 5, tab: 'details', tip: 'Complete company details' });
    // Client email (+5)
    checks.push({ label: 'Client email', done: !!p.client?.email, weight: 5, tab: 'details', tip: 'Add client email' });
    // Proposal # (+5)
    checks.push({ label: 'Proposal #', done: !!p.number, weight: 5, tab: 'details', tip: 'Add a proposal number' });
    // Valid until (+5)
    checks.push({ label: 'Valid until', done: !!p.validUntil, weight: 5, tab: 'details', tip: 'Set a valid-until date' });

    // 3+ sections (+5)
    const secs = (p.sections || []).filter(s => s.title);
    checks.push({ label: '3+ sections', done: secs.length >= 3, weight: 5, tab: 'sections', tip: 'Add at least 3 content sections' });
    // Timeline section (+10)
    const hasTimeline = secs.some(s => /timeline|schedule|milestone|delivery/i.test(s.title || ''));
    checks.push({ label: 'Timeline section', done: hasTimeline, weight: 10, tab: 'sections', tip: 'Add a timeline or milestones section' });
    // Testimonial (+10)
    const hasTestimonial = secs.some(s => s.type === 'testimonial' || /testimonial|review|feedback/i.test(s.title || ''));
    checks.push({ label: 'Testimonial', done: hasTestimonial, weight: 10, tab: 'sections', tip: 'Add a testimonial or case study' });

    // Line items (+10)
    const hasItems = (p.lineItems || []).some(i => i.desc);
    checks.push({ label: 'Line items', done: hasItems, weight: 10, tab: 'pricing', tip: 'Add at least one line item' });
    // Payment terms (+5)
    const hasPT = p.paymentTerms && (typeof p.paymentTerms === 'string' ? p.paymentTerms.trim() : (p.paymentTerms.blocks?.length > 0));
    checks.push({ label: 'Payment terms', done: !!hasPT, weight: 5, tab: 'pricing', tip: 'Add payment terms' });
    // Packages enabled (+10)
    checks.push({ label: 'Packages', done: !!p.packagesEnabled, weight: 10, tab: 'pricing', tip: 'Enable pricing packages' });

    const earned = checks.filter(c => c.done).reduce((a, c) => a + c.weight, 0);
    const total = checks.reduce((a, c) => a + c.weight, 0);
    const score = Math.round((earned / total) * 100);
    const missing = checks.filter(c => !c.done);

    return { score, total, earned, missing, checks };
}

function getCompletenessColor(score) {
    if (score < 40) return 'var(--red)';
    if (score <= 70) return 'var(--amber)';
    return 'var(--green)';
}

function buildCompletenessHtml(p) {
    const { score, missing } = calcCompleteness(p);
    const color = getCompletenessColor(score);
    const tooltip = missing.length ? missing.slice(0, 3).map(m => m.tip).join(', ') : 'Looking good!';
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
        <span class="score-badge" style="color:${color}">${score}%</span>
    </div>`;
}

function buildScoreBadge(p) {
    const { score } = calcCompleteness(p);
    const color = getCompletenessColor(score);
    return `<span class="score-badge" style="color:${color};background:color-mix(in srgb, ${color} 12%, transparent)">${score}%</span>`;
}

function showCompletenessDetail() {
    const p = cur();
    if (!p) return;
    const { score, checks, missing } = calcCompleteness(p);
    const color = getCompletenessColor(score);
    document.getElementById('completenessModal')?.remove();
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'completenessModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };

    const grouped = { details: [], sections: [], pricing: [] };
    checks.forEach(c => { if (grouped[c.tab]) grouped[c.tab].push(c); });
    const tabLabels = { details: 'Details', sections: 'Sections', pricing: 'Pricing' };

    let checkItems = '';
    for (const [tab, items] of Object.entries(grouped)) {
        checkItems += `<div class="comp-group-label">${tabLabels[tab]}</div>`;
        items.forEach(c => {
            checkItems += `<div class="comp-check-row">
                <i data-lucide="${c.done ? 'check-circle' : 'circle'}" class="comp-check-icon" style="color:${c.done ? 'var(--green)' : 'var(--text5)'}"></i>
                <span class="comp-check-label" style="color:${c.done ? 'var(--text)' : 'var(--text3)'}">${c.label}</span>
                <span class="comp-check-pts" style="color:${c.done ? 'var(--green)' : 'var(--text5)'}">${c.done ? '+' : ''}${c.weight}pts</span>
                ${!c.done ? `<button class="btn-sm-ghost" style="font-size:11px;padding:2px 8px" onclick="document.getElementById('completenessModal').remove();navigateToTab('${c.tab}')">Improve</button>` : ''}
            </div>`;
        });
    }

    wrap.innerHTML = `
        <div class="modal modal-sm" onclick="event.stopPropagation()">
            <div class="modal-t">Proposal Score</div>
            <div class="modal-d">Weighted best-practice checks for stronger proposals</div>
            <div class="comp-score-row">
                <div class="comp-score-val" style="color:${color}">${score}%</div>
                <div class="comp-progress-wrap">
                    <div class="comp-progress-fill" style="width:${score}%;background:${color}"></div>
                </div>
            </div>
            <div class="comp-checks-list">${checkItems}</div>
            ${missing.length ? `<div class="comp-quick-wins">
                <strong>Quick wins:</strong> ${esc(missing.slice(0, 3).map(m => m.tip).join('. '))}
            </div>` : '<div class="comp-all-good">Your proposal looks great!</div>'}
            <div class="modal-foot" style="margin-top:12px">
                <button class="btn-sm-outline" onclick="document.getElementById('completenessModal').remove()">Close</button>
            </div>
        </div>`;

    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

function navigateToTab(tab) {
    const tabBtn = [...document.querySelectorAll('#edTabs .tab')].find(b => b.textContent.trim().toLowerCase() === tab);
    if (tabBtn) tabBtn.click();
}
