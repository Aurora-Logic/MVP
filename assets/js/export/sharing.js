// ════════════════════════════════════════
// SHARING — Client Portal & Share Links
// ════════════════════════════════════════

/* exported shareProposal, copyShareLink, recordProposalView, respondToProposal */
function generateShareToken() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return 'sh_' + Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

// SECURITY FIX: Rate limiting for share token access
const SHARE_RATE_LIMIT = 10; // max attempts per minute
const _shareAttempts = new Map(); // IP → {count, resetAt}

function checkShareRateLimit(identifier) {
    const now = Date.now();
    const record = _shareAttempts.get(identifier);

    if (!record || now > record.resetAt) {
        _shareAttempts.set(identifier, { count: 1, resetAt: now + 60000 });
        return true;
    }

    if (record.count >= SHARE_RATE_LIMIT) {
        console.warn('[Security] Share rate limit exceeded:', identifier);
        return false;
    }

    record.count++;
    return true;
}

function shareProposal() {
    const p = cur();
    if (!p) return;

    // SECURITY FIX: Add expiration (30 days default)
    const expiresIn = 30 * 24 * 60 * 60 * 1000; // 30 days
    const now = Date.now();

    if (!p.shareToken || (p.shareExpiresAt && p.shareExpiresAt < now)) {
        p.shareToken = generateShareToken();
        p.sharedAt = now;
        p.shareExpiresAt = now + expiresIn;
        p.viewCount = 0;
        persist();
    }

    const baseUrl = window.location.href.replace(/\/[^/]*$/, '/');
    const shareUrl = baseUrl + 'client.html?p=' + p.shareToken;

    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.id = 'shareModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };

    wrap.innerHTML = `
        <div class="modal modal-sm" onclick="event.stopPropagation()">
            <div class="modal-t"><i data-lucide="share-2" style="width:20px;height:20px;margin-right:8px;vertical-align:-4px"></i> Share proposal</div>
            <div class="modal-d">Send this link to your client. They can view the proposal and accept or decline it directly.</div>

            <div style="margin:16px 0">
                <label class="form-label">Client portal link</label>
                <div style="display:flex;gap:8px">
                    <input type="text" class="input" id="shareLink" value="${esc(shareUrl)}" readonly style="flex:1;font-size:12px">
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
                <button class="btn-sm-outline" onclick="window.open('${escAttr(shareUrl)}', '_blank', 'noopener,noreferrer')">
                    <i data-lucide="external-link"></i> Open Preview
                </button>
            </div>
        </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
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
    // SECURITY FIX: Check rate limit and expiration
    const identifier = 'share_' + token.substring(0, 8);
    if (!checkShareRateLimit(identifier)) {
        console.warn('[Security] Rate limit exceeded for token:', token);
        return null;
    }

    const p = DB.find(p => p.shareToken === token);
    if (p && p.shareExpiresAt && p.shareExpiresAt < Date.now()) {
        console.warn('[Security] Expired share token:', token);
        return null; // Token expired
    }

    return p;
}

function recordProposalView(token) {
    const p = getProposalByToken(token);
    if (!p) return null;
    p.viewCount = (p.viewCount || 0) + 1;
    p.lastViewedAt = Date.now();
    persist();
    return p;
}

function respondToProposal(token, status, comment, opts) {
    const p = getProposalByToken(token);
    if (!p) return false;

    p.clientResponse = {
        status: status,
        respondedAt: Date.now(),
        comment: comment || ''
    };
    if (opts?.clientName) p.clientResponse.clientName = opts.clientName;
    if (opts?.clientSignature) p.clientResponse.clientSignature = opts.clientSignature;

    if (status === 'accepted') p.status = 'accepted';
    else if (status === 'declined') p.status = 'declined';

    persist();
    return true;
}
