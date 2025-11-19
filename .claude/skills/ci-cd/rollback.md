# Rollback Procedures - ProjectPulse

**Purpose**: Quickly rollback failed deployments or broken code

---

## When to Rollback

### Immediate Rollback Scenarios

- ❌ Production health check fails after deployment
- ❌ Critical features broken (can't create issues, can't search wiki)
- ❌ Database errors preventing app startup
- ❌ Performance degradation (page load >10s)

### Wait and Monitor Scenarios

- ⚠️ Minor UI bugs (cosmetic issues)
- ⚠️ Non-critical features broken (optional features)
- ⚠️ Single test failing (might be flaky test)

---

## Quick Rollback (Code Only)

**Use when**: No database migrations in the broken deployment

**Duration**: 1-2 minutes

```bash
# 1. SSH to Mac mini
ssh draco@192.168.1.15

# 2. Navigate to project
cd ~/ProjectPulse

# 3. View recent commits
git log --oneline -5

# Example output:
# abc1234 (HEAD -> master) feat: Add new feature (BROKEN)
# xyz5678 fix: Resolve bug (LAST GOOD)
# def9012 feat: Add another feature

# 4. Rollback to last good commit
git reset --hard xyz5678

# 5. Restart services
docker-compose -f docker-compose.cloud.yml restart

# 6. Verify health
curl http://localhost:3000/api/health

# 7. Exit
exit
```

**Result**: App running on previous version

---

## Rollback with Database Migrations

**Use when**: Broken deployment included database migrations

**Duration**: 2-5 minutes

### Step 1: Identify Migrations to Rollback

```bash
# SSH to Mac mini
ssh draco@192.168.1.15
cd ~/ProjectPulse/apps/web

# Check migration status
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma migrate status

# Example output:
# 20250115_add_agent_personas: Applied
# 20250117_add_dev_session_fk: Applied (BROKEN)
```

### Step 2: Rollback Migration

```bash
# Mark migration as rolled back
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma migrate resolve --rolled-back 20250117_add_dev_session_fk

# Manually revert database changes (if needed)
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" psql -c "
  ALTER TABLE \"DevelopmentSession\" DROP COLUMN IF EXISTS \"phaseId\";
  ALTER TABLE \"DevelopmentSession\" DROP COLUMN IF EXISTS \"weekId\";
  ALTER TABLE \"DevelopmentSession\" DROP COLUMN IF EXISTS \"dayId\";
  ALTER TABLE \"DevelopmentSession\" DROP COLUMN IF EXISTS \"taskId\";
"
```

### Step 3: Rollback Code

```bash
# Go back to project root
cd ~/ProjectPulse

# Find last good commit (before migration)
git log --oneline -10 | grep -B 1 "20250117_add_dev_session_fk"

# Rollback to commit before migration
git reset --hard <commit-before-migration>

# Restart services
docker-compose -f docker-compose.cloud.yml restart

# Verify health
curl http://localhost:3000/api/health
```

### Step 4: Verify Rollback

```bash
# Check app health
curl http://localhost:3000/api/health

# Check database tables
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" psql -c "\dt"

# Check migration status
cd apps/web
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma migrate status
```

---

## Rollback GitHub Commit

**Use when**: Need to revert commit on GitHub (master branch)

### Option 1: Revert Commit (Recommended)

**Creates a new commit that undoes changes** (preserves history)

```bash
# 1. Checkout master
git checkout master
git pull origin master

# 2. Find commit to revert
git log --oneline -5

# 3. Revert commit
git revert <commit-hash>

# 4. Push revert commit
git push origin master

# 5. Deploy to Mac mini
ssh draco@192.168.1.15 "cd ~/ProjectPulse && git pull origin master && docker-compose -f docker-compose.cloud.yml restart"
```

**Pros**: Safe, preserves history, can be reverted again
**Cons**: Creates extra commit

### Option 2: Force Reset (Dangerous)

**Deletes commit from history** (use only if commit not deployed yet)

```bash
# 1. Checkout master
git checkout master
git pull origin master

# 2. Find commit to remove
git log --oneline -5

# 3. Reset to before broken commit
git reset --hard <commit-before-broken>

# 4. Force push (DANGEROUS!)
git push origin master --force

# 5. Deploy to Mac mini
ssh draco@192.168.1.15 "cd ~/ProjectPulse && git pull origin master && docker-compose -f docker-compose.cloud.yml restart"
```

**⚠️ WARNING**: Only use if:
- Commit not yet deployed to production
- No one else pulled the broken commit
- You understand the risks of force push

---

## Database Backup and Restore

### Create Backup Before Risky Changes

```bash
# SSH to Mac mini
ssh draco@192.168.1.15

# Create backup
docker exec projectpulse-postgres pg_dump -U postgres projectpulse_dev > ~/backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup
ls -lh ~/backup-*.sql
```

### Restore from Backup

```bash
# SSH to Mac mini
ssh draco@192.168.1.15

# List backups
ls -lt ~/backup-*.sql | head -5

# Restore from backup
docker exec -i projectpulse-postgres psql -U postgres -d projectpulse_dev < ~/backup-20250117-143000.sql

# Restart services
cd ~/ProjectPulse
docker-compose -f docker-compose.cloud.yml restart
```

---

## Emergency Procedures

### Production Completely Down

```bash
# 1. Check Docker status
ssh draco@192.168.1.15 "docker ps -a"

# 2. Restart all services
ssh draco@192.168.1.15 "cd ~/ProjectPulse && docker-compose -f docker-compose.cloud.yml down && docker-compose -f docker-compose.cloud.yml up -d"

# 3. If still down, rollback to known good version
ssh draco@192.168.1.15 "cd ~/ProjectPulse && git reset --hard <last-good-commit> && docker-compose -f docker-compose.cloud.yml restart"

# 4. Verify health
curl http://192.168.1.15:3000/api/health
```

### Database Corrupted

```bash
# 1. Stop services
ssh draco@192.168.1.15 "cd ~/ProjectPulse && docker-compose -f docker-compose.cloud.yml down"

# 2. Restore from backup
ssh draco@192.168.1.15 "docker exec -i projectpulse-postgres psql -U postgres -d projectpulse_dev < ~/backup-<timestamp>.sql"

# 3. Restart services
ssh draco@192.168.1.15 "cd ~/ProjectPulse && docker-compose -f docker-compose.cloud.yml up -d"

# 4. Verify health
curl http://192.168.1.15:3000/api/health
```

### Disk Space Full

```bash
# 1. Check disk space
ssh draco@192.168.1.15 "df -h"

# 2. Clean Docker images
ssh draco@192.168.1.15 "docker system prune -a --volumes"

# 3. Clean old logs
ssh draco@192.168.1.15 "docker-compose -f ~/ProjectPulse/docker-compose.cloud.yml logs --tail=0"

# 4. Remove old backups (keep last 5)
ssh draco@192.168.1.15 "ls -t ~/backup-*.sql | tail -n +6 | xargs rm"
```

---

## Post-Rollback Actions

### 1. Verify Production Health

```bash
# Health check
curl http://192.168.1.15:3000/api/health

# Test critical features
curl http://192.168.1.15:3000/api/issues?limit=1
curl http://192.168.1.15:3000/api/wiki?search=test
curl http://192.168.1.15:3000/api/agents
```

### 2. Fix the Issue Locally

```bash
# 1. Checkout the broken commit
git checkout <broken-commit>

# 2. Reproduce the issue locally
pnpm --filter web dev

# 3. Fix the issue
# (make code changes)

# 4. Test locally
pnpm --filter web test
pnpm --filter web test:e2e

# 5. Commit fix
git add .
git commit -m "fix: Resolve production issue"

# 6. Push and deploy again
git push origin feature/fix-branch
```

### 3. Document Incident

Create incident report in `.agent/task/incident-<timestamp>.md`:

```markdown
# Production Incident Report

**Date**: 2025-01-17
**Severity**: High
**Duration**: 15 minutes

## What Happened
- Deployed commit abc1234
- Production health check failed
- Users unable to access wiki

## Root Cause
- Database migration added NOT NULL constraint without default value
- Existing rows failed validation

## Resolution
- Rolled back to commit xyz5678
- Manually reverted migration
- Restarted services
- Health restored

## Prevention
- Add migration validation in CI
- Test migrations on staging data first
- Add database backup before migrations
```

---

## Rollback Decision Tree

```
Production issue detected
    ↓
Is it critical? (can't access app, data loss)
    ↓ YES
Quick rollback (git reset + restart)
    ↓
Were there migrations?
    ↓ YES
Rollback migrations first, then code
    ↓
Verify health check ✅
    ↓
Fix issue locally, redeploy

    ↓ NO (minor issue)
Monitor for 5-10 minutes
    ↓
Still happening?
    ↓ YES
Plan fix, deploy during low traffic
```

---

## Testing Rollback Procedures

### Practice Rollback (Staging)

**Good practice**: Test rollback procedures monthly

```bash
# 1. Deploy to staging
git checkout staging
git merge feature/test-rollback
git push origin staging

# 2. Simulate failure
# (intentionally break something)

# 3. Practice rollback
git reset --hard HEAD~1
docker-compose -f docker-compose.cloud.yml restart

# 4. Verify rollback successful
curl http://staging:3000/api/health
```

---

## Rollback Checklist

### Before Rollback

- [ ] Confirm production issue (health check, user reports)
- [ ] Identify last good commit/version
- [ ] Check if database migrations involved
- [ ] Create backup (if time allows)

### During Rollback

- [ ] SSH to Mac mini
- [ ] Rollback database migrations (if applicable)
- [ ] Rollback code (`git reset --hard`)
- [ ] Restart services
- [ ] Verify health check

### After Rollback

- [ ] Confirm production working
- [ ] Document incident
- [ ] Fix issue locally
- [ ] Test fix thoroughly
- [ ] Deploy fix when ready

---

**Last Updated**: 2025-01-17
