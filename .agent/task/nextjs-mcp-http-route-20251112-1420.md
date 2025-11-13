# Next.js MCP HTTP Route Architecture - Implementation Plan

**Created**: 2025-11-12 14:20
**Type**: API Route Handler (Next.js 14 App Router)
**Context**: Sprint 5.5 - MCP Server Infrastructure
**MCP Spec**: Streamable HTTP (2025-03-26)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Decision](#architecture-decision)
3. [File Structure](#file-structure)
4. [Route Handler Implementation](#route-handler-implementation)
5. [Session Management](#session-management)
6. [Transport Integration](#transport-integration)
7. [Request/Response Flow](#requestresponse-flow)
8. [Error Handling Strategy](#error-handling-strategy)
9. [Testing Strategy](#testing-strategy)
10. [Performance & Scalability](#performance--scalability)
11. [Implementation Steps](#implementation-steps)

---

## Executive Summary

This plan provides detailed Next.js 14 App Router architecture for building an HTTP-based MCP (Model Context Protocol) server that integrates into the existing ProjectPulse application.

**Key Design Decisions:**

1. **Route Structure**: Single POST handler at `/api/mcp` for all JSON-RPC requests
2. **Session Management**: In-memory Map for MVP (UUID v4 session IDs via `Mcp-Session-Id` header)
3. **Transport Pattern**: Create new `StreamableHTTPServerTransport` per request, connect to singleton MCP server
4. **Integration**: Reuse all existing backend services (no code duplication)
5. **Performance Target**: <200ms per tool call (P95)

**What Makes This Different from Regular API Routes:**

- MCP uses **JSON-RPC 2.0 protocol** (not REST)
- **Session-based** (stateful across multiple requests)
- **Tool registry** (dynamic tool discovery and invocation)
- **Streamable responses** (SSE for notifications - Phase 2)

---

## Architecture Decision

### Rendering Strategy

- [x] **Dynamic (rendered per request)** - SELECTED
- [ ] Static (pre-rendered at build) - Not applicable for MCP
- [ ] ISR (incremental static regeneration) - Not applicable for MCP

**Recommendation**: Dynamic because:
- MCP requests are inherently stateful (session management required)
- JSON-RPC tool calls cannot be pre-rendered
- Need access to request headers (`Mcp-Session-Id`) on every request
- Performance target (<200ms) is achievable with dynamic rendering

### Component Strategy

**Server Components**: All MCP route handlers (no client-side rendering needed)

**Rationale**:
- MCP server is pure backend API (no UI)
- No React components needed - just API route handlers
- All logic executes server-side (database, tool invocation, session management)

### MCP Transport Strategy

**Transport Type**: HTTP (Streamable HTTP 2025-03-26 spec)

**Why Not stdio?**
- stdio transport is for local processes (same machine)
- ProjectPulse is a network service (Mac mini at 192.168.1.15:3000)
- End users' AI agents connect via HTTP from their machines
- HTTP allows multiple concurrent clients (stdio = 1:1 process connection)

**HTTP Transport Features:**
- JSON-RPC requests via POST /api/mcp
- Session management via `Mcp-Session-Id` header
- (Phase 2) SSE streaming via GET /api/mcp for notifications

---

## File Structure

```
apps/web/
├── app/
│   └── api/
│       └── mcp/
│           └── route.ts                    # Main MCP route handler (POST, GET)
├── lib/
│   ├── mcp/
│   │   ├── server.ts                       # Singleton MCP server instance
│   │   ├── transport.ts                    # HTTP transport helper
│   │   ├── session-manager.ts              # Session lifecycle management
│   │   └── types.ts                        # MCP-specific TypeScript types
│   └── mcp-tools/
│       ├── knowledge-tools.ts              # Already exists (Sprint 5)
│       ├── issue-tools.ts                  # Already exists (Sprint 4)
│       ├── workflow-tools.ts               # Already exists (Sprint 3)
│       └── index.ts                        # Tool registry (exports all tools)
```

**Design Principle**:
- Single route handler (`app/api/mcp/route.ts`) for all MCP requests
- Extract complex logic into `lib/mcp/` modules for testability
- Reuse existing tool implementations (no duplication)

---

## Route Handler Implementation

### app/api/mcp/route.ts (Skeleton)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MCPServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/http.js';
import { getMCPServer } from '@/lib/mcp/server';
import { validateSession, generateSessionId } from '@/lib/mcp/session-manager';
import { MCPError, JSONRPC_ERROR_CODES } from '@/lib/mcp/types';

/**
 * POST /api/mcp
 *
 * Handle JSON-RPC 2.0 requests for MCP tools.
 *
 * Headers:
 * - Mcp-Session-Id: UUID v4 session identifier (optional on first request)
 *
 * Request body (JSON-RPC 2.0):
 * {
 *   "jsonrpc": "2.0",
 *   "id": 1,
 *   "method": "tools/call",
 *   "params": {
 *     "name": "knowledge.search",
 *     "arguments": { "query": "PostgreSQL indexing" }
 *   }
 * }
 *
 * Response (JSON-RPC 2.0):
 * {
 *   "jsonrpc": "2.0",
 *   "id": 1,
 *   "result": { "results": [...], "count": 5 }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Extract or generate session ID
    const sessionId = request.headers.get('Mcp-Session-Id') || generateSessionId();

    // 2. Validate session (create if new)
    const session = await validateSession(sessionId);

    // 3. Parse JSON-RPC request
    const body = await request.json();

    if (!body.jsonrpc || body.jsonrpc !== '2.0') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: body.id || null,
          error: {
            code: JSONRPC_ERROR_CODES.INVALID_REQUEST,
            message: 'Invalid JSON-RPC version (must be "2.0")',
          },
        },
        { status: 400 }
      );
    }

    // 4. Get singleton MCP server
    const mcpServer = getMCPServer();

    // 5. Create HTTP transport for this request
    const transport = new StreamableHTTPServerTransport({
      sessionId,
      request: body,
    });

    // 6. Connect transport to server
    await mcpServer.connect(transport);

    // 7. Handle request via transport (server processes the JSON-RPC request)
    const response = await transport.handleRequest(body);

    // 8. Return JSON-RPC response
    const duration = Date.now() - startTime;

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Mcp-Session-Id': sessionId,
        'X-Response-Time': `${duration}ms`,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('[POST /api/mcp] Error:', error);

    // Handle MCP-specific errors
    if (error instanceof MCPError) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: error.code,
            message: error.message,
            data: error.data,
          },
        },
        { status: error.statusCode }
      );
    }

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: JSONRPC_ERROR_CODES.PARSE_ERROR,
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: JSONRPC_ERROR_CODES.INTERNAL_ERROR,
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mcp (Phase 2 - SSE streaming)
 *
 * Server-Sent Events endpoint for MCP notifications and progress updates.
 * Used for long-running operations (embeddings, bulk operations).
 *
 * Headers:
 * - Mcp-Session-Id: Required - session identifier
 *
 * Response: text/event-stream
 *
 * Note: Defer to Phase 2 (not needed for MVP)
 */
export async function GET(request: NextRequest) {
  // Phase 2: SSE streaming implementation
  return NextResponse.json(
    {
      error: 'SSE streaming not yet implemented',
      message: 'Use POST /api/mcp for JSON-RPC requests',
    },
    { status: 501 } // Not Implemented
  );
}
```

**Key Patterns from Existing Code:**

1. **Error Handling**: Custom error classes with status codes (see `KnowledgeCreationError`)
2. **Validation**: Zod schemas for request validation (see `createKnowledgeItemSchema`)
3. **Response Format**: Consistent `{ data, meta }` or `{ error, code }` structure
4. **Performance Logging**: `X-Response-Time` header for monitoring

---

## Session Management

### lib/mcp/session-manager.ts

```typescript
import { randomUUID } from 'crypto';

/**
 * In-memory session storage for MVP.
 *
 * Production: Replace with Redis or database-backed storage.
 *
 * Session lifecycle:
 * - Created on first request (no Mcp-Session-Id header)
 * - Reused for subsequent requests (Mcp-Session-Id header present)
 * - Expires after 1 hour of inactivity
 */

interface MCPSession {
  id: string;
  createdAt: Date;
  lastAccessedAt: Date;
  metadata: Record<string, unknown>; // Tool-specific state
}

// In-memory session store (MVP only)
const sessions = new Map<string, MCPSession>();

// Session expiration: 1 hour (3600000ms)
const SESSION_TTL = 3600000;

/**
 * Generate a new session ID (UUID v4).
 */
export function generateSessionId(): string {
  return randomUUID();
}

/**
 * Validate session ID and return session object.
 * Creates new session if ID not found.
 *
 * @param sessionId - UUID v4 session identifier
 * @returns Session object
 */
export async function validateSession(sessionId: string): Promise<MCPSession> {
  // Check if session exists
  const existingSession = sessions.get(sessionId);

  if (existingSession) {
    // Check expiration
    const now = Date.now();
    const sessionAge = now - existingSession.lastAccessedAt.getTime();

    if (sessionAge > SESSION_TTL) {
      // Session expired - delete and create new
      sessions.delete(sessionId);
      console.warn(`[Session] Expired session ${sessionId} (age: ${sessionAge}ms)`);
    } else {
      // Update last accessed time
      existingSession.lastAccessedAt = new Date();
      return existingSession;
    }
  }

  // Create new session
  const newSession: MCPSession = {
    id: sessionId,
    createdAt: new Date(),
    lastAccessedAt: new Date(),
    metadata: {},
  };

  sessions.set(sessionId, newSession);
  console.info(`[Session] Created new session ${sessionId}`);

  return newSession;
}

/**
 * Delete session (manual cleanup).
 */
export function deleteSession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}

/**
 * Clean up expired sessions (run periodically).
 * Call this from a cron job or scheduled task.
 */
export function cleanupExpiredSessions(): number {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [sessionId, session] of sessions.entries()) {
    const sessionAge = now - session.lastAccessedAt.getTime();
    if (sessionAge > SESSION_TTL) {
      sessions.delete(sessionId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.info(`[Session] Cleaned up ${cleanedCount} expired sessions`);
  }

  return cleanedCount;
}

/**
 * Get session count (for monitoring).
 */
export function getSessionCount(): number {
  return sessions.size;
}
```

**Session Management Strategy:**

1. **Storage**: In-memory Map (MVP)
   - Fast (<1ms lookup)
   - No external dependencies
   - Suitable for single-server deployment (Mac mini)
   - **Limitation**: Sessions lost on server restart (acceptable for MVP)

2. **Session ID Format**: UUID v4
   - Cryptographically secure
   - Low collision probability (~1 in 5.3 × 10^36)
   - Standard format (36 chars with hyphens)

3. **Expiration Strategy**: 1 hour TTL
   - Passive expiration (checked on access)
   - Active cleanup via periodic task (every 15 minutes)
   - Prevents memory leaks from abandoned sessions

4. **Thread Safety**: Not required (Node.js single-threaded event loop)
   - Map operations are atomic
   - No race conditions in single-process deployment

**Production Migration Path:**

Replace in-memory Map with:
- **Redis** (recommended): Fast, supports TTL, cluster-ready
- **Database** (PostgreSQL): Persistent, supports complex queries
- **JWT** (stateless): No server-side storage, but less secure for long sessions

---

## Transport Integration

### lib/mcp/transport.ts

```typescript
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/http.js';
import type { JSONRPCRequest, JSONRPCResponse } from '@modelcontextprotocol/sdk/types.js';

/**
 * Create a new HTTP transport for a single request.
 *
 * Each request gets its own transport instance that:
 * 1. Parses the incoming JSON-RPC request
 * 2. Connects to the singleton MCP server
 * 3. Handles the request via the server's tool registry
 * 4. Returns the JSON-RPC response
 *
 * @param sessionId - Session identifier (UUID v4)
 * @param request - JSON-RPC request object
 * @returns StreamableHTTPServerTransport instance
 */
export function createTransport(
  sessionId: string,
  request: JSONRPCRequest
): StreamableHTTPServerTransport {
  return new StreamableHTTPServerTransport({
    sessionId,
    request,
  });
}

/**
 * Handle a single JSON-RPC request through the transport.
 *
 * This function:
 * 1. Validates the JSON-RPC request format
 * 2. Routes to the appropriate MCP server method
 * 3. Executes the tool or method
 * 4. Returns the JSON-RPC response
 *
 * @param transport - HTTP transport instance
 * @param request - JSON-RPC request object
 * @returns JSON-RPC response object
 */
export async function handleTransportRequest(
  transport: StreamableHTTPServerTransport,
  request: JSONRPCRequest
): Promise<JSONRPCResponse> {
  // The transport internally handles:
  // - Method routing (tools/call, tools/list, resources/read, etc.)
  // - Error handling (invalid method, tool not found, etc.)
  // - Response formatting (JSON-RPC 2.0 format)

  return transport.handleRequest(request);
}
```

**Transport Pattern Explained:**

**Why Create Transport Per Request?**

The MCP SDK's `StreamableHTTPServerTransport` is designed for **single-use per request**:

1. **Request Scoping**: Each transport is tied to one JSON-RPC request
2. **Session Context**: Transport carries session ID for that specific request
3. **No State Leakage**: Fresh transport prevents state bleeding between requests
4. **Memory Efficiency**: Transport is garbage-collected after response sent

**Connection Model:**

```
Request 1 → Transport 1 → MCP Server (singleton)
Request 2 → Transport 2 → MCP Server (singleton)
Request 3 → Transport 3 → MCP Server (singleton)
```

- **Transport**: Request-scoped (new per request)
- **MCP Server**: Application-scoped (singleton, shared across all requests)

**Why Not Reuse Transport?**

- StreamableHTTPServerTransport maintains internal state (request ID, response buffer)
- Reusing would require complex reset logic
- SDK design assumes single-use pattern (create → connect → handle → dispose)

---

## Request/Response Flow

### Complete Request Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Client Request (Claude Desktop, Cursor AI, etc.)                │
│    POST /api/mcp                                                    │
│    Headers: Mcp-Session-Id: abc-123 (optional on first request)    │
│    Body: { jsonrpc: "2.0", method: "tools/call", ... }             │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. Next.js Route Handler (app/api/mcp/route.ts)                    │
│    - Extract/generate session ID                                   │
│    - Validate session (create if new)                              │
│    - Parse JSON-RPC request                                        │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. Session Manager (lib/mcp/session-manager.ts)                    │
│    - Check if session exists                                       │
│    - Validate TTL (expire if > 1 hour)                             │
│    - Update lastAccessedAt                                         │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. Create HTTP Transport (lib/mcp/transport.ts)                    │
│    - new StreamableHTTPServerTransport({ sessionId, request })     │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. Get MCP Server Singleton (lib/mcp/server.ts)                    │
│    - Returns shared MCPServer instance                             │
│    - Tool registry already loaded                                  │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. Connect Transport to Server                                     │
│    - await mcpServer.connect(transport)                            │
│    - Server can now route requests via transport                   │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. Handle Request (transport.handleRequest)                        │
│    - Route by method (tools/call, tools/list, resources/read)     │
│    - For tools/call:                                               │
│      → Lookup tool in registry                                     │
│      → Execute tool handler                                        │
│      → Tool handler calls backend service                          │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 8. Tool Execution (lib/mcp-tools/knowledge-tools.ts)               │
│    - knowledge.search({ query: "PostgreSQL indexing" })            │
│    - Calls lib/knowledge/search.ts (existing service)              │
│    - Returns formatted results                                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 9. Backend Service (lib/knowledge/search.ts)                       │
│    - Execute hybrid search (pgvector + tsvector)                   │
│    - Query database (Prisma)                                       │
│    - Return results                                                │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 10. Format Response (transport.handleRequest)                      │
│     - Wrap result in JSON-RPC 2.0 format                           │
│     - { jsonrpc: "2.0", id: 1, result: {...} }                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 11. Return Response (route.ts)                                     │
│     - NextResponse.json(response)                                  │
│     - Headers: Mcp-Session-Id, X-Response-Time                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 12. Client Receives Response                                       │
│     - Parse JSON-RPC response                                      │
│     - Use result.results in agent's context                        │
└─────────────────────────────────────────────────────────────────────┘
```

**Timing Breakdown (Target <200ms):**

- Session validation: 1-5ms (in-memory Map lookup)
- JSON parsing: 1-10ms (depends on payload size)
- Transport creation: 1-3ms (object instantiation)
- Tool routing: 1-5ms (registry lookup)
- Tool execution: 50-150ms (database query + processing)
- Response formatting: 1-5ms (JSON.stringify)
- Network latency: 10-30ms (local network 192.168.1.15)

**Total: 65-208ms** (within target for most cases)

---

## Error Handling Strategy

### lib/mcp/types.ts

```typescript
/**
 * JSON-RPC 2.0 error codes.
 *
 * @see https://www.jsonrpc.org/specification#error_object
 */
export const JSONRPC_ERROR_CODES = {
  PARSE_ERROR: -32700,      // Invalid JSON
  INVALID_REQUEST: -32600,  // Invalid JSON-RPC request
  METHOD_NOT_FOUND: -32601, // Method does not exist
  INVALID_PARAMS: -32602,   // Invalid method parameters
  INTERNAL_ERROR: -32603,   // Internal JSON-RPC error
  SERVER_ERROR: -32000,     // Generic server error (start of range)
} as const;

/**
 * Custom MCP error class.
 *
 * Extends Error with JSON-RPC error code and HTTP status code.
 */
export class MCPError extends Error {
  constructor(
    public readonly code: number,
    message: string,
    public readonly statusCode: number = 500,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

/**
 * Common MCP error creators.
 */
export const MCPErrors = {
  parseError: (message = 'Parse error') =>
    new MCPError(JSONRPC_ERROR_CODES.PARSE_ERROR, message, 400),

  invalidRequest: (message = 'Invalid request') =>
    new MCPError(JSONRPC_ERROR_CODES.INVALID_REQUEST, message, 400),

  methodNotFound: (method: string) =>
    new MCPError(
      JSONRPC_ERROR_CODES.METHOD_NOT_FOUND,
      `Method not found: ${method}`,
      404
    ),

  invalidParams: (message: string, data?: unknown) =>
    new MCPError(JSONRPC_ERROR_CODES.INVALID_PARAMS, message, 400, data),

  internalError: (message = 'Internal error', data?: unknown) =>
    new MCPError(JSONRPC_ERROR_CODES.INTERNAL_ERROR, message, 500, data),

  toolNotFound: (toolName: string) =>
    new MCPError(
      JSONRPC_ERROR_CODES.SERVER_ERROR - 1,
      `Tool not found: ${toolName}`,
      404
    ),

  sessionExpired: (sessionId: string) =>
    new MCPError(
      JSONRPC_ERROR_CODES.SERVER_ERROR - 2,
      `Session expired: ${sessionId}`,
      401
    ),
};
```

**Error Response Format (JSON-RPC 2.0):**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found: invalid.method",
    "data": {
      "availableMethods": ["tools/call", "tools/list", "resources/read"]
    }
  }
}
```

**Error Handling Layers:**

1. **Route Handler** (`route.ts`): Catches all errors, formats as JSON-RPC
2. **Transport** (`transport.ts`): Validates JSON-RPC format, routing
3. **Tool Handlers** (`knowledge-tools.ts`): Business logic errors (Zod validation, etc.)
4. **Backend Services** (`search.ts`, `create.ts`): Database errors, embedding failures

**Error Propagation:**

```
Backend Error (Prisma)
  → Tool Handler (throw MCPError)
  → Transport (catch, format as JSON-RPC error)
  → Route Handler (return NextResponse with status code)
```

---

## Testing Strategy

### Unit Tests (Jest)

**lib/mcp/session-manager.test.ts:**
```typescript
describe('Session Manager', () => {
  it('generates valid UUID v4 session IDs', () => {
    const sessionId = generateSessionId();
    expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('creates new session on first access', async () => {
    const sessionId = generateSessionId();
    const session = await validateSession(sessionId);
    expect(session.id).toBe(sessionId);
    expect(session.createdAt).toBeInstanceOf(Date);
  });

  it('reuses existing session', async () => {
    const sessionId = generateSessionId();
    const session1 = await validateSession(sessionId);
    const session2 = await validateSession(sessionId);
    expect(session1.createdAt).toEqual(session2.createdAt);
  });

  it('expires sessions after TTL', async () => {
    // Mock Date.now() to simulate time passing
    jest.useFakeTimers();
    const sessionId = generateSessionId();
    await validateSession(sessionId);

    // Advance time by 2 hours
    jest.advanceTimersByTime(7200000);

    const newSession = await validateSession(sessionId);
    expect(newSession.createdAt.getTime()).toBeGreaterThan(Date.now() - 1000);
    jest.useRealTimers();
  });
});
```

**lib/mcp/transport.test.ts:**
```typescript
describe('HTTP Transport', () => {
  it('creates transport with session ID', () => {
    const sessionId = 'test-session-123';
    const request = {
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'tools/list',
      params: {},
    };
    const transport = createTransport(sessionId, request);
    expect(transport).toBeDefined();
  });
});
```

### Integration Tests (API Routes)

**app/api/mcp/route.test.ts:**
```typescript
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('POST /api/mcp', () => {
  it('returns 400 for invalid JSON-RPC version', async () => {
    const request = new NextRequest('http://localhost:3000/api/mcp', {
      method: 'POST',
      body: JSON.stringify({ jsonrpc: '1.0', method: 'tools/list' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe(-32600); // INVALID_REQUEST
  });

  it('creates session ID if not provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/mcp', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('Mcp-Session-Id')).toBeTruthy();
  });

  it('reuses existing session ID', async () => {
    const sessionId = 'existing-session-456';
    const request = new NextRequest('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: { 'Mcp-Session-Id': sessionId },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('Mcp-Session-Id')).toBe(sessionId);
  });
});
```

### E2E Tests (with Claude Desktop)

**Manual Testing Checklist:**

1. **Tool Discovery** (tools/list):
   ```bash
   curl -X POST http://192.168.1.15:3000/api/mcp \
     -H "Content-Type: application/json" \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "tools/list",
       "params": {}
     }'
   ```
   Expected: Returns list of available tools (knowledge.search, knowledge.create, etc.)

2. **Tool Invocation** (tools/call):
   ```bash
   curl -X POST http://192.168.1.15:3000/api/mcp \
     -H "Content-Type: application/json" \
     -H "Mcp-Session-Id: test-session-789" \
     -d '{
       "jsonrpc": "2.0",
       "id": 2,
       "method": "tools/call",
       "params": {
         "name": "knowledge.search",
         "arguments": {
           "query": "PostgreSQL indexing",
           "mode": "hybrid",
           "limit": 5
         }
       }
     }'
   ```
   Expected: Returns search results with scores

3. **Session Persistence**:
   - Send multiple requests with same `Mcp-Session-Id`
   - Verify session is reused (check logs)
   - Verify last accessed time updates

4. **Claude Desktop Integration**:
   - Add to `claude_desktop_config.json`:
     ```json
     {
       "mcpServers": {
         "projectpulse": {
           "url": "http://192.168.1.15:3000/api/mcp",
           "transport": "http"
         }
       }
     }
     ```
   - Restart Claude Desktop
   - Test tool invocation: "Search for PostgreSQL indexing in knowledge base"

---

## Performance & Scalability

### Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Tool call latency (P95) | <200ms | Maintain agent responsiveness |
| Session lookup | <5ms | In-memory Map is fast |
| JSON parsing | <10ms | Standard Node.js performance |
| Memory per session | <1KB | Minimal overhead |
| Max concurrent sessions | 100+ | Mac mini can handle local network load |

### Scalability Considerations

**Current Scope (MVP - Local Network):**

- **Deployment**: Single Mac mini (192.168.1.15)
- **Load**: 1-5 concurrent AI agents (solo/small team)
- **Session Storage**: In-memory Map (sufficient)
- **Database**: PostgreSQL on same machine (low latency)

**Scalability Bottlenecks:**

1. **In-memory sessions**: Lost on restart (acceptable for MVP)
2. **Single server**: No horizontal scaling (not needed for local deployment)
3. **No authentication**: Anyone on local network can connect (acceptable for trusted network)

**Future Scalability Path (Cloud Deployment):**

1. **Redis for sessions**:
   - Persistent across server restarts
   - Shared across multiple server instances
   - TTL support built-in

2. **Load balancer**:
   - Distribute traffic across multiple Next.js instances
   - Sticky sessions via `Mcp-Session-Id` header

3. **Rate limiting**:
   - Per-session rate limits (prevent abuse)
   - Per-IP rate limits (DDoS protection)

4. **OAuth 2.1 authentication**:
   - Secure cloud deployment
   - User-scoped tool access

### Memory Management

**Session Cleanup Strategy:**

```typescript
// Run every 15 minutes (cron job or Next.js background task)
setInterval(() => {
  const cleaned = cleanupExpiredSessions();
  console.info(`[Cleanup] Removed ${cleaned} expired sessions`);
}, 15 * 60 * 1000);
```

**Monitoring Metrics:**

- Active session count: `getSessionCount()`
- Session creation rate: Track `validateSession()` calls
- Session expiration rate: Track cleanup results
- Average session lifetime: `lastAccessedAt - createdAt`

**Memory Limits:**

- 100 sessions × 1KB/session = 100KB (negligible)
- 1000 sessions × 1KB/session = 1MB (still acceptable)
- Alert if session count > 1000 (potential memory leak or attack)

---

## Implementation Steps

### Day 1: Foundation + HTTP Transport Basics (6 hours)

**Morning (3 hours):**

1. **Create file structure** (30 min):
   ```bash
   mkdir -p apps/web/app/api/mcp
   mkdir -p apps/web/lib/mcp
   touch apps/web/app/api/mcp/route.ts
   touch apps/web/lib/mcp/server.ts
   touch apps/web/lib/mcp/transport.ts
   touch apps/web/lib/mcp/session-manager.ts
   touch apps/web/lib/mcp/types.ts
   ```

2. **Implement types** (`lib/mcp/types.ts`) (30 min):
   - `JSONRPC_ERROR_CODES` constant
   - `MCPError` class
   - `MCPErrors` helper functions
   - TypeScript interfaces for JSON-RPC requests/responses

3. **Implement session manager** (`lib/mcp/session-manager.ts`) (1 hour):
   - `generateSessionId()` function
   - `validateSession()` function
   - `deleteSession()` function
   - `cleanupExpiredSessions()` function
   - In-memory Map storage
   - Unit tests

4. **Write session tests** (1 hour):
   - Test session creation
   - Test session reuse
   - Test expiration logic
   - Test cleanup function

**Afternoon (3 hours):**

5. **Implement MCP server singleton** (`lib/mcp/server.ts`) (1.5 hours):
   - Create singleton MCPServer instance
   - Register tool handlers (knowledge, issues, workflows)
   - Export `getMCPServer()` function

6. **Implement transport helper** (`lib/mcp/transport.ts`) (1 hour):
   - `createTransport()` function
   - `handleTransportRequest()` function
   - Transport lifecycle management

7. **Basic route handler** (`app/api/mcp/route.ts`) (30 min):
   - POST handler scaffold
   - Session ID extraction/generation
   - JSON-RPC request parsing
   - Error handling structure

**Day 1 Exit Criteria:**
- ✅ All files created
- ✅ Session management working (unit tests pass)
- ✅ MCP server singleton created
- ✅ Basic POST handler responds (even if tools don't work yet)

---

### Day 2: Complete HTTP Transport + Knowledge Tools (6 hours)

**Morning (3 hours):**

1. **Complete route handler** (`app/api/mcp/route.ts`) (1.5 hours):
   - Full POST implementation
   - Session validation integration
   - Transport creation + connection
   - JSON-RPC response formatting
   - Performance logging (X-Response-Time header)

2. **Integrate knowledge tools** (`lib/mcp/server.ts`) (1 hour):
   - Register `knowledge.search` tool
   - Register `knowledge.create` tool
   - Register `knowledge.related` tool
   - Tool handler implementation (already exists in `lib/mcp-tools/knowledge-tools.ts`)

3. **Write route tests** (30 min):
   - Test invalid JSON-RPC version
   - Test session ID creation
   - Test session ID reuse

**Afternoon (3 hours):**

4. **Manual testing with curl** (1 hour):
   - Test `tools/list` method
   - Test `tools/call` with `knowledge.search`
   - Test session persistence across requests
   - Verify X-Response-Time header

5. **Claude Desktop integration** (1.5 hours):
   - Update `claude_desktop_config.json` on Mac mini
   - Restart Claude Desktop
   - Test tool discovery
   - Test tool invocation from Claude Desktop
   - Debug any connection issues

6. **Performance validation** (30 min):
   - Measure tool call latency (target <200ms)
   - Verify session lookup performance (<5ms)
   - Check memory usage with multiple sessions

**Day 2 Exit Criteria:**
- ✅ Knowledge tools work via MCP (curl tests pass)
- ✅ Claude Desktop can connect and invoke tools
- ✅ Performance target met (<200ms P95)
- ✅ Session management working end-to-end

---

### Day 3: Resource System + Documentation (4 hours)

**Morning (2 hours):**

1. **Implement resource system** (`lib/mcp/resources.ts`) (1 hour):
   - Resource registration (project state, active issues, etc.)
   - Resource handler implementation
   - URI template support

2. **Register resources** (`lib/mcp/server.ts`) (30 min):
   - `project://state` - Current project state
   - `project://issues/active` - Active issues list
   - `project://knowledge/recent` - Recently updated knowledge

3. **Test resources** (30 min):
   - curl test: `resources/list` method
   - curl test: `resources/read` method
   - Verify resource content accuracy

**Afternoon (2 hours):**

4. **Write end user documentation** (1 hour):
   - Setup guide for Claude Desktop (`docs/MCP_SETUP.md`)
   - Example `claude_desktop_config.json`
   - Troubleshooting section
   - Tool usage examples

5. **Update API documentation** (30 min):
   - Add `/api/mcp` endpoint to `.agent/system/api-catalog.md`
   - Document JSON-RPC protocol
   - Document session management

6. **Update MCP tools guide** (30 min):
   - Update `.agent/system/mcp-tools-guide.md`
   - Add HTTP transport examples
   - Add resource usage examples

**Day 3 Exit Criteria:**
- ✅ Resources working (tools can access context)
- ✅ End user setup guide complete
- ✅ API documentation updated
- ✅ All documentation accurate and tested

---

## Next Steps for Parent Agent

**After Next.js Expert Completes This Plan:**

1. **Read this implementation plan** (`.agent/task/nextjs-mcp-http-route-20251112-1420.md`)

2. **Begin Day 1 implementation**:
   - Create file structure
   - Implement session manager first (foundation)
   - Write tests as you go (TDD approach)

3. **Key Integration Points**:
   - Reuse existing tool handlers (`lib/mcp-tools/knowledge-tools.ts` already exists)
   - Reuse existing backend services (`lib/knowledge/search.ts`, etc.)
   - No code duplication needed

4. **Testing Strategy**:
   - Unit tests first (session manager, transport)
   - Integration tests second (route handler)
   - Manual tests third (curl, Claude Desktop)

5. **Success Criteria**:
   - End users' Claude Desktop can connect via MCP config
   - Knowledge tools work (search, create, related)
   - Performance target met (<200ms P95)
   - Session management stable (no memory leaks)

---

## Summary

This implementation plan provides:

✅ **Complete Architecture**: File structure, component breakdown, integration strategy
✅ **Detailed Implementation**: Code skeletons with comments explaining each step
✅ **Session Management**: In-memory storage with expiration, cleanup, monitoring
✅ **Transport Pattern**: StreamableHTTPServerTransport per request, singleton MCP server
✅ **Error Handling**: JSON-RPC 2.0 error format, custom MCPError class, error propagation
✅ **Testing Strategy**: Unit tests, integration tests, E2E tests with Claude Desktop
✅ **Performance**: <200ms target with breakdown, scalability considerations
✅ **3-Day Phased Plan**: Day 1 (foundation), Day 2 (integration), Day 3 (docs)

**Key Design Principles:**

1. **Simplicity**: In-memory sessions for MVP (no Redis complexity)
2. **Performance**: Single route handler, minimal overhead (<200ms)
3. **Reusability**: Zero code duplication (reuse all existing services)
4. **Type Safety**: TypeScript strict mode, Zod validation at boundaries
5. **Next.js Patterns**: Follow existing conventions (error handling, response format)

**Ready for Implementation!** 🚀

Parent agent should read this document and begin Day 1 tasks immediately. All architectural decisions are documented with rationale. Code examples follow Next.js 14 App Router best practices and integrate seamlessly with existing ProjectPulse codebase.

---

**Document End**

**Token Count**: ~10K tokens (comprehensive implementation guide)
**Time to Implement**: 3 days (16 hours total)
**Complexity**: Medium (HTTP transport simpler than stdio, session management straightforward)
