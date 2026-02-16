// ════════════════════════════════════════
// SUPABASE — Client initialization
// ════════════════════════════════════════

/* exported initSupabase, getValidToken, generateCsrfToken, validateCsrfToken, getUserPlan, setSyncStatus */
const SUPABASE_URL = 'https://fhttdaouzyfvfegvrpil.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodHRkYW91enlmdmZlZ3ZycGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzQ1NzIsImV4cCI6MjA4NjMxMDU3Mn0.wUrvbM2Jaeuta90XJZCSgyeL7DqE3T3upwWe9wRaZLA';

let sbClient = null;
let sbSession = null;

function initSupabase() {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
        if (CONFIG?.debug) console.warn('Supabase SDK not loaded — running in offline mode');
        return null;
    }
    try {
        sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                flowType: 'implicit',
                storage: localStorage
            }
        });
        return sbClient;
    } catch (e) {
        if (CONFIG?.debug) console.error('Supabase init failed:', e);
        return null;
    }
}

function sb() { return sbClient; }

function isLoggedIn() { return !!sbSession; }

// Get current JWT access token (for authenticated API calls)
function getAccessToken() {
    return sbSession?.access_token || null;
}

// Get JWT expiry timestamp
function getTokenExpiry() {
    return sbSession?.expires_at ? sbSession.expires_at * 1000 : null;
}

// Check if current JWT is expired or about to expire (within 60s)
function isTokenExpired() {
    const exp = getTokenExpiry();
    if (!exp) return true;
    return Date.now() > (exp - 60000);
}

// Force refresh the JWT token
async function refreshToken() {
    if (!sb()) return null;
    try {
        const { data, error } = await sb().auth.refreshSession();
        if (error) { if (CONFIG?.debug) console.warn('Token refresh failed:', error.message); return null; }
        sbSession = data?.session || null;
        return sbSession;
    } catch (e) { return null; }
}

// Get a valid access token, refreshing if needed
async function getValidToken() {
    if (!isLoggedIn()) return null;
    if (isTokenExpired()) await refreshToken();
    return getAccessToken();
}

// Generate CSRF token for sensitive operations
function generateCsrfToken() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    const token = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('pk_csrf', token);
    return token;
}

// Validate CSRF token
function validateCsrfToken(token) {
    const stored = sessionStorage.getItem('pk_csrf');
    if (!stored || !token) return false;
    return stored === token;
}

async function getUser() {
    if (!sb()) return null;
    try {
        const { data } = await sb().auth.getUser();
        return data?.user || null;
    } catch (e) { return null; }
}

async function getUserProfile() {
    const user = await getUser();
    if (!user || !sb()) return null;
    try {
        const { data } = await sb().from('profiles').select('*').eq('id', user.id).single();
        return data;
    } catch (e) { return null; }
}

async function getUserPlan() {
    const profile = await getUserProfile();
    return profile?.plan || 'free';
}

// Sync status indicator
let syncStatus = 'idle'; // idle | syncing | synced | error | offline

function setSyncStatus(status) {
    syncStatus = status;
    const el = document.getElementById('syncIndicator');
    if (!el) return;
    const labels = { idle: '', syncing: 'Syncing...', synced: 'Synced', error: 'Sync error', offline: 'Offline' };
    const icons = { idle: '', syncing: 'refresh-cw', synced: 'check-circle', error: 'alert-circle', offline: 'wifi-off' };
    if (status === 'idle') { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    el.innerHTML = `<i data-lucide="${icons[status]}" style="width:12px;height:12px"></i> ${labels[status]}`;
    el.className = 'sync-indicator sync-' + status;
    lucide.createIcons();
    if (status === 'synced') setTimeout(() => { if (syncStatus === 'synced') setSyncStatus('idle'); }, 3000);
}

// ════════════════════════════════════════
// ADMIN — Permission Checks
// ════════════════════════════════════════

async function isAdmin() {
    if (!sb() || !isLoggedIn()) return false;
    const user = await getUser();
    if (!user) return false;

    try {
        const { data, error } = await sb()
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error) throw error;
        return data?.role === 'admin' || data?.role === 'superadmin';
    } catch (e) {
        if (CONFIG?.debug) console.error('[Admin] Permission check failed:', e);
        return false;
    }
}

async function getAdminRole() {
    if (!sb() || !isLoggedIn()) return null;
    const user = await getUser();
    if (!user) return null;

    try {
        const { data } = await sb()
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        return data?.role || null;
    } catch (e) {
        return null;
    }
}

// ════════════════════════════════════════
// SUBSCRIPTIONS — User Functions
// ════════════════════════════════════════

async function getUserSubscription() {
    if (!sb() || !isLoggedIn()) return null;
    const user = await getUser();
    if (!user) return null;

    try {
        const { data, error } = await sb()
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['active', 'trialing'])
            .single();

        if (error) {
            if (CONFIG?.debug) console.warn('[Subscription] No active subscription');
            return null;
        }

        return data;
    } catch (e) {
        if (CONFIG?.debug) console.error('[Subscription] Fetch failed:', e);
        return null;
    }
}

async function canCreateProposal() {
    const sub = await getUserSubscription();

    if (!sub) {
        // Free tier: max 5 proposals
        const count = DB.length;
        return { allowed: count < 5, limit: 5, current: count };
    }

    if (sub.proposals_limit === null) {
        // Unlimited
        return { allowed: true, limit: null, current: sub.proposals_created };
    }

    return {
        allowed: sub.proposals_created < sub.proposals_limit,
        limit: sub.proposals_limit,
        current: sub.proposals_created
    };
}

async function incrementProposalCount() {
    if (!sb() || !isLoggedIn()) return;
    const user = await getUser();
    if (!user) return;

    try {
        await sb().rpc('increment_proposal_count', { p_user_id: user.id });
    } catch (e) {
        if (CONFIG?.debug) console.error('[Subscription] Failed to increment count:', e);
    }
}

async function createRazorpaySubscription(plan, interval) {
    if (!sb()) return null;
    const user = await getUser();
    if (!user) return null;

    try {
        const { data, error } = await sb().functions.invoke('create-razorpay-subscription', {
            body: {
                plan,
                interval,
                user_id: user.id,
                user_email: user.email,
                user_name: CONFIG.name || user.email
            }
        });

        if (error) throw error;

        // Open Razorpay checkout with subscription
        return new Promise((resolve, reject) => {
            const options = {
                key: data.razorpay_key,
                subscription_id: data.subscription_id,
                name: 'ProposalKit',
                description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan - ${interval}`,
                customer_id: data.customer_id,
                handler: function (response) {
                    if (CONFIG?.debug) console.warn('[Razorpay] Payment successful:', response);
                    toast('Subscription activated!', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                    resolve(response);
                },
                prefill: {
                    name: CONFIG.name || '',
                    email: user.email || '',
                    contact: CONFIG.phone || ''
                },
                notes: {
                    user_id: user.id,
                    plan,
                    interval
                },
                theme: {
                    color: '#18181b'
                },
                modal: {
                    ondismiss: function() {
                        reject(new Error('Payment cancelled'));
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        });
    } catch (e) {
        if (CONFIG?.debug) console.error('[Razorpay] Subscription creation failed:', e);
        toast('Failed to start checkout', 'error');
        return null;
    }
}

async function cancelRazorpaySubscription() {
    if (!sb()) return null;
    const user = await getUser();
    if (!user) return null;

    const sub = await getUserSubscription();
    if (!sub || !sub.razorpay_subscription_id) {
        toast('No active subscription found', 'error');
        return null;
    }

    try {
        const { data, error } = await sb().functions.invoke('cancel-razorpay-subscription', {
            body: {
                user_id: user.id
            }
        });

        if (error) throw error;

        toast('Subscription will be cancelled at period end', 'success');
        return data;
    } catch (e) {
        if (CONFIG?.debug) console.error('[Razorpay] Cancellation failed:', e);
        toast('Failed to cancel subscription', 'error');
        return null;
    }
}

// ════════════════════════════════════════
// TICKETS — User Functions
// ════════════════════════════════════════

async function submitTicket(ticketData) {
    if (!sb()) {
        // Fallback: queue locally
        return queueTicketLocally(ticketData);
    }

    const user = await getUser();

    try {
        const { data, error} = await sb()
            .from('tickets')
            .insert({
                id: ticketData.id,
                user_id: user?.id || null,
                user_email: ticketData.userEmail || user?.email || '',
                user_name: ticketData.userName || CONFIG.name || '',
                subject: ticketData.subject,
                category: ticketData.category || 'general',
                priority: ticketData.priority || 'medium',
                status: 'open',
                submission_method: navigator.onLine ? 'online' : 'offline',
                messages: [{
                    id: Date.now().toString(36),
                    from: 'user',
                    text: ticketData.description,
                    ts: Date.now()
                }],
                page_url: window.location.href,
                user_agent: navigator.userAgent,
                browser_info: {
                    language: navigator.language,
                    platform: navigator.platform,
                    screen: `${screen.width}x${screen.height}`
                }
            })
            .select()
            .single();

        if (error) throw error;

        toast('Ticket submitted successfully', 'success');
        return data;
    } catch (e) {
        if (CONFIG?.debug) console.error('[Tickets] Submit failed:', e);
        // Queue locally as fallback
        return queueTicketLocally(ticketData);
    }
}

async function getUserTickets() {
    if (!sb() || !isLoggedIn()) return [];
    const user = await getUser();
    if (!user) return [];

    try {
        const { data, error } = await sb()
            .from('tickets')
            .select('*')
            .or(`user_id.eq.${user.id},user_email.eq.${user.email}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (e) {
        if (CONFIG?.debug) console.error('[Tickets] Fetch failed:', e);
        return [];
    }
}

async function addTicketMessage(ticketId, message) {
    if (!sb()) return false;

    try {
        // Fetch current ticket
        const { data: ticket } = await sb()
            .from('tickets')
            .select('messages')
            .eq('id', ticketId)
            .single();

        if (!ticket) throw new Error('Ticket not found');

        const messages = ticket.messages || [];
        messages.push({
            id: Date.now().toString(36),
            from: 'user',
            text: message,
            ts: Date.now()
        });

        const { error } = await sb()
            .from('tickets')
            .update({ messages, updated_at: new Date().toISOString() })
            .eq('id', ticketId);

        if (error) throw error;

        toast('Message sent', 'success');
        return true;
    } catch (e) {
        if (CONFIG?.debug) console.error('[Tickets] Add message failed:', e);
        toast('Failed to send message', 'error');
        return false;
    }
}

// ════════════════════════════════════════
// ADMIN — Data Management Functions
// ════════════════════════════════════════

async function fetchAllUsers(filters = {}) {
    if (!sb()) return { data: null, error: 'Supabase not initialized' };

    try {
        let query = sb()
            .from('profiles')
            .select(`
                *,
                subscriptions (*)
            `)
            .order('created_at', { ascending: false });

        if (filters.search) {
            query = query.or(`email.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
        }

        if (filters.plan) {
            query = query.eq('subscriptions.plan', filters.plan);
        }

        if (filters.status) {
            query = query.eq('subscriptions.status', filters.status);
        }

        const { data, error } = await query;
        return { data, error };
    } catch (e) {
        return { data: null, error: e.message };
    }
}

async function fetchUserById(userId) {
    if (!sb()) return null;

    try {
        const { data, error } = await sb()
            .from('profiles')
            .select(`
                *,
                subscriptions (*)
            `)
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    } catch (e) {
        if (CONFIG?.debug) console.error('[Admin] Fetch user failed:', e);
        return null;
    }
}

async function updateUserProfile(userId, updates) {
    if (!sb()) return { error: 'Supabase not initialized' };

    try {
        const { data, error } = await sb()
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        // Log action
        await logAdminAction('update_profile', 'profile', userId, updates);

        return { data, error: null };
    } catch (e) {
        return { data: null, error: e.message };
    }
}

async function updateSubscription(userId, updates) {
    if (!sb()) return { error: 'Supabase not initialized' };

    try {
        const { data, error } = await sb()
            .from('subscriptions')
            .upsert({
                user_id: userId,
                ...updates,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,status' })
            .select()
            .single();

        if (error) throw error;

        // Log action
        await logAdminAction('update_subscription', 'subscription', data.id, updates);

        return { data, error: null };
    } catch (e) {
        return { data: null, error: e.message };
    }
}

async function grantFreeSubscription(userId, plan, durationDays, reason) {
    if (!sb()) return { error: 'Supabase not initialized' };

    try {
        const { data, error } = await sb().rpc('grant_free_subscription', {
            p_user_id: userId,
            p_plan: plan,
            p_duration_days: durationDays,
            p_reason: reason
        });

        if (error) throw error;

        toast('Free subscription granted', 'success');
        return { data, error: null };
    } catch (e) {
        if (CONFIG?.debug) console.error('[Admin] Grant subscription failed:', e);
        toast('Failed to grant subscription', 'error');
        return { data: null, error: e.message };
    }
}

async function fetchTickets(filters = {}) {
    if (!sb()) return { data: null, error: 'Supabase not initialized' };

    try {
        let query = sb()
            .from('tickets')
            .select('*')
            .order('updated_at', { ascending: false });

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.priority) {
            query = query.eq('priority', filters.priority);
        }

        if (filters.category) {
            query = query.eq('category', filters.category);
        }

        if (filters.assigned_to) {
            query = query.eq('assigned_to', filters.assigned_to);
        }

        if (filters.search) {
            query = query.or(`subject.ilike.%${filters.search}%,user_email.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;
        return { data, error };
    } catch (e) {
        return { data: null, error: e.message };
    }
}

async function updateTicket(ticketId, updates) {
    if (!sb()) return { error: 'Supabase not initialized' };

    try {
        const { data, error } = await sb()
            .from('tickets')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId)
            .select()
            .single();

        if (error) throw error;

        // Log action
        await logAdminAction('update_ticket', 'ticket', ticketId, updates);

        return { data, error: null };
    } catch (e) {
        return { data: null, error: e.message };
    }
}

async function addAdminReply(ticketId, message) {
    if (!sb()) return { error: 'Supabase not initialized' };

    try {
        // Fetch current ticket
        const { data: ticket } = await sb()
            .from('tickets')
            .select('messages, subject, user_email, first_response_at')
            .eq('id', ticketId)
            .single();

        if (!ticket) throw new Error('Ticket not found');

        const user = await getUser();
        const messages = ticket.messages || [];
        messages.push({
            id: Date.now().toString(36),
            from: 'admin',
            text: message,
            ts: Date.now(),
            adminEmail: user?.email,
            adminName: CONFIG.name
        });

        const { error } = await sb()
            .from('tickets')
            .update({
                messages,
                first_response_at: ticket.first_response_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);

        if (error) throw error;

        // Queue email notification to user
        await queueEmail(ticket.user_email, 'ticket_reply', {
            ticketId,
            subject: ticket.subject,
            reply: message
        });

        toast('Reply sent', 'success');
        return { error: null };
    } catch (e) {
        if (CONFIG?.debug) console.error('[Admin] Add reply failed:', e);
        toast('Failed to send reply', 'error');
        return { error: e.message };
    }
}

async function bulkAssignTickets(ticketIds, assignedTo) {
    if (!sb()) return { error: 'Supabase not initialized' };

    try {
        const { data, error } = await sb()
            .from('tickets')
            .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
            .in('id', ticketIds)
            .select();

        if (error) throw error;

        await logAdminAction('bulk_assign_tickets', 'ticket', ticketIds.join(','), { assignedTo, count: ticketIds.length });

        toast(`${ticketIds.length} tickets assigned`, 'success');
        return { data, error: null };
    } catch (e) {
        if (CONFIG?.debug) console.error('[Admin] Bulk assign failed:', e);
        toast('Failed to assign tickets', 'error');
        return { error: e.message };
    }
}

async function fetchAnalytics() {
    if (!sb()) return null;

    try {
        // Fetch multiple analytics in parallel
        const [subsData, paymentsData, ticketsData, usersData] = await Promise.all([
            sb().from('subscriptions').select('*'),
            sb().from('payment_history').select('*').eq('status', 'succeeded'),
            sb().from('tickets').select('*'),
            sb().from('profiles').select('created_at')
        ]);

        const now = Date.now();
        const monthAgo = now - (30 * 24 * 60 * 60 * 1000);

        // Active subscriptions
        const activeSubs = (subsData.data || []).filter(s => s.status === 'active' || s.status === 'trialing');

        // MRR calculation
        const mrr = activeSubs.reduce((sum, s) => {
            if (s.interval === 'month') return sum + (s.amount || 0);
            if (s.interval === 'year') return sum + ((s.amount || 0) / 12);
            return sum;
        }, 0);

        // New users this month
        const newUsersThisMonth = (usersData.data || []).filter(u =>
            new Date(u.created_at).getTime() > monthAgo
        ).length;

        // Churn rate (canceled in last 30 days)
        const churnedThisMonth = (subsData.data || []).filter(s =>
            s.canceled_at && new Date(s.canceled_at).getTime() > monthAgo
        ).length;
        const churnRate = activeSubs.length > 0 ? (churnedThisMonth / activeSubs.length * 100).toFixed(1) : 0;

        // Revenue this month
        const revenueThisMonth = (paymentsData.data || []).filter(p =>
            new Date(p.paid_at).getTime() > monthAgo
        ).reduce((sum, p) => sum + (p.amount || 0), 0);

        // Open tickets
        const openTickets = (ticketsData.data || []).filter(t => t.status === 'open').length;

        // Average resolution time (in hours)
        const resolvedTickets = (ticketsData.data || []).filter(t => t.resolved_at);
        const avgResolutionTime = resolvedTickets.length > 0
            ? resolvedTickets.reduce((sum, t) => {
                const created = new Date(t.created_at).getTime();
                const resolved = new Date(t.resolved_at).getTime();
                return sum + ((resolved - created) / (1000 * 60 * 60));
            }, 0) / resolvedTickets.length
            : 0;

        return {
            totalUsers: (usersData.data || []).length,
            activeSubscriptions: activeSubs.length,
            mrr: mrr.toFixed(2),
            arr: (mrr * 12).toFixed(2),
            churnRate,
            newUsersThisMonth,
            revenueThisMonth: revenueThisMonth.toFixed(2),
            openTickets,
            avgResolutionTimeHours: avgResolutionTime.toFixed(1)
        };
    } catch (e) {
        if (CONFIG?.debug) console.error('[Analytics] Computation failed:', e);
        return null;
    }
}

async function createAnnouncement(announcement) {
    if (!sb()) return { error: 'Supabase not initialized' };

    try {
        const user = await getUser();
        const { data, error } = await sb()
            .from('announcements')
            .insert({
                ...announcement,
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;

        await logAdminAction('create_announcement', 'announcement', data.id, announcement);

        toast('Announcement created', 'success');
        return { data, error: null };
    } catch (e) {
        if (CONFIG?.debug) console.error('[Admin] Create announcement failed:', e);
        toast('Failed to create announcement', 'error');
        return { error: e.message };
    }
}

async function getActiveAnnouncements() {
    if (!sb()) return [];

    try {
        const { data, error } = await sb()
            .from('announcements')
            .select('*')
            .eq('is_active', true)
            .lte('starts_at', new Date().toISOString())
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (e) {
        if (CONFIG?.debug) console.error('[Announcements] Fetch failed:', e);
        return [];
    }
}

async function logAdminAction(action, resourceType, resourceId, details) {
    if (!sb()) return;

    try {
        const user = await getUser();
        await sb().from('admin_audit_log').insert({
            admin_id: user.id,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            changes: details
        });
    } catch (e) {
        if (CONFIG?.debug) console.error('[Audit] Log failed:', e);
    }
}

async function queueEmail(toEmail, template, templateData) {
    if (!sb()) return;

    try {
        await sb().from('email_queue').insert({
            to_email: toEmail,
            template,
            subject: getEmailSubject(template),
            body_html: renderEmailTemplate(template, templateData),
            template_data: templateData
        });
    } catch (e) {
        if (CONFIG?.debug) console.error('[Email] Queue failed:', e);
    }
}

function getEmailSubject(template) {
    const subjects = {
        ticket_reply: 'New reply to your support ticket',
        ticket_update: 'Your support ticket was updated',
        subscription_created: 'Welcome to your new plan!',
        subscription_expiring: 'Your subscription is expiring soon',
        payment_failed: 'Payment Failed',
        welcome: 'Welcome to ProposalKit!'
    };
    return subjects[template] || 'Notification from ProposalKit';
}

function renderEmailTemplate(template, data) {
    // Simple email template rendering
    // In production, use a proper email template engine
    const templates = {
        ticket_reply: `<p>You have a new reply to your ticket: <strong>${esc(data.subject)}</strong></p><p>${esc(data.reply)}</p>`,
        subscription_created: `<h2>Welcome to ${esc(data.plan)} plan!</h2><p>Your subscription is now active.</p>`,
        payment_failed: `<p>We couldn't process your payment. Please update your payment method.</p>`
    };
    return templates[template] || '<p>Notification from ProposalKit</p>';
}
