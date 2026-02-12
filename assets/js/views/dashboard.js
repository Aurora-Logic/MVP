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

    const curIcon = { INR: 'indian-rupee', USD: 'dollar-sign', EUR: 'euro', GBP: 'pound-sterling', JPY: 'japanese-yen' };
    const cIcon = curIcon[c] || 'banknote';

    return `<div class="dash-metric-grid">
      <div class="metric-card metric-card-clickable" onclick="goNav('proposals')">
        <div class="metric-card-header"><span class="metric-card-label">Total Pipeline</span><div class="metric-card-icon mci-revenue"><i data-lucide="${cIcon}"></i></div></div>
        <div class="metric-card-value">${fmtCur(totalValue, c)}</div>
        <div class="metric-card-footer">${trend(valTrend)} from last 30 days</div>
      </div>
      <div class="metric-card metric-card-clickable" onclick="setFilter('sent');goNav('proposals')">
        <div class="metric-card-header"><span class="metric-card-label">Active Proposals</span><div class="metric-card-icon mci-active"><i data-lucide="send"></i></div></div>
        <div class="metric-card-value">${sent}</div>
        <div class="metric-card-footer">${sent} awaiting response</div>
      </div>
      <div class="metric-card metric-card-clickable" onclick="setFilter('accepted');goNav('proposals')">
        <div class="metric-card-header"><span class="metric-card-label">Won Deals</span><div class="metric-card-icon mci-won"><i data-lucide="check-circle"></i></div></div>
        <div class="metric-card-value">${accepted}</div>
        <div class="metric-card-footer">${trend(wonTrend)} ${winRate}% win rate</div>
      </div>
      <div class="metric-card${duesTotal > 0 ? ' metric-card-clickable' : ''}"${duesTotal > 0 ? ` onclick="setFilter('dues');goNav('proposals')"` : ''}>
        <div class="metric-card-header"><span class="metric-card-label">Outstanding</span><div class="metric-card-icon mci-dues"><i data-lucide="wallet"></i></div></div>
        <div class="metric-card-value">${fmtCur(duesTotal, c)}</div>
        <div class="metric-card-footer">${duesTotal > 0 ? 'Unpaid balance' : 'All payments settled'}</div>
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
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))[0];
  if (!recent) return '';
  const value = (recent.lineItems || []).reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);
  const ts = recent.updatedAt || recent.createdAt;
  const rid = escAttr(recent.id);
  return `<div class="resume-bar" role="button" tabindex="0" onclick="loadEditor('${rid}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">
    <div class="resume-bar-icon"><i data-lucide="pen-line"></i></div>
    <div class="resume-bar-body">
      <div class="resume-bar-title">${esc(recent.title || 'Untitled')}</div>
      <div class="resume-bar-meta">${recent.client?.name ? esc(recent.client.name) : ''}${recent.client?.name && value ? ' &middot; ' : ''}${value ? fmtCur(value, recent.currency) : ''}${ts ? ' &middot; ' + timeAgo(ts) : ''}</div>
    </div>
    <button class="btn-sm resume-bar-btn" onclick="event.stopPropagation();loadEditor('${rid}')"><i data-lucide="arrow-right"></i> Continue</button>
  </div>`;
}

function buildAlertsSection(active) {
  const expiryHtml = buildExpiryBanner();
  const duesHtml = typeof buildDuesBanner === 'function' ? buildDuesBanner(active) : '';
  if (!expiryHtml && !duesHtml) return '';
  const expiryCount = (expiryHtml.match(/expiry-banner/g) || []).length;
  const total = expiryCount + (duesHtml ? 1 : 0);
  return `<div class="dash-alerts"><div class="dash-alerts-header"><div class="dash-alerts-title"><i data-lucide="bell"></i> Alerts <span class="dash-alerts-count">${total}</span></div></div><div class="dash-alerts-body">${expiryHtml}${duesHtml}</div></div>`;
}

function buildSideMetrics(active) {
  if (active.length < 2 || typeof computeAnalytics !== 'function') return '';
  const stats = computeAnalytics(active);
  const c = active[0]?.currency || defaultCurrency();
  return `<div class="dash-side-metrics">
    <div class="dsm-item"><div class="dsm-val ${stats.winRate >= 50 ? 'dsm-good' : stats.winRate > 0 ? 'dsm-mid' : ''}">${stats.winRate}%</div><div class="dsm-label">Win Rate</div><div class="dsm-sub">${stats.accepted}/${stats.decided} decided</div></div>
    <div class="dsm-item"><div class="dsm-val">${fmtCur(stats.avgValue, c)}</div><div class="dsm-label">Avg Value</div></div>
    <div class="dsm-item"><div class="dsm-val">${fmtCur(stats.forecast, c)}</div><div class="dsm-label">Forecast</div></div>
    <div class="dsm-item"><div class="dsm-val">${stats.avgDays > 0 ? stats.avgDays + 'd' : '\u2014'}</div><div class="dsm-label">Avg Close</div></div>
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
  return `<div class="dash-activity"><div class="dash-activity-title">Recent Activity</div>${recents.map(p => `<div class="act-item" onclick="loadEditor('${escAttr(p.id)}')"><i data-lucide="${si[p.status] || 'file-text'}" style="color:${sc[p.status] || 'var(--text3)'}"></i><div class="act-body"><div class="act-name">${esc(p.title || 'Untitled')}</div><div class="act-time">${timeAgo(p.updatedAt || p.createdAt)}</div></div></div>`).join('')}</div>`;
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
  document.getElementById('topRight').innerHTML = '<button class="btn-sm" onclick="openNewModal()" data-tooltip="New Proposal (⌘N)" data-side="bottom"><i data-lucide="plus"></i> New Proposal</button>';

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
        <div class="fr-icon"><i data-lucide="rocket"></i></div>
        <div class="fr-title">Create your first proposal</div>
        <div class="fr-desc">Build professional proposals in minutes. Pick a template, fill in the details, and export a polished PDF your clients will love.</div>
        <div class="fr-actions">
          <button class="btn" onclick="openNewModal()"><i data-lucide="plus"></i> New Proposal</button>
          <button class="btn-outline" onclick="fromTpl('web')"><i data-lucide="zap"></i> Try Web Dev Template</button>
        </div>
        <div class="fr-features">
          <div class="fr-feat"><div class="fr-feat-icon"><i data-lucide="layout-template"></i></div><div class="fr-feat-t">13 Templates</div><div class="fr-feat-d">Modern, Classic, Minimal, and 10 more</div></div>
          <div class="fr-feat"><div class="fr-feat-icon"><i data-lucide="palette"></i></div><div class="fr-feat-t">Your Brand</div><div class="fr-feat-d">Logo & colors on every proposal</div></div>
          <div class="fr-feat"><div class="fr-feat-icon"><i data-lucide="download"></i></div><div class="fr-feat-t">PDF Export</div><div class="fr-feat-d">One-click polished PDF exports</div></div>
          <div class="fr-feat"><div class="fr-feat-icon"><i data-lucide="share-2"></i></div><div class="fr-feat-t">Client Portal</div><div class="fr-feat-d">Share links & get digital acceptance</div></div>
        </div>
      </div>`;
    lucide.createIcons();
    return;
  }

  const accepted = active.filter(p => p.status === 'accepted').length;
  const sent = active.filter(p => p.status === 'sent').length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (CONFIG?.name || '').split(' ')[0];
  const c = defaultCurrency();

  body.innerHTML = `
    <div class="dash-header">
      <div><div class="dash-greeting">${greeting}${firstName ? ', ' + esc(firstName) : ''}</div>
      <div class="dash-subtitle">${sent} proposal${sent !== 1 ? 's' : ''} awaiting response${accepted ? ', ' + accepted + ' won' : ''}</div></div>
      <div class="dash-header-right"><button class="btn-sm" onclick="openNewModal()" data-tooltip="New Proposal (⌘N)" data-side="bottom"><i data-lucide="plus"></i> New Proposal</button></div>
    </div>
    ${buildMetricCards(active, c)}
    <div class="dash-body">
      <div class="dash-left">
        ${buildResumeBar()}
        ${buildAlertsSection(active)}
        ${typeof buildAnalyticsWidget === 'function' && active.length >= 3 ? buildAnalyticsWidget() : ''}
      </div>
      <div class="dash-right">
        ${buildSideMetrics(active)}
        ${buildActivityFeed()}
      </div>
    </div>`;
  lucide.createIcons();
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
