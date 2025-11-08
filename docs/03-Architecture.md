# System Architecture

**Project:** ProjectPulse
**Version:** 2.0.0 (Agent-First Architecture)
**Created:** 2025-11-02
**Status:** Active
**Architecture Style:** C4 Model (Context → Container → Component)

---

## Document Purpose

This document describes the complete system architecture of ProjectPulse, an agent-first project management platform. The architecture is designed to support AI agents as primary users (95% interaction via MCP) with humans as secondary users (5% monitoring via UI).

**Architecture Principles:**

1. **Agent-First Design:** MCP tools are the primary interface, UI is secondary
2. **Database as Source of Truth:** All state in database, markdown files auto-generated (see [ADR-002](architecture/ADRs/ADR-002-database-as-source-of-truth.md))
3. **Token Efficiency:** 92% reduction for skills, 88% for knowledge queries
4. **Local-First:** $0 budget, runs entirely on localhost
5. **Stateless Agent Operation:** Persistent state enables context-free execution

**Related Documents:**

- [01-PRD.md](01-PRD.md) - Product Requirements
- [02-SRS.md](02-SRS.md) - System Requirements (158 MVP FRs, 220 total)
- [architecture/ADRs/](architecture/ADRs/) - Architecture Decision Records (5 ADRs)
- [04-Data-and-Model-Spec.md](04-Data-and-Model-Spec.md) - Database Schema
- [12-Backlog.md](12-Backlog.md) - User Stories

> Note: The legacy `DEVELOPMENT_PLAN.md` is retired. Any mentions of it in diagrams or examples are illustrative of the previous pipeline. The current sources of truth are `STATUS.md`, `docs/13-Project-Plan.md`, and `docs/12-Backlog.md`.

---

## Table of Contents

1. [System Context](#1-system-context)
2. [Container Architecture](#2-container-architecture)
3. [Component Architecture](#3-component-architecture)
4. [Data Flow Architecture](#4-data-flow-architecture)
5. [Deployment Architecture](#5-deployment-architecture)
6. [Cross-Cutting Concerns](#6-cross-cutting-concerns)
7. [Integration Points](#7-integration-points)
8. [Sequence Diagrams](#8-sequence-diagrams)
9. [Technology Stack](#9-technology-stack)
10. [Architecture Decisions](#10-architecture-decisions)

---

## 1. System Context

### 1.1 System Context Diagram

The system context shows ProjectPulse's position in the development ecosystem and its primary interactions with external actors.

```mermaid
C4Context
    title System Context - ProjectPulse (Agent-First Project Management)

    Person(agent, "AI Agent", "Claude Code, Cursor AI, Codex, Cascade<br/>Primary User (95% interaction)")
    Person(developer, "Solo Developer", "Human monitoring and manual operations<br/>Secondary User (5% interaction)")

    System_Boundary(devhub, "ProjectPulse") {
        System(mcp_server, "MCP Server", "41 tools across 9 features<br/>stdio transport")
        System(web_app, "Next.js Web App", "Monitoring dashboard + Manual CRUD<br/>React Server Components")
        SystemDb(database, "PostgreSQL", "Single source of truth<br/>Prisma ORM")
    }

    System_Ext(git, "Git Repository", "Version control, branches, commits")
    System_Ext(filesystem, "File System", "Markdown files (auto-generated)<br/>.agent/ folder, STATUS.md")
    System_Ext(docker, "Docker", "PostgreSQL container<br/>Development environment")
    System_Ext(embedding_api, "Embedding API", "OpenAI text-embedding-3-small<br/>Optional: local embeddings")

    Rel(agent, mcp_server, "Executes workflows via MCP", "stdio, 41 tools")
    Rel(developer, web_app, "Monitors progress, manual CRUD", "HTTPS")

    Rel(mcp_server, database, "CRUD operations", "Prisma queries")
    Rel(web_app, database, "Read/write state", "Prisma queries")

    Rel(mcp_server, filesystem, "Reads markdown context<br/>Triggers markdown sync", "Node.js fs")
    Rel(database, filesystem, "Auto-generates markdown", "Post-transaction hooks")

    Rel(mcp_server, git, "git add, commit (via agent)", "shell commands")
    Rel(agent, git, "git checkout, push", "shell commands")

    Rel(database, embedding_api, "Generate embeddings", "REST API")

    UpdateRelStyle(agent, mcp_server, $lineColor="blue", $textColor="blue")
    UpdateRelStyle(developer, web_app, $lineColor="gray", $textColor="gray")
```

**Key Relationships:**

| Actor/System             | Primary Interface      | Purpose                                                 | Volume                     |
| ------------------------ | ---------------------- | ------------------------------------------------------- | -------------------------- |
| AI Agent → MCP Server    | stdio, 41 MCP tools    | Execute workflows (5-step protocol)                     | 95% interaction            |
| Developer → Web App      | HTTPS, React UI        | Monitor progress, manual CRUD                           | 5% interaction             |
| MCP Server → Database    | Prisma ORM             | State persistence (Phase, Week, Day, Task, Session)     | ~100 queries/minute        |
| Database → File System   | Post-transaction hooks | Auto-generate markdown (STATUS.md, DEVELOPMENT_PLAN.md) | On state change            |
| Database → Embedding API | REST API               | Generate embeddings for knowledge items                 | On knowledge create/update |

**Design Decision Reference:** See [ADR-001](architecture/ADRs/ADR-001-agent-first-architecture.md) for agent-first architecture rationale.

Note: Tool count may expand; 41 represents current scope.

---

### 1.2 Primary Actors

#### 1.2.1 AI Agent (Primary User - 95%)

**Characteristics:**

- **Type:** Any MCP-compatible agent (Claude Code, Cursor AI, Codex, Cascade)
- **Interface:** MCP stdio transport, 41 tools
- **Behavior:** Autonomous workflow execution, stateless operation
- **Context:** Reads markdown files (STATUS.md, DEVELOPMENT_PLAN.md, .agent/task/)
- **State Persistence:** All progress saved to database (survives context compaction)

**Primary Workflows:**

1. **5-Step Mandatory Protocol** (see Section 8.1)
2. **Issue Bulk Creation** (see Section 3.3)
3. **Knowledge Query** (hybrid search) (see Section 3.4)
4. **Checkpoint Updates** (every 15K tokens) (see Section 8.2)
5. **Markdown Sync Trigger** (auto-generation) (see Section 7.3)

**Requirements Fulfilled:**

- FR-026 to FR-050: Workflow Orchestration (see [02-SRS.md](02-SRS.md))
- NFR-001 to NFR-005: Performance (MCP response <200ms)

#### 1.2.2 Solo Developer (Secondary User - 5%)

**Characteristics:**

- **Type:** Human developer (solo or small team)
- **Interface:** Web UI (Next.js App Router, React Server Components)
- **Behavior:** Monitoring, manual CRUD, business logic overrides
- **Context:** Visual dashboards, progress charts, issue lists
- **Authority:** Full CRUD permissions, can override agent decisions

**Primary Use Cases:**

1. **Monitor Dashboard** (see Section 3.9)
2. **Manual Issue Creation** (when bulk import not needed)
3. **Knowledge Review** (verify agent-created entries)
4. **Health Report Review** (prioritize tech debt)
5. **Override Agent Status** (e.g., mark task blocked)

**Requirements Fulfilled:**

- FR-001 to FR-025: Sprint/Phase Tracking (UI)
- FR-051 to FR-070: Issues Management (UI)

---

### 1.3 External Systems

#### 1.3.1 Git Repository

**Purpose:** Version control for codebase and documentation

**Integration Points:**

- Agent executes git commands via shell (git add, commit, push)
- MCP tools do NOT execute git directly (agent handles git workflow)
- Markdown files committed to git (auto-generated, read-only in repo)

**Git Hooks:**

- **Pre-commit:** Validates markdown files are auto-generated (prevents manual edits)
- **Post-commit:** Triggers markdown sync if STATUS.md modified manually (fail-safe)

**Requirements:** FR-027 (Workflow step validation)

#### 1.3.2 File System

**Purpose:** Markdown file storage for agent context

**Key Files:**

- `STATUS.md` - Current phase, last task completed (auto-generated)
- `DEVELOPMENT_PLAN.md` - Detailed plan (auto-generated)
- `.agent/task/current-session-[timestamp].md` - Session notes (agent-created, human-editable)
- `.agent/task/current-todos.md` - Todo list (auto-generated from database)
- `.agent/task/current-plan.md` - Implementation plan (agent-created, human-editable)

**Design Decision:** See [ADR-002](architecture/ADRs/ADR-002-database-as-source-of-truth.md) for markdown auto-generation rationale.

#### 1.3.3 Docker

**Purpose:** PostgreSQL containerization for development

**Configuration:**

```yaml
# docker-compose.yml
services:
  projectpulse-db:
    image: postgres:15
    environment:
      POSTGRES_USER: projectpulse
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: projectpulse
    ports:
      - '5432:5432'
    volumes:
      - projectpulse_db_data:/var/lib/postgresql/data
```

**Requirements:** FR-001 (Database setup), NFR-006 (Development environment)

#### 1.3.4 Embedding API (Optional)

**Purpose:** Generate embeddings for knowledge graph semantic search

**Options:**

1. **OpenAI API:** text-embedding-3-small (384 dimensions)
   - Cost: ~$0.10/1M tokens
   - Latency: ~100ms per embedding
   - Quality: High

2. **Local Embeddings:** sentence-transformers (all-MiniLM-L6-v2)
   - Cost: $0 (runs locally)
   - Latency: ~50ms per embedding
   - Quality: Medium-high

**Fallback:** If no embedding provider configured, semantic search disabled (full-text only)

**Requirements:** FR-077 (Semantic search), FR-078 (Embedding generation)

**Design Decision:** See [ADR-003](architecture/ADRs/ADR-003-hybrid-knowledge-graph.md) for hybrid search strategy.

---

## 2. Container Architecture

### 2.1 Container Diagram

The container architecture shows the three main runtime containers and their interactions.

```mermaid
C4Container
    title Container Architecture - ProjectPulse

    Person(agent, "AI Agent", "Primary user (95%)")
    Person(developer, "Developer", "Secondary user (5%)")

    Container_Boundary(devhub, "ProjectPulse") {
        Container(mcp_server, "MCP Server", "Node.js, TypeScript", "41 MCP tools<br/>stdio transport<br/>Zod validation")

        Container(web_app, "Next.js App", "React 18, Next.js 14 App Router", "Server Components<br/>Client Components<br/>shadcn/ui")

        ContainerDb(database, "PostgreSQL", "PostgreSQL 15, Prisma ORM", "10 tables<br/>pgvector extension<br/>tsvector full-text")
    }

    Container_Ext(filesystem, "File System", "Markdown files (.agent/, STATUS.md)")

    Rel(agent, mcp_server, "MCP stdio", "41 tools")
    Rel(developer, web_app, "HTTPS", "React UI")

    Rel(mcp_server, database, "Prisma Client", "CRUD operations")
    Rel(web_app, database, "Prisma Client", "Server Components")

    Rel(mcp_server, filesystem, "Node.js fs", "Read context")
    Rel(database, filesystem, "Prisma hooks", "Auto-generate markdown")

    UpdateRelStyle(agent, mcp_server, $lineColor="blue", $textColor="blue")
```

**Container Responsibilities:**

| Container   | Purpose                  | Technology                          | Scale                   |
| ----------- | ------------------------ | ----------------------------------- | ----------------------- |
| MCP Server  | Agent workflow execution | Node.js, TypeScript, Zod            | 1 process, ~50MB RAM    |
| Next.js App | Human monitoring UI      | React 18, Next.js 14 App Router     | 1 process, ~100MB RAM   |
| PostgreSQL  | Single source of truth   | PostgreSQL 15, Prisma ORM, pgvector | 1 container, ~200MB RAM |
| File System | Markdown context storage | Node.js fs module                   | N/A                     |

**Design Decision:** See [ADR-004](architecture/ADRs/ADR-004-single-mcp-server.md) for single MCP server rationale.

---

### 2.2 Container: MCP Server

**Technology Stack:**

- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.3+
- **Framework:** @modelcontextprotocol/sdk
- **Validation:** Zod 3.22+
- **Database:** Prisma Client 5.7+

**Transport:**

- **Protocol:** stdio (standard input/output)
- **Format:** JSON-RPC 2.0
- **Security:** Local process communication (no network exposure)

**Tool Organization:**

```typescript
// Tool namespace structure
const tools = {
  // Sprint/Phase Tracking (6 tools)
  "sprint.getCurrentTask": ...,
  "sprint.create": ...,
  "sprint.update": ...,
  "sprint.complete": ...,
  "sprint.getProgress": ...,
  "sprint.archive": ...,

  // Workflow Orchestration (5 tools)
  "workflow.validateStep": ...,
  "workflow.transitionState": ...,
  "workflow.checkPrerequisites": ...,
  "workflow.recordCheckpoint": ...,
  "workflow.getActiveWorkflow": ...,

  // Issues (5 tools)
  "issues.create": ...,
  "issues.bulkCreate": ...,
  "issues.update": ...,
  "issues.search": ...,
  "issues.link": ...,

  // Knowledge (5 tools)
  "knowledge.query": ...,
  "knowledge.create": ...,
  "knowledge.link": ...,
  "knowledge.search": ...,
  "knowledge.getRelated": ...,

  // Skills (4 tools)
  "skills.load": ...,
  "skills.unload": ...,
  "skills.search": ...,
  "skills.getActive": ...,

  // Wiki (5 tools)
  "wiki.generate": ...,
  "wiki.update": ...,
  "wiki.search": ...,
  "wiki.crossLink": ...,
  "wiki.getPage": ...,

  // Project Health (4 tools)
  "health.createReport": ...,
  "health.categorize": ...,
  "health.track": ...,
  "health.getDashboard": ...,

  // Personas (4 tools)
  "personas.activate": ...,
  "personas.deactivate": ...,
  "personas.getActive": ...,
  "personas.list": ...,

  // Dashboard (4 tools)
  "dashboard.getMetrics": ...,
  "dashboard.getActivity": ...,
  "dashboard.getProgress": ...,
  "dashboard.export": ...,

  // Project Onboarding (4 tools)
  "onboarding.startSession": ...,
  "onboarding.answerQuestion": ...,
  "onboarding.getProgress": ...,
  "onboarding.generateSummary": ...,

  // Ticket System (8 tools)
  "ticket.create": ...,
  "ticket.update": ...,
  "ticket.complete": ...,
  "ticket.addCheckpoint": ...,
  "ticket.getContext": ...,
  "ticket.search": ...,
  "ticket.link": ...,
  "ticket.updateProgress": ...,

  // Memory Bank Auto-Gen (5 tools)
  "memoryBank.read": ...,
  "memoryBank.update": ...,
  "memoryBank.autoSync": ...,
  "memoryBank.getVersionHistory": ...,
  "memoryBank.snapshot": ...
};
```

**Error Handling:**

```typescript
// Standardized error responses
type MCPError = {
  code: string;           // "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT" | ...
  message: string;        // Human-readable error message
  details?: Record<string, unknown>;  // Additional context
  suggestion?: string;    // How to fix the error
};

// Example error
{
  code: "VALIDATION_ERROR",
  message: "Phase order must be unique",
  details: { order: 1, conflictingPhaseId: "phase_123" },
  suggestion: "Use order 2 or update existing Phase 1"
}
```

**Performance:**

- Tool response time: <200ms (P95)
- Startup time: ~500ms
- Memory usage: ~50MB
- Concurrent requests: 1 (sequential execution, no queuing needed for single agent)

**Requirements Fulfilled:**

- FR-026 to FR-125: All MCP tool operations
- NFR-001: MCP response time <200ms
- NFR-015: Input validation (Zod schemas)

#### MCP Execution Approach: Dual-Mode Architecture

**Critical Requirement**: ProjectPulse MCP server must support **all MCP clients** equally, not just Claude Code.

To support a 41-tool ecosystem efficiently while maintaining universal client compatibility, ProjectPulse implements a **dual-mode MCP server** that adapts to client capabilities:

**Architecture Overview:**

```
┌────────────────────────────────────────┐
│ ProjectPulse MCP Server                │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Mode 1: Traditional MCP (stdio)    │ │
│ │  - 41 tools as function calls      │ │
│ │  - Works with: ALL MCP clients     │ │
│ │  - Optimizations: Pagination       │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Mode 2: Code Execution (optional)  │ │
│ │  - Tools as filesystem modules     │ │
│ │  - Works with: Claude Code (if     │ │
│ │    supported)                      │ │
│ │  - Optimizations: Local processing │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Shared Layer                       │ │
│ │  - Business logic (Prisma)         │ │
│ │  - Privacy tokenization            │ │
│ │  - Database operations             │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Design Principle**: Same functionality, different delivery mechanisms.

| Aspect            | Traditional MCP             | Code Execution MCP      |
|-------------------|-----------------------------|-------------------------|
| **Tool loading**  | All upfront                 | On-demand discovery     |
| **Token cost**    | ~50K+ for 25 tools          | ~2–5K per operation     |
| **Data processing**| In model context           | Local execution         |
| **Client support**| ALL MCP clients             | Claude Code (if supported)|
| **Scalability**   | Limited (~<20 tools)        | Scales to thousands     |
| **Privacy**       | Server-side tokenization    | Auto-tokenization layer |
| **Optimization**  | Pagination, filtering       | Local processing        |

**Why Dual-Mode for ProjectPulse:**
1. **Universal Compatibility**: GPT, Gemini, Claude all get full functionality
2. **No Vendor Lock-In**: Not dependent on Claude Code support
3. **Future-Proof**: Code execution as enhancement, not requirement
4. **Token Efficiency**: 50-70% savings (traditional) to 90-98% (code execution)

### Dual-Mode Architecture – Adapter Pattern

Clarification: There is ONE MCP server with TWO adapter layers, not two servers.
- Traditional Adapter: Receives `tools/call` over stdio, routes to shared services.
- Code Execution Adapter: Client-side wrappers import modules but still call the same MCP server; wrappers perform local pre/post-processing for efficiency.

### Functional Parity Guarantee

All MCP clients receive identical functionality:
- Same 41 tools, same business logic and results
- Same privacy protections (tokenization)
- Same data access (Prisma operations)

Efficiency varies by client capability:
- Traditional mode (ALL clients): 50–70% token reduction via pagination, filtering, compression
- Code execution mode (Claude Code if supported): 90–98% token reduction via local processing

Parity Matrix (Week 5 POC – 3 tools):

| Tool | Traditional Mode | Code Execution Mode | Result Parity |
|------|------------------|---------------------|---------------|
| create-issue | Direct stdio call | Wrapper imports service | ✅ Identical |
| search-issues | Server-side filter (20/page) | Local filter (all → 10) | ✅ Identical IDs |
| filter-issues | Server-side logic | Client-side logic | ✅ Identical |

**Mode 1: Traditional MCP (Baseline)**

All clients get optimized traditional MCP:

```typescript
// Server-side filtering and pagination
search_issues({
  query: 'bug',
  status: 'open',
  priority: 'high',
  page: 1,
  limit: 20
}) → [20 filtered issues] // ~5K tokens
```

**Optimizations**:
- Pagination (default: 20 results per page)
- Server-side filtering (status, priority, dates)
- Response compression (summaries vs full objects)
- Backpressure and timeouts using pagination (see Large Dataset Handling)
- Streaming optional (future), if MCP notifications/progress are supported

**Token Savings**: 50-70% vs unoptimized traditional MCP

### Large Dataset Handling - Pagination First

Primary Strategy: Server-side pagination (universal across clients)

```typescript
// Server-side paginated search (default)
async function searchIssues(params: { query: string; page?: number; limit?: number }) {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 20, 100); // Max 100/page
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.issue.findMany({
      where: {/* filters based on params */},
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.issue.count({ where: {/* same filters */} }),
  ]);

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
    hasMore: skip + items.length < total,
  };
}
```

Backpressure and Timeouts:
- Server timeout: 30s per operation (configurable)
- Max page size: 100; Max results per query: 10,000 (hard limit)
- Abort: Clients can stop requesting further pages when satisfied

Future Enhancement (optional):
- Research MCP notifications/progress for streaming; if supported, implement chunked responses
- Pagination remains the primary strategy

**Mode 2: Code Execution MCP (Enhancement)**

Claude Code (if supported) gets additional optimization:

**Filesystem-Based Tool Organization:**
```
./servers/projectpulse/
├── issues/
│   ├── create.ts
│   ├── update.ts
│   ├── search.ts
│   └── filter.ts
├── knowledge/
│   ├── search.ts
│   ├── embed.ts
│   └── retrieve.ts
├── agents/
│   ├── personas.ts
│   └── activate.ts
└── projects/
    ├── context.ts
    └── status.ts
```

**Agent Discovery Pattern (TypeScript):**
```ts
// Agent explores filesystem and loads only what is needed
const tools = await listDirectory('./servers/projectpulse/issues/')
const { search } = await import('./servers/projectpulse/issues/search.ts')
const results = await search(query)
const open = results.filter(i => i.status === 'open')
return open.slice(0, 10)
```

**Token Savings**: 90-98% vs traditional MCP

**Client Capability Detection - Hybrid Strategy:**

Strategy: Try protocol negotiation, fallback to environment variable, verify with a probe. Safe default is traditional mode.

Step 1: Attempt MCP negotiation (if supported by client/server):

```typescript
// Server declares capabilities during handshake (if protocol supports it)
const server = new MCPServer({
  capabilities: {
    tools: true,         // Traditional MCP (required)
    codeExecution: true, // Code execution (optional)
  },
});

// Client may declare support
client.connect({
  supports: {
    codeExecution: false,
  },
});
```

Step 2: Environment variable fallback (always available):

```typescript
// PP_MCP_MODE=traditional | code-exec | auto (default)
const mode = process.env.PP_MCP_MODE ?? 'auto';
```

Step 3: Probe verification (first call), with session caching:

```typescript
async function detectClientMode(client: MCPClient): Promise<'traditional' | 'code-exec'> {
  // Trust explicit client declaration when available (and verify)
  if ((client as any).declared?.codeExecution === true) {
    try { await client.execute('return 2 + 2'); return 'code-exec'; } catch { return 'traditional'; }
  }

  if (process.env.PP_MCP_MODE === 'traditional') return 'traditional';
  if (process.env.PP_MCP_MODE === 'code-exec') {
    await client.execute('return 2 + 2'); // throws if unsupported
    return 'code-exec';
  }

  // auto: try probe, else fallback
  try { await client.execute('return 2 + 2'); return 'code-exec'; } catch { return 'traditional'; }
}
```

**Privacy & Security (All Modes):**

Auto-tokenization happens in shared layer (available to all clients):
- Sensitive data (emails, IPs, phone numbers) tokenized before transmission
- Model sees tokens (e.g., `<EMAIL_1>`, `<IP_1>`) instead of raw values
- De-tokenization only for authorized presentation

**Implementation Path:**

Sprint 2 scope and checkpoints:
- **Week 5**: Design + Traditional POC
  - Traditional MCP server with 3 tools (create-issue, search-issues, filter-issues)
  - Capability detection design + detection stubs (env var + probe)
  - Shared services interface definitions (no wrappers yet)
  - Privacy tokenization specification (document only)
  - Sandbox security specification (document only)
  - Multi-client test harness design (mock traditional client + CLI)
  - Token usage measurement baseline (traditional mode)
- **Weeks 6-7**: Refine specifications, optimize traditional mode (pagination, compression, timeouts), document dual-mode patterns, prepare Sprint 3 plan

Sprint 3 (Weeks 9-12): Full dual-mode implementation
- Code execution wrappers for all tools
- Capability negotiation (if supported) and full detection
- Sandbox implementation and testing
- Agent persona tool discovery
- Complete multi-client validation

**Outcome**: Regardless of path, all MCP clients have equal access to ProjectPulse functionality.

**Reference**: See [archive/plans/mcp-code-execution-design.md](archive/plans/mcp-code-execution-design.md) for complete contingency planning.

---

### 2.3 Container: Next.js Web App

**Technology Stack:**

- **Framework:** Next.js 14 (App Router)
- **Runtime:** React 18
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS 3.4+
- **Forms:** react-hook-form + Zod validation
- **State:** React Context (no global state library needed)
- **Database:** Prisma Client (Server Components only)

**App Router Structure:**

```
app/
├── (dashboard)/              # Grouped route (shared layout)
│   ├── layout.tsx           # Dashboard layout with sidebar
│   ├── page.tsx             # Dashboard home (Server Component)
│   ├── sprint/              # Sprint tracking pages
│   │   ├── page.tsx         # Sprint list (Server Component)
│   │   ├── [id]/            # Sprint detail (Server Component)
│   │   └── [id]/edit/       # Sprint edit form (Client Component)
│   ├── issues/              # Issue management pages
│   │   ├── page.tsx         # Issue list (Server Component)
│   │   ├── [id]/            # Issue detail (Server Component)
│   │   └── new/             # Issue create form (Client Component)
│   ├── knowledge/           # Knowledge graph pages
│   │   ├── page.tsx         # Knowledge search (Server Component)
│   │   ├── [id]/            # Knowledge detail (Server Component)
│   │   └── new/             # Knowledge create form (Client Component)
│   ├── wiki/                # Wiki pages
│   │   ├── page.tsx         # Wiki home (Server Component)
│   │   └── [slug]/          # Wiki page (Server Component, markdown rendering)
│   ├── health/              # Project health dashboard
│   │   └── page.tsx         # Health reports (Server Component)
│   └── settings/            # Settings pages
│       ├── personas/        # Agent personas
│       └── preferences/     # User preferences
├── api/                     # API Routes (REST endpoints)
│   ├── sprint/              # Sprint CRUD endpoints
│   ├── issues/              # Issues CRUD endpoints
│   ├── knowledge/           # Knowledge CRUD endpoints
│   ├── wiki/                # Wiki CRUD endpoints
│   └── health/              # Health CRUD endpoints
└── layout.tsx               # Root layout
```

**Server Components vs Client Components:**

| Pattern          | When to Use                                | Example                                   |
| ---------------- | ------------------------------------------ | ----------------------------------------- |
| Server Component | Data fetching, SEO, static content         | Sprint list, Issue detail, Wiki pages     |
| Client Component | User interaction, forms, real-time updates | Issue form, Search input, Progress charts |

**Data Fetching (Server Components):**

```typescript
// app/(dashboard)/sprint/page.tsx (Server Component)
async function SprintListPage() {
  const sprints = await prisma.phase.findMany({
    include: { weeks: { include: { days: true } } },
    orderBy: { order: 'asc' }
  });

  return <SprintList sprints={sprints} />;
}
```

**Forms (Client Components):**

```typescript
// app/(dashboard)/issues/new/page.tsx (Client Component)
'use client';

const issueSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']),
  labels: z.array(z.string()).optional(),
});

function IssueCreateForm() {
  const form = useForm<z.infer<typeof issueSchema>>({
    resolver: zodResolver(issueSchema),
  });

  // Form implementation...
}
```

**Performance:**

- Server Component initial load: <1s
- Client Component hydration: <500ms
- API route response: <200ms
- Page transition: <300ms (App Router prefetching)

**Requirements Fulfilled:**

- FR-001 to FR-025: Sprint tracking UI
- FR-051 to FR-070: Issues UI
- FR-071 to FR-090: Knowledge UI
- FR-106 to FR-115: Wiki UI
- FR-116 to FR-120: Project health UI
- NFR-007: Web UI response time <1s

---

### 2.4 Container: PostgreSQL Database

**Technology Stack:**

- **Database:** PostgreSQL 15
- **ORM:** Prisma 5.7+
- **Extensions:**
  - `pgvector` - Vector similarity search (384 dimensions)
  - `pg_trgm` - Trigram-based full-text search (fuzzy matching)

**Database Schema (High-Level):**

```mermaid
erDiagram
    Phase ||--o{ Week : "has many"
    Week ||--o{ Day : "has many"
    Day ||--o{ Task : "has many"
    Task ||--o{ Session : "has many"

    Task ||--o{ Issue : "has many"
    Issue ||--o{ IssueComment : "has many"
    Issue }o--o{ Label : "has many"

    KnowledgeItem }o--o{ KnowledgeRelationship : "relates to"
    KnowledgeItem ||--o{ KnowledgeItemVersion : "has versions"

    Skill ||--o{ SkillUsage : "tracks usage"

    WikiPage ||--o{ WikiPageVersion : "has versions"

    HealthReport ||--o{ HealthReportItem : "contains items"

    AgentPersona ||--o{ PersonaActivation : "tracks activation"

    MarkdownFile }o--|| Task : "generated from"
    MarkdownFile }o--|| Phase : "generated from"

    ProjectOnboarding ||--o{ OnboardingSession : "has sessions"
    OnboardingSession }o--o{ OnboardingQuestion : "answers questions"

    Phase ||--o{ Ticket : "has tickets"
    Ticket ||--o{ TicketCheckpoint : "has checkpoints"
    Ticket }o--|| MemoryBank : "has snapshot"

    Project ||--o{ MemoryBank : "has memory banks"
    MemoryBank ||--o{ MemoryBankVersion : "has versions"
```

**Table Count:** 16 core tables + 8 junction/relation tables = 24 total

**Indexes:**

- B-tree indexes: Primary keys, foreign keys, frequently queried columns
- GIN indexes: tsvector full-text search columns
- HNSW indexes: pgvector embedding columns (384 dimensions)

**Performance Characteristics:**

- Query response time: <100ms (P95)
- Full-text search: <50ms (P95)
- Vector similarity search: <200ms (P95)
- Concurrent connections: 10 (low traffic, local development)

**Data Volume Estimates (1 year):**

| Table         | Estimated Rows | Storage                 |
| ------------- | -------------- | ----------------------- |
| Phase         | ~20            | <1MB                    |
| Week          | ~100           | <1MB                    |
| Day           | ~500           | <5MB                    |
| Task          | ~2,000         | ~10MB                   |
| Session       | ~5,000         | ~50MB                   |
| Issue         | ~1,000         | ~10MB                   |
| KnowledgeItem | ~500           | ~50MB (with embeddings) |
| WikiPage      | ~100           | ~20MB                   |
| HealthReport  | ~200           | ~10MB                   |
| **Total**     | ~10,000 rows   | ~150MB                  |

**Backup Strategy:**

- **Development:** Daily pg_dump
- **Production (future):** Continuous replication + daily snapshots

**Requirements Fulfilled:**

- FR-001 to FR-220: All data persistence (includes onboarding, tickets, memory banks)
- NFR-002: Database query time <100ms
- NFR-010: Data durability (ACID transactions)

**Design Decision:** See [ADR-002](architecture/ADRs/ADR-002-database-as-source-of-truth.md) for database as source of truth rationale.

---

## 3. Component Architecture

This section describes the internal component structure of each container, focusing on the 8 core features.

### 3.1 Feature: Sprint/Phase Tracking

**Purpose:** Hierarchical progress tracking (Phase → Week → Day → Task → Session)

**Components:**

```mermaid
C4Component
    title Component Diagram - Sprint/Phase Tracking

    Container_Boundary(mcp, "MCP Server") {
        Component(sprint_tools, "Sprint Tools", "TypeScript", "6 MCP tools<br/>getCurrentTask, create, update, complete, getProgress, archive")
        Component(sprint_service, "Sprint Service", "TypeScript", "Business logic<br/>Progress roll-up<br/>Validation")
        Component(sprint_repo, "Sprint Repository", "Prisma", "CRUD operations<br/>Phase, Week, Day, Task, Session tables")
    }

    Container_Boundary(web, "Next.js App") {
        Component(sprint_pages, "Sprint Pages", "React Server Components", "Sprint list, detail, edit pages")
        Component(sprint_forms, "Sprint Forms", "React Client Components", "Create/edit forms<br/>react-hook-form + Zod")
        Component(sprint_api, "Sprint API Routes", "Next.js API", "REST endpoints<br/>POST, PUT, DELETE")
    }

    ContainerDb(db, "PostgreSQL", "Prisma ORM", "Phase, Week, Day, Task, Session tables")

    Rel(sprint_tools, sprint_service, "Calls", "Business logic")
    Rel(sprint_service, sprint_repo, "Uses", "Data access")
    Rel(sprint_repo, db, "Queries", "Prisma Client")

    Rel(sprint_pages, db, "Fetches", "Server Components")
    Rel(sprint_forms, sprint_api, "Submits", "fetch API")
    Rel(sprint_api, sprint_service, "Calls", "Business logic")
```

**MCP Tools:**

1. **`sprint.getCurrentTask()`**
   - **Purpose:** Get current active task for agent to work on
   - **Input:** None
   - **Output:** Current Task with Session history, progress percentage
   - **Logic:** Find Task with status IN_PROGRESS, or return next pending Task
   - **Requirements:** FR-003 (Read current task)

2. **`sprint.create({ type, data })`**
   - **Purpose:** Create Phase/Week/Day/Task/Session entity
   - **Input:** Entity type and data (title, description, etc.)
   - **Output:** Created entity with ID, initialized progress (0.0)
   - **Logic:** Validate unique constraints, set defaults, insert to database
   - **Requirements:** FR-001 (Create hierarchy)

3. **`sprint.update({ type, id, progress?, status? })`**
   - **Purpose:** Update progress percentage or status
   - **Input:** Entity type, ID, new progress (0.0-1.0) or status
   - **Output:** Updated entity, auto-rolled-up parent progress
   - **Logic:** Validate progress range, calculate parent roll-up, trigger markdown sync
   - **Requirements:** FR-002 (Update progress)

4. **`sprint.complete({ type, id })`**
   - **Purpose:** Mark entity as 100% complete
   - **Input:** Entity type, ID
   - **Output:** Updated entity (progress=1.0, status=COMPLETED), parent roll-up
   - **Logic:** Set progress=1.0, status=COMPLETED, roll-up to parent, trigger markdown sync
   - **Requirements:** FR-004 (Complete task)

5. **`sprint.getProgress({ type, id? })`**
   - **Purpose:** Get progress tree (Phase → Week → Day → Task → Session)
   - **Input:** Entity type (optional: specific ID for subtree)
   - **Output:** Progress tree with percentages, status, timestamps
   - **Logic:** Recursive query to build tree, calculate roll-up percentages
   - **Requirements:** FR-005 (View progress tree)

6. **`sprint.archive({ type, id })`**
   - **Purpose:** Archive completed entity (move to archive/ folder)
   - **Input:** Entity type, ID
   - **Output:** Success confirmation, archived file path
   - **Logic:** Mark as archived (soft delete), move markdown files to archive/
   - **Requirements:** FR-025 (Archive completed work)

**Progress Roll-Up Algorithm:**

```typescript
// Recursive roll-up from Session → Task → Day → Week → Phase
function calculateProgress(entity: Phase | Week | Day | Task): number {
  if (entity.type === 'Session') {
    return entity.progress; // Leaf node
  }

  const children = getChildren(entity); // Week.days, Day.tasks, Task.sessions
  if (children.length === 0) return 0.0;

  const totalProgress = children.reduce((sum, child) => sum + calculateProgress(child), 0);

  return totalProgress / children.length; // Average
}
```

**Markdown Sync Trigger:**

- On progress update: Regenerate STATUS.md (current phase, last task completed)
- On task complete: Regenerate DEVELOPMENT_PLAN.md (update task status)
- On session create: Create `.agent/task/current-session-[timestamp].md`

**Requirements Fulfilled:** FR-001 to FR-025

---

### 3.2 Feature: Workflow Orchestration

**Purpose:** Enforce 5-step mandatory protocol and workflow state transitions

**Components:**

```mermaid
C4Component
    title Component Diagram - Workflow Orchestration

    Container_Boundary(mcp, "MCP Server") {
        Component(workflow_tools, "Workflow Tools", "TypeScript", "5 MCP tools<br/>validateStep, transitionState, checkPrerequisites, recordCheckpoint, getActiveWorkflow")
        Component(workflow_engine, "Workflow Engine", "TypeScript", "State machine<br/>Transition validation<br/>Prerequisite checks")
        Component(workflow_repo, "Workflow Repository", "Prisma", "WorkflowInstance, WorkflowStep tables")
    }

    Container_Boundary(web, "Next.js App") {
        Component(workflow_page, "Workflow Page", "React Server Components", "Standalone page for workflow management<br/>Active workflows<br/>Workflow history<br/>12 predefined templates<br/>Analytics dashboard")
    }

    ContainerDb(db, "PostgreSQL", "Prisma ORM", "WorkflowInstance, WorkflowStep tables")

    Rel(workflow_tools, workflow_engine, "Calls", "State machine")
    Rel(workflow_engine, workflow_repo, "Uses", "Data access")
    Rel(workflow_repo, db, "Queries", "Prisma Client")

    Rel(workflow_page, db, "Fetches", "Server Components")
```

**Workflow State Machine (5-Step Protocol):**

```mermaid
stateDiagram-v2
    [*] --> CHECK_STATUS: Agent starts session
    CHECK_STATUS --> CREATE_PLAN: Read STATUS.md, get current task
    CREATE_PLAN --> CREATE_TODOS: Plan approved by user
    CREATE_TODOS --> IMPLEMENT: Todos saved to app
    IMPLEMENT --> IMPLEMENT: Checkpoint every 15K tokens
    IMPLEMENT --> COMPLETE: Implementation done
    COMPLETE --> [*]: Commit & update STATUS.md

    CHECK_STATUS --> [*]: Error: No current task
    CREATE_PLAN --> [*]: Error: Plan rejected
    CREATE_TODOS --> [*]: Error: Validation failed
    IMPLEMENT --> [*]: Error: Prerequisite missing
```

**MCP Tools:**

1. **`workflow.validateStep({ workflowId, step })`**
   - **Purpose:** Validate current step prerequisites met
   - **Input:** Workflow ID, step name
   - **Output:** Validation result (pass/fail), missing prerequisites
   - **Logic:** Check step prerequisites (e.g., CREATE_PLAN requires STATUS.md read)
   - **Requirements:** FR-027 (Validate step)

2. **`workflow.transitionState({ workflowId, fromStep, toStep })`**
   - **Purpose:** Transition workflow to next step
   - **Input:** Workflow ID, from step, to step
   - **Output:** Updated workflow state, next step details
   - **Logic:** Validate transition allowed, update state, record timestamp
   - **Requirements:** FR-028 (State transition)

3. **`workflow.checkPrerequisites({ workflowId, step })`**
   - **Purpose:** Check all prerequisites for step
   - **Input:** Workflow ID, step name
   - **Output:** List of prerequisites (met/unmet), blocking issues
   - **Logic:** Query database for prerequisite entities (e.g., plan saved, todos created)
   - **Requirements:** FR-029 (Prerequisite check)

4. **`workflow.recordCheckpoint({ workflowId, tokenUsage, progress })`**
   - **Purpose:** Record checkpoint (every 15K tokens)
   - **Input:** Workflow ID, token usage, progress notes
   - **Output:** Checkpoint ID, auto-updated progress files
   - **Logic:** Create checkpoint record, trigger markdown sync, update session file
   - **Requirements:** FR-030 (Checkpoint recording)

5. **`workflow.getActiveWorkflow()`**
   - **Purpose:** Get current active workflow instance
   - **Input:** None
   - **Output:** Active workflow with current step, progress, validation status
   - **Logic:** Find workflow with status IN_PROGRESS, or return null
   - **Requirements:** FR-026 (Get active workflow)

**Prerequisite Rules:**

| Step         | Prerequisites                                | Validation                                 |
| ------------ | -------------------------------------------- | ------------------------------------------ |
| CHECK_STATUS | None                                         | Always valid (entry point)                 |
| CREATE_PLAN  | STATUS.md read, current task identified      | Validate task exists                       |
| CREATE_TODOS | Plan approved, plan saved to current-plan.md | Validate file exists                       |
| IMPLEMENT    | Todos created, git branch checked            | Validate todos non-empty, branch != master |
| COMPLETE     | All todos 100%, tests passed                 | Validate todo completion, test results     |

**Requirements Fulfilled:** FR-026 to FR-050

---

### 3.3 Feature: Issues Management

**Purpose:** Issue tracking with bulk creation, auto-tagging, and context injection

**Components:**

```mermaid
C4Component
    title Component Diagram - Issues Management

    Container_Boundary(mcp, "MCP Server") {
        Component(issues_tools, "Issues Tools", "TypeScript", "5 MCP tools<br/>create, bulkCreate, update, search, link")
        Component(issues_service, "Issues Service", "TypeScript", "Business logic<br/>Auto-tagging<br/>Context extraction")
        Component(issues_repo, "Issues Repository", "Prisma", "Issue, IssueComment, Label tables")
    }

    Container_Boundary(web, "Next.js App") {
        Component(issues_pages, "Issues Pages", "React Server Components", "Issue list, detail, kanban board")
        Component(issues_forms, "Issues Forms", "React Client Components", "Create/edit forms, comment forms")
        Component(issues_api, "Issues API Routes", "Next.js API", "REST endpoints for CRUD")
    }

    ContainerDb(db, "PostgreSQL", "Prisma ORM", "Issue, IssueComment, Label tables")

    Rel(issues_tools, issues_service, "Calls", "Business logic")
    Rel(issues_service, issues_repo, "Uses", "Data access")
    Rel(issues_repo, db, "Queries", "Prisma Client")

    Rel(issues_pages, db, "Fetches", "Server Components")
    Rel(issues_forms, issues_api, "Submits", "fetch API")
    Rel(issues_api, issues_service, "Calls", "Business logic")
```

**MCP Tools:**

1. **`issues.create({ title, description, priority, labels?, linkedFiles? })`**
   - **Purpose:** Create single issue
   - **Input:** Issue data (title, description, priority, optional labels and file links)
   - **Output:** Created issue with ID, auto-assigned labels
   - **Logic:** Validate title length (1-500 chars), auto-tag based on keywords, extract context from files
   - **Requirements:** FR-051 (Create issue)

2. **`issues.bulkCreate({ issues[] })`**
   - **Purpose:** Create 10-50 issues at once (e.g., from security scan results)
   - **Input:** Array of issue data
   - **Output:** Created issues with IDs, bulk auto-tagging applied
   - **Logic:** Batch insert, auto-tag all, deduplicate similar issues, link related issues
   - **Requirements:** FR-052 (Bulk create issues)

3. **`issues.update({ id, data })`**
   - **Purpose:** Update issue (status, priority, labels, description)
   - **Input:** Issue ID, update data
   - **Output:** Updated issue, change history recorded
   - **Logic:** Validate transitions (e.g., BLOCKED requires blockedBy), record change
   - **Requirements:** FR-053 (Update issue)

4. **`issues.search({ query, filters? })`**
   - **Purpose:** Search issues (full-text + filters)
   - **Input:** Search query, optional filters (status, priority, labels, assignee)
   - **Output:** Ranked issue list
   - **Logic:** PostgreSQL tsvector full-text search + filter clauses
   - **Requirements:** FR-054 (Search issues)

5. **`issues.link({ issueId, relatedIssueId, relationship })`**
   - **Purpose:** Link related issues (BLOCKS, BLOCKED_BY, RELATES_TO, DUPLICATES)
   - **Input:** Issue ID, related issue ID, relationship type
   - **Output:** Created link, auto-updated issue status (if blocking)
   - **Logic:** Create IssueRelationship record, update issue status if BLOCKED_BY
   - **Requirements:** FR-055 (Link issues)

**Auto-Tagging Rules:**

```typescript
// Auto-tag based on keywords in title/description
const autoTagRules = [
  { keywords: ['security', 'vulnerability', 'CVE', 'XSS', 'SQL injection'], label: 'security' },
  { keywords: ['bug', 'error', 'crash', 'exception', 'fail'], label: 'bug' },
  { keywords: ['feature', 'enhancement', 'new'], label: 'enhancement' },
  { keywords: ['performance', 'slow', 'optimization', 'latency'], label: 'performance' },
  { keywords: ['documentation', 'docs', 'readme'], label: 'docs' },
  { keywords: ['test', 'testing', 'coverage'], label: 'testing' },
  { keywords: ['debt', 'refactor', 'cleanup'], label: 'tech-debt' },
  { keywords: ['accessibility', 'a11y', 'WCAG'], label: 'accessibility' },
];
```

**Context Injection (linkedFiles):**

When creating issue with `linkedFiles` array:

```typescript
// Extract context from linked files
{
  title: "Fix authentication bug in login.tsx",
  description: "Users cannot log in with valid credentials",
  linkedFiles: ["src/app/login/page.tsx", "src/lib/auth.ts"],
  // System automatically extracts:
  context: {
    files: [
      { path: "src/app/login/page.tsx", lineRange: [45, 60], code: "..." },
      { path: "src/lib/auth.ts", lineRange: [120, 135], code: "..." }
    ],
    stackTrace: "...", // If provided
    errorMessage: "..." // If provided
  }
}
```

**Requirements Fulfilled:** FR-051 to FR-070

---

### 3.4 Feature: Knowledge Graph (Hybrid Search)

**Purpose:** Token-efficient knowledge retrieval with semantic + full-text + graph traversal

**Components:**

```mermaid
C4Component
    title Component Diagram - Knowledge Graph

    Container_Boundary(mcp, "MCP Server") {
        Component(knowledge_tools, "Knowledge Tools", "TypeScript", "5 MCP tools<br/>query, create, link, search, getRelated")
        Component(knowledge_service, "Knowledge Service", "TypeScript", "Hybrid search<br/>Graph traversal<br/>Embedding generation")
        Component(knowledge_repo, "Knowledge Repository", "Prisma", "KnowledgeItem, KnowledgeRelationship tables")
    }

    Container_Boundary(web, "Next.js App") {
        Component(knowledge_pages, "Knowledge Pages", "React Server Components", "Knowledge search, detail, graph view")
        Component(knowledge_forms, "Knowledge Forms", "React Client Components", "Create/edit forms, link creator")
    }

    ContainerDb(db, "PostgreSQL", "Prisma + pgvector", "KnowledgeItem (with embeddings), KnowledgeRelationship")

    System_Ext(embedding_api, "Embedding API", "OpenAI or local")

    Rel(knowledge_tools, knowledge_service, "Calls", "Business logic")
    Rel(knowledge_service, knowledge_repo, "Uses", "Data access")
    Rel(knowledge_repo, db, "Queries", "Prisma + pgvector")

    Rel(knowledge_service, embedding_api, "Generates embeddings", "REST API")

    Rel(knowledge_pages, db, "Fetches", "Server Components")
```

**MCP Tools:**

1. **`knowledge.query({ query, maxResults? })`**
   - **Purpose:** Hybrid search (semantic + full-text + graph traversal)
   - **Input:** Query string, optional max results (default: 5)
   - **Output:** Top-K results with scores, related items (2-hop traversal)
   - **Logic:** Hybrid ranking (0.7 _ semantic + 0.3 _ fulltext), then 2-hop graph traversal
   - **Requirements:** FR-071 (Query knowledge graph)

2. **`knowledge.create({ title, content, tags?, embedding? })`**
   - **Purpose:** Create knowledge item with auto-embedding
   - **Input:** Knowledge data (title, content, optional tags and pre-computed embedding)
   - **Output:** Created knowledge item with ID, generated embedding
   - **Logic:** Validate content length, generate embedding (if not provided), insert to database
   - **Requirements:** FR-072 (Create knowledge item)

3. **`knowledge.link({ fromId, toId, relationship })`**
   - **Purpose:** Link related knowledge items (REFERENCES, CONTRADICTS, EXTENDS, SUPERSEDES)
   - **Input:** From ID, to ID, relationship type
   - **Output:** Created relationship, updated graph structure
   - **Logic:** Create KnowledgeRelationship record, validate no cycles (except REFERENCES)
   - **Requirements:** FR-073 (Link knowledge items)

4. **`knowledge.search({ query, filters? })`**
   - **Purpose:** Full-text search only (no semantic, faster)
   - **Input:** Search query, optional filters (tags, dateRange)
   - **Output:** Ranked knowledge list (tsvector search)
   - **Logic:** PostgreSQL tsvector full-text search
   - **Requirements:** FR-074 (Search knowledge)

5. **`knowledge.getRelated({ id, maxDepth? })`**
   - **Purpose:** Get related knowledge items via graph traversal
   - **Input:** Knowledge item ID, optional max depth (default: 2)
   - **Output:** Related items with relationship types, traversal path
   - **Logic:** Recursive graph traversal, max 2 hops (configurable)
   - **Requirements:** FR-075 (Get related knowledge)

**Hybrid Search Algorithm:**

```typescript
// Step 1: Semantic search (pgvector)
const semanticResults = await db.$queryRaw`
  SELECT id, title, content,
         1 - (embedding <=> ${queryEmbedding}::vector) AS semantic_score
  FROM "KnowledgeItem"
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 10
`;

// Step 2: Full-text search (tsvector)
const fulltextResults = await db.knowledgeItem.findMany({
  where: {
    searchVector: { search: query }
  },
  select: { id: true, title: true, content: true },
  take: 10
});

// Step 3: Hybrid ranking (merge + rank)
const hybridResults = mergeAndRank(semanticResults, fulltextResults, {
  semanticWeight: 0.7,
  fulltextWeight: 0.3
}).slice(0, 5); // Top-5

// Step 4: Graph traversal (2-hop max)
const topResult = hybridResults[0];
const relatedItems = await traverseGraph(topResult.id, maxDepth: 2);

// Step 5: Return combined
return {
  results: hybridResults,  // Top-5 hybrid search results
  related: relatedItems    // 1-3 related items from graph
};
```

**Token Efficiency:**

| Approach                 | Token Cost       | Latency   |
| ------------------------ | ---------------- | --------- |
| Full graph traversal     | 10,000+ tokens   | 2-5s      |
| Semantic search only     | 600 tokens       | 200ms     |
| Full-text search only    | 400 tokens       | 50ms      |
| **Hybrid search (this)** | **1,200 tokens** | **200ms** |

**Token Reduction:** 88% reduction vs full graph traversal

**Requirements Fulfilled:** FR-071 to FR-090

**Design Decision:** See [ADR-003](architecture/ADRs/ADR-003-hybrid-knowledge-graph.md) for hybrid search rationale.

---

### 3.5 Feature: Skills (Framework Documentation)

**Purpose:** Token-efficient framework documentation loading (92% reduction)

**Components:**

```mermaid
C4Component
    title Component Diagram - Skills Management

    Container_Boundary(mcp, "MCP Server") {
        Component(skills_tools, "Skills Tools", "TypeScript", "4 MCP tools<br/>load, unload, search, getActive")
        Component(skills_service, "Skills Service", "TypeScript", "Skill loading<br/>Frontmatter parsing<br/>Usage tracking")
        Component(skills_repo, "Skills Repository", "Prisma", "Skill, SkillUsage tables")
    }

    Container_Boundary(web, "Next.js App") {
        Component(skills_pages, "Skills Pages", "React Server Components", "Skills library, usage stats")
        Component(skills_forms, "Skills Forms", "React Client Components", "Skill editor, activation toggle")
    }

    ContainerDb(db, "PostgreSQL", "Prisma ORM", "Skill, SkillUsage tables")

    System_Ext(filesystem, "File System", ".claude/skills/ folder")

    Rel(skills_tools, skills_service, "Calls", "Business logic")
    Rel(skills_service, skills_repo, "Uses", "Data access")
    Rel(skills_repo, db, "Queries", "Prisma Client")

    Rel(skills_service, filesystem, "Reads", "Markdown files")

    Rel(skills_pages, db, "Fetches", "Server Components")
```

**Skill File Format (Markdown with Frontmatter):**

```markdown
---
name: prisma-expert
keywords: [prisma, database, orm, query, migration]
framework: Prisma ORM
version: 5.7+
tokenCost: 220
fullDocTokenCost: 2500
---

# Prisma Expert Skill

[Expert guidance on Prisma ORM patterns...]
```

**MCP Tools:**

1. **`skills.load({ name })`**
   - **Purpose:** Load skill into agent context
   - **Input:** Skill name (e.g., "prisma-expert")
   - **Output:** Skill content, keywords, estimated token cost
   - **Logic:** Read skill file from `.claude/skills/`, parse frontmatter, record usage
   - **Requirements:** FR-091 (Load skill)

2. **`skills.unload({ name })`**
   - **Purpose:** Unload skill from agent context (free tokens)
   - **Input:** Skill name
   - **Output:** Success confirmation, tokens freed
   - **Logic:** Mark skill as inactive, record unload timestamp
   - **Requirements:** FR-092 (Unload skill)

3. **`skills.search({ keywords })`**
   - **Purpose:** Search skills by keywords
   - **Input:** Keywords array (e.g., ["database", "query"])
   - **Output:** Matching skills ranked by keyword overlap
   - **Logic:** Match keywords against skill frontmatter, rank by relevance
   - **Requirements:** FR-093 (Search skills)

4. **`skills.getActive()`**
   - **Purpose:** Get currently loaded skills
   - **Input:** None
   - **Output:** Active skills list with token costs
   - **Logic:** Query SkillUsage table for active skills
   - **Requirements:** FR-094 (Get active skills)

**Auto-Loading Rules:**

```typescript
// Agent mentions framework → Auto-suggest skill
const autoLoadRules = [
  { mention: ['prisma', 'database', 'orm'], skill: 'prisma-expert' },
  { mention: ['react', 'component', 'hooks'], skill: 'react-expert' },
  { mention: ['next.js', 'app router', 'server component'], skill: 'next-js-expert' },
  { mention: ['testing', 'jest', 'vitest'], skill: 'testing-patterns' },
  { mention: ['api', 'endpoint', 'validation'], skill: 'api-patterns' },
];
```

**Token Efficiency:**

| Approach                 | Token Cost   | Example                     |
| ------------------------ | ------------ | --------------------------- |
| Load full Prisma docs    | 2,500 tokens | Entire Prisma documentation |
| Load prisma-expert skill | 220 tokens   | Curated expert patterns     |
| **Token reduction**      | **92%**      | 220 vs 2,500                |

**Requirements Fulfilled:** FR-091 to FR-105

---

### 3.6 Feature: Wiki (Auto-Generated Documentation)

**Purpose:** Auto-generate wiki pages from code comments, keep in sync with code changes

**Components:**

```mermaid
C4Component
    title Component Diagram - Wiki

    Container_Boundary(mcp, "MCP Server") {
        Component(wiki_tools, "Wiki Tools", "TypeScript", "5 MCP tools<br/>generate, update, search, crossLink, getPage")
        Component(wiki_service, "Wiki Service", "TypeScript", "JSDoc parsing<br/>Markdown generation<br/>Cross-linking")
        Component(wiki_repo, "Wiki Repository", "Prisma", "WikiPage, WikiPageVersion tables")
    }

    Container_Boundary(web, "Next.js App") {
        Component(wiki_pages, "Wiki Pages", "React Server Components", "Wiki viewer, search, edit history")
        Component(wiki_editor, "Wiki Editor", "React Client Components", "Markdown editor (manual edits)")
    }

    ContainerDb(db, "PostgreSQL", "Prisma ORM", "WikiPage, WikiPageVersion tables")

    System_Ext(filesystem, "File System", "docs/ folder, code files")

    Rel(wiki_tools, wiki_service, "Calls", "Business logic")
    Rel(wiki_service, wiki_repo, "Uses", "Data access")
    Rel(wiki_repo, db, "Queries", "Prisma Client")

    Rel(wiki_service, filesystem, "Reads code<br/>Writes markdown", "Node.js fs")

    Rel(wiki_pages, db, "Fetches", "Server Components")
```

**MCP Tools:**

1. **`wiki.generate({ sourcePath, outputPath? })`**
   - **Purpose:** Generate wiki page from code comments (JSDoc, TypeDoc, TSDoc)
   - **Input:** Source file path (e.g., "src/lib/auth.ts"), optional output path
   - **Output:** Generated markdown file path, created WikiPage record
   - **Logic:** Parse JSDoc comments, extract types/functions/classes, generate markdown
   - **Requirements:** FR-106 (Generate wiki from code)

2. **`wiki.update({ pagePath })`**
   - **Purpose:** Update wiki page from latest code changes
   - **Input:** Wiki page path (e.g., "docs/api.md")
   - **Output:** Updated markdown, version history recorded
   - **Logic:** Re-parse source code, diff with current wiki, update changed sections
   - **Requirements:** FR-107 (Update wiki)

3. **`wiki.search({ query })`**
   - **Purpose:** Full-text search across wiki pages
   - **Input:** Search query
   - **Output:** Ranked wiki pages
   - **Logic:** PostgreSQL tsvector full-text search on wiki content
   - **Requirements:** FR-108 (Search wiki)

4. **`wiki.crossLink({ sourcePage, targetPages })`**
   - **Purpose:** Create cross-links between related wiki pages
   - **Input:** Source page, array of target pages
   - **Output:** Updated source page with cross-links, link records
   - **Logic:** Insert markdown links, record relationships
   - **Requirements:** FR-109 (Cross-link wiki pages)

5. **`wiki.getPage({ path })`**
   - **Purpose:** Get wiki page with version history
   - **Input:** Wiki page path
   - **Output:** Wiki page content, version history, related pages
   - **Logic:** Query WikiPage, include WikiPageVersion records
   - **Requirements:** FR-110 (Get wiki page)

**JSDoc Parsing Example:**

````typescript
// Input: src/lib/auth.ts
/**
 * Authenticates a user with email and password.
 *
 * @param email - User email address
 * @param password - User password (plaintext)
 * @returns Promise resolving to User object or null
 * @throws {AuthError} If authentication fails
 *
 * @example
 * const user = await authenticateUser('user@example.com', 'password');
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  // Implementation...
}

// Output: docs/api/auth.md
# Authentication API

## `authenticateUser(email, password)`

Authenticates a user with email and password.

**Parameters:**
- `email` (string): User email address
- `password` (string): User password (plaintext)

**Returns:** Promise<User | null>

**Throws:** AuthError if authentication fails

**Example:**
```typescript
const user = await authenticateUser('user@example.com', 'password');
````

````

**Auto-Update Trigger:**

- Git hook: post-commit → Scan changed files → Update related wiki pages
- MCP tool: Agent calls `wiki.update()` after code changes

**Requirements Fulfilled:** FR-106 to FR-115

---

### 3.7 Feature: Project Health Monitoring

**Purpose:** Auto-categorize tech debt, track remediation, prioritize by severity

**Components:**

```mermaid
C4Component
    title Component Diagram - Project Health

    Container_Boundary(mcp, "MCP Server") {
        Component(health_tools, "Health Tools", "TypeScript", "4 MCP tools<br/>createReport, categorize, track, getDashboard")
        Component(health_service, "Health Service", "TypeScript", "Auto-categorization<br/>Severity scoring<br/>Trend analysis")
        Component(health_repo, "Health Repository", "Prisma", "HealthReport, HealthReportItem tables")
    }

    Container_Boundary(web, "Next.js App") {
        Component(health_dashboard, "Health Dashboard", "React Server Components", "Health overview, trends, priority list")
        Component(health_charts, "Health Charts", "React Client Components", "Chart.js charts, trend graphs")
    }

    ContainerDb(db, "PostgreSQL", "Prisma ORM", "HealthReport, HealthReportItem tables")

    Rel(health_tools, health_service, "Calls", "Business logic")
    Rel(health_service, health_repo, "Uses", "Data access")
    Rel(health_repo, db, "Queries", "Prisma Client")

    Rel(health_dashboard, db, "Fetches", "Server Components")
    Rel(health_charts, health_dashboard, "Renders", "Props")
````

**MCP Tools:**

1. **`health.createReport({ title, items[] })`**
   - **Purpose:** Create health report (e.g., from security scan, code audit)
   - **Input:** Report title, array of health report items (each with title, description, severity)
   - **Output:** Created HealthReport with auto-categorized items
   - **Logic:** Auto-categorize items (security, quality, a11y, debt), score severity
   - **Requirements:** FR-116 (Create health report)

2. **`health.categorize({ itemId, category })`**
   - **Purpose:** Override auto-categorization (manual categorization)
   - **Input:** Health report item ID, category
   - **Output:** Updated item with new category
   - **Logic:** Update category, record manual override
   - **Requirements:** FR-117 (Categorize health item)

3. **`health.track({ itemId, status, notes? })`**
   - **Purpose:** Track remediation progress for health item
   - **Input:** Item ID, status (OPEN, IN_PROGRESS, RESOLVED, WONT_FIX), optional notes
   - **Output:** Updated item, history recorded
   - **Logic:** Update status, record timestamp, trigger dashboard refresh
   - **Requirements:** FR-118 (Track health item)

4. **`health.getDashboard()`**
   - **Purpose:** Get project health dashboard data
   - **Input:** None
   - **Output:** Health metrics (severity distribution, category counts, trends)
   - **Logic:** Aggregate query, calculate trends (last 30 days)
   - **Requirements:** FR-119 (Get health dashboard)

**Auto-Categorization Rules:**

```typescript
const categorizationRules = [
  {
    category: 'security',
    keywords: ['security', 'vulnerability', 'CVE', 'XSS', 'SQL injection', 'CSRF', 'auth'],
    severityBoost: +2, // Increase severity for security issues
  },
  {
    category: 'quality',
    keywords: ['quality', 'bug', 'error', 'crash', 'exception', 'fail', 'broken'],
  },
  {
    category: 'accessibility',
    keywords: ['accessibility', 'a11y', 'WCAG', 'ARIA', 'contrast', 'keyboard', 'screen reader'],
  },
  {
    category: 'tech-debt',
    keywords: ['debt', 'refactor', 'cleanup', 'deprecate', 'legacy', 'TODO', 'FIXME'],
  },
];
```

**Severity Scoring:**

```typescript
// Severity score: 0-10 (10 = critical)
function calculateSeverity(item: HealthReportItem): number {
  let score = 5; // Default

  // Keyword-based scoring
  if (item.description.match(/critical|severe|high/i)) score += 3;
  if (item.description.match(/CVE-\d{4}/)) score += 4; // Security CVE
  if (item.description.match(/medium/i)) score += 1;
  if (item.description.match(/low|minor/i)) score -= 1;

  // Category boost
  if (item.category === 'security') score += 2;
  if (item.category === 'accessibility') score += 1;

  return Math.min(Math.max(score, 0), 10); // Clamp 0-10
}
```

**Requirements Fulfilled:** FR-116 to FR-120

---

### 3.8 Feature: Agent Personas

**Purpose:** Define agent personas with autonomy levels and activation/deactivation

**Components:**

```mermaid
C4Component
    title Component Diagram - Agent Personas

    Container_Boundary(mcp, "MCP Server") {
        Component(personas_tools, "Personas Tools", "TypeScript", "4 MCP tools<br/>activate, deactivate, getActive, list")
        Component(personas_service, "Personas Service", "TypeScript", "Persona management<br/>Autonomy level enforcement")
        Component(personas_repo, "Personas Repository", "Prisma", "AgentPersona, PersonaActivation tables")
    }

    Container_Boundary(web, "Next.js App") {
        Component(personas_pages, "Personas Pages", "React Server Components", "Persona list, detail, activation history")
        Component(personas_forms, "Personas Forms", "React Client Components", "Create/edit forms, activation toggle")
    }

    ContainerDb(db, "PostgreSQL", "Prisma ORM", "AgentPersona, PersonaActivation tables")

    Rel(personas_tools, personas_service, "Calls", "Business logic")
    Rel(personas_service, personas_repo, "Uses", "Data access")
    Rel(personas_repo, db, "Queries", "Prisma Client")

    Rel(personas_pages, db, "Fetches", "Server Components")
```

**Autonomy Levels (see [ADR-005](architecture/ADRs/ADR-005-five-level-hierarchy.md)):**

| Level                  | Description         | Agent Can...                                        | Agent Cannot...                        |
| ---------------------- | ------------------- | --------------------------------------------------- | -------------------------------------- |
| 0 - Read-Only          | Query-only          | Read database, search, query                        | Create, update, delete anything        |
| 1 - Safe CRUD          | Basic operations    | Create issues, knowledge items, wiki pages          | Delete data, change workflow state     |
| 2 - Workflow Execution | Standard operations | Execute 5-step protocol, update progress            | Skip workflow steps, delete phases     |
| 3 - Autonomous         | Full automation     | Complete workflows, bulk operations, auto-decisions | Change autonomy level, delete personas |
| 4 - Admin              | Full control        | All CRUD, workflow overrides, persona management    | (No restrictions)                      |

**MCP Tools:**

1. **`personas.activate({ name })`**
   - **Purpose:** Activate agent persona (e.g., "senior-developer", "junior-assistant")
   - **Input:** Persona name
   - **Output:** Activated persona, autonomy level, allowed operations
   - **Logic:** Set persona as active, record activation timestamp, return autonomy config
   - **Requirements:** FR-121 (Activate persona)

2. **`personas.deactivate({ name })`**
   - **Purpose:** Deactivate agent persona
   - **Input:** Persona name
   - **Output:** Success confirmation, deactivation timestamp
   - **Logic:** Set persona as inactive, record deactivation timestamp
   - **Requirements:** FR-122 (Deactivate persona)

3. **`personas.getActive()`**
   - **Purpose:** Get currently active persona
   - **Input:** None
   - **Output:** Active persona with autonomy level, allowed operations
   - **Logic:** Query PersonaActivation table for active persona
   - **Requirements:** FR-123 (Get active persona)

4. **`personas.list()`**
   - **Purpose:** List all available personas
   - **Input:** None
   - **Output:** Persona list with names, descriptions, autonomy levels
   - **Logic:** Query AgentPersona table
   - **Requirements:** FR-124 (List personas)

**Default Personas:**

```typescript
const defaultPersonas = [
  {
    name: 'senior-developer',
    description: 'Experienced developer with full autonomy',
    autonomyLevel: 3,
    allowedOperations: ['*'], // All operations
  },
  {
    name: 'junior-assistant',
    description: 'Limited autonomy, requires approval for complex operations',
    autonomyLevel: 1,
    allowedOperations: ['read', 'create:issue', 'create:knowledge', 'search'],
  },
  {
    name: 'read-only-auditor',
    description: 'Read-only access for audit purposes',
    autonomyLevel: 0,
    allowedOperations: ['read', 'search', 'query'],
  },
];
```

**Requirements Fulfilled:** FR-121 to FR-125

---

### 3.9 Feature: Dashboard (Metrics & Activity Feed)

**Purpose:** Real-time metrics, activity feed, progress visualization for human monitoring

**Components:**

```mermaid
C4Component
    title Component Diagram - Dashboard

    Container_Boundary(web, "Next.js App") {
        Component(dashboard_page, "Dashboard Page", "React Server Component", "Main dashboard layout<br/>Fetch all metrics")
        Component(metrics_widgets, "Metrics Widgets", "React Client Components", "Progress chart, activity feed, health summary")
        Component(dashboard_api, "Dashboard API", "Next.js API Route", "Real-time metrics endpoint")
    }

    ContainerDb(db, "PostgreSQL", "Prisma ORM", "Aggregate queries")

    Rel(dashboard_page, db, "Fetches", "Server Component queries")
    Rel(metrics_widgets, dashboard_api, "Polls", "fetch API")
    Rel(dashboard_api, db, "Queries", "Aggregate metrics")
```

**Metrics Widgets:**

1. **Progress Overview**
   - Current phase progress (%)
   - Tasks completed today
   - Session count (last 7 days)
   - Velocity (tasks/day)

2. **Activity Feed**
   - Recent agent actions (last 20)
   - Timestamps, action type, details
   - Real-time updates (5s polling)

3. **Health Summary**
   - Open issues count
   - Security issues (P0 priority)
   - Tech debt count
   - Accessibility issues count

4. **Knowledge Graph Stats**
   - Total knowledge items
   - Most queried items (top 10)
   - Graph depth (max relationship chain)

5. **Skill Usage**
   - Most loaded skills (top 10)
   - Token savings (%)
   - Skill load/unload frequency

**MCP Tools:**

1. **`dashboard.getMetrics()`**
   - **Purpose:** Get all dashboard metrics in single call
   - **Input:** None
   - **Output:** Aggregated metrics (progress, health, activity, knowledge, skills)
   - **Logic:** Parallel queries, aggregate results, cache for 5 seconds
   - **Requirements:** FR-125 (Get dashboard metrics)

2. **`dashboard.getActivity({ limit? })`**
   - **Purpose:** Get recent agent activity feed
   - **Input:** Optional limit (default: 20)
   - **Output:** Activity feed with timestamps, action types, details
   - **Logic:** Query AgentAction table, order by timestamp DESC
   - **Requirements:** FR-126 (Get activity feed)

3. **`dashboard.getProgress({ type, id? })`**
   - **Purpose:** Get progress data for charts
   - **Input:** Entity type (phase, week, day), optional ID
   - **Output:** Progress time series (last 30 days)
   - **Logic:** Query Session.progress over time, return time series
   - **Requirements:** FR-127 (Get progress time series)

4. **`dashboard.export({ format })`**
   - **Purpose:** Export dashboard data (CSV, JSON)
   - **Input:** Format ('csv' | 'json')
   - **Output:** File download with all metrics
   - **Logic:** Fetch all metrics, format as CSV/JSON, return file
   - **Requirements:** FR-128 (Export dashboard)

**Real-Time Updates:**

- **Polling:** Dashboard polls `/api/dashboard/metrics` every 5 seconds
- **Server-Sent Events (Future):** Real-time push for activity feed
- **Cache:** Metrics cached for 5 seconds (reduce database load)

**Requirements Fulfilled:** FR-125 to FR-128

---

### 3.10 UI Layer Architecture (Sprint 0 - Pre-work Complete)

**NOTE:** This section documents the UI layer implemented in **Sprint 0** (October 25-28, 2025) as pre-work before the main backend implementation plan. The UI is **100% complete** and serves as the foundation for backend MCP tool integration in Sprints 1-8.

---

#### 3.10.1 Overview

**Status:** ✅ **COMPLETE** (Sprint 0)

**Purpose:** Provide human monitoring interface and manual CRUD operations (5% interaction)

**Architecture Pattern:** Next.js 14 App Router with Server/Client Component split

**Design System:** Static Coral theme with neumorphic design

**Key Characteristics:**

- **Agent-First:** UI is secondary to MCP tools (human monitoring only)
- **Static Theme:** Coral theme locked, no theme switching
- **Pixel-Perfect:** Implemented from HTML mockups
- **Modern Patterns:** useReducer, useOptimistic, IntersectionObserver
- **Performance:** ISR for wiki pages, Server Components by default

---

#### 3.10.2 Page Architecture

**Complete Pages (7 total):**

| Page                   | Path           | Type             | Data Fetching         | Description                                        |
| ---------------------- | -------------- | ---------------- | --------------------- | -------------------------------------------------- |
| **Dashboard**          | `/dashboard`   | Server Component | force-dynamic         | Stats, recent issues, quick actions, agent widgets |
| **Issues List**        | `/issues`      | Server Component | searchParams          | Filterable issue listing with pagination           |
| **Issue Detail**       | `/issues/[id]` | Server Component | params                | Full detail with 11 sub-components                 |
| **Knowledge Base**     | `/knowledge`   | Server Component | parallel queries      | Article listing with search and tags               |
| **Wiki**               | `/wiki/[slug]` | Server Component | ISR (1h revalidation) | Documentation with TOC and markdown                |
| **Security Dashboard** | `/security`    | Server Component | Promise.all queries   | Vulnerability tracking with score meter            |
| **Agent Personas**     | `/agents`      | Server Component | force-dynamic         | Agent management with toggle switches              |

**Page Patterns:**

```typescript
// Server Component Pattern (default)
export default async function Page({ params, searchParams }) {
  const data = await prisma.model.findMany({ where: {...} });
  return <ClientComponent data={data} />;
}

// ISR Pattern (Wiki pages)
export const revalidate = 3600; // 1 hour

export async function generateStaticParams() {
  const pages = await prisma.wikiPage.findMany({ select: { slug: true } });
  return pages.map(page => ({ slug: page.slug }));
}

// Force Dynamic Pattern (real-time data)
export const dynamic = 'force-dynamic';
```

---

#### 3.10.3 Component Library

**Layout Components (4 components):**

1. **FloatingBackground** - Animated hexagons and bubbles (auto-hides on mobile)
2. **Header** - Glass morphism with search bar and notifications
3. **Sidebar** - Neumorphic navigation with coral active states
4. **CommandPalette** - Cmd+K keyboard-driven search (useReducer state machine)

**Dashboard Components (5 components):**

1. **StatCard** - Icon gradient containers with large text-4xl numbers
2. **IssueCard** - Glass-dark issue preview cards
3. **WelcomeBanner** - Coral gradient with CTA button
4. **QuickActionsWidget** - Neumorphic action buttons
5. **AgentPersonasWidget** - Glass-dark agent cards with emoji icons

**Issues Components (14 components):**

**Main (5 components):**

- IssuesPageClient, FilterSidebar, SearchSortBar, IssueListCard, Pagination

**Detail Page (11 components):**

- IssueHeader, IssueActions, QuickActions, DescriptionSection, CodeSection
- CommentForm, CommentList, AttachmentList, RelatedIssues
- WatchersSection, SystemActivity, IssueDetailSidebar

**Knowledge Components (3 components):**

- ArticleCard (React.memo), TagFilter (useSearchParams), SearchBar (debounced)

**Wiki Components (4 components):**

- WikiSidebar, TableOfContents (IntersectionObserver), WikiContent (ReactMarkdown), CodeBlock (Prism)

**Security Components (3 components):**

- SecurityScoreMeter (animated SVG), VulnerabilityCard, VulnerabilityFilter

**Agent Components (1 component):**

- AgentCard (useOptimistic for toggle)

**UI Primitives (shadcn/ui):**

- avatar, badge, button, card, input, separator

---

#### 3.10.4 State Management Patterns

**No Global State Library** - Pages are self-contained

**State Management Strategies:**

| Pattern             | Use Case                   | Example                        |
| ------------------- | -------------------------- | ------------------------------ |
| **useReducer**      | Complex state machines     | Command Palette (10 actions)   |
| **useOptimistic**   | Instant feedback mutations | Agent toggle switches          |
| **useSearchParams** | URL-based filtering        | Issues filters, Knowledge tags |
| **useState**        | Simple component state     | Modal open/close, form inputs  |
| **Server State**    | Initial page data          | All Server Components          |

**State Machine Example (Command Palette):**

```typescript
// useReducer for complex state with predictable transitions
type State = {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  selectedIndex: number;
  entityType: EntityType;
  isLoading: boolean;
};

type Action =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SET_RESULTS'; results: SearchResult[] }
  | { type: 'MOVE_UP' }
  | { type: 'MOVE_DOWN' }
  | { type: 'SET_ENTITY_TYPE'; entityType: EntityType };

const [state, dispatch] = useReducer(commandPaletteReducer, initialState);
```

**Optimistic Updates Example (Agent Toggle):**

```typescript
// useOptimistic for instant feedback before server confirmation
const [optimisticAgents, setOptimisticAgents] = useOptimistic(
  agents,
  (state, { agentId, isActive }) =>
    state.map((agent) => (agent.id === agentId ? { ...agent, isActive } : agent))
);

const [isPending, startTransition] = useTransition();

async function handleToggle(agentId: string) {
  setOptimisticAgents({ agentId, isActive: !agent.isActive });
  startTransition(async () => {
    await toggleAgentStatus(agentId); // Server Action
  });
}
```

---

#### 3.10.5 Data Fetching Patterns

**Three Patterns Used:**

1. **Server Components** - Direct Prisma queries (default)
2. **API Routes** - Client-side fetching (Command Palette search)
3. **Server Actions** - Mutations with revalidatePath (Agent management)

**Pattern Selection:**

```typescript
// Pattern 1: Server Component (PREFERRED)
// Use for: Initial page load, SEO, performance
export default async function Page() {
  const issues = await prisma.issue.findMany();
  return <IssueList issues={issues} />;
}

// Pattern 2: API Route
// Use for: Client-side dynamic fetching, polling
export async function GET(request: Request) {
  const results = await searchAll(query);
  return Response.json({ results });
}

// Pattern 3: Server Action
// Use for: Mutations, form submissions
'use server';
export async function toggleAgentStatus(agentId: string) {
  await prisma.agentPersona.update({ where: { id: agentId }, data: {...} });
  revalidatePath('/agents');
}
```

**Performance Optimizations:**

- **ISR:** Wiki pages cached for 1 hour (fast + fresh)
- **Parallel Queries:** Promise.all for multiple data sources
- **Memoization:** React.memo for expensive list items
- **Debouncing:** 300ms delay for search inputs
- **IntersectionObserver:** Battery-efficient scroll spy (vs scroll listeners)

---

#### 3.10.6 Theme System

**Static Coral Theme** - Multi-theme system removed

**CSS Variable System:**

```css
/* Base Colors */
--dark: #1a1a1a;
--dark-card: #2a2a2a;
--coral: #ff8b6a;
--coral-light: #ffb299;
--coral-dark: #e67759;
--slate: #8b8b8b;

/* Shadows */
--shadow-dark: rgba(0, 0, 0, 0.6);
--shadow-coral-soft: rgba(255, 139, 106, 0.3);
--border-subtle: rgba(255, 255, 255, 0.05);
```

**Neumorphic Utility Classes:**

```css
.neu-raised     /* Raised card (8px/16px shadows) */
.neu-pressed    /* Inset/pressed effect */
.neu-flat       /* Minimal elevation (4px/8px shadows) */
.coral-gradient /* Coral gradient button */
.glass-dark     /* Dark glass morphism */
.icon-coral     /* Coral gradient icon container */
```

**Animation Classes:**

```css
.animate-float-hex      /* Hexagon floating animation */
.animate-float-bubble   /* Bubble floating animation */
.animate-heartbeat      /* Pulsing scale animation */
.animate-pulse-glow     /* Coral glow pulsing */
```

**Tailwind Extensions:**

```javascript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      dark: 'var(--dark)',
      coral: 'var(--coral)',
      // ... all CSS variables
    },
    boxShadow: {
      'neu-raised': '8px 8px 16px rgba(0, 0, 0, 0.6), -4px -4px 8px rgba(255, 255, 255, 0.05)',
      'coral-soft': '0 4px 16px rgba(255, 139, 106, 0.3)',
      // ... all neumorphic shadows
    }
  }
}
```

---

#### 3.10.7 API Routes

**6 API Routes Created (Sprint 0):**

| Route                           | Method   | Purpose                                  | Status      |
| ------------------------------- | -------- | ---------------------------------------- | ----------- |
| `/api/knowledge`                | GET      | Paginated articles with search/filtering | ✅ Complete |
| `/api/search`                   | GET      | Unified multi-entity search              | ✅ Complete |
| `/api/wiki/[slug]`              | GET      | Wiki page fetching                       | ✅ Complete |
| `/api/security/score`           | GET      | Security score calculation               | ✅ Complete |
| `/api/security/vulnerabilities` | GET      | Vulnerability listing                    | ✅ Complete |
| `/api/agents`                   | Implicit | Agent listing (via page)                 | ✅ Complete |

**API Pattern:**

```typescript
// Next.js App Router API Route
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  const results = await prisma.model.findMany({ where: {...} });

  return Response.json({
    data: results,
    meta: { page, limit, total, hasMore }
  });
}
```

---

#### 3.10.8 Server Actions

**1 Server Actions File Created (Sprint 0):**

**`/app/agents/actions.ts`:**

- `toggleAgentStatus(agentId)` - Toggle agent active status
- `createAgent(data)` - Create new agent persona
- `deleteAgent(agentId)` - Remove agent from database

**Server Action Pattern:**

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function toggleAgentStatus(agentId: string) {
  const agent = await prisma.agentPersona.findUnique({ where: { id: agentId } });

  await prisma.agentPersona.update({
    where: { id: agentId },
    data: { isActive: !agent.isActive },
  });

  revalidatePath('/agents');

  return { success: true };
}
```

---

#### 3.10.9 Hooks

**Custom Hooks Created:**

1. **useScrollSpy** (Sprint 0)
   - IntersectionObserver-based scroll detection
   - Returns active heading ID
   - Battery-efficient (no scroll listeners)

2. **useDebounce** (Pre-existing)
   - Debounce user input (300ms delay)
   - Used in SearchBar and CommandPalette

**Hook Pattern:**

```typescript
// useScrollSpy.ts
export function useScrollSpy(ids: string[], options?: IntersectionObserverInit) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px', ...options }
    );

    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}
```

---

#### 3.10.10 Technology Stack

**Frontend Framework:**

- Next.js 14.1.0 (App Router)
- React 18 (Server/Client Components)
- TypeScript 5.x (strict mode)

**Styling:**

- Tailwind CSS 3.4.x (custom utilities)
- CSS Variables (Coral theme system)
- shadcn/ui (base components)

**State Management:**

- React hooks (useState, useReducer, useOptimistic, useTransition)
- URL state (useSearchParams, useRouter)
- No global state library

**Data Fetching:**

- Prisma ORM (direct queries in Server Components)
- Next.js API Routes (client-side fetching)
- Server Actions (mutations with revalidatePath)

**UI Libraries:**

- Lucide React (icons)
- ReactMarkdown (markdown rendering)
- react-syntax-highlighter (code highlighting)
- date-fns (date formatting)

---

#### 3.10.11 Integration with Backend (Sprint 1-8)

**Current State:** UI layer complete, ready for backend integration

**Integration Points:**

1. **Sprint 1-2:** Phase/Week/Day/Task/Session models
   - UI: Dashboard already has stat cards and progress visualization
   - Backend: Implement MCP tools to populate these stats

2. **Sprint 3:** Workflow Orchestration
   - UI: Workflow page already exists (from Sprint 0)
   - Backend: Implement workflow MCP tools

3. **Sprint 4:** Issues Backend Integration
   - UI: ✅ 100% complete (all 14 components)
   - Backend: Wire UI to new MCP tools (`createIssue`, `bulkCreateIssues`, etc.)

4. **Sprint 5-6:** Knowledge & Skills
   - UI: Knowledge page complete with search
   - Backend: Implement hybrid search (pgvector + tsvector)

5. **Sprint 7:** Wiki & Health
   - UI: Both pages complete
   - Backend: Connect to MCP tools

---

#### 3.10.12 Quality Metrics

**Code Quality:**

- ✅ TypeScript strict mode (0 errors)
- ✅ Zero console errors
- ✅ Zero hydration errors
- ✅ Semantic HTML

**Performance:**

- ✅ Server Components by default (fast initial load)
- ✅ ISR for wiki pages (cached 1 hour)
- ✅ Debounced search (300ms delay)
- ✅ IntersectionObserver for scroll spy

**Accessibility:**

- ✅ Keyboard navigation functional
- ✅ Focus indicators visible
- ✅ Semantic HTML elements
- ✅ ARIA labels where needed

**Testing:**

- ⚠️ E2E tests (deferred to Sprint 8)
- ⚠️ Unit tests (deferred to Sprint 8)
- ✅ Manual testing complete

---

#### 3.10.13 Completion Documents

**Sprint 0 Documentation:**

- [WEEK_1_5_PHASE_1_COMPLETION.md](../archive/completions/2025-11/WEEK_1_5_PHASE_1_COMPLETION.md)
- [WEEK_1_5_PHASE_2_COMPLETION.md](../archive/completions/2025-11/WEEK_1_5_PHASE_2_COMPLETION.md)
- [COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md](../archive/completions/2025-11/COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md)
- [UI_COMPLETION_SUMMARY.md](../UI_COMPLETION_SUMMARY.md)

**Component Catalog:**

- See [.agent/system/component-patterns.md](.agent/system/component-patterns.md)

---

### 3.11 Sub-Agent Architecture

**Purpose**: Isolated agent threads for research tasks (EPIC-011)

**Components**:

- **explore-codebase**: Scans repo for patterns, returns summary (saves 20-30K tokens in main thread)
- **analyze-architecture**: Traces system flows across files, returns architectural insights
- **synthesize-docs**: Generates SOPs and updates .agent/ folder automatically
- **map-system**: Updates system documentation (database-schema.md, api-catalog.md, component-patterns.md)

**Invocation Pattern**:

```mermaid
sequenceDiagram
    participant Main as Main Agent
    participant SubAgent as Sub-Agent (Isolated Thread)
    participant Context as Context File

    Main->>Context: Write current-session.md
    Main->>SubAgent: Invoke with context file path
    SubAgent->>Context: Read current-session.md
    SubAgent->>SubAgent: Execute research task
    SubAgent->>Context: Write report file
    SubAgent->>Main: Return report path
    Main->>Context: Read report file
    Main->>Main: Use findings for implementation
```

**Token Efficiency**:

- Main thread cost: ~2K tokens (invocation + report reading)
- Sub-agent thread cost: 20-30K tokens (isolated, doesn't affect main)
- Total savings: 92% reduction vs direct research in main thread

---

### 3.12 Memory Bank Data Flows

**Purpose**: Token-efficient context retrieval (EPIC-010)

**Session Start Flow** (≤10K tokens):

```mermaid
sequenceDiagram
    participant Agent
    participant ProjectBrief as project-brief.md (3K)
    participant ActiveContext as active-context.md (1K)
    participant Progress as progress.md (2K)

    Agent->>ProjectBrief: Read project overview
    Agent->>ActiveContext: Read current work focus
    Agent->>Progress: Read completion status
    Note over Agent: Total: ~6-8K tokens
```

**Pattern Lookup Flow** (≤1K tokens):

```mermaid
sequenceDiagram
    participant Agent
    participant SystemPatterns as system-patterns.md

    Agent->>SystemPatterns: Grep for pattern name
    SystemPatterns-->>Agent: Return pattern section (500-1K tokens)
    Note over Agent: 93% reduction vs loading full docs
```

**Context Recovery Flow** (≤6K tokens):

```mermaid
sequenceDiagram
    participant Agent
    participant SessionFile as current-session-[timestamp].md (2K)
    participant TodosFile as current-todos.md (2K)
    participant Progress as progress.md (2K)

    Agent->>SessionFile: Read latest session state
    Agent->>TodosFile: Read task list with progress
    Agent->>Progress: Read phase completion
    Note over Agent: Total: ~6K tokens, resume work immediately
```

---

## 4. Data Flow Architecture

### 4.1 Agent Workflow (5-Step Protocol)

**Complete data flow for agent executing 5-step mandatory protocol:**

```mermaid
sequenceDiagram
    participant Agent as AI Agent
    participant MCP as MCP Server
    participant DB as PostgreSQL
    participant FS as File System

    Note over Agent,FS: STEP 1: Check Status
    Agent->>FS: Read STATUS.md (current phase, task)
    FS-->>Agent: Current task: "Implement Issue API"
    Agent->>MCP: sprint.getCurrentTask()
    MCP->>DB: SELECT * FROM Task WHERE status='IN_PROGRESS'
    DB-->>MCP: Task { id, title, description, progress }
    MCP-->>Agent: Current task details

    Note over Agent,FS: STEP 2: Create Plan
    Agent->>Agent: Generate implementation plan
    Agent->>User: Present plan for approval
    User->>Agent: Approve plan
    Agent->>FS: Write .agent/task/current-plan.md
    FS-->>Agent: Plan saved

    Note over Agent,FS: STEP 3: Create Todos
    Agent->>MCP: sprint.create({ type: 'todos', data: [...] })
    MCP->>DB: INSERT INTO Task (todos)
    DB-->>MCP: Created todos
    MCP->>FS: Trigger markdown sync (current-todos.md)
    FS-->>MCP: Markdown generated
    MCP-->>Agent: Todos created

    Note over Agent,FS: STEP 4: Implement (with checkpoints)
    loop Every 15K tokens
        Agent->>Agent: Code implementation
        Agent->>MCP: workflow.recordCheckpoint({ tokenUsage, progress })
        MCP->>DB: INSERT INTO Session (tokenUsage, progress)
        DB-->>MCP: Checkpoint recorded
        MCP->>FS: Update current-session.md
        FS-->>MCP: Session updated
        MCP-->>Agent: Checkpoint saved
    end

    Note over Agent,FS: STEP 5: Complete
    Agent->>MCP: sprint.complete({ type: 'task', id })
    MCP->>DB: UPDATE Task SET progress=1.0, status='COMPLETED'
    DB-->>MCP: Task completed
    MCP->>DB: UPDATE parent (Day, Week, Phase) progress
    DB-->>MCP: Progress rolled up
    MCP->>FS: Trigger markdown sync (STATUS.md, DEVELOPMENT_PLAN.md)
    FS-->>MCP: Markdown regenerated
    MCP-->>Agent: Task complete
    Agent->>Git: git add . && git commit -m "..."
    Git-->>Agent: Committed
```

**Key Data Flows:**

1. **Agent → File System:** Read STATUS.md, DEVELOPMENT_PLAN.md for context
2. **Agent → MCP Server:** Execute MCP tools (41 tools)
3. **MCP Server → Database:** CRUD operations (Prisma Client)
4. **Database → File System:** Auto-generate markdown (post-transaction hooks)
5. **Agent → Git:** Commit changes (not via MCP, direct shell commands)

**Requirements Fulfilled:** FR-026 to FR-050 (Workflow Orchestration)

---

### 4.2 Knowledge Query Workflow (Hybrid Search)

**Complete data flow for knowledge graph query with hybrid search:**

```mermaid
sequenceDiagram
    participant Agent as AI Agent
    participant MCP as MCP Server
    participant KnowledgeSvc as Knowledge Service
    participant DB as PostgreSQL
    participant EmbedAPI as Embedding API

    Agent->>MCP: knowledge.query({ query: "How does auth work?" })
    MCP->>KnowledgeSvc: query(query)

    Note over KnowledgeSvc,EmbedAPI: Step 1: Generate Query Embedding
    KnowledgeSvc->>EmbedAPI: Generate embedding for "How does auth work?"
    EmbedAPI-->>KnowledgeSvc: embedding [384 dimensions]

    Note over KnowledgeSvc,DB: Step 2: Semantic Search (pgvector)
    KnowledgeSvc->>DB: SELECT * WHERE embedding <=> query_embedding ORDER BY distance LIMIT 10
    DB-->>KnowledgeSvc: Top 10 semantic results

    Note over KnowledgeSvc,DB: Step 3: Full-Text Search (tsvector)
    KnowledgeSvc->>DB: SELECT * WHERE searchVector @@ to_tsquery('auth & work') LIMIT 10
    DB-->>KnowledgeSvc: Top 10 fulltext results

    Note over KnowledgeSvc: Step 4: Hybrid Ranking
    KnowledgeSvc->>KnowledgeSvc: Merge results, rank: 0.7*semantic + 0.3*fulltext
    KnowledgeSvc->>KnowledgeSvc: Get top 5 combined results

    Note over KnowledgeSvc,DB: Step 5: Graph Traversal (2-hop max)
    KnowledgeSvc->>DB: SELECT * FROM KnowledgeRelationship WHERE fromId=top_result.id (depth 1)
    DB-->>KnowledgeSvc: Related items (depth 1)
    KnowledgeSvc->>DB: SELECT * FROM KnowledgeRelationship WHERE fromId IN(...) (depth 2)
    DB-->>KnowledgeSvc: Related items (depth 2)

    KnowledgeSvc-->>MCP: { results: [5 items], related: [1-3 items] }
    MCP-->>Agent: Knowledge query response (6-8 items, ~1,200 tokens)
```

**Token Breakdown:**

| Component                                       | Tokens            |
| ----------------------------------------------- | ----------------- |
| Top 5 hybrid results (titles + summaries)       | ~800 tokens       |
| 1-3 related items (titles + relationship types) | ~400 tokens       |
| **Total**                                       | **~1,200 tokens** |

**Comparison:**

- Full graph traversal: 10,000+ tokens (88% reduction)
- Semantic search only: 600 tokens (but misses exact keywords)
- Full-text search only: 400 tokens (but misses semantic similarity)

**Requirements Fulfilled:** FR-071 to FR-090

**Design Decision:** See [ADR-003](architecture/ADRs/ADR-003-hybrid-knowledge-graph.md)

---

### 4.3 Markdown Sync Workflow

**Complete data flow for database → markdown file synchronization:**

```mermaid
sequenceDiagram
    participant Agent as AI Agent
    participant MCP as MCP Server
    participant DB as PostgreSQL
    participant SyncSvc as Markdown Sync Service
    participant FS as File System
    participant Git as Git (pre-commit hook)

    Note over Agent,Git: Agent updates progress
    Agent->>MCP: sprint.update({ type: 'task', id, progress: 0.5 })
    MCP->>DB: UPDATE Task SET progress=0.5
    DB-->>MCP: Task updated

    Note over DB,FS: Post-transaction hook triggers sync
    DB->>SyncSvc: Trigger markdown sync (Task updated)
    SyncSvc->>DB: Fetch updated Task with relationships
    DB-->>SyncSvc: Task { id, title, progress, parent: Day, ... }

    Note over SyncSvc: Generate STATUS.md
    SyncSvc->>SyncSvc: Render STATUS.md template
    SyncSvc->>FS: Write STATUS.md
    FS-->>SyncSvc: File written

    Note over SyncSvc: Generate DEVELOPMENT_PLAN.md
    SyncSvc->>SyncSvc: Render DEVELOPMENT_PLAN.md template
    SyncSvc->>FS: Write DEVELOPMENT_PLAN.md
    FS-->>SyncSvc: File written

    Note over SyncSvc: Generate .agent/task/current-todos.md
    SyncSvc->>SyncSvc: Render current-todos.md template
    SyncSvc->>FS: Write .agent/task/current-todos.md
    FS-->>SyncSvc: File written

    SyncSvc->>DB: INSERT INTO MarkdownFile (path, syncedAt)
    DB-->>SyncSvc: Sync recorded
    SyncSvc-->>DB: Sync complete

    Note over Agent,Git: Agent commits changes
    Agent->>Git: git add STATUS.md DEVELOPMENT_PLAN.md .agent/
    Git->>Git: Pre-commit hook: Validate markdown files have "Auto-generated" banner
    Git-->>Agent: Validation passed
    Agent->>Git: git commit -m "Update task progress"
    Git-->>Agent: Committed
```

**Markdown Templates:**

```typescript
// STATUS.md template
const statusTemplate = (phase: Phase) => `
<!-- Auto-generated from database. DO NOT EDIT MANUALLY. -->
# Project Status

**Current Phase:** ${phase.name} (${(phase.progress * 100).toFixed(1)}%)
**Last Updated:** ${new Date().toISOString()}

## Progress

- Phase ${phase.order}: ${phase.name} - ${(phase.progress * 100).toFixed(1)}%
  ${phase.weeks.map((week) => `- Week ${week.weekNumber}: ${week.name} - ${(week.progress * 100).toFixed(1)}%`).join('\n  ')}

## Last Task Completed

${phase.lastCompletedTask?.title ?? 'None'}
`;

// DEVELOPMENT_PLAN.md template
const developmentPlanTemplate = (phases: Phase[]) => `
<!-- Auto-generated from database. DO NOT EDIT MANUALLY. -->
# Development Plan

${phases
  .map(
    (phase) => `
## Phase ${phase.order}: ${phase.name}

**Progress:** ${(phase.progress * 100).toFixed(1)}%
**Estimated Hours:** ${phase.estimatedHours}

${phase.weeks
  .map(
    (week) => `
### Week ${week.weekNumber}: ${week.name}

${week.days
  .map(
    (day) => `
#### Day ${day.dayNumber}: ${day.name}

${day.tasks
  .map(
    (task) => `
- [${task.status === 'COMPLETED' ? 'x' : ' '}] ${task.title} (${(task.progress * 100).toFixed(1)}%)
`
  )
  .join('')}
`
  )
  .join('')}
`
  )
  .join('')}
`
  )
  .join('')}
`;
```

**Pre-Commit Hook Validation:**

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check if markdown files have "Auto-generated" banner
for file in STATUS.md DEVELOPMENT_PLAN.md .agent/task/current-todos.md; do
  if git diff --cached --name-only | grep -q "$file"; then
    if ! head -n 1 "$file" | grep -q "Auto-generated"; then
      echo "Error: $file missing 'Auto-generated' banner. Markdown files must be generated from database."
      exit 1
    fi
  fi
done
```

**Requirements Fulfilled:** FR-006 to FR-008 (Markdown sync)

**Design Decision:** See [ADR-002](architecture/ADRs/ADR-002-database-as-source-of-truth.md)

---

### 4.4 Issue Bulk Creation Workflow

**Complete data flow for agent creating 10-50 issues from audit results:**

```mermaid
sequenceDiagram
    participant Agent as AI Agent
    participant MCP as MCP Server
    participant IssuesSvc as Issues Service
    participant DB as PostgreSQL

    Note over Agent: Agent runs security scan
    Agent->>Agent: Parse scan results (15 vulnerabilities)

    Agent->>MCP: issues.bulkCreate({ issues: [15 items] })
    MCP->>IssuesSvc: bulkCreate(issues)

    Note over IssuesSvc: Step 1: Validate all issues
    IssuesSvc->>IssuesSvc: Validate title length (1-500 chars) × 15
    IssuesSvc->>IssuesSvc: Validate priority (P0-P3) × 15

    Note over IssuesSvc: Step 2: Auto-tag all issues
    IssuesSvc->>IssuesSvc: Match keywords → labels × 15
    IssuesSvc->>IssuesSvc: Extract security CVE IDs → tags × 15

    Note over IssuesSvc: Step 3: Deduplicate similar issues
    IssuesSvc->>DB: SELECT * FROM Issue WHERE title SIMILAR TO ...
    DB-->>IssuesSvc: Potential duplicates
    IssuesSvc->>IssuesSvc: Compare descriptions (fuzzy match)
    IssuesSvc->>IssuesSvc: Merge 2 duplicates → 13 unique issues

    Note over IssuesSvc: Step 4: Link related issues
    IssuesSvc->>IssuesSvc: Find related issues (same CVE, similar stack trace)
    IssuesSvc->>DB: INSERT INTO IssueRelationship × 5 links
    DB-->>IssuesSvc: Relationships created

    Note over IssuesSvc: Step 5: Batch insert
    IssuesSvc->>DB: INSERT INTO Issue × 13 (batch)
    DB-->>IssuesSvc: Issues created
    IssuesSvc->>DB: INSERT INTO Label × 13 (batch)
    DB-->>IssuesSvc: Labels created

    IssuesSvc-->>MCP: { created: 13, duplicates: 2, linked: 5 }
    MCP-->>Agent: Bulk create result
```

**Performance:**

- Bulk create 15 issues: <500ms (vs 1.5s for 15 individual creates)
- Auto-tagging: <10ms per issue
- Deduplication: <100ms (fuzzy matching)
- Total: <600ms for 15 issues

**Requirements Fulfilled:** FR-052 (Bulk create issues)

---

## 5. Deployment Architecture

### 5.1 Local Development Architecture

**ProjectPulse is designed for local-first development ($0 budget constraint):**

```mermaid
C4Deployment
    title Deployment Architecture - Local Development

    Deployment_Node(laptop, "Developer Laptop", "Windows/macOS/Linux") {
        Deployment_Node(docker, "Docker Desktop", "Docker 24+") {
            Container(postgres, "PostgreSQL", "PostgreSQL 15 container", "Port 5432")
        }

        Deployment_Node(node, "Node.js 20+", "Runtime") {
            Container(mcp_server, "MCP Server", "Node.js process", "stdio transport")
            Container(web_app, "Next.js App", "Node.js process", "Port 3000")
        }

        Deployment_Node(filesystem, "File System", "Local disk") {
            Container(markdown, "Markdown Files", "STATUS.md, DEVELOPMENT_PLAN.md, .agent/")
            Container(git, "Git Repository", ".git/ folder")
        }
    }

    Deployment_Node(ai_agent, "AI Agent Process", "Claude Code, Cursor AI") {
        Container(agent, "AI Agent", "MCP client", "stdio to MCP Server")
    }

    Rel(agent, mcp_server, "stdio", "MCP protocol")
    Rel(agent, markdown, "Reads context", "Node.js fs")
    Rel(mcp_server, postgres, "TCP 5432", "Prisma Client")
    Rel(web_app, postgres, "TCP 5432", "Prisma Client")
    Rel(mcp_server, markdown, "Auto-generates", "Node.js fs")
    Rel(agent, git, "git commands", "shell")
```

**Environment Configuration:**

```bash
# .env.local
DATABASE_URL="postgresql://projectpulse:devpassword@localhost:5432/projectpulse"
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Optional: Embedding API (for semantic search)
OPENAI_API_KEY="sk-..." # or leave blank for local embeddings
```

**Docker Compose:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  projectpulse-db:
    image: postgres:15
    container_name: projectpulse-db
    environment:
      POSTGRES_USER: projectpulse
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: projectpulse
    ports:
      - '5432:5432'
    volumes:
      - projectpulse_db_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  projectpulse_db_data:
```

**Startup Commands:**

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Run Prisma migrations
pnpm prisma migrate dev

# 3. Start MCP Server (runs automatically when agent connects)
# No manual start needed - agent launches via stdio

# 4. Start Next.js App
pnpm dev # http://localhost:3000
```

**Requirements Fulfilled:** NFR-006 (Development environment setup)

---

### 5.2 Production Architecture (Future)

**When moving to production (multi-user, cloud deployment):**

```mermaid
C4Deployment
    title Deployment Architecture - Production (Future)

    Deployment_Node(cloud, "Cloud Provider (Vercel/Railway/Render)") {
        Deployment_Node(vercel, "Vercel", "Serverless") {
            Container(web_app, "Next.js App", "Serverless functions")
        }

        Deployment_Node(railway, "Railway", "Container hosting") {
            Container(mcp_server, "MCP Server", "Node.js container", "WebSocket transport")
        }

        Deployment_Node(db_host, "Database Host (Railway/Supabase)") {
            ContainerDb(postgres, "PostgreSQL", "Managed PostgreSQL 15")
        }
    }

    Deployment_Node(cdn, "CDN (Vercel Edge)") {
        Container(static, "Static Assets", "JS, CSS, images")
    }

    Deployment_Node(agents, "AI Agents (Multiple Users)") {
        Container(agent1, "Agent 1", "User 1")
        Container(agent2, "Agent 2", "User 2")
        Container(agentN, "Agent N", "User N")
    }

    Rel(agent1, mcp_server, "WebSocket", "MCP protocol")
    Rel(agent2, mcp_server, "WebSocket", "MCP protocol")
    Rel(agentN, mcp_server, "WebSocket", "MCP protocol")

    Rel(mcp_server, postgres, "TCP", "Prisma Client")
    Rel(web_app, postgres, "TCP", "Prisma Client")
    Rel(web_app, cdn, "Fetches", "Static assets")
```

**Changes from Local:**

1. **MCP Server Transport:** stdio → WebSocket (multi-user support)
2. **Next.js Deployment:** Vercel (serverless functions)
3. **Database:** Managed PostgreSQL (Railway, Supabase, or AWS RDS)
4. **Authentication:** Add user accounts, JWT tokens, MCP auth
5. **Multi-tenancy:** Workspace isolation, user permissions

**Estimated Costs (100 users):**

| Service                  | Provider      | Cost/Month         |
| ------------------------ | ------------- | ------------------ |
| Next.js Hosting          | Vercel Pro    | $20                |
| MCP Server               | Railway Hobby | $5                 |
| PostgreSQL               | Railway Hobby | $5                 |
| Embedding API (optional) | OpenAI        | ~$10 (usage-based) |
| **Total**                |               | **$40/month**      |

**Note:** Production deployment is out of scope for MVP (agent-first, local-only).

---

## 6. Cross-Cutting Concerns

### 6.1 Security

**Threat Model:**

| Threat                            | Mitigation                                      | Requirements                  |
| --------------------------------- | ----------------------------------------------- | ----------------------------- |
| SQL Injection                     | Prisma ORM (parameterized queries)              | NFR-015 (Input validation)    |
| XSS (Cross-Site Scripting)        | React auto-escaping, Content Security Policy    | NFR-016 (Output encoding)     |
| CSRF (Cross-Site Request Forgery) | SameSite cookies, CSRF tokens                   | NFR-017 (CSRF protection)     |
| Unauthorized MCP Access           | stdio transport (local only, no network)        | NFR-018 (MCP security)        |
| Markdown Injection                | Validate auto-generated files (pre-commit hook) | NFR-019 (Markdown validation) |
| Prototype Pollution               | TypeScript strict mode, Zod validation          | NFR-015 (Input validation)    |

**Authentication & Authorization (Future):**

- **Current (MVP):** No authentication (local-only, single user)
- **Future (Production):**
  - User authentication: JWT tokens
  - MCP authentication: Bearer token in MCP transport
  - Role-based access control (RBAC): Admin, Developer, Read-Only
  - Workspace isolation: Users can only access their workspace data

**Secrets Management:**

- **Development:** `.env.local` (git-ignored)
- **Production (Future):** Environment variables (Vercel/Railway secrets)

**Requirements Fulfilled:** NFR-015 to NFR-019

---

### 6.2 Validation

**Input Validation Strategy:**

All user/agent inputs validated using **Zod schemas** before database operations.

**Zod Schemas (Examples):**

```typescript
// Sprint/Phase validation
const phaseCreateSchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    order: z.number().int().positive(),
    startDate: z.date(),
    endDate: z.date(),
    estimatedHours: z.number().positive(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
  });

// Issue validation
const issueCreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']),
  labels: z.array(z.string().max(50)).max(10).optional(),
  linkedFiles: z.array(z.string().max(500)).max(20).optional(),
});

// Knowledge item validation
const knowledgeItemCreateSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(10).max(50000),
  tags: z.array(z.string().max(50)).max(20).optional(),
  embedding: z.array(z.number()).length(384).optional(), // pgvector 384 dimensions
});
```

**Validation Error Responses:**

```typescript
// Standardized Zod error formatting
try {
  const validatedData = issueCreateSchema.parse(input);
} catch (error) {
  if (error instanceof z.ZodError) {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Input validation failed',
      details: error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      suggestion: 'Check input fields and try again',
    };
  }
}
```

**Requirements Fulfilled:** NFR-015 (Input validation), NFR-020 (Error handling)

---

### 6.3 Observability

**Logging Strategy:**

```typescript
// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

// Log MCP tool calls
logger.info('MCP tool called', {
  tool: 'sprint.update',
  input: { type: 'task', id: 123, progress: 0.5 },
  timestamp: new Date().toISOString(),
});
```

**Metrics (Future - Prometheus):**

```typescript
// Example metrics
const mcpToolCallsTotal = new Counter({
  name: 'mcp_tool_calls_total',
  help: 'Total number of MCP tool calls',
  labelNames: ['tool', 'status'],
});

const mcpToolDurationSeconds = new Histogram({
  name: 'mcp_tool_duration_seconds',
  help: 'MCP tool execution duration',
  labelNames: ['tool'],
});
```

**Telemetry Fields (AgentAction table):**

```typescript
// Captured for every agent action
{
  actionType: 'MCP_TOOL_CALL',
  toolName: 'sprint.update',
  inputData: { /* sanitized input */ },
  outputData: { /* sanitized output */ },
  duration: 123, // milliseconds
  tokenUsage: 1500,
  timestamp: new Date(),
  agentId: 'claude-code-session-123'
}
```

**Requirements Fulfilled:** NFR-021 to NFR-023 (Logging, monitoring, telemetry)

---

### 6.4 Performance

**Performance Targets:**

| Operation                | Target | P95   | P99   |
| ------------------------ | ------ | ----- | ----- |
| MCP tool call            | <200ms | 150ms | 300ms |
| Database query           | <100ms | 80ms  | 150ms |
| Full-text search         | <50ms  | 40ms  | 80ms  |
| Vector similarity search | <200ms | 180ms | 350ms |
| Web UI page load         | <1s    | 800ms | 1.5s  |
| API endpoint response    | <200ms | 150ms | 300ms |

**Optimization Strategies:**

1. **Database:**
   - Indexes on foreign keys, frequently queried columns
   - GIN indexes for tsvector (full-text search)
   - HNSW indexes for pgvector (semantic search)
   - Connection pooling (Prisma default: 10 connections)

2. **Caching:**
   - Dashboard metrics: 5-second cache (reduce DB load)
   - Knowledge embeddings: Cache for 1 hour (reduce API calls)
   - Skills: Load once, cache until unload

3. **Next.js:**
   - Server Components for static data
   - Client Components for interactive UI only
   - App Router automatic prefetching
   - Image optimization (next/image)

**Requirements Fulfilled:** NFR-001 to NFR-005 (Performance targets)

---

### 6.5 Cost Controls

**Token Cost Monitoring:**

```typescript
// Track token usage per operation
async function trackTokenUsage(operation: string, tokenCost: number) {
  await prisma.agentAction.create({
    data: {
      actionType: 'TOKEN_USAGE',
      toolName: operation,
      tokenUsage: tokenCost,
      timestamp: new Date(),
    },
  });

  // Alert if approaching budget
  const monthlyUsage = await getMonthlyTokenUsage();
  if (monthlyUsage > 180000) {
    // 90% of 200K budget
    logger.warn('Token usage approaching budget', { monthlyUsage });
  }
}
```

**Embedding API Cost (OpenAI):**

- Cost: $0.02 / 1M tokens
- Knowledge creation rate: ~100 items/month
- Average content length: 2,000 tokens/item
- Monthly cost: (100 × 2,000 / 1,000,000) × $0.02 = **$0.004** (negligible)

**Database Storage Cost:**

- PostgreSQL 15: Free (Docker local)
- Production (Railway Hobby): $5/month (5GB storage, sufficient for 1 year)

**Requirements Fulfilled:** NFR-024 (Cost monitoring), NFR-025 (Budget alerts)

---

## 7. Integration Points

### 7.1 MCP Protocol Integration

**MCP Protocol Version:** 1.0 (Model Context Protocol)

**Transport:**

- **Development:** stdio (standard input/output)
- **Production (Future):** WebSocket (multi-user support)

**Message Format (JSON-RPC 2.0):**

```json
// Request
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "sprint.update",
    "arguments": {
      "type": "task",
      "id": 123,
      "progress": 0.5
    }
  }
}

// Response (success)
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Task updated successfully. Progress: 50%"
      }
    ]
  }
}

// Response (error)
{
  "jsonrpc": "2.0",
  "id": "1",
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "code": "VALIDATION_ERROR",
      "details": "Progress must be between 0.0 and 1.0"
    }
  }
}
```

**Agent Configuration (Claude Code example):**

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "projectpulse": {
      "command": "node",
      "args": ["F:/Web_Projects/AI_HUB/mcp-server/build/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://moksha:devpassword@localhost:5432/moksha_devhub"
      }
    }
  }
}
```

**Requirements Fulfilled:** FR-026 to FR-125 (All MCP tool operations)

**Design Decision:** See [ADR-004](architecture/ADRs/ADR-004-single-mcp-server.md) for single MCP server rationale.

---

### 7.2 Git Hooks Integration

**Pre-Commit Hook:**

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running pre-commit validation..."

# 1. Validate markdown files are auto-generated
for file in STATUS.md DEVELOPMENT_PLAN.md .agent/task/current-todos.md; do
  if git diff --cached --name-only | grep -q "$file"; then
    if ! head -n 1 "$file" | grep -q "Auto-generated"; then
      echo "❌ Error: $file missing 'Auto-generated' banner"
      echo "Markdown files must be generated from database, not manually edited"
      exit 1
    fi
  fi
done

# 2. Run linter (ESLint)
npm run lint --quiet
if [ $? -ne 0 ]; then
  echo "❌ ESLint failed. Fix linting errors before committing."
  exit 1
fi

# 3. Run type check (TypeScript)
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript type check failed. Fix type errors before committing."
  exit 1
fi

echo "✅ Pre-commit validation passed"
exit 0
```

**Post-Commit Hook (Markdown Sync Fail-Safe):**

```bash
#!/bin/bash
# .git/hooks/post-commit

# Check if STATUS.md was manually edited (bypass pre-commit)
if git diff HEAD~1 STATUS.md | grep -q "^-<!-- Auto-generated"; then
  echo "⚠️ Warning: STATUS.md was manually edited"
  echo "Triggering markdown sync to restore database consistency..."

  # Trigger markdown sync via MCP tool
  node -e "const { syncMarkdown } = require('./scripts/sync-markdown.js'); syncMarkdown();"

  echo "✅ Markdown sync complete"
fi
```

**Requirements Fulfilled:** FR-027 (Validation), FR-006 to FR-008 (Markdown sync)

**Design Decision:** See [ADR-002](architecture/ADRs/ADR-002-database-as-source-of-truth.md) for markdown validation rationale.

---

### 7.3 Markdown Sync Triggers

**Automatic Markdown Sync Events:**

| Event                 | Trigger                          | Files Regenerated                                |
| --------------------- | -------------------------------- | ------------------------------------------------ |
| Task progress updated | sprint.update()                  | STATUS.md, DEVELOPMENT_PLAN.md, current-todos.md |
| Task completed        | sprint.complete()                | STATUS.md, DEVELOPMENT_PLAN.md                   |
| Checkpoint recorded   | workflow.recordCheckpoint()      | current-session-[timestamp].md                   |
| Session created       | Session.create()                 | current-session-[timestamp].md                   |
| Phase changed         | sprint.update({ type: 'phase' }) | STATUS.md                                        |

**Sync Implementation:**

```typescript
// Prisma middleware: Auto-trigger markdown sync
prisma.$use(async (params, next) => {
  const result = await next(params);

  // Trigger sync for certain operations
  if (params.model === 'Task' && params.action === 'update') {
    await syncMarkdownFiles(['STATUS.md', 'DEVELOPMENT_PLAN.md', 'current-todos.md']);
  }

  return result;
});

// Sync function
async function syncMarkdownFiles(files: string[]) {
  for (const file of files) {
    const template = getTemplate(file);
    const data = await fetchDataForTemplate(file);
    const content = renderTemplate(template, data);
    await fs.writeFile(file, content, 'utf-8');

    // Record sync
    await prisma.markdownFile.upsert({
      where: { path: file },
      create: { path: file, content, syncedAt: new Date() },
      update: { content, syncedAt: new Date() },
    });
  }
}
```

**Requirements Fulfilled:** FR-006 to FR-008 (Markdown sync), FR-030 (Checkpoint recording)

---

## 8. Sequence Diagrams

### 8.1 5-Step Mandatory Protocol (Complete Sequence)

**End-to-end sequence diagram for agent executing complete workflow:**

```mermaid
sequenceDiagram
    participant User
    participant Agent as AI Agent
    participant MCP as MCP Server
    participant WorkflowEngine as Workflow Engine
    participant DB as PostgreSQL
    participant FS as File System
    participant Git

    Note over User,Git: Session Start
    User->>Agent: "Implement Issue API feature"

    Note over Agent,FS: STEP 1: Check Status
    Agent->>FS: Read STATUS.md
    FS-->>Agent: "Current Phase: Phase 3 Week 2 Day 4"
    Agent->>MCP: sprint.getCurrentTask()
    MCP->>DB: SELECT Task WHERE status='IN_PROGRESS'
    DB-->>MCP: Task { id: 123, title: "Implement Issue API" }
    MCP-->>Agent: Current task details

    Note over Agent,User: STEP 2: Create Plan
    Agent->>Agent: Generate implementation plan
    Agent->>User: "Here's the plan: 1) Create Prisma schema, 2) Create API routes, 3) Add validation..."
    User->>Agent: "Approved!"
    Agent->>MCP: workflow.validateStep({ step: 'CREATE_PLAN' })
    MCP->>WorkflowEngine: Validate prerequisites (STATUS.md read ✅)
    WorkflowEngine-->>MCP: Validation passed
    MCP-->>Agent: Step validated
    Agent->>FS: Write .agent/task/current-plan.md
    FS-->>Agent: Plan saved

    Note over Agent,DB: STEP 3: Create Todos
    Agent->>MCP: sprint.create({ type: 'todos', data: [...15 todos...] })
    MCP->>DB: BEGIN TRANSACTION
    MCP->>DB: INSERT INTO Task (todos) × 15
    DB-->>MCP: Todos created
    MCP->>DB: COMMIT TRANSACTION
    MCP->>FS: Trigger markdown sync (current-todos.md)
    FS-->>MCP: Markdown generated
    MCP-->>Agent: Todos created

    Note over Agent,Git: STEP 4: Implement (with checkpoints)
    loop Every 15K tokens
        Agent->>Agent: Code implementation (~15K tokens worth)
        Agent->>MCP: workflow.recordCheckpoint({ tokenUsage: 15000, progress: 'Completed 3/15 todos' })
        MCP->>DB: INSERT INTO Session (tokenUsage, progress)
        DB-->>MCP: Checkpoint recorded
        MCP->>FS: Update current-session-[timestamp].md
        FS-->>MCP: Session updated
        MCP-->>Agent: Checkpoint saved
    end

    Note over Agent,Git: STEP 5: Complete
    Agent->>MCP: sprint.complete({ type: 'task', id: 123 })
    MCP->>DB: UPDATE Task SET progress=1.0, status='COMPLETED'
    DB-->>MCP: Task completed
    MCP->>DB: UPDATE parent (Day, Week, Phase) progress (roll-up)
    DB-->>MCP: Progress rolled up
    MCP->>FS: Trigger markdown sync (STATUS.md, DEVELOPMENT_PLAN.md)
    FS-->>MCP: Markdown regenerated
    MCP-->>Agent: Task complete

    Agent->>Git: git add .
    Agent->>Git: git commit -m "feat: implement Issue API"
    Git->>Git: Pre-commit hook validation
    Git-->>Agent: Validation passed
    Git->>Git: Commit created
    Agent->>User: "Task complete! Issue API implemented and tested."
```

**Duration:** ~2-4 hours (typical task with 3-4 checkpoints)

**Requirements Fulfilled:** FR-026 to FR-050 (Workflow Orchestration)

---

### 8.2 Checkpoint Recording (15K Tokens)

**Detailed sequence for recording checkpoint every 15K tokens:**

```mermaid
sequenceDiagram
    participant Agent as AI Agent
    participant MCP as MCP Server
    participant WorkflowSvc as Workflow Service
    participant DB as PostgreSQL
    participant SyncSvc as Markdown Sync Service
    participant FS as File System

    Note over Agent: Agent reaches 15K tokens
    Agent->>Agent: Check token usage: 15,000 tokens

    Agent->>MCP: workflow.recordCheckpoint({ workflowId, tokenUsage: 15000, progress: "Completed 3/15 todos" })
    MCP->>WorkflowSvc: recordCheckpoint(data)

    Note over WorkflowSvc,DB: Step 1: Create checkpoint record
    WorkflowSvc->>DB: INSERT INTO Session (tokenUsage, progress, timestamp)
    DB-->>WorkflowSvc: Session { id, tokenUsage, progress, createdAt }

    Note over WorkflowSvc,DB: Step 2: Update task progress
    WorkflowSvc->>DB: UPDATE Task SET progress=0.2 (3/15 todos)
    DB-->>WorkflowSvc: Task updated

    Note over WorkflowSvc,SyncSvc: Step 3: Trigger markdown sync
    WorkflowSvc->>SyncSvc: Sync markdown files
    SyncSvc->>DB: Fetch Task with relationships
    DB-->>SyncSvc: Task { ..., parent: Day { ..., parent: Week { ... } } }

    SyncSvc->>SyncSvc: Render current-session-[timestamp].md template
    SyncSvc->>FS: Write current-session-[timestamp].md
    FS-->>SyncSvc: File written

    SyncSvc->>SyncSvc: Render current-todos.md template
    SyncSvc->>FS: Write current-todos.md
    FS-->>SyncSvc: File written

    SyncSvc->>DB: INSERT INTO MarkdownFile (path, syncedAt) × 2
    DB-->>SyncSvc: Sync recorded
    SyncSvc-->>WorkflowSvc: Sync complete

    WorkflowSvc-->>MCP: Checkpoint saved
    MCP-->>Agent: { checkpointId, filesUpdated: [...] }

    Note over Agent: Continue implementation
```

**Performance:** <100ms per checkpoint

**Requirements Fulfilled:** FR-030 (Checkpoint recording), FR-006 to FR-008 (Markdown sync)

---

### 8.3 Knowledge Query with Hybrid Search

**Complete sequence for knowledge graph query:**

(See Section 4.2 for full sequence diagram - already included above)

---

## 9. Technology Stack

### 9.1 Backend

| Component     | Technology                | Version | Purpose                   |
| ------------- | ------------------------- | ------- | ------------------------- |
| Runtime       | Node.js                   | 20+     | JavaScript runtime        |
| Language      | TypeScript                | 5.3+    | Type safety               |
| Database      | PostgreSQL                | 15      | Relational database       |
| ORM           | Prisma                    | 5.7+    | Type-safe database access |
| MCP Framework | @modelcontextprotocol/sdk | 1.0     | MCP server implementation |
| Validation    | Zod                       | 3.22+   | Schema validation         |
| Logging       | Winston                   | 3.11+   | Structured logging        |

### 9.2 Frontend

| Component     | Technology      | Version | Purpose                      |
| ------------- | --------------- | ------- | ---------------------------- |
| Framework     | Next.js         | 14      | React framework (App Router) |
| UI Library    | React           | 18      | Component library            |
| UI Components | shadcn/ui       | Latest  | Radix UI primitives          |
| Styling       | Tailwind CSS    | 3.4+    | Utility-first CSS            |
| Forms         | react-hook-form | 7.49+   | Form state management        |
| Validation    | Zod             | 3.22+   | Form validation              |
| Charts        | Chart.js        | 4.4+    | Dashboard charts             |

### 9.3 Database Extensions

| Extension | Purpose                                         | Version |
| --------- | ----------------------------------------------- | ------- |
| pgvector  | Vector similarity search (384 dimensions)       | 0.5+    |
| pg_trgm   | Trigram-based full-text search (fuzzy matching) | Latest  |

### 9.4 Development Tools

| Tool       | Purpose                     | Version |
| ---------- | --------------------------- | ------- |
| pnpm       | Package manager             | 8+      |
| Docker     | PostgreSQL containerization | 24+     |
| ESLint     | Code linting                | 8+      |
| Prettier   | Code formatting             | 3+      |
| TypeScript | Type checking               | 5.3+    |

---

## 10. Architecture Decisions

### 10.1 Key Decisions Summary

All architecture decisions are documented in **Architecture Decision Records (ADRs)** in [architecture/ADRs/](architecture/ADRs/).

| ADR                                                                 | Decision                    | Rationale                              | Impact                                            |
| ------------------------------------------------------------------- | --------------------------- | -------------------------------------- | ------------------------------------------------- |
| [ADR-001](architecture/ADRs/ADR-001-agent-first-architecture.md)    | Agent-first architecture    | AI agents are primary users (95%)      | UI designed for monitoring, not primary interface |
| [ADR-002](architecture/ADRs/ADR-002-database-as-source-of-truth.md) | Database as source of truth | Markdown files auto-generated          | Eliminates sync issues, single source of truth    |
| [ADR-003](architecture/ADRs/ADR-003-hybrid-knowledge-graph.md)      | Hybrid knowledge search     | Semantic + full-text + graph traversal | 88% token reduction vs full graph                 |
| [ADR-004](architecture/ADRs/ADR-004-single-mcp-server.md)           | Single MCP server           | 41 tools in one server                 | Simplicity, universal agent access                |
| [ADR-005](architecture/ADRs/ADR-005-five-level-hierarchy.md)        | 5-level hierarchy           | Phase → Week → Day → Task → Session    | Sufficient granularity for solo developer         |

### 10.2 Trade-Offs

#### Agent-First vs UI-First

**Decision:** Agent-first (95% MCP, 5% UI)

**Trade-Off:**

- ✅ **Pro:** Token efficiency (92% skills, 88% knowledge), complete automation
- ✅ **Pro:** Agents execute workflows autonomously, no manual tracking
- ❌ **Con:** UI less polished than traditional project management tools
- ❌ **Con:** Requires MCP-compatible agent (limits to Claude Code, Cursor AI, Codex, Cascade)

**Rationale:** Project goal is agent automation, not human-friendly UI. UI serves monitoring and manual overrides only.

#### Database as Source of Truth vs Markdown as Source of Truth

**Decision:** Database as source of truth, markdown auto-generated

**Trade-Off:**

- ✅ **Pro:** Consistency (database and markdown always in sync)
- ✅ **Pro:** Automation (no manual markdown updates)
- ❌ **Con:** Markdown files read-only (cannot manually edit STATUS.md)
- ❌ **Con:** Git hook overhead (~500ms per commit)

**Rationale:** Manual markdown edits lead to drift and inconsistencies. Database transactions ensure data integrity.

#### Hybrid Search vs Full Graph Traversal

**Decision:** Hybrid search (semantic + full-text + 2-hop graph)

**Trade-Off:**

- ✅ **Pro:** 88% token reduction (1,200 tokens vs 10,000+)
- ✅ **Pro:** Performance (<200ms vs 2-5s for full graph)
- ❌ **Con:** May miss deep relationships (>2 hops)
- ❌ **Con:** Requires tuning (semantic/fulltext weights)

**Rationale:** Token efficiency critical for agents with 200K context limit. 2-hop traversal captures most relationships.

---

## 11. Future Enhancements

### 11.1 Production Deployment (Out of Scope for MVP)

**Features to Add:**

1. **Multi-User Support:**
   - User authentication (JWT tokens)
   - Workspace isolation (multi-tenancy)
   - MCP authentication (bearer tokens)
   - Role-based access control (Admin, Developer, Read-Only)

2. **MCP Transport Change:**
   - stdio (local) → WebSocket (multi-user)
   - MCP server as long-running service (not stdio subprocess)

3. **Managed Database:**
   - Docker (local) → Managed PostgreSQL (Railway, Supabase, AWS RDS)
   - Database backups and replication

4. **Hosting:**
   - Next.js: Vercel (serverless functions)
   - MCP Server: Railway or Render (container hosting)
   - CDN: Vercel Edge (static assets)

### 11.2 Advanced Features (Post-MVP)

1. **Real-Time Collaboration:**
   - Multiple agents working on same project
   - Agent-to-agent communication (agent marketplace)
   - Conflict resolution (merge strategies)

2. **Advanced Knowledge Graph:**
   - Increase max depth (2 hops → 3-4 hops) with caching
   - Knowledge graph visualization (D3.js, vis.js)
   - Auto-relationship discovery (ML-based)

3. **Enhanced Personas:**
   - Custom persona creation (user-defined autonomy levels)
   - Persona templates (e.g., "security-focused", "performance-focused")
   - Learning from past sessions (persona evolution)

4. **Advanced Analytics:**
   - Agent performance metrics (velocity, quality)
   - Cost tracking (embedding API, database queries)
   - Predictive analytics (estimated completion time)

---

## 12. Conclusion

### 12.1 Architecture Summary

**ProjectPulse** is an agent-first project management platform with a unique architecture optimized for AI agents:

1. **Primary Interface:** MCP tools (41 tools, stdio transport)
2. **Secondary Interface:** Next.js web UI (monitoring and manual CRUD)
3. **Single Source of Truth:** PostgreSQL database (markdown auto-generated)
4. **Token Efficiency:** 92% reduction for skills, 88% for knowledge queries
5. **Complete Automation:** Agents execute 5-step protocol autonomously

**Key Architectural Principles:**

- **Agent-First Design:** All features designed for MCP first, UI second
- **Database as Source of Truth:** Markdown files read-only, auto-generated from database
- **Token Efficiency:** Hybrid search, skill loading, progress persistence
- **Local-First:** $0 budget, runs entirely on localhost
- **Stateless Agent Operation:** Persistent state enables context-free execution

### 12.2 Requirements Traceability

All **125 Functional Requirements** (FR-001 to FR-125) and **33 Non-Functional Requirements** (NFR-001 to NFR-033) are fulfilled by this architecture.

**Traceability:**

- FR-001 to FR-025: Sprint/Phase Tracking → Section 3.1
- FR-026 to FR-050: Workflow Orchestration → Section 3.2
- FR-051 to FR-070: Issues Management → Section 3.3
- FR-071 to FR-090: Knowledge Graph → Section 3.4
- FR-091 to FR-105: Skills → Section 3.5
- FR-106 to FR-115: Wiki → Section 3.6
- FR-116 to FR-120: Project Health → Section 3.7
- FR-121 to FR-125: Agent Personas → Section 3.8

**Cross-Reference:**

- All requirements detailed in [02-SRS.md](02-SRS.md)
- Architecture decisions in [architecture/ADRs/](architecture/ADRs/)
- User stories in [12-Backlog.md](12-Backlog.md)

### 12.3 Next Steps

After completing architecture design:

1. **Data Model Design:** Create [04-Data-and-Model-Spec.md](04-Data-and-Model-Spec.md) (Prisma schema)
2. **Implementation:** Begin Phase A Week 1 (Database schema, migrations)
3. **Testing:** Create test suite following [09-Testing-and-QA.md](09-Testing-and-QA.md)
4. **Deployment:** Set up local development environment (Docker, PostgreSQL)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-02
**Status:** Active
**Maintainers:** Project Owner

**Change History:**

| Date       | Version | Changes                               |
| ---------- | ------- | ------------------------------------- |
| 2025-11-02 | 1.0     | Initial architecture document created |

---

**End of Document**
