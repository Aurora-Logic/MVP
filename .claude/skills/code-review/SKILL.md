---
name: Code Review
description: Checklist for reviewing code changes in ProposalKit
---

# Code Review Skill

## Purpose
Ensure code quality and consistency before committing changes.

## Review Checklist

### 1. Functionality
- [ ] Feature works as expected
- [ ] Edge cases handled
- [ ] No console errors
- [ ] Works in both themes

### 2. Code Quality
- [ ] Clear, descriptive function names
- [ ] Adequate comments for complex logic
- [ ] No duplicate code (DRY principle)
- [ ] Consistent code style

### 3. HTML
- [ ] Semantic elements used (`<nav>`, `<main>`, `<section>`)
- [ ] Proper ARIA attributes where needed
- [ ] All interactive elements have IDs
- [ ] Images have alt attributes

### 4. CSS
- [ ] Uses existing CSS variables
- [ ] Mobile-responsive
- [ ] No magic numbers (use variables)
- [ ] Dark mode compatible

### 5. JavaScript
- [ ] Syntax validated: `node -c file.js`
- [ ] Functions are modular
- [ ] Error handling in place
- [ ] Event listeners cleaned up

### 6. Performance
- [ ] No unnecessary DOM queries in loops
- [ ] Debounce rapid events (resize, scroll)
- [ ] Lazy load heavy resources
- [ ] Uses event delegation where appropriate

### 7. Security
- [ ] User input sanitized
- [ ] No sensitive data in localStorage
- [ ] External URLs validated

## Quick Commands

```bash
# Validate all JavaScript
for f in assets/js/**/*.js assets/js/boot.js; do node -c "$f" && echo "✓ $f"; done

# Count lines changed
git diff --stat

# Preview changes
git diff --color
```
