// ════════════════════════════════════════
// ADMIN SYNC — Real-time data sync
// ════════════════════════════════════════

/* exported initAdminSync, refreshAdminData, getCachedUsers, getCachedTickets, getCachedAnalytics, unsubscribeAdminRealtime */

let adminRealtimeChannel = null;
let adminCacheTimestamp = 0;
const ADMIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let adminCache = {
    users: [],
    tickets: [],
    analytics: null
};

async function initAdminSync() {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
        console.warn('[Admin] Not an admin user');
        return false;
    }

    console.log('[Admin] Initializing sync');
    await refreshAdminData();
    subscribeAdminRealtime();
    return true;
}

async function refreshAdminData(force = false) {
    const now = Date.now();

    // Use cache if fresh (unless forced)
    if (!force && (now - adminCacheTimestamp) < ADMIN_CACHE_TTL) {
        console.log('[Admin] Using cached data');
        return adminCache;
    }

    console.log('[Admin] Fetching fresh data');

    try {
        // Fetch in parallel
        const [usersRes, ticketsRes, analytics] = await Promise.all([
            fetchAllUsers(),
            fetchTickets(),
            fetchAnalytics()
        ]);

        if (usersRes.error) {
            console.error('[Admin] Users fetch failed:', usersRes.error);
            toast('Failed to load users', 'error');
        }

        if (ticketsRes.error) {
            console.error('[Admin] Tickets fetch failed:', ticketsRes.error);
            toast('Failed to load tickets', 'error');
        }

        adminCache = {
            users: usersRes.data || [],
            tickets: ticketsRes.data || [],
            analytics: analytics
        };

        adminCacheTimestamp = now;

        return adminCache;
    } catch (e) {
        console.error('[Admin] Data refresh failed:', e);
        toast('Failed to load admin data', 'error');
        return adminCache; // Return stale cache
    }
}

function subscribeAdminRealtime() {
    if (!sb()) {
        console.warn('[Admin] Supabase not available for realtime');
        return;
    }

    // Clean up existing channel
    if (adminRealtimeChannel) {
        sb().removeChannel(adminRealtimeChannel);
    }

    console.log('[Admin] Subscribing to realtime updates');

    adminRealtimeChannel = sb()
        .channel('admin-realtime')
        // New ticket created
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'tickets' },
            (payload) => {
                console.log('[Admin] New ticket:', payload.new.id);
                adminCache.tickets.unshift(payload.new);

                // Update UI if admin panel is open
                if (typeof refreshAdminTicketsUI === 'function') {
                    refreshAdminTicketsUI();
                }

                toast(`New ticket: ${payload.new.subject}`, 'info');
            }
        )
        // Ticket updated
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'tickets' },
            (payload) => {
                console.log('[Admin] Ticket updated:', payload.new.id);
                const idx = adminCache.tickets.findIndex(t => t.id === payload.new.id);
                if (idx >= 0) {
                    adminCache.tickets[idx] = payload.new;
                }

                if (typeof refreshAdminTicketsUI === 'function') {
                    refreshAdminTicketsUI();
                }
            }
        )
        // New subscription
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'subscriptions' },
            (payload) => {
                console.log('[Admin] New subscription:', payload.new.user_id);
                toast('New user subscription', 'info');
                refreshAdminData(true); // Force refresh users
            }
        )
        // Subscription updated
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'subscriptions' },
            (payload) => {
                console.log('[Admin] Subscription updated:', payload.new.user_id);
                refreshAdminData(true);
            }
        )
        .subscribe((status) => {
            console.log('[Admin] Realtime status:', status);
            if (status === 'SUBSCRIBED') {
                toast('Admin panel connected', 'success');
            } else if (status === 'CHANNEL_ERROR') {
                toast('Admin panel disconnected', 'warning');
            }
        });
}

function unsubscribeAdminRealtime() {
    if (adminRealtimeChannel) {
        console.log('[Admin] Unsubscribing from realtime');
        sb().removeChannel(adminRealtimeChannel);
        adminRealtimeChannel = null;
    }
}

// Cache accessors
function getCachedUsers() { return adminCache.users; }
function getCachedTickets() { return adminCache.tickets; }
function getCachedAnalytics() { return adminCache.analytics; }

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    unsubscribeAdminRealtime();
});
