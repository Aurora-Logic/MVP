# 🔍 Blank Screen Diagnostic

If you're seeing a blank screen when opening the app, follow these steps:

## Step 1: Check Browser Console

1. Open Developer Tools (F12 or Cmd+Option+I on Mac)
2. Go to the **Console** tab
3. Look for any **red error messages**
4. Copy and share the error messages

## Step 2: Check Network Tab

1. Go to the **Network** tab in DevTools
2. Refresh the page (Cmd+Shift+R)
3. Look for any **failed requests** (red status codes like 404, 500)
4. Check if all CSS and JS files loaded successfully

## Step 3: Run Diagnostic in Console

Paste this in the browser console and press Enter:

```javascript
console.log('=== DIAGNOSTIC START ===');
console.log('onboard element:', document.getElementById('onboard'));
console.log('appShell element:', document.getElementById('appShell'));
console.log('authSplit element:', document.getElementById('authSplit'));
console.log('onboard display:', document.getElementById('onboard')?.style.display);
console.log('appShell display:', document.getElementById('appShell')?.style.display);
console.log('authSplit display:', document.getElementById('authSplit')?.style.display);
console.log('CONFIG exists:', typeof CONFIG !== 'undefined');
console.log('DB exists:', typeof DB !== 'undefined');
console.log('initApp exists:', typeof initApp === 'function');
console.log('bootApp exists:', typeof bootApp === 'function');
console.log('=== DIAGNOSTIC END ===');
```

## Common Issues and Fixes

### Issue 1: CSS Not Loading
**Symptom:** Elements exist but nothing is visible
**Fix:** Hard refresh (Cmd+Shift+R) or clear browser cache

### Issue 2: Service Worker Caching Old Version
**Symptom:** Old version still showing after update
**Fix:**
1. Open DevTools > Application tab > Service Workers
2. Click "Unregister" next to the service worker
3. Hard refresh (Cmd+Shift+R)

### Issue 3: JavaScript Error Blocking Execution
**Symptom:** Console shows red error messages
**Fix:** Check the error message and report it

### Issue 4: CSP Blocking Resources
**Symptom:** Console shows "Content Security Policy" errors
**Fix:** Check if you're running on http://127.0.0.1 (not file://)

## Quick Fix: Force Clean Start

If nothing works, try this:

1. **Clear all ProposalKit data:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Unregister service worker:**
   - DevTools > Application > Service Workers > Unregister

3. **Hard refresh:**
   - Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

4. **Reload page**

## Still Not Working?

Share these details:
1. Browser name and version
2. Any console error messages (screenshot)
3. Network tab screenshot showing failed requests
4. Output from diagnostic script above
