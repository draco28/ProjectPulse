. Overall Phase / Protocol Status
Environment: Confirmed Mac mini Docker stack is healthy via curl http://192.168.1.15:3000/api/health (status: "healthy", database: "connected").
Scope: Sprint 8 Day 4, Option 2:
Wiki full‑text search with tsvector (DB + API + UI).
Verify wiki search E2E test.
Optional perf slice (loading skeletons).
2. Database / Prisma State
2.1 Existing migration (not added by me)
Migration already present:
apps/web/prisma/migrations/20251111170322_wiki_full_text_search/migration.sql
It does:
sql
ALTER TABLE "WikiPage"
  ADD COLUMN "content_tsv" tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("excerpt", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("content", '')), 'C')
  ) STORED;

CREATE INDEX "WikiPage_content_tsv_idx" ON "WikiPage" USING GIN ("content_tsv");
So content_tsv already exists as a generated column + GIN index. I treated that as satisfying the “migration” task (no new migration added).
2.2 Prisma schema for 
WikiPage
File: 
apps/web/prisma/schema.prisma

WikiPage
 currently has:
prisma
model WikiPage {
  id        Int     @id @default(autoincrement())
  title     String
  content   String  @db.Text
  excerpt   String? @db.Text
  category  String?
  ...
  // Full-text search (will be populated by triggers)
  searchVector String? @db.Text // Using Text as placeholder for tsvector
  ...
}
There is no Prisma-mapped content_tsv field; we access it via raw SQL only.
I did not change the schema file.
3. Existing Pattern Used as Reference
File: 
apps/web/app/api/search/route.ts

Unified search already uses WikiPage.content_tsv with:
plainto_tsquery('english', ${searchTerm})
ts_rank_cd("content_tsv", tsquery) for ranking
ts_headline('english', "content", tsquery, 'StartSel=**, StopSel=**') for snippets
Raw SQL via Prisma.sql + prisma.$queryRaw
I reused this pattern for the wiki-specific endpoints.

4. Changes in /api/wiki (GET /api/wiki)
File: 
apps/web/app/api/wiki/route.ts

Before
GET handler used LIKE-based fallback when search query param was present:
Built a Prisma.WikiPageWhereInput with OR over title, content, excerpt using contains / mode: 'insensitive'.
Used prisma.wikiPage.findMany + count.
No ranking or tsvector search, no highlights.
After (my implementation)
When search is not present:

Behavior unchanged:
Uses prisma.wikiPage.findMany with where = { category? }, orderBy: updatedAt desc, limit/offset.
Returns pages plus pagination { total, limit, offset, hasMore }.
When search is present:

New behavior:
searchTerm = search.trim()
Build tsQuery once:
ts
const tsQuery = Prisma.sql`plainto_tsquery('english', ${searchTerm})`;
Optional category filter:
ts
const categoryCondition = category
  ? Prisma.sql`AND "category" = ${category}`
  : Prisma.sql``;
Fetch results and total in parallel using parameterized raw SQL:
ts
const [rows, countRows] = await Promise.all([
  prisma.$queryRaw<Array<{
    id: number;
    title: string;
    path: string;
    category: string | null;
    excerpt: string | null;
    createdAt: Date;
    updatedAt: Date;
    highlight: string | null;
    rank: number;
  }>>(Prisma.sql`
    SELECT
      "id",
      "title",
      "path",
      "category",
      "excerpt",
      "createdAt",
      "updatedAt",
      ts_headline(
        'english',
        "content",
        ${tsQuery},
        'MaxFragments=2, MinWords=5, MaxWords=20, StartSel=**, StopSel=**'
      ) AS highlight,
      ts_rank_cd("content_tsv", ${tsQuery}) AS rank
    FROM "WikiPage"
    WHERE "content_tsv" @@ ${tsQuery}
    ${categoryCondition}
    ORDER BY rank DESC, "updatedAt" DESC
    LIMIT ${limit} OFFSET ${offset};
  `),
  prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM "WikiPage"
    WHERE "content_tsv" @@ ${tsQuery}
    ${categoryCondition};
  `),
]);
Map rows to API response shape:
ts
const pages = rows.map((row) => ({
  id: row.id,
  title: row.title,
  path: row.path,
  category: row.category,
  excerpt: row.excerpt ?? row.highlight ?? null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  highlight: row.highlight, // extra field
}));
pagination struct remains the same (includes hasMore based on offset + limit < total).
So /api/wiki now uses tsvector search instead of LIKE, with ranking and highlights.

5. Changes in 
/app/wiki/page.tsx
 (Wiki list Server Component)
File: 
apps/web/app/wiki/page.tsx

Before
getWikiPages
 function:
Parsed category, search, sort, page.
Built where object and, if searchTerm existed, used LIKE-based search:
ts
const searchWhere: Prisma.WikiPageWhereInput = {
  ...(categoryFilter.length > 0 ? { category: { in: categoryFilter } } : {}),
  OR: [
    { title: { contains: searchTerm, mode: 'insensitive' } },
    { content: { contains: searchTerm, mode: 'insensitive' } },
  ],
};
Used prisma.wikiPage.findMany + count.
Post-processed each result to build a “simple highlight” slice of content.
Set highlight: null in 
WikiListResult
.
After (my implementation)
Still supports:
categoryFilter (from category query param, comma-separated).
sort options (newest, oldest, title, updated).
page and perPage (10).
When no searchTerm:
Still uses Prisma findMany + count with where, orderBy, analytics join, etc. No change.
When searchTerm is present:
Build tsQuery:
ts
const tsQuery = Prisma.sql`plainto_tsquery('english', ${searchTerm})`;
Category filter for multiple categories:
ts
const categoryCondition =
  categoryFilter.length > 0
    ? Prisma.sql`AND "category" = ANY(${categoryFilter})`
    : Prisma.sql``;
Raw SQL query for ranked + highlighted results (same pattern as /api/wiki, but using perPage & offset):
ts
const [rows, countRows] = await Promise.all([
  prisma.$queryRaw<Array<{
    id: number;
    title: string;
    path: string;
    category: string | null;
    excerpt: string | null;
    createdAt: Date;
    updatedAt: Date;
    highlight: string | null;
    rank: number;
  }>>(Prisma.sql`
    SELECT
      "id",
      "title",
      "path",
      "category",
      "excerpt",
      "createdAt",
      "updatedAt",
      ts_headline(
        'english',
        "content",
        ${tsQuery},
        'MaxFragments=2, MinWords=5, MaxWords=20, StartSel=**, StopSel=**'
      ) AS highlight,
      ts_rank_cd("content_tsv", ${tsQuery}) AS rank
    FROM "WikiPage"
    WHERE "content_tsv" @@ ${tsQuery}
    ${categoryCondition}
    ORDER BY rank DESC, "updatedAt" DESC
    LIMIT ${perPage} OFFSET ${offset};
  `),
  prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM "WikiPage"
    WHERE "content_tsv" @@ ${tsQuery}
    ${categoryCondition};
  `),
]);
Fetch analytics only for row IDs:
ts
const analytics = rows.length
  ? await prisma.wikiPageAnalytics.findMany({
      where: { wikiPageId: { in: rows.map((row) => row.id) } },
      select: { wikiPageId, viewCount, positiveVotes, negativeVotes, popularity },
    })
  : [];
Map to 
WikiListResult
:
ts
const pages: WikiListResult[] = rows.map((row) => {
  const stats = analyticsMap.get(row.id);
  const totalVotes = ...;
  const helpfulRatio = ...;

  return {
    id: row.id,
    title: row.title,
    excerpt: row.highlight ?? row.excerpt ?? '',
    category: row.category,
    path: row.path,
    updatedAt: row.updatedAt,
    highlight: row.highlight, // <-- used by WikiCard
    stats: stats ? { views, helpfulRatio, popularity } : undefined,
  };
});
WikiCard (unchanged) already:
Accepts highlight?: string.
Uses 
renderHighlightedText(highlight || excerpt)
.
renderHighlightedText
 splits on ** and wraps those segments in <mark>; this matches the ts_headline StartSel=**, StopSel=** config.
So the list page now renders proper <mark> highlights based on tsvector search.

6. E2E Test Status (from previous full run)
Full wiki E2E run (
apps/web/tests/e2e/wiki.spec.ts
) produced:

21 failed, including:
Basic rendering & TOC tests.
Cross-linking tests.
Performance tests.
Full-text search tests:
Wiki Full-Text Search › should search wiki pages
Wiki Full-Text Search › should filter by category (mobile)
These failed on firefox, Mobile Chrome, Mobile Safari in the last full run.
The HTML report was served at http://localhost:50111 (or similar port) on your machine; I cannot open that from here. I also attempted targeted re-runs, but you canceled them (which is fine; you’ll run them via Codex).
From the test spec (no logs), the key expectations for should search wiki pages:

GET /wiki loads.
It finds an input with placeholder matching /Search wiki/i.
It fills installation and waits ~800 ms (debounced search).
It expects at least one link in the main area with text containing Getting Started OR Installation OR Docker OR Guide.
Given our implementation, if anything fails, it’s likely:

No results returned for that term (e.g. tsvector config or seed mismatch).
The search input placeholder changed and the test can’t find it.
Or UI slow / no networkidle due to performance, though less likely for the search test.
7. What I Have Not Changed
No changes to:
WikiCard, WikiListClient, 
WikiSearchBar
 (other than relying on existing behavior).
wiki.spec.ts
 E2E tests.
prisma/seed.ts
 wiki seeds (they still include “Getting Started with ProjectPulse”, with headings and “Installation Steps”).
Any performance settings, loading skeletons, or caching behavior.
8. Suggested Next Steps for Codex
If you want Codex to take over testing:

Run focused search E2E tests (inside apps/web):
bash
pnpm test:e2e -- tests/e2e/wiki.spec.ts --grep "Wiki Full-Text Search"
Or narrower:
bash
pnpm test:e2e -- tests/e2e/wiki.spec.ts --grep "should search wiki pages"
Inspect failures:
Look for:
0 results (assertion expect(count).toBeGreaterThan(0)).
Selectors failing (no search input placeholder match).
Backend errors in console.
If search returns 0 results:
Confirm DB has wiki pages:
sql
SELECT id, title, content_tsv FROM "WikiPage";
Try a direct query:
sql
SELECT title, ts_rank_cd(content_tsv, plainto_tsquery('english', 'installation')) AS rank
FROM "WikiPage"
WHERE content_tsv @@ plainto_tsquery('english', 'installation')
ORDER BY rank DESC;
If this returns rows but UI shows none, the bug is in our raw SQL (category filter, pagination, or Next.js route).




codex summary : 

Updates

Added a focused Jest suite for the wiki list/search API so we now assert pagination, category filters, the tsvector + highlight mapping, and error handling end-to-end in the handler logic (apps/web/app/api/wiki/__tests__/route.test.ts (line 1)). These mocks guarantee we don’t regress the raw-SQL flow while keeping tests deterministic.
Strengthened the Playwright search-highlighting scenario to require at least one <mark> (and that it contains the typed term) so the UI test now enforces the new tsvector highlight contract instead of silently passing without it (apps/web/tests/e2e/wiki.spec.ts (lines 244-278)).
Testing

pnpm test -- app/api/wiki/__tests__/route.test.ts (apps/web) ✅ — confirms the new API tests pass; the logged error is from the intentional failure-path assertion.
Blocked

pnpm exec playwright test --grep "Wiki Full-Text Search" tests/e2e/wiki.spec.ts ❌ Chromium can’t launch inside this sandbox (bootstrap_check_in … Permission denied) and the suite targets the remote Docker host at http://192.168.1.15:3000, which also requires network access. Please rerun locally once those restrictions are lifted.
Next Steps

Re-run the updated Playwright suite against the Docker environment when you have local browser/network access.
Run the full Jest suite (pnpm test) if you need aggregate coverage for Sprint 8 before committing.
Let me know if you’d like similar coverage for the server component path or for wiki detail flows.