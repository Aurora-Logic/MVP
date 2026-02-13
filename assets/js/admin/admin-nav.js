// ════════════════════════════════════════
// ADMIN-NAV — Sidebar Navigation + Routing
// ════════════════════════════════════════

/* exported adminNav, renderAdminSidebar, toggleAdminTheme, toggleAdminSidebar, goBackToApp, adminRerender */

var ADMIN_NAV_GROUPS = [
    { label: 'Management', items: [
        { id: 'dashboard',     icon: 'layout-dashboard', label: 'Dashboard' },
        { id: 'users',         icon: 'users',            label: 'Users' },
        { id: 'proposals',     icon: 'file-text',        label: 'Proposals' },
        { id: 'clients',       icon: 'building-2',       label: 'Clients' }
    ]},
    { label: 'SaaS Operations', items: [
        { id: 'tickets',       icon: 'ticket',           label: 'Tickets' },
        { id: 'subscriptions', icon: 'credit-card',      label: 'Subscriptions' },
        { id: 'announcements', icon: 'megaphone',        label: 'Announcements' },
        { id: 'analytics',     icon: 'bar-chart-3',      label: 'Analytics' },
        { id: 'feedback',      icon: 'message-square-heart', label: 'Feedback' }
    ]},
    { label: 'Developer', items: [
        { id: 'templates',     icon: 'library',          label: 'Templates' },
        { id: 'config',        icon: 'settings',         label: 'Configuration' },
        { id: 'debug',         icon: 'bug',              label: 'Debug' },
        { id: 'tests',         icon: 'flask-conical',    label: 'Tests' },
        { id: 'audit',         icon: 'scroll-text',      label: 'Audit log' }
    ]}
];

var ADMIN_SECTIONS = ADMIN_NAV_GROUPS.reduce(function(arr, g) {
    return arr.concat(g.items);
}, []);

var ADMIN_RENDERERS = {
    dashboard:     'renderAdminDashboard',
    users:         'renderAdminUsers',
    proposals:     'renderAdminProposals',
    clients:       'renderAdminClients',
    tickets:       'renderAdminTickets',
    subscriptions: 'renderAdminSubscriptions',
    announcements: 'renderAdminAnnouncements',
    analytics:     'renderAdminAnalyticsView',
    feedback:      'renderAdminFeedback',
    templates:     'renderAdminTemplates',
    config:        'renderAdminConfig',
    debug:         'renderAdminDebug',
    tests:         'renderAdminTests',
    audit:         'renderAdminAudit'
};

function adminNav(section) {
    A_CURRENT_SECTION = section;
    document.querySelectorAll('.side-btn[data-section]').forEach(function(n) {
        n.classList.toggle('on', n.dataset.section === section);
    });
    var s = ADMIN_SECTIONS.find(function(s) { return s.id === section; });
    var topTitle = document.getElementById('adminTopTitle');
    if (topTitle) topTitle.textContent = s ? s.label : section;
    var sidebar = document.getElementById('adminSidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
    var overlay = document.getElementById('adminOverlay');
    if (overlay) overlay.classList.remove('show');
    var content = document.getElementById('adminContent');
    if (!content) return;
    content.scrollTop = 0;
    var fnName = ADMIN_RENDERERS[section];
    if (fnName && typeof window[fnName] === 'function') {
        window[fnName]();
    } else {
        content.innerHTML = '<div class="admin-section"><p style="color:var(--text3)">Section "' + esc(section) + '" is not available.</p></div>';
    }
    lucide.createIcons();
}

function renderAdminSidebar() {
    var nav = document.getElementById('adminNavList');
    if (!nav) return;
    var html = '';
    ADMIN_NAV_GROUPS.forEach(function(g) {
        html += '<div class="admin-nav-group-label">' + esc(g.label) + '</div>';
        html += '<div class="side-nav">';
        g.items.forEach(function(s) {
            html += '<button class="side-btn' + (s.id === A_CURRENT_SECTION ? ' on' : '') +
                '" data-section="' + s.id + '" onclick="adminNav(\'' + s.id + '\')">' +
                '<i data-lucide="' + s.icon + '"></i><span>' + s.label + '</span></button>';
        });
        html += '</div>';
    });
    nav.innerHTML = html;
    lucide.createIcons();
}

function toggleAdminTheme() {
    var current = localStorage.getItem('pk_theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('pk_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    adminToast('Theme: ' + next);
}

function toggleAdminSidebar() {
    var sidebar = document.getElementById('adminSidebar');
    var overlay = document.getElementById('adminOverlay');
    if (!sidebar) return;
    var isOpen = sidebar.classList.contains('mobile-open');
    sidebar.classList.toggle('mobile-open', !isOpen);
    if (overlay) overlay.classList.toggle('show', !isOpen);
}

function goBackToApp() {
    window.location.href = '/';
}

function adminRerender() {
    adminReload();
    adminNav(A_CURRENT_SECTION);
    adminToast('Refreshed');
}
