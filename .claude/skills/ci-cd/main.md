# CI/CD Workflow Management - ProjectPulse

**Purpose**: Automated testing pipeline and deployment workflow for ProjectPulse

**When to use this skill**: When pushing code, debugging CI failures, or deploying to production

---

## Quick Reference

### CI/CD Status Check

```bash
# Check latest CI pipeline status
# Go to: https://github.com/draco28/ProjectPulse/actions

# Or use GitHub CLI
gh run list --limit 5
```

### Current Workflow

```
Push code → GitHub Actions runs automatically
    ↓
4 Jobs Run (2-5 minutes):
  1. Lint & Format (30s)
  2. Unit & Integration Tests (1-2 min)
  3. E2E Tests (2-3 min)
  4. Production Build (30s)
    ↓
✅ All pass → Safe to merge
❌ Any fail → Fix before merging
```

---

## Automated Testing Pipeline

### What Runs Automatically

**File**: `.github/workflows/ci.yml`

**Trigger**: Every push to any branch, every PR to master

**Jobs**:

1. **Lint & Format Check** (30 seconds)
   - ESLint (code quality)
   - Prettier (code formatting)
   - TypeScript (type checking)

2. **Unit & Integration Tests** (1-2 minutes)
   - PostgreSQL service starts automatically
   - Prisma migrations run
   - Jest unit tests
   - Jest integration tests

3. **E2E Tests** (2-3 minutes)
   - Playwright browsers install
   - Next.js production build
   - E2E tests run
   - Test reports uploaded

4. **Production Build** (30 seconds)
   - Next.js build verification
   - Security audit (pnpm audit)

---

## Common Workflows

### 1. Feature Development Flow

```bash
# 1. Create feature branch (if not exists)
git checkout -b feature/my-feature

# 2. Make changes (I do this)
# - Write code
# - Write tests

# 3. Commit changes
git add .
git commit -m "feat: Add new feature"

# 4. Push to GitHub
git push origin feature/my-feature

# 5. GitHub Actions runs automatically
# - Wait 2-5 minutes for tests to complete
# - Check status: https://github.com/draco28/ProjectPulse/actions

# 6. If tests pass ✅:
git checkout master
git pull origin master
git merge feature/my-feature
git push origin master

# 7. Deploy to Mac mini (manual)
ssh draco@192.168.1.15
cd ~/ProjectPulse
git pull origin master
docker-compose -f docker-compose.cloud.yml restart
```

### 2. Fix Failing Tests

**When tests fail ❌**, follow this process:

```bash
# 1. Read test failure logs
# - Go to GitHub Actions tab
# - Click failed job
# - Read error message

# 2. Reproduce locally
pnpm --filter web test:unit     # Run unit tests
pnpm --filter web test:e2e      # Run E2E tests

# 3. Fix the issue
# - Update code
# - Update tests if needed

# 4. Verify fix locally
pnpm --filter web test          # All tests

# 5. Push fix
git add .
git commit -m "fix: Resolve test failure"
git push origin feature/my-feature

# 6. GitHub Actions runs again automatically
```

### 3. Deployment to Mac Mini

**Checklist before deploying**:

- [ ] All GitHub Actions tests pass ✅
- [ ] Code merged to `master`
- [ ] Mac mini services healthy (curl http://192.168.1.15:3000/api/health)

**Deployment steps**:

```bash
# Option 1: SSH to Mac mini
ssh draco@192.168.1.15
cd ~/ProjectPulse
git pull origin master
npx prisma migrate deploy  # Run new migrations
docker-compose -f docker-compose.cloud.yml restart

# Option 2: Remote deployment (from Windows)
ssh draco@192.168.1.15 "cd ~/ProjectPulse && git pull origin master && npx prisma migrate deploy && docker-compose -f docker-compose.cloud.yml restart"

# Verify deployment
curl http://192.168.1.15:3000/api/health
# Should return: {"status":"healthy","database":"connected"}
```

---

## Troubleshooting CI Failures

### Lint Failures

**Error**: `ESLint found issues`

**Fix**:
```bash
# Auto-fix most issues
pnpm --filter web lint --fix

# Check what can't be auto-fixed
pnpm --filter web lint
```

**Error**: `Prettier formatting issues`

**Fix**:
```bash
# Auto-format all files
pnpm --filter web format

# Verify
pnpm --filter web format:check
```

**Error**: `TypeScript errors`

**Fix**:
```bash
# Check errors
pnpm --filter web type-check

# Common fixes:
# - Add missing types
# - Fix type mismatches
# - Update Prisma client: npx prisma generate
```

### Test Failures

**Error**: `Tests failed`

**Steps**:
1. Read error message in GitHub Actions
2. Reproduce locally: `pnpm --filter web test`
3. Debug with: `pnpm --filter web test:watch`
4. Fix code or update test
5. Verify: `pnpm --filter web test`

**Error**: `Database connection failed`

**Fix**:
```bash
# In CI, this usually means migration failed
# Check migration file syntax
# Ensure Prisma schema is valid

# Locally, ensure PostgreSQL is running
docker ps | grep postgres
```

### E2E Test Failures

**Error**: `Playwright test failed`

**Steps**:
1. Check screenshot in GitHub Actions artifacts
2. Reproduce locally: `pnpm --filter web test:e2e`
3. Debug with UI: `pnpm --filter web test:e2e:ui`
4. Fix selector or timing issue
5. Verify: `pnpm --filter web test:e2e`

**Error**: `Timeout waiting for element`

**Fix**:
```typescript
// Bad: No wait
await page.click('#submit');

// Good: Wait for element
await page.waitForSelector('#submit');
await page.click('#submit');
```

### Build Failures

**Error**: `Next.js build failed`

**Fix**:
```bash
# Build locally to see full error
pnpm --filter web build

# Common issues:
# - Import errors (check file paths)
# - Type errors (run type-check first)
# - Environment variable missing (add to .env.example)
```

---

## Best Practices

### Before Pushing Code

**Always run locally first**:
```bash
# Run all checks (same as CI)
pnpm --filter web lint
pnpm --filter web format:check
pnpm --filter web type-check
pnpm --filter web test
pnpm --filter web build
```

**Quick check** (faster):
```bash
# Just essentials
pnpm --filter web lint
pnpm --filter web test
```

### Writing Tests

**Coverage goals**:
- Unit tests: >80% coverage
- Integration tests: All API endpoints
- E2E tests: Critical user flows

**Test structure**:
```typescript
describe('Feature Name', () => {
  it('should do expected behavior', async () => {
    // Arrange: Set up test data
    const input = { /* ... */ };

    // Act: Execute code
    const result = await functionUnderTest(input);

    // Assert: Verify result
    expect(result).toEqual(expected);
  });
});
```

### Commit Messages

**Format**: `type(scope): description`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `test`: Add/update tests
- `refactor`: Code refactoring
- `docs`: Documentation
- `chore`: Maintenance

**Examples**:
```bash
git commit -m "feat(api): Add POST /api/issues endpoint"
git commit -m "fix(wiki): Resolve search query bug"
git commit -m "test(agents): Add E2E tests for agent creation"
```

---

## Integration with Other Skills

### When to use other skills

- **Testing skill**: For writing new tests, debugging test failures
- **Debugging skill**: For complex CI failures, environment issues
- **Git collaboration skill**: For branch management, merge conflicts

### Workflow integration

```
CI/CD skill (this)
    ↓
  Tests fail?
    ↓
Testing skill → Debug → Fix → Push
    ↓
  CI runs again
    ↓
  Tests pass ✅
    ↓
Deployment
```

---

## Quick Commands Reference

### Local Testing
```bash
pnpm --filter web lint              # Lint check
pnpm --filter web format            # Auto-format
pnpm --filter web type-check        # TypeScript check
pnpm --filter web test              # All tests
pnpm --filter web test:unit         # Unit tests
pnpm --filter web test:e2e          # E2E tests
pnpm --filter web build             # Production build
```

### Git Workflow
```bash
git checkout -b feature/name        # Create feature branch
git add .                           # Stage changes
git commit -m "type: message"       # Commit
git push origin feature/name        # Push to GitHub
gh pr create                        # Create PR (GitHub CLI)
```

### Deployment
```bash
ssh draco@192.168.1.15              # SSH to Mac mini
cd ~/ProjectPulse && git pull       # Pull latest
docker-compose -f docker-compose.cloud.yml restart  # Restart
curl http://192.168.1.15:3000/api/health  # Verify
```

---

## Monitoring & Alerts

### GitHub Actions Notifications

**Enable email notifications**:
1. GitHub.com → Settings → Notifications
2. Enable: "Actions" notifications
3. Receive email when tests fail

### Health Checks

**After deployment, always verify**:
```bash
# Health check
curl http://192.168.1.15:3000/api/health

# Database check
curl http://192.168.1.15:3000/api/issues?limit=1

# Wiki search check
curl http://192.168.1.15:3000/api/wiki?search=test
```

---

## Advanced Topics

### Branch Protection Rules

**Recommended setup** (prevents broken code in master):

1. GitHub → Settings → Branches
2. Add rule for `master`
3. Enable:
   - Require status checks (lint, test, e2e, build must pass)
   - Require up-to-date branches
   - No direct pushes to master

### Caching Strategy

GitHub Actions caches:
- ✅ pnpm dependencies (node_modules)
- ✅ Next.js build cache (.next/cache)
- ✅ Playwright browsers

**Result**: Faster CI runs (2-3 min instead of 5-7 min)

### Parallel Test Execution

```yaml
# E2E tests run in parallel (4 workers)
test:e2e:
  run: pnpm test:e2e --workers=4
```

**Benefit**: E2E tests complete in 2-3 min instead of 8-10 min

---

## Emergency Procedures

### Rollback Deployment

**If deployment breaks production**:

```bash
# 1. SSH to Mac mini
ssh draco@192.168.1.15

# 2. Revert to previous commit
cd ~/ProjectPulse
git log --oneline -5  # Find previous good commit
git reset --hard <commit-hash>

# 3. Rollback database (if migrations ran)
npx prisma migrate resolve --rolled-back <migration-name>

# 4. Restart services
docker-compose -f docker-compose.cloud.yml restart

# 5. Verify
curl http://192.168.1.15:3000/api/health
```

### Fix Broken CI Pipeline

**If GitHub Actions itself is broken**:

1. Check GitHub status: https://www.githubstatus.com/
2. Re-run failed jobs (GitHub Actions tab → Re-run jobs)
3. If still failing, push empty commit to retrigger:
   ```bash
   git commit --allow-empty -m "chore: Retrigger CI"
   git push
   ```

---

## Skill Activation

**I automatically use this skill when**:
- User requests code push
- User asks about CI/CD status
- User requests deployment
- Tests fail in GitHub Actions

**Invoke manually**: Not needed, I use it automatically when relevant.

---

**Last Updated**: 2025-01-17
**Version**: 1.0
**Maintainer**: Claude Code
