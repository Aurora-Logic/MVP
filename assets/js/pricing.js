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
    if (!items.length) rows = `<tr class="li-row"><td><div class="li-title-wrap"><input type="text" class="ld" placeholder="Item title" oninput="dirty()"><div class="editorjs-container li-desc-editor" id="li-editor-0"></div></div></td><td><input type="number" class="lq" value="1" min="0" oninput="reRow(this);dirty()"></td><td><input type="number" class="lr" value="0" min="0" oninput="reRow(this);dirty()"></td><td class="li-amt">${fmtCur(0, p.currency)}</td><td><button class="btn-sm-icon-ghost" onclick="this.closest('tr').remove();reTotal();dirty()"><i data-lucide="x"></i></button></td></tr>`;

    const subtotal = (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0);
    const disc = p.discount || 0;
    const taxRate = p.taxRate || 0;
    const afterDisc = subtotal - disc;
    const taxAmt = Math.round(afterDisc * taxRate / 100);
    const grand = afterDisc + taxAmt;

    const curOpts = [['₹', 'INR'], ['$', 'USD'], ['€', 'EUR'], ['£', 'GBP'], ['A$', 'AUD'], ['C$', 'CAD'], ['S$', 'SGD'], ['د.إ', 'AED'], ['¥', 'JPY'], ['¥CN', 'CNY']].map(([v, l]) => `<option value="${v}" ${p.currency === v ? 'selected' : ''}>${v} ${l}</option>`).join('');
    const taxLbl = CONFIG?.country === 'IN' ? 'GST' : (['GB', 'DE', 'FR', 'NL', 'IE', 'SE', 'CH'].includes(CONFIG?.country) ? 'VAT' : 'Tax');

    const sectionHtml = {
        packages: '<div id="pkgSection"></div>',
        lineItems: `<div class="card card-p"><div class="card-head"><div><div class="card-t">Line Items</div><div class="card-d">Deliverables and costs</div></div><div style="display:flex;align-items:center;gap:8px"><label class="fl" style="margin:0;font-size:10px">Currency</label><select id="fCur" style="width:84px;padding:4px 12px!important ;font-size:12px;border-radius:999px!important" onchange="dirty();reTotal()">${curOpts}</select></div></div><table class="li-tbl"><thead><tr><th style="width:40%">Item</th><th style="width:12%">Qty</th><th style="width:18%">Rate</th><th style="width:18%;text-align:right">Amount</th><th style="width:12%"></th></tr></thead><tbody id="liBody">${rows}</tbody></table><div style="padding-top:14px;margin-top:14px;border-top:1px solid var(--border)"><div style="display:flex;justify-content:space-between;align-items:flex-start"><button class="btn-sm-outline" onclick="addLine()"><i data-lucide="plus"></i> Add Item</button>${typeof openCsvImport === 'function' ? '<button class="btn-sm-outline" onclick="openCsvImport()" style="margin-left:4px"><i data-lucide="file-spreadsheet"></i> Import CSV</button>' : ''}<div style="width:260px"><div class="summary-row sub"><span class="sr-label">Subtotal</span><span class="sr-val" id="subtotalVal">${fmtCur(subtotal, p.currency)}</span></div><div class="summary-row sub" style="gap:8px"><span class="sr-label">Discount</span><div style="display:flex;align-items:center;gap:4px;margin-left:auto"><span style="font-size:12px;color:var(--text4)">−</span><input type="number" id="fDiscount" value="${disc}" min="0" step="500" style="width:90px;padding:4px 8px;font-size:12px;text-align:right" oninput="reTotal();dirty()"></div></div><div class="summary-row sub" style="gap:8px"><span class="sr-label">${taxLbl}</span><div style="display:flex;align-items:center;gap:4px;margin-left:auto"><input type="number" id="fTaxRate" value="${taxRate}" min="0" max="100" step="0.5" style="width:55px;padding:4px 8px;font-size:12px;text-align:right" oninput="reTotal();dirty()"><span style="font-size:12px;color:var(--text4)">%</span><span class="sr-val" style="min-width:70px;text-align:right" id="taxAmtVal">${fmtCur(taxAmt, p.currency)}</span></div></div><div class="summary-row sub" id="addOnsSummaryRow" style="display:none"></div><div class="summary-row grand"><span class="sr-label">Total</span><span class="sr-val" id="totalVal">${fmtCur(grand, p.currency)}</span></div></div></div></div></div>`,
        addOns: '<div id="addOnsSection"></div>',
        paySchedule: '<div id="payScheduleSection"></div>',
        payTerms: `<div class="card card-p"><div class="card-head"><div><div class="card-t">Payment Terms</div><div class="card-d">Conditions and legal terms</div></div><div style="display:flex;gap:6px"><button class="btn-sm-outline" onclick="openTCLib()"><i data-lucide="bookmark"></i> T&C Library</button></div></div><div class="fg" style="margin:0"><div id="paymentTermsEditor" class="editorjs-container"></div></div></div>`
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

    // Check if element exists
    if (!document.getElementById('paymentTermsEditor')) return;

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
                quote: { class: Quote, inlineToolbar: true },
                marker: Marker,
                delimiter: Delimiter
            },
            placeholder: 'Add payment terms... (use / for blocks)',
            minHeight: 60,
            onChange: () => dirty()
        });
    } catch (e) { console.error('Payment terms editor init error', e); }
}

function initSingleLiEditor(el, initialData) {
    if (el._editor && typeof el._editor.destroy === 'function') {
        try { el._editor.destroy(); } catch (e) { }
    }
    el._editor = null;

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
                quote: { class: Quote, inlineToolbar: true },
                marker: Marker,
                delimiter: Delimiter
            },
            placeholder: 'Description...',
            minHeight: 0,
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
    const tr = document.createElement('tr');
    tr.className = 'li-row';
    const c = document.getElementById('fCur')?.value || '\u20B9';
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
    const q = parseFloat(row.querySelector('.lq').value) || 0;
    const r = parseFloat(row.querySelector('.lr').value) || 0;
    const c = document.getElementById('fCur')?.value || '\u20B9';
    row.querySelector('.li-amt').textContent = fmtCur(q * r, c);
    reTotal();
}

function reTotal() {
    let subtotal = 0;
    const c = document.getElementById('fCur')?.value || '\u20B9';
    document.querySelectorAll('.li-row').forEach(row => {
        subtotal += (parseFloat(row.querySelector('.lq')?.value) || 0) * (parseFloat(row.querySelector('.lr')?.value) || 0);
    });
    const disc = parseFloat(document.getElementById('fDiscount')?.value) || 0;
    const taxRate = parseFloat(document.getElementById('fTaxRate')?.value) || 0;
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

// T&C Library
const TC_DEFAULTS = [
    { title: 'Standard Payment (50/50)', text: '50% advance before project kickoff.\nRemaining 50% upon completion and before final delivery.\nPayment due within 7 business days of invoice.', category: 'payment' },
    { title: 'Milestone-based (30/30/40)', text: '30% advance to begin work.\n30% upon design approval.\n40% upon final delivery.\nAll payments due within 15 days of invoice.', category: 'payment' },
    { title: 'Net 30 Terms', text: 'Payment is due within 30 days of invoice date.', category: 'payment' },
    { title: 'Net 15 Terms', text: 'Payment is due within 15 days of invoice date.', category: 'payment' },
    { title: 'IP Transfer on Payment', text: 'All intellectual property rights transfer to the client upon receipt of final payment.', category: 'legal' },
    { title: 'Revisions Policy (2 Rounds)', text: 'This proposal includes 2 rounds of revisions per deliverable. Additional revision rounds will be billed at the applicable hourly rate.', category: 'project' },
    { title: 'Cancellation (15 Days Notice)', text: 'Either party may terminate this agreement with 15 days written notice. Client will be billed for all work completed.', category: 'termination' },
    { title: 'Warranty (30 Days)', text: '30-day post-launch support included for bug fixes only. Feature additions will be quoted separately.', category: 'support' },
    { title: 'Late Payment Penalty', text: 'Invoices not paid within the due date will incur a late fee of 1.5% per month.', category: 'legal' },
    { title: 'Mutual Confidentiality', text: 'Both parties agree to keep all project-related information confidential.', category: 'legal' },
    { title: 'Force Majeure', text: 'Neither party shall be liable for delays due to circumstances beyond reasonable control.', category: 'legal' }
];

function openTCLib() {
    const userTC = JSON.parse(localStorage.getItem('pk_tclib') || '[]').map(t => ({ ...t, category: 'custom' }));
    const all = [...TC_DEFAULTS, ...userTC];
    window._tcData = all;

    const categories = {
        all: { label: 'All', icon: 'layers' },
        payment: { label: 'Payment', icon: 'credit-card' },
        legal: { label: 'Legal & IP', icon: 'shield' },
        project: { label: 'Project', icon: 'folder' },
        termination: { label: 'Termination', icon: 'x-circle' },
        support: { label: 'Support', icon: 'headphones' },
        custom: { label: 'Custom', icon: 'bookmark' }
    };

    const renderItems = (filter) => {
        const filtered = filter === 'all' ? all : all.filter(t => t.category === filter);
        if (!filtered.length) return '<div style="padding:20px;text-align:center;color:var(--text4)">No items in this category</div>';
        return filtered.map((t) => {
            const idx = all.indexOf(t);
            return `<div class="tc-chip" onclick="insertTC(${idx})"><div class="tc-chip-t">${esc(t.title)}</div><div class="tc-chip-d">${esc(t.text.substring(0, 70))}...</div></div>`;
        }).join('');
    };

    const tabs = Object.entries(categories).map(([k, v]) => {
        const count = k === 'all' ? all.length : all.filter(t => t.category === k).length;
        if (count === 0 && k !== 'custom') return '';
        return `<button class="tc-tab ${k === 'all' ? 'active' : ''}" data-cat="${k}" onclick="filterTCLib('${k}')"><i data-lucide="${v.icon}"></i>${v.label}<span class="tc-count">${count}</span></button>`;
    }).join('');

    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap show';
    wrap.id = 'tcModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    wrap.innerHTML = `
        <div class="modal modal-lg" onclick="event.stopPropagation()">
            <div class="modal-t">Terms & Conditions Library</div>
            <div class="modal-d">Click any term to append it to your payment terms</div>
            <div class="tc-tabs">${tabs}</div>
            <div class="tc-grid" id="tcGrid" style="max-height:340px;overflow-y:auto">${renderItems('all')}</div>
            <div class="modal-foot"><button class="btn-sm-outline" onclick="document.getElementById('tcModal').remove()">Close</button></div>
        </div>`;
    document.body.appendChild(wrap);
    lucide.createIcons();
}

function filterTCLib(cat) {
    const all = window._tcData;
    const filtered = cat === 'all' ? all : all.filter(t => t.category === cat);
    const grid = document.getElementById('tcGrid');
    if (!filtered.length) {
        grid.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text4)">No items in this category</div>';
    } else {
        grid.innerHTML = filtered.map((t) => {
            const idx = all.indexOf(t);
            return `<div class="tc-chip" onclick="insertTC(${idx})"><div class="tc-chip-t">${esc(t.title)}</div><div class="tc-chip-d">${esc(t.text.substring(0, 70))}...</div></div>`;
        }).join('');
    }
    document.querySelectorAll('.tc-tab').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tc-tab[data-cat="${cat}"]`)?.classList.add('active');
}

function insertTC(i) {
    const tc = window._tcData[i];
    if (paymentTermsEditor && paymentTermsEditor.blocks) {
        const blockCount = paymentTermsEditor.blocks.getBlocksCount();
        if (blockCount > 0) paymentTermsEditor.blocks.insert('paragraph', { text: '' });
        tc.text.split('\n').filter(line => line.trim()).forEach(line => {
            paymentTermsEditor.blocks.insert('paragraph', { text: line });
        });
        dirty();
    }
    document.getElementById('tcModal')?.remove();
    toast(tc.title + ' added');
}

// buildPricingInsights moved to csv-import.js
