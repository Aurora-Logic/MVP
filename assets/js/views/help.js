// ════════════════════════════════════════
// HELP — Support ticket submission
// ════════════════════════════════════════

/* exported showHelpModal, initHelpButton */

function initHelpButton() {
    // Create floating help button
    const btn = document.createElement('button');
    btn.className = 'help-fab';
    btn.innerHTML = '<i data-lucide="help-circle"></i>';
    btn.setAttribute('data-tooltip', 'Help & Support');
    btn.setAttribute('data-side', 'top');
    btn.onclick = showHelpModal;
    document.body.appendChild(btn);
    lucide.createIcons();
}

function showHelpModal() {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `
        <div class="modal" style="max-width:600px">
            <button class="modal-x" onclick="this.closest('.modal-wrap').remove()">×</button>

            <div style="font-size:20px;font-weight:700;margin-bottom:20px">How can we help?</div>

            <!-- Quick links -->
            <div class="help-quick-links">
                <a href="https://docs.proposalkit.com" target="_blank" class="help-link">
                    <i data-lucide="book-open"></i>
                    <div>
                        <div class="help-link-title">Documentation</div>
                        <div class="help-link-desc">Browse our guides</div>
                    </div>
                </a>
                <a href="https://community.proposalkit.com" target="_blank" class="help-link">
                    <i data-lucide="users"></i>
                    <div>
                        <div class="help-link-title">Community</div>
                        <div class="help-link-desc">Get help from users</div>
                    </div>
                </a>
            </div>

            <div class="help-sep"></div>

            <!-- Support ticket form -->
            <div style="font-size:16px;font-weight:600;margin-bottom:12px">Submit a Support Ticket</div>

            <form id="helpForm" onsubmit="submitHelpTicket(event)">
                <div class="fg">
                    <label class="fl">Subject *</label>
                    <input type="text" id="helpSubject" required placeholder="Briefly describe your issue">
                </div>

                <div class="fg">
                    <label class="fl">Category</label>
                    <select id="helpCategory">
                        <option value="general">General Question</option>
                        <option value="bug">Bug Report</option>
                        <option value="feature">Feature Request</option>
                        <option value="billing">Billing Issue</option>
                        <option value="technical">Technical Problem</option>
                        <option value="account">Account Issue</option>
                    </select>
                </div>

                <div class="fg">
                    <label class="fl">Description *</label>
                    <textarea id="helpDescription" rows="5" required placeholder="Provide details about your issue"></textarea>
                </div>

                <div class="fg">
                    <label class="fl">Priority</label>
                    <select id="helpPriority">
                        <option value="low">Low - Can wait</option>
                        <option value="medium" selected>Medium - Normal</option>
                        <option value="high">High - Urgent</option>
                    </select>
                </div>

                <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:24px">
                    <button type="button" class="btn-outline" onclick="this.closest('.modal-wrap').remove()">Cancel</button>
                    <button type="submit" class="btn">
                        <i data-lucide="send"></i> Submit Ticket
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();

    document.getElementById('helpSubject').focus();
}

async function _submitHelpTicket(e) {
    e.preventDefault();

    const subject = document.getElementById('helpSubject').value.trim();
    const category = document.getElementById('helpCategory').value;
    const description = document.getElementById('helpDescription').value.trim();
    const priority = document.getElementById('helpPriority').value;

    if (!subject || !description) {
        toast('Please fill in all required fields', 'warning');
        return;
    }

    const ticketData = {
        id: 'tk_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
        subject,
        category,
        description,
        priority,
        userEmail: CONFIG.email || '',
        userName: CONFIG.name || '',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    // Submit ticket (will queue if offline)
    const result = await submitTicket(ticketData);

    if (result) {
        document.querySelector('.modal-wrap').remove();

        confirmDialog(
            'Your support ticket has been submitted. We\'ll respond via email within 24 hours.',
            () => {
                // Navigate to My Tickets
                if (typeof renderMyTickets === 'function') {
                    renderMyTickets();
                }
            },
            {
                confirmText: 'View My Tickets',
                cancelText: 'Close'
            }
        );
    }
}
