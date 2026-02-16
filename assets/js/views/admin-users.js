// ════════════════════════════════════════
// ADMIN USERS — User management
// ════════════════════════════════════════

/* exported renderAdminUsers, showUserDetail, grantSubscriptionModal */

function renderAdminUsers() {
    const users = getCachedUsers();

    return `
        <div class="admin-users">
            <div class="admin-section-header">
                <h2>Users</h2>
                <input type="text" id="userSearch" placeholder="Search users..." class="admin-search">
            </div>

            <div class="admin-users-table">
                <table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Plan</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        ${users.map(u => buildUserRow(u)).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function buildUserRow(user) {
    const sub = user.subscriptions?.[0];
    const plan = sub?.plan || 'free';
    const status = sub?.status || 'inactive';
    const created = user.created_at ? timeAgo(new Date(user.created_at).getTime()) : 'N/A';

    return `
        <tr onclick="showUserDetail('${escAttr(user.id)}')">
            <td>
                <div class="user-cell">
                    <div class="user-avatar">${(user.name || user.email || 'U').charAt(0).toUpperCase()}</div>
                    <div>
                        <div class="user-name">${esc(user.name || 'Unnamed')}</div>
                        <div class="user-email">${esc(user.email || '')}</div>
                    </div>
                </div>
            </td>
            <td><span class="badge badge-${plan}">${plan}</span></td>
            <td><span class="badge badge-${status}">${status}</span></td>
            <td>${created}</td>
            <td>
                <button class="btn-sm-icon-ghost" onclick="event.stopPropagation(); showUserDetail('${escAttr(user.id)}')">
                    <i data-lucide="more-horizontal"></i>
                </button>
            </td>
        </tr>
    `;
}

async function showUserDetail(userId) {
    const user = await fetchUserById(userId);
    if (!user) {
        toast('User not found', 'error');
        return;
    }

    const sub = user.subscriptions?.[0];

    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `
        <div class="modal" style="max-width:600px">
            <button class="modal-x" onclick="this.closest('.modal-wrap').remove()">×</button>

            <div class="user-detail-header">
                <div class="user-avatar-large">${(user.name || user.email || 'U').charAt(0).toUpperCase()}</div>
                <div>
                    <h2>${esc(user.name || 'Unnamed User')}</h2>
                    <div class="user-detail-email">${esc(user.email || '')}</div>
                </div>
            </div>

            <!-- User Info -->
            <div class="user-detail-section">
                <h3>User Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">User ID</div>
                        <div class="info-value">${user.id}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Role</div>
                        <div class="info-value">${user.role || 'user'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Created</div>
                        <div class="info-value">${fmtDate(user.created_at)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Last Login</div>
                        <div class="info-value">${user.last_login_at ? fmtDate(user.last_login_at) : 'N/A'}</div>
                    </div>
                </div>
            </div>

            <!-- Subscription Info -->
            <div class="user-detail-section">
                <h3>Subscription</h3>
                ${sub ? `
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Plan</div>
                            <div class="info-value"><span class="badge badge-${sub.plan}">${sub.plan}</span></div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Status</div>
                            <div class="info-value"><span class="badge badge-${sub.status}">${sub.status}</span></div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Period End</div>
                            <div class="info-value">${fmtDate(sub.current_period_end)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Proposals</div>
                            <div class="info-value">${sub.proposals_created || 0} / ${sub.proposals_limit || '∞'}</div>
                        </div>
                    </div>
                ` : '<div class="empty-d">No active subscription</div>'}
            </div>

            <!-- Actions -->
            <div class="user-detail-actions">
                <button class="btn-sm-outline" onclick="grantSubscriptionModal('${escAttr(userId)}')">
                    <i data-lucide="gift"></i> Grant Subscription
                </button>
                <button class="btn-sm-outline" onclick="editUserModal('${escAttr(userId)}')">
                    <i data-lucide="edit"></i> Edit Profile
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

function grantSubscriptionModal(userId) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `
        <div class="modal" style="max-width:500px">
            <button class="modal-x" onclick="this.closest('.modal-wrap').remove()">×</button>

            <h2>Grant Free Subscription</h2>

            <form id="grantSubForm" onsubmit="submitGrantSubscription(event, '${escAttr(userId)}')">
                <div class="fg">
                    <label class="fl">Plan</label>
                    <select id="grantPlan" required>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="team">Team</option>
                    </select>
                </div>

                <div class="fg">
                    <label class="fl">Duration (days)</label>
                    <input type="number" id="grantDuration" value="30" min="1" max="365" required>
                </div>

                <div class="fg">
                    <label class="fl">Reason *</label>
                    <textarea id="grantReason" rows="3" required placeholder="Why are you granting this subscription?"></textarea>
                </div>

                <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:24px">
                    <button type="button" class="btn-outline" onclick="this.closest('.modal-wrap').remove()">Cancel</button>
                    <button type="submit" class="btn">Grant Subscription</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

async function _submitGrantSubscription(e, userId) {
    e.preventDefault();

    const plan = document.getElementById('grantPlan').value;
    const duration = parseInt(document.getElementById('grantDuration').value);
    const reason = document.getElementById('grantReason').value.trim();

    if (!reason) {
        toast('Please provide a reason', 'warning');
        return;
    }

    const result = await grantFreeSubscription(userId, plan, duration, reason);

    if (!result.error) {
        document.querySelectorAll('.modal-wrap').forEach(m => m.remove());
        await refreshAdminData(true);
        refreshAdminUI();
    }
}

function _editUserModal(userId) {
    // Placeholder for user profile editing
    toast('User editing coming soon', 'info');
}

// Search functionality
window.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#usersTableBody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }
});
