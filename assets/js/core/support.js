// ════════════════════════════════════════
// SUPPORT — In-App Ticket Widget
// ════════════════════════════════════════
/* exported initSupportWidget, toggleSupportPanel */

let _supportTab = 'tickets';

function initSupportWidget() {
    if (document.getElementById('supportBtn')) return;
    // Floating button
    const btn = document.createElement('button');
    btn.id = 'supportBtn';
    btn.setAttribute('aria-label', 'Help and support');
    btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:1000;width:48px;height:48px;' +
        'border-radius:50%;background:var(--primary);color:#fff;border:none;cursor:pointer;' +
        'box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;' +
        'transition:transform 200ms ease-out,box-shadow 200ms ease-out';
    btn.innerHTML = '<i data-lucide="circle-help" style="width:22px;height:22px"></i>' +
        '<span id="supportDot" style="position:absolute;top:2px;right:2px;width:10px;height:10px;border-radius:50%;background:var(--red);display:none"></span>';
    btn.onclick = toggleSupportPanel;
    document.body.appendChild(btn);
    // Panel
    const panel = document.createElement('div');
    panel.id = 'supportPanel';
    panel.style.cssText = 'position:fixed;top:0;right:0;bottom:0;width:360px;z-index:999;background:var(--background);' +
        'border-left:1px solid var(--border);box-shadow:-4px 0 24px rgba(0,0,0,0.08);transform:translateX(100%);' +
        'transition:transform 200ms ease-out;display:flex;flex-direction:column';
    panel.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid var(--border)">' +
        '<strong style="font-size:15px">Help & Support</strong>' +
        '<button class="btn-sm-icon-ghost" onclick="toggleSupportPanel()"><i data-lucide="x" style="width:16px;height:16px"></i></button></div>' +
        '<div id="supportTabs" style="display:flex;border-bottom:1px solid var(--border)">' +
        '<button class="sp-tab on" data-tab="tickets" onclick="showSupportTab(\'tickets\')">My Tickets</button>' +
        '<button class="sp-tab" data-tab="new" onclick="showSupportTab(\'new\')">New Ticket</button>' +
        '<button class="sp-tab" data-tab="help" onclick="showSupportTab(\'help\')">Quick Help</button></div>' +
        '<div id="supportBody" style="flex:1;overflow-y:auto;padding:16px"></div>';
    document.body.appendChild(panel);
    // Tab styles
    const style = document.createElement('style');
    style.textContent = '.sp-tab{flex:1;padding:10px;border:none;background:none;font-size:13px;cursor:pointer;color:var(--muted-foreground);' +
        'border-bottom:2px solid transparent;transition:all 200ms}.sp-tab.on{color:var(--foreground);font-weight:600;border-bottom-color:var(--primary)}';
    document.head.appendChild(style);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    loadMyTickets();
    _spCheckUnread();
}

function toggleSupportPanel() {
    const panel = document.getElementById('supportPanel');
    if (!panel) return;
    const open = panel.style.transform === 'translateX(0px)';
    panel.style.transform = open ? 'translateX(100%)' : 'translateX(0px)';
}

function showSupportTab(tab) {
    _supportTab = tab;
    const tabs = document.querySelectorAll('.sp-tab');
    for (let i = 0; i < tabs.length; i++) tabs[i].classList.toggle('on', tabs[i].dataset.tab === tab);
    if (tab === 'tickets') loadMyTickets();
    else if (tab === 'new') _spNewForm();
    else if (tab === 'help') _spQuickHelp();
}

function loadMyTickets() {
    const body = document.getElementById('supportBody');
    if (!body) return;
    const tickets = typeof safeGetStorage === 'function' ? safeGetStorage('pk_tickets', []) : [];
    const userId = (typeof CONFIG !== 'undefined' && CONFIG.activeUserId) || '';
    const email = (typeof CONFIG !== 'undefined' && CONFIG.email) || '';
    const mine = tickets.filter(function(t) { return t.userId === userId || t.userEmail === email; });
    mine.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    if (!mine.length) { body.innerHTML = '<div style="text-align:center;padding:32px;color:var(--muted-foreground);font-size:13px">No tickets yet</div>'; return; }
    let html = '';
    for (let i = 0; i < mine.length; i++) {
        const t = mine[i];
        const sc = { open: '#3b82f6', 'in-progress': '#f59e0b', resolved: '#16a34a', closed: '#71717a' };
        let lastMsg = (t.messages && t.messages.length) ? t.messages[t.messages.length - 1].text || '' : '';
        if (lastMsg.length > 60) lastMsg = lastMsg.substring(0, 60) + '\u2026';
        html += '<div onclick="showTicketDetail(\'' + (typeof esc === 'function' ? esc(t.id) : t.id) + '\')" style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer;transition:background 200ms" onmouseenter="this.style.background=\'var(--muted)\'" onmouseleave="this.style.background=\'transparent\'">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
        html += '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:' + (sc[t.status] || '#71717a') + '"></span>';
        html += '<strong style="font-size:13px;flex:1">' + (typeof esc === 'function' ? esc(t.subject || '') : t.subject || '') + '</strong>';
        html += '<span style="font-size:11px;color:var(--muted-foreground)">' + (t.createdAt && typeof timeAgo === 'function' ? timeAgo(t.createdAt) : '') + '</span>';
        html += '</div>';
        if (lastMsg) html += '<div style="font-size:12px;color:var(--muted-foreground)">' + (typeof esc === 'function' ? esc(lastMsg) : lastMsg) + '</div>';
        html += '</div>';
    }
    body.innerHTML = html;
}

function showTicketDetail(id) {
    const body = document.getElementById('supportBody');
    if (!body) return;
    const tickets = typeof safeGetStorage === 'function' ? safeGetStorage('pk_tickets', []) : [];
    let t = null;
    for (let i = 0; i < tickets.length; i++) if (tickets[i].id === id) { t = tickets[i]; break; }
    if (!t) return;
    let html = '<div style="margin-bottom:12px"><button class="btn-sm-ghost" onclick="showSupportTab(\'tickets\')">\u2190 Back</button></div>';
    html += '<div style="font-weight:600;font-size:14px;margin-bottom:12px">' + (typeof esc === 'function' ? esc(t.subject || '') : t.subject || '') + '</div>';
    html += '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">';
    const msgs = t.messages || [];
    for (let j = 0; j < msgs.length; j++) {
        const m = msgs[j];
        const isAdmin = m.from === 'admin';
        html += '<div style="display:flex;flex-direction:column;align-items:' + (isAdmin ? 'flex-start' : 'flex-end') + '">';
        html += '<div style="max-width:80%;padding:10px 14px;border-radius:12px;font-size:13px;background:' + (isAdmin ? 'var(--muted)' : 'var(--primary)') + ';color:' + (isAdmin ? 'var(--foreground)' : '#fff') + '">';
        html += (typeof esc === 'function' ? esc(m.text || '') : m.text || '');
        html += '<div style="font-size:10px;opacity:0.7;margin-top:4px">' + (m.ts && typeof timeAgo === 'function' ? timeAgo(m.ts) : '') + '</div>';
        html += '</div></div>';
    }
    html += '</div>';
    if (t.status !== 'resolved' && t.status !== 'closed') {
        html += '<div style="display:flex;gap:8px"><textarea id="spReply" rows="2" placeholder="Type a reply\u2026" style="flex:1;resize:none;font-size:13px;padding:8px;border:1px solid var(--border);border-radius:8px"></textarea>';
        html += '<button class="btn btn-sm" onclick="_spSendReply(\'' + (typeof esc === 'function' ? esc(t.id) : t.id) + '\')" style="align-self:flex-end">Send</button></div>';
    }
    body.innerHTML = html;
}

function _spSendReply(ticketId) {
    const ta = document.getElementById('spReply');
    if (!ta || !ta.value.trim()) return;
    const tickets = typeof safeGetStorage === 'function' ? safeGetStorage('pk_tickets', []) : [];
    for (let i = 0; i < tickets.length; i++) {
        if (tickets[i].id === ticketId) {
            if (!tickets[i].messages) tickets[i].messages = [];
            tickets[i].messages.push({ from: 'user', text: ta.value.trim(), ts: Date.now() });
            break;
        }
    }
    try { localStorage.setItem('pk_tickets', JSON.stringify(tickets)); } catch (e) { /* full */ }
    showTicketDetail(ticketId);
}

function _spNewForm() {
    const body = document.getElementById('supportBody');
    if (!body) return;
    body.innerHTML = '<div style="display:flex;flex-direction:column;gap:14px">' +
        '<div><label class="fl">Subject</label><input id="spSubj" placeholder="Brief summary" style="font-size:13px"></div>' +
        '<div><label class="fl">Category</label><select id="spCat" style="font-size:13px"><option value="general">General</option><option value="bug">Bug Report</option><option value="feature">Feature Request</option><option value="billing">Billing</option></select></div>' +
        '<div><label class="fl">Description</label><textarea id="spDesc" rows="5" placeholder="Describe your issue\u2026" style="font-size:13px;resize:vertical"></textarea></div>' +
        '<button class="btn btn-sm" onclick="_spSubmit()" style="align-self:flex-start">Submit Ticket</button></div>';
}

function _spSubmit() {
    const subj = document.getElementById('spSubj');
    const desc = document.getElementById('spDesc');
    const cat = document.getElementById('spCat');
    if (!subj || !subj.value.trim()) { if (typeof toast === 'function') toast('Enter a subject', 'error'); return; }
    if (!desc || !desc.value.trim()) { if (typeof toast === 'function') toast('Describe the issue', 'error'); return; }
    const ticket = {
        id: 'tk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        subject: subj.value.trim(), category: cat ? cat.value : 'general', status: 'open',
        priority: 'medium',
        userId: (typeof CONFIG !== 'undefined' && CONFIG.activeUserId) || '',
        userEmail: (typeof CONFIG !== 'undefined' && CONFIG.email) || '',
        userName: (typeof CONFIG !== 'undefined' && CONFIG.name) || '',
        createdAt: Date.now(), updatedAt: Date.now(), resolvedAt: null,
        messages: [{ id: Date.now().toString(36), from: 'user', text: desc.value.trim(), ts: Date.now() }],
        internalNotes: [], assignedTo: ''
    };
    const tickets = typeof safeGetStorage === 'function' ? safeGetStorage('pk_tickets', []) : [];
    tickets.push(ticket);
    try { localStorage.setItem('pk_tickets', JSON.stringify(tickets)); } catch (e) { /* full */ }
    if (typeof toast === 'function') toast('Ticket submitted!');
    showSupportTab('tickets');
}

function _spQuickHelp() {
    const body = document.getElementById('supportBody');
    if (!body) return;
    const links = [
        { icon: 'terminal', label: 'Keyboard Shortcuts (\u2318K)', action: "if(typeof openCommandPalette==='function')openCommandPalette();toggleSupportPanel()" },
        { icon: 'settings', label: 'Settings', action: "if(typeof goNav==='function')goNav('settings');toggleSupportPanel()" },
        { icon: 'lightbulb', label: 'Feature Requests', action: "showSupportTab('new')" }
    ];
    let html = '<div style="display:flex;flex-direction:column;gap:4px">';
    for (let i = 0; i < links.length; i++) {
        html += '<button onclick="' + links[i].action + '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:none;background:none;cursor:pointer;border-radius:8px;width:100%;text-align:left;font-size:13px;color:var(--foreground);transition:background 200ms" onmouseenter="this.style.background=\'var(--muted)\'" onmouseleave="this.style.background=\'transparent\'">';
        html += '<i data-lucide="' + links[i].icon + '" style="width:16px;height:16px;color:var(--muted-foreground)"></i><span>' + links[i].label + '</span></button>';
    }
    html += '</div>';
    body.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function _spCheckUnread() {
    const dot = document.getElementById('supportDot');
    if (!dot) return;
    const tickets = typeof safeGetStorage === 'function' ? safeGetStorage('pk_tickets', []) : [];
    const userId = (typeof CONFIG !== 'undefined' && CONFIG.activeUserId) || '';
    const email = (typeof CONFIG !== 'undefined' && CONFIG.email) || '';
    let hasUnread = false;
    for (let i = 0; i < tickets.length; i++) {
        const t = tickets[i];
        if (t.userId !== userId && t.userEmail !== email) continue;
        const msgs = t.messages || [];
        if (!msgs.length) continue;
        let lastAdmin = 0, lastUser = 0;
        for (let j = 0; j < msgs.length; j++) {
            if (msgs[j].from === 'admin' && msgs[j].ts > lastAdmin) lastAdmin = msgs[j].ts;
            if (msgs[j].from === 'user' && msgs[j].ts > lastUser) lastUser = msgs[j].ts;
        }
        if (lastAdmin > lastUser) { hasUnread = true; break; }
    }
    dot.style.display = hasUnread ? 'block' : 'none';
}
