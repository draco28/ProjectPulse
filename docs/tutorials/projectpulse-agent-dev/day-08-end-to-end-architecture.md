# Day 08 — End-to-end architecture walkthrough (agent→MCP→API→DB and UI→API→DB)

## Goals (what you should understand today)

By the end of Day 08, you should be able to explain:

1. The **two primary entry points** into ProjectPulse:
   - Human → Web UI
   - Agent → MCP server
2. The end-to-end request lifecycle for both paths:
   - Agent → MCP → Next.js API → Service layer → PostgreSQL
   - UI → (Server Components / API routes) → Prisma → PostgreSQL
3. How **authentication + project scoping** work (and why they’re enforced twice for agents).
4. Where observability + safety controls live (tool allow/block, global shutdown, logging).

---

## Mental model: one backend contract, two clients

ProjectPulse is designed so that both humans and agents converge on the same backend:

- **Source of truth**: PostgreSQL (via Prisma and selective raw SQL where needed)
- **Backend HTTP contract**: Next.js API routes in `apps/web/app/api/**`
- **Agent adapter**: MCP server in `apps/mcp-server/` that translates MCP tool calls into HTTP calls to the Next.js APIs

You can say this cleanly in interviews:

- “The Next.js app is both UI and backend (API routes + server-side services). The MCP server is an integration gateway for agents. Both paths ultimately use the same service layer and database.”

---

## Runtime components (what’s running)

At runtime you have three core services:

- **Web app (Next.js)**
  - Code: `apps/web/`
  - Responsibilities: UI rendering + API routes + business logic + DB access
- **MCP server (agent gateway)**
  - Code: `apps/mcp-server/`
  - Responsibilities: MCP transport, tool registry, auth context, forwarding to web APIs
- **PostgreSQL**
  - Responsibilities: persistence, pgvector, full-text, relational constraints

---

## Diagram-in-words: full system

```
HUMAN PATH
==========
Browser
  → Next.js page (Server Component)
    → Prisma / service layer
      → PostgreSQL
    ← HTML

(and sometimes)
Browser (client component)
  → Next.js API route (/api/*)
    → Prisma / service layer
      → PostgreSQL
    ← JSON

AGENT PATH
==========
LLM Agent (Claude / Windsurf)
  → MCP Streamable HTTP
    → MCP server (/mcp)
      → tool handler (Zod validate + auth + allow/block + logging)
        → HTTP client → Next.js API route (/api/*)
          → service layer
            → PostgreSQL
          ← JSON
      ← MCP tool result
  ← Agent uses results to continue reasoning
```

---

## Flow A — Agent path (MCP tool call end-to-end)

This is the “agent-first” flow you should be able to narrate step-by-step.

### Step A1: MCP server receives the request (transport + middleware)

**Entry point**:

- `apps/mcp-server/src/index-http.ts`

Key responsibilities in this file:

- **Transport**: Streamable HTTP endpoint at `POST /mcp`
- **Compatibility middleware**: fixes missing `Accept: text/event-stream` by editing both:
  - `req.headers.accept`
  - `req.rawHeaders` (important nuance: SDK reads raw headers)
- **Agent auth (MCP-layer)**: validates bearer token by calling the web app:
  - `POST /api/agent-auth/validate`
  - `apps/web/app/api/agent-auth/validate/route.ts`
- **Request-scoped auth context**: wraps tool execution in AsyncLocalStorage:
  - `apps/mcp-server/src/authContext.ts`
- **Safety controls**:
  - emergency shutdown gate: `checkEmergencyShutdown()`
  - `apps/mcp-server/src/adminControls.ts`

### Step A2: Tool registry and tool execution pipeline

**Tool registry + execution**:

- `apps/mcp-server/src/tools/index.ts`

What happens for every tool call:

1. MCP SDK receives `tools/call`.
2. Tool is looked up in the registered list (`loadTools()`).
3. Inputs are validated (`tool.schema.parse(...)`).
4. Per-token permissions are enforced:
   - `isToolAllowed(name)` from `apps/mcp-server/src/authContext.ts`
5. Global admin blocklist is checked:
   - `checkBlockedTool(name)` from `apps/mcp-server/src/adminControls.ts`
6. Tool executes.
7. Tool call is logged (success/failure):
   - `logToolCall(...)` from `apps/mcp-server/src/adminControls.ts`

This is the “MCP server is not just a proxy” argument:

- It enforces **tool-level governance** (permissions, global block) and **observability**.

### Step A3: A concrete tool example (knowledge search)

**Tool**:

- `apps/mcp-server/src/tools/knowledge/searchTool.ts`

Key details worth citing:

- Tool name: `projectpulse_knowledge_search`
- Input schema:
  - `projectId: number`
  - `query: string (1..1000)`
  - `mode: semantic | fulltext | hybrid`
  - `limit: 1..50`
- It forwards to the web API:
  - `GET /api/knowledge/search?...`

### Step A4: MCP → Next.js API forwarding (HTTP client)

**HTTP client**:

- `apps/mcp-server/src/httpClient.ts`

What it does:

- Builds absolute URLs from `config.apiBaseUrl`.
- Injects agent credentials into outgoing requests:
  - `Authorization: Bearer <rawToken>`
  - `X-Agent-Project-Id: <projectId>` (for logging/debugging; API still validates from token)

This is a key “defense-in-depth” talking point:

- MCP validates the token once, but still forwards it to the API, so the API can validate again.

### Step A5: The web app validates again (API-layer auth)

**Token validation endpoint used by MCP**:

- `apps/web/app/api/agent-auth/validate/route.ts`
  - Calls `validateProjectToken(token)` in `apps/web/lib/agent-tokens.ts`

**Unified API auth helper**:

- `apps/web/lib/auth/validateRequest.ts`

Key functions:

- `getAuthContext(request)`
  - checks NextAuth session first (human)
  - falls back to Bearer token (agent)
- `requireProjectAccess(request, projectId)`
  - if agent: **projectId must match token scope**
- `getAuthorizedProjectId(request, requestedProjectId?)`
  - allows API routes to accept optional projectId but still enforce isolation

### Step A6: API route → service → database

One “canonical” example is Knowledge Search:

- API route:
  - `apps/web/app/api/knowledge/search/route.ts`
- Service:
  - `apps/web/lib/knowledge/search.ts`
- DB schema:
  - `apps/web/prisma/schema.prisma` (KnowledgeItem, KnowledgeRelationship, indexes)

At this point you’re in “normal backend land”:

- validate inputs (Zod)
- authenticate/authorize
- perform query via Prisma and/or raw SQL (pgvector + tsvector)
- return JSON

---

## Flow B — Human path (UI → backend)

In Next.js App Router you have two common patterns for “UI reads data”:

### Pattern B1: Server Component page reads DB directly (preferred)

Example:

- `apps/web/app/knowledge/page.tsx`

What happens:

1. Server Component runs on the server.
2. It calls `getCurrentUser()`.
   - `apps/web/lib/auth-server.ts`
3. It resolves project scope for the user.
   - `apps/web/lib/project-context.ts` (`getActiveProjectForUser`)
4. It queries via Prisma.
   - `apps/web/lib/prisma.ts`
5. It renders HTML.

This is an important interview phrase:

- “In App Router, Server Components are effectively backend execution that returns UI.”

### Pattern B2: Client component calls API route (when interactivity requires it)

When you need client-side state + interactions, you call an API route.

A representative API route style (response envelope + filters + Prisma queries):

- `apps/web/app/api/tickets/route.ts`
- Shared response helpers:
  - `apps/web/app/api/tickets/_utils.ts` (`success`, `failure`)

---

## Project scoping (multi-tenancy) — where it happens

There are two “project scoping” layers for humans:

### UI-level scoping (human)

- `apps/web/lib/project-context.ts`
  - `getActiveProjectForUser(userId, searchParams.project)`
  - redirects if:
    - projectId is invalid
    - project is not owned by the user

### API-level scoping (human + agent)

- `apps/web/lib/auth/validateRequest.ts`
  - `requireProjectAccess(request, projectId)`
  - `getAuthorizedProjectId(request, requestedProjectId?)`

For agents, this is strict:

- a token is scoped to exactly one `projectId`
- API rejects if `requestedProjectId !== token.projectId`

---

## Observability + safety controls (what to highlight in interviews)

### MCP server controls

- Emergency shutdown gate (availability/admin control):
  - `apps/mcp-server/src/adminControls.ts`
  - called in `apps/mcp-server/src/index-http.ts`
- Per-token tool allow/block:
  - enforced in `apps/mcp-server/src/tools/index.ts` via `isToolAllowed()`
- Tool call logging:
  - `logToolCall(...)` in `apps/mcp-server/src/adminControls.ts`

### API server controls

- Unified auth + consistent error handling:
  - `apps/web/lib/auth/validateRequest.ts`
- Structured API responses in some route families:
  - `apps/web/app/api/tickets/_utils.ts` (`ApiResponse<T>` envelope)

---

## Failure modes (what can break)

- **MCP client compatibility (Accept headers)**
  - fixed in `apps/mcp-server/src/index-http.ts` by patching `req.rawHeaders`
- **Missing bearer token to MCP**
  - 401 returned by MCP middleware in `apps/mcp-server/src/index-http.ts`
- **Invalid/expired agent token**
  - MCP calls `POST /api/agent-auth/validate` → 401
  - API routes also enforce token validity via `validateRequest.ts`
- **Tool blocked**
  - per-token allow/block: `isToolAllowed()`
  - global blocklist: `checkBlockedTool()`
- **Project mismatch (multi-tenancy violation attempt)**
  - blocked by `requireProjectAccess()` in `apps/web/lib/auth/validateRequest.ts`
- **DB errors / slow queries**
  - show up as API 5xx and tool returns `isError: true`

---

## Interview-ready “explain it in 60 seconds” script

Use something like:

- “ProjectPulse has two clients: humans via the Next.js UI and agents via an MCP server. Both converge on the same Next.js API routes and service layer, with PostgreSQL as the source of truth. The MCP server is a gateway: it exposes tools, validates agent tokens by calling the web app, enforces tool permissions, logs tool calls, and forwards requests to the Next.js API with a Bearer token. The API re-validates auth for defense-in-depth and enforces project scoping for multi-tenancy before querying Postgres via Prisma (and pgvector/raw SQL where needed).”

---

## Exercises (do later)

### Exercise A: Trace one agent call end-to-end

Trace `projectpulse_knowledge_search`:

- MCP endpoint: `apps/mcp-server/src/index-http.ts` (`POST /mcp`)
- Tool registry: `apps/mcp-server/src/tools/index.ts`
- Tool: `apps/mcp-server/src/tools/knowledge/searchTool.ts`
- MCP → API HTTP client: `apps/mcp-server/src/httpClient.ts`
- MCP token validation: `apps/web/app/api/agent-auth/validate/route.ts`
- API auth + scoping: `apps/web/lib/auth/validateRequest.ts`
- Knowledge search API: `apps/web/app/api/knowledge/search/route.ts`
- Search service: `apps/web/lib/knowledge/search.ts`

Write down:

- where project scoping is enforced
- where tool allow/block is enforced
- where the DB query happens

### Exercise B: Trace one human page load

Trace `/knowledge`:

- Page: `apps/web/app/knowledge/page.tsx`
- Auth: `apps/web/lib/auth-server.ts`
- Project context: `apps/web/lib/project-context.ts`
- Prisma: `apps/web/lib/prisma.ts`

---

## Completion checklist

- [ ] I can explain the agent path from MCP → API → DB.
- [ ] I can explain the UI path (Server Components vs API routes).
- [ ] I can explain defense-in-depth auth and project scoping.
