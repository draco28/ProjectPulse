# Workflow 04 — API Endpoint Implementation

Steps:

1. Define Zod schemas for request/response/error
2. Implement route handler under apps/web/app/api/.../route.ts
3. Implement service for DB logic; Prisma with parameterized queries
4. Add integration tests (200, 400 validation, 403/404 as applicable)
5. Update API catalog docs
6. Verification Gate (Workflow 11)

Acceptance:

- Schemas stable, no any; no $queryRawUnsafe
- Tests green with coverage ≥80% for new code

References: rules/05, rules/07, rules/08
