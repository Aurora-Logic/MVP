# ProposalKit — Product Specification v1.0

> Last updated: February 2026  
> Company: Delta System  
> Stack: Vanilla HTML/CSS/JS · shadcn design language · Hosted SaaS  
> Status: Pre-launch

---

## PRODUCT IDENTITY

ProposalKit is a **hosted SaaS proposal builder** for freelancers, agencies, and studios. Users visit proposalkit.com, create an account (or start free), build professional proposals, and export polished PDFs — all from the browser.

### Core Philosophy
1. **Blazing fast.** No framework overhead. Vanilla JS. Instant interactions.
2. **Apple-level design.** shadcn aesthetic. Every pixel considered.
3. **Single purpose.** We build proposals. We do it better than anyone.
4. **Global-first.** Multi-currency, date formats, tax labels from day one.
5. **SaaS-ready.** Free tier → Paid tiers. Built for scale from the start.

### Target Users
- Solo freelancers (devs, designers, consultants, writers)
- Small agencies / studios (2–15 people)
- MSME service providers with international clients
- Anyone making proposals in Google Docs, Canva, or Word

### What We Compete With
- Google Docs (manual formatting)
- Canva templates (pretty but no pricing logic)
- Word templates (ugly, no calculations)
- NOT PandaDoc/Proposify (they're enterprise CRM platforms)

---

## WHAT WE WILL NEVER BUILD

| Feature | Why Not |
|---|---|
| NDA / Contract generator | Different product. Legal liability. |
| CRM / Pipeline management | Not our lane. Stay focused. |
| Full invoicing system | "Export as Invoice" is enough. |
| E-signature (DocuSign-level) | Their territory. We do acceptance blocks instead. |
| Payment processing | Not our lane. |
| Team chat / messaging | Not our lane. |
| Quote as separate doc type | Just use a proposal with fewer sections. |

---

## TECH STACK (Confirmed)

```
Language:     Vanilla HTML + CSS + JavaScript (single-file or modular)
Design:       shadcn design language (colors, spacing, typography, patterns)
              NOT the React component library — we replicate the aesthetic in vanilla CSS
Icons:        Lucide (via CDN)
Rich Text:    Editor.js (via CDN)
Storage:      localStorage (Phase 1) → Supabase/backend (Phase 5+)
Fonts:        Inter (body) + JetBrains Mono (monospace)
Hosting:      Vercel / Netlify / custom (static site initially)
PDF Export:   Browser print-to-PDF (current) → html2pdf.js or Puppeteer API (later)
```

### Why Vanilla JS?
- Zero build step. Deploy by copying a file.
- No framework churn. No breaking updates.
- Fastest possible load time.
- Full control over every interaction.
- shadcn aesthetic achieved through CSS variables, not React components.

---

## EXISTING FEATURES (Already Built)

### Core
- [x] Onboarding (2-step: company details + branding)
- [x] Dashboard (stats cards, filters, sorting, search ⌘K)
- [x] Proposal editor (5 tabs: Details / Sections / Pricing / Timeline / Notes)
- [x] Rich text editor (Editor.js) for section content
- [x] 4 PDF templates (Modern / Classic / Minimal / Tabular)
- [x] Cover page toggle + Draft/Invoice export modes
- [x] Preview panel with live template switching
- [x] Email composer (draft + copy to clipboard)

### Pricing & Finance
- [x] Line items (desc × qty × rate)
- [x] Tax (GST/VAT/Sales Tax — configurable label)
- [x] Discount (flat), 13 currencies, auto-calculated totals

### Organization
- [x] Client database + pick-from-editor
- [x] Section library (8 T&C clauses + custom save)
- [x] 4 templates (Blank / Web Dev / Design / Consulting)
- [x] Versioning (v1 → v2 → v3 with bump)
- [x] Milestone timeline, status workflow, internal notes

### Settings & UX
- [x] Company details, logo, brand color
- [x] Date/number/tax format configuration
- [x] Search, keyboard shortcuts, context menu
- [x] Drag-reorder sections, expiry warnings
- [x] Stats bar, autosave, toasts, responsive layout

---

## BUILD ROADMAP

---

### 🚀 PHASE 1 — Ship-Ready Polish
> **Goal:** Make it feel finished. No rough edges.  
> **Timeline:** 1–2 weeks  
> **Status:** MUST ship before launch.

#### 1.1 Auto-Save Indicator
- Topbar: `Saving...` → `Saved just now` → `Saved 2s ago` → `Saved 1m ago`
- 11px muted text. Updates every 10s. Subtle fade transitions.
- Wire into existing dirty() / persist() flow.

#### 1.2 Variables / Placeholders
- Syntax: `{{client.name}}`, `{{sender.company}}`, `{{today}}`, `{{proposal.number}}`, `{{proposal.total}}`, `{{valid_until}}`, `{{client.email}}`, `{{client.contact}}`
- Replace in preview/PDF only. Keep raw syntax in editor.
- "Insert Variable" dropdown near Editor.js and textareas.
- `replaceVariables(text, proposalData)` function called in buildPreview().

#### 1.3 Keyboard Shortcuts Panel
- `?` key opens modal overlay.
- Show: ⌘K search, ⌘N new, ⌘P preview, ⌘E export, Esc close.
- Grouped grid: Navigation, Editor, Actions.

#### 1.4 Proposal Completeness Score
- Progress ring or bar in stats bar: "78% complete"
- Checks: title, client name, 1+ section, 1+ line item, payment terms, valid-until, milestones.
- Red (<40%), Amber (40–70%), Green (>70%).
- Tooltip: "Add payment terms and a timeline to improve."

#### 1.5 Draft Watermark
- When status = draft: diagonal "DRAFT" watermark in preview/PDF.
- Light gray, 45° rotation, repeated. Auto-removed on sent/accepted.

#### 1.6 Empty States for Every Tab
- Pricing: "Add your first line item to build the quote."
- Timeline: "Add project phases to show clients your process."
- Notes: "Keep internal notes about this proposal."
- Each: relevant icon + description + single CTA button.

#### 1.7 Duplicate with Client Swap
- Duplicate modal: "Same client" or "Pick different client" (from client DB).
- Most-requested feature in proposal tools.

#### 1.8 Undo/Redo
- ⌘Z / ⌘⇧Z for editor changes.
- Simple state stack (last 20 states). Not per-field — whole proposal snapshot.

---

### 💰 PHASE 2 — Revenue Features
> **Goal:** Features that directly help users win more deals.  
> **Timeline:** Weeks 3–4  
> **Status:** HIGH priority. Users will pay for these.

#### 2.1 Pricing Packages (3-Tier)
- Toggle in Pricing tab: "Enable Package Pricing"
- 3 tiers: editable names (default: Starter / Professional / Enterprise)
- Each: name, price, feature list (✓ / — / ✕ per feature)
- "Recommended" badge on one package.
- Beautiful comparison cards in PDF (horizontal layout).
- Custom line items still allowed below packages.
- Data: `proposal.packages = [{ name, price, features: [{ text, included }], recommended }]`

#### 2.2 Optional Add-Ons
- Section below line items in Pricing tab.
- Each: description, price, selected checkbox.
- Total recalculates with selected add-ons.
- PDF: checkable list with prices.
- Data: `proposal.addOns = [{ desc, price, selected }]`

#### 2.3 Payment Schedule
- Sub-section in Pricing tab (or extend Timeline).
- Each milestone: name, amount OR percentage, due date, description.
- Progress bar showing payment distribution.
- Validation: must sum to 100% or total.
- PDF: clean table + visual bar.
- Data: `proposal.paymentSchedule = [{ name, amount, percentage, dueDate, desc }]`

#### 2.4 Expiry Reminders on Dashboard
- Banner at dashboard top: proposals expiring in 7 days.
- Each: title, client, days left, "Follow Up" button.
- Follow Up → opens email composer for that proposal.
- Dismissible (store in localStorage).

#### 2.5 Smart Pricing Insights
- Contextual banner in Pricing tab:
  - "Your avg web project: ₹1,20,000. This is ₹45,000 (62% below)."
  - "Proposals above ₹1L win 73% vs 45% under ₹50K."
- Only shows with 5+ proposals. Subtle, not intrusive.

---

### ⭐ PHASE 3 — Professional Edge
> **Goal:** Features that differentiate ProposalKit.  
> **Timeline:** Month 2  
> **Status:** Medium priority. Builds competitive moat.

#### 3.1 Win Rate Analytics
- Collapsible dashboard section.
- Stats: win rate %, pipeline value, avg proposal value, avg days-to-close, this month vs last.
- CSS bar charts (no external library).
- Filter: this month / 3 months / year / all time.

#### 3.2 Client Insights
- Click client card → modal/page with:
  - Proposals sent, accepted, declined, total value, avg response time.
  - Full proposal list for that client.
  - "Create Proposal for [Client]" button.

#### 3.3 Testimonial & Case Study Blocks
- New section types in library:
  - Testimonial: quote, client name, company, role, star rating.
  - Case Study: challenge → solution → result.
- Styled cards in PDF.

#### 3.4 Import Line Items from CSV
- Button: "Import from CSV" in Pricing tab.
- Paste CSV or upload file. Auto-parse columns.
- Preview table → confirm → import.

#### 3.5 Bulk Export
- Dashboard: checkbox on each row. "Export Selected" → multiple PDFs.

#### 3.6 Proposal Archive
- Soft-delete. "Archived" filter on dashboard. Restore button.

---

### ✨ PHASE 4 — Delight & Polish
> **Goal:** Small touches that create love.  
> **Timeline:** Month 3  
> **Status:** Low for launch, high for retention.

#### 4.1 Dark Mode
- Toggle in settings + system preference detection.
- Full theme via CSS variables. PDF preview stays light always.

#### 4.2 Full Brand Color Picker
- Hex/RGB input alongside preset swatches.
- Live preview on proposal.

#### 4.3 Save as Template
- "Save as Template" on any proposal.
- Appears in Create New modal. Edit/delete custom templates.

#### 4.4 What's New Modal
- After updates: highlight 3–4 features with icons.

#### 4.5 PWA / Installable
- Service worker + manifest.json.
- Install as desktop/mobile app. Full offline support.

---

### 📊 6-MONTH ROADMAP (Months 4–6)

#### 5.1 User Accounts & Cloud Sync (SaaS Foundation)
- **This is the big one.** Transition from localStorage to cloud.
- Supabase (or custom) backend:
  - User auth (email + Google sign-in)
  - Proposal storage in Postgres
  - Client database synced
  - Settings synced across devices
- localStorage remains as offline cache / fallback.
- Free tier: 5 proposals/month, 1 template
- Pro tier: unlimited proposals, all templates, analytics, priority export

#### 5.2 Shareable Proposal Links
- "Share" button → generates unique URL.
- Client opens → sees read-only, beautifully rendered proposal.
- Track: opened, time spent, which sections viewed.
- Show in editor: "Viewed 3 times. Last opened 2h ago."

#### 5.3 Digital Acceptance Block
- Bottom of shared proposal: "Type name to accept" + date field.
- Client types name → status auto-changes to "Accepted."
- Generates "Accepted" PDF with signature block filled.
- Not legally binding e-signature — formal acceptance.

#### 5.4 Proposal Scoring
- AI-free scoring based on best practices:
  - Cover page (+5), Timeline (+10), Testimonial (+10)
  - 3+ sections (+5), Payment terms (+5), Packages (+10)
- Score in dashboard + editor. "Improve this" suggestions.

#### 5.5 Advanced Analytics
- Revenue forecasting: "Expected revenue this quarter: ₹X"
- Win rate by: template, value range, client, month.
- Export analytics as PDF report.

#### 5.6 Section Template Packs
- Pre-built: "SaaS Pack", "Agency Pack", "Consulting Pack"
- 8–10 professionally written sections each.
- Selectable in onboarding or settings.

---

### 🏢 1-YEAR ROADMAP (Months 7–12)

#### 6.1 Team / Multi-User
- Invite team members (Admin / Member roles).
- Shared client database and templates.
- Team branding on all proposals.
- Activity feed: "Virag created a proposal for Acme Corp."

#### 6.2 AI Writing Assistant
- "Help me write this" button per section.
- Generates content from: title, client industry, section type.
- Anthropic API (user key or ProposalKit subscription).
- Always optional, never required.

#### 6.3 Integrations
- Zapier / Make webhooks (proposal accepted → trigger).
- Google Drive (save PDFs directly).
- Slack notifications (status changes).
- Notion export.

#### 6.4 White-Label Mode (Premium)
- Remove ProposalKit branding entirely.
- Custom domain for shared proposal links.
- Agency feature — give clients a branded experience.

#### 6.5 Proposal Comparison
- Side-by-side diff view: v1 vs v2.
- Highlight what changed between versions.

#### 6.6 Multi-Document Derivatives
- Proposal → convert to:
  - Receipt (with "PAID" stamp)
  - Executive Summary (1-page auto-generated)
- Same data, different output format.

---

## PRICING TIERS (Planned)

| | Free | Pro | Team |
|---|---|---|---|
| Price | $0 | $12/mo | $29/mo |
| Proposals | 5/month | Unlimited | Unlimited |
| PDF Templates | 2 | 4 | 4 + custom |
| Clients | 10 | Unlimited | Unlimited |
| Shareable Links | ✕ | ✓ | ✓ |
| Analytics | Basic | Full | Full |
| Team Members | 1 | 1 | 5 |
| AI Assistant | ✕ | ✓ | ✓ |
| White Label | ✕ | ✕ | ✓ |
| Support | Community | Email | Priority |

---

## DATA ARCHITECTURE

### localStorage Keys (Phase 1–4)
```
pk_config      → Settings & preferences
pk_db          → All proposals
pk_clients     → Client database
pk_templates   → User-saved templates
pk_seclib      → Custom section library
pk_archived    → Soft-deleted proposals
pk_dismissed   → Dismissed reminder alerts
```

### Cloud Schema (Phase 5+)
```sql
users          → id, email, name, plan, created_at
proposals      → id, user_id, data (JSONB), status, created_at, updated_at
clients        → id, user_id, name, contact, email, phone
templates      → id, user_id, name, data (JSONB)
shared_links   → id, proposal_id, token, view_count, last_viewed
analytics      → id, user_id, month, data (JSONB)
```

### Full Proposal Object
```javascript
{
  id: "p1707...",
  status: "draft",              // draft | sent | accepted | declined
  title: "Web Dev Proposal",
  number: "PROP-001",
  date: "2026-02-08",
  validUntil: "2026-03-10",
  sender: { company, email, address },
  client: { name, contact, email, phone },
  sections: [{ title, content }],           // content = EditorJS JSON
  lineItems: [{ desc, qty, rate }],
  packages: [{ name, price, features, recommended }],
  addOns: [{ desc, price, selected }],
  paymentSchedule: [{ name, amount, percentage, dueDate, desc }],
  currency: "₹",
  paymentTerms: "...",
  discount: 0,
  taxRate: 18,
  milestones: [{ name, duration, desc }],
  version: 1,
  coverPage: false,
  notes: [{ text, time, type }],
  createdAt: 1707...
}
```

---

## SUCCESS METRICS

| Timeframe | Metric | Target |
|---|---|---|
| Launch week | Unique visitors | 500 |
| Launch week | Proposals created | 50 |
| Month 1 | Active users | 200 |
| Month 3 | Active users | 1,000 |
| Month 6 | MAU | 5,000 |
| Month 6 | Paying users | 100 |
| Year 1 | MAU | 20,000 |
| Year 1 | ARR | $50K |
