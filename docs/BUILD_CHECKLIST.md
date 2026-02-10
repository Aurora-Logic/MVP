# ProposalKit — Build Checklist

> Quick reference. See PRODUCT_SPEC.md for full details.
> Check off items as you build them.

---

## ✅ ALREADY BUILT
- [x] Onboarding (2-step)
- [x] Dashboard (stats, filters, sorting, search)
- [x] Editor (Details / Sections / Pricing / Timeline / Notes)
- [x] Rich text (Editor.js)
- [x] 4 PDF templates (Modern / Classic / Minimal / Tabular)
- [x] Cover page toggle
- [x] Proposal + Invoice PDF export
- [x] Preview panel + template switching
- [x] Email composer
- [x] Line items, tax, discount, 13 currencies
- [x] Client database + picker
- [x] Section library + T&C library
- [x] 4 proposal templates
- [x] Versioning, milestones, status workflow
- [x] Notes, expiry warnings, stats bar
- [x] Date/number/tax format settings
- [x] Search, shortcuts, context menu, drag-reorder
- [x] Autosave, toasts, responsive
- [x] Client portal / shareable proposal links

---

## 🚀 PHASE 1 — Ship-Ready Polish ✅ COMPLETE
- [x] 1.1 Auto-save indicator (topbar badge) — `autosave.js`
- [x] 1.2 Variables / placeholders ({{client.name}}) — `variables.js`
- [x] 1.3 Keyboard shortcuts panel (? to open) — `shortcuts.js`
- [x] 1.4 Proposal completeness score (progress ring) — `completeness.js`
- [x] 1.5 Draft watermark (diagonal DRAFT on PDF) — `preview.js`
- [x] 1.6 Empty states for every tab — all tab renderers
- [x] 1.7 Duplicate with client swap — `create.js`
- [x] 1.8 Undo/redo (⌘Z / ⌘⇧Z) — `autosave.js`

## 💰 PHASE 2 — Revenue Features ✅ COMPLETE
- [x] 2.1 Pricing packages (3-tier comparison) — `packages.js`
- [x] 2.2 Optional add-ons (checkbox items) — `addons.js`
- [x] 2.3 Payment schedule (milestone-based payments) — `payment-schedule.js`
- [x] 2.4 Expiry reminders dashboard banner — `dashboard.js`
- [x] 2.5 Smart pricing insights — `pricing.js`

## ⭐ PHASE 3 — Professional Edge (Month 2) ✅ COMPLETE
- [x] 3.1 Win rate analytics (dashboard section) — `analytics.js`
- [x] 3.2 Client insights (history per client) — `clients.js`
- [x] 3.3 Testimonial & case study section types — `structured-sections.js`
- [x] 3.4 Import line items from CSV — `csv-import.js`
- [x] 3.5 Bulk export (multi-select PDFs) — `export.js`
- [x] 3.6 Proposal archive (soft-delete) — `create.js` + `dashboard.js`

## ✨ PHASE 4 — Delight (Month 3) ✅ COMPLETE
- [x] 4.1 Dark mode — `theme.js`
- [x] 4.2 Full brand color picker — `settings.js`
- [x] 4.3 Save as template (section library) — `sections.js`
- [x] 4.4 What's new modal — `boot.js`
- [x] 4.5 PWA / installable app — `sw.js`, `manifest.json`

## 📊 6-MONTH (Months 4–6)
- [ ] 5.1 User accounts + cloud sync (Supabase)
- [x] 5.2 Shareable proposal links — `create.js`
- [x] 5.3 Digital acceptance block — `client.html`, `preview.js`, `sharing.js`
- [x] 5.4 Proposal scoring system — `completeness.js`
- [x] 5.5 Advanced analytics + forecasting — `analytics-breakdowns.js`, `analytics.js`
- [x] 5.6 Section template packs — `section-packs.js`

## 🏢 1-YEAR (Months 7–12) ✅ COMPLETE (except cloud sync)
- [x] 6.1 Team / multi-user — `team.js`
- [x] 6.2 AI writing assistant — `ai-assistant.js`
- [x] 6.3 Integrations (Markdown, CSV, HTML, Webhook) — `integrations.js`
- [x] 6.4 White-label mode — `settings.js`, `nav.js`, `boot.js`
- [x] 6.5 Proposal comparison (diff view) — `diff-view.js`
- [x] 6.6 Multi-document derivatives (SOW, Contract, Receipt) — `derivatives.js`

---

## TOTAL FEATURES: 31
- Phase 1: 8 features ✅ COMPLETE
- Phase 2: 5 features ✅ COMPLETE
- Phase 3: 6 features ✅ COMPLETE
- Phase 4: 5 features ✅ COMPLETE
- 6-month: 6 features (5 done, 1 remaining — 5.1 accounts/cloud)
- 1-year: 6 features ✅ COMPLETE
- **30 of 31 features complete** — Only 5.1 (Cloud Sync) remains
