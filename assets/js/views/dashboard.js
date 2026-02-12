// ════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════

/* exported dismissExpiry, toggleSort, sortProposals */

function buildMetricCards(active, c) {
    const totalValue = active.reduce((a, p) =>
        a + (p.lineItems || []).reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0), 0);
    const sent = active.filter(p => p.status === 'sent').length;
    const accepted = active.filter(p => p.status === 'accepted').length;
    const decided = active.filter(p => p.status === 'accepted' || p.status === 'declined').length;
    const winRate = decided > 0 ? Math.round(accepted / decided * 100) : 0;
    const duesTotal = typeof paymentTotals === 'function'
        ? active.filter(p => p.status === 'accepted')
            .reduce((s, p) => s + paymentTotals(p).balanceDue, 0) : 0;

    // Trend: compare last 30 days vs prior 30 days
    const now = Date.now(), d30 = 30 * 86400000;
    const recent = active.filter(p => (p.createdAt || 0) >= now - d30);
    const prior = active.filter(p => {
        const t = p.createdAt || 0;
        return t >= now - 2 * d30 && t < now - d30;
    });
    const sumVal = (list) => list.reduce((a, p) =>
        a + (p.lineItems || []).reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0), 0);
    const recentVal = sumVal(recent), priorVal = sumVal(prior);
    const valTrend = priorVal > 0 ? Math.round((recentVal - priorVal) / priorVal * 100) : (recentVal > 0 ? 100 : 0);
    const recentWon = recent.filter(p => p.status === 'accepted').length;
    const priorWon = prior.filter(p => p.status === 'accepted').length;
    const wonTrend = priorWon > 0 ? Math.round((recentWon - priorWon) / priorWon * 100) : (recentWon > 0 ? 100 : 0);

    const trend = (pct) => {
        if (pct === 0) return '<span class="trend-badge trend-neutral"><i data-lucide="minus" style="width:12px;height:12px"></i> 0%</span>';
        const cls = pct > 0 ? 'trend-up' : 'trend-down';
        const icon = pct > 0 ? 'trending-up' : 'trending-down';
        return `<span class="trend-badge ${cls}"><i data-lucide="${icon}" style="width:12px;height:12px"></i> ${pct > 0 ? '+' : ''}${pct}%</span>`;
    };

    const trendIcon = (pct) => pct >= 0 ? 'trending-up' : 'trending-down';
    return `<div class="dash-metric-grid">
      <div class="metric-card mc-revenue metric-card-clickable" onclick="goNav('editor')">
        <div class="metric-card-header"><span class="metric-card-label">Total revenue</span><div class="metric-card-value">${fmtCur(totalValue, c)}</div><div class="metric-card-action">${trend(valTrend)}</div></div>
        <div class="metric-card-footer"><div class="metric-card-footer-trend">${valTrend >= 0 ? '+' : ''}${valTrend}% from last month <i data-lucide="${trendIcon(valTrend)}"></i></div><div class="metric-card-footer-desc">Revenue across all proposals</div></div>
      </div>
      <div class="metric-card mc-active metric-card-clickable" onclick="setFilter('sent');goNav('editor')">
        <div class="metric-card-header"><span class="metric-card-label">Active proposals</span><div class="metric-card-value">${sent}</div><div class="metric-card-action">${trend(0)}</div></div>
        <div class="metric-card-footer"><div class="metric-card-footer-trend">${sent} awaiting response</div><div class="metric-card-footer-desc">Proposals pending client action</div></div>
      </div>
      <div class="metric-card mc-won metric-card-clickable" onclick="setFilter('accepted');goNav('editor')">
        <div class="metric-card-header"><span class="metric-card-label">Won deals</span><div class="metric-card-value">${accepted}</div><div class="metric-card-action">${trend(wonTrend)}</div></div>
        <div class="metric-card-footer"><div class="metric-card-footer-trend">${winRate}% win rate <i data-lucide="${trendIcon(wonTrend)}"></i></div><div class="metric-card-footer-desc">Conversion rate this period</div></div>
      </div>
      <div class="metric-card mc-outstanding${duesTotal > 0 ? ' metric-card-clickable' : ''}"${duesTotal > 0 ? ` onclick="setFilter('dues');goNav('editor')"` : ''}>
        <div class="metric-card-header"><span class="metric-card-label">Outstanding</span><div class="metric-card-value">${fmtCur(duesTotal, c)}</div><div class="metric-card-action">${duesTotal > 0 ? trend(-Math.round(duesTotal / (totalValue || 1) * 100)) : trend(0)}</div></div>
        <div class="metric-card-footer"><div class="metric-card-footer-trend">${duesTotal > 0 ? 'Unpaid balance' : 'All payments settled'}</div><div class="metric-card-footer-desc">${duesTotal > 0 ? 'Requires follow-up' : 'No outstanding dues'}</div></div>
      </div>
    </div>`;
}

function buildDuesBanner(active) {
    if (typeof paymentTotals !== 'function') return '';
    const accepted = (active || activeDB()).filter(p => p.status === 'accepted');
    if (!accepted.length) return '';
    let totalDue = 0, countPartial = 0, countUnpaid = 0;
    accepted.forEach(p => {
        const pt = paymentTotals(p);
        if (pt.balanceDue > 0) { totalDue += pt.balanceDue; if (pt.status === 'partial') countPartial++; else countUnpaid++; }
    });
    if (totalDue <= 0) return '';
    const count = countPartial + countUnpaid;
    const c = defaultCurrency();
    return `<div class="dues-banner"><div class="dues-banner-icon"><i data-lucide="wallet"></i></div><div class="dues-banner-body"><div class="dues-banner-val">${fmtCur(totalDue, c)}</div><div class="dues-banner-label">Outstanding across ${count} proposal${count !== 1 ? 's' : ''} (${countUnpaid} unpaid, ${countPartial} partial)</div></div><button class="btn-sm-outline" onclick="setFilter('dues');goNav('editor')"><i data-lucide="arrow-right"></i> View</button></div>`;
}

function buildExpiryBanner() {
  const dismissed = safeGetStorage('pk_dismissed', []);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiring = DB.filter(p => {
    if (p.archived || p.status === 'accepted' || p.status === 'declined') return false;
    if (dismissed.includes(p.id) || !p.validUntil) return false;
    const exp = new Date(p.validUntil); exp.setHours(0, 0, 0, 0);
    return Math.ceil((exp - today) / 86400000) <= 7;
  }).map(p => {
    const exp = new Date(p.validUntil); exp.setHours(0, 0, 0, 0);
    return { ...p, daysLeft: Math.ceil((exp - today) / 86400000) };
  }).sort((a, b) => a.daysLeft - b.daysLeft);
  if (!expiring.length) return '';
  return expiring.slice(0, 3).map(p => {
    let type, icon, text;
    if (p.daysLeft < 0) { type = 'expired'; icon = 'alert-circle'; text = `Expired ${Math.abs(p.daysLeft)} day${Math.abs(p.daysLeft) !== 1 ? 's' : ''} ago`; }
    else if (p.daysLeft === 0) { type = 'urgent'; icon = 'alert-triangle'; text = 'Expires today'; }
    else if (p.daysLeft <= 3) { type = 'warning'; icon = 'clock'; text = `Expires in ${p.daysLeft} day${p.daysLeft !== 1 ? 's' : ''}`; }
    else { type = 'info'; icon = 'info'; text = `Expires in ${p.daysLeft} days`; }
    return `<div class="expiry-banner ${type}"><i data-lucide="${icon}"></i><div class="expiry-text"><strong>${esc(p.title)}</strong> for ${esc(p.client?.name || 'Unknown')} — ${text}</div><button class="btn-sm-ghost" onclick="emailProposal('${escAttr(p.id)}')" data-tooltip="Follow up" data-side="bottom"><i data-lucide="mail"></i></button><button class="btn-sm-ghost" onclick="dismissExpiry('${escAttr(p.id)}')" data-tooltip="Dismiss" data-side="bottom"><i data-lucide="x"></i></button></div>`;
  }).join('');
}

function buildResumeBar() {
  const recent = activeDB()
    .filter(p => p.status === 'draft' || p.status === 'sent')
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) -
      (a.updatedAt || a.createdAt || 0))[0];
  if (!recent) return '';
  const value = (recent.lineItems || []).reduce((s, i) =>
    s + (i.qty || 0) * (i.rate || 0), 0);
  const ts = recent.updatedAt || recent.createdAt;
  const rid = escAttr(recent.id);
  const statusLabel = recent.status === 'sent' ? 'Sent' : 'Draft';
  const statusCls = recent.status === 'sent' ? 'sent' : 'draft';
  return `<div class="resume-card-v2" role="button" tabindex="0" onclick="loadEditor('${rid}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">
    <div class="resume-card-header">
      <span class="resume-card-label">Continue Working</span>
      <div class="resume-card-title">${esc(recent.title || 'Untitled')}</div>
      <div class="resume-card-action"><span class="resume-card-badge status-${statusCls}">${statusLabel}</span></div>
    </div>
    <div class="resume-card-footer">
      <div class="resume-card-trend">${recent.client?.name ? esc(recent.client.name) : ''}${recent.client?.name && value ? ' &middot; ' : ''}${value ? fmtCur(value, recent.currency) : ''}</div>
      <div class="resume-card-desc">${ts ? 'Last edited ' + timeAgo(ts) : 'Pick up where you left off'}</div>
    </div>
  </div>`;
}

function buildAlertsSection(active) {
  const expiryHtml = buildExpiryBanner();
  const duesHtml = typeof buildDuesBanner === 'function'
    ? buildDuesBanner(active) : '';
  if (!expiryHtml && !duesHtml) return '';
  return `<div class="dash-alerts">${expiryHtml}${duesHtml}</div>`;
}

function buildSideMetrics(active) {
  if (active.length < 2 || typeof computeAnalytics !== 'function') return '';
  const stats = computeAnalytics(active);
  const c = active[0]?.currency || defaultCurrency();
  return `<div class="dash-side-metrics">
    <div class="dsm-item"><div class="dsm-val ${stats.winRate >= 50 ? 'dsm-good' : stats.winRate > 0 ? 'dsm-mid' : ''}">${stats.winRate}%</div><div class="dsm-label">Win rate</div><div class="dsm-sub">${stats.accepted}/${stats.decided} decided</div></div>
    <div class="dsm-item"><div class="dsm-val">${fmtCur(stats.avgValue, c)}</div><div class="dsm-label">Avg value</div></div>
    <div class="dsm-item"><div class="dsm-val">${fmtCur(stats.forecast, c)}</div><div class="dsm-label">Forecast</div></div>
    <div class="dsm-item"><div class="dsm-val">${stats.avgDays > 0 ? stats.avgDays + 'd' : '\u2014'}</div><div class="dsm-label">Avg close</div></div>
  </div>`;
}

function buildActivityFeed() {
  const recents = activeDB()
    .filter(p => p.updatedAt || p.createdAt)
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
    .slice(0, 5);
  if (!recents.length) return '';
  const si = { draft: 'file-text', sent: 'send', accepted: 'check-circle', declined: 'x-circle', expired: 'clock' };
  const sc = { draft: 'var(--text3)', sent: 'var(--blue)', accepted: 'var(--green)', declined: 'var(--red)', expired: 'var(--amber)' };
  return `<div class="dash-activity"><div class="dash-activity-title">Recent activity</div>${recents.map(p => `<div class="act-item" onclick="loadEditor('${escAttr(p.id)}')"><i data-lucide="${si[p.status] || 'file-text'}" style="color:${sc[p.status] || 'var(--text3)'}"></i><div class="act-body"><div class="act-name">${esc(p.title || 'Untitled')}</div><div class="act-time">${timeAgo(p.updatedAt || p.createdAt)}</div></div></div>`).join('')}</div>`;
}

function buildDuesCard(active, c) {
  if (typeof paymentTotals !== 'function') return '';
  const accepted = active.filter(p => p.status === 'accepted');
  if (!accepted.length) return '';
  let totalDue = 0, countPartial = 0, countUnpaid = 0;
  accepted.forEach(p => {
    const pt = paymentTotals(p);
    if (pt.balanceDue > 0) { totalDue += pt.balanceDue; if (pt.status === 'partial') countPartial++; else countUnpaid++; }
  });
  if (totalDue <= 0) return '';
  const count = countPartial + countUnpaid;
  return `<div class="dues-card" role="button" tabindex="0" onclick="setFilter('dues');goNav('editor')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">
    <div class="resume-card-header">
      <span class="resume-card-label">Outstanding payments</span>
      <div class="resume-card-title dues-card-val">${fmtCur(totalDue, c)}</div>
      <div class="resume-card-action"><span class="resume-card-badge status-declined">${count} unpaid</span></div>
    </div>
    <div class="resume-card-footer">
      <div class="resume-card-trend">${countUnpaid} unpaid, ${countPartial} partial</div>
      <div class="resume-card-desc">Requires follow-up</div>
    </div>
  </div>`;
}

function buildStatusChart(active) {
  const counts = { draft: 0, sent: 0, accepted: 0, declined: 0, expired: 0 };
  active.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });
  const total = active.length;
  if (total === 0) return '';
  const items = [
    { key: 'draft', label: 'Draft', color: '#B8607A' },
    { key: 'sent', label: 'Sent', color: '#9B3A5A' },
    { key: 'accepted', label: 'Accepted', color: '#6D1A36' },
    { key: 'declined', label: 'Declined', color: '#4A0D24' },
    { key: 'expired', label: 'Expired', color: '#D4899E' }
  ].filter(i => counts[i.key] > 0);
  const bar = items.map(i =>
    `<div class="sbc-seg" style="flex:${counts[i.key]};background:${i.color}" data-tooltip="${i.label}: ${counts[i.key]}"></div>`
  ).join('');
  const legend = items.map(i =>
    `<div class="sbc-legend-item"><span class="sbc-dot" style="background:${i.color}"></span>${i.label} <strong>${counts[i.key]}</strong></div>`
  ).join('');
  return `<div class="sbc-glass-card">
    <div class="sbc-glass-header"><div class="sbc-glass-title">Proposal status</div><div class="sbc-glass-sub">${total} total</div></div>
    <div class="sbc-bar">${bar}</div>
    <div class="sbc-legend">${legend}</div>
  </div>`;
}

function dismissExpiry(id) {
  const dismissed = safeGetStorage('pk_dismissed', []);
  if (!dismissed.includes(id)) { dismissed.push(id); safeLsSet('pk_dismissed', dismissed); }
  renderDashboard();
}

function renderDashboard() {
  CUR = null;
  if (typeof hideTOC === 'function') hideTOC();
  document.getElementById('topTitle').textContent = 'Dashboard';
  const topSearch = document.getElementById('topSearch');
  if (topSearch) topSearch.style.display = '';
  document.getElementById('topRight').innerHTML = '';

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let changed = false;
  DB.forEach(p => {
    if (!p.archived && (p.status === 'draft' || p.status === 'sent') && p.validUntil) {
      const exp = new Date(p.validUntil); exp.setHours(0, 0, 0, 0);
      if (exp < today) { p.status = 'expired'; changed = true; }
    }
  });
  if (changed) persist();

  const body = document.getElementById('bodyScroll');
  const active = activeDB();
  const total = active.length;

  if (total === 0) {
    body.innerHTML = `
      <div class="first-run">
        <div class="fr-center">
          <dotlottie-wc src="https://assets-v2.lottiefiles.com/a/7a754088-1187-11ee-96ce-1b80a1a80dd1/npZCl6daoz.lottie" autoplay loop speed="0.8" style="width:280px;height:280px;margin:0 auto"></dotlottie-wc>
          <div class="fr-title">Create something great</div>
          <div class="fr-desc">Build professional proposals, invoices, and contracts.<br>Pick a template, add your content, and export a polished PDF.</div>
          <div class="fr-actions">
            <button class="btn fr-btn-primary" onclick="openNewModal()"><i data-lucide="plus"></i> New proposal</button>
            <button class="btn-outline fr-btn-outline" onclick="fromTpl('web')"><i data-lucide="sparkles"></i> Start from template</button>
          </div>
        </div>
        <div class="fr-pills">
          <div class="fr-pill"><i data-lucide="layout-template"></i> 13 PDF templates</div>
          <div class="fr-pill"><i data-lucide="palette"></i> Custom branding</div>
          <div class="fr-pill"><i data-lucide="download"></i> One-click export</div>
          <div class="fr-pill"><i data-lucide="share-2"></i> Client portal</div>
          <div class="fr-pill"><i data-lucide="bar-chart-3"></i> Analytics</div>
          <div class="fr-pill"><i data-lucide="users"></i> Client CRM</div>
        </div>
      </div>`;
    lucide.createIcons();
    return;
  }

  const c = defaultCurrency();

  const resumeHtml = buildResumeBar();
  const duesCardHtml = buildDuesCard(active, c);
  const hasTwoCol = resumeHtml && duesCardHtml;
  const expiryHtml = buildExpiryBanner();

  body.innerHTML = `
    <div class="dash-container">
      ${buildMetricCards(active, c)}
      <div class="dash-content">
        ${hasTwoCol ? `<div class="dash-two-col">${resumeHtml}${duesCardHtml}</div>` : `${resumeHtml}${duesCardHtml}`}
        ${expiryHtml ? `<div class="dash-alerts">${expiryHtml}</div>` : ''}
        ${typeof buildAnalyticsWidget === 'function' && active.length >= 3 ? buildAnalyticsWidget() : ''}
        ${active.length >= 2 ? buildStatusChart(active) : ''}
      </div>
    </div>`;
  lucide.createIcons();
  if (typeof drawAreaChart === 'function') {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      drawAreaChart();
      // Retry if canvas wasn't laid out yet
      const cv = document.getElementById('anAreaCanvas');
      if (cv && cv.width === 0) setTimeout(drawAreaChart, 100);
    }));
  }
}

function toggleSort() {
  const cycle = ['date', 'value', 'name'];
  currentSort = cycle[(cycle.indexOf(currentSort) + 1) % cycle.length];
  renderDashboard();
}

function sortProposals(list) {
  const sorted = [...list];
  if (currentSort === 'date') sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  else if (currentSort === 'value') sorted.sort((a, b) => {
    const va = (a.lineItems || []).reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);
    const vb = (b.lineItems || []).reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);
    return vb - va;
  });
  else if (currentSort === 'name') sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  return sorted;
}
