// ════════════════════════════════════════
// EDITOR — Main editor view
// ════════════════════════════════════════

function loadEditor(id) {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (typeof destroyAllEditors === 'function') destroyAllEditors();
    CUR = id;
    undoStack = [];
    redoStack = [];
    const p = cur();
    if (!p) return renderDashboard();
    const topSearch = document.getElementById('topSearch');
    if (topSearch) topSearch.style.display = 'none';

    document.querySelectorAll('[data-nav]').forEach(b => b.classList.remove('on'));
    document.querySelector('[data-nav="editor"]')?.classList.add('on');

    document.getElementById('topTitle').innerHTML = `<span class="breadcrumb-link" onclick="renderProposals();document.querySelectorAll('[data-nav]').forEach(b=>b.classList.remove('on'));document.querySelector('[data-nav=&quot;editor&quot;]')?.classList.add('on')">Proposals</span><span class="breadcrumb-sep">/</span>${esc(p.title || 'Untitled')}`;
    document.title = (p.title || 'Untitled') + ' \u2014 ' + (typeof appName === 'function' ? appName() : 'ProposalKit');

    // Calc stats for bar
    const t = (typeof calcTotals === 'function') ? calcTotals(p) : { grand: (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0) };
    const val = t.grand;
    const daysSince = p.createdAt ? Math.floor((Date.now() - p.createdAt) / 86400000) : 0;
    let daysLeft = '—';
    if (p.validUntil) {
        const d = Math.ceil((new Date(p.validUntil) - new Date()) / 86400000);
        daysLeft = d > 0 ? d + 'd left' : 'Expired';
    }

    document.getElementById('topRight').innerHTML = `
    <div class="tabs" id="edTabs" role="tablist" aria-label="Editor tabs">
      <button class="tab on" role="tab" aria-selected="true" onclick="edTab(this,'details')">Details</button>
      <button class="tab" role="tab" aria-selected="false" onclick="edTab(this,'sections')">Sections</button>
      <button class="tab" role="tab" aria-selected="false" onclick="edTab(this,'pricing')">Pricing</button>
      <button class="tab" role="tab" aria-selected="false" onclick="edTab(this,'notes')">Notes</button>
    </div>
    <button class="btn-sm-outline" onclick="openPreview()" data-tooltip="Preview (⌘P)" data-side="bottom"><i data-lucide="eye"></i> Preview</button>
    <button class="btn-sm-outline" onclick="shareProposal()"><i data-lucide="share-2"></i> Share</button>
    <button class="btn-sm-outline" onclick="saveAsTemplate()"><i data-lucide="bookmark-plus"></i> Template</button>
    <button class="btn-sm" onclick="doExport('proposal')" data-tooltip="Export PDF (⌘E)" data-side="bottom"><i data-lucide="download"></i> Export</button>
  `;

    const body = document.getElementById('bodyScroll');
    body.innerHTML = `
    <div class="prop-stats">
      <div class="ps-item"><i data-lucide="clock"></i> Created ${daysSince}d ago</div>
      <div class="ps-sep"></div>
      <div class="ps-item" id="statDaysLeft"><i data-lucide="timer"></i> <strong>${daysLeft}</strong></div>
      <div class="ps-sep"></div>
      <div class="ps-item" id="statValue"><i data-lucide="banknote"></i> <strong>${fmtCur(val, p.currency)}</strong></div>
      <div class="ps-sep"></div>
      <div class="ps-item" id="statSections"><i data-lucide="layers"></i> <span id="secCountVal">${(p.sections || []).length}</span> sections</div>
      <div class="ps-sep"></div>
      ${p.clientResponse?.status === 'accepted' && p.clientResponse.clientName ? `<div class="ps-item ps-accepted"><i data-lucide="pen-line"></i> Signed by ${esc(p.clientResponse.clientName)}</div><div class="ps-sep"></div>` : ''}
      ${buildCompletenessHtml(p)}
      <div class="ps-right">
        <button class="btn-sm-icon-ghost" onclick="typeof undo==='function'&&undo()" data-tooltip="Undo (⌘Z)" data-side="bottom"><i data-lucide="undo-2"></i></button>
        <button class="btn-sm-icon-ghost" onclick="typeof redo==='function'&&redo()" data-tooltip="Redo (⌘⇧Z)" data-side="bottom"><i data-lucide="redo-2"></i></button>
        <span class="ver-badge">v${p.version || 1}</span>
        <button class="btn-sm-icon-ghost" onclick="bumpVersion()" data-tooltip="Bump version" data-side="bottom"><i data-lucide="arrow-up-circle"></i></button>
        ${p.versionHistory?.length ? `<button class="btn-sm-icon-ghost" onclick="typeof openDiffView==='function'&&openDiffView()" data-tooltip="Compare versions" data-side="bottom"><i data-lucide="git-compare"></i></button>` : ''}
        <div class="cover-toggle ${p.coverPage ? 'on' : ''}" onclick="toggleCover()" title="Add cover page to PDF" role="switch" aria-checked="${p.coverPage ? 'true' : 'false'}" aria-label="Cover page">
          <i data-lucide="book-open"></i> Cover
          <div class="switch"></div>
        </div>
      </div>
    </div>
    <div id="edDetails"></div>
    <div id="edSections" style="display:none"></div>
    <div id="edPricing" style="display:none"></div>
    <div id="edNotes" style="display:none"></div>
  `;

    renderDetails(p);
    renderSections(p);
    renderPricing(p);
    renderNotes(p);
    refreshSide();
    if (typeof renderTOC === 'function') renderTOC();
    lucide.createIcons();
}

function refreshStatsBar() {
    const p = cur(); if (!p) return;
    const c = cselGetValue(document.getElementById('fCur')) || p.currency || defaultCurrency();
    // Read live line item values from DOM (before debounced save)
    let subtotal = 0;
    const liRows = document.querySelectorAll('.li-row');
    if (liRows.length) {
        liRows.forEach(row => {
            subtotal += (parseFloat(row.querySelector('.lq')?.value) || 0) * (parseFloat(row.querySelector('.lr')?.value) || 0);
        });
    } else {
        subtotal = (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0);
    }
    const discEl = document.getElementById('fDiscount');
    const disc = discEl ? (parseFloat(discEl.value) || 0) : (p.discount || 0);
    const taxEl = document.getElementById('fTaxRate');
    const taxRate = taxEl ? (parseFloat(taxEl.value) || 0) : (p.taxRate || 0);
    const afterDisc = Math.max(0, subtotal - disc);
    const taxAmt = Math.round(afterDisc * taxRate / 100);
    const addOnsTotal = (typeof calcAddOnsTotal === 'function') ? calcAddOnsTotal() : 0;
    const grand = afterDisc + taxAmt + addOnsTotal;
    const el = document.getElementById('statValue');
    if (el) el.innerHTML = `<i data-lucide="banknote"></i> <strong>${fmtCur(grand, c)}</strong>`;
    const secEl = document.getElementById('secCountVal');
    if (secEl) secEl.textContent = (p.sections || []).length;
    // Read live validUntil from DOM date picker
    const validEl = document.getElementById('fValid');
    const validUntil = validEl ? (validEl.dataset.value || '') : (p.validUntil || '');
    const dlEl = document.getElementById('statDaysLeft');
    if (dlEl) {
        let daysLeft = '—';
        if (validUntil) {
            const d = Math.ceil((new Date(validUntil) - new Date()) / 86400000);
            daysLeft = d > 0 ? d + 'd left' : 'Expired';
        }
        dlEl.innerHTML = `<i data-lucide="timer"></i> <strong>${daysLeft}</strong>`;
    }
    // Update expiry warning banner with live value
    if (typeof updateExpiryWarning === 'function') {
        const liveP = { ...p, validUntil };
        updateExpiryWarning(liveP);
    }
    lucide.createIcons();
}

function edTab(el, tab) {
    document.querySelectorAll('#edTabs .tab').forEach(t => { t.classList.remove('on'); t.setAttribute('aria-selected', 'false'); });
    el.classList.add('on');
    el.setAttribute('aria-selected', 'true');
    ['Details', 'Sections', 'Pricing', 'Notes'].forEach(t => {
        const panel = document.getElementById('ed' + t);
        if (panel) panel.style.display = t.toLowerCase() === tab ? 'block' : 'none';
    });
}
