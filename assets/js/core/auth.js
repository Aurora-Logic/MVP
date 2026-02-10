// ════════════════════════════════════════
// AUTH — Login, Signup, Session Management
// ════════════════════════════════════════

let authMode = 'login'; // login | signup | reset

async function initAuth() {
    initSupabase();
    if (!sb()) {
        offlineBoot();
        return;
    }

    // Detect OAuth callback (hash contains access_token from Google redirect)
    const hash = window.location.hash;
    const isOAuthCallback = hash && hash.includes('access_token=');
    const hasOAuthError = hash && (hash.includes('error=') || hash.includes('error_description='));

    if (hasOAuthError) {
        const el = document.getElementById('obContent');
        if (el) {
            document.getElementById('appShell').style.display = 'none';
            document.getElementById('onboard').classList.remove('hide');
            el.innerHTML = '<div class="auth-form" style="text-align:center"><div style="font-size:36px;margin-bottom:12px">&#9888;&#65039;</div><div class="auth-title">Sign-in failed</div><div class="auth-desc">Google authentication was cancelled or failed. Please try again.</div><button class="btn" style="margin-top:16px" onclick="authMode=\'login\';renderAuthScreen()">Back to Sign In</button></div>';
        }
        if (window.history.replaceState) window.history.replaceState(null, '', window.location.pathname);
        return;
    }

    if (isOAuthCallback) {
        // Show loading while Supabase SDK processes the OAuth token from the hash
        const el = document.getElementById('obContent');
        if (el) {
            document.getElementById('appShell').style.display = 'none';
            document.getElementById('onboard').classList.remove('hide');
            el.innerHTML = '<div class="auth-form" style="text-align:center"><div style="font-size:36px;margin-bottom:12px">&#128274;</div><div class="auth-title">Signing you in...</div><div class="auth-desc">Please wait while we complete authentication.</div></div>';
        }
    }

    // Set up auth state listener FIRST (before getSession triggers detectSessionInUrl)
    let authBooted = false;
    sb().auth.onAuthStateChange(async (event, session) => {
        sbSession = session;
        // Clean hash after SDK processes it
        if (window.location.hash.includes('access_token=') && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session && !authBooted) {
            authBooted = true;
            await pullAndBoot();
        } else if (event === 'INITIAL_SESSION' && !session && !authBooted) {
            authBooted = true;
            renderAuthScreen();
        } else if (event === 'SIGNED_OUT') {
            sbSession = null;
            renderAuthScreen();
        }
    });

    // getSession() triggers Supabase SDK to detect hash tokens (detectSessionInUrl: true)
    // and fire onAuthStateChange with INITIAL_SESSION
    try {
        const { data } = await sb().auth.getSession();
        sbSession = data?.session || null;
    } catch (e) { sbSession = null; }

    // Fallback: if onAuthStateChange hasn't fired yet (rare), boot manually
    if (!authBooted) {
        if (sbSession) {
            authBooted = true;
            await pullAndBoot();
        } else if (!isOAuthCallback) {
            // No session and not waiting for OAuth — show login
            authBooted = true;
            renderAuthScreen();
        }
        // If OAuth callback with no session yet, onAuthStateChange will handle it
    }
}

function offlineBoot() {
    if (CONFIG) {
        document.getElementById('onboard').classList.add('hide');
        document.getElementById('appShell').style.display = 'flex';
        bootApp();
    } else {
        renderOnboarding();
    }
}

async function onSignedIn() {
    await pullAndBoot();
}

async function pullAndBoot() {
    // Pull cloud data if online
    if (navigator.onLine && typeof pullFromCloud === 'function') {
        try { await pullFromCloud(); } catch (e) { console.warn('Cloud pull failed:', e); }
    }
    // Reload globals from localStorage (pullFromCloud may have updated them)
    try { DB = JSON.parse(localStorage.getItem('pk_db') || '[]'); } catch (e) { DB = []; }
    try { CONFIG = JSON.parse(localStorage.getItem('pk_config') || 'null'); } catch (e) { CONFIG = null; }
    try { CLIENTS = JSON.parse(localStorage.getItem('pk_clients') || '[]'); } catch (e) { CLIENTS = []; }

    if (CONFIG) {
        document.getElementById('onboard').classList.add('hide');
        document.getElementById('appShell').style.display = 'flex';
        bootApp();
    } else {
        renderOnboarding();
    }
}

// ════════════════════════════════════════
// AUTH UI
// ════════════════════════════════════════

function renderAuthScreen() {
    document.getElementById('appShell').style.display = 'none';
    document.getElementById('onboard').classList.remove('hide');
    document.title = 'Sign In — ProposalKit';
    const el = document.getElementById('obContent');
    if (!el) return;

    if (authMode === 'reset') {
        el.innerHTML = getResetHtml();
    } else if (authMode === 'signup') {
        el.innerHTML = getSignupHtml();
    } else {
        el.innerHTML = getLoginHtml();
    }
    lucide.createIcons();
    // Focus first input
    const firstInput = el.querySelector('input:not([type="hidden"])');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
}

function getLoginHtml() {
    return `
        <div class="auth-form">
            <div class="auth-header">
                <div class="auth-title">Welcome back</div>
                <div class="auth-desc">Sign in to sync your proposals across devices</div>
            </div>
            <button class="auth-google-btn" onclick="doGoogleLogin()">
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Sign in with Google
            </button>
            <div class="auth-divider"><span>or continue with email</span></div>
            <div class="fg"><label class="fl">Email</label><input type="email" id="authEmail" placeholder="you@example.com" onkeydown="if(event.key==='Enter')doLogin()"></div>
            <div class="fg"><label class="fl">Password</label><input type="password" id="authPass" placeholder="Your password" onkeydown="if(event.key==='Enter')doLogin()"></div>
            <div id="authError" class="auth-error"></div>
            <button class="btn auth-submit" id="authSubmitBtn" onclick="doLogin()">Sign In</button>
            <div class="auth-links">
                <span>Don't have an account? <a href="#" onclick="authMode='signup';renderAuthScreen();return false">Sign up</a></span>
                <a href="#" onclick="authMode='reset';renderAuthScreen();return false">Forgot password?</a>
            </div>
            <div class="auth-offline">
                <button class="btn-outline auth-offline-btn" onclick="skipAuth()">
                    <i data-lucide="wifi-off" style="width:16px;height:16px"></i> Continue without account
                </button>
                <div class="auth-offline-hint">Your data stays on this device only</div>
            </div>
        </div>`;
}

function getSignupHtml() {
    return `
        <div class="auth-form">
            <div class="auth-header">
                <div class="auth-title">Create your account</div>
                <div class="auth-desc">Start building professional proposals for free</div>
            </div>
            <button class="auth-google-btn" onclick="doGoogleLogin()">
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Sign up with Google
            </button>
            <div class="auth-divider"><span>or continue with email</span></div>
            <div class="fg"><label class="fl">Full Name</label><input type="text" id="authName" placeholder="Your name" onkeydown="if(event.key==='Enter')document.getElementById('authEmail').focus()"></div>
            <div class="fg"><label class="fl">Email</label><input type="email" id="authEmail" placeholder="you@example.com" onkeydown="if(event.key==='Enter')document.getElementById('authPass').focus()"></div>
            <div class="fg"><label class="fl">Password</label><input type="password" id="authPass" placeholder="Min 6 characters" onkeydown="if(event.key==='Enter')doSignup()"></div>
            <div id="authError" class="auth-error"></div>
            <button class="btn auth-submit" id="authSubmitBtn" onclick="doSignup()">Create Account</button>
            <div class="auth-links">
                <span>Already have an account? <a href="#" onclick="authMode='login';renderAuthScreen();return false">Sign in</a></span>
            </div>
            <div class="auth-offline">
                <button class="btn-outline auth-offline-btn" onclick="skipAuth()">
                    <i data-lucide="wifi-off" style="width:16px;height:16px"></i> Continue without account
                </button>
                <div class="auth-offline-hint">Your data stays on this device only</div>
            </div>
        </div>`;
}

function getResetHtml() {
    return `
        <div class="auth-form">
            <div class="auth-header">
                <div class="auth-title">Reset password</div>
                <div class="auth-desc">Enter your email and we'll send a reset link</div>
            </div>
            <div class="fg"><label class="fl">Email</label><input type="email" id="authEmail" placeholder="you@example.com" onkeydown="if(event.key==='Enter')doPasswordReset()"></div>
            <div id="authError" class="auth-error"></div>
            <button class="btn auth-submit" id="authSubmitBtn" onclick="doPasswordReset()">Send Reset Link</button>
            <div class="auth-links">
                <a href="#" onclick="authMode='login';renderAuthScreen();return false"><i data-lucide="arrow-left" style="width:14px;height:14px;vertical-align:middle"></i> Back to sign in</a>
            </div>
        </div>`;
}

// ════════════════════════════════════════
// AUTH ACTIONS
// ════════════════════════════════════════

function showAuthError(msg) {
    const el = document.getElementById('authError');
    if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
}

function setAuthLoading(loading) {
    const btn = document.getElementById('authSubmitBtn');
    if (!btn) return;
    btn.disabled = loading;
    btn.style.opacity = loading ? '0.6' : '1';
}

async function doLogin() {
    const email = document.getElementById('authEmail')?.value?.trim();
    const pass = document.getElementById('authPass')?.value;
    if (!email) { showAuthError('Please enter your email'); return; }
    if (!pass || pass.length < 6) { showAuthError('Password must be at least 6 characters'); return; }
    showAuthError('');
    setAuthLoading(true);
    try {
        const { data, error } = await sb().auth.signInWithPassword({ email, password: pass });
        if (error) { showAuthError(error.message); setAuthLoading(false); return; }
        sbSession = data.session;
        // onAuthStateChange will handle the rest
    } catch (e) {
        showAuthError('Login failed. Please try again.');
        setAuthLoading(false);
    }
}

async function doSignup() {
    const name = document.getElementById('authName')?.value?.trim();
    const email = document.getElementById('authEmail')?.value?.trim();
    const pass = document.getElementById('authPass')?.value;
    if (!name) { showAuthError('Please enter your name'); return; }
    if (!email) { showAuthError('Please enter your email'); return; }
    if (!pass || pass.length < 6) { showAuthError('Password must be at least 6 characters'); return; }
    showAuthError('');
    setAuthLoading(true);
    try {
        const { data, error } = await sb().auth.signUp({
            email, password: pass,
            options: { data: { full_name: name, name: name } }
        });
        if (error) { showAuthError(error.message); setAuthLoading(false); return; }
        if (data.user && !data.session) {
            // Email confirmation required
            showAuthError('');
            document.getElementById('obContent').innerHTML = `
                <div class="auth-form" style="text-align:center">
                    <div style="font-size:36px;margin-bottom:12px">&#9993;</div>
                    <div class="auth-title">Check your email</div>
                    <div class="auth-desc" style="margin-bottom:20px">We sent a confirmation link to <strong>${esc(email)}</strong>. Click it to activate your account.</div>
                    <button class="btn-outline" onclick="authMode='login';renderAuthScreen()">Back to Sign In</button>
                </div>`;
            return;
        }
        sbSession = data.session;
        // onAuthStateChange handles boot
    } catch (e) {
        showAuthError('Signup failed. Please try again.');
        setAuthLoading(false);
    }
}

async function doGoogleLogin() {
    if (!sb()) { showAuthError('Cloud features unavailable'); return; }
    try {
        // Use current origin (works on localhost, Vercel, custom domains)
        const redirectUrl = window.location.origin + window.location.pathname;
        const { error } = await sb().auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: redirectUrl }
        });
        if (error) showAuthError(error.message);
    } catch (e) {
        showAuthError('Google login failed');
    }
}

async function doPasswordReset() {
    const email = document.getElementById('authEmail')?.value?.trim();
    if (!email) { showAuthError('Please enter your email'); return; }
    showAuthError('');
    setAuthLoading(true);
    try {
        const { error } = await sb().auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/index.html'
        });
        if (error) { showAuthError(error.message); setAuthLoading(false); return; }
        showAuthError('');
        document.getElementById('obContent').innerHTML = `
            <div class="auth-form" style="text-align:center">
                <div style="font-size:36px;margin-bottom:12px">&#9993;</div>
                <div class="auth-title">Check your email</div>
                <div class="auth-desc" style="margin-bottom:20px">We sent a password reset link to <strong>${esc(email)}</strong>.</div>
                <button class="btn-outline" onclick="authMode='login';renderAuthScreen()">Back to Sign In</button>
            </div>`;
    } catch (e) {
        showAuthError('Failed to send reset email');
        setAuthLoading(false);
    }
}

function skipAuth() {
    offlineBoot();
}

async function doLogout() {
    if (sb()) {
        try { await sb().auth.signOut(); } catch (e) { console.warn('Signout error:', e); }
    }
    sbSession = null;
    // Clear auth-related storage
    sessionStorage.removeItem('pk_csrf');
    // onAuthStateChange SIGNED_OUT will call renderAuthScreen()
}
