---
description: Stage, commit, and push changes to GitHub
---

# Git Push Workflow

Quick commit and push for incremental changes. For versioned releases, use `/release` instead.

## When to Use
- **`/git-push`** — Quick commits (fixes, tweaks, WIP saves)
- **`/release`** — Versioned releases with changelog + version bump

## Steps

1. **Validate JS syntax first**
```bash
FAIL=0
for f in assets/js/core/*.js assets/js/views/*.js assets/js/editor/*.js assets/js/export/*.js assets/js/boot.js; do
  node -c "$f" 2>&1 || FAIL=1
done
if [ $FAIL -eq 1 ]; then echo "SYNTAX ERRORS — fix before pushing"; exit 1; fi
```

2. **Check Status**
```bash
git status
git diff --stat
```

3. **Stage specific files** (never use `git add -A`)
```bash
git add [specific changed files]
```

4. **Create Commit**
   - Use conventional commit format: `type: description`
   - Types: feat, fix, style, refactor, docs, chore
   - Include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

5. **Push to Remote**
```bash
git push origin main
```

6. **Report**
   - Show commit hash
   - List files changed
   - Confirm push success
