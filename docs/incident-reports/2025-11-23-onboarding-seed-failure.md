# Incident Report: Onboarding System Failure (2025-11-23)

**Date:** 2025-11-23
**Severity:** Critical (Blocker)
**Component:** Onboarding System (Sessions 1-3), Database Seeding, Infrastructure
**Status:** Resolved

## Summary

During end-to-end testing of the new Onboarding System, multiple critical failures were encountered that prevented the successful completion of Sessions 1, 2, and 3. The root causes were identified as missing seed data, incorrect database networking configuration, middleware blocking, and syntax errors in the seed script.

All issues have been resolved, and the system is now fully operational with automated seeding and health checks.

## Timeline

- **11:00**: Started E2E test of Onboarding Session 1.
- **11:05**: **Failure 1**: `getQuestions` returned 404. Root cause: Onboarding questions were not seeded.
- **11:15**: **Failure 2**: `finalizeSummary` returned 404. Root cause: Prompt templates were not seeded.
- **11:30**: **Failure 3**: Session 3 `roadmap.materialize` failed. Root cause: Docker container networking issue (using `localhost` instead of `postgres`).
- **11:45**: **Failure 4**: Batch API endpoints returned 404/HTML. Root cause: Middleware blocking `/api/batch/*`.
- **12:00**: Attempted to fix seeding.
- **12:05**: **Failure 5**: Seed script syntax errors (double commas, missing braces) introduced during manual edits.
- **12:10**: **Failure 6**: Seed script constraint violations (User email).
- **12:15**: **Failure 7**: Missing `projectId` in WikiPage creation during seed.
- **12:20**: **Resolution**: All seed script errors fixed, infrastructure updated.
- **12:25**: Verification successful. Health endpoint reports system healthy.

## Root Cause Analysis

### 1. Missing Seed Data
**Issue**: The main `prisma/seed.ts` script did not call `seedOnboardingQuestions` or `seedOnboardingPromptTemplates`. These were separate scripts that had to be run manually, which the automated deployment pipeline (and AI agents) did not do.
**Fix**: Imported and invoked these seed functions within the main `seed.ts` execution flow.

### 2. Infrastructure Configuration
**Issue**: The `mcp-server` and `nextjs` containers were configured with inconsistent `DATABASE_URL` environment variables. Some used `localhost` (which fails inside Docker) instead of the service name `postgres`.
**Fix**: Updated `docker-compose.cloud.yml` to use `postgres:5432` for all internal connections.

### 3. Middleware Blocking
**Issue**: The Next.js middleware was configured to block requests to `/api/*` that didn't match specific patterns. The new `/api/batch` and `/api/onboarding` routes were not whitelisted.
**Fix**: Added `/api/batch` and `/api/onboarding` to the middleware public path matchers.

### 4. Seed Script Fragility
**Issue**: The seed script was brittle and lacked idempotency. It failed if data already existed (Unique Constraint) or if dependencies were missing (Foreign Key).
**Fix**:
- Added robust cleanup logic (`deleteMany` in correct order).
- Switched to `upsert` for critical entities like User.
- Fixed syntax errors and missing arguments (`projectId`) in WikiPage creation.

## Resolution & Verification

### Key Changes

1. **`apps/web/prisma/seed.ts`**:
   - Integrated `seedOnboardingQuestions` and `seedOnboardingPromptTemplates`.
   - Fixed WikiPage creation syntax and arguments.
   - Added `prisma.user.deleteMany()` for clean slate.
   - Used `upsert` for User creation.

2. **`docker-compose.cloud.yml`**:
   - Updated startup command to run `migrate deploy` and `db seed` automatically.
   - Fixed `DATABASE_URL` networking.

3. **`apps/web/app/api/health/route.ts`**:
   - Added specific check for seed data availability (`seed: { ready: true }`).

### Verification Results

- **Health Check**:
  ```json
  {
    "status": "healthy",
    "database": "connected",
    "seed": { "ready": true, "questions": 96, "templates": 16 }
  }
  ```
- **API Verification**:
  - `GET /api/onboarding/questions` returns 200 OK with 11 questions for Phase 1.

## Prevention Plan

1. **Automated Seeding**: Seeding is now part of the container startup process, ensuring it never happens that an environment is brought up without required data.
2. **Health Monitoring**: The health endpoint now explicitly checks for seed data, allowing deployment pipelines to wait until the application is truly ready.
3. **Idempotent Scripts**: All future seed scripts must be written to be idempotent (using `upsert` or `deleteMany`) to allow re-running without failure.

