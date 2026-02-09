---
description: Stage, commit, and push changes to GitHub
---

# Git Push Workflow

Stage, commit, and push all changes to GitHub.

## Steps

1. **Check Status**
```bash
git status
```

2. **Review Changes**
```bash
git diff --stat
```

3. **Stage All Changes**
```bash
git add -A
```

4. **Create Commit**
   - Ask user for commit message if not provided
   - Use conventional commit format: `type(scope): description`
   - Types: feat, fix, style, refactor, docs, chore

```bash
git commit -m "type(scope): description"
```

5. **Push to Remote**
```bash
git push origin main
```

6. **Confirm Success**
   - Show the commit hash
   - Confirm push was successful
