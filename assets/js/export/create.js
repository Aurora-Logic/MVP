// ════════════════════════════════════════
// CREATE / DUPLICATE / DELETE + SIDEBAR + CONTEXT MENU + SHARING
// ════════════════════════════════════════

/* exported doDupWithClient, fromTpl, fromSavedTpl, saveAsTemplate, doSaveAsTemplate, deleteSavedTpl, bumpVersion, toggleCover, ctxAction, createPropFromPage */

function _nextPropNum() {
    const nums = DB.map(p => { const m = (p.number || '').match(/PROP-(\d+)/); return m ? parseInt(m[1]) : 0; });
    return 'PROP-' + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0');
}

function _baseProp(id, title, sections, lineItems, paymentTerms, client) {
    const today = new Date().toISOString().split('T')[0];
    return {
        id, status: 'draft', title: title || 'Untitled', number: _nextPropNum(), date: today,
        validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        sender: { company: CONFIG?.company || '', email: CONFIG?.email || '', address: CONFIG?.address || '' },
        client: client || { name: '', contact: '', email: '', phone: '' },
        sections: JSON.parse(JSON.stringify(sections || [])),
        lineItems: JSON.parse(JSON.stringify(lineItems || [])),
        currency: defaultCurrency(), paymentTerms: paymentTerms || '', version: 1, coverPage: false,
        packagesEnabled: false, packages: null, packageFeatures: [],
        addOns: [], paymentSchedule: [], paymentScheduleMode: 'percentage', payments: [],
        notes: [{ text: 'Proposal created', time: Date.now(), type: 'system' }],
        createdAt: Date.now(), owner: CONFIG?.activeUserId || null
    };
}

function createProp(tpl) {
    if (typeof enforceLimit === 'function' && !enforceLimit('proposals')) return;
    const p = _baseProp(uid(), tpl.title, tpl.sections, tpl.lineItems, tpl.paymentTerms);
    DB.unshift(p); persist(); loadEditor(p.id); toast('Proposal created');
}

function _prepDup(src) {
    const dup = JSON.parse(JSON.stringify(src));
    dup.id = uid(); dup.title = src.title + ' (Copy)'; dup.number = _nextPropNum();
    dup.status = 'draft'; dup.createdAt = Date.now(); dup.version = 1;
    delete dup.shareToken; delete dup.sharedAt; delete dup.viewCount;
    delete dup.lastViewedAt; delete dup.clientResponse; delete dup.versionHistory;
    return dup;
}

function dupProp(id) {
    const src = DB.find(p => p.id === id); if (!src) return;
    const dup = _prepDup(src);
    dup.notes = [{ text: 'Duplicated from ' + src.number, time: Date.now(), type: 'system' }];
    DB.unshift(dup); persist(); loadEditor(dup.id); toast('Proposal duplicated');
}

// Phase 1.7: Duplicate with client swap
function dupPropWithClient(id) {
    const src = DB.find(p => p.id === id); if (!src) return;
    if (!CLIENTS.length) { dupProp(id); return; }
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'dupClientModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    let items = CLIENTS.map((c, i) => `<div class="cp-item" onclick="doDupWithClient('${escAttr(id)}', ${i})"><span class="cp-item-name">${esc(c.name)}</span><span class="cp-item-email">${esc(c.email)}</span></div>`).join('');
    items += `<div class="cp-item" onclick="doDupWithClient('${escAttr(id)}', -1)" style="color:var(--text4);font-style:italic"><span class="cp-item-name">Keep original client</span></div>`;
    wrap.innerHTML = `<div class="modal modal-sm" onclick="event.stopPropagation()"><div class="modal-t">Duplicate for client</div><div class="modal-d">Select a client for the duplicated proposal</div><div style="max-height:250px;overflow-y:auto;display:flex;flex-direction:column;gap:3px">${items}</div><div class="modal-foot"><button class="btn-sm-outline" onclick="document.getElementById('dupClientModal').remove()">Cancel</button></div></div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
}

function doDupWithClient(id, clientIdx) {
    document.getElementById('dupClientModal')?.remove();
    const src = DB.find(p => p.id === id); if (!src) return;
    const dup = _prepDup(src);
    if (clientIdx >= 0 && CLIENTS[clientIdx]) {
        const c = CLIENTS[clientIdx];
        dup.client = { name: c.name || '', contact: c.contact || '', email: c.email || '', phone: c.phone || '' };
        dup.notes = [{ text: 'Duplicated from ' + src.number + ' for ' + c.name, time: Date.now(), type: 'system' }];
    } else { dup.notes = [{ text: 'Duplicated from ' + src.number, time: Date.now(), type: 'system' }]; }
    DB.unshift(dup); persist(); loadEditor(dup.id); toast('Proposal duplicated');
}

function delProp(id) {
    const p = DB.find(x => x.id === id);
    if (!p) return;

    // DATA INTEGRITY FIX: Create backup before deletion
    const backupKey = 'pk_deleted_backup';
    const backup = safeGetStorage(backupKey, []);
    backup.unshift({ proposal: JSON.parse(JSON.stringify(p)), deletedAt: Date.now() });
    if (backup.length > 10) backup.splice(10); // Keep last 10 deletions
    safeLsSet(backupKey, backup);

    confirmDialog('Delete this proposal? This cannot be undone.', () => {
        DB = DB.filter(x => x.id !== id); persist();
        if (CUR === id) CUR = null;
        renderDashboard();
        refreshSide();
        toast('Proposal deleted');
    }, { title: 'Delete Proposal', confirmText: 'Delete' });
}

function createPropFromPage(state) {
    if (typeof enforceLimit === 'function' && !enforceLimit('proposals')) return;
    const tpl = state.template?.startsWith('saved_')
        ? safeGetStorage('pk_templates', [])[parseInt(state.template.replace('saved_', ''))] || TPLS.blank
        : TPLS[state.template] || TPLS.blank;
    const secs = (state.sections || []).filter(s => s.enabled).map(s => { const c = JSON.parse(JSON.stringify(s)); delete c.enabled; return c; });
    const client = state.client && state.client.name ? JSON.parse(JSON.stringify(state.client)) : null;
    const p = _baseProp(uid(), tpl.title, secs, state.lineItems, state.paymentTerms, client);
    if (state.color) { CONFIG.color = state.color; saveConfig(); }
    if (state.font && state.font !== CONFIG?.font) { CONFIG.font = state.font; saveConfig(); if (typeof applyFont === 'function') applyFont(state.font); }
    DB.unshift(p); persist(); loadEditor(p.id); refreshSide(); toast('Proposal created');
}

function fromTpl(key) { closeNewModal(); createProp(TPLS[key] || TPLS.blank); }

function fromSavedTpl(idx) {
    const saved = safeGetStorage('pk_templates', []);
    if (saved[idx]) { closeNewModal(); createProp(saved[idx]); }
}

function saveAsTemplate() {
    const p = cur(); if (!p) return;
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'saveTplModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    wrap.innerHTML = `<div class="modal modal-sm" onclick="event.stopPropagation()">
        <div class="modal-t">Save as template</div>
        <div class="modal-d">Save this proposal's structure as a reusable template</div>
        <div class="fg" style="margin-top:12px"><label class="fl">Template Name</label><input type="text" id="saveTplName" value="${esc(p.title)}" placeholder="e.g. Web Dev Starter"></div>
        <div class="modal-foot">
            <button class="btn-sm-outline" onclick="document.getElementById('saveTplModal').remove()">Cancel</button>
            <button class="btn-sm" onclick="doSaveAsTemplate()">Save Template</button>
        </div>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    document.getElementById('saveTplName').focus();
}

function doSaveAsTemplate() {
    const name = document.getElementById('saveTplName')?.value.trim();
    if (!name) { toast('Enter a template name', 'warning'); return; }
    // Check template limit before saving
    if (typeof enforceLimit === 'function' && !enforceLimit('templates')) {
        document.getElementById('saveTplModal')?.remove();
        return;
    }
    const p = cur(); if (!p) return;
    const tpl = {
        title: name, category: 'saved', icon: 'bookmark',
        sections: JSON.parse(JSON.stringify(p.sections || [])),
        lineItems: JSON.parse(JSON.stringify(p.lineItems || [])),
        paymentTerms: p.paymentTerms || '',
        savedAt: Date.now()
    };
    const saved = safeGetStorage('pk_templates', []);
    saved.push(tpl);
    safeLsSet('pk_templates', saved);
    document.getElementById('saveTplModal')?.remove();
    toast('Template saved');
}

function deleteSavedTpl(idx, e) {
    e.stopPropagation();
    confirmDialog('Delete this template?', () => {
        const saved = safeGetStorage('pk_templates', []);
        saved.splice(idx, 1);
        safeLsSet('pk_templates', saved);
        openNewModal();
        toast('Template deleted');
    }, { title: 'Delete Template', confirmText: 'Delete' });
}

// ════════════════════════════════════════
// VERSIONING
// ════════════════════════════════════════
function bumpVersion() {
    const p = cur(); if (!p) return;
    if (!p.versionHistory) p.versionHistory = [];
    const snapshot = JSON.parse(JSON.stringify(p));
    delete snapshot.versionHistory;
    p.versionHistory.push({
        version: p.version || 1,
        snapshot: snapshot,
        timestamp: Date.now(),
        user: CONFIG?.activeUserId || null
    });
    if (p.versionHistory.length > 20) p.versionHistory.shift();
    p.version = (p.version || 1) + 1;
    p.notes = p.notes || [];
    p.notes.push({ text: `Version bumped to v${p.version}`, time: Date.now(), type: 'system' });
    persist();
    loadEditor(CUR);
    toast('Version updated to v' + p.version);
}

// ════════════════════════════════════════
// COVER PAGE
// ════════════════════════════════════════
function toggleCover() {
    const p = cur(); if (!p) return;
    p.coverPage = !p.coverPage;
    persist();
    loadEditor(CUR);
}

// ════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════
function archiveProp(id) {
    const p = DB.find(x => x.id === id); if (!p) return;
    p.archived = true;
    p.notes = p.notes || [];
    p.notes.push({ text: 'Proposal archived', time: Date.now(), type: 'system' });
    persist();
    if (CUR === id) { CUR = null; renderDashboard(); }
    else renderDashboard();
    refreshSide();
    toast('Proposal archived');
}

function unarchiveProp(id) {
    const p = DB.find(x => x.id === id); if (!p) return;
    p.archived = false;
    p.notes = p.notes || [];
    p.notes.push({ text: 'Proposal unarchived', time: Date.now(), type: 'system' });
    persist();
    renderDashboard();
    refreshSide();
    toast('Proposal restored');
}

async function refreshSide() {
    const active = activeDB();
    document.getElementById('propCnt').textContent = active.length;
    const cntEl = document.getElementById('clientCnt');
    if (cntEl) cntEl.textContent = CLIENTS.length;
    // Update team name
    const brand = document.getElementById('sideBrand');
    if (brand) brand.textContent = typeof appName === 'function' ? appName() : 'ProposalKit';
    // Update logo
    const logo = document.getElementById('sideLogo');
    if (logo) {
        const an = typeof appName === 'function' ? appName() : 'ProposalKit';
        if (CONFIG.logo) {
            const img = document.createElement('img');
            img.src = CONFIG.logo;
            img.alt = '';
            logo.textContent = '';
            logo.appendChild(img);
        } else {
            logo.textContent = an.charAt(0).toUpperCase();
        }
    }
    // Update footer user info
    const userName = document.getElementById('sideUserName');
    const userEmail = document.getElementById('sideUserEmail');
    const userAvatar = document.getElementById('sideUserAvatar');
    if (userName) userName.textContent = CONFIG.name || 'User';
    if (userEmail) userEmail.textContent = CONFIG.email || 'Settings';
    if (userAvatar) userAvatar.textContent = (CONFIG.name || 'U').charAt(0).toUpperCase();
    // Add admin button if user is admin
    if (typeof isAdmin === 'function') {
        const isAdminUser = await isAdmin();
        const existingAdminBtn = document.querySelector('[data-nav="admin"]');
        const clientsBtn = document.querySelector('[data-nav="clients"]');
        if (isAdminUser && !existingAdminBtn && clientsBtn) {
            const adminBtn = document.createElement('button');
            adminBtn.className = 'side-btn';
            adminBtn.setAttribute('data-nav', 'admin');
            adminBtn.onclick = () => navigate('/admin');
            adminBtn.innerHTML = '<i data-lucide="shield-check"></i><span>Admin</span>';
            clientsBtn.parentNode.insertBefore(adminBtn, clientsBtn.nextSibling);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else if (!isAdminUser && existingAdminBtn) {
            existingAdminBtn.remove();
        }
    }
    // Rebuild recent list
    const list = document.getElementById('recentList');
    list.innerHTML = '';
    active.slice(0, 6).forEach(p => {
        const d = document.createElement('div');
        d.className = 'ri' + (p.id === CUR ? ' on' : '');
        const t = typeof calcTotals === 'function' ? calcTotals(p) : { grand: 0 };
        const val = t.grand > 0 ? fmtCur(t.grand, p.currency) : '';
        d.innerHTML = `<span class="ri-dot ${p.status}"></span><span class="ri-text">${esc(p.title || 'Untitled')}</span>${val ? `<span class="ri-meta">${val}</span>` : ''}`;
        d.onclick = () => loadEditor(p.id);
        d.oncontextmenu = (e) => showCtx(e, p.id);
        list.appendChild(d);
    });
}

// ════════════════════════════════════════
// CONTEXT MENU
// ════════════════════════════════════════
function showCtx(e, id) {
    e.preventDefault(); e.stopPropagation();
    ctxTarget = id;
    const p = DB.find(x => x.id === id);
    const ctx = document.getElementById('ctxMenu');
    if (!ctx) return;
    const archiveEl = document.getElementById('ctxArchive');
    const unarchiveEl = document.getElementById('ctxUnarchive');
    if (archiveEl) archiveEl.style.display = p?.archived ? 'none' : '';
    if (unarchiveEl) unarchiveEl.style.display = p?.archived ? '' : 'none';
    ctx.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
    ctx.style.top = Math.min(e.clientY, window.innerHeight - 160) + 'px';
    ctx.classList.add('show');
    const items = ctx.querySelectorAll('[role="menuitem"]');
    items.forEach(it => it.setAttribute('tabindex', '-1'));
    if (items[0]) items[0].focus();
    if (!ctx._kbNav) {
        ctx.addEventListener('keydown', _ctxKeyHandler);
        ctx._kbNav = true;
    }
    document.addEventListener('keydown', _ctxEscHandler);
    document.addEventListener('mousedown', _ctxOutsideHandler);
}

function _ctxKeyHandler(e) {
    const ctx = document.getElementById('ctxMenu');
    if (!ctx) return;
    const items = ctx.querySelectorAll('[role="menuitem"]:not([style*="display: none"])');
    const idx = [...items].indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.activeElement?.click(); }
    else if (e.key === 'Home') { e.preventDefault(); items[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); items[items.length - 1]?.focus(); }
}
function _ctxEscHandler(e) { if (e.key === 'Escape') hideCtx(); }
function _ctxOutsideHandler(e) { const m = document.getElementById('ctxMenu'); if (m && !m.contains(e.target)) hideCtx(); }

function hideCtx() {
    const m = document.getElementById('ctxMenu');
    if (m) m.classList.remove('show');
    document.removeEventListener('keydown', _ctxEscHandler);
    document.removeEventListener('mousedown', _ctxOutsideHandler);
}

function ctxAction(action) {
    hideCtx();
    if (action === 'open') loadEditor(ctxTarget);
    else if (action === 'dup') dupProp(ctxTarget);
    else if (action === 'dupClient') dupPropWithClient(ctxTarget);
    else if (action === 'export') { CUR = ctxTarget; doExport('proposal'); }
    else if (action === 'invoice') { CUR = ctxTarget; doExport('invoice'); }
    else if (action === 'status') {
        const ctx = document.getElementById('ctxMenu');
        const rect = ctx ? ctx.getBoundingClientRect() : { left: 200, top: 200 };
        if (typeof showStatusMenu === 'function') showStatusMenu({ clientX: rect.left, clientY: rect.top, stopPropagation: () => {} }, ctxTarget);
    }
    else if (action === 'sow') { if (typeof generateDerivative === 'function') { CUR = ctxTarget; generateDerivative('sow'); } }
    else if (action === 'contract') { if (typeof generateDerivative === 'function') { CUR = ctxTarget; generateDerivative('contract'); } }
    else if (action === 'receipt') { if (typeof generateDerivative === 'function') { CUR = ctxTarget; generateDerivative('receipt'); } }
    else if (action === 'archive') archiveProp(ctxTarget);
    else if (action === 'unarchive') unarchiveProp(ctxTarget);
    else if (action === 'del') delProp(ctxTarget);
}

