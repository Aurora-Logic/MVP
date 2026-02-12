// ════════════════════════════════════════
// T&C LIBRARY — Terms & Conditions presets
// ════════════════════════════════════════

/* exported openTCLib, filterTCLib, insertTC */
const TC_DEFAULTS = [
    { title: 'Standard Payment (50/50)', text: '50% advance before project kickoff.\nRemaining 50% upon completion and before final delivery.\nPayment due within 7 business days of invoice.', category: 'payment' },
    { title: 'Milestone-based (30/30/40)', text: '30% advance to begin work.\n30% upon design approval.\n40% upon final delivery.\nAll payments due within 15 days of invoice.', category: 'payment' },
    { title: 'Net 30 Terms', text: 'Payment is due within 30 days of invoice date.', category: 'payment' },
    { title: 'Net 15 Terms', text: 'Payment is due within 15 days of invoice date.', category: 'payment' },
    { title: 'IP Transfer on Payment', text: 'All intellectual property rights transfer to the client upon receipt of final payment.', category: 'legal' },
    { title: 'Revisions Policy (2 Rounds)', text: 'This proposal includes 2 rounds of revisions per deliverable. Additional revision rounds will be billed at the applicable hourly rate.', category: 'project' },
    { title: 'Cancellation (15 Days Notice)', text: 'Either party may terminate this agreement with 15 days written notice. Client will be billed for all work completed.', category: 'termination' },
    { title: 'Warranty (30 Days)', text: '30-day post-launch support included for bug fixes only. Feature additions will be quoted separately.', category: 'support' },
    { title: 'Late Payment Penalty', text: 'Invoices not paid within the due date will incur a late fee of 1.5% per month.', category: 'legal' },
    { title: 'Mutual Confidentiality', text: 'Both parties agree to keep all project-related information confidential.', category: 'legal' },
    { title: 'Force Majeure', text: 'Neither party shall be liable for delays due to circumstances beyond reasonable control.', category: 'legal' }
];

function openTCLib() {
    const userTC = safeGetStorage('pk_tclib', []).map(t => ({ ...t, category: 'custom' }));
    const all = [...TC_DEFAULTS, ...userTC];
    window._tcData = all;

    const categories = {
        all: { label: 'All', icon: 'layers' },
        payment: { label: 'Payment', icon: 'credit-card' },
        legal: { label: 'Legal & IP', icon: 'shield' },
        project: { label: 'Project', icon: 'folder' },
        termination: { label: 'Termination', icon: 'x-circle' },
        support: { label: 'Support', icon: 'headphones' },
        custom: { label: 'Custom', icon: 'bookmark' }
    };

    const renderItems = (filter) => {
        const filtered = filter === 'all' ? all : all.filter(t => t.category === filter);
        if (!filtered.length) return '<div class="breakdown-empty">No items in this category</div>';
        return filtered.map((t) => {
            const idx = all.indexOf(t);
            return `<div class="tc-chip" role="button" tabindex="0" onclick="insertTC(${idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}"><div class="tc-chip-t">${esc(t.title)}</div><div class="tc-chip-d">${esc(t.text.substring(0, 70))}...</div></div>`;
        }).join('');
    };

    const tabs = Object.entries(categories).map(([k, v]) => {
        const count = k === 'all' ? all.length : all.filter(t => t.category === k).length;
        if (count === 0 && k !== 'custom') return '';
        return `<button class="tc-tab ${k === 'all' ? 'active' : ''}" data-cat="${k}" onclick="filterTCLib('${k}')"><i data-lucide="${v.icon}"></i>${v.label}<span class="tc-count">${count}</span></button>`;
    }).join('');

    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.id = 'tcModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    wrap.innerHTML = `
        <div class="modal modal-lg" onclick="event.stopPropagation()">
            <div class="modal-t">Terms & conditions library</div>
            <div class="modal-d">Click any term to append it to your payment terms</div>
            <div class="tc-tabs">${tabs}</div>
            <div class="tc-grid tc-grid-scroll" id="tcGrid">${renderItems('all')}</div>
            <div class="modal-foot"><button class="btn-sm-outline" onclick="document.getElementById('tcModal').remove()">Close</button></div>
        </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

function filterTCLib(cat) {
    const all = window._tcData;
    const filtered = cat === 'all' ? all : all.filter(t => t.category === cat);
    const grid = document.getElementById('tcGrid');
    if (!filtered.length) {
        grid.innerHTML = '<div class="breakdown-empty">No items in this category</div>';
    } else {
        grid.innerHTML = filtered.map((t) => {
            const idx = all.indexOf(t);
            return `<div class="tc-chip" role="button" tabindex="0" onclick="insertTC(${idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}"><div class="tc-chip-t">${esc(t.title)}</div><div class="tc-chip-d">${esc(t.text.substring(0, 70))}...</div></div>`;
        }).join('');
    }
    document.querySelectorAll('.tc-tab').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tc-tab[data-cat="${cat}"]`)?.classList.add('active');
}

function insertTC(i) {
    const tc = window._tcData[i];
    if (paymentTermsEditor && typeof paymentTermsEditor.commands?.insertContent === 'function') {
        const html = tc.text.split('\n').filter(line => line.trim()).map(line => `<p>${esc(line)}</p>`).join('');
        paymentTermsEditor.commands.insertContent(html);
        dirty();
    } else {
        toast('Payment terms editor not ready', 'warning');
    }
    document.getElementById('tcModal')?.remove();
    toast(tc.title + ' added');
}
