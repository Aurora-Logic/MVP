// ════════════════════════════════════════
// ADMIN-USERS — User Management
// ════════════════════════════════════════
/* exported renderAdminUsers */

var _auPage = 1, _auPerPage = 20, _auSearch = '', _auPlan = '', _auStatus = '', _auSort = 'newest', _auTimer = null;

function renderAdminUsers() {
    var el = document.getElementById('adminContent');
    if (!el) return;
    var c = _auCounts();
    var html = '<div class="admin-section">';
    html += '<div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">';
    html += _auStat('Total Users', c.total, '#3b82f6', '#eff6ff');
    html += _auStat('Active', c.active, '#16a34a', '#f0fdf4');
    html += _auStat('Suspended', c.suspended, '#ef4444', '#fef2f2');
    html += _auStat('Churned', c.churned, '#71717a', '#f4f4f5');
    html += '</div>';
    html += '<div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">';
    html += '<input type="text" id="auSearch" placeholder="Search users…" value="' + esc(_auSearch) + '" style="padding:7px 12px;border:1px solid var(--border);border-radius:9999px;font-size:13px;width:220px;outline:none">';
    html += _auSelect('auPlan', [['','All Plans'],['free','Free'],['pro','Pro'],['team','Team']], _auPlan);
    html += _auSelect('auStatus', [['','All Status'],['active','Active'],['suspended','Suspended'],['churned','Churned']], _auStatus);
    html += _auSelect('auSort', [['newest','Newest'],['oldest','Oldest'],['name','Name A-Z'],['active','Last Active']], _auSort);
    html += '<div style="flex:1"></div>';
    html += '<button class="btn-sm" onclick="showAddUserModal()"><i data-lucide="plus" style="width:14px;height:14px"></i> Add User</button>';
    html += '</div>';
    var filtered = _auFiltered();
    var totalP = Math.max(1, Math.ceil(filtered.length / _auPerPage));
    if (_auPage > totalP) _auPage = totalP;
    var start = (_auPage - 1) * _auPerPage;
    var page = filtered.slice(start, start + _auPerPage);
    html += '<div class="admin-table-wrap"><table class="admin-info-table"><thead><tr>';
    html += '<th style="width:36px"></th><th>Name</th><th>Email</th><th>Company</th><th>Plan</th><th>Proposals</th><th>Last Active</th><th style="width:100px">Actions</th>';
    html += '</tr></thead><tbody>';
    if (!page.length) html += '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text3)">No users found</td></tr>';
    for (var i = 0; i < page.length; i++) html += _auRow(page[i]);
    html += '</tbody></table></div>';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;font-size:13px;color:var(--text3)">';
    html += '<span>' + (filtered.length ? start + 1 : 0) + '–' + Math.min(start + _auPerPage, filtered.length) + ' of ' + filtered.length + '</span>';
    html += '<div style="display:flex;gap:6px">';
    html += '<button class="btn-sm-outline" onclick="_auGo(-1)"' + (_auPage <= 1 ? ' disabled' : '') + '>Prev</button>';
    html += '<span style="padding:4px 8px">' + _auPage + '/' + totalP + '</span>';
    html += '<button class="btn-sm-outline" onclick="_auGo(1)"' + (_auPage >= totalP ? ' disabled' : '') + '>Next</button>';
    html += '</div></div></div>';
    el.innerHTML = html;
    lucide.createIcons();
    var se = document.getElementById('auSearch');
    if (se) se.addEventListener('input', function() {
        clearTimeout(_auTimer);
        var v = se.value;
        _auTimer = setTimeout(function() { _auSearch = v; _auPage = 1; renderAdminUsers(); }, 200);
    });
    var pe = document.getElementById('auPlan');
    if (pe) pe.onchange = function() { _auPlan = pe.value; _auPage = 1; renderAdminUsers(); };
    var ste = document.getElementById('auStatus');
    if (ste) ste.onchange = function() { _auStatus = ste.value; _auPage = 1; renderAdminUsers(); };
    var so = document.getElementById('auSort');
    if (so) so.onchange = function() { _auSort = so.value; _auPage = 1; renderAdminUsers(); };
}

function _auStat(label, val, color, bg) {
    return '<div style="flex:1;min-width:140px;background:' + bg + ';border:1px solid var(--border);border-radius:10px;padding:16px 20px">' +
        '<div style="font-size:12px;color:var(--text3);margin-bottom:4px">' + esc(label) + '</div>' +
        '<div style="font-size:24px;font-weight:700;color:' + color + '">' + val + '</div></div>';
}

function _auCounts() {
    var t = 0, a = 0, s = 0, c = 0;
    for (var i = 0; i < A_USERS.length; i++) {
        t++;
        if (A_USERS[i].status === 'active') a++;
        else if (A_USERS[i].status === 'suspended') s++;
        else if (A_USERS[i].status === 'churned') c++;
    }
    return { total: t, active: a, suspended: s, churned: c };
}

function _auSelect(id, opts, cur) {
    var h = '<select id="' + id + '" style="padding:7px 12px;border:1px solid var(--border);border-radius:9999px;font-size:13px;outline:none">';
    for (var i = 0; i < opts.length; i++) h += '<option value="' + opts[i][0] + '"' + (cur === opts[i][0] ? ' selected' : '') + '>' + opts[i][1] + '</option>';
    return h + '</select>';
}

function _auFiltered() {
    var out = [], q = _auSearch.toLowerCase();
    for (var i = 0; i < A_USERS.length; i++) {
        var u = A_USERS[i];
        if (_auPlan && u.plan !== _auPlan) continue;
        if (_auStatus && u.status !== _auStatus) continue;
        if (q && ((u.name || '') + ' ' + (u.email || '') + ' ' + (u.company || '')).toLowerCase().indexOf(q) === -1) continue;
        out.push(u);
    }
    if (_auSort === 'newest') out.sort(function(a, b) { return (b.signupDate || 0) - (a.signupDate || 0); });
    else if (_auSort === 'oldest') out.sort(function(a, b) { return (a.signupDate || 0) - (b.signupDate || 0); });
    else if (_auSort === 'name') out.sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
    else if (_auSort === 'active') out.sort(function(a, b) { return (b.lastActive || 0) - (a.lastActive || 0); });
    return out;
}

function _auRow(u) {
    var sc = u.status === 'active' ? '#16a34a' : u.status === 'suspended' ? '#ef4444' : '#71717a';
    var pc = u.plan === 'pro' ? 'color:#16a34a;background:#f0fdf4' : u.plan === 'team' ? 'color:#2563eb;background:#eff6ff' : 'color:#71717a;background:#f4f4f5';
    return '<tr>' +
        '<td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + sc + '"></span></td>' +
        '<td style="font-weight:500">' + esc(u.name || '\u2014') + '</td>' +
        '<td>' + esc(u.email || '\u2014') + '</td>' +
        '<td>' + esc(u.company || '\u2014') + '</td>' +
        '<td><span style="' + pc + ';border-radius:9999px;padding:2px 10px;font-size:11px;font-weight:500">' + esc(u.plan || 'free') + '</span></td>' +
        '<td>' + (u.proposalsCount || 0) + '</td>' +
        '<td>' + (u.lastActive ? timeAgo(u.lastActive) : '\u2014') + '</td>' +
        '<td><div style="display:flex;gap:4px">' +
        '<button class="btn-sm-icon-ghost" onclick="viewUserProfile(\'' + esc(u.id) + '\')" title="View"><i data-lucide="eye" style="width:14px;height:14px"></i></button>' +
        '<button class="btn-sm-icon-ghost" onclick="showEditUserModal(\'' + esc(u.id) + '\')" title="Edit"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>' +
        '<button class="btn-sm-icon-ghost" onclick="toggleUserStatus(\'' + esc(u.id) + '\')" title="Toggle"><i data-lucide="' + (u.status === 'active' ? 'ban' : 'check-circle') + '" style="width:14px;height:14px"></i></button>' +
        '</div></td></tr>';
}

function _auGo(dir) { _auPage += dir; renderAdminUsers(); }

function _auFind(id) {
    for (var i = 0; i < A_USERS.length; i++) if (A_USERS[i].id === id) return A_USERS[i];
    return null;
}

function viewUserProfile(id) {
    var u = _auFind(id);
    if (!u) return adminToast('User not found', 'error');
    var d = function(l, v) {
        return '<div><div style="font-size:11px;color:var(--text4);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">' + esc(l) + '</div>' +
            '<div style="font-size:14px;font-weight:500">' + esc(String(v != null ? v : '\u2014')) + '</div></div>';
    };
    var body = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';
    body += d('Name', u.name) + d('Email', u.email) + d('Company', u.company) + d('Plan', u.plan || 'free');
    body += d('Status', u.status) + d('Signed Up', u.signupDate ? fmtDate(u.signupDate) : '\u2014');
    body += d('Last Active', u.lastActive ? timeAgo(u.lastActive) : '\u2014') + d('Proposals', u.proposalsCount || 0);
    body += d('Clients', u.clientsCount || 0) + d('Storage', fmtBytes(u.storageUsed || 0));
    body += d('Team Size', u.teamSize || 0) + d('AI Usage', u.aiUsage || 0);
    body += '</div>';
    if (u.notes) body += '<div style="margin-top:16px;padding:12px;background:var(--muted);border-radius:8px;font-size:13px"><strong>Notes</strong><br>' + esc(u.notes) + '</div>';
    adminModal(esc(u.name || 'User'), body, { width: '700px' });
}

function _auForm(u) {
    var fs = 'style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;margin-top:4px"';
    var ls = 'style="font-size:12px;font-weight:600;color:var(--text3);display:block;margin-bottom:12px"';
    var n = u ? esc(u.name || '') : '', e = u ? esc(u.email || '') : '', c = u ? esc(u.company || '') : '';
    var p = u ? (u.plan || 'free') : 'free', s = u ? (u.status || 'active') : 'active', nt = u ? esc(u.notes || '') : '';
    var h = '<label ' + ls + '>Name<input id="auFN" ' + fs + ' value="' + n + '"></label>';
    h += '<label ' + ls + '>Email<input id="auFE" type="email" ' + fs + ' value="' + e + '"></label>';
    h += '<label ' + ls + '>Company<input id="auFC" ' + fs + ' value="' + c + '"></label>';
    h += '<label ' + ls + '>Plan<select id="auFP" ' + fs + '><option value="free"' + (p === 'free' ? ' selected' : '') + '>Free</option><option value="pro"' + (p === 'pro' ? ' selected' : '') + '>Pro</option><option value="team"' + (p === 'team' ? ' selected' : '') + '>Team</option></select></label>';
    h += '<label ' + ls + '>Status<select id="auFS" ' + fs + '><option value="active"' + (s === 'active' ? ' selected' : '') + '>Active</option><option value="suspended"' + (s === 'suspended' ? ' selected' : '') + '>Suspended</option><option value="churned"' + (s === 'churned' ? ' selected' : '') + '>Churned</option></select></label>';
    h += '<label ' + ls + '>Notes<textarea id="auFNt" ' + fs + ' rows="3">' + nt + '</textarea></label>';
    return h;
}

function _auRead() {
    return { name: (document.getElementById('auFN') || {}).value || '', email: (document.getElementById('auFE') || {}).value || '',
        company: (document.getElementById('auFC') || {}).value || '', plan: (document.getElementById('auFP') || {}).value || 'free',
        status: (document.getElementById('auFS') || {}).value || 'active', notes: (document.getElementById('auFNt') || {}).value || '' };
}

function showEditUserModal(id) {
    var u = _auFind(id);
    if (!u) return adminToast('User not found', 'error');
    var body = _auForm(u) + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">' +
        '<button class="btn-sm" onclick="saveEditUser(\'' + esc(u.id) + '\')">Save</button></div>';
    adminModal('Edit User', body, { width: '500px' });
}

function saveEditUser(id) {
    var u = _auFind(id);
    if (!u) return;
    var f = _auRead();
    if (!f.name.trim() || !f.email.trim()) return adminToast('Name and email required', 'error');
    var oldPlan = u.plan || 'free';
    u.name = f.name.trim(); u.email = f.email.trim(); u.company = f.company.trim();
    u.plan = f.plan; u.status = f.status; u.notes = f.notes.trim();
    adminSave('pk_users', A_USERS);
    if (oldPlan !== f.plan) _auSyncSubscription(id, f.plan);
    adminToast('User updated'); renderAdminUsers();
}

function showAddUserModal() {
    var body = _auForm(null) + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">' +
        '<button class="btn-sm" onclick="submitAddUser()">Add User</button></div>';
    adminModal('Add User', body, { width: '500px' });
}

function submitAddUser() {
    var f = _auRead();
    if (!f.name.trim() || !f.email.trim()) return adminToast('Name and email required', 'error');
    var newId = uid();
    A_USERS.push({ id: newId, name: f.name.trim(), email: f.email.trim(), company: f.company.trim(),
        plan: f.plan, status: f.status, signupDate: Date.now(), lastActive: Date.now(),
        proposalsCount: 0, clientsCount: 0, storageUsed: 0, teamSize: 0, aiUsage: 0, notes: f.notes.trim() });
    adminSave('pk_users', A_USERS);
    _auSyncSubscription(newId, f.plan);
    adminToast('User added'); renderAdminUsers();
}

function _auSyncSubscription(userId, newPlan) {
    var PP = { free: 0, pro: 12, team: 29 };
    var found = false;
    for (var i = 0; i < A_SUBSCRIPTIONS.length; i++) {
        if (A_SUBSCRIPTIONS[i].userId === userId) {
            A_SUBSCRIPTIONS[i].plan = newPlan;
            A_SUBSCRIPTIONS[i].mrr = PP[newPlan] || 0;
            A_SUBSCRIPTIONS[i].status = newPlan === 'free' ? 'active' : A_SUBSCRIPTIONS[i].status;
            found = true; break;
        }
    }
    if (!found) {
        A_SUBSCRIPTIONS.push({ userId: userId, plan: newPlan, status: 'active',
            startDate: Date.now(), nextBilling: Date.now() + 30 * 86400000,
            cancelledAt: null, mrr: PP[newPlan] || 0 });
    }
    adminSave('pk_subscriptions', A_SUBSCRIPTIONS);
}

function toggleUserStatus(id) {
    var u = _auFind(id);
    if (!u) return;
    var next = u.status === 'active' ? 'suspended' : 'active';
    adminConfirm((next === 'suspended' ? 'Suspend' : 'Reactivate') + ' ' + esc(u.name || u.email) + '?', function() {
        u.status = next; adminSave('pk_users', A_USERS);
        adminToast('User ' + next); renderAdminUsers();
    }, { destructive: next === 'suspended' });
}
