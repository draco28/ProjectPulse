# Auth & User Dashboard – Testing & Validation

**Project:** ProjectPulse  
**Sprint:** Auth + User Dashboard (EPIC-013)  

This document defines the test strategy and concrete checks for the auth + dashboards feature. It mirrors the structure used for the onboarding refactor testing docs but scoped to this sprint.

---

## 1. Test Suites

### 1.1 Unit / Integration (API + Auth)

- **Auth validation**
  - Signup rejects invalid emails.
  - Signup rejects passwords < 8 chars.
  - Duplicate email returns appropriate error.
- **Password hashing**
  - Passwords stored as bcrypt hashes, never plaintext.
  - Login verifies via `bcrypt.compare`.
- **Project creation**
  - `/api/projects` fails when unauthenticated.
  - `/api/projects` succeeds when authenticated and sets `ownerId = session.userId`.

### 1.2 Route Protection

- Unauthenticated → protected path:
  - `/app` → redirect to `/login?callbackUrl=/app`.
  - `/projects/123/dashboard` → redirect to `/login?...`.
- Logged-in → `/login`:
  - Redirect to `/app`.
- Ownership checks:
  - Logged-in user cannot access `/projects/[id]/dashboard` for other user’s projects.

### 1.3 User Dashboard Behavior

- `/app` with no projects:
  - Renders empty state message + CTA.
- `/app` with projects:
  - Renders one card per owned project.
  - Shows onboarding status badge when `OnboardingSession` present.
  - Shows progress bar when `metrics.phasesComplete` is available.
- "New Project" dialog:
  - Valid project name → project created, dashboard opened.
  - Missing name → validation error, no request sent.

### 1.4 Project Dashboard Integration

- Opening a project from `/app`:
  - Navigates to `/projects/[id]/dashboard`.
  - Dashboard loads existing components (Dev Cycle, Wiki links, onboarding CTAs).
- Onboarding CTAs:
  - No sessions → "Start Onboarding" visible.
  - Existing sessions → "Continue Onboarding" visible.

---

## 2. E2E Scenario (Playwright or equivalent)

**Test Name:** `auth-dashboard-flow.spec.ts`

**Happy path:**
1. Visit `/` → redirected to `/login`.
2. Click "Sign Up" and create an account.
3. After signup, redirected to `/app`.
4. See empty state (no projects yet).
5. Click "New Project", enter project name, submit.
6. Redirected to `/projects/[id]/dashboard`.
7. See project dashboard load successfully.
8. Click "Back to Projects" → `/app` shows new project card.
9. Logout from header → returned to `/login`.

**Edge cases:**
- Invalid login credentials show error and do not create a session.
- Direct nav to `/projects/[id]/dashboard` when logged out redirects to `/login`.
- Session expiry (can be simulated by short TTL in test env) forces re-login.

---

## 3. Security Checks

- **Rate limiting:**
  - After N failed login attempts (e.g. 5/15min), further attempts are temporarily blocked.
  - Confirm Redis keys are written and expire as expected.
- **No sensitive logging:**
  - Ensure password values are never logged.
  - Auth errors log generic messages only.
- **CSRF protection:**
  - Rely on NextAuth’s built-in CSRF handling for auth routes.
- **HTTPS / cookie flags (for real deployment):**
  - `secure` cookies and `httpOnly` set in production.

---

## 4. Performance Targets

- **Login:** P95 < 200ms (excluding first build).
- **User dashboard (`/app`):** P95 < 500ms including DB query for projects + onboarding summaries.
- **Project dashboard:** Comparable to current baseline; no noticeable regression from adding auth checks.

Verify using:
- Browser dev tools (network timings) in Mac mini environment.
- Optional: simple timing logs in API handlers during development.

---

## 5. Acceptance Criteria

The feature is considered **validated** when:

- All unit/integration tests for auth + projects pass.
- E2E scenario "signup → app → create project → dashboard → logout" passes consistently.
- Route protection behaves correctly for both authenticated and unauthenticated users.
- No security red flags (plaintext passwords, missing rate limiting, etc.).
- Performance targets are met on the Mac mini Docker stack.

Results and any deviations should be captured in `AUTH-FINAL-SUMMARY.md` once the sprint is complete.
