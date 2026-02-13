// ════════════════════════════════════════
// ADMIN-SUBSCRIPTIONS — Plan Management
// ════════════════════════════════════════
/* exported renderAdminSubscriptions */

var _asPage = 1, _asPerPage = 20;
var PLAN_PRICES = { free: 0, pro: 12, team: 29 };

function renderAdminSubscriptions() {
    var el = document.getElementById('adminContent');
    if (!el) return;
    var mrr = _asComputeMRR();
    var dist = _asDistribution();
    var churn = _asChurnRate();
    var activeSubs = A_SUBSCRIPTIONS.filter(function(s) { return s.status === 'active'; }).length;
    var trials = A_SUBSCRIPTIONS.filter(function(s) { return s.status === 'trialing'; }).length;
    var html = '<div class="admin-section">';
    html += '<div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">';
    html += _asStat('Total MRR', fmtCur(mrr, '$'), '#16a34a', '#f0fdf4');
    html += _asStat('Active', activeSubs, '#3b82f6', '#eff6ff');
    html += _asStat('Trialing', trials, '#f59e0b', '#fffbeb');
    html += _asStat('Churn Rate', churn.toFixed(1) + '%', churn > 5 ? '#ef4444' : '#71717a', churn > 5 ? '#fef2f2' : '#f4f4f5');
    html += '</div>';
    // Plan distribution bar
    var total = Math.max(1, dist.free + dist.pro + dist.team);
    html += '<div class="admin-section" style="margin-bottom:24px">';
    html += '<div style="font-size:13px;font-weight:600;margin-bottom:8px">Plan Distribution</div>';
    html += '<div style="display:flex;height:24px;border-radius:9999px;overflow:hidden;background:var(--muted)">';
    if (dist.free) html += '<div style="width:' + (dist.free / total * 100) + '%;background:#a1a1aa;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:600">' + dist.free + ' Free</div>';
    if (dist.pro) html += '<div style="width:' + (dist.pro / total * 100) + '%;background:#16a34a;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:600">' + dist.pro + ' Pro</div>';
    if (dist.team) html += '<div style="width:' + (dist.team / total * 100) + '%;background:#2563eb;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:600">' + dist.team + ' Team</div>';
    html += '</div></div>';
    // Table
    var subs = A_SUBSCRIPTIONS.slice().sort(function(a, b) { return (b.startDate || 0) - (a.startDate || 0); });
    var totalP = Math.max(1, Math.ceil(subs.length / _asPerPage));
    if (_asPage > totalP) _asPage = totalP;
    var start = (_asPage - 1) * _asPerPage;
    var page = subs.slice(start, start + _asPerPage);
    html += '<div style="display:flex;justify-content:flex-end;margin-bottom:12px">';
    html += '<button class="btn-sm" onclick="showAddSubscriptionModal()"><i data-lucide="plus" style="width:14px;height:14px"></i> Add Subscription</button></div>';
    html += '<div class="admin-table-wrap"><table class="admin-info-table"><thead><tr>';
    html += '<th>User</th><th>Plan</th><th>Status</th><th>Start Date</th><th>Next Billing</th><th>MRR</th><th style="width:120px">Actions</th>';
    html += '</tr></thead><tbody>';
    if (!page.length) html += '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text3)">No subscriptions</td></tr>';
    for (var i = 0; i < page.length; i++) html += _asRow(page[i]);
    html += '</tbody></table></div>';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;font-size:13px;color:var(--text3)">';
    html += '<span>' + (subs.length ? start + 1 : 0) + '–' + Math.min(start + _asPerPage, subs.length) + ' of ' + subs.length + '</span>';
    html += '<div style="display:flex;gap:6px"><button class="btn-sm-outline" onclick="_asGo(-1)"' + (_asPage <= 1 ? ' disabled' : '') + '>Prev</button>';
    html += '<span style="padding:4px 8px">' + _asPage + '/' + totalP + '</span>';
    html += '<button class="btn-sm-outline" onclick="_asGo(1)"' + (_asPage >= totalP ? ' disabled' : '') + '>Next</button></div></div></div>';
    el.innerHTML = html;
    lucide.createIcons();
}

function _asStat(label, val, color, bg) {
    return '<div style="flex:1;min-width:140px;background:' + bg + ';border:1px solid var(--border);border-radius:10px;padding:16px 20px">' +
        '<div style="font-size:12px;color:var(--text3);margin-bottom:4px">' + esc(label) + '</div>' +
        '<div style="font-size:24px;font-weight:700;color:' + color + '">' + esc(String(val)) + '</div></div>';
}

function _asComputeMRR() {
    var mrr = 0;
    for (var i = 0; i < A_SUBSCRIPTIONS.length; i++) {
        var s = A_SUBSCRIPTIONS[i];
        if (s.status === 'active' || s.status === 'trialing') mrr += (PLAN_PRICES[s.plan] || 0);
    }
    return mrr;
}

function _asDistribution() {
    var d = { free: 0, pro: 0, team: 0 };
    for (var i = 0; i < A_SUBSCRIPTIONS.length; i++) {
        var p = A_SUBSCRIPTIONS[i].plan;
        if (d[p] != null) d[p]++;
    }
    return d;
}

function _asChurnRate() {
    if (!A_SUBSCRIPTIONS.length) return 0;
    var thirtyAgo = Date.now() - 30 * 86400000;
    var cancelled = A_SUBSCRIPTIONS.filter(function(s) { return s.status === 'cancelled' && s.cancelledAt && s.cancelledAt > thirtyAgo; }).length;
    return (cancelled / A_SUBSCRIPTIONS.length) * 100;
}

function _asRow(s) {
    var user = _asUserName(s.userId);
    var pc = s.plan === 'pro' ? 'color:#16a34a;background:#f0fdf4' : s.plan === 'team' ? 'color:#2563eb;background:#eff6ff' : 'color:#71717a;background:#f4f4f5';
    var stc = s.status === 'active' ? 'color:#16a34a;background:#f0fdf4' : s.status === 'trialing' ? 'color:#3b82f6;background:#eff6ff' : s.status === 'past_due' ? 'color:#ef4444;background:#fef2f2' : 'color:#71717a;background:#f4f4f5';
    var badge = 'border-radius:9999px;padding:2px 10px;font-size:11px;font-weight:500';
    return '<tr>' +
        '<td style="font-weight:500">' + esc(user) + '</td>' +
        '<td><span style="' + pc + ';' + badge + '">' + esc(s.plan) + '</span></td>' +
        '<td><span style="' + stc + ';' + badge + '">' + esc(s.status) + '</span></td>' +
        '<td>' + (s.startDate ? fmtDate(s.startDate) : '\u2014') + '</td>' +
        '<td>' + (s.nextBilling ? fmtDate(s.nextBilling) : '\u2014') + '</td>' +
        '<td>' + fmtCur(PLAN_PRICES[s.plan] || 0, '$') + '</td>' +
        '<td><div style="display:flex;gap:4px">' +
        '<button class="btn-sm-icon-ghost" onclick="showChangePlanModal(\'' + esc(s.userId) + '\')" title="Change Plan"><i data-lucide="arrow-right-left" style="width:14px;height:14px"></i></button>' +
        (s.status !== 'cancelled' ? '<button class="btn-sm-icon-ghost" onclick="cancelSubscription(\'' + esc(s.userId) + '\')" title="Cancel"><i data-lucide="x-circle" style="width:14px;height:14px"></i></button>' : '') +
        '</div></td></tr>';
}

function _asUserName(userId) {
    for (var i = 0; i < A_USERS.length; i++) if (A_USERS[i].id === userId) return A_USERS[i].name || A_USERS[i].email || userId;
    return userId || '\u2014';
}

function _asGo(dir) { _asPage += dir; renderAdminSubscriptions(); }

function showChangePlanModal(userId) {
    var sub = null;
    for (var i = 0; i < A_SUBSCRIPTIONS.length; i++) if (A_SUBSCRIPTIONS[i].userId === userId) { sub = A_SUBSCRIPTIONS[i]; break; }
    if (!sub) return adminToast('Subscription not found', 'error');
    var cur = sub.plan || 'free';
    var body = '<div style="margin-bottom:16px"><strong>Current plan:</strong> ' + esc(cur) + ' (' + fmtCur(PLAN_PRICES[cur] || 0, '$') + '/mo)</div>';
    body += '<div style="display:flex;flex-direction:column;gap:8px">';
    var plans = ['free', 'pro', 'team'];
    for (var j = 0; j < plans.length; j++) {
        var p = plans[j];
        body += '<label style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;cursor:pointer' + (p === cur ? ';background:var(--muted)' : '') + '">';
        body += '<input type="radio" name="newPlan" value="' + p + '"' + (p === cur ? ' checked' : '') + '>';
        body += '<span style="font-weight:500">' + p.charAt(0).toUpperCase() + p.slice(1) + '</span>';
        body += '<span style="color:var(--text3);font-size:12px;margin-left:auto">' + fmtCur(PLAN_PRICES[p], '$') + '/mo</span>';
        body += '</label>';
    }
    body += '</div>';
    body += '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">';
    body += '<button class="btn-sm" onclick="changePlan(\'' + esc(userId) + '\')">Update Plan</button></div>';
    adminModal('Change Plan', body, { width: '400px' });
}

function changePlan(userId) {
    var sel = document.querySelector('input[name="newPlan"]:checked');
    if (!sel) return;
    var newPlan = sel.value;
    for (var i = 0; i < A_SUBSCRIPTIONS.length; i++) {
        if (A_SUBSCRIPTIONS[i].userId === userId) {
            A_SUBSCRIPTIONS[i].plan = newPlan;
            A_SUBSCRIPTIONS[i].mrr = PLAN_PRICES[newPlan] || 0;
            break;
        }
    }
    adminSave('pk_subscriptions', A_SUBSCRIPTIONS);
    _asSyncUser(userId, newPlan);
    adminToast('Plan updated to ' + newPlan);
    renderAdminSubscriptions();
}

function _asSyncUser(userId, newPlan) {
    for (var i = 0; i < A_USERS.length; i++) {
        if (A_USERS[i].id === userId) { A_USERS[i].plan = newPlan; break; }
    }
    adminSave('pk_users', A_USERS);
}

function showAddSubscriptionModal() {
    var userOpts = '';
    var existingIds = new Set(A_SUBSCRIPTIONS.map(function(s) { return s.userId; }));
    A_USERS.forEach(function(u) {
        if (!existingIds.has(u.id)) userOpts += '<option value="' + esc(u.id) + '">' + esc(u.name || u.email) + '</option>';
    });
    if (!userOpts) return adminToast('All users already have subscriptions', 'info');
    var body = '<label style="font-size:12px;font-weight:600;color:var(--text3);display:block;margin-bottom:12px">User' +
        '<select id="asUser" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;margin-top:4px">' + userOpts + '</select></label>';
    body += '<label style="font-size:12px;font-weight:600;color:var(--text3);display:block;margin-bottom:12px">Plan' +
        '<select id="asPlan" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;margin-top:4px">' +
        '<option value="free">Free ($0/mo)</option><option value="pro">Pro ($12/mo)</option><option value="team">Team ($29/mo)</option></select></label>';
    body += '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">' +
        '<button class="btn-sm" onclick="submitAddSubscription()">Create</button></div>';
    adminModal('Add Subscription', body, { width: '400px' });
}

function submitAddSubscription() {
    var uSel = document.getElementById('asUser');
    var pSel = document.getElementById('asPlan');
    if (!uSel || !pSel) return;
    var userId = uSel.value, plan = pSel.value;
    A_SUBSCRIPTIONS.push({ userId: userId, plan: plan, status: 'active',
        startDate: Date.now(), nextBilling: Date.now() + 30 * 86400000,
        cancelledAt: null, mrr: PLAN_PRICES[plan] || 0 });
    adminSave('pk_subscriptions', A_SUBSCRIPTIONS);
    _asSyncUser(userId, plan);
    adminToast('Subscription created');
    renderAdminSubscriptions();
}

function cancelSubscription(userId) {
    adminConfirm('Cancel this subscription? The user will be moved to the free plan.', function() {
        for (var i = 0; i < A_SUBSCRIPTIONS.length; i++) {
            if (A_SUBSCRIPTIONS[i].userId === userId) {
                A_SUBSCRIPTIONS[i].status = 'cancelled';
                A_SUBSCRIPTIONS[i].cancelledAt = Date.now();
                A_SUBSCRIPTIONS[i].plan = 'free';
                A_SUBSCRIPTIONS[i].mrr = 0;
                break;
            }
        }
        adminSave('pk_subscriptions', A_SUBSCRIPTIONS);
        _asSyncUser(userId, 'free');
        adminToast('Subscription cancelled');
        renderAdminSubscriptions();
    }, { destructive: true });
}
