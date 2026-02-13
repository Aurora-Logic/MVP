// ════════════════════════════════════════
// AUTH — Login, Signup, Session Management
// ════════════════════════════════════════

/* exported initAuth, onSignedIn, doLogin, doSignup, doGoogleLogin, doGithubLogin, doPasswordReset, skipAuth, doLogout, authMode */
let authMode = 'login'; // login | signup | reset -- eslint: reassigned via onclick handlers

function showAuthSplit() {
    const split = document.getElementById('authSplit');
    const card = document.getElementById('obCard');
    if (split) split.style.display = 'flex';
    if (card) card.style.display = 'none';
    document.getElementById('appShell').style.display = 'none';
    document.getElementById('onboard').classList.remove('hide');
}

function hideAuthSplit() {
    const split = document.getElementById('authSplit');
    if (split) split.style.display = 'none';
}

function authTarget() {
    return document.getElementById('authContent');
}

async function initAuth() {
    initSupabase();
    if (!sb()) {
        offlineBoot();
        return;
    }

    // Safety timeout — never leave the user on a blank screen
    const safetyTimer = setTimeout(() => {
        if (!authTarget()?.innerHTML?.trim() && !document.getElementById('obContent')?.innerHTML?.trim()) {
            console.warn('[Auth] Safety timeout — showing auth screen');
            renderAuthScreen();
        }
    }, 5000);

    // Detect OAuth callback (hash contains access_token from Google redirect)
    const hash = window.location.hash;
    const isOAuthCallback = hash && hash.includes('access_token=');
    const hasOAuthError = hash && (hash.includes('error=') || hash.includes('error_description='));

    if (hasOAuthError) {
        showAuthSplit();
        const el = authTarget();
        if (el) {
            el.innerHTML = '<div class="auth-form" style="text-align:center"><div style="font-size:36px;margin-bottom:12px">&#9888;&#65039;</div><div class="auth-title">Sign-in failed</div><div class="auth-desc" style="margin-bottom:20px">Google authentication was cancelled or failed. Please try again.</div><button class="btn" onclick="authMode=\'login\';renderAuthScreen()">Back to Sign In</button></div>';
        }
        if (window.history.replaceState) window.history.replaceState(null, '', window.location.pathname);
        return;
    }

    if (isOAuthCallback) {
        showAuthSplit();
        const el = authTarget();
        if (el) {
            el.innerHTML = '<div class="auth-form" style="text-align:center"><div style="font-size:36px;margin-bottom:12px">&#128274;</div><div class="auth-title">Signing you in...</div><div class="auth-desc">Please wait while we complete authentication.</div></div>';
        }
    }

    // Use a promise-based approach to handle the session resolution
    let authBooted = false;

    async function safePullAndBoot() {
        try {
            await pullAndBoot();
        } catch (e) {
            console.error('pullAndBoot failed:', e);
            if (CONFIG) {
                hideAuthSplit();
                document.getElementById('onboard').classList.add('hide');
                document.getElementById('appShell').style.display = 'flex';
                bootApp();
                if (typeof toast === 'function') toast('Cloud sync failed — working offline', 'error');
            } else {
                showAuthSplit();
                renderOnboarding();
            }
        }
    }

    function cleanHash() {
        if (window.location.hash.includes('access_token=') && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }

    // Register auth state listener
    sb().auth.onAuthStateChange(async (event, session) => {
        console.warn('[Auth] onAuthStateChange:', event, !!session);
        sbSession = session;
        cleanHash();

        if (event === 'SIGNED_OUT') {
            sbSession = null;
            if (authBooted) {
                // Reset URL to root so refresh doesn't land on a protected route
                if (window.location.pathname !== '/') {
                    history.replaceState(null, '', '/');
                }
                renderAuthScreen();
            }
            return;
        }

        if (session && !authBooted) {
            authBooted = true;
            clearTimeout(safetyTimer);
            await safePullAndBoot();
        } else if (event === 'INITIAL_SESSION' && !session && !authBooted && !isOAuthCallback) {
            authBooted = true;
            clearTimeout(safetyTimer);
            renderAuthScreen();
        }
    });

    // getSession() triggers SDK's detectSessionInUrl to process hash tokens
    try {
        console.warn('[Auth] Calling getSession...');
        const { data, error } = await sb().auth.getSession();
        console.warn('[Auth] getSession result:', !!data?.session, error?.message || 'ok');
        if (data?.session) sbSession = data.session;
    } catch (e) {
        console.warn('[Auth] getSession failed:', e);
        sbSession = null;
    }

    // Give onAuthStateChange a moment to fire (it's async)
    await new Promise(r => setTimeout(r, 300));

    if (authBooted) { clearTimeout(safetyTimer); return; }

    // Fallback: if we have a session from getSession, boot manually
    if (sbSession) {
        console.warn('[Auth] Fallback: booting with session from getSession');
        authBooted = true;
        clearTimeout(safetyTimer);
        cleanHash();
        await safePullAndBoot();
        return;
    }

    // For OAuth callbacks: the SDK may need more time to process
    if (isOAuthCallback) {
        console.warn('[Auth] OAuth callback — waiting for SDK to process token...');
        try {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            console.warn('[Auth] Token lengths:', accessToken?.length, refreshToken?.length);
            if (accessToken && refreshToken) {
                console.warn('[Auth] Manual setSession attempt...');
                const { data, error } = await sb().auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });
                if (!error && data?.session) {
                    sbSession = data.session;
                    authBooted = true;
                    cleanHash();
                    await safePullAndBoot();
                    return;
                }
                console.warn('[Auth] Manual setSession failed:', error?.message, error?.status);
            }
        } catch (e) {
            console.warn('[Auth] Manual token exchange failed:', e);
        }

        // Final timeout: show error with retry
        await new Promise(r => setTimeout(r, 3000));
        if (!authBooted) {
            cleanHash();
            authBooted = true;
            showOAuthRetryScreen();
        }
        return;
    }

    // No session, no OAuth callback — show login
    authBooted = true;
    clearTimeout(safetyTimer);
    renderAuthScreen();
}

function showOAuthRetryScreen() {
    showAuthSplit();
    const el = authTarget();
    if (el) {
        el.innerHTML = `<div class="auth-form" style="text-align:center">
            <div style="font-size:36px;margin-bottom:12px">&#9888;&#65039;</div>
            <div class="auth-title">Sign-in timed out</div>
            <div class="auth-desc" style="margin-bottom:20px">We couldn't complete the sign-in. This can happen if the link expired or there was a network issue.</div>
            <button class="btn" style="margin-bottom:12px" onclick="doGoogleLogin()">Try again with Google</button>
            <div><button class="btn-outline" onclick="authMode='login';renderAuthScreen()">Back to Sign In</button></div>
            <div class="auth-offline">
                <button class="btn-outline auth-offline-btn" onclick="skipAuth()">
                    <i data-lucide="wifi-off" style="width:16px;height:16px"></i> Continue offline
                </button>
            </div>
        </div>`;
        lucide.createIcons();
    }
}

function offlineBoot() {
    if (CONFIG) {
        hideAuthSplit();
        document.getElementById('onboard').classList.add('hide');
        document.getElementById('appShell').style.display = 'flex';
        bootApp();
    } else {
        showAuthSplit();
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
        hideAuthSplit();
        document.getElementById('onboard').classList.add('hide');
        document.getElementById('appShell').style.display = 'flex';
        bootApp();
    } else {
        showAuthSplit();
        renderOnboarding();
    }
}

// ════════════════════════════════════════
// AUTH UI
// ════════════════════════════════════════

function renderAuthScreen() {
    showAuthSplit();
    document.title = 'Sign In — ProposalKit';
    const el = authTarget();
    if (!el) return;

    // Top-right: toggle link between login/signup
    const top = document.getElementById('authRightTop');
    if (top) {
        if (authMode === 'signup') {
            top.innerHTML = '<button class="btn-ghost auth-mode-link" onclick="authMode=\'login\';renderAuthScreen()">Login</button>';
        } else if (authMode === 'login') {
            top.innerHTML = '<button class="btn-ghost auth-mode-link" onclick="authMode=\'signup\';renderAuthScreen()">Sign up</button>';
        } else {
            top.innerHTML = '<button class="btn-ghost auth-mode-link" onclick="authMode=\'login\';renderAuthScreen()">Login</button>';
        }
    }

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
                <div class="auth-desc">Sign in to your account to continue</div>
            </div>
            <div class="fg"><label class="fl">Email</label><input type="email" id="authEmail" placeholder="name@example.com" onkeydown="if(event.key==='Enter')document.getElementById('authPass').focus()"></div>
            <div class="fg"><label class="fl">Password</label><input type="password" id="authPass" placeholder="Enter your password" onkeydown="if(event.key==='Enter')doLogin()"></div>
            <div id="authError" class="auth-error"></div>
            <button class="btn auth-submit" id="authSubmitBtn" onclick="doLogin()">Sign In with Email</button>
            <div class="auth-divider"><span>OR CONTINUE WITH</span></div>
            <div class="auth-social-row">
                <button class="auth-google-btn" onclick="doGoogleLogin()">
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                    Google
                </button>
                <button class="auth-github-btn" onclick="doGithubLogin()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    GitHub
                </button>
            </div>
            <div class="auth-links">
                <a href="#" onclick="authMode='reset';renderAuthScreen();return false">Forgot password?</a>
            </div>
            <div class="auth-offline">
                <button class="btn-outline auth-offline-btn" onclick="skipAuth()">
                    <i data-lucide="wifi-off" style="width:16px;height:16px"></i> Continue without account
                </button>
                <div class="auth-offline-hint">Your data stays on this device only</div>
            </div>
            <div class="auth-terms">By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</div>
        </div>`;
}

function getSignupHtml() {
    return `
        <div class="auth-form">
            <div class="auth-header">
                <div class="auth-title">Create an account</div>
                <div class="auth-desc">Enter your details below to get started</div>
            </div>
            <div class="fg"><label class="fl">Full Name</label><input type="text" id="authName" placeholder="Your name" onkeydown="if(event.key==='Enter')document.getElementById('authEmail').focus()"></div>
            <div class="fg"><label class="fl">Email</label><input type="email" id="authEmail" placeholder="name@example.com" onkeydown="if(event.key==='Enter')document.getElementById('authPass').focus()"></div>
            <div class="fg"><label class="fl">Password</label><input type="password" id="authPass" placeholder="Min 6 characters" onkeydown="if(event.key==='Enter')doSignup()"></div>
            <div id="authError" class="auth-error"></div>
            <button class="btn auth-submit" id="authSubmitBtn" onclick="doSignup()">Create Account</button>
            <div class="auth-divider"><span>OR CONTINUE WITH</span></div>
            <div class="auth-social-row">
                <button class="auth-google-btn" onclick="doGoogleLogin()">
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                    Google
                </button>
                <button class="auth-github-btn" onclick="doGithubLogin()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    GitHub
                </button>
            </div>
            <div class="auth-offline">
                <button class="btn-outline auth-offline-btn" onclick="skipAuth()">
                    <i data-lucide="wifi-off" style="width:16px;height:16px"></i> Continue without account
                </button>
                <div class="auth-offline-hint">Your data stays on this device only</div>
            </div>
            <div class="auth-terms">By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</div>
        </div>`;
}

function getResetHtml() {
    return `
        <div class="auth-form">
            <div class="auth-header">
                <div class="auth-title">Reset password</div>
                <div class="auth-desc">Enter your email and we'll send a reset link</div>
            </div>
            <div class="fg"><label class="fl">Email</label><input type="email" id="authEmail" placeholder="name@example.com" onkeydown="if(event.key==='Enter')doPasswordReset()"></div>
            <div id="authError" class="auth-error"></div>
            <button class="btn auth-submit" id="authSubmitBtn" onclick="doPasswordReset()">Send Reset Link</button>
            <div class="auth-links" style="justify-content:center">
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
            const el = authTarget();
            if (el) el.innerHTML = `
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
        console.warn('[Auth] Google OAuth redirectTo:', redirectUrl);
        const { error } = await sb().auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: redirectUrl }
        });
        if (error) showAuthError(error.message);
    } catch (e) {
        showAuthError('Google login failed');
    }
}

async function doGithubLogin() {
    if (!sb()) { showAuthError('Cloud features unavailable'); return; }
    try {
        const redirectUrl = window.location.origin + window.location.pathname;
        const { error } = await sb().auth.signInWithOAuth({
            provider: 'github',
            options: { redirectTo: redirectUrl }
        });
        if (error) showAuthError(error.message);
    } catch (e) {
        showAuthError('GitHub login failed');
    }
}

async function doPasswordReset() {
    const email = document.getElementById('authEmail')?.value?.trim();
    if (!email) { showAuthError('Please enter your email'); return; }
    showAuthError('');
    setAuthLoading(true);
    try {
        const { error } = await sb().auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname
        });
        if (error) { showAuthError(error.message); setAuthLoading(false); return; }
        showAuthError('');
        const el = authTarget();
        if (el) el.innerHTML = `
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

    // SECURITY FIX: Clear ALL sensitive data on logout
    const keysToRemove = [
        'pk_db', 'pk_config', 'pk_clients', 'pk_email_tpl',
        'pk_seclib', 'pk_tclib', 'pk_templates', 'pk_dismissed',
        'pk_subscription', 'pk_analytics', 'pk_feedback',
        'pk_client_responses', 'pk_csrf'
    ];
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
    console.log('[Security] All sensitive data cleared on logout');

    // MULTI-TAB SYNC FIX: Notify other tabs of logout
    localStorage.setItem('pk_logout_signal', Date.now().toString());
    localStorage.removeItem('pk_logout_signal'); // Trigger storage event

    // onAuthStateChange SIGNED_OUT will call renderAuthScreen()
}

// MULTI-TAB SYNC FIX: Listen for logout in other tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'pk_logout_signal' && e.newValue) {
        console.log('[Security] Logout detected in another tab');
        // Force reload to clear all state and show auth screen
        window.location.href = window.location.origin;
    }
});
