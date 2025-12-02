# Production Deployment Guide for ProjectPulse

**Version**: 1.1
**Last Updated**: 2025-12-02
**Author**: Sprint 11 Infrastructure

---

## Overview

ProjectPulse production runs on **Mac Mini using docker-compose**. This approach was chosen because:

1. **Ollama dependency** - Native Ollama installation on Mac Mini for embeddings
2. **Simplicity** - No VM or external VPS needed
3. **Works now** - Current setup is stable and tested

**Future Option**: When dedicated Linux infrastructure is available, consider Dokploy or Coolify for GitOps.

**Current Architecture**:
```
Mac Mini (macOS)
├── Dev Stack (docker-compose.cloud.yml) - port 3000
├── Prod Stack (docker-compose.prod-local.yml) - port 8080
├── Ollama (native) - port 11434
└── Cloudflare Tunnel → dracodev.dev
```

---

## Quick Deploy Commands

### Full Deployment (Recommended)

```bash
./scripts/deploy-prod.sh
```

This pulls code, builds images, restarts containers, and runs smoke tests.

### Quick Restart (Code-only changes)

```bash
./scripts/deploy-prod.sh --quick
```

Restarts containers without rebuilding. Use when no Dockerfile changes.

### Smoke Tests Only

```bash
./scripts/deploy-prod.sh --test
```

Verify production is healthy without making changes.

---

## Manual Deployment Steps

If you prefer manual control:

### Step 1: Pull Latest Code

```bash
git checkout master
git pull origin master
```

### Step 2: Build Production Images

```bash
docker compose --env-file .env.prod-local -f docker-compose.prod-local.yml build prod-nextjs prod-mcp
```

### Step 3: Restart Containers

```bash
docker compose --env-file .env.prod-local -f docker-compose.prod-local.yml up -d prod-nextjs prod-mcp
```

### Step 4: Verify Health

```bash
curl http://localhost:8080/api/health
curl http://localhost:8081/health
```

---

## Port Configuration

| Service | Dev Port | Prod Port | External URL |
|---------|----------|-----------|--------------|
| Web App | 3000 | 8080 | https://projectpulse.dracodev.dev |
| MCP Server | 3001 | 8081 | https://projectpulsemcp.dracodev.dev |
| PostgreSQL | 5432 | 5433 | (internal only) |
| Redis | 6379 | 6380 | (internal only) |
| Ollama | 11434 | 11434 | (native, shared) |

---

## Cloudflare Tunnel

Production is exposed via Cloudflare Tunnel (not direct ports).

### Verify Tunnel Status

```bash
docker logs projectpulse-cloudflared --tail 20
```

### Restart Tunnel

```bash
docker compose -f docker-compose.prod-local.yml restart cloudflared
```

### External URLs

- Web: https://projectpulse.dracodev.dev
- MCP: https://projectpulsemcp.dracodev.dev

---

## Database Migrations

Migrations run automatically on container start via `docker-entrypoint.sh`.

### Manual Migration (if needed)

```bash
# Connect to prod database
DATABASE_URL="postgresql://..." pnpm prisma migrate deploy
```

### Check Migration Status

```bash
DATABASE_URL="postgresql://..." pnpm prisma migrate status
```

---

## Seeding Production

Production uses minimal seed (templates only, no test data):

```bash
# After container is running
docker exec -it projectpulse-prod-web sh
cd /app && npx tsx prisma/seed-prod.ts
```

Or from host:
```bash
DATABASE_URL="postgresql://..." pnpm --filter web db:seed:prod
```

---

## Rollback Procedure

### Quick Rollback (to previous image)

```bash
# Stop current
docker compose -f docker-compose.prod-local.yml stop prod-nextjs prod-mcp

# Find previous image
docker images | grep projectpulse

# Start with previous tag
docker compose -f docker-compose.prod-local.yml up -d
```

### Git Rollback

```bash
# Find working commit
git log --oneline -10

# Checkout and rebuild
git checkout <commit-hash>
./scripts/deploy-prod.sh
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod-local.yml logs prod-nextjs
docker compose -f docker-compose.prod-local.yml logs prod-mcp
```

### Database Connection Failed

```bash
# Verify PostgreSQL is healthy
docker exec projectpulse-prod-postgres pg_isready -U projectpulse
```

### CSS Not Loading

Check Dockerfile static file paths. See fix in commit `6d4cf2f`.

### Migration Failed

See [Prisma Migration SOP](./prisma-migration-prod.md).

---

## Future: GitOps Migration

When ready for GitOps (requires Linux server):

1. **Dokploy** - https://dokploy.com (requires Linux)
2. **Coolify** - https://coolify.io (requires Linux)
3. **External VPS** - $5/mo DigitalOcean/Hetzner

Requirements:
- Linux server (VM or VPS)
- Network access to Mac Mini's Ollama (if needed)
- Reconfigure Cloudflare Tunnel

---

## See Also

- [Dev to Prod Deployment SOP](./dev-to-prod-deployment.md)
- [Prisma Migration SOP](./prisma-migration-prod.md)
- [Mac Mini Cloud Architecture](./mac-mini-cloud-architecture.md)
