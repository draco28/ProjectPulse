---
name: Git Workflow Best Practices (DevHub)
description: Professional Git branching strategy, commit conventions, and collaboration workflow for ProjectPulse
category: git-collaboration
version: 1.0
project: ProjectPulse (AI_HUB)
---

# Git Workflow Best Practices

## Overview

This skill provides comprehensive Git workflow guidance for the ProjectPulse project, including branching strategies, commit conventions, and collaboration patterns used by senior developers.

## Core Principles

1. **Never commit directly to `master`** - Always use feature branches
2. **One branch per task** - Keep changes focused and reviewable
3. **Commit often, push daily** - Don't lose work
4. **Write clear commit messages** - Future you will thank current you
5. **Test before pushing** - Ensure builds and tests pass
6. **Review before merging** - Quality over speed

---

## 3-Track Branching Strategy

### Overview

ProjectPulse uses a **3-track workflow** optimized for parallel development:

1. **`api/*`** - Backend/API/Database changes
2. **`ui/*`** - Frontend/UI/Components changes
3. \*_feature/_` - Integration (connecting UI to API)

### Branch Naming Conventions

#### Backend Branches (`api/*`)

**When to use:**

- Modifying Prisma schema (database)
- Adding/changing API endpoints
- Writing Server Actions
- Implementing business logic
- Creating MCP tools/resources

**Examples:**

```bash
api/issues-crud          # Issue CRUD endpoints
api/search-hybrid        # Hybrid search implementation
api/knowledge-endpoints  # Knowledge Base API
api/mcp-tools            # MCP server tools
api/security-scan        # Security scanner integration
api/wiki-endpoints       # Wiki page endpoints
api/agent-config         # Agent configuration API
```

**Workflow:**

```bash
git checkout master
git pull
git checkout -b api/issues-crud
# ... implement API routes ...
git add .
git commit -m "feat: Add issue CRUD endpoints with validation"
git push origin api/issues-crud
# Open Pull Request on GitHub
# After review & tests pass: Merge to master
```

---

#### Frontend Branches (`ui/*`)

**When to use:**

- Creating new components
- Modifying Tailwind config
- Changing layouts or styling
- Adding animations
- Accessibility improvements
- Design system updates

**Examples:**

```bash
ui/design-system         # Tailwind config + base components
ui/dashboard-layout      # Dashboard page layout
ui/issue-kanban          # Kanban board component
ui/wiki-layout           # Wiki page design
ui/agent-cards           # Agent persona cards
ui/command-palette       # ⌘K command interface
ui/security-dashboard    # Security dashboard UI
ui/theme-switcher        # Theme selection component
```

**Workflow:**

```bash
git checkout master
git pull
git checkout -b ui/dashboard-layout
# ... build components ...
git add .
git commit -m "feat: Add Dashboard layout with stat cards"
git push origin ui/dashboard-layout
# Open Pull Request on GitHub
# After review & accessibility audit: Merge to master
```

---

#### Integration Branches (`feature/*`)

**When to use:**

- Connecting UI to API endpoints
- Writing E2E tests (Playwright)
- Implementing complete user flows
- Data fetching patterns
- Error handling & loading states
- Feature completion

**Examples:**

```bash
feature/dashboard        # Dashboard (UI + API connected)
feature/issues           # Issues page (complete feature)
feature/knowledge        # Knowledge Base (complete)
feature/wiki             # Wiki (complete)
feature/agents           # Agent Personas (UI + MCP)
feature/security         # Security Dashboard (complete)
feature/search           # Search (UI + API + E2E)
```

**Workflow:**

```bash
# Wait for both api/* and ui/* branches to merge
git checkout master
git pull  # Get both API and UI changes
git checkout -b feature/dashboard
# ... connect UI to API, add loading states, write E2E tests ...
git add .
git commit -m "feat: Complete Dashboard feature with E2E tests"
git push origin feature/dashboard
# Open Pull Request on GitHub
# After E2E tests pass & review: Merge to master
```

---

### Additional Branch Types

#### Bug Fixes (`fix/*`)

For fixing bugs without adding new features:

```bash
fix/issue-card-rendering      # Fix rendering bug in IssueCard
fix/search-special-chars      # Fix search with special characters
fix/theme-switching-flash     # Fix FOUC when switching themes
fix/database-connection       # Fix PostgreSQL connection issue
```

#### Testing (`test/*`)

For experimental testing or test improvements:

```bash
test/playwright-setup         # Set up Playwright E2E tests
test/api-coverage             # Improve API test coverage
test/component-tests          # Add missing component tests
```

#### Documentation (`docs/*`)

For documentation updates:

```bash
docs/api-documentation        # Document API endpoints
docs/architecture-updates     # Update architecture docs
docs/claude-system-updates    # Update Claude agent docs
docs/deployment-guide         # Add deployment documentation
```

#### Hotfixes (`hotfix/*`)

For critical production bugs that need immediate fixes:

```bash
hotfix/security-vulnerability # Critical security fix
hotfix/database-deadlock      # Database deadlock fix
hotfix/login-failure          # Login system down
```

**Note:** Hotfixes can merge directly to `master` and should be deployed immediately.

#### Chores (`chore/*`)

For maintenance tasks that don't affect code functionality:

```bash
chore/dependency-updates      # Update npm dependencies
chore/eslint-config           # Update linting rules
chore/git-hooks               # Configure Husky hooks
chore/docker-optimization     # Optimize Docker setup
```

---

## Commit Message Conventions

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code formatting (no logic change)
- **refactor:** Code restructuring (no behavior change)
- **test:** Adding or updating tests
- **chore:** Maintenance tasks
- **perf:** Performance improvements
- **ci:** CI/CD pipeline changes

### Examples

**Good commit messages:**

```
feat(api): Add issue CRUD endpoints with Zod validation

Implemented POST/GET/PATCH/DELETE endpoints for issues.
All endpoints include input validation using Zod schemas.
Added comprehensive Jest tests with 85% coverage.

Closes #42

---

fix(ui): Resolve theme switching flash on page load

Fixed FOUC (Flash of Unstyled Content) when switching themes.
Theme now persists in localStorage before render.
Added Suspense boundary for theme loading.

Fixes #87

---

docs: Update DEVELOPMENT_PLAN.md with Week 2 progress

Added completion details for Week 1 Days 3-4.
Updated timeline for Week 2 implementation.
Added success criteria for Dashboard feature.
```

**Bad commit messages:**

```
❌ "Fixed stuff"
❌ "WIP"
❌ "Updates"
❌ "asdf"
❌ "Changed files"
```

### Subject Line Rules

1. **50 characters max** for subject line
2. **Imperative mood** - "Add feature" not "Added feature"
3. **No period** at the end
4. **Capitalize** first letter

### Body Guidelines

1. **Explain WHY**, not what (the diff shows what)
2. **Line wrap at 72 characters**
3. **Include context** for future developers
4. **Reference issues** with `Closes #123` or `Fixes #456`

---

## Workflow Patterns

### Pattern 1: Simple Feature (No UI/API Split)

For features that don't need separate backend/frontend work:

```bash
git checkout master
git pull
git checkout -b feature/theme-switcher
# ... implement feature ...
git add .
git commit -m "feat: Add theme switcher component with persistence"
git push origin feature/theme-switcher
# Open PR, review, merge
```

**Use for:** Theme switching, simple components, documentation, config changes

---

### Pattern 2: Backend-First (API before UI)

For features where API contract must be defined first:

```bash
# Step 1: API development
git checkout master
git pull
git checkout -b api/issues-crud
# ... implement API routes ...
git add .
git commit -m "feat(api): Add issue CRUD endpoints"
git push origin api/issues-crud
# Open PR, review, merge

# Step 2: UI development (parallel or after)
git checkout master
git pull
git checkout -b ui/issue-kanban
# ... build Kanban UI ...
git add .
git commit -m "feat(ui): Add Kanban board component"
git push origin ui/issue-kanban
# Open PR, review, merge

# Step 3: Integration
git checkout master
git pull  # Get both API and UI
git checkout -b feature/issues
# ... connect UI to API, add E2E tests ...
git add .
git commit -m "feat: Complete Issue Tracker with E2E tests"
git push origin feature/issues
# Open PR, E2E tests, review, merge
```

**Use for:** CRUD features, search, data-driven pages

---

### Pattern 3: UI-First (Design before API)

For features where UI design must be validated first:

```bash
# Step 1: UI prototype
git checkout master
git pull
git checkout -b ui/security-dashboard
# ... build UI with mock data ...
git add .
git commit -m "feat(ui): Add Security Dashboard layout"
git push origin ui/security-dashboard
# Open PR, design review, merge

# Step 2: API implementation
git checkout master
git pull
git checkout -b api/security-scan
# ... implement security APIs ...
git add .
git commit -m "feat(api): Add security scanning endpoints"
git push origin api/security-scan
# Open PR, review, merge

# Step 3: Integration
git checkout master
git pull
git checkout -b feature/security
# ... connect UI to API ...
git add .
git commit -m "feat: Complete Security Dashboard feature"
git push origin feature/security
# Open PR, merge
```

**Use for:** Dashboard pages, analytics, complex visualizations

---

### Pattern 4: Hotfix (Emergency Fix)

For critical bugs in production:

```bash
git checkout master
git pull
git checkout -b hotfix/login-failure
# ... fix critical bug ...
git add .
git commit -m "hotfix: Fix authentication token expiration"
git push origin hotfix/login-failure
# Create PR with "URGENT" label
# Fast-track review
# Merge immediately
# Deploy to production
```

**Use for:** Security vulnerabilities, data loss bugs, system down

---

## Pre-Commit Checklist

Before committing, verify:

### Code Quality

- [ ] TypeScript compiles with no errors (`pnpm type-check`)
- [ ] ESLint passes with no warnings (`pnpm lint`)
- [ ] Prettier formatted code (`pnpm format`)
- [ ] No `any` types introduced
- [ ] No debug `console.log` statements

### Testing

- [ ] All tests pass (`pnpm test`)
- [ ] New code has test coverage (80%+ target)
- [ ] E2E tests pass if feature complete (`pnpm test:e2e`)

### Security

- [ ] No secrets or API keys committed
- [ ] Input validation added (Zod schemas)
- [ ] SQL queries use parameterized queries (Prisma)
- [ ] No hardcoded credentials

### Documentation

- [ ] Code comments added for complex logic
- [ ] README updated if setup changed
- [ ] API documented if endpoints added
- [ ] DEVELOPMENT_PLAN updated with progress

### Git Hygiene

- [ ] Commit message follows conventions
- [ ] Changes are atomic (one logical change)
- [ ] No unrelated files included
- [ ] .gitignore prevents build artifacts

---

## Pull Request Workflow

### Creating a Pull Request

1. **Push your branch to GitHub**

   ```bash
   git push origin <branch-name>
   ```

2. **Open PR on GitHub**
   - Go to repository on GitHub
   - Click "Compare & pull request"
   - Fill out PR template (if exists)

3. **Write descriptive PR description**

   ```markdown
   ## Description

   Adds issue CRUD endpoints with full validation and error handling.

   ## Changes

   - Implemented POST /api/issues
   - Implemented GET /api/issues with filtering
   - Implemented PATCH /api/issues/[id]
   - Implemented DELETE /api/issues/[id]
   - Added Zod validation schemas
   - Added Jest tests (85% coverage)

   ## Testing

   - Unit tests: 12 new tests
   - API tests: 8 endpoint tests
   - Manual testing: Tested all CRUD operations

   ## Checklist

   - [x] Tests pass
   - [x] TypeScript compiles
   - [x] Documentation updated
   - [x] No breaking changes

   Closes #42
   ```

4. **Assign reviewers** (if team project)

5. **Wait for CI/CD checks** (GitHub Actions)

6. **Address review comments**

7. **Merge when approved**

### Merging Strategies

**Squash and Merge** (Recommended for DevHub)

- Combines all commits into one
- Keeps `master` history clean
- Good for feature branches with many WIP commits

**Merge Commit**

- Preserves full commit history
- Good for long-lived branches
- Creates merge commit

**Rebase and Merge**

- Linear history
- No merge commits
- Good for small, clean branches

---

## Common Git Operations

### Update Your Branch with Latest Master

```bash
git checkout master
git pull origin master
git checkout your-branch
git merge master
# Resolve any conflicts
git add .
git commit -m "chore: Merge master into branch"
git push origin your-branch
```

Or using rebase (cleaner history):

```bash
git checkout your-branch
git fetch origin
git rebase origin/master
# Resolve conflicts if any
git push --force-with-lease origin your-branch
```

### Undo Last Commit (Not Pushed)

```bash
git reset --soft HEAD~1  # Keep changes staged
# OR
git reset --mixed HEAD~1  # Keep changes unstaged
# OR
git reset --hard HEAD~1  # Discard changes (careful!)
```

### Amend Last Commit

```bash
# Add more changes to last commit
git add .
git commit --amend --no-edit
# OR change commit message
git commit --amend -m "New message"
```

### Stash Changes Temporarily

```bash
git stash  # Save changes
git stash pop  # Apply and remove from stash
git stash list  # See all stashes
git stash apply stash@{0}  # Apply specific stash
```

### View Changes

```bash
git status  # See changed files
git diff  # See unstaged changes
git diff --staged  # See staged changes
git log --oneline --graph -10  # See commit history
```

### Delete Branch

```bash
git branch -d branch-name  # Delete local branch
git push origin --delete branch-name  # Delete remote branch
```

---

## Integration with DevHub Agents

### Agent Usage

- **devhub-architect:** Use when designing branching strategy for complex features
- **devhub-fullstack:** Use for all implementation branches (api/_, ui/_, feature/\*)
- **devhub-testing:** Use when creating test/\* branches or adding tests to features
- **devhub-auditor:** Use before merging to master (final quality check)

### Workflow with Agents

```
Planning Phase:
→ devhub-architect: "Design API structure for issues feature"
→ Output: Branch strategy recommendation (api/issues-crud + ui/issue-kanban + feature/issues)

Implementation Phase:
→ devhub-fullstack: "Implement issue CRUD endpoints on api/issues-crud"
→ devhub-fullstack: "Build Kanban UI on ui/issue-kanban"

Testing Phase:
→ devhub-testing: "Write E2E tests for issue lifecycle on feature/issues"

Review Phase:
→ devhub-auditor: "Review before merging feature/issues to master"
→ Output: Quality checklist, security review, approval
```

---

## Success Criteria

You're following Git best practices when:

- [ ] All commits have descriptive messages
- [ ] Every feature has its own branch
- [ ] `master` branch is always deployable
- [ ] Tests pass before every push
- [ ] No secrets in commit history
- [ ] Pull requests are reviewed before merge
- [ ] Commit history is clean and readable
- [ ] Branch naming follows conventions

---

## Red Flags (Don't Do This)

❌ Committing directly to `master`
❌ Pushing broken code
❌ Committing with "WIP" or "fix" messages
❌ Including unrelated changes in one commit
❌ Committing secrets or API keys
❌ Force pushing to shared branches
❌ Ignoring merge conflicts
❌ Not testing before committing
❌ Having 50+ commits for one small feature

---

## Quick Reference

### Create New Branch

```bash
# API branch
git checkout -b api/feature-name

# UI branch
git checkout -b ui/component-name

# Integration branch
git checkout -b feature/feature-name

# Fix branch
git checkout -b fix/bug-description

# Docs branch
git checkout -b docs/update-name
```

### Commit and Push

```bash
git add .
git commit -m "feat: Add feature description"
git push origin branch-name
```

### Update from Master

```bash
git checkout master
git pull
git checkout your-branch
git merge master
```

### Common Commands

```bash
git status                    # Check status
git log --oneline --graph -10 # See history
git branch -a                 # List all branches
git diff                      # See changes
git stash                     # Save changes temporarily
```

---

## Context Preservation After Commits

**⚠️ IMPORTANT:** To prevent context loss between Claude Code sessions, update these files after EVERY phase completion:

### After Completing a Phase/Feature

1. **Create Completion Document**

   ```bash
   # Use the template
   cp COMPLETION_TEMPLATE.md WEEK_X_DAY_Y_COMPLETION.md
   # Fill in all sections
   ```

2. **Update STATUS.md** (1-page snapshot)
   - Update "Last Completed" section
   - Update "Current Phase" section
   - Update "Git Status" section
   - Update "Overall Progress" section

3. **Update DEVELOPMENT_PLAN.md Header**
   - Update "CURRENT STATUS" section at the very top
   - Change "Last Completed" to your phase
   - Change "Current Phase" to next phase
   - Update "Next Immediate Task"

4. **Commit All Context Files**
   ```bash
   git add STATUS.md docs/DEVELOPMENT_PLAN.md WEEK_X_DAY_Y_COMPLETION.md
   git commit -m "docs: Update status after [phase name] completion"
   git push origin your-branch
   ```

### Why This Matters

**Without these updates:**

- ❌ Next session starts with NO context
- ❌ Claude doesn't know what was completed
- ❌ 10-20 minutes wasted rebuilding context
- ❌ Risk of redoing work or missing steps

**With these updates:**

- ✅ Next session starts in < 2 minutes
- ✅ Claude knows exactly where you left off
- ✅ Zero context loss
- ✅ Clear continuation path

### Quick Checklist

After every completion, verify:

- [ ] Completion document created (from COMPLETION_TEMPLATE.md)
- [ ] STATUS.md updated with new current phase
- [ ] DEVELOPMENT_PLAN.md "CURRENT STATUS" section updated
- [ ] All 3 files committed to Git
- [ ] Pushed to GitHub

**Takes 5 minutes, saves hours later!**

---

**Remember:** Good Git hygiene = Easier collaboration, better code reviews, and cleaner history. Take the extra 30 seconds to write a good commit message - your future self will thank you!

**And:** Keep STATUS.md updated after every completion - your next Claude Code session will thank you!
