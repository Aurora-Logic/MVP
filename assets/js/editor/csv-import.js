// ════════════════════════════════════════
// CSV IMPORT + PRICING INSIGHTS
// ════════════════════════════════════════

// Moved from pricing.js — Smart Pricing Insights (Phase 2.5)
function buildPricingInsights(p) {
    const el = document.getElementById('pricingInsights');
    if (!el) return;
    if (DB.length < 3) { el.innerHTML = ''; return; }
    const totals = DB.map(pr => (pr.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0)).filter(v => v > 0);
    if (totals.length < 2) { el.innerHTML = ''; return; }
    const avg = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
    const thisTotal = (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0);
    const c = p.currency || defaultCurrency();
    const diff = thisTotal - avg;
    const pct = avg > 0 ? Math.round(Math.abs(diff) / avg * 100) : 0;
    let msg = '', icon = 'trending-up', color = 'var(--blue)';
    if (pct < 10) { msg = 'This proposal is close to your average'; icon = 'minus'; color = 'var(--text3)'; }
    else if (diff > 0) { msg = `${pct}% above your avg (${fmtCur(avg, c)})`; icon = 'trending-up'; color = 'var(--green)'; }
    else { msg = `${pct}% below your avg (${fmtCur(avg, c)})`; icon = 'trending-down'; color = 'var(--amber)'; }
    el.innerHTML = `<div class="pi-banner"><i data-lucide="${icon}" style="color:${color}"></i><span class="pi-text">${msg}</span><span class="pi-stat">${DB.length} proposals · Avg ${fmtCur(avg, c)}</span></div>`;
    lucide.createIcons();
}

// CSV Import
function openCsvImport() {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.id = 'csvModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    wrap.innerHTML = `<div class="modal csv-modal-body" onclick="event.stopPropagation()">
        <div class="modal-t"><i data-lucide="file-spreadsheet" class="modal-t-icon"></i> Import Line Items</div>
        <div class="modal-d">Paste CSV data or upload a .csv file</div>
        <div class="fg">
            <label class="fl">Upload CSV File</label>
            <input type="file" id="csvFileInput" accept=".csv,.tsv,.txt" onchange="handleCsvFile(this)">
        </div>
        <div class="fg">
            <label class="fl">Or Paste CSV Data</label>
            <textarea id="csvPaste" class="csv-paste" rows="5" placeholder="description,quantity,rate&#10;Web Design,1,25000&#10;Development,1,40000"></textarea>
        </div>
        <button class="btn-sm" onclick="parseCsvInput()" style="margin-bottom:12px"><i data-lucide="scan-search"></i> Preview Import</button>
        <div id="csvPreview"></div>
        <div class="modal-foot">
            <button class="btn-sm-outline" onclick="document.getElementById('csvModal').remove()">Cancel</button>
            <button class="btn-sm" id="csvConfirmBtn" onclick="confirmCsvImport()" style="display:none"><i data-lucide="check"></i> Import Items</button>
        </div>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

function handleCsvFile(input) {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const textarea = document.getElementById('csvPaste');
        if (textarea) textarea.value = e.target.result;
        parseCsvInput();
    };
    reader.onerror = () => toast('Failed to read CSV file', 'error');
    reader.readAsText(file);
}

function detectDelimiter(text) {
    const firstLine = text.split('\n')[0] || '';
    const counts = { '\t': 0, ',': 0, ';': 0 };
    for (const ch of firstLine) { if (counts[ch] !== undefined) counts[ch]++; }
    if (counts['\t'] >= counts[','] && counts['\t'] >= counts[';']) return '\t';
    if (counts[';'] > counts[',']) return ';';
    return ',';
}

function parseCsv(text) {
    const delim = detectDelimiter(text);
    const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);
    if (!lines.length) return { headers: [], rows: [] };
    const parse = (line) => {
        const fields = [];
        let current = '', inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') { inQuotes = !inQuotes; continue; }
            if (ch === delim && !inQuotes) { fields.push(current.trim()); current = ''; continue; }
            current += ch;
        }
        fields.push(current.trim());
        return fields;
    };
    const headers = parse(lines[0]);
    const rows = lines.slice(1).map(parse);
    return { headers, rows };
}

function autoMapColumns(headers) {
    const map = { desc: -1, detail: -1, qty: -1, rate: -1 };
    const lower = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const descMatch = ['description', 'desc', 'item', 'name', 'title', 'service', 'product'];
    const detailMatch = ['detail', 'details', 'note', 'notes', 'info', 'subtitle'];
    const qtyMatch = ['qty', 'quantity', 'units', 'count', 'amount', 'nos'];
    const rateMatch = ['rate', 'price', 'cost', 'unitprice', 'unitcost', 'value', 'total'];
    lower.forEach((h, i) => {
        if (map.desc === -1 && descMatch.some(m => h.includes(m))) map.desc = i;
        if (map.detail === -1 && detailMatch.some(m => h.includes(m))) map.detail = i;
        if (map.qty === -1 && qtyMatch.some(m => h.includes(m))) map.qty = i;
        if (map.rate === -1 && rateMatch.some(m => h.includes(m))) map.rate = i;
    });
    if (map.desc === -1) map.desc = 0;
    if (map.qty === -1 && headers.length >= 3) map.qty = headers.length - 2;
    if (map.rate === -1 && headers.length >= 2) map.rate = headers.length - 1;
    return map;
}

let _csvParsed = null;
let _csvMap = null;

function parseCsvInput() {
    const text = document.getElementById('csvPaste')?.value?.trim();
    if (!text) { toast('Paste or upload CSV data first'); return; }
    const { headers, rows } = parseCsv(text);
    if (!rows.length) { toast('No data rows found'); return; }
    _csvParsed = { headers, rows };
    _csvMap = autoMapColumns(headers);
    renderCsvPreview();
}

function renderCsvPreview() {
    const { headers, rows } = _csvParsed;
    const preview = document.getElementById('csvPreview');
    const fields = ['desc', 'detail', 'qty', 'rate'];
    const labels = { desc: 'Description', detail: 'Detail', qty: 'Quantity', rate: 'Rate' };
    let mapHtml = '<div class="csv-map-grid">';
    fields.forEach(f => {
        mapHtml += `<div class="fg" style="margin:0"><label class="fl csv-map-label">${labels[f]}</label><div class="csv-map-select" data-field="${f}"></div></div>`;
    });
    mapHtml += '</div>';

    const showRows = rows.slice(0, 5);
    let tableHtml = '<div class="csv-table-wrap"><table class="li-tbl" style="font-size:12px"><thead><tr>';
    tableHtml += '<th>Description</th><th>Detail</th><th>Qty</th><th>Rate</th></tr></thead><tbody>';
    showRows.forEach(row => {
        const desc = _csvMap.desc >= 0 ? (row[_csvMap.desc] || '') : '';
        const detail = _csvMap.detail >= 0 ? (row[_csvMap.detail] || '') : '';
        const qty = _csvMap.qty >= 0 ? (row[_csvMap.qty] || '') : '';
        const rate = _csvMap.rate >= 0 ? (row[_csvMap.rate] || '') : '';
        tableHtml += `<tr><td>${esc(desc)}</td><td>${esc(detail)}</td><td>${esc(qty)}</td><td>${esc(rate)}</td></tr>`;
    });
    if (rows.length > 5) tableHtml += `<tr><td colspan="4" class="breakdown-empty">...and ${rows.length - 5} more row${rows.length - 5 > 1 ? 's' : ''}</td></tr>`;
    tableHtml += '</tbody></table></div>';

    preview.innerHTML = `<div class="csv-preview-header">${rows.length} row${rows.length > 1 ? 's' : ''} detected — Map columns:</div>${mapHtml}<div class="csv-preview-header">Preview:</div>${tableHtml}`;
    if (typeof csel === 'function') {
        const cselItems = [{ value: '-1', label: '— Skip —' }, ...headers.map((h, i) => ({ value: String(i), label: h }))];
        preview.querySelectorAll('.csv-map-select').forEach(sel => {
            const f = sel.dataset.field;
            csel(sel, { value: String(_csvMap[f] ?? -1), small: true, items: cselItems, onChange: (v) => { _csvMap[f] = parseInt(v); renderCsvPreview(); } });
        });
    }
    document.getElementById('csvConfirmBtn').style.display = '';
}

function updateCsvMap(sel) {
    _csvMap[sel.dataset.field] = parseInt(typeof cselGetValue === 'function' ? cselGetValue(sel) : sel.value);
    renderCsvPreview();
}

function confirmCsvImport() {
    if (!_csvParsed || !_csvMap) return;
    const p = cur(); if (!p) return;
    const { rows } = _csvParsed;
    let added = 0;
    rows.forEach(row => {
        const desc = _csvMap.desc >= 0 ? (row[_csvMap.desc] || '').trim() : '';
        if (!desc) return;
        const detail = _csvMap.detail >= 0 ? (row[_csvMap.detail] || '').trim() : '';
        const qty = _csvMap.qty >= 0 ? parseFloat(row[_csvMap.qty]) || 1 : 1;
        const rate = _csvMap.rate >= 0 ? parseFloat(row[_csvMap.rate]?.replace(/[^0-9.-]/g, '')) || 0 : 0;
        p.lineItems.push({ desc, detail, qty, rate });
        added++;
    });
    persist();
    document.getElementById('csvModal')?.remove();
    renderPricing(p);
    lucide.createIcons();
    toast(`${added} item${added > 1 ? 's' : ''} imported`);
    _csvParsed = null;
    _csvMap = null;
}
