# ProjectPulse Infrastructure Guide

**For:** New Users & Developers
**Level:** Beginner-Friendly (Assumes no prior Docker/DevOps knowledge)
**Last Updated:** 2025-11-19 (Sprint 8.6)

---

## 🎯 Current Active Setup (as of Sprint 8.6)

**What You Have Running RIGHT NOW:**

```
Mac Mini (192.168.1.15) - Running 24/7
├── Compose File: docker-compose.cloud.yml (ACTIVE)
├── PostgreSQL:5432 ✅ Healthy (database)
├── Next.js:3000 ✅ Running (web app)
└── MCP Server:3001 ✅ Healthy (AI agent API)
    ├── Transport: SSE over HTTP
    ├── External Agents: Claude Code + Cascade connected
    ├── Active Sessions: 3 (validated working)
    └── Tools: 35 ProjectPulse MCP tools
```

**Session Storage:** In-memory (Redis available but not active)
**External Agent URL:** `http://192.168.1.15:3001/mcp`
**Validation:** ✅ Multi-agent tested (Claude Code + Cascade)

**Key Fact:** Even though it's called "development" compose file, this setup **IS your production environment** because:
- ✅ Runs continuously (24/7 on Mac mini)
- ✅ External agents connect to it
- ✅ Handles real workloads
- ✅ Production-ready MCP transport (SSE)

The "development" label refers to **build optimization** (volume mounts for hot reload), NOT external accessibility or stability.

---

## 📚 Table of Contents

1. [Current Active Setup](#-current-active-setup-as-of-sprint-86) ⭐ **START HERE**
2. [What Changed in Sprint 8.6](#-what-changed-in-sprint-86)
3. [Understanding "Development" vs "Production"](#-understanding-development-vs-production)
4. [What is Infrastructure?](#what-is-infrastructure)
5. [Understanding Docker (Simple Explanation)](#understanding-docker-simple-explanation)
6. [Our Infrastructure Setup](#our-infrastructure-setup)
7. [Development vs Production](#development-vs-production)
8. [Multi-Stage Docker Builds Explained](#multi-stage-docker-builds-explained)
9. [Session Management (Redis)](#session-management-redis)
10. [Three Docker Compose Files Explained](#three-docker-compose-files-explained)
11. [Current Architecture](#current-architecture)
12. [Common Operations](#common-operations)
13. [Troubleshooting](#troubleshooting)

---

## 🚀 What Changed in Sprint 8.6?

**Problem Solved:** External AI agents (Claude Code, Cascade) couldn't connect to the MCP server running in Docker on Mac mini.

### Before Sprint 8.6 ❌

```
MCP Server Configuration:
├── Transport: stdio (standard input/output)
├── Docker Issue: stdin closes when container starts
├── Result: Endless restart loop
└── External Agents: ❌ Cannot connect
```

### After Sprint 8.6 ✅

```
MCP Server Configuration:
├── Transport: SSE (Server-Sent Events) over HTTP
├── Port: 3001 exposed to network
├── Endpoints: GET/POST /mcp for session management
├── Docker: Stable, no restarts
└── External Agents: ✅ Claude Code + Cascade validated
```

### Key Implementation Changes

1. **Transport Switch:** stdio → SSE/HTTP
   - File: `apps/mcp-server/src/index-http.ts`
   - Protocol: Dual endpoints (GET establishes SSE stream, POST sends messages)

2. **Session Management:** Query parameter routing
   - Session ID sent via `?sessionId=xxx` (not headers)
   - Map-based storage: `sessions.set(transport.sessionId, transport)`

3. **Docker Config:** Updated command
   - Before: `node dist/index.js` (stdio, broken)
   - After: `node dist/index-http.js` (SSE, working)

4. **Health Check:** Node-based HTTP request
   - No dependency on wget/curl (not in slim image)
   - Returns active session count

### Validation Results

| Agent | Status | Config Location | Sessions |
|-------|--------|----------------|----------|
| **Claude Code** | ✅ Working | `~/.claude.json` | 1 |
| **Cascade (Windsurf)** | ✅ Working | `~/.codeium/windsurf/mcp_config.json` | 3 |

**Total Active Sessions:** 3 (confirmed via health check)

**Documentation:** See [docs/features/mcp-multi-agent-setup.md](docs/features/mcp-multi-agent-setup.md) for complete setup guide.

---

## 💡 Understanding "Development" vs "Production"

**This is the source of confusion!** Let's clarify the terminology:

### The Confusing Labels

| Label | What It Actually Means | What You Might Think It Means |
|-------|----------------------|------------------------------|
| **"Development"** (docker-compose.cloud.yml) | Volume mounts for code hot-reload | "Not for real use, testing only" |
| **"Production"** (docker-compose.production.yml) | Optimized images, Redis, no volume mounts | "The real deployment" |

### The Reality for YOU

**Your Mac Mini Setup = Your Production Environment**

Even though you're using `docker-compose.cloud.yml` (labeled "development"), this **IS your production** because:
- ✅ Runs 24/7 on dedicated hardware
- ✅ External agents (Claude Code, Cascade) connect to it
- ✅ Handles real workloads (MCP tools, wiki, issues, etc.)
- ✅ Stable and validated (3 active sessions)

The "development" label only means:
- 📂 Source code is volume-mounted (not baked into image)
- 🔄 Hot reload enabled (changes reflect immediately)
- 💾 In-memory sessions (no Redis overhead)

### When to Use "Production" Setup (docker-compose.production.yml)

**Future Use Case:** Deploying to cloud (AWS/GCP/Azure) or Kubernetes

**Why not use it now?**
- ❌ Slower iteration (must rebuild images for each change)
- ❌ Redis overhead not needed (Mac mini is stable, single-server)
- ❌ Optimized images unnecessary (Mac mini has plenty of resources)
- ❌ More complex setup (requires .env.production configuration)

**When to switch:**
- When deploying to cloud hosting
- When scaling horizontally (multiple servers)
- When you need session persistence across server restarts
- When security hardening is critical (non-root users, minimal images)

### Quick Mental Model

```
Your Setup:
"Development" docker-compose.cloud.yml
    ↓
Mac Mini (dedicated server)
    ↓
Running 24/7 with external agents
    ↓
= YOUR PRODUCTION ENVIRONMENT

Future Cloud Setup:
"Production" docker-compose.production.yml
    ↓
AWS/GCP/Kubernetes
    ↓
Multiple servers, load balancing
    ↓
= TRUE PRODUCTION DEPLOYMENT
```

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

### Quick Comparison Table (Sprint 8.6 Status)

| Feature | docker-compose.yml | docker-compose.cloud.yml | docker-compose.production.yml |
|---------|-------------------|-------------------------|-------------------------------|
| **Status** | ❌ Legacy | ✅ **ACTIVE NOW** | ⚪ Ready (not active) |
| **Purpose** | CI/Testing | **Mac Mini Runtime** | Future cloud deployment |
| **Used On** | GitHub Actions | **Mac Mini 24/7** | Kubernetes/Cloud |
| **MCP Transport** | None (no MCP) | **SSE/HTTP** ✅ | SSE/HTTP |
| **External Agents** | ❌ N/A | ✅ **Working** (3 sessions) | ✅ Supported |
| **Source Code** | Volume mount | Volume mount | Baked into image |
| **Hot Reload** | ✅ Yes | ✅ Yes | ❌ No (must rebuild) |
| **Redis** | ❌ No | ❌ No | ✅ Yes |
| **MCP Server Port** | N/A | **3001** | 3001 |
| **Image Size** | 800MB | 800MB | 300MB (optimized) |
| **Sessions** | In-memory | **In-memory** | Redis (persistent) |
| **Security** | Basic | Basic | Hardened (non-root) |
| **Sprint 8.6 Changes** | None | **SSE transport added** | SSE transport ready |

---

### 1. `docker-compose.yml` (Legacy/CI) ❌

**Purpose:** Automated testing, local fallback
**Status:** **NOT USED** on Mac mini

**Characteristics:**
- Exposes ports to 0.0.0.0 (less secure)
- No MCP server service
- Simpler configuration

**When to use:**
- Running tests in GitHub Actions CI/CD
- Quick local testing on Windows (without Mac mini access)
- **⚠️ NOT recommended for development** (use cloud.yml instead)

---

### 2. `docker-compose.cloud.yml` (Mac Mini Runtime) ✅ **ACTIVE**

**Purpose:** Your production environment (despite "development" label)
**Status:** **RUNNING 24/7** on Mac mini
**Used by:** You (daily) + External AI agents (Claude Code, Cascade)

**Characteristics:**
- ✅ Volume mounts for hot reload
- ✅ **MCP server with SSE/HTTP transport** (Sprint 8.6)
- ✅ **External agents connect successfully** (3 active sessions)
- ✅ In-memory sessions (fast, no Redis overhead)
- ✅ Debug mode enabled

**Start Command:**
```bash
docker compose -f docker-compose.cloud.yml up -d
```

**When to use:**
- ✅ Daily development (you use this every day)
- ✅ External AI agents connecting to MCP server
- ✅ Testing changes before committing
- ✅ **This is your current production setup**

**Sprint 8.6 Changes:**
- ✅ Added SSE/HTTP transport for MCP server
- ✅ Changed image from alpine to bullseye-slim (OpenSSL fix)
- ✅ Exposed port 3001 for external agent connectivity
- ✅ Multi-agent validated (Claude Code + Cascade)

---

### 3. `docker-compose.production.yml` (Future Cloud) ⚪

**Purpose:** Future cloud deployment (AWS/GCP/Kubernetes)
**Status:** **NOT ACTIVE** (ready but not deployed)
**Used by:** Future use when deploying to cloud

**Characteristics:**
- ✅ Multi-stage Dockerfiles (60% smaller images)
- ✅ Redis for session persistence
- ✅ Optimized images (~300MB vs 800MB)
- ✅ Security hardened (non-root users)
- ✅ Resource limits set
- ✅ **MCP server with SSE/HTTP transport** (same as cloud.yml)

**Start Command:**
```bash
cp .env.production.example .env.production
# Edit .env.production with your values
docker compose -f docker-compose.production.yml up --build
```

**When to use:**
- Testing production build locally before cloud deployment
- Deploying to AWS/GCP/Azure or Kubernetes
- When you need Redis session persistence (horizontal scaling)
- When optimized images are required (bandwidth/cost)

**Why not use now?**
- ❌ Slower iteration (must rebuild for each change)
- ❌ Redis overhead not needed (Mac mini is stable)
- ❌ More complex setup (requires production secrets)
- ❌ Your current setup (cloud.yml) already works perfectly

---

## Current Architecture

### Active Setup (As of Sprint 8.6 - 2025-11-19)

**Primary Environment:** Mac Mini (Your Production)
**Active File:** `docker-compose.cloud.yml` ✅
**MCP Transport:** SSE over HTTP

```
Mac Mini (192.168.1.15) - Running 24/7
├── PostgreSQL:5432 (pgvector/pgvector:pg15)
│   └── Volume: postgres_data (persistent)
│
├── Next.js:3000 (node:20-bullseye-slim)
│   ├── Volume Mount: ./apps/web → /app
│   ├── Hot Reload: ✅ Enabled
│   └── Sessions: InMemorySessionStore
│
└── MCP Server:3001 (node:20-bullseye-slim) ⭐ NEW
    ├── Volume Mount: ./apps/mcp-server → /app
    ├── Transport: SSE over HTTP (Sprint 8.6)
    ├── External URL: http://192.168.1.15:3001/mcp
    ├── Active Sessions: 3 (Claude Code + Cascade)
    └── Tools: 35 ProjectPulse MCP tools
```

### Recent Changes

**Sprint 8.6 - MCP Connectivity (Commit: 0c80bae):** ⭐ **LATEST**
- ✅ Implemented SSE/HTTP transport for MCP server
- ✅ Fixed session ID routing (query parameters)
- ✅ Changed image from alpine to bullseye-slim
- ✅ Multi-agent validated (Claude Code + Cascade)
- ✅ Exposed port 3001 for external connectivity
- ✅ Created comprehensive multi-agent setup guide

**Sprint 8.5 Phase 1 (Commit: ed93b21):**
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

## Quick Decision Matrix (Sprint 8.6)

**Common Questions & Answers:**

| Question/Request | Answer | Command/Action |
|-----------------|--------|----------------|
| "Which setup am I using?" | **docker-compose.cloud.yml** | `docker ps` to verify |
| "Can external agents connect?" | **YES** ✅ (3 active sessions) | Check: `curl http://192.168.1.15:3001/health` |
| "What MCP transport?" | **SSE over HTTP** (port 3001) | Endpoint: `http://192.168.1.15:3001/mcp` |
| "Is Redis running?" | **NO** (in-memory sessions) | Health: `curl http://192.168.1.15:3000/api/health` |
| "Is this production?" | **YES** (your production environment) | Running 24/7, external agents work |
| "Start development" | Use `docker-compose.cloud.yml` | `docker compose -f docker-compose.cloud.yml up -d` |
| "Restart MCP server" | Restart cloud.yml MCP container | `docker restart projectpulse-mcp-cloud` |
| "Test production build" | Use `docker-compose.production.yml` | `docker compose -f docker-compose.production.yml up --build` |
| "Deploy to Kubernetes" | Use `k8s/*.yaml` | `./scripts/k8s-deploy.sh` |
| "Add a new service" | Edit `docker-compose.cloud.yml` | Add service → restart |
| "Check MCP sessions" | MCP health endpoint | `curl http://192.168.1.15:3001/health` |
| "Check session type" | Next.js health endpoint | `curl http://192.168.1.15:3000/api/health` |
| "View MCP logs" | Docker logs command | `docker logs -f projectpulse-mcp-cloud` |
| "Rebuild images" | Depends on compose file | Add `--build` flag to up command |

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
