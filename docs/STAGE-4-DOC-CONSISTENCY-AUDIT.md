# Stage 4 – Documentation Consistency Audit (Sprint 11)

This document summarizes remaining references to **legacy concepts** (Moksha, Issue-centric APIs/UI, stdio MCP, legacy tool names) after the Stage 1–3 documentation updates. Items are classified as either:

- **INTENTIONAL-LEGACY** – Kept on purpose as historical/design reference, clearly labeled in-context.
- **FOLLOW-UP-CANDIDATE** – Safe to keep for now, but worth revisiting in a future cleanup sprint.

---

## 1. Moksha & Issue-Centric Architecture

- **File:** `docs/01-ARCHITECTURE.md`
- **Context:**
  - References to `MOKSHA_PROJECT_ROOT` and `moksha-db` in security/backup examples.
  - "Issue Creation Flow" and MCP flow diagrams showing `create_issue` → `/api/issues` → Issue UI.
- **Status:** `INTENTIONAL-LEGACY`
- **Rationale:**
  - This file documents the **original Moksha devhub architecture**. The as-built Sprint 11 system uses a unified Ticket model and different infra, now captured in:
    - `docs/02-DATABASE-SCHEMA.md` (Sprint 11 Ticket schema overview)
    - `docs/03-MCP-SPECIFICATION.md` (Sprint 11 HTTP MCP server + Ticket tools)
    - `docs/06-API/openapi.yaml` + `docs/06-API/HTTP-API-ROUTE-INVENTORY.md` (HTTP API surface)
  - The Moksha/Issue content is valuable as design history and is not referenced as the current live implementation.

---

## 2. MCP Legacy Issue Tools in Spec

- **File:** `docs/03-MCP-SPECIFICATION.md`
- **Context:**
  - Detailed definitions of `create_issue`, `search_issues`, `update_issue`, etc.
  - Example implementation calling `POST /api/issues`.
- **Status:** `INTENTIONAL-LEGACY`
- **Rationale:**
  - The Sprint 11 updates explicitly frame this section as:
    - "original Moksha Issue-based tool suite" and **legacy**.
    - Mapped conceptually to Ticket tools via a **Legacy Note** that points to `projectpulse_ticket_*` and `/api/tickets`.
  - The top of the file clearly documents the Sprint 11 HTTP MCP server and unified Ticket tools as canonical.

---

## 3. Legacy Issue ERD & Persona Tool Names

- **File:** `docs/02-DATABASE-SCHEMA.md`
- **Contexts:**
  1. **Legacy Issue ERD**
     - Block labeled **"Legacy Diagram (Issue-centric, Moksha prototype) – Archived"**, with old Issue-based schema.
     - Canonical Sprint 11 Ticket schema is described separately and points to `apps/web/prisma/schema.prisma`.
     - **Status:** `INTENTIONAL-LEGACY`.
  2. **Persona tool lists**
     - Seed examples where personas list tools such as `create_issue`, `search_issues`, `search_knowledge`.
     - These match the actual seeded data in `apps/web/lib/onboarding/create-agent-personas.ts` and the MCP tool compatibility layer (`issue.*` adapters and `projectpulse_ticket_*`).
     - **Status:** `FOLLOW-UP-CANDIDATE`.
     - **Note:** For Sprint 11, this is acceptable because:
       - The MCP spec explains how Issue-style tools map onto Ticket tools.
       - The database actually stores these tool names for compatibility.
     - Future cleanup could add a short inline note clarifying that these tools are implemented via Ticket APIs.

---

## 4. OpenAPI Design vs As-Built HTTP API

- **File:** `docs/06-API/openapi.yaml`
- **Context:**
  - Describes a MCP-centric API surface with paths like `/sprint/*`, `/workflow/*`, `/onboarding/*` and Issues Management.
  - Now includes a **"Sprint 11 As-Built Note"** and updated `servers` section:
    - HTTP API under `/api/*` as canonical.
    - `stdio://projectpulse` server marked as legacy.
  - Tag description for **Issues Management** explains mapping to the unified Ticket model and `/api/tickets`.
  - All concrete examples of `POST /api/issues` have been updated to `/api/tickets`.
- **Status:** `INTENTIONAL-LEGACY`.
- **Rationale:**
  - This file is explicitly documented as a **design/legacy reference**, not as the canonical runtime spec.
  - Any remaining mismatch is clearly called out in the header comments.

---

## 5. HTTP API Route Inventory

- **File:** `docs/06-API/HTTP-API-ROUTE-INVENTORY.md`
- **Context:**
  - Summarizes the as-built HTTP endpoints:
    - `/api/health`
    - `/api/agent-auth/validate`
    - `/api/tickets` (GET/POST)
    - `/api/mcp` (in-app bridge; noted as secondary to dedicated MCP server)
  - Clarifies the relationship between route inventory, OpenAPI design, and actual code under `apps/web/app/api/*`.
- **Status:** `CANONICAL-SUMMARY` (no legacy issues detected).

---

## 6. Code-Level Legacy References (for completeness)

Some legacy names remain in **code**, which is acceptable for compatibility and does not affect doc truthfulness:

- **File:** `apps/web/lib/onboarding/create-agent-personas.ts`
  - Personas reference tools like `create_issue`, `search_knowledge`, `wiki_generate`.
  - These names correspond to actual MCP tools and/or compatibility adapters in the MCP layer.
  - **Status:** `INTENTIONAL-LEGACY` (runtime compatibility; not a doc problem).

- **File:** `apps/mcp-server/src/tools/tickets/*.ts` and related handlers
  - Ticket tools implement the canonical `/api/tickets` HTTP API.
  - Old Issue tool names are handled via adapter tools for backwards compatibility.
  - **Status:** `CANONICAL-RUNTIME`.

---

## 7. Overall Assessment for Sign-Off

- All major documentation layers (DB schema, MCP spec, API/OpenAPI, HTTP route inventory) now:
  - Reflect the **Sprint 11 as-built system** (unified Ticket model + HTTP MCP server + Next.js HTTP API), and
  - Clearly mark Issue/Moksha/stdio-specific designs as **legacy** or **archived** where they appear.
- Remaining references to `create_issue`, `search_issues`, `/api/issues`, and Moksha-era flows either:
  - Live in clearly-labeled legacy/design sections, or
  - Represent seeded persona/tool data that is still valid at runtime and explained in the MCP spec.

**Conclusion:**

From a documentation perspective, the ProjectPulse docs are now **internally consistent** with the Sprint 11 MVP implementation. Legacy Issue/Moksha content is quarantined as historical/design-only, and the canonical runtime surfaces (Tickets, HTTP MCP server, Next.js APIs) are clearly identified.
