# GitHub Setup Guide - ProjectPulse CI/CD

**For**: Users new to GitHub and CI/CD pipelines
**Purpose**: Step-by-step guide to understanding GitHub Actions and repository setup

---

## Table of Contents

1. [What is GitHub Actions?](#what-is-github-actions)
2. [How CI/CD Works in ProjectPulse](#how-cicd-works-in-projectpulse)
3. [Viewing CI/CD Results](#viewing-cicd-results)
4. [Branch Protection Setup](#branch-protection-setup)
5. [GitHub Environments (Future)](#github-environments-future)
6. [Common Tasks](#common-tasks)

---

## What is GitHub Actions?

**GitHub Actions** = Automated workflows that run when you push code

**Think of it like this**:
```
You → Push code to GitHub
    ↓
GitHub → Runs tests automatically (GitHub Actions)
    ↓
You ← Get result: ✅ Pass or ❌ Fail
```

**Benefits**:
- ✅ No manual testing needed
- ✅ Catches bugs before merging
- ✅ Ensures code quality
- ✅ Prevents broken code in production

---

## How CI/CD Works in ProjectPulse

### Current Setup

**File**: `.github/workflows/ci.yml`

**What it does**: Every time you (or I, Claude) push code, GitHub automatically:

1. **Checks code quality** (30 seconds)
   - ESLint finds issues
   - Prettier checks formatting
   - TypeScript catches type errors

2. **Runs tests** (1-2 minutes)
   - Unit tests (test individual functions)
   - Integration tests (test API endpoints)
   - All tests run against a real PostgreSQL database

3. **Runs E2E tests** (2-3 minutes)
   - Playwright simulates user actions
   - Tests entire user flows (login, create issue, search wiki)

4. **Builds production app** (30 seconds)
   - Ensures Next.js can build successfully
   - Runs security audit

**Total time**: 2-5 minutes per push

### What Triggers CI/CD?

CI/CD runs automatically when:
- ✅ You push to ANY branch
- ✅ Someone creates a Pull Request to `master`
- ✅ You merge code to `master`

**You do nothing** - it just happens!

---

## Viewing CI/CD Results

### Step 1: Find the Actions Tab

1. Go to: `https://github.com/draco28/ProjectPulse`
2. Click: **"Actions"** tab (top menu)

![Actions Tab Location]
```
[ <> Code ]  [ Issues ]  [ Pull requests ]  [ Actions ] ← Click here
```

### Step 2: View Workflow Runs

You'll see a list of recent runs:

```
✅ CI Pipeline  #42  feat: Add new feature         master  5 minutes ago
❌ CI Pipeline  #41  fix: Resolve bug              feature/fix  10 minutes ago
✅ CI Pipeline  #40  refactor: Clean up code       master  1 hour ago
```

**Green checkmark** ✅ = All tests passed
**Red X** ❌ = Some tests failed

### Step 3: View Job Details

Click on any workflow run to see details:

```
Jobs (4)
  ✅ Lint & Format Check (32s)
  ✅ Unit & Integration Tests (1m 45s)
  ❌ E2E Tests (Failed after 2m 15s)
  ⚪ Production Build (Skipped - depends on E2E)
```

Click on the failed job (E2E Tests) to see what went wrong.

### Step 4: Read Error Logs

Expand the failed step:

```
Run E2E tests
❌ Error: Test failed: Cannot find element #submit-button
   at page.click (wiki.spec.ts:45)

Expected: Element #submit-button exists
Actual: Element not found
```

This tells you exactly what broke!

---

## Branch Protection Setup

**Purpose**: Prevent broken code from getting into `master`

### What is Branch Protection?

**Without protection**:
```
You → Push broken code to master → Production breaks 💥
```

**With protection**:
```
You → Push to feature branch → CI runs tests
    ↓
  Tests fail ❌
    ↓
GitHub blocks merge to master ⛔
    ↓
You fix code → Push again → Tests pass ✅
    ↓
Now you can merge to master ✅
```

### How to Set Up (5 minutes)

#### Step 1: Go to Settings

1. Go to: `https://github.com/draco28/ProjectPulse`
2. Click: **"Settings"** tab
3. Click: **"Branches"** (left sidebar)

#### Step 2: Add Protection Rule

1. Click: **"Add branch protection rule"**
2. Enter branch name: `master`

#### Step 3: Configure Protection

Enable these options:

- ✅ **Require status checks to pass before merging**
  - ✅ Select: `lint` (Code quality checks)
  - ✅ Select: `test` (Unit & integration tests)
  - ✅ Select: `e2e` (E2E tests)
  - ✅ Select: `build` (Production build)

- ✅ **Require branches to be up to date before merging**
  - Ensures you have latest code before merging

- ✅ **Require linear history** (optional)
  - Keeps git history clean

#### Step 4: Save

1. Scroll down
2. Click: **"Create"** or **"Save changes"**

**Done!** Now `master` is protected.

---

## GitHub Environments (Future)

**What are environments?**
- Named deployment targets (staging, production)
- Store secrets (API keys, database URLs)
- Require manual approval

**When to set up**: When you want automated deployment (not needed yet)

### How Environments Work

```
Code pushed to master
    ↓
CI tests pass ✅
    ↓
Auto-deploy to "staging" environment
    ↓
Manual approval required 👤
    ↓
Deploy to "production" environment
```

### Setting Up Environments (Future)

#### Step 1: Create Environment

1. GitHub → Settings → Environments
2. Click: **"New environment"**
3. Name: `staging`
4. Click: **"Configure environment"**

#### Step 2: Add Secrets

Add environment-specific secrets:

```
DATABASE_URL = postgresql://postgres:pass@192.168.1.15:5432/projectpulse_staging
SSH_KEY = <your-ssh-private-key>
```

#### Step 3: Add Protection Rules

For `production` environment:

- ✅ **Required reviewers**: Select yourself
- ✅ **Wait timer**: 5 minutes (gives time to verify staging)

**Result**: Can't deploy to production without manual approval

---

## Common Tasks

### Task 1: Check if Tests Passed

```
1. Go to GitHub repository
2. Click "Actions" tab
3. Find your commit in the list
4. Look for ✅ or ❌ next to commit
```

**Alternative**: Check commit on code page

```
Commits
abc1234  ✅  feat: Add new feature
xyz5678  ❌  fix: Resolve bug
```

Click the ✅ or ❌ to see details.

### Task 2: Re-run Failed Tests

Sometimes tests fail due to temporary issues (network timeout, flaky test).

**How to re-run**:

```
1. GitHub → Actions → Click failed workflow
2. Click: "Re-run jobs" (top right)
3. Select: "Re-run all jobs" or "Re-run failed jobs only"
```

GitHub will run tests again.

### Task 3: View Test Reports

**E2E test reports** (Playwright):

```
1. GitHub → Actions → Click workflow run
2. Scroll down to "Artifacts"
3. Click: "playwright-report"
4. Download ZIP file
5. Extract and open index.html
```

You'll see screenshots and videos of failed tests!

### Task 4: Enable Email Notifications

Get notified when tests fail:

```
1. GitHub → Settings (your profile, not repo)
2. Click: "Notifications" (left sidebar)
3. Under "Actions":
   - ✅ Enable "Email"
   - ✅ Select "Only failures"
4. Save changes
```

Now you get an email when CI fails.

### Task 5: Check GitHub Actions Usage

**Free tier**: 2,000 minutes/month

**How to check usage**:

```
1. GitHub → Settings (your profile)
2. Click: "Billing and plans"
3. View: "Actions minutes used"
```

**ProjectPulse usage**: ~5 min/run → ~400 runs/month (well under limit!)

---

## Understanding the Workflow File

### File Location

`.github/workflows/ci.yml`

### File Structure

```yaml
name: CI Pipeline  # Workflow name

on:  # When to run
  push:
    branches: ['**']  # All branches
  pull_request:
    branches: [master]  # PRs to master

jobs:  # What to run
  lint:  # Job name
    runs-on: ubuntu-latest  # GitHub server
    steps:  # Individual steps
      - name: Checkout code
        uses: actions/checkout@v4  # Get code from repo

      - name: Run ESLint
        run: pnpm --filter web lint  # Command to run
```

### Editing the Workflow

**When to edit**:
- Add new tests
- Change Node.js version
- Add new jobs
- Update dependencies

**How to edit**:
1. Open: `.github/workflows/ci.yml`
2. Make changes
3. Commit and push
4. GitHub uses new workflow automatically

---

## Troubleshooting

### Issue: CI not running

**Causes**:
1. Workflow file has syntax error
2. Repository settings disabled Actions

**Fix**:
```
1. GitHub → Settings → Actions → General
2. Enable: "Allow all actions and reusable workflows"
```

### Issue: Tests passing locally but failing in CI

**Causes**:
1. Different Node.js version
2. Different environment variables
3. Different database state

**Fix**:
```
1. Check CI logs for specific error
2. Match local setup to CI:
   - Node version: 20
   - PostgreSQL: 15
   - Environment: DATABASE_URL set
```

### Issue: Workflow taking too long

**Normal**: 2-5 minutes
**Slow**: >10 minutes

**Causes**:
1. Too many tests
2. Slow E2E tests
3. Missing caching

**Fix**:
```
1. Enable parallel test execution
2. Add caching for dependencies
3. Skip non-critical tests in CI
```

---

## Best Practices

### 1. Always Check CI Before Merging

```
❌ Don't: Merge to master without checking CI
✅ Do: Wait for green checkmark ✅, then merge
```

### 2. Fix Failures Immediately

```
❌ Don't: Ignore red X ❌ and continue working
✅ Do: Fix failing tests before adding new features
```

### 3. Test Locally First

```
❌ Don't: Push code without running tests
✅ Do: Run tests locally first:
       pnpm --filter web test
```

### 4. Use Descriptive Commit Messages

```
❌ Don't: "fix stuff"
✅ Do: "fix(wiki): Resolve search query escaping bug"
```

---

## Quick Reference

### Important URLs

```
Repository: https://github.com/draco28/ProjectPulse
Actions: https://github.com/draco28/ProjectPulse/actions
Settings: https://github.com/draco28/ProjectPulse/settings
```

### CI/CD Status Emoji

```
✅ All tests passed - Safe to merge
❌ Tests failed - Fix before merging
🟡 Tests running - Wait for result
⚪ Tests pending - Waiting for other jobs
🔵 Tests queued - Will start soon
```

### Common Commands

```bash
# View latest CI runs
gh run list --limit 5

# View specific run details
gh run view <run-id>

# Download test reports
gh run download <run-id>

# Trigger workflow manually
gh workflow run ci.yml
```

---

## Next Steps

### Immediate (Today)

1. ✅ Understand what GitHub Actions does
2. ✅ Know how to view CI/CD results
3. ✅ Set up branch protection (5 minutes)

### Short-term (This Week)

1. 📚 Watch CI run on first push
2. 🐛 Practice fixing a failing test
3. 🔍 Explore test reports (Playwright)

### Long-term (This Month)

1. 🚀 Set up automated deployment (optional)
2. 📊 Add code coverage badges
3. ⚡ Optimize CI performance (parallel tests)

---

## Getting Help

### If CI Fails

1. Read error message in GitHub Actions
2. Reproduce locally: `pnpm --filter web test`
3. Check CI/CD skill: `.claude/skills/ci-cd/main.md`
4. Ask me (Claude) to debug the failure

### If Confused

1. Read this guide again
2. Check official docs: https://docs.github.com/en/actions
3. Ask me (Claude) to explain

---

**Last Updated**: 2025-01-17
**Difficulty**: Beginner-friendly
**Estimated Reading Time**: 20 minutes
