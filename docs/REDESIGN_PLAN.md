# ProposalKit UI/UX Redesign Plan

**Date:** 2026-02-10
**Based on:** 6-agent comprehensive audit (UI Specialist, JS Engineer, QA Tester, Code Reviewer, UX Designer, Frontend Design)

---

## Executive Summary

ProposalKit's design system scores **8/10 overall** — firmly in the Linear/shadcn/ui tier. The command palette, sidebar, and dark mode are production-quality. The main gaps are: design token completeness (spacing/type scales), touch target sizes, search accessibility, and client portal polish.

This plan prioritizes fixes by user impact, grouping them into 4 phases that can be executed incrementally.

---

## Phase 1: Foundation Fixes (Quick Wins)

*High impact, small effort. Complete these first.*

### 1.1 Design Token Completion
**File:** `assets/css/variables.css`

Add spacing scale:
```css
:root {
  --sp-1: 4px; --sp-2: 6px; --sp-3: 8px; --sp-4: 10px;
  --sp-5: 12px; --sp-6: 14px; --sp-7: 16px; --sp-8: 20px;
  --sp-9: 24px; --sp-10: 32px; --sp-11: 40px; --sp-12: 48px;
}
```

Add z-index scale:
```css
:root {
  --z-toolbar: 10; --z-toc: 50; --z-dropdown: 100;
  --z-sticky: 200; --z-overlay: 900; --z-panel: 901;
  --z-modal: 1000; --z-toast: 9000; --z-command: 9500;
  --z-loading: 10000;
}
```

### 1.2 Touch Targets
**Files:** `components.css`, `layout.css`, `pages.css`

Increase all interactive element minimums:
- `.side-btn` padding: 7px 10px → 10px 12px
- `.btn-sm-icon-ghost`: 30x30 → 36x36
- `.filter-tab` padding: 4px 10px → 6px 14px
- `.ri` (recent items) padding: 5px → 8px 10px
- `.tpl-pick` padding: 4px 8px → 6px 12px
- `.side-new-btn`: 28x28 → 36x36
- `.side-collapse-btn`: 24x24 → 32x32

### 1.3 Focus Indicators
**File:** `variables.css`, `components.css`

Improve button-specific focus rings:
```css
.btn:focus-visible, .btn-sm:focus-visible {
  box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--ring);
}
```

### 1.4 Dynamic Page Title
**File:** `nav.js`, `editor.js`

Update `document.title` on navigation:
```js
// In goNav(): document.title = view + ' — ProposalKit';
// In loadEditor(): document.title = p.title + ' — ProposalKit';
```

---

## Phase 2: Navigation & Search

*Improve information architecture and discoverability.*

### 2.1 Persistent Search
**Files:** `nav.js`, `layout.css`, `responsive.css`

Show search bar on all views (dashboard, proposals, clients), not just dashboard. On mobile, add a search icon button that expands to full-width search.

### 2.2 Proposals Nav Consistency
**File:** `nav.js`

"Proposals" sidebar item should ALWAYS open the proposals list view, never the editor. Add breadcrumb in editor: "Proposals > [Title]" with back navigation.

### 2.3 Keyboard Shortcuts Discovery
**Files:** `nav.js`, `layout.css`

- Add a `?` icon button in the sidebar footer
- Show keyboard hints in tooltips (e.g., "Preview (Cmd+P)")
- Show Cmd+K hint in a first-use tooltip

### 2.4 Undo/Redo Buttons
**File:** `editor.js`, `pages.css`

Add undo/redo icon buttons to the editor stats bar. Show disabled state when stack is empty.

### 2.5 Analytics as Nav Item
**Files:** `index.html`, `nav.js`, `analytics.js`

Add "Analytics" as a sidebar nav item (after Clients), visible when 3+ proposals exist.

---

## Phase 3: Editor & Content Polish

*Improve the editing experience.*

### 3.1 Preview Loading State
**File:** `preview.js`, `pages.css`

Show the preview panel immediately with a skeleton/spinner, then populate content when ready (instead of 400ms blank delay).

### 3.2 Template Selector Redesign
**Files:** `preview.js`, `pages.css`

Replace the 13-template pill bar with a dropdown or grid showing template thumbnails. Group by style category.

### 3.3 Editor Tab Scroll Affordance
**File:** `responsive.css`

Add a fade gradient on the right edge when editor tabs overflow, indicating more content to scroll.

### 3.4 Empty State Enhancement
**Files:** `proposals.js`, `clients.js`, `pages.css`

Add illustrations (meaningful icons), descriptive text, and action buttons to empty states for proposals list, clients, and search results.

### 3.5 Onboarding Polish
**File:** `onboarding.js`

- Add "Skip for now" on all steps (not just 3-4)
- Add completion celebration animation
- Update `document.title` during onboarding steps

---

## Phase 4: Client Portal

*Improve the client-facing experience.*

### 4.1 Print/Download Support
**File:** `client.html`

Add "Download PDF" and "Print" buttons in the client portal header.

### 4.2 Dark Mode Support
**File:** `client.html`

Add `prefers-color-scheme: dark` media query with the same token system as the main app.

### 4.3 Section Navigation
**File:** `client.html`

Add a floating table of contents for long proposals (similar to main app's TOC).

### 4.4 Page Title & Branding
**File:** `client.html`

Set title to "[Proposal Title] from [Company Name]" for trust and tab identification.

---

## Design System Improvements (Ongoing)

### Spacing Normalization
Gradually replace hardcoded px values with `--sp-*` tokens:
- 7px → 8px (`--sp-3`)
- 5px → 6px (`--sp-2`)
- 14px → 16px (`--sp-7`)

### Shadow Differentiation
Use the shadow scale more intentionally:
- `--sh` for card hovers and subtle elevation
- `--sh2` for dropdowns and floating menus
- `--sh3` for modals, command palette, and overlays

### Content Max-Width
Add `max-width: 1200px` constraint to `.body-scroll` content on ultra-wide screens.

### Settings Section Headers
Add bold section titles with muted descriptions above settings cards (Linear pattern).

---

## Priority Matrix

| Priority | Items | Impact | Effort |
|----------|-------|--------|--------|
| P1 (Do Now) | 1.1-1.4 | HIGH | SMALL |
| P2 (Next Sprint) | 2.1-2.5 | HIGH | MEDIUM |
| P3 (Following Sprint) | 3.1-3.5 | MEDIUM | MEDIUM |
| P4 (Backlog) | 4.1-4.4 | MEDIUM | LARGE |

---

## Reference Products

| Product | What to learn from |
|---------|-------------------|
| **Linear** | Sidebar, command palette, keyboard shortcuts, analytics |
| **Notion** | Block-based content, empty states, onboarding |
| **Apple HIG** | Touch targets, color palette, focus states |
| **shadcn/ui** | Component tokens, dark mode, form styling |
| **Vercel** | Dashboard density, content max-width, monospace accents |
| **Stripe** | Invoices, pricing tables, client-facing pages |
