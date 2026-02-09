---
name: UI Design System
description: Guidelines for maintaining consistent UI design in ProposalKit
---

# UI Design Skill

## Purpose
Ensure consistent, modern, and accessible UI design across ProposalKit.

## Design Principles

### 1. Color Palette
- Use CSS custom properties from `variables.css`
- Support both light and dark themes
- Primary accent: Use `--primary` variable
- Maintain WCAG AA contrast ratios

### 2. Typography
- **Headings**: Inter (600-800 weight)
- **Body**: Inter (400-500 weight)
- **Code**: JetBrains Mono
- Base size: 16px, scale: 1.25

### 3. Spacing
- Use 4px base unit (4, 8, 12, 16, 24, 32, 48px)
- Consistent padding: 16px for cards, 8px for buttons
- Gap between elements: 8-16px

### 4. Components
- Buttons: `.btn`, `.btn-sm`, `.btn-outline`
- Cards: Rounded corners (8px), subtle shadows
- Forms: Clear labels, visible focus states
- Modals: Centered, overlay backdrop

## Implementation Checklist

- [ ] Check `variables.css` for existing tokens
- [ ] Test in both light and dark mode
- [ ] Verify responsive behavior
- [ ] Ensure keyboard accessibility
- [ ] Add appropriate hover/focus states

## Common Patterns

### Button with Icon
```html
<button class="btn-sm">
    <i data-lucide="plus"></i>
    <span>Add Item</span>
</button>
```

### Card Component
```html
<div class="card">
    <div class="card-header">Title</div>
    <div class="card-body">Content</div>
</div>
```

### Form Input
```html
<div class="form-group">
    <label class="form-label">Field Name</label>
    <input class="form-input" type="text" />
</div>
```
