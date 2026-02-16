// ════════════════════════════════════════
// ADMIN ANALYTICS — Analytics dashboard
// ════════════════════════════════════════

/* exported renderAdminAnalytics */

function renderAdminAnalytics() {
    const analytics = getCachedAnalytics();

    if (!analytics) {
        return '<div class="loading-spinner"><i data-lucide="loader" class="spin"></i> Loading analytics...</div>';
    }

    return `
        <div class="admin-analytics">
            <div class="admin-section-header">
                <h2>Analytics</h2>
                <button class="btn-sm-outline" onclick="refreshAdminData(true).then(() => setAdminTab('analytics'))">
                    <i data-lucide="refresh-cw"></i> Refresh
                </button>
            </div>

            <!-- Overview metrics -->
            <div class="analytics-overview">
                <div class="analytics-card">
                    <div class="analytics-card-header">
                        <i data-lucide="trending-up"></i>
                        <h3>Revenue</h3>
                    </div>
                    <div class="analytics-card-body">
                        <div class="analytics-big-number">₹${fmtNum(analytics.revenueThisMonth)}</div>
                        <div class="analytics-label">This Month</div>
                    </div>
                </div>

                <div class="analytics-card">
                    <div class="analytics-card-header">
                        <i data-lucide="repeat"></i>
                        <h3>MRR</h3>
                    </div>
                    <div class="analytics-card-body">
                        <div class="analytics-big-number">₹${fmtNum(analytics.mrr)}</div>
                        <div class="analytics-label">Monthly Recurring Revenue</div>
                        <div class="analytics-small">ARR: ₹${fmtNum(analytics.arr)}</div>
                    </div>
                </div>

                <div class="analytics-card">
                    <div class="analytics-card-header">
                        <i data-lucide="users"></i>
                        <h3>Users</h3>
                    </div>
                    <div class="analytics-card-body">
                        <div class="analytics-big-number">${analytics.totalUsers}</div>
                        <div class="analytics-label">Total Users</div>
                        <div class="analytics-small">+${analytics.newUsersThisMonth} this month</div>
                    </div>
                </div>

                <div class="analytics-card">
                    <div class="analytics-card-header">
                        <i data-lucide="percent"></i>
                        <h3>Churn Rate</h3>
                    </div>
                    <div class="analytics-card-body">
                        <div class="analytics-big-number">${analytics.churnRate}%</div>
                        <div class="analytics-label">Last 30 Days</div>
                    </div>
                </div>
            </div>

            <!-- Subscription breakdown -->
            <div class="analytics-section">
                <h3>Subscription Breakdown</h3>
                ${buildSubscriptionBreakdown()}
            </div>

            <!-- Ticket metrics -->
            <div class="analytics-section">
                <h3>Support Metrics</h3>
                <div class="analytics-metrics-grid">
                    <div class="metric-item">
                        <div class="metric-value">${analytics.openTickets}</div>
                        <div class="metric-label">Open Tickets</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">${analytics.avgResolutionTimeHours}h</div>
                        <div class="metric-label">Avg Resolution Time</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildSubscriptionBreakdown() {
    const users = getCachedUsers();

    const planCounts = {
        free: 0,
        pro: 0,
        team: 0
    };

    users.forEach(u => {
        const sub = u.subscriptions?.[0];
        const plan = sub?.plan || 'free';
        if (planCounts[plan] !== undefined) {
            planCounts[plan]++;
        }
    });

    const total = Object.values(planCounts).reduce((sum, count) => sum + count, 0);

    return `
        <div class="subscription-breakdown">
            ${Object.entries(planCounts).map(([plan, count]) => {
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                return `
                    <div class="breakdown-item">
                        <div class="breakdown-header">
                            <span class="breakdown-plan">${plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
                            <span class="breakdown-count">${count} users (${percentage}%)</span>
                        </div>
                        <div class="breakdown-bar">
                            <div class="breakdown-bar-fill breakdown-bar-${plan}" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}
