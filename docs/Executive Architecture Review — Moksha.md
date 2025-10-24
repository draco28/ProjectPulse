# Executive Architecture Review — Moksha DevHub

## Executive Summary

Moksha DevHub’s documentation presents a coherent, local-first platform built on Next.js 14 + PostgreSQL + Prisma with MCP-based automation and hybrid search. The core architectural choices are sound and align with your Golden Rules (SoT in docs/, MCP→API pattern, type safety, local-first). To move confidently from “production-ready docs” to an implementation with strong guardrails, tighten security for LAN exposure, formalize validation and testing gates, parameterize search/config, and harden helper-process execution. Minor inconsistencies in docs and a few operational gaps (CI, backups policy, observability) should be addressed early.

## Strengths

- Unified Next.js app with Server Components and API routes; MCP calls API, not DB.
- PostgreSQL-first design leveraging JSONB, tsvector, and pgvector; pragmatic schema.
- Clear hybrid search plan and local embeddings for privacy/cost.
- Extensible domain model across issues, knowledge, wiki, personas, security.
- Practical Docker-based setup and phased delivery roadmap.

## Gaps and Inconsistencies

- Hybrid search weighting is hardcoded; should be configurable (data-driven rule).

```348:383:docs/01-ARCHITECTURE.md
// lib/search.ts (excerpt)
// weights fixed at 0.6/0.4
const merged = mergeResults(fullTextResults, semanticResults, {
  fullTextWeight: 0.6,
  semanticWeight: 0.4,
});
```

- Helper/Security scans use child_process without explicit allowlists/arg sanitization.

```621:662:docs/01-ARCHITECTURE.md
// runSemgrepScan uses exec; needs allowlist, shell:false, resource limits
```

- Docker wording says “single-container” but examples show two services (web+db); clarify intent.

```466:504:docs/01-ARCHITECTURE.md
services:
  postgres: ...
  web: ...
```

- Doc file references: index mentions `03-MCP-SPECIFICATION.md` but repo provides `03-MCP-IMPLEMENTATION-COMPLETE.md`; unify names.
- Emoji/encoding artifacts in some docs; standardize to UTF-8 without mojibake.

## Prioritized Recommendations

### P0 — Before MVP coding starts

1. Security baseline for LAN exposure

- Add optional middleware gate (Basic Auth or token) for `apps/web` when `LAN_EXPOSED=1`.
- Document Windows firewall rule and network scope; default to localhost-only.

2. Validation and error policy

- Standardize Zod validation for all API routes; consistent error envelope and status codes.
- Centralize schemas and reuse between UI, API, and MCP tooling.

3. Quality gates and CI (local-first)

- Enforce `pnpm lint`, `pnpm type-check`, `pnpm build`, `pnpm test --coverage` ≥80%.
- Provide a local CI script and pre-commit hooks; optional GitHub Actions for non-sensitive repos.

4. Child-process hardening (helpers, Semgrep)

- Use spawn with `shell:false`, explicit allowlists for script paths/args, timeouts, output caps.
- Separate worker user/container if feasible; redact secrets in logs.

5. Configurability & data-driven knobs

- Move hybrid search weights, semantic thresholds, and feature flags to a `settings` table.
- Add admin UI or `.env` fallback; read at runtime with in-memory cache + invalidation.

6. Database migrations for extensions & generated columns

- Ensure idempotent migrations enabling `vector`, `pg_trgm`, and generated `tsvector` columns.
- Validate Prisma preview features compatibility pinned to a specific Prisma version.

### P1 — During MVP implementation

7. Observability & ops hygiene

- Structured logging (pino), request IDs, API timing; MCP tool-call audit log.
- Error reporting with minimal PII; rotate logs.

8. Backups & recovery policy

- Scheduled `pg_dump` with retention (7 daily, 4 weekly, 3 monthly); documented restore drill.
- Optional gzip+checksum; store outside container volumes.

9. Performance guards

- Confirm indexes for common filters; verify HNSW params (M, ef_construction, ef_search).
- Add pagination defaults; cap payload sizes in API responses and MCP results.

10. Testing depth

- Unit: services/utilities; API: route contracts; DB: relationship + FTS/vector smoke.
- E2E: core flows (issue CRUD, search, attachments) and MCP happy paths.

### P2 — Post-MVP hardening

11. Multi-user readiness plan

- Authn gateway (NextAuth or basic token), RBAC, and (future) RLS policies.

12. Caching strategy

- Cache embeddings and search results; background recompute on content changes.

13. Documentation hygiene

- Normalize file names/links (`03-...`), remove mojibake, and add an ADR index.

## Targeted Follow-ups (where-to-change)

- API validation utilities: `apps/web/app/api/_lib/validation.ts` (new) with shared Zod schemas; import in route handlers like `app/api/issues/route.ts`.
- Settings: `apps/web/prisma/schema.prisma` add `Setting { key, value, updatedAt }`; seed defaults; read via `lib/settings.ts`.
- Search config: `apps/web/lib/search.ts` read weights/thresholds from settings with sane fallbacks.
- Process hardening: `apps/web/lib/helpers.ts`, `apps/web/lib/security.ts` switch to spawn, validate args, add timeouts.
- CI and hooks: root `scripts/local-ci.(ps1|sh)`, `.husky/` pre-commit; optional `.github/workflows/ci.yml` for public mirrors.
- Backups: `scripts/backup.ps1` with retention; doc in `docs/07-QUICK-START.md` and `docs/README.md`.
- Docs cleanup: fix `03-...` references and encoding; add “Security & Ops” appendix.

## Acceptance Criteria (aligned to Quality Gates)

- Lint/typecheck/build pass; tests ≥80% coverage; Playwright E2E covers MVP flows.
- All API routes validate input with Zod; consistent error schema.
- Hybrid search weights read from DB settings; changing value affects behavior without redeploy.
- Helper and Semgrep execution constrained (allowlist, shell:false, timeouts, output caps) and audited.
- Backups scheduled and restorable; documented drill succeeds.
- Docs references consistent; encoding normalized; MCP pattern intact.
