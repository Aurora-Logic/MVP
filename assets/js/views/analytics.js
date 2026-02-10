// ════════════════════════════════════════
// WIN RATE ANALYTICS (Phase 3.1 + 5.5)
// ════════════════════════════════════════

let analyticsFilter = 'all';

function getFilteredProposals(timeFilter) {
    const active = activeDB();
    if (timeFilter === 'all') return active;
    const now = Date.now();
    const ranges = { month: 30, '3mo': 90, year: 365 };
    const days = ranges[timeFilter] || 365;
    const cutoff = now - days * 86400000;
    return active.filter(p => (p.createdAt || 0) >= cutoff);
}

function computeAnalytics(proposals) {
    const decided = proposals.filter(p => p.status === 'accepted' || p.status === 'declined');
    const accepted = proposals.filter(p => p.status === 'accepted');
    const winRate = decided.length > 0 ? Math.round(accepted.length / decided.length * 100) : 0;

    const pipeline = proposals.filter(p => p.status === 'draft' || p.status === 'sent')
        .reduce((sum, p) => sum + (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0), 0);

    const allValues = proposals.map(p => (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0)).filter(v => v > 0);
    const avgValue = allValues.length ? Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length) : 0;

    const closedTimes = accepted.filter(p => p.clientResponse?.respondedAt && p.createdAt)
        .map(p => Math.round((p.clientResponse.respondedAt - p.createdAt) / 86400000));
    const avgDays = closedTimes.length ? Math.round(closedTimes.reduce((a, b) => a + b, 0) / closedTimes.length) : 0;

    const forecast = Math.round(pipeline * (winRate / 100));

    return { winRate, pipeline, avgValue, avgDays, forecast, total: proposals.length, accepted: accepted.length, decided: decided.length };
}

function buildBarChart(proposals) {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('en', { month: 'short' }) });
    }
    const buckets = months.map(m => {
        const inMonth = proposals.filter(p => {
            const d = new Date(p.createdAt || 0);
            return d.getFullYear() === m.year && d.getMonth() === m.month;
        });
        return { label: m.label, accepted: inMonth.filter(p => p.status === 'accepted').length, declined: inMonth.filter(p => p.status === 'declined').length, pending: inMonth.filter(p => p.status === 'draft' || p.status === 'sent').length, expired: inMonth.filter(p => p.status === 'expired').length };
    });
    const maxVal = Math.max(...buckets.map(b => b.accepted + b.declined + b.pending + b.expired), 1);

    return `<div class="an-chart">
        ${buckets.map(b => {
        const total = b.accepted + b.declined + b.pending + b.expired;
        const h = total > 0 ? Math.max(Math.round(total / maxVal * 100), 8) : 0;
        return `<div class="an-bar-col">
                <div class="an-bar-stack" style="height:${h}%">
                    ${b.accepted ? `<div class="an-bar-seg won" style="flex:${b.accepted}" data-tooltip="${b.accepted} won" data-side="top" data-align="center"></div>` : ''}
                    ${b.pending ? `<div class="an-bar-seg pending" style="flex:${b.pending}"></div>` : ''}
                    ${b.declined ? `<div class="an-bar-seg lost" style="flex:${b.declined}"></div>` : ''}
                    ${b.expired ? `<div class="an-bar-seg expired" style="flex:${b.expired}"></div>` : ''}
                </div>
                <div class="an-bar-label">${b.label}</div>
            </div>`;
    }).join('')}
    </div>
    <div class="an-legend">
        <span class="an-legend-item"><span class="an-dot an-dot-green"></span>Won</span>
        <span class="an-legend-item"><span class="an-dot an-dot-blue"></span>Pending</span>
        <span class="an-legend-item"><span class="an-dot an-dot-red"></span>Lost</span>
        <span class="an-legend-item"><span class="an-dot an-dot-amber"></span>Expired</span>
    </div>`;
}

function buildDonutChart(proposals) {
    const draft = proposals.filter(p => p.status === 'draft').length;
    const sent = proposals.filter(p => p.status === 'sent').length;
    const accepted = proposals.filter(p => p.status === 'accepted').length;
    const declined = proposals.filter(p => p.status === 'declined').length;
    const expired = proposals.filter(p => p.status === 'expired').length;
    const total = draft + sent + accepted + declined + expired || 1;
    let cumulative = 0;
    const segments = [];
    const colors = { draft: 'var(--text4)', sent: 'var(--blue)', accepted: 'var(--green)', declined: 'var(--red)', expired: 'var(--amber)' };
    const counts = { draft, sent, accepted, declined, expired };
    for (const [status, count] of Object.entries(counts)) {
        if (count > 0) {
            const pct = (count / total) * 100;
            segments.push(`${colors[status]} ${cumulative}% ${cumulative + pct}%`);
            cumulative += pct;
        }
    }
    const gradient = segments.length ? segments.join(', ') : 'var(--muted) 0% 100%';
    return `<div class="an-donut-wrap">
        <div class="an-donut" style="background: conic-gradient(${gradient})">
            <div class="an-donut-center"><div class="an-donut-val">${total}</div><div class="an-donut-label">Total</div></div>
        </div>
        <div class="an-donut-legend">
            ${draft ? `<div class="an-donut-item"><span class="an-dot an-dot-gray"></span>Draft <strong>${draft}</strong></div>` : ''}
            ${sent ? `<div class="an-donut-item"><span class="an-dot an-dot-blue"></span>Sent <strong>${sent}</strong></div>` : ''}
            ${accepted ? `<div class="an-donut-item"><span class="an-dot an-dot-green"></span>Won <strong>${accepted}</strong></div>` : ''}
            ${declined ? `<div class="an-donut-item"><span class="an-dot an-dot-red"></span>Lost <strong>${declined}</strong></div>` : ''}
            ${expired ? `<div class="an-donut-item"><span class="an-dot an-dot-amber"></span>Expired <strong>${expired}</strong></div>` : ''}
        </div>
    </div>`;
}

function buildAnalyticsWidget() {
    const proposals = getFilteredProposals(analyticsFilter);
    const stats = computeAnalytics(proposals);
    const c = proposals[0]?.currency || defaultCurrency();
    const filters = ['month', '3mo', 'year', 'all'];
    const labels = { month: '30d', '3mo': '3mo', year: '1yr', all: 'All' };
    const hasBreakdowns = typeof openAnalyticsBreakdowns === 'function';

    return `<div class="an-widget">
        <div class="an-header">
            <div><div class="an-title">Analytics</div><div class="an-subtitle">${stats.total} proposal${stats.total !== 1 ? 's' : ''} in period</div></div>
            <div class="an-header-actions">
                <div class="an-filters">
                    ${filters.map(f => `<button class="an-filter${analyticsFilter === f ? ' on' : ''}" onclick="setAnalyticsFilter('${f}')">${labels[f]}</button>`).join('')}
                </div>
                ${hasBreakdowns ? '<button class="btn-sm-outline" onclick="openAnalyticsBreakdowns()"><i data-lucide="bar-chart-3"></i> Breakdowns</button>' : ''}
            </div>
        </div>
        <div class="an-body">
            <div class="an-main">
                <div class="an-metrics an-metrics-5">
                    <div class="an-metric">
                        <div class="an-metric-val ${stats.winRate >= 50 ? 'good' : stats.winRate > 0 ? 'mid' : ''}">${stats.winRate}%</div>
                        <div class="an-metric-label">Win Rate</div>
                        <div class="an-metric-sub">${stats.accepted}/${stats.decided} decided</div>
                    </div>
                    <div class="an-metric">
                        <div class="an-metric-val">${fmtCur(stats.pipeline, c)}</div>
                        <div class="an-metric-label">Pipeline</div>
                        <div class="an-metric-sub">Open proposals</div>
                    </div>
                    <div class="an-metric">
                        <div class="an-metric-val">${fmtCur(stats.forecast, c)}</div>
                        <div class="an-metric-label">Forecast</div>
                        <div class="an-metric-sub">Expected revenue</div>
                    </div>
                    <div class="an-metric">
                        <div class="an-metric-val">${fmtCur(stats.avgValue, c)}</div>
                        <div class="an-metric-label">Avg Value</div>
                        <div class="an-metric-sub">Per proposal</div>
                    </div>
                    <div class="an-metric">
                        <div class="an-metric-val">${stats.avgDays > 0 ? stats.avgDays + 'd' : '—'}</div>
                        <div class="an-metric-label">Avg Close</div>
                        <div class="an-metric-sub">Days to accept</div>
                    </div>
                </div>
                ${proposals.length >= 2 ? buildBarChart(proposals) : ''}
            </div>
            <div class="an-side">
                <div class="an-side-title">Status Breakdown</div>
                ${buildDonutChart(proposals)}
            </div>
        </div>
    </div>`;
}

function setAnalyticsFilter(f) {
    analyticsFilter = f;
    renderDashboard();
}
