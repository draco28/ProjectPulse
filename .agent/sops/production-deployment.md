# Production Deployment Guide for ProjectPulse

**Version**: 1.2
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

### Ollama Connectivity

Both dev and prod containers connect to the native Ollama installation:

```
Container → host.docker.internal:11434 → Mac Mini's Ollama
```

This is automatic - no `OLLAMA_BASE_URL` env var needed. The default in `apps/web/lib/embeddings/ollama.ts` handles it:

```typescript
baseUrl = process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434'
```

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

⚠️ **Migrations are MANUAL** - They do NOT run automatically on container start.

**Why Manual?**: Auto-migration was removed in Sprint 11 because pnpm's symlink structure
in `node_modules/` is incompatible with Docker's `COPY` instruction. Copying the Prisma CLI
to the production image caused build failures.

### Before Deploying (if schema changed)

```bash
# 1. Check if migrations are pending
source .env.prod-local
DATABASE_URL="postgresql://$PROD_POSTGRES_USER:$PROD_POSTGRES_PASSWORD@localhost:5433/$PROD_POSTGRES_DB" \
  pnpm exec prisma migrate status

# 2. Apply pending migrations
DATABASE_URL="postgresql://$PROD_POSTGRES_USER:$PROD_POSTGRES_PASSWORD@localhost:5433/$PROD_POSTGRES_DB" \
  pnpm exec prisma migrate deploy
```

### Check Migration Status

```bash
source .env.prod-local
DATABASE_URL="postgresql://$PROD_POSTGRES_USER:$PROD_POSTGRES_PASSWORD@localhost:5433/$PROD_POSTGRES_DB" \
  pnpm exec prisma migrate status
```

### Workflow When Schema Changes

1. Create migration in dev: `pnpm exec prisma migrate dev --name your_migration_name`
2. Test migration in dev environment
3. Commit migration files to git
4. **Before deployment**: Run `prisma migrate deploy` against prod database
5. Then run `./scripts/deploy-prod.sh`

---

## Seeding Production

Production uses minimal seed (templates only, no test data).

⚠️ **Run from host machine** - Production container is minimal and doesn't have `tsx`.

```bash
# Seed production database from host
source .env.prod-local
DATABASE_URL="postgresql://$PROD_POSTGRES_USER:$PROD_POSTGRES_PASSWORD@localhost:5433/$PROD_POSTGRES_DB" \
  pnpm --filter web db:seed:prod
```

The seed script (`prisma/seed-prod.ts`) creates:
- Onboarding question templates (96 questions)
- Onboarding prompt templates (16 templates)
- Default project and admin user

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
