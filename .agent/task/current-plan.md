 # Implementation Plan – Stateful HTTP Streamable MCP (ByteRover Alignment)
 
 **Phase:** Post–Sprint 8.6
 **Goal:** Replace multi-transport MCP setup (SSE + stateless HTTP + Next.js `/api/mcp`) with a **single, canonical stateful HTTP Streamable MCP server**, mirroring ByteRover’s `--transport http` behavior.
 
 ---
 
 ## 1. Target Architecture
 
 - **Single MCP entrypoint (for agents):**
   - URL: `http://192.168.1.15:3001/mcp`
   - Transport: **HTTP – Streamable HTTP (stateful)** via `StreamableHTTPServerTransport`.
 - **Server implementation:** `apps/mcp-server/src/index-http.ts`
   - Singleton `Server` instance from `@modelcontextprotocol/sdk/server`.
   - Tools registered once via existing `registerTools`.
   - Express app with:
     - `GET /health` – operational health.
     - `POST /mcp` – **only** MCP endpoint.
 - **Client configuration examples:**
   - Claude Code:
     - `claude mcp add --transport http projectpulse-mcp http://192.168.1.15:3001/mcp`
   - Windsurf / Cascade MCP config:
     - `serverUrl: "http://192.168.1.15:3001/mcp"`.
 
 **Non-goals for this plan:**
 
 - No SSE transport (`SSEServerTransport`) for agents.
 - No WebSocket transport (can be a future enhancement, not required to match ByteRover).
 - No MCP responsibilities in Next.js `/api/mcp`.
 
 ---
 
 ## 2. Current-State Inventory
 
 **MCP server (apps/mcp-server):**
 
 - `src/index-http.ts` (current):
   - `GET /mcp` → SSE (`SSEServerTransport`).
   - `POST /mcp?sessionId=...` → SSE POST messages via `handlePostMessage`.
   - `POST /mcp` (no `sessionId`) → **stateless** `StreamableHTTPServerTransport`.
   - `POST /mcp/json-rpc` → manual JSON-RPC shim for compatibility.
 - `src/index.ts`:
   - Stdio transport (`StdioServerTransport`) for local Claude Code.
 
 **Embedded Next.js route (apps/web):**
 
 - `app/api/mcp/route.ts`:
   - `POST /api/mcp` – custom JSON-RPC 2.0 tools/resources router (not a true MCP transport).
   - `GET /api/mcp` – 501 placeholder for SSE.
 
 **Problem with this state:**
 
 - Multiple overlapping “MCP-like” surfaces (`/mcp` SSE + stateless HTTP, `/api/mcp` custom HTTP).
 - Streamable HTTP is configured **stateless**, so MCP clients that expect initialization to persist see "Server not initialized" behavior.
 - Harder to reason about and document for agents compared to ByteRover’s single HTTP endpoint.
 
 ---
 
 ## 3. High-Level Migration Strategy
 
 1. **Converge on one canonical MCP endpoint:** `POST /mcp` on `apps/mcp-server` (port 3001).
 2. **Switch HTTP transport to stateful mode:** configure `StreamableHTTPServerTransport` with a `sessionIdGenerator` and session lifecycle callbacks.
 3. **Decommission legacy surfaces:**
    - Remove SSE (`GET /mcp` + `POST /mcp?sessionId=...`).
    - Remove `/mcp/json-rpc` shim.
    - Remove MCP responsibilities from Next.js `/api/mcp`.
 4. **Align docs + Docker:** ensure `docker-compose.cloud.yml` and docs reference only the HTTP MCP endpoint.
 5. **Validate with real MCP clients:** Claude Code + Windsurf using `--transport http`.
 6. **Add automated HTTP MCP tests:** minimal E2E coverage for `initialize`, `tools/list`, `tools/call`.
 
 ---
 
 ## 4. Detailed Implementation Steps
 
 ### 4.1 Simplify `index-http.ts` Routes
 
 **Files:**
 
 - `apps/mcp-server/src/index-http.ts`
 
 **Steps:**
 
 1. **Keep:**
    - Express initialization (`const app = express();`).
    - `app.use(express.json());` middleware.
    - `GET /health` endpoint (update `transport` field later).
 2. **Remove / deprecate:**
    - `SSEServerTransport` import.
    - `sseSessions` map and related logic.
    - `GET /mcp` SSE handler.
    - SSE branch in `POST /mcp` that checks `req.query.sessionId` and calls `transport.handlePostMessage`.
    - `POST /mcp/json-rpc` manual JSON-RPC shim.
 3. **Leave a single MCP route:**
    - `app.post('/mcp', async (req, res) => { ... })` that always uses Streamable HTTP.
 
 **Success condition:** `index-http.ts` exposes exactly:
 
 - `GET /health`.
 - `POST /mcp` (Streamable HTTP only).
 
 ### 4.2 Configure Streamable HTTP as Stateful
 
 **Goal:** Use the MCP SDK’s own session mechanism rather than trying to manage sessions manually.
 
 **Key design points:**
 
 - Reuse **singleton** MCP `Server` instance (already in `index-http.ts`).
 - Create a **new `StreamableHTTPServerTransport` per request** (SDK requirement).
 - Configure it with:
   - `sessionIdGenerator: () => randomUUID()`.
   - `enableJsonResponse: true`.
   - `onsessioninitialized` / `onsessionclosed` callbacks for logging.
 
 **Implementation sketch inside `POST /mcp`:**
 
 - Create transport **per request**:
   - `const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID(), enableJsonResponse: true, enableDnsRebindingProtection: false, onsessioninitialized, onsessionclosed });`
 - Connect and handle:
   - `await server.connect(transport);`
   - `await transport.handleRequest(req, res, req.body);`
   - `await transport.close();`
 
 **Logging / observability:**
 
 - In `onsessioninitialized(sessionId)`: log session creation and maybe client info from the `initialize` params.
 - In `onsessionclosed(sessionId)`: log closure.
 - In the route handler, log `method` and `id` (taken from raw JSON-RPC request) for quick debugging.
 
 **Success condition:**
 
 - MCP clients can:
   - Send `initialize` once.
   - Send `tools/list`.
   - Send representative `tools/call` (e.g. health/diagnostic tool).
 
 ### 4.3 Decommission `/api/mcp` as an MCP Surface
 
 **Files:**
 
 - `apps/web/app/api/mcp/route.ts`
 - `docs/MCP_ARCHITECTURE.md`
 
 **Options:**
 
 - **Recommended:**
   - Remove or rename the route so it is no longer `/api/mcp`.
   - If keep functionality, rebrand it as an internal HTTP API (e.g. `/api/internal/mcp-proxy`) and clearly mark it as **non-MCP**.
 
 **Documentation changes:**
 
 - Update architecture diagrams in `docs/MCP_ARCHITECTURE.md` to show:
   - Agents → `apps/mcp-server` → `POST /mcp` (HTTP MCP).
   - Next.js app only calls regular REST APIs, not MCP.
 
 **Success condition:** there is a single, unambiguous MCP endpoint in the system (`/mcp` on port 3001).
 
 ### 4.4 Docker & Health Check Alignment
 
 **Files:**
 
 - `docker-compose.cloud.yml`
 - `apps/mcp-server/README.md`
 
 **Steps:**
 
 1. Verify Docker command uses HTTP index:
    - `command: sh -c "pnpm install --prod=false && pnpm build && node dist/index-http.js"`.
 2. Update health response in `GET /health`:
    - `transport: 'http'` or `'streamable-http'` (no more `'sse'` / `'hybrid'`).
 3. Confirm Docker healthcheck script still points to `/health` and expects HTTP 200.
 
 **Success condition:** container reports healthy and logs reflect **HTTP** transport only.
 
 ### 4.5 Client Configuration & E2E Validation
 
 **Claude Code:**
 
 - Configure:
   - `claude mcp add --transport http projectpulse-mcp http://192.168.1.15:3001/mcp`
 - Validate:
   - `claude mcp list` shows `projectpulse-mcp`.
   - Inside Claude Code, list tools and invoke:
     - `tools/list`.
     - A few core tools (e.g., onboarding tools, issue tools).
 
 **Windsurf / Cascade:**
 
 - Configure in Windsurf MCP settings:
   - Name: `projectpulse-mcp`.
   - URL: `http://192.168.1.15:3001/mcp`.
 - Validate:
   - Tools appear in MCP panel.
   - Tool calls succeed without timeouts or "Server not initialized".
 
 **Success condition:** both Claude Code and Windsurf operate exclusively against the HTTP MCP endpoint, with working tools and stable sessions.
 
 ### 4.6 Automated HTTP MCP Tests
 
 **Files (to create):**
 
 - `apps/mcp-server/tests/e2e/http-client.ts`
 - `apps/mcp-server/tests/e2e/http-mcp.test.ts`
 
 **Test client responsibilities:**
 
 - Use Node `http`/`fetch` to:
   - Send `initialize` to `POST /mcp`.
   - Send `tools/list`.
   - Send representative `tools/call` (e.g. health/diagnostic tool).
 
 **Test cases:**
 
 1. `initialize` returns valid MCP response with server info.
 2. `tools/list` returns non-empty tool array.
 3. `tools/call` succeeds for at least one well-known tool.
 
 **CI integration:**
 
 - Add NPM script in `apps/mcp-server/package.json`:
   - `"test:mcp-http": "vitest run apps/mcp-server/tests/e2e/http-mcp.test.ts"` (or similar).
 - Ensure CI runs this after `pnpm build`.
 
 **Success condition:** tests pass locally and in CI, providing regression coverage for the HTTP MCP path.
 
 ---
 
 ## 5. Rollout & Fallback Plan
 
 **Rollout steps:**
 
 1. Implement and test HTTP-only `index-http.ts` locally.
 2. Run E2E tests (Session 1 workflow) through HTTP MCP using the new test client.
 3. Deploy to Mac mini Docker.
 4. Validate with Claude Code + Windsurf.
 
 **Fallback:**
 
 - Keep the previous SSE-based implementation in git history (branch `backup/mcp-sse-working` or equivalent).
 - If issues arise during HTTP rollout, revert `index-http.ts` and Docker command to the last-known-good SSE version while investigating.
 
 ---
 
 ## 6. Success Criteria (Stateful HTTP MCP)
 
 - [ ] **Single MCP endpoint**: only `POST /mcp` is documented and used for MCP traffic.
 - [ ] **Stateful HTTP transport**: MCP clients can `initialize` once and then call tools without "Server not initialized" errors.
 - [ ] **Multi-agent compatibility**: at least Claude Code and Windsurf confirmed working with `--transport http`.
 - [ ] **Clean architecture**: Next.js `/api/mcp` is not part of MCP protocol; all MCP logic lives in `apps/mcp-server`.
 - [ ] **Automated tests**: basic HTTP MCP E2E suite passing in CI.
