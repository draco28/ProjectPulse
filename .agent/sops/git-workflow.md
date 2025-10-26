# SOP: Git Workflow & Branch Management

## Purpose

Standard Git workflow for Moksha DevHub to prevent common mistakes, maintain clean history, and ensure code quality through proper branching strategy.

## When to Use

- **Before starting ANY new feature or fix** (CRITICAL)
- Creating new branches
- Committing changes
- Pushing code
- Creating pull requests

## Critical Rules

### 🚨 NEVER Work on Master Branch

**Master branch is protected. ALL work must happen on feature branches.**

**Why**:

- Prevents accidental commits to master
- Allows code review before merging
- Maintains stable master branch
- Enables easy rollback if needed

---

## Standard Workflow

### Step 1: Start From Updated Master

**ALWAYS do this before creating a new branch:**

```bash
# 1. Check current branch
git branch
# Shows: * ui/theme-foundation (example)

# 2. Switch to master
git checkout master

# 3. Pull latest changes
git pull origin master

# 4. Verify you're up to date
git status
# Should show: "Your branch is up to date with 'origin/master'"
```

**Critical**: Skipping this causes merge conflicts later!

### Step 2: Create Feature Branch

Use semantic branch naming:

```bash
# For API/Backend changes
git checkout -b api/feature-name

# For UI/Frontend changes
git checkout -b ui/feature-name

# For mixed changes (API + UI)
git checkout -b feature/feature-name

# For bug fixes
git checkout -b fix/issue-description

# For documentation
git checkout -b docs/doc-description
```

**Examples**:

```bash
git checkout -b api/issues-endpoint
git checkout -b ui/theme-foundation
git checkout -b feature/hybrid-search
git checkout -b fix/port-configuration
git checkout -b docs/api-documentation
```

### Step 3: Make Changes & Commit

**Follow conventional commit format:**

```bash
# Stage changes
git add [files]

# Commit with semantic message
git commit -m "type(scope): description"
```

**Commit Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples**:

```bash
git commit -m "feat(api): add POST /api/issues endpoint"
git commit -m "fix(ui): correct search input padding"
git commit -m "docs: update API catalog"
git commit -m "refactor(db): optimize issue query"
git commit -m "test(api): add issue creation tests"
```

### Step 4: Push to Remote

**First push (creates remote branch)**:

```bash
git push -u origin [branch-name]
```

**Subsequent pushes**:

```bash
git push
```

**Example**:

```bash
git push -u origin ui/theme-foundation
# Later:
git push
```

### Step 5: Create Pull Request

**Never merge directly to master!**

```bash
# Use GitHub CLI (if available)
gh pr create --base master --head [branch-name] --title "Title" --body "Description"

# Or create PR on GitHub web interface
```

**PR Template**:

```markdown
## Summary

[Brief description of changes]

## Changes

- [Change 1]
- [Change 2]

## Testing

- [ ] Manual testing completed
- [ ] Tests pass
- [ ] No console errors

## Related

Closes #[issue-number]
```

---

## Branch Naming Conventions

### Format: `type/description`

### Types

#### `api/*` - Backend/API Changes

When to use:

- New API endpoints
- API modifications
- Server Actions
- Database queries
- Prisma schema changes

Examples:

- `api/issues-crud`
- `api/search-endpoint`
- `api/user-authentication`

#### `ui/*` - Frontend/UI Changes

When to use:

- React components
- UI styling
- Theme changes
- Client-side logic (no API changes)

Examples:

- `ui/theme-foundation`
- `ui/issue-list-component`
- `ui/responsive-design`

#### `feature/*` - Mixed Changes

When to use:

- Full-stack features (API + UI)
- Multiple system components
- Complex integrations

Examples:

- `feature/hybrid-search`
- `feature/issue-tracking`
- `feature/mcp-integration`

#### `fix/*` - Bug Fixes

When to use:

- Fixing bugs
- Correcting errors
- Resolving issues

Examples:

- `fix/port-configuration`
- `fix/search-pagination`
- `fix/authentication-error`

#### `docs/*` - Documentation

When to use:

- Documentation updates
- README changes
- Comment additions
- Architecture docs

Examples:

- `docs/api-catalog`
- `docs/setup-guide`
- `docs/architecture-update`

#### `refactor/*` - Refactoring

When to use:

- Code restructuring
- Performance optimization
- No behavior change

Examples:

- `refactor/search-module`
- `refactor/component-structure`

#### `test/*` - Testing

When to use:

- Adding tests
- Updating test suites
- Test infrastructure

Examples:

- `test/api-endpoints`
- `test/e2e-setup`

---

## Pre-Commit Checklist

**Before EVERY commit, verify:**

- [ ] On feature branch (NOT master)
- [ ] Code changes are intentional
- [ ] No debug code (`console.log`, commented code)
- [ ] No secrets in code (API keys, passwords)
- [ ] Tests pass (if applicable)
- [ ] Linting passes
- [ ] Build succeeds

**Quick verification**:

```bash
# Check branch
git branch
# Should show: * feature/your-branch (NOT * master)

# Check status
git status

# Run tests
pnpm test

# Run linter
pnpm lint

# Build
pnpm build
```

---

## Common Workflows

### Workflow 1: New Feature

```bash
# 1. Update master
git checkout master
git pull origin master

# 2. Create feature branch
git checkout -b feature/new-feature

# 3. Make changes...
# Edit files...

# 4. Commit
git add .
git commit -m "feat: add new feature"

# 5. Push
git push -u origin feature/new-feature

# 6. Create PR on GitHub
```

### Workflow 2: Bug Fix

```bash
# 1. Update master
git checkout master
git pull origin master

# 2. Create fix branch
git checkout -b fix/bug-description

# 3. Fix bug...
# Edit files...

# 4. Commit
git add .
git commit -m "fix: resolve bug description"

# 5. Push
git push -u origin fix/bug-description

# 6. Create PR
```

### Workflow 3: Updating Branch with Master Changes

**If master has moved ahead while you're working:**

```bash
# 1. Commit or stash current work
git add .
git commit -m "wip: work in progress"
# OR
git stash

# 2. Get latest master
git checkout master
git pull origin master

# 3. Return to feature branch
git checkout feature/your-branch

# 4. Merge or rebase master changes
git merge master
# OR (cleaner history)
git rebase master

# 5. Resolve conflicts if any
# Edit conflicted files...
git add .
git rebase --continue  # If rebasing
# OR
git commit  # If merging

# 6. Push (may need force push after rebase)
git push
# OR
git push --force-with-lease  # After rebase
```

### Workflow 4: Abandoning Changes

**If you want to discard work on a branch:**

```bash
# 1. Switch to master
git checkout master

# 2. Delete local branch
git branch -D feature/abandoned-branch

# 3. Delete remote branch (if pushed)
git push origin --delete feature/abandoned-branch
```

---

## Verification

### Check Current Branch

```bash
git branch
# * feature/your-branch  ← You're here
#   master
```

**Visual indicators**:

- `*` shows current branch
- Should NEVER be on `* master` while coding

### Check Branch Status

```bash
git status
```

**Good output**:

```
On branch feature/your-branch
Your branch is up to date with 'origin/feature/your-branch'.

nothing to commit, working tree clean
```

**Bad output** (if on master):

```
On branch master  ← ❌ WRONG! Don't work here
```

### Check Commit History

```bash
git log --oneline -10
```

Shows recent commits to verify you're in the right place.

---

## Troubleshooting

### Issue: Accidentally Committed to Master

**Symptom**: Made commits on master branch

**Solution**:

```bash
# 1. Create branch from current state
git checkout -b feature/rescue-branch

# 2. Go back to master
git checkout master

# 3. Reset master to origin
git reset --hard origin/master

# 4. Return to your work
git checkout feature/rescue-branch

# 5. Continue from here
```

### Issue: Forgot to Create Branch

**Symptom**: Made changes but still on master (uncommitted)

**Solution**:

```bash
# 1. Stash changes
git stash

# 2. Create proper branch
git checkout -b feature/proper-branch

# 3. Apply stashed changes
git stash pop

# 4. Commit normally
git add .
git commit -m "feat: your changes"
```

### Issue: Wrong Branch Name

**Symptom**: Created branch with wrong name

**Solution**:

```bash
# Rename current branch
git branch -m new-correct-name

# If already pushed, update remote
git push origin -u new-correct-name
git push origin --delete old-wrong-name
```

### Issue: Merge Conflicts

**Symptom**: `git merge` or `git rebase` shows conflicts

**Solution**:

```bash
# 1. See conflicted files
git status

# 2. Edit each file, resolve conflicts
# Look for:
# <<<<<<< HEAD
# Your changes
# =======
# Their changes
# >>>>>>> master

# 3. Mark as resolved
git add [resolved-file]

# 4. Continue merge/rebase
git rebase --continue  # If rebasing
# OR
git commit  # If merging
```

### Issue: Pushed to Master by Accident

**Symptom**: Pushed commits to master branch

**⚠️ CRITICAL**: Don't force push to master if others use it!

**Solution**:

```bash
# 1. Contact team immediately
# 2. Create PR to revert changes
# 3. Review with team before reverting

# If you're SURE it's safe:
git revert [commit-hash]
git push origin master
```

---

## Git Hooks (Optional)

### Prevent Master Commits

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

branch="$(git rev-parse --abbrev-ref HEAD)"

if [ "$branch" = "master" ]; then
    echo "❌ ERROR: Cannot commit directly to master!"
    echo "Create a feature branch first:"
    echo "  git checkout -b feature/your-feature"
    echo ""
    echo "See: .agent/sops/git-workflow.md"
    exit 1
fi
```

Make executable:

```bash
chmod +x .git/hooks/pre-commit
```

### Prevent Master Push

Create `.git/hooks/pre-push`:

```bash
#!/bin/bash

protected_branch='master'
current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')

if [ $current_branch = $protected_branch ]; then
    echo "❌ ERROR: Cannot push directly to master!"
    echo "Use pull requests instead."
    exit 1
fi
```

Make executable:

```bash
chmod +x .git/hooks/pre-push
```

---

## Best Practices

### 1. Small, Focused Commits

✅ **Good**:

```bash
git commit -m "feat(api): add issue validation"
git commit -m "feat(api): add issue creation endpoint"
git commit -m "test(api): add issue creation tests"
```

❌ **Bad**:

```bash
git commit -m "implement entire issue feature"  # Too big
```

### 2. Meaningful Commit Messages

✅ **Good**:

```bash
git commit -m "fix(ui): correct search input padding to prevent icon overlap"
```

❌ **Bad**:

```bash
git commit -m "fix stuff"
git commit -m "wip"
git commit -m "update"
```

### 3. Branch per Feature

✅ **Good**:

- `feature/issue-tracking` - Complete issue feature
- `fix/search-bug` - Single bug fix

❌ **Bad**:

- `my-work` - Vague, multiple features
- `updates` - No context

### 4. Pull Before Push

**Always**:

```bash
git pull origin [branch]
git push
```

**Prevents**: "Updates were rejected" errors

### 5. Clean Up Merged Branches

**After PR is merged**:

```bash
# Delete local branch
git branch -d feature/merged-branch

# Delete remote branch (if not auto-deleted)
git push origin --delete feature/merged-branch

# Clean up remote tracking branches
git fetch --prune
```

---

## Related Documentation

- [WORKFLOW_ARCHITECTURE.md](../../docs/WORKFLOW_ARCHITECTURE.md) - Complete workflow
- [GitHub Flow](https://guides.github.com/introduction/flow/) - Branching model
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit format

## Quick Reference

### Daily Workflow

```bash
# Morning: Update master
git checkout master
git pull origin master

# Start work: Create branch
git checkout -b feature/new-work

# During work: Commit often
git add .
git commit -m "feat: description"

# End of day: Push
git push -u origin feature/new-work

# When done: Create PR on GitHub
```

### Emergency: If on Master

```bash
# STOP! Don't commit!
git stash  # Save work
git checkout -b feature/rescue  # Create branch
git stash pop  # Restore work
# Now commit normally
```

---

**Last Updated**: 2025-10-26
**Priority**: CRITICAL - Check branch BEFORE every commit
**Created From**: CLAUDE.md golden rules + WORKFLOW_ARCHITECTURE.md
