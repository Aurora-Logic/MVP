# Fix "Something went wrong. Please refresh." Error

## What This Error Means

This error appears when JavaScript throws an error during page load or execution. The error is caught by the global error handler in `boot.js`.

---

## 🔍 Step 1: Find the Real Error

1. **Open Browser DevTools**
   - Press `F12` or `Ctrl+Shift+I` (Windows)
   - Or `Cmd+Option+I` (Mac)

2. **Go to Console Tab**

3. **Refresh the page** (`Ctrl+R` / `Cmd+R`)

4. **Look for RED error messages** - they will show the actual error

---

## 🐛 Common Errors & Fixes

### Error: `Cannot read property 'xxx' of undefined`

**Cause:** A function is trying to access a property that doesn't exist

**Fix:**
- Check which file the error is in (console shows file name and line number)
- Usually means a variable hasn't been initialized yet

---

### Error: `xxx is not defined`

**Cause:** A function or variable doesn't exist

**Common culprits:**
- `handleRoute is not defined` → router.js didn't load
- `refreshSide is not defined` → sidebar.js didn't load
- `isAdmin is not defined` → supabase.js didn't load

**Fix:**
1. Hard refresh: `Ctrl+Shift+R` / `Cmd+Shift+R`
2. Check Network tab in DevTools
3. Look for any failed script loads (red text)
4. If script failed to load, check the file exists

---

### Error: `Failed to fetch` or Network errors

**Cause:** Can't load external resources (CDN files)

**Fix:**
1. Check internet connection
2. Try different network (mobile hotspot)
3. Disable browser extensions
4. Try incognito mode

---

### Error: `profiles table does not exist` or SQL errors

**Cause:** Supabase database tables not created

**Fix:** Run the database setup SQL (see [CREATE_ADMIN_ACCOUNT.md](CREATE_ADMIN_ACCOUNT.md))

```sql
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
```

---

## 🛠️ Step 2: Quick Fixes to Try

### Fix 1: Hard Refresh
Clear browser cache and reload:
- **Windows/Linux**: `Ctrl+Shift+R`
- **Mac**: `Cmd+Shift+R`

### Fix 2: Clear All Cache
Open DevTools console and run:
```javascript
clearAppCache()
```
This will clear service worker and all caches, then reload.

### Fix 3: Disable Service Worker
If the app is stuck in a broken state:

1. Open DevTools → **Application** tab (Chrome) or **Storage** tab (Firefox)
2. Click **Service Workers** (left sidebar)
3. Click **Unregister** next to the service worker
4. Hard refresh the page

### Fix 4: Clear LocalStorage
⚠️ **Warning:** This will delete all your proposals!

Only do this if nothing else works:

```javascript
// Open DevTools console and run:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 🔧 Step 3: Verify Script Load Order

The scripts must load in this order in `index.html`:

1. ✅ Lucide Icons
2. ✅ DOMPurify
3. ✅ Tailwind CSS
4. ✅ **Supabase SDK** ← Most important!
5. ✅ Razorpay

Check `index.html` has:
```html
<!-- Line 50 -->
<script src="assets/js/vendor/supabase-2.49.1.js?v=18"></script>
```

If this line is missing or the file doesn't exist, download Supabase SDK:
https://unpkg.com/@supabase/supabase-js@2.49.1/dist/umd/supabase.min.js

Save as: `assets/js/vendor/supabase-2.49.1.js`

---

## 📋 Debug Checklist

Run these commands in DevTools console:

### 1. Check if Supabase loaded
```javascript
console.log('Supabase:', typeof window.supabase);
// Should show: "object"
```

### 2. Check if client initialized
```javascript
console.log('Client:', typeof sb);
// Should show: "function"
```

### 3. Check if core functions exist
```javascript
console.log({
    handleRoute: typeof handleRoute,
    refreshSide: typeof refreshSide,
    isAdmin: typeof isAdmin,
    doLogin: typeof doLogin
});
// All should show: "function"
```

### 4. Check localStorage
```javascript
console.log('CONFIG:', CONFIG);
console.log('DB:', DB?.length);
// Should not be "undefined"
```

---

## 🎯 Most Likely Causes

Based on your error, here are the top suspects:

### 1. **Supabase SDK Not Loading** (Most Common)
- Check Network tab for failed loads
- Verify `assets/js/vendor/supabase-2.49.1.js` exists
- Try loading from CDN instead:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/dist/umd/supabase.min.js"></script>
  ```

### 2. **Missing Database Tables**
- Run the SQL schema from CREATE_ADMIN_ACCOUNT.md
- Check Supabase Dashboard → Database → Tables

### 3. **Browser Extensions Blocking Scripts**
- Try incognito mode
- Disable ad blockers

### 4. **Service Worker Caching Old Code**
- Unregister service worker (see Fix 3 above)
- Hard refresh

---

## ✅ After Fixing

Once you see no errors in console:

1. ✅ Page loads without "Something went wrong" error
2. ✅ Login form appears
3. ✅ Can type in email/password fields
4. ✅ OAuth buttons work (Google/GitHub/Figma)

---

## 🆘 Still Stuck?

### Share This Info

1. **Full error from console** (copy entire red error message)
2. **Screenshot of Console tab** after page load
3. **Screenshot of Network tab** showing any failed requests (red text)
4. **Browser and version** (Chrome 120, Firefox 115, etc.)

### Run Diagnostic

```javascript
// Copy this entire block and run in console
console.log('=== DIAGNOSTIC REPORT ===');
console.log('Supabase SDK:', typeof window.supabase);
console.log('Client:', typeof sb);
console.log('Functions:', {
    doLogin: typeof doLogin,
    handleRoute: typeof handleRoute,
    refreshSide: typeof refreshSide,
    isAdmin: typeof isAdmin,
    initAuth: typeof initAuth,
    bootApp: typeof bootApp
});
console.log('Storage:', {
    CONFIG: !!CONFIG,
    DB_length: DB?.length,
    localStorage_keys: Object.keys(localStorage).filter(k => k.startsWith('pk_'))
});
console.log('Network:', navigator.onLine);
console.log('URL:', window.location.href);
console.log('=== END REPORT ===');
```

Copy the output and share it.

---

## 🎉 Quick Recovery

**Fastest way to get back to working state:**

1. Clear everything:
   ```javascript
   clearAppCache()
   ```

2. After page reloads, try OAuth login:
   - Click **Google**, **GitHub**, or **Figma** button
   - These bypass email/password issues

3. If OAuth works, grant admin role:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

---

**Last Updated**: 2026-02-14
