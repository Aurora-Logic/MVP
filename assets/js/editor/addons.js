// ════════════════════════════════════════
// ADD-ONS — Optional extras (Phase 2.2)
// ════════════════════════════════════════

function renderAddOns(p) {
    const el = document.getElementById('addOnsSection');
    if (!el) return;
    const addOns = p.addOns || [];
    const c = p.currency || defaultCurrency();

    let rows = '';
    addOns.forEach((ao, i) => {
        rows += `<div class="ao-row">
            <label class="ao-check">
                <input type="checkbox" ${ao.selected ? 'checked' : ''} onchange="toggleAddOn(${i});dirty()">
                <span class="ao-checkmark"><i data-lucide="check" style="width:12px;height:12px"></i></span>
            </label>
            <input type="text" class="ao-desc" value="${esc(ao.desc)}" placeholder="Add-on description" oninput="dirty()">
            <input type="number" class="ao-price" value="${ao.price || 0}" min="0" step="100" oninput="reTotal();dirty()">
            <button class="btn-sm-icon-ghost" onclick="removeAddOn(${i})" data-tooltip="Remove" data-side="bottom" data-align="center"><i data-lucide="x"></i></button>
        </div>`;
    });

    el.innerHTML = `<div class="card card-p">
        <div class="card-head">
            <div><div class="card-t">Optional Add-Ons</div><div class="card-d">Extras your client can opt into</div></div>
            <button class="btn-sm-outline" onclick="addAddOn()"><i data-lucide="plus"></i> Add</button>
        </div>
        <div id="aoBody">${rows || '<div class="ao-empty">No add-ons yet. Click "Add" to create optional extras.</div>'}</div>
    </div>`;
    lucide.createIcons();
}

function addAddOn() {
    const p = cur(); if (!p) return;
    if (!p.addOns) p.addOns = [];
    p.addOns.push({ desc: '', price: 0, selected: false });
    persist();
    renderAddOns(p);
    reTotal();
}

function removeAddOn(idx) {
    const p = cur(); if (!p || !p.addOns) return;
    p.addOns.splice(idx, 1);
    persist();
    renderAddOns(p);
    reTotal();
    dirty();
}

function toggleAddOn(idx) {
    const p = cur(); if (!p || !p.addOns) return;
    p.addOns[idx].selected = !p.addOns[idx].selected;
    persist();
    reTotal();
}

function calcAddOnsTotal() {
    const p = cur(); if (!p || !p.addOns) return 0;
    // Read from DOM for live values
    const rows = document.querySelectorAll('.ao-row');
    let total = 0;
    rows.forEach((row, i) => {
        const checked = row.querySelector('input[type="checkbox"]')?.checked;
        const price = parseFloat(row.querySelector('.ao-price')?.value) || 0;
        if (checked) total += price;
    });
    return total;
}

function collectAddOnsData(p) {
    const rows = document.querySelectorAll('.ao-row');
    if (!rows.length && !document.getElementById('aoBody')) return;
    p.addOns = [];
    rows.forEach(row => {
        p.addOns.push({
            desc: row.querySelector('.ao-desc')?.value || '',
            price: parseFloat(row.querySelector('.ao-price')?.value) || 0,
            selected: row.querySelector('input[type="checkbox"]')?.checked || false
        });
    });
}

function buildAddOnsPdfHtml(p, c, bc) {
    const addOns = (p.addOns || []).filter(a => a.desc);
    if (!addOns.length) return '';
    const currSymbol = c || defaultCurrency();
    let h = `<div style="margin-top:20px;page-break-inside:avoid;break-inside:avoid"><div style="font-size:14px;font-weight:700;margin-bottom:10px;padding-bottom:5px;border-bottom:2px solid ${bc};color:${bc}">Optional Add-Ons</div>`;
    addOns.forEach(ao => {
        const icon = ao.selected ? '☑' : '☐';
        h += `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f4f4f5">
            <span style="font-size:13px;color:${ao.selected ? '#09090b' : '#a1a1aa'}">${icon} ${esc(ao.desc)}</span>
            <span style="font-size:13px;font-family:var(--mono);font-weight:500;color:${ao.selected ? '#09090b' : '#a1a1aa'}">${currSymbol}${(ao.price || 0).toLocaleString(currSymbol === '₹' ? 'en-IN' : 'en-US')}</span>
        </div>`;
    });
    const selectedTotal = addOns.filter(a => a.selected).reduce((s, a) => s + (a.price || 0), 0);
    if (selectedTotal > 0) {
        h += `<div style="display:flex;justify-content:flex-end;padding:8px 0;font-size:13px;font-weight:600"><span>Add-Ons Total: ${currSymbol}${selectedTotal.toLocaleString(currSymbol === '₹' ? 'en-IN' : 'en-US')}</span></div>`;
    }
    h += '</div>';
    return h;
}
