// ════════════════════════════════════════
// PRICING TAB
// ════════════════════════════════════════

function renderPricing(p) {
    const items = p.lineItems || [];
    let rows = '';
    items.forEach((item, i) => {
        rows += `<tr class="li-row">
      <td><div class="li-title-wrap"><input type="text" class="ld" value="${esc(item.desc)}" placeholder="Item title" oninput="dirty()"><div class="editorjs-container li-desc-editor" id="li-editor-${i}"></div></div></td>
      <td><input type="number" class="lq" value="${item.qty}" min="0" step="1" oninput="reRow(this);dirty()"></td>
      <td><input type="number" class="lr" value="${item.rate}" min="0" step="100" oninput="reRow(this);dirty()"></td>
      <td class="li-amt">${fmtCur((item.qty || 0) * (item.rate || 0), p.currency)}</td>
      <td><button class="btn-sm-icon-ghost" onclick="deleteLineItem(this)" aria-label="Delete item" data-tooltip="Delete" data-side="bottom" data-align="center"><i data-lucide="x"></i></button></td>
    </tr>`;
    });
    const hasItems = items.length > 0;

    const subtotal = (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0);
    const disc = p.discount || 0;
    const taxRate = p.taxRate || 0;
    const afterDisc = subtotal - disc;
    const taxAmt = Math.round(afterDisc * taxRate / 100);
    const grand = afterDisc + taxAmt;

    const taxLbl = CONFIG?.country === 'IN' ? 'GST' : (['GB', 'DE', 'FR', 'NL', 'IE', 'SE', 'CH'].includes(CONFIG?.country) ? 'VAT' : 'Tax');

    const sectionHtml = {
        packages: '<div id="pkgSection"></div>',
        lineItems: `<div class="card card-p"><div class="card-head"><div><div class="card-t">Line Items</div><div class="card-d">Deliverables and costs</div></div><div style="display:flex;align-items:center;gap:8px"><label class="fl" style="margin:0;font-size:10px">Currency</label><div id="fCur" style="width:100px"></div></div></div>${hasItems ? `<table class="li-tbl"><thead><tr><th style="width:40%">Item</th><th style="width:12%">Qty</th><th style="width:18%">Rate</th><th style="width:18%;text-align:right">Amount</th><th style="width:12%"></th></tr></thead><tbody id="liBody">${rows}</tbody></table><div style="padding-top:14px;margin-top:14px;border-top:1px solid var(--border)"><div style="display:flex;justify-content:space-between;align-items:flex-start"><button class="btn-sm-outline" onclick="addLine()"><i data-lucide="plus"></i> Add Item</button>${typeof openCsvImport === 'function' ? '<button class="btn-sm-outline" onclick="openCsvImport()" style="margin-left:4px"><i data-lucide="file-spreadsheet"></i> Import CSV</button>' : ''}<div style="width:260px"><div class="summary-row sub"><span class="sr-label">Subtotal</span><span class="sr-val" id="subtotalVal">${fmtCur(subtotal, p.currency)}</span></div><div class="summary-row sub" style="gap:8px"><span class="sr-label">Discount</span><div style="display:flex;align-items:center;gap:4px;margin-left:auto"><span style="font-size:12px;color:var(--text4)">−</span><input type="number" id="fDiscount" value="${disc}" min="0" step="500" style="width:90px;padding:4px 8px;font-size:12px;text-align:right" oninput="reTotal();dirty()"></div></div><div class="summary-row sub" style="gap:8px"><span class="sr-label">${taxLbl}</span><div style="display:flex;align-items:center;gap:4px;margin-left:auto"><input type="number" id="fTaxRate" value="${taxRate}" min="0" max="100" step="0.5" style="width:55px;padding:4px 8px;font-size:12px;text-align:right" oninput="reTotal();dirty()"><span style="font-size:12px;color:var(--text4)">%</span><span class="sr-val" style="min-width:70px;text-align:right" id="taxAmtVal">${fmtCur(taxAmt, p.currency)}</span></div></div><div class="summary-row sub" id="addOnsSummaryRow" style="display:none"></div><div class="summary-row grand"><span class="sr-label">Total</span><span class="sr-val" id="totalVal">${fmtCur(grand, p.currency)}</span></div></div></div></div>` : `<div class="empty empty-sm"><div class="empty-icon"><i data-lucide="receipt"></i></div><div class="empty-t">No line items yet</div><div class="empty-d">Add deliverables, services, or products with quantities and rates.</div><div class="sec-header-actions"><button class="btn-sm-outline" onclick="addLine()"><i data-lucide="plus"></i> Add First Item</button>${typeof openCsvImport === 'function' ? '<button class="btn-sm-outline" onclick="openCsvImport()"><i data-lucide="file-spreadsheet"></i> Import CSV</button>' : ''}</div></div>`}</div>`,
        addOns: '<div id="addOnsSection"></div>',
        paySchedule: '<div id="payScheduleSection"></div>',
        payTerms: `<div class="card card-p"><div class="card-head"><div><div class="card-t">Payment Terms</div><div class="card-d">Conditions and legal terms</div></div><div style="display:flex;gap:6px"><button class="btn-sm-icon-ghost" onclick="showInsertVariableDropdown(paymentTermsEditor,this)" data-tooltip="Insert Variable" data-side="bottom" data-align="center"><i data-lucide="braces"></i></button><button class="btn-sm-outline" onclick="openTCLib()"><i data-lucide="bookmark"></i> T&C Library</button></div></div><div class="fg" style="margin:0"><div id="paymentTermsEditor" class="editorjs-container"></div></div></div>`
    };

    const defaultOrder = ['packages', 'lineItems', 'addOns', 'paySchedule', 'payTerms'];
    const order = p.pricingSectionOrder || defaultOrder;
    const validOrder = order.filter(k => sectionHtml[k]);
    defaultOrder.forEach(k => { if (!validOrder.includes(k)) validOrder.push(k); });

    let sectionsHtml = validOrder.map(key =>
        `<div class="price-sec" draggable="true" data-sec="${key}"><span class="price-sec-grip" onmousedown="event.stopPropagation()"><i data-lucide="grip-vertical"></i></span><div class="price-sec-body">${sectionHtml[key]}</div></div>`
    ).join('');

    document.getElementById('edPricing').innerHTML = `<div id="pricingInsights"></div><div id="pricingSecList">${sectionsHtml}</div>`;
    initPricingDrag();
    if (typeof renderPackages === 'function') renderPackages(p);
    if (typeof renderAddOns === 'function') renderAddOns(p);
    if (typeof renderPaymentSchedule === 'function') renderPaymentSchedule(p);
    if (typeof buildPricingInsights === 'function') buildPricingInsights(p);

    // Currency custom select
    const curEl = document.getElementById('fCur');
    if (curEl) {
        csel(curEl, {
            value: p.currency || defaultCurrency(), small: true,
            items: [
                { value: '₹', label: '\ud83c\uddee\ud83c\uddf3 ₹ INR' }, { value: '$', label: '\ud83c\uddfa\ud83c\uddf8 $ USD' }, { value: '€', label: '\ud83c\uddea\ud83c\uddfa € EUR' },
                { value: '£', label: '\ud83c\uddec\ud83c\udde7 £ GBP' }, { value: 'A$', label: '\ud83c\udde6\ud83c\uddfa A$ AUD' }, { value: 'C$', label: '\ud83c\udde8\ud83c\udde6 C$ CAD' },
                { value: 'S$', label: '\ud83c\uddf8\ud83c\uddec S$ SGD' }, { value: 'د.إ', label: '\ud83c\udde6\ud83c\uddea د.إ AED' }, { value: '¥', label: '\ud83c\uddef\ud83c\uddf5 ¥ JPY' },
                { value: '¥CN', label: '\ud83c\udde8\ud83c\uddf3 ¥ CNY' }, { value: 'kr', label: '\ud83c\uddf8\ud83c\uddea kr SEK' }, { value: 'CHF', label: '\ud83c\udde8\ud83c\udded CHF' },
                { value: 'NZ$', label: '\ud83c\uddf3\ud83c\uddff NZ$ NZD' }
            ],
            onChange: () => { reTotal(); dirty(); }
        });
    }
    lucide.createIcons();
    setTimeout(() => {
        initPaymentTermsEditor(p);
        document.querySelectorAll('.li-desc-editor').forEach((el, i) => {
            if (items[i]) initSingleLiEditor(el, items[i].detail);
        });
    }, 100);
}

function initPricingDrag() {
    const list = document.getElementById('pricingSecList');
    if (!list) return;
    let dragEl = null;
    list.querySelectorAll('.price-sec').forEach(b => {
        b.addEventListener('dragstart', (e) => {
            dragEl = b; b.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', '');
        });
        b.addEventListener('dragend', () => {
            b.classList.remove('dragging');
            list.querySelectorAll('.price-sec').forEach(x => { x.classList.remove('drag-over', 'drag-over-bottom'); });
            savePricingOrder();
        });
        b.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!dragEl || dragEl === b) return;
            list.querySelectorAll('.price-sec').forEach(x => { x.classList.remove('drag-over', 'drag-over-bottom'); });
            const mid = b.getBoundingClientRect().top + b.getBoundingClientRect().height / 2;
            b.classList.add(e.clientY < mid ? 'drag-over' : 'drag-over-bottom');
        });
        b.addEventListener('dragleave', () => { b.classList.remove('drag-over', 'drag-over-bottom'); });
        b.addEventListener('drop', (e) => {
            e.preventDefault();
            list.querySelectorAll('.price-sec').forEach(x => { x.classList.remove('drag-over', 'drag-over-bottom'); });
            if (!dragEl || dragEl === b) return;
            const mid = b.getBoundingClientRect().top + b.getBoundingClientRect().height / 2;
            if (e.clientY < mid) list.insertBefore(dragEl, b);
            else list.insertBefore(dragEl, b.nextSibling);
        });
    });
}

function savePricingOrder() {
    const p = cur(); if (!p) return;
    const els = document.querySelectorAll('#pricingSecList .price-sec');
    p.pricingSectionOrder = [...els].map(el => el.dataset.sec);
    persist();
}

function initPaymentTermsEditor(p) {
    if (paymentTermsEditor && typeof paymentTermsEditor.destroy === 'function') {
        try { paymentTermsEditor.destroy(); } catch (e) { }
    }
    paymentTermsEditor = null;

    const ptHolder = document.getElementById('paymentTermsEditor');
    if (!ptHolder) return;
    ptHolder.classList.add('editor-loading');

    let data;
    if (p.paymentTerms) {
        if (typeof p.paymentTerms === 'string') {
            if (p.paymentTerms.trim()) {
                data = { blocks: p.paymentTerms.split('\n\n').map(t => ({ type: 'paragraph', data: { text: t } })) };
            } else {
                data = { blocks: [] };
            }
        } else {
            data = p.paymentTerms;
        }
    } else {
        data = { blocks: [] };
    }

    // Resolve CDN globals with fallbacks
    const EditorHeader = window.Header || window.EditorjsHeader;
    const EditorList = window.List || window.EditorjsList || window.NestedList;

    try {
        paymentTermsEditor = new EditorJS({
            holder: 'paymentTermsEditor',
            data: data,
            tools: {
                header: { class: EditorHeader, inlineToolbar: true, config: { placeholder: 'Heading', levels: [2, 3, 4], defaultLevel: 3 } },
                list: { class: EditorList, inlineToolbar: true },
                quote: { class: window.Quote || window.EditorQuote || class {}, inlineToolbar: true },
                marker: window.Marker || window.EditorMarker || class {},
                delimiter: window.Delimiter || window.EditorDelimiter || class {}
            },
            placeholder: 'Add payment terms... (use / for blocks)',
            minHeight: 60,
            onReady: () => { ptHolder.classList.remove('editor-loading'); ptHolder.classList.add('editor-loaded'); },
            onChange: () => dirty()
        });
    } catch (e) { console.error('Payment terms editor init error', e); }
}

function initSingleLiEditor(el, initialData) {
    if (el._editor && typeof el._editor.destroy === 'function') {
        try { el._editor.destroy(); } catch (e) { }
    }
    el._editor = null;
    el.classList.add('editor-loading');

    let data;
    if (typeof initialData === 'string') {
        if (initialData.trim()) {
            data = { blocks: initialData.split('\n').map(t => ({ type: 'paragraph', data: { text: t } })) };
        } else { data = { blocks: [] }; }
    } else { data = initialData || { blocks: [] }; }

    try {
        const EditorHeader = window.Header || window.EditorjsHeader;
        const EditorList = window.List || window.EditorjsList || window.NestedList;

        el._editor = new EditorJS({
            holder: el,
            data: data,
            tools: {
                header: { class: EditorHeader, inlineToolbar: true, config: { placeholder: 'Heading', levels: [3, 4], defaultLevel: 3 } },
                list: { class: EditorList, inlineToolbar: true },
                quote: { class: window.Quote || window.EditorQuote || class {}, inlineToolbar: true },
                marker: window.Marker || window.EditorMarker || class {},
                delimiter: window.Delimiter || window.EditorDelimiter || class {}
            },
            placeholder: 'Description...',
            minHeight: 0,
            onReady: () => { el.classList.remove('editor-loading'); el.classList.add('editor-loaded'); },
            onChange: () => dirty()
        });
    } catch (e) { console.error('LI editor init error', e); }
}

function destroyLiEditor(row) {
    const editorEl = row.querySelector('.li-desc-editor');
    if (editorEl?._editor && typeof editorEl._editor.destroy === 'function') {
        try { editorEl._editor.destroy(); } catch (e) { }
        editorEl._editor = null;
    }
}

function deleteLineItem(btn) {
    const row = btn.closest('tr');
    const desc = row.querySelector('.ld')?.value || '';
    if (desc.trim().length > 0) {
        confirmDialog('Delete this line item?', () => {
            destroyLiEditor(row);
            row.remove();
            reTotal();
            dirty();
        }, { title: 'Delete Line Item', confirmText: 'Delete' });
        return;
    }
    destroyLiEditor(row);
    row.remove();
    reTotal();
    dirty();
}

function addLine() {
    const body = document.getElementById('liBody');
    if (!body) {
        // First item from empty state — add a blank item and re-render
        const p = cur(); if (!p) return;
        p.lineItems = [{ desc: '', qty: 1, rate: 0, detail: null }];
        persist();
        renderPricing(p);
        return;
    }
    const tr = document.createElement('tr');
    tr.className = 'li-row';
    const c = cselGetValue(document.getElementById('fCur')) || defaultCurrency();
    const uniqueId = 'li-' + Date.now() + Math.random().toString(36).slice(2, 5);
    tr.innerHTML = `<td><div class="li-title-wrap"><input type="text" class="ld" placeholder="Item title" oninput="dirty()"><div class="editorjs-container li-desc-editor" id="${uniqueId}"></div></div></td><td><input type="number" class="lq" value="1" min="0" oninput="reRow(this);dirty()"></td><td><input type="number" class="lr" value="0" min="0" oninput="reRow(this);dirty()"></td><td class="li-amt">${fmtCur(0, c)}</td><td><button class="btn-sm-icon-ghost" onclick="deleteLineItem(this)" aria-label="Delete item" data-tooltip="Delete" data-side="bottom" data-align="center"><i data-lucide="x"></i></button></td>`;
    body.appendChild(tr);
    lucide.createIcons();
    const el = document.getElementById(uniqueId);
    if (el) initSingleLiEditor(el, null);
    dirty();
}

function reRow(inp) {
    const row = inp.closest('tr');
    const q = Math.max(0, parseFloat(row.querySelector('.lq').value) || 0);
    const r = Math.max(0, parseFloat(row.querySelector('.lr').value) || 0);
    const c = cselGetValue(document.getElementById('fCur')) || defaultCurrency();
    row.querySelector('.li-amt').textContent = fmtCur(q * r, c);
    reTotal();
}

function reTotal() {
    let subtotal = 0;
    const c = cselGetValue(document.getElementById('fCur')) || defaultCurrency();
    document.querySelectorAll('.li-row').forEach(row => {
        const q = Math.max(0, parseFloat(row.querySelector('.lq')?.value) || 0);
        const r = Math.max(0, parseFloat(row.querySelector('.lr')?.value) || 0);
        subtotal += q * r;
    });
    const disc = Math.max(0, parseFloat(document.getElementById('fDiscount')?.value) || 0);
    const taxRate = Math.min(100, Math.max(0, parseFloat(document.getElementById('fTaxRate')?.value) || 0));
    const afterDisc = Math.max(0, subtotal - disc);
    const taxAmt = Math.round(afterDisc * taxRate / 100);
    const addOnsTotal = (typeof calcAddOnsTotal === 'function') ? calcAddOnsTotal() : 0;
    const grand = afterDisc + taxAmt + addOnsTotal;
    const subEl = document.getElementById('subtotalVal');
    const taxEl = document.getElementById('taxAmtVal');
    const totalEl = document.getElementById('totalVal');
    const aoRow = document.getElementById('addOnsSummaryRow');
    if (subEl) subEl.textContent = fmtCur(subtotal, c);
    if (taxEl) taxEl.textContent = fmtCur(taxAmt, c);
    if (aoRow) {
        if (addOnsTotal > 0) {
            aoRow.style.display = '';
            aoRow.innerHTML = `<span class="sr-label">Add-Ons</span><span class="sr-val">${fmtCur(addOnsTotal, c)}</span>`;
        } else { aoRow.style.display = 'none'; }
    }
    if (totalEl) totalEl.textContent = fmtCur(grand, c);
    // Sync stats bar at top
    const statEl = document.getElementById('statValue');
    if (statEl) {
        statEl.innerHTML = `<i data-lucide="banknote"></i> <strong>${fmtCur(grand, c)}</strong>`;
        lucide.createIcons();
    }
}

