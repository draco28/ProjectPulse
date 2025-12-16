# Day 03 — MCP Server Architecture (HTTP streaming, tool registry, request lifecycle)

## Goals (what you should understand today)

By the end of Day 03, you should be able to explain:

1. What the MCP server is in ProjectPulse, and what it is **not**.
2. The MCP request lifecycle:
   - agent → `/mcp` → auth middleware → MCP SDK → tool registry → tool → Next.js API
3. Where tool definitions live, how tools are registered, and how tool calls are authorized + logged.
4. Why ProjectPulse has a dedicated MCP server container (and what the legacy `/api/mcp` route is).

---

## What the MCP server is (and why it exists)

The MCP server is a **backend service** whose job is:

- Expose ProjectPulse capabilities as **MCP tools** to AI agents (Claude Code, Windsurf, etc.)
- Validate agent tokens (via the web app)
- Forward calls to the **core backend** (Next.js APIs)

What it is **not**:

- It is **not** the system of record.
- It should **not** contain your core business logic.
- It should **not** talk to PostgreSQL directly.

Concrete evidence:

- MCP server entrypoint (HTTP streaming): `apps/mcp-server/src/index-http.ts`
- Token validation happens by calling the web app API:
  - MCP calls: `POST /api/agent-auth/validate` (see `apps/mcp-server/src/index-http.ts`)
  - API endpoint: `apps/web/app/api/agent-auth/validate/route.ts`

---

## Important: There are two MCP implementations in the repo

### A) Dedicated MCP server container (current / production-style)

This is the implementation you should treat as canonical:

- `apps/mcp-server/src/index-http.ts`
- Exposes:
  - `POST /mcp` (MCP Streamable HTTP)
  - `GET /health`
- Default port:
  - `3001` via `apps/mcp-server/src/config.ts` (`mcpPort`)

### B) Legacy MCP-in-Next.js route (older / compatibility)

There is also an MCP implementation inside the Next.js app:

- `apps/web/app/api/mcp/route.ts`

This route:

- Implements an MCP-like JSON-RPC handler at `POST /api/mcp`
- Has its own session manager and handler routing under `apps/web/lib/mcp/**`

Interview-ready explanation:

- “We have a dedicated MCP server (`apps/mcp-server`) for production-style agent connectivity. The repo also contains an older MCP-over-Next.js route (`/api/mcp`) that was used earlier and still exists for compatibility/internal use. The dedicated MCP server is the primary integration point for agents.”

---

## Transport options: HTTP streaming vs stdio

ProjectPulse supports two MCP transports:

- **HTTP streaming (Streamable HTTP)** — used for remote/networked MCP clients
  - Entrypoint: `apps/mcp-server/src/index-http.ts`
  - Uses: `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk`

- **stdio transport** — useful for local/dev use cases
  - Entrypoint: `apps/mcp-server/src/index.ts`
  - Uses: `StdioServerTransport`

---

## MCP server request lifecycle (what happens on every agent call)

### Step 0: Server boot (singleton server + tool registration)

In `apps/mcp-server/src/index-http.ts`:

- Creates a singleton MCP `Server`
- Registers all tools once:
  - `registerTools(server, { config, logger, httpClient })`
  - Tool registry: `apps/mcp-server/src/tools/index.ts`

### Step 1: HTTP request arrives

- Endpoint: `POST /mcp`
- Express app is created in `apps/mcp-server/src/index-http.ts`

### Step 2: Compatibility middleware (Accept header fix)

Before auth, the server patches missing Accept headers for certain clients.

- Evidence: `apps/mcp-server/src/index-http.ts` modifies both `req.headers.accept` and `req.rawHeaders`.

Interview wording:

- “We added a small compatibility layer because some MCP clients omit required `Accept` types, and the MCP SDK validates against raw headers.”

### Step 3: Authentication middleware (Bearer token)

The MCP server requires:

- `Authorization: Bearer <token>`

It validates tokens by calling the Next.js backend:

- MCP → Next.js:
  - `POST /api/agent-auth/validate` with `{ token: rawToken }`
  - Evidence: `apps/mcp-server/src/index-http.ts`
- Next.js endpoint:
  - `apps/web/app/api/agent-auth/validate/route.ts`

The validated auth payload contains:

- `projectId`
- `tokenId`
- `name`
- `blockedTools` / `allowedTools`

### Step 4: Request-scoped auth context (AsyncLocalStorage)

The MCP server stores auth context in AsyncLocalStorage so tools don’t need to pass tokens around manually.

- Evidence:
  - `apps/mcp-server/src/authContext.ts`

### Step 5: Emergency shutdown gate

Before handling the request, the server checks an admin “kill switch”.

- Evidence:
  - `checkEmergencyShutdown()` in `apps/mcp-server/src/index-http.ts`
  - Implementation in `apps/mcp-server/src/adminControls.ts`
  - Calls web app admin API: `GET /api/admin/mcp/emergency`

### Step 6: MCP SDK handles JSON-RPC methods

The server creates a new `StreamableHTTPServerTransport` per request and connects the singleton server:

- Evidence:
  - `apps/mcp-server/src/index-http.ts`:
    - `await server.connect(transport)`
    - `await transport.handleRequest(req, res, req.body)`

This is where MCP methods like `tools/list` and `tools/call` are processed.

---

## Tool registry (where tool count and tool names come from)

The canonical tool list lives here:

- `apps/mcp-server/src/tools/index.ts`

Key points:

- `loadTools()` returns an array of `ToolDefinition`.
- `registerTools()` wires MCP SDK request handlers:
  - `ListToolsRequestSchema`
  - `CallToolRequestSchema`

Evidence:

- “Tools registered” log includes `{ count: tools.length }` at the end of `registerTools()`.

### How a tool call is authorized

Inside `CallToolRequestSchema` handler (`apps/mcp-server/src/tools/index.ts`):

1. Check tool exists.
2. Check per-token allowlist/blocklist:
   - `isToolAllowed(name)` (uses `apps/mcp-server/src/authContext.ts`)
3. Check global admin blocklist:
   - `checkBlockedTool(name)` (calls Next.js admin API)
4. Parse args via Zod: `tool.schema.parse(rawArgs ?? {})`
5. Execute tool: `tool.execute(parsed, context)`
6. Fire-and-forget logging:
   - `logToolCall(...)` → `POST /api/mcp/log`

---

## How tools call the real backend (Next.js APIs)

Tools do not talk to the DB.

Instead they call Next.js API routes through a shared HTTP client:

- HTTP client: `apps/mcp-server/src/httpClient.ts`

Important behavior:

- It injects `Authorization: Bearer <rawToken>` from AsyncLocalStorage.
- It also sends `X-Agent-Project-Id` for debug/logging, but the API layer validates project scope using the token.

This is how “defense-in-depth” is implemented:

- MCP validates token (via `/api/agent-auth/validate`)
- Next.js API validates again (via `apps/web/lib/auth/validateRequest.ts`)

---

## Admin controls and observability

The MCP server supports:

- Emergency shutdown (cached 5s)
- Global tool blocklist (cached 5s)
- Tool call logging (fire-and-forget)

All of these are implemented in:

- `apps/mcp-server/src/adminControls.ts`

Notable detail:

- Admin controls call Next.js endpoints using `x-internal-request: true`.

---

## Failure modes (what can break)

| Layer | Failure | What you’ll see |
|------:|---------|-----------------|
| Client → MCP | Missing Bearer token | 401 JSON-RPC error from `apps/mcp-server/src/index-http.ts` |
| MCP auth | Token invalid/expired | 401 JSON-RPC error; Next.js `/api/agent-auth/validate` returns 401 |
| Emergency shutdown | Enabled | 503 JSON-RPC error with reason |
| Tool permissions | Tool not allowed for token | `isError: true` response from `apps/mcp-server/src/tools/index.ts` |
| Global blocklist | Tool blocked by admin | `isError: true` response from `apps/mcp-server/src/tools/index.ts` |
| Next.js API call | Non-2xx response | `httpClient` throws in `apps/mcp-server/src/httpClient.ts` |

---

## Exercises (do later, after tutorial is complete)

### Exercise A: Explain the MCP request lifecycle (10 sentences)

Your explanation must include:

- [ ] Entry point: `apps/mcp-server/src/index-http.ts`
- [ ] Token validation call to `POST /api/agent-auth/validate`
- [ ] AsyncLocalStorage auth context (`apps/mcp-server/src/authContext.ts`)
- [ ] Tool registry (`apps/mcp-server/src/tools/index.ts`)
- [ ] Tool → API forwarding (`apps/mcp-server/src/httpClient.ts`)

### Exercise B: Identify the two MCP implementations

Answer:

1. What endpoint does the dedicated MCP server expose?
2. What endpoint does the legacy Next.js MCP route expose?
3. Which one should you describe as “production-style agent interface” in interviews?

---

## Completion checklist

- [ ] I can explain what MCP is in one minute without mixing it up with the core backend.
- [ ] I can trace a tool call end-to-end with file paths.
- [ ] I can explain tool authorization + logging.

Next: Day 04 — Security & multi-tenancy (agent tokens, defense-in-depth auth, tool permissions)
