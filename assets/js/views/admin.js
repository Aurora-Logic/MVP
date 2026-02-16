// ════════════════════════════════════════
// ADMIN — Admin Panel Main View
// ════════════════════════════════════════

/* exported renderAdmin, setAdminTab, refreshAdminUI */

let currentAdminTab = 'dashboard';

async function renderAdmin() {
    try {
        // Permission check
        console.warn('[Admin] Checking admin permissions...');
        const isAdminUser = await isAdmin();
        if (!isAdminUser) {
            console.warn('[Admin] Access denied - not an admin user');
            navigate('/dashboard');
            toast('Access denied - Admin access required', 'error');
            return;
        }

        console.warn('[Admin] Admin access granted');
        CUR = null;
        if (typeof hideTOC === 'function') hideTOC();

        document.getElementById('topTitle').textContent = 'Admin Panel';
        const topSearch = document.getElementById('topSearch');
        if (topSearch) topSearch.style.display = 'none';

        // Get tab from URL
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab') || 'dashboard';

        const body = document.getElementById('bodyScroll');
        body.innerHTML = `
            <div class="admin-layout">
                <!-- Sidebar navigation -->
                <nav class="admin-nav">
                    <div class="admin-nav-group">
                        <div class="admin-nav-label">Overview</div>
                        <button class="admin-nav-item" data-tab="dashboard" onclick="setAdminTab('dashboard')">
                            <i data-lucide="layout-dashboard"></i> Dashboard
                        </button>
                    </div>

                    <div class="admin-nav-group">
                        <div class="admin-nav-label">Management</div>
                        <button class="admin-nav-item" data-tab="users" onclick="setAdminTab('users')">
                            <i data-lucide="users"></i> Users
                        </button>
                        <button class="admin-nav-item" data-tab="tickets" onclick="setAdminTab('tickets')">
                            <i data-lucide="headphones"></i> Tickets
                        </button>
                    </div>

                    <div class="admin-nav-group">
                        <div class="admin-nav-label">Insights</div>
                        <button class="admin-nav-item" data-tab="analytics" onclick="setAdminTab('analytics')">
                            <i data-lucide="bar-chart-3"></i> Analytics
                        </button>
                    </div>
                </nav>

                <!-- Content area -->
                <div class="admin-content" id="adminPanel">
                    <div class="loading-spinner">
                        <i data-lucide="loader" class="spin"></i> Loading admin data...
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();

        // Initialize admin sync
        console.warn('[Admin] Initializing admin sync...');
        const initialized = await initAdminSync();

        if (!initialized) {
            console.error('[Admin] Failed to initialize admin sync');
            body.innerHTML = `
                <div class="empty" style="min-height:60vh;display:flex;align-items:center;justify-content:center">
                    <div style="text-align:center;max-width:440px">
                        <div style="font-size:48px;margin-bottom:16px">⚠️</div>
                        <div class="empty-t">Failed to load admin panel</div>
                        <div class="empty-d" style="margin-bottom:24px">Unable to connect to admin services. Please check your connection and try again.</div>
                        <button class="btn" onclick="renderAdmin()"><i data-lucide="refresh-cw"></i> Retry</button>
                        <button class="btn-outline" style="margin-left:8px" onclick="navigate('/dashboard')">Back to Dashboard</button>
                    </div>
                </div>`;
            lucide.createIcons();
            return;
        }

        console.warn('[Admin] Admin sync initialized successfully');
        // Set initial tab
        setAdminTab(tab);
    } catch (error) {
        console.error('[Admin] renderAdmin error:', error);
        const body = document.getElementById('bodyScroll');
        if (body) {
            body.innerHTML = `
                <div class="empty" style="min-height:60vh;display:flex;align-items:center;justify-content:center">
                    <div style="text-align:center;max-width:440px">
                        <div style="font-size:48px;margin-bottom:16px">⚠️</div>
                        <div class="empty-t">Something went wrong</div>
                        <div class="empty-d" style="margin-bottom:24px">${esc(error.message || 'An unexpected error occurred while loading the admin panel.')}</div>
                        <button class="btn" onclick="renderAdmin()"><i data-lucide="refresh-cw"></i> Retry</button>
                        <button class="btn-outline" style="margin-left:8px" onclick="navigate('/dashboard')">Back to Dashboard</button>
                    </div>
                </div>`;
            lucide.createIcons();
        }
        toast('Failed to load admin panel', 'error');
    }
}

function setAdminTab(tab) {
    currentAdminTab = tab;

    // Update URL
    const url = tab === 'dashboard' ? '/admin' : `/admin?tab=${tab}`;
    if (window.location.pathname + window.location.search !== url) {
        history.replaceState({ path: url }, '', url);
    }

    // Update nav active state
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
        btn.classList.toggle('on', btn.dataset.tab === tab);
    });

    // Render content
    const panel = document.getElementById('adminPanel');
    if (!panel) return;

    const renderers = {
        dashboard: renderAdminDashboard,
        users: renderAdminUsers,
        tickets: renderAdminTickets,
        analytics: renderAdminAnalytics
    };

    const renderer = renderers[tab] || renderers.dashboard;
    panel.innerHTML = renderer();

    lucide.createIcons();
}

function renderAdminDashboard() {
    const analytics = getCachedAnalytics();
    const tickets = getCachedTickets();

    if (!analytics) {
        return '<div class="loading-spinner"><i data-lucide="loader" class="spin"></i> Loading analytics...</div>';
    }

    const recentTickets = tickets.slice(0, 5);

    return `
        <div class="admin-dashboard">
            <div class="admin-section-header">
                <h2>Dashboard</h2>
                <button class="btn-sm-outline" onclick="refreshAdminData(true).then(() => setAdminTab('dashboard'))">
                    <i data-lucide="refresh-cw"></i> Refresh
                </button>
            </div>

            <!-- Metric cards -->
            <div class="admin-metric-grid">
                <div class="admin-metric-card">
                    <div class="admin-metric-icon"><i data-lucide="users"></i></div>
                    <div class="admin-metric-value">${analytics.totalUsers || 0}</div>
                    <div class="admin-metric-label">Total Users</div>
                    <div class="admin-metric-trend">+${analytics.newUsersThisMonth || 0} this month</div>
                </div>

                <div class="admin-metric-card">
                    <div class="admin-metric-icon"><i data-lucide="zap"></i></div>
                    <div class="admin-metric-value">${analytics.activeSubscriptions || 0}</div>
                    <div class="admin-metric-label">Active Subscriptions</div>
                </div>

                <div class="admin-metric-card">
                    <div class="admin-metric-icon"><i data-lucide="dollar-sign"></i></div>
                    <div class="admin-metric-value">₹${fmtNum(analytics.mrr || 0)}</div>
                    <div class="admin-metric-label">MRR</div>
                    <div class="admin-metric-trend">ARR: ₹${fmtNum(analytics.arr || 0)}</div>
                </div>

                <div class="admin-metric-card">
                    <div class="admin-metric-icon"><i data-lucide="help-circle"></i></div>
                    <div class="admin-metric-value">${analytics.openTickets || 0}</div>
                    <div class="admin-metric-label">Open Tickets</div>
                    <div class="admin-metric-trend">Avg ${analytics.avgResolutionTimeHours || 0}h resolution</div>
                </div>
            </div>

            <!-- Recent tickets -->
            <div class="admin-section">
                <div class="admin-section-header">
                    <h3>Recent Tickets</h3>
                    <button class="btn-sm-ghost" onclick="setAdminTab('tickets')">View All</button>
                </div>
                ${recentTickets.length > 0 ? `
                    <div class="admin-ticket-list">
                        ${recentTickets.map(t => `
                            <div class="admin-ticket-item" onclick="showAdminTicketDetail('${escAttr(t.id)}')">
                                <div class="admin-ticket-subject">${esc(t.subject)}</div>
                                <div class="admin-ticket-meta">
                                    <span class="badge badge-${t.status}">${t.status}</span>
                                    <span class="badge badge-${t.priority}">${t.priority}</span>
                                    <span>${timeAgo(new Date(t.created_at).getTime())}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<div class="empty-d">No recent tickets</div>'}
            </div>
        </div>
    `;
}

function refreshAdminUI() {
    setAdminTab(currentAdminTab);
}

function _refreshAdminTicketsUI() {
    if (currentAdminTab === 'tickets' || currentAdminTab === 'dashboard') {
        refreshAdminUI();
    }
}
