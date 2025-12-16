# Day 05 — MCP Tool Anatomy (schema validation, handler structure, error handling, logging)

## Goals (what you should understand today)

By the end of Day 05, you should be able to:

1. Explain what an MCP tool is in ProjectPulse (contract + execution model).
2. Recognize the **standard ToolDefinition shape** used in `apps/mcp-server`.
3. Trace the full lifecycle of a tool call:
   - `tools/call` → permission checks → schema parse → tool execute → HTTP call → tool result → async logging
4. Explain how tools handle:
   - input validation
   - multi-tenancy parameters (`projectId`)
   - errors (tool-level vs API-level)
   - observability (logs + DB tool logs)

---

## Mental model: an MCP tool is a “typed remote function”

In ProjectPulse, each MCP tool is a thin adapter around the real backend (Next.js APIs).

- Tool input is validated with Zod.
- Tool output is returned as MCP content blocks.
- Tool does not access PostgreSQL directly.

Evidence:

- Tool interface type:
  - `apps/mcp-server/src/tools/types.ts`
- Most tools call web APIs via:
  - `context.httpClient` (`apps/mcp-server/src/httpClient.ts`)

---

## The ToolDefinition contract (what every tool must implement)

Open:

- `apps/mcp-server/src/tools/types.ts`

A tool is defined by:

- `name`: stable identifier (e.g. `projectpulse_knowledge_search`)
- `description`: shown to agents during `tools/list`
- `schema`: Zod schema used to validate runtime arguments
- `inputSchema`: JSON schema-ish object (used for tool discovery / docs)
- `execute(params, context)`: returns `CallToolResult`

Interview wording:

- “Every tool has a strict schema and a single execute function. We validate inputs before calling any backend API.”

---

## The shared runtime: tool registration + call handling

Open:

- `apps/mcp-server/src/tools/index.ts`

### What happens on `tools/list`

- The MCP server returns an array of `{ name, description, inputSchema }`.

### What happens on `tools/call`

This file is the authoritative lifecycle:

1. Look up tool by name.
2. Check token-level permissions:
   - `isToolAllowed(name)`
   - Evidence: `apps/mcp-server/src/authContext.ts`
3. Check global admin blocklist:
   - `checkBlockedTool(name)`
   - Evidence: `apps/mcp-server/src/adminControls.ts`
4. Parse args:
   - `tool.schema.parse(rawArgs ?? {})`
5. Execute:
   - `await tool.execute(parsed, context)`
6. Log tool call (fire-and-forget):
   - `logToolCall(...)` → `POST /api/mcp/log`
   - API endpoint: `apps/web/app/api/mcp/log/route.ts`

Key point:

- Logging is **non-blocking**. It is designed not to add latency to tool responses.

---

## Example 1: “Simple GET proxy tool” — knowledge search

Open:

- `apps/mcp-server/src/tools/knowledge/searchTool.ts`

Pattern:

- `inputSchema` validates:
  - `projectId` (required)
  - `query` length (1–1000)
  - `mode` enum
  - `limit` range
- Tool constructs query string using `URLSearchParams`.
- Tool calls:
  - `GET /api/knowledge/search?...`

Where the actual work happens:

- Next.js API route:
  - `apps/web/app/api/knowledge/search/route.ts`
- Search services:
  - `apps/web/lib/knowledge/search.ts`

Error handling:

- On exception, tool returns:
  - `isError: true`
  - JSON payload with `error`, `message`, `projectId`

---

## Example 2: “Simple POST proxy tool” — knowledge create

Open:

- `apps/mcp-server/src/tools/knowledge/createTool.ts`

Pattern:

- Validate input (title/content/category/tags)
- Call:
  - `POST /api/knowledge`

Important: the API returns `{ data, meta }`, not a flat object.

- Evidence:
  - `apps/web/app/api/knowledge/route.ts` (POST)

Tool code note (interview-safe):

- Some tools treat API responses as `any` and log fields like `response.id`.
- In interviews, describe the intended design:
  - “Tools pass validated input to the API and return the API JSON.”

---

## Example 3: “Domain tool with shared utilities” — ticket.create

Open:

- Tool:
  - `apps/mcp-server/src/tools/tickets/create.ts`
- Shared schema + helpers:
  - `apps/mcp-server/src/tools/tickets/common.ts`

Why this tool is a good example:

- Uses a shared Zod schema (`baseTicketFields`) for consistency across many ticket tools.
- Wraps API responses into a consistent payload using:
  - `buildErrorPayload()`
  - `summarizeTicket()`

The tool calls:

- `POST /api/tickets`
  - API endpoint: `apps/web/app/api/tickets/route.ts`

Interview wording:

- “For larger tool families (tickets), we centralize validation and formatting so every tool behaves consistently.”

---

## Example 4: “Batch tool” — create skills in bulk

Open:

- `apps/mcp-server/src/tools/batch/createSkillBatchTool.ts`

What makes it different:

- Validates an array of objects (`skills`) with a max batch size.
- Calls a batch API:
  - `POST /api/batch/skills`

Why this exists (how to explain):

- Token efficiency: fewer round-trips.
- Atomicity: create many items consistently.

---

## Example 5: “Observability tool” — logStep

Open:

- `apps/mcp-server/src/tools/observability/logStepTool.ts`

Why this matters:

- It’s part of the “agent work tracking” story.
- The schema allows custom metadata via `passthrough()`.
- The tool calls:
  - `POST /api/observability/log-step`

---

## Logging and monitoring (what gets logged where)

There are three layers of logging/observability:

1. **Tool runtime logs** (stdout logs)
   - `context.logger.info|warn|error`
   - Logger implementation: `apps/mcp-server/src/logger.ts`

2. **Database tool logs** (analytics)
   - MCP server → Next.js internal endpoint:
     - `POST /api/mcp/log`
   - Endpoint:
     - `apps/web/app/api/mcp/log/route.ts`
   - DB tables:
     - `MCPToolLog` / `MCPToolAggregate` in `apps/web/prisma/schema.prisma`

3. **Admin controls** (incident response)
   - emergency shutdown + global blocklist
   - implemented in:
     - `apps/mcp-server/src/adminControls.ts`

---

## Failure modes (what breaks)

| Layer | Failure | Result |
|------:|---------|--------|
| Tool input | Zod schema rejects args | tool returns error (or runtime catches and marks `isError`) |
| Token permissions | tool not allowed | blocked before execute (`apps/mcp-server/src/tools/index.ts`) |
| Admin blocklist | tool globally blocked | blocked before execute |
| API returns non-2xx | httpClient throws | tool catches and returns `isError: true` |
| API returns `{ data: null, error: ... }` | tool must interpret API contract | ticket tools explicitly handle this (`apps/mcp-server/src/tools/tickets/create.ts`) |

---

## Exercises (do later)

### Exercise A: Identify the 6 parts of a tool

Pick one tool file and list:

- [ ] Tool name
- [ ] Zod schema
- [ ] JSON input schema
- [ ] API endpoint called
- [ ] Success return format
- [ ] Failure return format

### Exercise B: Trace one tool call end-to-end

Trace `projectpulse_ticket_create` through:

- tool file
- API route
- auth enforcement
- database write

Files:

- `apps/mcp-server/src/tools/tickets/create.ts`
- `apps/web/app/api/tickets/route.ts`
- `apps/web/lib/auth/validateRequest.ts`
- `apps/web/prisma/schema.prisma` (Ticket model)

---

## Completion checklist

- [ ] I can explain what a ToolDefinition is.
- [ ] I can explain how tools are authorized.
- [ ] I can explain how tool calls are logged.

Next: Day 06 — MCP tool categories and how they map to product modules
