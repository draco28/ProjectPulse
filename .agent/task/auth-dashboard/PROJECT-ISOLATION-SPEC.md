# Project Isolation - Complete Multi-Project Support

**Sprint:** 8.9  
**Priority:** CRITICAL (Auth MVP Blocker)  
**Status:** In Progress  
**Date:** 2025-11-21

---

## Problem Statement

**Bug discovered during Phase 7 testing:**

When a user creates a new project (e.g., Project #2), the dashboard initially appears clean. However, if they navigate to pages like `/issues`, `/wiki`, `/health`, etc., and then return to the dashboard, the new project suddenly shows data from other projects (typically Project #1 / Moksha DevHub).

**Root Cause:**

1. **Schema inconsistency:** Some tables have `projectId` foreign keys, others don't.
2. **Query inconsistency:** Dashboard queries scope by `projectId`, but other pages either:
   - Use hardcoded `projectId = 1`
   - Use `DEFAULT_PROJECT_ID` from env
   - Have NO projectId filtering at all (global data)
3. **UI inconsistency:** Most pages don't accept `?project=<id>` query param yet.

**Impact:**

- **Data leakage:** Users see other users' data.
- **Data corruption:** Creating issues/wiki items from global pages assigns them to wrong project.
- **Broken multi-user workflow:** Auth is useless if projects aren't isolated.

**This CANNOT be deferred to post-MVP.** Complete project isolation is a prerequisite for any multi-user auth system.

---

## Scope: What Needs Fixing

1. ✅ **Dashboard** - Already scoped (Phase 6)
2. ✅ **Onboarding** - Already scoped (just fixed)
3. ✅ **User Dashboard** (`/app`) - Already scoped (Phase 5)
4. ❌ **Issues** (`/issues`) - NOT scoped
5. ❌ **Wiki** (`/wiki`) - NOT scoped
6. ❌ **Knowledge Base** - NOT scoped (no `projectId` in schema!)
7. ❌ **Security Findings** - NOT scoped (no `projectId` in schema!)
8. ❌ **Health Monitoring** (`/health`) - Partially scoped
9. ❌ **Agents** (`/agents`) - Partially scoped (hardcoded `projectId = 1`)
10. ❌ **Roadmap** (`/roadmap`) - Partially scoped (hardcoded `projectId = 1`)

---

## Implementation Plan

See detailed implementation files:

1. `PROJECT-ISOLATION-SCHEMA.md` - Database schema changes & migrations
2. `PROJECT-ISOLATION-QUERIES.md` - Query updates for all pages
3. `PROJECT-ISOLATION-UI.md` - UI changes (query params, links, ownership checks)
4. `PROJECT-ISOLATION-TESTING.md` - Testing checklist & automated tests

---

## Success Criteria

- [ ] Schema migration complete (projectId added to all necessary tables)
- [ ] All Prisma queries filter by projectId
- [ ] All pages accept `?project=<id>` query param
- [ ] All pages verify project ownership before rendering
- [ ] Dashboard shows correct stats per project (no leakage)
- [ ] Creating new project shows empty state (no seeded data from project 1)
- [ ] Navigating between projects shows correct isolated data
- [ ] Navigating to issues/wiki/agents/etc. from one project, then returning to dashboard, shows correct data (no leakage)
- [ ] Sidebar navigation includes projectId in all links
- [ ] Seed script assigns all data to default project
- [ ] All manual tests pass
- [ ] All automated tests pass
