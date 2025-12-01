# Sprint 11: Production Deployment 🚀 CRITICAL GO-LIVE

**Version**: 1.0.0
**Created**: 2025-11-29
**Status**: 📋 IN PROGRESS
**Sprint Duration**: 3 days (~20 story points)
**Priority**: 🔴 CRITICAL - Enables real users to access the platform

---

## 1. Executive Summary

### Goal

Deploy ProjectPulse to production on Mac Mini (192.168.1.15) using:
- **Port-isolated Docker stacks** (prod on 8080/8081, dev stays on 3000/3001)
- **Cloudflare Tunnel** for secure internet exposure (no port forwarding)
- **App-level authentication only** (no Cloudflare Access - simpler for SaaS)
- **Fresh production database** (separate from dev)
- **Redis** for persistent session storage

### Business Value

- **Real users can access ProjectPulse** from anywhere via internet
- **AI agents can connect** to MCP server with bearer tokens
- **Development continues unaffected** on separate port stack
- **Zero infrastructure cost** (Mac Mini + free Cloudflare tier)
- **Enterprise-grade security** via Cloudflare edge + app auth

### Key Decision

Cloudflare Tunnel provides **transport only**. All authentication handled by the app:
- **Web UI:** Your signup/login system (NextAuth)
- **MCP API:** Project-specific session tokens (existing architecture)

### Timeline

| Day | Focus | Deliverables |
|-----|-------|--------------|
| Day 1 | Infrastructure | Dockerfiles, docker-compose, env files |
| Day 2 | Services | Cloudflare Tunnel, Redis, Database |
| Day 3 | Automation | Deploy script, testing, documentation |

---

## 2. Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INTERNET (Cloudflare Edge)                        │
│                                                                          │
│   Users ──→ Cloudflare Tunnel (transport only) ──→ Your App Auth        │
│                                                                          │
│   *.trycloudflare.com (temporary) or custom domain (future)             │
│   No Cloudflare Access - simpler single login via app                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Mac Mini (192.168.1.15)                           │
├────────────────────────────────┬────────────────────────────────────────┤
│  PRODUCTION STACK              │  DEV STACK (unchanged)                 │
│  docker-compose.prod-local.yml │  docker-compose.cloud.yml              │
│                                │                                        │
│  prod-nextjs    :8080 ◄────────┼──── Tunnel (web)                       │
│  prod-mcp       :8081 ◄────────┼──── Tunnel (api)                       │
│  prod-postgres  :5433          │  nextjs     :3000                      │
│  prod-redis     :6380          │  mcp        :3001                      │
│  cloudflared    (outbound)     │  postgres   :5432                      │
│                                │                                        │
│  Network: pp-prod              │  Network: pp-cloud                     │
│  DB: projectpulse_prod         │  DB: projectpulse_dev                  │
└────────────────────────────────┴────────────────────────────────────────┘
```

### Port Allocation

| Service | Dev Port | Prod Port | Notes |
|---------|----------|-----------|-------|
| Next.js Web | 3000 | 8080 | Different host ports |
| MCP Server | 3001 | 8081 | Different host ports |
| PostgreSQL | 5432 | 5433 | Separate databases |
| Redis | - | 6380 | Prod only |

### Authentication Flow

**Web UI Flow:**
```
User → Cloudflare Tunnel → Next.js → App Login (NextAuth) → Dashboard
```

**MCP API Flow:**
```
AI Agent → Cloudflare Tunnel → MCP Server → Bearer Token Validation → Tools
```

---

## 3. User Stories

### US-011-01: Production Dockerfiles (5 points)

**As a** DevOps engineer
**I want** optimized production Docker images
**So that** the application runs efficiently and securely in production

**Acceptance Criteria:**
- [ ] `apps/web/Dockerfile.production` created with multi-stage build
- [ ] `apps/mcp-server/Dockerfile.production` created with multi-stage build
- [ ] Images use non-root user for security
- [ ] Health checks baked into images
- [ ] Image sizes: web ≤300MB, mcp ≤200MB
- [ ] Node.js production optimizations applied

**Files to Create:**

```dockerfile
# apps/web/Dockerfile.production
# ==================================
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/roadmap-tools/package.json ./packages/roadmap-tools/
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN npm install -g pnpm
RUN cd packages/roadmap-tools && pnpm build
RUN cd apps/web && npx prisma generate && pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1))"
CMD ["node", "server.js"]
```

```dockerfile
# apps/mcp-server/Dockerfile.production
# ======================================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/mcp-server/package.json ./apps/mcp-server/
COPY packages/roadmap-tools/package.json ./packages/roadmap-tools/
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm
RUN cd packages/roadmap-tools && pnpm build
RUN cd apps/mcp-server && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 mcpuser
COPY --from=builder --chown=mcpuser:nodejs /app/apps/mcp-server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/roadmap-tools/dist ./packages/roadmap-tools/dist
USER mcpuser
EXPOSE 3001
ENV MCP_PORT 3001
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/health').then(r => process.exit(r.ok ? 0 : 1))"
CMD ["node", "dist/index.js"]
```

---

### US-011-02: Docker Compose Production Stack (3 points)

**As a** DevOps engineer
**I want** a production Docker Compose configuration
**So that** all services run in isolated containers with proper networking

**Acceptance Criteria:**
- [ ] `docker-compose.prod-local.yml` created
- [ ] All services on separate `pp-prod` network
- [ ] Port isolation from dev stack (8080/8081/5433/6380)
- [ ] Health checks for all services
- [ ] Resource limits defined
- [ ] Volume persistence for data
- [ ] Cloudflared container for tunnel

**File to Create:** `docker-compose.prod-local.yml`

```yaml
# Production stack for Mac Mini (runs alongside dev)
version: "3.8"

services:
  prod-postgres:
    image: pgvector/pgvector:pg15
    container_name: projectpulse-prod-postgres
    environment:
      POSTGRES_USER: ${PROD_POSTGRES_USER:-projectpulse}
      POSTGRES_PASSWORD: ${PROD_POSTGRES_PASSWORD:?required}
      POSTGRES_DB: ${PROD_POSTGRES_DB:-projectpulse_prod}
    volumes:
      - prod_postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "5433:5432"
    networks:
      - pp-prod
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${PROD_POSTGRES_USER:-projectpulse}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  prod-redis:
    image: redis:7-alpine
    container_name: projectpulse-prod-redis
    command: redis-server --requirepass ${PROD_REDIS_PASSWORD:?required}
    volumes:
      - prod_redis_data:/data
    ports:
      - "6380:6379"
    networks:
      - pp-prod
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${PROD_REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  prod-nextjs:
    build:
      context: .
      dockerfile: apps/web/Dockerfile.production
    image: projectpulse/web:latest
    container_name: projectpulse-prod-web
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${PROD_POSTGRES_USER:-projectpulse}:${PROD_POSTGRES_PASSWORD}@prod-postgres:5432/${PROD_POSTGRES_DB:-projectpulse_prod}
      REDIS_URL: redis://:${PROD_REDIS_PASSWORD}@prod-redis:6379
      NEXTAUTH_URL: ${PROD_PUBLIC_URL:-http://localhost:8080}
      NEXTAUTH_SECRET: ${PROD_NEXTAUTH_SECRET:?required}
      DEFAULT_PROJECT_ID: 1
    ports:
      - "8080:3000"
    networks:
      - pp-prod
    depends_on:
      prod-postgres:
        condition: service_healthy
      prod-redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 2G

  prod-mcp:
    build:
      context: .
      dockerfile: apps/mcp-server/Dockerfile.production
    image: projectpulse/mcp-server:latest
    container_name: projectpulse-prod-mcp
    environment:
      NODE_ENV: production
      PROJECTPULSE_API_URL: http://prod-nextjs:3000
      MCP_PORT: 3001
      REDIS_URL: redis://:${PROD_REDIS_PASSWORD}@prod-redis:6379
    ports:
      - "8081:3001"
    networks:
      - pp-prod
    depends_on:
      prod-nextjs:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3001/health').then(r => process.exit(r.ok ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 512M

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: projectpulse-cloudflared
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN:?required}
    networks:
      - pp-prod
    depends_on:
      - prod-nextjs
      - prod-mcp
    restart: unless-stopped

networks:
  pp-prod:
    name: projectpulse-prod
    driver: bridge

volumes:
  prod_postgres_data:
    name: projectpulse_prod_postgres_data
  prod_redis_data:
    name: projectpulse_prod_redis_data
```

---

### US-011-03: Redis Session Store (3 points)

**As a** developer
**I want** sessions stored in Redis
**So that** user sessions persist across container restarts

**Acceptance Criteria:**
- [ ] `ioredis` package added to dependencies
- [ ] Redis session adapter configured for NextAuth
- [ ] Sessions survive container restarts
- [ ] Session expiry configured (7 days default)
- [ ] Graceful fallback if Redis unavailable

**Files to Modify:**

1. `apps/web/package.json` - Add `ioredis` dependency
2. `apps/web/lib/auth.ts` - Configure Redis session adapter
3. Create `apps/web/lib/redis.ts` - Redis client singleton

**Implementation Notes:**

```typescript
// apps/web/lib/redis.ts
import Redis from 'ioredis';

const getRedisClient = () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('REDIS_URL not set, sessions will use in-memory storage');
    return null;
  }
  return new Redis(redisUrl);
};

export const redis = getRedisClient();
```

---

### US-011-04: Cloudflare Tunnel Setup (2 points)

**As a** DevOps engineer
**I want** Cloudflare Tunnel configured
**So that** the app is securely accessible from the internet

**Acceptance Criteria:**
- [ ] Cloudflare account created (free tier)
- [ ] Tunnel created named `projectpulse-prod`
- [ ] Tunnel token stored securely
- [ ] Public hostnames configured:
  - `<tunnel>.trycloudflare.com` → `http://prod-nextjs:3000`
  - `api-<tunnel>.trycloudflare.com` → `http://prod-mcp:3001`
- [ ] HTTPS automatically provided by Cloudflare

**Setup Steps:**

1. Login to Cloudflare Dashboard → Zero Trust → Access → Tunnels
2. Create new tunnel named `projectpulse-prod`
3. Copy the tunnel token
4. Add to `.env.prod-local`:
   ```
   CLOUDFLARE_TUNNEL_TOKEN=<your-tunnel-token>
   ```
5. Configure public hostnames in Cloudflare dashboard

**Auth Strategy (App-Level Only):**

- Skip Cloudflare Access (would require users to login twice)
- App already has user authentication (NextAuth)
- MCP has project-specific session tokens
- Simpler UX for SaaS MVP

**What Cloudflare Tunnel Provides:**
- Secure transport (HTTPS automatically)
- DDoS protection at edge
- No port forwarding needed
- Clean URLs (no IP:port)

---

### US-011-05: Database & Migration Workflow (3 points)

**As a** DevOps engineer
**I want** a fresh production database
**So that** prod data is isolated from development

**Acceptance Criteria:**
- [ ] `scripts/init-db.sql` created with pgvector extension
- [ ] Production database initialized (`projectpulse_prod`)
- [ ] Prisma migrations applied successfully
- [ ] Seed data optional (not auto-run in prod)
- [ ] Migration deployment procedure documented

**Files to Create:**

```sql
-- scripts/init-db.sql
-- Enable required PostgreSQL extensions for ProjectPulse

-- Vector similarity search for knowledge base
CREATE EXTENSION IF NOT EXISTS vector;

-- Full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**Database Separation:**

| Environment | Host Port | Database Name | Purpose |
|-------------|-----------|---------------|---------|
| Development | 5432 | projectpulse_dev | Active development |
| Production | 5433 | projectpulse_prod | Live users |

**Migration Procedure:**

```bash
# Apply migrations to production database
DATABASE_URL="postgresql://projectpulse:<password>@192.168.1.15:5433/projectpulse_prod" \
  npx prisma migrate deploy

# NEVER use `prisma db push` or `prisma migrate dev` on production!
```

---

### US-011-06: Deployment Automation (2 points)

**As a** DevOps engineer
**I want** an automated deployment script
**So that** deployments are consistent and reliable

**Acceptance Criteria:**
- [ ] `scripts/prod-local-deploy.sh` created
- [ ] Environment validation before deployment
- [ ] Image builds automated
- [ ] Database migrations automated
- [ ] Health check verification
- [ ] Rollback procedure documented

**File to Create:** `scripts/prod-local-deploy.sh`

```bash
#!/bin/bash
set -e

echo "🚀 ProjectPulse Production Deployment (Mac Mini)"
echo "================================================"

# Check environment file
if [ ! -f .env.prod-local ]; then
  echo "❌ Error: .env.prod-local not found"
  echo "   Copy .env.prod-local.example and fill in values"
  exit 1
fi

# Load environment
export $(cat .env.prod-local | grep -v '^#' | xargs)

# Validate required vars
REQUIRED_VARS="PROD_POSTGRES_PASSWORD PROD_REDIS_PASSWORD CLOUDFLARE_TUNNEL_TOKEN PROD_NEXTAUTH_SECRET"
for var in $REQUIRED_VARS; do
  if [ -z "${!var}" ]; then
    echo "❌ Error: Missing required variable: $var"
    exit 1
  fi
done

echo "📦 Building production images..."
docker build -f apps/web/Dockerfile.production -t projectpulse/web:latest .
docker build -f apps/mcp-server/Dockerfile.production -t projectpulse/mcp-server:latest .

echo "🗄️ Starting database services..."
docker compose -f docker-compose.prod-local.yml up -d prod-postgres prod-redis

echo "⏳ Waiting for database health..."
sleep 10

echo "📊 Running database migrations..."
DATABASE_URL="postgresql://${PROD_POSTGRES_USER:-projectpulse}:${PROD_POSTGRES_PASSWORD}@192.168.1.15:5433/${PROD_POSTGRES_DB:-projectpulse_prod}" \
  npx prisma migrate deploy

echo "🌐 Starting application services..."
docker compose -f docker-compose.prod-local.yml up -d

echo "⏳ Waiting for services to be healthy..."
sleep 15

echo "✅ Verifying deployment..."
curl -sf http://192.168.1.15:8080/api/health && echo " Web: OK" || echo " Web: FAILED"
curl -sf http://192.168.1.15:8081/health && echo " MCP: OK" || echo " MCP: FAILED"

echo ""
echo "🎉 Production deployment complete!"
echo "   Web: http://192.168.1.15:8080"
echo "   MCP: http://192.168.1.15:8081"
echo "   Tunnel: Check Cloudflare dashboard for public URL"
```

**Rollback Procedure:**

```bash
# Stop production stack
docker compose -f docker-compose.prod-local.yml down

# Rollback to previous image (if tagged)
docker tag projectpulse/web:previous projectpulse/web:latest
docker compose -f docker-compose.prod-local.yml up -d

# DANGER: Remove production data (only if absolutely needed)
# docker volume rm projectpulse_prod_postgres_data projectpulse_prod_redis_data
```

---

### US-011-07: Documentation (2 points)

**As a** DevOps engineer
**I want** comprehensive deployment documentation
**So that** anyone can deploy and maintain production

**Acceptance Criteria:**
- [ ] `DEPLOYMENT.md` created in project root
- [ ] Environment setup guide included
- [ ] Ongoing deployment workflow documented
- [ ] Troubleshooting guide included
- [ ] Security considerations documented

**File to Create:** `DEPLOYMENT.md`

---

## 4. Files to Create/Modify Summary

| File | Action | Story | Purpose |
|------|--------|-------|---------|
| `apps/web/Dockerfile.production` | CREATE | US-011-01 | Production web image |
| `apps/mcp-server/Dockerfile.production` | CREATE | US-011-01 | Production MCP image |
| `docker-compose.prod-local.yml` | CREATE | US-011-02 | Production stack |
| `.env.prod-local.example` | CREATE | US-011-02 | Environment template |
| `.env.prod-local` | CREATE | US-011-02 | Actual credentials (gitignored) |
| `apps/web/lib/redis.ts` | CREATE | US-011-03 | Redis client |
| `apps/web/lib/auth.ts` | MODIFY | US-011-03 | Redis session adapter |
| `scripts/init-db.sql` | CREATE | US-011-05 | Database initialization |
| `scripts/prod-local-deploy.sh` | CREATE | US-011-06 | Deployment script |
| `DEPLOYMENT.md` | CREATE | US-011-07 | Production documentation |
| `.gitignore` | MODIFY | - | Add `.env.prod-local` |
| `apps/web/next.config.js` | MODIFY | US-011-01 | Enable standalone output |

---

## 5. Environment Variables

### Production Environment Template (`.env.prod-local.example`)

```bash
# ============================================
# ProjectPulse Production Environment
# Mac Mini Local Deployment
# ============================================

# Database (use strong passwords!)
PROD_POSTGRES_USER=projectpulse
PROD_POSTGRES_PASSWORD=<generate-strong-password-here>
PROD_POSTGRES_DB=projectpulse_prod

# Redis (use strong password!)
PROD_REDIS_PASSWORD=<generate-strong-password-here>

# NextAuth (generate with: openssl rand -base64 32)
PROD_NEXTAUTH_SECRET=<generate-secret-here>

# Public URL (will be Cloudflare tunnel URL)
PROD_PUBLIC_URL=https://<your-tunnel>.trycloudflare.com

# Cloudflare Tunnel Token (from Cloudflare dashboard)
CLOUDFLARE_TUNNEL_TOKEN=<your-tunnel-token>

# Optional: Custom domain (future)
# PROD_DOMAIN=projectpulse.yourdomain.com
```

---

## 6. Security Considerations

### Immediate (This Sprint)

- [x] Separate databases (dev/prod isolation)
- [ ] Strong passwords (generated, not default)
- [ ] Cloudflare Tunnel (HTTPS, DDoS protection)
- [ ] App-level authentication (web + MCP)
- [ ] Redis password required
- [ ] Non-root Docker users
- [ ] Environment variables not in code

### Future Enhancements

- Rate limiting at Cloudflare edge (WAF rules)
- Cloudflare Access for admin routes only
- Database backups (automated pg_dump)
- Monitoring/alerting (Prometheus/Grafana)
- Log aggregation (Loki)
- Custom domain with SSL

---

## 7. Verification Checklist

### Pre-Deployment

- [ ] `.env.prod-local` created with all required values
- [ ] Strong passwords generated (32+ characters)
- [ ] Cloudflare tunnel created and token obtained
- [ ] Mac Mini has sufficient disk space (>10GB free)
- [ ] Dev stack confirmed working (not affected)

### Post-Deployment

- [ ] `curl http://192.168.1.15:8080/api/health` returns `{"status":"healthy"}`
- [ ] `curl http://192.168.1.15:8081/health` returns `{"status":"ok"}`
- [ ] Cloudflare tunnel URL accessible from internet
- [ ] User can sign up and login via tunnel URL
- [ ] MCP connection works with bearer token
- [ ] Sessions persist after container restart
- [ ] Dev stack still works on ports 3000/3001

---

## 8. Quick Reference

### Start Production

```bash
docker compose -f docker-compose.prod-local.yml up -d
```

### Start Development (unchanged)

```bash
docker compose -f docker-compose.cloud.yml up -d
```

### Check Both Running

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
```

### View Logs

```bash
# Production
docker compose -f docker-compose.prod-local.yml logs -f

# Specific service
docker logs -f projectpulse-prod-web
```

### Deploy Code Changes

```bash
# Pull latest code
git pull origin master

# Rebuild and restart
./scripts/prod-local-deploy.sh
```

---

## 9. Success Criteria

Sprint 11 is complete when:

- ✅ Production stack runs on ports 8080/8081/5433/6380
- ✅ Dev stack continues on ports 3000/3001/5432
- ✅ Cloudflare tunnel accessible from internet
- ✅ App authentication working (signup/login)
- ✅ MCP session validation working via tunnel
- ✅ Redis sessions persist across container restarts
- ✅ Health checks passing on both environments
- ✅ Fresh production database initialized
- ✅ Deployment script tested end-to-end
- ✅ DEPLOYMENT.md documentation complete

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Port conflict with dev | Low | High | Different port ranges, separate networks |
| Cloudflare outage | Low | High | Tunnel reconnects automatically |
| Database corruption | Low | Critical | Separate volumes, backup strategy |
| Session loss on restart | Medium | Medium | Redis persistence, volume mounts |
| Image build failures | Medium | Medium | Multi-stage builds, layer caching |

---

## 11. Reference Documents

- **Original Plan:** `.agent/task/Production_Deployment_Plan.md`
- **Infrastructure State:** `.agent/system/infrastructure-state.md`
- **Project Plan:** `docs/13-Project-Plan.md`
- **Memory (Database Rules):** Never use `prisma db push` on production

---

**🚀 This is the CRITICAL GO-LIVE sprint. Execute with precision.**
