// ════════════════════════════════════════
// INTEGRATIONS — Export Formats & Webhook
// ════════════════════════════════════════

/* exported exportMarkdown, exportCsv, exportStandaloneHtml, sendWebhook, showExportMenu */
function exportMarkdown() {
    const p = cur(); if (!p) return;
    const c = p.currency || defaultCurrency();
    const t = calcTotals(p);
    let md = `# ${p.title}\n\n`;
    md += `**${p.number}** | ${fmtDate(p.date)} | Valid until: ${fmtDate(p.validUntil)}\n\n`;
    md += `---\n\n`;
    md += `## From\n**${p.sender.company || ''}**\n`;
    if (p.sender.email) md += `${p.sender.email}\n`;
    if (p.sender.address) md += `${p.sender.address}\n`;
    md += `\n## To\n**${p.client.name || ''}**\n`;
    if (p.client.contact) md += `${p.client.contact}\n`;
    if (p.client.email) md += `${p.client.email}\n`;
    md += '\n---\n\n';
    (p.sections || []).forEach(s => {
        if (!s.title && !s.content) return;
        md += `## ${s.title || 'Untitled Section'}\n\n`;
        md += editorJsToMarkdown(s.content) + '\n\n';
    });
    if ((p.lineItems || []).length) {
        md += `## Pricing\n\n`;
        md += `| Item | Qty | Rate | Amount |\n|------|-----|------|--------|\n`;
        (p.lineItems || []).forEach(i => {
            if (!i.desc) return;
            const amt = (i.qty || 0) * (i.rate || 0);
            md += `| ${i.desc.replace(/\|/g, '\\|')} | ${i.qty || 0} | ${fmtCur(i.rate || 0, c)} | ${fmtCur(amt, c)} |\n`;
        });
        md += `\n`;
        if (t.disc) md += `- Discount: -${fmtCur(t.disc, c)}\n`;
        if (t.taxRate) md += `- Tax (${t.taxRate}%): ${fmtCur(t.taxAmt, c)}\n`;
        if (t.addOnsTotal) md += `- Add-Ons: ${fmtCur(t.addOnsTotal, c)}\n`;
        md += `- **Total: ${fmtCur(t.grand, c)}**\n\n`;
    }
    if (p.paymentTerms) {
        md += `## Payment Terms\n\n${editorJsToMarkdown(p.paymentTerms)}\n`;
    }
    downloadBlob(md, slugify(p.title || 'proposal') + '.md', 'text/markdown');
}

function editorJsToMarkdown(content) {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (!content.blocks) return '';
    return content.blocks.map(b => {
        switch (b.type) {
            case 'header': return '#'.repeat(b.data?.level || 2) + ' ' + stripHtml(b.data?.text || '');
            case 'paragraph': return stripHtml(b.data?.text || '');
            case 'list': return (b.data?.items || []).map((item, i) => {
                const text = stripHtml(typeof item === 'object' ? (item.content || item.text || '') : item);
                return b.data?.style === 'ordered' ? `${i + 1}. ${text}` : `- ${text}`;
            }).join('\n');
            case 'quote': return `> ${stripHtml(b.data?.text || '')}`;
            case 'delimiter': return '---';
            case 'code': return '```\n' + (b.data?.code || '') + '\n```';
            case 'checklist': return (b.data?.items || []).map(ci =>
                `- [${ci.checked ? 'x' : ' '}] ${stripHtml(ci.text || '')}`
            ).join('\n');
            case 'table': {
                const rows = b.data?.content || [];
                if (!rows.length) return '';
                let tbl = '| ' + rows[0].map(c => stripHtml(c)).join(' | ') + ' |\n';
                tbl += '| ' + rows[0].map(() => '---').join(' | ') + ' |\n';
                rows.slice(1).forEach(r => { tbl += '| ' + r.map(c => stripHtml(c)).join(' | ') + ' |\n'; });
                return tbl;
            }
            default: return stripHtml(b.data?.text || '');
        }
    }).filter(Boolean).join('\n\n');
}

function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
}

function exportCsv() {
    const p = cur(); if (!p) return;
    const t = calcTotals(p);
    let csv = 'Description,Quantity,Rate,Amount\n';
    (p.lineItems || []).forEach(i => {
        if (!i.desc) return;
        const amt = (i.qty || 0) * (i.rate || 0);
        csv += `"${(i.desc || '').replace(/"/g, '""').replace(/\n/g, ' ')}",${i.qty || 0},${i.rate || 0},${amt}\n`;
    });
    csv += `\n"Subtotal",,,"${t.subtotal}"\n`;
    if (t.disc) csv += `"Discount",,,"${t.disc}"\n`;
    if (t.taxRate) csv += `"Tax (${t.taxRate}%)",,,"${t.taxAmt}"\n`;
    if (t.addOnsTotal) csv += `"Add-Ons",,,"${t.addOnsTotal}"\n`;
    csv += `"Total",,,"${t.grand}"\n`;
    downloadBlob(csv, slugify(p.title || 'proposal') + '-items.csv', 'text/csv');
}

function exportStandaloneHtml() {
    const p = cur(); if (!p) return;
    buildPreview('proposal');
    const html = document.getElementById('prevDoc')?.innerHTML;
    if (!html) return;
    const font = CONFIG?.font || 'System';
    const isSystem = !font || font === 'System' || font === 'Inter';
    const fontLink = isSystem ? '' : `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;
    const fontFamily = isSystem ? "'SF Pro Display','Helvetica Neue',Helvetica,-apple-system,system-ui,sans-serif" : `'${font}',system-ui,sans-serif`;
    const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${esc(p.title)}</title>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: blob:;">
${fontLink}<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>:root{--mono:'JetBrains Mono',ui-monospace,monospace}*{box-sizing:border-box;margin:0;padding:0}body{font-family:${fontFamily};padding:40px;color:#333;font-size:13px;line-height:1.7;max-width:700px;margin:0 auto}@media print{body{padding:20px}}</style>
</head><body>${html}</body></html>`;
    downloadBlob(full, slugify(p.title || 'proposal') + '.html', 'text/html');
}

function sendWebhook() {
    const p = cur(); if (!p) return;
    const url = CONFIG?.webhookUrl;
    if (!url) { toast('Set webhook URL in Settings first', 'warning'); return; }
    if (!url.startsWith('https://') && !url.startsWith('http://')) { toast('Webhook URL must start with http:// or https://', 'warning'); return; }
    try { const u = new URL(url); if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0)/.test(u.hostname)) { toast('Webhook URL cannot target private networks', 'warning'); return; } } catch (_e) { toast('Invalid webhook URL', 'warning'); return; }
    const t = calcTotals(p);
    const payload = {
        event: 'proposal.export',
        proposal: {
            id: p.id, title: p.title, number: p.number, status: p.status,
            client: p.client, sender: p.sender,
            value: t.grand, currency: p.currency || defaultCurrency(),
            date: p.date, validUntil: p.validUntil,
            sections: (p.sections || []).length, lineItems: (p.lineItems || []).length
        },
        timestamp: new Date().toISOString()
    };
    fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(r => {
        if (r.ok) toast('Webhook sent');
        else toast('Webhook failed: ' + r.status, 'error');
    }).catch(e => toast('Webhook error: ' + e.message, 'error'));
}

function showExportMenu(btnEl) {
    const existing = document.querySelector('.export-menu');
    if (existing) { existing.remove(); return; }
    const menu = document.createElement('div');
    menu.className = 'export-menu';
    menu.innerHTML = `
        <button class="export-menu-item" onclick="exportMarkdown();this.closest('.export-menu').remove()"><i data-lucide="file-text"></i> Markdown</button>
        <button class="export-menu-item" onclick="exportCsv();this.closest('.export-menu').remove()"><i data-lucide="table"></i> CSV (Line Items)</button>
        <button class="export-menu-item" onclick="exportStandaloneHtml();this.closest('.export-menu').remove()"><i data-lucide="code"></i> Standalone HTML</button>
        ${CONFIG?.webhookUrl ? `<button class="export-menu-item" onclick="sendWebhook();this.closest('.export-menu').remove()"><i data-lucide="webhook"></i> Send Webhook</button>` : ''}`;
    const rect = btnEl.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    document.body.appendChild(menu);
    lucide.createIcons();
    const close = (e) => { if (!menu.contains(e.target) && e.target !== btnEl) { menu.remove(); document.removeEventListener('click', close); } };
    setTimeout(() => document.addEventListener('click', close), 10);
}

function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Downloaded ' + filename);
}

function slugify(str) {
    const slug = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return slug || 'untitled';
}
