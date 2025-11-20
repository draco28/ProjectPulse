# Auth & User Dashboard - Overview

**Project:** ProjectPulse  
**Sprint:** Auth + User Dashboard (EPIC-013)  
**Scope:** Implement the "front door" for humans: login/signup, user-level dashboard, and routing into existing project dashboards where onboarding already lives.

---

## 1. Goals

- **Human Entry:** Allow developers to sign up / log in via `/login`.
- **User Hub:** Provide `/app` as a user-level dashboard listing their projects with onboarding status.
- **Project Access:** Route users to `/projects/[projectId]/dashboard` (existing Dev Cycle + Wiki views).
- **Protection:** Guard all app/dashboard/project routes behind authentication and ownership checks.
- **Agent Alignment:** Keep MCP contracts unchanged (agents still call tools with `projectId`; auth only wraps the human UI).

---

## 2. Out of Scope

- Multi-user sharing / teams (`ProjectMember` join table) – post-MVP.
- Advanced auth (MFA, additional OAuth providers beyond optional Google).
- MCP API key issuance for remote agents (planned for a later sprint).

---

## 3. Key Design Decisions

- **Auth Library:** NextAuth.js (v4+) with Credentials provider + bcrypt.
- **Sessions:** JWT-based sessions stored in secure cookies; `Session` Prisma model kept for future DB sessions but unused in current config.
- **Rate Limiting:** Use existing Redis instance from Mac mini Docker stack for auth attempt limiting (no external Upstash).
- **Data Ownership:** `User` owns many `Project` records via `Project.ownerId`.
- **Onboarding Sessions:** Still scoped by `projectId` for MCP; optional `userId` on `OnboardingSession` is UI-only metadata for queries.
- **Database Reset:** Because current projects are test-only, we will reset and reseed the DB after this sprint to start from a clean, auth-aware baseline.

---

## 4. Related Docs

- `User_Authentication_Dashboard_Specif.md` – detailed functional + technical spec (DOC-015).
- `AUTH-SCHEMA-CHANGES.md` – Prisma schema changes and migration notes.
- `AUTH-IMPLEMENTATION-PLAN.md` – step-by-step implementation checklist.
- `AUTH-TESTING-AND-VALIDATION.md` – test matrix (unit/integration/E2E).
- `AUTH-FINAL-SUMMARY.md` – final status, metrics, and lessons learned.

These documents mirror the structure used for the onboarding refactor, but focused on auth + dashboards instead of MCP/onboarding internals.
