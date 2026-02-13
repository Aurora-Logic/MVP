// ════════════════════════════════════════
// CLIENT PORTAL — Proposal viewer logic
// ════════════════════════════════════════

// Supabase config (same as main app)
const SB_URL = 'https://fhttdaouzyfvfegvrpil.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodHRkYW91enlmdmZlZ3ZycGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzQ1NzIsImV4cCI6MjA4NjMxMDU3Mn0.wUrvbM2Jaeuta90XJZCSgyeL7DqE3T3upwWe9wRaZLA';

// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('p');

// Load proposal data from localStorage (shared with main app)
const DB = JSON.parse(localStorage.getItem('pk_db') || '[]');
const CONFIG = JSON.parse(localStorage.getItem('pk_config') || 'null');
let proposal = null;

function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function sanitizeHtml(html) {
    if (!html || typeof html !== 'string') return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('script,iframe,object,embed,form,style,link,meta,base,svg').forEach(el => el.remove());
    div.querySelectorAll('*').forEach(el => {
        [...el.attributes].forEach(attr => {
            const name = attr.name.toLowerCase();
            if (name.startsWith('on') || name === 'srcdoc' || name === 'formaction' || name === 'xlink:href') el.removeAttribute(attr.name);
            if (name === 'href' || name === 'src' || name === 'action') {
                const val = (attr.value || '').trim().toLowerCase();
                if (val.startsWith('javascript:') || val.startsWith('data:text') || val.startsWith('vbscript:')) el.removeAttribute(attr.name);
            }
        });
    });
    return div.innerHTML;
}

function fmtCur(n, c) {
    const currency = c || '₹';
    const displayCurrency = currency === '¥CN' ? '¥' : currency;
    const val = (typeof n === 'number' && isFinite(n)) ? n : 0;
    const locale = (currency === '₹') ? 'en-IN' : 'en-US';
    return displayCurrency + val.toLocaleString(locale);
}

function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    const isIN = CONFIG?.country === 'IN';
    return dt.toLocaleDateString(isIN ? 'en-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// persist() removed — client page is read-only to prevent data tampering

async function init() {
    if (!token) {
        showError('Invalid Link', 'This proposal link is invalid or expired.');
        return;
    }

    // Try Supabase first (works for external viewers on different devices)
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        try {
            const sbClient = window.supabase.createClient(SB_URL, SB_KEY);
            const { data } = await sbClient.rpc('get_shared_proposal', { token });
            if (data) {
                proposal = data;
                if (proposal.clientResponse) { showResponded(proposal.clientResponse.status); return; }
                renderProposal();
                return;
            }
        } catch (e) { console.warn('Cloud fetch failed, trying localStorage:', e); }
    }

    // Fallback: localStorage (same-device, offline)
    proposal = DB.find(p => p.shareToken === token);
    if (!proposal) {
        showError('Proposal Not Found', 'This proposal may have been deleted or the link is incorrect.');
        return;
    }
    if (proposal.clientResponse) { showResponded(proposal.clientResponse.status); return; }
    renderProposal();
}

function buildTopbar(title) {
    const company = proposal?.sender?.company || CONFIG?.company || 'ProposalKit';
    return `<header class="topbar">
        <div class="topbar-left">
            ${CONFIG?.logo ? `<img src="${esc(CONFIG.logo)}" class="topbar-logo">` : ''}
            <span class="topbar-company">${esc(company)}</span>
            ${title ? `<span class="topbar-sep">/</span><span class="topbar-title">${esc(title)}</span>` : ''}
        </div>
        <div class="topbar-actions"></div>
    </header>`;
}

function showError(title, message) {
    document.getElementById('app').innerHTML = `
        ${buildTopbar('')}
        <div class="container">
            <div class="error">
                <i data-lucide="alert-triangle" class="error-icon"></i>
                <div class="error-t">${esc(title)}</div>
                <div class="error-d">${esc(message)}</div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function showResponded(status) {
    const isAccepted = status === 'accepted';
    const cr = proposal.clientResponse || {};
    const sigImg = cr.clientSignature?.startsWith('data:image/') ? cr.clientSignature : '';
    document.getElementById('app').innerHTML = `
        ${buildTopbar(proposal.title || 'Proposal')}
        <div class="container">
            <div class="responded">
                <i data-lucide="${isAccepted ? 'check-circle-2' : 'x-circle'}" class="responded-icon ${status}"></i>
                <div class="responded-t">Proposal ${isAccepted ? 'Accepted' : 'Declined'}</div>
                <div class="responded-d">
                    ${isAccepted
                        ? 'Thank you! Your acceptance has been recorded. The sender has been notified.'
                        : 'This proposal has been declined. The sender has been notified.'}
                </div>
                ${isAccepted && (cr.clientName || sigImg) ? `
                    <div style="margin-top:24px;padding:20px;background:var(--muted);border-radius:12px;text-align:left;max-width:400px;margin-left:auto;margin-right:auto">
                        <div style="font-size:14px;font-weight:600;color:var(--text4);margin-bottom:8px;text-transform:uppercase">Acceptance Record</div>
                        ${cr.clientName ? `<div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px">${esc(cr.clientName)}</div>` : ''}
                        <div style="font-size:12px;color:var(--text3);margin-bottom:12px">${new Date(cr.respondedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        ${sigImg ? `<img src="${sigImg}" alt="Client signature" style="max-width:200px;height:auto;border-bottom:1px solid var(--border);padding-bottom:8px">` : ''}
                    </div>
                ` : ''}
                ${cr.comment ? `
                    <div style="margin-top:16px;padding:16px;background:var(--muted);border-radius:8px;text-align:left;max-width:400px;margin-left:auto;margin-right:auto">
                        <div style="font-size:12px;font-weight:600;color:var(--text4);margin-bottom:4px">Your comment:</div>
                        <div style="color:var(--text2);font-size:14px">${esc(cr.comment)}</div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    lucide.createIcons();
}

function renderProposal() {
    const p = proposal;
    // Dynamic page title: "[Proposal Title] from [Company]"
    const senderName = p.sender?.company || p.sender?.name || '';
    document.title = (p.title || 'Proposal') + (senderName ? ' from ' + senderName : '') + ' — ProposalKit';
    const total = (p.lineItems || []).reduce((sum, item) => sum + (item.qty || 0) * (item.rate || 0), 0);
    const discount = p.discount || 0;
    const taxRate = p.taxRate || 0;
    const taxAmount = (total - discount) * (taxRate / 100);
    const grandTotal = total - discount + taxAmount;

    // Build section navigation
    const sectionNav = (p.sections || []).length > 1
        ? `<div class="section-nav">${(p.sections || []).map((s, i) => `<button class="section-nav-btn" onclick="document.getElementById('sec-${i}').scrollIntoView({behavior:'smooth',block:'start'})"><i data-lucide="${getSectionIcon(s.type)}"></i> ${esc(s.title)}</button>`).join('')}${(p.lineItems || []).length ? '<button class="section-nav-btn" onclick="document.querySelector(\'.pricing-section\').scrollIntoView({behavior:\'smooth\',block:\'start\'})"><i data-lucide="banknote"></i> Pricing</button>' : ''}</div>`
        : '';

    // Build sections HTML
    const sectionsHtml = (p.sections || []).map((s, i) => `
        <div class="section-card" id="sec-${i}">
            <div class="section-title">
                <i data-lucide="${getSectionIcon(s.type)}"></i>
                ${esc(s.title)}
            </div>
            <div class="section-content">
                ${formatContent(s.content)}
            </div>
        </div>
    `).join('');

    // Build pricing table
    let pricingHtml = '';
    if (p.lineItems && p.lineItems.length > 0) {
        const rows = p.lineItems.map(item => `
            <tr>
                <td>${esc(item.desc)}</td>
                <td>${item.qty}</td>
                <td>${fmtCur(item.rate, p.currency)}</td>
                <td class="amount">${fmtCur(item.qty * item.rate, p.currency)}</td>
            </tr>
        `).join('');

        pricingHtml = `
            <div class="pricing-section">
                <div class="pricing-title">Investment</div>
                <table class="pricing-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th style="text-align:right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <div class="pricing-summary">
                    <div class="pricing-row">
                        <span>Subtotal</span>
                        <span>${fmtCur(total, p.currency)}</span>
                    </div>
                    ${discount > 0 ? `<div class="pricing-row"><span>Discount</span><span>-${fmtCur(discount, p.currency)}</span></div>` : ''}
                    ${taxRate > 0 ? `<div class="pricing-row"><span>Tax (${taxRate}%)</span><span>${fmtCur(taxAmount, p.currency)}</span></div>` : ''}
                    <div class="pricing-row total">
                        <span>Total</span>
                        <span>${fmtCur(grandTotal, p.currency)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    const company = p.sender?.company || CONFIG?.company || '';
    document.getElementById('app').innerHTML = `
        <header class="topbar">
            <div class="topbar-left">
                ${CONFIG?.logo ? `<img src="${esc(CONFIG.logo)}" class="topbar-logo">` : ''}
                <span class="topbar-company">${esc(company)}</span>
                <span class="topbar-sep">/</span>
                <span class="topbar-title">${esc(p.title || 'Proposal')}</span>
            </div>
            <div class="topbar-actions">
                <button class="btn btn-out btn-sm" onclick="window.print()"><i data-lucide="printer"></i> Print</button>
            </div>
        </header>

        <div class="container">
            <div class="prop-card">
                ${p.coverPhoto ? `<div class="prop-cover"><img src="${esc(p.coverPhoto)}"></div>` : ''}

                ${sectionNav}
                <div class="prop-header">
                    <div class="prop-title">${esc(p.title)}</div>
                    <div class="prop-meta">
                        <div class="prop-meta-item">
                            <i data-lucide="hash"></i>
                            ${esc(p.number)}
                        </div>
                        <div class="prop-meta-item">
                            <i data-lucide="calendar"></i>
                            ${fmtDate(p.date)}
                        </div>
                        ${p.validUntil ? `
                            <div class="prop-meta-item">
                                <i data-lucide="clock"></i>
                                Valid until ${fmtDate(p.validUntil)}
                            </div>
                        ` : ''}
                        <div class="prop-meta-item">
                            <i data-lucide="user"></i>
                            For: ${esc(p.client?.name || 'Client')}
                        </div>
                    </div>
                </div>

                ${sectionsHtml}
                ${pricingHtml}
            </div>

            <div class="action-bar">
                <div class="action-bar-title">Ready to proceed?</div>
                <div class="action-bar-desc">Review the proposal above and let us know your decision.</div>
                <div class="action-buttons">
                    <button class="btn btn-dark" onclick="showAcceptModal()">
                        <i data-lucide="check"></i>
                        Accept proposal
                    </button>
                    <button class="btn btn-out" onclick="showDeclineModal()">
                        <i data-lucide="x"></i>
                        Decline
                    </button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function getSectionIcon(type) {
    const icons = {
        'intro': 'file-text',
        'scope': 'list-checks',
        'timeline': 'calendar',
        'team': 'users',
        'terms': 'shield',
        'default': 'layers'
    };
    return icons[type] || icons.default;
}

function formatContent(content) {
    if (!content) return '';

    // Handle string content (Tiptap HTML or plain text)
    if (typeof content === 'string') {
        // Tiptap HTML — sanitize dangerous elements/attrs but keep formatting
        if (content.includes('<') && content.includes('>')) {
            return sanitizeHtml(content);
        }
        // Plain text legacy — escape and wrap in paragraphs
        let html = esc(content);
        html = html.split('\n\n').map(p => `<p>${p}</p>`).join('');
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    // Handle Editor.js block format (sanitize to prevent XSS)
    if (content.blocks && Array.isArray(content.blocks)) {
        return content.blocks.map(block => {
            if (block.type === 'paragraph') {
                return `<p>${sanitizeHtml(block.data.text || '')}</p>`;
            }
            if (block.type === 'header') {
                const level = Math.min(6, Math.max(1, block.data.level || 2));
                return `<h${level}>${sanitizeHtml(block.data.text || '')}</h${level}>`;
            }
            if (block.type === 'list') {
                const tag = block.data.style === 'ordered' ? 'ol' : 'ul';
                const items = (block.data.items || []).map(item => {
                    const text = typeof item === 'string' ? item : (item.content || '');
                    return `<li>${sanitizeHtml(text)}</li>`;
                }).join('');
                return `<${tag}>${items}</${tag}>`;
            }
            if (block.type === 'checklist') {
                const items = (block.data.items || []).map(item => {
                    const checked = item.checked ? '✓' : '○';
                    return `<li>${checked} ${sanitizeHtml(item.text || '')}</li>`;
                }).join('');
                return `<ul style="list-style:none;padding-left:0">${items}</ul>`;
            }
            return '';
        }).join('');
    }

    return '';
}

function showAcceptModal() {
    showResponseModal('accept');
}

function showDeclineModal() {
    showResponseModal('decline');
}

function showResponseModal(type) {
    const isAccept = type === 'accept';
    const modal = document.createElement('div');
    modal.className = 'modal-wrap show';
    modal.id = 'responseModal';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
        <div class="modal" style="max-width:${isAccept ? '480px' : '400px'}" onclick="event.stopPropagation()">
            <div class="modal-t">${isAccept ? 'Accept proposal' : 'Decline proposal'}</div>
            <div class="modal-d">${isAccept
                ? 'Type your name and sign below to formally accept this proposal.'
                : 'We\'re sorry to hear that. Please let us know why (optional).'}</div>
            ${isAccept ? `
            <div class="accept-field">
                <label>Full Name</label>
                <input type="text" id="acceptName" placeholder="Type your full name" value="${esc(proposal.client?.name || '')}">
            </div>
            <div class="accept-field">
                <label>Signature</label>
                <div class="sig-canvas-wrap">
                    <canvas id="acceptSigCanvas" width="440" height="120"></canvas>
                    <div class="sig-placeholder" id="sigPlaceholder">Draw your signature here</div>
                    <button class="sig-clear-btn" onclick="clearAcceptSig()">Clear</button>
                </div>
            </div>
            <label class="accept-checkbox">
                <input type="checkbox" id="acceptTerms">
                I have reviewed and accept the terms of this proposal.
            </label>
            ` : ''}
            <div style="margin-bottom:16px">
                <label class="form-label">Comment (optional)</label>
                <textarea class="textarea" id="responseComment" placeholder="${isAccept
                    ? 'Looking forward to working together!'
                    : 'The budget doesn\'t fit our current needs...'}"></textarea>
            </div>
            <div class="modal-foot">
                <button class="btn btn-out btn-sm" onclick="document.getElementById('responseModal').remove()">Cancel</button>
                <button class="btn ${isAccept ? 'btn-dark' : 'btn-out'} btn-sm" id="submitBtn" onclick="submitResponse('${type}')">
                    ${isAccept ? 'Accept & Sign' : 'Decline'}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    if (isAccept) setupAcceptSigCanvas();
}

function setupAcceptSigCanvas() {
    const canvas = document.getElementById('acceptSigCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false, lastX = 0, lastY = 0, hasDrawn = false;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX;
        const y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * scaleY;
        return { x, y };
    };
    const start = (e) => { drawing = true; const pos = getPos(e); lastX = pos.x; lastY = pos.y; };
    const draw = (e) => {
        if (!drawing) return; e.preventDefault();
        const pos = getPos(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(pos.x, pos.y); ctx.stroke();
        lastX = pos.x; lastY = pos.y;
        if (!hasDrawn) { hasDrawn = true; const ph = document.getElementById('sigPlaceholder'); if (ph) ph.style.display = 'none'; }
    };
    const stop = () => { drawing = false; };
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stop); canvas.addEventListener('mouseleave', stop);
    canvas.addEventListener('touchstart', start, { passive: false }); canvas.addEventListener('touchmove', draw, { passive: false }); canvas.addEventListener('touchend', stop);
    canvas._hasDrawn = () => hasDrawn;
}

function clearAcceptSig() {
    const canvas = document.getElementById('acceptSigCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const ph = document.getElementById('sigPlaceholder'); if (ph) ph.style.display = '';
    canvas._hasDrawn = () => false;
    setupAcceptSigCanvas();
}

async function submitResponse(type) {
    const comment = document.getElementById('responseComment')?.value || '';
    const status = type === 'accept' ? 'accepted' : 'declined';

    let clientName = '', clientSignature = '';
    if (type === 'accept') {
        clientName = document.getElementById('acceptName')?.value?.trim() || '';
        const terms = document.getElementById('acceptTerms');
        const canvas = document.getElementById('acceptSigCanvas');

        if (!clientName) { alert('Please enter your full name.'); document.getElementById('acceptName')?.focus(); return; }
        if (!terms?.checked) { alert('Please check the acceptance checkbox.'); return; }
        if (canvas && canvas._hasDrawn && !canvas._hasDrawn()) { alert('Please draw your signature.'); return; }
        if (canvas) clientSignature = canvas.toDataURL('image/png');
    }

    // Try cloud response first
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        try {
            const sbClient = window.supabase.createClient(SB_URL, SB_KEY);
            await sbClient.rpc('submit_client_response', {
                p_token: token, p_status: status, p_comment: comment,
                p_client_name: clientName, p_client_signature: clientSignature
            });
        } catch (e) { console.warn('Cloud response failed, saving locally:', e); }
    }

    // Also store locally as fallback
    try {
        const responses = JSON.parse(localStorage.getItem('pk_client_responses') || '[]');
        const response = {
            proposalId: proposal.id,
            token: token,
            status: status,
            respondedAt: Date.now(),
            comment: comment
        };
        if (clientName) response.clientName = clientName;
        if (clientSignature) response.clientSignature = clientSignature;
        responses.push(response);
        localStorage.setItem('pk_client_responses', JSON.stringify(responses));
    } catch (e) { /* storage full */ }

    proposal.clientResponse = { status, respondedAt: Date.now(), comment, clientName, clientSignature };

    document.getElementById('responseModal').remove();
    showResponded(status);
}

// Initialize
init();
lucide.createIcons();
