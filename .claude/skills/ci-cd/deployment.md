# Mac Mini Deployment Guide

**Purpose**: Deploy ProjectPulse to Mac mini production server (192.168.1.15)

---

## Pre-Deployment Checklist

### 1. Verify CI Pipeline

**All tests must pass** ✅:
- [ ] Lint & format check
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Production build

**Check at**: `https://github.com/draco28/ProjectPulse/actions`

### 2. Verify Code is Merged to Master

```bash
# Ensure you're on master
git checkout master

# Pull latest
git pull origin master

# Verify latest commit
git log --oneline -1
```

### 3. Verify Mac Mini Health

```bash
# Health check
curl http://192.168.1.15:3000/api/health

# Expected response:
# {"status":"healthy","database":"connected"}
```

---

## Deployment Process

### Standard Deployment (No Database Changes)

```bash
# 1. SSH to Mac mini
ssh draco@192.168.1.15

# 2. Navigate to project
cd ~/ProjectPulse

# 3. Pull latest code
git pull origin master

# 4. Restart services
docker-compose -f docker-compose.cloud.yml restart

# 5. Verify deployment
curl http://localhost:3000/api/health

# 6. Exit SSH
exit
```

**Duration**: 1-2 minutes

### Deployment with Database Migrations

```bash
# 1. SSH to Mac mini
ssh draco@192.168.1.15

# 2. Navigate to project
cd ~/ProjectPulse

# 3. Pull latest code
git pull origin master

# 4. Run migrations
cd apps/web
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma migrate deploy

# 5. Restart services
cd ../..
docker-compose -f docker-compose.cloud.yml restart

# 6. Verify deployment
curl http://localhost:3000/api/health

# 7. Test migrated features
# Example: If you added new table, query it
curl http://localhost:3000/api/phases

# 8. Exit SSH
exit
```

**Duration**: 2-3 minutes

### Deployment with Dependency Changes

**If package.json changed** (new dependencies):

```bash
# 1. SSH to Mac mini
ssh draco@192.168.1.15

# 2. Navigate to project
cd ~/ProjectPulse

# 3. Pull latest code
git pull origin master

# 4. Install dependencies
pnpm install

# 5. Generate Prisma client (if schema changed)
cd apps/web
npx prisma generate

# 6. Restart services
cd ../..
docker-compose -f docker-compose.cloud.yml down
docker-compose -f docker-compose.cloud.yml up -d --build

# 7. Verify deployment
curl http://localhost:3000/api/health

# 8. Exit SSH
exit
```

**Duration**: 3-5 minutes (includes rebuild)

---

## One-Command Deployment

### Remote Deployment from Windows

**Standard deployment**:
```bash
ssh draco@192.168.1.15 "cd ~/ProjectPulse && git pull origin master && docker-compose -f docker-compose.cloud.yml restart"
```

**With migrations**:
```bash
ssh draco@192.168.1.15 "cd ~/ProjectPulse && git pull origin master && cd apps/web && DATABASE_URL='postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev' npx prisma migrate deploy && cd ../.. && docker-compose -f docker-compose.cloud.yml restart"
```

**With rebuild**:
```bash
ssh draco@192.168.1.15 "cd ~/ProjectPulse && git pull origin master && pnpm install && docker-compose -f docker-compose.cloud.yml down && docker-compose -f docker-compose.cloud.yml up -d --build"
```

---

## Post-Deployment Verification

### Health Checks

```bash
# 1. API health
curl http://192.168.1.15:3000/api/health

# 2. Database connectivity
curl http://192.168.1.15:3000/api/issues?limit=1

# 3. Wiki search
curl http://192.168.1.15:3000/api/wiki?search=test

# 4. Agent personas
curl http://192.168.1.15:3000/api/agents
```

### Docker Container Status

```bash
ssh draco@192.168.1.15 "docker ps"

# Expected containers:
# - projectpulse-web (Next.js app)
# - projectpulse-postgres (PostgreSQL)
# - projectpulse-mcp (MCP server)
```

### Logs Check

```bash
# View recent logs
ssh draco@192.168.1.15 "docker-compose -f ~/ProjectPulse/docker-compose.cloud.yml logs --tail=50"

# Follow logs (real-time)
ssh draco@192.168.1.15 "docker-compose -f ~/ProjectPulse/docker-compose.cloud.yml logs -f"
```

---

## Troubleshooting Deployment Issues

### Issue: Port Already in Use

**Error**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Fix**:
```bash
ssh draco@192.168.1.15

# Stop existing containers
docker-compose -f docker-compose.cloud.yml down

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Restart services
docker-compose -f docker-compose.cloud.yml up -d
```

### Issue: Database Migration Failed

**Error**: `Migration failed to apply`

**Fix**:
```bash
ssh draco@192.168.1.15
cd ~/ProjectPulse/apps/web

# Check migration status
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma migrate status

# Mark failed migration as rolled back
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma migrate resolve --rolled-back <migration-name>

# Re-apply migrations
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma migrate deploy
```

### Issue: Container Won't Start

**Error**: Container exits immediately

**Fix**:
```bash
ssh draco@192.168.1.15

# Check logs
docker-compose -f docker-compose.cloud.yml logs web

# Common causes:
# 1. Environment variable missing
# 2. Database not ready
# 3. Port conflict

# Rebuild containers
docker-compose -f docker-compose.cloud.yml down
docker-compose -f docker-compose.cloud.yml up -d --build
```

### Issue: Old Code Still Running

**Symptom**: New features not appearing

**Fix**:
```bash
ssh draco@192.168.1.15

# Hard restart with rebuild
cd ~/ProjectPulse
docker-compose -f docker-compose.cloud.yml down
docker-compose -f docker-compose.cloud.yml up -d --build

# Clear Next.js cache
docker-compose -f docker-compose.cloud.yml exec web rm -rf .next
docker-compose -f docker-compose.cloud.yml restart web
```

---

## Rollback Procedures

See: `rollback.md` for detailed rollback steps

**Quick rollback**:
```bash
ssh draco@192.168.1.15
cd ~/ProjectPulse
git log --oneline -5  # Find last good commit
git reset --hard <commit-hash>
docker-compose -f docker-compose.cloud.yml restart
```

---

## Deployment Automation (Future)

### GitHub Actions Deployment (Optional)

**When ready to automate**, add this job to `.github/workflows/ci.yml`:

```yaml
deploy:
  name: Deploy to Mac Mini
  runs-on: ubuntu-latest
  needs: [lint, test, e2e, build]
  if: github.ref == 'refs/heads/master'
  steps:
    - name: Deploy via SSH
      uses: appleboy/ssh-action@master
      with:
        host: 192.168.1.15
        username: draco
        key: ${{ secrets.MAC_MINI_SSH_KEY }}
        script: |
          cd ~/ProjectPulse
          git pull origin master
          docker-compose -f docker-compose.cloud.yml restart
```

**Requires**:
- GitHub Secret: `MAC_MINI_SSH_KEY` (SSH private key)
- Static IP or DDNS for Mac mini
- Port forwarding if deploying from outside network

---

## Monitoring

### Set Up Alerts

**Uptime monitoring** (recommended):
- Use UptimeRobot or similar
- Monitor: `http://192.168.1.15:3000/api/health`
- Alert if down for >5 minutes

### Log Aggregation

**View aggregated logs**:
```bash
ssh draco@192.168.1.15 "docker-compose -f ~/ProjectPulse/docker-compose.cloud.yml logs --since 1h"
```

### Performance Monitoring

**Check resource usage**:
```bash
ssh draco@192.168.1.15

# CPU and memory
docker stats

# Disk space
df -h

# Database size
docker exec projectpulse-postgres psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('projectpulse_dev'));"
```

---

## Best Practices

### 1. Always Deploy from Master

Never deploy from feature branches:
```bash
# ✅ Good
git checkout master
git pull origin master
# Then deploy

# ❌ Bad
git checkout feature/my-feature
# Deploy (might have bugs)
```

### 2. Deploy During Low Traffic

**Recommended times**:
- Weekdays: After 6 PM
- Weekends: Anytime
- Avoid: During active development sessions

### 3. Backup Before Major Changes

```bash
# Backup database before major migrations
ssh draco@192.168.1.15
docker exec projectpulse-postgres pg_dump -U postgres projectpulse_dev > ~/backup-$(date +%Y%m%d-%H%M%S).sql
```

### 4. Test Locally First

```bash
# Always test locally before deploying
pnpm --filter web build
pnpm --filter web test
pnpm --filter web test:e2e
```

---

**Last Updated**: 2025-01-17
