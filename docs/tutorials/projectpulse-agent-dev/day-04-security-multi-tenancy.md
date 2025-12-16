# Day 04 — Security & Multi-tenancy (agent tokens, defense-in-depth, tool permissions)

## Goals (what you should understand today)

By the end of Day 04, you should be able to explain:

1. The two auth modes in ProjectPulse:
   - **Human auth** (NextAuth session cookie)
   - **Agent auth** (project-scoped Bearer token)
2. How **multi-tenancy** is enforced:
   - every request is scoped to a `projectId`
   - agents cannot cross project boundaries
3. What “defense-in-depth” means in this codebase:
   - MCP server validates token
   - Next.js API validates token again
4. The two permission systems for MCP tools:
   - per-token allowlist/blocklist
   - global admin blocklist + emergency shutdown

---

## Security architecture: two doors, one rulebook

ProjectPulse has two “doors” into the backend:

- **Web UI door**: browser → Next.js pages + APIs
- **Agent door**: MCP server → Next.js APIs

Security goal:

- Both doors must follow the same rulebook: **authenticate + authorize + enforce project scoping**.

Concrete evidence:

- Unified API auth entry point:
  - `apps/web/lib/auth/validateRequest.ts`
  - This module supports both:
    - session auth (`getCurrentUser()`)
    - bearer auth (`Authorization: Bearer ...`)

---

## Human auth: NextAuth session cookie

Where it lives:

- NextAuth route:
  - `apps/web/app/api/auth/[...nextauth]/route.ts`
- Server-side session lookup:
  - `apps/web/lib/auth-server.ts` (`getCurrentUser`, `requireAdmin`)
- Page route protection:
  - `apps/web/middleware.ts`

Important detail:

- Middleware protects **web pages**, not API routes.
  - Evidence: `apps/web/middleware.ts` allows `/api/*` through and expects APIs to authenticate themselves.

Interview wording:

- “We use NextAuth for user sessions for the web UI. Pages are protected by middleware, while APIs authenticate per-request so both humans and agents can access the same endpoints safely.”

---

## Agent auth: project-scoped Bearer tokens

### Where tokens live (database model)

- Prisma model:
  - `ProjectToken` in `apps/web/prisma/schema.prisma`
- Key fields:
  - `tokenHash` (bcrypt hash, plaintext not stored)
  - `projectId` (multi-tenant scope)
  - `expiresAt`, `isRevoked`, `lastUsedAt`
  - `blockedTools`, `allowedTools` (tool permissions)

### How tokens are created and validated

- Token service:
  - `apps/web/lib/agent-tokens.ts`

Implementation facts:

- Token is generated as opaque random hex (`randomBytes(32).toString('hex')`).
- Only the hash is stored (`bcrypt.hash`).
- Validation scans non-revoked, non-expired candidates and `bcrypt.compare`s.
- On success, token usage is recorded (`lastUsedAt`).

Interview wording:

- “Agents authenticate using opaque Bearer tokens scoped to a project. We store only a bcrypt hash in the database and validate each request server-side.”

---

## Defense-in-depth: validated twice on purpose

This is one of the most important interview answers in your system.

### Layer 1: MCP server validates token

- MCP server middleware calls:
  - `POST /api/agent-auth/validate`
- Evidence:
  - `apps/mcp-server/src/index-http.ts`
  - Next.js endpoint: `apps/web/app/api/agent-auth/validate/route.ts`

### Layer 2: Next.js API validates token again

- API routes call into:
  - `apps/web/lib/auth/validateRequest.ts`
- This function supports:
  - session auth (human)
  - bearer auth (agent)

Concrete example:

- `apps/web/app/api/tickets/route.ts` calls:
  - `getAuthorizedProjectId(request, filters.projectId)`

Interview wording:

- “Even if someone bypasses the MCP server and hits APIs directly, the APIs still require authentication. That’s defense-in-depth.”

---

## Multi-tenancy: how project isolation is enforced

In this codebase, multi-tenancy means:

- every data access is scoped to a `projectId`
- agents can only access **their token’s projectId**

### The core enforcement function

- `apps/web/lib/auth/validateRequest.ts`
  - `requireProjectAccess(request, projectId)`

Enforcement rules:

- If auth type is `agent`, then `auth.projectId` must match requested `projectId`.
- If auth type is `user`, then the user must own the project (`Project.ownerId`).

Evidence:

- `requireProjectAccess()` checks:
  - agent scope mismatch → 403
  - user ownership mismatch → 403

### Two common API patterns in this repo

1. **Path param project** (projectId in URL)

- Example pattern:
  - `apps/web/app/api/projects/[id]/milestones/route.ts`
  - Calls: `await requireProjectAccess(request, projectId)`

2. **Query/body project** (projectId optional for users)

- Example pattern:
  - `apps/web/app/api/tickets/route.ts`
  - Calls: `getAuthorizedProjectId(request, requestedProjectId)`
  - If projectId is omitted:
    - agents use token’s projectId
    - users default to first project

---

## Tool permissions (per token) vs global controls (admin)

There are two layers of tool controls:

### A) Per-token allowlist / blocklist (agent-level)

- Stored on `ProjectToken`:
  - `blockedTools` / `allowedTools`
- Returned by token validation endpoint:
  - `apps/web/app/api/agent-auth/validate/route.ts`

Enforced in MCP server:

- `apps/mcp-server/src/authContext.ts` implements `isToolAllowed(toolName)`
- `apps/mcp-server/src/tools/index.ts` enforces it before execution

### B) Global admin blocklist + emergency shutdown (system-level)

- Emergency shutdown endpoint:
  - `apps/web/app/api/admin/mcp/emergency/route.ts`
- Global blocklist endpoint:
  - `apps/web/app/api/admin/mcp/blocked-tools/route.ts`

How the MCP server uses them:

- `apps/mcp-server/src/adminControls.ts`
  - calls the Next.js admin endpoints
  - uses `x-internal-request: true`
  - caches responses for 5 seconds

Interview wording:

- “We support per-token tool permissions for least privilege, plus system-wide admin controls like emergency shutdown and global blocklisting for incident response.”

---

## Internal-only endpoints (x-internal-request)

Some endpoints are intended only for internal service-to-service calls.

Examples:

- `POST /api/mcp/log`
  - `apps/web/app/api/mcp/log/route.ts`
  - requires header: `x-internal-request: true`

- `GET /api/admin/mcp/emergency`
  - allows internal read without admin session
  - Evidence: checks `x-internal-request === 'true'`

---

## Failure modes (what breaks, what you see)

| Layer | Failure | Behavior |
|------:|---------|----------|
| Web UI | No session cookie | middleware redirects to `/login` (`apps/web/middleware.ts`) |
| API | No session + no bearer token | `AuthError` 401 (`apps/web/lib/auth/validateRequest.ts`) |
| Agent token | Revoked/expired/invalid | 401 from `/api/agent-auth/validate` |
| Multi-tenancy | token scoped to different projectId | 403 `PROJECT_ACCESS_DENIED` (`requireProjectAccess`) |
| Tool permissions | tool not in allowlist / in blocklist | tool rejected in MCP server (`apps/mcp-server/src/tools/index.ts`) |
| Global admin controls | emergency shutdown enabled | MCP server rejects requests (see `apps/mcp-server/src/index-http.ts`) |

---

## Exercises (do later)

### Exercise A: Explain security in 60 seconds

Your answer must include:

- [ ] Two auth types: user session vs agent bearer token
- [ ] Project scoping and multi-tenancy enforcement
- [ ] Defense-in-depth (validated at both MCP + API)
- [ ] Tool permission layers (per-token + global admin)

### Exercise B: Trace one endpoint

Open `apps/web/app/api/tickets/route.ts` and find:

1. Where auth happens
2. Where projectId is resolved
3. Where multi-tenancy enforcement occurs

---

## Completion checklist

- [ ] I can explain what’s stored in `ProjectToken` and why hashes are used.
- [ ] I can explain project isolation for both humans and agents.
- [ ] I can explain defense-in-depth without hand-waving.

Next: Day 05 — MCP tool anatomy (schema validation, handler structure, error handling, logging)
