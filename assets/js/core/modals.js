// ════════════════════════════════════════
// MODALS & TOASTS
// ════════════════════════════════════════

/* exported openNewModal, pickNewModalColor, closeNewModal, toast, showLoading, hideLoading, confirmDialog */
/** @param {HTMLElement} modal — trap Tab focus within this element */
function trapFocus(modal) {
    const sel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const els = modal.querySelectorAll(sel);
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    modal._trapHandler = function(e) {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
        else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    modal.addEventListener('keydown', modal._trapHandler);
    first.focus();
}

function releaseFocus(modal) {
    if (modal._trapHandler) { modal.removeEventListener('keydown', modal._trapHandler); delete modal._trapHandler; }
}

function openNewModal() {
    const modal = document.getElementById('newModalInner');
    const curCat = window._newModalCat || 'general';
    const font = CONFIG?.font || 'System';
    const color = CONFIG?.color || COLORS[0];

    // Template descriptions for cards
    const tplDesc = {
        blank: 'Start from scratch', web: 'Website & app projects', design: 'Branding & UI/UX',
        consulting: 'Advisory & strategy', saas: 'Cloud software products', marketing: 'Campaigns & SEO',
        photography: 'Shoots & editing', ecommerce: 'Online store builds', mobile: 'iOS & Android apps',
        india: 'GST/TDS compliant', us: 'W-9 & Net 30 terms', uk: 'VAT & IR35 ready'
    };

    // Category tabs
    const tabs = TPL_CATEGORIES.map(c =>
        `<button class="filter-tab ${c.key === curCat ? 'on' : ''}" onclick="window._newModalCat='${c.key}';openNewModal()"><i data-lucide="${c.icon}"></i> ${c.label}</button>`
    ).join('');

    // Template cards for current category
    let cards = '';
    if (curCat === 'saved') {
        const saved = safeGetStorage('pk_templates', []);
        if (!saved.length) {
            cards = '<div class="empty empty-sm"><div class="empty-t">No saved templates</div><div class="empty-d">Open a proposal and use Save as Template to create one.</div></div>';
        } else {
            cards = saved.map((t, idx) => {
                const secs = (t.sections || []).length;
                const items = (t.lineItems || []).length;
                return `<div class="tpl-c" onclick="fromSavedTpl(${idx})">
                    <div class="tpl-preview"><div class="tm-bar" style="width:${50 + secs * 10}%;height:4px"></div><div class="tm-bar" style="width:100%;height:3px;opacity:0.5"></div>${items > 1 ? '<div class="tm-bar tm-accent" style="width:40%;height:4px"></div>' : ''}<div class="tm-bar" style="width:${60 + items * 5}%;height:3px;opacity:0.3"></div></div>
                    <div class="tpl-row"><div class="tpl-ic"><i data-lucide="bookmark"></i></div><div style="flex:1"><div class="tpl-t">${esc(t.title)}</div><div class="tpl-d">${secs} sections, ${items} items</div></div><button class="btn-sm-icon-ghost" onclick="deleteSavedTpl(${idx},event)" data-tooltip="Delete" data-side="bottom"><i data-lucide="trash-2"></i></button></div>
                </div>`;
            }).join('');
        }
    } else {
        const tpls = Object.entries(TPLS).filter(([, v]) => v.category === curCat);
        cards = tpls.map(([key, t]) => {
            const secs = (t.sections || []).length;
            const items = (t.lineItems || []).length;
            const countryBadge = t.countryLabel ? `<span class="tpl-badge">${esc(t.countryLabel)}</span>` : '';
            return `<div class="tpl-c" onclick="fromTpl('${key}')">
                <div class="tpl-preview"><div class="tm-bar" style="width:${50 + secs * 10}%;height:4px"></div><div class="tm-bar" style="width:100%;height:3px;opacity:0.5"></div>${items > 1 ? '<div class="tm-bar tm-accent" style="width:40%;height:4px"></div>' : ''}<div class="tm-bar" style="width:${60 + items * 5}%;height:3px;opacity:0.3"></div></div>
                <div class="tpl-row"><div class="tpl-ic"><i data-lucide="${t.icon || 'file'}"></i></div><div><div class="tpl-t">${esc(t.title.replace(' Proposal', ''))}${countryBadge}</div><div class="tpl-d">${tplDesc[key] || ''}</div></div></div>
            </div>`;
        }).join('');
    }

    // Font items
    const fonts = [
        { value: 'System', label: 'System (SF Pro)', desc: 'Default' },
        { value: 'Roboto', label: 'Roboto', desc: 'Standard' },
        { value: 'Lato', label: 'Lato', desc: 'Friendly' },
        { value: 'Playfair Display', label: 'Playfair Display', desc: 'Elegant' },
        { value: 'Merriweather', label: 'Merriweather', desc: 'Classic' },
        { value: 'Courier Prime', label: 'Courier Prime', desc: 'Typewriter' }
    ];

    // Color swatches
    const swatches = COLORS.map(c =>
        `<div class="nm-swatch ${c === color ? 'on' : ''}" style="background:${c}" onclick="pickNewModalColor('${c}')"></div>`
    ).join('');

    modal.innerHTML = `
        <div class="modal-t">New Proposal</div>
        <div class="modal-d">Pick a template and customize appearance</div>
        <div class="nm-tabs">${tabs}</div>
        <div class="tpl-grid">${cards}</div>
        <div class="nm-customize">
            <div class="nm-opt">
                <label class="fl" style="margin-bottom:6px">Font</label>
                <div id="nmFont"></div>
            </div>
            <div class="nm-opt">
                <label class="fl" style="margin-bottom:6px">Brand Color</label>
                <div class="nm-swatches">${swatches}</div>
            </div>
        </div>
        <div class="modal-foot"><button class="btn-sm-outline" onclick="closeNewModal()">Cancel</button></div>
    `;

    // Init font custom select
    csel(document.getElementById('nmFont'), {
        value: font,
        items: fonts,
        onChange: (val) => { CONFIG.font = val; saveConfig(); applyFont(val); }
    });

    const nm = document.getElementById('newModal');
    nm.classList.add('show');
    trapFocus(nm);
    lucide.createIcons();
}

function pickNewModalColor(c) {
    CONFIG.color = c;
    saveConfig();
    document.querySelectorAll('.nm-swatch').forEach(s => s.classList.toggle('on', s.style.background === c));
}

function closeNewModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const nm = document.getElementById('newModal');
    releaseFocus(nm);
    nm.classList.remove('show');
}

/** @param {string} msg @param {'success'|'error'|'warning'|'info'} [type] */
function toast(msg, type = 'success') {
    const box = document.getElementById('toastBox');
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    const icons = {
        success: 'check-circle',
        error: 'alert-circle',
        warning: 'alert-triangle',
        info: 'info'
    };
    t.innerHTML = '<i data-lucide="' + (icons[type] || 'check-circle') + '"></i> ' + esc(msg);
    box.appendChild(t);
    lucide.createIcons();
    const duration = type === 'error' ? 4000 : 2500;
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transition = 'opacity .2s ease-out';
        setTimeout(() => t.remove(), 300);
    }, duration);
}

function showLoading(text = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const textEl = document.getElementById('loadingText');
    if (textEl) textEl.textContent = text;
    if (overlay) {
        overlay.style.display = 'flex';
        lucide.createIcons();
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

// Custom confirm dialog (replaces native confirm())
/** @param {string} message @param {Function} onConfirm @param {{title?: string, confirmText?: string, destructive?: boolean}} [opts] */
function confirmDialog(message, onConfirm, opts = {}) {
    const title = opts.title || 'Confirm';
    const confirmText = opts.confirmText || 'Delete';
    const destructive = opts.destructive !== false;
    const previousFocus = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.id = 'confirmModal';
    wrap.setAttribute('role', 'alertdialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', title);
    const closeModal = () => { releaseFocus(wrap); wrap.remove(); if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus(); };
    wrap.onclick = (e) => { if (e.target === wrap) closeModal(); };
    wrap.innerHTML = `
        <div class="modal modal-sm" onclick="event.stopPropagation()">
            <div class="modal-t" style="margin-bottom:4px">${esc(title)}</div>
            <div class="modal-d" style="margin-bottom:0">${esc(message)}</div>
            <div class="modal-foot">
                <button class="btn-sm-outline" id="confirmCancelBtn">Cancel</button>
                <button class="${destructive ? 'btn-sm-destructive' : 'btn-sm'}" id="confirmBtn">${esc(confirmText)}</button>
            </div>
        </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    document.getElementById('confirmCancelBtn').onclick = closeModal;
    document.getElementById('confirmBtn').onclick = () => { closeModal(); onConfirm(); };
    trapFocus(wrap);
}
