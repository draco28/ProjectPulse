# Auth & User Dashboard – Schema Changes

**Project:** ProjectPulse  
**Sprint:** Auth + User Dashboard (EPIC-013)  
**Scope:** Add user accounts, project ownership, and optional user linkage to onboarding sessions.

---

## 1. Overview

This document captures all Prisma schema updates required for the auth + user dashboard feature. The goal is to:

- Introduce a `User` model for human accounts.
- Associate each `Project` with a single owning `User` (`ownerId`).
- Optionally link `OnboardingSession` records to a `User` for UI-level reporting, while keeping MCP tools strictly project-scoped.
- Prepare for future extensions (multi-user `ProjectMember`, DB-backed NextAuth sessions) without committing to them now.

Because current data is purely **test-only**, we will adopt a **clean DB reset** strategy once implementation is stable.

---

## 2. Prisma Model Changes

### 2.1 `User` model (new)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  passwordHash String   // bcrypt hash
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  projects     Project[] // One-to-many: User → Projects
  sessions     Session[] // Optional: NextAuth DB sessions (unused with JWT strategy)

  @@map("users")
}
```

**Notes:**
- Email is unique and should be normalized to lowercase at write time.
- Passwords are never stored in plaintext; always hashed with bcrypt.

---

### 2.2 `Project` ownership (extended)

```prisma
model Project {
  // Existing fields...

  ownerId String
  owner   User @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  // Future (post-MVP):
  // members ProjectMember[]

  @@map("projects")
}
```

**Notes:**
- Every project now has exactly one owning `User`.
- `onDelete: Cascade` ensures projects are removed if the owning user is deleted (acceptable for MVP; revisit if needed).

---

### 2.3 Optional `Session` model (NextAuth DB sessions)

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

**Notes:**
- Current implementation uses **JWT sessions**, so this table is not required at runtime, but is kept for future flexibility.
- No app logic will depend on this model in the first iteration.

---

### 2.4 `OnboardingSession` – optional `userId`

```prisma
model OnboardingSession {
  // Existing fields...
  // projectId, sessionNumber, planningAnswers, projectContextJson, metrics, validationReport, etc.

  // New (optional) linkage for UI-level queries only:
  // - Onboarding remains strictly project-scoped for MCP tools.
  // - userId is used for queries like "sessions started by this user".
  userId String?
  user   User? @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

**Notes:**
- **MCP contracts remain unchanged**: tools always take `projectId` (and optionally `projectId + sessionId`), never `userId`.
- `userId` is metadata for dashboards and reporting.
- Existing rows (pre-auth) will have `userId = null`.

---

## 3. Migrations & Strategy

### 3.1 Migration command (development)

```bash
cd apps/web
pnpm prisma migrate dev --name user-auth-dashboard
pnpm prisma generate
```

This will:
- Create `users`, `sessions` (if kept), and updated `projects` / `onboarding_sessions` tables.

### 3.2 Clean reset for test data

Because all existing projects and onboarding sessions are **test-only**, the simplest and safest approach is:

1. Implement code changes and confirm migrations apply cleanly.
2. Once auth + dashboards are stable locally, run a clean reset:

   ```bash
   cd apps/web
   pnpm prisma migrate reset
   # or: pnpm prisma db push --force-reset (depending on your chosen workflow)
   pnpm prisma db seed
   ```

3. Seed script should:
   - Create a default developer user (e.g. `dev@example.com`).
   - Optionally create one sample project owned by that user for quick smoke tests.

### 3.3 Seed updates

Update `apps/web/prisma/seed.ts` to:

- Insert a `User` record with known email/password (for local dev only).
- Optionally create a `Project` for that user.
- Do **not** create any `OnboardingSession` records yet; those will be created via actual onboarding tools.

---

## 4. Constraints & Validation

- **Email**: unique, lowercase; must be a valid email address (enforced at API layer via Zod).
- **Password**: minimum length 8 characters; stored only as bcrypt hashes.
- **Ownership**: `Project.ownerId` must always reference a valid `User.id`.
- **Backwards compatibility**: Onboarding logic that uses `projectId` continues to work without modification; `userId` on `OnboardingSession` is optional.

---

## 5. Open Questions / Future Work

- Multi-user / teams: introduce `ProjectMember` join model when needed.
- Stronger constraints around deleting users (soft delete vs cascade) once real production tenants exist.
- Potential switch from JWT to DB-backed NextAuth sessions, in which case the `Session` model becomes active.

For the current sprint, this schema is sufficient and aligned with the agent-first architecture and auth + dashboard requirements.
