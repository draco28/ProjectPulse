# Sprint 8 Day 3 Continued: Add 36 New E2E Tests

**Created:** 2025-11-15
**Session:** 20251115-0002
**Objective:** Add 36 new E2E tests for Wiki & Knowledge features
**Prerequisites:** ✅ Baseline stable (30/31 passing, 97%)

---

## Implementation Plan

### Phase 1: Wiki Auto-Generation Tests (6 tests)

**File:** `apps/web/tests/e2e/wiki.spec.ts`

**New Tests:**
1. **Generate wiki from JSDoc comments**
   - Test POST /api/wiki/generate endpoint
   - Verify wiki page created with auto-generated content
   - Check sourceFiles metadata populated

2. **Handle duplicate detection**
   - Generate wiki for same file twice
   - Verify duplicate detection (by title or path)
   - Check error message or skip behavior

3. **Verify cross-linking automation**
   - Generate wiki with @wiki/slug references in JSDoc
   - Verify PageLink records created
   - Check [[slug]] syntax resolution

4. **Test markdown generation quality**
   - Verify JSDoc @param, @returns, @example blocks formatted correctly
   - Check code blocks have proper syntax highlighting hints
   - Verify headings hierarchy (# for function name, ## for sections)

5. **Test file pattern matching**
   - Generate with glob pattern (e.g., "**/*.ts")
   - Verify multiple files scanned
   - Check only matching files included

6. **Test error handling**
   - Generate with invalid project path
   - Generate with no JSDoc comments
   - Verify error messages returned

**Success Criteria:**
- All 6 tests passing
- Wiki generation workflow verified end-to-end
- Error cases handled gracefully

---

### Phase 2: Wiki Revisions & Rollbacks (8 tests)

**File:** `apps/web/tests/e2e/wiki.spec.ts`

**New Tests:**
1. **Create revisions on edit**
   - Edit existing wiki page
   - Verify WikiRevision record created
   - Check revision contains previous content

2. **View revision history**
   - Navigate to wiki page
   - Click "View History" or similar
   - Verify revision timeline displayed

3. **Revert to previous version**
   - View revision history
   - Click "Revert" on old revision
   - Verify content restored

4. **Diff viewer functionality**
   - View two revisions side-by-side
   - Verify additions highlighted (green)
   - Verify deletions highlighted (red)

5. **Revision metadata tracking**
   - Check revision shows author name
   - Check revision shows timestamp
   - Check revision shows change summary (if applicable)

6. **Changelog generation**
   - Verify changelog field populated on edit
   - Check changelog visible in revision history
   - Verify empty changelog handled gracefully

7. **Concurrent edit handling**
   - Simulate two users editing same page
   - Verify both revisions created
   - Check no data loss

8. **Revision permissions** (basic check)
   - Verify revision history accessible
   - Check revert action visible
   - Verify no unauthorized access (if auth implemented)

**Success Criteria:**
- All 8 tests passing
- Revision system verified working
- Rollback functionality tested

---

### Phase 3: Knowledge Graph Traversal (10 tests)

**File:** `apps/web/tests/e2e/knowledge.spec.ts`

**New Tests:**
1. **1-hop relationship discovery**
   - Click knowledge item with relationships
   - Verify "Related Knowledge" section visible
   - Check directly related items displayed

2. **2-hop relationship discovery**
   - Click knowledge item
   - Verify 2-hop relationships shown (if UI supports)
   - Check relationship path displayed

3. **Relationship strength filtering**
   - View knowledge graph
   - Filter by strength threshold (e.g., >0.7)
   - Verify weak relationships hidden

4. **Bidirectional relationship display**
   - Create relationship A → B
   - Navigate to B
   - Verify reverse relationship B ← A visible

5. **Path tracking**
   - View multi-hop path (A → B → C)
   - Verify path breadcrumbs or trail displayed
   - Check path clickable for navigation

6. **Circular relationship detection**
   - Create circular relationship (A → B → C → A)
   - Verify no infinite loop in traversal
   - Check circular path displayed correctly

7. **Orphaned node handling**
   - Create knowledge item with no relationships
   - Verify "No related items" message
   - Check no errors thrown

8. **Graph visualization data**
   - Navigate to knowledge graph view (if exists)
   - Verify nodes and edges rendered
   - Check graph responsive to clicks

9. **Relationship type filtering**
   - Filter by relationship type (REFERENCES, EXTENDS, CONTRADICTS)
   - Verify only matching relationships shown
   - Check filter state persists in URL

10. **Graph depth limits**
    - Configure max depth (e.g., 2 hops)
    - Verify graph stops at limit
    - Check no performance issues with deep graphs

**Success Criteria:**
- All 10 tests passing
- Graph traversal verified
- Edge cases handled

---

### Phase 4: Hybrid Search Modes (8 tests)

**File:** `apps/web/tests/e2e/knowledge.spec.ts`

**New Tests:**
1. **Semantic-only search mode**
   - Switch search mode to "Semantic"
   - Enter query
   - Verify results ranked by vector similarity

2. **Fulltext-only search mode**
   - Switch search mode to "Fulltext"
   - Enter query
   - Verify results ranked by ts_rank

3. **Hybrid search (default)**
   - Use default search mode
   - Enter query
   - Verify results use weighted combination (0.7 semantic + 0.3 fulltext)

4. **Search mode indicator display**
   - Switch between modes
   - Verify active mode highlighted in UI
   - Check mode persists in URL param

5. **Result ranking verification**
   - Search with all 3 modes
   - Verify result order differs
   - Check most relevant results at top

6. **Search performance benchmarks**
   - Measure search response time
   - Verify <200ms for typical queries
   - Check large result sets don't timeout

7. **Empty query handling**
   - Submit empty search
   - Verify no results or all results shown
   - Check no errors thrown

8. **Search result highlighting**
   - Search for keyword
   - Verify keyword highlighted in snippets
   - Check highlights visible and accessible

**Success Criteria:**
- All 8 tests passing
- All 3 search modes verified
- Performance targets met

---

### Phase 5: Cross-Linking & Relationships (4 tests)

**File:** `apps/web/tests/e2e/knowledge.spec.ts`

**New Tests:**
1. **Create knowledge relationships**
   - Navigate to knowledge item
   - Click "Add Relationship"
   - Select relationship type and target item
   - Verify relationship created

2. **Display relationship types**
   - View knowledge item with relationships
   - Verify relationship types displayed (REFERENCES, EXTENDS, CONTRADICTS)
   - Check type icons or labels visible

3. **Navigate through relationship graph**
   - Click related knowledge item
   - Navigate to target item
   - Verify navigation path tracked

4. **Detect duplicate knowledge items**
   - Create knowledge item with similar title
   - Verify duplicate detection warning
   - Check semantic similarity threshold (>0.95)

**Success Criteria:**
- All 4 tests passing
- Relationship creation verified
- Duplicate detection working

---

## Test Resilience Patterns (From Baseline Session)

**Critical Learnings:**
1. **Flexible selectors**: Use `textContent()` instead of `getByRole('link', { name: /exact/i })`
2. **Proper scoping**: Scope to `main`, `body`, or semantic regions
3. **Explicit timeouts**: Add 10s+ timeout for async operations
4. **Reality-based**: Verify actual content, not assumed UI
5. **Process cleanup**: Always kill concurrent processes before running

**Implementation Guidelines:**
- Avoid strict mode violations (scope selectors properly)
- Use regex patterns for flexible text matching
- Add explicit waits for debounced operations
- Check element existence before assertions
- Handle conditional features gracefully (test.skip() if not implemented)

---

## Success Metrics

**Target:** 67 total E2E tests (31 existing + 36 new)
**Pass Rate:** 100% (all tests passing or properly skipping)
**Execution Time:** <2min total
**TypeScript Errors:** 0

---

## Rollback Plan

If tests fail due to missing features:
1. Use `test.skip()` for unimplemented features
2. Document why test was skipped
3. Continue with remaining tests
4. Report skipped tests to user

If tests break baseline:
1. Revert changes to test files
2. Investigate root cause
3. Fix issue before proceeding

---

**Plan Reviewed:** 2025-11-15
**Ready to Implement:** ✅ Baseline stable, plan complete
