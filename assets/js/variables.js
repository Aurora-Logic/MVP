// ════════════════════════════════════════
// VARIABLES — Placeholder replacement
// ════════════════════════════════════════

function replaceVariables(text, p) {
    if (!text || typeof text !== 'string') return text;
    const t = calcTotals(p);
    const today = new Date().toISOString().split('T')[0];

    const vars = {
        'client.name': p.client?.name || '',
        'client.email': p.client?.email || '',
        'client.contact': p.client?.contact || '',
        'client.phone': p.client?.phone || '',
        'sender.company': p.sender?.company || CONFIG?.company || '',
        'sender.email': p.sender?.email || CONFIG?.email || '',
        'sender.address': p.sender?.address || CONFIG?.address || '',
        'proposal.title': p.title || '',
        'proposal.number': p.number || '',
        'proposal.total': fmtCur(t.grand, p.currency),
        'proposal.subtotal': fmtCur(t.subtotal, p.currency),
        'today': fmtDate(today),
        'valid_until': fmtDate(p.validUntil),
        'date': fmtDate(p.date)
    };

    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const k = key.trim().toLowerCase();
        return vars[k] !== undefined ? vars[k] : match;
    });
}

// Available variables list for the insert dropdown
const VARIABLE_LIST = [
    { key: '{{client.name}}', label: 'Client Name', group: 'Client' },
    { key: '{{client.email}}', label: 'Client Email', group: 'Client' },
    { key: '{{client.contact}}', label: 'Client Contact', group: 'Client' },
    { key: '{{sender.company}}', label: 'Your Company', group: 'Sender' },
    { key: '{{sender.email}}', label: 'Your Email', group: 'Sender' },
    { key: '{{proposal.title}}', label: 'Proposal Title', group: 'Proposal' },
    { key: '{{proposal.number}}', label: 'Proposal Number', group: 'Proposal' },
    { key: '{{proposal.total}}', label: 'Total Amount', group: 'Proposal' },
    { key: '{{today}}', label: "Today's Date", group: 'Dates' },
    { key: '{{valid_until}}', label: 'Valid Until Date', group: 'Dates' },
    { key: '{{date}}', label: 'Proposal Date', group: 'Dates' }
];

// Insert Variable dropdown for Editor.js sections
function showInsertVariableDropdown(editorInstance, btnEl) {
    // Remove any existing dropdown
    document.getElementById('varDropdown')?.remove();

    const dropdown = document.createElement('div');
    dropdown.id = 'varDropdown';
    dropdown.className = 'var-dropdown';

    const groups = {};
    VARIABLE_LIST.forEach(v => {
        if (!groups[v.group]) groups[v.group] = [];
        groups[v.group].push(v);
    });

    let html = '<div class="var-dropdown-head">Insert Variable</div>';
    for (const [group, vars] of Object.entries(groups)) {
        html += `<div class="var-group-label">${esc(group)}</div>`;
        vars.forEach(v => {
            html += `<div class="var-item" data-key="${esc(v.key)}">
                <span class="var-item-label">${esc(v.label)}</span>
                <code class="var-item-key">${esc(v.key)}</code>
            </div>`;
        });
    }
    dropdown.innerHTML = html;

    // Position relative to button
    const rect = btnEl.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.left = Math.min(rect.left, window.innerWidth - 240) + 'px';
    dropdown.style.top = (rect.bottom + 4) + 'px';
    dropdown.style.zIndex = '9999';

    document.body.appendChild(dropdown);

    // Handle clicks on items
    dropdown.querySelectorAll('.var-item').forEach(item => {
        item.onclick = () => {
            const key = item.dataset.key;
            if (editorInstance && editorInstance.blocks) {
                editorInstance.blocks.insert('paragraph', { text: key });
                dirty();
            }
            dropdown.remove();
            toast('Variable inserted — will be replaced in preview/PDF');
        };
    });

    // Close on outside click
    const close = (e) => {
        if (!dropdown.contains(e.target) && e.target !== btnEl) {
            dropdown.remove();
            document.removeEventListener('click', close);
        }
    };
    setTimeout(() => document.addEventListener('click', close), 10);
}
