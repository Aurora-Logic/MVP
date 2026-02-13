// ════════════════════════════════════════
// ADMIN-CLIENTS — Client Management + Merge
// ════════════════════════════════════════

/* exported renderAdminClients */

var _clientSearch = '', _clientSort = 'name', _clientPage = 1;
var _clientPerPage = 25, _clientOrphanOnly = false, _clientSelected = {};

function renderAdminClients() {
    var el = document.getElementById('adminContent');
    if (!el) return;
    _clientSelected = {};
    var filtered = getFilteredClients();
    var totalPages = Math.max(1, Math.ceil(filtered.length / _clientPerPage));
    if (_clientPage > totalPages) _clientPage = totalPages;
    var start = (_clientPage - 1) * _clientPerPage;
    var page = filtered.slice(start, start + _clientPerPage);

    el.innerHTML = '<div class="admin-section">' +
        '<div class="admin-section-head"><div class="admin-section-title">Clients (' + A_CLIENTS.length + ')</div>' +
        '<div style="display:flex;gap:8px">' +
        '<button class="btn-sm-outline" onclick="exportClientsJson()"><i data-lucide="download"></i> JSON</button>' +
        '<button class="btn-sm-outline" onclick="exportClientsCsv()"><i data-lucide="file-spreadsheet"></i> CSV</button></div></div>' +
        buildClientToolbar() +
        '<div id="clientBulkBar" style="display:none"></div>' +
        '<div class="admin-table-wrap">' + renderClientTable(page) + '</div>' +
        '<div class="admin-pagination">' +
        '<button class="btn-sm-outline" onclick="_clientPage=Math.max(1,_clientPage-1);renderAdminClients()"' + (_clientPage <= 1 ? ' disabled' : '') + '>Prev</button>' +
        '<span>Page ' + _clientPage + ' of ' + totalPages + ' (' + filtered.length + ' results)</span>' +
        '<button class="btn-sm-outline" onclick="_clientPage=Math.min(' + totalPages + ',_clientPage+1);renderAdminClients()"' + (_clientPage >= totalPages ? ' disabled' : '') + '>Next</button>' +
        '</div></div>';
    lucide.createIcons();
}

function buildClientToolbar() {
    return '<div class="admin-toolbar">' +
        '<div class="admin-search"><i data-lucide="search"></i>' +
        '<input placeholder="Search clients..." value="' + esc(_clientSearch) + '" oninput="_clientSearch=this.value;_clientPage=1;renderAdminClients()"></div>' +
        '<button class="' + (_clientOrphanOnly ? 'btn-sm' : 'btn-sm-outline') + '" onclick="_clientOrphanOnly=!_clientOrphanOnly;_clientPage=1;renderAdminClients()" style="font-size:12px">' +
        '<i data-lucide="alert-triangle"></i> Orphaned only</button>' +
        '<select onchange="_clientSort=this.value;_clientPage=1;renderAdminClients()" style="font-size:12px;padding:4px 10px;border-radius:9999px;border:1px solid var(--border);background:var(--background);color:var(--text)">' +
        '<option value="name"' + (_clientSort === 'name' ? ' selected' : '') + '>Name A-Z</option>' +
        '<option value="proposals"' + (_clientSort === 'proposals' ? ' selected' : '') + '>Most proposals</option>' +
        '<option value="email"' + (_clientSort === 'email' ? ' selected' : '') + '>Email A-Z</option>' +
        '</select></div>';
}

function getClientDisplayName(c) {
    return c.companyName || ((c.firstName || '') + ' ' + (c.lastName || '')).trim() || c.email || 'Unknown';
}

function getClientProposalCount(c) {
    var email = (c.email || '').toLowerCase();
    return A_DB.filter(function(p) {
        return p.client && (p.client.email || '').toLowerCase() === email;
    }).length;
}

function getFilteredClients() {
    var list = A_CLIENTS.slice();
    if (_clientOrphanOnly) {
        var orphans = findOrphanedClients();
        var orphanIds = new Set(orphans.map(function(c) { return c.id; }));
        list = list.filter(function(c) { return orphanIds.has(c.id); });
    }
    if (_clientSearch) {
        var q = _clientSearch.toLowerCase();
        list = list.filter(function(c) {
            return getClientDisplayName(c).toLowerCase().includes(q) ||
                   (c.email || '').toLowerCase().includes(q) ||
                   (c.phone || '').toLowerCase().includes(q);
        });
    }
    list.sort(function(a, b) {
        if (_clientSort === 'name') return getClientDisplayName(a).localeCompare(getClientDisplayName(b));
        if (_clientSort === 'proposals') return getClientProposalCount(b) - getClientProposalCount(a);
        if (_clientSort === 'email') return (a.email || '').localeCompare(b.email || '');
        return 0;
    });
    return list;
}

function renderClientTable(page) {
    var orphanIds = new Set(findOrphanedClients().map(function(c) { return c.id; }));
    var rows = page.map(function(c) {
        var propCount = getClientProposalCount(c);
        var isOrphan = orphanIds.has(c.id);
        return '<tr>' +
            '<td><input type="checkbox" onchange="toggleClientSelect(\'' + c.id + '\',this.checked)"></td>' +
            '<td style="font-weight:500">' + esc(getClientDisplayName(c)) + '</td>' +
            '<td style="font-size:12px">' + esc(c.companyName || '-') + '</td>' +
            '<td style="font-size:12px">' + esc(c.email || '-') + '</td>' +
            '<td style="font-size:12px">' + esc(c.phone || '-') + '</td>' +
            '<td style="font-size:12px">' + esc(c.country || '-') + '</td>' +
            '<td style="font-size:12px">' + propCount + '</td>' +
            '<td>' + (isOrphan ? '<span class="admin-badge admin-badge-orphan">Orphaned</span>' : '<span class="admin-badge admin-badge-active">Active</span>') + '</td>' +
            '<td style="white-space:nowrap"><div style="display:flex;gap:2px">' +
            '<button class="btn-sm-icon-ghost" onclick="viewClientJson(\'' + c.id + '\')" data-tooltip="View"><i data-lucide="eye"></i></button>' +
            '<button class="btn-sm-icon-ghost" onclick="editClientJson(\'' + c.id + '\')" data-tooltip="Edit"><i data-lucide="pencil"></i></button>' +
            '<button class="btn-sm-icon-ghost" onclick="deleteClient(\'' + c.id + '\')" data-tooltip="Delete" style="color:var(--red)"><i data-lucide="trash-2"></i></button>' +
            '</div></td></tr>';
    }).join('');

    return '<table class="admin-table"><thead><tr>' +
        '<th style="width:32px"><input type="checkbox" onchange="toggleAllClients(this.checked)"></th>' +
        '<th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Country</th><th>Proposals</th><th>Status</th><th>Actions</th>' +
        '</tr></thead><tbody>' + (rows || '<tr><td colspan="9" style="text-align:center;color:var(--text4);padding:24px">No clients found</td></tr>') +
        '</tbody></table>';
}

function toggleClientSelect(id, checked) {
    if (checked) _clientSelected[id] = true; else delete _clientSelected[id];
    updateClientBulkBar();
}
function toggleAllClients(checked) {
    var filtered = getFilteredClients();
    var start = (_clientPage - 1) * _clientPerPage;
    filtered.slice(start, start + _clientPerPage).forEach(function(c) {
        if (checked) _clientSelected[c.id] = true; else delete _clientSelected[c.id];
    });
    updateClientBulkBar();
    renderAdminClients();
}
function updateClientBulkBar() {
    var count = Object.keys(_clientSelected).length;
    var bar = document.getElementById('clientBulkBar');
    if (!bar) return;
    if (count === 0) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex'; bar.className = 'admin-bulk-bar';
    bar.innerHTML = '<span>' + count + ' selected</span>' +
        (count === 2 ? '<button class="btn-sm-outline" onclick="startMerge()"><i data-lucide="merge"></i> Merge</button>' : '') +
        '<button class="btn-sm-destructive" onclick="bulkDeleteClients()"><i data-lucide="trash-2"></i> Delete</button>';
    lucide.createIcons();
}

function viewClientJson(id) {
    var c = A_CLIENTS.find(function(x) { return x.id === id; });
    if (!c) return;
    adminModal('Client JSON', '<pre class="admin-json">' + esc(JSON.stringify(c, null, 2)) + '</pre>');
}

function editClientJson(id) {
    var c = A_CLIENTS.find(function(x) { return x.id === id; });
    if (!c) return;
    var modalId = adminModal('Edit Client JSON',
        '<textarea class="admin-json-editor" id="clientJsonEditor">' + esc(JSON.stringify(c, null, 2)) + '</textarea>' +
        '<div id="clientJsonErrors" style="margin-top:8px;font-size:12px"></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">' +
        '<button class="btn-outline" onclick="closeAdminModal(\'' + modalId + '\')">Cancel</button>' +
        '<button class="btn" onclick="saveClientJson(\'' + id + '\',\'' + modalId + '\')">Save</button></div>');
}

function saveClientJson(id, modalId) {
    var ed = document.getElementById('clientJsonEditor');
    if (!ed) return;
    try {
        var obj = JSON.parse(ed.value);
        obj.id = id;
        var idx = A_CLIENTS.findIndex(function(x) { return x.id === id; });
        if (idx < 0) { adminToast('Client not found', 'error'); return; }
        A_CLIENTS[idx] = obj;
        if (adminSave('pk_clients', A_CLIENTS)) {
            closeAdminModal(modalId);
            adminToast('Client updated');
            auditLog('edit_json', id, 'Edited client: ' + getClientDisplayName(obj));
            renderAdminClients();
        }
    } catch (e) { adminToast('Invalid JSON', 'error'); }
}

function deleteClient(id) {
    var c = A_CLIENTS.find(function(x) { return x.id === id; });
    if (!c) return;
    var count = getClientProposalCount(c);
    var warn = count > 0 ? ' This client has ' + count + ' proposal(s)!' : '';
    adminConfirm('Delete "' + getClientDisplayName(c) + '"?' + warn, function() {
        A_CLIENTS = A_CLIENTS.filter(function(x) { return x.id !== id; });
        adminSave('pk_clients', A_CLIENTS);
        adminToast('Client deleted');
        auditLog('delete_client', id, 'Deleted: ' + getClientDisplayName(c));
        renderAdminClients();
    }, { title: 'Delete client', confirmText: 'Delete', destructive: true });
}

function startMerge() {
    var ids = Object.keys(_clientSelected);
    if (ids.length !== 2) { adminToast('Select exactly 2 clients to merge', 'error'); return; }
    var a = A_CLIENTS.find(function(x) { return x.id === ids[0]; });
    var b = A_CLIENTS.find(function(x) { return x.id === ids[1]; });
    if (!a || !b) return;
    adminModal('Merge Clients',
        '<p style="font-size:13px;color:var(--text3);margin-bottom:16px">Keep which client? The other will be merged into it and deleted. All proposals will be updated.</p>' +
        '<div style="display:flex;gap:12px">' +
        '<button class="btn-outline" style="flex:1;padding:16px;text-align:left" onclick="mergeClients(\'' + a.id + '\',\'' + b.id + '\')">' +
        '<strong>' + esc(getClientDisplayName(a)) + '</strong><br><span style="font-size:12px;color:var(--text4)">' + esc(a.email || '') + '</span></button>' +
        '<button class="btn-outline" style="flex:1;padding:16px;text-align:left" onclick="mergeClients(\'' + b.id + '\',\'' + a.id + '\')">' +
        '<strong>' + esc(getClientDisplayName(b)) + '</strong><br><span style="font-size:12px;color:var(--text4)">' + esc(b.email || '') + '</span></button>' +
        '</div>', { width: '500px' });
}

function mergeClients(keepId, removeId) {
    var keep = A_CLIENTS.find(function(x) { return x.id === keepId; });
    var remove = A_CLIENTS.find(function(x) { return x.id === removeId; });
    if (!keep || !remove) return;
    var removeEmail = (remove.email || '').toLowerCase();
    A_DB.forEach(function(p) {
        if (p.client && (p.client.email || '').toLowerCase() === removeEmail) {
            p.client.email = keep.email || p.client.email;
            p.client.name = keep.companyName || getClientDisplayName(keep);
        }
    });
    adminSave('pk_db', A_DB);
    A_CLIENTS = A_CLIENTS.filter(function(x) { return x.id !== removeId; });
    adminSave('pk_clients', A_CLIENTS);
    document.querySelectorAll('.modal-wrap').forEach(function(m) { m.remove(); });
    _clientSelected = {};
    adminToast('Clients merged');
    auditLog('merge_clients', keepId, 'Merged ' + getClientDisplayName(remove) + ' into ' + getClientDisplayName(keep));
    renderAdminClients();
}

function bulkDeleteClients() {
    var ids = Object.keys(_clientSelected);
    if (!ids.length) return;
    adminConfirm('Delete ' + ids.length + ' client(s)?', function() {
        var set = new Set(ids);
        A_CLIENTS = A_CLIENTS.filter(function(c) { return !set.has(c.id); });
        adminSave('pk_clients', A_CLIENTS);
        _clientSelected = {};
        adminToast(ids.length + ' clients deleted');
        auditLog('bulk_delete', 'clients', ids.length + ' deleted');
        renderAdminClients();
    }, { title: 'Bulk delete', confirmText: 'Delete All', destructive: true });
}

function exportClientsJson() {
    downloadBlob(JSON.stringify(A_CLIENTS, null, 2), 'pk-clients.json', 'application/json');
    adminToast('Clients exported as JSON');
}

function exportClientsCsv() {
    var header = 'Name,Company,Email,Phone,Country,Proposals';
    var rows = A_CLIENTS.map(function(c) {
        return [getClientDisplayName(c), c.companyName || '', c.email || '', c.phone || '', c.country || '', getClientProposalCount(c)]
            .map(function(v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',');
    });
    downloadBlob(header + '\n' + rows.join('\n'), 'pk-clients.csv', 'text/csv');
    adminToast('Clients exported as CSV');
}
