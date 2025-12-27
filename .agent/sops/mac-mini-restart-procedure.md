# Mac Mini Restart Procedure

## Overview

This SOP documents the steps to verify and restore ProjectPulse services after a Mac mini restart or power cycle.

**Key Point**: With proper configuration, services auto-start. This SOP is primarily for verification and troubleshooting.

## Prerequisites

- SSH access to Mac mini or physical access
- Docker Desktop installed with "Start Docker Desktop when you log in" enabled
- Both compose files configured with `restart: unless-stopped`

## Automatic Startup (Expected Behavior)

When Mac mini restarts:

1. **macOS boots** → Login (auto-login or manual)
2. **Docker Desktop auto-starts** → Docker daemon initializes
3. **Containers auto-start** → All 9 containers come up with `restart: unless-stopped`
4. **Cloudflare tunnel reconnects** → Production accessible via internet

**Total recovery time**: ~2-3 minutes after login

## Verification Steps

### Step 1: Verify Docker is Running

```bash
docker info
```

**Expected**: Shows Docker version, storage driver, containers info
**If fails**: Docker Desktop not running - open it manually

### Step 2: Check Container Status

```bash
docker ps
```

**Expected**: 9 containers running:
- `postgres-cloud`, `redis-cloud`, `nextjs-cloud`, `mcp-server-cloud` (dev)
- `prod-postgres`, `prod-redis`, `prod-nextjs`, `prod-mcp`, `cloudflared` (prod)

### Step 3: Verify Health Endpoints

```bash
# Development
curl http://localhost:3000/api/health
# Expected: {"status":"healthy","database":"connected","redis":true}

# Production
curl http://localhost:8080/api/health
# Expected: {"status":"healthy","database":"connected","redis":true}
```

### Step 4: Verify Database Connectivity

```bash
docker exec postgres-cloud pg_isready -U postgres
docker exec prod-postgres pg_isready -U postgres
```

**Expected**: `accepting connections`

### Step 5: Verify Cloudflare Tunnel (Production)

```bash
docker logs cloudflared --tail 20
```

**Expected**: Shows tunnel connection established, no errors

### Step 6: Test External Access

```bash
curl https://projectpulse.dracodev.dev/api/health
```

**Expected**: Same health response as internal

## Manual Recovery (If Auto-Start Fails)

### Start Docker Desktop

```bash
# Via command line
open -a Docker

# Or click Docker icon in Applications
```

Wait ~30 seconds for Docker to initialize.

### Start Development Stack

```bash
cd /Users/draco/projects/AI_HUB
docker compose -f docker-compose.cloud.yml up -d
```

### Start Production Stack

```bash
cd /Users/draco/projects/AI_HUB
docker compose -f docker-compose.prod-local.yml up -d
```

### Wait for Health Checks

```bash
# Watch container health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Wait for all containers to show "healthy"
```

## Quick Verification Script

Save this as `scripts/verify-services.sh`:

```bash
#!/bin/bash
set -e

echo "=== Docker Status ==="
docker info > /dev/null 2>&1 && echo "✅ Docker running" || echo "❌ Docker not running"

echo ""
echo "=== Container Count ==="
RUNNING=$(docker ps -q | wc -l | tr -d ' ')
echo "Running containers: $RUNNING (expected: 9)"

echo ""
echo "=== Health Checks ==="
curl -sf http://localhost:3000/api/health > /dev/null && echo "✅ Dev web healthy" || echo "❌ Dev web down"
curl -sf http://localhost:8080/api/health > /dev/null && echo "✅ Prod web healthy" || echo "❌ Prod web down"
curl -sf http://localhost:3001/health > /dev/null && echo "✅ Dev MCP healthy" || echo "❌ Dev MCP down"
curl -sf http://localhost:8081/health > /dev/null && echo "✅ Prod MCP healthy" || echo "❌ Prod MCP down"

echo ""
echo "=== Cloudflare Tunnel ==="
docker logs cloudflared --tail 5 2>&1 | grep -q "error\|Error" && echo "⚠️ Tunnel has errors" || echo "✅ Tunnel OK"

echo ""
echo "=== External Access ==="
curl -sf https://projectpulse.dracodev.dev/api/health > /dev/null && echo "✅ External access working" || echo "❌ External access failed"
```

## Troubleshooting

### Docker Not Starting

1. Check if Docker Desktop is installed: `ls /Applications/Docker.app`
2. Check system resources: `top -l 1 | head -20`
3. Check Docker logs: `~/Library/Containers/com.docker.docker/Data/log/vm/`

### Containers Not Auto-Starting

1. Verify restart policy:
   ```bash
   docker inspect --format '{{.HostConfig.RestartPolicy.Name}}' postgres-cloud
   # Expected: unless-stopped
   ```

2. If wrong, recreate containers:
   ```bash
   docker compose -f docker-compose.cloud.yml down
   docker compose -f docker-compose.cloud.yml up -d
   ```

### Cloudflare Tunnel Not Connecting

1. Check tunnel token is still valid
2. Verify network connectivity: `ping -c 3 cloudflare.com`
3. Restart cloudflared: `docker restart cloudflared`

### Database Not Ready

1. Check PostgreSQL logs:
   ```bash
   docker logs postgres-cloud --tail 50
   docker logs prod-postgres --tail 50
   ```

2. Wait for recovery (large databases take longer)
3. Check disk space: `docker system df`

## Checklist for Quick Reference

```markdown
After Mac mini restart:

- [ ] Docker Desktop running (menu bar icon visible)
- [ ] 9 containers running (`docker ps`)
- [ ] Dev health OK (`curl localhost:3000/api/health`)
- [ ] Prod health OK (`curl localhost:8080/api/health`)
- [ ] MCP health OK (`curl localhost:3001/health`, `localhost:8081/health`)
- [ ] Cloudflare tunnel connected (check logs)
- [ ] External access working (`curl https://projectpulse.dracodev.dev/api/health`)
```

## Related SOPs

- [Mac Mini Cloud Architecture](./mac-mini-cloud-architecture.md)
- [Production Deployment](./production-deployment.md)
- [Mac Mini Docker Setup](./mac-mini-docker-setup.md)
