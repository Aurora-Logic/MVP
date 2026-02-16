# Login Button Debug Guide

Quick guide to debug the "Sign In" button issue.

---

## 🔍 Step 1: Check Browser Console

1. Open your app: `http://localhost:3000`
2. Open DevTools:
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Firefox**: Press `F12` or `Ctrl+Shift+K`
   - **Safari**: Enable Developer menu first, then `Cmd+Option+I`

3. Click the **Console** tab

4. Try to sign in with `virag@deltasystem.in` and your password

5. **Look for error messages** in the console

---

## 🐛 Common Errors & Fixes

### Error: `doLogin is not defined`

**Cause:** JavaScript not loaded or function not exported

**Fix:**
1. Hard refresh the page: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Check that `auth.js` has this line at the top:
   ```javascript
   /* exported initAuth, onSignedIn, doLogin, doSignup, doGoogleLogin, doGithubLogin, doFigmaLogin, doPasswordReset, skipAuth, doLogout, authMode */
   ```

---

### Error: `Supabase SDK not loaded`

**Cause:** Supabase CDN failed to load

**Fix:**
1. Check internet connection
2. Verify `assets/js/vendor/supabase-2.49.1.js` exists
3. Try loading the page in incognito mode

---

### Error: `Invalid login credentials`

**Cause:** User account doesn't exist or wrong password

**Fix:**
1. **Create account first** using one of these methods:
   - Click **"Sign up"** in the app
   - Use Google/GitHub/Figma OAuth
   - Manually create in Supabase Dashboard

2. If you forgot password:
   - Click **"Forgot password?"** link
   - Or reset via Supabase Dashboard

---

### Error: `Email not confirmed`

**Cause:** Email confirmation enabled but not completed

**Fix Option 1:** Check email for confirmation link

**Fix Option 2:** Disable email confirmation:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Providers** → **Email**
4. Toggle **"Enable email confirmations"** OFF
5. Try signing up again

---

### Error: `No such user found`

**Cause:** User doesn't exist in database

**Fix:** Create the user first - see [CREATE_ADMIN_ACCOUNT.md](CREATE_ADMIN_ACCOUNT.md)

---

### Error: `profiles table does not exist`

**Cause:** Database schema not set up

**Fix:** Run this SQL in Supabase:
```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    plan TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

---

### Button does absolutely nothing (no error, no loading)

**Possible causes:**
1. JavaScript error earlier in page load
2. Function not bound to button
3. Browser blocking scripts

**Debug steps:**
1. Check console for ANY red errors
2. Type this in console and press Enter:
   ```javascript
   typeof doLogin
   ```
   - Should show: `"function"`
   - If shows: `"undefined"` → Script didn't load

3. Try this in console:
   ```javascript
   doLogin()
   ```
   - If it runs → Button onclick is broken
   - If error → Function has issues

4. **Quick fix:** Try OAuth login instead:
   - Click **Google**, **GitHub**, or **Figma** button
   - These should work even if email login is broken

---

## ✅ Step 2: Test Supabase Connection

Open browser console and run:

```javascript
// Test 1: Check if Supabase SDK loaded
console.log('Supabase SDK:', typeof window.supabase);
// Should show: "object"

// Test 2: Check if client initialized
console.log('Client:', typeof sb);
// Should show: "function"

// Test 3: Try to get session
sb().auth.getSession().then(r => console.log('Session:', r));
// Should show: {data: {session: null}, error: null}
```

**Expected results:**
- ✅ Supabase SDK: `"object"`
- ✅ Client: `"function"`
- ✅ Session: `{data: {session: null}, error: null}`

**If any fail:**
- Hard refresh: `Ctrl+Shift+R` / `Cmd+Shift+R`
- Clear cache and try again

---

## 🚀 Step 3: Create Test Account

### Option A: Via Signup Form (Easiest)

1. Open app
2. Click **"Sign up"** (top-right)
3. Fill in:
   - **Name**: Your name
   - **Email**: `virag@deltasystem.in`
   - **Password**: Choose a strong password (min 6 chars)
4. Click **"Sign Up"**
5. If you see "Check your email" → Go to email and click confirmation link
6. Then try logging in

### Option B: Via OAuth (Instant - No Email Confirmation)

1. Open app
2. Click **Google**, **GitHub**, or **Figma** button
3. Authorize
4. You're logged in! ✅

**⚠️ Note:** If you use OAuth with a different email (not virag@deltasystem.in), you'll need to update the admin SQL to use your OAuth email.

### Option C: Manually in Supabase Dashboard

1. [Supabase Dashboard](https://app.supabase.com) → Your Project
2. **Authentication** → **Users** → **Add user**
3. Fill in:
   - Email: `virag@deltasystem.in`
   - Password: (choose one)
   - ✅ **Auto Confirm User** (important!)
4. Click **"Create user"**
5. Now you can login

---

## 🎯 Step 4: Grant Admin Role

**After creating the account**, run this SQL:

```sql
-- Grant admin access
UPDATE profiles
SET role = 'admin'
WHERE email = 'virag@deltasystem.in';

-- Verify it worked
SELECT id, email, role, created_at
FROM profiles
WHERE email = 'virag@deltasystem.in';
```

**Expected result:**
```
email: virag@deltasystem.in
role: admin
```

**If no rows returned:**

The profile wasn't created. Manually create it:

```sql
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', 'admin'
FROM auth.users
WHERE email = 'virag@deltasystem.in';
```

---

## 📋 Complete Test Checklist

- [ ] Browser console shows no errors on page load
- [ ] `typeof doLogin` shows `"function"` in console
- [ ] `typeof sb` shows `"function"` in console
- [ ] User account created in Supabase (via signup/OAuth/manual)
- [ ] Email confirmed (if confirmation is enabled)
- [ ] `profiles` table exists and has your user
- [ ] `role` column set to `'admin'`
- [ ] Can login successfully
- [ ] "Admin Panel" button appears in sidebar
- [ ] Can access `/admin` route

---

## 🆘 Still Stuck?

### Quick Diagnostic Report

Run this in browser console and share the output:

```javascript
console.log({
    supabaseSDK: typeof window.supabase,
    sbClient: typeof sb,
    doLoginExists: typeof doLogin,
    pageUrl: window.location.href,
    localStorage: Object.keys(localStorage).filter(k => k.startsWith('pk_')),
    errors: 'Check console for red errors above this'
});
```

### What to Share When Asking for Help

1. **Browser Console Screenshot** (showing any red errors)
2. **Supabase Auth Logs** (Dashboard → Logs → Auth Logs)
3. **User exists check** (run in Supabase SQL Editor):
   ```sql
   SELECT email, email_confirmed_at, created_at
   FROM auth.users
   WHERE email = 'virag@deltasystem.in';
   ```
4. **Profile exists check**:
   ```sql
   SELECT email, role, created_at
   FROM profiles
   WHERE email = 'virag@deltasystem.in';
   ```

---

## 🎉 Success Path

**The simplest way to get started RIGHT NOW:**

1. **Use OAuth** (skip email/password issues):
   - Click **Google**, **GitHub**, or **Figma** button
   - Authorize
   - You're in! ✅

2. **Grant admin role** via SQL:
   ```sql
   -- Use the email from your OAuth account
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'your-oauth-email@example.com';
   ```

3. **Refresh page** - Admin Panel button should appear

---

**Last Updated**: 2026-02-14
**Related Docs**: CREATE_ADMIN_ACCOUNT.md, SETUP_GUIDE.md, OAUTH_SETUP_FINAL.md
