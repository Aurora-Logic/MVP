// ════════════════════════════════════════
// SIDEBAR — Refresh and update functions
// ════════════════════════════════════════

/* exported refreshSide */

async function refreshSide() {
    // Update counts (using optional chaining)
    const propCnt = document.getElementById('propCnt');
    const clientCnt = document.getElementById('clientCnt');
    if (propCnt) propCnt.textContent = DB.filter(p => !p.archived).length;
    if (clientCnt) clientCnt.textContent = CLIENTS.length;

    // Update branding (using optional chaining)
    const brandName = CONFIG?.brandName || CONFIG?.name || 'ProposalKit';
    const brandInitial = brandName.charAt(0).toUpperCase();
    const sideTeamName = document.querySelector('.side-team-name');
    const sideLogo = document.getElementById('sideLogo');
    if (sideTeamName) sideTeamName.textContent = brandName;
    if (sideLogo) sideLogo.textContent = brandInitial;

    // Update user info (using optional chaining)
    const name = CONFIG?.name || 'User';
    const email = CONFIG?.email || '';
    const initial = name.charAt(0).toUpperCase();
    const sideUserName = document.getElementById('sideUserName');
    const sideUserEmail = document.getElementById('sideUserEmail');
    const sideUserAvatar = document.getElementById('sideUserAvatar');
    if (sideUserName) sideUserName.textContent = name;
    if (sideUserEmail) sideUserEmail.textContent = email || 'Settings';
    if (sideUserAvatar) sideUserAvatar.textContent = initial;

    // Update recent proposals list
    updateRecentList();

    // Show/hide admin nav button based on permissions (using optional chaining)
    const adminBtn = document.getElementById('adminNavBtn');
    if (adminBtn) {
        // Check if user is admin
        const isAdminUser = typeof isAdmin === 'function' ? await isAdmin() : false;
        adminBtn.style.display = isAdminUser ? '' : 'none';
    }
}

function updateRecentList() {
    const container = document.getElementById('recentList');
    if (!container) return;

    const recent = DB
        .filter(p => !p.archived)
        .sort((a, b) => b.editedAt - a.editedAt)
        .slice(0, 5);

    if (recent.length === 0) {
        container.innerHTML = '<div class="side-empty">No recent proposals</div>';
        return;
    }

    container.innerHTML = recent.map(p => {
        const statusClass = {
            'draft': 'side-recent-status-draft',
            'sent': 'side-recent-status-sent',
            'accepted': 'side-recent-status-accepted',
            'declined': 'side-recent-status-declined'
        }[p.status] || 'side-recent-status-draft';

        return `
            <button class="side-recent-item" onclick="navigate('/proposals/${esc(p.id)}')">
                <div class="side-recent-title">${esc(p.title || 'Untitled')}</div>
                <div class="side-recent-meta">
                    <span class="${statusClass}">${esc(p.status || 'draft')}</span>
                </div>
            </button>`;
    }).join('');

    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}
