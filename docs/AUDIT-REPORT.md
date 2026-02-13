# ProposalKit Comprehensive Audit Report

**Date:** 2026-02-13
**Audited by:** 5 specialized agents (Security, UX/UI, Code Quality, CSS/Styling, QA)
**Scope:** Full codebase -- 49 JS files, 8 CSS files, 2 HTML files, 1 service worker
**Total Findings:** 170 issues + 130 test cases

---

## Executive Summary

| Audit Area | Critical | High | Medium | Low | Info | Total |
|------------|----------|------|--------|-----|------|-------|
| Security | 4 | 6 | 7 | 4 | 4 | **25** |
| UX/UI | 1 | 12 | 26 | 12 | -- | **51** |
| Code Quality | 1 | 7 | 21 | 17 | -- | **46** |
| CSS/Styling | 0 | 4 | 13 | 27 | -- | **44** |
| QA (Bugs) | 4 | 5 | 6 | 3 | -- | **18** |
| **TOTALS** | **10** | **34** | **73** | **63** | **4** | **174** |

**Test Cases Generated:** 130 (10 P0, 38 P1, 52 P2, 20 P3)

---

# PART 1: SECURITY AUDIT (25 Findings)

## Critical (4)

### SEC-01: Stored XSS via EditorJS Content Rendering (fmtBlocks)
- **File:** `assets/js/core/utils.js:165-205`
- **Description:** `fmtBlocks()` renders EditorJS block data (`.data.text`, `.data.caption`, `.content`) as raw HTML without sanitization. EditorJS allows inline HTML, so arbitrary JavaScript can be embedded.
- **Impact:** Any user viewing a proposal with injected content executes the attacker's JavaScript. Affects main app preview, PDF export, and client.html.
- **Recommendation:** Integrate DOMPurify. Sanitize all EditorJS block text output. Allow only safe HTML tags (b, i, a, br, mark, strong, em).

### SEC-02: Client-Facing Page Renders Attacker-Controlled Data from URL Hash
- **File:** `client.html:1295-1330`
- **Description:** `client.html` reads proposal data from URL hash via `atob(decodeURIComponent(location.hash.slice(1)))`, parses with `JSON.parse()`, and renders via `innerHTML` without sanitization.
- **Impact:** Zero-interaction XSS -- attacker only needs victim to click a crafted link. Can steal all localStorage data (API keys, bank details, client info).
- **Attack URL:** `client.html#eyJ0aXRsZSI6IjxpbWcgc3JjPXggb25lcnJvcj1hbGVydCgxKT4ifQ==`

### SEC-03: Anthropic API Key Stored in Plaintext in localStorage
- **File:** `assets/js/editor/ai-assistant.js:83-95`
- **Description:** API key stored as `CONFIG.aiApiKey` in `pk_config` localStorage key as plaintext JSON. Readable by any JavaScript on the same origin, visible in DevTools, accessible to browser extensions.
- **Impact:** Any XSS vulnerability allows trivial exfiltration via `localStorage.getItem('pk_config')`. Key grants full access to user's Anthropic account.

### SEC-04: API Key Sent Directly from Browser with Dangerous-Access Header
- **File:** `assets/js/editor/ai-assistant.js:76-105`
- **Description:** Direct browser-to-API calls to `api.anthropic.com` with `anthropic-dangerous-direct-browser-access: true`. Key visible in Network tab, interceptable by proxies/extensions.
- **Recommendation:** Implement a backend proxy that holds the API key server-side.

## High (6)

### SEC-05: Pervasive innerHTML with Unescaped User Data (118 instances)
- **Files:** dashboard.js, command.js, nav.js, preview.js, integrations.js, derivatives.js, diff-view.js, clients.js
- **Description:** 118 `innerHTML` assignments interpolate user data without `esc()`. Affected: proposal titles, client names, company names, descriptions, notes, terms.
- **Impact:** Stored XSS that fires on every page load.

### SEC-06: No Content Security Policy (CSP)
- **Files:** index.html, client.html
- **Description:** No CSP meta tag or header. All XSS vulnerabilities fully exploitable with no browser-level mitigation.

### SEC-07: Data Import Accepts Arbitrary JSON Without Validation
- **File:** `assets/js/views/settings.js:253-280`
- **Description:** Import reads JSON, directly writes to all localStorage keys. Zero validation of structure, types, string lengths, or content safety.
- **Impact:** Crafted backup file = reliable XSS delivery. Can overwrite webhookUrl, replace API key, inject XSS payloads.

### SEC-08: Webhook URL Allows Arbitrary Targets (SSRF-like)
- **File:** `assets/js/export/integrations.js:115-135`
- **Description:** `fetch(CONFIG.webhookUrl, ...)` with no URL validation, no protocol check, no blocklist for private IPs.

### SEC-09: No Subresource Integrity (SRI) on CDN Dependencies
- **Files:** index.html, client.html (~15 external scripts)
- **Description:** None of the CDN-loaded scripts include `integrity` attributes.
- **Impact:** CDN compromise = full application takeover.

### SEC-10: @latest CDN Tags on 10+ Dependencies
- **File:** index.html
- **Description:** Lucide, EditorJS plugins, Lottie player all use `@latest` version tags.
- **Impact:** Compromised npm publish immediately affects all users.

## Medium (7)

| ID | Finding | File |
|----|---------|------|
| SEC-11 | RegExp from user input without escaping (ReDoS) | command.js, proposals.js, clients.js |
| SEC-12 | Share tokens stored alongside proposal data | sharing.js |
| SEC-13 | Full business data base64-encoded in share URL | sharing.js |
| SEC-14 | API key + sensitive data in plaintext exports | settings.js |
| SEC-15 | SVG file upload accepted without sanitization | onboarding.js, settings.js |
| SEC-16 | No clickjacking protection (X-Frame-Options) | index.html, client.html |
| SEC-17 | Numeric inputs lack range validation | pricing.js, packages.js, addons.js |

## Low (4) + Info (4)

| ID | Finding |
|----|---------|
| SEC-18 | Console logging in production code |
| SEC-19 | Missing `rel="noopener noreferrer"` on dynamic links |
| SEC-20 | Stale-while-revalidate serves outdated scripts |
| SEC-21 | Team role enforcement is client-side only |
| SEC-22 | No rate limiting on AI API calls |
| SEC-23 | localStorage quota exhaustion fails silently |
| SEC-24 | Version history stores 20 full snapshots |
| SEC-25 | Lottie player from unpinned external CDN |

### Attack Chain Demonstration

**Social Engineering via Malicious Backup:**
1. Attacker crafts JSON with XSS in proposal title
2. Victim imports via Settings > Data > Restore (no validation)
3. Dashboard renders title via innerHTML without `esc()`
4. XSS reads `pk_config` from localStorage (contains API key)
5. API key exfiltrated to attacker's server

---

# PART 2: UX/UI AUDIT (51 Findings)

## Critical (1)

### UX-01: Color-Only Status Indicators
- **File:** proposals.js (status badges), components.css
- **Description:** Proposal status communicated primarily through colored dots. 8% of males have color vision deficiency.
- **Recommendation:** Add unique icons per status (pencil=draft, arrow=sent, checkmark=accepted, X=declined, clock=expired).

## High (12)

| ID | Finding | Location |
|----|---------|----------|
| UX-02 | No dashboard empty state for new users | dashboard.js |
| UX-03 | Onboarding has no field validation | onboarding.js |
| UX-04 | Missing ARIA labels on icon-only buttons (all files) | Multiple |
| UX-05 | Focus management after modal open/close inconsistent | modals.js |
| UX-06 | No loading indicator during PDF export | export.js |
| UX-07 | Editor tabs overflow without scroll indicator on mobile | responsive.css, editor.js |
| UX-08 | Proposal card actions difficult to tap on mobile (<44px) | proposals.js, pages.css |
| UX-09 | PDF export shows generic error message | export.js |
| UX-10 | localStorage full has no recovery UX | store.js |
| UX-11 | Pricing table inputs have no placeholder text | pricing.js |
| UX-12 | Bulk delete shows no proposal names in confirmation | proposals.js |
| UX-13 | "Clear All Data" has single-step confirmation (no "type DELETE") | settings.js |

## Medium (26)

Key findings include:
- Settings nav hidden on mobile with no alternative (responsive.css)
- Modals may exceed viewport height on mobile (components.css)
- Analytics charts don't adapt to mobile width (analytics.js)
- No skip-to-content link (index.html)
- EditorJS blocks have limited keyboard accessibility
- Insufficient contrast in muted text (variables.css)
- Drag-and-drop has no keyboard alternative (sections.js)
- No skeleton screens for any view
- EditorJS shows blank container during initialization
- Preview tab re-renders entire proposal on every switch
- Inconsistent button sizing patterns across pages
- Inconsistent date formatting (fmtDate vs toLocaleDateString)
- Inconsistent empty state visual treatment
- Client deletion doesn't warn about associated proposals
- Pricing row delete has no confirmation
- No visual feedback when copying share link
- Sub-14px font sizes still in production UI
- Long proposal titles truncate without tooltip
- Preview document creates jarring contrast in dark mode
- Client.html dark mode support incomplete

---

# PART 3: CODE QUALITY AUDIT (46 Findings)

## Critical (1)

### CQ-01: Section EditorJS Instances Never Destroyed on Navigation
- **File:** `assets/js/editor/sections.js:60`, `assets/js/views/nav.js:35`
- **Description:** Section editors attached as `holder._editor` are never destroyed on `goNav()`. DOM replaced via innerHTML, orphaning EditorJS instances with MutationObservers, keyboard listeners, paste handlers, and timers.
- **Impact:** Each proposal open with N sections leaks N EditorJS instances. Memory grows continuously. Users on long sessions experience slowdown, potential tab crashes.

## High (7)

| ID | Finding | File |
|----|---------|------|
| CQ-02 | `_proposalMap` stale after direct DB mutations | store.js |
| CQ-03 | `persist()` failure has no recovery mechanism | store.js |
| CQ-04 | html2pdf export chain has no `.catch()` | export.js |
| CQ-05 | 91 addEventListener vs 3 removeEventListener | Multiple files |
| CQ-06 | No data schema versioning or migration | store.js |
| CQ-07 | State diverges after persist failure (silent data loss) | store.js |
| CQ-08 | `parseFloat()` without NaN guard in payment/addons | payment-schedule.js, addons.js |

## Medium (21)

Key findings include:
- No guard on concurrent `persist()` calls (store.js)
- `CUR` never reset on navigation away from editor (nav.js)
- Silent catch in `safeGetStorage` -- no diagnostic (store.js)
- AI assistant fetch has no timeout or cancellation (ai-assistant.js)
- Webhook fetch doesn't check `response.ok` (integrations.js)
- `.then()` chains without `.catch()` on EditorJS save (editor.js, sections.js)
- Settings scroll spy listener accumulates on repeated visits (settings.js)
- Files at 300-line limit (settings.js, proposals.js, export.js, onboarding.js)
- Functions over 50 lines (8 render functions)
- Hardcoded status strings repeated 50+ times across 15+ files
- 170+ inline `onclick=` handlers in innerHTML templates
- `querySelector().value` without null check (details.js, settings.js)
- Division by zero in analytics computations (analytics.js)
- Autosave races with manual save operations (autosave.js)
- Overlapping EditorJS `.save()` calls (autosave.js)
- `structuredClone` captures incomplete state before async editor saves
- Version history snapshots unbounded in size (diff-view.js)
- No validation on data loaded from localStorage (store.js)
- Special chars break inline onclick handlers (clients.js)
- No localStorage availability detection (store.js, boot.js)

## Low (17)

Includes: multi-tab sync skips re-render, magic numbers without constants, modal pattern duplicated 10x, inconsistent naming conventions, `dirty()` hides side effects, `structuredClone()` browser compat, `crypto.getRandomValues()` secure context check.

---

# PART 4: CSS/STYLING AUDIT (44 Findings)

## High (4)

### CSS-01: Touch Targets Below 44px Minimum
- **Files:** components.css:38-39, layout.css:88
- **Description:** `.btn-sm-icon-ghost` = 32x32px (12px below minimum). `.mobile-menu-btn` = 36x36px.
- **Impact:** Frequent mis-taps on mobile, especially icon-only buttons.

### CSS-02: Client-Facing Page Has No Responsive Styles
- **File:** pdf.css:112-122
- **Description:** `client.html` loads only `pdf.css`, not `responsive.css`. No `@media` queries for `.client-toolbar` or `.client-body`. Hardcoded 860px max-width.
- **Impact:** Client proposal view (external-facing) unusable on mobile.

### CSS-03: Input Focus Ring Invisible in Dark Mode
- **File:** components.css:127
- **Description:** `box-shadow: 0 0 0 3px rgba(24,24,27,.08)` -- on dark background (#09090b), this is invisible.
- **Impact:** WCAG 2.4.7 (Focus Visible) violation. Every form input affected.

### CSS-04: No `prefers-reduced-motion` Media Query Anywhere
- **Files:** All 8 CSS files -- zero instances
- **Description:** Application has button transforms, modal scale animations, toast keyframes, sidebar transitions, chart transitions, smooth scrolling -- none disabled for reduced-motion preference.
- **Impact:** WCAG 2.3.3 violation.

## Medium (13)

| ID | Finding | File |
|----|---------|------|
| CSS-05 | Status tokens missing dark mode overrides | variables.css:49-56 |
| CSS-06 | No CSS variable for focus ring shadow | components.css:127 |
| CSS-07 | Form element !important cascade (13 declarations) | components.css:119-128 |
| CSS-08 | Proposal row columns hidden on mobile with no alternative | responsive.css:20-21 |
| CSS-09 | Settings nav hidden on mobile with no replacement | responsive.css:25 |
| CSS-10 | Z-index stacking overlaps (200 shared by sidebar + dropdown) | Multiple |
| CSS-11 | `transition: all` still present on `.section-type-btn` | features.css:92 |
| CSS-12 | Print blanket color override kills status badges | print.css:18-19 |
| CSS-13 | Font sizes below 12px in non-PDF context (11px) | layout.css:83,107; features.css:105 |
| CSS-14 | No global line-height on html/body | layout.css:6-9 |
| CSS-15 | Many text elements lack explicit line-height | Multiple |
| CSS-16 | Hardcoded border-radius bypassing CSS variables | Multiple |
| CSS-17 | Smooth scroll without reduced-motion guard | layout.css:86 |

## Low (27)

Includes: Apple HIG colors missing dark mode overrides, spacing variables underutilized, no z-index variables, duplicate button variant properties, missing intermediate breakpoint, toggle thumb hardcoded white, toast/trend/metric colors hardcoded, destructive hover too faint in dark mode, diff highlights faint in dark mode, 3 transitions exceeding 200ms, missing will-change declarations, missing @page rule, dead auth screen styles, dead sidebar rail styles, redundant gap:0, select arrow SVG hardcoded color, inconsistent card padding/hover/font-weight.

---

# PART 5: QA -- BUG DISCOVERY (18 Bugs)

## Critical (4)

### BUG-01: `eval()` in Command Palette Enables Code Execution
- **File:** `assets/js/core/command.js:68`
- **Description:** `execCommand()` calls `eval(btn.dataset.action)` where action strings include interpolated proposal IDs. `esc()` encoding is reversed by `dataset` read. Crafted proposal ID = arbitrary JS execution.
- **Catch block:** `catch {}` silently swallows all errors.

### BUG-02: Stored XSS via Unescaped Section Content in Export
- **File:** `assets/js/export/export.js:37, 100-103`
- **Description:** `s.content` (raw EditorJS HTML) and `p.terms` rendered without escaping in export HTML. Client.html also renders `s.content` raw.

### BUG-03: Data Import Has Zero Validation -- Full State Takeover
- **File:** `assets/js/views/settings.js:219-228`
- **Description:** No schema, type, or content validation. Can inject XSS, overwrite webhookUrl, replace API key, exhaust localStorage.

### BUG-04: Onboarding Bank Details Are Never Saved
- **File:** `assets/js/views/onboarding.js:109-112`
- **Description:** Step 3 collects bank fields but `finishOnboarding()` sets `CONFIG.bank = {}` unconditionally. Step 3 DOM elements don't exist when step 4 finishes. Bank data never read or stored.
- **Impact:** Every user who enters bank details during onboarding loses them. Must re-enter in Settings.

## High (5)

| ID | Bug | File |
|----|-----|------|
| BUG-05 | Negative totals from excessive discounts (no validation) | pricing.js:88-96 |
| BUG-06 | Deleting client leaves dangling references in proposals | clients.js:97-102 |
| BUG-07 | Client.html share reads from localStorage (only works same browser) | client.html, sharing.js |
| BUG-08 | Payment schedule mode toggle destroys data when total=0 | payment-schedule.js:86-97 |
| BUG-09 | Line item drag reorder uses stale data-idx attributes | pricing.js:150-167 |

## Medium (6)

| ID | Bug | File |
|----|-----|------|
| BUG-10 | Analytics counts draft/expired as "pending" pipeline | analytics.js:37-41 |
| BUG-11 | Win rate uses total proposals (including drafts) as denominator | analytics.js:50 |
| BUG-12 | Version history snapshot on every 350ms autosave (wasteful) | autosave.js:19-21, diff-view.js:3-11 |
| BUG-13 | Multi-tab sync updates data but not rendered view | store.js:103-112 |
| BUG-14 | Context menu positioned off-screen at window edges | proposals.js:105-107 |
| BUG-15 | EditorJS instances not destroyed on page navigation | editor.js, sections.js, pricing.js |

## Low (3)

| ID | Bug | File |
|----|-----|------|
| BUG-16 | Editor tab state persists across different proposals | editor.js:3 |
| BUG-17 | `lucide.createIcons()` rescans entire DOM on every call | Multiple (20+ calls) |
| BUG-18 | Save status "Saving" state never renders the icon | autosave.js:27-29 |

---

# PART 6: AGGRESSIVE TEST CASES (130 Total)

## Test Case Distribution

| Category | Count | P0 | P1 | P2 | P3 |
|----------|-------|----|----|----|----|
| A. Proposal CRUD | 12 | 3 | 5 | 2 | 2 |
| B. Pricing/Calculations | 13 | 1 | 5 | 4 | 3 |
| C. Payment Schedule | 5 | 0 | 3 | 1 | 1 |
| D. Editor | 8 | 1 | 4 | 2 | 1 |
| E. Export/PDF | 11 | 2 | 3 | 5 | 1 |
| F. Client Management | 7 | 1 | 3 | 0 | 3 |
| G. Settings | 13 | 2 | 5 | 3 | 3 |
| H. Multi-Tab Sync | 5 | 1 | 2 | 2 | 0 |
| I. Dashboard/Analytics | 8 | 1 | 2 | 5 | 0 |
| J. Performance | 5 | 0 | 1 | 3 | 1 |
| K. Accessibility | 8 | 0 | 3 | 3 | 2 |
| L. Security (Advanced) | 6 | 1 | 2 | 1 | 2 |
| M. Offline/PWA | 5 | 0 | 2 | 1 | 2 |
| N. Theme/UI Edge Cases | 6 | 0 | 1 | 4 | 1 |
| O. Onboarding/Team | 6 | 2 | 1 | 2 | 1 |
| P. Derivatives/Versions | 5 | 0 | 0 | 4 | 1 |
| Q. Command Palette/Misc | 7 | 0 | 1 | 5 | 1 |
| **TOTAL** | **130** | **15** | **43** | **47** | **25** |

## Key P0 (Blocking) Test Cases

| ID | Test | Expected |
|----|------|----------|
| TC-003 | XSS in proposal title | Script tag escaped, no execution |
| TC-004 | XSS in ALL proposal fields | No execution anywhere |
| TC-042 | Export with XSS in section content | **BUG: content rendered raw** |
| TC-064 | Import malicious JSON with XSS | esc() should escape title |
| TC-071 | Delete proposal in Tab 1 while editing in Tab 2 | cur() returns null, no crash |
| TC-096 | XSS via direct localStorage manipulation | esc() prevents execution |
| TC-113 | Complete onboarding flow | **BUG: bank details lost** |
| TC-115 | Verify bank details after onboarding | **BUG: CONFIG.bank = {}** |

---

# PART 7: PRIORITY REMEDIATION PLAN

## Week 1 -- Critical Security

| # | Action | Findings Addressed |
|---|--------|--------------------|
| 1 | Integrate DOMPurify, sanitize ALL HTML rendering | SEC-01, SEC-02, SEC-05, BUG-01, BUG-02 |
| 2 | Replace `eval()` in command.js with safe dispatch map | BUG-01 |
| 3 | Move API key to backend proxy | SEC-03, SEC-04 |
| 4 | Add CSP meta tag to both HTML files | SEC-06 |
| 5 | Fix onboarding bank details saving | BUG-04 |

## Week 2 -- Supply Chain + Data Safety

| # | Action | Findings Addressed |
|---|--------|--------------------|
| 6 | Pin CDN versions + add SRI hashes | SEC-09, SEC-10, SEC-25 |
| 7 | Validate imported data against schema | SEC-07, BUG-03 |
| 8 | Validate webhook URLs (HTTPS, no private IPs) | SEC-08 |
| 9 | Exclude API key from data exports | SEC-14 |
| 10 | Add `persist()` failure recovery mechanism | CQ-03, CQ-07, UX-10 |

## Week 3 -- Memory + Accessibility

| # | Action | Findings Addressed |
|---|--------|--------------------|
| 11 | Destroy EditorJS instances on navigation | CQ-01, BUG-15 |
| 12 | Implement event listener cleanup strategy | CQ-05 |
| 13 | Add `@media (prefers-reduced-motion)` | CSS-04 |
| 14 | Fix dark mode focus ring visibility | CSS-03 |
| 15 | Add ARIA labels to all icon-only buttons | UX-04 |
| 16 | Increase touch targets to 44px+ | CSS-01 |

## Week 4 -- Logic Bugs + UX

| # | Action | Findings Addressed |
|---|--------|--------------------|
| 17 | Clamp discount values, validate numeric inputs | BUG-05, SEC-17 |
| 18 | Clean dangling clientId on client deletion | BUG-06 |
| 19 | Guard payment schedule mode toggle for zero total | BUG-08 |
| 20 | Add responsive styles to client.html | CSS-02 |
| 21 | Fix analytics to exclude drafts from pipeline | BUG-10, BUG-11 |
| 22 | Add dashboard empty state for new users | UX-02 |

## Month 2 -- Polish + Remaining

| # | Action | Findings Addressed |
|---|--------|--------------------|
| 23 | Add data schema versioning/migration | CQ-06 |
| 24 | Debounce version history snapshots | BUG-12 |
| 25 | Add global line-height to body | CSS-14 |
| 26 | Scope `lucide.createIcons()` calls | BUG-17 |
| 27 | Escape RegExp in search functions | SEC-11 |
| 28 | Add clickjacking protection | SEC-16 |
| 29 | Status tokens dark mode overrides | CSS-05 |
| 30 | Settings mobile navigation alternative | CSS-09 |

---

# APPENDIX A: Security Attack Chains

**Chain 1 -- Social Engineering via Backup File:**
Import crafted JSON → XSS in titles → exfiltrate API key + all business data

**Chain 2 -- Zero-Click XSS via Share Link:**
Crafted client.html#base64 URL → arbitrary JS in victim's browser → steal localStorage

**Chain 3 -- Supply Chain Attack:**
Compromised @latest npm package → no SRI verification → full app takeover

**Chain 4 -- Command Palette Code Execution:**
Crafted proposal ID in localStorage → eval() in command.js → arbitrary code execution

---

# APPENDIX B: Full Test Case Reference

130 test cases covering: Proposal CRUD (12), Pricing (13), Payment Schedule (5), Editor (8), Export/PDF (11), Client Management (7), Settings (13), Multi-Tab (5), Dashboard/Analytics (8), Performance (5), Accessibility (8), Security (6), Offline/PWA (5), Theme/UI (6), Onboarding/Team (6), Derivatives/Versions (5), Command Palette (7).

See the QA agent output for complete step-by-step reproduction instructions for all 130 test cases.

---

*Report generated by 5 specialized audit agents running in parallel.*
*No code was modified during this audit.*
