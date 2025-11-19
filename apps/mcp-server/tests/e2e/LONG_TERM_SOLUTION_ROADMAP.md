# MCP HTTP Streamable Migration & E2E Testing Roadmap

**Created**: 2025-11-19
**Status**: PLANNING PHASE
**Priority**: CRITICAL - Blocks production deployment

---

## Executive Summary

### Current Situation

The MCP server's **SSE (Server-Sent Events) transport layer has a critical bug** preventing responses >30KB from being delivered to clients. This blocks:
- ❌ Session 2 E2E tests (15 document prompts = 31KB)
- ⏳ Session 3 E2E tests (bootstrap response likely large)
- ❌ `tools/list` endpoint (complete tool catalog)

**Key Finding**: HTTP APIs are performant (0.19s for 31KB), but SSE transport fails silently after 90+ seconds.

### Strategic Decision

**Implement stateful HTTP streamable MCP server** as foundational infrastructure, then complete E2E testing and production hardening.

### Roadmap Phases

1. **Phase 1: HTTP Streamable MCP Server** (Foundation) - Prerequisite for all subsequent work
2. **Phase 2: E2E Test Migration** - Complete test suite with new transport
3. **Phase 3: Production Hardening** - Load testing, monitoring, optimization

---

## Current State Analysis

### SSE Implementation Issues

**Bug Report**: [MCP_SSE_LARGE_RESPONSE_BUG.md](./MCP_SSE_LARGE_RESPONSE_BUG.md)

| Issue | Description | Impact |
|-------|-------------|--------|
| **Silent Failures** | No error logs when SSE fails on large responses | Hard to diagnose |
| **Size Limit** | Responses >30KB timeout (90s+) | Blocks critical tools |
| **No Chunking** | No support for streaming large payloads | All-or-nothing delivery |
| **Poor Error Recovery** | Client hangs, no feedback | Bad UX |

**Evidence**:
```bash
# Direct HTTP API call
$ time curl "http://192.168.1.15:3000/api/onboarding/document-prompts?projectId=3"
Response: 30997 bytes
Time: 0.191 seconds ✅

# MCP SSE transport
Timeout: 90000ms ❌
```

### E2E Test Status

**Complete Results**: [E2E_TEST_RESULTS_SUMMARY.md](./E2E_TEST_RESULTS_SUMMARY.md)

| Session | Status | Tests Passed | Details |
|---------|--------|--------------|---------|
| **Session 1** | ✅ COMPLETE | 2/2 (1 skipped) | 10 phases + executive summary working |
| **Session 2** | ⚠️ PARTIAL | 2/3 | Validation tests pass, main test blocked |
| **Session 3** | ⏳ NOT TESTED | 0/3 | Blocked by same SSE bug |

**Working MCP Tools** (Response <15KB):
- `projectpulse_health_check` ✅
- `projectpulse_onboarding_getQuestions` ✅
- `projectpulse_onboarding_saveAnswers` ✅
- `projectpulse_onboarding_getExecutiveSummaryPrompt` ✅
- `projectpulse_onboarding_storeExecutiveSummary` ✅

**Blocked MCP Tools** (Response >30KB):
- `projectpulse_onboarding_getDocumentPrompts` ❌ (31KB)
- `projectpulse_onboarding_bootstrap` ❌ (likely large)
- `tools/list` ❌ (tool catalog)

### MCP Protocol Limitations Discovered

1. **SSE Message Size Limits**: No clear documentation on max size
2. **No Built-in Chunking**: Large responses must fit in single event
3. **Timeout Handling**: Silent failures with no error propagation
4. **Debugging Difficulty**: No logging of transport-layer issues

### API Performance Benchmarks

| Endpoint | Response Size | HTTP Time | MCP SSE Time |
|----------|---------------|-----------|--------------|
| `/api/health` | ~100 bytes | <10ms | <100ms ✅ |
| `/api/onboarding/questions` | 2-5 KB | 50-100ms | 200-500ms ✅ |
| `/api/onboarding/document-prompts` | 31 KB | **191ms** | **90000ms+** ❌ |

**Conclusion**: SSE transport layer adds 470x latency for large responses (when it doesn't timeout).

---

## Phase 1: Stateful HTTP Streamable MCP Server (PREREQUISITE)

### Objective

Implement a production-grade MCP server with **stateful HTTP streaming** that can:
- Handle responses of any size (100KB, 1MB, 10MB+)
- Stream data incrementally with backpressure
- Provide clear error messages and recovery
- Maintain session state across requests

### Architecture Design

#### Current SSE Architecture (Problematic)

```
Client                    MCP Server                Next.js API
  |                           |                          |
  |-- GET /mcp ------------->|                          |
  |<-- SSE stream opened -----|                          |
  |                           |                          |
  |-- POST /mcp?sessionId --->|                          |
  |<-- HTTP 202 Accepted -----|                          |
  |                           |                          |
  |                           |-- HTTP GET ------------->|
  |                           |<-- 31KB response --------|
  |                           |                          |
  |                           X [SSE FAILS SILENTLY]     |
  |                           |                          |
  |-- [90s timeout] ----------X                          |
```

#### Proposed HTTP Streamable Architecture

```
Client                    MCP Server                Next.js API
  |                           |                          |
  |-- POST /mcp/session ----->|                          |
  |<-- sessionId --------------|                          |
  |                           |                          |
  |-- POST /mcp/call -------->|                          |
  |    + sessionId            |                          |
  |    + toolName             |                          |
  |                           |-- HTTP GET ------------->|
  |                           |<-- 31KB response --------|
  |                           |                          |
  |<-- HTTP 200 (chunked) -----|                          |
  |<-- [chunk 1: 10KB] --------|                          |
  |<-- [chunk 2: 10KB] --------|                          |
  |<-- [chunk 3: 11KB] --------|                          |
  |<-- [end of stream] --------|                          |
```

### Key Features

#### 1. Stateful Sessions
```typescript
interface MCPSession {
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  state: Record<string, any>; // Persistent state
  timeoutMs: number; // Session timeout
}

// Session management
POST /mcp/session → Create session, return sessionId
GET  /mcp/session/:id → Check session status
DELETE /mcp/session/:id → Close session
```

#### 2. Chunked Response Streaming
```typescript
// Client sends request with Accept: application/x-ndjson
POST /mcp/call
Headers:
  Content-Type: application/json
  Accept: application/x-ndjson
  X-Session-ID: abc123
Body:
  { method: "tools/call", params: {...} }

// Server responds with chunked transfer encoding
HTTP/1.1 200 OK
Transfer-Encoding: chunked
Content-Type: application/x-ndjson

{"type":"start","id":"req-1","timestamp":"..."}
{"type":"progress","id":"req-1","percent":25}
{"type":"data","id":"req-1","chunk":1,"content":"..."}
{"type":"data","id":"req-1","chunk":2,"content":"..."}
{"type":"complete","id":"req-1","totalChunks":2}
```

#### 3. Error Recovery
```typescript
// Clear error responses
{"type":"error","id":"req-1","code":"RESPONSE_TOO_LARGE","message":"Response exceeded 10MB limit","retryable":false}

// Timeout handling
{"type":"error","id":"req-1","code":"TIMEOUT","message":"Request exceeded 60s limit","retryable":true}

// Network interruption recovery
{"type":"resume","id":"req-1","fromChunk":3}
```

#### 4. Backpressure Support
```typescript
// Client can signal readiness for more data
{"type":"ready","id":"req-1","bufferSize":1024}

// Server respects client buffer limits
{"type":"pause","id":"req-1","reason":"Client buffer full"}
```

### Implementation Requirements

**Files to Create/Modify**:

1. **`apps/mcp-server/src/transports/http-stream.ts`** (NEW)
   - Session management
   - Chunked response streaming
   - Backpressure handling

2. **`apps/mcp-server/src/session-store.ts`** (NEW)
   - In-memory session storage (with Redis option for production)
   - Session timeout and cleanup
   - State persistence

3. **`apps/mcp-server/src/index-http-stream.ts`** (NEW)
   - Express/Fastify server with streaming endpoints
   - POST /mcp/session - Create session
   - POST /mcp/call - Execute tool with streaming
   - GET /mcp/session/:id - Check session
   - DELETE /mcp/session/:id - Close session

4. **`apps/mcp-server/src/streaming-response.ts`** (NEW)
   - Response chunking logic
   - Progress tracking
   - Error handling

5. **Update `docker-compose.cloud.yml`**:
   - Add Redis service (optional, for distributed sessions)
   - Update MCP server environment variables

### Protocol Comparison

| Feature | SSE (Current) | HTTP Streamable (Proposed) |
|---------|---------------|----------------------------|
| **Max Response Size** | ~30KB ❌ | Unlimited ✅ |
| **Chunking** | No ❌ | Yes ✅ |
| **Backpressure** | No ❌ | Yes ✅ |
| **Error Recovery** | Silent failure ❌ | Clear errors + retry ✅ |
| **Session State** | URL param only ❌ | Full state management ✅ |
| **Browser Support** | SSE limited ⚠️ | HTTP universal ✅ |
| **Debugging** | Difficult ❌ | Standard HTTP tools ✅ |
| **Performance** | Poor for large data ❌ | Optimized ✅ |

### Expected Benefits

1. **Removes Size Limits**: Handle 100KB, 1MB, 10MB+ responses
2. **Better UX**: Progressive loading, progress indicators
3. **Reliability**: Error recovery, retry mechanisms
4. **Observability**: Standard HTTP logging and monitoring
5. **Flexibility**: Supports various client types (browsers, CLI, agents)

### Success Criteria

- ✅ Handle 1MB+ responses without timeout
- ✅ Stream data with <100ms latency per chunk
- ✅ Clear error messages for all failure modes
- ✅ Session management with configurable timeouts
- ✅ Backward compatible with existing MCP protocol semantics

---

## Phase 2: E2E Test Migration (POST HTTP STREAMABLE)

### Objective

Update E2E test infrastructure to use HTTP streamable transport and complete full test coverage.

### Step 1: Update MCPTestClient

**File**: `apps/mcp-server/tests/e2e/setup/mcp-client.ts`

**Changes Required**:

```typescript
export class MCPTestClient {
  private sessionId?: string;
  private baseUrl: string;
  private transport: 'sse' | 'http-stream';

  constructor(baseUrl: string, transport: 'sse' | 'http-stream' = 'http-stream') {
    this.baseUrl = baseUrl;
    this.transport = transport;
  }

  async connect(): Promise<void> {
    if (this.transport === 'http-stream') {
      // POST /mcp/session to create session
      const response = await fetch(`${this.baseUrl}/mcp/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      this.sessionId = data.sessionId;
    } else {
      // Existing SSE logic (fallback)
      // ...
    }
  }

  async callToolJSON<T>(
    name: string,
    args: Record<string, any>,
    timeout?: number
  ): Promise<T> {
    if (this.transport === 'http-stream') {
      return this.callToolHTTPStream<T>(name, args, timeout);
    } else {
      return this.callToolSSE<T>(name, args, timeout);
    }
  }

  private async callToolHTTPStream<T>(
    name: string,
    args: Record<string, any>,
    timeout: number = 30000
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}/mcp/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/x-ndjson',
          'X-Session-ID': this.sessionId!,
        },
        body: JSON.stringify({
          method: 'tools/call',
          params: { name, arguments: args },
        }),
        signal: controller.signal,
      });

      // Read chunked NDJSON stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let result: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          const message = JSON.parse(line);

          if (message.type === 'error') {
            throw new Error(`Tool error: ${message.message}`);
          } else if (message.type === 'complete') {
            // Combine all data chunks
            return result as T;
          } else if (message.type === 'data') {
            // Accumulate chunks
            if (!result) result = {};
            Object.assign(result, JSON.parse(message.content));
          }
        }
      }

      if (!result) {
        throw new Error('No response received');
      }
      return result as T;

    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async callToolSSE<T>(...): Promise<T> {
    // Existing SSE implementation (fallback)
    // ...
  }
}
```

### Step 2: Retry Session 2 Tests

**File**: `apps/mcp-server/tests/e2e/onboarding/session2-document-generation.test.ts`

**Expected Changes**:
```typescript
// Update client instantiation
const client = new MCPTestClient(MCP_URL, 'http-stream');

// No timeout needed for getDocumentPrompts anymore
const promptsData = await client.callToolJSON(
  'projectpulse_onboarding_getDocumentPrompts',
  { projectId: TEST_PROJECT_ID }
  // No 90s timeout - should complete in <1s
);

// Verify all 15 documents received
assertEqual(promptsData.documents.length, 15);

// Rest of test should work unchanged
```

**Expected Result**: ✅ Test completes in <5 seconds (vs 90s timeout)

### Step 3: Complete Session 3 Tests

**File**: `apps/mcp-server/tests/e2e/onboarding/session3-bootstrap.test.ts`

**Test Flow**:
```typescript
test('Complete bootstrap workflow', async () => {
  const client = new MCPTestClient(MCP_URL, 'http-stream');
  await client.connect();

  // Call bootstrap tool (likely large response)
  const bootstrapData = await client.callToolJSON(
    'projectpulse_onboarding_bootstrap',
    {
      projectId: TEST_PROJECT_ID,
      repoPath: '/tmp/test-repo',
    }
  );

  // Verify all artifacts created
  assertEqual(bootstrapData.personas.length >= 3, true);
  assertEqual(bootstrapData.skills.length >= 5, true);
  assertEqual(bootstrapData.workflows.length >= 3, true);
  assertEqual(bootstrapData.sops.length >= 5, true);
  assertDefined(bootstrapData.roadmap);
  assertDefined(bootstrapData.filesWritten); // CLAUDE.md, AGENTS.md

  // Verify roadmap materialization
  assertDefined(bootstrapData.roadmap.phases);
  assert(bootstrapData.roadmap.phases.length > 0);
});
```

**Expected Result**: ✅ All Session 3 tests passing

### Step 4: Fix tools/list Timeout

**Test**:
```typescript
test('List all MCP tools', async () => {
  const client = new MCPTestClient(MCP_URL, 'http-stream');
  await client.connect();

  const toolsData = await client.listTools();

  // Should return 40+ tools without timeout
  assert(toolsData.tools.length >= 40);
});
```

**Expected Result**: ✅ Tool catalog retrieved in <1s

### Migration Checklist

- [ ] Update MCPTestClient to support both SSE and HTTP stream
- [ ] Add HTTP stream transport implementation
- [ ] Retry Session 2 main test (15 documents)
- [ ] Complete Session 3 tests (bootstrap)
- [ ] Fix tools/list timeout
- [ ] Add performance benchmarks (before/after)
- [ ] Update test documentation

### Success Criteria

- ✅ All Session 2 tests passing (3/3)
- ✅ All Session 3 tests passing (3/3)
- ✅ tools/list working without timeout
- ✅ E2E test suite 100% passing (12/12 tests)
- ✅ Test execution time <30 seconds total

---

## Phase 3: Production Hardening

### Objective

Ensure MCP server is production-ready with comprehensive testing, monitoring, and optimization.

### Load Testing Strategy

**Goal**: Validate performance under realistic and extreme loads

#### Test Scenarios

**Scenario 1: Small Responses (Baseline)**
```bash
# 1000 requests, 10 concurrent, <5KB responses
ab -n 1000 -c 10 -p request.json \
   -H "Content-Type: application/json" \
   http://192.168.1.15:3001/mcp/call

Expected:
- Throughput: >500 req/s
- P95 latency: <100ms
- Error rate: 0%
```

**Scenario 2: Medium Responses (Typical)**
```bash
# 500 requests, 10 concurrent, 10-50KB responses
# Simulate getDocumentPrompts calls

Expected:
- Throughput: >200 req/s
- P95 latency: <500ms
- Error rate: 0%
```

**Scenario 3: Large Responses (Stress)**
```bash
# 100 requests, 5 concurrent, 100KB-1MB responses
# Simulate large bootstrap responses

Expected:
- Throughput: >50 req/s
- P95 latency: <2s
- Error rate: 0%
```

**Scenario 4: Extreme Responses (Limit Testing)**
```bash
# 10 requests, 1 concurrent, 10MB responses
# Find breaking point

Expected:
- Complete without OOM
- Streaming works correctly
- Backpressure prevents overflow
```

#### Load Testing Tools

1. **Apache Bench (ab)**: Quick throughput testing
2. **k6**: Realistic scenario testing with JavaScript
3. **Locust**: Distributed load testing (if needed)

#### Load Test Implementation

**File**: `apps/mcp-server/tests/load/load-test-suite.js` (NEW)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    small_responses: {
      executor: 'constant-arrival-rate',
      rate: 500,
      duration: '1m',
      preAllocatedVUs: 50,
    },
    large_responses: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 10 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const sessionRes = http.post(
    'http://192.168.1.15:3001/mcp/session',
    JSON.stringify({}),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const sessionId = JSON.parse(sessionRes.body).sessionId;

  const callRes = http.post(
    'http://192.168.1.15:3001/mcp/call',
    JSON.stringify({
      method: 'tools/call',
      params: {
        name: 'projectpulse_onboarding_getDocumentPrompts',
        arguments: { projectId: 3 },
      },
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/x-ndjson',
        'X-Session-ID': sessionId,
      },
    }
  );

  check(callRes, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### Performance Optimization

#### 1. Response Caching

```typescript
// Cache expensive API calls
import NodeCache from 'node-cache';

const responseCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60,
});

async function getDocumentPrompts(projectId: number) {
  const cacheKey = `doc-prompts-${projectId}`;
  const cached = responseCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const result = await fetchFromAPI(projectId);
  responseCache.set(cacheKey, result);
  return result;
}
```

#### 2. Connection Pooling

```typescript
// Reuse HTTP connections to Next.js API
import { Agent } from 'http';

const httpAgent = new Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
});

// Use in fetch calls
fetch(url, { agent: httpAgent });
```

#### 3. Response Compression

```typescript
// Compress large responses
import zlib from 'zlib';

function streamCompressedResponse(data: string, res: Response) {
  res.setHeader('Content-Encoding', 'gzip');
  const gzip = zlib.createGzip();
  const stream = Readable.from(data);
  stream.pipe(gzip).pipe(res);
}
```

#### 4. Resource Limits

```typescript
// Prevent memory leaks from huge responses
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_SESSION_AGE = 30 * 60 * 1000; // 30 minutes

function validateResponseSize(size: number) {
  if (size > MAX_RESPONSE_SIZE) {
    throw new Error(`Response size ${size} exceeds limit ${MAX_RESPONSE_SIZE}`);
  }
}
```

### Monitoring and Alerting

#### Metrics to Track

**Application Metrics**:
- Request rate (req/s)
- Response time (P50, P95, P99)
- Error rate (%)
- Active sessions count
- Response size distribution

**System Metrics**:
- CPU usage (%)
- Memory usage (MB)
- Network I/O (MB/s)
- Open connections

**Business Metrics**:
- Tool usage breakdown
- Most popular tools
- Average session duration
- User retention

#### Implementation

**File**: `apps/mcp-server/src/monitoring/metrics.ts` (NEW)

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

export const requestCounter = new Counter({
  name: 'mcp_requests_total',
  help: 'Total MCP requests',
  labelNames: ['tool', 'status'],
});

export const responseDuration = new Histogram({
  name: 'mcp_response_duration_seconds',
  help: 'MCP response duration',
  labelNames: ['tool'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const activeSessionsGauge = new Gauge({
  name: 'mcp_active_sessions',
  help: 'Number of active sessions',
});

export const responseSizeHistogram = new Histogram({
  name: 'mcp_response_size_bytes',
  help: 'MCP response size',
  buckets: [1024, 10240, 102400, 1048576, 10485760], // 1KB to 10MB
});
```

**Endpoint**: `GET /metrics` (Prometheus format)

#### Alerting Rules

```yaml
# Prometheus alerting rules
groups:
  - name: mcp_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(mcp_requests_total{status="error"}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "MCP error rate above 5%"

      - alert: SlowResponses
        expr: histogram_quantile(0.95, mcp_response_duration_seconds) > 2
        for: 5m
        annotations:
          summary: "95th percentile response time above 2s"

      - alert: TooManySessions
        expr: mcp_active_sessions > 1000
        for: 5m
        annotations:
          summary: "More than 1000 active sessions"
```

### Error Handling Improvements

#### Graceful Degradation

```typescript
// Fallback to smaller response if full response fails
async function getDocumentPromptsWithFallback(projectId: number) {
  try {
    // Try full response
    return await getDocumentPrompts(projectId);
  } catch (error) {
    if (error.code === 'RESPONSE_TOO_LARGE') {
      // Return paginated response
      return {
        message: 'Response too large, use pagination',
        pagination: {
          endpoint: '/mcp/call',
          tool: 'projectpulse_onboarding_getDocumentPromptsPage',
          totalPages: 3,
        },
      };
    }
    throw error;
  }
}
```

#### Retry Logic

```typescript
// Automatic retry with exponential backoff
async function callToolWithRetry(
  name: string,
  args: any,
  maxRetries = 3
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callTool(name, args);
    } catch (error) {
      if (!isRetryable(error) || attempt === maxRetries - 1) {
        throw error;
      }
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await sleep(delay);
    }
  }
}

function isRetryable(error: Error): boolean {
  const retryableCodes = ['TIMEOUT', 'NETWORK_ERROR', 'ECONNRESET'];
  return retryableCodes.includes(error.code);
}
```

### Production Checklist

**Infrastructure**:
- [ ] Docker images optimized (multi-stage builds)
- [ ] Health checks configured
- [ ] Resource limits set (CPU, memory)
- [ ] Logging configured (structured JSON)
- [ ] Metrics endpoint exposed
- [ ] Secrets management (no hardcoded credentials)

**Performance**:
- [ ] Load tests passing (500+ req/s for small responses)
- [ ] Response compression enabled
- [ ] Connection pooling configured
- [ ] Caching strategy implemented
- [ ] Database queries optimized (indexes, query plans)

**Reliability**:
- [ ] Error handling comprehensive
- [ ] Retry logic implemented
- [ ] Circuit breakers for external services
- [ ] Graceful shutdown on SIGTERM
- [ ] Session cleanup on restart

**Monitoring**:
- [ ] Prometheus metrics exported
- [ ] Grafana dashboards created
- [ ] Alert rules configured
- [ ] Log aggregation (ELK/Loki)
- [ ] Distributed tracing (optional: Jaeger)

**Security**:
- [ ] Input validation (Zod schemas)
- [ ] Rate limiting per session
- [ ] CORS configured
- [ ] HTTPS enforced (production)
- [ ] Security headers (helmet.js)

---

## Migration Strategy

### Gradual Rollout Approach

#### Phase 1: Dual Transport Support

```typescript
// Support both SSE and HTTP stream simultaneously
const server = express();

// SSE endpoint (legacy)
server.get('/mcp', handleSSEConnection);

// HTTP streamable endpoints (new)
server.post('/mcp/session', handleCreateSession);
server.post('/mcp/call', handleToolCall);
server.get('/mcp/session/:id', handleSessionStatus);
server.delete('/mcp/session/:id', handleCloseSession);

// Clients specify preferred transport via User-Agent or header
server.use((req, res, next) => {
  const transport = req.headers['x-transport-type'] || 'http-stream';
  req.transport = transport;
  next();
});
```

#### Phase 2: Client Migration

**Week 1**: Deploy dual-transport server to staging
**Week 2**: Update internal E2E tests to HTTP stream
**Week 3**: Deploy to production with both transports
**Week 4**: Monitor usage, migrate external clients
**Week 5**: Deprecate SSE transport (announce sunset)
**Week 6**: Remove SSE code

#### Phase 3: Rollback Procedures

**If HTTP stream fails in production**:

1. **Immediate**: Feature flag to disable HTTP stream
   ```typescript
   const USE_HTTP_STREAM = process.env.ENABLE_HTTP_STREAM === 'true';

   if (!USE_HTTP_STREAM) {
     // Fallback to SSE with size limits
     if (responseSize > 30000) {
       return paginated error message;
     }
   }
   ```

2. **Quick**: Redeploy previous Docker image
   ```bash
   docker tag mcp-server:v1.5.0 mcp-server:latest
   docker compose up -d mcp-server
   ```

3. **Full**: Revert Git commit and redeploy
   ```bash
   git revert <http-stream-commit>
   git push origin master
   # CI/CD redeploys automatically
   ```

### Backward Compatibility

**Semantic Compatibility**: HTTP stream maintains same JSON-RPC semantics
- Same tool names
- Same request/response schemas
- Same error codes

**Client Migration Path**:
```typescript
// V1: SSE client (legacy)
const client = new MCPClient('http://host:3001', { transport: 'sse' });

// V2: HTTP stream client (new, but compatible)
const client = new MCPClient('http://host:3001', { transport: 'http-stream' });

// Same API calls work for both
const result = await client.callTool('projectpulse_health_check', {});
```

---

## Success Criteria

### Technical Metrics

| Metric | Target | Validation |
|--------|--------|------------|
| **Max Response Size** | 10MB+ | Load test with 10MB response |
| **Request Throughput** | 500+ req/s | ab benchmark (small responses) |
| **P95 Latency** | <500ms | k6 load test (medium responses) |
| **Error Rate** | <0.1% | Production monitoring over 7 days |
| **Session Capacity** | 1000+ concurrent | Load test with 1000 active sessions |

### Test Coverage

| Suite | Target | Status |
|-------|--------|--------|
| **Unit Tests** | 80%+ coverage | TBD |
| **Integration Tests** | All API endpoints | TBD |
| **E2E Tests** | 100% (12/12 passing) | Currently 58% (7/12) |
| **Load Tests** | All scenarios pass | TBD |
| **Security Tests** | OWASP top 10 | TBD |

### Production Readiness

- ✅ All E2E tests passing
- ✅ Load tests meet performance targets
- ✅ Monitoring and alerting configured
- ✅ Documentation complete (API docs, runbooks)
- ✅ Rollback procedures tested
- ✅ Security audit passed

---

## Risk Analysis

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **HTTP stream implementation bugs** | Medium | High | Comprehensive testing, staged rollout |
| **Performance regression** | Low | Medium | Load testing, benchmarking vs SSE |
| **Client compatibility issues** | Low | High | Dual transport support during migration |
| **Session management complexity** | Medium | Medium | Use proven libraries (express-session) |
| **Memory leaks in streaming** | Medium | High | Resource limits, monitoring, leak detection |

### Timeline Dependencies

**Critical Path**:
1. HTTP stream server implementation (2-3 weeks)
2. E2E test migration (1 week)
3. Load testing and optimization (1-2 weeks)
4. Production rollout (2 weeks)

**Total Estimated Time**: 6-8 weeks

**Dependencies**:
- No blocking external dependencies
- Requires 1-2 developers full-time
- QA/testing support needed for load testing

### Mitigation Strategies

1. **Technical Risk Mitigation**:
   - Start with simple implementation, iterate
   - Use battle-tested libraries (express, fastify)
   - Comprehensive test coverage from day 1
   - Feature flags for safe rollout

2. **Timeline Risk Mitigation**:
   - Break work into 1-week sprints
   - Daily standups to track progress
   - Early identification of blockers
   - Buffer time for unexpected issues (20% margin)

3. **Quality Risk Mitigation**:
   - Code reviews for all changes
   - Automated testing in CI/CD
   - Staging environment testing before production
   - Canary deployments (5% → 25% → 100%)

---

## References

### Current Documentation

- **[E2E_TEST_RESULTS_SUMMARY.md](./E2E_TEST_RESULTS_SUMMARY.md)** - Complete E2E test results
- **[SESSION1_TEST_RESULTS.md](./SESSION1_TEST_RESULTS.md)** - Session 1 test evidence
- **[MCP_SSE_LARGE_RESPONSE_BUG.md](./MCP_SSE_LARGE_RESPONSE_BUG.md)** - SSE bug analysis

### External Resources

- **MCP Specification**: https://modelcontextprotocol.io/specification
- **HTTP Streaming Best Practices**: https://web.dev/streams/
- **k6 Load Testing Guide**: https://k6.io/docs/
- **Express.js Streaming**: https://expressjs.com/en/advanced/best-practice-performance.html#use-gzip-compression

### Related Work

- **Chunked Transfer Encoding**: RFC 7230 Section 4.1
- **NDJSON Format**: http://ndjson.org/
- **Server-Sent Events**: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

---

## Next Actions

### Immediate (Before Starting Phase 1)

1. **Review & Approve Roadmap**: Get stakeholder sign-off on this plan
2. **Create Project Board**: Set up GitHub project with all tasks
3. **Assign Resources**: Allocate 1-2 developers for 6-8 weeks
4. **Set Up Infrastructure**: Staging environment for HTTP stream testing

### Phase 1 Sprint Planning

**Sprint 1** (Week 1-2): HTTP Stream Server Foundation
- Task 1.1: Session management implementation
- Task 1.2: Basic HTTP endpoints (session create/close)
- Task 1.3: Simple tool call endpoint (no streaming)
- Task 1.4: Unit tests for session management

**Sprint 2** (Week 3-4): Chunked Response Streaming
- Task 2.1: Implement NDJSON streaming
- Task 2.2: Add chunking logic for large responses
- Task 2.3: Backpressure handling
- Task 2.4: Integration tests for streaming

**Sprint 3** (Week 5-6): Production Readiness
- Task 3.1: Error handling and recovery
- Task 3.2: Monitoring and metrics
- Task 3.3: Performance optimization
- Task 3.4: Load testing

### Tracking Progress

**Weekly Check-ins**:
- Monday: Sprint planning, task assignment
- Friday: Demo of completed work, retrospective

**Success Metrics Dashboard**:
- Tests passing: X / 12 (target: 12/12)
- Performance: Current vs target (req/s, latency)
- Coverage: Unit, integration, E2E percentages

**Milestone Markers**:
- ✅ Phase 1 Complete: HTTP stream server working in staging
- ✅ Phase 2 Complete: All E2E tests passing
- ✅ Phase 3 Complete: Production deployed with monitoring

---

**This roadmap provides a clear path from current SSE limitations to production-ready HTTP streamable MCP server with complete E2E test coverage.**
