# Project-Aware Layout & Pages Refactor Spec

**Context:** Auth & User Dashboard / Multi-Project Isolation (Sprint 8.9)

**Owner:** You + Cascade (pair programming)  
**Location:** `.agent/task/auth-dashboard/`  
**Scope:** All **post-/app** project pages + `Sidebar`

---

## 1. High-Level Goal

After the user lands on `/app` (User Dashboard) and selects a project, **every subsequent page** must operate in the context of a **single active project**:

- Only fetch and display data for that project.
- Never mix data between projects.
- Keep navigation links (`Sidebar`, headers, buttons) project-aware so that context is never lost.

This spec is designed so **you can follow it line by line** and implement changes yourself, with Cascade assisting where needed.

---

## 2. Current State (Summary)

### 2.1 Already Project-Aware (Good)

These pages already resolve a `projectId` and scope queries by it:

- `app/dashboard/page.tsx` – Dashboard
- `app/issues/page.tsx` – Issues list
- `app/wiki/page.tsx` – Wiki list
- `app/health/page.tsx` – Project Health
- `app/agents/page.tsx` – Agent AI Hub
- `app/(authenticated)/roadmap/page.tsx` – Roadmap

They still use slightly different patterns (some use `getAuthorizedProject`, some inline logic), but conceptually they are **project-scoped**.

### 2.2 Not Yet Project-Aware (Needs Fix)

These are still **global** and can leak data across projects:

- `app/knowledge/page.tsx` – Knowledge Base
  - No auth, no project context.
  - All `KnowledgeItem` rows across all projects.
- `app/security/page.tsx` – Security Dashboard
  - No projectId in `calculateSecurityScore`, `getVulnerabilityStats`, `getSecurityFindings`.
  - Aggregates all `SecurityFinding` rows.

### 2.3 Sidebar & Layouts

- `components/Sidebar.tsx` supports an optional `projectId?: number` prop.
- Some pages call `<Sidebar projectId={project.id} />` (good).
- Layouts `app/dashboard/layout.tsx` and `app/(authenticated)/layout.tsx` currently call `<Sidebar />` **without** project context.

For now, we **won’t** do a deep layout routing refactor. Instead, we’ll:

- Standardize **page-level project context**.
- Ensure all project pages call `<Sidebar projectId={projectId} />` directly.

---

## 3. Standard Project Context Pattern

We want **one way** to get the active project for a user, used by all project pages.

### 3.1 New Helper: `getActiveProjectForUser`

**File (to create):** `apps/web/lib/project-context.ts`

**Conceptual API:**

```ts
export type ProjectContext = {
  project: { id: number; name: string; ownerId: string };
  projectId: number;
};

export async function getActiveProjectForUser(
  userId: string,
  searchParamsProject?: string
): Promise<ProjectContext>;
```

**Behavior:**

1. **If `searchParamsProject` provided:**
   - Parse `projectId = parseInt(searchParamsProject, 10)`.
   - Query `prisma.project.findUnique({ where: { id: projectId }, select: { id, name, ownerId } })`.
   - If no project or `ownerId !== userId` → **redirect `/app`**.

2. **If `searchParamsProject` is missing:**
   - Query `firstProject = prisma.project.findFirst({ where: { ownerId: userId }, select: { id, name, ownerId } })`.
   - If no project → **redirect `/app`**.
   - Use `firstProject.id` as `projectId`.

3. Return `{ project, projectId }`.

**Your task when implementing:**

- Create `project-context.ts` with the above logic.
- Reuse the existing Prisma singleton pattern from other server files (`lib/prisma` or local pattern) as needed.

---

## 4. Per-Page Refactor Plan (Hands-On Checklist)

For each page **after** `/app`, follow this **6-step pattern**:

1. Get the current user (auth check).
2. Get the active project via `getActiveProjectForUser`.
3. Scope **all Prisma queries** with `projectId` where applicable.
4. Pass `projectId` into `<Sidebar />`.
5. Make all **internal links** include `?project=${projectId}` where they navigate to other project pages.
6. Keep existing UI/UX intact (only change data scoping + links).

Below is a **route-by-route plan**.

### 4.1 Dashboard (`app/dashboard/page.tsx`)

**Status:** Already project-aware.

**Refactor steps:**

1. **Replace inline project resolution** with `getActiveProjectForUser`:
   - Locate logic that resolves `projectId` from `searchParams.project` and `prisma.project.findFirst`.
   - Replace with:
     ```ts
     const user = await getCurrentUser();
     if (!user) redirect('/login');

     const { project, projectId } = await getActiveProjectForUser(user.id, searchParams.project);
     ```
   - Remove the duplicated ownership check; the helper enforces it.

2. Keep `getDashboardData(projectId)` as it is (already scoped by `projectId`).

3. Back to dashboard link is `/app` (user-level) – keep as is.

> This page becomes the **reference** pattern for other pages.

### 4.2 Issues List (`app/issues/page.tsx`)

**Status:** Already scopes by `projectId`, but uses its own project resolution.

**Refactor steps:**

1. **Auth + project context:**
   - Replace manual `getAuthorizedProject` logic with:
     ```ts
     const user = await getCurrentUser();
     if (!user) redirect('/login');

     const { project, projectId } = await getActiveProjectForUser(user.id, params.project);
     ```

2. **Where clause:**
   - Validate `WhereClause` type includes `projectId: number` (already done).
   - Ensure `getIssues(projectId, params)` and `getFilterCounts(projectId)` both use that exact `projectId`.

3. **Sidebar:**
   - Confirm `<Sidebar projectId={project.id} />` → update to use `projectId` from context if needed.

4. **Links:**
   - Any links from Issues page to other routes should keep `?project=${projectId}`.

### 4.3 Issues Detail (`app/issues/[id]/page.tsx`)

**Goal:**

- Issue detail must only show if the issue belongs to the active project.

**Refactor steps:**

1. Auth + project context as above.
2. When fetching the issue:
   - Add `projectId` guard:
     ```ts
     where: { id: issueId, projectId }
     ```
3. If issue not found → 404 or redirect `/issues?project=${projectId}`.

### 4.4 Wiki List + Detail (`app/wiki/page.tsx`, `app/wiki/[slug]/page.tsx`, `app/wiki/[slug]/edit/page.tsx`, `app/wiki/analytics/page.tsx`)

**List page (`wiki/page.tsx`):**

1. Auth + project context via helper.
2. `WhereClause` must include `projectId` (already there) – just switch to using `projectId` from helper.
3. `getCategoryStats` must filter by `{ projectId }` (already does).
4. `<Sidebar projectId={projectId} />` – ensure it uses helper context.
5. Links to details: `href={page.path + '?project=' + projectId}` or builds that include `project` param.

**Detail / Edit pages:**

1. Apply the same helper pattern.
2. When fetching a wiki page, constrain by `projectId` as well as slug/path.

**Analytics page:**

1. Fetch analytics only for wiki pages that belong to `projectId`.
2. Use `<Sidebar projectId={projectId} />`.

### 4.5 Health (`app/health/page.tsx`)

**Status:** Already project-aware via `getAuthorizedProject` and `getHealthData(projectId)`.

**Refactor steps:**

1. Replace `getAuthorizedProject` usage with `getActiveProjectForUser`:
   ```ts
   const user = await getCurrentUser();
   if (!user) redirect('/login');

   const { project, projectId } = await getActiveProjectForUser(user.id, params.project);
   ```
2. Call `getHealthData(projectId)`.
3. Keep `Sidebar projectId={project.id}` (or `projectId`).

### 4.6 Agents (`app/agents/page.tsx`)

**Status:** Already uses `project.id` to scope agents/skills/workflows/SOPs.

**Refactor steps:**

1. Replace inline `getAuthorizedProject` logic with helper.
2. Make sure helper’s `projectId` is passed into all `get*` functions (currently they use `project.id`; that’s fine).

### 4.7 Roadmap (`app/(authenticated)/roadmap/page.tsx`)

**Status:** Already uses `getAuthorizedProject` + `getRoadmap(project.id)`.

**Refactor steps:**

1. Replace `getAuthorizedProject` with `getActiveProjectForUser`.
2. Keep `getRoadmap(project.id)`.

### 4.8 Knowledge (`app/knowledge/page.tsx`) – **Main Leak #1**

**Goal:** Make Knowledge Base fully project-aware.

**Refactor steps (you can do this one hands-on):**

1. **Add auth + project context at top of page:**
   - Currently page is just:
     ```ts
     export default async function KnowledgeBasePage({ searchParams }: PageProps) {
       const { articles, allTags, totalCount } = await getKnowledgeArticles(searchParams);
     ```
   - Change to:
     ```ts
     const user = await getCurrentUser();
     if (!user) redirect('/login');

     const { project, projectId } = await getActiveProjectForUser(user.id, searchParams.project);

     const { articles, allTags, totalCount } = await getKnowledgeArticles(projectId, searchParams);
     ```

2. **Update `getKnowledgeArticles` signature:**
   - From:
     ```ts
     async function getKnowledgeArticles(searchParams: PageProps['searchParams'])
     ```
   - To:
     ```ts
     async function getKnowledgeArticles(projectId: number, searchParams: PageProps['searchParams'])
     ```

3. **Initialize `where` with projectId:**
   - From:
     ```ts
     const where: Prisma.KnowledgeItemWhereInput = {};
     ```
   - To:
     ```ts
     const where: Prisma.KnowledgeItemWhereInput = { projectId };
     ```

4. **When loading all tags**, also filter by `projectId`:
   - From:
     ```ts
     const allArticles = await prisma.knowledgeItem.findMany({ select: { tags: true } });
     ```
   - To:
     ```ts
     const allArticles = await prisma.knowledgeItem.findMany({
       where: { projectId },
       select: { tags: true },
     });
     ```

5. **Sidebar:**
   - Change `<Sidebar />` to `<Sidebar projectId={projectId} />`.

This will make `/knowledge` show only knowledge items for the active project.

### 4.9 Security Dashboard (`app/security/page.tsx`) – **Main Leak #2**

**Goal:** Make Security Dashboard fully project-aware.

**Refactor steps:**

1. **Add auth + project context at top of page:**
   ```ts
   const user = await getCurrentUser();
   if (!user) redirect('/login');

   const { project, projectId } = await getActiveProjectForUser(user.id, searchParams.project);

   const [securityScore, stats, findings] = await Promise.all([
     calculateSecurityScore(projectId),
     getVulnerabilityStats(projectId),
     getSecurityFindings(projectId, searchParams),
   ]);
   ```

2. **Update helper signatures to accept `projectId`:**

   - `calculateSecurityScore(projectId: number)`:
     ```ts
     const findings = await prisma.securityFinding.findMany({
       where: { status: 'open', projectId },
       select: { severity: true },
     });
     ```

   - `getVulnerabilityStats(projectId: number)`:
     ```ts
     const findings = await prisma.securityFinding.groupBy({
       by: ['severity'],
       where: { status: 'open', projectId },
       _count: { id: true },
     });
     ```

   - `getSecurityFindings(projectId: number, searchParams: PageProps['searchParams'])`:
     ```ts
     const where: Prisma.SecurityFindingWhereInput = { projectId };
     // apply severity/status
     ```

3. **Sidebar:**
   - Change `<Sidebar />` to `<Sidebar projectId={projectId} />`.

This will ensure security data is isolated per project.

---

## 5. Testing Plan (What You Can Run Yourself)

### 5.1 Manual Browser Scenarios

1. **New user, no projects:**
   - Login.
   - Try visiting `/dashboard`, `/issues`, `/wiki`, `/knowledge`, `/health`, `/agents`, `/security`, `/roadmap` directly.
   - Expected: All redirect back to `/app` until you create a project.

2. **Single project (Moksha DevHub):**
   - Open `/app` and click Moksha DevHub.
   - Navigate through all project pages using the Sidebar and header links.
   - Confirm:
     - No errors.
     - Data all corresponds to Moksha only.

3. **Multiple projects:**
   - Create "Test Project A".
   - Compare:
     - `/dashboard?project=<Moksha>` vs `/dashboard?project=<A>`
     - `/issues?project=<...>`
     - `/wiki?project=<...>`
     - `/knowledge?project=<...>`
     - `/security?project=<...>`
   - Each project’s pages should show **different, isolated** data.

### 5.2 Automated Script Extension (Optional)

You already have `run-comprehensive-tests.sh` for auth + isolation. Extend it to:

- Hit `/knowledge?project=<id>` and assert:
  - Knowledge items belong only to that project.
- Hit `/security?project=<id>` and assert:
  - Findings belong only to that project.

---

## 6. How to Use This Spec

- Treat each subsection (4.8, 4.9, etc.) as a **small refactor task**.
- Start with `app/knowledge/page.tsx` and follow the steps exactly:
  - Add helper import.
  - Add auth + context.
  - Update `getKnowledgeArticles`.
  - Update `Sidebar` usage.
- Test after each page change using your browser.
- Cascade can:
  - Review your edits.
  - Suggest precise line-level adjustments.
  - Help debug any TypeScript/Prisma issues that pop up.

Once all pages follow the same pattern, the entire post-/app experience will be **fully project-aware and isolation-safe**, and you’ll have done the refactor yourself with clear guidance.
