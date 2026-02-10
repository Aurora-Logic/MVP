// ════════════════════════════════════════
// PDF TEMPLATES
// ════════════════════════════════════════

function buildPricingHtml(rows, c, t, bc, style) {
    if (!rows.length) return '';
    const thStyle = style === 'classic' ? 'background:' + bc + ';color:#fff;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.6px;font-weight:700' : 'text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.6px;font-weight:700;padding:7px 0;border-bottom:1px solid #e4e4e7;color:#a1a1aa';
    const tdStyle = style === 'classic' ? 'padding:8px 10px;border-bottom:1px solid #eee' : 'padding:8px 0;border-bottom:1px solid #f4f4f5';
    let h = `<table style="width:100%;border-collapse:collapse;margin:10px 0"><thead><tr><th style="${thStyle}">Description</th><th style="${thStyle}">Qty</th><th style="${thStyle};text-align:right">Rate</th><th style="${thStyle};text-align:right">Amount</th></tr></thead><tbody>`;
    rows.forEach(r => { h += `<tr><td style="${tdStyle};vertical-align:top">${r.desc}</td><td style="${tdStyle}">${r.qty}</td><td style="${tdStyle};text-align:right;font-family:var(--mono)">${r.rate}</td><td style="${tdStyle};text-align:right;font-family:var(--mono);font-weight:500">${r.amt}</td></tr>`; });
    h += '</tbody></table>';
    h += '<div style="display:flex;justify-content:flex-end;margin-top:8px"><div style="width:220px">';
    h += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:#71717a"><span>Subtotal</span><span style="font-family:var(--mono)">${fmtCur(t.subtotal, c)}</span></div>`;
    if (t.disc) h += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:#71717a"><span>Discount</span><span style="font-family:var(--mono)">\u2212${fmtCur(t.disc, c)}</span></div>`;
    const txLabel = typeof taxLabel === 'function' ? taxLabel() : 'Tax';
    if (t.taxRate) h += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:#71717a"><span>${txLabel} (${t.taxRate}%)</span><span style="font-family:var(--mono)">${fmtCur(t.taxAmt, c)}</span></div>`;
    if (t.addOnsTotal) h += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:#71717a"><span>Add-Ons</span><span style="font-family:var(--mono)">${fmtCur(t.addOnsTotal, c)}</span></div>`;
    h += `<div style="display:flex;justify-content:space-between;padding:8px 0 0;font-size:16px;font-weight:700;border-top:2px solid ${bc};margin-top:4px"><span>Total</span><span style="font-family:var(--mono)">${fmtCur(t.grand, c)}</span></div>`;
    h += '</div></div>';
    return h;
}

function buildSenderDetails() {
    const parts = [CONFIG?.email, CONFIG?.phone, CONFIG?.address].filter(Boolean).map(v => esc(v));
    if (CONFIG?.website) parts.push(esc(CONFIG.website));
    return parts.join('<br>');
}

function buildSenderTaxLine() {
    const country = CONFIG?.country || '';
    // India stores tax IDs in separate fields (gstin, pan, udyam), not taxId
    if (country === 'IN') {
        const parts = [];
        if (CONFIG?.gstin) parts.push('GSTIN: ' + esc(CONFIG.gstin));
        if (CONFIG?.pan) parts.push('PAN: ' + esc(CONFIG.pan));
        if (parts.length) return `<div style="font-size:10px;color:#a1a1aa;margin-top:4px">${parts.join(' | ')}</div>`;
        return '';
    }
    if (!CONFIG?.taxId) return '';
    const labels = { US: 'EIN', GB: 'VAT', AU: 'ABN', CA: 'BN', DE: 'USt-IdNr', FR: 'SIREN', SG: 'UEN', AE: 'TRN', NL: 'BTW', JP: 'Corp. No', SE: 'Org.nr', CH: 'UID', NZ: 'NZBN', IE: 'VAT' };
    const label = labels[country] || 'Tax ID';
    return `<div style="font-size:10px;color:#a1a1aa;margin-top:4px">${label}: ${esc(CONFIG.taxId)}</div>`;
}

function buildCoverHtml(p, bc) {
    const logo = CONFIG?.logo ? `<img src="${esc(CONFIG.logo)}" style="max-height:44px;margin-bottom:20px">` : '';
    const coverImg = p.coverPhoto ? `<img src="${esc(p.coverPhoto)}" style="width:100%;max-height:280px;object-fit:cover;border-radius:8px;margin-bottom:28px">` : '';
    return `<div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;min-height:500px;padding:60px 40px">
    ${logo}
    ${coverImg}
    <div style="font-size:32px;font-weight:800;color:#09090b;letter-spacing:-1px;line-height:1.2;margin-bottom:8px">${esc(p.title)}</div>
    <div style="width:50px;height:3px;background:${bc};margin:16px auto;border-radius:2px"></div>
    <div style="font-size:14px;color:#71717a;margin-bottom:32px">Prepared for <strong style="color:#3f3f46">${esc(p.client.name || 'Client')}</strong></div>
    <div style="font-size:13px;color:#a1a1aa">${esc(p.sender.company)}</div>
    <div style="font-size:12px;color:#a1a1aa;margin-top:4px">${fmtDate(p.date)} \u00B7 ${esc(p.number)}${p.version > 1 ? ' \u00B7 v' + p.version : ''}</div>
  </div><div style="page-break-after:always"></div>`;
}

function buildModernTpl(p, c, bc, t, rows, secs, logo, title, num, isInv) {
    const ver = p.version > 1 ? ` <span style="font-size:12px;font-weight:500;color:#a1a1aa">v${p.version}</span>` : '';
    let h = logo;
    h += `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px"><div><h1 style="font-size:24px;font-weight:800;color:#18181b;letter-spacing:-.5px;margin:0 0 4px">${title}${ver}</h1><div style="font-size:13px;color:#71717a">${num} \u00B7 ${fmtDate(p.date)}</div></div><div style="text-align:right;padding:10px 16px;border-radius:6px;background:${bc}0D"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;color:${bc}">${isInv ? 'Amount Due' : 'Estimated Total'}</div><div style="font-size:20px;font-weight:800;color:${bc};font-family:var(--mono)">${fmtCur(t.grand, c)}</div></div></div>`;
    h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px;padding:18px;border-radius:8px;border:1px solid #e4e4e7;background:#fafafa">`;
    h += `<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;color:${bc};margin-bottom:4px">From</div><div style="font-size:13px;font-weight:600;color:#18181b">${esc(p.sender.company || '\u2014')}</div><div style="font-size:11px;color:#71717a;margin-top:2px">${buildSenderDetails()}</div>${buildSenderTaxLine()}</div>`;
    h += `<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;color:${bc};margin-bottom:4px">${isInv ? 'Bill To' : 'To'}</div><div style="font-size:13px;font-weight:600;color:#18181b">${esc(p.client.name || '\u2014')}</div><div style="font-size:11px;color:#71717a;margin-top:2px">${[p.client.contact, p.client.email].filter(Boolean).map(v => esc(v)).join('<br>')}</div></div>`;
    h += `<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;color:${bc};margin-bottom:4px">Date</div><div style="font-size:13px;color:#18181b">${fmtDate(p.date)}</div></div>`;
    h += `<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;color:${bc};margin-bottom:4px">${isInv ? 'Due Date' : 'Valid Until'}</div><div style="font-size:13px;color:#18181b">${fmtDate(p.validUntil)}</div></div>`;
    h += '</div>';
    if (!isInv) secs.forEach(s => { if (s.type && typeof buildStructuredSectionPdf === 'function') { h += buildStructuredSectionPdf(s, bc); } else { h += `<div style="margin-bottom:20px"><div style="font-size:14px;font-weight:700;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid ${bc};color:${bc}">${esc(s.title)}</div><div style="color:#3f3f46;font-size:13px;line-height:1.7">${editorJsToHtml(s.content, p)}</div></div>`; } });
    if (rows.length) { h += `<div style="font-size:14px;font-weight:700;margin:22px 0 8px;padding-bottom:6px;border-bottom:2px solid ${bc};color:${bc}">${isInv ? 'Items' : 'Pricing'}</div>`; h += buildPricingHtml(rows, c, t, bc, 'modern'); }
    if (p.paymentTerms) h += `<div style="font-size:14px;font-weight:700;margin:22px 0 8px;padding-bottom:6px;border-bottom:2px solid ${bc};color:${bc}">Payment Terms</div><div style="color:#3f3f46;font-size:13px;line-height:1.7">${editorJsToHtml(p.paymentTerms, p)}</div>`;
    return h;
}

function buildClassicTpl(p, c, bc, t, rows, secs, logo, title, num, isInv) {
    const ver = p.version > 1 ? ' v' + p.version : '';
    let h = `<div style="background:${bc};color:#fff;padding:20px 24px;margin:-20px -20px 24px;display:flex;justify-content:space-between;align-items:center">${logo ? logo.replace(/style="([^"]*)"/, 'style="max-height:36px;filter:brightness(0) invert(1)"') : ''}<div style="font-size:22px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px">${title}${ver}</div><div style="text-align:right;font-size:12px;opacity:.85"><div>${num}</div><div>${fmtDate(p.date)}</div></div></div>`;
    h += `<div style="display:flex;gap:32px;margin-bottom:28px">`;
    h += `<div style="flex:1;padding:14px;border:1px solid #e4e4e7;border-radius:4px"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:${bc};letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f4f4f5">From</div><div style="font-size:13px;font-weight:600">${esc(p.sender.company)}</div><div style="font-size:12px;color:#71717a;margin-top:2px">${buildSenderDetails()}</div>${buildSenderTaxLine()}</div>`;
    h += `<div style="flex:1;padding:14px;border:1px solid #e4e4e7;border-radius:4px"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:${bc};letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f4f4f5">${isInv ? 'Bill To' : 'To'}</div><div style="font-size:13px;font-weight:600">${esc(p.client.name)}</div><div style="font-size:12px;color:#71717a;margin-top:2px">${esc(p.client.contact)}</div><div style="font-size:12px;color:#71717a">${esc(p.client.email)}</div></div>`;
    h += `<div style="padding:14px;border:1px solid #e4e4e7;border-radius:4px;min-width:120px"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:${bc};letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f4f4f5">${isInv ? 'Due Date' : 'Valid Until'}</div><div style="font-size:13px;font-weight:600">${fmtDate(p.validUntil)}</div><div style="font-size:18px;font-weight:800;color:${bc};margin-top:8px;font-family:var(--mono)">${fmtCur(t.grand, c)}</div></div>`;
    h += '</div>';
    if (!isInv) secs.forEach(s => { if (s.type && typeof buildStructuredSectionPdf === 'function') { h += buildStructuredSectionPdf(s, bc); } else { h += `<div style="margin-bottom:16px"><div style="font-size:13px;font-weight:700;text-transform:uppercase;color:${bc};letter-spacing:.5px;margin-bottom:8px">${esc(s.title)}</div><div style="color:#52525b;border-left:3px solid ${bc};padding-left:14px;line-height:1.7">${editorJsToHtml(s.content, p)}</div></div>`; } });
    if (rows.length) { h += `<div style="font-size:13px;font-weight:700;text-transform:uppercase;color:${bc};letter-spacing:.5px;margin:20px 0 8px">${isInv ? 'Items' : 'Pricing'}</div>`; h += buildPricingHtml(rows, c, t, bc, 'classic'); }
    if (p.paymentTerms) h += `<div style="font-size:13px;font-weight:700;text-transform:uppercase;color:${bc};letter-spacing:.5px;margin:20px 0 8px">Payment Terms</div><div style="color:#52525b;line-height:1.7">${editorJsToHtml(p.paymentTerms, p)}</div>`;
    return h;
}

function buildMinimalTpl(p, c, bc, t, rows, secs, logo, title, num, isInv) {
    const ver = p.version > 1 ? ` \u00B7 v${p.version}` : '';
    let h = `<div style="margin-bottom:44px">${logo}<div style="font-size:30px;font-weight:800;color:#09090b;letter-spacing:-1px;line-height:1.1;margin-top:8px">${title}</div>`;
    h += `<div style="width:40px;height:3px;background:${bc};margin:14px 0 18px;border-radius:2px"></div>`;
    h += `<div style="display:flex;gap:24px;font-size:12px;color:#a1a1aa"><span>${num}${ver}</span><span>${fmtDate(p.date)}</span><span>${isInv ? 'Due' : 'Valid'}: ${fmtDate(p.validUntil)}</span></div></div>`;
    h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:36px">`;
    h += `<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#a1a1aa;font-weight:700;margin-bottom:6px">From</div><div style="font-size:14px;font-weight:600;color:#18181b">${esc(p.sender.company)}</div><div style="font-size:12px;color:#71717a;margin-top:2px">${buildSenderDetails()}</div>${buildSenderTaxLine()}</div>`;
    h += `<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#a1a1aa;font-weight:700;margin-bottom:6px">${isInv ? 'Bill To' : 'To'}</div><div style="font-size:14px;font-weight:600;color:#18181b">${esc(p.client.name)}</div><div style="font-size:12px;color:#71717a;margin-top:2px">${esc(p.client.contact)}</div><div style="font-size:12px;color:#71717a">${esc(p.client.email)}</div></div>`;
    h += '</div>';
    if (!isInv) secs.forEach(s => { if (s.type && typeof buildStructuredSectionPdf === 'function') { h += buildStructuredSectionPdf(s, bc); } else { h += `<div style="margin-bottom:24px"><div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#18181b;margin-bottom:8px">${esc(s.title)}</div><div style="color:#52525b;font-size:13px;line-height:1.8">${editorJsToHtml(s.content, p)}</div></div>`; } });
    if (rows.length) { h += `<div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#18181b;margin:28px 0 10px">${isInv ? 'Items' : 'Pricing'}</div>`; h += buildPricingHtml(rows, c, t, bc, 'minimal'); }
    if (p.paymentTerms) h += `<div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#18181b;margin:28px 0 8px">Terms</div><div style="color:#71717a;font-size:12px;line-height:1.8">${editorJsToHtml(p.paymentTerms, p)}</div>`;
    return h;
}

function buildTabularTpl(p, c, bc, t, rows, secs, logo, title, num, isInv) {
    const td = 'padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:13px;vertical-align:top';
    const tdR = `${td};text-align:right;font-family:var(--mono);font-weight:500`;
    const lbl = 'font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;color:#a1a1aa';
    let h = `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">${logo}<div style="text-align:right"><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:${bc}">FROM</div><div style="font-size:13px;font-weight:600;margin-top:2px">${esc(p.sender.company)}</div><div style="font-size:11px;color:#71717a;margin-top:2px">${buildSenderDetails()}</div>${buildSenderTaxLine()}</div></div>`;
    h += `<div style="font-size:22px;font-weight:800;color:#09090b;letter-spacing:-.5px">${title}</div>`;
    h += `<div style="font-size:12px;color:#a1a1aa;margin:4px 0 24px">${num}${p.version > 1 ? ' · v' + p.version : ''} · ${fmtDate(p.date)}</div>`;
    h += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:20px;margin-bottom:28px;padding:16px 0;border-top:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7">`;
    h += `<div><div style="${lbl}">${isInv ? 'Bill To' : 'Client'}</div><div style="font-size:13px;font-weight:600;margin-top:4px">${esc(p.client.name)}</div><div style="font-size:11px;color:#71717a">${esc(p.client.email)}</div></div>`;
    h += `<div><div style="${lbl}">Contact</div><div style="font-size:13px;margin-top:4px">${esc(p.client.contact)}</div><div style="font-size:11px;color:#71717a">${esc(p.client.phone)}</div></div>`;
    h += `<div><div style="${lbl}">Date</div><div style="font-size:13px;margin-top:4px">${fmtDate(p.date)}</div></div>`;
    h += `<div><div style="${lbl}">${isInv ? 'Due' : 'Valid Until'}</div><div style="font-size:13px;margin-top:4px">${fmtDate(p.validUntil)}</div></div></div>`;
    if (!isInv) secs.forEach(s => { if (s.type && typeof buildStructuredSectionPdf === 'function') { h += buildStructuredSectionPdf(s, bc); } else { h += `<div style="margin-bottom:20px"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:${bc};margin-bottom:6px">${esc(s.title)}</div><div style="color:#52525b;font-size:13px;line-height:1.7;padding-left:0">${editorJsToHtml(s.content, p)}</div></div>`; } });
    if (rows.length) {
        h += `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:${bc};margin:24px 0 8px">${isInv ? 'Items' : 'Pricing'}</div>`;
        h += `<table style="width:100%;border-collapse:collapse"><thead><tr><th style="${td};font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:#a1a1aa;border-bottom:2px solid #e4e4e7">Description</th><th style="${td};font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:#a1a1aa;text-align:center;width:8%;border-bottom:2px solid #e4e4e7">Qty</th><th style="${td};font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:#a1a1aa;text-align:right;width:18%;border-bottom:2px solid #e4e4e7">Rate</th><th style="${td};font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:#a1a1aa;text-align:right;width:18%;border-bottom:2px solid #e4e4e7">Amount</th></tr></thead><tbody>`;
        rows.forEach(r => { h += `<tr><td style="${td}">${r.desc}</td><td style="${td};text-align:center">${r.qty}</td><td style="${tdR}">${r.rate}</td><td style="${tdR}">${r.amt}</td></tr>`; });
        h += '</tbody></table>';
        h += '<div style="display:flex;justify-content:flex-end;margin-top:8px"><div style="width:220px">';
        h += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:#71717a"><span>Subtotal</span><span style="font-family:var(--mono)">${fmtCur(t.subtotal, c)}</span></div>`;
        if (t.disc) h += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:#71717a"><span>Discount</span><span style="font-family:var(--mono)">\u2212${fmtCur(t.disc, c)}</span></div>`;
        const txLbl = typeof taxLabel === 'function' ? taxLabel() : 'Tax';
        if (t.taxRate) h += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:#71717a"><span>${txLbl} (${t.taxRate}%)</span><span style="font-family:var(--mono)">${fmtCur(t.taxAmt, c)}</span></div>`;
        if (t.addOnsTotal) h += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:#71717a"><span>Add-Ons</span><span style="font-family:var(--mono)">${fmtCur(t.addOnsTotal, c)}</span></div>`;
        h += `<div style="display:flex;justify-content:space-between;padding:8px 0 0;font-size:16px;font-weight:700;border-top:2px solid ${bc};margin-top:4px"><span>Total</span><span style="font-family:var(--mono)">${fmtCur(t.grand, c)}</span></div>`;
        h += '</div></div>';
    }
    if (p.paymentTerms) h += `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:${bc};margin:24px 0 6px">Payment Terms</div><div style="color:#52525b;font-size:12px;line-height:1.7">${editorJsToHtml(p.paymentTerms, p)}</div>`;
    return h;
}
