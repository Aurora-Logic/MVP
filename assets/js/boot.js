// ════════════════════════════════════════
// BOOT — App initialization (loaded last)
// ════════════════════════════════════════
/* exported submitNpsScore, closeNpsPrompt */

// Global error boundary
/* exported APP_BUILD, clearAppCache, showUpdateModal, getCacheMetrics */
window.onerror = function(msg, src, line, col, err) {
    const info = `${msg} at ${src}:${line}:${col}`;
    console.error('[ProposalKit Error]', info, err);
    if (typeof toast === 'function') toast('Something went wrong. Please refresh.', 'error');
    return false;
};
window.addEventListener('unhandledrejection', function(e) {
    console.error('[ProposalKit Unhandled Promise]', e.reason);
    if (typeof toast === 'function') toast('Something went wrong. Please refresh.', 'error');
});

// ════════════════════════════════════════
// SERVICE WORKER UTILITIES
// ════════════════════════════════════════

// Get cache performance metrics
function getCacheMetrics() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
        if (CONFIG?.debug) console.log('[Metrics] Service worker not active');
        return Promise.resolve(null);
    }

    return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (e) => {
            const m = e.data;
            if (CONFIG?.debug) {
                console.table({
                    'Cache Hits': m.cacheHits,
                    'Cache Misses': m.cacheMisses,
                    'Network Success': m.networkSuccess,
                    'Network Failures': m.networkFail,
                    'Cache Hit Ratio': ((m.cacheHits / (m.cacheHits + m.cacheMisses)) * 100).toFixed(1) + '%'
                });
            }
            resolve(e.data);
        };
        navigator.serviceWorker.controller.postMessage(
            { type: 'GET_METRICS' },
            [channel.port2]
        );
    });
}

// Manual cache clear utility
function clearAppCache() {
    if (CONFIG?.debug) console.log('[Cache] Clearing all caches and service worker...');
    if ('caches' in window) {
        caches.keys().then(function(names) {
            return Promise.all(
                names.map(function(name) {
                    if (CONFIG?.debug) console.log('[Cache] Deleting cache:', name);
                    return caches.delete(name);
                })
            );
        }).then(function() {
            if (CONFIG?.debug) console.log('[Cache] All caches cleared');
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistration().then(function(reg) {
                    if (reg) {
                        reg.unregister().then(function() {
                            if (CONFIG?.debug) console.log('[Cache] Service worker unregistered');
                            if (CONFIG?.debug) console.log('[Cache] Reloading page...');
                            window.location.reload(true);
                        });
                    } else {
                        if (CONFIG?.debug) console.log('[Cache] No service worker found');
                        if (CONFIG?.debug) console.log('[Cache] Reloading page...');
                        window.location.reload(true);
                    }
                });
            } else {
                if (CONFIG?.debug) console.log('[Cache] Reloading page...');
                window.location.reload(true);
            }
        }).catch(function(err) {
            console.error('[Cache] Error clearing caches:', err);
            if (typeof toast === 'function') toast('Error clearing cache. Try refreshing manually.', 'error');
        });
    } else {
        if (CONFIG?.debug) console.log('[Cache] Cache API not supported');
        window.location.reload(true);
    }
}

// ════════════════════════════════════════
// SERVICE WORKER UPDATE NOTIFICATION
// ════════════════════════════════════════
function showUpdateModal() {
    // Track last seen version to show modal only for new versions
    const lastSeenVersion = localStorage.getItem('pk_last_version');
    const currentVersion = APP_VERSION + '_' + APP_BUILD;

    // If user already saw this version update, don't show again
    if (lastSeenVersion === currentVersion) {
        if (CONFIG?.debug) console.log('[Update] Already shown modal for version:', currentVersion);
        return;
    }

    // Create update modal
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.id = 'updateModal';
    wrap.onclick = (e) => { if (e.target === wrap) dismissUpdateModal(); };

    wrap.innerHTML = `
        <div class="modal" style="max-width:420px" onclick="event.stopPropagation()">
            <div style="text-align:center;margin-bottom:20px">
                <div style="width:64px;height:64px;margin:0 auto 16px;background:linear-gradient(135deg,var(--primary),#0ea5e9);border-radius:50%;display:flex;align-items:center;justify-content:center">
                    <i data-lucide="sparkles" style="width:32px;height:32px;color:white;stroke-width:2"></i>
                </div>
                <div class="modal-t" style="font-size:20px;margin-bottom:8px">Update Available</div>
                <div class="modal-d" style="font-size:14px;color:var(--muted-foreground)">
                    A new version of ${typeof appName === 'function' ? appName() : 'ProposalKit'} is ready.<br>
                    Version <strong>${APP_VERSION}</strong> • Build ${APP_BUILD}
                </div>
            </div>

            <div style="background:var(--muted);padding:12px 16px;border-radius:8px;margin-bottom:20px;font-size:13px;line-height:1.6">
                <div style="display:flex;gap:8px;margin-bottom:8px">
                    <i data-lucide="shield-check" style="width:16px;height:16px;color:var(--primary);flex-shrink:0;margin-top:2px"></i>
                    <div>Security improvements and bug fixes</div>
                </div>
                <div style="display:flex;gap:8px">
                    <i data-lucide="zap" style="width:16px;height:16px;color:var(--primary);flex-shrink:0;margin-top:2px"></i>
                    <div>Performance optimizations</div>
                </div>
            </div>

            <div style="display:flex;gap:8px">
                <button class="btn-outline" onclick="dismissUpdateModal()" style="flex:1">
                    Later
                </button>
                <button class="btn" onclick="applyUpdate()" style="flex:2">
                    <i data-lucide="refresh-cw"></i> Update Now
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

function dismissUpdateModal() {
    // Mark this version as seen so we don't show modal again
    const currentVersion = APP_VERSION + '_' + APP_BUILD;
    try {
        localStorage.setItem('pk_last_version', currentVersion);
    } catch (e) {
        // Storage full, ignore
    }
    document.getElementById('updateModal')?.remove();
}

function applyUpdate() {
    // Show loading state
    const modal = document.querySelector('#updateModal .modal');
    if (modal) {
        modal.innerHTML = `
            <div style="text-align:center;padding:40px 20px">
                <div style="width:48px;height:48px;margin:0 auto 16px;border:3px solid var(--primary);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite"></div>
                <div style="font-size:16px;font-weight:600;margin-bottom:4px">Updating...</div>
                <div style="font-size:13px;color:var(--muted-foreground)">Please wait a moment</div>
            </div>
        `;
    }

    // Mark version as seen
    const currentVersion = APP_VERSION + '_' + APP_BUILD;
    try {
        localStorage.setItem('pk_last_version', currentVersion);
    } catch (e) {
        // Storage full, ignore
    }

    // Clear all caches and reload with proper cache management
    setTimeout(() => {
        clearAppCache();
    }, 500);
}

async function initApp() {
    if (typeof initAuth === 'function') {
        await initAuth();
    } else {
        // Offline fallback (Supabase CDN not loaded)
        if (CONFIG) {
            document.getElementById('onboard').classList.add('hide');
            document.getElementById('appShell').style.display = 'flex';
            await bootApp();
        } else {
            renderOnboarding();
        }
    }
}

async function bootApp() {
    // CRITICAL: Wait for DOM to be ready before proceeding
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
        });
    }

    if (CONFIG?.debug) console.log('[Boot] Starting app initialization...');
    try {
        // SECURITY FIX: Enforce plan limits and monitor storage
        if (typeof enforceFreePlanLimits === 'function') enforceFreePlanLimits();
        if (typeof checkStorageQuota === 'function') checkStorageQuota();

        // ERROR TRACKING: Initialize production error monitoring
        if (typeof initErrorTracking === 'function') initErrorTracking();

        // PLAN GATING: Check offline access for free users
        if (typeof getCurrentPlan === 'function' && typeof PLAN_LIMITS !== 'undefined') {
            const plan = getCurrentPlan();
            const hasOffline = PLAN_LIMITS[plan]?.offlineAccess || false;
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CHECK_PLAN',
                    hasOffline: hasOffline
                });
                if (!hasOffline) {
                    if (CONFIG?.debug) console.log('[Boot] Free plan: SW will be unregistered for offline gating');
                }
            }
        }

        initSidebarState();
        if (typeof initTeam === 'function') initTeam();
        refreshSide();
        if (CONFIG?.debug) console.log('[Boot] Handling initial route:', window.location.pathname);
        handleRoute();
        initKeyboardShortcuts();
        if (typeof checkAnnouncements === 'function') checkAnnouncements();
        if (typeof trackEvent === 'function') trackEvent('app_open');
        if (typeof initHelpButton === 'function') initHelpButton();
        lucide.createIcons();
        patchAriaLabels();
        checkWhatsNew();
        checkNpsPrompt();
        if (CONFIG?.debug) console.log('[Boot] App initialized successfully');
    } catch (err) {
        if (CONFIG?.debug) console.error('[Boot] Initialization failed:', err);
        // Show error UI instead of blank screen
        const body = document.getElementById('bodyScroll');
        if (body) {
            body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:60vh;padding:32px">
                <div style="max-width:440px;text-align:center;background:#fff;padding:48px 32px;border-radius:16px;border:1px solid #e4e4e7">
                    <div style="font-size:48px;margin-bottom:16px">⚠️</div>
                    <div style="font-size:20px;font-weight:700;margin-bottom:8px">Something went wrong</div>
                    <div style="font-size:14px;color:#71717a;line-height:1.5;margin-bottom:16px">${err.message || 'App failed to initialize'}</div>
                    <button class="btn" onclick="window.location.reload()">Reload app</button>
                    <button class="btn-outline" onclick="clearAppCache()" style="margin-top:8px">Clear cache & reload</button>
                </div></div>`;
        }
    }
}

// Auto-derive aria-label from data-tooltip for icon-only buttons missing accessible names
function patchAriaLabels() {
    document.querySelectorAll('[data-tooltip]:not([aria-label])').forEach(el => {
        el.setAttribute('aria-label', el.getAttribute('data-tooltip'));
    });
}
// Patch after every lucide.createIcons() call via observer
const _origCreateIcons = lucide.createIcons.bind(lucide);
lucide.createIcons = function(opts) {
    _origCreateIcons(opts);
    patchAriaLabels();
};
/** Scope icon creation to a container — avoids full-DOM rescan */
function lucideScope(el) {
    if (el) lucide.createIcons({ nodes: [el] });
}

// ════════════════════════════════════════
// WHAT'S NEW MODAL
// ════════════════════════════════════════
const APP_VERSION = '3.0.0';
const APP_BUILD = '20260214';
const WHATS_NEW_ITEMS = [
    { icon: 'shield-check', title: 'Production Ready', desc: '100% security hardened with XSS protection, transaction safety, and plan enforcement.' },
    { icon: 'zap', title: 'Performance Boost', desc: 'Lazy load editors (60-80% memory savings) and optimized for proposals with 50+ sections.' },
    { icon: 'bug', title: 'Error Tracking', desc: 'Production-grade error monitoring with Sentry integration and custom webhooks.' },
    { icon: 'lock', title: 'Privacy Controls', desc: 'PDF metadata privacy - no personal info leaks, company name only in exports.' }
];

function checkWhatsNew() {
    const seen = localStorage.getItem('pk_whatsnew_ver');
    if (seen === APP_VERSION) return;
    setTimeout(() => showWhatsNew(), 800);
}

function showWhatsNew() {
    const items = WHATS_NEW_ITEMS.map(i => `
        <div class="wn-item">
            <div class="wn-icon"><i data-lucide="${i.icon}"></i></div>
            <div><div class="wn-title">${i.title}</div><div class="wn-desc">${i.desc}</div></div>
        </div>`).join('');
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'whatsNewModal';
    wrap.onclick = (e) => { if (e.target === wrap) dismissWhatsNew(); };
    wrap.innerHTML = `<div class="modal wn-modal" onclick="event.stopPropagation()">
        <div class="wn-emoji">&#127881;</div>
        <div class="modal-t wn-center">What's new in ${typeof appName === 'function' ? appName() : 'ProposalKit'}</div>
        <div class="modal-d wn-center">Version ${APP_VERSION}</div>
        <div class="wn-list">${items}</div>
        <div class="modal-foot wn-center"><button class="btn-sm" onclick="dismissWhatsNew()">Got it</button></div>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

function dismissWhatsNew() {
    safeLsSet('pk_whatsnew_ver', APP_VERSION);
    document.getElementById('whatsNewModal')?.remove();
}

// ════════════════════════════════════════
// NPS PROMPT (periodic satisfaction survey)
// ════════════════════════════════════════
function checkNpsPrompt() {
    const last = safeGetStorage('pk_feedback_asked', 0);
    if (Date.now() - last < 30 * 86400000) return; // ask at most once per 30 days
    if (DB.filter(p => !p.archived).length < 5) return; // wait until 5 proposals
    setTimeout(() => showNpsPrompt(), 2000);
}

function showNpsPrompt() {
    // Don't show if the feedback modal is already open
    if (document.getElementById('feedbackModal')) return;
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'npsModal';
    wrap.onclick = (e) => { if (e.target === wrap) closeNpsPrompt(); };
    const scores = Array.from({ length: 11 }, (_, i) =>
        `<button class="fb-score" onclick="submitNpsScore(${i})" style="width:32px;height:32px;border:1px solid var(--border);border-radius:8px;background:none;cursor:pointer;font-size:13px;font-weight:500;color:var(--foreground);transition:all 200ms" onmouseenter="this.style.background='var(--primary)';this.style.color='#fff'" onmouseleave="this.style.background='none';this.style.color='var(--foreground)'">${i}</button>`
    ).join('');
    wrap.innerHTML = `<div class="modal" style="max-width:440px" onclick="event.stopPropagation()">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div class="modal-t">Quick Feedback</div>
            <button class="btn-sm-icon-ghost" onclick="closeNpsPrompt()"><i data-lucide="x"></i></button>
        </div>
        <p style="font-size:13px;color:var(--muted-foreground);margin-bottom:16px">How likely are you to recommend ${typeof appName === 'function' ? appName() : 'ProposalKit'}? (0 = not likely, 10 = very likely)</p>
        <div style="display:flex;gap:4px;justify-content:center;margin-bottom:16px">${scores}</div>
        <textarea id="npsComment" rows="2" placeholder="Any comments? (optional)" style="width:100%;font-size:13px;resize:none;padding:8px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px"></textarea>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

function submitNpsScore(score) {
    const comment = document.getElementById('npsComment')?.value?.trim() || '';
    const feedback = safeGetStorage('pk_feedback', []);
    feedback.push({
        id: uid(), score, comment, ts: Date.now(),
        userId: CONFIG?.activeUserId || '',
        userName: CONFIG?.name || '',
        userEmail: CONFIG?.email || '',
        plan: typeof getCurrentPlan === 'function' ? getCurrentPlan() : 'free',
        proposals: DB.filter(p => !p.archived).length
    });
    try { localStorage.setItem('pk_feedback', JSON.stringify(feedback)); } catch (e) { /* full */ }
    try { localStorage.setItem('pk_feedback_asked', JSON.stringify(Date.now())); } catch (e) { /* full */ }
    closeNpsPrompt();
    toast(score >= 7 ? 'Thanks for the kind words!' : 'Thanks for your feedback!');
}

function closeNpsPrompt() {
    document.getElementById('npsModal')?.remove();
    try { localStorage.setItem('pk_feedback_asked', JSON.stringify(Date.now())); } catch (e) { /* full */ }
}

// Start the app
initApp();
