# Prisma Expert Consultation — Test Data & Queries

Date: 2025-10-28 18:58 (UTC+05:30)
Phase: Week 1.5 Phase 3 — Testing & QA
Branch: feature/phase3-testing-qa

---

## Goals

- Ensure tests run against stable, realistic seed data.
- Avoid flaky assertions caused by dynamic datasets.

## Recommendations

- Seed Strategy: Use the existing seed (apps/web/prisma/seed.ts) to ensure entities exist for Knowledge, Wiki, Security, Agents.
- Stability:
  - Prefer presence/visibility checks over exact counts.
  - For entities like AgentPersona where toggle mutates DB, toggle back in test teardown or at test end to restore state.
- Query Patterns (app side):
  - Continue using Prisma with `select/include` for minimal data fetching (performance) as per system-patterns.md.
  - Parameterized queries only; no raw string interpolation (R-SEC-001). `$queryRaw` template literals are acceptable.
- Test Isolation (optional):
  - If a suite needs a dedicated state, consider using unique slugs or timestamps in created test records to assert presence without interfering with existing items.
  - Avoid destructive cleanup in E2E; prefer no-op or reversible actions.

## Outcome

Leverage seeded data and reversible UI actions to maintain DB stability across repeated E2E runs. Keep queries optimized and parameterized to meet security and performance standards.
