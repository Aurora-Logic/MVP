# Changelog

All notable changes to ProposalKit are documented here.

---

## v2.14.1 (build 20260213) — 2026-02-13

### Style
- Client search input redesigned as pill (matches topbar search pattern with focus ring)
- Settings tabs redesigned with inline icons, pill-shaped buttons, and active state border/shadow
- Settings cards now have per-section accent gradients (blue, green, orange, purple, red) matching dashboard metric cards
- Dark mode override for settings card gradients

### Refactor
- Add/edit client converted from modal overlay to full-page layout with sectioned cards
- Add client page uses card-per-section pattern (contact, communication, billing) with icon header
- Save/cancel actions moved to topbar (Back + Save buttons)

### Files Changed
- `assets/css/pages.css` — New `.set-tab` styles, `.set-card` accent gradient variants, `.cl-search-wrap` pill design, `.acm-container`/`.acm-card` full-page styles
- `assets/css/responsive.css` — Added `.set-tab` 44px touch target for mobile
- `assets/js/views/settings.js` — `SET_TABS` config array with icons, `.set-tab` buttons replace `.tab`, cards use `.set-card` + gradient classes
- `assets/js/views/clients.js` — `openAddClient()` renders into bodyScroll as full page, `saveClient()` navigates back, search wrap uses topbar pill pattern
- `assets/js/boot.js` — Version bump to 2.14.1, updated What's New items

---

## v2.14.0 (build 20260213) — 2026-02-13

### Features
- Settings page completely redesigned: horizontal tab navigation replaces sidebar scroll-spy layout
- Each settings section (Profile, Payments, Email, Branding, Signature, Data) is now a focused tab panel
- Clients page rebuilt with Notion-style table layout replacing card grid
- Client metric strip: 4 summary cards (Total Clients, Total Value, Avg Per Client, Win Rate)
- Client search bar with real-time filtering across the table
- Client insights page redesigned with card-wrapped header, shadcn metric cards with accent gradients, and Notion-style proposal history table
- Add Client modal restructured into sections (Contact, Communication, Billing) with filter-tab pill toggle for customer type

### Style
- Settings tab bar uses existing `.tabs` component pattern, sticky with scroll overflow on mobile
- Client table reuses `.nt-table` and `.nt-row` patterns from Proposals page for consistency
- Client insight metric cards use per-card accent gradients matching dashboard (primary, green, red, blue, amber)
- Add Client modal gets `.acm-*` classes with section labels, dividers, and scrollable body
- Danger zone card now has red accent gradient matching `.mc-outstanding` pattern
- Settings card form groups get 16px spacing (was 12px) for more breathing room
- Settings section icon boxes enlarged to 40px with 12px border-radius

### Files Changed
- `assets/js/views/settings.js` — full rewrite: tab-based `setTab()` replaces scroll-spy `settingsNavHtml()`/`initSettingsScrollSpy()`
- `assets/js/views/clients.js` — full rewrite: table view, metric strip, search, sectioned modal, card-based insights
- `assets/css/pages.css` — replaced settings-nav/settings-layout with set-container/set-tabs, replaced client-grid with cl-container/cl-metric-grid/cl-toolbar, new ci-container/ci-mc card styles, new acm-modal section styles
- `assets/css/responsive.css` — updated breakpoints for new cl-metric-grid, cl-toolbar, ci-metric-grid, ci-header layouts
- `assets/js/boot.js` — version bump to 2.14.0, updated What's New items

---

## v2.12.1 (build 20260212) — 2026-02-12

### Features
- Expanded client fields: customer type, salutation, first/last name, company, display name, work/mobile phone, address (street, city, state, pin), GST number
- Searchable state dropdown for India (33 states/UTs)
- Client address and GST number in all 13 PDF templates via `buildClientDetails()` helper
- "How to use" guide modal accessible from sidebar (5-step getting started guide)
- Unique Lottie animations per empty state page (dashboard, proposals, clients)
- Profile page cards with gradient backgrounds matching dashboard metric cards

### Style
- Client portal (client.html) redesigned with topbar matching main app, pill buttons, SF Pro font
- Settings sections wrapped in card containers matching dashboard design pattern
- Danger zone data card has red-tinted border
- All settings labels converted to sentence case

### Files Changed
- `assets/js/views/clients.js` — Full rewrite with expanded fields, INDIAN_STATES, SALUTATIONS, matchClient
- `assets/js/core/store.js` — Client and Proposal typedefs expanded
- `assets/js/globals.d.ts` — Client/Proposal interfaces updated, buildClientDetails/openGuide declared
- `assets/js/core/autosave.js` — Collect address and gstNumber from client fields
- `assets/js/editor/details.js` — Address and GST number fields in client section
- `assets/js/export/templates.js` — buildClientDetails() helper, 4 templates updated
- `assets/js/export/pdf-templates2.js` — 9 templates updated with buildClientDetails()
- `assets/js/views/nav.js` — openGuide() function, guideModal ESC handler
- `assets/js/views/settings.js` — Card-wrapped sections, sentence case labels
- `assets/js/views/dashboard.js` — Unique Lottie animation URL
- `assets/js/views/proposals.js` — Unique Lottie animation URL
- `assets/js/client.js` — New topbar structure, buildTopbar() helper
- `assets/css/client.css` — Full redesign with app design tokens
- `assets/css/pages.css` — settings-card styles, profile card gradients
- `assets/css/features.css` — Guide step styles (.guide-step, .guide-num, kbd)
- `assets/css/variables.css` — Minor token adjustment
- `client.html` — Updated CSP, CDN Lucide, CSS spinner loading
- `index.html` — "How to use" sidebar button, sentence case
- `eslint.config.js` — New globals (INDIAN_STATES, SALUTATIONS, etc.)
- `assets/js/boot.js` — Version 2.12.0 → 2.13.0, What's New updated

---

## v2.12.0 (build 20260212) — 2026-02-12

### Features
- Send Feedback modal: report bugs, suggest features, or share thoughts from the sidebar
- Quick search icon button next to Quick Create opens command palette (⌘K)
- Sidebar footer profile click navigates to Settings; ellipsis opens user menu

### Style
- Font stack switched to SF Pro Display → Helvetica Neue → Helvetica (system fonts, no web font load)
- Global letter-spacing set to -0.02em for tighter, more refined typography
- Google Fonts import trimmed to JetBrains Mono only (UI fonts are all system)
- Default theme changed to light mode (dark mode opt-in via Settings)
- Version numbering switched to semver x.x.x format

### Files Changed
- `index.html` — Font import trimmed, FOUC script light-default, sidebar restructure (search btn, feedback btn, profile nav)
- `assets/css/variables.css` — Font stack to SF Pro + Helvetica, --letter-spacing: -0.02em
- `assets/css/layout.css` — .side-new-wrap flex, .side-new-icon styles
- `assets/js/views/nav.js` — openFeedbackModal(), selectFbType(), submitFeedback(), ESC handler
- `assets/js/core/theme.js` — Default light mode, applyFont() SF Pro stack
- `assets/js/boot.js` — Version 2.11 → 2.12.0, What's New updated
- `sw.js` — Cache bump v11 → v12
- `package.json` — Version 2.11.0 → 2.12.0
- `eslint.config.js` — Added feedback function globals

---

## v2.11 (build 20260212) — 2026-02-12

### Style
- Topbar redesigned to match shadcn dashboard-01 header: SidebarTrigger (panel-left icon) + vertical Separator + Breadcrumb
- Font weights normalized across entire app: 800→600, 700→600 (shadcn/ui uses 400/500/600 scale only)
- Inter font import trimmed to 400;500;600 weights (removed unused 700/800)
- Hamburger button replaced by unified topbar-trigger that handles both desktop sidebar collapse and mobile offcanvas

### Refactor
- `toggleSidebar()` now detects viewport width — desktop triggers collapse, mobile triggers offcanvas
- Removed old `.hamburger-btn` CSS (replaced by `.topbar-trigger`)

### Files Changed
- `index.html` — Topbar: SidebarTrigger + Separator + Breadcrumb; trimmed font weights
- `assets/css/layout.css` — `.topbar-trigger`, `.topbar-sep`; removed `.hamburger-btn`; topbar h:52px gap:8px
- `assets/css/pages.css` — All font-weight 700/800 → 600
- `assets/css/components.css` — All font-weight 700 → 600
- `assets/css/features.css` — All font-weight 700/800 → 600
- `assets/css/responsive.css` — Removed hamburger show rule; fixed auth icon weight
- `assets/css/pdf.css` — Font-weight 700/800 → 600
- `assets/css/client.css` — Font-weight 700 → 600
- `assets/css/print.css` — Updated print hide selector
- `assets/js/views/nav.js` — Smart `toggleSidebar()` for mobile/desktop
- `assets/js/boot.js` — Version 2.10 → 2.11, What's New updated
- `sw.js` — Cache bump v10 → v11
- `package.json` — Version 2.10.0 → 2.11.0

---

## v2.10 (build 20260212) — 2026-02-12

### Features
- Rebuilt sidebar to exact shadcn/ui sidebar-07 pattern: team header, grouped nav, Recent documents, user footer with dropdown menu
- Breadcrumb topbar replaces flat title — clickable path segments (ProposalKit > Dashboard / Proposals > Title)
- Quick Create button with circle-plus icon in sidebar
- User dropdown menu (Settings, Theme, team switching, Log out) from footer avatar
- Analytics revenue chart widget with time filters and stats grid on dashboard
- Notion-style proposal table with filter tabs, sort menu, and view toggle (table/list/kanban)

### Style
- Sidebar uses dedicated `--sidebar-*` CSS tokens matching shadcn specification
- Metric cards with per-card accent gradients (primary, blue, green, red)
- Resume card with blue gradient and status badge
- Auth screens and onboarding redesigned
- Responsive breakpoints updated for new sidebar + topbar layout

### Files Changed
- `index.html` — Rebuilt sidebar HTML (shadcn groups), breadcrumb topbar
- `assets/css/layout.css` — Sidebar styles (header, groups, footer, user menu, rail)
- `assets/css/pages.css` — Dashboard metric cards, resume card, proposal table, analytics widget, filter tabs
- `assets/css/variables.css` — Sidebar tokens, type scale, spacing
- `assets/css/responsive.css` — Mobile sidebar, metric grid breakpoints
- `assets/js/views/nav.js` — `goNav()` breadcrumb reset, `toggleUserMenu()` dropdown
- `assets/js/export/create.js` — `refreshSide()` updates new sidebar elements
- `assets/js/editor/editor.js` — Editor breadcrumb (root→Proposals, current→title)
- `assets/js/views/dashboard.js` — Metric cards, resume bar, analytics widget integration
- `assets/js/views/proposals.js` — Filter tabs, Notion-style table/list, sort menu
- `assets/js/views/analytics.js` — Revenue chart, stats grid, toggle group filters
- `assets/js/core/team.js` — `updateSidebarUser()` for new avatar/name/email elements
- `assets/js/boot.js` — Version 2.9 → 2.10, What's New items
- `sw.js` — Cache bump v9 → v10

---

## v2.9 (build 20260212) — 2026-02-12

### Features
- Dashboard redesigned with shadcn/ui dashboard-01 gradient metric cards (Total Pipeline, Active Proposals, Won Deals, Outstanding)
- 30-day trend badges compare recent vs prior period with up/down/neutral indicators
- Currency-aware icon on pipeline card (INR, USD, EUR, GBP, JPY)
- Clickable metric cards navigate directly to filtered proposal views
- Responsive grid: 4 cols → 2 cols (1100px) → 1 col (480px)
- Dark mode gradient adjustment (3% vs 5% primary opacity)

### Files Changed
- `assets/js/views/dashboard.js` — Added `buildMetricCards()` function, replaced stats strip
- `assets/css/pages.css` — Added ~100 lines: `.dash-metric-grid`, `.metric-card`, `.trend-badge` styles
- `assets/css/responsive.css` — Added metric grid breakpoints at 1100px, 768px, 480px
- `assets/js/boot.js` — Version bump 2.8 → 2.9, updated What's New

---

## v2.8 (build 20260211) — 2026-02-11

### feat
- Apple HIG-level redesign of Dashboard (stats strip, two-col layout, activity feed, side metrics)
- Apple HIG-level redesign of Proposals page (page header, card-wrapped list, data-rich rows with section/item counts)
- Apple HIG-level redesign of Settings (nav sidebar with scroll spy, single-column layout, danger zone divider)
- Apple HIG-level redesign of Sidebar (translucent hover, card-on-select nav, proposal values in recent items)
- Notion-style Tiptap editor: bubble menu on text selection (bold/italic/underline/strike/code/highlight/link)
- Notion-style Tiptap editor: slash command menu (/ for headings, lists, tasks, quotes, code, tables, dividers)
- Email template functions extracted to settings-templates.js for file size management

### style
- Custom-styled date picker month/year selects (removed native appearance, added SVG chevron, dark mode)
- Proposal rows show section count, line item count, client icon, mono proposal number
- Sidebar uses `var(--bg2)` background, `rgba()` translucent hovers, subtle card shadows for active state
- Sidebar footer icons use `opacity: 0.6` with `1` on hover
- Mobile sidebar overlay uses `backdrop-filter: blur(2px)`

### Files Changed
- `assets/css/layout.css` — Complete sidebar CSS rewrite with Apple HIG patterns
- `assets/css/pages.css` — Dashboard v2, Proposals v2, Settings v2, Tiptap bubble/slash menu CSS
- `assets/css/components.css` — Custom date picker select styling
- `assets/css/responsive.css` — Updated breakpoints for new layouts
- `assets/js/views/dashboard.js` — Rewritten with stats strip, two-col grid, side metrics, activity feed
- `assets/js/views/proposals.js` — Page header, data-rich rows, calcTotals integration
- `assets/js/views/settings.js` — Nav sidebar, scroll spy, single-column layout
- `assets/js/views/settings-templates.js` — New file (email template functions extracted)
- `assets/js/editor/editor.js` — createEditor() auto-attaches bubble + slash menus
- `assets/js/editor/tiptap-menus.js` — New file (Notion-style bubble menu + slash commands)
- `assets/js/editor/sections.js` — destroyAllEditors() cleans up Tiptap menus
- `assets/js/export/create.js` — refreshSide() shows 6 recent items with values
- `assets/js/globals.d.ts` — Type declarations for new functions
- `index.html` — Added tiptap-menus.js + settings-templates.js script tags, sidebar HTML refined
- `sw.js` — Added tiptap-menus.js to service worker cache

---

## v2.7 (build 20260211) — 2026-02-11

### Features
- Drag-to-reorder line items in pricing table with grip handles (same UX as section reorder)
- Removed focus ring outlines from all inputs, textareas, and tiptap editors for cleaner writing UX

### Fixes
- Added 5-second safety timeout in auth flow to prevent blank screen on slow connections
- Service worker now forces update check on every page load (no more stale caches)
- Bumped SW cache to v5

### Files Changed
- `assets/js/editor/pricing.js` — line item drag reorder with grip handle
- `assets/css/components.css` — removed focus ring from inputs
- `assets/css/pages.css` — removed focus ring from tiptap-wrap and line items, added grip CSS
- `assets/css/variables.css` — removed global focus-visible ring
- `assets/js/core/auth.js` — 5-second safety timeout
- `index.html` — SW registration with forced update
- `sw.js` — cache v4 → v5

---

## v2.6 (build 20260211) — 2026-02-11

### Features
- Vendor-locked all CDN dependencies locally (Lucide, Supabase, QR code) — app works fully offline
- Tiptap editor bundled as single synchronous IIFE via esbuild — eliminates ESM CDN race conditions

### Security Fixes
- Strip `aiApiKey` and `signature` from cloud sync payload (sync.js)
- Add 3-second rate limiting on AI assistant requests (ai-assistant.js)
- Add Content-Security-Policy meta tag to client.html
- Add CSP meta tag to standalone HTML exports (integrations.js)
- Add SSRF protection — webhook URLs blocked for private/localhost IPs (integrations.js)

### Chore
- Remove dead tiptap-ready fallback code from sections.js and pricing.js
- Update service worker cache to v3 with all vendor files
- Add vendor directory to eslint ignores, prettierignore, jsconfig exclude

### Files Changed
- `assets/js/vendor/lucide-0.460.0.js` — vendored Lucide Icons v0.460.0
- `assets/js/vendor/supabase-2.49.1.js` — vendored Supabase JS v2.49.1
- `assets/js/vendor/qrcode-1.4.4.min.js` — vendored QR code generator
- `assets/js/vendor/tiptap.bundle.js` — esbuild IIFE bundle of 13 Tiptap packages
- `assets/js/vendor/tiptap-entry.mjs` — esbuild entry point
- `assets/js/core/sync.js` — strip sensitive keys before cloud push
- `assets/js/editor/ai-assistant.js` — rate limiting on AI requests
- `assets/js/editor/sections.js` — remove tiptap-ready fallback
- `assets/js/editor/pricing.js` — remove tiptap-ready fallback
- `assets/js/export/integrations.js` — CSP on HTML export, SSRF webhook validation
- `index.html` — replace CDN scripts with local vendor, tighten CSP
- `client.html` — replace CDN scripts with local vendor, add CSP
- `sw.js` — bump cache v3, add vendor files to STATIC_ASSETS
- `eslint.config.js` — ignore vendor directory
- `.prettierignore` — ignore vendor directory
- `jsconfig.json` — exclude vendor from type checking
- `package.json` — add Tiptap devDependencies + build script
- `assets/js/boot.js` — version bump to 2.6

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
