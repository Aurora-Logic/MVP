// ════════════════════════════════════════
// CREATE PREVIEW — Live PDF preview for creation page
// ════════════════════════════════════════

/* exported buildCreatePreview */

function buildCreatePreview(state) {
    console.warn('[CREATE PREVIEW] Building preview...', state);
    try {
    const doc = document.getElementById('createPreviewDoc');
    if (!doc) return;

    const tpl = TPLS[state.template] || TPLS.blank;
    const c = defaultCurrency();
    const bc = state.color || CONFIG?.color || '#800020';

    // Build temporary proposal object from state
    const existingNums = DB.map(p => {
        const m = (p.number || '').match(/PROP-(\d+)/);
        return m ? parseInt(m[1]) : 0;
    });
    const nextNum = existingNums.length ? Math.max(...existingNums) + 1 : 1;
    const today = new Date().toISOString().split('T')[0];
    const valid = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const client = state.client || { name: '', contact: '', email: '', phone: '' };
    const enabledSections = (state.sections || []).filter(s => s.enabled);
    const lineItems = state.lineItems || [];

    const tempProposal = {
        id: 'preview',
        title: tpl.title || 'Untitled Proposal',
        number: 'PROP-' + String(nextNum).padStart(3, '0'),
        date: today,
        validUntil: valid,
        status: 'draft',
        version: 1,
        sender: {
            company: CONFIG?.company || 'Your Company',
            email: CONFIG?.email || '',
            address: CONFIG?.address || ''
        },
        client: {
            name: client.name || 'Client Name',
            contact: client.contact || '',
            email: client.email || 'client@example.com',
            phone: client.phone || ''
        },
        sections: enabledSections,
        lineItems: lineItems,
        currency: c,
        discount: 0,
        taxRate: 0,
        paymentTerms: state.paymentTerms || '',
        addOns: [],
        coverPage: false
    };

    // Calculate totals
    const t = calcTotals(tempProposal);

    // Format line item rows (same pattern as preview.js buildPreview)
    const rows = lineItems.filter(i => i.desc).map(i => {
        const a = (i.qty || 0) * (i.rate || 0);
        const detailHtml = i.detail ? _cpEscDetail(i.detail) : '';
        const detail = detailHtml ? '<div style="font-size:11px;color:#71717a;margin-top:2px;line-height:1.5">' + detailHtml + '</div>' : '';
        return {
            desc: '<div style="font-weight:600">' + esc(i.desc) + '</div>' + detail,
            qty: i.qty,
            rate: fmtCur(i.rate || 0, c),
            amt: fmtCur(a, c)
        };
    });

    const secs = enabledSections.filter(s => s.title || s.content);
    const logoHtml = CONFIG?.logo ? '<img class="pd-logo" src="' + esc(CONFIG.logo) + '" alt="' + esc(CONFIG?.company || '') + ' logo" style="max-height:36px;margin-bottom:16px">' : '';

    const docTitle = esc(tempProposal.title);
    const docNum = esc(tempProposal.number);

    // Use Modern template by default for preview
    let html = '';

    // Draft watermark
    html += '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:80px;font-weight:900;color:rgba(0,0,0,0.04);pointer-events:none;z-index:0;letter-spacing:8px;white-space:nowrap">DRAFT</div>';

    // Use the template function (modern by default)
    const tplFns = {
        modern: typeof buildModernTpl === 'function' ? buildModernTpl : null,
        classic: typeof buildClassicTpl === 'function' ? buildClassicTpl : null,
        minimal: typeof buildMinimalTpl === 'function' ? buildMinimalTpl : null
    };
    const fn = tplFns.modern || tplFns.classic || tplFns.minimal;

    if (fn) {
        html += fn(tempProposal, c, bc, t, rows, secs, logoHtml, docTitle, docNum, false);
    } else {
        // Fallback: simple HTML representation
        html += _buildFallbackPreview(tempProposal, c, bc, t, rows, secs, logoHtml);
    }

    doc.innerHTML = html;
    } catch (err) {
        console.error('[CREATE PREVIEW] Error building preview:', err);
        const doc = document.getElementById('createPreviewDoc');
        if (doc) doc.innerHTML = '<div style="padding:40px;color:var(--destructive);text-align:center"><strong>Preview error</strong><br><small>' + esc(err.message) + '</small></div>';
    }
}

// Escape detail text for preview (handles HTML or plain text)
function _cpEscDetail(content) {
    if (!content) return '';
    if (typeof content === 'string') {
        if (content.includes('<') && content.includes('>')) {
            return typeof sanitizeHtml === 'function' ? sanitizeHtml(content) : esc(content);
        }
        return esc(content).replace(/\n/g, '<br>');
    }
    return '';
}

// Fallback preview if no PDF template functions available
function _buildFallbackPreview(p, c, bc, t, rows, secs, logoHtml) {
    let h = '<div style="font-family:system-ui,-apple-system,sans-serif;padding:40px;max-width:800px">';
    // Header
    h += '<div style="border-bottom:3px solid ' + bc + ';padding-bottom:20px;margin-bottom:24px">';
    if (logoHtml) h += logoHtml;
    h += '<div style="font-size:24px;font-weight:700;color:#09090b">' + esc(p.title) + '</div>';
    h += '<div style="font-size:12px;color:#71717a;margin-top:4px">' + esc(p.number) + ' \u00b7 ' + esc(p.date) + '</div>';
    h += '</div>';

    // From / To
    h += '<div style="display:flex;gap:40px;margin-bottom:24px">';
    h += '<div style="flex:1"><div style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">From</div>';
    h += '<div style="font-size:14px;font-weight:600">' + esc(p.sender.company) + '</div>';
    if (p.sender.email) h += '<div style="font-size:12px;color:#71717a">' + esc(p.sender.email) + '</div>';
    h += '</div>';
    h += '<div style="flex:1"><div style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">To</div>';
    h += '<div style="font-size:14px;font-weight:600">' + esc(p.client.name) + '</div>';
    if (p.client.email) h += '<div style="font-size:12px;color:#71717a">' + esc(p.client.email) + '</div>';
    h += '</div></div>';

    // Sections
    secs.forEach(s => {
        h += '<div style="margin-bottom:20px">';
        h += '<div style="font-size:16px;font-weight:600;color:#09090b;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e4e4e7">' + esc(s.title) + '</div>';
        const content = s.content || '';
        if (content.includes('<')) {
            h += '<div style="font-size:13px;line-height:1.6;color:#3f3f46">' + (typeof sanitizeHtml === 'function' ? sanitizeHtml(content) : esc(content)) + '</div>';
        } else {
            h += '<div style="font-size:13px;line-height:1.6;color:#3f3f46">' + esc(content).replace(/\n/g, '<br>') + '</div>';
        }
        h += '</div>';
    });

    // Pricing table
    if (rows.length) {
        h += '<div style="margin-top:24px"><div style="font-size:16px;font-weight:600;margin-bottom:12px;padding-bottom:4px;border-bottom:1px solid #e4e4e7">Pricing</div>';
        h += '<table style="width:100%;border-collapse:collapse;font-size:13px">';
        h += '<tr style="border-bottom:1px solid #e4e4e7"><th style="text-align:left;padding:8px 10px;font-weight:600;font-size:11px;text-transform:uppercase;color:#71717a">Item</th><th style="padding:8px 10px;text-align:center;font-weight:600;font-size:11px;text-transform:uppercase;color:#71717a">Qty</th><th style="padding:8px 10px;text-align:right;font-weight:600;font-size:11px;text-transform:uppercase;color:#71717a">Rate</th><th style="padding:8px 10px;text-align:right;font-weight:600;font-size:11px;text-transform:uppercase;color:#71717a">Amount</th></tr>';
        rows.forEach(r => {
            h += '<tr style="border-bottom:1px solid #f4f4f5"><td style="padding:8px 10px">' + r.desc + '</td><td style="padding:8px 10px;text-align:center">' + r.qty + '</td><td style="padding:8px 10px;text-align:right">' + r.rate + '</td><td style="padding:8px 10px;text-align:right;font-weight:600">' + r.amt + '</td></tr>';
        });
        h += '<tr><td colspan="3" style="padding:10px;text-align:right;font-weight:700">Total</td><td style="padding:10px;text-align:right;font-weight:700;font-size:15px;color:' + bc + '">' + fmtCur(t.grand, c) + '</td></tr>';
        h += '</table></div>';
    }

    h += '</div>';
    return h;
}
