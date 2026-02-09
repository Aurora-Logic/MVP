// ════════════════════════════════════════
// EDITOR — Main editor view
// ════════════════════════════════════════

function loadEditor(id) {
    CUR = id;
    const p = cur();
    if (!p) return renderDashboard();
    const topSearch = document.getElementById('topSearch');
    if (topSearch) topSearch.style.display = 'none';

    document.querySelectorAll('[data-nav]').forEach(b => b.classList.remove('on'));
    document.querySelector('[data-nav="editor"]')?.classList.add('on');

    document.getElementById('topTitle').textContent = p.title || 'Untitled';

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
    <div class="tabs" id="edTabs">
      <button class="tab on" onclick="edTab(this,'details')">Details</button>
      <button class="tab" onclick="edTab(this,'sections')">Sections</button>
      <button class="tab" onclick="edTab(this,'pricing')">Pricing</button>
      <button class="tab" onclick="edTab(this,'notes')">Notes</button>
    </div>
    <button class="btn-sm-outline" onclick="openPreview()"><i data-lucide="eye"></i> Preview</button>
    <button class="btn-sm-outline" onclick="shareProposal()"><i data-lucide="share-2"></i> Share</button>
    <button class="btn-sm" onclick="doExport('proposal')"><i data-lucide="download"></i> Export</button>
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
      ${buildCompletenessHtml(p)}
      <div class="ps-right">
        <span class="ver-badge">v${p.version || 1}</span>
        <button class="btn-sm-icon-ghost" onclick="bumpVersion()" data-tooltip="Bump version" data-side="bottom"><i data-lucide="arrow-up-circle"></i></button>
        <div class="cover-toggle ${p.coverPage ? 'on' : ''}" onclick="toggleCover()" title="Add cover page to PDF">
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
    lucide.createIcons();
}

function refreshStatsBar() {
    const p = cur(); if (!p) return;
    const c = document.getElementById('fCur')?.value || p.currency || '₹';
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
    document.querySelectorAll('#edTabs .tab').forEach(t => t.classList.remove('on'));
    el.classList.add('on');
    ['Details', 'Sections', 'Pricing', 'Notes'].forEach(t => {
        const panel = document.getElementById('ed' + t);
        if (panel) panel.style.display = t.toLowerCase() === tab ? 'block' : 'none';
    });
}
