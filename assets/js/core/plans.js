// ════════════════════════════════════════
// PLANS — Subscription Limit Enforcement
// ════════════════════════════════════════
/* exported checkLimit, enforceLimit, showUpgradeModal, getCurrentPlan, getPlanBadge, trackEvent, PLAN_LIMITS */

const PLAN_LIMITS = {
    free:  { proposals: 5, clients: 2, ai: false, team: 1, templates: 3, branding: false, offline: false, pdfCustomization: false },
    pro:   { proposals: Infinity, clients: Infinity, ai: true, team: 1, templates: Infinity, branding: true, offline: true, pdfCustomization: true },
    team:  { proposals: Infinity, clients: Infinity, ai: true, team: 10, templates: Infinity, branding: true, offline: true, pdfCustomization: true }
};

function getCurrentPlan() {
    const sub = typeof safeGetStorage === 'function' ? safeGetStorage('pk_subscription', null) : null;
    if (!sub || !sub.plan || sub.status === 'cancelled') return 'free';
    return PLAN_LIMITS[sub.plan] ? sub.plan : 'free';
}

function checkLimit(feature) {
    const plan = getCurrentPlan();
    const limits = PLAN_LIMITS[plan];
    const result = { allowed: true, current: 0, max: limits[feature], plan: plan };
    switch (feature) {
        case 'proposals':
            result.current = (typeof DB !== 'undefined' ? DB : []).filter(function(p) { return !p.archived; }).length;
            result.max = limits.proposals;
            result.allowed = result.current < result.max;
            break;
        case 'clients':
            result.current = (typeof CLIENTS !== 'undefined' ? CLIENTS : []).length;
            result.max = limits.clients;
            result.allowed = result.current < result.max;
            break;
        case 'ai':
            result.max = limits.ai ? Infinity : 0;
            result.allowed = limits.ai;
            break;
        case 'team':
            result.current = (typeof CONFIG !== 'undefined' && CONFIG.team) ? CONFIG.team.length : 1;
            result.max = limits.team;
            result.allowed = result.current < result.max;
            break;
        case 'templates':
            result.current = (typeof safeGetStorage === 'function' ? safeGetStorage('pk_seclib', []) : []).length;
            result.max = limits.templates;
            result.allowed = result.current < result.max;
            break;
        case 'branding':
            result.allowed = limits.branding;
            break;
        case 'offline':
            result.allowed = limits.offline;
            break;
        case 'pdfCustomization':
            result.allowed = limits.pdfCustomization;
            break;
        default:
            result.allowed = true;
    }
    return result;
}

function enforceLimit(feature, onBlock) {
    const check = checkLimit(feature);
    if (!check.allowed) {
        showUpgradeModal(feature, check);
        if (typeof onBlock === 'function') onBlock();
        return false;
    }
    return true;
}

function showUpgradeModal(feature, check) {
    const old = document.querySelector('.modal-wrap.upgrade-modal');
    if (old) old.remove();
    const maxLabel = check.max === Infinity ? 'Unlimited' : check.max;
    const featureLabel = feature.charAt(0).toUpperCase() + feature.slice(1);
    const planLabel = check.plan.charAt(0).toUpperCase() + check.plan.slice(1);
    const pct = check.max === Infinity || check.max === 0 ? 100 : Math.min(Math.round((check.current / check.max) * 100), 100);

    // Detect Indian currency based on CONFIG or browser locale
    const isIndian = (typeof CONFIG !== 'undefined' && CONFIG.currency === '₹') ||
                     (typeof navigator !== 'undefined' && navigator.language === 'en-IN');
    const proPriceUSD = '$12';
    const teamPriceUSD = '$29';
    const proPriceINR = '₹999';
    const teamPriceINR = '₹2,499';
    const proPrice = isIndian ? proPriceINR : proPriceUSD;
    const teamPrice = isIndian ? teamPriceINR : teamPriceUSD;

    const rows = [
        ['Proposals', '5', 'Unlimited', 'Unlimited'],
        ['Clients', '2', 'Unlimited', 'Unlimited'],
        ['AI Assistant', '\u2014', '\u2713', '\u2713'],
        ['Team Members', '1', '1', '10'],
        ['Templates', '3', 'Unlimited', 'Unlimited'],
        ['Custom Branding', '\u2014', '\u2713', '\u2713'],
        ['PDF Customization', '\u2014', '\u2713', '\u2713'],
        ['Offline Access', '\u2014', '\u2713', '\u2713'],
        ['Price', 'Free', proPrice + '/mo', teamPrice + '/mo']
    ];
    let tableHtml = '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:16px">' +
        '<thead><tr><th style="text-align:left;padding:8px 6px;border-bottom:1px solid var(--border);color:var(--muted-foreground)">Feature</th>' +
        '<th style="text-align:center;padding:8px 6px;border-bottom:1px solid var(--border);color:var(--muted-foreground)">Free</th>' +
        '<th style="text-align:center;padding:8px 6px;border-bottom:1px solid var(--border);color:var(--primary);font-weight:700">Pro</th>' +
        '<th style="text-align:center;padding:8px 6px;border-bottom:1px solid var(--border);color:var(--muted-foreground)">Team</th></tr></thead><tbody>';
    for (let i = 0; i < rows.length; i++) {
        tableHtml += '<tr><td style="padding:8px 6px;border-bottom:1px solid var(--border)">' + rows[i][0] + '</td>' +
            '<td style="text-align:center;padding:8px 6px;border-bottom:1px solid var(--border);color:var(--muted-foreground)">' + rows[i][1] + '</td>' +
            '<td style="text-align:center;padding:8px 6px;border-bottom:1px solid var(--border);font-weight:500">' + rows[i][2] + '</td>' +
            '<td style="text-align:center;padding:8px 6px;border-bottom:1px solid var(--border);color:var(--muted-foreground)">' + rows[i][3] + '</td></tr>';
    }
    tableHtml += '</tbody></table>';
    const e = typeof esc === 'function' ? esc : function(s) { return String(s); };
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap upgrade-modal';
    wrap.innerHTML = '<div class="modal" style="max-width:520px" onclick="event.stopPropagation()">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">' +
        '<div class="modal-t">Plan Limit Reached</div>' +
        '<button class="btn-sm-icon-ghost" onclick="this.closest(\'.modal-wrap\').remove()"><i data-lucide="x"></i></button></div>' +
        '<div style="text-align:center;margin-bottom:16px">' +
        '<i data-lucide="lock" style="width:32px;height:32px;color:var(--muted-foreground);margin-bottom:8px"></i>' +
        '<p style="font-size:14px;font-weight:500;margin:0 0 4px">You\u2019ve reached your ' + e(planLabel) + ' limit of ' + maxLabel + ' ' + e(featureLabel.toLowerCase()) + '</p>' +
        '<p style="font-size:12px;color:var(--muted-foreground);margin:0">Upgrade your plan to unlock more</p></div>' +
        '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted-foreground);margin-bottom:4px">' +
        '<span>Usage: ' + check.current + ' / ' + maxLabel + '</span><span>' + pct + '%</span></div>' +
        '<div style="height:6px;background:var(--muted);border-radius:9999px;overflow:hidden">' +
        '<div style="height:100%;width:' + pct + '%;background:' + (pct >= 100 ? 'var(--destructive)' : 'var(--primary)') + ';border-radius:9999px"></div></div></div>' +
        tableHtml +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
        '<button class="btn-sm-outline" onclick="this.closest(\'.modal-wrap\').remove()">Maybe Later</button>' +
        '<button class="btn-sm" onclick="window.open(\'https://proposalkit.com/pricing\', \'_blank\');trackEvent(\'upgrade_clicked\', {from: \'' + feature + '\'})">Upgrade Now</button></div></div>';
    wrap.addEventListener('click', function(ev) { if (ev.target === wrap) wrap.remove(); });
    document.body.appendChild(wrap);
    requestAnimationFrame(function() { wrap.classList.add('show'); });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function getPlanBadge() {
    const plan = getCurrentPlan();
    const cls = plan === 'pro' ? 'badge-accepted' : plan === 'team' ? 'badge-sent' : 'badge-draft';
    return '<span class="badge ' + cls + '" style="font-size:10px;padding:2px 8px">' + plan.charAt(0).toUpperCase() + plan.slice(1) + '</span>';
}

function trackEvent(event, meta) {
    const events = typeof safeGetStorage === 'function' ? safeGetStorage('pk_analytics', []) : [];
    events.push({ event: event, meta: meta || {}, ts: Date.now(),
        userId: (typeof CONFIG !== 'undefined' && CONFIG.activeUserId) || '' });
    while (events.length > 10000) events.shift();
    try { localStorage.setItem('pk_analytics', JSON.stringify(events)); } catch (e) { /* full */ }
}
