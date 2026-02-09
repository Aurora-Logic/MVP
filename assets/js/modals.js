// ════════════════════════════════════════
// MODALS & TOASTS
// ════════════════════════════════════════

function openNewModal() {
    document.getElementById('newModal').classList.add('show');
    lucide.createIcons();
}

function closeNewModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('newModal').classList.remove('show');
}

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
function confirmDialog(message, onConfirm, opts = {}) {
    const title = opts.title || 'Confirm';
    const confirmText = opts.confirmText || 'Delete';
    const destructive = opts.destructive !== false;
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap show';
    wrap.id = 'confirmModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    wrap.innerHTML = `
        <div class="modal modal-sm" onclick="event.stopPropagation()">
            <div class="modal-t" style="margin-bottom:4px">${esc(title)}</div>
            <div class="modal-d" style="margin-bottom:0">${esc(message)}</div>
            <div class="modal-foot">
                <button class="btn-sm-outline" onclick="document.getElementById('confirmModal').remove()">Cancel</button>
                <button class="${destructive ? 'btn-sm-destructive' : 'btn-sm'}" id="confirmBtn">${esc(confirmText)}</button>
            </div>
        </div>`;
    document.body.appendChild(wrap);
    document.getElementById('confirmBtn').onclick = () => {
        wrap.remove();
        onConfirm();
    };
}
