# Sprint 8 Day 4 - Search & Performance Enhancement

**Created:** 2025-11-15
**Story Points:** 3-5 points
**Status:** 0/8 complete (0%)
**Estimated Time:** 3.5-5.5 hours

---

## Phase 1: Database Migration (CRITICAL - 30 min)

### Task 1: Add content_tsv column to WikiPage table

**Priority:** HIGH (prerequisite for all search work)
**Status:** ⏳ NOT STARTED

**Steps:**
1. Update Prisma schema with `content_tsv` field
2. Create migration: `npx prisma migrate dev --name add_wiki_content_tsvector`
3. Migration SQL should include:
   - ADD COLUMN content_tsv tsvector
   - UPDATE existing rows with to_tsvector()
   - CREATE GIN index on content_tsv
   - CREATE trigger to auto-update on INSERT/UPDATE
4. Test migration applies cleanly
5. Verify column exists with correct type
6. Verify trigger works on content updates

**Files:**
- `apps/web/prisma/schema.prisma`
- New migration file in `apps/web/prisma/migrations/`

**Success Criteria:**
- [ ] Migration applies without errors
- [ ] `content_tsv` column exists as tsvector type
- [ ] GIN index created successfully
- [ ] Trigger auto-updates `content_tsv` on changes
- [ ] Existing wiki pages have populated `content_tsv`

---

## Phase 2: Implement tsvector Search (HIGH - 2-3 hours)

### Task 2: Replace LIKE fallback in /app/api/wiki/route.ts

**Priority:** HIGH
**Status:** ⏳ NOT STARTED

**Steps:**
1. Replace LIKE-based search with tsvector query
2. Add ts_rank_cd() for relevance ranking
3. Add ts_headline() for search highlighting
4. Update response to include highlight field
5. Test with various search queries

**Files:**
- `apps/web/app/api/wiki/route.ts` (lines 138-148)

**Success Criteria:**
- [ ] Search uses `content_tsv @@ plainto_tsquery()`
- [ ] Results ranked by ts_rank_cd()
- [ ] Highlights generated with ts_headline()
- [ ] Stemming works ("running" matches "run")
- [ ] Search performance <100ms

---

### Task 3: Replace LIKE fallback in /app/wiki/page.tsx

**Priority:** HIGH
**Status:** ⏳ NOT STARTED

**Steps:**
1. Replace LIKE-based search with tsvector query (same pattern as Task 2)
2. Add ts_rank_cd() for relevance ranking
3. Add ts_headline() for search highlighting
4. Update WikiListResult type to include highlight
5. Pass highlight to WikiCard component

**Files:**
- `apps/web/app/wiki/page.tsx` (lines 107-199)

**Success Criteria:**
- [ ] Search uses tsvector (same as API route)
- [ ] Results ranked by relevance
- [ ] Highlights displayed in UI
- [ ] Search works with category filters

---

### Task 4: Verify E2E test "should search wiki pages" passes

**Priority:** HIGH
**Status:** ⏳ NOT STARTED

**Steps:**
1. Restart dev server to load new code
2. Run: `pnpm --filter web test:e2e apps/web/tests/e2e/wiki.spec.ts --grep "should search wiki pages"`
3. Verify test passes (currently fails with 0 results)
4. Check search returns >0 results
5. Verify results contain search term

**Success Criteria:**
- [ ] Test passes ✅
- [ ] Search returns relevant results
- [ ] Search terms highlighted in results

---

## Phase 3: Performance Optimization (MEDIUM - 1-2 hours, OPTIONAL)

### Task 5: Enable React Compiler (Next.js 15+)

**Priority:** MEDIUM
**Status:** ⏳ NOT STARTED

**Steps:**
1. Update `next.config.js` experimental settings
2. Add `reactCompiler: true`
3. Test build and dev mode
4. Measure performance impact

**Files:**
- `apps/web/next.config.js`

**Success Criteria:**
- [ ] React Compiler enabled
- [ ] Build succeeds
- [ ] No runtime errors
- [ ] Measurable performance improvement

---

### Task 6: Add loading states for perceived performance

**Priority:** MEDIUM
**Status:** ⏳ NOT STARTED

**Steps:**
1. Create `app/wiki/loading.tsx` with skeleton UI
2. Create `app/knowledge/loading.tsx` with skeleton UI
3. Test loading states display during navigation
4. Verify smooth transition to content

**Files:**
- `apps/web/app/wiki/loading.tsx` (new)
- `apps/web/app/knowledge/loading.tsx` (new)

**Success Criteria:**
- [ ] Loading skeletons display immediately
- [ ] Smooth transition to content
- [ ] Reduced perceived load time

---

### Task 7: Prefetch critical routes

**Priority:** MEDIUM
**Status:** ⏳ NOT STARTED

**Steps:**
1. Add `prefetch` prop to most-visited wiki pages
2. Add `prefetch` to navigation links
3. Test prefetching in network tab
4. Verify faster navigation

**Files:**
- Various Link components

**Success Criteria:**
- [ ] Critical pages prefetched
- [ ] Faster navigation on second click
- [ ] Network tab shows prefetch requests

---

### Task 8: Verify performance targets met

**Priority:** HIGH
**Status:** ⏳ NOT STARTED

**Steps:**
1. Run E2E performance tests
2. Verify first page load <3s (currently 3.6s)
3. Verify cached load <1.5s (currently 1.67s)
4. Document performance metrics

**Success Criteria:**
- [ ] First page load: <3s ✅
- [ ] Cached load: <1.5s ✅
- [ ] E2E performance tests pass

---

## Summary

**Total Tasks:** 8
**Critical:** 4 (Tasks 1-4)
**High Priority:** 1 (Task 8)
**Medium Priority:** 3 (Tasks 5-7)

**Must Complete Today:**
- ✅ Task 1: Database migration
- ✅ Task 2-3: tsvector implementation
- ✅ Task 4: Verify tests pass

**Optional (if time permits):**
- Task 5-7: Performance optimizations
- Task 8: Performance verification

**Next Task:** Task 1 - Add content_tsv column to WikiPage table

---

**Reference:** `.agent/task/sprint-8-day-4-todos.md` (full detailed plan)
**Last Updated:** 2025-11-15
