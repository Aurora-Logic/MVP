// ════════════════════════════════════════
// MY TICKETS — User's support tickets
// ════════════════════════════════════════

/* exported renderMyTickets */

async function renderMyTickets() {
    CUR = null;
    if (typeof hideTOC === 'function') hideTOC();

    document.getElementById('topTitle').textContent = 'My Tickets';
    const topSearch = document.getElementById('topSearch');
    if (topSearch) topSearch.style.display = 'none';

    const body = document.getElementById('bodyScroll');
    body.innerHTML = '<div class="loading-spinner"><i data-lucide="loader" class="spin"></i> Loading tickets...</div>';
    lucide.createIcons();

    const tickets = await getUserTickets();

    if (!tickets || tickets.length === 0) {
        body.innerHTML = `
            <div class="empty">
                <i data-lucide="inbox"></i>
                <div class="empty-t">No Support Tickets</div>
                <div class="empty-d">You haven't submitted any support tickets yet.</div>
                <button class="btn" onclick="showHelpModal()">
                    <i data-lucide="plus"></i> Create Ticket
                </button>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    body.innerHTML = `
        <div class="tickets-container">
            <div class="tickets-header">
                <button class="btn-sm" onclick="showHelpModal()">
                    <i data-lucide="plus"></i> New Ticket
                </button>
            </div>

            <div class="tickets-list">
                ${tickets.map(t => buildTicketRow(t)).join('')}
            </div>
        </div>
    `;

    lucide.createIcons();
}

function buildTicketRow(ticket) {
    const statusColors = {
        open: 'blue',
        'in-progress': 'amber',
        waiting: 'purple',
        resolved: 'green',
        closed: 'muted'
    };

    const color = statusColors[ticket.status] || 'muted';
    const lastMessage = (ticket.messages || []).slice(-1)[0];
    const lastUpdate = ticket.updated_at ? timeAgo(new Date(ticket.updated_at).getTime()) : 'Just now';

    return `
        <div class="ticket-row" onclick="showTicketDetailUser('${escAttr(ticket.id)}')">
            <div class="ticket-row-main">
                <div class="ticket-row-subject">${esc(ticket.subject)}</div>
                <div class="ticket-row-meta">
                    <span class="badge badge-${color}">${ticket.status}</span>
                    <span class="badge badge-${ticket.priority}">${ticket.priority}</span>
                    <span class="ticket-row-date">${lastUpdate}</span>
                </div>
            </div>
            ${lastMessage ? `<div class="ticket-row-preview">${esc(lastMessage.text).substring(0, 100)}...</div>` : ''}
        </div>
    `;
}

async function showTicketDetailUser(ticketId) {
    // Fetch fresh ticket data
    const tickets = await getUserTickets();
    const ticket = tickets.find(t => t.id === ticketId);

    if (!ticket) {
        toast('Ticket not found', 'error');
        return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `
        <div class="modal" style="max-width:700px;max-height:85vh">
            <button class="modal-x" onclick="this.closest('.modal-wrap').remove()">×</button>

            <div class="ticket-detail-header">
                <h2>${esc(ticket.subject)}</h2>
                <span class="badge badge-${ticket.status}">${ticket.status}</span>
            </div>

            <div class="ticket-detail-meta">
                Ticket ID: <strong>${ticket.id}</strong> &middot;
                Created: <strong>${fmtDate(ticket.created_at)}</strong>
            </div>

            <div class="ticket-messages">
                ${(ticket.messages || []).map(m => `
                    <div class="ticket-message ${m.from === 'user' ? 'ticket-message-user' : 'ticket-message-admin'}">
                        <div class="ticket-message-header">
                            <strong>${m.from === 'user' ? 'You' : (m.adminName || 'Support Team')}</strong>
                            <span>${timeAgo(m.ts)}</span>
                        </div>
                        <div class="ticket-message-text">${esc(m.text)}</div>
                    </div>
                `).join('')}
            </div>

            ${ticket.status !== 'closed' ? `
                <div class="ticket-reply-form">
                    <textarea id="ticketReplyText" rows="3" placeholder="Add a reply..."></textarea>
                    <button class="btn-sm" onclick="sendTicketReply('${escAttr(ticket.id)}')">
                        <i data-lucide="send"></i> Send
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

async function sendTicketReply(ticketId) {
    const text = document.getElementById('ticketReplyText').value.trim();
    if (!text) {
        toast('Please enter a message', 'warning');
        return;
    }

    const success = await addTicketMessage(ticketId, text);
    if (success) {
        document.querySelector('.modal-wrap').remove();
        renderMyTickets(); // Refresh list
    }
}
