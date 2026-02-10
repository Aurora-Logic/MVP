// ════════════════════════════════════════
// PREVIEW & EXPORT HELPERS
// ════════════════════════════════════════

function openPreview() {
    dirty();
    const doc = document.getElementById('prevDoc');
    if (doc) doc.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:var(--text4)"><i data-lucide="loader-2" style="width:20px;height:20px;animation:spin 1s linear infinite;margin-right:8px"></i> Generating preview\u2026</div>';
    document.getElementById('prevPanel').classList.add('show');
    document.getElementById('ov').classList.add('show');
    lucide.createIcons();
    setTimeout(() => { buildPreview(); }, 400);
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
        let text = sanitizeHtml(block.data?.text || '');
        if (p) text = replaceVariables(text, p);

        switch (block.type) {
            case 'header':
                const level = block.data?.level || 2;
                return `<div style="font-weight:600;font-size:${level === 2 ? '15px' : '14px'};margin:12px 0 6px">${text}</div>`;
            case 'paragraph':
                return `<div style="margin-bottom:6px">${text}</div>`;
            case 'list':
                let items = (block.data?.items || []).map(item => sanitizeHtml(typeof item === 'object' ? (item.content || item.text || '') : item));
                if (p) items = items.map(item => replaceVariables(item, p));
                const style = block.data?.style === 'ordered' ? 'ol' : 'ul';
                const listItems = items.map(item => `<li>${item}</li>`).join('');
                return style === 'ol'
                    ? `<ol style="margin:6px 0;padding-left:20px">${listItems}</ol>`
                    : `<ul style="margin:6px 0;padding-left:20px">${listItems}</ul>`;
            case 'checklist':
                const checkItems = (block.data?.items || []).map(ci => {
                    const checked = ci.checked ? '\u2611' : '\u2610';
                    return `<div style="margin:2px 0">${checked} ${sanitizeHtml(ci.text || '')}</div>`;
                }).join('');
                return `<div style="margin:6px 0">${checkItems}</div>`;
            case 'table':
                const rows = (block.data?.content || []).map(row => {
                    const cells = row.map(cell => `<td style="border:1px solid #e4e4e7;padding:6px 10px;font-size:12px">${sanitizeHtml(cell)}</td>`).join('');
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
    const c = p.currency || defaultCurrency();
    const bc = CONFIG?.color || '#18181b';
    const t = calcTotals(p);
    const isInvoice = mode === 'invoice';
    const docTitle = isInvoice ? 'INVOICE' : esc(p.title);
    const docNum = isInvoice ? esc(p.number).replace('PROP', 'INV') : esc(p.number);

    const rows = (p.lineItems || []).filter(i => i.desc).map(i => {
        const a = (i.qty || 0) * (i.rate || 0);
        const detailHtml = editorJsToHtml(i.detail, p);
        const detail = detailHtml ? `<div style="font-size:11px;color:#71717a;margin-top:2px;line-height:1.5">${detailHtml}</div>` : '';
        return { desc: `<div style="font-weight:600">${esc(i.desc)}</div>${detail}`, qty: i.qty, rate: fmtCur(i.rate || 0, c), amt: fmtCur(a, c) };
    });
    const secs = (p.sections || []).filter(s => s.title || s.content);
    const logoHtml = CONFIG?.logo ? `<img class="pd-logo" src="${esc(CONFIG.logo)}" style="max-height:36px;margin-bottom:16px">` : '';

    let html = '';
    // Draft watermark (Phase 1.5)
    if (p.status === 'draft') {
        html += '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:80px;font-weight:900;color:rgba(0,0,0,0.04);pointer-events:none;z-index:0;letter-spacing:8px;white-space:nowrap">DRAFT</div>';
    }
    // Cover page
    if (p.coverPage && !isInvoice) { html += buildCoverHtml(p, bc); }

    const tplFns = {
        modern: buildModernTpl, classic: buildClassicTpl, minimal: buildMinimalTpl, tabular: buildTabularTpl,
        executive: typeof buildExecutiveTpl === 'function' ? buildExecutiveTpl : null,
        compact: typeof buildCompactTpl === 'function' ? buildCompactTpl : null,
        bold: typeof buildBoldTpl === 'function' ? buildBoldTpl : null,
        sidebar: typeof buildSidebarTpl === 'function' ? buildSidebarTpl : null,
        stripe: typeof buildStripeTpl === 'function' ? buildStripeTpl : null,
        formal: typeof buildFormalTpl === 'function' ? buildFormalTpl : null,
        clean: typeof buildCleanTpl === 'function' ? buildCleanTpl : null,
        nord: typeof buildNordTpl === 'function' ? buildNordTpl : null,
        american: typeof buildAmericanTpl === 'function' ? buildAmericanTpl : null
    };
    const fn = tplFns[docTemplate] || buildModernTpl;
    if (mode === 'sow' && typeof buildSowHtml === 'function') {
        html += buildSowHtml(p, c, bc, t, rows, secs, logoHtml);
    } else if (mode === 'contract' && typeof buildContractHtml === 'function') {
        html += buildContractHtml(p, c, bc, t, rows, secs, logoHtml);
    } else if (mode === 'receipt' && typeof buildReceiptHtml === 'function') {
        html += buildReceiptHtml(p, c, bc, t, rows, secs, logoHtml);
    } else {
        html += fn(p, c, bc, t, rows, secs, logoHtml, docTitle, docNum, isInvoice);
    }
    // Phase 2 PDF sections (skip for derivatives)
    const isDerivative = ['sow', 'contract', 'receipt'].includes(mode);
    if (!isInvoice && !isDerivative && p.packagesEnabled && typeof buildPackagesPdfHtml === 'function') html += buildPackagesPdfHtml(p, c, bc);
    if (!isDerivative && (p.addOns || []).some(a => a.desc) && typeof buildAddOnsPdfHtml === 'function') html += buildAddOnsPdfHtml(p, c, bc);
    if (!isDerivative && (p.paymentSchedule || []).some(m => m.name) && typeof buildSchedulePdfHtml === 'function') html += buildSchedulePdfHtml(p, c, bc);
    // Acceptance block (only if client has accepted with signature)
    if (p.clientResponse?.status === 'accepted' && (p.clientResponse.clientName || p.clientResponse.clientSignature)) {
        html += buildAcceptanceBlockHtml(p, bc);
    }
    document.getElementById('prevDoc').innerHTML = html;
}

function buildAcceptanceBlockHtml(p, bc) {
    const cr = p.clientResponse;
    const date = new Date(cr.respondedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const sigImg = cr.clientSignature?.startsWith('data:image/') ? cr.clientSignature : '';
    const senderSig = CONFIG?.signature?.startsWith('data:image/') ? CONFIG.signature : '';
    return `<div style="page-break-inside:avoid;margin-top:32px;padding:24px;border:1px solid #e4e4e7;border-radius:8px">
        <div style="font-size:14px;font-weight:700;margin-bottom:16px;color:${bc}">Acceptance</div>
        <div style="display:flex;gap:40px">
            <div style="flex:1">
                <div style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Client</div>
                ${cr.clientName ? `<div style="font-size:14px;font-weight:600;margin-bottom:4px">${esc(cr.clientName)}</div>` : ''}
                <div style="font-size:12px;color:#71717a;margin-bottom:8px">${date}</div>
                ${sigImg ? `<img src="${sigImg}" style="max-width:180px;height:auto;border-bottom:1px solid #e4e4e7;padding-bottom:4px" alt="Client signature">` : '<div style="border-bottom:1px solid #e4e4e7;width:180px;height:40px"></div>'}
            </div>
            <div style="flex:1">
                <div style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Sender</div>
                <div style="font-size:14px;font-weight:600;margin-bottom:4px">${esc(CONFIG?.name || CONFIG?.company || '')}</div>
                <div style="font-size:12px;color:#71717a;margin-bottom:8px">${date}</div>
                ${senderSig ? `<img src="${senderSig}" style="max-width:180px;height:auto;border-bottom:1px solid #e4e4e7;padding-bottom:4px" alt="Sender signature">` : '<div style="border-bottom:1px solid #e4e4e7;width:180px;height:40px"></div>'}
            </div>
        </div>
    </div>`;
}
