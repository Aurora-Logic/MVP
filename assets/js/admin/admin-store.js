// ════════════════════════════════════════
// ADMIN-STORE — Data Layer + Auth + Utils
// ════════════════════════════════════════

/* exported A_DB, A_CONFIG, A_CLIENTS, A_SECLIB, A_TCLIB, A_EMAIL_TPL, A_TEMPLATES */
/* exported A_USERS, A_TICKETS, A_SUBSCRIPTIONS, A_ANNOUNCEMENTS, A_FEEDBACK, A_ANALYTICS */
/* exported A_CURRENT_SECTION, STORAGE_KEYS */
/* exported safeGet, safePut, adminLoad, adminReload, adminSave */
/* exported checkAdminAccess, activeAdminUser, renderAdminGate, unlockAdmin */
/* exported esc, escAttr, uid, fmtCur, fmtDate, fmtNum, timeAgo, fmtBytes */
/* exported proposalValue, downloadBlob, getStorageKeySize, getTotalStorageSize */
/* exported adminToast, adminModal, closeAdminModal, adminConfirm */

// ═══ GLOBALS ═══
let A_DB = [], A_CONFIG = {}, A_CLIENTS = [];
let A_SECLIB = [], A_TCLIB = [], A_EMAIL_TPL = [], A_TEMPLATES = [];
let A_USERS = [], A_TICKETS = [], A_SUBSCRIPTIONS = [];
let A_ANNOUNCEMENTS = [], A_FEEDBACK = [], A_ANALYTICS = [];
let A_CURRENT_SECTION = 'dashboard';
var PLAN_PRICES = { free: 0, pro: 12, team: 29 };

const STORAGE_KEYS = {
    pk_db: 'Proposals',
    pk_config: 'Configuration',
    pk_clients: 'Clients',
    pk_seclib: 'Section library',
    pk_tclib: 'T&C library',
    pk_email_tpl: 'Email templates',
    pk_templates: 'PDF templates',
    pk_users: 'Users',
    pk_tickets: 'Tickets',
    pk_subscriptions: 'Subscriptions',
    pk_announcements: 'Announcements',
    pk_feedback: 'Feedback',
    pk_analytics: 'Analytics events'
};

// ═══ SAFE STORAGE ═══
function safeGet(key, fallback) {
    try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
    } catch (e) {
        return fallback;
    }
}

function safePut(key, data) {
    try {
        const json = JSON.stringify(data);
        localStorage.setItem(key, json);
        return { ok: true, size: new Blob([json]).size };
    } catch (e) {
        if (e.name === 'QuotaExceededError') return { ok: false, error: 'Storage full' };
        return { ok: false, error: e.message };
    }
}

// ═══ DATA LOAD / SAVE ═══
function adminLoad() {
    A_DB = safeGet('pk_db', []);
    A_CONFIG = safeGet('pk_config', {});
    A_CLIENTS = safeGet('pk_clients', []);
    A_SECLIB = safeGet('pk_seclib', []);
    A_TCLIB = safeGet('pk_tclib', []);
    A_EMAIL_TPL = safeGet('pk_email_tpl', []);
    A_TEMPLATES = safeGet('pk_templates', []);
    A_USERS = safeGet('pk_users', []);
    A_TICKETS = safeGet('pk_tickets', []);
    A_SUBSCRIPTIONS = safeGet('pk_subscriptions', []);
    A_ANNOUNCEMENTS = safeGet('pk_announcements', []);
    A_FEEDBACK = safeGet('pk_feedback', []);
    A_ANALYTICS = safeGet('pk_analytics', []);
}

function adminReload() { adminLoad(); }

function adminSave(key, data) {
    const result = safePut(key, data);
    if (!result.ok) { adminToast(result.error, 'error'); return false; }
    adminLoad();
    if (typeof auditLog === 'function') {
        auditLog('edit_storage', key, 'Modified ' + (STORAGE_KEYS[key] || key) + ' (' + fmtBytes(result.size) + ')');
    }
    return true;
}

// ═══ AUTH GATE ═══
// Supabase session user info (populated by admin-boot.js)
var _sbUser = null;

function checkAdminAccess() {
    // 1. Check Supabase session — the logged-in user is the app owner = admin
    if (typeof sbSession !== 'undefined' && sbSession) {
        var u = sbSession.user;
        if (u) {
            _sbUser = {
                id: u.id,
                email: u.email || '',
                name: (u.user_metadata && u.user_metadata.full_name) || (u.user_metadata && u.user_metadata.name) || u.email || 'Admin',
                avatar: (u.user_metadata && u.user_metadata.avatar_url) || ''
            };
            return true;
        }
    }
    // 2. Check CONFIG.email — if the config owner email matches, auto-grant admin
    if (A_CONFIG && A_CONFIG.email) {
        _sbUser = { id: 'owner', email: A_CONFIG.email, name: A_CONFIG.name || 'Admin', avatar: '' };
        return true;
    }
    // 3. Check CONFIG.team for admin role (legacy)
    if (A_CONFIG && A_CONFIG.team && A_CONFIG.team.length) {
        var member = A_CONFIG.team.find(function(m) { return m.id === A_CONFIG.activeUserId; });
        if (member && member.role === 'admin') {
            _sbUser = { id: member.id, email: member.email || '', name: member.name || 'Admin', avatar: '' };
            return true;
        }
    }
    return false;
}

function activeAdminUser() {
    if (_sbUser) return _sbUser;
    return (A_CONFIG.team || []).find(function(m) { return m.id === A_CONFIG.activeUserId; }) || null;
}

function renderAdminGate() {
    var gate = document.getElementById('adminGate');
    gate.innerHTML = '<div class="admin-gate">' +
        '<i data-lucide="shield-x" style="width:48px;height:48px;color:var(--red)"></i>' +
        '<h2 style="margin:16px 0 8px;font-size:18px;font-weight:600">Access denied</h2>' +
        '<p style="color:var(--text3);font-size:13px;margin-bottom:20px">' +
        'Please sign in to the main app first, then return here.' +
        '</p><a href="/" class="btn">Back to app</a></div>';
    gate.style.display = 'flex';
    lucide.createIcons();
}

function unlockAdmin() {
    document.getElementById('adminGate').style.display = 'none';
    document.getElementById('adminShell').style.display = 'flex';
    var user = activeAdminUser();
    if (!user) return;
    var badge = document.getElementById('adminUserBadge');
    if (badge) badge.textContent = user.name || user.email || '';
    var nameEl = document.getElementById('adminUserName');
    if (nameEl) nameEl.textContent = user.name || 'Admin';
    var emailEl = document.getElementById('adminUserEmail');
    if (emailEl) emailEl.textContent = user.email || '';
    var avatarEl = document.getElementById('adminUserAvatar');
    if (avatarEl) {
        if (user.avatar) {
            avatarEl.innerHTML = '<img src="' + escAttr(user.avatar) + '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">';
        } else {
            avatarEl.textContent = (user.name || user.email || 'A').charAt(0).toUpperCase();
        }
    }
}

// ═══ UTILITIES (self-contained) ═══
function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escAttr(s) { return esc(s).replace(/\\/g, '\\\\'); }

function uid() {
    return 'a' + Date.now().toString(36) + Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(16).padStart(2, '0')).join('');
}

function fmtCur(n, c) {
    var dc = c === '\u00A5CN' ? '\u00A5' : (c || '\u20B9');
    var val = (typeof n === 'number' && isFinite(n)) ? n : 0;
    var locale = dc === '\u20B9' ? 'en-IN' : 'en-US';
    try {
        return dc + new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(val);
    } catch (e) {
        return dc + Number(val).toFixed(2);
    }
}

function fmtDate(d) {
    if (!d) return '\u2014';
    try {
        return new Date(d).toLocaleDateString(
            A_CONFIG && A_CONFIG.country === 'IN' ? 'en-IN' : 'en-US',
            { day: 'numeric', month: 'short', year: 'numeric' }
        );
    } catch (e) { return String(d); }
}

function fmtNum(n) {
    return (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString();
}

function timeAgo(ts) {
    if (!ts) return '\u2014';
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
}

function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
}

function proposalValue(p) {
    return (p && p.lineItems || []).reduce(function(s, i) {
        return s + ((i.qty || 0) * (i.rate || 0));
    }, 0);
}

function downloadBlob(data, filename, type) {
    var blob = new Blob([data], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click(); a.remove();
    URL.revokeObjectURL(url);
}

function getStorageKeySize(key) {
    var raw = localStorage.getItem(key);
    return raw ? new Blob([raw]).size : 0;
}

function getTotalStorageSize() {
    var total = 0;
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        total += new Blob([localStorage.getItem(key)]).size;
    }
    return total;
}

// ═══ TOAST ═══
function adminToast(msg, type) {
    type = type || 'info';
    var box = document.getElementById('adminToast');
    if (!box) return;
    var t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = msg;
    box.appendChild(t);
    requestAnimationFrame(function() { t.classList.add('show'); });
    setTimeout(function() {
        t.classList.remove('show');
        setTimeout(function() { t.remove(); }, 200);
    }, 3000);
    while (box.children.length > 5) box.firstChild.remove();
}

// ═══ MODAL ═══
function adminModal(title, bodyHtml, opts) {
    opts = opts || {};
    var id = 'amodal_' + uid();
    var wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = id;
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    var w = opts.width || '600px';
    wrap.innerHTML = '<div class="modal" style="max-width:' + w + '" onclick="event.stopPropagation()">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">' +
        '<div class="modal-t">' + esc(title) + '</div>' +
        '<button class="btn-sm-icon-ghost" onclick="closeAdminModal(\'' + id + '\')"><i data-lucide="x"></i></button>' +
        '</div><div class="admin-modal-body">' + bodyHtml + '</div>' +
        (opts.footer || '') + '</div>';
    wrap.addEventListener('click', function(e) {
        if (e.target === wrap) closeAdminModal(id);
    });
    document.body.appendChild(wrap);
    requestAnimationFrame(function() { wrap.classList.add('show'); });
    lucide.createIcons();
    var escHandler = function(e) {
        if (e.key === 'Escape') { closeAdminModal(id); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
    return id;
}

function closeAdminModal(id) {
    var wrap = document.getElementById(id);
    if (!wrap) return;
    wrap.classList.remove('show');
    setTimeout(function() { wrap.remove(); }, 200);
}

// ═══ CONFIRM DIALOG ═══
function adminConfirm(message, onConfirm, opts) {
    opts = opts || {};
    var id = 'amodal_' + uid();
    var btnCls = opts.destructive ? 'btn-sm-destructive' : 'btn';
    var body = '<p style="font-size:13px;color:var(--text3);margin-bottom:20px">' + esc(message) + '</p>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end">' +
        '<button class="btn-outline" onclick="closeAdminModal(\'' + id + '\')">Cancel</button>' +
        '<button class="' + btnCls + '" id="' + id + '_confirm">' + esc(opts.confirmText || 'Confirm') + '</button></div>';
    var wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = id;
    wrap.setAttribute('role', 'alertdialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.innerHTML = '<div class="modal" style="max-width:400px" onclick="event.stopPropagation()">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">' +
        '<div class="modal-t">' + esc(opts.title || 'Confirm') + '</div>' +
        '<button class="btn-sm-icon-ghost" onclick="closeAdminModal(\'' + id + '\')"><i data-lucide="x"></i></button>' +
        '</div>' + body + '</div>';
    wrap.addEventListener('click', function(e) {
        if (e.target === wrap) closeAdminModal(id);
    });
    document.body.appendChild(wrap);
    requestAnimationFrame(function() { wrap.classList.add('show'); });
    lucide.createIcons();
    requestAnimationFrame(function() {
        var btn = document.getElementById(id + '_confirm');
        if (btn) {
            btn.onclick = function() { closeAdminModal(id); onConfirm(); };
            btn.focus();
        }
    });
    var escHandler = function(e) {
        if (e.key === 'Escape') { closeAdminModal(id); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
}
