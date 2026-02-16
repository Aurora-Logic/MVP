// ════════════════════════════════════════
// SUPPORT — Ticket functions (used by feedback modal)
// ════════════════════════════════════════
/* exported loadMyTickets, showTicketDetail, submitNewTicket, spSendReply, hasUnreadTickets */
/* global getDeviceId */

function hasUnreadTickets() {
    const tickets = typeof safeGetStorage === 'function' ? safeGetStorage('pk_tickets', []) : [];
    const userId = typeof getDeviceId === 'function' ? getDeviceId() : ((CONFIG?.activeUserId) || '');
    const email = (CONFIG?.email) || '';
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
        if (lastAdmin > lastUser) return true;
    }
    return false;
}

function loadMyTickets(container) {
    if (!container) return;
    const tickets = typeof safeGetStorage === 'function' ? safeGetStorage('pk_tickets', []) : [];
    const userId = typeof getDeviceId === 'function' ? getDeviceId() : ((CONFIG?.activeUserId) || '');
    const email = (CONFIG?.email) || '';
    const mine = tickets.filter(t => t.userId === userId || t.userEmail === email);
    mine.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (!mine.length) {
        container.innerHTML = '<div style="text-align:center;padding:32px;color:var(--muted-foreground);font-size:13px">No tickets yet. Submit one using the "New Ticket" tab.</div>';
        return;
    }
    let html = '';
    for (let i = 0; i < mine.length; i++) {
        const t = mine[i];
        const _cv = (v, fb) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb;
        const sc = { open: _cv('--blue', '#3b82f6'), 'in-progress': _cv('--amber', '#f59e0b'), resolved: _cv('--green', '#16a34a'), closed: _cv('--muted-foreground', '#71717a') };
        let lastMsg = (t.messages && t.messages.length) ? t.messages[t.messages.length - 1].text || '' : '';
        if (lastMsg.length > 60) lastMsg = lastMsg.substring(0, 60) + '\u2026';
        html += `<div onclick="showTicketDetail('${typeof esc === 'function' ? esc(t.id) : t.id}')" style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer;transition:background 200ms" onmouseenter="this.style.background='var(--muted)'" onmouseleave="this.style.background='transparent'">`;
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
        html += `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${sc[t.status] || '#71717a'}"></span>`;
        html += `<strong style="font-size:13px;flex:1">${typeof esc === 'function' ? esc(t.subject || '') : t.subject || ''}</strong>`;
        html += `<span style="font-size:11px;color:var(--muted-foreground)">${t.createdAt && typeof timeAgo === 'function' ? timeAgo(t.createdAt) : ''}</span>`;
        html += '</div>';
        if (lastMsg) html += `<div style="font-size:12px;color:var(--muted-foreground)">${typeof esc === 'function' ? esc(lastMsg) : lastMsg}</div>`;
        html += '</div>';
    }
    container.innerHTML = html;
}

function showTicketDetail(id) {
    const container = document.getElementById('fbTabBody');
    if (!container) return;
    const tickets = typeof safeGetStorage === 'function' ? safeGetStorage('pk_tickets', []) : [];
    const t = tickets.find(tk => tk.id === id);
    if (!t) return;
    let html = '<div style="margin-bottom:12px"><button class="btn-sm-ghost" onclick="setFbTab(\'tickets\')"><i data-lucide="arrow-left" style="width:14px;height:14px"></i> Back</button></div>';
    html += `<div style="font-weight:600;font-size:14px;margin-bottom:4px">${typeof esc === 'function' ? esc(t.subject || '') : t.subject || ''}</div>`;
    const sc = { open: 'Blue', 'in-progress': 'Orange', resolved: 'Green', closed: 'Gray' };
    html += `<div style="font-size:11px;color:var(--muted-foreground);margin-bottom:12px">${sc[t.status] || t.status} &middot; ${t.createdAt && typeof fmtDate === 'function' ? fmtDate(t.createdAt) : ''}</div>`;
    html += '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">';
    const msgs = t.messages || [];
    for (let j = 0; j < msgs.length; j++) {
        const m = msgs[j];
        const isAdmin = m.from === 'admin';
        html += `<div style="display:flex;flex-direction:column;align-items:${isAdmin ? 'flex-start' : 'flex-end'}">`;
        html += `<div style="max-width:80%;padding:10px 14px;border-radius:12px;font-size:13px;background:${isAdmin ? 'var(--muted)' : 'var(--primary)'};color:${isAdmin ? 'var(--foreground)' : '#fff'}">`;
        html += (typeof esc === 'function' ? esc(m.text || '') : m.text || '');
        html += `<div style="font-size:10px;opacity:0.7;margin-top:4px">${m.ts && typeof timeAgo === 'function' ? timeAgo(m.ts) : ''}</div>`;
        html += '</div></div>';
    }
    html += '</div>';
    if (t.status !== 'resolved' && t.status !== 'closed') {
        html += `<div style="display:flex;gap:8px"><textarea id="spReply" rows="2" placeholder="Type a reply\u2026" style="flex:1;resize:none;font-size:13px;padding:8px;border:1px solid var(--border);border-radius:8px"></textarea>`;
        html += `<button class="btn-sm" onclick="spSendReply('${typeof esc === 'function' ? esc(t.id) : t.id}')" style="align-self:flex-end">Send</button></div>`;
    }
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function spSendReply(ticketId) {
    const ta = document.getElementById('spReply');
    if (!ta || !ta.value.trim()) return;
    const tickets = typeof safeGetStorage === 'function' ? safeGetStorage('pk_tickets', []) : [];
    for (let i = 0; i < tickets.length; i++) {
        if (tickets[i].id === ticketId) {
            if (!tickets[i].messages) tickets[i].messages = [];
            tickets[i].messages.push({ from: 'user', text: ta.value.trim(), ts: Date.now() });
            tickets[i].updatedAt = Date.now();
            break;
        }
    }
    try { localStorage.setItem('pk_tickets', JSON.stringify(tickets)); } catch (e) { /* full */ }
    showTicketDetail(ticketId);
}

function submitNewTicket() {
    const subj = document.getElementById('spSubj');
    const desc = document.getElementById('spDesc');
    const cat = document.getElementById('spCat');
    if (!subj || !subj.value.trim()) { if (typeof toast === 'function') toast('Enter a subject', 'error'); return; }
    if (!desc || !desc.value.trim()) { if (typeof toast === 'function') toast('Describe the issue', 'error'); return; }
    const ticket = {
        id: 'tk_' + Date.now().toString(36) + Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(16).padStart(2, '0')).join(''),
        subject: subj.value.trim(), category: cat ? (typeof cselGetValue === 'function' ? cselGetValue(cat) : cat.value) || 'general' : 'general', status: 'open',
        priority: 'medium',
        userId: typeof getDeviceId === 'function' ? getDeviceId() : ((CONFIG?.activeUserId) || ''),
        userEmail: (CONFIG?.email) || '',
        userName: (CONFIG?.name) || '',
        createdAt: Date.now(), updatedAt: Date.now(), resolvedAt: null,
        messages: [{ id: Date.now().toString(36), from: 'user', text: desc.value.trim(), ts: Date.now() }],
        internalNotes: [], assignedTo: ''
    };
    const tickets = typeof safeGetStorage === 'function' ? safeGetStorage('pk_tickets', []) : [];
    tickets.push(ticket);
    while (tickets.length > 500) {
        const idx = tickets.findIndex(t => t.status === 'resolved' || t.status === 'closed');
        tickets.splice(idx >= 0 ? idx : 0, 1);
    }
    try { localStorage.setItem('pk_tickets', JSON.stringify(tickets)); } catch (e) { /* full */ }
    if (typeof toast === 'function') toast('Ticket submitted!');
    if (typeof setFbTab === 'function') setFbTab('tickets');
}
