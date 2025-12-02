# Dev to Production Deployment SOP

**Version**: 1.0
**Last Updated**: 2025-12-02
**Author**: Sprint 11 Infrastructure

---

## Overview

This SOP covers deploying changes from development to production on the Mac Mini local deployment. Both environments run on the same machine but are isolated via Docker Compose files and ports.

### Environment Summary

| Environment | Compose File | Web Port | MCP Port | DB Port |
|-------------|--------------|----------|----------|---------|
| Development | `docker-compose.cloud.yml` | 3000 | 3001 | 5432 |
| Production | `docker-compose.prod-local.yml` | 8080 | 8081 | 5433 |

---

## Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] All unit tests pass: `pnpm test`
- [ ] E2E tests pass: `pnpm test:e2e`
- [ ] TypeScript compiles: `pnpm type-check`
- [ ] Changes committed to feature branch
- [ ] PR merged to master (or direct commit approved)
- [ ] `.env.prod-local` exists with valid credentials

---

## Deployment Steps

### Option A: Full Deployment (Recommended)

Use this when deploying for the first time or after major changes:

```bash
# 1. Ensure you're on the correct branch
git checkout master
git pull origin master

# 2. Run the full deployment script
./scripts/prod-local-deploy.sh
```

This script will:
- Validate environment variables
- Build production Docker images
- Start database services
- Run Prisma migrations
- Start application services
- Verify health endpoints

### Option B: Quick Update (Code Changes Only)

Use this for minor code changes when databases don't need migration:

```bash
# 1. Pull latest code
git pull origin master

# 2. Rebuild and restart only application containers
docker compose --env-file .env.prod-local -f docker-compose.prod-local.yml build prod-nextjs prod-mcp
docker compose --env-file .env.prod-local -f docker-compose.prod-local.yml up -d prod-nextjs prod-mcp

# 3. Run smoke tests to verify
./scripts/prod-smoke-test.sh --skip-build
```

### Option C: Smoke Test Only (Verify Current Deployment)

Use this to verify production is healthy without making changes:

```bash
./scripts/prod-smoke-test.sh --skip-build
```

---

## Smoke Tests

The smoke test script validates 5 critical paths:

| Test | What It Validates |
|------|-------------------|
| Web Health | `/api/health` returns 200 |
| CSS Assets | Static CSS files are accessible (catches Dockerfile bugs) |
| MCP Health | `/health` returns 200 |
| Database | Health API reports `"database":"connected"` |
| Redis | Health API reports `"redis":true` |

**When to run:**
- After any Dockerfile changes
- After any build system changes
- After deploying new code
- When debugging production issues

---

## Cloudflare Tunnel Verification

After deployment, verify the tunnel is active:

```bash
# Check tunnel container is running
docker ps | grep cloudflared

# Check tunnel logs for connection
docker logs projectpulse-cloudflared --tail 10

# Test external access
curl -sf https://projectpulse.dracodev.dev/api/health
curl -sf https://projectpulsemcp.dracodev.dev/health
```

---

## Rollback Procedure

### Quick Rollback (to Previous Image)

If the new deployment has issues and you need to rollback:

```bash
# 1. Stop current containers
docker compose -f docker-compose.prod-local.yml stop prod-nextjs prod-mcp

# 2. Find previous image
docker images projectpulse/web --format "table {{.Tag}}\t{{.CreatedAt}}"

# 3. Tag previous version as latest (if needed)
docker tag projectpulse/web:<previous-tag> projectpulse/web:latest

# 4. Restart containers
docker compose -f docker-compose.prod-local.yml up -d prod-nextjs prod-mcp

# 5. Verify rollback
./scripts/prod-smoke-test.sh --skip-build
```

### Full Rollback (to Previous Git Commit)

If you need to rollback both code and images:

```bash
# 1. Find the previous working commit
git log --oneline -10

# 2. Checkout that commit
git checkout <commit-hash>

# 3. Rebuild and deploy
./scripts/prod-local-deploy.sh
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker compose -f docker-compose.prod-local.yml logs prod-nextjs
docker compose -f docker-compose.prod-local.yml logs prod-mcp

# Check container status
docker compose -f docker-compose.prod-local.yml ps
```

### Database Connection Issues

```bash
# Verify PostgreSQL is healthy
docker exec projectpulse-prod-postgres pg_isready -U projectpulse

# Check DATABASE_URL is correct
# Format: postgresql://user:password@192.168.1.15:5433/dbname
```

### CSS/Static Assets Not Loading

This usually indicates a Dockerfile issue with static file paths:

1. Check the Dockerfile copies static files correctly:
   ```dockerfile
   # CORRECT:
   COPY ... /app/apps/web/.next/static ./.next/static

   # WRONG:
   COPY ... /app/apps/web/.next/static ./apps/web/.next/static
   ```

2. Verify inside container:
   ```bash
   docker exec projectpulse-prod-web ls -la /app/.next/static/css/
   ```

### Redis Connection Issues

```bash
# Test Redis connectivity
docker exec projectpulse-prod-redis redis-cli -a <password> ping

# Check Redis logs
docker logs projectpulse-prod-redis
```

### Tunnel Not Working

```bash
# Restart tunnel
docker compose -f docker-compose.prod-local.yml restart cloudflared

# Check tunnel logs
docker logs projectpulse-cloudflared --tail 50

# Verify token is set
grep CLOUDFLARE_TUNNEL_TOKEN .env.prod-local | wc -c
# Should return > 50 (token is long)
```

---

## Useful Commands Reference

```bash
# View all containers
docker compose -f docker-compose.prod-local.yml ps

# View logs (follow)
docker compose -f docker-compose.prod-local.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod-local.yml logs prod-nextjs

# Restart all services
docker compose -f docker-compose.prod-local.yml restart

# Stop everything
docker compose -f docker-compose.prod-local.yml down

# Stop everything and remove volumes (CAREFUL - loses data!)
docker compose -f docker-compose.prod-local.yml down -v

# Rebuild single service
docker compose -f docker-compose.prod-local.yml build prod-nextjs

# Shell into container
docker exec -it projectpulse-prod-web sh
```

---

## See Also

- [Mac Mini Cloud Architecture](.agent/sops/mac-mini-cloud-architecture.md)
- [Infrastructure Documentation](docs/11-Infrastructure-and-Deployment.md)
- [Port Troubleshooting](.agent/sops/port-troubleshooting.md)
