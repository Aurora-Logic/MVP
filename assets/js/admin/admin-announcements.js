// ════════════════════════════════════════
// ADMIN-ANNOUNCEMENTS — Announcement Management
// ════════════════════════════════════════
/* exported renderAdminAnnouncements */

var ANN_COLORS = { info: '#2563eb', warning: '#f59e0b', update: '#16a34a', maintenance: '#ef4444' };
var ANN_BG = { info: '#eff6ff', warning: '#fffbeb', update: '#f0fdf4', maintenance: '#fef2f2' };
var ANN_ICONS = { info: 'info', warning: 'alert-triangle', update: 'sparkles', maintenance: 'wrench' };

function renderAdminAnnouncements() {
    var el = document.getElementById('adminContent');
    if (!el) return;
    var active = 0, draft = 0, expired = 0, dismissals = 0;
    for (var i = 0; i < A_ANNOUNCEMENTS.length; i++) {
        var a = A_ANNOUNCEMENTS[i];
        if (a.status === 'active') active++;
        else if (a.status === 'draft') draft++;
        else if (a.status === 'expired') expired++;
        dismissals += (a.dismissedBy || []).length;
    }
    var html = '<div class="admin-section">';
    html += '<div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">';
    html += _annStat('Total', A_ANNOUNCEMENTS.length, '#3b82f6', '#eff6ff');
    html += _annStat('Active', active, '#16a34a', '#f0fdf4');
    html += _annStat('Draft', draft, '#f59e0b', '#fffbeb');
    html += _annStat('Dismissals', dismissals, '#71717a', '#f4f4f5');
    html += '</div>';
    html += '<div style="display:flex;justify-content:flex-end;margin-bottom:16px">';
    html += '<button class="btn-sm" onclick="openAnnouncementModal()"><i data-lucide="plus" style="width:14px;height:14px"></i> New Announcement</button></div>';
    // Cards
    var sorted = A_ANNOUNCEMENTS.slice().sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    if (!sorted.length) html += '<div style="text-align:center;padding:32px;color:var(--text3)">No announcements yet</div>';
    for (var j = 0; j < sorted.length; j++) html += _annCard(sorted[j]);
    html += '</div>';
    el.innerHTML = html;
    lucide.createIcons();
}

function _annStat(label, val, color, bg) {
    return '<div style="flex:1;min-width:120px;background:' + bg + ';border:1px solid var(--border);border-radius:10px;padding:16px 20px">' +
        '<div style="font-size:12px;color:var(--text3);margin-bottom:4px">' + esc(label) + '</div>' +
        '<div style="font-size:24px;font-weight:700;color:' + color + '">' + val + '</div></div>';
}

function _annCard(a) {
    var color = ANN_COLORS[a.type] || ANN_COLORS.info;
    var badge = 'border-radius:9999px;padding:2px 10px;font-size:11px;font-weight:500';
    var sc = a.status === 'active' ? 'color:#16a34a;background:#f0fdf4' : a.status === 'draft' ? 'color:#f59e0b;background:#fffbeb' : 'color:#71717a;background:#f4f4f5';
    var body = (a.body || '').length > 80 ? a.body.substring(0, 80) + '\u2026' : (a.body || '');
    return '<div style="border:1px solid var(--border);border-left:4px solid ' + color + ';border-radius:8px;padding:16px;margin-bottom:12px">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
        '<i data-lucide="' + (ANN_ICONS[a.type] || 'info') + '" style="width:16px;height:16px;color:' + color + '"></i>' +
        '<strong style="font-size:14px;flex:1">' + esc(a.title || '') + '</strong>' +
        '<span style="' + sc + ';' + badge + '">' + esc(a.status) + '</span>' +
        '<span style="color:' + color + ';background:' + (ANN_BG[a.type] || '#eff6ff') + ';' + badge + '">' + esc(a.type) + '</span>' +
        '<span style="color:var(--text3);background:var(--muted);' + badge + '">' + esc(a.target || 'all') + '</span>' +
        '</div>' +
        (body ? '<div style="font-size:13px;color:var(--text3);margin-bottom:8px">' + esc(body) + '</div>' : '') +
        '<div style="display:flex;align-items:center;gap:12px;font-size:12px;color:var(--text4)">' +
        '<span>' + (a.createdAt ? timeAgo(a.createdAt) : '') + '</span>' +
        '<span>' + (a.dismissedBy || []).length + ' dismissed</span>' +
        '<div style="flex:1"></div>' +
        '<button class="btn-sm-ghost" onclick="openAnnouncementModal(\'' + esc(a.id) + '\')">Edit</button>' +
        '<button class="btn-sm-ghost" onclick="duplicateAnnouncement(\'' + esc(a.id) + '\')">Duplicate</button>' +
        (a.status === 'active' ? '<button class="btn-sm-ghost" onclick="expireAnnouncement(\'' + esc(a.id) + '\')">Expire</button>' : '') +
        '<button class="btn-sm-ghost" style="color:var(--red)" onclick="deleteAnnouncement(\'' + esc(a.id) + '\')">Delete</button>' +
        '</div></div>';
}

function openAnnouncementModal(existingId) {
    var a = null;
    if (existingId) {
        for (var i = 0; i < A_ANNOUNCEMENTS.length; i++) if (A_ANNOUNCEMENTS[i].id === existingId) { a = A_ANNOUNCEMENTS[i]; break; }
    }
    var title = a ? esc(a.title || '') : '';
    var bodyText = a ? esc(a.body || '') : '';
    var type = a ? a.type : 'info';
    var target = a ? a.target : 'all';
    var status = a ? a.status : 'draft';
    var fs = 'style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;margin-top:4px"';
    var ls = 'style="font-size:12px;font-weight:600;color:var(--text3);display:block;margin-bottom:12px"';
    var body = '<label ' + ls + '>Title<input id="annTitle" ' + fs + ' value="' + title + '"></label>';
    body += '<label ' + ls + '>Body<textarea id="annBody" ' + fs + ' rows="4">' + bodyText + '</textarea></label>';
    body += '<label ' + ls + '>Type<div style="display:flex;gap:8px;margin-top:4px">';
    var types = ['info', 'warning', 'update', 'maintenance'];
    for (var j = 0; j < types.length; j++) {
        var t = types[j];
        body += '<label style="display:flex;align-items:center;gap:4px;padding:6px 12px;border:1px solid var(--border);border-radius:9999px;cursor:pointer;font-size:12px;' + (type === t ? 'background:' + ANN_BG[t] + ';border-color:' + ANN_COLORS[t] : '') + '">';
        body += '<input type="radio" name="annType" value="' + t + '"' + (type === t ? ' checked' : '') + ' style="display:none">';
        body += '<span style="color:' + ANN_COLORS[t] + '">' + t + '</span></label>';
    }
    body += '</div></label>';
    body += '<div ' + ls + '>Target<div id="annTarget" style="margin-top:4px"></div></div>';
    body += '<div ' + ls + '>Status<div id="annStatus" style="margin-top:4px"></div></div>';
    body += '<div style="font-size:12px;font-weight:600;color:var(--text3);margin-bottom:8px">Preview</div>';
    body += '<div id="annPreview" style="border:1px solid var(--border);border-radius:8px;overflow:hidden"></div>';
    body += '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">';
    body += '<button class="btn-sm" onclick="saveAnnouncement(\'' + (existingId ? esc(existingId) : '') + '\')">' + (existingId ? 'Update' : 'Create') + '</button></div>';
    adminModal(existingId ? 'Edit Announcement' : 'New Announcement', body, { width: '600px' });
    setTimeout(function() {
        if (typeof csel === 'function') {
            var tEl = document.getElementById('annTarget');
            if (tEl) csel(tEl, { value: target, items: [
                { value: 'all', label: 'All Users' }, { value: 'free', label: 'Free Users' },
                { value: 'pro', label: 'Pro Users' }, { value: 'team', label: 'Team Users' }
            ] });
            var sEl = document.getElementById('annStatus');
            if (sEl) csel(sEl, { value: status, items: [
                { value: 'draft', label: 'Draft' }, { value: 'active', label: 'Active' }, { value: 'expired', label: 'Expired' }
            ] });
        }
        _annUpdatePreview(); _annBindPreview();
    }, 50);
}

function _annUpdatePreview() {
    var prev = document.getElementById('annPreview');
    if (!prev) return;
    var t = (document.getElementById('annTitle') || {}).value || 'Title';
    var b = (document.getElementById('annBody') || {}).value || '';
    var typeRadio = document.querySelector('input[name="annType"]:checked');
    var type = typeRadio ? typeRadio.value : 'info';
    var color = ANN_COLORS[type] || ANN_COLORS.info;
    var bg = ANN_BG[type] || ANN_BG.info;
    prev.innerHTML = '<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;background:' + bg + ';color:' + color + '">' +
        '<i data-lucide="' + (ANN_ICONS[type] || 'info') + '" style="width:16px;height:16px"></i>' +
        '<strong style="font-size:13px">' + esc(t) + '</strong>' +
        (b ? '<span style="font-size:12px;opacity:0.8">' + esc(b.length > 60 ? b.substring(0, 60) + '\u2026' : b) + '</span>' : '') +
        '</div>';
    lucide.createIcons();
}

function _annBindPreview() {
    var fields = ['annTitle', 'annBody'];
    for (var i = 0; i < fields.length; i++) {
        var f = document.getElementById(fields[i]);
        if (f) f.addEventListener('input', _annUpdatePreview);
    }
    var radios = document.querySelectorAll('input[name="annType"]');
    for (var j = 0; j < radios.length; j++) radios[j].addEventListener('change', _annUpdatePreview);
}

function saveAnnouncement(existingId) {
    var title = (document.getElementById('annTitle') || {}).value;
    if (!title || !title.trim()) return adminToast('Title is required', 'error');
    var bodyText = (document.getElementById('annBody') || {}).value || '';
    var typeRadio = document.querySelector('input[name="annType"]:checked');
    var type = typeRadio ? typeRadio.value : 'info';
    var targetEl = document.getElementById('annTarget');
    var target = targetEl && typeof cselGetValue === 'function' ? cselGetValue(targetEl) || 'all' : 'all';
    var statusEl = document.getElementById('annStatus');
    var status = statusEl && typeof cselGetValue === 'function' ? cselGetValue(statusEl) || 'draft' : 'draft';
    if (existingId) {
        for (var i = 0; i < A_ANNOUNCEMENTS.length; i++) {
            if (A_ANNOUNCEMENTS[i].id === existingId) {
                A_ANNOUNCEMENTS[i].title = title.trim();
                A_ANNOUNCEMENTS[i].body = bodyText.trim();
                A_ANNOUNCEMENTS[i].type = type;
                A_ANNOUNCEMENTS[i].target = target;
                A_ANNOUNCEMENTS[i].status = status;
                break;
            }
        }
    } else {
        A_ANNOUNCEMENTS.push({ id: uid(), title: title.trim(), body: bodyText.trim(), type: type,
            target: target, status: status, scheduledFor: null, expiresAt: null, dismissedBy: [], createdAt: Date.now() });
    }
    adminSave('pk_announcements', A_ANNOUNCEMENTS);
    adminToast(existingId ? 'Announcement updated' : 'Announcement created');
    renderAdminAnnouncements();
}

function expireAnnouncement(id) {
    for (var i = 0; i < A_ANNOUNCEMENTS.length; i++) {
        if (A_ANNOUNCEMENTS[i].id === id) { A_ANNOUNCEMENTS[i].status = 'expired'; break; }
    }
    adminSave('pk_announcements', A_ANNOUNCEMENTS);
    adminToast('Announcement expired');
    renderAdminAnnouncements();
}

function deleteAnnouncement(id) {
    adminConfirm('Delete this announcement?', function() {
        A_ANNOUNCEMENTS = A_ANNOUNCEMENTS.filter(function(a) { return a.id !== id; });
        adminSave('pk_announcements', A_ANNOUNCEMENTS);
        adminToast('Announcement deleted');
        renderAdminAnnouncements();
    }, { destructive: true });
}

function duplicateAnnouncement(id) {
    var src = null;
    for (var i = 0; i < A_ANNOUNCEMENTS.length; i++) if (A_ANNOUNCEMENTS[i].id === id) { src = A_ANNOUNCEMENTS[i]; break; }
    if (!src) return;
    var copy = JSON.parse(JSON.stringify(src));
    copy.id = uid(); copy.status = 'draft'; copy.dismissedBy = []; copy.createdAt = Date.now();
    copy.title = 'Copy of ' + (copy.title || '');
    A_ANNOUNCEMENTS.push(copy);
    adminSave('pk_announcements', A_ANNOUNCEMENTS);
    adminToast('Announcement duplicated');
    renderAdminAnnouncements();
}
