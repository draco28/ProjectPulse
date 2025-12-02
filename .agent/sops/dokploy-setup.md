# Dokploy Setup Guide for ProjectPulse

**Version**: 1.0
**Last Updated**: 2025-12-02
**Author**: Sprint 11 Infrastructure

---

## Overview

Dokploy is a self-hosted PaaS (Platform as a Service) that provides GitOps-style deployments. It replaces manual `docker-compose` deployments with automatic builds triggered by GitHub webhooks.

**Architecture**:
```
GitHub Push → Webhook → Dokploy → Build Image → Deploy Container → Traefik → HTTPS
```

---

## Prerequisites

Before installing Dokploy:

- [ ] Docker installed and running
- [ ] Ports 80 and 443 available (check for conflicts)
- [ ] Domain configured in Cloudflare (`dracodev.dev`)
- [ ] GitHub repository access

### Check Port Availability

```bash
# Check if ports are in use
lsof -i :80
lsof -i :443

# If dev stack is using these ports, stop it temporarily during setup
docker compose -f docker-compose.cloud.yml down
```

---

## Step 1: Install Dokploy

### On Mac Mini (or Linux server)

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

This installs:
- **Dokploy Server** - Dashboard on port 3000 (we'll change this)
- **Traefik** - Reverse proxy on ports 80/443
- **PostgreSQL** - Dokploy's internal database

### Initial Access

```
http://192.168.1.15:3000
```

Create admin account on first access.

---

## Step 2: Configure Dokploy Port

Dokploy defaults to port 3000, which conflicts with our dev Next.js.

### Change Dokploy Port

1. In Dokploy dashboard: **Settings** > **Server Settings**
2. Change port from `3000` to `9000`
3. Restart Dokploy service

Or edit config directly:
```bash
# Location depends on installation
nano /etc/dokploy/dokploy.yml

# Change:
# port: 3000
# To:
# port: 9000
```

### Restart Dokploy

```bash
systemctl restart dokploy
# or
docker restart dokploy
```

**New dashboard URL**: `http://192.168.1.15:9000`

---

## Step 3: DNS Configuration (Cloudflare)

### Option A: Direct Access (Traefik Handles SSL)

Create A records pointing to Mac Mini's public IP:

| Record | Type | Value |
|--------|------|-------|
| `projectpulse.dracodev.dev` | A | `<public-ip>` |
| `mcp.dracodev.dev` | A | `<public-ip>` |
| `dokploy.dracodev.dev` | A | `<public-ip>` |

**Cloudflare SSL Mode**: Full (strict)

### Option B: Cloudflare Tunnel (Recommended for Home Networks)

If your ISP blocks ports 80/443 or you don't want to expose your IP:

1. Create tunnel in Cloudflare Zero Trust dashboard
2. Install cloudflared on Mac Mini
3. Configure tunnel to point to Traefik

---

## Step 4: Create Dokploy Project

### 4.1 Create Project

1. Dokploy Dashboard > **Projects** > **Create Project**
2. Name: `ProjectPulse Production`

### 4.2 Add GitHub Repository

1. **Settings** > **Git Providers** > **GitHub**
2. Authenticate with GitHub
3. Grant access to `AI_HUB` repository

---

## Step 5: Configure Services

### 5.1 Web Application (Next.js)

1. In project, click **Add Service** > **Application**
2. Configure:

| Setting | Value |
|---------|-------|
| Name | `web` |
| Source | GitHub |
| Repository | `<your-org>/AI_HUB` |
| Branch | `master` |
| Dockerfile Path | `apps/web/Dockerfile.production` |
| Build Context | `.` (root) |

3. **Domains**:
   - Add `projectpulse.dracodev.dev`
   - Enable HTTPS (Let's Encrypt)

4. **Environment Variables**:
```env
DATABASE_URL=postgresql://<user>:<pass>@postgres:5432/projectpulse_prod
REDIS_URL=redis://:password@redis:6379
NEXTAUTH_URL=https://projectpulse.dracodev.dev
NEXTAUTH_SECRET=<generate-strong-secret>
NODE_ENV=production
```

5. **Port**: `3000`

### 5.2 MCP Server

1. **Add Service** > **Application**
2. Configure:

| Setting | Value |
|---------|-------|
| Name | `mcp` |
| Source | GitHub |
| Repository | `<your-org>/AI_HUB` |
| Branch | `master` |
| Dockerfile Path | `apps/mcp-server/Dockerfile.production` |
| Build Context | `.` (root) |

3. **Domains**:
   - Add `mcp.dracodev.dev`
   - Enable HTTPS

4. **Environment Variables**:
```env
DATABASE_URL=postgresql://<user>:<pass>@postgres:5432/projectpulse_prod
PROJECTPULSE_API_URL=http://web:3000
NODE_ENV=production
MCP_PORT=3001
```

5. **Port**: `3001`

### 5.3 PostgreSQL Database

1. **Add Service** > **Database** > **PostgreSQL**
2. Configure:

| Setting | Value |
|---------|-------|
| Name | `postgres` |
| Database | `projectpulse_prod` |
| Username | `projectpulse` |
| Password | `<generate-strong-password>` |

3. **Persistence**: Enable volume mount

**Connection String**:
```
postgresql://projectpulse:<password>@postgres:5432/projectpulse_prod
```

### 5.4 Redis

1. **Add Service** > **Database** > **Redis**
2. Configure:

| Setting | Value |
|---------|-------|
| Name | `redis` |
| Password | `<generate-password>` |

**Connection String**:
```
redis://:<password>@redis:6379
```

---

## Step 6: Configure Auto-Deploy

### Enable GitHub Webhook

For each application (web and mcp):

1. Go to application > **Deployments** tab
2. **Auto Deploy** > Enable
3. **Branch**: `master`
4. **Copy Webhook URL**

### Add Webhook to GitHub

1. GitHub repo > **Settings** > **Webhooks** > **Add webhook**
2. Payload URL: `<copied webhook URL>`
3. Content type: `application/json`
4. Events: `Just the push event`
5. Save

**Result**: Pushing to master triggers automatic deployment!

---

## Step 7: Initial Deployment

### Deploy Services in Order

1. **Deploy PostgreSQL first** (wait for healthy)
2. **Deploy Redis** (wait for healthy)
3. **Deploy Web** (runs migrations via entrypoint)
4. **Deploy MCP**

### Run Initial Seed

After web app is deployed:

```bash
# SSH to Mac Mini or use Dokploy's terminal
docker exec -it <web-container-id> sh

# Inside container:
DATABASE_URL="postgresql://..." npx tsx prisma/seed-prod.ts
```

Or use Dokploy's "Run Command" feature in web app settings.

---

## Step 8: Verify Deployment

### Health Checks

```bash
# Web app health
curl -s https://projectpulse.dracodev.dev/api/health

# MCP health
curl -s https://mcp.dracodev.dev/health
```

### Expected Response

```json
{
  "status": "healthy",
  "database": "connected",
  "redis": true
}
```

---

## Maintenance

### View Logs

```bash
# In Dokploy dashboard
# Application > Logs tab

# Or via CLI
docker logs <container-id> -f
```

### Rollback Deployment

1. Application > **Deployments** tab
2. Find last working deployment
3. Click **Rollback**

### Manual Deploy

1. Application > **Deploy** button
2. Or push any commit to master

### Database Backup

```bash
# From Dokploy or SSH
docker exec projectpulse-postgres pg_dump -U projectpulse projectpulse_prod > backup.sql
```

---

## Troubleshooting

### Container Won't Start

1. Check logs in Dokploy dashboard
2. Common issues:
   - Missing environment variables
   - Database not ready
   - Migration failed

### Migration Fails

See [Prisma Migration SOP](./prisma-migration-prod.md) for detailed troubleshooting.

### SSL Certificate Issues

1. Verify DNS is pointing correctly
2. Check Traefik logs: `docker logs traefik`
3. Ensure ports 80/443 are accessible from internet

### Webhook Not Triggering

1. Check GitHub webhook deliveries
2. Verify Dokploy is accessible from internet
3. Check webhook URL is correct

---

## Port Summary

After Dokploy setup:

| Service | Internal Port | External Access |
|---------|--------------|-----------------|
| Dokploy Dashboard | 9000 | `http://192.168.1.15:9000` |
| Web App | 3000 | `https://projectpulse.dracodev.dev` |
| MCP Server | 3001 | `https://mcp.dracodev.dev` |
| PostgreSQL | 5432 | Internal only |
| Redis | 6379 | Internal only |

**Dev stack** (docker-compose.cloud.yml) continues using:
- Web: 3000
- MCP: 3001
- PostgreSQL: 5432
- Redis: 6379

No conflicts because Dokploy apps use internal Docker networking.

---

## See Also

- [Dokploy Documentation](https://docs.dokploy.com)
- [Dev to Prod Deployment SOP](./dev-to-prod-deployment.md)
- [Prisma Migration SOP](./prisma-migration-prod.md)
