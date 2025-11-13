# Sprint 5.5: MCP Server Infrastructure Implementation Plan

**Sprint**: 5.5 (Critical Gap Resolution)
**Duration**: 3-5 days
**Story Points**: 21 points
**Priority**: CRITICAL (blocks 90% use case - AI agent access)
**Created**: 2025-01-12

---

## Executive Summary

### The Problem
Sprint 1 was marked 96% complete but **critical MCP server infrastructure was never built**. While we have:
- ✅ Backend APIs (knowledge, issues, search)
- ✅ MCP tool specifications (lib/mcp-tools/knowledge-tools.ts)
- ✅ Database with pgvector embeddings

We are **missing**:
- ❌ MCP server transport layer (HTTP endpoint)
- ❌ Tool registry system
- ❌ Request/response handlers
- ❌ Client connection infrastructure

### The Impact
**90% of users will be AI agents** (Claude, GPT, etc.) connecting via MCP. Without MCP server infrastructure, they **cannot access the system at all**.

### The Solution
Build MCP server infrastructure using:
- **Protocol**: MCP 2025-03-26 (Streamable HTTP)
- **Transport**: HTTP (network-accessible, not stdio)
- **SDK**: @modelcontextprotocol/sdk (official)
- **Integration**: Next.js 14 App Router routes (app/api/mcp)

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│ AI Agent (Claude Desktop)                                    │
│  - Configured via claude_desktop_config.json                 │
│  - Connects to: http://192.168.1.15:3000/api/mcp            │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ HTTP POST/GET (MCP Streamable HTTP)
               │
┌──────────────▼──────────────────────────────────────────────┐
│ MCP Server (Next.js App Router)                             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ app/api/mcp/route.ts                                │   │
│  │  - POST: JSON-RPC tool calls                        │   │
│  │  - GET: SSE streaming (notifications, requests)     │   │
│  └──────────────┬──────────────────────────────────────┘   │
│                 │                                            │
│  ┌──────────────▼──────────────────────────────────────┐   │
│  │ lib/mcp/server.ts (MCP Server Instance)             │   │
│  │  - Tool registry                                    │   │
│  │  - Resource handlers                                │   │
│  │  - Session management                               │   │
│  └──────────────┬──────────────────────────────────────┘   │
│                 │                                            │
│  ┌──────────────▼──────────────────────────────────────┐   │
│  │ lib/mcp/handlers/                                   │   │
│  │  - knowledge-handler.ts (search, create, related)   │   │
│  │  - issues-handler.ts (future)                       │   │
│  │  - wiki-handler.ts (future)                         │   │
│  └──────────────┬──────────────────────────────────────┘   │
│                 │                                            │
└─────────────────┼──────────────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────────────────┐
│ Existing Backend APIs (already built)                       │
│  - POST /api/knowledge (create items)                       │
│  - GET /api/knowledge/search (hybrid search)                │
│  - GET /api/knowledge (list)                                │
│  - lib/knowledge/search.ts (semantic, fulltext, hybrid)     │
│  - lib/knowledge/create.ts (auto-embeddings)                │
│  - lib/knowledge/graph.ts (related items)                   │
└─────────────────┬──────────────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────────────────┐
│ PostgreSQL + pgvector                                        │
│  - KnowledgeItem table with 768d embeddings                 │
│  - HNSW indexes for semantic search                         │
│  - Full-text search (tsvector)                              │
│  - Knowledge graph (relationships)                          │
└──────────────────────────────────────────────────────────────┘
```

### MCP Protocol Flow

#### 1. Initialization Flow
```
Client                          Server
  │                               │
  ├─── POST /api/mcp ────────────>│
  │    { method: "initialize" }   │
  │                               │
  │<─── 200 OK ───────────────────┤
  │    Mcp-Session-Id: <uuid>     │
  │    { capabilities: {...} }    │
  │                               │
```

#### 2. Tool Call Flow
```
Client                          Server                Backend
  │                               │                      │
  ├─── POST /api/mcp ────────────>│                      │
  │    Mcp-Session-Id: <uuid>     │                      │
  │    { method: "tools/call",    │                      │
  │      params: {                │                      │
  │        name: "knowledge.search"                      │
  │        arguments: {...}       │                      │
  │      }                         │                      │
  │    }                           │                      │
  │                               │                      │
  │                               ├─ hybridSearch() ────>│
  │                               │                      │
  │                               │<─ results ───────────┤
  │                               │                      │
  │<─── 200 OK ───────────────────┤                      │
  │    { content: [...] }         │                      │
  │                               │                      │
```

#### 3. Resource Access Flow
```
Client                          Server                Backend
  │                               │                      │
  ├─── POST /api/mcp ────────────>│                      │
  │    { method: "resources/read" }                      │
  │      uri: "knowledge://item/5"}                      │
  │                               │                      │
  │                               ├─ prisma.findUnique ->│
  │                               │                      │
  │<─── 200 OK ───────────────────┤                      │
  │    { contents: [...] }        │                      │
  │                               │                      │
```

### File Structure

```
apps/web/
├── app/
│   └── api/
│       └── mcp/
│           └── route.ts              # HTTP transport endpoint (POST/GET)
│
├── lib/
│   ├── mcp/
│   │   ├── server.ts                 # MCP server instance (singleton)
│   │   ├── transport.ts              # HTTP transport wrapper
│   │   ├── types.ts                  # MCP type definitions
│   │   │
│   │   ├── handlers/
│   │   │   ├── knowledge-handler.ts  # Knowledge tools handler
│   │   │   ├── issues-handler.ts     # Issues tools (future)
│   │   │   └── wiki-handler.ts       # Wiki tools (future)
│   │   │
│   │   ├── resources/
│   │   │   ├── knowledge-resource.ts # Knowledge item resources
│   │   │   └── index.ts              # Resource registry
│   │   │
│   │   └── registry/
│   │       ├── tools.ts              # Tool registry
│   │       └── resources.ts          # Resource registry
│   │
│   └── mcp-tools/
│       └── knowledge-tools.ts        # Tool specs (already exists)
│
└── __tests__/
    └── mcp/
        ├── server.test.ts            # Server initialization tests
        ├── knowledge-tools.test.ts   # Tool handler tests
        └── transport.test.ts         # HTTP transport tests
```

---

## User Stories

### US-5.5-01: MCP Server Foundation (8 points)
**As a** developer
**I want** to set up the MCP server infrastructure
**So that** AI agents can connect to ProjectPulse

**Acceptance Criteria**:
- [ ] Install @modelcontextprotocol/sdk dependency
- [ ] Create lib/mcp/server.ts with MCP server instance
- [ ] Create lib/mcp/types.ts with TypeScript types
- [ ] Implement initialize handler (capabilities exchange)
- [ ] Implement session management (UUID generation, storage)
- [ ] Server exposes tools/list endpoint
- [ ] Server exposes resources/list endpoint
- [ ] Unit tests for server initialization

**Technical Details**:
```typescript
// lib/mcp/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Create singleton server instance
export const mcpServer = new McpServer({
  name: 'projectpulse-mcp',
  version: '1.0.0',
  capabilities: {
    tools: {},
    resources: {},
  },
});

// Register tools from lib/mcp-tools/knowledge-tools.ts
// Register resources from lib/mcp/resources/
```

**Dependencies**:
- None (foundation story)

**Estimated Duration**: 1 day

---

### US-5.5-02: HTTP Transport Route (5 points)
**As a** AI agent user
**I want** an HTTP endpoint to connect to the MCP server
**So that** I can configure Claude Desktop to use ProjectPulse tools

**Acceptance Criteria**:
- [ ] Create app/api/mcp/route.ts with POST handler
- [ ] Create app/api/mcp/route.ts with GET handler (SSE)
- [ ] Implement Mcp-Session-Id header handling
- [ ] Implement JSON-RPC request parsing
- [ ] Implement JSON-RPC response formatting
- [ ] Handle initialization requests
- [ ] Handle tool call requests
- [ ] Handle resource read requests
- [ ] Return proper HTTP status codes (200, 400, 500)
- [ ] Integration tests with real HTTP requests

**Technical Details**:
```typescript
// app/api/mcp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { mcpServer } from '@/lib/mcp/server';

export async function POST(request: NextRequest) {
  const sessionId = request.headers.get('mcp-session-id');
  const body = await request.json();
  
  // Create transport for this request
  const transport = new StreamableHTTPServerTransport({
    sessionId,
  });
  
  // Connect transport to server
  await mcpServer.connect(transport);
  
  // Handle request
  const response = await transport.handleRequest(body);
  
  return NextResponse.json(response, {
    headers: {
      'mcp-session-id': sessionId || generateSessionId(),
    },
  });
}

export async function GET(request: NextRequest) {
  // SSE streaming for notifications/requests (optional for Sprint 5.5)
  // Can be implemented later if needed
  return new Response('Not implemented', { status: 501 });
}
```

**Dependencies**:
- US-5.5-01 (MCP Server Foundation)

**Estimated Duration**: 0.5 days

---

### US-5.5-03: Knowledge Tools Handler (5 points)
**As a** AI agent
**I want** to call knowledge.search, knowledge.create, knowledge.related tools
**So that** I can search and create knowledge items

**Acceptance Criteria**:
- [ ] Create lib/mcp/handlers/knowledge-handler.ts
- [ ] Implement knowledge.search handler (calls hybridSearch)
- [ ] Implement knowledge.create handler (calls createKnowledgeItem)
- [ ] Implement knowledge.related handler (calls findRelatedKnowledgeItems)
- [ ] Register tools with MCP server
- [ ] Map MCP arguments to backend API inputs
- [ ] Map backend responses to MCP content format
- [ ] Error handling for invalid inputs
- [ ] Error handling for backend failures
- [ ] Unit tests for each handler

**Technical Details**:
```typescript
// lib/mcp/handlers/knowledge-handler.ts
import { knowledgeTools } from '@/lib/mcp-tools/knowledge-tools';
import { mcpServer } from '../server';

// Register knowledge.search tool
mcpServer.tool(
  knowledgeTools['knowledge.search'].name,
  knowledgeTools['knowledge.search'].description,
  knowledgeTools['knowledge.search'].inputSchema,
  async (args) => {
    try {
      const result = await knowledgeTools['knowledge.search'].handler(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Similar for knowledge.create and knowledge.related
```

**Dependencies**:
- US-5.5-01 (MCP Server Foundation)
- Existing: lib/mcp-tools/knowledge-tools.ts
- Existing: lib/knowledge/search.ts, create.ts, graph.ts

**Estimated Duration**: 1 day

---

### US-5.5-04: Resource System for Knowledge Items (3 points)
**As a** AI agent
**I want** to access knowledge items as MCP resources
**So that** I can inject full knowledge item context into my prompts

**Acceptance Criteria**:
- [ ] Create lib/mcp/resources/knowledge-resource.ts
- [ ] Implement resources/list handler (list all knowledge items)
- [ ] Implement resources/read handler (read single item by URI)
- [ ] Support URI format: knowledge://item/{id}
- [ ] Return resource metadata (name, description, mimeType)
- [ ] Return full content for knowledge items
- [ ] Register resources with MCP server
- [ ] Unit tests for resource handlers

**Technical Details**:
```typescript
// lib/mcp/resources/knowledge-resource.ts
import { mcpServer } from '../server';
import { prisma } from '@/lib/prisma';

// List all knowledge resources
mcpServer.resources('knowledge://item/*', async () => {
  const items = await prisma.knowledgeItem.findMany({
    select: { id: true, title: true, category: true },
    take: 100, // Limit for performance
  });
  
  return items.map(item => ({
    uri: `knowledge://item/${item.id}`,
    name: item.title,
    description: `Knowledge item: ${item.category}`,
    mimeType: 'text/markdown',
  }));
});

// Read specific knowledge resource
mcpServer.resource('knowledge://item/:id', async (uri) => {
  const id = parseInt(uri.split('/').pop());
  const item = await prisma.knowledgeItem.findUnique({ where: { id } });
  
  if (!item) {
    throw new Error(`Knowledge item ${id} not found`);
  }
  
  return {
    contents: [
      {
        uri,
        mimeType: 'text/markdown',
        text: `# ${item.title}\n\n${item.content}`,
      },
    ],
  };
});
```

**Dependencies**:
- US-5.5-01 (MCP Server Foundation)

**Estimated Duration**: 0.5 days

---

### US-5.5-05: Integration Testing with Real Claude Desktop (N/A - Testing)
**As a** developer
**I want** to test the MCP server with real Claude Desktop
**So that** I can verify end-to-end functionality

**Acceptance Criteria**:
- [ ] Create claude_desktop_config.json example
- [ ] Document configuration steps
- [ ] Test initialize handshake
- [ ] Test knowledge.search tool from Claude
- [ ] Test knowledge.create tool from Claude
- [ ] Test knowledge.related tool from Claude
- [ ] Test resource access from Claude
- [ ] Test error handling (invalid requests, backend failures)
- [ ] Document common issues and solutions

**Technical Details**:
```json
// Example: claude_desktop_config.json
{
  "mcpServers": {
    "projectpulse": {
      "url": "http://192.168.1.15:3000/api/mcp",
      "transport": "streamable-http"
    }
  }
}
```

**Test Scenarios**:
1. **Tool Discovery**: Claude should list 3 knowledge tools
2. **Search**: "Search for PostgreSQL indexing strategies"
3. **Create**: "Create a knowledge item about React hooks"
4. **Related**: "Find items related to knowledge item 5"
5. **Resource**: Claude should see knowledge items in context menu

**Dependencies**:
- US-5.5-01, US-5.5-02, US-5.5-03, US-5.5-04

**Estimated Duration**: 1 day

---

### US-5.5-06: Documentation and User Guide (N/A - Documentation)
**As a** end user (AI agent operator)
**I want** clear setup documentation
**So that** I can configure my AI agent to use ProjectPulse

**Acceptance Criteria**:
- [ ] Create docs/MCP_SETUP_GUIDE.md
- [ ] Document claude_desktop_config.json setup
- [ ] Document available tools with examples
- [ ] Document available resources
- [ ] Document error codes and troubleshooting
- [ ] Create API documentation for MCP endpoints
- [ ] Update project README with MCP section

**Deliverables**:
1. **MCP_SETUP_GUIDE.md**: User-facing setup guide
2. **MCP_ARCHITECTURE.md**: Developer documentation
3. **MCP_API_REFERENCE.md**: Tool/resource reference
4. **README.md update**: Add MCP section to main README

**Dependencies**:
- US-5.5-05 (Integration Testing)

**Estimated Duration**: 0.5 days

---

## Implementation Phases

### Phase 1: Foundation (Day 1)
**Goal**: MCP server core infrastructure

**Tasks**:
1. Install @modelcontextprotocol/sdk
   ```bash
   cd apps/web
   pnpm add @modelcontextprotocol/sdk
   ```

2. Create lib/mcp/server.ts
   - Initialize MCP server instance
   - Set up capabilities
   - Export singleton

3. Create lib/mcp/types.ts
   - Type definitions for MCP messages
   - Session management types

4. Write unit tests for server initialization

**Exit Criteria**:
- [ ] MCP server instance created
- [ ] Tests pass: server.test.ts
- [ ] No TypeScript errors

---

### Phase 2: HTTP Transport (Day 1 afternoon - Day 2 morning)
**Goal**: HTTP endpoint for MCP connections

**Tasks**:
1. Create app/api/mcp/route.ts
   - POST handler for JSON-RPC
   - Session management (Mcp-Session-Id)
   - Error handling

2. Create lib/mcp/transport.ts
   - Wrapper for StreamableHTTPServerTransport
   - Request/response utilities

3. Test HTTP endpoint
   - curl tests for initialize
   - Postman collection for manual testing

**Exit Criteria**:
- [ ] POST /api/mcp returns 200 for initialize
- [ ] Session ID generated and returned
- [ ] Integration tests pass

---

### Phase 3: Knowledge Tools (Day 2 afternoon - Day 3 morning)
**Goal**: Connect existing tool specs to MCP server

**Tasks**:
1. Create lib/mcp/handlers/knowledge-handler.ts
   - knowledge.search handler
   - knowledge.create handler
   - knowledge.related handler

2. Register tools with server
   - Load tool specs from lib/mcp-tools/knowledge-tools.ts
   - Map to MCP server.tool() API

3. Test tool invocation
   - Unit tests for each handler
   - Integration tests via HTTP

**Exit Criteria**:
- [ ] All 3 knowledge tools callable via MCP
- [ ] Tests pass: knowledge-handler.test.ts
- [ ] Tools return correct format

---

### Phase 4: Resources (Day 3 afternoon)
**Goal**: Expose knowledge items as MCP resources

**Tasks**:
1. Create lib/mcp/resources/knowledge-resource.ts
   - resources/list handler
   - resources/read handler

2. Test resource access
   - Unit tests for resource handlers
   - Integration tests via HTTP

**Exit Criteria**:
- [ ] resources/list returns knowledge items
- [ ] resources/read returns item content
- [ ] Tests pass: knowledge-resource.test.ts

---

### Phase 5: Integration Testing (Day 4)
**Goal**: Test with real Claude Desktop

**Tasks**:
1. Create claude_desktop_config.json
2. Configure Claude Desktop to use MCP server
3. Test all tools from Claude:
   - knowledge.search
   - knowledge.create
   - knowledge.related
4. Test resource access
5. Document issues and edge cases

**Exit Criteria**:
- [ ] Claude Desktop connects successfully
- [ ] All tools work from Claude
- [ ] Resources accessible in Claude
- [ ] No critical bugs

---

### Phase 6: Documentation (Day 5)
**Goal**: Complete user and developer documentation

**Tasks**:
1. Write MCP_SETUP_GUIDE.md
2. Write MCP_ARCHITECTURE.md
3. Write MCP_API_REFERENCE.md
4. Update README.md
5. Create troubleshooting guide

**Exit Criteria**:
- [ ] All documentation complete
- [ ] Setup guide tested by fresh user
- [ ] Architecture documented for future devs

---

## Testing Strategy

### Unit Tests
Location: `__tests__/mcp/`

**Test Files**:
1. **server.test.ts**
   - Server initialization
   - Capability negotiation
   - Session management

2. **knowledge-handler.test.ts**
   - Tool registration
   - Argument validation
   - Response formatting
   - Error handling

3. **knowledge-resource.test.ts**
   - Resource listing
   - Resource reading
   - URI parsing

4. **transport.test.ts**
   - HTTP request handling
   - Session ID management
   - JSON-RPC parsing

**Test Coverage Target**: 80%+

---

### Integration Tests
Location: `__tests__/mcp/integration/`

**Test Files**:
1. **mcp-endpoint.test.ts**
   - POST /api/mcp with initialize
   - POST /api/mcp with tool call
   - POST /api/mcp with resource read
   - Session persistence across requests

2. **end-to-end.test.ts**
   - Full tool call flow (search → results)
   - Full resource flow (list → read)
   - Error scenarios (invalid session, bad arguments)

**Test Approach**:
- Use supertest to call HTTP endpoints
- Mock database with test fixtures
- Use real @modelcontextprotocol/sdk client

---

### Manual Testing (Claude Desktop)

**Test Plan**:
1. **Setup**:
   - Configure claude_desktop_config.json
   - Restart Claude Desktop
   - Verify connection in Claude logs

2. **Tool Testing**:
   - Run each tool from Claude chat
   - Verify results match API responses
   - Test error cases (invalid arguments)

3. **Resource Testing**:
   - Browse knowledge items in context menu
   - Inject knowledge item into chat
   - Verify content displayed correctly

4. **Edge Cases**:
   - Large search results (50 items)
   - Long content creation (10K chars)
   - Graph traversal (2-hop related items)

**Success Criteria**:
- ✅ All tools callable from Claude
- ✅ Results formatted correctly
- ✅ No errors in Claude logs
- ✅ Performance acceptable (<2s per call)

---

## Success Criteria & Exit Conditions

### Must Have (Sprint Exit)
- ✅ MCP server running on Mac mini (http://192.168.1.15:3000/api/mcp)
- ✅ Claude Desktop can connect via config
- ✅ knowledge.search tool works from Claude
- ✅ knowledge.create tool works from Claude
- ✅ knowledge.related tool works from Claude
- ✅ All unit tests pass (>80% coverage)
- ✅ Integration tests pass
- ✅ Documentation complete (setup guide, API reference)

### Should Have
- ✅ Resource system working (knowledge items as resources)
- ✅ Error handling for all edge cases
- ✅ Session management working correctly
- ✅ Performance <2s per tool call
- ✅ Troubleshooting guide for common issues

### Nice to Have (Future)
- ⏭️ GET /api/mcp SSE streaming (for notifications)
- ⏭️ OAuth 2.1 authentication (cloud deployment)
- ⏭️ Multi-tenant support (API keys per user)
- ⏭️ Issues tools (issues.create, issues.search)
- ⏭️ Wiki tools (wiki.search, wiki.read)
- ⏭️ Prompt templates as MCP prompts

---

## Dependencies & Risks

### Dependencies

**External**:
- @modelcontextprotocol/sdk (npm package) - ✅ Available
- Claude Desktop (for testing) - ✅ Available
- Mac mini server (192.168.1.15) - ✅ Running

**Internal**:
- lib/knowledge/search.ts - ✅ Complete
- lib/knowledge/create.ts - ✅ Complete
- lib/knowledge/graph.ts - ✅ Complete
- lib/mcp-tools/knowledge-tools.ts - ✅ Complete
- PostgreSQL + pgvector - ✅ Running

**No blocking dependencies!** ✅

---

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| SDK API changes | High | Low | Pin version, monitor changelog |
| Session management bugs | Medium | Medium | Thorough testing, use UUIDs |
| Performance issues (large results) | Medium | Medium | Pagination, limit defaults |
| Claude Desktop config issues | Low | Medium | Detailed setup guide, examples |
| HTTP transport bugs | High | Low | Use official SDK transport |
| Network latency (Mac mini) | Low | Low | Mac mini on local network (fast) |

**Overall Risk**: LOW ✅

---

## Technical Decisions

### 1. Transport: Streamable HTTP vs SSE
**Decision**: Use Streamable HTTP (2025-03-26 spec)
**Rationale**:
- Latest protocol revision
- Cost-efficient (no persistent connections)
- Serverless-ready (future cloud deployment)
- SSE optional for advanced use cases

### 2. Integration: Standalone Server vs Next.js Routes
**Decision**: Next.js App Router routes (app/api/mcp)
**Rationale**:
- Reuse existing Next.js infrastructure
- Share Prisma client, env vars, utilities
- No separate deployment needed
- Easier for single developer setup

### 3. Authentication: Now vs Later
**Decision**: No auth for Sprint 5.5 (single dev), OAuth 2.1 for cloud
**Rationale**:
- Mac mini local network (trusted environment)
- Single developer, no multi-tenant needs
- Can add OAuth 2.1 later (MCP 2025-03-26 supports it)

### 4. Session Storage: In-Memory vs Database
**Decision**: In-memory (Map<sessionId, session>)
**Rationale**:
- Simple for single server
- No database overhead
- Sessions short-lived (tool calls stateless)
- Can add Redis later if needed

### 5. Error Format: JSON-RPC vs Custom
**Decision**: JSON-RPC 2.0 error format (per MCP spec)
**Rationale**:
- Standard format expected by clients
- SDK handles formatting
- Consistent with protocol

---

## Code Examples

### Example 1: MCP Server Setup
```typescript
// lib/mcp/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { knowledgeTools } from '@/lib/mcp-tools/knowledge-tools';

// Create singleton server
export const mcpServer = new McpServer({
  name: 'projectpulse-mcp',
  version: '1.0.0',
  capabilities: {
    tools: {},
    resources: {},
  },
});

// Register knowledge tools
Object.entries(knowledgeTools).forEach(([name, tool]) => {
  mcpServer.tool(
    tool.name,
    tool.description,
    tool.inputSchema,
    async (args) => {
      const result = await tool.handler(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
});
```

### Example 2: HTTP Route Handler
```typescript
// app/api/mcp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { mcpServer } from '@/lib/mcp/server';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Get or create session ID
    let sessionId = request.headers.get('mcp-session-id');
    if (!sessionId) {
      sessionId = randomUUID();
    }

    // Parse request body
    const body = await request.json();

    // Create transport for this request
    const transport = new StreamableHTTPServerTransport({
      sessionId,
    });

    // Connect server to transport
    await mcpServer.connect(transport);

    // Handle the request
    const response = await transport.handleRequest(body);

    // Return response with session ID
    return NextResponse.json(response, {
      headers: {
        'mcp-session-id': sessionId,
        'content-type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[MCP] Request error:', error);
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
          data: { details: error.message },
        },
        id: null,
      },
      { status: 500 }
    );
  }
}
```

### Example 3: Tool Handler
```typescript
// lib/mcp/handlers/knowledge-handler.ts
import { knowledgeSearchTool } from '@/lib/mcp-tools/knowledge-tools';
import { mcpServer } from '../server';

// Register knowledge.search tool
export function registerKnowledgeTools() {
  mcpServer.tool(
    'knowledge.search',
    'Search the knowledge base using hybrid (semantic + full-text) search',
    {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query in natural language',
        },
        mode: {
          type: 'string',
          enum: ['semantic', 'fulltext', 'hybrid'],
          default: 'hybrid',
        },
        limit: {
          type: 'number',
          default: 5,
          minimum: 1,
          maximum: 50,
        },
      },
      required: ['query'],
    },
    async (args) => {
      try {
        const result = await knowledgeSearchTool(args);
        
        // Format results for display
        const formatted = result.results.map(r => 
          `**${r.title}** (score: ${r.score})\n${r.excerpt}`
        ).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${result.count} results:\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
```

### Example 4: Resource Handler
```typescript
// lib/mcp/resources/knowledge-resource.ts
import { mcpServer } from '../server';
import { prisma } from '@/lib/prisma';

export function registerKnowledgeResources() {
  // List all knowledge items
  mcpServer.resource('knowledge://item/*', async () => {
    const items = await prisma.knowledgeItem.findMany({
      select: { id: true, title: true, category: true },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    return items.map(item => ({
      uri: `knowledge://item/${item.id}`,
      name: item.title,
      description: `${item.category} knowledge item`,
      mimeType: 'text/markdown',
    }));
  });

  // Read specific knowledge item
  mcpServer.resource('knowledge://item/:id', async (uri) => {
    const id = parseInt(uri.split('/').pop() || '0');
    
    const item = await prisma.knowledgeItem.findUnique({
      where: { id },
      include: {
        relationsFrom: {
          include: { toKnowledge: true },
        },
      },
    });

    if (!item) {
      throw new Error(`Knowledge item ${id} not found`);
    }

    // Format as markdown with metadata
    const content = `# ${item.title}

**Category**: ${item.category}
**Tags**: ${item.tags.join(', ')}
**Created**: ${item.createdAt.toISOString()}

---

${item.content}

---

**Related Items**: ${item.relationsFrom.length} connections
`;

    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: content,
        },
      ],
    };
  });
}
```

### Example 5: Claude Desktop Config
```json
// claude_desktop_config.json
{
  "mcpServers": {
    "projectpulse": {
      "url": "http://192.168.1.15:3000/api/mcp",
      "transport": "streamable-http",
      "description": "ProjectPulse Knowledge Base and Issue Tracking"
    }
  }
}
```

---

## Rollout Plan

### Development Environment (Mac mini)
1. Develop and test on Mac mini (192.168.1.15)
2. Use Claude Desktop from Windows (connects to Mac mini)
3. Iterate until all tools working

### Production (Future Cloud Deployment)
1. Deploy to Railway/Vercel/Cloudflare Workers
2. Add OAuth 2.1 authentication
3. Add API key management
4. Update docs with cloud URLs

---

## Acceptance Testing Checklist

### Functional Requirements
- [ ] MCP server starts without errors
- [ ] POST /api/mcp returns 200 for initialize
- [ ] Session IDs generated and persisted
- [ ] knowledge.search returns results
- [ ] knowledge.create creates items
- [ ] knowledge.related returns related items
- [ ] resources/list returns knowledge items
- [ ] resources/read returns item content
- [ ] Error responses formatted correctly

### Non-Functional Requirements
- [ ] Response time <2s per tool call
- [ ] No memory leaks (sessions cleaned up)
- [ ] Logs errors for debugging
- [ ] TypeScript types complete (no 'any')
- [ ] Code follows project conventions
- [ ] Unit test coverage >80%

### Documentation
- [ ] MCP_SETUP_GUIDE.md complete
- [ ] MCP_ARCHITECTURE.md complete
- [ ] MCP_API_REFERENCE.md complete
- [ ] README.md updated with MCP section
- [ ] Code comments for complex logic

### User Experience
- [ ] Claude Desktop connects successfully
- [ ] Tool results readable in chat
- [ ] Resource content useful for context
- [ ] Error messages helpful
- [ ] Setup takes <10 minutes

---

## Future Enhancements (Post-Sprint 5.5)

### Sprint 6+: Additional Tools
- [ ] issues.create - Create issues from chat
- [ ] issues.search - Search issues
- [ ] issues.update - Update issue status/priority
- [ ] wiki.search - Search wiki pages
- [ ] wiki.read - Read wiki page content
- [ ] wiki.create - Create wiki pages

### Sprint 7+: Advanced Features
- [ ] Prompt templates (MCP prompts)
- [ ] Batch operations (multiple tool calls)
- [ ] Streaming responses (SSE)
- [ ] Webhooks for notifications
- [ ] Analytics (tool usage, performance)

### Cloud Deployment
- [ ] OAuth 2.1 authentication
- [ ] Multi-tenant support
- [ ] API key management
- [ ] Rate limiting
- [ ] CDN for static resources
- [ ] Monitoring and alerting

---

## Metrics & KPIs

### Development Metrics
- Story points completed: 21 / 21
- Test coverage: >80%
- Critical bugs: 0
- Documentation completeness: 100%

### Performance Metrics
- Tool call latency: <2s (p95)
- Server startup time: <5s
- Memory usage: <200MB
- Concurrent connections: 10+ (local network)

### User Metrics
- Setup time: <10 minutes
- Tool success rate: >95%
- Error rate: <5%
- User satisfaction: Positive feedback

---

## Conclusion

Sprint 5.5 closes the critical gap in Sprint 1 by building the MCP server infrastructure that enables **90% of users (AI agents) to access ProjectPulse**.

With this infrastructure complete, AI agents can:
- ✅ Search the knowledge base (semantic + full-text)
- ✅ Create new knowledge items
- ✅ Discover related knowledge (graph traversal)
- ✅ Access knowledge items as context resources

This unblocks the primary use case and sets the foundation for future tool expansion (issues, wiki, workflows).

**Total Effort**: 21 story points (~5 days)
**Priority**: CRITICAL
**Risk**: LOW
**ROI**: VERY HIGH (enables 90% use case)

---

**Ready to implement!** 🚀
