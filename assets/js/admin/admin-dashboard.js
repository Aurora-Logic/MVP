// ════════════════════════════════════════
// ADMIN-DASHBOARD — Metrics + Health Score
// ════════════════════════════════════════

/* exported renderAdminDashboard, findOrphanedClients, findCorruptProposals, findExpiredNotHandled, getStoragePercent, lastBackupDays */

function renderAdminDashboard() {
    var el = document.getElementById('adminContent');
    if (!el) return;
    el.innerHTML = buildAdminMetrics() + buildHealthSection() + buildSystemInfo();
    lucide.createIcons();
}

// ─── Metric Cards ───
function buildAdminMetrics() {
    var total = A_DB.length;
    var draft = 0, sent = 0, accepted = 0, declined = 0, archived = 0;
    var revenue = 0;
    A_DB.forEach(function(p) {
        if (p.archived) { archived++; return; }
        if (p.status === 'draft') draft++;
        else if (p.status === 'sent') sent++;
        else if (p.status === 'accepted') { accepted++; revenue += proposalValue(p); }
        else if (p.status === 'declined') declined++;
    });
    var stSize = getTotalStorageSize();
    var stPct = ((stSize / (5 * 1024 * 1024)) * 100).toFixed(1);

    // SaaS metrics
    var userCount = (A_USERS || []).length;
    var activeUsers = (A_USERS || []).filter(function(u) { return u.status === 'active'; }).length;
    var openTickets = (A_TICKETS || []).filter(function(t) { return t.status === 'open' || t.status === 'in-progress'; }).length;
    var mrr = 0;
    (A_SUBSCRIPTIONS || []).forEach(function(s) {
        if (s.status === 'active' || s.status === 'trialing') mrr += (PLAN_PRICES[s.plan] || 0);
    });

    return '<div class="admin-stat-grid">' +
        '<div class="admin-stat primary"><div class="admin-stat-label">Proposals</div>' +
        '<div class="admin-stat-value">' + total + '</div>' +
        '<div class="admin-stat-sub">' + draft + ' draft, ' + sent + ' sent, ' + accepted + ' accepted' + (archived ? ', ' + archived + ' archived' : '') + '</div></div>' +
        '<div class="admin-stat blue"><div class="admin-stat-label">Users</div>' +
        '<div class="admin-stat-value">' + userCount + '</div>' +
        '<div class="admin-stat-sub">' + activeUsers + ' active, ' + A_CLIENTS.length + ' clients</div></div>' +
        '<div class="admin-stat green"><div class="admin-stat-label">MRR</div>' +
        '<div class="admin-stat-value">' + fmtCur(mrr, '$') + '</div>' +
        '<div class="admin-stat-sub">Revenue: ' + fmtCur(revenue, A_CONFIG.currency) + '</div></div>' +
        '<div class="admin-stat ' + (openTickets > 5 ? 'red' : 'amber') + '"><div class="admin-stat-label">Open Tickets</div>' +
        '<div class="admin-stat-value">' + openTickets + '</div>' +
        '<div class="admin-stat-sub">Storage: ' + fmtBytes(stSize) + ' (' + stPct + '%)</div></div></div>';
}

// ─── Health Score ───
var HEALTH_CHECKS = [
    { id: 'profile', label: 'Profile complete', weight: 10,
      check: function() { return !!(A_CONFIG.name && A_CONFIG.email && A_CONFIG.company); },
      fix: 'Complete your profile in Settings > Profile' },
    { id: 'bank', label: 'Bank details configured', weight: 10,
      check: function() { return !!(A_CONFIG.bank && A_CONFIG.bank.account); },
      fix: 'Add bank details in Settings > Payments' },
    { id: 'logo', label: 'Logo uploaded', weight: 5,
      check: function() { return !!A_CONFIG.logo; },
      fix: 'Upload logo in Settings > Branding' },
    { id: 'orphans', label: 'No orphaned clients', weight: 15,
      check: function() { return findOrphanedClients().length === 0; },
      fix: 'Review orphaned clients in Admin > Clients',
      detail: function() { return findOrphanedClients().length + ' orphaned'; } },
    { id: 'corrupt', label: 'No corrupt proposals', weight: 20,
      check: function() { return findCorruptProposals().length === 0; },
      fix: 'Fix corrupt data in Admin > Proposals',
      detail: function() { return findCorruptProposals().length + ' corrupt'; } },
    { id: 'storage', label: 'Storage under 80%', weight: 15,
      check: function() { return getStoragePercent() < 80; },
      fix: 'Export data and clear old proposals',
      detail: function() { return getStoragePercent().toFixed(1) + '%'; } },
    { id: 'backup', label: 'Backup within 7 days', weight: 10,
      check: function() { return lastBackupDays() <= 7; },
      fix: 'Export a backup from Admin > Debug',
      detail: function() { return lastBackupDays() === Infinity ? 'Never' : lastBackupDays() + 'd ago'; } },
    { id: 'expired', label: 'No stale sent proposals', weight: 5,
      check: function() { return findExpiredNotHandled().length === 0; },
      fix: 'Mark expired proposals',
      detail: function() { return findExpiredNotHandled().length + ' stale'; } },
    { id: 'team', label: 'Team configured', weight: 5,
      check: function() { return (A_CONFIG.team || []).length > 0; },
      fix: 'Set up team in Settings > Team' },
    { id: 'sw', label: 'Service worker active', weight: 5,
      check: function() { return !!(navigator.serviceWorker && navigator.serviceWorker.controller); },
      fix: 'Check Admin > Debug > Service Worker' }
];

function buildHealthSection() {
    var score = 0, total = 0;
    var rows = '';
    HEALTH_CHECKS.forEach(function(hc) {
        var pass = false;
        try { pass = hc.check(); } catch (e) { /* fail */ }
        total += hc.weight;
        if (pass) score += hc.weight;
        var detail = (hc.detail && !pass) ? ' (' + hc.detail() + ')' : '';
        rows += '<div class="admin-health-check ' + (pass ? 'pass' : 'fail') + '">' +
            '<i data-lucide="' + (pass ? 'check-circle-2' : 'x-circle') + '"></i>' +
            '<span style="flex:1">' + esc(hc.label) + detail + '</span>' +
            '<span style="font-size:11px;color:var(--text4)">' + hc.weight + 'pts</span>' +
            (!pass && hc.fix ? '<span class="admin-health-fix">' + esc(hc.fix) + '</span>' : '') +
            '</div>';
    });
    var pct = total > 0 ? Math.round((score / total) * 100) : 0;
    var color = pct >= 80 ? 'var(--green)' : (pct >= 50 ? 'var(--amber)' : 'var(--red)');

    return '<div class="admin-section"><div class="admin-section-title" style="margin-bottom:16px">System Health</div>' +
        '<div class="admin-health-wrap">' +
        '<div class="admin-health-ring">' + svgRing(pct, color) +
        '<div style="font-size:12px;color:var(--text3)">' + score + ' / ' + total + ' points</div></div>' +
        '<div class="admin-health-checks">' + rows + '</div></div></div>';
}

function svgRing(pct, color) {
    var r = 50, c = 2 * Math.PI * r;
    var offset = c - (pct / 100) * c;
    return '<svg width="120" height="120" viewBox="0 0 120 120">' +
        '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="var(--border)" stroke-width="8"/>' +
        '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="8" ' +
        'stroke-dasharray="' + c + '" stroke-dashoffset="' + offset + '" stroke-linecap="round" ' +
        'transform="rotate(-90 60 60)" style="transition:stroke-dashoffset .5s ease"/>' +
        '<text x="60" y="60" text-anchor="middle" dominant-baseline="central" ' +
        'style="font-size:24px;font-weight:700;fill:' + color + '">' + pct + '</text></svg>';
}

// ─── Data Integrity Helpers ───
function findOrphanedClients() {
    var refs = {};
    A_DB.forEach(function(p) {
        if (p.client && p.client.email) refs[p.client.email.toLowerCase()] = true;
    });
    return A_CLIENTS.filter(function(c) {
        return !refs[(c.email || '').toLowerCase()];
    });
}

function findCorruptProposals() {
    return A_DB.filter(function(p) {
        if (!p.id || typeof p.id !== 'string') return true;
        if (!p.title && !p.number) return true;
        if (p.lineItems && !Array.isArray(p.lineItems)) return true;
        if (p.sections && !Array.isArray(p.sections)) return true;
        if (p.payments && !Array.isArray(p.payments)) return true;
        if (p.discount != null && (isNaN(p.discount) || p.discount < 0)) return true;
        if (p.taxRate != null && (isNaN(p.taxRate) || p.taxRate < 0 || p.taxRate > 100)) return true;
        if ((p.lineItems || []).some(function(i) { return isNaN(i.qty) || isNaN(i.rate); })) return true;
        return false;
    });
}

function findExpiredNotHandled() {
    var today = new Date().toISOString().split('T')[0];
    return A_DB.filter(function(p) {
        return p.status === 'sent' && p.validUntil && p.validUntil < today;
    });
}

function getStoragePercent() {
    return (getTotalStorageSize() / (5 * 1024 * 1024)) * 100;
}

function lastBackupDays() {
    var cfg = safeGet('pk_admin_config', {});
    if (!cfg.lastBackup) return Infinity;
    return Math.floor((Date.now() - cfg.lastBackup) / 86400000);
}

// ─── System Info ───
function buildSystemInfo() {
    var largest = { title: 'none', size: 0 };
    A_DB.forEach(function(p) {
        var s = JSON.stringify(p).length;
        if (s > largest.size) { largest = { title: p.title || p.id, size: s }; }
    });
    var snapshots = A_DB.reduce(function(sum, p) { return sum + (p.versionHistory ? p.versionHistory.length : 0); }, 0);
    var tokens = A_DB.filter(function(p) { return !!p.shareToken; });
    var dupeTokens = tokens.length - new Set(tokens.map(function(p) { return p.shareToken; })).size;

    var rows = [
        ['Browser', parseBrowser()],
        ['PWA Mode', window.matchMedia('(display-mode: standalone)').matches ? 'Yes' : 'No'],
        ['Service Worker', (navigator.serviceWorker && navigator.serviceWorker.controller) ? 'Active' : 'Not active'],
        ['Theme', localStorage.getItem('pk_theme') || 'light'],
        ['localStorage Keys', localStorage.length + ''],
        ['Total Storage', fmtBytes(getTotalStorageSize())],
        ['Proposals', A_DB.length + ''],
        ['Clients', A_CLIENTS.length + ''],
        ['Users', (A_USERS || []).length + ''],
        ['Tickets', (A_TICKETS || []).length + ' (' + (A_TICKETS || []).filter(function(t) { return t.status === 'open'; }).length + ' open)'],
        ['Subscriptions', (A_SUBSCRIPTIONS || []).length + ''],
        ['Announcements', (A_ANNOUNCEMENTS || []).length + ' (' + (A_ANNOUNCEMENTS || []).filter(function(a) { return a.status === 'active'; }).length + ' active)'],
        ['Feedback', (A_FEEDBACK || []).length + ''],
        ['Analytics Events', (A_ANALYTICS || []).length + ''],
        ['Largest Proposal', esc(largest.title) + ' (' + fmtBytes(largest.size) + ')'],
        ['Version Snapshots', snapshots + ' total'],
        ['Share Tokens', tokens.length + (dupeTokens > 0 ? ' (' + dupeTokens + ' DUPLICATES!)' : '')],
        ['Section Library', A_SECLIB.length + ' items'],
        ['T&C Library', A_TCLIB.length + ' items'],
        ['Email Templates', A_EMAIL_TPL.length + ' items']
    ];

    var html = '<div class="admin-section"><div class="admin-section-title" style="margin-bottom:12px">System Info</div>' +
        '<div class="admin-table-wrap"><table class="admin-info-table">';
    rows.forEach(function(r) {
        html += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>';
    });
    html += '</table></div></div>';
    return html;
}

function parseBrowser() {
    var ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    return 'Unknown';
}
