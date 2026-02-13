// ════════════════════════════════════════
// DERIVATIVES — SOW, Contract, Receipt
// ════════════════════════════════════════

/* exported generateDerivative, openDerivativesMenu, buildSowHtml, buildContractHtml, buildReceiptHtml */
function generateDerivative(type) {
    const p = cur();
    if (!p) { toast('Open a proposal first'); return; }

    // PLAN GATING: Check derivative generation limits
    if (typeof getCurrentPlan === 'function' && typeof PLAN_LIMITS !== 'undefined') {
        const plan = getCurrentPlan();
        const limits = PLAN_LIMITS[plan];

        // Track derivative count
        if (!CONFIG.derivativeCount) CONFIG.derivativeCount = 0;
        if (!CONFIG.derivativeResetAt) CONFIG.derivativeResetAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

        // Reset monthly counter
        if (Date.now() > CONFIG.derivativeResetAt) {
            CONFIG.derivativeCount = 0;
            CONFIG.derivativeResetAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
        }

        // Check limit
        if (limits.derivatives !== -1 && CONFIG.derivativeCount >= limits.derivatives) {
            toast(`${plan === 'free' ? 'Free plan' : 'Plan'} limit: ${limits.derivatives} derivatives/month`, 'error');
            return;
        }

        CONFIG.derivativeCount++;
        saveConfig();
    }

    const labels = { sow: 'Statement of Work', contract: 'Service Agreement', receipt: 'Receipt' };
    const win = window.open('', '_blank');
    if (!win) { toast('Please allow popups', 'error'); return; }
    // Build derivative HTML in a temp container (don't corrupt prevDoc)
    const prevDoc = document.getElementById('prevDoc');
    const savedHtml = prevDoc ? prevDoc.innerHTML : '';
    buildPreview(type);
    const html = prevDoc ? prevDoc.innerHTML : '';
    if (prevDoc) prevDoc.innerHTML = savedHtml;
    if (!html) { win.close(); return; }
    const font = CONFIG?.font || 'System';
    const isSystem = !font || font === 'System' || font === 'Inter';
    const fontLink = isSystem ? '' : `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;
    const fontFamily = isSystem ? "'SF Pro Display','Helvetica Neue',Helvetica,-apple-system,system-ui,sans-serif" : `'${font}',system-ui,sans-serif`;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${labels[type] || type}</title>
${fontLink}<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:${fontFamily};padding:40px;color:#333;font-size:13px;line-height:1.7;max-width:700px;margin:0 auto}@media print{body{padding:20px}table{page-break-inside:auto}tr{page-break-inside:avoid;break-inside:avoid}thead{display:table-header-group}img{page-break-inside:avoid;break-inside:avoid}}</style>
</head><body>${html}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 600);
}

function openDerivativesMenu(btnEl) {
    const existing = document.querySelector('.export-menu');
    if (existing) { existing.remove(); return; }
    const menu = document.createElement('div');
    menu.className = 'export-menu';
    menu.innerHTML = `
        <button class="export-menu-item" onclick="generateDerivative('sow');this.closest('.export-menu').remove()"><i data-lucide="file-check"></i> Statement of Work</button>
        <button class="export-menu-item" onclick="generateDerivative('contract');this.closest('.export-menu').remove()"><i data-lucide="file-pen"></i> Service Agreement</button>
        <button class="export-menu-item" onclick="generateDerivative('receipt');this.closest('.export-menu').remove()"><i data-lucide="receipt"></i> Payment Receipt</button>`;
    const rect = btnEl.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    document.body.appendChild(menu);
    lucide.createIcons();
    const close = (e) => { if (!menu.contains(e.target) && e.target !== btnEl) { menu.remove(); document.removeEventListener('click', close); } };
    setTimeout(() => document.addEventListener('click', close), 10);
}

function buildSowHtml(p, c, bc, t, rows, secs, logo) {
    const num = esc(p.number).replace('PROP', 'SOW');
    let h = logo;
    h += `<div style="text-align:center;margin-bottom:28px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:${bc};font-weight:700;margin-bottom:6px">STATEMENT OF WORK</div>
        <div style="font-size:22px;font-weight:800;color:#09090b;letter-spacing:-.5px">${esc(p.title)}</div>
        <div style="font-size:12px;color:#a1a1aa;margin-top:4px">${num} | ${fmtDate(p.date)}</div>
    </div>`;
    h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px;padding:16px;border:1px solid #e4e4e7;border-radius:8px;page-break-inside:avoid;break-inside:avoid">
        <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;color:${bc};margin-bottom:4px">Provider</div>
            <div style="font-size:13px;font-weight:600">${esc(p.sender.company)}</div>
            <div style="font-size:11px;color:#71717a;margin-top:2px">${buildSenderDetails()}</div>${buildSenderTaxLine()}</div>
        <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;color:${bc};margin-bottom:4px">Client</div>
            <div style="font-size:13px;font-weight:600">${esc(p.client.name)}</div>
            <div style="font-size:11px;color:#71717a;margin-top:2px">${[p.client.contact, p.client.email].filter(Boolean).map(v => esc(v)).join('<br>')}</div></div>
    </div>`;
    let secNum = 1;
    secs.forEach(s => {
        h += `<div style="margin-bottom:24px">
            <div style="font-size:14px;font-weight:700;color:${bc};margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid ${bc}">${secNum}. ${esc(s.title)}</div>
            <div style="color:#3f3f46;font-size:13px;line-height:1.7">${editorJsToHtml(s.content, p)}</div>
        </div>`;
        secNum++;
    });
    if (rows.length) {
        h += `<div style="font-size:14px;font-weight:700;color:${bc};margin:24px 0 8px;padding-bottom:6px;border-bottom:2px solid ${bc}">${secNum}. Deliverables & Pricing</div>`;
        h += buildPricingHtml(rows, c, t, bc, 'modern');
    }
    h += buildBankFooterHtml(bc);
    h += buildSignatureBlock(p, bc);
    return h;
}

function buildContractHtml(p, c, bc, t, rows, secs, logo) {
    const num = esc(p.number).replace('PROP', 'CTR');
    let h = logo;
    h += `<div style="text-align:center;margin-bottom:28px">
        <div style="font-size:22px;font-weight:800;color:#09090b;letter-spacing:-.5px;text-transform:uppercase">Service Agreement</div>
        <div style="font-size:12px;color:#a1a1aa;margin-top:4px">${num} | Effective: ${fmtDate(p.date)}</div>
    </div>`;
    h += `<div style="margin-bottom:24px;font-size:13px;color:#3f3f46;line-height:1.7">
        This Service Agreement ("Agreement") is entered into as of <strong>${fmtDate(p.date)}</strong> by and between
        <strong>${esc(p.sender.company)}</strong> ("Provider") and <strong>${esc(p.client.name)}</strong> ("Client"),
        collectively referred to as the "Parties".
    </div>`;
    h += `${buildSenderTaxLine()}`;
    let clause = 1;
    secs.forEach(s => {
        h += `<div style="margin-bottom:24px">
            <div style="font-size:13px;font-weight:700;color:#800020;margin-bottom:6px">${clause}. ${esc(s.title).toUpperCase()}</div>
            <div style="color:#3f3f46;font-size:13px;line-height:1.7;padding-left:16px">${editorJsToHtml(s.content, p)}</div>
        </div>`;
        clause++;
    });
    if (rows.length) {
        h += `<div style="font-size:13px;font-weight:700;color:#800020;margin:24px 0 8px">${clause}. COMPENSATION</div>`;
        h += `<div style="padding-left:16px">`;
        h += buildPricingHtml(rows, c, t, bc, 'modern');
        h += `</div>`;
        clause++;
    }
    if (p.paymentTerms) {
        h += `<div style="font-size:13px;font-weight:700;color:#800020;margin:24px 0 8px">${clause}. PAYMENT TERMS</div>`;
        h += `<div style="color:#3f3f46;font-size:13px;line-height:1.7;padding-left:16px">${editorJsToHtml(p.paymentTerms, p)}</div>`;
        clause++;
    }
    h += `<div style="font-size:13px;font-weight:700;color:#800020;margin:24px 0 8px">${clause}. TERM</div>`;
    h += `<div style="color:#3f3f46;font-size:13px;line-height:1.7;padding-left:16px">This Agreement shall commence on ${fmtDate(p.date)} and remain in effect until ${fmtDate(p.validUntil)}, unless terminated earlier by either Party with 30 days written notice.</div>`;
    h += buildBankFooterHtml(bc);
    h += buildSignatureBlock(p, bc);
    return h;
}

function buildReceiptHtml(p, c, bc, t, rows, secs, logo) {
    const num = esc(p.number).replace('PROP', 'REC');
    const today = fmtDate(new Date().toISOString().split('T')[0]);
    const pt = (typeof paymentTotals === 'function') ? paymentTotals(p) : { grand: t.grand, amountPaid: t.grand, balanceDue: 0, status: 'paid' };
    const mono = "'JetBrains Mono',monospace";
    let h = '<div style="position:relative">';
    if (pt.status === 'paid') h += '<div style="position:absolute;top:35%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:80px;font-weight:900;color:rgba(52,199,89,0.06);pointer-events:none;z-index:0;letter-spacing:8px">PAID</div>';
    else if (pt.status === 'partial') h += '<div style="position:absolute;top:35%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:64px;font-weight:900;color:rgba(255,149,0,0.06);pointer-events:none;z-index:0;letter-spacing:6px">PARTIAL</div>';
    h += logo;
    h += `<div style="text-align:center;margin-bottom:28px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:${bc};font-weight:700;margin-bottom:6px">PAYMENT RECEIPT</div>
        <div style="font-size:18px;font-weight:800;color:#09090b">${num}</div>
        <div style="font-size:12px;color:#a1a1aa;margin-top:4px">Date: ${today}</div>
    </div>`;
    h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;padding:16px;border:1px solid #e4e4e7;border-radius:8px;page-break-inside:avoid;break-inside:avoid">
        <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;color:${bc};margin-bottom:4px">Received From</div>
            <div style="font-size:13px;font-weight:600">${esc(p.client.name)}</div>
            <div style="font-size:11px;color:#71717a">${esc(p.client.email)}</div></div>
        <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;color:${bc};margin-bottom:4px">Received By</div>
            <div style="font-size:13px;font-weight:600">${esc(p.sender.company)}</div>
            <div style="font-size:11px;color:#71717a">${buildSenderDetails()}</div>${buildSenderTaxLine()}</div>
    </div>`;
    if (rows.length) h += buildPricingHtml(rows, c, t, bc, 'modern');
    if (typeof buildPaymentsReceiptHtml === 'function') h += buildPaymentsReceiptHtml(p, c, bc);
    h += `<div style="text-align:center;margin-top:24px;padding:20px;background:${bc}0D;border-radius:8px;page-break-inside:avoid;break-inside:avoid">`;
    if (pt.status === 'paid') {
        h += `<div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;color:${bc}">Total Paid</div>`;
        h += `<div style="font-size:28px;font-weight:800;color:${bc};font-family:${mono}">${fmtCur(pt.amountPaid, c)}</div>`;
    } else {
        h += `<div style="display:flex;justify-content:space-around">`;
        h += `<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;color:#34C759">Amount Paid</div><div style="font-size:22px;font-weight:800;color:#34C759;font-family:${mono}">${fmtCur(pt.amountPaid, c)}</div></div>`;
        h += `<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;color:#FF3B30">Balance Due</div><div style="font-size:22px;font-weight:800;color:#FF3B30;font-family:${mono}">${fmtCur(pt.balanceDue, c)}</div></div>`;
        h += '</div>';
    }
    h += '</div>';
    h += buildBankFooterHtml(bc);
    h += '</div>';
    return h;
}

function buildSignatureBlock(p, bc) {
    const senderSig = CONFIG?.signature?.startsWith('data:image/') ? CONFIG.signature : '';
    const clientSig = p.clientResponse?.clientSignature?.startsWith('data:image/') ? p.clientResponse.clientSignature : '';
    return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px;padding-top:20px;border-top:1px solid #e4e4e7;page-break-inside:avoid;break-inside:avoid">
        <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#a1a1aa;margin-bottom:8px">Provider</div>
            ${senderSig ? `<img src="${senderSig}" style="max-width:180px;height:auto;margin-bottom:4px" alt="Signature">` : '<div style="border-bottom:1px solid #333;width:180px;height:40px;margin-bottom:4px"></div>'}
            <div style="font-size:12px;font-weight:600">${esc(p.sender.company)}</div>
            <div style="font-size:11px;color:#71717a">Date: ${fmtDate(p.date)}</div></div>
        <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#a1a1aa;margin-bottom:8px">Client</div>
            ${clientSig ? `<img src="${clientSig}" style="max-width:180px;height:auto;margin-bottom:4px" alt="Signature">` : '<div style="border-bottom:1px solid #333;width:180px;height:40px;margin-bottom:4px"></div>'}
            <div style="font-size:12px;font-weight:600">${esc(p.client.name)}</div>
            <div style="font-size:11px;color:#71717a">Date: _______________</div></div>
    </div>`;
}
