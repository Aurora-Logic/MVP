// ════════════════════════════════════════
// ADMIN-ANALYTICS-VIEW — Analytics Dashboard
// ════════════════════════════════════════
/* exported renderAdminAnalyticsView */

var _aaRange = 30;

function renderAdminAnalyticsView() {
    var el = document.getElementById('adminContent');
    if (!el) return;
    var events = A_ANALYTICS || [];
    var cutoff = Date.now() - _aaRange * 86400000;
    var ranged = events.filter(function(e) { return e.ts && e.ts > cutoff; });
    var dau = _aaDAU(ranged, _aaRange);
    var mau = _aaMAU(events);
    var uniq = _aaUniqueUsers(ranged);
    var html = '<div class="admin-section">';
    // Range buttons
    html += '<div style="display:flex;gap:8px;margin-bottom:20px">';
    var ranges = [7, 30, 90];
    for (var r = 0; r < ranges.length; r++) {
        var d = ranges[r];
        html += '<button class="' + (_aaRange === d ? 'btn-sm' : 'btn-sm-outline') + '" onclick="setAnalyticsRange(' + d + ')">' + d + ' days</button>';
    }
    html += '</div>';
    // Stats
    html += '<div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">';
    html += _aaStat('Total Events', ranged.length, '#3b82f6', '#eff6ff');
    html += _aaStat('Avg DAU', dau.toFixed(1), '#16a34a', '#f0fdf4');
    html += _aaStat('MAU', mau, '#f59e0b', '#fffbeb');
    html += _aaStat('Unique Users', uniq, '#71717a', '#f4f4f5');
    html += '</div>';
    // Daily chart
    var daily = _aaDailyData(events, _aaRange);
    html += '<div style="margin-bottom:24px"><div style="font-size:13px;font-weight:600;margin-bottom:12px">Daily Activity</div>';
    html += _aaDailyChart(daily);
    html += '</div>';
    // Feature usage
    var features = _aaTopFeatures(ranged);
    html += '<div style="margin-bottom:24px"><div style="font-size:13px;font-weight:600;margin-bottom:12px">Feature Usage</div>';
    html += _aaFeatureBars(features);
    html += '</div>';
    // Top users
    var topU = _aaTopUsers(ranged, 10);
    html += '<div style="margin-bottom:24px"><div style="font-size:13px;font-weight:600;margin-bottom:12px">Top Users</div>';
    html += _aaTopUsersTable(topU);
    html += '</div>';
    // Recent events
    html += '<div><div style="font-size:13px;font-weight:600;margin-bottom:12px">Recent Events</div>';
    html += _aaRecentEvents(events, 50);
    html += '</div></div>';
    el.innerHTML = html;
    lucide.createIcons();
}

function _aaStat(label, val, color, bg) {
    return '<div style="flex:1;min-width:130px;background:' + bg + ';border:1px solid var(--border);border-radius:10px;padding:16px 20px">' +
        '<div style="font-size:12px;color:var(--text3);margin-bottom:4px">' + esc(label) + '</div>' +
        '<div style="font-size:24px;font-weight:700;color:' + color + '">' + esc(String(val)) + '</div></div>';
}

function _aaDAU(events, days) {
    if (!events.length || !days) return 0;
    var byDay = {};
    for (var i = 0; i < events.length; i++) {
        var d = new Date(events[i].ts).toISOString().split('T')[0];
        if (!byDay[d]) byDay[d] = {};
        if (events[i].userId) byDay[d][events[i].userId] = true;
    }
    var total = 0;
    var keys = Object.keys(byDay);
    for (var j = 0; j < keys.length; j++) total += Object.keys(byDay[keys[j]]).length;
    return keys.length ? total / keys.length : 0;
}

function _aaMAU(events) {
    var cutoff = Date.now() - 30 * 86400000;
    var users = {};
    for (var i = 0; i < events.length; i++) {
        if (events[i].ts > cutoff && events[i].userId) users[events[i].userId] = true;
    }
    return Object.keys(users).length;
}

function _aaUniqueUsers(events) {
    var u = {};
    for (var i = 0; i < events.length; i++) if (events[i].userId) u[events[i].userId] = true;
    return Object.keys(u).length;
}

function _aaDailyData(events, days) {
    var result = [];
    var now = new Date();
    for (var d = days - 1; d >= 0; d--) {
        var dt = new Date(now); dt.setDate(dt.getDate() - d);
        var key = dt.toISOString().split('T')[0];
        result.push({ date: key, count: 0 });
    }
    var map = {};
    for (var i = 0; i < result.length; i++) map[result[i].date] = result[i];
    for (var j = 0; j < events.length; j++) {
        var dk = new Date(events[j].ts).toISOString().split('T')[0];
        if (map[dk]) map[dk].count++;
    }
    return result;
}

function _aaDailyChart(data) {
    var max = 1;
    for (var i = 0; i < data.length; i++) if (data[i].count > max) max = data[i].count;
    var html = '<div style="display:flex;align-items:flex-end;gap:2px;height:120px;padding:8px 0;border-bottom:1px solid var(--border)">';
    for (var j = 0; j < data.length; j++) {
        var pct = Math.max(2, (data[j].count / max) * 100);
        var label = data[j].date.slice(5);
        html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px" title="' + esc(data[j].date) + ': ' + data[j].count + '">';
        html += '<div style="width:100%;max-width:16px;height:' + pct + '%;background:#3b82f6;border-radius:2px 2px 0 0;min-height:2px"></div>';
        if (data.length <= 14) html += '<div style="font-size:9px;color:var(--text4);white-space:nowrap">' + label + '</div>';
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function _aaTopFeatures(events) {
    var counts = {};
    for (var i = 0; i < events.length; i++) {
        var name = events[i].event || 'unknown';
        counts[name] = (counts[name] || 0) + 1;
    }
    var arr = [];
    var keys = Object.keys(counts);
    for (var j = 0; j < keys.length; j++) arr.push({ name: keys[j], count: counts[keys[j]] });
    arr.sort(function(a, b) { return b.count - a.count; });
    return arr.slice(0, 10);
}

function _aaFeatureBars(features) {
    if (!features.length) return '<div style="color:var(--text3);font-size:13px">No data</div>';
    var max = features[0].count || 1;
    var html = '<div style="display:flex;flex-direction:column;gap:6px">';
    for (var i = 0; i < features.length; i++) {
        var pct = Math.round((features[i].count / max) * 100);
        html += '<div style="display:flex;align-items:center;gap:8px">';
        html += '<div style="width:140px;font-size:12px;color:var(--foreground);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(features[i].name) + '</div>';
        html += '<div style="flex:1;height:18px;background:var(--muted);border-radius:9999px;overflow:hidden">';
        html += '<div style="width:' + pct + '%;height:100%;background:#3b82f6;border-radius:9999px"></div></div>';
        html += '<div style="width:50px;text-align:right;font-size:12px;color:var(--text3)">' + features[i].count + '</div>';
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function _aaTopUsers(events, limit) {
    var counts = {};
    for (var i = 0; i < events.length; i++) {
        var uid = events[i].userId;
        if (uid) counts[uid] = (counts[uid] || 0) + 1;
    }
    var arr = [];
    var keys = Object.keys(counts);
    for (var j = 0; j < keys.length; j++) arr.push({ userId: keys[j], count: counts[keys[j]] });
    arr.sort(function(a, b) { return b.count - a.count; });
    return arr.slice(0, limit);
}

function _aaTopUsersTable(users) {
    if (!users.length) return '<div style="color:var(--text3);font-size:13px">No data</div>';
    var html = '<div class="admin-table-wrap"><table class="admin-info-table"><thead><tr><th>User</th><th>Events</th></tr></thead><tbody>';
    for (var i = 0; i < users.length; i++) {
        var name = users[i].userId;
        for (var j = 0; j < A_USERS.length; j++) {
            if (A_USERS[j].id === users[i].userId) { name = A_USERS[j].name || A_USERS[j].email || users[i].userId; break; }
        }
        html += '<tr><td>' + esc(name) + '</td><td>' + users[i].count + '</td></tr>';
    }
    html += '</tbody></table></div>';
    return html;
}

function _aaRecentEvents(events, limit) {
    var sorted = events.slice().sort(function(a, b) { return (b.ts || 0) - (a.ts || 0); }).slice(0, limit);
    if (!sorted.length) return '<div style="color:var(--text3);font-size:13px">No events</div>';
    var html = '<div style="max-height:300px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">';
    for (var i = 0; i < sorted.length; i++) {
        var e = sorted[i];
        html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);font-size:12px">';
        html += '<span style="font-weight:500;min-width:140px">' + esc(e.event || '') + '</span>';
        html += '<span style="color:var(--text3);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(JSON.stringify(e.meta || {})) + '</span>';
        html += '<span style="color:var(--text4);white-space:nowrap">' + (e.ts ? timeAgo(e.ts) : '') + '</span>';
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function setAnalyticsRange(days) {
    _aaRange = days;
    renderAdminAnalyticsView();
}
