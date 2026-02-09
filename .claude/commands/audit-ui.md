---
description: Audit UI for inconsistencies across the application
---

# UI Consistency Audit

Perform a comprehensive UI audit to identify visual inconsistencies.

## Steps

1. **Check CSS Variables Usage**
   - Ensure all colors use CSS variables from `variables.css`
   - Look for hardcoded color values

2. **Verify Component Consistency**
   - Buttons should use consistent classes
   - Cards should have uniform styling
   - Forms should follow the same pattern

3. **Review Responsive Behavior**
   - Test at 320px, 768px, 1024px, 1440px widths
   - Verify mobile navigation works
   - Check for horizontal overflow

4. **Theme Compatibility**
   - Test in both light and dark mode
   - Ensure sufficient contrast ratios
   - Verify all elements adapt to theme

5. **Report Findings**
   - List all inconsistencies found
   - Prioritize by severity
   - Suggest specific fixes

## Files to Review
- `assets/css/variables.css` - Color tokens
- `assets/css/components.css` - Component styles
- `assets/css/responsive.css` - Breakpoints
- `index.html` - Main app structure
