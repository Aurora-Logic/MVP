// ════════════════════════════════════════
// PROPOSALS VIEW — List, Filter, Pagination
// ════════════════════════════════════════

/* exported doQuickExport, quickPreview, showStatusMenu, setProposalStatus, setFilter, filterList, goPage, toggleSortProposals */
function renderPropList(list) {
  const wrap = document.getElementById('propListWrap');
  if (!list.length) {
    const filterIcons = { draft: 'file-text', sent: 'send', accepted: 'check-circle', declined: 'x-circle', expired: 'clock', dues: 'wallet', archived: 'archive' };
    const filterIcon = filterIcons[currentFilter] || 'search';
    const filterLabel = currentFilter !== 'all' ? currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1) : '';
    wrap.innerHTML = `<div class="empty" style="padding:60px 20px">
        <div class="empty-icon" style="width:48px;height:48px;border-radius:50%;background:var(--muted);display:flex;align-items:center;justify-content:center;margin:0 auto 16px"><i data-lucide="${esc(filterIcon)}" style="width:20px;height:20px;color:var(--text4)"></i></div>
        <div class="empty-t">${currentFilter !== 'all' ? 'No ' + esc(filterLabel) + ' proposals' : 'No results found'}</div>
        <div class="empty-d">${currentFilter !== 'all' ? 'Proposals will appear here once they have the "' + esc(filterLabel) + '" status.' : 'Try a different search term or create a new proposal.'}</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
            ${currentFilter !== 'all' ? '<button class="btn-sm-outline" onclick="setFilter(\'all\')"><i data-lucide="x"></i> Clear filter</button>' : ''}
            <button class="btn-sm" onclick="openNewModal()"><i data-lucide="plus"></i> New Proposal</button>
        </div>
    </div>`;
    lucide.createIcons();
    return;
  }

  const aviBgs = { draft: 'var(--muted)', sent: 'var(--blue-bg)', accepted: 'var(--green-bg)', declined: 'var(--red-bg)', expired: 'var(--amber-bg)', archived: 'var(--muted)' };
  const aviColors = { draft: 'var(--text3)', sent: 'var(--blue)', accepted: 'var(--green)', declined: 'var(--red)', expired: 'var(--amber)', archived: 'var(--text4)' };
  const isArchived = currentFilter === 'archived';

  const rows = list.map(p => {
    const val = (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0);
    const initials = (p.client?.name || p.title || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const isNew = (Date.now() - (p.createdAt || 0)) < 86400000;
    const pid = escAttr(p.id);
    return `<div class="prop-row" onclick="loadEditor('${pid}')" oncontextmenu="showCtx(event,'${pid}')">
      ${!isArchived ? `<input type="checkbox" class="bulk-check" data-id="${pid}" onclick="event.stopPropagation();toggleBulkCheck('${pid}', this)">` : ''}
      <div class="prop-avi" style="background:${aviBgs[isArchived ? 'archived' : p.status]};color:${aviColors[isArchived ? 'archived' : p.status]}">${initials}</div>
      <div class="prop-info">
        <div class="prop-title">${esc(p.title || 'Untitled')}${isNew ? ' <span class="badge-new">NEW</span>' : ''}</div>
        <div class="prop-meta">
          <span>${esc(p.number)}</span>
          ${p.client?.name ? '<span class="prop-meta-sep"></span><span>' + esc(p.client.name) + '</span>' : ''}
          <span class="prop-meta-sep"></span>
          <span>${timeAgo(p.createdAt || Date.now())}</span>
        </div>
      </div>
      <div class="prop-cols">
        <div class="prop-col">
          <div class="prop-col-label">Status</div>
          <div class="prop-col-val"><span class="badge badge-${p.status} badge-click" onclick="event.stopPropagation();showStatusMenu(event,'${pid}')"><span class="badge-dot"></span> ${p.status.charAt(0).toUpperCase() + p.status.slice(1)} <i data-lucide="chevron-down" class="badge-chevron"></i></span></div>
        </div>
        <div class="prop-col">
          <div class="prop-col-label">Score</div>
          <div class="prop-col-val">${buildScoreBadge(p)}</div>
        </div>
        ${typeof paymentStatusBadge === 'function' && p.status === 'accepted' ? `<div class="prop-col"><div class="prop-col-label">Payment</div><div class="prop-col-val">${paymentStatusBadge(p)}</div></div>` : ''}
        <div class="prop-col prop-col-value">
          <div class="prop-col-label">Value</div>
          <div class="prop-col-val mono">${fmtCur(val, p.currency)}</div>
        </div>
        <div class="prop-col prop-col-date">
          <div class="prop-col-label">Date</div>
          <div class="prop-col-val prop-col-date-val">${fmtDate(p.date)}</div>
        </div>
      </div>
      <div class="prop-actions">
        ${isArchived ? `
        <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();unarchiveProp('${pid}')" data-tooltip="Restore" data-side="bottom" data-align="center"><i data-lucide="archive-restore"></i></button>
        <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();delProp('${pid}')" data-tooltip="Delete" data-side="bottom" data-align="center"><i data-lucide="trash-2"></i></button>
        ` : `
        <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();emailProposal('${pid}')" data-tooltip="Email" data-side="bottom"><i data-lucide="mail"></i></button>
        <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();dupProp('${pid}')" data-tooltip="Duplicate" data-side="bottom"><i data-lucide="copy"></i></button>
        <button class="btn-sm-icon-ghost" onclick="event.stopPropagation();showCtx(event,'${pid}')" data-tooltip="More" data-side="bottom"><i data-lucide="more-horizontal"></i></button>
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
    `<button class="status-opt" onclick="setProposalStatus('${escAttr(id)}','${escAttr(s.status)}')">
            <i data-lucide="${s.icon}" class="status-opt-icon" style="color:${s.color}"></i>
            <span>${s.label}</span>
        </button>`
  ).join('');

  dropdown.style.left = Math.min(event.clientX, window.innerWidth - 160) + 'px';
  dropdown.style.top = Math.min(event.clientY, window.innerHeight - 200) + 'px';
  document.body.appendChild(dropdown);
  lucide.createIcons();

  const close = () => { dropdown.remove(); document.removeEventListener('click', close); };
  setTimeout(() => document.addEventListener('click', close), 10);
}

function setProposalStatus(id, status) {
  const validStatuses = ['draft', 'sent', 'accepted', 'declined', 'expired'];
  if (!validStatuses.includes(status)) return;
  const p = DB.find(x => x.id === id);
  if (!p) return;
  p.status = status;
  persist();
  renderProposals();
  toast(`Status updated to ${status.charAt(0).toUpperCase() + status.slice(1)}`);
}

function setFilter(f) { currentFilter = f; currentPage = 1; renderProposals(); }
function filterList() {
  const q = document.getElementById('searchInput')?.value?.trim() || '';
  if (!CUR && q) {
    document.querySelectorAll('[data-nav]').forEach(b => b.classList.remove('on'));
    document.querySelector('[data-nav="editor"]')?.classList.add('on');
    renderProposals();
  } else if (!CUR) {
    renderProposals();
  }
}

// Pagination
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

function renderProposals() {
  CUR = null;
  if (typeof hideTOC === 'function') hideTOC();
  document.getElementById('topTitle').textContent = 'Proposals';
  const topSearch = document.getElementById('topSearch');
  if (topSearch) topSearch.style.display = '';
  document.getElementById('topRight').innerHTML = '<button class="btn-sm" onclick="openNewModal()" data-tooltip="New Proposal (⌘N)" data-side="bottom"><i data-lucide="plus"></i> New Proposal</button>';

  const body = document.getElementById('bodyScroll');
  const isArchiveView = currentFilter === 'archived';
  const baseList = isArchiveView ? DB.filter(p => p.archived) : activeDB();
  const total = baseList.length;

  if (total === 0 && currentFilter === 'all') {
    body.innerHTML = `
      <div class="first-run">
        <div class="fr-icon"><i data-lucide="rocket"></i></div>
        <div class="fr-title">Create your first proposal</div>
        <div class="fr-desc">Build professional proposals in minutes.</div>
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
  const duesCount = typeof paymentTotals === 'function' ? filtered.filter(p => p.status === 'accepted' && paymentTotals(p).balanceDue > 0).length : 0;
  const counts = { all: filtered.length, draft: filtered.filter(p => p.status === 'draft').length, sent: filtered.filter(p => p.status === 'sent').length, accepted: filtered.filter(p => p.status === 'accepted').length, declined: filtered.filter(p => p.status === 'declined').length, expired: filtered.filter(p => p.status === 'expired').length, dues: duesCount, archived: archivedCount };

  // Apply filter
  let display = isArchiveView ? filtered : (currentFilter === 'all' ? filtered : currentFilter === 'dues' ? filtered.filter(p => p.status === 'accepted' && typeof paymentTotals === 'function' && paymentTotals(p).balanceDue > 0) : filtered.filter(p => p.status === currentFilter));
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
          <button class="filter-tab${currentFilter === 'draft' ? ' on' : ''}${!counts.draft ? ' dimmed' : ''}" onclick="setFilter('draft')">Draft <span class="fc">${counts.draft}</span></button>
          <button class="filter-tab${currentFilter === 'sent' ? ' on' : ''}${!counts.sent ? ' dimmed' : ''}" onclick="setFilter('sent')">Sent <span class="fc">${counts.sent}</span></button>
          <button class="filter-tab${currentFilter === 'accepted' ? ' on' : ''}${!counts.accepted ? ' dimmed' : ''}" onclick="setFilter('accepted')">Won <span class="fc">${counts.accepted}</span></button>
          <button class="filter-tab${currentFilter === 'declined' ? ' on' : ''}${!counts.declined ? ' dimmed' : ''}" onclick="setFilter('declined')">Lost <span class="fc">${counts.declined}</span></button>
          <button class="filter-tab${currentFilter === 'expired' ? ' on' : ''}${!counts.expired ? ' dimmed' : ''}" onclick="setFilter('expired')">Expired <span class="fc">${counts.expired}</span></button>
          ${typeof paymentTotals === 'function' ? `<button class="filter-tab${currentFilter === 'dues' ? ' on' : ''}${!counts.dues ? ' dimmed' : ''}" onclick="setFilter('dues')"><i data-lucide="wallet"></i> Dues <span class="fc">${counts.dues}</span></button>` : ''}
          <button class="filter-tab${currentFilter === 'archived' ? ' on' : ''}${!counts.archived ? ' dimmed' : ''}" onclick="setFilter('archived')"><i data-lucide="archive"></i> Archived <span class="fc">${counts.archived}</span></button>
        </div>
        <button class="sort-btn" onclick="toggleSortProposals()" id="sortBtnP"><i data-lucide="arrow-up-down"></i> ${currentSort === 'date' ? 'Newest' : currentSort === 'value' ? 'Highest' : currentSort === 'name' ? 'A-Z' : 'Newest'}</button>
        ${typeof quickRecordPayment === 'function' && counts.dues > 0 ? `<button class="sort-btn" onclick="showPaymentPickerMenu(event)" style="color:var(--green)"><i data-lucide="indian-rupee"></i> Record Payment</button>` : ''}
        <div class="view-toggle">
          <button class="vt-btn${viewMode === 'list' ? ' on' : ''}" onclick="setViewMode('list')" data-tooltip="List view" data-side="bottom"><i data-lucide="list"></i></button>
          <button class="vt-btn${viewMode === 'kanban' ? ' on' : ''}" onclick="setViewMode('kanban')" data-tooltip="Board view" data-side="bottom"><i data-lucide="kanban"></i></button>
        </div>
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

  if (viewMode === 'kanban' && typeof renderKanban === 'function') {
    renderKanban();
  } else {
    // Show skeleton, then render real list
    const wrap = document.getElementById('propListWrap');
    if (wrap) {
      wrap.innerHTML = Array(Math.min(paginated.length || 3, 5)).fill(0).map(() =>
        `<div class="skeleton-row"><div class="skeleton" style="width:32px;height:32px;border-radius:50%"></div><div style="flex:1;display:flex;flex-direction:column;gap:6px"><div class="skeleton skeleton-text w-3-4"></div><div class="skeleton skeleton-text w-1-2"></div></div><div class="skeleton skeleton-badge"></div></div>`
      ).join('');
      requestAnimationFrame(() => { renderPropList(paginated); });
    } else {
      renderPropList(paginated);
    }
  }
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
