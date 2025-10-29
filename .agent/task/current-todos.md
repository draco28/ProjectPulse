# Phase 4 Todo List - Dynamic Issue Filters

**Created**: 2025-10-29 17:09
**Last Updated**: 2025-10-29 17:35
**Phase**: Week 15 Phase 4 - Dynamic Issue Filters (DB-backed)
**Branch**: `feature/phase4-dynamic-filters`
**Total Tasks**: 15
**Completed**: 2/15 (13%)
**Status**: 🟡 IN PROGRESS (Database Layer 66% complete)

---

## Database Layer (Tasks 1-3) - 66% Complete

- [x] **Task 1**: Create Prisma models ✅ COMPLETE
  - 3 models added: IssueStatusOption, IssuePriorityOption, IssueModuleOption
  - Location: `apps/web/prisma/schema.prisma` (lines 443-490)
  - Includes: id, value, label, order, color class fields, timestamps, indexes

- [x] **Task 2**: Generate and run Prisma migration ✅ COMPLETE
  - Migration: `20251029115644_phase4_dynamic_filter_options`
  - Status: Applied successfully, Prisma Client regenerated
  - Creates: 3 tables + 6 indexes (unique on value, indexes on value + order)

- [ ] **Task 3**: Create seed data with color classes ⏸️ PAUSED
  - Location: `apps/web/prisma/seed.ts`
  - Upsert pattern designed (idempotent)
  - 11 options total: 3 status + 4 priority + 4 module
  - **Next session**: Add seed code and run `pnpm prisma db seed`

---

## Types Layer (Task 4) - Not Started

- [ ] **Task 4**: Create types file (apps/web/types/filters.ts) with interfaces and Zod schemas
  - StatusOption, PriorityOption, ModuleOption interfaces
  - FiltersDTO interface
  - Zod schemas for validation
  - **Estimated**: 15 minutes

---

## API Layer (Task 5) - Not Started

- [ ] **Task 5**: Implement GET /api/settings/filters endpoint with Zod validation
  - Location: `apps/web/app/api/settings/filters/route.ts`
  - Query all option tables with `orderBy: { order: 'asc' }`
  - Add caching: `revalidate: 3600`
  - Return: `{ data: { status, priority, modules, labels } }` or `{ error }`
  - **Estimated**: 30 minutes

---

## UI Layer (Tasks 6-7) - Not Started

- [ ] **Task 6**: Refactor FilterSidebar to accept dynamic options prop
  - Location: `apps/web/components/issues/FilterSidebar.tsx`
  - Accept `options: FiltersDTO` prop
  - Replace hardcoded arrays with dynamic options
  - Preserve count badges and color classes
  - **Estimated**: 30 minutes

- [ ] **Task 7**: Update issues/page.tsx to fetch options and compute counts
  - Fetch filter options via Prisma
  - Compute counts: `prisma.issue.count({ where: { status/priority/module } })`
  - Use `Promise.all` to parallelize count queries
  - Pass `{ counts, options, searchParams }` to FilterSidebar
  - **Estimated**: 30 minutes

---

## Testing Layer (Tasks 8-10) - Not Started

- [ ] **Task 8**: Write unit tests for API route
  - File: `apps/web/app/api/settings/filters/__tests__/route.test.ts`
  - Test: API returns seeded options in correct order
  - Test: API maps color classes correctly
  - Test: API returns `{ error }` with 500 on Prisma failure
  - **Estimated**: 20 minutes

- [ ] **Task 9**: Write component tests for FilterSidebar
  - File: `apps/web/components/issues/__tests__/FilterSidebar.test.tsx`
  - Test: Renders dynamic options with counts
  - Test: Checking/unchecking updates URL params
  - Test: Color classes applied correctly
  - Test: "Clear All" resets all filters
  - **Estimated**: 20 minutes

- [ ] **Task 10**: Write E2E tests for /issues filters
  - File: `apps/web/e2e/issues-filters.spec.ts`
  - Test: Applying filters updates results and URL
  - Test: "Clear All" resets URL params and results
  - Test: Multiple filters combined work correctly
  - Test: Count badges reflect actual issue counts
  - **Estimated**: 20 minutes

---

## Quality & Documentation (Tasks 11-15) - Not Started

- [ ] **Task 11**: Run quality gates (TypeScript, ESLint, tests, build)
  - `pnpm type-check` → 0 errors
  - `pnpm lint` → 0 warnings
  - `pnpm test` → All passing
  - `pnpm test:e2e` → All passing
  - `pnpm build` → Successful
  - **Estimated**: 10 minutes

- [ ] **Task 12**: Update documentation
  - docs/02-DATABASE-SCHEMA.md (add new models)
  - STATUS.md (Phase 4 completion)
  - DEVELOPMENT_PLAN.md (mark Phase 4 ✅)
  - **Estimated**: 10 minutes

- [ ] **Task 13**: Create COMPLETION_phase4_dynamic_filters.md
  - Use completion template
  - Document: Tests, coverage, quality gates, lessons learned
  - **Estimated**: 10 minutes

- [ ] **Task 14**: Commit documentation changes (two-stage commit)
  - Commit docs FIRST per protocol
  - Message: "docs: complete Phase 4 Dynamic Filters documentation"
  - **Estimated**: 5 minutes

- [ ] **Task 15**: Commit code changes and create PR
  - Commit code SECOND
  - Message: "feat: implement dynamic DB-driven filter options"
  - Create PR with comprehensive description
  - **Estimated**: 5 minutes

---

## Progress Tracking

**Session Start**: 2025-10-29 17:09
**Last Checkpoint**: 2025-10-29 17:35
**Next Session Start**: Resume at Task 3 (seed data)

**Token Usage at Checkpoint**: ~118K/200K (59%)

---

## Success Criteria

- [x] Prisma models created with correct schema ✅
- [x] Migration applied successfully ✅
- [ ] Seed data populates all 11 options
- [ ] No hardcoded filter options in UI
- [ ] API and UI strictly typed with Zod-validated response
- [ ] Tests ≥80% coverage for new code
- [ ] All quality gates pass
- [ ] Documentation updated and committed first
