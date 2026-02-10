# Changelog

All notable changes to ProposalKit are documented here.

---

## v2.3 (build 20260210) — 2026-02-10

### Features
- Import data from JSON backup files (proposals, clients, settings)
- UPI ID field + QR code auto-generation on PDF invoices (India)
- Multiple payment recording per proposal with due tracking
- Marketing landing page with features showcase, pricing, and FAQ
- PM and CEO strategic analysis skills

### Improvements
- Onboarding: skip any step, celebration animation, smarter flow
- Context-aware empty states throughout (proposals, clients, dashboard)
- Client portal: dynamic page title with sender name
- Dashboard first-run cards updated (13 templates, Client Portal)
- Version + build display in Settings footer

### Files Changed
- `assets/js/core/onboarding.js` — Skip buttons, celebration, dynamic title
- `assets/js/views/clients.js` — Enhanced empty state
- `assets/js/views/proposals.js` — Context-aware filter empty states
- `assets/js/views/dashboard.js` — Updated first-run cards
- `assets/js/views/settings.js` — Version footer
- `assets/js/boot.js` — APP_VERSION 2.3, APP_BUILD, What's New items
- `client.html` — Dynamic page title
- `.claude/skills/product-manager/SKILL.md` — New PM skill
- `.claude/skills/ceo/SKILL.md` — New CEO skill

---

## v2.2 (build 20260209) — 2026-02-09

### Features
- Marketing landing page with hero, features grid, template previews, pricing table, FAQ accordion
- Bank footer redesign: brand-colored labels, row separators, QR beside table
- UPI/QR payments, payment tracking, dues tracking, PDF page breaks
- Custom styled select dropdowns

### Fixes
- PDF pricing column overlap resolved
- Tax IDs (UDYAM/LUT) display on all templates
- Bank details rendering on all 16 templates

### Files Changed
- `landing.html` — New marketing landing page
- `assets/js/export/templates.js` — Bank footer, QR, page breaks
- `assets/js/editor/payments.js` — Payment tracking
- `assets/css/pages.css` — Payment and dues styles

---

## v2.1 (build 20260208) — 2026-02-08

### Features
- Phase 6: AI writing assistant, team/multi-user, integrations, derivatives, diff view
- White-label mode — remove ProposalKit branding with a toggle
- Digital acceptance block, clickable status badges, always-visible actions

### Fixes
- Comprehensive logic bug fixes across all modules
- Audit fixes: inline styles, ARIA, memory leaks, validation
- Replace inline styles with CSS classes for maintainability

### Files Changed
- `assets/js/editor/ai-assistant.js` — AI writing assistant
- `assets/js/core/team.js` — Team management
- `assets/js/export/integrations.js` — Export integrations
- `assets/js/export/derivatives.js` — SOW/Contract/Receipt generation
- `assets/js/export/diff-view.js` — Version comparison

---

## v2.0 (build 20260207) — 2026-02-07

### Features
- Phase 5: Weighted proposal scoring, analytics breakdowns, section packs, revenue forecast
- Overlay and z-index system overhaul
- Comprehensive UI/UX polish pass

### Fixes
- Scrollbar styling on all containers
- Drag-and-drop stability
- Form and animation consistency

### Files Changed
- `assets/js/core/completeness.js` — Proposal scoring
- `assets/js/views/analytics-breakdowns.js` — Win rate breakdowns
- `assets/js/editor/section-packs.js` — Section pack library
- `assets/css/` — All 8 CSS files polished
