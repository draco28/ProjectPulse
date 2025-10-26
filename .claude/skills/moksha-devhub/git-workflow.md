---
name: moksha-git-workflow
description: Conventional commits, feature branches, PR flow for Moksha DevHub. Use when working with git operations, creating branches, or committing changes.
triggers: ['git', 'branch', 'commit', 'merge', 'pull request', 'pr', 'push', 'checkout']
token_estimate: 180
last_updated: 2025-10-26
related_docs:
  - ../../.agent/sops/git-workflow.md
---

# Git Workflow (Moksha DevHub)

## Branch Strategy

**Main Branches:**

- `master` - Production-ready code
- Feature branches: `feature/<name>` or `ui/<name>`

**Naming:**

- `feature/add-search` - New features
- `fix/port-config` - Bug fixes
- `ui/theme-foundation` - UI work
- `docs/update-readme` - Documentation

## Commit Conventions

**Format**: `type(scope): description`

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

**Examples:**

```bash
feat(api): Add POST /api/issues endpoint
fix(ui): Resolve hydration error in IssueCard
docs(readme): Update installation instructions
refactor(db): Optimize Prisma queries
test(e2e): Add Playwright tests for Issues page
```

## Workflow Steps

**1. Create Branch:**

```bash
git checkout master
git pull origin master
git checkout -b feature/your-feature
```

**2. Make Changes:**

```bash
# Edit files
pnpm type-check   # Check TypeScript
pnpm lint         # Check linting
pnpm test         # Run tests
```

**3. Commit:**

```bash
git add .
git commit -m "feat(scope): description

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**4. Push & PR:**

```bash
git push -u origin feature/your-feature
# Create PR on GitHub
```

## Quality Gates

**Before committing:**

- ✅ TypeScript: Zero errors
- ✅ Lint: Zero warnings
- ✅ Tests: All passing
- ✅ Build: Success

**Commands:**

```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
```

## Common Operations

**Switch branches:**

```bash
git checkout master
git checkout feature/other-feature
```

**Update from master:**

```bash
git checkout master
git pull origin master
git checkout feature/your-feature
git merge master
```

**Stash changes:**

```bash
git stash
git stash pop
```

## See Also

**Full guide**: [.agent/sops/git-workflow.md](../../.agent/sops/git-workflow.md) - Complete workflow with PR guidelines

---

**Token Cost**: ~180 tokens
**When to Load**: Git operations, branching, committing
