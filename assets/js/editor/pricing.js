// ════════════════════════════════════════
// PRICING TAB
// ════════════════════════════════════════

/* exported deleteLineItem, addLine, reRow */
function renderPricing(p) {
    const items = p.lineItems || [];
    let rows = '';
    items.forEach((item, i) => {
        rows += `<tr class="li-row" draggable="false">
      <td class="li-grip-td"><span class="li-grip" onmousedown="this.closest('.li-row').draggable=true" onmouseup="this.closest('.li-row').draggable=false"><i data-lucide="grip-vertical"></i></span></td>
      <td><div class="li-title-wrap"><input type="text" class="ld" value="${esc(item.desc)}" placeholder="Item title" oninput="dirty()"><div class="tiptap-wrap li-desc-editor" id="li-editor-${i}"></div></div></td>
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
        lineItems: `<div class="card card-p"><div class="card-head"><div><div class="card-t">Line items</div><div class="card-d">Deliverables and costs</div></div><div class="pricing-cur-wrap"><label class="fl pricing-cur-label">Currency</label><div id="fCur" class="pricing-cur-sel"></div></div></div>${hasItems ? `<table class="li-tbl"><thead><tr><th style="width:28px"></th><th style="width:40%">Item</th><th style="width:12%">Qty</th><th style="width:18%">Rate</th><th style="width:18%;text-align:right">Amount</th><th style="width:12%"></th></tr></thead><tbody id="liBody">${rows}</tbody></table><div class="pricing-summary-area"><div class="pricing-summary-layout"><button class="btn-sm-outline" onclick="addLine()"><i data-lucide="plus"></i> Add Item</button>${typeof openCsvImport === 'function' ? '<button class="btn-sm-outline" onclick="openCsvImport()"><i data-lucide="file-spreadsheet"></i> Import CSV</button>' : ''}<div class="pricing-summary-col"><div class="summary-row sub"><span class="sr-label">Subtotal</span><span class="sr-val" id="subtotalVal">${fmtCur(subtotal, p.currency)}</span></div><div class="summary-row sub pricing-disc-row"><span class="sr-label">Discount</span><div class="pricing-disc-input"><span class="pricing-disc-sign">−</span><input type="number" id="fDiscount" value="${disc}" min="0" step="500" class="pricing-disc-field" oninput="reTotal();dirty()"></div></div><div class="summary-row sub pricing-disc-row"><span class="sr-label">${taxLbl}</span><div class="pricing-disc-input"><input type="number" id="fTaxRate" value="${taxRate}" min="0" max="100" step="0.5" class="pricing-tax-field" oninput="reTotal();dirty()"><span class="pricing-disc-sign">%</span><span class="sr-val pricing-tax-val" id="taxAmtVal">${fmtCur(taxAmt, p.currency)}</span></div></div><div class="summary-row sub" id="addOnsSummaryRow" style="display:none"></div><div class="summary-row grand"><span class="sr-label">Total</span><span class="sr-val" id="totalVal">${fmtCur(grand, p.currency)}</span></div></div></div></div>` : `<div class="empty empty-sm"><div class="empty-icon"><i data-lucide="receipt"></i></div><div class="empty-t">No line items yet</div><div class="empty-d">Add deliverables, services, or products with quantities and rates.</div><div class="sec-header-actions"><button class="btn-sm-outline" onclick="addLine()"><i data-lucide="plus"></i> Add first item</button>${typeof openCsvImport === 'function' ? '<button class="btn-sm-outline" onclick="openCsvImport()"><i data-lucide="file-spreadsheet"></i> Import CSV</button>' : ''}</div></div>`}</div>`,
        addOns: '<div id="addOnsSection"></div>',
        paySchedule: '<div id="payScheduleSection"></div>',
        payments: '<div id="paymentsSection"></div>',
        payTerms: `<div class="card card-p"><div class="card-head"><div><div class="card-t">Payment terms</div><div class="card-d">Conditions and legal terms</div></div><div class="pricing-tc-actions"><button class="btn-sm-icon-ghost" onclick="showInsertVariableDropdown(paymentTermsEditor,this)" data-tooltip="Insert Variable" data-side="bottom" data-align="center"><i data-lucide="braces"></i></button><button class="btn-sm-outline" onclick="openTCLib()"><i data-lucide="bookmark"></i> T&C Library</button></div></div><div class="fg fg-flush"><div id="paymentTermsEditor" class="tiptap-wrap"></div></div></div>`
    };

    const defaultOrder = ['packages', 'lineItems', 'addOns', 'paySchedule', 'payments', 'payTerms'];
    const order = p.pricingSectionOrder || defaultOrder;
    const validOrder = order.filter(k => sectionHtml[k]);
    defaultOrder.forEach(k => { if (!validOrder.includes(k)) validOrder.push(k); });

    const sectionsHtml = validOrder.map(key =>
        `<div class="price-sec" draggable="false" data-sec="${key}"><span class="price-sec-grip" onmousedown="this.closest('.price-sec').draggable=true" onmouseup="this.closest('.price-sec').draggable=false"><i data-lucide="grip-vertical"></i></span><div class="price-sec-body">${sectionHtml[key]}</div></div>`
    ).join('');

    document.getElementById('edPricing').innerHTML = `<div id="pricingInsights"></div><div id="pricingSecList">${sectionsHtml}</div>`;
    initPricingDrag();
    initLineItemDrag();
    if (typeof renderPackages === 'function') renderPackages(p);
    if (typeof renderAddOns === 'function') renderAddOns(p);
    if (typeof renderPaymentSchedule === 'function') renderPaymentSchedule(p);
    if (typeof renderPayments === 'function') renderPayments(p);
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
    const l = document.getElementById('pricingSecList');
    if (!l) return;
    let d = null;
    const clr = () => l.querySelectorAll('.price-sec').forEach(x => x.classList.remove('drag-over', 'drag-over-bottom'));
    l.querySelectorAll('.price-sec').forEach(b => {
        b.ondragstart = (e) => { d = b; b.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', ''); };
        b.ondragend = () => { b.classList.remove('dragging'); b.draggable = false; clr(); savePricingOrder(); };
        b.ondragover = (e) => { e.preventDefault(); if (!d || d === b) return; clr(); b.classList.add(e.clientY < b.getBoundingClientRect().top + b.getBoundingClientRect().height / 2 ? 'drag-over' : 'drag-over-bottom'); };
        b.ondragleave = () => b.classList.remove('drag-over', 'drag-over-bottom');
        b.ondrop = (e) => { e.preventDefault(); clr(); if (!d || d === b) return; const m = b.getBoundingClientRect().top + b.getBoundingClientRect().height / 2; if (e.clientY < m) l.insertBefore(d, b); else l.insertBefore(d, b.nextSibling); };
    });
}

function initLineItemDrag() {
    const b = document.getElementById('liBody');
    if (!b) return;
    let d = null;
    const clr = () => b.querySelectorAll('.li-row').forEach(x => x.classList.remove('drag-over', 'drag-over-bottom'));
    b.querySelectorAll('.li-row').forEach(r => {
        r.ondragstart = (e) => { d = r; r.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', ''); };
        r.ondragend = () => { r.classList.remove('dragging'); r.draggable = false; clr(); dirty(); };
        r.ondragover = (e) => { e.preventDefault(); if (!d || d === r) return; clr(); r.classList.add(e.clientY < r.getBoundingClientRect().top + r.getBoundingClientRect().height / 2 ? 'drag-over' : 'drag-over-bottom'); };
        r.ondragleave = () => r.classList.remove('drag-over', 'drag-over-bottom');
        r.ondrop = (e) => { e.preventDefault(); clr(); if (!d || d === r) return; const m = r.getBoundingClientRect().top + r.getBoundingClientRect().height / 2; if (e.clientY < m) b.insertBefore(d, r); else b.insertBefore(d, r.nextSibling); };
    });
}

function savePricingOrder() {
    const p = cur(); if (!p) return;
    const els = document.querySelectorAll('#pricingSecList .price-sec');
    p.pricingSectionOrder = [...els].map(el => el.dataset.sec);
    persist();
}

function initPaymentTermsEditor(p) {
    if (paymentTermsEditor) {
        try { paymentTermsEditor.destroy(); } catch (e) { }
    }
    paymentTermsEditor = null;

    const ptHolder = document.getElementById('paymentTermsEditor');
    if (!ptHolder) return;
    ptHolder.classList.add('editor-loading');

    const html = typeof migrateEditorContent === 'function' ? migrateEditorContent(p.paymentTerms) : (p.paymentTerms || '');

    try {
        const editor = createEditor(ptHolder, {
            content: html,
            placeholder: 'Add payment terms...',
            tables: false,
            onChange: () => dirty()
        });
        if (!editor) {
            showPtFallback(ptHolder, html);
            return;
        }
        paymentTermsEditor = editor;
        ptHolder.classList.remove('editor-loading');
        ptHolder.classList.add('editor-loaded');
        // Verify render
        setTimeout(() => {
            if (!ptHolder.querySelector('[contenteditable]')) {
                try { editor.destroy(); } catch (_e) { /* ignore */ }
                showPtFallback(ptHolder, html);
            }
        }, 150);
    } catch (e) {
        console.error('Payment terms editor init error', e);
        showPtFallback(ptHolder, html);
    }
}

function showPtFallback(holder, html) {
    if (!holder || holder.querySelector('.sec-fallback-ta')) return;
    const tmp = document.createElement('div'); tmp.innerHTML = html || '';
    holder.innerHTML = `<textarea class="sec-fallback-ta" rows="4" placeholder="Add payment terms..." oninput="dirty()">${esc(tmp.textContent || '')}</textarea>`;
    holder.classList.remove('editor-loading'); holder.classList.add('editor-loaded');
    paymentTermsEditor = {
        getHTML: () => { const ta = holder.querySelector('.sec-fallback-ta'); return ta ? '<p>' + esc(ta.value).replace(/\n/g, '</p><p>') + '</p>' : ''; },
        destroy: () => { holder.innerHTML = ''; }
    };
}

function initSingleLiEditor(el, initialData) {
    if (el._editor) {
        try { el._editor.destroy(); } catch (e) { }
    }
    el._editor = null;
    el.classList.add('editor-loading');

    const html = typeof migrateEditorContent === 'function' ? migrateEditorContent(initialData) : '';

    try {
        const editor = createEditor(el, {
            content: html,
            placeholder: 'Description...',
            headingLevels: [3, 4],
            tables: false,
            taskList: false,
            onChange: () => dirty()
        });
        if (!editor) { console.warn('LI editor returned null'); return; }
        el._editor = editor;
        el.classList.remove('editor-loading');
        el.classList.add('editor-loaded');
    } catch (e) { console.error('LI editor init error', e); }
}

function destroyLiEditor(row) {
    const editorEl = row.querySelector('.li-desc-editor');
    if (editorEl?._editor) {
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
    tr.setAttribute('draggable', 'false');
    tr.innerHTML = `<td class="li-grip-td"><span class="li-grip" onmousedown="this.closest('.li-row').draggable=true" onmouseup="this.closest('.li-row').draggable=false"><i data-lucide="grip-vertical"></i></span></td><td><div class="li-title-wrap"><input type="text" class="ld" placeholder="Item title" oninput="dirty()"><div class="tiptap-wrap li-desc-editor" id="${uniqueId}"></div></div></td><td><input type="number" class="lq" value="1" min="0" oninput="reRow(this);dirty()"></td><td><input type="number" class="lr" value="0" min="0" oninput="reRow(this);dirty()"></td><td class="li-amt">${fmtCur(0, c)}</td><td><button class="btn-sm-icon-ghost" onclick="deleteLineItem(this)" aria-label="Delete item" data-tooltip="Delete" data-side="bottom" data-align="center"><i data-lucide="x"></i></button></td>`;
    body.appendChild(tr);
    initLineItemDrag();
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

