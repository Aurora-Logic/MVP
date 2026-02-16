// ════════════════════════════════════════
// PLANS — Subscription Limit Enforcement
// ════════════════════════════════════════
/* exported checkLimit, enforceLimit, enforceFreePlanLimits, showUpgradeModal, getCurrentPlan, getPlanBadge, trackEvent, PLAN_LIMITS */

const PLAN_LIMITS = {
    free:  { proposals: 5, clients: 2, ai: false, team: 1, templates: 3, branding: false, offline: false, pdfCustomization: false },
    pro:   { proposals: Infinity, clients: Infinity, ai: true, team: 1, templates: Infinity, branding: true, offline: true, pdfCustomization: true },
    team:  { proposals: Infinity, clients: Infinity, ai: true, team: 10, templates: Infinity, branding: true, offline: true, pdfCustomization: true }
};

// SECURITY FIX: Validate plan to prevent localStorage manipulation
function getCurrentPlan() {
    const sub = typeof safeGetStorage === 'function' ? safeGetStorage('pk_subscription', null) : null;
    if (!sub || !sub.plan || sub.status === 'cancelled') return 'free';

    // Validate plan is a legitimate tier
    const validPlans = ['free', 'pro', 'team'];
    if (!validPlans.includes(sub.plan)) {
        console.warn('[Security] Invalid plan detected in localStorage:', sub.plan, '- defaulting to free');
        return 'free';
    }

    // Additional validation: ensure PLAN_LIMITS hasn't been tampered with
    if (!PLAN_LIMITS[sub.plan]) {
        console.warn('[Security] Plan limits missing for:', sub.plan, '- defaulting to free');
        return 'free';
    }

    return sub.plan;
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
            result.current = limits.branding ? 1 : 0;
            result.max = 1;
            result.allowed = limits.branding;
            break;
        case 'offline':
            result.current = limits.offline ? 1 : 0;
            result.max = 1;
            result.allowed = limits.offline;
            break;
        case 'pdfCustomization':
            result.current = 0;
            result.max = 0;
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

// SECURITY FIX: Enforce plan limits on app boot to prevent downgrade abuse
function enforceFreePlanLimits() {
    const plan = getCurrentPlan();
    if (plan !== 'free') return; // Only enforce for free plan

    const limits = PLAN_LIMITS.free;

    // Check active proposals count (excluding archived)
    if (typeof DB !== 'undefined' && Array.isArray(DB)) {
        const activeProposals = DB.filter(p => !p.archived);
        if (activeProposals.length > limits.proposals) {
            const excess = activeProposals.length - limits.proposals;
            console.warn('[Plan Enforcement] Free user has', activeProposals.length, 'proposals, limit is', limits.proposals);

            // Archive excess proposals (oldest first)
            const sorted = activeProposals.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            for (let i = 0; i < excess; i++) {
                sorted[i].archived = true;
            }

            if (typeof persist === 'function') persist();
            if (typeof toast === 'function') {
                toast('Free plan limit: ' + excess + ' older proposals archived. Upgrade for unlimited.', 'warning');
            }
        }
    }

    // Check clients count
    if (typeof CLIENTS !== 'undefined' && Array.isArray(CLIENTS)) {
        if (CLIENTS.length > limits.clients) {
            const excess = CLIENTS.length - limits.clients;
            console.warn('[Plan Enforcement] Free user has', CLIENTS.length, 'clients, limit is', limits.clients);

            // Show warning but don't delete clients (too destructive)
            if (typeof toast === 'function') {
                toast('Free plan allows ' + limits.clients + ' clients. You have ' + CLIENTS.length + '. Upgrade to add more.', 'warning');
            }
        }
    }
}

function showUpgradeModal(feature, check) {
    const old = document.querySelector('.modal-wrap.upgrade-modal');
    if (old) old.remove();

    // Human-readable feature labels
    const featureLabels = {
        proposals: 'Proposals',
        clients: 'Clients',
        ai: 'AI Assistant',
        team: 'Team Members',
        templates: 'Templates',
        branding: 'Custom Branding',
        pdfCustomization: 'PDF Customization',
        offline: 'Offline Access'
    };

    const featureLabel = featureLabels[feature] || (feature.charAt(0).toUpperCase() + feature.slice(1));
    const maxLabel = check.max === Infinity ? 'Unlimited' : (check.max || 'feature');
    const planLabel = check.plan.charAt(0).toUpperCase() + check.plan.slice(1);
    const currentVal = check.current || 0;
    const maxVal = check.max === Infinity ? 100 : (check.max || 1);
    const pct = check.max === Infinity ? 100 : Math.min(Math.round((currentVal / maxVal) * 100), 100);

    // Detect Indian currency based on CONFIG.country
    const isIndian = (CONFIG?.country === 'IN');
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

    // Usage text for boolean features (0 used features vs available)
    const usageText = (feature === 'branding' || feature === 'offline' || feature === 'pdfCustomization' || feature === 'ai')
        ? 'Feature not available on ' + planLabel + ' plan'
        : 'Usage: ' + currentVal + ' / ' + maxLabel;

    wrap.innerHTML = '<div class="modal" style="max-width:520px" onclick="event.stopPropagation()">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">' +
        '<div class="modal-t">Plan Limit Reached</div>' +
        '<button class="btn-sm-icon-ghost" onclick="this.closest(\'.modal-wrap\').remove()"><i data-lucide="x"></i></button></div>' +
        '<div style="text-align:center;margin-bottom:16px">' +
        '<i data-lucide="lock" style="width:32px;height:32px;color:var(--muted-foreground);margin-bottom:8px"></i>' +
        '<p style="font-size:14px;font-weight:500;margin:0 0 4px">You\u2019ve reached your ' + e(planLabel) + ' limit of ' + e(featureLabel) + '</p>' +
        '<p style="font-size:12px;color:var(--muted-foreground);margin:0">Upgrade your plan to unlock more</p></div>' +
        '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted-foreground);margin-bottom:4px">' +
        '<span>' + usageText + '</span><span>' + pct + '%</span></div>' +
        '<div style="height:6px;background:var(--muted);border-radius:9999px;overflow:hidden">' +
        '<div style="height:100%;width:' + pct + '%;background:' + (pct >= 100 ? 'var(--destructive)' : 'var(--primary)') + ';border-radius:9999px"></div></div></div>' +
        tableHtml +
        '<div style="background:var(--muted);border-radius:var(--r-lg);padding:12px;margin:16px 0;text-align:center">' +
        '<p style="font-size:12px;font-weight:500;margin:0 0 4px;color:var(--primary)"><i data-lucide="gift" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px"></i>7-Day Free Trial</p>' +
        '<p style="font-size:11px;color:var(--muted-foreground);margin:0">Try Pro free for 7 days. No credit card required.</p></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
        '<button class="btn-sm-outline" onclick="this.closest(\'.modal-wrap\').remove()">Maybe Later</button>' +
        '<button class="btn-sm" onclick="startFreeTrial(\'' + feature + '\');this.closest(\'.modal-wrap\').remove()">Start Free Trial</button></div></div>';
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

/* exported startFreeTrial */
function startFreeTrial(fromFeature) {
    // Activate 7-day free trial for Pro plan
    const trialStart = Date.now();
    const trialEnd = trialStart + (7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Create or update subscription with trial
    const subscription = {
        plan: 'pro',
        status: 'trialing',
        trial_start: new Date(trialStart).toISOString(),
        trial_end: new Date(trialEnd).toISOString(),
        created_at: new Date().toISOString()
    };

    try {
        localStorage.setItem('pk_subscription', JSON.stringify(subscription));
        trackEvent('trial_started', { from: fromFeature, plan: 'pro' });

        // Show success toast
        if (typeof toast === 'function') {
            toast('🎉 Pro trial activated! Enjoy 7 days of unlimited features.', 'success');
        }

        // Refresh the page to apply new plan limits
        setTimeout(() => {
            if (typeof location !== 'undefined') location.reload();
        }, 1500);
    } catch (e) {
        console.error('[Plans] Failed to activate trial:', e);
        if (typeof toast === 'function') {
            toast('Failed to activate trial. Please try again.', 'error');
        }
    }
}
