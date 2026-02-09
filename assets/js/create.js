// ════════════════════════════════════════
// CREATE / DUPLICATE / DELETE + SIDEBAR + CONTEXT MENU + SHARING
// ════════════════════════════════════════

const TPLS = {
    blank: { title: 'Untitled Proposal', sections: [], lineItems: [], paymentTerms: '' },
    web: { title: 'Web Development Proposal', sections: [{ title: 'Executive Summary', content: 'We are pleased to present this proposal for the design and development of your new website. Our team brings extensive experience in building modern, responsive, and conversion-focused web solutions.' }, { title: 'Scope of Work', content: '\u2022 Custom UI/UX Design (Desktop + Mobile)\n\u2022 Frontend Development (HTML, CSS, JS)\n\u2022 CMS Integration & Setup\n\u2022 SEO Foundation Setup\n\u2022 Performance Optimization\n\u2022 Cross-browser & Device Testing\n\u2022 30-day Post-launch Support' }, { title: 'Timeline', content: 'Phase 1 \u2014 Discovery & Wireframes: Week 1\u20132\nPhase 2 \u2014 UI Design: Week 3\u20134\nPhase 3 \u2014 Development: Week 5\u20138\nPhase 4 \u2014 Testing & Launch: Week 9\u201310' }, { title: 'Terms & Conditions', content: 'All IP transfers to client upon final payment. Source files delivered within 5 business days of project completion. Either party may terminate with 15 days written notice.' }], lineItems: [{ desc: 'UI/UX Design', detail: 'Wireframes, mockups, and interactive prototypes for all pages', qty: 1, rate: 25000 }, { desc: 'Frontend Development', detail: 'Responsive HTML/CSS/JS implementation with cross-browser support', qty: 1, rate: 40000 }, { desc: 'CMS Integration', detail: 'WordPress/headless CMS setup with content migration', qty: 1, rate: 15000 }, { desc: 'SEO Setup', detail: 'Technical SEO, meta tags, sitemap, and analytics integration', qty: 1, rate: 10000 }], paymentTerms: '50% advance before kickoff.\n50% upon completion before deployment.\nPayment due within 7 days of invoice.' },
    design: { title: 'Design Services Proposal', sections: [{ title: 'Overview', content: 'This proposal outlines our approach to creating a cohesive brand identity that elevates your presence across all touchpoints.' }, { title: 'Deliverables', content: '\u2022 Brand Strategy & Positioning\n\u2022 Logo Design (3 concepts, 2 revision rounds)\n\u2022 Brand Guidelines Document\n\u2022 Business Card & Letterhead\n\u2022 Social Media Templates' }, { title: 'Process', content: 'Step 1: Discovery Workshop\nStep 2: Moodboard & Direction\nStep 3: Concept Presentation\nStep 4: Refinement\nStep 5: Final Delivery' }], lineItems: [{ desc: 'Brand Strategy', detail: 'Market research, competitor analysis, and positioning framework', qty: 1, rate: 15000 }, { desc: 'Logo Design', detail: '3 initial concepts with 2 rounds of revisions', qty: 1, rate: 20000 }, { desc: 'Brand Guidelines', detail: 'Typography, color palette, logo usage, and tone of voice', qty: 1, rate: 10000 }, { desc: 'Collateral Design', detail: 'Business cards, letterhead, and social media templates', qty: 1, rate: 12000 }], paymentTerms: '40% advance, 30% midpoint, 30% on completion.' },
    consulting: { title: 'Consulting Engagement Proposal', sections: [{ title: 'Background', content: 'Based on our discussions, we understand the challenges your organization faces and are confident in delivering actionable recommendations.' }, { title: 'Approach', content: '\u2022 Stakeholder Interviews\n\u2022 Current State Assessment\n\u2022 Gap Analysis\n\u2022 Recommendations Report\n\u2022 Implementation Roadmap\n\u2022 Monthly Check-ins (3 months)' }, { title: 'Expected Outcomes', content: 'Clear understanding of bottlenecks, prioritized action plan with quick wins and long-term strategies, and measurable KPIs.' }], lineItems: [{ desc: 'Discovery & Assessment', detail: 'Stakeholder interviews, current state analysis, and gap identification', qty: 1, rate: 30000 }, { desc: 'Strategy Report', detail: 'Comprehensive recommendations with prioritized action plan', qty: 1, rate: 25000 }, { desc: 'Monthly Retainer', detail: 'Ongoing advisory, check-ins, and implementation support', qty: 3, rate: 15000 }], paymentTerms: '100% Discovery upfront. Retainer billed monthly.' }
};

function createProp(tpl) {
    const id = uid();
    const existingNumbers = DB.map(p => {
        const match = (p.number || '').match(/PROP-(\d+)/);
        return match ? parseInt(match[1]) : 0;
    });
    const nextNum = existingNumbers.length ? Math.max(...existingNumbers) + 1 : 1;
    const num = 'PROP-' + String(nextNum).padStart(3, '0');
    const today = new Date().toISOString().split('T')[0];
    const valid = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const p = {
        id, status: 'draft', title: tpl.title || 'Untitled', number: num, date: today, validUntil: valid,
        sender: { company: CONFIG?.company || '', email: CONFIG?.email || '', address: CONFIG?.address || '' },
        client: { name: '', contact: '', email: '', phone: '' },
        sections: JSON.parse(JSON.stringify(tpl.sections || [])),
        lineItems: JSON.parse(JSON.stringify(tpl.lineItems || [])),
        currency: '\u20B9', paymentTerms: tpl.paymentTerms || '', version: 1, coverPage: false,
        packagesEnabled: false, packages: null, packageFeatures: [],
        addOns: [], paymentSchedule: [], paymentScheduleMode: 'percentage',
        notes: [{ text: 'Proposal created', time: Date.now(), type: 'system' }],
        createdAt: Date.now()
    };
    DB.unshift(p); persist();
    loadEditor(id);
    toast('Proposal created');
}

function dupProp(id) {
    const src = DB.find(p => p.id === id); if (!src) return;
    const dup = JSON.parse(JSON.stringify(src));
    dup.id = uid();
    dup.title = src.title + ' (Copy)';
    const existingNums = DB.map(p => { const m = (p.number||'').match(/PROP-(\d+)/); return m ? parseInt(m[1]) : 0; });
    dup.number = 'PROP-' + String((existingNums.length ? Math.max(...existingNums) : 0) + 1).padStart(3, '0');
    dup.status = 'draft';
    dup.createdAt = Date.now();
    dup.notes = [{ text: 'Duplicated from ' + src.number, time: Date.now(), type: 'system' }];
    DB.unshift(dup); persist();
    loadEditor(dup.id);
    toast('Proposal duplicated');
}

// Phase 1.7: Duplicate with client swap
function dupPropWithClient(id) {
    const src = DB.find(p => p.id === id); if (!src) return;
    if (!CLIENTS.length) { dupProp(id); return; }
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap show'; wrap.id = 'dupClientModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    let items = CLIENTS.map((c, i) => `<div class="cp-item" onclick="doDupWithClient('${id}', ${i})"><span class="cp-item-name">${esc(c.name)}</span><span class="cp-item-email">${esc(c.email)}</span></div>`).join('');
    items += `<div class="cp-item" onclick="doDupWithClient('${id}', -1)" style="color:var(--text4);font-style:italic"><span class="cp-item-name">Keep original client</span></div>`;
    wrap.innerHTML = `<div class="modal modal-sm" onclick="event.stopPropagation()"><div class="modal-t">Duplicate for Client</div><div class="modal-d">Select a client for the duplicated proposal</div><div style="max-height:250px;overflow-y:auto;display:flex;flex-direction:column;gap:3px">${items}</div><div class="modal-foot"><button class="btn-sm-outline" onclick="document.getElementById('dupClientModal').remove()">Cancel</button></div></div>`;
    document.body.appendChild(wrap);
}

function doDupWithClient(id, clientIdx) {
    document.getElementById('dupClientModal')?.remove();
    const src = DB.find(p => p.id === id); if (!src) return;
    const dup = JSON.parse(JSON.stringify(src));
    dup.id = uid();
    dup.title = src.title + ' (Copy)';
    const existingNums = DB.map(p => { const m = (p.number||'').match(/PROP-(\d+)/); return m ? parseInt(m[1]) : 0; });
    dup.number = 'PROP-' + String((existingNums.length ? Math.max(...existingNums) : 0) + 1).padStart(3, '0');
    dup.status = 'draft';
    dup.createdAt = Date.now();
    if (clientIdx >= 0 && CLIENTS[clientIdx]) {
        const c = CLIENTS[clientIdx];
        dup.client = { name: c.name || '', contact: c.contact || '', email: c.email || '', phone: c.phone || '' };
        dup.notes = [{ text: 'Duplicated from ' + src.number + ' for ' + c.name, time: Date.now(), type: 'system' }];
    } else {
        dup.notes = [{ text: 'Duplicated from ' + src.number, time: Date.now(), type: 'system' }];
    }
    DB.unshift(dup); persist();
    loadEditor(dup.id);
    toast('Proposal duplicated');
}

function delProp(id) {
    confirmDialog('Delete this proposal? This cannot be undone.', () => {
        DB = DB.filter(p => p.id !== id); persist();
        if (CUR === id) CUR = null;
        renderDashboard();
        refreshSide();
        toast('Proposal deleted');
    }, { title: 'Delete Proposal', confirmText: 'Delete' });
}

function fromTpl(key) { closeNewModal(); createProp(TPLS[key] || TPLS.blank); }

// ════════════════════════════════════════
// VERSIONING
// ════════════════════════════════════════
function bumpVersion() {
    const p = cur(); if (!p) return;
    p.version = (p.version || 1) + 1;
    p.notes = p.notes || [];
    p.notes.push({ text: `Version bumped to v${p.version}`, time: Date.now(), type: 'system' });
    persist();
    loadEditor(CUR);
    toast('Version updated to v' + p.version);
}

// ════════════════════════════════════════
// COVER PAGE
// ════════════════════════════════════════
function toggleCover() {
    const p = cur(); if (!p) return;
    p.coverPage = !p.coverPage;
    persist();
    loadEditor(CUR);
}

// ════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════
function archiveProp(id) {
    const p = DB.find(x => x.id === id); if (!p) return;
    p.archived = true;
    p.notes = p.notes || [];
    p.notes.push({ text: 'Proposal archived', time: Date.now(), type: 'system' });
    persist();
    if (CUR === id) { CUR = null; renderDashboard(); }
    else renderDashboard();
    refreshSide();
    toast('Proposal archived');
}

function unarchiveProp(id) {
    const p = DB.find(x => x.id === id); if (!p) return;
    p.archived = false;
    p.notes = p.notes || [];
    p.notes.push({ text: 'Proposal unarchived', time: Date.now(), type: 'system' });
    persist();
    renderDashboard();
    refreshSide();
    toast('Proposal restored');
}

function refreshSide() {
    const active = activeDB();
    document.getElementById('propCnt').textContent = active.length;
    const cntEl = document.getElementById('clientCnt');
    if (cntEl) cntEl.textContent = CLIENTS.length;
    const list = document.getElementById('recentList');
    list.innerHTML = '';
    active.slice(0, 8).forEach(p => {
        const d = document.createElement('div');
        d.className = 'ri' + (p.id === CUR ? ' on' : '');
        d.innerHTML = `<span class="ri-dot ${p.status}"></span><span class="ri-text">${esc(p.title || 'Untitled')}</span>`;
        d.onclick = () => loadEditor(p.id);
        d.oncontextmenu = (e) => showCtx(e, p.id);
        list.appendChild(d);
    });
}

// ════════════════════════════════════════
// CONTEXT MENU
// ════════════════════════════════════════
function showCtx(e, id) {
    e.preventDefault(); e.stopPropagation();
    ctxTarget = id;
    const p = DB.find(x => x.id === id);
    const ctx = document.getElementById('ctxMenu');
    const archiveEl = document.getElementById('ctxArchive');
    const unarchiveEl = document.getElementById('ctxUnarchive');
    if (archiveEl) archiveEl.style.display = p?.archived ? 'none' : '';
    if (unarchiveEl) unarchiveEl.style.display = p?.archived ? '' : 'none';
    ctx.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
    ctx.style.top = Math.min(e.clientY, window.innerHeight - 160) + 'px';
    ctx.classList.add('show');
}

function hideCtx() { document.getElementById('ctxMenu').classList.remove('show'); }

function ctxAction(action) {
    hideCtx();
    if (action === 'open') loadEditor(ctxTarget);
    else if (action === 'dup') dupProp(ctxTarget);
    else if (action === 'dupClient') dupPropWithClient(ctxTarget);
    else if (action === 'export') { CUR = ctxTarget; doExport('proposal'); }
    else if (action === 'invoice') { CUR = ctxTarget; doExport('invoice'); }
    else if (action === 'archive') archiveProp(ctxTarget);
    else if (action === 'unarchive') unarchiveProp(ctxTarget);
    else if (action === 'del') delProp(ctxTarget);
}

// ════════════════════════════════════════
// CLIENT PORTAL / SHARING
// ════════════════════════════════════════
function generateShareToken() {
    return 'sh_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function shareProposal() {
    const p = cur();
    if (!p) return;

    if (!p.shareToken) {
        p.shareToken = generateShareToken();
        p.sharedAt = Date.now();
        p.viewCount = 0;
        persist();
    }

    const baseUrl = window.location.href.replace(/\/[^\/]*$/, '/');
    const shareUrl = baseUrl + 'client.html?p=' + p.shareToken;

    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap show';
    wrap.id = 'shareModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };

    wrap.innerHTML = `
        <div class="modal modal-sm" onclick="event.stopPropagation()">
            <div class="modal-t"><i data-lucide="share-2" style="width:20px;height:20px;margin-right:8px;vertical-align:-4px"></i> Share Proposal</div>
            <div class="modal-d">Send this link to your client. They can view the proposal and accept or decline it directly.</div>

            <div style="margin:16px 0">
                <label class="form-label">Client Portal Link</label>
                <div style="display:flex;gap:8px">
                    <input type="text" class="input" id="shareLink" value="${shareUrl}" readonly style="flex:1;font-size:12px">
                    <button class="btn-sm" onclick="copyShareLink()">
                        <i data-lucide="copy"></i> Copy
                    </button>
                </div>
            </div>

            ${p.viewCount > 0 ? `
            <div class="share-stats" style="background:var(--muted);padding:12px;border-radius:8px;margin-bottom:16px">
                <div style="display:flex;gap:20px;font-size:13px">
                    <div><strong>${p.viewCount}</strong> views</div>
                    <div>Last viewed: ${p.lastViewedAt ? timeAgo(p.lastViewedAt) : 'Never'}</div>
                </div>
            </div>
            ` : ''}

            <div class="modal-foot">
                <button class="btn-sm-outline" onclick="document.getElementById('shareModal').remove()">Close</button>
                <button class="btn-sm-outline" onclick="window.open('${shareUrl}', '_blank')">
                    <i data-lucide="external-link"></i> Open Preview
                </button>
            </div>
        </div>`;
    document.body.appendChild(wrap);
    lucide.createIcons();
}

function copyShareLink() {
    const input = document.getElementById('shareLink');
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
        toast('Link copied to clipboard!');
    }).catch(() => {
        document.execCommand('copy');
        toast('Link copied!');
    });
}

function getProposalByToken(token) {
    return DB.find(p => p.shareToken === token);
}

function recordProposalView(token) {
    const p = getProposalByToken(token);
    if (!p) return null;
    p.viewCount = (p.viewCount || 0) + 1;
    p.lastViewedAt = Date.now();
    persist();
    return p;
}

function respondToProposal(token, status, comment) {
    const p = getProposalByToken(token);
    if (!p) return false;

    p.clientResponse = {
        status: status,
        respondedAt: Date.now(),
        comment: comment || ''
    };

    if (status === 'accepted') p.status = 'accepted';
    else if (status === 'declined') p.status = 'declined';

    persist();
    return true;
}
