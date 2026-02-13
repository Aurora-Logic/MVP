// ════════════════════════════════════════
// ANNOUNCEMENTS — In-App Banner Display
// ════════════════════════════════════════
/* exported checkAnnouncements, dismissAnnouncement */

function checkAnnouncements() {
    _annRemoveBanner();
    const announcements = typeof safeGetStorage === 'function' ? safeGetStorage('pk_announcements', []) : [];
    if (!announcements.length) return;
    const now = Date.now();
    const userId = typeof getDeviceId === 'function' ? getDeviceId() : ((typeof CONFIG !== 'undefined' && CONFIG.activeUserId) || '');
    const plan = typeof getCurrentPlan === 'function' ? getCurrentPlan() : 'free';
    const active = [];
    for (let i = 0; i < announcements.length; i++) {
        const a = announcements[i];
        if (a.status !== 'active') continue;
        if (a.scheduledFor && a.scheduledFor > now) continue;
        if (a.expiresAt && a.expiresAt <= now) continue;
        if (a.dismissedBy && a.dismissedBy.indexOf(userId) !== -1) continue;
        if (a.target && a.target !== 'all' && a.target !== plan) continue;
        active.push(a);
    }
    if (!active.length) return;
    active.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    _annShowBanner(active[0]);
}

function _annShowBanner(ann) {
    _annRemoveBanner();
    const type = ann.type || 'info';
    const colors = {
        info: { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
        warning: { bg: '#fffbeb', fg: '#92400e', border: '#fde68a' },
        update: { bg: '#f0fdf4', fg: '#166534', border: '#bbf7d0' },
        maintenance: { bg: '#fef2f2', fg: '#991b1b', border: '#fecaca' }
    };
    const icons = { info: 'info', warning: 'alert-triangle', update: 'sparkles', maintenance: 'wrench' };
    const c = colors[type] || colors.info;
    const icon = icons[type] || 'info';
    const title = ann.title || '';
    let body = ann.body || '';
    if (body.length > 100) body = body.substring(0, 100) + '\u2026';
    const e = typeof esc === 'function' ? esc : function(s) { return String(s); };
    const banner = document.createElement('div');
    banner.id = 'announcementBanner';
    banner.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid ' + c.border + ';background:' + c.bg + ';color:' + c.fg;
    banner.innerHTML = '<i data-lucide="' + e(icon) + '" style="width:16px;height:16px;flex-shrink:0"></i>' +
        '<div style="flex:1;min-width:0"><strong style="font-size:13px">' + e(title) + '</strong>' +
        (body ? '<span style="font-size:12px;opacity:0.9;margin-left:8px">' + e(body) + '</span>' : '') + '</div>' +
        '<button onclick="dismissAnnouncement(\'' + e(ann.id || '') + '\')" style="background:none;border:none;cursor:pointer;padding:4px;opacity:0.7;color:inherit">' +
        '<i data-lucide="x" style="width:14px;height:14px"></i></button>';
    const container = document.getElementById('bodyScroll') || document.querySelector('.body-scroll');
    if (container) container.insertBefore(banner, container.firstChild);
    else document.body.appendChild(banner);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function dismissAnnouncement(id) {
    if (!id) return;
    const userId = typeof getDeviceId === 'function' ? getDeviceId() : ((typeof CONFIG !== 'undefined' && CONFIG.activeUserId) || '');
    const announcements = typeof safeGetStorage === 'function' ? safeGetStorage('pk_announcements', []) : [];
    for (let i = 0; i < announcements.length; i++) {
        if (announcements[i].id === id) {
            if (!announcements[i].dismissedBy) announcements[i].dismissedBy = [];
            if (announcements[i].dismissedBy.indexOf(userId) === -1) announcements[i].dismissedBy.push(userId);
            break;
        }
    }
    try { localStorage.setItem('pk_announcements', JSON.stringify(announcements)); } catch (e) { /* full */ }
    const banner = document.getElementById('announcementBanner');
    if (banner) {
        banner.style.transition = 'opacity 200ms ease-out';
        banner.style.opacity = '0';
        setTimeout(function() { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 200);
    }
}

function _annRemoveBanner() {
    const existing = document.getElementById('announcementBanner');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
}
