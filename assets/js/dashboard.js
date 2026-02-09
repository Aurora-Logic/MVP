// ════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════

function buildExpiryBanner() {
  const dismissed = JSON.parse(localStorage.getItem('pk_dismissed') || '[]');
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
            <button class="btn-sm-ghost" onclick="emailProposal('${p.id}')" data-tooltip="Follow up" data-side="bottom" data-align="center"><i data-lucide="mail"></i></button>
            <button class="btn-sm-ghost" onclick="dismissExpiry('${p.id}')" data-tooltip="Dismiss" data-side="bottom" data-align="center"><i data-lucide="x"></i></button>
        </div>`;
  }).join('');
}

function dismissExpiry(id) {
  const dismissed = JSON.parse(localStorage.getItem('pk_dismissed') || '[]');
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem('pk_dismissed', JSON.stringify(dismissed));
  }
  renderDashboard();
}

function renderDashboard() {
  CUR = null;
  document.getElementById('topTitle').textContent = 'Dashboard';
  const topSearch = document.getElementById('topSearch');
  if (topSearch) topSearch.style.display = 'none';
  document.getElementById('topRight').innerHTML = '<button class="btn-sm" onclick="openNewModal()"><i data-lucide="plus"></i> New Proposal</button>';

  // Auto-expire proposals past their validUntil date (skip archived)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  DB.forEach(p => {
    if (!p.archived && (p.status === 'draft' || p.status === 'sent') && p.validUntil) {
      const exp = new Date(p.validUntil); exp.setHours(0, 0, 0, 0);
      if (exp < today) p.status = 'expired';
    }
  });
  persist();

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
  const drafts = active.filter(p => p.status === 'draft').length;
  const totalValue = active.reduce((a, p) => a + (p.lineItems || []).reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (CONFIG?.name || '').split(' ')[0];

  body.innerHTML = `
    <div class="dash-welcome">
      <div class="dash-welcome-t">${greeting}${firstName ? ', ' + esc(firstName) : ''}</div>
      <div class="dash-welcome-d">You have ${sent} proposal${sent !== 1 ? 's' : ''} awaiting response${accepted ? ' and ' + accepted + ' accepted' : ''}</div>
    </div>

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
        <div class="stat-val">${fmtCur(totalValue, CONFIG?.currency || 'INR')}</div>
        <div class="stat-label">Total Pipeline Value</div>
      </div>
    </div>

    ${typeof buildAnalyticsWidget === 'function' && active.length >= 3 ? buildAnalyticsWidget() : ''}

    <div class="dash-actions" style="margin-top:20px">
      <button class="btn" onclick="goNav('editor')"><i data-lucide="list"></i> View All Proposals</button>
      <button class="btn-outline" onclick="openNewModal()"><i data-lucide="plus"></i> New Proposal</button>
    </div>
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

function renderPropList(list) {
  const wrap = document.getElementById('propListWrap');
  if (!list.length) {
    wrap.innerHTML = `<div class="empty" style="padding:50px 20px"><div class="empty-icon"><i data-lucide="search"></i></div><div class="empty-t">No proposals found</div><div class="empty-d">${currentFilter !== 'all' ? 'No ' + currentFilter + ' proposals yet. Change the filter or create a new one.' : 'Try a different search term or create a new proposal.'}</div>${currentFilter !== 'all' ? '<button class="btn-sm-outline" onclick="setFilter(\'all\')"><i data-lucide="x"></i> Clear filter</button>' : '<button class="btn-sm" onclick="openNewModal()"><i data-lucide="plus"></i> Create Proposal</button>'}</div>`;
    lucide.createIcons();
    return;
  }

  const aviBgs = { draft: 'var(--muted)', sent: 'var(--blue-bg)', accepted: 'var(--green-bg)', declined: 'var(--red-bg)', expired: 'var(--amber-bg)', archived: 'var(--muted)' };
  const aviColors = { draft: 'var(--text3)', sent: 'var(--blue)', accepted: 'var(--green)', declined: 'var(--red)', expired: 'var(--amber)', archived: 'var(--text4)' };
  const isArchived = currentFilter === 'archived';

  let rows = list.map(p => {
    const val = (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0);
    const initials = (p.client.name || p.title || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const isNew = (Date.now() - (p.createdAt || 0)) < 86400000;
    return `<div class="prop-row" onclick="loadEditor('${p.id}')" oncontextmenu="showCtx(event,'${p.id}')">
      ${!isArchived ? `<input type="checkbox" class="bulk-check" data-id="${p.id}" onclick="event.stopPropagation();toggleBulkCheck('${p.id}', this)">` : ''}
      <div class="prop-avi" style="background:${aviBgs[isArchived ? 'archived' : p.status]};color:${aviColors[isArchived ? 'archived' : p.status]}">${initials}</div>
      <div class="prop-info">
        <div class="prop-title">${esc(p.title || 'Untitled')}${isNew ? ' <span class="badge-new">NEW</span>' : ''}</div>
        <div class="prop-meta">
          <span>${esc(p.number)}</span>
          ${p.client.name ? '<span class="prop-meta-sep"></span><span>' + esc(p.client.name) + '</span>' : ''}
          <span class="prop-meta-sep"></span>
          <span>${timeAgo(p.createdAt || Date.now())}</span>
        </div>
      </div>
      <div class="prop-cols">
        <div class="prop-col">
          <div class="prop-col-label">Status</div>
          <div class="prop-col-val"><span class="badge badge-${p.status}" style="font-size:10px;padding:2px 7px"><span class="badge-dot" style="width:5px;height:5px"></span> ${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></div>
        </div>
        <div class="prop-col" style="min-width:100px">
          <div class="prop-col-label">Value</div>
          <div class="prop-col-val mono">${fmtCur(val, p.currency)}</div>
        </div>
        <div class="prop-col" style="min-width:70px">
          <div class="prop-col-label">Date</div>
          <div class="prop-col-val" style="font-weight:500;color:var(--text3);font-size:12px">${fmtDate(p.date)}</div>
        </div>
      </div>
      <div class="prop-actions">
        ${isArchived ? `
        <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();unarchiveProp('${p.id}')" data-tooltip="Restore" data-side="bottom" data-align="center"><i data-lucide="archive-restore"></i></button>
        <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();delProp('${p.id}')" data-tooltip="Delete" data-side="bottom" data-align="center"><i data-lucide="trash-2"></i></button>
        ` : `
        <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();emailProposal('${p.id}')" data-tooltip="Email" data-side="bottom" data-align="center"><i data-lucide="mail"></i></button>
        <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();quickPreview('${p.id}')" data-tooltip="Preview" data-side="bottom" data-align="center"><i data-lucide="eye"></i></button>
        <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();dupProp('${p.id}')" data-tooltip="Duplicate" data-side="bottom" data-align="center"><i data-lucide="copy"></i></button>
        <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();doQuickExport('${p.id}')" data-tooltip="Export" data-side="bottom" data-align="center"><i data-lucide="download"></i></button>
        <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();showStatusMenu(event,'${p.id}')" data-tooltip="Status" data-side="bottom" data-align="center"><i data-lucide="check-circle"></i></button>
        <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();showCtx(event,'${p.id}')" data-tooltip="More" data-side="bottom" data-align="center"><i data-lucide="more-horizontal"></i></button>
        `}
      </div>
    </div>`;
  }).join('');

  wrap.innerHTML = '<div class="prop-list">' + rows + '</div>';
  lucide.createIcons();
}

function doQuickExport(id) {
  CUR = id;
  doExport('proposal');
}

function quickPreview(id) {
  CUR = id;
  openPreview();
}

function showStatusMenu(event, id) {
  event.stopPropagation();
  const existing = document.querySelector('.status-dropdown');
  if (existing) existing.remove();

  const statuses = [
    { status: 'draft', label: 'Draft', icon: 'file-text', color: 'var(--text3)' },
    { status: 'sent', label: 'Sent', icon: 'send', color: 'var(--blue)' },
    { status: 'accepted', label: 'Accepted', icon: 'check-circle', color: 'var(--green)' },
    { status: 'declined', label: 'Declined', icon: 'x-circle', color: 'var(--red)' }
  ];

  const dropdown = document.createElement('div');
  dropdown.className = 'status-dropdown';
  dropdown.innerHTML = statuses.map(s =>
    `<button class="status-opt" onclick="setProposalStatus('${id}','${s.status}')">
            <i data-lucide="${s.icon}" style="width:14px;height:14px;color:${s.color}"></i>
            <span>${s.label}</span>
        </button>`
  ).join('');

  dropdown.style.cssText = `position:fixed;left:${event.clientX}px;top:${event.clientY}px;z-index:9999`;
  document.body.appendChild(dropdown);
  lucide.createIcons();

  const close = () => { dropdown.remove(); document.removeEventListener('click', close); };
  setTimeout(() => document.addEventListener('click', close), 10);
}

function setProposalStatus(id, status) {
  const p = DB.find(x => x.id === id);
  if (!p) return;
  p.status = status;
  persist();
  renderDashboard();
  toast(`Status updated to ${status.charAt(0).toUpperCase() + status.slice(1)}`);
}

function setFilter(f) { currentFilter = f; currentPage = 1; renderProposals(); }
function filterList() { if (!CUR) renderProposals(); }

// Pagination
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

function renderProposals() {
  CUR = null;
  document.getElementById('topTitle').textContent = 'Proposals';
  const topSearch = document.getElementById('topSearch');
  if (topSearch) topSearch.style.display = '';
  document.getElementById('topRight').innerHTML = '<button class="btn-sm" onclick="openNewModal()"><i data-lucide="plus"></i> New Proposal</button>';

  const body = document.getElementById('bodyScroll');
  const isArchiveView = currentFilter === 'archived';
  const baseList = isArchiveView ? DB.filter(p => p.archived) : activeDB();
  const total = baseList.length;

  if (total === 0 && currentFilter === 'all') {
    body.innerHTML = `
      <div class="first-run">
        <div class="fr-icon"><i data-lucide="rocket"></i></div>
        <div class="fr-title">Create your first proposal</div>
        <div class="fr-desc">ProposalKit helps you build professional proposals in minutes.</div>
        <div class="fr-actions">
          <button class="btn" onclick="openNewModal()"><i data-lucide="plus"></i> New Proposal</button>
          <button class="btn-outline" onclick="fromTpl('web')"><i data-lucide="zap"></i> Try Web Template</button>
        </div>
      </div>`;
    lucide.createIcons();
    return;
  }

  let filtered = [...baseList];
  const q = document.getElementById('searchInput')?.value?.toLowerCase().trim() || '';
  if (q) filtered = filtered.filter(p =>
    (p.title || '').toLowerCase().includes(q) ||
    (p.client?.name || '').toLowerCase().includes(q) ||
    (p.client?.email || '').toLowerCase().includes(q) ||
    (p.number || '').toLowerCase().includes(q)
  );

  const archivedCount = DB.filter(p => p.archived).length;
  const counts = { all: filtered.length, draft: filtered.filter(p => p.status === 'draft').length, sent: filtered.filter(p => p.status === 'sent').length, accepted: filtered.filter(p => p.status === 'accepted').length, declined: filtered.filter(p => p.status === 'declined').length, expired: filtered.filter(p => p.status === 'expired').length, archived: archivedCount };

  // Apply filter
  let display = isArchiveView ? filtered : (currentFilter === 'all' ? filtered : filtered.filter(p => p.status === currentFilter));
  display = sortProposals(display);

  // Pagination
  const totalPages = Math.ceil(display.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = display.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  body.innerHTML = `
    <div class="dash-toolbar">
      <div class="dash-toolbar-left">
        <div class="dash-toolbar-t">${currentFilter === 'all' ? 'All Proposals' : currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)}</div>
        <span class="dash-count">${counts[currentFilter]} result${counts[currentFilter] !== 1 ? 's' : ''}</span>
      </div>
      <div class="dash-toolbar-right">
        <div class="filter-tabs">
          <button class="filter-tab${currentFilter === 'all' ? ' on' : ''}" onclick="setFilter('all')">All <span class="fc">${counts.all}</span></button>
          <button class="filter-tab${currentFilter === 'draft' ? ' on' : ''}" onclick="setFilter('draft')">Draft <span class="fc">${counts.draft}</span></button>
          <button class="filter-tab${currentFilter === 'sent' ? ' on' : ''}" onclick="setFilter('sent')">Sent <span class="fc">${counts.sent}</span></button>
          <button class="filter-tab${currentFilter === 'accepted' ? ' on' : ''}" onclick="setFilter('accepted')">Won <span class="fc">${counts.accepted}</span></button>
          <button class="filter-tab${currentFilter === 'declined' ? ' on' : ''}" onclick="setFilter('declined')">Lost <span class="fc">${counts.declined}</span></button>
          <button class="filter-tab${currentFilter === 'expired' ? ' on' : ''}" onclick="setFilter('expired')">Expired <span class="fc">${counts.expired}</span></button>
          <button class="filter-tab${currentFilter === 'archived' ? ' on' : ''}" onclick="setFilter('archived')"><i data-lucide="archive" style="width:12px;height:12px"></i> Archived <span class="fc">${counts.archived}</span></button>
        </div>
        <button class="sort-btn" onclick="toggleSortProposals()" id="sortBtnP"><i data-lucide="arrow-up-down"></i> ${currentSort === 'date' ? 'Newest' : currentSort === 'value' ? 'Highest' : currentSort === 'name' ? 'A-Z' : 'Newest'}</button>
      </div>
    </div>

    <div id="propListWrap"></div>
    
    ${totalPages > 1 ? `
    <div class="pagination">
      <button class="btn-sm-outline" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i data-lucide="chevron-left"></i> Prev</button>
      <span class="pg-info">Page ${currentPage} of ${totalPages}</span>
      <button class="btn-sm-outline" onclick="goPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>Next <i data-lucide="chevron-right"></i></button>
    </div>
    ` : ''}
    
    <div class="bulk-bar" id="bulkBar" style="display:none"></div>
  `;

  if (typeof bulkSelected !== 'undefined') bulkSelected.clear();
  renderPropList(paginated);
  lucide.createIcons();
}

function goPage(page) {
  if (page < 1) return;
  currentPage = page;
  renderProposals();
}

function toggleSortProposals() {
  const cycle = ['date', 'value', 'name'];
  currentSort = cycle[(cycle.indexOf(currentSort) + 1) % cycle.length];
  renderProposals();
}
