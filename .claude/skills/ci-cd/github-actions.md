# GitHub Actions Troubleshooting Guide

**Purpose**: Debug and fix GitHub Actions pipeline failures

---

## Common GitHub Actions Errors

### Error: "No space left on device"

**Cause**: GitHub runner out of disk space

**Fix**:
```yaml
# Add cleanup step before build
- name: Free disk space
  run: |
    sudo rm -rf /usr/share/dotnet
    sudo rm -rf /opt/ghc
    sudo rm -rf "/usr/local/share/boost"
    sudo rm -rf "$AGENT_TOOLSDIRECTORY"
```

### Error: "pnpm: command not found"

**Cause**: pnpm setup missing

**Fix**: Ensure pnpm setup step exists
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8
```

### Error: "PostgreSQL connection refused"

**Cause**: Service not ready before tests run

**Fix**: Add health check
```yaml
services:
  postgres:
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

### Error: "Prisma Client not found"

**Cause**: Missing `prisma generate` step

**Fix**: Add generation step
```yaml
- name: Generate Prisma Client
  working-directory: apps/web
  run: npx prisma generate
```

### Error: "Module not found"

**Cause**: Dependencies not installed or cached incorrectly

**Fix**:
```bash
# Clear cache and re-run
# GitHub → Actions → Caches → Delete all caches
# Then re-run workflow
```

---

## Viewing Logs

### How to Read GitHub Actions Logs

1. Go to: `https://github.com/draco28/ProjectPulse/actions`
2. Click on failed workflow run
3. Click on failed job (red ❌)
4. Expand failing step
5. Read error message (usually at bottom)

### Download Logs Locally

```bash
# Using GitHub CLI
gh run download <run-id>

# Or download from UI
# Actions → Workflow run → "..." → Download log archive
```

---

## Re-running Workflows

### Re-run Failed Jobs Only

```bash
# GitHub CLI
gh run rerun <run-id> --failed

# Or from UI
# Actions → Workflow run → "Re-run failed jobs"
```

### Re-run All Jobs

```bash
# GitHub CLI
gh run rerun <run-id>

# Or from UI
# Actions → Workflow run → "Re-run all jobs"
```

---

## Debugging Workflows

### Enable Debug Logging

**Set repository secret**:
```
Settings → Secrets → New secret
Name: ACTIONS_STEP_DEBUG
Value: true
```

**Result**: Much more verbose logs

### Add Debug Steps

```yaml
- name: Debug environment
  run: |
    echo "Node version: $(node --version)"
    echo "pnpm version: $(pnpm --version)"
    echo "Working directory: $(pwd)"
    ls -la
```

### SSH into Runner (Advanced)

Use `tmate` action for interactive debugging:

```yaml
- name: Setup tmate session
  if: ${{ failure() }}
  uses: mxschmitt/action-tmate@v3
  timeout-minutes: 30
```

**Warning**: Only use for debugging, remove before merging!

---

## Performance Optimization

### Cache Dependencies

Already configured:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    cache: 'pnpm'  # ✅ Caches node_modules
```

### Cache Build Artifacts

```yaml
- name: Cache Next.js build
  uses: actions/cache@v3
  with:
    path: apps/web/.next/cache
    key: nextjs-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### Parallel Job Execution

Jobs run in parallel by default:
```
lint ─────┐
test ─────┤─→ build
e2e ──────┘
```

**Result**: 2-3 min total instead of 6-8 min sequential

---

## Security Best Practices

### Never Commit Secrets

**Bad**:
```yaml
env:
  DATABASE_URL: postgresql://postgres:password@localhost:5432/db
```

**Good**:
```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Audit Dependencies

```yaml
- name: Security audit
  run: pnpm audit --audit-level moderate
```

### Pin Action Versions

**Bad**: `uses: actions/checkout@v4`

**Good**: `uses: actions/checkout@v4.1.0` (specific version)

**Best**: `uses: actions/checkout@8e5e7e5` (SHA commit)

---

## Workflow Status Badges

Add to README.md:

```markdown
![CI Pipeline](https://github.com/draco28/ProjectPulse/workflows/CI%20Pipeline/badge.svg)
```

**Result**: Shows ✅ or ❌ status in README

---

## Advanced Workflows

### Matrix Testing (Test Multiple Versions)

```yaml
strategy:
  matrix:
    node-version: [18, 20, 21]

steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
```

**Result**: Tests run on Node 18, 20, and 21

### Conditional Jobs

```yaml
deploy:
  if: github.ref == 'refs/heads/master' && github.event_name == 'push'
  needs: [lint, test, e2e]
  runs-on: ubuntu-latest
```

**Result**: Only deploy when pushing to master

---

## Monitoring

### GitHub Actions Usage

Check usage limits:
```
Settings → Billing → Plans and usage
```

**Free tier**: 2,000 minutes/month

**ProjectPulse usage**: ~5 min per run → ~400 runs/month

### Workflow Insights

View statistics:
```
Actions → Workflows → CI Pipeline → "..." → View workflow insights
```

**Metrics**:
- Average run time
- Success rate
- Most common failures

---

**Last Updated**: 2025-01-17
