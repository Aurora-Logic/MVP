# ProposalKit — Implementation Guide

> This is the primary reference for Claude Code.
> Read this FIRST before touching any code.

---

## WHAT IS PROPOSALKIT?

A hosted SaaS proposal builder for freelancers and agencies. Users visit the site, create proposals, export polished PDFs. Built with vanilla HTML/CSS/JS — no React, no build frameworks.

---

## TECH STACK

```
Language:       Vanilla HTML + CSS + JavaScript (no TypeScript, no JSX)
CSS Framework:  Tailwind CSS v4 (via CDN for dev, built for prod)
Components:     Basecoat UI v0.3.11 (shadcn for vanilla HTML)
Icons:          Lucide (via CDN)
Rich Text:      Editor.js (via CDN)
Fonts:          Inter + JetBrains Mono (via Google Fonts)
Storage:        localStorage (Phase 1–4) → Supabase (Phase 5+)
PDF Export:     Browser print-to-PDF
Build:          Tailwind CLI (only tool needed — compiles CSS)
```

### CDN Dependencies (in index.html <head>)
```html
<!-- Tailwind Browser CDN (dev) — replace with built CSS in production -->
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

<!-- Basecoat CSS (component styles) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.11/dist/basecoat.cdn.min.css">

<!-- Basecoat JS (interactive components: dropdown, tabs, toast, dialog, select) -->
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.11/dist/js/all.min.js" defer></script>

<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

<!-- Lucide Icons -->
<script src="https://unpkg.com/lucide@latest"></script>

<!-- Editor.js -->
<script src="https://cdn.jsdelivr.net/npm/@editorjs/editorjs@2.29.1"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/header@2.8.7"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/list@1.9.0"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/quote@2.7.2"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/delimiter@1.4.2"></script>
```

### Why Basecoat?
- Exact same design as shadcn/ui — same colors, spacing, radius, shadows.
- Class-based: `<button class="btn">` instead of copy-pasting 40 Tailwind classes.
- Built-in components: btn, card, input, badge, dialog, dropdown-menu, tabs, toast, select, avatar, progress, skeleton, switch, table, tooltip.
- Dark mode ready. Accessible. shadcn themes compatible.
- Only 3KB JS for interactive components.
- We use Basecoat classes for standard components + Tailwind utilities for custom layout.

---

## FOLDER STRUCTURE

### Current (from screenshot)
```
proposalkit/
├── assets/
│   ├── css/
│   │   └── main.css        ← Everything in one file (bad for 31 features)
│   └── js/
│       └── app.js           ← Everything in one file (bad for 31 features)
├── md/
│   ├── ARCHITECTURE.md
│   ├── BUG_REPORT.md
│   ├── CODE_ORGANIZATION.md
│   ├── COMPLETE_FIX_LIST.md
│   ├── FIXES_APPLIED.md
│   └── TESTING_GUIDE.md
├── client.html
└── index.html
```

### Target Structure (migrate to this)
```
proposalkit/
├── index.html                     # App entry — all HTML structure + script/link tags
├── client.html                    # Client-facing proposal view (Phase 5)
│
├── assets/
│   ├── css/
│   │   ├── theme.css              # CSS variables: brand colors, dark mode overrides
│   │   ├── layout.css             # App shell: sidebar, topbar, body, preview panel
│   │   ├── pages.css              # Dashboard, editor, clients, settings, onboarding
│   │   ├── features.css           # Packages, add-ons, analytics, timeline, milestones
│   │   ├── pdf.css                # PDF template styles, cover page, watermark
│   │   ├── print.css              # @media print rules
│   │   └── responsive.css         # All @media queries
│   │
│   ├── js/
│   │   ├── store.js               # Globals, localStorage R/W, persist(), cur()
│   │   ├── utils.js               # esc(), uid(), timeAgo(), helpers
│   │   ├── format.js              # fmtCur(), fmtDate(), fmtNum(), taxLabel()
│   │   ├── variables.js           # replaceVariables() for {{placeholders}}
│   │   ├── modals.js              # openModal(), closeModal(), toast(), context menu
│   │   ├── autosave.js            # Save indicator, debounce logic
│   │   ├── completeness.js        # calcCompleteness(), score rendering
│   │   ├── shortcuts.js           # Keyboard shortcuts + panel
│   │   ├── library.js             # Section library, T&C library
│   │   ├── email.js               # Email composer
│   │   ├── onboarding.js          # Onboarding flow
│   │   ├── nav.js                 # goNav(), sidebar logic
│   │   ├── dashboard.js           # renderDashboard(), stats, filters, proposal list
│   │   ├── editor.js              # loadEditor(), tab switching, stats bar
│   │   ├── details.js             # renderDetails(), status, expiry
│   │   ├── sections.js            # renderSections(), Editor.js, drag-reorder
│   │   ├── pricing.js             # renderPricing(), line items, totals
│   │   ├── packages.js            # 3-tier pricing packages (Phase 2)
│   │   ├── addons.js              # Optional add-ons (Phase 2)
│   │   ├── payment-schedule.js    # Payment milestones (Phase 2)
│   │   ├── timeline.js            # renderMilestones(), timeline builder
│   │   ├── notes.js               # renderNotes(), activity log
│   │   ├── preview.js             # buildPreview(), template switching
│   │   ├── templates.js           # Modern/Classic/Minimal/Tabular PDF builders
│   │   ├── cover.js               # buildCoverHtml()
│   │   ├── export.js              # doExport(), print-to-PDF
│   │   ├── clients.js             # renderClients(), CRUD, picker
│   │   ├── settings.js            # renderSettings(), saveSettings()
│   │   ├── analytics.js           # Win rate, charts (Phase 3)
│   │   └── app.js                 # initApp(), boot, event listeners — LOADED LAST
│   │
│   └── img/
│       ├── favicon.svg
│       └── og-image.png
│
├── docs/                           # Renamed from md/ — cleaner
│   ├── PRODUCT_SPEC.md
│   ├── UI_GUIDELINES.md
│   ├── IMPLEMENTATION_GUIDE.md     # THIS FILE
│   ├── BUILD_CHECKLIST.md
│   ├── ARCHITECTURE.md             # Keep existing
│   └── TESTING_GUIDE.md            # Keep existing
│
├── package.json                    # Only for Tailwind CLI build
└── tailwind.config.js              # Tailwind config (content paths, theme)
```

### Migration Steps (from current → target)
1. Split `main.css` into: `theme.css`, `layout.css`, `pages.css`, `features.css`, `pdf.css`, `responsive.css`, `print.css`
2. Split `app.js` into the JS files listed above (start with store → utils → format → then feature files)
3. Rename `md/` to `docs/`, replace old md files with the new ones
4. Add `package.json` + `tailwind.config.js` for CSS build
5. Update `index.html` to load all CSS/JS files in correct order

### IMPORTANT: Do the migration BEFORE building new features.
A 2000-line `app.js` cannot scale. Split first, then build.

---

## SCRIPT LOADING ORDER

Order matters. Each file can call functions from files loaded before it.

```html
<!-- In index.html, before </body> -->

<!-- 1. Data layer (no dependencies) -->
<script src="/assets/js/store.js"></script>

<!-- 2. Pure utilities (depends on store) -->
<script src="/assets/js/utils.js"></script>
<script src="/assets/js/format.js"></script>
<script src="/assets/js/variables.js"></script>

<!-- 3. UI systems (depends on utils) -->
<script src="/assets/js/modals.js"></script>
<script src="/assets/js/autosave.js"></script>
<script src="/assets/js/completeness.js"></script>
<script src="/assets/js/shortcuts.js"></script>
<script src="/assets/js/library.js"></script>
<script src="/assets/js/email.js"></script>

<!-- 4. Pages & features (depends on UI systems) -->
<script src="/assets/js/onboarding.js"></script>
<script src="/assets/js/nav.js"></script>
<script src="/assets/js/dashboard.js"></script>
<script src="/assets/js/details.js"></script>
<script src="/assets/js/sections.js"></script>
<script src="/assets/js/pricing.js"></script>
<script src="/assets/js/packages.js"></script>
<script src="/assets/js/addons.js"></script>
<script src="/assets/js/payment-schedule.js"></script>
<script src="/assets/js/timeline.js"></script>
<script src="/assets/js/notes.js"></script>
<script src="/assets/js/editor.js"></script>

<!-- 5. Preview & export (depends on editor) -->
<script src="/assets/js/cover.js"></script>
<script src="/assets/js/templates.js"></script>
<script src="/assets/js/preview.js"></script>
<script src="/assets/js/export.js"></script>

<!-- 6. Other pages -->
<script src="/assets/js/clients.js"></script>
<script src="/assets/js/settings.js"></script>
<script src="/assets/js/analytics.js"></script>

<!-- 7. Boot (ALWAYS LAST) -->
<script src="/assets/js/app.js"></script>
```

---

## BASECOAT COMPONENT USAGE

### Use Basecoat classes for standard components:

```html
<!-- Buttons -->
<button class="btn">Default</button>
<button class="btn btn-primary">Primary</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-destructive">Delete</button>
<button class="btn btn-sm">Small</button>
<button class="btn btn-lg">Large</button>
<button class="btn btn-icon"><i data-lucide="plus"></i></button>

<!-- Card -->
<div class="card">
  <div class="card-header">
    <div class="card-title">Title</div>
    <div class="card-description">Description</div>
  </div>
  <div class="card-content">...</div>
  <div class="card-footer">...</div>
</div>

<!-- Inputs -->
<div class="field">
  <label class="label">Name</label>
  <input class="input" placeholder="Enter name">
  <p class="field-description">Helper text</p>
</div>

<textarea class="textarea" rows="3"></textarea>
<select class="select">...</select>

<!-- Badge -->
<span class="badge">Default</span>
<span class="badge badge-secondary">Secondary</span>
<span class="badge badge-destructive">Error</span>
<span class="badge badge-outline">Outline</span>

<!-- Table -->
<div class="table-container">
  <table class="table">
    <thead><tr><th>Name</th><th>Value</th></tr></thead>
    <tbody><tr><td>Item</td><td>$100</td></tr></tbody>
  </table>
</div>

<!-- Tabs (requires basecoat JS) -->
<div class="tabs" data-tabs>
  <div class="tabs-list">
    <button class="tabs-trigger" data-tabs-trigger="details">Details</button>
    <button class="tabs-trigger" data-tabs-trigger="pricing">Pricing</button>
  </div>
  <div class="tabs-content" data-tabs-content="details">...</div>
  <div class="tabs-content" data-tabs-content="pricing">...</div>
</div>

<!-- Dialog (requires basecoat JS) -->
<div data-dialog>
  <button class="btn" data-dialog-trigger>Open</button>
  <div class="dialog-overlay" data-dialog-overlay></div>
  <div class="dialog-content" data-dialog-content>
    <div class="dialog-header">
      <div class="dialog-title">Title</div>
      <div class="dialog-description">Description</div>
    </div>
    <!-- content -->
    <div class="dialog-footer">
      <button class="btn btn-outline" data-dialog-close>Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>

<!-- Toast (requires basecoat JS) -->
<div class="toast-container" data-toast-container>
  <div class="toast" data-toast>
    <div class="toast-title">Saved!</div>
    <div class="toast-description">Your proposal has been saved.</div>
  </div>
</div>

<!-- Switch -->
<label class="switch">
  <input type="checkbox">
  <span class="switch-thumb"></span>
</label>

<!-- Progress -->
<div class="progress">
  <div class="progress-indicator" style="width: 78%"></div>
</div>

<!-- Avatar -->
<div class="avatar">
  <span class="avatar-fallback">VK</span>
</div>

<!-- Skeleton -->
<div class="skeleton h-4 w-[200px]"></div>

<!-- Tooltip (requires basecoat JS) -->
<div data-tooltip>
  <button data-tooltip-trigger>Hover me</button>
  <div class="tooltip" data-tooltip-content>Tip text</div>
</div>

<!-- Dropdown Menu (requires basecoat JS) -->
<div data-dropdown-menu>
  <button data-dropdown-menu-trigger class="btn btn-ghost btn-icon">
    <i data-lucide="more-horizontal"></i>
  </button>
  <div class="dropdown-menu-content" data-dropdown-menu-content>
    <button class="dropdown-menu-item">Edit</button>
    <button class="dropdown-menu-item">Duplicate</button>
    <div class="dropdown-menu-separator"></div>
    <button class="dropdown-menu-item text-destructive">Delete</button>
  </div>
</div>

<!-- Alert -->
<div class="alert">
  <div class="alert-title">Heads up!</div>
  <div class="alert-description">Something to know.</div>
</div>
<div class="alert alert-destructive">...</div>

<!-- Separator -->
<div class="separator"></div>
```

### Use Tailwind utilities for custom layout:
```html
<!-- Grid layouts, spacing, flex, positioning -->
<div class="grid grid-cols-4 gap-3">...</div>
<div class="flex items-center gap-2">...</div>
<div class="p-5 mt-4 max-w-[600px]">...</div>

<!-- Colors using CSS variables from Basecoat/shadcn theme -->
<div class="text-muted-foreground">Secondary text</div>
<div class="bg-muted rounded-lg p-3">Muted background</div>
<div class="border border-border">Bordered element</div>
```

### Custom styles for ProposalKit-specific components:
Use Tailwind classes inline or in CSS files for:
- Proposal row/card layout
- Dashboard stat cards
- Editor stats bar
- Timeline visual
- PDF template rendering
- Preview panel
- Sidebar navigation items (unless Basecoat sidebar component fits)

---

## GLOBAL STATE (store.js)

```javascript
// ═══ store.js — Data Layer ═══
// All global state. Loaded first. No dependencies.

let DB = JSON.parse(localStorage.getItem('pk_db') || '[]');
let CONFIG = JSON.parse(localStorage.getItem('pk_config') || 'null');
let CLIENTS = JSON.parse(localStorage.getItem('pk_clients') || '[]');

let CUR = null;                    // Current proposal ID
let saveTimer = null;              // Autosave debounce
let docTemplate = 'modern';        // PDF template
let editorInstances = {};          // Editor.js registry
let currentFilter = 'all';         // Dashboard filter
let currentSort = 'date';          // Dashboard sort
let lastSaveTime = Date.now();     // For save indicator

const persist = () => localStorage.setItem('pk_db', JSON.stringify(DB));
const saveConfig = () => localStorage.setItem('pk_config', JSON.stringify(CONFIG));
const saveClients = () => localStorage.setItem('pk_clients', JSON.stringify(CLIENTS));
const cur = () => DB.find(p => p.id === CUR);
```

---

## NAMING CONVENTIONS

### Functions
```
render*()          → Builds HTML, inserts into DOM (renderDashboard, renderPricing)
load*()            → Sets up complex view (loadEditor)
goNav()            → Navigation
add/del/dup/save*  → CRUD operations
dirty*()           → Marks data changed, triggers save
build*()           → Returns HTML string (buildModernTpl, buildCoverHtml)
calc*()            → Returns computed value (calcTotals, calcCompleteness)
open/close*()      → Show/hide panels/modals
fmt*()             → Format for display (fmtCur, fmtDate)
esc()              → Escape HTML
uid()              → Generate ID
```

### CSS
- Use Basecoat classes for standard components
- Use Tailwind utilities for layout and custom styling
- Custom CSS only in `.css` files for truly custom components
- Prefix custom classes: `pk-*` (e.g. `pk-stat-card`, `pk-proposal-row`)

---

## CRITICAL RULES

### ALWAYS
1. Call `lucide.createIcons()` after any innerHTML update
2. Call `persist()` after any data mutation
3. Use `esc()` for ALL user content inserted into HTML
4. Debounce saves at 350ms minimum
5. Show toast for data-changing actions
6. Use Basecoat component classes before inventing custom ones

### NEVER
1. Never use `alert()` / `confirm()` — use Basecoat Dialog
2. Never use `eval()` or unescaped innerHTML
3. Never add npm dependencies (CDN only)
4. Never create circular dependencies between JS files
5. Never exceed 300 lines per JS file — split further if needed
6. Never put business logic in CSS files

### PERFORMANCE
1. Autosave debounce: 350ms
2. Destroy Editor.js instances before reinitializing
3. Cache localStorage reads in memory variables (DB, CONFIG, CLIENTS)
4. No re-rendering entire page — only update changed sections

---

## BUILD FOR PRODUCTION

### Development (CDN — works now)
```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.11/dist/basecoat.cdn.min.css">
```

### Production (built CSS — add when deploying)
```bash
# package.json — minimal, only for CSS build
{
  "scripts": {
    "build:css": "npx @tailwindcss/cli -i ./assets/css/input.css -o ./assets/css/output.css --minify",
    "dev:css": "npx @tailwindcss/cli -i ./assets/css/input.css -o ./assets/css/output.css --watch"
  }
}
```

```css
/* assets/css/input.css */
@import "tailwindcss";
@import "basecoat-css";
@import "./theme.css";
@import "./layout.css";
@import "./pages.css";
@import "./features.css";
@import "./pdf.css";
@import "./responsive.css";
@import "./print.css";
```

Then in production index.html, replace CDN scripts with:
```html
<link rel="stylesheet" href="/assets/css/output.css">
```

---

## TESTING CHECKLIST (per feature)

- [ ] Feature works as described
- [ ] Data persists after refresh
- [ ] No console errors
- [ ] All Lucide icons render
- [ ] Responsive at 1280px, 768px, 480px
- [ ] Basecoat components styled correctly
- [ ] All existing features still work
- [ ] Keyboard accessible (tab, enter, escape)
- [ ] Toast shown for state changes
- [ ] Edge cases: empty data, long text, special characters

---

## MIGRATION PRIORITY

**Step 1:** Split `app.js` into JS modules (keep everything working at each step)
**Step 2:** Split `main.css` into CSS modules
**Step 3:** Replace custom component CSS with Basecoat classes
**Step 4:** Add Basecoat CDN + Tailwind browser CDN to index.html
**Step 5:** Verify everything works
**Step 6:** Start building Phase 1 features from PRODUCT_SPEC.md

Do NOT build new features until migration is complete.
