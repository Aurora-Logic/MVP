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
        <span style="font-size:12px;font-weight:600;color:${color}">${score}%</span>
    </div>`;
}

function buildScoreBadge(p) {
    const { score } = calcCompleteness(p);
    const color = getCompletenessColor(score);
    return `<span style="font-size:10px;font-weight:700;color:${color};background:color-mix(in srgb, ${color} 12%, transparent);padding:2px 6px;border-radius:9999px">${score}%</span>`;
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
        checkItems += `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text4);margin:10px 0 4px">${tabLabels[tab]}</div>`;
        items.forEach(c => {
            checkItems += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px">
                <i data-lucide="${c.done ? 'check-circle' : 'circle'}" style="width:15px;height:15px;color:${c.done ? 'var(--green)' : 'var(--text5)'}"></i>
                <span style="flex:1;color:${c.done ? 'var(--text)' : 'var(--text3)'}">${c.label}</span>
                <span style="font-size:10px;font-weight:600;color:${c.done ? 'var(--green)' : 'var(--text5)'}">${c.done ? '+' : ''}${c.weight}pts</span>
                ${!c.done ? `<button class="btn-sm-ghost" style="font-size:11px;padding:2px 8px" onclick="document.getElementById('completenessModal').remove();navigateToTab('${c.tab}')">Improve</button>` : ''}
            </div>`;
        });
    }

    wrap.innerHTML = `
        <div class="modal modal-sm" onclick="event.stopPropagation()">
            <div class="modal-t">Proposal Score</div>
            <div class="modal-d">Weighted best-practice checks for stronger proposals</div>
            <div style="display:flex;align-items:center;gap:12px;margin:16px 0">
                <div style="font-size:32px;font-weight:800;color:${color}">${score}%</div>
                <div style="flex:1;height:6px;background:var(--muted);border-radius:3px;overflow:hidden">
                    <div style="width:${score}%;height:100%;background:${color};border-radius:3px;transition:width .3s"></div>
                </div>
            </div>
            <div style="margin-bottom:16px">${checkItems}</div>
            ${missing.length ? `<div style="padding:10px;background:var(--muted);border-radius:8px;font-size:12px;color:var(--text3)">
                <strong style="color:var(--text)">Quick wins:</strong> ${esc(missing.slice(0, 3).map(m => m.tip).join('. '))}
            </div>` : '<div style="padding:10px;background:var(--green-bg);border-radius:8px;font-size:12px;color:var(--green);font-weight:500">Your proposal looks great!</div>'}
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
