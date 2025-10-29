# Phase 4 Plan — Dynamic Issue Filters (DB-backed)

**Phase**: Week 15 Phase 4
**Branch**: `feature/phase4-dynamic-filters`
**Created**: 2025-10-29 17:09
**Source**: GPT-generated plan, approved by user

---

## Objectives

1. Replace hardcoded filter options in FilterSidebar with DB-driven options
2. Provide a typed API for filter options
3. Preserve count badges derived from actual Issue data
4. Maintain strict TypeScript, Server Components first, API contracts consistent
5. Achieve tests ≥80% coverage

**Aligns with**: R-DATA-001, R-TS-001, R-NEXT-001, R-SEC-001, R-TEST-001

---

## Scope

**Target**: Issues List page and FilterSidebar component

**Filter Types**:

- Status (required)
- Priority (required)
- Module (required)
- Labels (optional for v1 - returned by API but not rendered unless time permits)

---

## Deliverables

1. **Prisma**: Models + migration + seed for option tables
2. **API**: GET /api/settings/filters (Zod-validated)
3. **UI**: Refactor FilterSidebar to consume dynamic options
4. **Types**: `apps/web/types/filters.ts`
5. **Tests**: Unit (API), Component (FilterSidebar), E2E (/issues filters)
6. **Docs**:
   - `docs/02-DATABASE-SCHEMA.md`
   - `STATUS.md`
   - `DEVELOPMENT_PLAN.md`
7. **Completion**: `docs/COMPLETION_phase4_dynamic_filters.md`

---

## Data Model (Prisma)

### New Tables

#### IssueStatusOption

```prisma
model IssueStatusOption {
  id         Int     @id @default(autoincrement())
  value      String  @unique
  label      String
  order      Int     @default(0)
  colorClass String?
}
```

**Seed defaults**:

- `open` (label: "Open", colorClass: "text-blue-600")
- `in_progress` (label: "In Progress", colorClass: "text-yellow-600")
- `closed` (label: "Closed", colorClass: "text-green-600")

#### IssuePriorityOption

```prisma
model IssuePriorityOption {
  id              Int     @id @default(autoincrement())
  value           String  @unique
  label           String
  order           Int     @default(0)
  dotColorClass   String?
  badgeColorClass String?
}
```

**Seed defaults**:

- `critical` (label: "Critical", dotColorClass: "bg-red-600", badgeColorClass: "bg-red-100 text-red-800")
- `high` (label: "High", dotColorClass: "bg-orange-600", badgeColorClass: "bg-orange-100 text-orange-800")
- `medium` (label: "Medium", dotColorClass: "bg-yellow-600", badgeColorClass: "bg-yellow-100 text-yellow-800")
- `low` (label: "Low", dotColorClass: "bg-gray-600", badgeColorClass: "bg-gray-100 text-gray-800")

#### IssueModuleOption

```prisma
model IssueModuleOption {
  id    Int    @id @default(autoincrement())
  value String @unique
  label String
  order Int    @default(0)
}
```

**Seed defaults**:

- `combat` (label: "Combat")
- `animation` (label: "Animation")
- `core` (label: "Core")
- `ui` (label: "UI")

### Migration

**Name**: `phase4_dynamic_filter_options`

**Commands**:

```bash
pnpm prisma migrate dev --name phase4_dynamic_filter_options
pnpm prisma generate
```

---

## API — GET /api/settings/filters

**Location**: `apps/web/app/api/settings/filters/route.ts`

### Response Contract

**Success** (200):

```typescript
{
  data: {
    status: StatusOption[],
    priority: PriorityOption[],
    modules: ModuleOption[],
    labels: { id: string; name: string; color: string }[]
  }
}
```

**Error** (500):

```typescript
{
  error: string;
}
```

### Behavior

1. **Zod Validation**: Validate output shape using Zod schema
2. **Database Queries**:
   - `prisma.issueStatusOption.findMany({ orderBy: { order: 'asc' } })`
   - `prisma.issuePriorityOption.findMany({ orderBy: { order: 'asc' } })`
   - `prisma.issueModuleOption.findMany({ orderBy: { order: 'asc' } })`
   - `prisma.label.findMany({ orderBy: { name: 'asc' } })`
3. **Mapping**: Map DB fields to DTO fields (include color classes)
4. **Caching**: `revalidate: 3600` (1 hour) or `force-cache`
   - Add tag revalidation later for admin edits

---

## Types

**File**: `apps/web/types/filters.ts`

### Type Definitions

```typescript
export interface StatusOption {
  value: string;
  label: string;
  colorClass?: string;
}

export interface PriorityOption {
  value: string;
  label: string;
  dotColorClass?: string;
  badgeColorClass?: string;
}

export interface ModuleOption {
  value: string;
  label: string;
}

export interface FiltersDTO {
  status: StatusOption[];
  priority: PriorityOption[];
  modules: ModuleOption[];
  labels: { id: string; name: string; color: string }[];
}
```

---

## UI — FilterSidebar Refactor

**File**: `apps/web/components/issues/FilterSidebar.tsx`

### Changes

1. **Props**: Accept `options: FiltersDTO` prop (except labels if out-of-scope)
2. **Replace Hardcoded Arrays**: Use dynamic options from props
3. **Preserve**:
   - Count badges (existing shape)
   - Color classes (bind from options)
   - URL param behavior (status, priority, module as CSV)

### Parent Component

**File**: `apps/web/app/issues/page.tsx`

**As Server Component**:

1. Fetch filter options (via Prisma helper or API fetch)
2. Compute counts for each option value:
   - `prisma.issue.count({ where: { status: value } })`
   - `prisma.issue.count({ where: { priority: value } })`
   - `prisma.issue.count({ where: { module: value } })`
3. Pass `{ counts, options, searchParams }` to FilterSidebar
4. Keep current URL param behavior (CSV format)

---

## Validation

1. **Zod Schema**: For API response DTO
2. **Strict TypeScript**: No `any` types
3. **Type Safety**: All components and API routes strictly typed

---

## Tests (TDD)

### Unit Tests (Jest)

**File**: `apps/web/app/api/settings/filters/__tests__/route.test.ts`

**Test Cases**:

1. API returns seeded options in correct order
2. API maps color classes correctly
3. API returns `{ error }` with 500 status on Prisma failure (mock error)

### Component Tests (RTL)

**File**: `apps/web/components/issues/__tests__/FilterSidebar.test.tsx`

**Test Cases**:

1. FilterSidebar renders dynamic options with counts
2. Checking/unchecking filter updates URL params (status/priority/module)
3. Color classes applied correctly from options
4. "Clear All" resets all filters

### E2E Tests (Playwright)

**File**: `apps/web/e2e/issues-filters.spec.ts`

**Test Cases**:

1. `/issues`: Applying filters updates results and URL
2. "Clear All" resets URL params and results
3. Multiple filters combined (status + priority + module)
4. Count badges reflect actual issue counts

**Target Coverage**: ≥80% for new/changed code

---

## Performance & Caching

1. **Cache Options**: 1 hour (stable, infrequently changing)
2. **Count Queries**: Compute per-request
   - Use `Promise.all` to batch count queries (avoid serialized queries)
3. **Future Optimization**: Consider `groupBy`-based count optimization (follow-up)

---

## Risks & Mitigations

### Risk 1: Options/Issue Value Mismatch

**Scenario**: Issue has value not in options (e.g., "archived")
**Mitigation**: Union into counts under that value, display as "Unknown/Other" (low priority, optional)

### Risk 2: Visual Regressions (Color Classes)

**Scenario**: Seed values don't match current UI classes
**Mitigation**: Assert presence of classes in component tests, verify seed values match UI exactly

### Risk 3: Query Overhead

**Scenario**: Too many count queries slow down page load
**Mitigation**: Use `Promise.all` to parallelize, limit options set, optimize later if needed

---

## Protocol (Steps 1–5)

### ✅ Step 1.5: Branch Setup

**Status**: COMPLETE
**Branch**: `feature/phase4-dynamic-filters` created and ready

### 🔄 Step 2: Plan Creation

**Status**: IN PROGRESS
**Actions**:

- Save this plan to `.agent/task/current-plan.md`
- Create `.agent/task/current-todos.md`
- Create TodoWrite UI

### ⏳ Step 3: Expert Consultation

**Required**:

- `prisma-expert`: Schema design + count strategy
- `next-js-expert`: Server vs Client components + caching
- `react-expert`: FilterSidebar props + URL state management

**Output**: Expert notes saved to `.agent/task/[expert]-dynamic-filters-[timestamp].md`

### ⏳ Step 4: Progress Checkpoints

**Checkpoints**: At 15K, 30K, 45K, 60K, 75K, 90K tokens
**Actions**: Update session file and todos

### ⏳ Step 5: Post-Completion

**Actions**:

1. Update docs first (docs/02-DATABASE-SCHEMA.md, STATUS.md, DEVELOPMENT_PLAN.md)
2. Create COMPLETION_phase4_dynamic_filters.md
3. Invoke synthesize-docs (if new patterns)
4. Invoke map-system (if architecture changed)
5. Commit documentation, then code
6. Run quality gates (lint, type-check, build, test)

---

## Acceptance Criteria

- [ ] No hardcoded filter options in UI
- [ ] API and UI strictly typed with Zod-validated response
- [ ] Issues page remains Server Component
- [ ] FilterSidebar is Client Component
- [ ] API contracts respected: `{ data }` on success, `{ error }` + status on failure
- [ ] Tests ≥80% coverage for new code
- [ ] All quality gates pass (TypeScript, ESLint, build, tests)
- [ ] Documentation updated and committed first

---

## Implementation Steps

### 1. Database Layer

1. Create Prisma models (IssueStatusOption, IssuePriorityOption, IssueModuleOption)
2. Generate migration: `pnpm prisma migrate dev --name phase4_dynamic_filter_options`
3. Create seed data with color classes matching current UI
4. Run seed: `pnpm prisma db seed`
5. Generate Prisma client: `pnpm prisma generate`

### 2. Types Layer

1. Create `apps/web/types/filters.ts`
2. Define StatusOption, PriorityOption, ModuleOption, FiltersDTO interfaces
3. Create Zod schemas for validation

### 3. API Layer

1. Create `apps/web/app/api/settings/filters/route.ts`
2. Implement GET handler with Zod validation
3. Query all option tables with orderBy
4. Map DB fields to DTO
5. Add caching (revalidate: 3600)
6. Handle errors with `{ error }` response

### 4. UI Layer

1. Update FilterSidebar.tsx to accept `options` prop
2. Replace hardcoded arrays with dynamic options
3. Bind color classes from options
4. Update issues/page.tsx to fetch options
5. Compute counts using `prisma.issue.count`
6. Pass options and counts to FilterSidebar

### 5. Testing Layer

1. Write unit tests for API route
2. Write component tests for FilterSidebar
3. Write E2E tests for /issues filters
4. Verify ≥80% coverage
5. All tests must pass

### 6. Documentation Layer

1. Update docs/02-DATABASE-SCHEMA.md with new models
2. Update STATUS.md with Phase 4 progress
3. Update DEVELOPMENT_PLAN.md with completion
4. Create COMPLETION_phase4_dynamic_filters.md

### 7. Quality Gates

1. TypeScript: 0 errors
2. ESLint: 0 warnings
3. Unit tests: All passing
4. E2E tests: All passing
5. Production build: Successful

---

## Recommended Commit Sequence

1. `docs: add Phase 4 plan reference placeholders` (optional)
2. `feat(prisma): add filter option models, migration, seed`
3. `feat(api): settings/filters endpoint`
4. `feat(ui): dynamic FilterSidebar + issues page integration`
5. `test: add unit, RTL, E2E for dynamic filters`
6. `docs: update docs/02, STATUS, DEVELOPMENT_PLAN`
7. `chore: finalize and run gates`

---

## Summary

**Plan Status**: Ready for implementation
**Next Action**: Create todos and invoke expert sub-agents
**Protocol Step**: Moving to Step 2 completion (todos) → Step 3 (experts) → Implementation
