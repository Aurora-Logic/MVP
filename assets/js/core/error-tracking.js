// ════════════════════════════════════════
// ERROR TRACKING — Sentry integration
// ════════════════════════════════════════

/* exported initErrorTracking */

/**
 * Initialize error tracking for production monitoring
 * Supports Sentry and custom webhook endpoints
 *
 * To enable:
 * 1. Set CONFIG.sentryDsn = 'your-dsn' in settings
 * 2. Or set CONFIG.errorWebhook = 'your-webhook-url'
 */
function initErrorTracking() {
    // Check if error tracking is configured
    const hasSentry = CONFIG.sentryDsn && CONFIG.sentryDsn.startsWith('https://');
    const hasWebhook = CONFIG.errorWebhook && CONFIG.errorWebhook.startsWith('https://');

    if (!hasSentry && !hasWebhook) {
        // No tracking configured - just log locally
        console.warn('[ErrorTracking] Not configured - errors will log to console only');
        return;
    }

    // Global error handler
    window.addEventListener('error', (event) => {
        const errorData = {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            plan: getCurrentPlan ? getCurrentPlan() : 'unknown'
        };

        // Log to console
        console.error('[ErrorTracking] Captured error:', errorData);

        // Send to Sentry if configured
        if (hasSentry) {
            sendToSentry(errorData);
        }

        // Send to webhook if configured
        if (hasWebhook) {
            sendToWebhook(errorData);
        }
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        const errorData = {
            message: 'Unhandled Promise Rejection: ' + event.reason,
            stack: event.reason?.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            plan: getCurrentPlan ? getCurrentPlan() : 'unknown'
        };

        console.error('[ErrorTracking] Unhandled rejection:', errorData);

        if (hasSentry) sendToSentry(errorData);
        if (hasWebhook) sendToWebhook(errorData);
    });

    console.warn('[ErrorTracking] Initialized ✓', { hasSentry, hasWebhook });
}

/**
 * Send error to Sentry (lightweight client-side implementation)
 */
function sendToSentry(errorData) {
    if (!CONFIG.sentryDsn) return;

    try {
        // Extract project ID from DSN
        const dsnMatch = CONFIG.sentryDsn.match(/https:\/\/(.+)@(.+)\/(.+)/);
        if (!dsnMatch) {
            console.warn('[ErrorTracking] Invalid Sentry DSN format');
            return;
        }

        const [, publicKey, host, projectId] = dsnMatch;
        const endpoint = `https://${host}/api/${projectId}/store/`;

        const payload = {
            event_id: generateEventId(),
            timestamp: Date.now() / 1000,
            platform: 'javascript',
            sdk: {
                name: 'proposalkit-js',
                version: '1.0.0'
            },
            exception: {
                values: [{
                    type: 'Error',
                    value: errorData.message,
                    stacktrace: errorData.stack ? parseStackTrace(errorData.stack) : undefined
                }]
            },
            user: {
                id: CONFIG.userId || 'anonymous',
                email: CONFIG.email || undefined
            },
            tags: {
                plan: errorData.plan
            },
            request: {
                url: errorData.url,
                headers: {
                    'User-Agent': errorData.userAgent
                }
            }
        };

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=proposalkit-js/1.0.0`
            },
            body: JSON.stringify(payload)
        }).catch(err => console.warn('[ErrorTracking] Failed to send to Sentry:', err));
    } catch (e) {
        console.warn('[ErrorTracking] Sentry send failed:', e);
    }
}

/**
 * Send error to custom webhook endpoint
 */
function sendToWebhook(errorData) {
    if (!CONFIG.errorWebhook) return;

    try {
        fetch(CONFIG.errorWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app: 'ProposalKit',
                severity: 'error',
                ...errorData,
                user: {
                    id: CONFIG.userId || 'anonymous',
                    email: CONFIG.email || undefined,
                    plan: errorData.plan
                }
            })
        }).catch(err => console.warn('[ErrorTracking] Failed to send to webhook:', err));
    } catch (e) {
        console.warn('[ErrorTracking] Webhook send failed:', e);
    }
}

/**
 * Parse stack trace for Sentry format
 */
function parseStackTrace(stack) {
    const lines = stack.split('\n').slice(1); // Skip first line (error message)
    return {
        frames: lines.map(line => {
            const match = line.match(/at (.+) \((.+):(\d+):(\d+)\)/);
            if (match) {
                return {
                    function: match[1],
                    filename: match[2],
                    lineno: parseInt(match[3]),
                    colno: parseInt(match[4])
                };
            }
            return { function: line.trim() };
        }).reverse() // Sentry wants frames in reverse order
    };
}

/**
 * Generate unique event ID (UUID v4 format)
 */
function generateEventId() {
    return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () =>
        Math.floor(Math.random() * 16).toString(16)
    );
}

/**
 * Manually capture an error or message
 * Usage: captureError(new Error('Something went wrong'))
 */
function captureError(error, level = 'error') {
    const errorData = {
        message: error.message || String(error),
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        plan: getCurrentPlan ? getCurrentPlan() : 'unknown',
        level: level
    };

    console.error('[ErrorTracking] Manual capture:', errorData);

    if (CONFIG.sentryDsn) sendToSentry(errorData);
    if (CONFIG.errorWebhook) sendToWebhook(errorData);
}

// Expose manual capture for use in try/catch blocks
window.captureError = captureError;
