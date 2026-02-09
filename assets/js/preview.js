// ════════════════════════════════════════
// PREVIEW & EXPORT HELPERS
// ════════════════════════════════════════

function openPreview() {
    dirty();
    setTimeout(() => { buildPreview(); document.getElementById('prevPanel').classList.add('show'); document.getElementById('ov').classList.add('show'); }, 400);
}

function closePreview() {
    document.getElementById('prevPanel').classList.remove('show');
    document.getElementById('ov').classList.remove('show');
}

function setDocTpl(tpl, btn) {
    docTemplate = tpl;
    document.querySelectorAll('.tpl-pick').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    buildPreview();
}

function calcTotals(p) {
    const subtotal = (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0);
    const disc = p.discount || 0;
    const afterDisc = Math.max(0, subtotal - disc);
    const taxRate = p.taxRate || 0;
    const taxAmt = Math.round(afterDisc * taxRate / 100);
    const addOnsTotal = (p.addOns || []).filter(a => a.selected).reduce((s, a) => s + (a.price || 0), 0);
    const grand = afterDisc + taxAmt + addOnsTotal;
    return { subtotal, disc, afterDisc, taxRate, taxAmt, addOnsTotal, grand };
}

// Convert Editor.js JSON data to HTML string (with optional variable replacement)
function editorJsToHtml(content, p = null) {
    if (!content) return '';

    // Handle legacy plain text
    if (typeof content === 'string') {
        const escaped = esc(content).replace(/\n/g, '<br>');
        return p ? replaceVariables(escaped, p) : escaped;
    }

    // Handle Editor.js JSON format
    if (!content.blocks || !Array.isArray(content.blocks)) return '';

    let html = content.blocks.map(block => {
        let text = block.data?.text || '';
        if (p) text = replaceVariables(text, p);

        switch (block.type) {
            case 'header':
                const level = block.data?.level || 2;
                return `<div style="font-weight:600;font-size:${level === 2 ? '15px' : '14px'};margin:12px 0 6px">${text}</div>`;
            case 'paragraph':
                return `<div style="margin-bottom:6px">${text}</div>`;
            case 'list':
                let items = (block.data?.items || []).map(item => typeof item === 'object' ? (item.content || item.text || '') : item);
                if (p) items = items.map(item => replaceVariables(item, p));
                const style = block.data?.style === 'ordered' ? 'ol' : 'ul';
                const listItems = items.map(item => `<li>${item}</li>`).join('');
                return style === 'ol'
                    ? `<ol style="margin:6px 0;padding-left:20px">${listItems}</ol>`
                    : `<ul style="margin:6px 0;padding-left:20px">${listItems}</ul>`;
            case 'checklist':
                const checkItems = (block.data?.items || []).map(ci => {
                    const checked = ci.checked ? '\u2611' : '\u2610';
                    return `<div style="margin:2px 0">${checked} ${ci.text || ''}</div>`;
                }).join('');
                return `<div style="margin:6px 0">${checkItems}</div>`;
            case 'table':
                const rows = (block.data?.content || []).map(row => {
                    const cells = row.map(cell => `<td style="border:1px solid #e4e4e7;padding:6px 10px;font-size:12px">${cell}</td>`).join('');
                    return `<tr>${cells}</tr>`;
                }).join('');
                return `<table style="border-collapse:collapse;width:100%;margin:8px 0">${rows}</table>`;
            case 'code':
                return `<pre style="background:#f4f4f5;border-radius:6px;padding:10px 14px;font-size:12px;font-family:monospace;overflow-x:auto;margin:8px 0">${esc(block.data?.code || '')}</pre>`;
            case 'quote':
                return `<blockquote style="border-left:3px solid #888;padding-left:12px;margin:8px 0;font-style:italic;color:#666">${text}</blockquote>`;
            case 'delimiter':
                return '<hr style="border:none;border-top:1px solid #e4e4e7;margin:12px 0">';
            default:
                return text ? `<div>${text}</div>` : '';
        }
    }).join('');

    return html;
}

function buildPreview(mode) {
    const p = cur(); if (!p) return;
    const c = p.currency || '\u20B9';
    const bc = CONFIG?.color || '#18181b';
    const t = calcTotals(p);
    const isInvoice = mode === 'invoice';
    const docTitle = isInvoice ? 'INVOICE' : esc(p.title);
    const docNum = isInvoice ? esc(p.number).replace('PROP', 'INV') : esc(p.number);

    const rows = (p.lineItems || []).filter(i => i.desc).map(i => {
        const a = (i.qty || 0) * (i.rate || 0);
        const detailHtml = editorJsToHtml(i.detail, p);
        const detail = detailHtml ? `<div style="font-size:11px;color:#71717a;margin-top:2px;line-height:1.5">${detailHtml}</div>` : '';
        return { desc: `<div style="font-weight:600">${esc(i.desc)}</div>${detail}`, qty: i.qty, rate: c + (i.rate || 0).toLocaleString('en-IN'), amt: c + a.toLocaleString('en-IN') };
    });
    const secs = (p.sections || []).filter(s => s.title || s.content);
    const logoHtml = CONFIG?.logo ? `<img class="pd-logo" src="${CONFIG.logo}" style="max-height:36px;margin-bottom:16px">` : '';

    let html = '';
    // Draft watermark (Phase 1.5)
    if (p.status === 'draft') {
        html += '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:80px;font-weight:900;color:rgba(0,0,0,0.04);pointer-events:none;z-index:0;letter-spacing:8px;white-space:nowrap">DRAFT</div>';
    }
    // Cover page
    if (p.coverPage && !isInvoice) { html += buildCoverHtml(p, bc); }

    if (docTemplate === 'modern') {
        html += buildModernTpl(p, c, bc, t, rows, secs, logoHtml, docTitle, docNum, isInvoice);
    } else if (docTemplate === 'classic') {
        html += buildClassicTpl(p, c, bc, t, rows, secs, logoHtml, docTitle, docNum, isInvoice);
    } else if (docTemplate === 'tabular') {
        html += buildTabularTpl(p, c, bc, t, rows, secs, logoHtml, docTitle, docNum, isInvoice);
    } else {
        html += buildMinimalTpl(p, c, bc, t, rows, secs, logoHtml, docTitle, docNum, isInvoice);
    }
    // Phase 2 PDF sections
    if (!isInvoice && p.packagesEnabled && typeof buildPackagesPdfHtml === 'function') html += buildPackagesPdfHtml(p, c, bc);
    if ((p.addOns || []).some(a => a.desc) && typeof buildAddOnsPdfHtml === 'function') html += buildAddOnsPdfHtml(p, c, bc);
    if ((p.paymentSchedule || []).some(m => m.name) && typeof buildSchedulePdfHtml === 'function') html += buildSchedulePdfHtml(p, c, bc);
    document.getElementById('prevDoc').innerHTML = html;
}
