// ════════════════════════════════════════
// WIN RATE ANALYTICS (Phase 3.1 + 5.5)
// ════════════════════════════════════════

/* exported buildAnalyticsWidget, setAnalyticsFilter */
let analyticsFilter = '90d';

function getFilteredProposals(timeFilter) {
    const active = activeDB();
    if (timeFilter === 'all') return active;
    const now = Date.now();
    const ranges = { '7d': 7, '30d': 30, '90d': 90, month: 30, '3mo': 90, year: 365 };
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

    const outstanding = typeof paymentTotals === 'function' ? accepted.reduce((s, p) => s + paymentTotals(p).balanceDue, 0) : 0;
    return { winRate, pipeline, avgValue, avgDays, forecast, outstanding, total: proposals.length, accepted: accepted.length, decided: decided.length };
}

let _areaChartData = null;

function buildAreaChart(proposals) {
    const months = [];
    const now = new Date();
    const ranges = { '7d': 1, '30d': 2, '90d': 6 };
    const count = ranges[analyticsFilter] || 6;
    for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ year: d.getFullYear(), month: d.getMonth(),
            label: d.toLocaleString('en', { month: 'short' }) });
    }
    _areaChartData = months.map(m => {
        const inMonth = proposals.filter(p => {
            const d = new Date(p.createdAt || 0);
            return d.getFullYear() === m.year && d.getMonth() === m.month;
        });
        const val = (list) => list.reduce((a, p) =>
            a + (p.lineItems || []).reduce((s, i) =>
                s + (i.qty || 0) * (i.rate || 0), 0), 0);
        return { label: m.label,
            won: val(inMonth.filter(p => p.status === 'accepted')),
            active: val(inMonth.filter(p =>
                p.status === 'draft' || p.status === 'sent')),
            lost: val(inMonth.filter(p => p.status === 'declined')),
            outstanding: val(inMonth.filter(p => p.status === 'expired'))
        };
    });
    return `<div class="an-area-wrap">
        <canvas id="anAreaCanvas" class="an-area-canvas" height="200"></canvas>
    </div>
    <div class="an-legend">
        <span class="an-legend-item"><span class="an-dot an-dot-primary"></span>Revenue</span>
        <span class="an-legend-item"><span class="an-dot an-dot-blue"></span>Active</span>
        <span class="an-legend-item"><span class="an-dot an-dot-green"></span>Won</span>
        <span class="an-legend-item"><span class="an-dot an-dot-red"></span>Outstanding</span>
    </div>`;
}

function drawAreaChart() {
    const cv = document.getElementById('anAreaCanvas');
    if (!cv || !_areaChartData) return;
    const data = _areaChartData;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.offsetWidth, H = 200;
    if (W < 10) return;
    cv.width = W * dpr;
    cv.height = H * dpr;
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    const pl = 48, pr = 16, pt = 16, pb = 32;
    const cw = W - pl - pr, ch = H - pt - pb;
    const n = data.length;
    if (n < 1) return;
    const isDark = document.documentElement.classList.contains('dark');
    const cs = getComputedStyle(document.documentElement);
    const colors = {
        revenue: cs.getPropertyValue('--primary').trim() || '#800020',
        active: cs.getPropertyValue('--blue').trim() || '#007AFF',
        won: cs.getPropertyValue('--green').trim() || '#34C759',
        outstanding: cs.getPropertyValue('--red').trim() || '#FF3B30'
    };
    const totals = data.map(d =>
        d.won + d.active + d.lost + d.outstanding);
    const maxV = Math.max(...totals, 1);
    const gridColor = isDark
        ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = cs.getPropertyValue('--muted-foreground').trim()
        || '#71717a';
    const font = '500 11px -apple-system,system-ui,sans-serif';
    ctx.font = font;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
        const y = pt + ch - (i / 4) * ch;
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pl, y);
        ctx.lineTo(W - pr, y); ctx.stroke();
        ctx.fillStyle = textColor;
        const v = Math.round(maxV * (i / 4));
        ctx.fillText(v >= 1000
            ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : v,
            pl - 8, y);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    data.forEach((d, i) => {
        ctx.fillStyle = textColor;
        const x = n === 1 ? pl + cw / 2 : pl + (i / (n - 1)) * cw;
        ctx.fillText(d.label, x, H - pb + 10);
    });
    function hexToRgb(h) {
        h = h.replace('#', '');
        if (h.length === 3)
            h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        return 'rgb(' + parseInt(h.slice(0, 2), 16) + ',' +
            parseInt(h.slice(2, 4), 16) + ',' +
            parseInt(h.slice(4, 6), 16) + ')';
    }
    function drawArea(vals, color, alpha) {
        const pts = vals.map((v, i) => ({
            x: n === 1 ? pl + cw / 2 : pl + (i / (n - 1)) * cw,
            y: pt + ch - (v / maxV) * ch
        }));
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            const cpx = (pts[i - 1].x + pts[i].x) / 2;
            ctx.bezierCurveTo(cpx, pts[i - 1].y,
                cpx, pts[i].y, pts[i].x, pts[i].y);
        }
        const grad = ctx.createLinearGradient(0, pt, 0, pt + ch);
        const rgbC = color.startsWith('#') ? hexToRgb(color) : color;
        const base = rgbC.startsWith('rgb') ? rgbC : 'rgb(128,0,32)';
        grad.addColorStop(0,
            base.replace(')', ',' + alpha + ')').replace('rgb', 'rgba'));
        grad.addColorStop(1,
            base.replace(')', ',0.01)').replace('rgb', 'rgba'));
        ctx.lineTo(pts[pts.length - 1].x, pt + ch);
        ctx.lineTo(pts[0].x, pt + ch);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            const cpx = (pts[i - 1].x + pts[i].x) / 2;
            ctx.bezierCurveTo(cpx, pts[i - 1].y,
                cpx, pts[i].y, pts[i].x, pts[i].y);
        }
        ctx.strokeStyle = base; ctx.lineWidth = 2; ctx.stroke();
        pts.forEach(p => {
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = base; ctx.fill();
        });
    }
    const series = [
        { vals: totals, color: colors.revenue, alpha: 0.15 },
        { vals: data.map(d => d.active), color: colors.active,
            alpha: 0.10 },
        { vals: data.map(d => d.won), color: colors.won, alpha: 0.10 },
        { vals: data.map(d => d.outstanding),
            color: colors.outstanding, alpha: 0.08 }
    ];
    series.reverse().forEach(s => drawArea(s.vals, s.color, s.alpha));
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
    const filters = ['90d', '30d', '7d'];
    const labels = { '90d': 'Last 3 months', '30d': 'Last 30 days',
        '7d': 'Last 7 days' };
    const descs = { '90d': 'Jan - Jun ' + new Date().getFullYear(),
        '30d': 'Last 30 days', '7d': 'Last 7 days' };
    const hasBreakdowns = typeof openAnalyticsBreakdowns === 'function';

    return `<div class="an-widget">
        <div class="an-header">
            <div>
                <div class="an-title">Revenue Overview</div>
                <div class="an-subtitle">${descs[analyticsFilter] || descs['90d']}</div>
            </div>
            <div class="an-header-actions">
                <div class="an-toggle-group">
                    ${filters.map(f => `<button class="an-toggle${analyticsFilter === f ? ' on' : ''}" onclick="setAnalyticsFilter('${f}')">${labels[f]}</button>`).join('')}
                </div>
                ${hasBreakdowns ? '<button class="btn-sm-outline" onclick="openAnalyticsBreakdowns()"><i data-lucide="bar-chart-3"></i> Breakdowns</button>' : ''}
            </div>
        </div>
        <div class="an-chart-content">
            ${proposals.length >= 1 ? buildAreaChart(proposals) : '<div class="an-chart-empty">Not enough data to display chart</div>'}
        </div>
        <div class="an-stats-grid">
            <div class="an-stat-card sc-green">
                <div class="an-stat-label">Win Rate</div>
                <div class="an-stat-val">${stats.winRate}%</div>
                <div class="an-stat-sub">${stats.accepted}/${stats.decided} decided</div>
            </div>
            <div class="an-stat-card sc-blue">
                <div class="an-stat-label">Pipeline</div>
                <div class="an-stat-val">${fmtCur(stats.pipeline, c)}</div>
                <div class="an-stat-sub">Active proposals</div>
            </div>
            <div class="an-stat-card sc-primary">
                <div class="an-stat-label">Avg Value</div>
                <div class="an-stat-val">${fmtCur(stats.avgValue, c)}</div>
                <div class="an-stat-sub">Per proposal</div>
            </div>
            <div class="an-stat-card sc-red">
                <div class="an-stat-label">Avg Close</div>
                <div class="an-stat-val">${stats.avgDays > 0 ? stats.avgDays + ' days' : '\u2014'}</div>
                <div class="an-stat-sub">Time to close</div>
            </div>
        </div>
    </div>`;
}

function setAnalyticsFilter(f) {
    analyticsFilter = f;
    renderDashboard();
}
