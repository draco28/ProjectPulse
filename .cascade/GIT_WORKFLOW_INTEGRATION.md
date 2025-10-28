# Git Workflow Integration - Cascade Mandatory Protocol

**Version:** 1.0  
**Last Updated:** 2025-10-28  
**Priority:** CRITICAL - Missing from initial integration

---

## ⚠️ CRITICAL GAP IDENTIFIED

The Git workflow is a **MANDATORY** part of the Claude Code workflow that was **NOT** included in the initial Cascade integration. This document corrects that gap.

---

## Mandatory Git Workflow

### Overview

**EVERY session MUST follow this Git workflow:**

1. **Before Plan Creation:** Create feature branch
2. **After Plan Approval:** Save plan to branch
3. **During Implementation:** Work on feature branch
4. **After Completion:** Create detailed commit
5. **Final Step:** Merge with proper commit messages

---

## Updated 5-Step Protocol with Git Integration

### STEP 1: INITIALIZATION (Before any code)

**Standard Steps:**

- Read STATUS.md and DEVELOPMENT_PLAN.md
- Create .agent/task/current-session-[YYYYMMDD-HHMM].md
- Load relevant context from .agent/ memory bank

**GIT WORKFLOW ADDITION:**

- ✅ **Check current branch:** `git branch --show-current`
- ✅ **Ensure on master/main:** If not, switch to master first
- ✅ **Pull latest changes:** `git pull origin master`

**CONFIRM:** "✅ STEP 1 COMPLETE: Session initialized at [timestamp], on master branch"

---

### STEP 1.5: BRANCH CREATION (NEW - MANDATORY)

**BEFORE creating the plan, AFTER user describes the task:**

1. **Determine branch type:**
   - `api/*` - Backend/API development
   - `ui/*` - Frontend/UI development
   - `feature/*` - Full-stack features

2. **Create descriptive branch name:**

   ```bash
   # Format: [type]/[brief-description]
   git checkout -b feature/cascade-git-workflow
   git checkout -b api/issue-filtering-endpoint
   git checkout -b ui/dashboard-redesign
   ```

3. **Verify branch created:**
   ```bash
   git branch --show-current
   ```

**CONFIRM:** "✅ STEP 1.5 COMPLETE: Created branch [branch-name]"

**CRITICAL:** Do NOT proceed to Step 2 until branch is created!

---

### STEP 2: PLAN CREATION (Before implementation)

**Standard Steps:**

- Create implementation plan
- Get user approval

**GIT WORKFLOW ADDITION:**

- ✅ **Verify on feature branch:** `git branch --show-current`
- ✅ **Save plan to branch:** IMMEDIATELY save to .agent/task/current-plan.md
- ✅ **Create todos on branch:** Create .agent/task/current-todos.md
- ✅ **Initial commit (optional):** Commit plan files if user approves

**Optional Initial Commit:**

```bash
git add .agent/task/current-plan.md .agent/task/current-todos.md
git commit -m "docs: add implementation plan for [feature]"
```

**CONFIRM:** "✅ STEP 2 COMPLETE: Plan saved to current-plan.md on branch [branch-name], todos saved to current-todos.md"

---

### STEP 3: EXPERT CONSULTATION (For technical decisions)

**Standard Steps:**

- Invoke experts (react-expert, next-js-expert, prisma-expert)
- Save consultations to .agent/task/[expert]-[topic]-[timestamp].md

**GIT WORKFLOW:**

- ✅ **All work on feature branch:** Ensure still on correct branch
- ✅ **Commit consultations (optional):** Can commit expert recommendations

**Optional Consultation Commit:**

```bash
git add .agent/task/[expert]-*.md
git commit -m "docs: add [expert] consultation for [topic]"
```

**CONFIRM:** "✅ STEP 3 COMPLETE: Consulted [expert] for [topic] on branch [branch-name]"

---

### STEP 4: PROGRESS CHECKPOINTS (Every 15K tokens)

**Standard Steps:**

- Update .agent/task/current-session.md
- Update .agent/task/current-todos.md

**GIT WORKFLOW ADDITION:**

- ✅ **Commit progress (optional):** Can commit checkpoint files
- ✅ **Verify branch:** Ensure still on feature branch

**Optional Checkpoint Commit:**

```bash
git add .agent/task/current-session.md .agent/task/current-todos.md
git commit -m "docs: checkpoint at [X]K tokens"
```

**CONFIRM:** "✅ CHECKPOINT at [X]K tokens: Progress saved on branch [branch-name]"

---

### STEP 5: POST-COMPLETION (Before final commit)

**Standard Steps:**

- Create COMPLETION\_[PHASE].md
- Update STATUS.md and DEVELOPMENT_PLAN.md
- Invoke synthesize-docs if new patterns created
- Invoke map-system if architecture changed

**GIT WORKFLOW ADDITION (CRITICAL):**

#### 5.1: Documentation Commit FIRST

```bash
# Stage documentation files
git add docs/
git add STATUS.md
git add DEVELOPMENT_PLAN.md
git add COMPLETION_[PHASE].md
git add .agent/

# Commit documentation FIRST
git commit -m "docs: complete [phase] - [brief description]

- Updated STATUS.md with completion
- Updated DEVELOPMENT_PLAN.md
- Created COMPLETION_[PHASE].md
- Updated system documentation

Phase: [phase name]
Duration: [X hours]
Files changed: [count]"
```

#### 5.2: Code Commit SECOND

```bash
# Stage code files
git add apps/
git add packages/
git add prisma/
git add *.config.*

# Commit code SECOND
git commit -m "feat: implement [feature]

- [Key change 1]
- [Key change 2]
- [Key change 3]

Tests: [X] passing
Coverage: [X]%
Quality gates: All passed"
```

#### 5.3: Verify Commits

```bash
# Check commit history
git log --oneline -5

# Should show:
# abc1234 feat: implement [feature]
# def5678 docs: complete [phase] - [brief description]
```

**CONFIRM:** "✅ STEP 5 COMPLETE: All documentation updated and committed (docs first, code second) on branch [branch-name]"

---

### STEP 6: MERGE & CLEANUP (NEW - MANDATORY)

**After Step 5 completion:**

#### 6.1: Quality Gates Check

```bash
# Run all quality gates on feature branch
pnpm lint        # Must pass
pnpm type-check  # Must pass
pnpm build       # Must pass
pnpm test        # Must pass (80%+ coverage)
```

**If any gate fails:** Fix issues, commit fixes, re-run gates

#### 6.2: Switch to Master

```bash
git checkout master
git pull origin master  # Get latest changes
```

#### 6.3: Merge Feature Branch

```bash
# Merge with --no-ff to preserve branch history
git merge --no-ff [branch-name]

# This creates a merge commit
```

#### 6.4: Push to Remote (if applicable)

```bash
git push origin master
```

#### 6.5: Delete Feature Branch (optional)

```bash
# Delete local branch
git branch -d [branch-name]

# Delete remote branch (if pushed)
git push origin --delete [branch-name]
```

**CONFIRM:** "✅ STEP 6 COMPLETE: Branch [branch-name] merged to master, quality gates passed"

---

## Complete Workflow Example

### Scenario: Implement Issue Filtering Feature

```bash
# STEP 1: Initialize
git checkout master
git pull origin master
# Create session file, load context
✅ STEP 1 COMPLETE: Session initialized at 2025-10-28-1600, on master branch

# STEP 1.5: Create Branch
git checkout -b feature/issue-filtering
✅ STEP 1.5 COMPLETE: Created branch feature/issue-filtering

# STEP 2: Create Plan
# User approves plan
# Save to .agent/task/current-plan.md
# Save to .agent/task/current-todos.md
git add .agent/task/current-plan.md .agent/task/current-todos.md
git commit -m "docs: add implementation plan for issue filtering"
✅ STEP 2 COMPLETE: Plan saved on branch feature/issue-filtering

# STEP 3: Consult Experts
# Invoke prisma-expert for schema
# Invoke next-js-expert for Server Components
# Save consultations
git add .agent/task/prisma-*.md .agent/task/nextjs-*.md
git commit -m "docs: add expert consultations for issue filtering"
✅ STEP 3 COMPLETE: Consulted experts on branch feature/issue-filtering

# STEP 4: Implementation (with checkpoints)
# ... implement code ...
# At 15K tokens:
git add .agent/task/current-session.md .agent/task/current-todos.md
git commit -m "docs: checkpoint at 15K tokens"
✅ CHECKPOINT at 15K tokens: Progress saved

# STEP 5: Completion
# 5.1: Documentation commit FIRST
git add docs/ STATUS.md DEVELOPMENT_PLAN.md COMPLETION_*.md .agent/
git commit -m "docs: complete issue filtering feature

- Updated STATUS.md with completion
- Updated DEVELOPMENT_PLAN.md
- Created COMPLETION_ISSUE_FILTERING.md
- Updated API catalog

Phase: Issue Filtering
Duration: 3 hours
Files changed: 12"

# 5.2: Code commit SECOND
git add apps/ prisma/
git commit -m "feat: implement issue filtering by priority and module

- Add filter API endpoint GET /api/issues/filter
- Add Prisma query with parameterized filters
- Add IssueFilter component with dropdowns
- Add filter state management with useSearchParams

Tests: 15 passing
Coverage: 92%
Quality gates: All passed"

✅ STEP 5 COMPLETE: Documentation and code committed

# STEP 6: Merge & Cleanup
pnpm lint        # ✅ Passed
pnpm type-check  # ✅ Passed
pnpm build       # ✅ Passed
pnpm test        # ✅ Passed (92% coverage)

git checkout master
git pull origin master
git merge --no-ff feature/issue-filtering
git push origin master
git branch -d feature/issue-filtering

✅ STEP 6 COMPLETE: Branch merged to master, quality gates passed
```

---

## Commit Message Standards

### Documentation Commits

```bash
# Format
docs: [action] [subject]

[detailed description]
[optional metadata]

# Examples
docs: complete dashboard redesign phase

- Updated STATUS.md with completion
- Updated DEVELOPMENT_PLAN.md
- Created COMPLETION_DASHBOARD.md
- Updated component catalog

Phase: Dashboard Redesign
Duration: 4 hours
Files changed: 18

---

docs: add prisma-expert consultation for schema design

Consulted prisma-expert for issue filtering schema.
Recommendations saved to .agent/task/prisma-schema-20251028.md
```

### Code Commits

```bash
# Format
[type]: [brief description]

- [Key change 1]
- [Key change 2]
- [Key change 3]

[optional metadata]

# Types
feat:     New feature
fix:      Bug fix
refactor: Code refactoring (no behavior change)
test:     Add or update tests
perf:     Performance improvement
style:    Code style/formatting
chore:    Build process, dependencies

# Examples
feat: implement issue filtering by priority and module

- Add filter API endpoint GET /api/issues/filter
- Add Prisma query with parameterized filters
- Add IssueFilter component with dropdowns
- Add filter state management with useSearchParams

Tests: 15 passing
Coverage: 92%
Quality gates: All passed

---

fix: resolve hydration mismatch in IssueCard component

- Move date formatting to client-side
- Add 'use client' directive
- Update tests for client component

Tests: 8 passing
Fixes: #123

---

test: add E2E tests for issue creation flow

- Add Playwright test for create issue
- Add test for validation errors
- Add test for success redirect

Coverage: +5% (87% → 92%)
```

---

## Branch Naming Conventions

### API Development

```bash
api/[feature-name]

Examples:
api/issue-filtering
api/user-authentication
api/search-endpoint
```

### UI Development

```bash
ui/[feature-name]

Examples:
ui/dashboard-redesign
ui/issue-detail-page
ui/command-palette
```

### Full-Stack Features

```bash
feature/[feature-name]

Examples:
feature/issue-filtering
feature/knowledge-base
feature/agent-personas
```

### Bug Fixes

```bash
fix/[bug-description]

Examples:
fix/hydration-mismatch
fix/memory-leak-dashboard
fix/broken-search
```

### Refactoring

```bash
refactor/[area]

Examples:
refactor/api-error-handling
refactor/component-structure
refactor/database-queries
```

---

## Quality Gates (Before Merge)

**ALL must pass before merging to master:**

```bash
# 1. TypeScript
pnpm type-check
# Must show: 0 errors

# 2. Linting
pnpm lint
# Must show: 0 warnings, 0 errors

# 3. Build
pnpm build
# Must complete successfully

# 4. Tests
pnpm test
# Must show: All tests passing, 80%+ coverage

# 5. Security
# Manual check: No SQL injection, no XSS vulnerabilities

# 6. Documentation
# Manual check: STATUS.md updated, DEVELOPMENT_PLAN.md updated
```

**If ANY gate fails:**

1. Fix the issue
2. Commit the fix
3. Re-run ALL gates
4. Only merge when ALL pass

---

## Reverting Changes

### If Feature Has Issues After Merge

```bash
# Option 1: Revert the merge commit
git revert -m 1 [merge-commit-hash]
git push origin master

# Option 2: Revert specific commits
git revert [commit-hash]
git push origin master

# Option 3: Create fix branch
git checkout -b fix/[issue-description]
# Fix the issue
# Follow full protocol
# Merge fix
```

### If Feature Not Yet Merged

```bash
# On feature branch
git reset --hard [commit-before-issue]
# Or
git revert [bad-commit-hash]
```

---

## Integration with Cascade

### Updated Session Starter Template

```markdown
MANDATORY PROTOCOL - Cascade Edition with Git Workflow

Current phase: [Your current phase from STATUS.md]
Requirements: [What you're working on]

ENFORCE ALL 6 STEPS:
✅ Step 1: Initialize session (check git status)
✅ Step 1.5: CREATE BRANCH (MANDATORY - before plan)
✅ Step 2: Save plan BEFORE code (on feature branch)
✅ Step 3: Consult experts (on feature branch)
✅ Step 4: Checkpoints every 15K tokens
✅ Step 5: Post-completion (docs FIRST, code SECOND)
✅ Step 6: Merge to master (quality gates must pass)

IF YOU SKIP ANY STEP, I WILL STOP YOU.
IF YOU DON'T CREATE A BRANCH, I WILL STOP YOU.
IF YOU COMMIT CODE BEFORE DOCS, I WILL STOP YOU.

Proceed with [task name].
```

---

## Troubleshooting

### Issue: Forgot to Create Branch

**Symptom:** Working on master, need to move to branch

**Solution:**

```bash
# Create branch from current state
git checkout -b feature/[name]

# All uncommitted changes move to new branch
```

---

### Issue: Committed to Master by Mistake

**Symptom:** Commits on master that should be on feature branch

**Solution:**

```bash
# Create branch from current master
git checkout -b feature/[name]

# Reset master to before commits
git checkout master
git reset --hard origin/master

# Continue work on feature branch
git checkout feature/[name]
```

---

### Issue: Need to Switch Branches Mid-Work

**Symptom:** Uncommitted changes, need to switch branches

**Solution:**

```bash
# Stash changes
git stash save "WIP: [description]"

# Switch branch
git checkout [other-branch]

# Do work...

# Return to original branch
git checkout [original-branch]
git stash pop
```

---

## Cascade Memory Update Required

**This Git workflow must be added to Cascade memories:**

### New Memory: Git Workflow Protocol

```
Title: Git Workflow - Mandatory Branch and Commit Protocol
Tags: git, workflow, protocol, branching, commits
Content:
MANDATORY Git workflow for every session:
1. Step 1.5: Create feature branch BEFORE plan (api/*, ui/*, feature/*)
2. Work on feature branch throughout implementation
3. Step 5: Commit docs FIRST, code SECOND
4. Step 6: Merge to master after quality gates pass
Branch naming: api/[name], ui/[name], feature/[name]
Commit order: Documentation → Code
Quality gates: lint, type-check, build, test (all must pass)
```

---

## Action Items

### Immediate (Critical)

1. ✅ Create this documentation (GIT_WORKFLOW_INTEGRATION.md)
2. ⏳ Update CASCADE_TEMPLATES.md with new session starter
3. ⏳ Update TROUBLESHOOTING.md with Git workflow issues
4. ⏳ Update MIGRATION_CHECKLIST.md to include Git workflow
5. ⏳ Create Cascade memory for Git workflow protocol
6. ⏳ Update GAP_ANALYSIS.md with this gap

### Short-term

1. Test Git workflow with next feature
2. Validate branch creation in protocol
3. Verify commit order enforcement
4. Document any issues

---

**Status:** ✅ CRITICAL GAP DOCUMENTED - Ready for integration  
**Priority:** HIGH - Must be enforced in all future sessions  
**Next Action:** Update all Cascade documentation and memories
