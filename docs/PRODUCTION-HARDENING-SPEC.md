# Production Hardening Specification

**Version:** 1.0  
**Created:** 2025-12-29  
**Status:** Draft  
**Author:** System Architect Analysis  
**Sprint:** Post-MVP Hardening  

---

## Executive Summary

This specification defines a 4-phase implementation plan to address production-grade gaps identified in the ProjectPulse system architecture audit. The phases are ordered by criticality and dependency, with Phase 1 being blocking for production readiness.

**Total Estimated Effort:** 40-50 engineering hours  
**Recommended Timeline:** 2-3 weeks (part-time alongside feature work)

---

## Phase Overview

| Phase | Name | Priority | Effort | Dependencies |
|-------|------|----------|--------|--------------|
| **1** | Critical Security Hardening | P0 (Blocking) | 8-12 hrs | None |
| **2** | Observability Infrastructure | P1 (High) | 12-16 hrs | None |
| **3** | Resilience Patterns | P1 (High) | 10-12 hrs | Phase 2 (logging) |
| **4** | Operations Excellence | P2 (Medium) | 8-10 hrs | Phase 2, 3 |

---

# Phase 1: Critical Security Hardening

**Priority:** P0 - Blocking for Production  
**Effort:** 8-12 hours  
**Branch:** `feature/phase-1-security-hardening`

## 1.0 Unauthenticated MCP Surface (CRITICAL)

### Problem Statement
`/api/mcp/route.ts` does not require authentication but can execute tool handlers. Tool handlers call Prisma directly and only check that `projectId` exists, not that the caller is authorized. This is effectively a **public admin API**.

### Technical Specification

#### 1.0.1 Current State (Vulnerable)
```typescript
// app/api/mcp/route.ts - NO AUTH CHECK
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Directly routes to tool handlers without auth
  return handleToolCall(body);
}
```

#### 1.0.2 Fix Options

**Option A (Preferred):** Disable `/api/mcp` in production
- MCP clients should use `apps/mcp-server` which has proper auth
- Remove or return 404 for `/api/mcp/*` routes in production

**Option B:** Add strict auth enforcement
```typescript
// app/api/mcp/route.ts - WITH AUTH
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.type === 'none') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Continue with validated auth context
}
```

#### 1.0.3 Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `app/api/mcp/route.ts` | Modify | Add auth or disable |
| `app/api/mcp/log/route.ts` | Modify | Replace header check with real auth |

#### 1.0.4 Acceptance Criteria

- [ ] `/api/mcp` requires authentication or returns 404/403
- [ ] `/api/mcp/log` requires HMAC signature or admin session
- [ ] No MCP tool callable without valid auth
- [ ] Security test confirms unauthenticated requests fail

---

## 1.1 Global Rate Limiting

### Problem Statement
Rate limiting currently only protects `/api/auth/signup`. All other 57+ API routes are vulnerable to DoS, brute-force attacks, and API abuse.

### Technical Specification

#### 1.1.1 Rate Limit Tiers

| Tier | Routes | Limit | Window | Key |
|------|--------|-------|--------|-----|
| **auth** | `/api/auth/*` | 5 req | 15 min | IP |
| **write** | POST/PUT/DELETE | 100 req | 1 min | IP + User/Token |
| **read** | GET | 300 req | 1 min | IP + User/Token |
| **mcp** | `/api/mcp/*` | 60 req | 1 min | Session ID |
| **bulk** | `/api/batch/*`, bulk endpoints | 10 req | 1 min | Token |
| **health** | `/api/health` | Unlimited | - | - |

#### 1.1.2 Implementation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Request Flow                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Request → Middleware → Rate Limiter → Route Handler         │
│               │              │                               │
│               │              ├─→ Redis (distributed)         │
│               │              └─→ Memory (fallback)           │
│               │                                              │
│               └─→ Extract: IP, User ID, Token, Session ID    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 1.1.3 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `lib/rate-limit/index.ts` | Create | Rate limit factory with tier configs |
| `lib/rate-limit/tiers.ts` | Create | Tier configuration constants |
| `lib/rate-limit/middleware.ts` | Create | Next.js middleware integration |
| `lib/rate-limit/redis-store.ts` | Create | Redis sliding window implementation |
| `lib/rate-limit/memory-store.ts` | Create | In-memory fallback store |
| `middleware.ts` | Modify | Add rate limit checks |

#### 1.1.4 Rate Limiter Implementation

```typescript
// lib/rate-limit/tiers.ts
export const RATE_LIMIT_TIERS = {
  auth: { limit: 5, window: 900, keyPrefix: 'rl:auth' },
  write: { limit: 100, window: 60, keyPrefix: 'rl:write' },
  read: { limit: 300, window: 60, keyPrefix: 'rl:read' },
  mcp: { limit: 60, window: 60, keyPrefix: 'rl:mcp' },
  bulk: { limit: 10, window: 60, keyPrefix: 'rl:bulk' },
} as const;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;
```

```typescript
// lib/rate-limit/index.ts
export interface RateLimitConfig {
  tier: RateLimitTier;
  keyGenerator: (req: NextRequest) => string;
}

export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const tierConfig = RATE_LIMIT_TIERS[config.tier];
  const key = `${tierConfig.keyPrefix}:${config.keyGenerator(request)}`;
  
  // Try Redis first, fallback to memory
  const store = getRedisClient() 
    ? new RedisStore() 
    : new MemoryStore();
  
  return store.check(key, tierConfig.limit, tierConfig.window);
}
```

#### 1.1.5 Middleware Integration

```typescript
// middleware.ts - Add to existing middleware
import { checkRateLimit, getTierForRoute } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname, method } = request.nextUrl;
  
  // Skip rate limiting for health checks
  if (pathname === '/api/health') {
    return NextResponse.next();
  }
  
  // Determine rate limit tier
  const tier = getTierForRoute(pathname, method);
  if (tier) {
    const result = await checkRateLimit(request, {
      tier,
      keyGenerator: (req) => generateRateLimitKey(req, tier),
    });
    
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          code: 'RATE_LIMITED',
          retryAfter: result.reset,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }
  
  // Continue with existing middleware logic...
}
```

#### 1.1.6 Acceptance Criteria

- [ ] All API routes (except `/api/health`) are rate limited
- [ ] Rate limit headers returned on all responses (`X-RateLimit-*`)
- [ ] 429 response returned when limit exceeded
- [ ] Redis used in production, memory fallback in dev
- [ ] Different limits for auth/read/write/mcp/bulk tiers
- [ ] Rate limit bypass for internal health checks
- [ ] Unit tests for rate limiter logic
- [ ] Integration test verifying 429 response

---

## 1.2 Content Security Policy (CSP)

### Problem Statement
No CSP header configured, leaving the application vulnerable to XSS, script injection, and data exfiltration.

### Technical Specification

#### 1.2.1 CSP Policy Definition

```typescript
// lib/security/csp.ts
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for Next.js
  'style-src': ["'self'", "'unsafe-inline'"], // Required for Tailwind
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'", 'ws:', 'wss:'], // WebSocket for HMR
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
} as const;

export function buildCSPHeader(isDev: boolean): string {
  const directives = { ...CSP_DIRECTIVES };
  
  // Relax for development (HMR, source maps)
  if (isDev) {
    directives['script-src'].push("'unsafe-eval'");
    directives['connect-src'].push('ws://localhost:*');
  }
  
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}
```

#### 1.2.2 Next.js Configuration

```javascript
// next.config.js - Add to headers()
{
  key: 'Content-Security-Policy',
  value: process.env.NODE_ENV === 'production'
    ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none';"
    : '', // Relaxed in dev
},
{
  key: 'X-XSS-Protection',
  value: '1; mode=block',
},
{
  key: 'Permissions-Policy',
  value: 'camera=(), microphone=(), geolocation=()',
},
```

#### 1.2.3 Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `next.config.js` | Modify | Add CSP and additional security headers |
| `lib/security/csp.ts` | Create | CSP directive builder |

#### 1.2.4 Acceptance Criteria

- [ ] CSP header present on all responses in production
- [ ] Relaxed CSP in development for HMR
- [ ] X-XSS-Protection header added
- [ ] Permissions-Policy header restricting device APIs
- [ ] No console CSP violations in production
- [ ] E2E tests pass with CSP enabled

---

## 1.3 SQL Injection Audit & Fix

### Problem Statement
10 instances of `$queryRawUnsafe` found in the codebase, potential SQL injection vectors.

### Technical Specification

#### 1.3.1 Files to Audit

| File | Instances | Risk Level |
|------|-----------|------------|
| `lib/knowledge/graph.ts` | 3 | High |
| `lib/knowledge/search.ts` | 2 | High |
| `lib/knowledge/deduplication.ts` | 1 | Medium |
| `lib/onboarding/create-skills.ts` | 1 | Low |
| `scripts/aggregate-wiki-analytics.ts` | 1 | Low (script) |
| `scripts/backfill-wiki-search.ts` | 1 | Low (script) |

#### 1.3.2 Migration Pattern

**Before (Unsafe):**
```typescript
// ❌ SQL Injection Risk
const query = `SELECT * FROM items WHERE category = '${userInput}'`;
await prisma.$queryRawUnsafe(query);
```

**After (Safe):**
```typescript
// ✅ Parameterized Query
await prisma.$queryRaw`
  SELECT * FROM items WHERE category = ${userInput}
`;
```

**For Dynamic Queries:**
```typescript
// ✅ Use Prisma.sql for dynamic parts
import { Prisma } from '@prisma/client';

const orderBy = Prisma.sql([sortDirection === 'desc' ? 'DESC' : 'ASC']);
await prisma.$queryRaw`
  SELECT * FROM items 
  ORDER BY created_at ${orderBy}
`;
```

#### 1.3.3 Audit Checklist

For each `$queryRawUnsafe` instance:

1. [ ] Identify all variables interpolated into the query
2. [ ] Trace variable origins (user input vs. internal)
3. [ ] Validate if user-controlled input can reach the query
4. [ ] Convert to `$queryRaw` with template literals
5. [ ] Use `Prisma.sql` for truly dynamic SQL parts
6. [ ] Add input validation before query execution
7. [ ] Write test case for SQL injection attempt

#### 1.3.4 Acceptance Criteria

- [ ] Zero `$queryRawUnsafe` calls with user-controlled input
- [ ] All dynamic queries use parameterized templates
- [ ] Input validation added for any remaining dynamic SQL
- [ ] Security test cases added for SQL injection vectors
- [ ] Code review completed for all changes

---

## 1.4 CORS Restriction

### Problem Statement
`/api/mcp` explicitly returns `Access-Control-Allow-Origin: *`, making browser-based API abuse easier if tokens leak.

### Technical Specification

#### 1.4.1 Fix
```typescript
// app/api/mcp/route.ts - Restrict CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

export async function OPTIONS() {
  const origin = request.headers.get('origin');
  const isAllowed = allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production';
  
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': isAllowed ? origin : '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

#### 1.4.2 Acceptance Criteria

- [ ] CORS restricted to known origins in production
- [ ] `*` allowed only in development
- [ ] MCP server CORS also restricted

---

## 1.5 Additional Security Headers (HSTS, Image Patterns)

### Problem Statement
- Missing HSTS header (should be enabled for HTTPS-only production)
- `next.config.js` allows `remotePatterns.hostname = '**'` (potential SSRF)

### Technical Specification

#### 1.5.1 Add HSTS Header
```javascript
// next.config.js - Production only
{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains',
},
```

#### 1.5.2 Restrict Image Remote Patterns
```javascript
// next.config.js - BEFORE (vulnerable)
images: {
  remotePatterns: [{ hostname: '**' }],
}

// AFTER (restricted)
images: {
  remotePatterns: [
    { hostname: 'avatars.githubusercontent.com' },
    { hostname: 'images.unsplash.com' },
    // Add only needed hosts
  ],
}
```

#### 1.5.3 Acceptance Criteria

- [ ] HSTS header present in production
- [ ] Image remote patterns restricted to known hosts
- [ ] No `**` wildcards in production config

---

## 1.6 Build Quality Gates

### Problem Statement
`next.config.js` has build gates disabled, allowing broken code to ship:
```javascript
eslint: { ignoreDuringBuilds: true },
typescript: { ignoreBuildErrors: true },
```

### Technical Specification

#### 1.6.1 Enable Build Gates
```javascript
// next.config.js - PRODUCTION MUST HAVE
eslint: { 
  ignoreDuringBuilds: false,  // Fail on lint errors
},
typescript: { 
  ignoreBuildErrors: false,   // Fail on TS errors
},
```

#### 1.6.2 Acceptance Criteria

- [ ] `ignoreDuringBuilds: false` in production
- [ ] `ignoreBuildErrors: false` in production
- [ ] CI enforces same rules
- [ ] No TS errors in current codebase

---

## 1.7 Redis KEYS Pattern Fix

### Problem Statement
`lib/mcp/session-store.ts` uses `redis.keys('session:*')` which is O(N) and blocks Redis at scale.

### Technical Specification

#### 1.7.1 Current (Problematic)
```typescript
// O(N) - blocks Redis
const keys = await redis.keys('session:*');
```

#### 1.7.2 Fix Options

**Option A: Use SCAN (non-blocking)**
```typescript
async function* scanKeys(pattern: string) {
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    for (const key of keys) yield key;
  } while (cursor !== '0');
}
```

**Option B: Track sessions in a Set**
```typescript
// On session create
await redis.sadd('project:6:sessions', sessionId);

// On session delete
await redis.srem('project:6:sessions', sessionId);

// List sessions (O(1) for set members)
const sessions = await redis.smembers('project:6:sessions');
```

#### 1.7.3 Acceptance Criteria

- [ ] No `redis.keys()` calls in production code
- [ ] Session listing uses SCAN or Sets
- [ ] Performance test: 10K sessions doesn't block Redis

---

## 1.8 Phase 1 Deliverables

| Deliverable | Type | Priority |
|-------------|------|----------|
| `lib/rate-limit/*` | New module | P0 |
| `middleware.ts` updates | Modification | P0 |
| `next.config.js` CSP | Modification | P0 |
| SQL audit fixes | Modification | P0 |
| Rate limit tests | Tests | P0 |
| Security headers tests | Tests | P0 |

### Definition of Done

- [ ] All acceptance criteria met
- [ ] Code reviewed by second engineer
- [ ] No new security vulnerabilities introduced
- [ ] All existing tests pass
- [ ] New tests achieve 90%+ coverage for new code
- [ ] Documentation updated

---

# Phase 2: Observability Infrastructure

**Priority:** P1 - High  
**Effort:** 12-16 hours  
**Branch:** `feature/phase-2-observability`  
**Dependencies:** None (can run parallel with Phase 1)

## 2.1 Structured Logging

### Problem Statement
313+ `console.log`/`console.error` calls scattered across API routes. No log aggregation, correlation, or structured format.

### Technical Specification

#### 2.1.1 Logger Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Logging Architecture                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Application Code                                            │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────┐                                            │
│  │   Logger    │ ← Pino (structured JSON logging)           │
│  │  Singleton  │                                            │
│  └─────────────┘                                            │
│       │                                                      │
│       ├─→ Development: pino-pretty (colorized console)      │
│       │                                                      │
│       └─→ Production: JSON to stdout                        │
│              │                                               │
│              └─→ Docker logs → Log aggregator (future)      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2.1.2 Log Levels & Usage

| Level | When to Use | Example |
|-------|-------------|---------|
| `fatal` | App cannot continue | Database connection lost |
| `error` | Operation failed | API error response |
| `warn` | Potential issue | Deprecated API usage |
| `info` | Business events | Ticket created, user logged in |
| `debug` | Development detail | SQL queries, cache hits |
| `trace` | Fine-grained detail | Request/response bodies |

#### 2.1.3 Implementation

```typescript
// lib/logger/index.ts
import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      host: bindings.hostname,
      node_version: process.version,
    }),
  },
  
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // Redact sensitive fields
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
    censor: '[REDACTED]',
  },
  
  // Pretty print in development
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

// Child logger factory with context
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

// Request-scoped logger
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({ requestId, userId });
}
```

#### 2.1.4 Log Message Standards

```typescript
// lib/logger/standards.ts
export const LogMessages = {
  // API Events
  API_REQUEST_START: 'api.request.start',
  API_REQUEST_END: 'api.request.end',
  API_ERROR: 'api.error',
  
  // Auth Events
  AUTH_LOGIN_SUCCESS: 'auth.login.success',
  AUTH_LOGIN_FAILURE: 'auth.login.failure',
  AUTH_TOKEN_VALIDATED: 'auth.token.validated',
  
  // Business Events
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  SESSION_STARTED: 'session.started',
  
  // System Events
  DB_QUERY_SLOW: 'db.query.slow',
  CACHE_HIT: 'cache.hit',
  CACHE_MISS: 'cache.miss',
  RATE_LIMIT_EXCEEDED: 'ratelimit.exceeded',
} as const;
```

#### 2.1.5 Migration Script

Create a codemod to migrate existing console calls:

```typescript
// scripts/migrate-console-to-logger.ts
/**
 * Migration patterns:
 * 
 * console.log('[API] message', data) 
 *   → logger.info({ ...data }, 'message')
 * 
 * console.error('[API] error:', error)
 *   → logger.error({ error }, 'error')
 * 
 * console.log(`[SkillsCache] Cached skill: ${key}`)
 *   → logger.debug({ key }, 'Cached skill')
 */
```

#### 2.1.6 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `lib/logger/index.ts` | Create | Pino logger singleton |
| `lib/logger/standards.ts` | Create | Log message constants |
| `lib/logger/request-context.ts` | Create | Request-scoped logging |
| `package.json` | Modify | Add pino, pino-pretty deps |
| `app/api/**/*.ts` | Modify | Replace console.* with logger |
| `lib/**/*.ts` | Modify | Replace console.* with logger |

#### 2.1.7 Acceptance Criteria

- [ ] Pino logger configured and exported
- [ ] All console.log/error calls migrated to logger
- [ ] Sensitive data redacted from logs
- [ ] Pretty printing in development
- [ ] JSON output in production
- [ ] Request ID included in all API logs
- [ ] Log level configurable via environment

---

## 2.2 Request ID Correlation

### Problem Statement
No request correlation IDs, making it impossible to trace a request across services and logs.

### Technical Specification

#### 2.2.1 Request ID Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Request ID Flow                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Client Request                                              │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────┐                │
│  │           Next.js Middleware            │                │
│  │  1. Check X-Request-ID header           │                │
│  │  2. Generate if missing (UUIDv4)        │                │
│  │  3. Add to request headers              │                │
│  └─────────────────────────────────────────┘                │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────┐                │
│  │           API Route Handler             │                │
│  │  1. Extract requestId from headers      │                │
│  │  2. Create request-scoped logger        │                │
│  │  3. Include in all log entries          │                │
│  └─────────────────────────────────────────┘                │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────┐                │
│  │           Response                      │                │
│  │  Add X-Request-ID header to response    │                │
│  └─────────────────────────────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2.2 Implementation

```typescript
// lib/request-context.ts
import { headers } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const REQUEST_ID_HEADER = 'x-request-id';

export function getRequestId(): string {
  const headersList = headers();
  return headersList.get(REQUEST_ID_HEADER) || uuidv4();
}

export function getRequestContext() {
  const requestId = getRequestId();
  const headersList = headers();
  
  return {
    requestId,
    userAgent: headersList.get('user-agent'),
    ip: headersList.get('x-forwarded-for') || headersList.get('x-real-ip'),
  };
}
```

```typescript
// middleware.ts - Add request ID generation
import { v4 as uuidv4 } from 'uuid';

export async function middleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || uuidv4();
  
  // Clone request with new header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Add to response
  response.headers.set('x-request-id', requestId);
  
  return response;
}
```

#### 2.2.3 API Route Usage

```typescript
// Example: app/api/tickets/route.ts
import { getRequestContext } from '@/lib/request-context';
import { createRequestLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const { requestId, ip } = getRequestContext();
  const log = createRequestLogger(requestId);
  
  log.info({ ip, method: 'GET', path: '/api/tickets' }, 'Request started');
  
  try {
    const tickets = await prisma.ticket.findMany();
    log.info({ count: tickets.length }, 'Request completed');
    return success(tickets);
  } catch (error) {
    log.error({ error }, 'Request failed');
    return failure({ code: 'INTERNAL_ERROR', status: 500 });
  }
}
```

#### 2.2.4 Acceptance Criteria

- [ ] X-Request-ID header generated for all requests
- [ ] Request ID included in all log entries
- [ ] Request ID returned in response headers
- [ ] Client-provided request IDs honored
- [ ] MCP session ID correlated with request ID

---

## 2.3 API Response Time Metrics

### Problem Statement
No visibility into API performance metrics, making it hard to identify slow endpoints.

### Technical Specification

#### 2.3.1 Metrics Collection

```typescript
// lib/metrics/api-metrics.ts
interface APIMetric {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timestamp: Date;
}

// In-memory buffer for batch writes
const metricsBuffer: APIMetric[] = [];
const FLUSH_INTERVAL_MS = 10000; // 10 seconds
const FLUSH_THRESHOLD = 100; // Or 100 metrics

export function recordAPIMetric(metric: APIMetric) {
  metricsBuffer.push(metric);
  
  if (metricsBuffer.length >= FLUSH_THRESHOLD) {
    flushMetrics();
  }
}

async function flushMetrics() {
  if (metricsBuffer.length === 0) return;
  
  const batch = metricsBuffer.splice(0);
  
  // Option 1: Log to stdout (for log aggregator)
  batch.forEach(m => {
    logger.info({ 
      metric: 'api_response_time',
      ...m 
    }, 'API metric');
  });
  
  // Option 2: Write to database (future)
  // await prisma.apiMetric.createMany({ data: batch });
}

// Flush on interval
setInterval(flushMetrics, FLUSH_INTERVAL_MS);
```

#### 2.3.2 Middleware Integration

```typescript
// middleware.ts - Add timing
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || uuidv4();
  
  // ... existing middleware logic ...
  
  // On response, record metric
  const durationMs = Date.now() - startTime;
  
  recordAPIMetric({
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    statusCode: response.status,
    durationMs,
    timestamp: new Date(),
  });
  
  // Add timing header
  response.headers.set('X-Response-Time', `${durationMs}ms`);
  
  return response;
}
```

#### 2.3.3 Acceptance Criteria

- [ ] Response time tracked for all API routes
- [ ] X-Response-Time header added to responses
- [ ] Slow queries logged (>1s threshold)
- [ ] Metrics visible in logs with structured format

---

## 2.4 Phase 2 Deliverables

| Deliverable | Type | Priority |
|-------------|------|----------|
| `lib/logger/*` | New module | P1 |
| `lib/request-context.ts` | New file | P1 |
| `lib/metrics/api-metrics.ts` | New file | P1 |
| Console migration | Modification | P1 |
| Middleware updates | Modification | P1 |
| `package.json` updates | Modification | P1 |

### Definition of Done

- [ ] All console calls migrated to structured logger
- [ ] Request IDs present in all API logs
- [ ] Response time metrics collected
- [ ] No sensitive data in logs (redaction working)
- [ ] Logs parseable as JSON in production

---

# Phase 3: Resilience Patterns

**Priority:** P1 - High  
**Effort:** 10-12 hours  
**Branch:** `feature/phase-3-resilience`  
**Dependencies:** Phase 2 (logging)

## 3.1 Request Timeouts

### Problem Statement
No request timeouts on API routes or external calls. Slow operations can exhaust server resources.

### Technical Specification

#### 3.1.1 Timeout Configuration

```typescript
// lib/config/timeouts.ts
export const TIMEOUTS = {
  // API route timeouts
  api: {
    default: 30_000,      // 30s for most routes
    bulk: 60_000,         // 60s for bulk operations
    search: 15_000,       // 15s for search
    health: 5_000,        // 5s for health checks
  },
  
  // External service timeouts
  external: {
    redis: 3_000,         // 3s Redis operations
    embedding: 10_000,    // 10s embedding generation
    database: 20_000,     // 20s database queries
  },
  
  // MCP timeouts
  mcp: {
    toolCall: 30_000,     // 30s per tool call
    session: 60_000,      // 60s session operations
  },
} as const;
```

#### 3.1.2 Timeout Utility

```typescript
// lib/utils/timeout.ts
export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly timeoutMs: number
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new TimeoutError(
            `Operation '${operation}' timed out after ${timeoutMs}ms`,
            operation,
            timeoutMs
          ));
        });
      }),
    ]);
    
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Usage example
const tickets = await withTimeout(
  prisma.ticket.findMany({ where }),
  TIMEOUTS.external.database,
  'ticket.findMany'
);
```

#### 3.1.3 Prisma Timeout Configuration

```typescript
// lib/prisma.ts - Add transaction timeout
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
}).$extends({
  query: {
    $allOperations({ operation, model, args, query }) {
      const start = Date.now();
      return query(args).finally(() => {
        const duration = Date.now() - start;
        if (duration > 1000) {
          logger.warn({ 
            model, 
            operation, 
            durationMs: duration 
          }, 'Slow database query');
        }
      });
    },
  },
});
```

#### 3.1.4 Acceptance Criteria

- [ ] All database queries have timeout wrappers
- [ ] All external API calls have timeouts
- [ ] Slow queries (>1s) logged as warnings
- [ ] TimeoutError thrown and handled gracefully
- [ ] Client receives appropriate error response on timeout

---

## 3.2 Circuit Breaker Pattern

### Problem Statement
No circuit breakers for external dependencies. Failures can cascade through the system.

### Technical Specification

#### 3.2.1 Circuit Breaker States

```
┌─────────────────────────────────────────────────────────────┐
│                 Circuit Breaker States                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│     ┌──────────┐                                            │
│     │  CLOSED  │ ← Normal operation                         │
│     └────┬─────┘                                            │
│          │ Failure threshold exceeded                        │
│          ▼                                                   │
│     ┌──────────┐                                            │
│     │   OPEN   │ ← All requests fail fast                   │
│     └────┬─────┘                                            │
│          │ Reset timeout elapsed                             │
│          ▼                                                   │
│     ┌──────────┐                                            │
│     │HALF-OPEN │ ← Test requests allowed                    │
│     └────┬─────┘                                            │
│          │                                                   │
│          ├─→ Success: Return to CLOSED                      │
│          └─→ Failure: Return to OPEN                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 3.2.2 Implementation

```typescript
// lib/circuit-breaker/index.ts
import CircuitBreaker from 'opossum';

interface CircuitBreakerOptions {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
  volumeThreshold: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  timeout: 10000,              // 10s
  errorThresholdPercentage: 50, // Open at 50% failures
  resetTimeout: 30000,         // 30s before half-open
  volumeThreshold: 5,          // Min requests before tripping
};

// Circuit breaker registry
const breakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker<T>(
  name: string,
  fn: (...args: unknown[]) => Promise<T>,
  options: Partial<CircuitBreakerOptions> = {}
): CircuitBreaker {
  if (!breakers.has(name)) {
    const breaker = new CircuitBreaker(fn, {
      ...DEFAULT_OPTIONS,
      ...options,
      name,
    });
    
    // Logging
    breaker.on('open', () => {
      logger.warn({ circuit: name }, 'Circuit breaker opened');
    });
    
    breaker.on('halfOpen', () => {
      logger.info({ circuit: name }, 'Circuit breaker half-open');
    });
    
    breaker.on('close', () => {
      logger.info({ circuit: name }, 'Circuit breaker closed');
    });
    
    breaker.on('fallback', () => {
      logger.debug({ circuit: name }, 'Circuit breaker fallback executed');
    });
    
    breakers.set(name, breaker);
  }
  
  return breakers.get(name)!;
}

// Health check endpoint for circuit status
export function getCircuitStatus(): Record<string, unknown> {
  const status: Record<string, unknown> = {};
  
  for (const [name, breaker] of breakers) {
    status[name] = {
      state: breaker.opened ? 'OPEN' : breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
      stats: breaker.stats,
    };
  }
  
  return status;
}
```

#### 3.2.3 Service-Specific Breakers

```typescript
// lib/circuit-breaker/services.ts

// Redis circuit breaker
export const redisBreaker = getCircuitBreaker(
  'redis',
  async (operation: () => Promise<unknown>) => operation(),
  {
    timeout: 3000,
    errorThresholdPercentage: 30,
    resetTimeout: 10000,
  }
);

// Embedding service circuit breaker
export const embeddingBreaker = getCircuitBreaker(
  'embedding',
  async (text: string) => generateEmbedding(text),
  {
    timeout: 15000,
    errorThresholdPercentage: 50,
    resetTimeout: 60000,
  }
);

// Database circuit breaker (for heavy queries)
export const dbHeavyQueryBreaker = getCircuitBreaker(
  'db-heavy',
  async (query: () => Promise<unknown>) => query(),
  {
    timeout: 30000,
    errorThresholdPercentage: 40,
    resetTimeout: 30000,
  }
);
```

#### 3.2.4 Usage Example

```typescript
// lib/knowledge/search.ts
import { dbHeavyQueryBreaker } from '@/lib/circuit-breaker/services';

export async function semanticSearch(query: string): Promise<SearchResult[]> {
  try {
    return await dbHeavyQueryBreaker.fire(async () => {
      const embedding = await generateEmbedding(query);
      return prisma.$queryRaw`
        SELECT *, 1 - (embedding <=> ${embedding}::vector) as similarity
        FROM knowledge_items
        WHERE 1 - (embedding <=> ${embedding}::vector) > 0.7
        ORDER BY embedding <=> ${embedding}::vector
        LIMIT 20
      `;
    });
  } catch (error) {
    if (error.code === 'EOPENBREAKER') {
      // Circuit is open, return fallback
      logger.warn('Semantic search circuit open, using fulltext fallback');
      return fulltextSearch(query);
    }
    throw error;
  }
}
```

#### 3.2.5 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `lib/circuit-breaker/index.ts` | Create | Circuit breaker factory |
| `lib/circuit-breaker/services.ts` | Create | Service-specific breakers |
| `lib/knowledge/search.ts` | Modify | Add circuit breaker |
| `lib/embeddings/index.ts` | Modify | Add circuit breaker |
| `app/api/health/route.ts` | Modify | Add circuit status |
| `package.json` | Modify | Add opossum dependency |

#### 3.2.6 Acceptance Criteria

- [ ] Circuit breakers for Redis, embedding, heavy DB queries
- [ ] Automatic fallback when circuit open
- [ ] Circuit status exposed in health endpoint
- [ ] Logging for state transitions
- [ ] Configurable thresholds per service

---

## 3.3 Retry Logic with Exponential Backoff

### Problem Statement
No retry logic for transient failures. Single failures cause immediate errors.

### Technical Specification

#### 3.3.1 Retry Configuration

```typescript
// lib/retry/index.ts
export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableErrors: string[];
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffFactor: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'P1001', // Prisma: Can't reach database
    'P1002', // Prisma: Database timeout
  ],
};
```

#### 3.3.2 Implementation

```typescript
// lib/retry/index.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;
  let delay = opts.initialDelayMs;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      const errorCode = (error as { code?: string }).code;
      const isRetryable = opts.retryableErrors.some(
        code => errorCode === code || lastError.message.includes(code)
      );
      
      if (!isRetryable || attempt === opts.maxAttempts) {
        logger.error({
          attempt,
          maxAttempts: opts.maxAttempts,
          error: lastError.message,
        }, 'Retry failed, giving up');
        throw lastError;
      }
      
      logger.warn({
        attempt,
        maxAttempts: opts.maxAttempts,
        nextDelayMs: delay,
        error: lastError.message,
      }, 'Retryable error, waiting before retry');
      
      await sleep(delay);
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelayMs);
    }
  }
  
  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

#### 3.3.3 Acceptance Criteria

- [ ] Retry logic for transient database errors
- [ ] Exponential backoff with jitter
- [ ] Configurable retry limits per operation
- [ ] Non-retryable errors fail immediately
- [ ] Logging of retry attempts

---

## 3.4 Phase 3 Deliverables

| Deliverable | Type | Priority |
|-------------|------|----------|
| `lib/utils/timeout.ts` | New file | P1 |
| `lib/circuit-breaker/*` | New module | P1 |
| `lib/retry/index.ts` | New file | P1 |
| `lib/config/timeouts.ts` | New file | P1 |
| Service integrations | Modifications | P1 |
| Health endpoint updates | Modification | P1 |

---

# Phase 4: Operations Excellence

**Priority:** P2 - Medium  
**Effort:** 8-10 hours  
**Branch:** `feature/phase-4-operations`  
**Dependencies:** Phase 2, Phase 3

## 4.1 Graceful Shutdown

### Problem Statement
No explicit SIGTERM/SIGINT handlers. Connections may not be cleaned up properly.

### Technical Specification

#### 4.1.1 Implementation

```typescript
// lib/shutdown.ts
import { prisma } from '@/lib/prisma';
import { closeRedisConnection } from '@/lib/redis';
import { logger } from '@/lib/logger';

let isShuttingDown = false;

export function setupGracefulShutdown() {
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    logger.info({ signal }, 'Graceful shutdown initiated');
    
    // Give in-flight requests time to complete
    await sleep(5000);
    
    // Close connections
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error({ error }, 'Error closing database');
    }
    
    try {
      await closeRedisConnection();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error({ error }, 'Error closing Redis');
    }
    
    logger.info('Shutdown complete');
    process.exit(0);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught exception');
    shutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled rejection');
    shutdown('unhandledRejection');
  });
}
```

#### 4.1.2 Instrumentation Hook

```typescript
// instrumentation.ts (Next.js 14)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupGracefulShutdown } = await import('@/lib/shutdown');
    setupGracefulShutdown();
  }
}
```

---

## 4.2 Remove Hardcoded Secrets

### Problem Statement
Docker Compose files contain hardcoded credentials.

### Technical Specification

#### 4.2.1 Migration Plan

```yaml
# docker-compose.cloud.yml - BEFORE
environment:
  POSTGRES_PASSWORD: postgres123
  NEXTAUTH_SECRET: dev-secret-change-in-production

# docker-compose.cloud.yml - AFTER  
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
```

#### 4.2.2 Environment Template

```bash
# .env.docker.example (new file)
# Copy to .env.docker and fill in values

# Database
POSTGRES_PASSWORD=<generate-secure-password>

# Authentication
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Redis
REDIS_PASSWORD=<generate-secure-password>
```

#### 4.2.3 Acceptance Criteria

- [ ] No hardcoded secrets in version control
- [ ] .env.docker.example with placeholder values
- [ ] Docker Compose uses environment variable substitution
- [ ] Documentation updated with secret generation commands

---

## 4.3 API Response Compression

### Problem Statement
No explicit compression, larger payload sizes.

### Technical Specification

```javascript
// next.config.js
module.exports = {
  compress: true, // Enable built-in compression
  // ... rest of config
};
```

---

## 4.4 CORS Configuration

### Problem Statement
No explicit CORS headers for cross-origin API access.

### Technical Specification

```typescript
// lib/cors.ts
export const CORS_CONFIG = {
  development: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  production: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
    credentials: true,
  },
};
```

```javascript
// next.config.js - Add CORS headers
{
  key: 'Access-Control-Allow-Origin',
  value: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS || ''
    : '*',
},
{
  key: 'Access-Control-Allow-Methods',
  value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
},
{
  key: 'Access-Control-Allow-Headers',
  value: 'Content-Type, Authorization, X-Request-ID, Mcp-Session-Id',
},
```

---

## 4.5 API Versioning Strategy

### Problem Statement
No API versioning, breaking changes affect all clients.

### Technical Specification

#### 4.5.1 Versioning Approach: URL Path

```
/api/v1/tickets     ← Current version
/api/v2/tickets     ← Future version with breaking changes
/api/tickets        ← Alias for latest stable (v1)
```

#### 4.5.2 Implementation (Future Phase)

```
app/
├── api/
│   ├── v1/
│   │   ├── tickets/
│   │   │   └── route.ts
│   │   └── ...
│   └── v2/           ← Future
│       └── ...
```

#### 4.5.3 Recommendation

**For now:** Document current API as v1 implicitly. Add explicit versioning when breaking changes are needed.

---

## 4.6 Phase 4 Deliverables

| Deliverable | Type | Priority |
|-------------|------|----------|
| `lib/shutdown.ts` | New file | P2 |
| `instrumentation.ts` | New file | P2 |
| `.env.docker.example` | New file | P2 |
| Docker Compose updates | Modification | P2 |
| `next.config.js` updates | Modification | P2 |

---

# Implementation Timeline

## Recommended Sprint Plan

```
Week 1: Phase 1 - Critical Security
├── Day 1-2: Rate limiting implementation
├── Day 3: CSP and security headers
├── Day 4: SQL audit and fixes
└── Day 5: Testing and review

Week 2: Phase 2 - Observability
├── Day 1-2: Logger implementation
├── Day 3: Console migration
├── Day 4: Request ID correlation
└── Day 5: Metrics and testing

Week 3: Phase 3 & 4 - Resilience & Operations
├── Day 1-2: Timeouts and circuit breakers
├── Day 3: Retry logic
├── Day 4: Graceful shutdown, secrets cleanup
└── Day 5: Final testing and documentation
```

---

# Testing Strategy

## Test Categories Required

| Category | Coverage Target | Tools |
|----------|-----------------|-------|
| Unit Tests | 90%+ new code | Jest |
| Integration Tests | Key flows | Jest + Supertest |
| E2E Tests | Critical paths | Playwright |
| Load Tests | Rate limiting | k6 or Artillery |
| Security Tests | SQL injection, XSS | Manual + Semgrep |

## Key Test Cases

### Rate Limiting
- [ ] Request succeeds under limit
- [ ] 429 returned when limit exceeded
- [ ] Headers contain rate limit info
- [ ] Different limits for different tiers
- [ ] Redis failure falls back to memory

### Circuit Breaker
- [ ] Circuit opens after threshold failures
- [ ] Requests fail fast when open
- [ ] Circuit resets after timeout
- [ ] Fallback executed when open

### Timeouts
- [ ] Slow operations trigger timeout
- [ ] TimeoutError handled gracefully
- [ ] Client receives appropriate error

---

# Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Rate limiting too aggressive | User frustration | Start conservative, monitor, adjust |
| Logger migration breaks builds | Deployment blocked | Incremental migration, feature flag |
| Circuit breaker false positives | Good requests rejected | Tune thresholds carefully |
| CSP blocks legitimate scripts | UI broken | Test thoroughly in staging |

---

# Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Rate-limited routes | 1/57 | 57/57 | Code audit |
| Console calls | 313+ | 0 | Grep count |
| Response time P95 | Unknown | <500ms | Metrics |
| Circuit breaker coverage | 0% | 100% external | Code review |
| Security header score | B | A+ | SecurityHeaders.com |

---

# Appendix: Package Dependencies

## New Dependencies Required

```json
{
  "dependencies": {
    "pino": "^8.x",
    "opossum": "^8.x"
  },
  "devDependencies": {
    "pino-pretty": "^10.x"
  }
}
```

---

**Document Status:** Ready for Review  
**Next Steps:** Prioritize phases with stakeholder, create feature branches, begin implementation
