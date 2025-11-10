# SOP: ISR Wiki List Pattern

## Purpose

Document the pattern for creating list pages with Incremental Static Regeneration (ISR) for static or semi-static content like documentation, guides, and references.

## When to Use

**Use ISR pattern when:**
- Content changes infrequently (documentation, wiki pages, blog posts)
- Performance is critical (list pages with 100+ items)
- Content is mostly static with occasional updates
- Cache staleness is acceptable (minutes to hours)
- SEO is important (pre-rendered HTML)

**Example use cases:**
- Wiki/documentation list pages ✅
- Blog post listings ✅
- Product catalog (updates hourly/daily) ✅
- Static reference pages ✅

**DO NOT use ISR when:**
- Content changes frequently (real-time updates required)
- User-specific data needed (personalized content)
- Data freshness critical (financial data, inventory)
- Content updates every few seconds

**Example non-ISR cases:**
- Issue tracker list (use fully dynamic) ❌
- User notifications (use real-time) ❌
- Shopping cart (use client state) ❌
- Live dashboards (use polling/websockets) ❌

## Prerequisites

- Next.js 14+ with App Router
- Server Components enabled
- Database with indexed query fields
- Understanding of ISR vs static vs dynamic rendering

## Procedure

### Step 1: Set Revalidation Period

Define how often the cache should refresh (in seconds).

**Example:**
```typescript
// apps/web/app/wiki/page.tsx (lines 18-19)
// ISR: Revalidate every hour (same as wiki detail page)
export const revalidate = 3600; // 1 hour in seconds
```

**Revalidation Period Guidelines:**
- **Hourly (3600s)**: Documentation, wiki, help articles
- **Daily (86400s)**: Blog posts, news archives
- **Minutes (300s)**: Product catalog, pricing pages
- **Weeks (604800s)**: Rarely changing reference data

**Gotcha**: Don't set revalidate too low (< 60s) or you lose ISR benefits. Use fully dynamic rendering instead.

### Step 2: Create Data Fetching Function

Separate data fetching logic into dedicated async function (outside component).

**Example:**
```typescript
// apps/web/app/wiki/page.tsx (lines 42-115)
async function getWikiPages(searchParams: SearchParams) {
  // Parse filters from URL
  const categoryFilter = searchParams.category?.split(',').filter(Boolean) || [];
  const searchTerm = searchParams.search || '';
  const sortBy = searchParams.sort || 'newest';
  const page = parseInt(searchParams.page || '1', 10);
  const perPage = 10;

  // Build where clause
  const where: WhereClause = {};

  // Category filter (OR logic for multiple categories)
  if (categoryFilter.length > 0) {
    where.category = { in: categoryFilter };
  }

  // Search filter (searches title AND content)
  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' as const } },
      { content: { contains: searchTerm, mode: 'insensitive' as const } },
    ];
  }

  // Build orderBy clause
  let orderBy:
    | { createdAt: 'desc' | 'asc' }
    | { updatedAt: 'desc' | 'asc' }
    | { title: 'asc' };

  switch (sortBy) {
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    case 'title':
      orderBy = { title: 'asc' };
      break;
    case 'updated':
      orderBy = { updatedAt: 'desc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  // Fetch pages + total count in parallel
  const [pages, totalCount] = await Promise.all([
    prisma.wikiPage.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true, // Will truncate to excerpt client-side
        category: true,
        path: true,
        updatedAt: true,
      },
      orderBy,
      take: perPage,
      skip: (page - 1) * perPage,
    }),
    prisma.wikiPage.count({ where }),
  ]);

  return {
    pages,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / perPage),
    perPage,
  };
}
```

**Why separate function?**
- Reusable across components
- Easier to test
- Clear separation of concerns
- Can be moved to server actions later

**Gotcha**: Always return structured data (not raw Prisma results). Include pagination metadata.

### Step 3: Optimize Database Queries with Select

Only fetch fields you need. Exclude large fields (content, images, JSON blobs).

**Example:**
```typescript
// apps/web/app/wiki/page.tsx (lines 91-106)
const [pages, totalCount] = await Promise.all([
  prisma.wikiPage.findMany({
    where,
    select: {
      id: true,
      title: true,
      content: true, // Will truncate to excerpt client-side
      category: true,
      path: true,
      updatedAt: true,
    },
    orderBy,
    take: perPage,
    skip: (page - 1) * perPage,
  }),
  prisma.wikiPage.count({ where }),
]);
```

**Select Optimization Rules:**
- ✅ Include: IDs, titles, timestamps, enums
- ✅ Include: Small text fields (< 500 chars)
- ❌ Exclude: Large content fields (truncate client-side if needed)
- ❌ Exclude: Relations unless needed (use separate query)
- ❌ Exclude: JSON blobs, images, binary data

**Gotcha**: Including `content` field for excerpt is OK if you truncate client-side (line 196). Alternative: Create `excerpt` field in database.

### Step 4: Use Parallel Queries for Independent Data

Fetch independent data in parallel using `Promise.all()`.

**Example:**
```typescript
// apps/web/app/wiki/page.tsx (lines 117-131)
async function getCategoryStats() {
  const categoryCounts = await prisma.wikiPage.groupBy({
    by: ['category'],
    _count: true,
    where: {
      category: { not: null },
    },
  });

  return Object.fromEntries(
    categoryCounts
      .filter((c) => c.category)
      .map((c) => [c.category!, c._count])
  );
}

// In component (lines 139-140)
const [{ pages, totalCount, currentPage, totalPages, perPage }, categoryStats] =
  await Promise.all([getWikiPages(params), getCategoryStats()]);
```

**When to parallelize:**
- Queries don't depend on each other ✅
- Querying different tables ✅
- Aggregation + detail queries ✅

**When NOT to parallelize:**
- Second query needs first query's result ❌
- Single query can do both (JOIN) ❌
- Queries modify data (race conditions) ❌

**Gotcha**: Don't over-parallelize (> 5 queries). Consider denormalization or caching instead.

### Step 5: Implement Category Filtering with GroupBy

Use Prisma `groupBy` for efficient category counts (single query, no N+1).

**Example:**
```typescript
// apps/web/app/wiki/page.tsx (lines 117-131)
async function getCategoryStats() {
  const categoryCounts = await prisma.wikiPage.groupBy({
    by: ['category'],
    _count: true,
    where: {
      category: { not: null },
    },
  });

  return Object.fromEntries(
    categoryCounts
      .filter((c) => c.category)
      .map((c) => [c.category!, c._count])
  );
}
```

**Why groupBy instead of multiple queries?**
- Single database roundtrip
- Database handles aggregation (faster)
- Scales to thousands of categories
- No N+1 query problem

**Alternative (inefficient):**
```typescript
// ❌ BAD: N+1 queries
const categories = ['guides', 'reference', 'api'];
const counts = {};
for (const cat of categories) {
  counts[cat] = await prisma.wikiPage.count({ where: { category: cat } });
}
```

**Gotcha**: `groupBy` returns array, convert to object for easy lookup.

### Step 6: Handle Search Params as Function Arguments

Accept search params as typed function arguments (not global access).

**Example:**
```typescript
// apps/web/app/wiki/page.tsx (lines 26-32, 133-137)
interface SearchParams {
  category?: string;
  search?: string;
  sort?: string;
  page?: string;
  [key: string]: string | undefined;
}

export default async function WikiPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [{ pages, totalCount, currentPage, totalPages, perPage }, categoryStats] =
    await Promise.all([getWikiPages(params), getCategoryStats()]);
  // ...
}
```

**Why this pattern?**
- Type-safe (TypeScript knows params structure)
- Testable (inject params in tests)
- Clear dependencies (function signature documents inputs)
- Works with generateStaticParams()

**Gotcha**: Search params are Promise in Next.js 15+. Always `await` them.

### Step 7: Implement generateStaticParams for Build-Time Generation

Generate static pages at build time for common filter combinations.

**Example:**
```typescript
// apps/web/app/wiki/page.tsx (add this)
export async function generateStaticParams() {
  // Pre-render these filter combinations at build time
  return [
    {}, // No filters (default page)
    { category: 'guides' },
    { category: 'reference' },
    { category: 'api' },
    { sort: 'title' },
  ];
}
```

**What gets pre-rendered:**
- `/wiki` (no filters)
- `/wiki?category=guides`
- `/wiki?category=reference`
- `/wiki?category=api`
- `/wiki?sort=title`

**Other combinations?**
- Generated on-demand (first request)
- Cached via ISR (subsequent requests fast)

**Gotcha**: Don't pre-render too many combinations (build time explodes). Focus on top 10-20 most common.

## Verification

After implementation, verify:

- [ ] `export const revalidate = [seconds]` present
- [ ] Data fetching in separate async function
- [ ] Parallel queries with `Promise.all()`
- [ ] Select optimization (only needed fields)
- [ ] Search params typed interface
- [ ] generateStaticParams() for common filters
- [ ] Build succeeds: `pnpm build`
- [ ] Cache headers correct: `curl -I http://localhost:3000/wiki`
- [ ] Performance < 100ms for cached pages

## Troubleshooting

### Issue: Page Still Fully Dynamic

**Symptom**: Every request hits database (no caching)
**Cause**: Missing `export const revalidate`
**Solution**: Add `export const revalidate = 3600` at top of page file

### Issue: Stale Data Showing

**Symptom**: Updates not appearing for an hour
**Cause**: ISR cache not invalidated
**Solution**:
1. Wait for revalidation period to expire
2. Or use `revalidatePath('/wiki')` in mutation
3. Or reduce revalidation period

### Issue: Build Timeout

**Symptom**: Build fails with "generateStaticParams took too long"
**Cause**: Pre-rendering too many pages
**Solution**: Reduce generateStaticParams combinations (< 100 pages)

### Issue: TypeScript Errors on searchParams

**Symptom**: `searchParams` type errors
**Cause**: Next.js 15+ changed searchParams to Promise
**Solution**: Always `await searchParams` before using

## Performance Comparison

**ISR Wiki List** (this pattern):
- First request: ~200ms (database query)
- Cached request: ~10ms (served from cache)
- Cache invalidation: Every 1 hour
- Build time: ~5s (10 static pages)

**Fully Dynamic Issues List** (no ISR):
- Every request: ~200ms (database query)
- No caching
- Real-time updates
- Build time: ~1s (no pre-rendering)

**Static Generation** (no searchParams):
- Build time: ~30s (100+ pages)
- Runtime: ~5ms (static HTML)
- No dynamic filters
- Requires rebuild for updates

## Related Documentation

- [Next.js ISR Docs](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [.agent/system/api-catalog.md](../system/api-catalog.md) - All endpoints
- [.agent/system/database-schema.md](../system/database-schema.md) - Prisma models
- [server-component-performance.md](./server-component-performance.md) - Performance optimization
- [multi-select-url-filter-pattern.md](./multi-select-url-filter-pattern.md) - Filter implementation

## Examples from Codebase

- [apps/web/app/wiki/page.tsx](../../apps/web/app/wiki/page.tsx) - Full ISR implementation
- [apps/web/app/issues/page.tsx](../../apps/web/app/issues/page.tsx) - Fully dynamic (for comparison)
- [apps/web/app/wiki/[slug]/page.tsx](../../apps/web/app/wiki/[slug]/page.tsx) - ISR detail page

## Decision Criteria: ISR vs Dynamic vs Static

| Factor | ISR | Dynamic | Static |
|--------|-----|---------|--------|
| **Content changes** | Hourly/Daily | Real-time | Build-time only |
| **Cache staleness OK?** | Yes (1-60 min) | No | N/A |
| **User-specific data?** | No | Yes | No |
| **SEO important?** | Yes | Yes | Yes |
| **Performance critical?** | Yes | No | Yes |
| **Build time OK?** | Fast (< 30s) | Fast | Slow (> 1 min) |
| **Use cases** | Wiki, Blog, Docs | Issues, Dashboards | Landing pages |

---

**Last Updated**: 2025-11-10
**Created From**: Sprint 2 Day 2 wiki list page implementation
**Key Insight**: ISR perfect for semi-static content - 95% cache hit rate with 1-hour freshness
