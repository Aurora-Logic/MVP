// ════════════════════════════════════════
// MODALS & TOASTS
// ════════════════════════════════════════

/* exported openNewModal, pickNewModalColor, closeNewModal, toast, showLoading, hideLoading, confirmDialog, inputDialog */
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
    navigate('/proposals/new');
}

function pickNewModalColor(c) {
    CONFIG.color = c;
    saveConfig();
    document.querySelectorAll('.nm-swatch').forEach(s => s.classList.toggle('on', s.style.background === c));
}

function closeNewModal(e) {
    if (e && e.target !== e.currentTarget) return;
    // Legacy modal close — also handle navigation back
    const nm = document.getElementById('newModal');
    if (nm) { releaseFocus(nm); nm.classList.remove('show'); }
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

// Custom input dialog (replaces native prompt())
/** @param {string} message @param {string} [defaultVal] @param {Function} onSubmit @param {{title?: string, placeholder?: string}} [opts] */
function inputDialog(message, defaultVal, onSubmit, opts = {}) {
    const title = opts.title || 'Input';
    const placeholder = opts.placeholder || '';
    const previousFocus = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.id = 'inputModal';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', title);
    const closeModal = () => { releaseFocus(wrap); wrap.remove(); if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus(); };
    wrap.onclick = (e) => { if (e.target === wrap) closeModal(); };
    wrap.innerHTML = `
        <div class="modal modal-sm" onclick="event.stopPropagation()">
            <div class="modal-t" style="margin-bottom:4px">${esc(title)}</div>
            <div class="modal-d" style="margin-bottom:12px">${esc(message)}</div>
            <input type="text" id="inputDialogField" value="${esc(defaultVal || '')}" placeholder="${esc(placeholder)}" style="width:100%">
            <div class="modal-foot">
                <button class="btn-sm-outline" id="inputCancelBtn">Cancel</button>
                <button class="btn-sm" id="inputSubmitBtn">OK</button>
            </div>
        </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    const field = document.getElementById('inputDialogField');
    document.getElementById('inputCancelBtn').onclick = closeModal;
    document.getElementById('inputSubmitBtn').onclick = () => { const val = field.value; closeModal(); onSubmit(val); };
    field.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); const val = field.value; closeModal(); onSubmit(val); } });
    trapFocus(wrap);
}
