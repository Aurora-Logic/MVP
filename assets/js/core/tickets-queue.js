// ════════════════════════════════════════
// TICKET QUEUE — Offline ticket submission
// ════════════════════════════════════════

/* exported queueTicketLocally, syncTicketQueue */

const TICKET_QUEUE_KEY = 'pk_ticket_queue';
const MAX_RETRY_ATTEMPTS = 5;

function getTicketQueue() {
    return safeGetStorage(TICKET_QUEUE_KEY, []);
}

function saveTicketQueue(queue) {
    safeLsSet(TICKET_QUEUE_KEY, queue);
}

function queueTicketLocally(ticket) {
    const queue = getTicketQueue();
    queue.push({
        ...ticket,
        _queued: true,
        _queuedAt: Date.now(),
        _attempts: 0
    });
    saveTicketQueue(queue);

    toast('Ticket saved — will sync when online', 'info');

    // Try immediate sync if online
    if (navigator.onLine && isLoggedIn()) {
        setTimeout(() => syncTicketQueue(), 1000);
    }

    return ticket;
}

async function syncTicketQueue() {
    if (!navigator.onLine || !sb()) {
        if (CONFIG?.debug) console.warn('[Tickets] Cannot sync — offline or no Supabase');
        return;
    }

    const queue = getTicketQueue();
    if (!queue.length) return;

    console.warn('[Tickets] Syncing queue:', queue.length, 'items');

    const synced = [];
    const failed = [];

    for (const ticket of queue) {
        try {
            const result = await submitTicket(ticket);
            if (result) {
                synced.push(ticket.id);
            } else {
                ticket._attempts = (ticket._attempts || 0) + 1;
                if (ticket._attempts >= MAX_RETRY_ATTEMPTS) {
                    if (CONFIG?.debug) console.error('[Tickets] Max retries exceeded:', ticket.id);
                }
                failed.push(ticket);
            }
        } catch (e) {
            console.error('[Tickets] Sync error:', e);
            ticket._attempts = (ticket._attempts || 0) + 1;
            failed.push(ticket);
        }
    }

    // Update queue (keep only failed items)
    saveTicketQueue(failed);

    if (synced.length > 0) {
        if (CONFIG?.debug) console.warn('[Tickets] Synced:', synced.length);
        toast(`${synced.length} ticket(s) synced`, 'success');
    }
}

// Auto-sync on online event
window.addEventListener('online', () => {
    console.warn('[Tickets] Back online — syncing queue');
    setTimeout(() => syncTicketQueue(), 2000);
});

// Auto-sync on load (if online)
window.addEventListener('load', () => {
    if (navigator.onLine && isLoggedIn()) {
        setTimeout(() => syncTicketQueue(), 3000);
    }
});
