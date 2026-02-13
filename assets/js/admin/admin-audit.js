// ════════════════════════════════════════
// ADMIN-AUDIT — Audit Trail Logger & Viewer
// ════════════════════════════════════════

/* exported auditLog, getAuditEntries, renderAdminAudit */

var AUDIT_KEY = 'pk_admin_audit';
var MAX_AUDIT_ENTRIES = 500;
var _auditPage = 1;
var _auditPerPage = 50;
var _auditSearch = '';
var _auditFilter = 'all';

function auditLog(action, target, details, extra) {
    var log = safeGet(AUDIT_KEY, []);
    var user = activeAdminUser();
    var entry = {
        id: uid(),
        ts: Date.now(),
        user: user ? (user.name || user.email || 'admin') : 'system',
        action: action,
        target: target || '',
        details: details || ''
    };
    if (extra) {
        if (extra.before !== undefined) entry.before = extra.before;
        if (extra.after !== undefined) entry.after = extra.after;
    }
    log.push(entry);
    while (log.length > MAX_AUDIT_ENTRIES) log.shift();
    safePut(AUDIT_KEY, log);
}

function getAuditEntries() {
    return safeGet(AUDIT_KEY, []);
}

function filterAudit(entries) {
    var list = entries.slice().reverse();
    if (_auditFilter !== 'all') {
        list = list.filter(function(e) { return e.action === _auditFilter; });
    }
    if (_auditSearch) {
        var q = _auditSearch.toLowerCase();
        list = list.filter(function(e) {
            return (e.action || '').toLowerCase().includes(q) ||
                   (e.target || '').toLowerCase().includes(q) ||
                   (e.details || '').toLowerCase().includes(q) ||
                   (e.user || '').toLowerCase().includes(q);
        });
    }
    return list;
}

function actionBadgeClass(action) {
    if (action.includes('delete') || action.includes('reset') || action.includes('clear')) return 'admin-badge-declined';
    if (action.includes('edit') || action.includes('toggle') || action.includes('merge')) return 'admin-badge-sent';
    if (action.includes('create') || action.includes('import') || action.includes('login')) return 'admin-badge-accepted';
    return 'admin-badge-draft';
}

function renderAdminAudit() {
    var el = document.getElementById('adminContent');
    if (!el) return;
    var entries = getAuditEntries();
    var filtered = filterAudit(entries);
    var totalPages = Math.max(1, Math.ceil(filtered.length / _auditPerPage));
    if (_auditPage > totalPages) _auditPage = totalPages;
    var start = (_auditPage - 1) * _auditPerPage;
    var page = filtered.slice(start, start + _auditPerPage);

    var actions = {};
    entries.forEach(function(e) { actions[e.action] = true; });
    var actionOpts = '<option value="all">All actions</option>' +
        Object.keys(actions).sort().map(function(a) {
            return '<option value="' + esc(a) + '"' + (a === _auditFilter ? ' selected' : '') + '>' + esc(a) + '</option>';
        }).join('');

    var rows = page.map(function(e) {
        var d = new Date(e.ts);
        var time = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
                   d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return '<tr>' +
            '<td style="font-size:12px;color:var(--text4);white-space:nowrap">' + time + '</td>' +
            '<td style="font-size:12px">' + esc(e.user) + '</td>' +
            '<td><span class="admin-badge ' + actionBadgeClass(e.action) + '">' + esc(e.action) + '</span></td>' +
            '<td style="font-size:12px;max-width:120px">' + esc(e.target) + '</td>' +
            '<td style="font-size:12px;color:var(--text3);max-width:250px">' + esc(e.details) + '</td>' +
            '</tr>';
    }).join('');

    el.innerHTML = '<div class="admin-section">' +
        '<div class="admin-section-head">' +
        '<div class="admin-section-title">Audit log (' + entries.length + ' entries)</div>' +
        '<div style="display:flex;gap:8px">' +
        '<button class="btn-sm-outline" onclick="exportAuditLog()"><i data-lucide="download"></i> Export</button>' +
        '<button class="btn-sm-destructive" onclick="clearAuditLog()"><i data-lucide="trash-2"></i> Clear</button>' +
        '</div></div>' +
        '<div class="admin-toolbar">' +
        '<div class="admin-search"><i data-lucide="search"></i>' +
        '<input placeholder="Search audit log..." value="' + esc(_auditSearch) + '" oninput="_auditSearch=this.value;_auditPage=1;renderAdminAudit()"></div>' +
        '<select class="btn-sm-outline" onchange="_auditFilter=this.value;_auditPage=1;renderAdminAudit()" style="font-size:12px;padding:4px 10px;border-radius:9999px;border:1px solid var(--border);background:var(--background);color:var(--text)">' + actionOpts + '</select>' +
        '</div>' +
        '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
        '<th>Time</th><th>User</th><th>Action</th><th>Target</th><th>Details</th>' +
        '</tr></thead><tbody>' + (rows || '<tr><td colspan="5" style="text-align:center;color:var(--text4);padding:24px">No audit entries</td></tr>') +
        '</tbody></table></div>' +
        '<div class="admin-pagination">' +
        '<button class="btn-sm-outline" onclick="_auditPage=Math.max(1,_auditPage-1);renderAdminAudit()"' + (_auditPage <= 1 ? ' disabled' : '') + '>Prev</button>' +
        '<span>Page ' + _auditPage + ' of ' + totalPages + '</span>' +
        '<button class="btn-sm-outline" onclick="_auditPage=Math.min(' + totalPages + ',_auditPage+1);renderAdminAudit()"' + (_auditPage >= totalPages ? ' disabled' : '') + '>Next</button>' +
        '</div></div>';
    lucide.createIcons();
}

function exportAuditLog() {
    var entries = getAuditEntries();
    var data = JSON.stringify(entries, null, 2);
    downloadBlob(data, 'pk-audit-' + new Date().toISOString().split('T')[0] + '.json', 'application/json');
    adminToast('Audit log exported');
}

function clearAuditLog() {
    adminConfirm('Clear all audit log entries? This cannot be undone.', function() {
        safePut(AUDIT_KEY, []);
        adminToast('Audit log cleared');
        renderAdminAudit();
    }, { title: 'Clear audit log', confirmText: 'Clear', destructive: true });
}
