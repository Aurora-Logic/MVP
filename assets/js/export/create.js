// ════════════════════════════════════════
// CREATE / DUPLICATE / DELETE + SIDEBAR + CONTEXT MENU + SHARING
// ════════════════════════════════════════

/* exported doDupWithClient, fromTpl, fromSavedTpl, saveAsTemplate, doSaveAsTemplate, deleteSavedTpl, bumpVersion, toggleCover, ctxAction */
function createProp(tpl) {
    const id = uid();
    const existingNumbers = DB.map(p => {
        const match = (p.number || '').match(/PROP-(\d+)/);
        return match ? parseInt(match[1]) : 0;
    });
    const nextNum = existingNumbers.length ? Math.max(...existingNumbers) + 1 : 1;
    const num = 'PROP-' + String(nextNum).padStart(3, '0');
    const today = new Date().toISOString().split('T')[0];
    const valid = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const p = {
        id, status: 'draft', title: tpl.title || 'Untitled', number: num, date: today, validUntil: valid,
        sender: { company: CONFIG?.company || '', email: CONFIG?.email || '', address: CONFIG?.address || '' },
        client: { name: '', contact: '', email: '', phone: '' },
        sections: JSON.parse(JSON.stringify(tpl.sections || [])),
        lineItems: JSON.parse(JSON.stringify(tpl.lineItems || [])),
        currency: defaultCurrency(), paymentTerms: tpl.paymentTerms || '', version: 1, coverPage: false,
        packagesEnabled: false, packages: null, packageFeatures: [],
        addOns: [], paymentSchedule: [], paymentScheduleMode: 'percentage', payments: [],
        notes: [{ text: 'Proposal created', time: Date.now(), type: 'system' }],
        createdAt: Date.now(),
        owner: CONFIG?.activeUserId || null
    };
    DB.unshift(p); persist();
    loadEditor(id);
    toast('Proposal created');
}

function dupProp(id) {
    const src = DB.find(p => p.id === id); if (!src) return;
    const dup = JSON.parse(JSON.stringify(src));
    dup.id = uid();
    dup.title = src.title + ' (Copy)';
    const existingNums = DB.map(p => { const m = (p.number||'').match(/PROP-(\d+)/); return m ? parseInt(m[1]) : 0; });
    dup.number = 'PROP-' + String((existingNums.length ? Math.max(...existingNums) : 0) + 1).padStart(3, '0');
    dup.status = 'draft';
    dup.createdAt = Date.now();
    dup.notes = [{ text: 'Duplicated from ' + src.number, time: Date.now(), type: 'system' }];
    DB.unshift(dup); persist();
    loadEditor(dup.id);
    toast('Proposal duplicated');
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
    wrap.innerHTML = `<div class="modal modal-sm" onclick="event.stopPropagation()"><div class="modal-t">Duplicate for Client</div><div class="modal-d">Select a client for the duplicated proposal</div><div style="max-height:250px;overflow-y:auto;display:flex;flex-direction:column;gap:3px">${items}</div><div class="modal-foot"><button class="btn-sm-outline" onclick="document.getElementById('dupClientModal').remove()">Cancel</button></div></div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
}

function doDupWithClient(id, clientIdx) {
    document.getElementById('dupClientModal')?.remove();
    const src = DB.find(p => p.id === id); if (!src) return;
    const dup = JSON.parse(JSON.stringify(src));
    dup.id = uid();
    dup.title = src.title + ' (Copy)';
    const existingNums = DB.map(p => { const m = (p.number||'').match(/PROP-(\d+)/); return m ? parseInt(m[1]) : 0; });
    dup.number = 'PROP-' + String((existingNums.length ? Math.max(...existingNums) : 0) + 1).padStart(3, '0');
    dup.status = 'draft';
    dup.createdAt = Date.now();
    if (clientIdx >= 0 && CLIENTS[clientIdx]) {
        const c = CLIENTS[clientIdx];
        dup.client = { name: c.name || '', contact: c.contact || '', email: c.email || '', phone: c.phone || '' };
        dup.notes = [{ text: 'Duplicated from ' + src.number + ' for ' + c.name, time: Date.now(), type: 'system' }];
    } else {
        dup.notes = [{ text: 'Duplicated from ' + src.number, time: Date.now(), type: 'system' }];
    }
    DB.unshift(dup); persist();
    loadEditor(dup.id);
    toast('Proposal duplicated');
}

function delProp(id) {
    confirmDialog('Delete this proposal? This cannot be undone.', () => {
        DB = DB.filter(p => p.id !== id); persist();
        if (CUR === id) CUR = null;
        renderDashboard();
        refreshSide();
        toast('Proposal deleted');
    }, { title: 'Delete Proposal', confirmText: 'Delete' });
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
        <div class="modal-t">Save as Template</div>
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

function refreshSide() {
    const active = activeDB();
    document.getElementById('propCnt').textContent = active.length;
    const cntEl = document.getElementById('clientCnt');
    if (cntEl) cntEl.textContent = CLIENTS.length;
    const brand = document.querySelector('.side-brand');
    if (brand) brand.textContent = typeof appName === 'function' ? appName() : 'ProposalKit';
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
}

function hideCtx() { const m = document.getElementById('ctxMenu'); if (m) m.classList.remove('show'); }

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

