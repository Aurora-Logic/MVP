// ════════════════════════════════════════
// CUSTOM SELECT — shadcn/ui style dropdowns
// ════════════════════════════════════════

// csel(el, options) — converts a container into a custom select
// options: { value, placeholder, searchable, small, items: [{ value, label, icon?, desc?, group? }], onChange }
function csel(el, opts) {
    if (!el) return;
    const items = opts.items || [];
    const grouped = {};
    items.forEach(i => {
        const g = i.group || '';
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push(i);
    });

    el.className = (el.className.replace(/\bcsel\b/g, '').trim() + ' csel' + (opts.small ? ' csel-sm' : '')).trim();
    el.dataset.value = opts.value || '';
    el._cselOpts = opts;

    const selected = items.find(i => i.value === opts.value);
    const displayLabel = selected ? selected.label : '';

    let menuHtml = '';
    const groups = Object.keys(grouped);
    groups.forEach((g, gi) => {
        if (g) menuHtml += `<div class="csel-group-label">${esc(g)}</div>`;
        grouped[g].forEach(i => {
            const isOn = i.value === opts.value;
            menuHtml += `<div class="csel-opt${isOn ? ' on' : ''}" data-val="${esc(i.value)}" data-label="${esc(i.label)}"${i.icon ? ' data-icon="' + esc(i.icon) + '"' : ''}>`;
            if (i.icon) menuHtml += `<i data-lucide="${i.icon}" class="csel-opt-icon"></i>`;
            menuHtml += `<span>${esc(i.label)}</span>`;
            if (i.desc) menuHtml += `<span class="csel-opt-desc">${esc(i.desc)}</span>`;
            menuHtml += `<i data-lucide="check" class="csel-check"></i></div>`;
        });
        if (gi < groups.length - 1) menuHtml += '<div class="csel-sep"></div>';
    });

    if (opts.searchable) {
        // Searchable: trigger is an input you can type in directly
        el.innerHTML = `<input type="text" class="csel-trigger csel-input" value="${esc(displayLabel)}" placeholder="${esc(opts.placeholder || 'Search...')}" autocomplete="off"><div class="csel-menu">${menuHtml}</div>`;
        const inp = el.querySelector('.csel-input');
        inp.addEventListener('focus', () => {
            inp.select();
            cselOpen(el);
        });
        inp.addEventListener('input', () => {
            cselOpen(el);
            _cselFilterMenu(el, inp.value);
        });
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { el.classList.remove('open'); inp.blur(); }
            if (e.key === 'Enter') {
                const first = el.querySelector('.csel-opt:not([style*="display: none"])');
                if (first) first.click();
            }
        });
    } else {
        el.innerHTML = `<button type="button" class="csel-trigger" onclick="cselToggle(this.parentElement)">${selected ? (selected.icon ? `<i data-lucide="${selected.icon}" class="csel-icon"></i>` : '') + esc(selected.label) : `<span class="csel-placeholder">${esc(opts.placeholder || 'Select...')}</span>`}</button><div class="csel-menu">${menuHtml}</div>`;
    }

    // Bind option clicks
    el.querySelectorAll('.csel-opt').forEach(opt => {
        opt.onclick = () => {
            const val = opt.dataset.val;
            el.dataset.value = val;
            const lbl = opt.dataset.label;
            const ic = opt.dataset.icon;
            if (opts.searchable) {
                el.querySelector('.csel-input').value = lbl;
            } else {
                el.querySelector('.csel-trigger').innerHTML = (ic ? `<i data-lucide="${ic}" class="csel-icon"></i>` : '') + esc(lbl);
            }
            el.querySelectorAll('.csel-opt').forEach(o => o.classList.remove('on'));
            opt.classList.add('on');
            el.classList.remove('open');
            // Reset filter
            _cselFilterMenu(el, '');
            lucide.createIcons();
            if (opts.onChange) opts.onChange(val);
        };
    });

    lucide.createIcons();
}

function cselOpen(el) {
    if (!el || el.classList.contains('open')) return;
    document.querySelectorAll('.csel.open').forEach(s => { if (s !== el) s.classList.remove('open'); });
    el.classList.add('open');
    const menu = el.querySelector('.csel-menu');
    if (menu) {
        menu.classList.remove('above');
        const rect = menu.getBoundingClientRect();
        if (rect.bottom > window.innerHeight - 10) menu.classList.add('above');
    }
}

function cselToggle(el) {
    if (!el) return;
    const wasOpen = el.classList.contains('open');
    document.querySelectorAll('.csel.open').forEach(s => s.classList.remove('open'));
    if (!wasOpen) cselOpen(el);
}

function _cselFilterMenu(el, q) {
    const query = (q || '').toLowerCase().trim();
    const menu = el.querySelector('.csel-menu');
    if (!menu) return;
    menu.querySelectorAll('.csel-opt').forEach(opt => {
        const label = (opt.dataset.label || '').toLowerCase();
        opt.style.display = (!query || label.includes(query)) ? '' : 'none';
    });
    menu.querySelectorAll('.csel-group-label').forEach(gl => {
        let next = gl.nextElementSibling;
        let anyVisible = false;
        while (next && !next.classList.contains('csel-group-label') && !next.classList.contains('csel-sep')) {
            if (next.style.display !== 'none') anyVisible = true;
            next = next.nextElementSibling;
        }
        gl.style.display = anyVisible ? '' : 'none';
    });
}

// Legacy compat
function cselFilter(input) { _cselFilterMenu(input.closest('.csel'), input.value); }

function cselGetValue(el) {
    return el?.dataset?.value || '';
}

// Close on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.csel')) {
        document.querySelectorAll('.csel.open').forEach(s => s.classList.remove('open'));
    }
});
