# Changelog

All notable changes to ProposalKit are documented here.

---

## v2.5 (build 20260211) — 2026-02-11

### feat
- Replace Editor.js with Tiptap — Notion-like rich text editor with seamless typing, better formatting (bold, italic, lists, tables, code blocks, task lists)
- Backward-compatible data migration: old Editor.js block format auto-converts to HTML on open
- Tiptap loaded via ESM modules from esm.sh CDN with async ready event

### fix
- Google OAuth: robust retry with 5-second timeout, manual setSession fallback, and retry screen if SDK fails to process hash token
- OAuth error screen with clear messaging and "Try again" button

### refactor
- All editor saves now synchronous (getHTML) instead of async (save + blocks JSON)
- Variable insertion uses Tiptap insertContent API
- AI assistant uses getText/setContent instead of blocks API
- PDF export passthrough for HTML content with legacy block converter fallback

### Files Changed
- `index.html` — Removed 12 Editor.js CDN tags, added Tiptap ESM module imports
- `assets/js/editor/editor.js` — Added createEditor() factory, migrateEditorContent(), convertLegacyBlocks()
- `assets/js/editor/sections.js` — Switched to Tiptap createEditor(), tiptap-ready event handling
- `assets/js/editor/pricing.js` — Rewrote payment terms + line item editors for Tiptap
- `assets/js/core/autosave.js` — Changed async .save() to sync .getHTML() for all editors
- `assets/js/export/preview.js` — editorJsToHtml() now passes HTML through, legacy fallback
- `assets/js/editor/ai-assistant.js` — getText/setContent instead of blocks API
- `assets/js/core/variables.js` — insertContent instead of blocks.insert
- `assets/js/core/auth.js` — Robust OAuth with timeout, retry screen, safePullAndBoot
- `assets/css/pages.css` — Replaced ~190 lines Editor.js CSS with Tiptap styles
- `assets/js/boot.js` — Version bump to 2.5

## v2.4 (build 20260210) — 2026-02-10

### Features
- **Cloud Sync & Auth** — Supabase integration with email + Google OAuth sign-in
- Two-way cloud sync: proposals, clients, settings, and libraries sync across devices
- Shared proposal links now load from cloud (cross-device, no same-browser requirement)
- Account card in Settings showing email, sync status, and sign-out
- Offline mode with automatic reconnect sync
- "Continue offline" option on auth screen for PWA/offline use

### Infrastructure
- CI/CD pipelines: GitHub Actions for validation, staging deploy, production deploy
- Automatic GitHub Releases created on version tags
- Staging environment with visual banner indicator

### Files Changed
- `assets/js/core/supabase.js` — NEW: Supabase client initialization
- `assets/js/core/auth.js` — NEW: Auth UI (login/signup/reset), session management
- `assets/js/core/sync.js` — NEW: Two-way cloud sync layer with conflict resolution
- `assets/js/core/store.js` — Sync hooks in persist/saveConfig/saveClients, cloud-aware logout
- `assets/js/boot.js` — Auth-aware initApp(), v2.4
- `assets/js/core/onboarding.js` — Push to cloud after onboarding finish
- `assets/js/views/settings.js` — Account card with email/plan/sync/signout
- `client.html` — Cloud-first proposal loading, cloud response submission
- `index.html` — Supabase CDN, 3 new script tags, sync indicator
- `assets/css/pages.css` — Auth form, Google button, sync indicator styles
- `.github/workflows/` — CI, staging deploy, production deploy, release workflows

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
