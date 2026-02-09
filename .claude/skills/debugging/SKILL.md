---
name: JavaScript Debugging
description: Systematic approach to debugging JavaScript issues in ProposalKit
---

# JavaScript Debugging Skill

## Purpose
Provide a systematic workflow for identifying and fixing JavaScript bugs.

## Debugging Workflow

### Step 1: Reproduce the Issue
1. Clear browser console
2. Open DevTools (Cmd+Opt+I)
3. Perform the action that causes the bug
4. Note any console errors

### Step 2: Identify the Source
1. Check the error stack trace
2. Locate the file in `assets/js/`
3. Identify the function causing the issue

### Step 3: Validate JavaScript Syntax
```bash
# Check syntax of specific file
node -c assets/js/<filename>.js

# Check all JS files
for f in assets/js/**/*.js assets/js/boot.js; do node -c "$f"; done
```

### Step 4: Common Issues

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| `undefined is not a function` | Missing dependency | Check script load order in index.html |
| `Cannot read property of null` | DOM not ready | Wrap in DOMContentLoaded |
| Feature not working | Wrong function name | Check for typos, case sensitivity |
| Stale data | LocalStorage cache | Clear localStorage |

### Step 5: Testing Fixes
1. Make the minimal fix
2. Test the specific feature
3. Test related features for regressions
4. Verify in both themes

## Helpful Commands

```bash
# Search for function definition
grep -rn "function functionName" assets/js/**/*.js

# Find all usages
grep -rn "functionName" assets/js/**/*.js

# Check for duplicate definitions
grep -rc "function functionName" assets/js/**/*.js
```

## Browser DevTools Tips

- **Console**: `console.log()`, `console.table()`, `console.trace()`
- **Breakpoints**: Click line numbers in Sources tab
- **Network**: Check for failed requests
- **Application**: Inspect localStorage/IndexedDB
