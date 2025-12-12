# HTTP API Route Inventory (Sprint 11 As-Built)

This document summarizes the **primary HTTP endpoints** exposed by the Sprint 11 Next.js application under `/api/*`. It is a **human-readable inventory**, not a full OpenAPI specification. For canonical behavior, always refer to the route handlers in `apps/web/app/api/*`.

---

## 1. Health & System Status

- **GET `/api/health`**  
  Returns overall system status, including:
  - Database connectivity
  - Onboarding seed data readiness (questions, templates)
  - Session store/Redis health
  - Overall `healthy`/`unhealthy` flag and HTTP status (200 vs 503)

---

## 2. Agent Authentication (MCP Tokens)

- **POST `/api/agent-auth/validate`**  
  Internal API used by the MCP server to validate **agent bearer tokens**. On success, returns:
  - Project context (`projectId`)
  - Token metadata (`tokenId`, name)
  - Tool restriction lists (`allowedTools`, `blockedTools` in Sprint 11)
  On failure, returns `401` for invalid/expired/revoked tokens.

---

## 3. Tickets (Unified Work Item API)

Tickets are the **canonical work items** in Sprint 11. "Issues" are represented as tickets with specific `kind` values (e.g. `issue`, `bug`, `scanner_finding`).

- **GET `/api/tickets`**  
  Paginated ticket listing with rich filters, including:
  - `projectId`, `kind`, `status`, `priority`, `module`, `assignee`, `tags`
  - Text search (`search`) across title/description
  - Date range (`createdFrom`, `createdTo`)
  - Pagination (`page`, `pageSize`) and sorting (`sortBy`, `sortDirection`)
  All queries are project‑scoped using the authenticated user or agent token.

- **POST `/api/tickets`**  
  Create a new ticket in the current project using the unified Ticket schema. Supports:
  - Multiple ticket kinds (feature, task, epic, issue, bug, scanner_finding, tech_debt)
  - Optional module, priority, labels, custom fields
  - Optional linkage to sprint tasks via `linkedTaskId`
  - Auto‑tagging based on content and linked files (when provided)

> **MCP Integration:** The MCP Ticket tools (`projectpulse_ticket_*`) call these HTTP endpoints behind the scenes; they do not access the database directly.

---

## 4. MCP HTTP Bridge (Next.js App)

> **Sprint 11 Architecture Note:** The production MCP server runs as a **dedicated HTTP service** in `apps/mcp-server` (listening on its own port, e.g. `3001`, with endpoint `/mcp`). The Next.js route below represents the earlier in‑app MCP HTTP bridge and is kept for compatibility/design reference.

- **POST `/api/mcp`**  
  Handles JSON‑RPC 2.0 requests for MCP tools over HTTP. Responsibilities include:
  - Session management via `Mcp-Session-Id` header
  - Dispatching MCP `tools/list` and `tools/call` methods
  - Routing tool invocations to domain‑specific handlers for tickets, knowledge, skills, health, etc.

In the Sprint 11 deployment model, external AI agents should prefer the **dedicated MCP HTTP server** documented in `docs/03-MCP-SPECIFICATION.md`.

---

## 5. Other Domain APIs (Design/Planned)

The OpenAPI design file (`openapi.yaml`) also describes additional conceptual endpoints for:

- **Sprint tracking & roadmap** (e.g. `/sprint/*`, `/workflow/*`)
- **Onboarding & blueprint retrieval** (e.g. `/onboarding/blueprint`)
- **Workflow orchestration** (5‑step protocol endpoints under `/workflow/*`)

Some of these routes are **partially or not yet implemented** in the Sprint 11 codebase. Treat the OpenAPI paths as:

- **Authoritative for intent** (what the system is meant to provide)
- **Non‑authoritative for implementation status** (must be cross‑checked against `apps/web/app/api/*`)

Future sprints can either:

- Implement these routes to match the design exactly, or
- Replace them with more granular Next.js API routes and update the docs accordingly.

---

## 6. How to Use This Inventory

- Use this file to quickly understand **which HTTP endpoints exist** and how they relate to:
  - Tickets and work management
  - Agent token validation and MCP integration
  - System health and deployment monitoring
- For **exact request/response schemas**, rely on:
  - The actual route handlers in `apps/web/app/api/*`
  - The legacy OpenAPI design in `openapi.yaml` (with Sprint 11 caveats documented there).
