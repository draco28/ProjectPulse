# Project Isolation - Implementation Guide

**Sprint:** 8.9  
**Date:** 2025-11-21  
**Status:** In Progress

---

## Tables Needing projectId

### Critical (No projectId, causes data leakage):

1. **KnowledgeItem** - Knowledge base is currently global
2. **SecurityFinding** - Security findings are currently global  
3. **WikiPage** - Wiki pages are currently global

### Already Has projectId:

- Issue ✅
- AgentPersona ✅
- Skill ✅
- WorkflowTemplate ✅
- SOP ✅
- OnboardingSession ✅
- Roadmap ✅
- HealthScanner ✅
- HealthScore ✅
- HealthFinding ✅ (via scanner relation)

---

## Phase 1: Schema Migration (30 min)

### Step 1: Update schema.prisma

Add projectId to these models and update Project relations.

### Step 2: Create migration

```bash
cd apps/web
pnpm prisma migrate dev --name add_project_scoping
```

### Step 3: Run migration in Docker

```bash
docker exec projectpulse-nextjs-cloud sh -c "cd apps/web && pnpm prisma migrate deploy"
```

### Step 4: Update seed script

Assign all seeded data to projectId = 1 (Moksha DevHub).

---

## Phase 2: Helper Functions (15 min)

Extend `lib/auth-server.ts` with:
- `getFirstOwnedProjectId(userId)`
- `verifyProjectOwnership(projectId, userId)`
- `getAuthorizedProject(projectId, userId)`

---

## Phase 3: Dashboard Fixes (10 min)

Fix `app/dashboard/page.tsx`:
- Add `projectId` to `knowledgeItem.count()`
- Add `projectId` to `securityFinding.count()`

---

## Phase 4: Page-by-Page Fixes (2 hours)

### Pattern for Each Page:

```typescript
export default async function PageName({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined; project?: string };
}) {
  // 1. Auth check
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  // 2. Get projectId from query or first owned project
  const projectIdParam = searchParams.project ? parseInt(searchParams.project, 10) : undefined;
  const project = await getAuthorizedProject(projectIdParam, user.id);
  
  if (!project) {
    redirect('/app'); // No projects or unauthorized
  }
  
  // 3. Fetch data scoped to project.id
  const data = await getData(project.id);
  
  return (
    <div>
      {/* Back to Dashboard */}
      <Link href={`/dashboard?project=${project.id}`}>
        <ArrowLeft /> Back to Dashboard
      </Link>
      
      {/* Rest of UI with projectId in all links */}
    </div>
  );
}
```

### Pages to Fix:

1. `/app/issues/page.tsx` - Add projectId param, scope queries
2. `/app/wiki/page.tsx` - Add projectId param, scope queries
3. `/app/health/page.tsx` - Replace DEFAULT_PROJECT_ID with query param
4. `/app/agents/page.tsx` - Replace hardcoded projectId=1
5. `/app/(authenticated)/roadmap/page.tsx` - Replace hardcoded projectId=1

---

## Phase 5: Sidebar Navigation (30 min)

Update all layouts to pass projectId to Sidebar:
- `app/dashboard/layout.tsx`
- `app/(authenticated)/layout.tsx`

Update `components/Sidebar.tsx` to accept projectId prop and append to all navigation links.

---

## Phase 6: Testing (1 hour)

Run manual test flow:
1. Create Project A
2. Navigate to dashboard (should be empty)
3. Go to /issues (should be empty)
4. Go to /wiki (should be empty)
5. Return to dashboard (should STILL be empty)
6. Create issue in Project A
7. Return to dashboard (should show 1 issue)
8. Switch to Moksha DevHub project
9. Verify seeded data shows (not Project A's issue)

---

## Estimated Total Time: 4-5 hours

This is a critical blocker and must be completed before auth can be considered MVP-ready.
