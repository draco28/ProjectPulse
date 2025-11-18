# ProjectPulse Infrastructure Guide

**For:** New Users & Developers
**Level:** Beginner-Friendly (Assumes no prior Docker/DevOps knowledge)
**Last Updated:** 2025-11-18

---

## 📚 Table of Contents

1. [What is Infrastructure?](#what-is-infrastructure)
2. [Understanding Docker (Simple Explanation)](#understanding-docker-simple-explanation)
3. [Our Infrastructure Setup](#our-infrastructure-setup)
4. [Development vs Production](#development-vs-production)
5. [Multi-Stage Docker Builds Explained](#multi-stage-docker-builds-explained)
6. [Session Management (Redis)](#session-management-redis)
7. [Three Docker Compose Files Explained](#three-docker-compose-files-explained)
8. [Current Architecture](#current-architecture)
9. [Common Operations](#common-operations)
10. [Troubleshooting](#troubleshooting)

---

## What is Infrastructure?

**Infrastructure** = The hardware and software that runs your application.

Think of it like a restaurant:
- **Application Code** = The recipe (your Next.js/React code)
- **Infrastructure** = The kitchen, ovens, refrigerators (servers, databases, networking)

In our case, ProjectPulse's infrastructure includes:
- **Mac Mini** = Physical server (the kitchen)
- **Docker** = Containerization system (organized cooking stations)
- **PostgreSQL** = Database (the refrigerator storing ingredients)
- **Redis** = Session store (a notepad tracking customer orders)
- **Next.js Server** = Web application (the chef preparing dishes)
- **MCP Server** = API for AI agents (special orders window)

---

## Understanding Docker (Simple Explanation)

### What is Docker?

**Docker** packages your application and everything it needs into a "container."

**Real-World Analogy:**
- **Without Docker:** Moving is chaos - furniture doesn't fit, things break, setup takes hours
- **With Docker:** Moving company provides standardized boxes - everything fits, labeled, stacks perfectly

### Key Concepts

#### 1. **Container** 
A running instance of your application with everything it needs.

**Example:**
```
Container = Restaurant cooking station
- Has its own stove (CPU)
- Has its own counter space (memory)
- Has ingredients (code + dependencies)
- Can be turned on/off independently
```

#### 2. **Image**
A blueprint for creating containers.

**Example:**
```
Image = Recipe card
- Step-by-step instructions
- List of ingredients
- Can make many dishes from one recipe
```

#### 3. **Volume**
Persistent storage that survives when containers restart.

**Example:**
```
Volume = Pantry/Storage room
- Container restarts = Chef goes home, comes back next day
- Volume = Ingredients still in pantry when chef returns
- Without volume = Everything disappears when chef leaves!
```

#### 4. **Network**
How containers talk to each other.

**Example:**
```
Network = Walkie-talkies between kitchen stations
- Next.js container → PostgreSQL container: "Give me user data"
- PostgreSQL container → Next.js container: "Here's the data"
```

#### 5. **Docker Compose**
Tool to manage multiple containers together.

**Example:**
```
Docker Compose = Restaurant manager coordinating all stations
- Starts PostgreSQL first (prep cook arrives early)
- Then starts Next.js (chef arrives after ingredients ready)
- Defines how stations communicate
```

---

## Our Infrastructure Setup

### Physical Architecture

```
┌─────────────────────────────────────────────────────┐
│ Mac Mini (192.168.1.15)                             │
│ = Physical server running 24/7                      │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Docker (Container Runtime)                  │   │
│  │                                             │   │
│  │  📦 PostgreSQL Container                    │   │
│  │     - Database with pgvector extension     │   │
│  │     - Port 5432                             │   │
│  │     - Volume: postgres_data (20GB)          │   │
│  │                                             │   │
│  │  📦 Redis Container (Production only)       │   │
│  │     - Session storage                       │   │
│  │     - Port 6379                             │   │
│  │     - Volume: redis_data (5GB)              │   │
│  │                                             │   │
│  │  📦 Next.js Container                       │   │
│  │     - Web application                       │   │
│  │     - Port 3000                             │   │
│  │     - Connects to PostgreSQL + Redis        │   │
│  │                                             │   │
│  │  📦 MCP Server Container                    │   │
│  │     - AI agent API                          │   │
│  │     - Port 3001                             │   │
│  │     - Connects to Next.js API               │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         ↑ HTTP requests from your computer
         ↑ http://192.168.1.15:3000
```

### Why Mac Mini?

**Advantages:**
- ✅ Always on (24/7 availability)
- ✅ More powerful than laptop (M-series chip)
- ✅ Dedicated machine (won't slow down your work computer)
- ✅ Local network = Fast access, no internet latency
- ✅ No cloud costs (Vercel/Supabase bills $0)

**Your Workflow:**
1. **Windows Computer:** Write code in Windsurf IDE
2. **Git:** Push code to repository
3. **Mac Mini:** Pull code, restart Docker containers
4. **Browser:** Test at http://192.168.1.15:3000

---

## Development vs Production

We have **two different setups** for different purposes.

### Development Setup (Daily Use)

**File:** `docker-compose.cloud.yml`
**Used on:** Mac Mini for active development

**Characteristics:**
- 📂 **Source code mounted as volume** = Changes reflect immediately
- 🔄 **Hot reload enabled** = Edit code → See changes in browser
- 🐛 **Debug mode active** = Full error messages, stack traces
- 💾 **In-memory sessions** = Sessions lost on restart (acceptable)
- ⚡ **Fast builds** = No optimization, quick startup

**Visual:**
```
┌─────────────────────────────────────┐
│ Your Computer (Windsurf)            │
│ Edit: apps/web/app/page.tsx         │
└───────────────┬─────────────────────┘
                │ git push
                ▼
┌─────────────────────────────────────┐
│ Mac Mini                             │
│ File: apps/web/app/page.tsx         │ ← Volume mounted (live link)
│                                      │
│ Docker Container sees file change   │
│ Next.js auto-reloads                 │
│ Browser refresh → New code visible! │
└─────────────────────────────────────┘
```

**Start Development:**
```bash
# On Mac Mini
cd ~/projects/AI_HUB
docker compose -f docker-compose.cloud.yml up -d
```

---

### Production Setup (Deployment Ready)

**File:** `docker-compose.production.yml`
**Used for:** Testing production builds, cloud deployment

**Characteristics:**
- 📦 **Code baked into image** = No volume mounts
- 🔒 **Optimized builds** = 60% smaller images (~300MB)
- 🔄 **Multi-stage builds** = Only includes what's needed
- 💾 **Redis sessions** = Sessions persist across restarts
- 🚀 **Production-ready** = Can deploy to AWS/GCP/Azure

**Visual:**
```
Build Time:
┌──────────────────────────┐
│ Multi-Stage Dockerfile   │
│                          │
│ Stage 1: Install deps    │ 800MB
│ Stage 2: Build code      │
│ Stage 3: Optimize        │
│ Stage 4: Copy only built │ 300MB ✅
└──────────────────────────┘

Run Time:
┌──────────────────────────┐
│ Production Container     │
│                          │
│ ✅ Code baked in         │
│ ✅ No dev dependencies   │
│ ✅ Non-root user         │
│ ✅ Optimized layers      │
└──────────────────────────┘
```

**Start Production:**
```bash
# On Mac Mini
cd ~/projects/AI_HUB
docker compose -f docker-compose.production.yml up --build
```

---

## Multi-Stage Docker Builds Explained

### What is Multi-Stage Build?

**Simple Analogy:** Making a cake

**Without Multi-Stage (Traditional):**
```
1. Buy all ingredients (2kg flour, 1L milk, eggs...)
2. Mix everything
3. Bake cake
4. Ship EVERYTHING to customer (including leftover flour, mixing bowls, recipe book)

Result: Huge package (10kg total)
```

**With Multi-Stage (Optimized):**
```
1. Buy all ingredients
2. Mix everything
3. Bake cake
4. Ship ONLY the cake (throw away mixing bowls, leftover flour, etc.)

Result: Small package (1kg cake only)
```

### Our Multi-Stage Dockerfile

**File:** `apps/web/Dockerfile.production`

```dockerfile
# ========================================
# Stage 1: Dependencies (800MB)
# ========================================
FROM node:20-bullseye-slim AS deps
# Install ALL packages (including dev tools)
RUN pnpm install --frozen-lockfile

# ========================================
# Stage 2: Build Shared Packages (600MB)
# ========================================
FROM node:20-bullseye-slim AS shared-builder
# Build shared roadmap-tools package
RUN pnpm build

# ========================================
# Stage 3: Generate Prisma Client (500MB)
# ========================================
FROM node:20-bullseye-slim AS prisma
# Generate database client
RUN npx prisma generate

# ========================================
# Stage 4: Build Next.js (400MB)
# ========================================
FROM node:20-bullseye-slim AS builder
# Build Next.js app
RUN npx next build

# ========================================
# Stage 5: Production Runtime (300MB) ✅
# ========================================
FROM node:20-bullseye-slim AS runner
# Copy ONLY:
# - Built Next.js app
# - Production dependencies
# - No dev tools, no source code, no build artifacts

# Final image: 300MB (was 800MB before!)
```

### Benefits

| Aspect | Traditional | Multi-Stage | Benefit |
|--------|------------|-------------|---------|
| **Image Size** | 800MB | 300MB | ✅ 60% smaller |
| **Attack Surface** | Large (has dev tools) | Small (only runtime) | ✅ More secure |
| **Startup Time** | Slower | Faster | ✅ Quick boot |
| **Network Transfer** | Slow download | Fast download | ✅ Deploy faster |

---

## Session Management (Redis)

### What are Sessions?

**Sessions** track user/agent activity across multiple requests.

**Real-World Analogy:**
```
Coffee Shop:
- You order coffee ☕
- Barista gives you ticket #47
- You show ticket → Get your order
- Ticket = Session ID
```

**In ProjectPulse:**
```
AI Agent:
- First request: "List tools"
- Server returns: Mcp-Session-Id: abc-123
- Agent sends session ID with next request
- Server remembers: "This is the same agent"
```

### In-Memory vs Redis Sessions

#### Development (In-Memory)

**Pros:**
- ✅ Zero setup (no Redis needed)
- ✅ Fast (stored in RAM)
- ✅ Simple for local dev

**Cons:**
- ❌ Lost on restart
- ❌ Can't scale horizontally (1 server only)

**Visual:**
```
┌──────────────────────────┐
│ Next.js Container        │
│                          │
│ RAM Memory:              │
│ Session abc-123 → User 1 │
│ Session xyz-789 → User 2 │
└──────────────────────────┘

Container restarts ⚠️
       ↓
┌──────────────────────────┐
│ Next.js Container        │
│                          │
│ RAM Memory:              │
│ (empty - sessions lost!) │
└──────────────────────────┘
```

#### Production (Redis)

**Pros:**
- ✅ Sessions persist across restarts
- ✅ Horizontal scaling (multiple servers share Redis)
- ✅ 1-hour automatic expiration (TTL)

**Cons:**
- ❌ Requires Redis server
- ❌ Slightly slower (network hop)

**Visual:**
```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Next.js Pod 1    │  │ Next.js Pod 2    │  │ Next.js Pod 3    │
│ (3 replicas)     │  │                  │  │                  │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                      │
         └─────────────────────┼──────────────────────┘
                               │
                               ▼
                    ┌──────────────────────────┐
                    │ Redis Container          │
                    │                          │
                    │ Session abc-123 → User 1 │
                    │ Session xyz-789 → User 2 │
                    │ (persistent storage)     │
                    └──────────────────────────┘

Any pod restarts ✅
       ↓
Sessions still exist in Redis!
```

### How We Detect Which to Use

**Automatic Selection:**

```typescript
// In session-manager.ts
if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
  // Use Redis (production mode)
  store = new RedisSessionStore(redisUrl);
} else {
  // Use in-memory (development mode)
  store = new InMemorySessionStore();
}
```

**Check Current Mode:**
```bash
# From your computer
curl http://192.168.1.15:3000/api/health

# Response shows:
{
  "status": "healthy",
  "database": "connected",
  "redis": true,
  "sessionStore": "redis"  ← or "memory"
}
```

---

## Three Docker Compose Files Explained

### Why Three Files?

Different use cases need different configurations.

### 1. `docker-compose.yml` (Legacy/CI)

**Purpose:** Automated testing, local fallback
**Used by:** CI/CD pipelines, Windows laptops (if no Mac mini)

**Characteristics:**
- Exposes ports to 0.0.0.0 (less secure)
- No MCP server
- Simpler configuration

**When to use:**
- Running tests in GitHub Actions
- Quick local testing on Windows (without Mac mini access)
- **NOT used on Mac mini anymore**

---

### 2. `docker-compose.cloud.yml` (Development - ACTIVE)

**Purpose:** Daily development on Mac Mini
**Used by:** You, every day

**Characteristics:**
- ✅ Volume mounts for hot reload
- ✅ MCP server included
- ✅ In-memory sessions (fast)
- ✅ Debug mode enabled

**Start Command:**
```bash
docker compose -f docker-compose.cloud.yml up -d
```

**When to use:**
- Writing new features
- Debugging issues
- Testing changes before committing

---

### 3. `docker-compose.production.yml` (Production)

**Purpose:** Production builds, cloud deployment
**Used by:** Testing before deploy, Kubernetes

**Characteristics:**
- ✅ Multi-stage Dockerfiles
- ✅ Redis for sessions
- ✅ Optimized images (300MB)
- ✅ Security hardened (non-root users)
- ✅ Resource limits set

**Start Command:**
```bash
docker compose -f docker-compose.production.yml up --build
```

**When to use:**
- Testing production build locally
- Before deploying to AWS/GCP/Azure
- Verifying multi-stage builds work

---

### Quick Comparison Table

| Feature | docker-compose.yml | docker-compose.cloud.yml | docker-compose.production.yml |
|---------|-------------------|-------------------------|----------------------------|
| **Purpose** | CI/Testing | Development | Production |
| **Used On** | GitHub Actions | Mac Mini | Kubernetes/Cloud |
| **Source Code** | Volume mount | Volume mount | Baked into image |
| **Hot Reload** | ✅ Yes | ✅ Yes | ❌ No (must rebuild) |
| **Redis** | ❌ No | ❌ No | ✅ Yes |
| **MCP Server** | ❌ No | ✅ Yes | ✅ Yes |
| **Image Size** | 800MB | 800MB | 300MB |
| **Sessions** | In-memory | In-memory | Redis (persistent) |
| **Security** | Basic | Basic | Hardened |

---

## Current Architecture

### Active Setup (As of 2025-11-18)

**Primary Environment:** Development on Mac Mini
**Active File:** `docker-compose.cloud.yml`

```
Mac Mini (192.168.1.15)
├── PostgreSQL:5432 (pgvector/pgvector:pg15)
│   └── Volume: postgres_data (persistent)
│
├── Next.js:3000 (node:20-bullseye-slim)
│   ├── Volume Mount: ./apps/web → /app
│   ├── Hot Reload: ✅ Enabled
│   └── Sessions: InMemorySessionStore
│
└── MCP Server:3001 (node:20-alpine)
    ├── Volume Mount: ./apps/mcp-server → /app
    ├── Connects to: Next.js API
    └── Tools: 36 MCP tools registered
```

### Recent Changes (Sprint 8.5)

**Phase 1 (Commit: ed93b21):**
- Created `packages/roadmap-tools/` shared package
- Eliminated code duplication (220+ lines)

**Infrastructure Upgrade (Commit: 9e2850d):**
- Added `Dockerfile.production` for Next.js (5-stage build)
- Added `Dockerfile.production` for MCP Server (5-stage build)
- Added `docker-compose.production.yml` with Redis
- Created 10 Kubernetes manifests (k8s/*.yaml)
- Added deployment scripts (k8s-deploy.sh, k8s-rollback.sh)

**Redis Integration (Commit: e61a95e):**
- Created `RedisSessionStore` class
- Created `InMemorySessionStore` fallback
- Updated session-manager to auto-detect environment
- Added Redis health check to `/api/health`

---

## Common Operations

### Daily Development Workflow

**1. Start Infrastructure (Once per day)**
```bash
# On Mac Mini
cd ~/projects/AI_HUB
docker compose -f docker-compose.cloud.yml up -d

# Verify everything started
docker compose -f docker-compose.cloud.yml ps
```

**2. Pull Latest Code**
```bash
# On Mac Mini (after pushing from Windows)
cd ~/projects/AI_HUB
git pull origin feature/sprint-8.5

# Restart containers to pick up changes
docker compose -f docker-compose.cloud.yml restart nextjs mcp-server
```

**3. View Logs**
```bash
# All services
docker compose -f docker-compose.cloud.yml logs -f

# Just Next.js
docker logs -f projectpulse-nextjs-cloud

# Just MCP Server
docker logs -f projectpulse-mcp-cloud
```

**4. Check Health**
```bash
# From your computer
curl http://192.168.1.15:3000/api/health
```

**5. Stop Everything**
```bash
# On Mac Mini
docker compose -f docker-compose.cloud.yml down
```

---

### Testing Production Build

**1. Build Production Images**
```bash
# On Mac Mini
cd ~/projects/AI_HUB

# Create production environment file
cp .env.production.example .env.production
# Edit .env.production with your values

# Start production stack
docker compose -f docker-compose.production.yml up --build
```

**2. Test Production Features**
```bash
# Check health (should show Redis)
curl http://192.168.1.15:3000/api/health
# Expected: { "sessionStore": "redis", "redis": true }

# Create a session
curl -i -X POST http://192.168.1.15:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Extract session ID from Mcp-Session-Id header
# Restart container
docker restart projectpulse-nextjs-prod

# Session should still exist (Redis persistence)
curl -X POST http://192.168.1.15:3000/api/mcp \
  -H "Mcp-Session-Id: <session-id>" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

---

### Database Operations

**1. Run Migrations**
```bash
# On Mac Mini
docker exec -it projectpulse-nextjs-cloud sh
cd apps/web
pnpm prisma migrate deploy
exit
```

**2. Open Prisma Studio**
```bash
# On Mac Mini
docker exec -it projectpulse-nextjs-cloud sh
cd apps/web
pnpm prisma studio
# Open http://192.168.1.15:5555 in browser
```

**3. Backup Database**
```bash
# On Mac Mini
docker exec projectpulse-postgres-cloud pg_dump \
  -U projectpulse projectpulse_dev \
  > backup-$(date +%Y%m%d).sql
```

**4. Restore Database**
```bash
# On Mac Mini
cat backup-20251118.sql | docker exec -i projectpulse-postgres-cloud \
  psql -U projectpulse projectpulse_dev
```

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker logs <container-name>
```

**Common issues:**
- Port already in use → Kill process or change port
- Missing dependencies → Rebuild image
- Database not ready → Check postgres health

**Solution:**
```bash
# Rebuild specific container
docker compose -f docker-compose.cloud.yml up -d --build nextjs
```

---

### Can't Access from Windows

**1. Check Mac Mini IP:**
```bash
# On Mac Mini
ipconfig getifaddr en0
```

**2. Test from Mac Mini first:**
```bash
# On Mac Mini
curl http://localhost:3000/api/health
```

**3. Check firewall:**
- Mac Mini → System Preferences → Security & Privacy → Firewall
- Allow Docker Desktop

**4. Verify container ports:**
```bash
# On Mac Mini
docker ps
# Should show: 0.0.0.0:3000->3000/tcp
```

---

### Database Connection Failed

**Check connection string:**
```bash
docker exec projectpulse-nextjs-cloud env | grep DATABASE_URL
```

**Should show:**
```
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/projectpulse_dev
```

**Test database:**
```bash
docker exec projectpulse-postgres-cloud \
  psql -U postgres -d projectpulse_dev -c "SELECT 1"
```

---

### Redis Not Working (Production)

**Check Redis is running:**
```bash
docker ps | grep redis
```

**Test Redis connection:**
```bash
docker exec projectpulse-redis-prod redis-cli ping
# Should return: PONG
```

**Check Redis health in API:**
```bash
curl http://192.168.1.15:3000/api/health
# Should show: "redis": true
```

---

## Summary

### What You Learned

- ✅ **Docker basics:** Containers, images, volumes, networks
- ✅ **Development vs Production:** Volume mounts vs baked-in code
- ✅ **Multi-stage builds:** Why images shrink from 800MB to 300MB
- ✅ **Session management:** In-memory (dev) vs Redis (prod)
- ✅ **Three compose files:** Why we have 3 different configurations
- ✅ **Current setup:** Mac Mini running development environment

### Key Takeaways

1. **Mac Mini = Your Local Cloud**
   - PostgreSQL (database)
   - Next.js (web app)
   - MCP Server (AI agent API)

2. **Development = Fast Iteration**
   - Volume mounts for hot reload
   - Edit code → See changes immediately
   - In-memory sessions (acceptable loss)

3. **Production = Optimized & Secure**
   - Multi-stage builds (60% smaller)
   - Redis sessions (persistent)
   - Ready for Kubernetes deployment

4. **Health Check Shows Everything:**
   ```bash
   curl http://192.168.1.15:3000/api/health
   ```
   - Database status
   - Redis status (prod)
   - Session store type

---

### Next Steps

**For Daily Development:**
1. Start containers: `docker compose -f docker-compose.cloud.yml up -d`
2. Edit code on Windows
3. Push to git
4. Pull on Mac Mini
5. Restart containers
6. Test in browser

**For Production Testing:**
1. Build production images
2. Test Redis persistence
3. Verify multi-stage builds
4. Check health endpoints

**For Deployment (Future):**
1. Push images to registry
2. Deploy to Kubernetes
3. Configure ingress/TLS
4. Set up monitoring

---

**Questions?** Check `.agent/system/infrastructure-state.md` for technical details.
**Need help?** Ask AI agent to explain any section in more detail.
