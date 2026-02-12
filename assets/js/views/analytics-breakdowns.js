// ════════════════════════════════════════
// ANALYTICS BREAKDOWNS (Phase 5.5)
// ════════════════════════════════════════

/* exported breakdownTab, openAnalyticsBreakdowns, setBreakdownTab, exportAnalyticsReport */
let breakdownTab = 'value';

function openAnalyticsBreakdowns() {
    breakdownTab = 'value';
    document.getElementById('analyticsBreakdownsModal')?.remove();
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'analyticsBreakdownsModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    wrap.innerHTML = `<div class="modal breakdown-modal-body" onclick="event.stopPropagation()">
        <div class="modal-t"><i data-lucide="bar-chart-3" class="modal-t-icon"></i> Win Rate Breakdowns</div>
        <div class="modal-d">Analyze your win rates across different dimensions</div>
        <div class="breakdown-tabs"><div class="filter-tabs">
            <button class="filter-tab on" onclick="setBreakdownTab('value',this)">By Value</button>
            <button class="filter-tab" onclick="setBreakdownTab('client',this)">By Client</button>
            <button class="filter-tab" onclick="setBreakdownTab('month',this)">By Month</button>
            <button class="filter-tab" onclick="setBreakdownTab('template',this)">By Template</button>
        </div></div>
        <div id="breakdownContent">${getBreakdownContent('value')}</div>
        <div class="modal-foot">
            <button class="btn-sm-outline" onclick="document.getElementById('analyticsBreakdownsModal').remove()">Close</button>
            <button class="btn-sm" onclick="exportAnalyticsReport()"><i data-lucide="download"></i> Export Report</button>
        </div>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

function setBreakdownTab(tab, el) {
    breakdownTab = tab;
    document.querySelectorAll('#analyticsBreakdownsModal .filter-tab').forEach(t => t.classList.remove('on'));
    if (el) el.classList.add('on');
    const content = document.getElementById('breakdownContent');
    if (content) content.innerHTML = getBreakdownContent(tab);
}

function getBreakdownContent(tab) {
    const proposals = getFilteredProposals(analyticsFilter);
    if (tab === 'value') return buildValueBreakdown(proposals);
    if (tab === 'client') return buildClientBreakdown(proposals);
    if (tab === 'month') return buildMonthBreakdown(proposals);
    if (tab === 'template') return buildTemplateBreakdown(proposals);
    return '';
}

function getProposalValue(p) {
    return (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0);
}

function buildHBar(label, won, total, color) {
    const pct = total > 0 ? Math.round((won / total) * 100) : 0;
    return `<div class="an-hbar-row">
        <div class="an-hbar-label">${esc(label)}</div>
        <div class="an-hbar-track">
            <div class="an-hbar-fill" style="width:${pct}%;background:${color || 'var(--green)'}"></div>
        </div>
        <div class="an-hbar-val">${pct}% <span class="an-hbar-ratio">(${won}/${total})</span></div>
    </div>`;
}

function buildValueBreakdown(proposals) {
    const c = proposals[0]?.currency || defaultCurrency();
    const isINR = c === '₹';
    const ranges = [
        { label: isINR ? '< ₹10K' : `< ${c}1K`, min: 0, max: isINR ? 10000 : 1000 },
        { label: isINR ? '₹10K – ₹50K' : `${c}1K – ${c}10K`, min: isINR ? 10000 : 1000, max: isINR ? 50000 : 10000 },
        { label: isINR ? '₹50K – ₹1L' : `${c}10K – ${c}50K`, min: isINR ? 50000 : 10000, max: isINR ? 100000 : 50000 },
        { label: isINR ? '> ₹1L' : `> ${c}50K`, min: isINR ? 100000 : 50000, max: Infinity }
    ];
    let html = '';
    ranges.forEach(r => {
        const inRange = proposals.filter(p => { const v = getProposalValue(p); return v >= r.min && v < r.max; });
        const decided = inRange.filter(p => p.status === 'accepted' || p.status === 'declined');
        const won = inRange.filter(p => p.status === 'accepted').length;
        if (decided.length > 0) html += buildHBar(r.label, won, decided.length, 'var(--green)');
    });
    return html || '<div class="breakdown-empty">Not enough decided proposals yet</div>';
}

function buildClientBreakdown(proposals) {
    const clientMap = {};
    proposals.forEach(p => {
        const name = p.client?.name || 'No client';
        if (!clientMap[name]) clientMap[name] = { decided: 0, won: 0 };
        if (p.status === 'accepted') { clientMap[name].decided++; clientMap[name].won++; }
        else if (p.status === 'declined') { clientMap[name].decided++; }
    });
    const sorted = Object.entries(clientMap).filter(([, v]) => v.decided > 0).sort((a, b) => b[1].decided - a[1].decided).slice(0, 10);
    if (!sorted.length) return '<div class="breakdown-empty">Not enough decided proposals yet</div>';
    return sorted.map(([name, v]) => buildHBar(name, v.won, v.decided, 'var(--blue)')).join('');
}

function buildMonthBreakdown(proposals) {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('en', { month: 'short', year: '2-digit' }) });
    }
    let html = '';
    months.forEach(m => {
        const inMonth = proposals.filter(p => {
            const d = new Date(p.createdAt || 0);
            return d.getFullYear() === m.year && d.getMonth() === m.month;
        });
        const decided = inMonth.filter(p => p.status === 'accepted' || p.status === 'declined');
        const won = inMonth.filter(p => p.status === 'accepted').length;
        if (decided.length > 0) html += buildHBar(m.label, won, decided.length, 'var(--purple)');
    });
    return html || '<div class="breakdown-empty">Not enough decided proposals yet</div>';
}

function buildTemplateBreakdown(proposals) {
    const tplMap = {};
    proposals.forEach(p => {
        const tpl = p.templateOrigin || 'blank';
        if (!tplMap[tpl]) tplMap[tpl] = { decided: 0, won: 0 };
        if (p.status === 'accepted') { tplMap[tpl].decided++; tplMap[tpl].won++; }
        else if (p.status === 'declined') { tplMap[tpl].decided++; }
    });
    const sorted = Object.entries(tplMap).filter(([, v]) => v.decided > 0).sort((a, b) => b[1].decided - a[1].decided);
    if (!sorted.length) return '<div class="breakdown-empty">Not enough decided proposals yet</div>';
    return sorted.map(([name, v]) => buildHBar(name.charAt(0).toUpperCase() + name.slice(1), v.won, v.decided, 'var(--amber)')).join('');
}

function exportAnalyticsReport() {
    const proposals = getFilteredProposals(analyticsFilter);
    const stats = computeAnalytics(proposals);
    const c = proposals[0]?.currency || defaultCurrency();

    const lines = [
        (typeof appName === 'function' ? appName() : 'ProposalKit') + ' Analytics Report',
        '═'.repeat(40),
        `Generated: ${new Date().toLocaleDateString()}`,
        `Period: ${analyticsFilter === 'all' ? 'All time' : analyticsFilter}`,
        '',
        'SUMMARY',
        '─'.repeat(30),
        `Total Proposals: ${stats.total}`,
        `Win Rate: ${stats.winRate}%`,
        `Pipeline: ${fmtCur(stats.pipeline, c)}`,
        `Revenue Forecast: ${fmtCur(stats.forecast, c)}`,
        `Average Value: ${fmtCur(stats.avgValue, c)}`,
        `Avg Days to Close: ${stats.avgDays || '—'}`,
        '',
        'PROPOSALS',
        '─'.repeat(30)
    ];

    proposals.forEach(p => {
        const val = getProposalValue(p);
        lines.push(`${p.title || 'Untitled'} | ${p.client?.name || '—'} | ${p.status} | ${fmtCur(val, c)}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `analytics-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Report exported');
    document.getElementById('analyticsBreakdownsModal')?.remove();
}
