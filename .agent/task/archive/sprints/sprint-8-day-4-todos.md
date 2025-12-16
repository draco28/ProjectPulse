# Sprint 8 Day 4 - Performance & Search Enhancement TODOs

**Date**: 2025-11-15 (for next day)
**Priority**: High
**Estimated Story Points**: 3-5

---

## 🎯 Overview

Based on Sprint 8 Day 3 test results and fixes, the following tasks need to be completed to achieve 100% test pass rate and production-ready search functionality.

---

## 📋 Tasks

### 1. Implement Proper tsvector Full-Text Search

**Priority**: High
**Estimated Time**: 2-3 hours
**Story Points**: 3

**Current State**:
- Using LIKE-based fallback search (`WHERE title ILIKE '%term%'`)
- Works but inefficient for large datasets
- No ranking, no stemming, no language-aware search
- Two code locations using fallback:
  - `/app/api/wiki/route.ts` (lines 138-148)
  - `/app/wiki/page.tsx` (lines 107-199)

**Target State**:
- PostgreSQL tsvector-based full-text search
- Proper ranking with `ts_rank` or `ts_rank_cd`
- Language-aware stemming
- Highlighted search results with `ts_headline`
- Supports phrase matching and prefix search

**Implementation Steps**:

1. **Add `content_tsv` column** to `WikiPage` table (see Task #2)

2. **Update search queries** to use tsvector:
   ```sql
   WHERE content_tsv @@ plainto_tsquery('english', 'search term')
   ORDER BY ts_rank_cd(content_tsv, plainto_tsquery('english', 'search term')) DESC
   ```

3. **Add search highlighting**:
   ```sql
   ts_headline('english', content, plainto_tsquery('english', 'search term'),
     'MaxFragments=2, MinWords=5, MaxWords=20, StartSel=**, StopSel=**')
   ```

4. **Create GIN index** for performance:
   ```sql
   CREATE INDEX idx_wiki_content_tsv ON "WikiPage" USING GIN (content_tsv);
   ```

5. **Update both search endpoints**:
   - `/app/api/wiki/route.ts` (API endpoint)
   - `/app/wiki/page.tsx` (Server Component)

6. **Add tests** to verify:
   - Search returns relevant results
   - Results are ranked by relevance
   - Search terms are highlighted
   - Stemming works (e.g., "running" matches "run")
   - Phrase search works (e.g., "API design")

**Files to Modify**:
- `/apps/web/prisma/schema.prisma` - Add `content_tsv` column
- `/apps/web/app/api/wiki/route.ts` - Replace LIKE with tsvector
- `/apps/web/app/wiki/page.tsx` - Replace LIKE with tsvector
- Create new migration file

**Success Criteria**:
- ✅ E2E test "should search wiki pages" passes
- ✅ Search results ranked by relevance
- ✅ Search performance <100ms for typical queries
- ✅ Highlighting shows matched terms

---

### 2. Add Database Migration for `content_tsv` Column

**Priority**: High (prerequisite for Task #1)
**Estimated Time**: 30 minutes
**Story Points**: 1

**Current State**:
- `WikiPage` table has `title` and `content` columns (text)
- No tsvector column for full-text search
- Previous migration references to `content_tsv` column exist but column was never created

**Target State**:
- `content_tsv` column exists as `tsvector` type
- Automatically updated via trigger when `content` changes
- GIN index created for fast searches

**Implementation Steps**:

1. **Create Prisma migration**:
   ```bash
   npx prisma migrate dev --name add_wiki_content_tsvector
   ```

2. **Migration SQL should include**:
   ```sql
   -- Add tsvector column
   ALTER TABLE "WikiPage"
   ADD COLUMN content_tsv tsvector;

   -- Populate existing rows
   UPDATE "WikiPage"
   SET content_tsv = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''));

   -- Create GIN index
   CREATE INDEX idx_wiki_content_tsv ON "WikiPage" USING GIN (content_tsv);

   -- Create trigger to auto-update tsvector
   CREATE OR REPLACE FUNCTION wiki_content_tsv_trigger() RETURNS trigger AS $$
   BEGIN
     NEW.content_tsv := to_tsvector('english', coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, ''));
     RETURN NEW;
   END
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER wiki_content_tsv_update
   BEFORE INSERT OR UPDATE ON "WikiPage"
   FOR EACH ROW EXECUTE FUNCTION wiki_content_tsv_trigger();
   ```

3. **Update Prisma schema**:
   ```prisma
   model WikiPage {
     // ... existing fields
     content_tsv  String?  @db.TsVector // tsvector for full-text search

     @@index([content_tsv], type: Gin)
   }
   ```

4. **Test migration**:
   ```bash
   # On Mac mini (dev server)
   DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" npx prisma migrate dev

   # Verify column exists
   docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "\d \"WikiPage\""

   # Verify trigger works
   docker exec projectpulse-postgres-cloud psql -U postgres -d projectpulse_dev -c "
     UPDATE \"WikiPage\" SET content = content || ' test' WHERE id = 1;
     SELECT content_tsv FROM \"WikiPage\" WHERE id = 1;
   "
   ```

**Files to Create**:
- New migration file in `/apps/web/prisma/migrations/`
- Updated `/apps/web/prisma/schema.prisma`

**Success Criteria**:
- ✅ Migration applies cleanly to development database
- ✅ `content_tsv` column exists with tsvector type
- ✅ GIN index created successfully
- ✅ Trigger auto-updates `content_tsv` on INSERT/UPDATE
- ✅ Existing wiki pages have populated `content_tsv`

---

### 3. Further Performance Optimization (Optional)

**Priority**: Medium
**Estimated Time**: 1-2 hours
**Story Points**: 2

**Current Performance**:
- First page load: 3.6s (target: <3s) - 21% over budget
- Cached load: 1.67s (target: <1.5s) - 11% over budget
- Database queries: 3 per page (down from 5)

**Already Implemented** (Sprint 8 Day 3):
- ✅ Reduced database queries from 5 → 3
- ✅ Added in-memory caching for category stats (1 hour TTL)
- ✅ Added composite index `[category, id]`
- ✅ Added aggressive browser caching headers for static assets

**Potential Optimizations**:

1. **Enable React Compiler** (Next.js 15+):
   ```javascript
   // next.config.js
   experimental: {
     reactCompiler: true, // Automatic memoization
   }
   ```

2. **Add Loading States** to reduce perceived load time:
   ```typescript
   // app/wiki/loading.tsx
   export default function Loading() {
     return <WikiPageSkeleton />;
   }
   ```

3. **Prefetch Critical Routes**:
   ```typescript
   // Prefetch most visited pages
   <Link href="/wiki/getting-started" prefetch>
   ```

4. **Reduce Bundle Size**:
   - Check bundle analyzer: `npx @next/bundle-analyzer`
   - Lazy load heavy components
   - Remove unused dependencies

5. **Database Query Optimization**:
   - Consider adding `@@index([category, updatedAt])` for sorted queries
   - Use database connection pooling (Prisma already does this)

**Success Criteria**:
- ✅ First page load: <3s
- ✅ Cached load: <1.5s
- ✅ E2E performance tests pass

---

## 🔗 Related Documentation

- **Sprint 8 Day 3 Session**: `.agent/task/current-session-20251115-0002.md`
- **Test Failures**: Lines 461-477 (wiki search), 468-472 (performance budget)
- **Current Implementation**:
  - `/apps/web/app/api/wiki/route.ts` (API search - LIKE fallback)
  - `/apps/web/app/wiki/page.tsx` (Server Component search - LIKE fallback)

---

## 📊 Success Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Wiki Search Test | ❌ Failing (0 results with old code) | ✅ Passing | Pending Task #1 |
| Page Load Time | 3.6s | <3s | ⚠️ 21% over |
| Cached Load Time | 1.67s | <1.5s | ⚠️ 11% over |
| Search Performance | N/A (LIKE) | <100ms (tsvector) | Pending Task #1 |
| Test Pass Rate (Wiki) | 87% (20/23) | 100% (23/23) | Pending fixes |
| Test Pass Rate (Knowledge) | 97% (33/34) | 100% (34/34) | Good |

---

## 🚀 Execution Plan

**Recommended Order**:

1. **Task #2 first** (Database Migration) - 30 min
   - Creates foundation for Task #1
   - Can be tested independently

2. **Task #1 second** (tsvector Implementation) - 2-3 hours
   - Requires Task #2 to be complete
   - Solves the failing search test

3. **Task #3 last** (Performance Tuning) - 1-2 hours
   - Optional if time permits
   - Incrementalbenefits

**Total Estimated Time**: 3.5-5.5 hours
**Total Story Points**: 4-6 points

---

**Last Updated**: 2025-11-15 12:45 PST
**Created By**: Claude Code (Sprint 8 Day 3 session)
