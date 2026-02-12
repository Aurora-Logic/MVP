// ════════════════════════════════════════
// DIFF VIEW — Version Comparison
// ════════════════════════════════════════

/* exported openDiffView */
function openDiffView() {
    const p = cur(); if (!p) return;
    if (!p.versionHistory || !p.versionHistory.length) {
        toast('No version history yet. Bump the version to create a snapshot.', 'info');
        return;
    }
    document.getElementById('diffModal')?.remove();
    const versions = p.versionHistory;
    const leftItems = versions.map((v, i) => ({ value: String(i), label: `v${v.version} — ${timeAgo(v.timestamp)}` }));
    const rightItems = [{ value: 'current', label: `Current (v${p.version})` }, ...leftItems];

    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'diffModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    const escHandler = (e) => { if (e.key === 'Escape') { wrap.remove(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);
    wrap.innerHTML = `<div class="modal modal-lg" role="dialog" aria-modal="true" aria-label="Compare versions" onclick="event.stopPropagation()" style="max-width:900px;width:95vw">
        <div class="modal-t">Compare versions</div>
        <div class="modal-d">Select two versions to compare side by side</div>
        <div class="diff-selectors">
            <div class="diff-sel">
                <label class="fl">Left</label>
                <div id="diffLeftSel"></div>
            </div>
            <div class="diff-arrow"><i data-lucide="arrow-right"></i></div>
            <div class="diff-sel">
                <label class="fl">Right</label>
                <div id="diffRightSel"></div>
            </div>
        </div>
        <div id="diffSummary" class="diff-summary"></div>
        <div class="diff-panel">
            <div class="diff-col" id="diffLeft"></div>
            <div class="diff-col" id="diffRight"></div>
        </div>
        <div class="modal-foot">
            <button class="btn-sm-outline" onclick="document.getElementById('diffModal').remove()">Close</button>
        </div>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
    if (typeof csel === 'function') {
        csel(document.getElementById('diffLeftSel'), { value: '0', items: leftItems, onChange: () => updateDiffView() });
        csel(document.getElementById('diffRightSel'), { value: 'current', items: rightItems, onChange: () => updateDiffView() });
    }
    updateDiffView();
}

function updateDiffView() {
    const p = cur(); if (!p) return;
    const leftEl = document.getElementById('diffLeftSel');
    const rightEl = document.getElementById('diffRightSel');
    const leftIdx = parseInt((typeof cselGetValue === 'function' ? cselGetValue(leftEl) : leftEl?.value) || '0');
    const rightVal = (typeof cselGetValue === 'function' ? cselGetValue(rightEl) : rightEl?.value) || 'current';
    const left = p.versionHistory[leftIdx]?.snapshot;
    const right = rightVal === 'current' ? p : p.versionHistory[parseInt(rightVal)]?.snapshot;
    if (!left || !right) return;
    document.getElementById('diffLeft').innerHTML = renderSnapshotHtml(left);
    document.getElementById('diffRight').innerHTML = renderSnapshotHtml(right);
    document.getElementById('diffSummary').innerHTML = computeChanges(left, right);
    lucide.createIcons();
}

function renderSnapshotHtml(s) {
    const c = s.currency || defaultCurrency();
    const t = calcTotals(s);
    let h = `<div class="diff-head">
        <strong>${esc(s.title || 'Untitled')}</strong>
        <span class="badge badge-${s.status || 'draft'}"><span class="badge-dot"></span> ${(s.status || 'draft').charAt(0).toUpperCase() + (s.status || 'draft').slice(1)}</span>
    </div>`;
    h += `<div class="diff-meta">v${s.version || 1} | ${fmtDate(s.date)} | ${esc(s.client?.name || 'No client')}</div>`;
    // Sections
    (s.sections || []).forEach(sec => {
        h += `<div class="diff-sec">
            <div class="diff-sec-t">${esc(sec.title || 'Untitled')}</div>
            <div class="diff-sec-c">${editorJsToHtml(sec.content, s)}</div>
        </div>`;
    });
    // Pricing summary
    if ((s.lineItems || []).length) {
        h += `<div class="diff-pricing">
            <strong>${(s.lineItems || []).length} line items</strong>
            <span class="diff-total">${fmtCur(t.grand, c)}</span>
        </div>`;
        (s.lineItems || []).forEach(i => {
            if (!i.desc) return;
            const amt = (i.qty || 0) * (i.rate || 0);
            h += `<div class="diff-li">${esc(i.desc)} — ${i.qty} × ${fmtCur(i.rate || 0, c)} = ${fmtCur(amt, c)}</div>`;
        });
    }
    return h;
}

function computeChanges(old, current) {
    const changes = [];
    if (old.title !== current.title) changes.push({ icon: 'type', text: `Title: "${old.title}" → "${current.title}"` });
    if (old.status !== current.status) changes.push({ icon: 'circle-dot', text: `Status: ${old.status} → ${current.status}` });
    if (old.client?.name !== current.client?.name) changes.push({ icon: 'user', text: `Client: "${old.client?.name || ''}" → "${current.client?.name || ''}"` });

    const oldSecs = (old.sections || []).length;
    const newSecs = (current.sections || []).length;
    if (oldSecs !== newSecs) changes.push({ icon: 'layers', text: `Sections: ${oldSecs} → ${newSecs}` });

    const c = current.currency || defaultCurrency();
    const oldVal = calcTotals(old).grand;
    const newVal = calcTotals(current).grand;
    if (oldVal !== newVal) changes.push({ icon: 'banknote', text: `Value: ${fmtCur(oldVal, c)} → ${fmtCur(newVal, c)}` });

    const oldItems = (old.lineItems || []).length;
    const newItems = (current.lineItems || []).length;
    if (oldItems !== newItems) changes.push({ icon: 'list', text: `Line items: ${oldItems} → ${newItems}` });

    // Check for changed sections
    const minSecs = Math.min(oldSecs, newSecs);
    let changedSecs = 0;
    for (let i = 0; i < minSecs; i++) {
        if (old.sections[i]?.title !== current.sections[i]?.title) changedSecs++;
    }
    if (changedSecs) changes.push({ icon: 'edit-3', text: `${changedSecs} section title${changedSecs > 1 ? 's' : ''} changed` });

    if (!changes.length) return '<div class="diff-no-changes"><i data-lucide="check-circle"></i> No structural changes detected</div>';
    return `<div class="diff-changes-t">${changes.length} change${changes.length > 1 ? 's' : ''} detected</div>` +
        changes.map(c => `<div class="diff-change"><i data-lucide="${c.icon}"></i> ${esc(c.text)}</div>`).join('');
}
