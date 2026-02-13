// ════════════════════════════════════════
// ADMIN-PROPOSALS — Proposal CRUD + Table
// ════════════════════════════════════════

/* exported renderAdminProposals */

var _propSearch = '', _propFilter = 'all', _propSort = 'date-desc', _propPage = 1;
var _propPerPage = 25, _propSelected = {};

function renderAdminProposals() {
    var el = document.getElementById('adminContent');
    if (!el) return;
    _propSelected = {};
    var filtered = getFilteredProposals();
    var totalPages = Math.max(1, Math.ceil(filtered.length / _propPerPage));
    if (_propPage > totalPages) _propPage = totalPages;
    var start = (_propPage - 1) * _propPerPage;
    var page = filtered.slice(start, start + _propPerPage);

    el.innerHTML = '<div class="admin-section">' +
        '<div class="admin-section-head"><div class="admin-section-title">Proposals (' + A_DB.length + ')</div>' +
        '<div style="display:flex;gap:8px">' +
        '<button class="btn-sm-outline" onclick="exportAllProps()"><i data-lucide="download"></i> Export All</button></div></div>' +
        buildProposalToolbar() +
        '<div id="propBulkBar" style="display:none"></div>' +
        '<div class="admin-table-wrap">' + renderProposalTable(page) + '</div>' +
        '<div class="admin-pagination">' +
        '<button class="btn-sm-outline" onclick="_propPage=Math.max(1,_propPage-1);renderAdminProposals()"' + (_propPage <= 1 ? ' disabled' : '') + '>Prev</button>' +
        '<span>Page ' + _propPage + ' of ' + totalPages + ' (' + filtered.length + ' results)</span>' +
        '<button class="btn-sm-outline" onclick="_propPage=Math.min(' + totalPages + ',_propPage+1);renderAdminProposals()"' + (_propPage >= totalPages ? ' disabled' : '') + '>Next</button>' +
        '</div></div>';
    lucide.createIcons();
}

function buildProposalToolbar() {
    return '<div class="admin-toolbar">' +
        '<div class="admin-search"><i data-lucide="search"></i>' +
        '<input placeholder="Search proposals..." value="' + esc(_propSearch) + '" oninput="_propSearch=this.value;_propPage=1;renderAdminProposals()"></div>' +
        '<select onchange="_propFilter=this.value;_propPage=1;renderAdminProposals()" style="font-size:12px;padding:4px 10px;border-radius:9999px;border:1px solid var(--border);background:var(--background);color:var(--text)">' +
        '<option value="all"' + (_propFilter === 'all' ? ' selected' : '') + '>All statuses</option>' +
        '<option value="draft"' + (_propFilter === 'draft' ? ' selected' : '') + '>Draft</option>' +
        '<option value="sent"' + (_propFilter === 'sent' ? ' selected' : '') + '>Sent</option>' +
        '<option value="accepted"' + (_propFilter === 'accepted' ? ' selected' : '') + '>Accepted</option>' +
        '<option value="declined"' + (_propFilter === 'declined' ? ' selected' : '') + '>Declined</option>' +
        '<option value="expired"' + (_propFilter === 'expired' ? ' selected' : '') + '>Expired</option>' +
        '<option value="archived"' + (_propFilter === 'archived' ? ' selected' : '') + '>Archived</option>' +
        '</select>' +
        '<select onchange="_propSort=this.value;_propPage=1;renderAdminProposals()" style="font-size:12px;padding:4px 10px;border-radius:9999px;border:1px solid var(--border);background:var(--background);color:var(--text)">' +
        '<option value="date-desc"' + (_propSort === 'date-desc' ? ' selected' : '') + '>Newest first</option>' +
        '<option value="date-asc"' + (_propSort === 'date-asc' ? ' selected' : '') + '>Oldest first</option>' +
        '<option value="value-desc"' + (_propSort === 'value-desc' ? ' selected' : '') + '>Highest value</option>' +
        '<option value="value-asc"' + (_propSort === 'value-asc' ? ' selected' : '') + '>Lowest value</option>' +
        '<option value="title"' + (_propSort === 'title' ? ' selected' : '') + '>Title A-Z</option>' +
        '</select></div>';
}

function getFilteredProposals() {
    var list = A_DB.slice();
    if (_propFilter === 'archived') list = list.filter(function(p) { return p.archived; });
    else if (_propFilter !== 'all') list = list.filter(function(p) { return !p.archived && p.status === _propFilter; });
    else list = list.filter(function(p) { return !p.archived; });
    if (_propSearch) {
        var q = _propSearch.toLowerCase();
        list = list.filter(function(p) {
            return (p.title || '').toLowerCase().includes(q) ||
                   (p.number || '').toLowerCase().includes(q) ||
                   (p.client && p.client.name || '').toLowerCase().includes(q) ||
                   (p.client && p.client.email || '').toLowerCase().includes(q);
        });
    }
    list.sort(function(a, b) {
        if (_propSort === 'date-desc') return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
        if (_propSort === 'date-asc') return (a.updatedAt || a.createdAt || 0) - (b.updatedAt || b.createdAt || 0);
        if (_propSort === 'value-desc') return proposalValue(b) - proposalValue(a);
        if (_propSort === 'value-asc') return proposalValue(a) - proposalValue(b);
        if (_propSort === 'title') return (a.title || '').localeCompare(b.title || '');
        return 0;
    });
    return list;
}

function renderProposalTable(page) {
    var rows = page.map(function(p) {
        var c = p.client || {};
        var v = proposalValue(p);
        var cur = p.currency || A_CONFIG.currency || '\u20B9';
        return '<tr>' +
            '<td><input type="checkbox" onchange="togglePropSelect(\'' + p.id + '\',this.checked)"></td>' +
            '<td style="font-size:12px;color:var(--text4)">' + esc(p.number || '-') + '</td>' +
            '<td style="font-weight:500;max-width:180px">' + esc(p.title || 'Untitled') + '</td>' +
            '<td style="font-size:12px">' + esc(c.name || c.companyName || '-') + '</td>' +
            '<td style="font-family:var(--mono);font-size:12px">' + fmtCur(v, cur) + '</td>' +
            '<td><span class="admin-badge admin-badge-' + (p.status || 'draft') + '">' + esc(p.status || 'draft') + '</span></td>' +
            '<td style="font-size:12px;color:var(--text4)">' + (p.createdAt ? timeAgo(p.createdAt) : '-') + '</td>' +
            '<td style="font-size:12px;color:var(--text4)">' + (p.updatedAt ? timeAgo(p.updatedAt) : '-') + '</td>' +
            '<td style="white-space:nowrap"><div style="display:flex;gap:2px">' +
            '<button class="btn-sm-icon-ghost" onclick="viewPropJson(\'' + p.id + '\')" data-tooltip="View JSON"><i data-lucide="eye"></i></button>' +
            '<button class="btn-sm-icon-ghost" onclick="editPropJson(\'' + p.id + '\')" data-tooltip="Edit JSON"><i data-lucide="pencil"></i></button>' +
            '<button class="btn-sm-icon-ghost" onclick="forceStatus(\'' + p.id + '\')" data-tooltip="Change status"><i data-lucide="refresh-cw"></i></button>' +
            '<button class="btn-sm-icon-ghost" onclick="deleteProp(\'' + p.id + '\')" data-tooltip="Delete" style="color:var(--red)"><i data-lucide="trash-2"></i></button>' +
            '</div></td></tr>';
    }).join('');

    return '<table class="admin-table"><thead><tr>' +
        '<th style="width:32px"><input type="checkbox" onchange="toggleAllProps(this.checked)"></th>' +
        '<th>#</th><th>Title</th><th>Client</th><th>Value</th><th>Status</th><th>Created</th><th>Updated</th><th>Actions</th>' +
        '</tr></thead><tbody>' + (rows || '<tr><td colspan="9" style="text-align:center;color:var(--text4);padding:24px">No proposals found</td></tr>') +
        '</tbody></table>';
}

function togglePropSelect(id, checked) {
    if (checked) _propSelected[id] = true; else delete _propSelected[id];
    updatePropBulkBar();
}
function toggleAllProps(checked) {
    var filtered = getFilteredProposals();
    var start = (_propPage - 1) * _propPerPage;
    filtered.slice(start, start + _propPerPage).forEach(function(p) {
        if (checked) _propSelected[p.id] = true; else delete _propSelected[p.id];
    });
    updatePropBulkBar();
    renderAdminProposals();
}
function updatePropBulkBar() {
    var count = Object.keys(_propSelected).length;
    var bar = document.getElementById('propBulkBar');
    if (!bar) return;
    if (count === 0) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    bar.className = 'admin-bulk-bar';
    bar.innerHTML = '<span>' + count + ' selected</span>' +
        '<button class="btn-sm-outline" onclick="bulkExportProps()"><i data-lucide="download"></i> Export</button>' +
        '<button class="btn-sm-destructive" onclick="bulkDeleteProps()"><i data-lucide="trash-2"></i> Delete</button>';
    lucide.createIcons();
}

function viewPropJson(id) {
    var p = A_DB.find(function(x) { return x.id === id; });
    if (!p) return;
    adminModal('Proposal JSON — ' + (p.title || id), '<pre class="admin-json">' + esc(JSON.stringify(p, null, 2)) + '</pre>', { width: '700px' });
    auditLog('view_json', id, 'Viewed proposal: ' + (p.title || id));
}

function editPropJson(id) {
    var p = A_DB.find(function(x) { return x.id === id; });
    if (!p) return;
    var modalId = adminModal('Edit Proposal JSON — ' + (p.title || id),
        '<textarea class="admin-json-editor" id="propJsonEditor" oninput="validatePropJsonEditor()">' + esc(JSON.stringify(p, null, 2)) + '</textarea>' +
        '<div id="propJsonErrors" style="margin-top:8px;font-size:12px"></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">' +
        '<button class="btn-outline" onclick="closeAdminModal(\'' + modalId + '\')">Cancel</button>' +
        '<button class="btn" id="propJsonSaveBtn" onclick="savePropJson(\'' + id + '\',\'' + modalId + '\')">Save</button></div>',
        { width: '700px' });
}

function validatePropJsonEditor() {
    var ed = document.getElementById('propJsonEditor');
    var errEl = document.getElementById('propJsonErrors');
    var saveBtn = document.getElementById('propJsonSaveBtn');
    if (!ed) return;
    try {
        var obj = JSON.parse(ed.value);
        ed.classList.remove('invalid');
        var errors = validateProposalFields(obj);
        if (errors.length) {
            errEl.innerHTML = errors.map(function(e) { return '<div style="color:var(--amber)">\u26A0 ' + esc(e) + '</div>'; }).join('');
        } else { errEl.innerHTML = '<div style="color:var(--green)">\u2713 Valid JSON</div>'; }
        if (saveBtn) saveBtn.disabled = false;
    } catch (e) {
        ed.classList.add('invalid');
        errEl.innerHTML = '<div style="color:var(--red)">\u2717 ' + esc(e.message) + '</div>';
        if (saveBtn) saveBtn.disabled = true;
    }
}

function validateProposalFields(obj) {
    var errors = [];
    if (!obj.id || typeof obj.id !== 'string') errors.push('Missing or invalid "id"');
    if (!obj.title) errors.push('Missing "title"');
    if (obj.status && ['draft', 'sent', 'accepted', 'declined', 'expired'].indexOf(obj.status) < 0)
        errors.push('Invalid status "' + obj.status + '"');
    if (obj.lineItems && !Array.isArray(obj.lineItems)) errors.push('"lineItems" must be array');
    if (obj.discount != null && (isNaN(obj.discount) || obj.discount < 0)) errors.push('Discount must be non-negative');
    if (obj.taxRate != null && (isNaN(obj.taxRate) || obj.taxRate < 0 || obj.taxRate > 100)) errors.push('Tax rate must be 0-100');
    return errors;
}

function savePropJson(id, modalId) {
    var ed = document.getElementById('propJsonEditor');
    if (!ed) return;
    try {
        var obj = JSON.parse(ed.value);
        obj.id = id; // Prevent ID change
        var idx = A_DB.findIndex(function(x) { return x.id === id; });
        if (idx < 0) { adminToast('Proposal not found', 'error'); return; }
        A_DB[idx] = obj;
        if (adminSave('pk_db', A_DB)) {
            closeAdminModal(modalId);
            adminToast('Proposal updated');
            auditLog('edit_json', id, 'Edited proposal: ' + (obj.title || id));
            renderAdminProposals();
        }
    } catch (e) { adminToast('Invalid JSON', 'error'); }
}

function deleteProp(id) {
    var p = A_DB.find(function(x) { return x.id === id; });
    if (!p) return;
    var warn = p.status === 'accepted' ? ' This is an ACCEPTED proposal!' : '';
    adminConfirm('Delete "' + (p.title || 'Untitled') + '"?' + warn, function() {
        A_DB = A_DB.filter(function(x) { return x.id !== id; });
        adminSave('pk_db', A_DB);
        adminToast('Proposal deleted');
        auditLog('delete_proposal', id, 'Deleted: ' + (p.title || id));
        renderAdminProposals();
    }, { title: 'Delete proposal', confirmText: 'Delete', destructive: true });
}

function forceStatus(id) {
    var p = A_DB.find(function(x) { return x.id === id; });
    if (!p) return;
    var statuses = ['draft', 'sent', 'accepted', 'declined', 'expired'];
    var opts = statuses.map(function(s) {
        return '<button class="btn-sm-outline admin-badge-' + s + '" style="margin:4px" onclick="applyForceStatus(\'' + id + '\',\'' + s + '\')">' + s + '</button>';
    }).join('');
    adminModal('Change status — ' + (p.title || id),
        '<p style="font-size:13px;color:var(--text3);margin-bottom:12px">Current: <strong>' + (p.status || 'draft') + '</strong></p>' + opts,
        { width: '400px' });
}

function applyForceStatus(id, status) {
    var p = A_DB.find(function(x) { return x.id === id; });
    if (!p) return;
    var old = p.status;
    p.status = status;
    adminSave('pk_db', A_DB);
    document.querySelectorAll('.modal-wrap').forEach(function(m) { m.remove(); });
    adminToast('Status changed to ' + status);
    auditLog('force_status', id, old + ' \u2192 ' + status);
    renderAdminProposals();
}

function bulkDeleteProps() {
    var ids = Object.keys(_propSelected);
    if (!ids.length) return;
    adminConfirm('Delete ' + ids.length + ' proposal(s)? This cannot be undone.', function() {
        var set = new Set(ids);
        A_DB = A_DB.filter(function(p) { return !set.has(p.id); });
        adminSave('pk_db', A_DB);
        _propSelected = {};
        adminToast(ids.length + ' proposals deleted');
        auditLog('bulk_delete', 'proposals', ids.length + ' deleted');
        renderAdminProposals();
    }, { title: 'Bulk delete', confirmText: 'Delete All', destructive: true });
}

function bulkExportProps() {
    var ids = Object.keys(_propSelected);
    var items = A_DB.filter(function(p) { return ids.indexOf(p.id) >= 0; });
    downloadBlob(JSON.stringify(items, null, 2), 'pk-proposals-export.json', 'application/json');
    adminToast(items.length + ' proposals exported');
}

function exportAllProps() {
    downloadBlob(JSON.stringify(A_DB, null, 2), 'pk-all-proposals.json', 'application/json');
    adminToast('All proposals exported');
    auditLog('bulk_export', 'proposals', A_DB.length + ' exported');
}
