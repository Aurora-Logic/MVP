# ProposalKit Audit - Critical Action Items

**Generated:** 2026-02-16
**Status:** 🔴 2 CRITICAL issues require immediate attention

---

## 🔴 CRITICAL - Fix Before Production

### 1. Client Portal JSON.parse Crash
**File:** `assets/js/client.js:14-15`
**Impact:** Complete denial of service if localStorage corrupted
**Time:** 15 minutes

```diff
- const DB = JSON.parse(localStorage.getItem('pk_db') || '[]');
- const CONFIG = JSON.parse(localStorage.getItem('pk_config') || 'null');
+ let DB = [];
+ let CONFIG = null;
+ try {
+     DB = JSON.parse(localStorage.getItem('pk_db') || '[]');
+     if (!Array.isArray(DB)) DB = [];
+ } catch (e) {
+     console.error('[Client] DB corrupted:', e);
+     document.getElementById('app').innerHTML = '<div class="error">Unable to load proposal data. <button onclick="location.reload()">Refresh</button></div>';
+ }
+ try {
+     CONFIG = JSON.parse(localStorage.getItem('pk_config') || 'null');
+ } catch (e) {
+     CONFIG = null;
+ }
```

**Test:**
```javascript
localStorage.setItem('pk_db', '{invalid}');
// Open client.html → Should show error, not crash
```

---

### 2. Verify Supabase Row Level Security (RLS)
**File:** Supabase Dashboard → Authentication → Policies
**Impact:** Potential unauthorized database access
**Time:** 30 minutes

**Checklist:**
- [ ] `profiles` table has RLS enabled
- [ ] `subscriptions` table has RLS enabled
- [ ] `tickets` table has RLS enabled
- [ ] `admin_audit_log` table has RLS enabled
- [ ] Test with unauthenticated client (should fail)

**SQL Verification:**
```sql
-- Run in Supabase SQL Editor
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;

-- Should return ZERO rows for production tables
```

---

## 🟡 HIGH Priority - This Week

### 3. Add Null Checks for cur()
**Files:** Multiple (47 usages)
**Impact:** Runtime TypeError crashes
**Time:** 1 hour

**Pattern:**
```diff
- const p = cur();
- p.title = 'New Title'; // Can crash!

+ const p = cur();
+ if (!p) {
+     console.error('[Editor] Proposal not found');
+     toast('Proposal not found', 'error');
+     navigate('/proposals');
+     return;
+ }
+ p.title = 'New Title';
```

**Quick Fix - Add to store.js:**
```javascript
function cur() {
    const p = DB.find(p => p.id === CUR);
    if (!p) {
        console.warn('[Store] cur() called but proposal not found. CUR:', CUR);
    }
    return p || null; // Explicit null instead of undefined
}
```

**Automated Search:**
```bash
grep -rn "cur()" assets/js/ --include="*.js" | grep -v "if.*cur()" | grep -v "!cur()"
# Manually verify each location has null check
```

---

### 4. Fix OAuth Race Condition
**File:** `assets/js/core/auth.js:26-186`
**Impact:** Intermittent login failures
**Time:** 2 hours

**Current Issue:** Multiple async paths can trigger `pullAndBoot()` twice

**Recommendation:** Simplify state management
```javascript
let authState = 'initializing'; // Use state machine instead of boolean

async function initAuth() {
    if (authState !== 'initializing') return;
    authState = 'processing';

    try {
        // ... existing logic ...
        authState = 'completed';
    } catch (e) {
        authState = 'failed';
    }
}
```

---

### 5. Replace Direct localStorage.setItem
**Files:** 15 instances across codebase
**Impact:** Silent failures, broken multi-tab sync
**Time:** 30 minutes

**Find & Replace:**
```bash
grep -rn "localStorage.setItem" assets/js/ --include="*.js" | grep -v "try"
```

**Pattern:**
```diff
- localStorage.setItem('pk_logout_signal', Date.now().toString());
+ safeLsSet('pk_logout_signal', Date.now().toString());
```

**Already Defined in store.js:**
```javascript
function safeLsSet(key, val) {
    try {
        localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
        return true;
    } catch (e) {
        console.error('localStorage write error:', key, e);
        toast('Storage error', 'error');
        return false;
    }
}
```

---

## 🟢 MEDIUM Priority - Next Sprint

### 6. Add Unhandled Promise Rejection Handler
**File:** `assets/js/boot.js`
**Impact:** Silent async failures
**Time:** 10 minutes

```javascript
// Add to boot.js or early in index.html
window.addEventListener('unhandledrejection', (event) => {
    console.error('[Global] Unhandled promise rejection:', event.reason);
    // Log to error tracking service (Sentry, etc.)
    event.preventDefault();
});
```

---

### 7. Fix Editor Memory Leak
**File:** `assets/js/core/router.js:113-115`
**Impact:** Memory grows on frequent navigation
**Time:** 20 minutes

**Current Issue:** `typeof destroyAllEditors === 'function'` can be false if script not loaded yet

**Fix:** Define cleanup function early in store.js or always attempt cleanup:
```javascript
if (view !== 'editor') {
    // Direct cleanup instead of relying on function existence
    if (typeof sectionEditors === 'object') {
        Object.values(sectionEditors || {}).forEach(ed => {
            try { if (ed?.destroy) ed.destroy(); } catch (e) { /* ignore */ }
        });
        sectionEditors = {};
    }
    try { if (paymentTermsEditor?.destroy) paymentTermsEditor.destroy(); } catch (e) { /* */ }
    paymentTermsEditor = null;
}
```

---

### 8. Add structuredClone Polyfill
**File:** `assets/js/boot.js` or top of `index.html`
**Impact:** Breaks on browsers < 2022
**Time:** 5 minutes

```javascript
// Add early in boot sequence
if (typeof structuredClone === 'undefined') {
    window.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
```

---

## 📋 BACKLOG - Future Enhancements

### Security Hardening
- [ ] Add SRI hashes to CDN resources
- [ ] Implement server-side rate limiting for share links
- [ ] Harden CSP (remove unsafe-inline if possible)
- [ ] Add CSP violation reporting

### UX Improvements
- [ ] Add beforeunload warning for unsaved changes
- [ ] Persist filter/sort state across refreshes
- [ ] Improve error messages (less technical jargon)

### Performance
- [ ] Implement `_proposalMap` for O(1) lookups
- [ ] Add service worker cache versioning automation
- [ ] Strip console logs in production build

---

## Testing Checklist

### Before Deploying Critical Fixes
- [ ] Test client.html with corrupted localStorage
- [ ] Test OAuth flow on slow connection (throttle to 3G)
- [ ] Navigate rapidly between views (check for memory leaks in DevTools)
- [ ] Fill localStorage to 90% and test persist()
- [ ] Open 3+ tabs and verify multi-tab sync works
- [ ] Test with browser extensions enabled (ad blockers, etc.)

### Automated Tests to Add
```javascript
describe('Critical Error Handling', () => {
    it('handles corrupted localStorage in client portal', () => {
        localStorage.setItem('pk_db', '{invalid}');
        expect(() => initClientPortal()).not.toThrow();
    });

    it('handles QuotaExceededError gracefully', () => {
        spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError');
        const result = persist();
        expect(result).toBe(false);
        expect(document.querySelector('#persistFailBanner')).toBeTruthy();
    });

    it('handles missing proposal in cur()', () => {
        CUR = 'nonexistent-id';
        const p = cur();
        expect(p).toBeNull();
    });
});
```

---

## Overall Assessment

### Security Rating: 🟢 85/100 (STRONG)
**Strengths:** Excellent XSS protection, proper input escaping, secure tokens
**Needs Work:** CSP hardening, RLS verification, SRI hashes

### Code Quality Rating: 🟢 82/100 (STRONG)
**Strengths:** Transaction-based persistence, multi-tab sync, routing protection
**Needs Work:** Client portal error handling, null checks, async error boundaries

---

## Next Steps

**Week 1:**
1. Fix client.js JSON.parse (15 min)
2. Verify Supabase RLS (30 min)
3. Add cur() null checks (1 hour)
4. Replace direct localStorage.setItem (30 min)

**Week 2:**
5. Fix OAuth race condition (2 hours)
6. Add unhandled rejection handler (10 min)
7. Fix editor memory leak (20 min)
8. Add structuredClone polyfill (5 min)

**Total Estimated Time:** 5-6 hours across 2 weeks

---

**Generated by:** Claude Sonnet 4.5 (Debugging + Security Specialist)
**Full Reports:** See `SECURITY_AUDIT_REPORT.md` and `DEBUGGING_AUDIT_REPORT.md`
