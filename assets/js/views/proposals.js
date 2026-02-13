// ════════════════════════════════════════
// PROPOSALS VIEW — Notion-style Table & List
// ════════════════════════════════════════

/* exported doQuickExport, quickPreview, showStatusMenu, setProposalStatus, setFilter, filterList, goPage, toggleSortProposals, showSortMenu */

function getSmartDate(p) {
  if (p.status === 'accepted' && p.clientResponse?.respondedAt) return 'Accepted ' + timeAgo(p.clientResponse.respondedAt);
  if (p.status === 'declined' && p.clientResponse?.respondedAt) return 'Declined ' + timeAgo(p.clientResponse.respondedAt);
  if (p.status === 'expired' && p.validUntil) return 'Expired ' + timeAgo(new Date(p.validUntil).getTime());
  if (p.status === 'sent') return 'Sent ' + timeAgo(p.updatedAt || p.createdAt || Date.now());
  return timeAgo(p.createdAt || Date.now());
}

const _emptyMessages = {
  draft: { title: 'No drafts yet', desc: 'Start writing a proposal and it will appear here as a draft.' },
  sent: { title: 'Nothing sent yet', desc: 'Once you send a proposal to a client, it will show up here.' },
  accepted: { title: 'No wins yet', desc: 'Accepted proposals will appear here. Keep going!' },
  declined: { title: 'No declined proposals', desc: 'Proposals declined by clients will appear here.' },
  expired: { title: 'Nothing expired', desc: 'Proposals past their validity date will show up here.' },
  dues: { title: 'No outstanding dues', desc: 'All accepted proposals are fully paid. Nice work!' },
  archived: { title: 'Archive is empty', desc: 'Archived proposals will appear here when you archive them.' },
  all: { title: 'No results found', desc: 'Try a different search term or create a new proposal.' }
};

function renderPropTable(list) {
  const wrap = document.getElementById('propListWrap');
  if (!list.length) {
    const filterIcons = { draft: 'file-text', sent: 'send', accepted: 'check-circle', declined: 'x-circle', expired: 'clock', dues: 'wallet', archived: 'archive' };
    const filterIcon = filterIcons[currentFilter] || 'search';
    const msg = _emptyMessages[currentFilter] || _emptyMessages.all;
    wrap.innerHTML = `<div class="empty" style="padding:60px 20px">
        <div class="empty-icon" style="width:48px;height:48px;border-radius:50%;background:var(--muted);display:flex;align-items:center;justify-content:center;margin:0 auto 14px"><i data-lucide="${esc(filterIcon)}" style="width:20px;height:20px;color:var(--text4)"></i></div>
        <div class="empty-t">${msg.title}</div>
        <div class="empty-d">${msg.desc}</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:16px">
            ${currentFilter !== 'all' ? '<button class="btn-sm-outline" onclick="setFilter(\'all\')"><i data-lucide="arrow-left"></i> All proposals</button>' : ''}
            <button class="btn-sm" onclick="openNewModal()"><i data-lucide="plus"></i> New proposal</button>
        </div>
    </div>`;
    if (typeof lucideScope === 'function') lucideScope(wrap); else lucide.createIcons();
    return;
  }

  const isArchived = currentFilter === 'archived';
  const rows = list.map(p => {
    const t = typeof calcTotals === 'function' ? calcTotals(p) : { grand: (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0) };
    const val = t.grand;
    const pid = escAttr(p.id);
    const smartDate = getSmartDate(p);
    const st = isArchived ? 'archived' : p.status;
    const statusLabel = st.charAt(0).toUpperCase() + st.slice(1);
    const stIcon = statusIcon(st);

    if (viewMode === 'table') {
      return `<tr class="nt-row" onclick="loadEditor('${pid}')" oncontextmenu="showCtx(event,'${pid}')">
        <td class="nt-cell nt-cell-check">${!isArchived ? `<label class="bulk-check-wrap" onclick="event.stopPropagation()"><input type="checkbox" class="bulk-check-input" data-id="${pid}" onchange="toggleBulkCheck('${pid}', this)"><span class="bulk-check-pill"></span></label>` : ''}</td>
        <td class="nt-cell nt-cell-title"><span class="nt-title-text">${esc(p.title || 'Untitled')}</span></td>
        <td class="nt-cell nt-cell-client"><span class="nt-client-text">${esc(p.client?.name || '\u2014')}</span></td>
        <td class="nt-cell nt-cell-status"><span class="badge badge-${st} badge-click" onclick="event.stopPropagation();showStatusMenu(event,'${pid}')"><i data-lucide="${stIcon}" style="width:12px;height:12px"></i> ${statusLabel}</span></td>
        <td class="nt-cell nt-cell-value mono">${fmtCur(val, p.currency)}</td>
        <td class="nt-cell nt-cell-date">${smartDate}</td>
        <td class="nt-cell nt-cell-actions"><div class="prop-actions">${isArchived ? `
          <button class="prop-act-btn" onclick="event.stopPropagation();unarchiveProp('${pid}')" data-tooltip="Restore" data-side="bottom"><i data-lucide="archive-restore"></i></button>
          <button class="prop-act-btn" onclick="event.stopPropagation();delProp('${pid}')" data-tooltip="Delete" data-side="bottom"><i data-lucide="trash-2"></i></button>` : `
          <button class="prop-act-btn" onclick="event.stopPropagation();emailProposal('${pid}')" data-tooltip="Email" data-side="bottom"><i data-lucide="mail"></i></button>
          <button class="prop-act-btn" onclick="event.stopPropagation();dupProp('${pid}')" data-tooltip="Duplicate" data-side="bottom"><i data-lucide="copy"></i></button>
          <button class="prop-act-btn" onclick="event.stopPropagation();showCtx(event,'${pid}')" data-tooltip="More" data-side="bottom"><i data-lucide="more-horizontal"></i></button>`}
        </div></td>
      </tr>`;
    }
    // List view — compact single-line
    return `<div class="nl-row" onclick="loadEditor('${pid}')" oncontextmenu="showCtx(event,'${pid}')">
      ${!isArchived ? `<label class="bulk-check-wrap" onclick="event.stopPropagation()"><input type="checkbox" class="bulk-check-input" data-id="${pid}" onchange="toggleBulkCheck('${pid}', this)"><span class="bulk-check-pill"></span></label>` : ''}
      <i data-lucide="file-text" class="nl-icon"></i>
      <span class="nl-title">${esc(p.title || 'Untitled')}</span>
      <span class="nl-meta">${esc(p.client?.name || '')}</span>
      <span class="badge badge-${st} badge-sm"><i data-lucide="${stIcon}" style="width:12px;height:12px"></i> ${statusLabel}</span>
      <span class="nl-value mono">${fmtCur(val, p.currency)}</span>
      <span class="nl-date">${smartDate}</span>
      <div class="prop-actions">${isArchived ? `
        <button class="prop-act-btn" onclick="event.stopPropagation();unarchiveProp('${pid}')" data-tooltip="Restore" data-side="bottom"><i data-lucide="archive-restore"></i></button>` : `
        <button class="prop-act-btn" onclick="event.stopPropagation();showCtx(event,'${pid}')" data-tooltip="More" data-side="bottom"><i data-lucide="more-horizontal"></i></button>`}
      </div>
    </div>`;
  }).join('');

  if (viewMode === 'table') {
    wrap.innerHTML = `<div class="nt-wrap"><table class="nt-table">
      <thead><tr class="nt-head">
        <th class="nt-th nt-th-check"></th>
        <th class="nt-th nt-th-title">Title</th>
        <th class="nt-th nt-th-client">Client</th>
        <th class="nt-th nt-th-status">Status</th>
        <th class="nt-th nt-th-value">Value</th>
        <th class="nt-th nt-th-date">Updated</th>
        <th class="nt-th nt-th-actions"></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  } else {
    wrap.innerHTML = `<div class="nl-wrap">${rows}</div>`;
  }
  if (typeof lucideScope === 'function') lucideScope(wrap); else lucide.createIcons();
}

function doQuickExport(id) { CUR = id; doExport('proposal'); }
function quickPreview(id) { CUR = id; openPreview(); }

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
      <i data-lucide="${s.icon}" class="status-opt-icon" style="color:${s.color}"></i><span>${s.label}</span>
    </button>`
  ).join('');
  dropdown.style.left = Math.min(event.clientX, window.innerWidth - 160) + 'px';
  dropdown.style.top = Math.min(event.clientY, window.innerHeight - 200) + 'px';
  document.body.appendChild(dropdown);
  if (typeof lucideScope === 'function') lucideScope(dropdown); else lucide.createIcons();
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

function setFilter(f) {
  currentFilter = f; currentPage = 1;
  if (typeof replaceUrl === 'function') {
    const params = new URLSearchParams();
    if (f !== 'all') params.set('filter', f);
    replaceUrl('/proposals' + (params.toString() ? '?' + params : ''));
  }
  renderProposals();
}
function filterList() {
  const q = document.getElementById('searchInput')?.value?.trim() || '';
  if (!CUR && q) {
    document.querySelectorAll('[data-nav]').forEach(b => b.classList.remove('on'));
    document.querySelector('[data-nav="editor"]')?.classList.add('on');
    renderProposals();
  } else if (!CUR) { renderProposals(); }
}

let currentPage = 1;
const ITEMS_PER_PAGE = 10;

function buildPagination(currentPg, totalPgs) {
  if (totalPgs <= 1) return '';
  const pages = [];
  const addPage = (n) => { if (!pages.includes(n)) pages.push(n); };
  addPage(1);
  for (let i = Math.max(2, currentPg - 1); i <= Math.min(totalPgs - 1, currentPg + 1); i++) addPage(i);
  addPage(totalPgs);
  pages.sort((a, b) => a - b);

  let items = '';
  items += `<button class="pg-btn pg-nav" onclick="goPage(${currentPg - 1})" ${currentPg === 1 ? 'disabled' : ''} aria-label="Previous page"><i data-lucide="chevron-left"></i><span class="pg-nav-label">Previous</span></button>`;

  let last = 0;
  for (const pg of pages) {
    if (last && pg - last > 1) {
      items += '<span class="pg-ellipsis" aria-hidden="true"><i data-lucide="more-horizontal"></i></span>';
    }
    items += `<button class="pg-btn pg-num${pg === currentPg ? ' pg-active' : ''}" onclick="goPage(${pg})" aria-label="Page ${pg}"${pg === currentPg ? ' aria-current="page"' : ''}>${pg}</button>`;
    last = pg;
  }

  items += `<button class="pg-btn pg-nav" onclick="goPage(${currentPg + 1})" ${currentPg >= totalPgs ? 'disabled' : ''} aria-label="Next page"><span class="pg-nav-label">Next</span><i data-lucide="chevron-right"></i></button>`;
  return `<nav class="pg-wrap" role="navigation" aria-label="Pagination">${items}</nav>`;
}

function showSortMenu(event) {
  event.stopPropagation();
  const existing = document.querySelector('.sort-dropdown');
  if (existing) { existing.remove(); return; }
  const opts = [
    { key: 'date', label: 'Newest first', icon: 'calendar' },
    { key: 'value', label: 'Highest value', icon: 'trending-up' },
    { key: 'name', label: 'Name A-Z', icon: 'arrow-down-a-z' }
  ];
  const dd = document.createElement('div');
  dd.className = 'sort-dropdown';
  dd.innerHTML = opts.map(o =>
    `<button class="sort-opt${currentSort === o.key ? ' sort-opt-active' : ''}" onclick="currentSort='${o.key}';document.querySelector('.sort-dropdown')?.remove();renderProposals()">
      <i data-lucide="${o.icon}" style="width:14px;height:14px"></i><span>${o.label}</span>${currentSort === o.key ? '<i data-lucide="check" style="width:14px;height:14px;margin-left:auto;color:var(--primary)"></i>' : ''}
    </button>`
  ).join('');
  const btn = event.currentTarget;
  const rect = btn.getBoundingClientRect();
  dd.style.top = (rect.bottom + 4) + 'px';
  dd.style.right = (window.innerWidth - rect.right) + 'px';
  document.body.appendChild(dd);
  if (typeof lucideScope === 'function') lucideScope(dd); else lucide.createIcons();
  const close = (e) => { if (!dd.contains(e.target) && e.target !== btn) { dd.remove(); document.removeEventListener('click', close); } };
  setTimeout(() => document.addEventListener('click', close), 10);
}

const _filterDotColors = { draft: 'var(--text4)', sent: 'var(--blue)', accepted: 'var(--green)', declined: 'var(--red)', expired: 'var(--amber)', dues: 'var(--green)', archived: 'var(--text4)' };

function renderProposals() {
  CUR = null;
  if (typeof hideTOC === 'function') hideTOC();
  document.getElementById('topTitle').textContent = 'Proposals';
  const topSearch = document.getElementById('topSearch');
  if (topSearch) topSearch.style.display = '';
  document.getElementById('topRight').innerHTML = '';

  const body = document.getElementById('bodyScroll');
  const isArchiveView = currentFilter === 'archived';
  const baseList = isArchiveView ? DB.filter(p => p.archived) : activeDB();
  const total = baseList.length;

  if (total === 0 && currentFilter === 'all') {
    body.innerHTML = `<div class="first-run"><div class="fr-center"><dotlottie-wc src="https://assets-v2.lottiefiles.com/a/e5ad4708-1153-11ee-99af-8b4501471254/KY6YhwKCDP.lottie" autoplay loop speed="0.8" style="width:240px;height:240px;margin:0 auto"></dotlottie-wc><div class="fr-title">Create your first proposal</div><div class="fr-desc">Build professional proposals in minutes.<br>Pick a template or start from scratch.</div><div class="fr-actions"><button class="btn fr-btn-primary" onclick="openNewModal()"><i data-lucide="plus"></i> New proposal</button><button class="btn-outline fr-btn-outline" onclick="fromTpl('web')"><i data-lucide="sparkles"></i> Start from template</button></div></div></div>`;
    if (typeof lucideScope === 'function') lucideScope(body); else lucide.createIcons();
    return;
  }

  let filtered = [...baseList];
  const q = document.getElementById('searchInput')?.value?.toLowerCase().trim() || '';
  if (q) filtered = filtered.filter(p =>
    (p.title || '').toLowerCase().includes(q) || (p.client?.name || '').toLowerCase().includes(q) ||
    (p.client?.email || '').toLowerCase().includes(q) || (p.number || '').toLowerCase().includes(q)
  );

  const archivedCount = DB.filter(p => p.archived).length;
  const duesCount = typeof paymentTotals === 'function' ? filtered.filter(p => p.status === 'accepted' && paymentTotals(p).balanceDue > 0).length : 0;
  const counts = { all: filtered.length, draft: filtered.filter(p => p.status === 'draft').length, sent: filtered.filter(p => p.status === 'sent').length, accepted: filtered.filter(p => p.status === 'accepted').length, declined: filtered.filter(p => p.status === 'declined').length, expired: filtered.filter(p => p.status === 'expired').length, dues: duesCount, archived: archivedCount };

  let display = isArchiveView ? filtered : (currentFilter === 'all' ? filtered : currentFilter === 'dues' ? filtered.filter(p => p.status === 'accepted' && typeof paymentTotals === 'function' && paymentTotals(p).balanceDue > 0) : filtered.filter(p => p.status === currentFilter));
  display = sortProposals(display);

  const totalPages = Math.ceil(display.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = display.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  const sortIcons = { date: 'calendar', value: 'trending-up', name: 'arrow-down-a-z' };
  const sortLabels = { date: 'Newest', value: 'Highest', name: 'A-Z' };

  const filterTab = (key, label, count, icon) => {
    const dot = key !== 'all' ? `<span class="ft-dot" style="background:${_filterDotColors[key] || 'var(--text4)'}"></span>` : '';
    const iconHtml = icon ? `<i data-lucide="${icon}"></i>` : '';
    return `<button class="filter-tab${currentFilter === key ? ' on' : ''}${!count ? ' dimmed' : ''}" onclick="setFilter('${key}')">${dot}${iconHtml}${label} <span class="fc">${count}</span></button>`;
  };

  body.innerHTML = `
    <div class="prop-toolbar">
      <div class="prop-filters" role="tablist" aria-label="Filter proposals">
        ${filterTab('all', 'All', counts.all)}
        ${filterTab('draft', 'Draft', counts.draft)}
        ${filterTab('sent', 'Sent', counts.sent)}
        ${filterTab('accepted', 'Won', counts.accepted)}
        ${filterTab('declined', 'Lost', counts.declined)}
        ${filterTab('expired', 'Expired', counts.expired)}
        ${typeof paymentTotals === 'function' ? filterTab('dues', 'Dues', counts.dues, 'wallet') : ''}
        ${filterTab('archived', 'Archived', counts.archived, 'archive')}
      </div>
      <div class="prop-toolbar-right">
        <button class="sort-btn" onclick="showSortMenu(event)" id="sortBtnP" aria-haspopup="true"><i data-lucide="${sortIcons[currentSort]}"></i> ${sortLabels[currentSort]} <i data-lucide="chevron-down" style="width:12px;height:12px;opacity:0.5"></i></button>
        ${typeof quickRecordPayment === 'function' && counts.dues > 0 ? `<button class="sort-btn" onclick="showPaymentPickerMenu(event)" style="color:var(--green)"><i data-lucide="indian-rupee"></i> Record</button>` : ''}
        <div class="view-toggle" role="group" aria-label="View mode">
          <button class="vt-btn${viewMode === 'table' ? ' on' : ''}" onclick="setViewMode('table')" data-tooltip="Table view" data-side="bottom" aria-pressed="${viewMode === 'table'}"><i data-lucide="table-2"></i></button>
          <button class="vt-btn${viewMode === 'list' ? ' on' : ''}" onclick="setViewMode('list')" data-tooltip="List view" data-side="bottom" aria-pressed="${viewMode === 'list'}"><i data-lucide="list"></i></button>
          <button class="vt-btn${viewMode === 'kanban' ? ' on' : ''}" onclick="setViewMode('kanban')" data-tooltip="Board view" data-side="bottom" aria-pressed="${viewMode === 'kanban'}"><i data-lucide="kanban"></i></button>
        </div>
        <button class="btn-sm" onclick="openNewModal()" data-tooltip="⌘N" data-side="bottom"><i data-lucide="plus"></i> New</button>
      </div>
    </div>
    <div id="propListWrap"></div>
    ${buildPagination(currentPage, totalPages)}
    <div class="bulk-bar" id="bulkBar" style="display:none"></div>`;

  if (typeof bulkSelected !== 'undefined') bulkSelected.clear();
  if (viewMode === 'kanban' && typeof renderKanban === 'function') {
    renderKanban();
  } else {
    const wrap = document.getElementById('propListWrap');
    if (wrap) {
      requestAnimationFrame(() => { renderPropTable(paginated); });
    } else { renderPropTable(paginated); }
  }
  if (typeof lucideScope === 'function') lucideScope(body); else lucide.createIcons();
}

function goPage(page) {
  if (page < 1) return; currentPage = page;
  if (typeof replaceUrl === 'function') {
    const params = new URLSearchParams();
    if (currentFilter !== 'all') params.set('filter', currentFilter);
    if (page > 1) params.set('page', page);
    replaceUrl('/proposals' + (params.toString() ? '?' + params : ''));
  }
  renderProposals();
}

function toggleSortProposals() {
  const cycle = ['date', 'value', 'name'];
  currentSort = cycle[(cycle.indexOf(currentSort) + 1) % cycle.length];
  renderProposals();
}
