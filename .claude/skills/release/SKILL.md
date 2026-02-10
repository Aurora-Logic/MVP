---
name: Release
description: Validate, version bump, changelog, commit, and push — one command
---

# Release Skill

Automated release workflow for ProposalKit. Validates code, bumps version, updates changelog, commits, and pushes.

## When to Use
Run `/release` after completing a batch of work to ship it properly.

## Arguments
- `/release` — Auto-detect changes and create a release
- `/release patch` — Bump minor version (2.3 → 2.4)
- `/release major` — Bump major version (2.3 → 3.0)

## Release Workflow

### Step 1: Validate All JS Files
Run `node -c` on every JS file in `assets/js/`. Stop if any fail.

```bash
FAIL=0
for f in assets/js/core/*.js assets/js/views/*.js assets/js/editor/*.js assets/js/export/*.js assets/js/boot.js; do
  node -c "$f" 2>&1 || FAIL=1
done
if [ $FAIL -eq 1 ]; then echo "SYNTAX ERRORS — fix before releasing"; exit 1; fi
```

### Step 2: Detect Changes
Run `git diff --stat` and `git status` to understand what changed. Categorize:
- **feat:** New features or capabilities
- **fix:** Bug fixes
- **style:** UI/CSS-only changes
- **refactor:** Code restructuring without behavior change
- **docs:** Documentation updates
- **chore:** Config, skills, tooling changes

### Step 3: Bump Version
Read current version from `assets/js/boot.js`:
- `APP_VERSION` — semver-ish string (e.g., '2.3')
- `APP_BUILD` — date string YYYYMMDD (e.g., '20260210')

Bump rules:
- **patch** (default): Increment minor (2.3 → 2.4)
- **major**: Increment major, reset minor (2.3 → 3.0)

Update `APP_BUILD` to today's date (YYYYMMDD).

### Step 4: Update What's New
If there are user-facing features, update `WHATS_NEW_ITEMS` in boot.js with the top 3-5 changes. Each item: `{ icon, title, desc }`. Use Lucide icon names.

Only update What's New for **feature releases** (feat commits). Skip for fix/style/refactor/chore.

### Step 5: Update CHANGELOG.md
Prepend a new entry to `/Users/virag/Downloads/MVP/CHANGELOG.md`:

```markdown
## v{VERSION} (build {BUILD}) — {YYYY-MM-DD}

### {Category}
- {Change description}

### Files Changed
- `file1.js` — {what changed}
- `file2.css` — {what changed}
```

### Step 6: Update Version in Settings
The settings page shows version in footer via `APP_VERSION` and `APP_BUILD` from boot.js. No separate update needed — it reads the constants directly.

### Step 7: Commit
Stage all changed files (be specific, don't use `git add -A`):
```bash
git add [specific files]
git commit -m "v{VERSION} (build {BUILD}): {summary}

{bullet list of changes}

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Step 8: Push
```bash
git push
```

### Step 9: Report
Output a summary:
```
Released v{VERSION} (build {BUILD})
  {N} files changed
  {commit hash}
  Pushed to origin/main
```

## Important Rules
- NEVER release with syntax errors
- ALWAYS validate before committing
- ALWAYS update CHANGELOG.md
- ALWAYS use specific file staging (not `git add -A`)
- ALWAYS include `Co-Authored-By` in commit
- Keep commit messages under 72 chars for the first line
- Build number is always today's date YYYYMMDD
- If multiple releases on the same day, just increment the version
