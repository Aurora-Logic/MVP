// ════════════════════════════════════════
// PLANS — Open source (all features unlocked)
// ════════════════════════════════════════
/* exported checkLimit, enforceLimit, enforceFreePlanLimits, showUpgradeModal, getCurrentPlan, getPlanBadge, trackEvent, PLAN_LIMITS, startFreeTrial */

const PLAN_LIMITS = {
    free: { proposals: Infinity, clients: Infinity, ai: true, team: Infinity, templates: Infinity, branding: true, offline: true, pdfCustomization: true }
};

function getCurrentPlan() { return 'free'; }

function checkLimit() {
    return { allowed: true, current: 0, max: Infinity, plan: 'free' };
}

function enforceLimit() { return true; }

function enforceFreePlanLimits() { /* no-op — open source */ }

function showUpgradeModal() { /* no-op — open source */ }

function getPlanBadge() {
    return '<span class="badge badge-accepted" style="font-size:10px;padding:2px 8px">Open Source</span>';
}

function startFreeTrial() { /* no-op — open source */ }

function trackEvent(event, meta) {
    const events = typeof safeGetStorage === 'function' ? safeGetStorage('pk_analytics', []) : [];
    events.push({ event: event, meta: meta || {}, ts: Date.now(),
        userId: (typeof CONFIG !== 'undefined' && CONFIG.activeUserId) || '' });
    while (events.length > 10000) events.shift();
    try { localStorage.setItem('pk_analytics', JSON.stringify(events)); } catch (e) { /* full */ }
}
