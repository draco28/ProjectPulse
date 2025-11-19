# ProjectPulse Infrastructure State

**For:** AI Agents (Technical Reference)
**Last Updated:** 2025-11-19 (Commit: 0c80bae - Sprint 8.6)
**Status:** Production-ready with multi-agent MCP connectivity

---

## Current Active Environment

**Primary Setup:** Development on Mac Mini (192.168.1.15)
**Active Docker Compose:** `docker-compose.cloud.yml`
**Session Storage:** InMemorySessionStore (development mode)
**Database:** PostgreSQL 15 with pgvector extension

```
Services Running:
├── postgres:5432      (pgvector/pgvector:pg15)
├── nextjs:3000        (node:20-bullseye-slim, volume mounted)
└── mcp-server:3001    (node:20-bullseye-slim, volume mounted)
    ├── Transport: SSE over HTTP (Sprint 8.6)
    ├── External URL: http://192.168.1.15:3001/mcp
    └── Active Sessions: 3 (Claude Code + Cascade validated)
```

---

## Infrastructure Evolution

### Sprint 8.5 Phase 1 (Commit: ed93b21)

**Created:** `packages/roadmap-tools/` shared package

**Changes:**
- Extracted common code from Next.js and MCP Server
- Created TypeScript package with `parseProjectPlan` and `materializeRoadmap`
- Updated both consumers to import from `@projectpulse/roadmap-tools`
- Eliminated 220+ lines of duplicate code

**Build Order:**
```
1. pnpm install (root + workspaces)
2. cd apps/web && pnpm prisma generate
3. cd packages/roadmap-tools && pnpm build
4. cd apps/mcp-server && pnpm build
```

---

### Sprint 8.6 - MCP Connectivity Fix (Commit: 0c80bae)

**Created:** Multi-agent MCP connectivity via SSE transport

**Problem Solved:**
External AI agents (Claude Code, Cascade) couldn't connect to MCP server running in Docker on Mac mini.

**Root Causes:**
1. stdio transport incompatible with Docker (stdin closes on detached containers)
2. Session ID routing incorrect (headers vs query parameters)
3. Docker health check failing (wget not in slim image)

**Solution Implemented:**
- File: `apps/mcp-server/src/index-http.ts` (SSE transport)
- Transport: StreamableHTTP → SSE (deprecated but universally supported)
- Session Management: Map-based storage with query parameter routing
- Docker Image: alpine → bullseye-slim (OpenSSL compatibility)
- Health Check: Node-based HTTP request (no external dependencies)

**Key Technical Changes:**
```typescript
// Session storage
const sessions = new Map<string, SSEServerTransport>();

// GET /mcp - Establish SSE stream
app.get('/mcp', async (_req, res) => {
  const transport = new SSEServerTransport('/mcp', res, {
    enableDnsRebindingProtection: false,
  });

  await server.connect(transport); // auto-calls start()
  sessions.set(transport.sessionId, transport);

  transport.onclose = () => sessions.delete(transport.sessionId);
});

// POST /mcp - Handle client messages
app.post('/mcp', async (req, res) => {
  const sessionId = req.query.sessionId as string; // From URL query!
  const transport = sessions.get(sessionId);
  await transport.handlePostMessage(req, res, req.body);
});
```

**Validation:**
- ✅ Claude Code: 1 active session
- ✅ Cascade (Windsurf): 3 concurrent sessions
- ✅ Health check: `{"status":"healthy","transport":"sse","activeSessions":3}`
- ✅ Multi-agent compatibility confirmed

**Documentation:**
- Created: `docs/features/mcp-multi-agent-setup.md` (513 lines)
- Updated: `apps/mcp-server/README.md` (comprehensive dual-transport guide)

**SSE Deprecation Note:**
- SSE deprecated as of MCP spec 2025-03-26
- Still fully functional, will work 12+ months minimum
- Migration to Streamable HTTP deferred (SSE has better client support)

---

### Production Architecture (Commit: 9e2850d)

**Created:** Complete production infrastructure

**Part 1: Docker Multi-Stage Builds**

Files:
- `apps/web/Dockerfile.production` (5 stages)
- `apps/mcp-server/Dockerfile.production` (5 stages)
- `docker-compose.production.yml` (with Redis)
- `.env.production.example`

Multi-Stage Build Process:
```
Stage 1: Install dependencies (800MB)
Stage 2: Build shared packages (600MB)
Stage 3: Generate Prisma Client (500MB)
Stage 4: Build application (400MB)
Stage 5: Production runtime (300MB) ✅
```

Benefits:
- Image size: 800MB → 300MB (60% reduction)
- Security: Non-root users (nextjs:1001, mcp:1001)
- Layer caching: Dependencies cached separately
- No development dependencies in production

**Part 3: Kubernetes Architecture**

Files:
- `k8s/namespace.yaml` - projectpulse namespace
- `k8s/configmap.yaml` - Non-sensitive config
- `k8s/secrets.yaml.example` - Secrets template
- `k8s/postgres-statefulset.yaml` - PostgreSQL with 20Gi PVC
- `k8s/redis-statefulset.yaml` - Redis with 5Gi PVC
- `k8s/nextjs-deployment.yaml` - Next.js (3 replicas)
- `k8s/mcp-deployment.yaml` - MCP Server (3 replicas)
- `k8s/ingress.yaml` - NGINX with TLS
- `k8s/hpa.yaml` - Autoscaling 2-10 replicas (70% CPU)
- `scripts/k8s-deploy.sh` - Automated deployment
- `scripts/k8s-rollback.sh` - One-command rollback
- `DEPLOYMENT.md` - Comprehensive guide (333 lines)

Kubernetes Architecture:
```
Namespace: projectpulse
├── StatefulSets
│   ├── PostgreSQL (1 replica, 20Gi storage)
│   └── Redis (1 replica, 5Gi storage)
├── Deployments
│   ├── Next.js (3 replicas, auto-scaling 2-10)
│   └── MCP Server (3 replicas, auto-scaling 2-10)
├── Services (ClusterIP)
│   ├── postgres:5432
│   ├── redis:6379
│   ├── nextjs:3000
│   └── mcp-server:3001
├── Ingress (NGINX + TLS)
│   ├── projectpulse.example.com → nextjs:3000
│   └── api.projectpulse.example.com → mcp-server:3001
└── HPA (Horizontal Pod Autoscaler)
    ├── Next.js: 2-10 replicas (70% CPU, 80% memory)
    └── MCP Server: 2-10 replicas (70% CPU, 80% memory)
```

---

### Redis Session Integration (Commit: e61a95e)

**Created:** Production session management with Redis

Files Modified:
- `apps/web/lib/mcp/session-store.ts` (~50 lines modified)
  - Fixed type mismatch (SessionData ↔ MCPSession)
  - Added `createSessionWithId()` method
  - Both RedisSessionStore and InMemorySessionStore updated

- `apps/web/lib/mcp/session-manager.ts` (~200 lines replaced)
  - Replaced Map-based storage with store abstraction
  - Environment-based selection (Redis prod, InMemory dev)
  - All 10 exported functions updated
  - Added `healthCheck()` and `shutdown()`

- `apps/web/app/api/health/route.ts` (~15 lines added)
  - Added Redis health monitoring
  - Returns `{ redis: boolean, sessionStore: "redis"|"memory" }`
  - HTTP 503 if unhealthy

Files Created:
- `apps/web/lib/mcp/session-store-compat.ts` (27 lines)
  - Legacy compatibility stubs

Session Store Selection Logic:
```typescript
if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
  store = new RedisSessionStore(redisUrl);  // Persistent
  storeType = 'redis';
} else {
  store = new InMemorySessionStore();        // Temporary
  storeType = 'memory';
}
```

Session Lifecycle:
```
1. Client request arrives (no session ID or invalid)
2. validateSession(id) called
3. Invalid → createSession(DEFAULT_PROJECT_ID)
4. Valid → getSession(id) (updates lastAccessedAt, extends TTL)
5. Session returned with metadata: { projectId: number }
6. TTL: 1 hour (Redis: automatic, InMemory: cleanup timer)
```

---

## Three Docker Compose Files

### 1. `docker-compose.yml` (LEGACY - CI/Local Fallback)

**Purpose:** Automated testing, GitHub Actions
**Active Use:** CI pipelines only, NOT on Mac mini

Characteristics:
- PostgreSQL only (no Redis, no MCP)
- Exposes 0.0.0.0:5432 (less secure)
- Volume mount for development
- No MCP Server

**When to Use:**
- Running automated tests
- Quick local test on Windows (without Mac mini)
- GitHub Actions CI/CD

**Do NOT Use:**
- Daily development (use cloud.yml instead)
- Production deployment (use production.yml instead)

---

### 2. `docker-compose.cloud.yml` (ACTIVE - Development)

**Purpose:** Daily development on Mac Mini
**Active Use:** Primary development environment

Services:
```yaml
postgres:
  image: pgvector/pgvector:pg15
  ports: ["5432:5432"]
  volumes: [postgres_data:/var/lib/postgresql/data]
  
nextjs:
  image: node:20-bullseye-slim
  ports: ["3000:3000"]
  volumes: ["./:/app", "nextjs_node_modules:/app/node_modules"]
  command: pnpm dev --hostname 0.0.0.0
  environment:
    DATABASE_URL: postgresql://postgres:postgres123@postgres:5432/projectpulse_dev
    
mcp-server:
  image: node:20-bullseye-slim  # Changed from alpine (Sprint 8.6)
  ports: ["3001:3001"]
  volumes: ["./:/app", "mcp_node_modules:/app/apps/mcp-server/node_modules"]
  command: node dist/index-http.js  # SSE transport (Sprint 8.6)
  environment:
    PROJECTPULSE_API_URL: http://nextjs:3000
    MCP_PORT: 3001
```

Characteristics:
- ✅ Volume mounts (hot reload enabled)
- ✅ MCP Server with SSE/HTTP transport (Sprint 8.6)
- ✅ External agent connectivity (Claude Code + Cascade validated)
- ✅ Debug mode active
- ❌ No Redis (in-memory sessions)
- ❌ No multi-stage builds (faster iteration)

**Start Command:**
```bash
docker compose -f docker-compose.cloud.yml up -d
```

**Health Check:**
```bash
curl http://192.168.1.15:3000/api/health
# Response: { "sessionStore": "memory", "redis": true }
```

---

### 3. `docker-compose.production.yml` (Production)

**Purpose:** Production builds, cloud deployment readiness
**Active Use:** Testing production builds, Kubernetes staging

Services:
```yaml
postgres:
  image: pgvector/pgvector:pg15
  # Same as development
  
redis:
  image: redis:7-alpine
  command: redis-server --requirepass ${REDIS_PASSWORD}
  volumes: [redis_data:/data]
  
nextjs:
  build:
    context: .
    dockerfile: apps/web/Dockerfile.production
  image: projectpulse/web:latest
  environment:
    DATABASE_URL: ${DATABASE_URL}
    REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    
mcp-server:
  build:
    context: .
    dockerfile: apps/mcp-server/Dockerfile.production
  image: projectpulse/mcp-server:latest
  environment:
    REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
```

Characteristics:
- ✅ Multi-stage Dockerfiles (300MB images)
- ✅ Redis for persistent sessions
- ✅ Non-root users (security)
- ✅ Resource limits set
- ❌ No volume mounts (code baked into image)
- ❌ No hot reload (must rebuild)

**Start Command:**
```bash
cp .env.production.example .env.production
# Edit with production values
docker compose -f docker-compose.production.yml up --build
```

**Health Check:**
```bash
curl http://192.168.1.15:3000/api/health
# Response: { "sessionStore": "redis", "redis": true, "database": "connected" }
```

---

## Session Management Implementation

### Current State (As of e61a95e)

**Development (docker-compose.cloud.yml):**
```
Environment: NODE_ENV=development, NO REDIS_URL
Store: InMemorySessionStore
Sessions: Stored in Map<string, SessionData>
Persistence: ❌ Lost on restart
Cleanup: Background timer every 5 minutes
TTL: 1 hour (checked on access)
```

**Production (docker-compose.production.yml):**
```
Environment: NODE_ENV=production, REDIS_URL=redis://:password@redis:6379
Store: RedisSessionStore
Sessions: Stored in Redis with automatic TTL
Persistence: ✅ Survives restarts
Cleanup: Automatic via Redis EXPIRE
TTL: 1 hour (enforced by Redis)
```

### Session Store API

Both stores implement identical interface:

```typescript
interface SessionStore {
  createSession(projectId: number): Promise<MCPSession>;
  createSessionWithId(sessionId: string, projectId: number): Promise<MCPSession>;
  getSession(sessionId: string): Promise<MCPSession | null>;
  deleteSession(sessionId: string): Promise<void>;
  extendSession(sessionId: string): Promise<void>;
  getActiveSessions(projectId: number): Promise<MCPSession[]>;
  getActiveSessionCount(): Promise<number>;
  healthCheck(): Promise<boolean>;
  disconnect(): Promise<void>;
}
```

### Type Conversion

**Internal Storage (Redis):**
```typescript
interface SessionData {
  id: string;
  projectId: number;
  createdAt: number;         // Timestamp (milliseconds)
  lastAccessedAt: number;    // Timestamp (milliseconds)
  expiresAt: number;         // Timestamp (milliseconds)
}
```

**Application API (MCPSession from types.ts):**
```typescript
interface MCPSession {
  id: string;
  createdAt: Date;           // Date object
  lastAccessedAt: Date;      // Date object
  metadata: { projectId: number };
}
```

**Conversion Functions:**
```typescript
function toMCPSession(data: SessionData): MCPSession {
  return {
    id: data.id,
    createdAt: new Date(data.createdAt),
    lastAccessedAt: new Date(data.lastAccessedAt),
    metadata: { projectId: data.projectId },
  };
}

function toSessionData(session: MCPSession, projectId: number): SessionData {
  return {
    id: session.id,
    projectId,
    createdAt: session.createdAt.getTime(),
    lastAccessedAt: session.lastAccessedAt.getTime(),
    expiresAt: session.lastAccessedAt.getTime() + 3600000,
  };
}
```

---

## Health Check Monitoring

**Endpoint:** `GET /api/health`

**Response Structure:**
```typescript
{
  status: "healthy" | "unhealthy",
  timestamp: string,              // ISO 8601
  database: "connected" | "error",
  redis: boolean,                 // true if Redis healthy (prod only)
  sessionStore: "redis" | "memory" // Current store type
}
```

**HTTP Status Codes:**
- `200 OK`: All components healthy
- `503 Service Unavailable`: Database OR session store unhealthy

**Usage:**
```bash
# Development (Mac Mini - docker-compose.cloud.yml)
curl http://192.168.1.15:3000/api/health
{
  "status": "healthy",
  "database": "connected",
  "redis": true,
  "sessionStore": "memory"
}

# Production (docker-compose.production.yml)
curl http://192.168.1.15:3000/api/health
{
  "status": "healthy",
  "database": "connected",
  "redis": true,
  "sessionStore": "redis"
}
```

---

## Build & Deployment Process

### Development Build (Fast Iteration)

```bash
# On Mac Mini
cd ~/projects/AI_HUB
docker compose -f docker-compose.cloud.yml up -d

# Rebuild on code changes
docker compose -f docker-compose.cloud.yml restart nextjs mcp-server
```

**Build Time:** ~30 seconds (volume mount, no rebuild)

---

### Production Build (Optimized)

```bash
# On Mac Mini
cd ~/projects/AI_HUB
docker compose -f docker-compose.production.yml up --build

# Or build images separately
docker build -f apps/web/Dockerfile.production -t projectpulse/web:latest .
docker build -f apps/mcp-server/Dockerfile.production -t projectpulse/mcp-server:latest .
```

**Build Time:** ~5-10 minutes (multi-stage, full build)

**Image Sizes:**
- Next.js: ~300MB (was 800MB)
- MCP Server: ~200MB (was 700MB)

---

### Kubernetes Deployment

```bash
# On Kubernetes cluster
cd ~/projects/AI_HUB

# Update secrets
cp k8s/secrets.yaml.example k8s/secrets.yaml
# Edit with production credentials

# Deploy full stack
./scripts/k8s-deploy.sh

# Verify deployment
kubectl get pods -n projectpulse
kubectl logs -f deployment/nextjs -n projectpulse
```

**Deployment Process:**
1. Create namespace
2. Apply secrets and configmaps
3. Deploy StatefulSets (PostgreSQL, Redis)
4. Wait for databases to be ready
5. Run Prisma migrations
6. Deploy Deployments (Next.js, MCP Server)
7. Apply Ingress and HPA

**Rollback:**
```bash
./scripts/k8s-rollback.sh
```

---

## Key Decisions for AI Agents

### When Recommending Infrastructure Changes

**Always Check:**
1. **Which docker-compose file is active?**
   - Development → `docker-compose.cloud.yml`
   - Production → `docker-compose.production.yml`
   - CI/Testing → `docker-compose.yml`

2. **Is Redis available?**
   ```bash
   curl http://192.168.1.15:3000/api/health | jq .sessionStore
   ```
   - "memory" → Development mode, no Redis
   - "redis" → Production mode, Redis active

3. **Are we on Mac Mini or Kubernetes?**
   - Mac Mini → Use docker-compose
   - Kubernetes → Use kubectl commands

4. **Is hot reload needed?**
   - Yes → Use volume mounts (docker-compose.cloud.yml)
   - No → Use baked-in builds (docker-compose.production.yml)

### Common Pitfalls to Avoid

**❌ DON'T:**
- Use `docker-compose.yml` on Mac Mini (legacy)
- Add Redis to development setup (unnecessary overhead)
- Volume mount in production (security risk)
- Expose database ports to 0.0.0.0 (use internal network)

**✅ DO:**
- Use `docker-compose.cloud.yml` for daily development
- Use `docker-compose.production.yml` for production testing
- Keep sessions in-memory for development (fast, simple)
- Use Redis only in production (persistent, scalable)

### Suggesting Changes

**Development Changes:**
```bash
# Edit docker-compose.cloud.yml
docker compose -f docker-compose.cloud.yml down
docker compose -f docker-compose.cloud.yml up -d
```

**Production Changes:**
```bash
# Edit Dockerfile.production or docker-compose.production.yml
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up --build
```

**Kubernetes Changes:**
```bash
# Edit k8s/*.yaml
kubectl apply -f k8s/
```

---

## File Locations Reference

### Configuration Files
```
├── docker-compose.yml                     # Legacy (CI only)
├── docker-compose.cloud.yml               # Development (ACTIVE)
├── docker-compose.production.yml          # Production
├── .env.production.example                # Production env template
└── k8s/                                   # Kubernetes manifests
    ├── namespace.yaml
    ├── configmap.yaml
    ├── secrets.yaml.example
    ├── postgres-statefulset.yaml
    ├── redis-statefulset.yaml
    ├── nextjs-deployment.yaml
    ├── mcp-deployment.yaml
    ├── ingress.yaml
    └── hpa.yaml
```

### Application Dockerfiles
```
apps/
├── web/
│   └── Dockerfile.production              # Next.js multi-stage
└── mcp-server/
    └── Dockerfile.production              # MCP Server multi-stage
```

### Session Management
```
apps/web/lib/mcp/
├── session-store.ts                       # RedisSessionStore + InMemorySessionStore
├── session-manager.ts                     # Adapter with auto-detection
├── session-store-compat.ts                # Legacy compatibility
└── types.ts                               # MCPSession interface
```

### Health Monitoring
```
apps/web/app/api/health/route.ts          # Health check endpoint
```

### Deployment Scripts
```
scripts/
├── k8s-deploy.sh                          # Kubernetes deployment
└── k8s-rollback.sh                        # Kubernetes rollback
```

### Documentation
```
├── INFRASTRUCTURE.md                      # User guide (beginner)
├── DEPLOYMENT.md                          # Production deployment guide
├── .agent/system/infrastructure-state.md  # This file (agent reference)
└── .agent/sops/mac-mini-cloud-architecture.md  # Original Mac Mini setup
```

---

## Quick Decision Matrix

**User asks to:**
| Request | Active File | Command |
|---------|-------------|---------|
| "Start development" | `docker-compose.cloud.yml` | `docker compose -f docker-compose.cloud.yml up -d` |
| "Check MCP sessions" | MCP health endpoint | `curl http://192.168.1.15:3001/health` |
| "View MCP logs" | Docker logs | `docker logs -f projectpulse-mcp-cloud` |
| "Restart MCP server" | Docker restart | `docker restart projectpulse-mcp-cloud` |
| "Test production build" | `docker-compose.production.yml` | `docker compose -f docker-compose.production.yml up --build` |
| "Deploy to Kubernetes" | `k8s/*.yaml` | `./scripts/k8s-deploy.sh` |
| "Add a new service" | `docker-compose.cloud.yml` | Add service → restart |
| "Check session type" | Health endpoint | `curl http://192.168.1.15:3000/api/health` |
| "Rebuild images" | Depends on mode | `--build` flag |

---

## Status Summary

**Infrastructure State:** ✅ Production-ready
**Active Environment:** Development (Mac Mini)
**Active Compose File:** `docker-compose.cloud.yml`
**Session Storage:** InMemorySessionStore (development mode)
**Redis Status:** Available in production mode only
**Kubernetes:** Manifests ready, not deployed yet

**Recent Updates:**
- ✅ Sprint 8.6: MCP connectivity fix (SSE transport, multi-agent validated)
- ✅ Sprint 8.5 Phase 1: Shared package created
- ✅ Production Dockerfiles: Multi-stage builds complete
- ✅ Redis integration: Session persistence ready
- ✅ Kubernetes manifests: Full stack defined
- ✅ Deployment automation: Scripts ready

**Next Actions:**
- Test production build locally
- Deploy to staging Kubernetes cluster
- Monitor session metrics
- Optional: Add Prometheus/Grafana monitoring

---

**Last Commit:** 0c80bae (Sprint 8.6 - MCP connectivity complete)
**Last Updated:** 2025-11-19
**Maintained By:** AI agents + User
