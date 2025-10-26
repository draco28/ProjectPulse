---
name: moksha-git-workflow
description: Git branching and commit conventions for Moksha DevHub. Use when creating branches, committing code, or preparing pull requests. CRITICAL - never work on master branch.
triggers: ['git', 'branch', 'commit', 'pull request', 'git workflow', 'create branch']
token_estimate: 180
last_updated: 2025-10-26
related_docs:
  - ../../.agent/sops/git-workflow.md
---

# Moksha Git Workflow

## 🚨 CRITICAL RULE

**NEVER work directly on master branch!**

Always create a feature branch first.

## Quick Start

```bash
# 1. Start from updated master
git checkout master
git pull origin master

# 2. Create feature branch
git checkout -b api/feature-name       # For API changes
git checkout -b ui/feature-name        # For UI changes
git checkout -b feature/feature-name   # For mixed changes
git checkout -b fix/bug-description    # For bug fixes

# 3. Make changes and commit
git add .
git commit -m "feat: description"

# 4. Push
git push -u origin branch-name

# 5. Create PR on GitHub
```

## Branch Naming

| Type    | Pattern     | Example                  |
| ------- | ----------- | ------------------------ |
| API     | `api/*`     | `api/issues-endpoint`    |
| UI      | `ui/*`      | `ui/theme-system`        |
| Feature | `feature/*` | `feature/hybrid-search`  |
| Fix     | `fix/*`     | `fix/port-configuration` |
| Docs    | `docs/*`    | `docs/api-guide`         |

## Commit Messages

**Format**: `type(scope): description`

**Types**:

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting (no logic change)
- `refactor` - Code restructuring
- `test` - Adding/updating tests
- `chore` - Maintenance

**Examples**:

```bash
git commit -m "feat(api): add POST /api/issues endpoint"
git commit -m "fix(ui): correct search input padding"
git commit -m "docs: update API catalog"
git commit -m "test(api): add issue creation tests"
```

## Pre-Commit Checklist

Before EVERY commit:

```markdown
- [ ] On feature branch (NOT master)
- [ ] Code tested locally
- [ ] No debug code (console.log, etc.)
- [ ] No secrets in code
- [ ] Tests pass (if applicable)
- [ ] Linting passes
```

**Quick check**:

```bash
git branch  # Shows current branch with *
# Must NOT be: * master
```

## Common Workflows

**New Feature**:

```bash
git checkout master && git pull origin master
git checkout -b feature/new-feature
# ... make changes ...
git add .
git commit -m "feat: add new feature"
git push -u origin feature/new-feature
# Create PR on GitHub
```

**Bug Fix**:

```bash
git checkout master && git pull origin master
git checkout -b fix/bug-description
# ... fix bug ...
git add .
git commit -m "fix: resolve bug description"
git push -u origin fix/bug-description
# Create PR
```

**Update Branch from Master**:

```bash
# If master has moved ahead
git checkout master
git pull origin master
git checkout feature/your-branch
git merge master
# Resolve conflicts if any
git push
```

## Emergency: If on Master

**STOP! Don't commit!**

```bash
# Save work
git stash

# Create proper branch
git checkout -b feature/rescue

# Restore work
git stash pop

# Now commit normally
git add .
git commit -m "feat: description"
```

## Full Documentation

**Complete Git Guide**: [.agent/sops/git-workflow.md](../../.agent/sops/git-workflow.md)

- Detailed procedures
- Troubleshooting
- Git hooks
- Advanced workflows
- Merge conflict resolution
- PR best practices

---

**Token Cost**: ~180 tokens (vs ~3,200 in full guide)
**Coverage**: 95% of daily git operations
**When to Use Full Docs**: Conflicts, advanced merging, troubleshooting
