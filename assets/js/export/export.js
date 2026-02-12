// ════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════

/* exported doExport, toggleBulkCheck, toggleSelectAll, bulkExport */
function doExport(mode) {
    showLoading('Saving changes...');
    dirty();
    const win = window.open('', '_blank');
    if (!win) {
        hideLoading();
        toast('Please allow popups to export PDF', 'error');
        return;
    }
    setTimeout(() => {
        showLoading('Rendering PDF...');
        const p = cur();
        if (!p) {
            hideLoading();
            win.close();
            return;
        }
        buildPreview(mode || 'proposal');
        const html = document.getElementById('prevDoc')?.innerHTML;
        if (!html) { hideLoading(); win.close(); return; }
        win.document.write(`<!DOCTYPE html><html><head><title>${esc(mode === 'invoice' ? 'Invoice' : p.title)}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;padding:40px;color:#333;font-size:13px;line-height:1.7;max-width:700px;margin:0 auto}@media print{body{padding:20px}table{page-break-inside:auto}tr{page-break-inside:avoid;break-inside:avoid}thead{display:table-header-group}img{page-break-inside:avoid;break-inside:avoid}}</style></head><body>${html}</body></html>`);
        win.document.close();
        hideLoading();
        setTimeout(() => win.print(), 600);
        if (mode === 'invoice') toast('Invoice PDF ready');
    }, 400);
}

// Bulk Export (Phase 3.5)
const bulkSelected = new Set();

function toggleBulkCheck(id, checkbox) {
    if (checkbox.checked) bulkSelected.add(id);
    else bulkSelected.delete(id);
    updateBulkUI();
}

function updateBulkUI() {
    const bar = document.getElementById('bulkBar');
    if (!bar) return;
    if (bulkSelected.size > 0) {
        bar.style.display = 'flex';
        bar.innerHTML = `
            <span class="bulk-count">${bulkSelected.size} selected</span>
            <button class="btn-sm" onclick="bulkExport()"><i data-lucide="download"></i> Export Selected</button>
            <button class="btn-sm-outline" onclick="clearBulkSelection()"><i data-lucide="x"></i> Clear</button>`;
        lucide.createIcons();
    } else {
        bar.style.display = 'none';
    }
}

function toggleSelectAll() {
    const checks = document.querySelectorAll('.bulk-check-input');
    const allChecked = [...checks].every(c => c.checked);
    checks.forEach(c => {
        c.checked = !allChecked;
        const id = c.dataset.id;
        if (c.checked) bulkSelected.add(id);
        else bulkSelected.delete(id);
    });
    updateBulkUI();
}

function clearBulkSelection() {
    bulkSelected.clear();
    document.querySelectorAll('.bulk-check-input').forEach(c => c.checked = false);
    updateBulkUI();
}

function bulkExport() {
    if (!bulkSelected.size) return;
    const ids = [...bulkSelected];
    showLoading('Exporting 1 of ' + ids.length + '...');
    const win = window.open('', '_blank');
    if (!win) { hideLoading(); toast('Please allow popups', 'error'); return; }
    let combinedHtml = '';
    const origCUR = CUR;
    try {
        ids.forEach((id, idx) => {
            showLoading('Exporting ' + (idx + 1) + ' of ' + ids.length + '...');
            CUR = id;
            buildPreview('proposal');
            combinedHtml += (document.getElementById('prevDoc')?.innerHTML || '');
            if (idx < ids.length - 1) combinedHtml += '<div style="page-break-after:always"></div>';
        });
    } finally { CUR = origCUR; }
    win.document.write(`<!DOCTYPE html><html><head><title>Bulk Export - ${ids.length} Proposals</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;padding:40px;color:#333;font-size:13px;line-height:1.7;max-width:700px;margin:0 auto}@media print{body{padding:20px}table{page-break-inside:auto}tr{page-break-inside:avoid;break-inside:avoid}thead{display:table-header-group}img{page-break-inside:avoid;break-inside:avoid}}</style></head><body>${combinedHtml}</body></html>`);
    win.document.close();
    hideLoading();
    setTimeout(() => win.print(), 600);
    toast(`${ids.length} proposals exported`);
    clearBulkSelection();
}
