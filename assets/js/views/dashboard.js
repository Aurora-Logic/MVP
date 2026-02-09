// ════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════

function buildExpiryBanner() {
  const dismissed = safeGetStorage('pk_dismissed', []);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiring = DB.filter(p => {
    if (p.archived) return false;
    if (p.status === 'accepted' || p.status === 'declined') return false;
    if (dismissed.includes(p.id)) return false;
    if (!p.validUntil) return false;
    const exp = new Date(p.validUntil);
    exp.setHours(0, 0, 0, 0);
    const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    return diff <= 7;
  }).map(p => {
    const exp = new Date(p.validUntil);
    exp.setHours(0, 0, 0, 0);
    const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    return { ...p, daysLeft: diff };
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  if (expiring.length === 0) return '';

  return expiring.slice(0, 3).map(p => {
    let type, icon, text;
    if (p.daysLeft < 0) {
      type = 'expired'; icon = 'alert-circle'; text = `Expired ${Math.abs(p.daysLeft)} day${Math.abs(p.daysLeft) !== 1 ? 's' : ''} ago`;
    } else if (p.daysLeft === 0) {
      type = 'urgent'; icon = 'alert-triangle'; text = 'Expires today';
    } else if (p.daysLeft <= 3) {
      type = 'warning'; icon = 'clock'; text = `Expires in ${p.daysLeft} day${p.daysLeft !== 1 ? 's' : ''}`;
    } else {
      type = 'info'; icon = 'info'; text = `Expires in ${p.daysLeft} days`;
    }
    return `<div class="expiry-banner ${type}">
            <i data-lucide="${icon}"></i>
            <div class="expiry-text">
                <strong>${esc(p.title)}</strong> for ${esc(p.client?.name || 'Unknown')} — ${text}
            </div>
            <button class="btn-sm-ghost" onclick="emailProposal('${escAttr(p.id)}')" data-tooltip="Follow up" data-side="bottom" data-align="center"><i data-lucide="mail"></i></button>
            <button class="btn-sm-ghost" onclick="dismissExpiry('${escAttr(p.id)}')" data-tooltip="Dismiss" data-side="bottom" data-align="center"><i data-lucide="x"></i></button>
        </div>`;
  }).join('');
}

function buildResumeCard() {
  const recent = activeDB()
    .filter(p => p.status === 'draft' || p.status === 'sent')
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))[0];
  if (!recent) return '';
  const value = (recent.lineItems || []).reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);
  const ts = recent.updatedAt || recent.createdAt;
  const ago = ts ? timeAgo(ts) : '';
  const rid = escAttr(recent.id);
  return `<div class="resume-card" onclick="loadEditor('${rid}')">
    <div class="resume-icon"><i data-lucide="pen-line"></i></div>
    <div class="resume-body">
      <div class="resume-label">Continue where you left off</div>
      <div class="resume-title">${esc(recent.title || 'Untitled')}</div>
      <div class="resume-meta">
        ${recent.client?.name ? '<span>' + esc(recent.client.name) + '</span>' : ''}
        ${value ? '<span>' + fmtCur(value, recent.currency) + '</span>' : ''}
        ${ago ? '<span>' + ago + '</span>' : ''}
      </div>
    </div>
    <button class="btn-sm-outline resume-btn" onclick="event.stopPropagation();loadEditor('${rid}')"><i data-lucide="arrow-right"></i> Continue</button>
  </div>`;
}

function dismissExpiry(id) {
  const dismissed = safeGetStorage('pk_dismissed', []);
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    safeLsSet('pk_dismissed', dismissed);
  }
  renderDashboard();
}

function renderDashboard() {
  CUR = null;
  if (typeof hideTOC === 'function') hideTOC();
  document.getElementById('topTitle').textContent = 'Dashboard';
  const topSearch = document.getElementById('topSearch');
  if (topSearch) topSearch.style.display = '';
  document.getElementById('topRight').innerHTML = '<button class="btn-sm" onclick="openNewModal()" data-tooltip="New Proposal (⌘N)" data-side="bottom"><i data-lucide="plus"></i> New Proposal</button>';

  // Auto-expire proposals past their validUntil date (skip archived)
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
        <div class="fr-desc">ProposalKit helps you build professional proposals in minutes. Pick a template, fill in the details, and export a polished PDF your clients will love.</div>
        <div class="fr-actions">
          <button class="btn" onclick="openNewModal()"><i data-lucide="plus"></i> New Proposal</button>
          <button class="btn-outline" onclick="fromTpl('web')"><i data-lucide="zap"></i> Try Web Dev Template</button>
        </div>
        <div class="fr-features">
          <div class="fr-feat"><div class="fr-feat-icon"><i data-lucide="layout-template"></i></div><div class="fr-feat-t">4 Templates</div><div class="fr-feat-d">Web, Design, Consulting, or start blank</div></div>
          <div class="fr-feat"><div class="fr-feat-icon"><i data-lucide="palette"></i></div><div class="fr-feat-t">Your Brand</div><div class="fr-feat-d">Logo & colors on every proposal</div></div>
          <div class="fr-feat"><div class="fr-feat-icon"><i data-lucide="download"></i></div><div class="fr-feat-t">PDF Export</div><div class="fr-feat-d">One-click professional exports</div></div>
        </div>
      </div>`;
    lucide.createIcons();
    return;
  }

  const accepted = active.filter(p => p.status === 'accepted').length;
  const sent = active.filter(p => p.status === 'sent').length;
  const totalValue = active.reduce((a, p) => a + (p.lineItems || []).reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (CONFIG?.name || '').split(' ')[0];

  body.innerHTML = `
    <div class="dash-welcome">
      <div class="dash-welcome-t">${greeting}${firstName ? ', ' + esc(firstName) : ''}</div>
      <div class="dash-welcome-d">You have ${sent} proposal${sent !== 1 ? 's' : ''} awaiting response${accepted ? ' and ' + accepted + ' accepted' : ''}</div>
    </div>

    ${buildResumeCard()}
    ${buildExpiryBanner()}

    <div class="dash-grid">
      <div class="stat-card" onclick="goNav('editor')">
        <div class="stat-top"><div class="stat-icon si-total"><i data-lucide="file-text"></i></div></div>
        <div class="stat-val">${total}</div>
        <div class="stat-label">Total Proposals</div>
      </div>
      <div class="stat-card" onclick="setFilter('sent');goNav('editor')">
        <div class="stat-top"><div class="stat-icon si-sent"><i data-lucide="send"></i></div></div>
        <div class="stat-val">${sent}</div>
        <div class="stat-label">Awaiting Response</div>
      </div>
      <div class="stat-card" onclick="setFilter('accepted');goNav('editor')">
        <div class="stat-top"><div class="stat-icon si-accepted"><i data-lucide="check-circle"></i></div></div>
        <div class="stat-val">${accepted}</div>
        <div class="stat-label">Won</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><div class="stat-icon si-value"><i data-lucide="banknote"></i></div></div>
        <div class="stat-val">${fmtCur(totalValue, defaultCurrency())}</div>
        <div class="stat-label">Total Pipeline Value</div>
      </div>
    </div>

    ${typeof buildAnalyticsWidget === 'function' && active.length >= 3 ? buildAnalyticsWidget() : ''}
  `;

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
