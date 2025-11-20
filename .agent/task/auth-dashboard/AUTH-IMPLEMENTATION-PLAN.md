# Auth & User Dashboard – Implementation Plan

**Project:** ProjectPulse  
**Sprint:** Auth + User Dashboard (EPIC-013, ~20 pts)  
**Goal:** Implement the human-facing "front door" (login → user dashboard → project dashboard) while keeping MCP contracts and onboarding flows unchanged.

This plan is intentionally concise and execution-focused, similar in style to the onboarding refactor plan.

---

## Phase 0 – Docs & Setup

- [ ] Create `.agent/task/auth-dashboard/` (done).
- [ ] Maintain these docs:
  - `AUTH-OVERVIEW.md`
  - `AUTH-SCHEMA-CHANGES.md`
  - `AUTH-IMPLEMENTATION-PLAN.md`
  - `AUTH-TESTING-AND-VALIDATION.md`
  - `AUTH-FINAL-SUMMARY.md`
  - `User_Authentication_Dashboard_Specif.md` (spec copy for this feature).

---

## Phase 1 – Schema & Seeds

**Objective:** Introduce `User`, tie `Project` to `User`, optionally extend `OnboardingSession`.

Tasks:
- [ ] Update `apps/web/prisma/schema.prisma` per `AUTH-SCHEMA-CHANGES.md`:
  - Add `User` model.
  - Add `ownerId` + `owner` relation to `Project`.
  - Add optional `OnboardingSession.userId` (UI-only) if desired.
- [ ] Run migrations and regenerate client:
  - `pnpm prisma migrate dev --name user-auth-dashboard`
  - `pnpm prisma generate`
- [ ] Update `apps/web/prisma/seed.ts`:
  - Seed default user (e.g. `dev@example.com`).
  - Optionally seed one sample project for that user.
- [ ] Plan for clean DB reset after implementation (test-only data can be dropped).

Exit criteria:
- Prisma schema compiles.
- `pnpm prisma migrate dev` and `pnpm prisma generate` succeed.

---

## Phase 2 – Auth Infrastructure (NextAuth + Redis)

**Objective:** Add robust but simple email/password auth.

Tasks:
- [ ] Install dependencies in `apps/web`:
  - `pnpm add next-auth @next-auth/prisma-adapter bcryptjs ioredis`
- [ ] Add `lib/auth.ts` with `authOptions`:
  - Credentials provider (email/password, bcrypt compare).
  - JWT session strategy, attaching `userId` into the token and session.
  - `pages.signIn = '/login'`.
- [ ] Add `app/api/auth/[...nextauth]/route.ts` using `NextAuth(authOptions)`.
- [ ] Implement Redis-based rate limiting for auth endpoints (using existing Redis from Docker):
  - 5 attempts / 15 minutes per IP/email.
  - Apply to signup + login handlers.

Exit criteria:
- Manual signup/login works against default user.
- Rate limiting logic is in place (to be validated in Phase 5 tests).

---

## Phase 3 – Public Auth Pages & APIs

**Objective:** Build `/login` UX and signup flow.

Tasks:
- [ ] `app/login/page.tsx`:
  - shadcn form (email, password).
  - Handles `?error=` (invalid credentials) and `?callbackUrl=`.
  - If user already logged in, redirect to `/app`.
  - Reuse the existing global layout and neumorphic/shadcn theme from current dashboard pages (same background, typography, and component styling) to avoid introducing a separate auth look.
- [ ] `app/api/auth/signup/route.ts`:
  - Validate with Zod (`email`, `password` min 8 chars).
  - Hash password with bcrypt.
  - Create `User` via Prisma.
  - Sign in via NextAuth programmatically and redirect to callback or `/app`.
- [ ] Ensure `/api/auth/signout` or NextAuth `signOut` flow is wired into UI (e.g. logout button in header).

Exit criteria:
- User can sign up and then log in via `/login` and reach `/app`.

---

## Phase 4 – Route Protection & Ownership

**Objective:** Ensure only authenticated users with ownership can reach app/project pages.

Tasks:
- [ ] Add `middleware.ts` in `apps/web`:
  - Use `withAuth`.
  - `matcher`: `/app/:path*`, `/projects/:path*`, `/dashboard`.
  - Redirect unauthenticated requests to `/login?callbackUrl=...`.
- [ ] In project-level loaders or route handlers, enforce:
  - `Project.ownerId === session.userId`.
  - On failure, redirect to `/app?error=unauthorized` or show 404.

Exit criteria:
- Visiting protected routes while logged out redirects to login.
- Visiting a project not owned by the user is blocked.

---

## Phase 5 – User Dashboard (`/app`)

**Objective:** Provide a clear overview of all projects owned by the user.

Tasks:
- [ ] Implement `app/app/page.tsx`:
  - Fetch projects where `ownerId = session.userId`.
  - Include latest `OnboardingSession` per project (if exists) for status/progress.
  - Render project cards with:
    - Name, createdAt.
    - Onboarding status badge (Pending / In Progress / Complete).
    - Progress bar from `metrics.phasesComplete` when available.
  - Reuse the same layout shell, header, card, badge, progress bar, and dialog components used on existing project dashboard pages so `/app` feels like part of the same UI and theme.
- [ ] Implement "New Project" flow:
  - shadcn Dialog for project name (and optional description).
  - POST to `app/api/projects/route.ts`.
  - On success, redirect to `/projects/[id]/dashboard`.

Exit criteria:
- Logged-in user sees their projects on `/app`.
- Creating a project from `/app` works and navigates correctly.

---

## Phase 6 – Project Dashboard Integration

**Objective:** Wire existing project dashboard into the new auth/user flow.

Tasks:
- [ ] Adopt `/projects/[projectId]/dashboard` as canonical project dashboard route.
  - Either move existing dashboard or add a wrapper that forwards from `/dashboard`.
- [ ] Ensure project dashboard:
  - Uses session + ownership checks.
  - Provides "Back to Projects" link to `/app`.
  - Exposes clear CTA(s) for onboarding:
    - If no sessions: "Start Onboarding" (with explanatory text for agent).
    - If sessions exist: "Continue Onboarding".
- [ ] Confirm MCP tools remain unchanged (still called with `projectId`); only the UI context changes.

Exit criteria:
- From `/app`, user can open any project they own and land on the existing dashboard.
- Onboarding UX is reachable and behaves as before, now behind auth.

---

## Phase 7 – Testing, Reset & Deployment

**Objective:** Validate auth + dashboards end-to-end and prepare for long-lived use.

Tasks:
- [ ] Implement tests per `AUTH-TESTING-AND-VALIDATION.md`.
- [ ] Perform clean DB reset + seed:
  - Drop old test data.
  - Seed default user and (optionally) one project.
- [ ] Rebuild and restart Docker stack (Next.js + Redis + DB).
- [ ] Perform manual smoke tests:
  - `/` → `/login`.
  - Signup → `/app` → Create project → `/projects/[id]/dashboard`.

Exit criteria:
- All planned tests passing.
- Auth + dashboard flows stable in Docker environment.

---

## 8. Completion Definition

The sprint is considered **complete** when:

- All phases 1–7 exit criteria are met.
- Auth + dashboard docs in `.agent/task/auth-dashboard/` are up-to-date.
- Tests confirm the full loop: login → user dashboard → project dashboard → onboarding entry.
- A clean, auth-aware DB baseline is in place for future work.
