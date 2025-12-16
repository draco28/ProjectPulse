# Day 02 — Web App Architecture (Next.js App Router, RSC vs Client, API routes)

## Goals (what you should understand today)

By the end of Day 02, you should be able to explain:

1. How `apps/web/` is both:
   - a **frontend** (React UI pages)
   - and a **backend** (API routes + server-side data access)
2. The Next.js App Router mental model:
   - `page.tsx`, `layout.tsx`, `route.ts`, route groups `(…)`, dynamic routes `[id]`, catch-all `[...slug]`
3. The difference between:
   - **React Server Components (RSC)** and **Client Components**
   - and why ProjectPulse uses both
4. The API route pattern used in this repo:
   - validation + auth + project scoping + calling service layer

---

## First: where is the “backend” in your 3-container setup?

You have **three runtime containers**:

- **Next.js (apps/web)**
- **PostgreSQL**
- **MCP Server (apps/mcp-server)**

In interviews, the clean explanation is:

- The **core backend** is the **Next.js server** in `apps/web/`.
  - It exposes HTTP endpoints under `apps/web/app/api/**`.
  - It contains business logic in `apps/web/lib/**`.
  - It talks to PostgreSQL via Prisma.
- The **MCP server** is also a backend service, but it is an **agent gateway/adapter**, not the system of record.
  - It exposes MCP tools to agents.
  - It forwards requests to the Next.js API (so the API remains the single contract).

A strong system-design phrasing:

- “ProjectPulse has a **Next.js backend** (API routes + server-side rendering) and an **MCP integration backend** (agent tool gateway). PostgreSQL is the persistent store. Agents and humans both converge on the same API/business logic.”

Concrete evidence:

- Next.js API routes live in: `apps/web/app/api/**`
  - Example: `apps/web/app/api/knowledge/search/route.ts`
  - Example: `apps/web/app/api/health/route.ts`
- MCP tools proxy to APIs:
  - `apps/mcp-server/src/tools/knowledge/searchTool.ts`
  - HTTP forwarding: `apps/mcp-server/src/httpClient.ts`

---

## Repo map: `apps/web/app/` (App Router)

This folder defines both UI routes and API routes:

- UI root layout:
  - `apps/web/app/layout.tsx`
- Root page:
  - `apps/web/app/page.tsx`
- Authenticated route group layout:
  - `apps/web/app/(authenticated)/layout.tsx`
- Example pages:
  - `apps/web/app/dashboard/page.tsx`
  - `apps/web/app/knowledge/page.tsx`
  - `apps/web/app/wiki/[...slug]/page.tsx`
- API routes live under:
  - `apps/web/app/api/**/route.ts`

### App Router conventions (interview-friendly)

- `page.tsx` defines a route.
  - Example: `apps/web/app/dashboard/page.tsx` → `/dashboard`
- `layout.tsx` defines shared UI wrapper for routes.
  - Example: `apps/web/app/(authenticated)/layout.tsx` wraps authenticated pages with sidebar + background.
- Route groups `(authenticated)` group routes without changing the URL.
- `route.ts` defines an API endpoint.
  - Example: `apps/web/app/api/health/route.ts` → `GET /api/health`

---

## React Server Components (RSC) vs Client Components (how it works here)

### Server Components (default)

In App Router, files are **Server Components by default**.

What that means:

- Code runs on the server.
- You can safely call database or internal services.
- You can redirect before rendering.

Concrete evidence in this repo:

- `apps/web/app/page.tsx`
  - calls `getCurrentUser()` (server-side auth)
  - redirects with `redirect()`
- `apps/web/app/dashboard/page.tsx`
  - explicitly sets `export const dynamic = 'force-dynamic'`
  - uses Prisma directly to query PostgreSQL on the server

How to explain “backend inside frontend”:

- In Next.js App Router, a **Server Component page is effectively backend code** (it runs on the server), but it still produces UI.

### Client Components (`'use client'`)

Client Components are needed for:

- interactivity (forms, buttons with state)
- browser-only APIs
- React hooks like `useState`, `useEffect`

In this repo, you can find client components via `'use client'` declarations inside `apps/web/app/**`.

Interview wording:

- “We default to Server Components for performance and security (server-side data access), and only use Client Components for interactive widgets.”

---

## Next.js API routes = your backend HTTP contract

### What an API route is (in this repo)

An API route is a server endpoint implemented as:

- `apps/web/app/api/**/route.ts`

Example:

- `apps/web/app/api/health/route.ts`
  - exports `GET()`
  - checks database connectivity with Prisma
  - checks session store health via `@/lib/mcp/session-manager`

This is backend behavior:

- It accepts a request.
- It runs business/infra checks.
- It returns JSON + HTTP status codes.

### Typical API route pattern (what to say in interviews)

When describing ProjectPulse API routes, use this structure:

1. **Parse input** (query params / JSON body)
2. **Validate** (Zod)
3. **Authenticate** (user session OR agent token)
4. **Authorize + scope** to `projectId`
5. **Call service layer** in `apps/web/lib/**`
6. Return structured JSON (and error codes)

Concrete auth evidence:

- `apps/web/lib/auth/validateRequest.ts`
  - `requireAuth()`
  - `requireProjectAccess()`
  - `getAuthorizedProjectId()`

---

## Where business logic lives (so you don’t say “backend is only API routes”)

In ProjectPulse, backend logic is split across:

- **API routes** (HTTP contract): `apps/web/app/api/**`
- **Service modules** (core logic): `apps/web/lib/**`
- **Server Components** (orchestration + rendering): `apps/web/app/**/page.tsx`

Example chain you can cite:

- Agent calls MCP tool `projectpulse_knowledge_search`
- MCP calls API `GET /api/knowledge/search`
- API route calls service `apps/web/lib/knowledge/search.ts`
- Service reads Postgres (`knowledge_items`) and returns ranked results

---

## System design terminology (useful in interviews)

- **Backend-for-Frontend (BFF)**:
  - Next.js API routes act as a BFF for the web UI.
- **Gateway / Adapter**:
  - MCP server is an adapter that turns agent tool calls into HTTP API requests.
- **Monorepo, multi-service runtime**:
  - single repo, multiple deployed services (Next.js + MCP + Postgres).
- **Single Source of Truth**:
  - PostgreSQL is the authoritative store; MCP does not own data.

---

## Exercises (do later, after tutorial is complete)

### Exercise A: “Where is the backend?” (10 sentences)

Write an interview-ready answer that includes:

- [ ] Next.js API routes are the core backend (`apps/web/app/api/**`).
- [ ] Server Components run on the server (backend execution) but render UI.
- [ ] MCP server is a separate backend service for agents (gateway), not the system of record.
- [ ] PostgreSQL is the database.

### Exercise B: Code tracing (15 minutes)

1. Open `apps/web/app/api/health/route.ts` and list:
   - what components it checks
   - what status code it returns when unhealthy
2. Open `apps/web/app/dashboard/page.tsx` and identify:
   - which parts are server-only
   - where Prisma is called

---

## Completion checklist

- [ ] I can explain App Router file conventions with examples.
- [ ] I can explain RSC vs Client Components and why both exist.
- [ ] I can clearly answer “where is your backend?” for this stack.

Next: Day 03 — MCP server architecture (HTTP streaming transport, tool registry, request lifecycle)
