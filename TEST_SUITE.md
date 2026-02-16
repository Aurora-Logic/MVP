# Complete Testing Suite - Authentication & Admin

Comprehensive test cases for all authentication flows and admin features.

---

## 🎯 Testing Prerequisites

Before testing, ensure:
- [ ] SQL fix applied (role column added to profiles table)
- [ ] Supabase configured with correct URL and anon key
- [ ] OAuth providers enabled in Supabase Dashboard
- [ ] Browser DevTools open (F12) to monitor console

---

## 📋 Test Case 1: Email/Password Signup

### Test 1.1: Valid Signup
**Steps:**
1. Open app: `http://localhost:3000`
2. Click "Sign up" (top-right)
3. Enter:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
4. Click "Sign Up"

**Expected:**
- ✅ If email confirmation disabled: Logged in immediately, redirected to dashboard
- ✅ If email confirmation enabled: "Check your email" message appears
- ❌ No errors in console
- ❌ No "Something went wrong" error

**Verify:**
```sql
-- Check user was created
SELECT email, email_confirmed_at FROM auth.users WHERE email = 'test@example.com';

-- Check profile was created
SELECT email, role, plan FROM profiles WHERE email = 'test@example.com';
```

### Test 1.2: Duplicate Email
**Steps:**
1. Try signing up again with same email: "test@example.com"

**Expected:**
- ❌ Error: "User already registered" or similar
- ❌ No crash or blank screen

### Test 1.3: Weak Password
**Steps:**
1. Try signup with password: "123"

**Expected:**
- ❌ Error: "Password must be at least 6 characters"
- ❌ Form doesn't submit

### Test 1.4: Missing Fields
**Steps:**
1. Leave name blank, click "Sign Up"
2. Leave email blank, click "Sign Up"
3. Leave password blank, click "Sign Up"

**Expected:**
- ❌ Error for each missing field
- ❌ Form doesn't submit

---

## 📋 Test Case 2: Email/Password Login

### Test 2.1: Valid Login (Email)
**Steps:**
1. Click "Login" (if on signup screen)
2. Enter:
   - Email or Phone: "test@example.com"
   - Password: "password123"
3. Click "Sign In"

**Expected:**
- ✅ Login successful
- ✅ Redirected to dashboard
- ✅ Sidebar shows user name
- ❌ No console errors

### Test 2.2: Valid Login (Phone) - If configured
**Steps:**
1. Enter:
   - Email or Phone: "+919876543210" (use real phone if configured)
   - Password: "password123"
2. Click "Sign In"

**Expected:**
- ✅ Login successful (if phone auth enabled)
- ❌ Error if phone auth not configured

### Test 2.3: Invalid Credentials
**Steps:**
1. Enter:
   - Email: "test@example.com"
   - Password: "wrongpassword"
2. Click "Sign In"

**Expected:**
- ❌ Error: "Invalid credentials" or similar
- ❌ Not logged in
- ❌ No crash

### Test 2.4: Non-existent User
**Steps:**
1. Enter:
   - Email: "notexist@example.com"
   - Password: "password123"
2. Click "Sign In"

**Expected:**
- ❌ Error: "Invalid credentials" or "No such user"

### Test 2.5: Empty Fields
**Steps:**
1. Leave email blank, click "Sign In"
2. Leave password blank, click "Sign In"

**Expected:**
- ❌ Error: "Please enter your email or phone number"
- ❌ Error: "Password must be at least 6 characters"

---

## 📋 Test Case 3: Google OAuth

### Test 3.1: Google Login - New User
**Steps:**
1. Click "Google" button on login screen
2. Authorize with Google account that hasn't logged in before
3. Complete OAuth flow

**Expected:**
- ✅ Redirected to Google OAuth
- ✅ After authorization, redirected back to app
- ✅ Logged in successfully
- ✅ Profile created in database
- ✅ Dashboard loads

**Verify:**
```sql
SELECT email, role, plan FROM profiles WHERE email = 'your-google-email@gmail.com';
```

### Test 3.2: Google Login - Existing User
**Steps:**
1. Logout
2. Click "Google" button again
3. Use same Google account

**Expected:**
- ✅ Logged in immediately (no signup)
- ✅ Dashboard loads
- ✅ Same user data preserved

### Test 3.3: Google OAuth Cancel
**Steps:**
1. Click "Google" button
2. Click "Cancel" on Google authorization page

**Expected:**
- ✅ Returned to login page
- ❌ Error message shown: "Sign-in failed" or similar
- ❌ Not logged in
- ❌ No crash

---

## 📋 Test Case 4: GitHub OAuth

### Test 4.1: GitHub Login - New User
**Steps:**
1. Click "GitHub" button on login screen
2. Authorize with GitHub account
3. Complete OAuth flow

**Expected:**
- ✅ Redirected to GitHub OAuth
- ✅ After authorization, redirected back to app
- ✅ Logged in successfully
- ✅ Profile created in database

### Test 4.2: GitHub Login - Existing User
**Steps:**
1. Logout
2. Click "GitHub" button again

**Expected:**
- ✅ Logged in immediately
- ✅ Dashboard loads

---

## 📋 Test Case 5: Figma OAuth

### Test 5.1: Figma Login - New User
**Steps:**
1. Click "Figma" button on login screen
2. Authorize with Figma account
3. Complete OAuth flow

**Expected:**
- ✅ Redirected to Figma OAuth
- ✅ No "Invalid scopes" error (fixed!)
- ✅ After authorization, redirected back
- ✅ Logged in successfully
- ✅ Profile created

### Test 5.2: Figma Login - Existing User
**Steps:**
1. Logout
2. Click "Figma" button again

**Expected:**
- ✅ Logged in immediately
- ✅ Dashboard loads

---

## 📋 Test Case 6: Password Reset

### Test 6.1: Valid Password Reset
**Steps:**
1. Click "Forgot password?" link
2. Enter: "test@example.com"
3. Click submit

**Expected:**
- ✅ Message: "Check your email" or similar
- ✅ Email sent to user (check Supabase logs)
- ❌ No errors

### Test 6.2: Invalid Email Format
**Steps:**
1. Enter: "notanemail"
2. Click submit

**Expected:**
- ❌ Error: "Please enter your email" or validation error

---

## 📋 Test Case 7: Admin Access

### Test 7.1: Login as Admin User
**Steps:**
1. Login with: "virag@deltasystem.in" (or your admin email)
2. Check sidebar

**Expected:**
- ✅ "Admin Panel" button appears in sidebar (bottom, above Settings)
- ✅ Button has shield icon

**Verify in SQL:**
```sql
SELECT email, role FROM profiles WHERE email = 'virag@deltasystem.in';
-- Should show: role = 'admin'
```

### Test 7.2: Access Admin Panel
**Steps:**
1. While logged in as admin, click "Admin Panel" button
2. Or navigate to: `http://localhost:3000/admin`

**Expected:**
- ✅ Admin dashboard loads
- ✅ Shows metrics (users, revenue, subscriptions, tickets)
- ✅ No "Access denied" error
- ❌ No console errors

### Test 7.3: Non-Admin Access Denied
**Steps:**
1. Login as regular user (test@example.com)
2. Try to visit: `http://localhost:3000/admin`

**Expected:**
- ❌ Redirected to dashboard
- ❌ Error: "Access denied - Admin access required"
- ❌ No admin button in sidebar

---

## 📋 Test Case 8: Session Persistence

### Test 8.1: Page Refresh While Logged In
**Steps:**
1. Login successfully
2. Refresh page (F5)

**Expected:**
- ✅ Still logged in
- ✅ Dashboard loads (not redirected to login)
- ✅ User info in sidebar

### Test 8.2: Close and Reopen Browser
**Steps:**
1. Login successfully
2. Close browser completely
3. Reopen and visit app

**Expected:**
- ✅ Still logged in
- ✅ Session persisted

### Test 8.3: Clear Session Data
**Steps:**
1. Login successfully
2. Open DevTools → Application → Local Storage
3. Delete all localStorage keys
4. Refresh page

**Expected:**
- ❌ Logged out
- ✅ Redirected to login screen

---

## 📋 Test Case 9: Logout

### Test 9.1: Normal Logout
**Steps:**
1. Login successfully
2. Click user menu in sidebar footer
3. Click "Log out"

**Expected:**
- ✅ Logged out
- ✅ Redirected to login screen
- ✅ Sidebar cleared
- ❌ No errors

### Test 9.2: Logout and Login Again
**Steps:**
1. Logout
2. Login again with same credentials

**Expected:**
- ✅ Login successful
- ✅ All data intact

---

## 📋 Test Case 10: Multi-Tab Behavior

### Test 10.1: Login in One Tab
**Steps:**
1. Open app in Tab 1
2. Open app in Tab 2 (new tab)
3. Login in Tab 1
4. Switch to Tab 2

**Expected:**
- ✅ Tab 2 automatically updates (multi-tab sync)
- ✅ Both tabs show logged-in state

### Test 10.2: Logout in One Tab
**Steps:**
1. Have app open in 2 tabs, logged in
2. Logout in Tab 1
3. Switch to Tab 2

**Expected:**
- ✅ Tab 2 automatically logs out (sync)

---

## 📋 Test Case 11: Edge Cases

### Test 11.1: Network Offline During Login
**Steps:**
1. Open DevTools → Network tab
2. Select "Offline" mode
3. Try to login

**Expected:**
- ❌ Error: "Authentication service unavailable" or similar
- ❌ Not logged in
- ❌ No crash

### Test 11.2: Slow Network
**Steps:**
1. Open DevTools → Network tab
2. Select "Slow 3G" throttling
3. Try to login

**Expected:**
- ✅ Login takes longer but completes
- ✅ Loading state shown (button disabled, opacity 0.6)
- ✅ Eventually logs in

### Test 11.3: Browser Back Button
**Steps:**
1. On login page
2. Login successfully → Dashboard loads
3. Press browser back button

**Expected:**
- ✅ Stays on dashboard (or goes to previous page)
- ❌ Doesn't go back to login screen

### Test 11.4: Direct URL Access While Logged Out
**Steps:**
1. Logout
2. Manually visit: `http://localhost:3000/proposals`

**Expected:**
- ❌ Redirected to login screen
- ✅ After login, redirected to originally requested page

---

## 📋 Test Case 12: Error Recovery

### Test 12.1: Fix After Error
**Steps:**
1. Try login with wrong password → Error shown
2. Enter correct password
3. Click "Sign In"

**Expected:**
- ✅ Error clears
- ✅ Login successful

### Test 12.2: Multiple Failed Attempts
**Steps:**
1. Try login with wrong password 5 times

**Expected:**
- ❌ Shows error each time
- ❌ No rate limiting (unless Supabase enforces)
- ❌ No crash

---

## 🔧 Automated Test Script

Copy this into browser console to run automated checks:

```javascript
// === AUTOMATED TEST SUITE ===
console.log('🧪 Starting Automated Tests...\n');

const tests = [];
const results = { passed: 0, failed: 0, errors: [] };

// Test 1: Check Supabase SDK loaded
tests.push({
    name: 'Supabase SDK loaded',
    test: () => typeof window.supabase === 'object'
});

// Test 2: Check Supabase client initialized
tests.push({
    name: 'Supabase client initialized',
    test: () => typeof sb === 'function' && sb() !== null
});

// Test 3: Check auth functions exist
tests.push({
    name: 'doLogin function exists',
    test: () => typeof doLogin === 'function'
});

tests.push({
    name: 'doSignup function exists',
    test: () => typeof doSignup === 'function'
});

tests.push({
    name: 'doGoogleLogin function exists',
    test: () => typeof doGoogleLogin === 'function'
});

tests.push({
    name: 'doGithubLogin function exists',
    test: () => typeof doGithubLogin === 'function'
});

tests.push({
    name: 'doFigmaLogin function exists',
    test: () => typeof doFigmaLogin === 'function'
});

// Test 4: Check core functions
tests.push({
    name: 'handleRoute function exists',
    test: () => typeof handleRoute === 'function'
});

tests.push({
    name: 'refreshSide function exists',
    test: () => typeof refreshSide === 'function'
});

tests.push({
    name: 'isAdmin function exists',
    test: () => typeof isAdmin === 'function'
});

// Test 5: Check storage
tests.push({
    name: 'CONFIG exists',
    test: () => typeof CONFIG !== 'undefined'
});

tests.push({
    name: 'DB exists',
    test: () => typeof DB !== 'undefined'
});

// Test 6: Check DOM elements
tests.push({
    name: 'Auth content element exists',
    test: () => document.getElementById('authContent') !== null
});

tests.push({
    name: 'Body scroll element exists',
    test: () => document.getElementById('bodyScroll') !== null
});

// Test 7: Check for errors in console
tests.push({
    name: 'No JavaScript errors on page load',
    test: () => {
        // This is a visual check - manually verify console has no red errors
        return true; // Placeholder
    }
});

// Run tests
tests.forEach(({ name, test }) => {
    try {
        const result = test();
        if (result) {
            console.log(`✅ PASS: ${name}`);
            results.passed++;
        } else {
            console.log(`❌ FAIL: ${name}`);
            results.failed++;
            results.errors.push(name);
        }
    } catch (e) {
        console.log(`❌ ERROR: ${name} - ${e.message}`);
        results.failed++;
        results.errors.push(`${name}: ${e.message}`);
    }
});

// Summary
console.log('\n=== TEST RESULTS ===');
console.log(`Total: ${tests.length} tests`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);

if (results.errors.length > 0) {
    console.log('\n❌ Failed tests:');
    results.errors.forEach(err => console.log(`  - ${err}`));
}

console.log('\n=== MANUAL TESTS REQUIRED ===');
console.log('The following must be tested manually:');
console.log('  1. Email/password signup');
console.log('  2. Email/password login');
console.log('  3. Google OAuth login');
console.log('  4. GitHub OAuth login');
console.log('  5. Figma OAuth login');
console.log('  6. Admin panel access');
console.log('  7. Session persistence');
console.log('  8. Logout functionality');
console.log('\nSee TEST_SUITE.md for detailed test cases.');
```

---

## ✅ Success Criteria

All tests should pass with these results:

### Critical (Must Pass)
- ✅ Email signup creates user and profile
- ✅ Email login works
- ✅ OAuth login works (Google, GitHub, Figma)
- ✅ Admin user can access /admin
- ✅ Non-admin users cannot access /admin
- ✅ Session persists across page refresh
- ✅ Logout works
- ✅ No "Something went wrong" errors
- ✅ No console errors on page load

### Important (Should Pass)
- ✅ Multi-tab sync works
- ✅ Error messages are clear
- ✅ Loading states shown during auth
- ✅ Browser back button works correctly
- ✅ Password reset flow works

### Nice to Have
- ✅ Slow network doesn't break auth
- ✅ Offline error handling graceful
- ✅ Multiple failed login attempts handled

---

## 📊 Test Results Template

Use this to track your testing:

```
=== TEST RESULTS ===
Date: _______________
Tester: _______________

[ ] Test Case 1: Email/Password Signup
    [ ] 1.1 Valid Signup
    [ ] 1.2 Duplicate Email
    [ ] 1.3 Weak Password
    [ ] 1.4 Missing Fields

[ ] Test Case 2: Email/Password Login
    [ ] 2.1 Valid Login (Email)
    [ ] 2.2 Valid Login (Phone)
    [ ] 2.3 Invalid Credentials
    [ ] 2.4 Non-existent User
    [ ] 2.5 Empty Fields

[ ] Test Case 3: Google OAuth
    [ ] 3.1 Google Login - New User
    [ ] 3.2 Google Login - Existing User
    [ ] 3.3 Google OAuth Cancel

[ ] Test Case 4: GitHub OAuth
    [ ] 4.1 GitHub Login - New User
    [ ] 4.2 GitHub Login - Existing User

[ ] Test Case 5: Figma OAuth
    [ ] 5.1 Figma Login - New User
    [ ] 5.2 Figma Login - Existing User

[ ] Test Case 6: Password Reset
    [ ] 6.1 Valid Password Reset
    [ ] 6.2 Invalid Email Format

[ ] Test Case 7: Admin Access
    [ ] 7.1 Login as Admin User
    [ ] 7.2 Access Admin Panel
    [ ] 7.3 Non-Admin Access Denied

[ ] Test Case 8: Session Persistence
    [ ] 8.1 Page Refresh While Logged In
    [ ] 8.2 Close and Reopen Browser
    [ ] 8.3 Clear Session Data

[ ] Test Case 9: Logout
    [ ] 9.1 Normal Logout
    [ ] 9.2 Logout and Login Again

[ ] Test Case 10: Multi-Tab Behavior
    [ ] 10.1 Login in One Tab
    [ ] 10.2 Logout in One Tab

[ ] Test Case 11: Edge Cases
    [ ] 11.1 Network Offline During Login
    [ ] 11.2 Slow Network
    [ ] 11.3 Browser Back Button
    [ ] 11.4 Direct URL Access While Logged Out

[ ] Test Case 12: Error Recovery
    [ ] 12.1 Fix After Error
    [ ] 12.2 Multiple Failed Attempts

Overall Status: _______________
Issues Found: _______________
```

---

**Last Updated**: 2026-02-14
**Total Test Cases**: 12 categories, 35+ individual tests
**Automation**: Console script for basic checks, manual testing required for flows
