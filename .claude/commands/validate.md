---
description: Validate all JavaScript files for syntax errors
---

# JavaScript Validation

Run syntax validation on all JavaScript files in the project.

## Steps

1. Navigate to the project directory
2. Run syntax check on all JS files:

```bash
cd /Users/virag/Downloads/MVP
for f in assets/js/**/*.js assets/js/boot.js; do
    node -c "$f" 2>&1 || echo "FAILED: $f"
done
```

3. Report any files with errors
4. Suggest fixes for common syntax issues
