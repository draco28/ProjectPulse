# Agent OAuth & Project Settings Spec

**Context:** Multi-Project Agent Access / Mac-Mini Cloud (Sprint 9)

**Owner:** You + Cascade (pair programming)  
**Location:** `.agent/task/agent-oauth/`  
**Scope:** Agent bearer tokens, MCP auth, project settings page

---

## 1. High-Level Goal

ProjectPulse now has:

- User auth and `/app` dashboard (multi-project). 
- Project-aware pages after `/app` (auth-dashboard spec). 
- A rich MCP tool surface (issues, roadmap, onboarding, wiki, etc.).

**Missing piece:** A secure, project-scoped way for **external agents (Claude, Windsurf, etc.)** to access the MCP tools without leaking data across projects.

This spec defines **Agent OAuth & Project Settings** for **Sprint 9** so that:

- Each **Project** can have multiple **Agent tokens** (one per persona / client).
- Every MCP call uses an **opaque bearer token** (`Authorization: Bearer <token>`).
- The token is validated on the **web app** (Next.js) and mapped to a single `projectId`.
- All MCP tools are **automatically scoped** to that `projectId` (no cross-project access).
- Humans manage tokens and controls from a **Project Settings page**.

Architecture assumptions:

- The **Mac mini is the cloud** – all core services (Postgres, Redis, Next.js, MCP) run on the Mac mini through Docker.
- Exposure to the internet is done via **Cloudflare Tunnel**, but data stays on the Mac mini.
- **Redis is available and used in both dev and prod** (no Upstash / external rate limiting).
- MCP server uses **Streamable HTTP** (`/mcp` POST endpoint, Express-based, stateless per request).
- MCP server **does not talk directly to Postgres**; it calls the Next.js API (R-MCP-001).

This spec is designed so **you can follow it line by line** to implement Agent OAuth and Settings, with Cascade assisting on code and tests.

---

## 2. Current State (Summary)

### 2.1 MCP Server

- Location: `apps/mcp-server/src/index-http.ts`
- Transport: `StreamableHTTPServerTransport` via Express:
  - `POST /mcp` – MCP JSON-RPC over HTTP.
  - No authentication yet.
- Middleware on `/mcp` currently fixes `Accept` headers for SDK compatibility.
- Tools are registered once via `registerTools(server, { config, logger, httpClient })`.

**Important:** MCP requests are currently **stateless** – each `/mcp` POST is independent. Session semantics (project context, etc.) must be handled at the app level.

### 2.2 Web App & Projects API

- Project model (Prisma) is **already defined**:

```prisma
model Project {
  id          Int     @id @default(autoincrement())
  name        String  @unique
  description String? @db.Text
  repository  String?

  ownerId String
  owner   User   @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  issues              Issue[]
  skills              Skill[]
  onboardingSessions  OnboardingSession[]
  workflowRuns        WorkflowRun[]
  workflowTemplates   WorkflowTemplate[]
  healthScanners      HealthScanner[]
  healthScores        HealthScore[]
  roadmap             Roadmap?
  developmentSessions DevelopmentSession[]
  currentPlan         CurrentPlan?
  currentTodos        CurrentTodos?
  agentPersonas       AgentPersona[]
  sops                SOP[]
  knowledgeItems      KnowledgeItem[]
  securityFindings    SecurityFinding[]
  wikiPages           WikiPage[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([name])
  @@index([ownerId])
}
```

- `GET /api/projects` and `POST /api/projects` already exist in `apps/web/app/api/projects/route.ts`.
- Auth-dashboard spec defines **project-aware patterns** using `getActiveProjectForUser` and `?project=<id>`.

### 2.3 Redis & Session Infrastructure

- Redis is configured and used by `RedisSessionStore` in `apps/web/lib/mcp/session-store.ts` for MCP sessions.
- `InMemorySessionStore` exists as a fallback, but for **Agent OAuth** we will **standardize on Redis** (dev + prod) for:
  - Session storage.
  - Optional caching (e.g., token validation results).

**Gap:** There is no concept of **project-scoped agent tokens**, no Project Settings UI, and no MCP auth that enforces `projectId` per token.

---

## 3. Data Model Changes (Prisma)

### 3.1 Extend `Project` with Tokens & Settings

**Goal:** Every Project can have multiple Agent tokens and a boolean toggle to allow MCP to write helper files (e.g., `CLAUDE.md`, `AGENTS.md`) into the repo.

**Change:** Extend the existing `Project` model:

```prisma
model Project {
  // ...existing fields...

  tokens        ProjectToken[]
  mcpWriteFiles Boolean @default(false)
}
```

Notes:

- `tokens` – one-to-many relation to `ProjectToken` (defined below).
- `mcpWriteFiles` – **opt-in** for repo writes during onboarding/bootstrap.

### 3.2 New Model: `ProjectToken` (Opaque Bearer Tokens)

We use **opaque random tokens** (not JWT) as bearer tokens:

- Agents send: `Authorization: Bearer <token>`.
- The web app validates them via DB + bcrypt.
- MCP server never sees DB directly – only a validation response from the web app.

**Model:**

```prisma
model ProjectToken {
  id        Int      @id @default(autoincrement())
  projectId Int
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  name      String   // e.g., "Frontend Claude", "Backend Claude"
  tokenHash String   // bcrypt hash of the opaque token
  expiresAt DateTime?
  lastUsedAt DateTime?
  isRevoked Boolean  @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([projectId, name])
  @@index([projectId, isRevoked, expiresAt])
  @@map("project_tokens")
}
```

Key points:

- `projectId` is **Int**, matching existing `Project.id`.
- Plaintext tokens are **never stored**; only `tokenHash` is persisted.
- `name` is a human-friendly label for each agent/client.
- `expiresAt` + `isRevoked` control validity; `lastUsedAt` is for monitoring.

### 3.3 Migration Plan

**Dev:**

1. Add fields/model to `schema.prisma`.
2. Run `pnpm prisma migrate dev --name agent-oauth-and-settings` in `apps/web`.
3. Verify new tables/columns using Prisma Studio or psql.

**Prod:**

1. Build production images (`docker-compose.production.yml`).
2. Run `pnpm prisma migrate deploy` in a production-safe context.
3. Confirm health via `/api/health`.

No destructive changes to existing models.

---

## 4. Agent Tokens & Validation Flow

### 4.1 Token Generation (Web App Service)

**Responsibility:** Next.js app manages token lifecycle (generate, validate, revoke). MCP server delegates token checks to it.

Conceptual token generation helper (inside `apps/web`, e.g., `lib/agent-tokens.ts`):

```ts
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function generateProjectToken(projectId: number, name: string, days = 30) {
  const existing = await prisma.projectToken.findFirst({
    where: { projectId, name, isRevoked: false },
  });
  if (existing) {
    throw new Error('A token with this name already exists for this project');
  }

  const token = randomBytes(32).toString('hex'); // 64-char secret
  const hash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + days * 86400000);

  const record = await prisma.projectToken.create({
    data: { projectId, name, tokenHash: hash, expiresAt },
  });

  return { token, id: record.id, name: record.name, expiresAt: record.expiresAt };
}
```

Properties:

- Opaque token, suitable for `Authorization: Bearer <token>`.
- Returned **only once** – the client must copy/store it.

### 4.2 Token Validation Endpoint (Web App)

Create an internal API route, e.g.: `POST /api/agent-auth/validate`.

**Input:**

```json
{ "token": "<opaque-bearer-token>" }
```

**Behavior:**

1. (Optional) Check Redis cache: `agentToken:<shortHash>` → `{ projectId, tokenId, name }`.
2. If cache miss:
   - Load candidate tokens from `ProjectToken` where:
     - `isRevoked = false`.
     - `expiresAt` is null or greater than now.
   - Compare `bcrypt.compare(rawToken, tokenHash)` until a match.
3. On success:
   - Update `lastUsedAt`.
   - Cache minimal info in Redis with short TTL (e.g., 5–10 minutes).
   - Return `{ projectId, tokenId, name }`.
4. On failure: return HTTP 401.

**Response (success):**

```json
{ "projectId": 123, "tokenId": 45, "name": "Frontend Claude" }
```

### 4.3 Token Revocation

Project Settings page will call a revoke endpoint, e.g. `POST /api/projects/[id]/tokens/[tokenId]/revoke`.

Behavior:

- Verify user owns the project.
- Set `isRevoked = true`.
- Optionally clear related Redis cache entries.

---

## 5. MCP Auth Integration (Streamable HTTP + Express)

### 5.1 Current MCP Entrypoint

`apps/mcp-server/src/index-http.ts` currently:

- Creates `Server` + `StreamableHTTPServerTransport`.
- Registers tools once with `registerTools`.
- Uses Express with:
  - `app.use(express.json())`.
  - `app.use('/mcp', <Accept header fix middleware>)`.
  - `app.post('/mcp', async (req, res) => { ...transport.handleRequest(req, res, req.body) })`.

There is **no auth** yet.

### 5.2 Add Agent Bearer Auth Middleware

Add a new middleware on `/mcp` **after** JSON parsing and Accept fix, but **before** the POST handler:

- Read `Authorization` header.
- If missing or malformed → 401.
- Extract token, call Next.js API `/api/agent-auth/validate` using existing `httpClient`.
- On success, attach `{ projectId, tokenId, name }` to `req` (e.g., `req.agentAuth`).
- On failure, return 401.

Conceptual middleware:

```ts
app.use('/mcp', async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const rawToken = auth.slice('Bearer '.length);

  try {
    const response = await httpClient.post('/api/agent-auth/validate', { token: rawToken });
    (req as any).agentAuth = response.data; // { projectId, tokenId, name }
    return next();
  } catch (error: any) {
    logger.warn('Agent auth failed', { error: error.message });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});
```

**Constraints:**

- MCP server **never** talks directly to Postgres. All auth flows through the web app.
- Middleware applies to **all** MCP calls (tools/list, tools/call, etc.).

### 5.3 Passing `projectId` to Tools

Inside `registerTools(server, { config, logger, httpClient })`, ensure that each tool gets a context that includes `projectId` from `req.agentAuth`.

Patterns:

- Use the MCP SDK’s ability to pass custom context (e.g., `ToolContext` with a `projectId: number` field).
- All tools that currently accept `projectId` as an argument should be refactored to **ignore client-supplied `projectId`** and instead read it from context.

**Rule:**

> MCP clients must **not** be able to override `projectId` via tool parameters. Project scoping is decided purely by the validated bearer token.

---

## 6. Project Settings Page

### 6.1 Route & Layout

New page:

- `apps/web/app/projects/[id]/settings/page.tsx`

Requirements:

- Protected by user auth (`requireUser` / `getCurrentUser`).
- Only the project owner can access (`project.ownerId === user.id`).
- `id` is an `Int` (parsed from the route segment).

### 6.2 UI Sections

**1) Header**

- Title: `Project Settings`.
- Subtitle: Show project name and ID.

**2) Agent Tokens**

- Table listing existing tokens:
  - Columns: Name, Created, Expires, Last Used, Status (Active/Revoked), Actions (Revoke).
- “Generate New Token” button opens modal:
  - Fields: Name (string), Expiry (7 / 30 / 90 days or custom).
  - On submit:
    - Calls `POST /api/projects/[id]/tokens`.
    - Receives `{ token, name, expiresAt }`.
    - Shows a copy-only box with the plaintext token:
      - Message: **“Copy this token now – you won’t be able to see it again.”**

**3) Controls**

- Toggle switch bound to `Project.mcpWriteFiles`:
  - Label: “Allow MCP to write helper files (`CLAUDE.md`, `AGENTS.md`) into the repo during onboarding.”
  - Calls `PATCH /api/projects/[id]` (or equivalent) to save.
- Read-only MCP endpoint field:
  - Value: e.g., `https://mcp.your-domain.com/mcp` (configurable via env).
  - Copy button to help configure agents quickly.
- Short instructions for configuring Claude/Windsurf, e.g.:
  - “Set MCP URL to `<endpoint>` and add `Authorization: Bearer <token>` header.”

### 6.3 Settings APIs

New endpoints under `apps/web/app/api/projects/[id]/tokens`:

1. `GET /api/projects/[id]/tokens`
   - Auth: require user; verify ownership.
   - Returns tokens (without `tokenHash`): `{ id, name, createdAt, expiresAt, lastUsedAt, isRevoked }[]`.

2. `POST /api/projects/[id]/tokens`
   - Body: `{ name: string, expiresInDays?: number }`.
   - Auth + ownership check.
   - Calls `generateProjectToken(projectId, name, expiresInDays)`.
   - Returns `{ token, name, expiresAt }` (plaintext once).

3. `POST /api/projects/[id]/tokens/[tokenId]/revoke`
   - Auth + ownership check.
   - Marks `isRevoked = true`.

4. `PATCH /api/projects/[id]` (if not already present)
   - Extend existing handler (or create one) to update `mcpWriteFiles`.

---

## 7. Infrastructure & Environment

### 7.1 Mac-Mini Cloud & Docker

- Both dev and prod run via Docker on the **Mac mini**.
- We treat the Mac mini as our “cloud server”.
- All core services (Postgres, Redis, Next.js, MCP) are local to the Mac mini.
- Cloudflare Tunnel is responsible for exposing the web and MCP endpoints to the internet.

### 7.2 Redis Usage

- **Dev and prod** both use Redis via `REDIS_URL`.
- Session stores and optional token caches share the same Redis instance.
- In-memory store remains a fallback for extreme cases, but **not** the default path.

### 7.3 No External Cloud Dependencies

- No Supabase, Upstash, or external DB/rate limiter.
- All data and control remain on the Mac mini.

---

## 8. Implementation Plan (Sprint 9)

High-level breakdown (can be mapped to days/points later):

1. **Prisma & Migrations**
   - Extend `Project` with `tokens` and `mcpWriteFiles`.
   - Add `ProjectToken` model.
   - Run `prisma migrate dev` (dev) and plan for `migrate deploy` (prod).

2. **Token Service & APIs**
   - Implement `generateProjectToken`, validate & revoke helpers in `apps/web`.
   - Add `/api/projects/[id]/tokens*` endpoints.
   - Add `/api/agent-auth/validate` endpoint.

3. **MCP Server Auth Middleware**
   - Add bearer auth middleware on `/mcp` in `apps/mcp-server/src/index-http.ts`.
   - Call `/api/agent-auth/validate` via `httpClient`.
   - Attach `{ projectId, tokenId, name }` to `req`.

4. **Tool Context & Scoping**
   - Propagate `projectId` into tool context in `registerTools`.
   - Ensure all tools use context `projectId` instead of trusting client params.

5. **Project Settings Page**
   - Create `app/projects/[id]/settings/page.tsx`.
   - Implement token table, generate modal, revoke actions, toggles.

6. **Testing & Validation**
   - Unit tests for token service, validate endpoint.
   - Integration tests for `/api/projects/[id]/tokens` and `/api/agent-auth/validate`.
   - Manual/E2E tests for full loop:
     - User generates token → configures agent → agent calls MCP tools → data is correctly scoped.

---

## 9. Testing Plan (What You Can Run Yourself)

### 9.1 Manual Flows

1. **Single user, single project**
   - Login, create project, go to `/projects/[id]/settings`.
   - Generate token `"Frontend Claude"`.
   - Configure an agent with MCP endpoint and bearer token.
   - Call a project-scoped MCP tool (e.g., issues search) and verify data belongs only to that project.

2. **Single user, multiple projects**
   - Create Project A and Project B.
   - Generate separate tokens for each.
   - Configure two agent configs, each with a different token.
   - Verify each agent only sees its own project’s data.

3. **Revocation**
   - Revoke a token in Settings.
   - Next MCP call with that token should return 401.

### 9.2 Automated / Semi-Automated

- Add tests to verify:
  - `ProjectToken` constraints (unique per project+name).
  - Token generation returns a token and stores hash.
  - Expired tokens are rejected.
  - Revoked tokens are rejected.
  - MCP `/mcp` without Authorization returns 401.
  - MCP `/mcp` with valid token reaches tools and tools receive correct `projectId`.

---

## 10. How to Use This Spec

- Treat each section as a **small, focused task**:
  - Data model & migrations.
  - Token helpers & APIs.
  - MCP middleware.
  - Tool context wiring.
  - Project Settings UI.
- Implement step by step, using Cascade for:
  - Line-level TypeScript/Prisma guidance.
  - MCP SDK wiring and Express middleware details.
  - Debugging any auth or scoping issues.

Once completed, ProjectPulse will support **multi-user, multi-project, multi-agent** workflows on your **Mac-mini cloud**, with strong, project-scoped Agent OAuth and a clean Project Settings UI for humans to manage tokens and controls.
