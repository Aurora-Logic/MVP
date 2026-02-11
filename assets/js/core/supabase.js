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
        console.warn('Supabase SDK not loaded — running in offline mode');
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
        console.error('Supabase init failed:', e);
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
        if (error) { console.warn('Token refresh failed:', error.message); return null; }
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
