# UI/UX Improvement Roadmap

This document outlines key areas for elevating the user experience and visual polish of the Proposal Builder application.

## 1. Interaction Polish ✨
- **Drag & Drop**: Implement smoother animations for reordering sections. Currently using native drag-and-drop which can feel stiff.
  - *Recommendation*: Add transistion classes during `dragover`.
- **Micro-Interactions**: Add subtle scale/lift effects on hover for cards and primary buttons (`transform: translateY(-1px)`).
- **Toast Notifications**: Replace `alert()` dialogs with non-blocking toast notifications (e.g., "Saved successfully", "Item deleted") positioned at the bottom-right.

## 2. Empty States 📭
- **Line Items**: Instead of a blank table, show a friendly empty state illustration with a "Add your first item" call-to-action.
- **Sections**: When no customized sections exist, guide the user to the "Library" or "Add Section" buttons with visual cues.

## 3. Loading Experience ⏳
- **Skeleton Screens**: Replace loading spinners with skeleton UI (grey pulse blocks) for the proposal list and editor sections to reduce perceived load time.
- **Editor Initialization**: Fade in EditorJS instances (`opacity: 0` -> `1`) once fully loaded to prevent content jumping/layout shift.

## 4. UX & Layout Strategy 🧠

### A. Focus Execution (Editor)
- **Floating Outline**: Add a sticky "Table of Contents" on the right sidebar to jump instantly between Cover, Executive Summary, Scope, Pricing, and Terms.
- **Section Visibility**: Ensure section icons in the left sidebar/reorder list are **always visible** (not just on hover) to improve scanability and quick recognition of document structure.
- **Distraction-Free**: A toggle to collapse all sidebars and chrome, letting the user focus purely on writing.

### B. Dashboard Flow
- **Lifecycle Stages**: Organize proposals into "Draft", "Sent", "Won" columns (Kanban view) rather than a simple list to track progress better.
- **"Resume Work"**: A prominent card at the top showing the *last edited proposal* with a one-click "Edit" button.

### C. Creation Discovery
- **Visual Template Picker**: Show *thumbnails* of styles (Modern, Classic, Minimal) during creation so users know what they are choosing.
- **Smart Defaults**: Pre-fill client details if a past client is selected.

## 5. Visual Consistency 🎨
- **Typography Scale**: Standardize body text to 14px and secondary text to 13px.
- **Iconography**: Use consistent stroke width (1.5px) for all Lucide icons.
- **Input States**: Add clear visual distinctions for `:focus` states using a colored ring (e.g., `box-shadow: 0 0 0 2px var(--primary)`).
- **Dark Mode Contrast**: Audit dark mode colors to ensure sufficient contrast ratios for text elements.

## 6. Performance ⚡
- **Lazy Loading**: Lazy load heavy components like the "Terms Library" or "Icon Set" until requested by the user.
- **Debounced Inputs**: Ensure all text inputs (title, notes) have proper debouncing (300ms) before triggering autosave to prevent lag.
