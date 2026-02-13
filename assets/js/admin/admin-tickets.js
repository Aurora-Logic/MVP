// ════════════════════════════════════════
// ADMIN-TICKETS — Support Ticket Management
// ════════════════════════════════════════
/* exported renderAdminTickets */

var _atPage = 1, _atPerPage = 15, _atSearch = '', _atStatus = '', _atPriority = '', _atCategory = '', _atTimer = null;

function renderAdminTickets() {
    var el = document.getElementById('adminContent');
    if (!el) return;
    var open = 0, inProg = 0, resolved = 0, closed = 0;
    for (var i = 0; i < A_TICKETS.length; i++) {
        var s = A_TICKETS[i].status;
        if (s === 'open') open++;
        else if (s === 'in-progress') inProg++;
        else if (s === 'resolved') resolved++;
        else if (s === 'closed') closed++;
    }
    var html = '<div class="admin-section">';
    html += '<div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">';
    html += _atStat('Open', open, '#3b82f6', '#eff6ff');
    html += _atStat('In Progress', inProg, '#f59e0b', '#fffbeb');
    html += _atStat('Resolved', resolved, '#16a34a', '#f0fdf4');
    html += _atStat('Avg Resolution', _atAvgRes(), '#71717a', '#f4f4f5');
    html += '</div>';
    html += '<div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">';
    html += '<input type="text" id="atSearch" placeholder="Search tickets…" value="' + esc(_atSearch) + '" style="padding:7px 12px;border:1px solid var(--border);border-radius:9999px;font-size:13px;width:220px;outline:none">';
    html += _adminCsel('atSt');
    html += _adminCsel('atPr');
    html += _adminCsel('atCat');
    html += '</div>';
    var filtered = _atFiltered();
    var totalP = Math.max(1, Math.ceil(filtered.length / _atPerPage));
    if (_atPage > totalP) _atPage = totalP;
    var start = (_atPage - 1) * _atPerPage;
    var page = filtered.slice(start, start + _atPerPage);
    html += '<div class="admin-table-wrap"><table class="admin-info-table"><thead><tr>';
    html += '<th style="width:36px"></th><th>#</th><th>Subject</th><th>User</th><th>Category</th><th>Status</th><th>Created</th><th style="width:80px">Actions</th>';
    html += '</tr></thead><tbody>';
    if (!page.length) html += '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text3)">No tickets found</td></tr>';
    for (var j = 0; j < page.length; j++) html += _atRow(page[j]);
    html += '</tbody></table></div>';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;font-size:13px;color:var(--text3)">';
    html += '<span>' + (filtered.length ? start + 1 : 0) + '–' + Math.min(start + _atPerPage, filtered.length) + ' of ' + filtered.length + '</span>';
    html += '<div style="display:flex;gap:6px"><button class="btn-sm-outline" onclick="_atGo(-1)"' + (_atPage <= 1 ? ' disabled' : '') + '>Prev</button>';
    html += '<span style="padding:4px 8px">' + _atPage + '/' + totalP + '</span>';
    html += '<button class="btn-sm-outline" onclick="_atGo(1)"' + (_atPage >= totalP ? ' disabled' : '') + '>Next</button></div></div></div>';
    el.innerHTML = html;
    lucide.createIcons();
    var se = document.getElementById('atSearch');
    if (se) se.addEventListener('input', function() {
        clearTimeout(_atTimer); var v = se.value;
        _atTimer = setTimeout(function() { _atSearch = v; _atPage = 1; renderAdminTickets(); }, 200);
    });
    _adminCselBind('atSt', [['','All Status'],['open','Open'],['in-progress','In Progress'],['resolved','Resolved'],['closed','Closed']].map(function(o){return{value:o[0],label:o[1]};}), _atStatus, function(v){_atStatus=v;_atPage=1;renderAdminTickets();});
    _adminCselBind('atPr', [['','All Priority'],['low','Low'],['medium','Medium'],['high','High'],['urgent','Urgent']].map(function(o){return{value:o[0],label:o[1]};}), _atPriority, function(v){_atPriority=v;_atPage=1;renderAdminTickets();});
    _adminCselBind('atCat', [['','All Categories'],['general','General'],['bug','Bug'],['feature','Feature'],['billing','Billing']].map(function(o){return{value:o[0],label:o[1]};}), _atCategory, function(v){_atCategory=v;_atPage=1;renderAdminTickets();});
}

function _atStat(label, val, color, bg) {
    return '<div style="flex:1;min-width:140px;background:' + bg + ';border:1px solid var(--border);border-radius:10px;padding:16px 20px">' +
        '<div style="font-size:12px;color:var(--text3);margin-bottom:4px">' + esc(label) + '</div>' +
        '<div style="font-size:24px;font-weight:700;color:' + color + '">' + esc(String(val)) + '</div></div>';
}

// _atSel removed — replaced by _adminCsel / _adminCselBind

function _atFiltered() {
    var out = [], q = _atSearch.toLowerCase();
    for (var i = 0; i < A_TICKETS.length; i++) {
        var t = A_TICKETS[i];
        if (_atStatus && t.status !== _atStatus) continue;
        if (_atPriority && t.priority !== _atPriority) continue;
        if (_atCategory && t.category !== _atCategory) continue;
        if (q && ((t.subject || '') + ' ' + (t.userName || '') + ' ' + (t.userEmail || '')).toLowerCase().indexOf(q) === -1) continue;
        out.push(t);
    }
    out.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    return out;
}

function _atRow(t) {
    var pc = { low: '#71717a', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };
    var sc = { open: 'color:#2563eb;background:#eff6ff', 'in-progress': 'color:#f59e0b;background:#fffbeb', resolved: 'color:#16a34a;background:#f0fdf4', closed: 'color:#71717a;background:#f4f4f5' };
    var cc = { bug: 'color:#ef4444;background:#fef2f2', feature: 'color:#2563eb;background:#eff6ff', billing: 'color:#16a34a;background:#f0fdf4', general: 'color:#71717a;background:#f4f4f5' };
    var badge = 'border-radius:9999px;padding:2px 10px;font-size:11px;font-weight:500';
    return '<tr style="cursor:pointer" onclick="openTicket(\'' + esc(t.id) + '\')">' +
        '<td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + (pc[t.priority] || '#71717a') + '"></span></td>' +
        '<td style="font-weight:500;color:var(--text3)">#' + esc(t.id.slice(-6)) + '</td>' +
        '<td style="font-weight:500">' + esc(t.subject || '\u2014') + '</td>' +
        '<td>' + esc(t.userName || t.userEmail || '\u2014') + '</td>' +
        '<td><span style="' + (cc[t.category] || cc.general) + ';' + badge + '">' + esc(t.category || 'general') + '</span></td>' +
        '<td><span style="' + (sc[t.status] || sc.open) + ';' + badge + '">' + esc(t.status) + '</span></td>' +
        '<td>' + (t.createdAt ? timeAgo(t.createdAt) : '\u2014') + '</td>' +
        '<td><button class="btn-sm-icon-ghost" onclick="event.stopPropagation();openTicket(\'' + esc(t.id) + '\')"><i data-lucide="message-square" style="width:14px;height:14px"></i></button></td></tr>';
}

function _atGo(dir) { _atPage += dir; renderAdminTickets(); }

function _atAvgRes() {
    var total = 0, count = 0;
    for (var i = 0; i < A_TICKETS.length; i++) {
        var t = A_TICKETS[i];
        if (t.resolvedAt && t.createdAt) { total += t.resolvedAt - t.createdAt; count++; }
    }
    if (!count) return '\u2014';
    var hrs = Math.round(total / count / 3600000);
    return hrs < 24 ? hrs + 'h' : Math.round(hrs / 24) + 'd';
}

function openTicket(id) {
    var t = null;
    for (var i = 0; i < A_TICKETS.length; i++) if (A_TICKETS[i].id === id) { t = A_TICKETS[i]; break; }
    if (!t) return adminToast('Ticket not found', 'error');
    var sc = { open: 'color:#2563eb;background:#eff6ff', 'in-progress': 'color:#f59e0b;background:#fffbeb', resolved: 'color:#16a34a;background:#f0fdf4', closed: 'color:#71717a;background:#f4f4f5' };
    var badge = 'border-radius:9999px;padding:2px 10px;font-size:11px;font-weight:500';
    var body = '<div style="display:flex;gap:8px;align-items:center;margin-bottom:16px">';
    body += '<span style="' + (sc[t.status] || sc.open) + ';' + badge + '">' + esc(t.status) + '</span>';
    body += '<span style="font-size:12px;color:var(--text3)">' + esc(t.userName || t.userEmail || '') + '</span>';
    body += '<div style="flex:1"></div>';
    body += '<div id="tkSt"></div>';
    body += '<div id="tkPr"></div></div>';
    body += '<div id="tkMsgs" style="max-height:320px;overflow-y:auto;padding:8px 0;display:flex;flex-direction:column;gap:8px">';
    var msgs = t.messages || [];
    for (var m = 0; m < msgs.length; m++) {
        var msg = msgs[m];
        var isAdmin = msg.from === 'admin';
        body += '<div style="display:flex;flex-direction:column;align-items:' + (isAdmin ? 'flex-start' : 'flex-end') + '">';
        body += '<div style="max-width:80%;padding:10px 14px;border-radius:12px;font-size:13px;background:' + (isAdmin ? 'var(--muted)' : 'var(--primary)') + ';color:' + (isAdmin ? 'var(--foreground)' : '#fff') + '">';
        body += esc(msg.text || '');
        body += '<div style="font-size:10px;opacity:0.7;margin-top:4px">' + (msg.ts ? timeAgo(msg.ts) : '') + '</div>';
        body += '</div></div>';
    }
    body += '</div>';
    if (t.internalNotes && t.internalNotes.length) {
        body += '<div style="margin-top:12px;padding:10px;background:#fffbeb;border-radius:8px;border:1px solid #fde68a">';
        body += '<div style="font-size:11px;font-weight:600;color:#92400e;margin-bottom:6px">Internal Notes</div>';
        for (var n = 0; n < t.internalNotes.length; n++) {
            body += '<div style="font-size:12px;color:#78350f;margin-bottom:4px">' + esc(t.internalNotes[n].text) + ' <span style="opacity:0.6">' + (t.internalNotes[n].ts ? timeAgo(t.internalNotes[n].ts) : '') + '</span></div>';
        }
        body += '</div>';
    }
    body += '<div style="display:flex;gap:8px;margin-top:12px">';
    body += '<textarea id="tkReply" rows="2" placeholder="Type a reply\u2026" style="flex:1;resize:none;font-size:13px;padding:8px 12px;border:1px solid var(--border);border-radius:8px"></textarea>';
    body += '<button class="btn-sm" onclick="sendTicketReply(\'' + esc(t.id) + '\')" style="align-self:flex-end">Send</button>';
    body += '</div>';
    var mid = adminModal(esc(t.subject || 'Ticket'), body, { width: '700px' });
    setTimeout(function() {
        if (typeof csel === 'function') {
            var stEl = document.getElementById('tkSt');
            if (stEl) { csel(stEl, { value: t.status, small: true, items: [
                { value: 'open', label: 'open' }, { value: 'in-progress', label: 'in-progress' },
                { value: 'resolved', label: 'resolved' }, { value: 'closed', label: 'closed' }
            ], onChange: function(v) { updateTicketStatus(id, v); } }); stEl.classList.add('csel-xs'); }
            var prEl = document.getElementById('tkPr');
            if (prEl) { csel(prEl, { value: t.priority, small: true, items: [
                { value: 'low', label: 'low' }, { value: 'medium', label: 'medium' },
                { value: 'high', label: 'high' }, { value: 'urgent', label: 'urgent' }
            ], onChange: function(v) { updateTicketPriority(id, v); } }); prEl.classList.add('csel-xs'); }
        }
    }, 50);
}

function sendTicketReply(id) {
    var ta = document.getElementById('tkReply');
    if (!ta || !ta.value.trim()) return;
    for (var i = 0; i < A_TICKETS.length; i++) {
        if (A_TICKETS[i].id === id) {
            if (!A_TICKETS[i].messages) A_TICKETS[i].messages = [];
            A_TICKETS[i].messages.push({ id: uid(), from: 'admin', text: ta.value.trim(), ts: Date.now() });
            A_TICKETS[i].updatedAt = Date.now();
            break;
        }
    }
    adminSave('pk_tickets', A_TICKETS);
    adminToast('Reply sent');
    document.querySelectorAll('.modal-wrap').forEach(function(w) { w.remove(); });
    openTicket(id);
}

function updateTicketStatus(id, newStatus) {
    for (var i = 0; i < A_TICKETS.length; i++) {
        if (A_TICKETS[i].id === id) {
            A_TICKETS[i].status = newStatus;
            A_TICKETS[i].updatedAt = Date.now();
            if (newStatus === 'resolved') A_TICKETS[i].resolvedAt = Date.now();
            break;
        }
    }
    adminSave('pk_tickets', A_TICKETS);
    adminToast('Status updated to ' + newStatus);
}

function updateTicketPriority(id, newPri) {
    for (var i = 0; i < A_TICKETS.length; i++) {
        if (A_TICKETS[i].id === id) { A_TICKETS[i].priority = newPri; A_TICKETS[i].updatedAt = Date.now(); break; }
    }
    adminSave('pk_tickets', A_TICKETS);
    adminToast('Priority updated to ' + newPri);
}
