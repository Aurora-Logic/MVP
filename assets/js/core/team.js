// ════════════════════════════════════════
// TEAM — Local User Profiles & Roles
// ════════════════════════════════════════

const TEAM_COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5856D6', '#30B0C7', '#FF2D55'];
const VALID_ROLES = ['admin', 'editor', 'viewer'];

function initTeam() {
    if (!CONFIG) return;
    if (!CONFIG.team || !CONFIG.team.length) {
        CONFIG.team = [{
            id: 'u_' + Date.now().toString(36),
            name: CONFIG.name || 'Admin',
            email: CONFIG.email || '',
            role: 'admin',
            color: CONFIG.color || '#007AFF',
            createdAt: Date.now()
        }];
        CONFIG.activeUserId = CONFIG.team[0].id;
        saveConfig();
    }
    if (!CONFIG.activeUserId || !CONFIG.team.find(u => u.id === CONFIG.activeUserId)) {
        CONFIG.activeUserId = CONFIG.team[0].id;
        saveConfig();
    }
    updateSidebarUser();
}

function activeUser() {
    return (CONFIG?.team || []).find(u => u.id === CONFIG?.activeUserId) || CONFIG?.team?.[0];
}

function updateSidebarUser() {
    const el = document.getElementById('sideUserName');
    const btn = document.getElementById('sideUserBtn');
    const u = activeUser();
    if (btn) btn.style.display = (CONFIG?.team?.length > 1) ? '' : 'none';
    if (el && u) el.textContent = u.name;
}

function switchUser(userId) {
    if (!(CONFIG?.team || []).find(u => u.id === userId)) return;
    CONFIG.activeUserId = userId;
    saveConfig();
    updateSidebarUser();
    refreshSide();
    toast('Switched to ' + activeUser()?.name);
}

function addTeamMember(name, email, role) {
    if (!name) { toast('Name is required'); return null; }
    if (!CONFIG.team) CONFIG.team = [];
    const validRole = VALID_ROLES.includes(role) ? role : 'editor';
    const member = {
        id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        name, email: email || '', role: validRole,
        color: TEAM_COLORS[CONFIG.team.length % TEAM_COLORS.length],
        createdAt: Date.now()
    };
    CONFIG.team.push(member);
    saveConfig();
    return member;
}

function removeTeamMember(userId) {
    if ((CONFIG?.team || []).length <= 1) { toast('Cannot remove the last member'); return; }
    if (userId === CONFIG.activeUserId) { toast('Switch to another user first'); return; }
    const propCount = DB.filter(p => p.owner === userId).length;
    const msg = propCount > 0 ? `Remove this team member? ${propCount} proposal(s) will be reassigned to you.` : 'Remove this team member?';
    confirmDialog(msg, () => {
        // Reassign orphaned proposals to current user
        DB.forEach(p => {
            if (p.owner === userId) p.owner = CONFIG.activeUserId;
            if (p.lastEditedBy === userId) p.lastEditedBy = CONFIG.activeUserId;
        });
        persist();
        CONFIG.team = CONFIG.team.filter(u => u.id !== userId);
        saveConfig();
        renderSettings();
        toast('Member removed');
    }, { title: 'Remove Member', confirmText: 'Remove' });
}

function isAdmin() { return activeUser()?.role === 'admin'; }
function canEdit() { const r = activeUser()?.role; return r === 'admin' || r === 'editor'; }

function userAvatar(user, size) {
    const s = size || 24;
    const initial = (user?.name || 'U').charAt(0).toUpperCase();
    return `<div class="user-avi" style="width:${s}px;height:${s}px;background:${user?.color || '#007AFF'};font-size:${Math.round(s * 0.45)}px">${initial}</div>`;
}

function showUserSwitcher() {
    const existing = document.querySelector('.user-switcher');
    if (existing) { existing.remove(); return; }
    const btn = document.getElementById('sideUserBtn');
    if (!btn) return;
    const menu = document.createElement('div');
    menu.className = 'user-switcher';
    menu.innerHTML = (CONFIG?.team || []).map(u => `
        <button class="user-sw-item${u.id === CONFIG.activeUserId ? ' on' : ''}" onclick="switchUser('${escAttr(u.id)}');document.querySelector('.user-switcher')?.remove()">
            ${userAvatar(u, 28)}
            <div class="user-sw-info">
                <div class="user-sw-name">${esc(u.name)}${u.id === CONFIG.activeUserId ? ' <i data-lucide="check" style="width:12px;height:12px;color:var(--green)"></i>' : ''}</div>
                <div class="user-sw-role">${esc(u.role)}</div>
            </div>
        </button>
    `).join('');
    const rect = btn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
    menu.style.left = rect.left + 'px';
    document.body.appendChild(menu);
    lucide.createIcons();
    const close = (e) => { if (!menu.contains(e.target) && e.target !== btn) { menu.remove(); document.removeEventListener('click', close); } };
    setTimeout(() => document.addEventListener('click', close), 10);
}

function renderTeamSettings() {
    const members = CONFIG?.team || [];
    const rows = members.map(u => `
        <div class="team-row">
            ${userAvatar(u, 32)}
            <div class="team-info">
                <div class="team-name">${esc(u.name)}${u.id === CONFIG.activeUserId ? ' <span class="team-you">(You)</span>' : ''}</div>
                <div class="team-email">${esc(u.email)}</div>
            </div>
            <span class="team-role-badge team-role-${esc(u.role)}">${esc(u.role)}</span>
            ${u.id !== CONFIG.activeUserId && isAdmin() ? `<button class="btn-sm-icon-ghost" onclick="removeTeamMember('${escAttr(u.id)}')" data-tooltip="Remove"><i data-lucide="x"></i></button>` : ''}
        </div>
    `).join('');
    return `<div class="card card-p" style="margin-bottom:14px">
        <div class="card-head">
            <div><div class="card-t">Team</div><div class="card-d">Manage local user profiles</div></div>
            ${isAdmin() ? '<button class="btn-sm-outline" onclick="showAddMemberModal()"><i data-lucide="user-plus"></i> Add</button>' : ''}
        </div>
        <div id="teamList">${rows}</div>
    </div>`;
}

function showAddMemberModal() {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'addMemberModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    wrap.innerHTML = `<div class="modal" onclick="event.stopPropagation()">
        <div class="modal-t">Add Team Member</div>
        <div class="fg" style="margin-top:12px"><label class="fl">Name</label><input type="text" id="newMemberName" placeholder="Jane Smith"></div>
        <div class="fg"><label class="fl">Email</label><input type="email" id="newMemberEmail" placeholder="jane@example.com"></div>
        <div class="fg"><label class="fl">Role</label><div id="newMemberRole"></div></div>
        <div class="modal-foot">
            <button class="btn-sm-outline" onclick="document.getElementById('addMemberModal').remove()">Cancel</button>
            <button class="btn-sm" onclick="doAddMember()">Add Member</button>
        </div>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    if (typeof csel === 'function') {
        csel(document.getElementById('newMemberRole'), { value: 'editor', items: [
            { value: 'editor', label: 'Editor', desc: 'Can edit proposals' },
            { value: 'viewer', label: 'Viewer', desc: 'Read-only access' },
            { value: 'admin', label: 'Admin', desc: 'Full access' }
        ]});
    }
    document.getElementById('newMemberName')?.focus();
}

function doAddMember() {
    const name = document.getElementById('newMemberName')?.value.trim();
    const email = document.getElementById('newMemberEmail')?.value.trim();
    const role = (typeof cselGetValue === 'function' ? cselGetValue(document.getElementById('newMemberRole')) : document.getElementById('newMemberRole')?.value) || 'editor';
    if (!name) { toast('Name is required'); return; }
    addTeamMember(name, email, role);
    document.getElementById('addMemberModal')?.remove();
    renderSettings();
    toast(name + ' added to team');
}
