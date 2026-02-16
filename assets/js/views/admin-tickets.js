// ════════════════════════════════════════
// ADMIN TICKETS — Ticket management
// ════════════════════════════════════════

/* exported renderAdminTickets, showAdminTicketDetail */

function renderAdminTickets() {
    const tickets = getCachedTickets();

    return `
        <div class="admin-tickets">
            <div class="admin-section-header">
                <h2>Support Tickets</h2>
                <div class="admin-filters">
                    <select id="ticketStatusFilter" onchange="filterTickets()">
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="waiting">Waiting</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                    <select id="ticketPriorityFilter" onchange="filterTickets()">
                        <option value="">All Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
            </div>

            <div class="admin-tickets-table">
                <table>
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>User</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="ticketsTableBody">
                        ${tickets.map(t => buildTicketRowAdmin(t)).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function buildTicketRowAdmin(ticket) {
    const created = timeAgo(new Date(ticket.created_at).getTime());

    return `
        <tr onclick="showAdminTicketDetail('${escAttr(ticket.id)}')">
            <td>
                <div class="ticket-subject-cell">
                    <div class="ticket-subject-text">${esc(ticket.subject)}</div>
                    ${ticket.submission_method === 'offline' ? '<span class="badge badge-muted">offline</span>' : ''}
                </div>
            </td>
            <td>${esc(ticket.user_email)}</td>
            <td><span class="badge badge-${ticket.status}">${ticket.status}</span></td>
            <td><span class="badge badge-${ticket.priority}">${ticket.priority}</span></td>
            <td>${created}</td>
            <td>
                <button class="btn-sm-icon-ghost" onclick="event.stopPropagation(); showAdminTicketDetail('${escAttr(ticket.id)}')">
                    <i data-lucide="more-horizontal"></i>
                </button>
            </td>
        </tr>
    `;
}

async function showAdminTicketDetail(ticketId) {
    const tickets = getCachedTickets();
    const ticket = tickets.find(t => t.id === ticketId);

    if (!ticket) {
        toast('Ticket not found', 'error');
        return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `
        <div class="modal" style="max-width:800px;max-height:90vh">
            <button class="modal-x" onclick="this.closest('.modal-wrap').remove()">×</button>

            <div class="ticket-detail-header">
                <h2>${esc(ticket.subject)}</h2>
                <div style="display:flex;gap:8px">
                    <span class="badge badge-${ticket.status}">${ticket.status}</span>
                    <span class="badge badge-${ticket.priority}">${ticket.priority}</span>
                </div>
            </div>

            <!-- Ticket info -->
            <div class="ticket-detail-info">
                <div class="info-item">
                    <div class="info-label">Ticket ID</div>
                    <div class="info-value">${ticket.id}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">User</div>
                    <div class="info-value">${esc(ticket.user_email)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Category</div>
                    <div class="info-value">${ticket.category}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Created</div>
                    <div class="info-value">${fmtDate(ticket.created_at)}</div>
                </div>
            </div>

            <!-- Messages -->
            <div class="ticket-messages">
                ${(ticket.messages || []).map(m => `
                    <div class="ticket-message ${m.from === 'user' ? 'ticket-message-user' : 'ticket-message-admin'}">
                        <div class="ticket-message-header">
                            <strong>${m.from === 'user' ? esc(ticket.user_name || ticket.user_email) : (m.adminName || 'Admin')}</strong>
                            <span>${timeAgo(m.ts)}</span>
                        </div>
                        <div class="ticket-message-text">${esc(m.text)}</div>
                    </div>
                `).join('')}
            </div>

            <!-- Admin actions -->
            <div class="ticket-detail-actions">
                <div class="ticket-status-controls">
                    <select id="ticketStatusUpdate" onchange="updateTicketStatus('${escAttr(ticket.id)}', this.value)">
                        <option value="">Change Status...</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="waiting">Waiting for User</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>

                    <select id="ticketPriorityUpdate" onchange="updateTicketPriority('${escAttr(ticket.id)}', this.value)">
                        <option value="">Change Priority...</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>

                ${ticket.status !== 'closed' ? `
                    <div class="ticket-reply-form">
                        <textarea id="adminReplyText" rows="4" placeholder="Type your reply..."></textarea>
                        <button class="btn" onclick="sendAdminReply('${escAttr(ticket.id)}')">
                            <i data-lucide="send"></i> Send Reply
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

async function updateTicketStatus(ticketId, status) {
    if (!status) return;

    const updates = status === 'resolved' ? { status, resolved_at: new Date().toISOString() } : { status };

    const result = await updateTicket(ticketId, updates);

    if (!result.error) {
        document.querySelector('.modal-wrap').remove();
        await refreshAdminData(true);
        refreshAdminUI();
    }
}

async function updateTicketPriority(ticketId, priority) {
    if (!priority) return;

    const result = await updateTicket(ticketId, { priority });

    if (!result.error) {
        toast('Priority updated', 'success');
        await refreshAdminData(true);
        showAdminTicketDetail(ticketId);
    }
}

async function sendAdminReply(ticketId) {
    const text = document.getElementById('adminReplyText').value.trim();
    if (!text) {
        toast('Please enter a message', 'warning');
        return;
    }

    const result = await addAdminReply(ticketId, text);

    if (!result.error) {
        document.querySelector('.modal-wrap').remove();
        await refreshAdminData(true);
        refreshAdminUI();
    }
}

function filterTickets() {
    const statusFilter = document.getElementById('ticketStatusFilter')?.value.toLowerCase();
    const priorityFilter = document.getElementById('ticketPriorityFilter')?.value.toLowerCase();

    const rows = document.querySelectorAll('#ticketsTableBody tr');
    rows.forEach(row => {
        const status = row.querySelector('.badge:nth-of-type(1)')?.textContent.toLowerCase();
        const priority = row.querySelector('.badge:nth-of-type(2)')?.textContent.toLowerCase();

        const matchesStatus = !statusFilter || status === statusFilter;
        const matchesPriority = !priorityFilter || priority === priorityFilter;

        row.style.display = matchesStatus && matchesPriority ? '' : 'none';
    });
}
