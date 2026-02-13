// ════════════════════════════════════════
// ADMIN-FEEDBACK — Feedback & NPS
// ════════════════════════════════════════
/* exported renderAdminFeedback */

var _afPage = 1, _afPerPage = 10, _afType = '', _afStatus = '', _afSentiment = '';

function renderAdminFeedback() {
    var el = document.getElementById('adminContent');
    if (!el) return;
    var nps = _afNPS();
    var newCount = A_FEEDBACK.filter(function(f) { return f.status === 'new'; }).length;
    var pos = 0, neu = 0, neg = 0;
    for (var i = 0; i < A_FEEDBACK.length; i++) {
        var s = A_FEEDBACK[i].sentiment;
        if (s === 'positive') pos++;
        else if (s === 'negative') neg++;
        else neu++;
    }
    var html = '<div class="admin-section">';
    html += '<div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">';
    var npsColor = nps >= 50 ? '#16a34a' : nps >= 0 ? '#f59e0b' : '#ef4444';
    html += _afStat('NPS Score', nps !== null ? nps : '\u2014', npsColor, nps >= 50 ? '#f0fdf4' : nps >= 0 ? '#fffbeb' : '#fef2f2');
    html += _afStat('Total Feedback', A_FEEDBACK.length, '#3b82f6', '#eff6ff');
    html += _afStat('New', newCount, '#f59e0b', '#fffbeb');
    html += '</div>';
    // Sentiment bar
    var sentTotal = Math.max(1, pos + neu + neg);
    html += '<div style="margin-bottom:20px"><div style="font-size:12px;color:var(--text3);margin-bottom:6px">Sentiment</div>';
    html += '<div style="display:flex;height:20px;border-radius:9999px;overflow:hidden;background:var(--muted)">';
    if (pos) html += '<div style="width:' + (pos / sentTotal * 100) + '%;background:#16a34a;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:600">' + pos + '</div>';
    if (neu) html += '<div style="width:' + (neu / sentTotal * 100) + '%;background:#a1a1aa;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:600">' + neu + '</div>';
    if (neg) html += '<div style="width:' + (neg / sentTotal * 100) + '%;background:#ef4444;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:600">' + neg + '</div>';
    html += '</div></div>';
    // Filters
    html += '<div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">';
    html += _afSel('afTy', [['','All Types'],['bug','Bug'],['feature','Feature'],['praise','Praise'],['complaint','Complaint']], _afType);
    html += _afSel('afSt', [['','All Status'],['new','New'],['reviewed','Reviewed'],['actioned','Actioned']], _afStatus);
    html += _afSel('afSe', [['','All Sentiment'],['positive','Positive'],['neutral','Neutral'],['negative','Negative']], _afSentiment);
    html += '<div style="flex:1"></div>';
    html += '<button class="btn-sm-outline" onclick="exportFeedback()"><i data-lucide="download" style="width:14px;height:14px"></i> Export CSV</button>';
    html += '</div>';
    // Cards
    var filtered = _afFiltered();
    var totalP = Math.max(1, Math.ceil(filtered.length / _afPerPage));
    if (_afPage > totalP) _afPage = totalP;
    var start = (_afPage - 1) * _afPerPage;
    var page = filtered.slice(start, start + _afPerPage);
    if (!page.length) html += '<div style="text-align:center;padding:32px;color:var(--text3)">No feedback found</div>';
    for (var j = 0; j < page.length; j++) html += _afCard(page[j]);
    // Pagination
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;font-size:13px;color:var(--text3)">';
    html += '<span>' + (filtered.length ? start + 1 : 0) + '–' + Math.min(start + _afPerPage, filtered.length) + ' of ' + filtered.length + '</span>';
    html += '<div style="display:flex;gap:6px"><button class="btn-sm-outline" onclick="_afGo(-1)"' + (_afPage <= 1 ? ' disabled' : '') + '>Prev</button>';
    html += '<span style="padding:4px 8px">' + _afPage + '/' + totalP + '</span>';
    html += '<button class="btn-sm-outline" onclick="_afGo(1)"' + (_afPage >= totalP ? ' disabled' : '') + '>Next</button></div></div></div>';
    el.innerHTML = html;
    lucide.createIcons();
    var tyEl = document.getElementById('afTy');
    if (tyEl) tyEl.onchange = function() { _afType = tyEl.value; _afPage = 1; renderAdminFeedback(); };
    var stEl = document.getElementById('afSt');
    if (stEl) stEl.onchange = function() { _afStatus = stEl.value; _afPage = 1; renderAdminFeedback(); };
    var seEl = document.getElementById('afSe');
    if (seEl) seEl.onchange = function() { _afSentiment = seEl.value; _afPage = 1; renderAdminFeedback(); };
}

function _afStat(label, val, color, bg) {
    return '<div style="flex:1;min-width:140px;background:' + bg + ';border:1px solid var(--border);border-radius:10px;padding:16px 20px">' +
        '<div style="font-size:12px;color:var(--text3);margin-bottom:4px">' + esc(label) + '</div>' +
        '<div style="font-size:24px;font-weight:700;color:' + color + '">' + esc(String(val)) + '</div></div>';
}

function _afSel(id, opts, cur) {
    var h = '<select id="' + id + '" style="padding:7px 12px;border:1px solid var(--border);border-radius:9999px;font-size:13px;outline:none">';
    for (var i = 0; i < opts.length; i++) h += '<option value="' + opts[i][0] + '"' + (cur === opts[i][0] ? ' selected' : '') + '>' + opts[i][1] + '</option>';
    return h + '</select>';
}

function _afNPS() {
    var scored = A_FEEDBACK.filter(function(f) { return f.npsScore != null; });
    if (!scored.length) return null;
    var promoters = 0, detractors = 0;
    for (var i = 0; i < scored.length; i++) {
        if (scored[i].npsScore >= 9) promoters++;
        else if (scored[i].npsScore <= 6) detractors++;
    }
    return Math.round(((promoters - detractors) / scored.length) * 100);
}

function _afFiltered() {
    var out = [];
    for (var i = 0; i < A_FEEDBACK.length; i++) {
        var f = A_FEEDBACK[i];
        if (_afType && f.type !== _afType) continue;
        if (_afStatus && f.status !== _afStatus) continue;
        if (_afSentiment && f.sentiment !== _afSentiment) continue;
        out.push(f);
    }
    out.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    return out;
}

function _afCard(f) {
    var typeIcons = { bug: 'bug', feature: 'lightbulb', praise: 'heart', complaint: 'frown' };
    var sentColors = { positive: 'color:#16a34a;background:#f0fdf4', neutral: 'color:#71717a;background:#f4f4f5', negative: 'color:#ef4444;background:#fef2f2' };
    var stColors = { 'new': 'color:#3b82f6;background:#eff6ff', reviewed: 'color:#f59e0b;background:#fffbeb', actioned: 'color:#16a34a;background:#f0fdf4' };
    var badge = 'border-radius:9999px;padding:2px 10px;font-size:11px;font-weight:500';
    var html = '<div style="border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:12px">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
    html += '<i data-lucide="' + (typeIcons[f.type] || 'message-circle') + '" style="width:16px;height:16px;color:var(--text3)"></i>';
    html += '<span style="font-weight:500;font-size:13px">' + esc(f.userEmail || f.userId || 'Anonymous') + '</span>';
    if (f.npsScore != null) {
        var nc = f.npsScore >= 9 ? '#16a34a' : f.npsScore >= 7 ? '#f59e0b' : '#ef4444';
        html += '<span style="background:' + nc + ';color:#fff;' + badge + '">NPS ' + f.npsScore + '</span>';
    }
    html += '<span style="' + (sentColors[f.sentiment] || sentColors.neutral) + ';' + badge + '">' + esc(f.sentiment || 'neutral') + '</span>';
    html += '<span style="' + (stColors[f.status] || stColors['new']) + ';' + badge + '">' + esc(f.status || 'new') + '</span>';
    html += '<span style="font-size:11px;color:var(--text4);margin-left:auto">' + (f.createdAt ? timeAgo(f.createdAt) : '') + '</span>';
    html += '</div>';
    html += '<div style="font-size:13px;color:var(--foreground);margin-bottom:12px">' + esc(f.text || '') + '</div>';
    html += '<div style="display:flex;gap:8px;align-items:flex-end">';
    html += '<textarea id="afR_' + esc(f.id) + '" rows="2" placeholder="Admin response\u2026" style="flex:1;font-size:12px;padding:8px;border:1px solid var(--border);border-radius:8px;resize:none">' + esc(f.adminResponse || '') + '</textarea>';
    html += '<div style="display:flex;flex-direction:column;gap:4px">';
    html += '<button class="btn-sm" onclick="respondToFeedback(\'' + esc(f.id) + '\')">Reply</button>';
    if (f.status !== 'actioned') html += '<button class="btn-sm-outline" onclick="updateFeedbackStatus(\'' + esc(f.id) + '\',\'actioned\')">Action</button>';
    html += '</div></div></div>';
    return html;
}

function _afGo(dir) { _afPage += dir; renderAdminFeedback(); }

function respondToFeedback(id) {
    var ta = document.getElementById('afR_' + id);
    if (!ta) return;
    for (var i = 0; i < A_FEEDBACK.length; i++) {
        if (A_FEEDBACK[i].id === id) {
            A_FEEDBACK[i].adminResponse = ta.value.trim();
            if (A_FEEDBACK[i].status === 'new') A_FEEDBACK[i].status = 'reviewed';
            break;
        }
    }
    adminSave('pk_feedback', A_FEEDBACK);
    adminToast('Response saved');
    renderAdminFeedback();
}

function updateFeedbackStatus(id, status) {
    for (var i = 0; i < A_FEEDBACK.length; i++) {
        if (A_FEEDBACK[i].id === id) { A_FEEDBACK[i].status = status; break; }
    }
    adminSave('pk_feedback', A_FEEDBACK);
    adminToast('Status updated');
    renderAdminFeedback();
}

function exportFeedback() {
    if (!A_FEEDBACK.length) return adminToast('No feedback to export', 'error');
    var csv = 'ID,User,Type,NPS,Sentiment,Status,Text,Admin Response,Created\n';
    for (var i = 0; i < A_FEEDBACK.length; i++) {
        var f = A_FEEDBACK[i];
        csv += '"' + (f.id || '') + '","' + (f.userEmail || '') + '","' + (f.type || '') + '",' +
            (f.npsScore != null ? f.npsScore : '') + ',"' + (f.sentiment || '') + '","' + (f.status || '') + '","' +
            (f.text || '').replace(/"/g, '""') + '","' + (f.adminResponse || '').replace(/"/g, '""') + '",' +
            (f.createdAt ? new Date(f.createdAt).toISOString() : '') + '\n';
    }
    downloadBlob(csv, 'feedback-export-' + new Date().toISOString().split('T')[0] + '.csv', 'text/csv');
    adminToast('Feedback exported');
}
