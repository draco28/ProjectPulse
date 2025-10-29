# Next.js Implementation Plan: Dynamic Filter Options

**Created**: 2025-10-29 17:17
**Type**: Page + API Route
**Phase**: Week 15 Phase 4 - Dynamic Issue Filters

---

## Executive Summary

This analysis recommends a **hybrid Server/Client Component architecture** with **Server-side data fetching** for filter options and counts. The key architectural decision is to fetch options in the Server Component (`issues/page.tsx`) and pass them as props to the Client Component (`FilterSidebar.tsx`), avoiding unnecessary API round-trips and JavaScript bundle bloat.

**Key Recommendations**:

1. ✅ Keep issues/page.tsx as Server Component (fetch options + counts)
2. ✅ Keep FilterSidebar as Client Component (URL state + interactivity)
3. ✅ Use direct Prisma queries (not API fetch) for options
4. ✅ Use `Promise.all()` to parallelize count queries
5. ✅ Cache options with `unstable_cache()` (1 hour)
6. ✅ Provide API endpoint for client-side use cases (future)

---

## Architecture Decision: Server vs Client Components

### Current Architecture Analysis

**Current State** (from `FilterSidebar.tsx`):

- ✅ Client Component (has `"use client"`)
- ✅ Uses `useRouter()` and `useSearchParams()` for URL state
- ✅ Receives `counts` and `searchParams` as props from parent
- ❌ Hardcoded filter options (STATUS_OPTIONS, PRIORITY_OPTIONS, MODULE_OPTIONS)

**Current State** (from `issues/page.tsx`):

- ✅ Server Component (no `"use client"`)
- ✅ Fetches issues with Prisma directly
- ✅ Computes filter counts using `prisma.issue.groupBy()`
- ✅ Passes `counts` and `searchParams` to FilterSidebar
- ✅ Uses parallel fetching with `Promise.all()`

### Recommended Architecture

**Issues Page (Server Component)** - ✅ OPTIMAL

```typescript
// apps/web/app/issues/page.tsx

export default async function IssuesPage({ searchParams }) {
  const params = await searchParams;

  // Fetch BOTH issues and filter options on server
  const [
    { issues, totalCount, currentPage, totalPages, perPage },
    filterCounts,
    filterOptions  // ← NEW: Fetch options here
  ] = await Promise.all([
    getIssues(params),
    getFilterCounts(),
    getFilterOptions()  // ← NEW: Server-side fetch
  ]);

  return (
    <main>
      <FilterSidebar
        counts={filterCounts}
        options={filterOptions}  // ← Pass as props
        searchParams={params}
      />
      {/* ... rest of page ... */}
    </main>
  );
}
```

**FilterSidebar (Client Component)** - ✅ KEEP AS-IS

```typescript
// apps/web/components/issues/FilterSidebar.tsx
"use client";

import { FiltersDTO } from '@/types/filters';

interface FilterSidebarProps {
  counts: FilterCounts;
  options: FiltersDTO;  // ← NEW: Accept dynamic options
  searchParams: Record<string, string | undefined>;
}

export function FilterSidebar({ counts, options, searchParams }: FilterSidebarProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  // Replace hardcoded arrays with options.status, options.priority, options.modules
  return (
    <div>
      {options.status.map((option) => (
        <label key={option.value}>
          <input type="checkbox" /* ... */ />
          <span className={option.colorClass}>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
```

### Why This Architecture? ✅

**Benefits**:

1. **Zero Client Bundle Impact**: Filter options don't add to JavaScript bundle
   - Options fetched on server, serialized as props
   - No API endpoint fetch code in client bundle

2. **Single Round-Trip**: All data fetched in one server-side render
   - Issues + Counts + Options fetched in parallel
   - No client-side loading states needed

3. **Perfect for Static Options**: Options change infrequently (admin edits)
   - Caching options for 1 hour makes sense
   - Server-side cache = no client-side cache complexity

4. **SEO-Friendly**: Filter options rendered in initial HTML
   - Search engines see full filter UI
   - Accessible without JavaScript

5. **Follows Next.js Best Practices**: "Server First" principle
   - Fetch data where it's consumed (close to database)
   - Only use Client Components for interactivity

**Trade-offs**:

- ❌ Options not available to other client components (mitigated by API endpoint)
- ❌ Options refetch on every navigation (mitigated by caching)
- ✅ But these are non-issues for this use case

---

## Alternative: Client Component Fetching (NOT RECOMMENDED)

### Option B: Fetch in FilterSidebar

```typescript
"use client";

export function FilterSidebar({ counts, searchParams }) {
  const [options, setOptions] = useState<FiltersDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/filters')
      .then(res => res.json())
      .then(data => setOptions(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading filters...</div>;
  if (!options) return <div>Failed to load filters</div>;

  return <div>{/* Use options */}</div>;
}
```

**Why NOT Recommended**:

1. ❌ **Extra Network Round-Trip**: Client waits for HTML, then fetches options
   - Server render → HTML sent → Client hydrates → Fetch options
   - 200-500ms extra latency

2. ❌ **Loading States Required**: UI flashes "Loading..." on every page load
   - Poor UX for static data

3. ❌ **Bundle Size Impact**: Fetch logic + loading states + error handling in bundle
   - ~2-3KB extra JavaScript

4. ❌ **Violates "Server First" Principle**: Fetching on client when server can do it

5. ❌ **More Code Complexity**: useState + useEffect + loading + error states

**When This Would Be Good**:

- ✅ If options needed by many client components (reuse across app)
- ✅ If options change frequently (real-time updates)
- ✅ If FilterSidebar used in client-only contexts (modals, drawers)

**But in our case**: None of these apply! Options only used in FilterSidebar, change rarely.

---

## Data Fetching Pattern: Prisma vs API

### Recommended: Direct Prisma in Server Component ✅

**Pattern**:

```typescript
// apps/web/lib/filters.ts (new helper file)

import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import type { FiltersDTO } from '@/types/filters';

export const getFilterOptions = unstable_cache(
  async (): Promise<FiltersDTO> => {
    const [statusOptions, priorityOptions, moduleOptions, labels] = await Promise.all([
      prisma.issueStatusOption.findMany({ orderBy: { order: 'asc' } }),
      prisma.issuePriorityOption.findMany({ orderBy: { order: 'asc' } }),
      prisma.issueModuleOption.findMany({ orderBy: { order: 'asc' } }),
      prisma.label.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, color: true },
      }),
    ]);

    return {
      status: statusOptions.map((o) => ({
        value: o.value,
        label: o.label,
        colorClass: o.colorClass || undefined,
      })),
      priority: priorityOptions.map((o) => ({
        value: o.value,
        label: o.label,
        dotColorClass: o.dotColorClass || undefined,
        badgeColorClass: o.badgeColorClass || undefined,
      })),
      modules: moduleOptions.map((o) => ({
        value: o.value,
        label: o.label,
      })),
      labels: labels.map((l) => ({
        id: l.id.toString(),
        name: l.name,
        color: l.color,
      })),
    };
  },
  ['filter-options'], // Cache key
  {
    revalidate: 3600, // 1 hour
    tags: ['filter-options'], // For on-demand revalidation
  }
);
```

**Usage in Server Component**:

```typescript
// apps/web/app/issues/page.tsx

import { getFilterOptions } from '@/lib/filters';

export default async function IssuesPage({ searchParams }) {
  const params = await searchParams;

  const [issuesData, filterCounts, filterOptions] = await Promise.all([
    getIssues(params),
    getFilterCounts(),
    getFilterOptions(), // ← Cached for 1 hour
  ]);

  return (
    <FilterSidebar
      counts={filterCounts}
      options={filterOptions}
      searchParams={params}
    />
  );
}
```

**Why Direct Prisma?** ✅

1. **No Network Overhead**: Direct database access (same process)
   - API fetch adds HTTP round-trip (even localhost)
   - Prisma is ~10-20ms, API fetch is ~50-100ms

2. **Built-in Caching**: `unstable_cache()` caches at edge/server
   - Works with Vercel Edge Network
   - Automatic cache invalidation with tags

3. **Type Safety**: Prisma returns typed objects
   - No need for runtime validation (Zod) on server
   - Only validate when data crosses network boundary

4. **Simpler Code**: One function call vs fetch + response handling

5. **Better Error Handling**: Prisma errors are descriptive
   - Can catch specific error types (P2002, P2025, etc.)

### Alternative: Fetch from API Endpoint (ALSO PROVIDE)

**Why Provide API Anyway?**

- ✅ Future client-side components can use it
- ✅ Other services can consume it
- ✅ Consistent API contract across app

**Implementation**:

```typescript
// apps/web/app/api/settings/filters/route.ts

import { NextResponse } from 'next/server';
import { getFilterOptions } from '@/lib/filters';

export const revalidate = 3600; // 1 hour ISR

export async function GET() {
  try {
    const data = await getFilterOptions();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Filters API error:', error);
    return NextResponse.json({ error: 'Failed to fetch filter options' }, { status: 500 });
  }
}
```

**Key Points**:

- ✅ API **reuses** same `getFilterOptions()` helper (DRY)
- ✅ API has **same caching** (1 hour revalidate)
- ✅ Server Component uses helper **directly** (no API call)
- ✅ Future client components can **fetch from API** if needed

---

## Caching Strategy

### Recommended Approach: `unstable_cache()` with Tags ✅

**Why This Cache Strategy?**

**Options Data Characteristics**:

- ⏱️ **Changes Rarely**: Admin edits only (weekly/monthly)
- 📊 **Small Size**: ~2KB JSON (10-20 options total)
- 🔄 **Read Heavy**: Every issues page load (100+ req/day)
- 🌍 **Global**: Same for all users (no user-specific data)

**Cache Configuration**:

```typescript
unstable_cache(
  async () => {
    /* ... */
  },
  ['filter-options'], // Cache key
  {
    revalidate: 3600, // 1 hour (3600 seconds)
    tags: ['filter-options'], // For on-demand revalidation
  }
);
```

**Revalidation Strategy**:

1. **Time-Based (1 Hour)**: Default, automatic
   - Cache expires every 3600 seconds
   - Next request refetches from database
   - Sufficient for options that change weekly

2. **On-Demand (Tag-Based)**: When admin edits options

   ```typescript
   // In admin panel (future)
   import { revalidateTag } from 'next/cache';

   async function updateStatusOptions(newOptions) {
     await prisma.issueStatusOption.updateMany(/* ... */);
     revalidateTag('filter-options'); // ← Instant cache invalidation
   }
   ```

**Benefits**:

- ✅ **Fast Reads**: Cached responses served in <5ms
- ✅ **Database Load**: Reduces DB queries by ~99%
- ✅ **Edge-Compatible**: Works with Vercel Edge Functions
- ✅ **Automatic**: No manual cache management needed

### Alternative Strategies (NOT RECOMMENDED)

**1. `force-cache` (Static)**:

```typescript
export const dynamic = 'force-static';
export const revalidate = false;
```

❌ **Problem**: Options never update (even after admin edits)
✅ **When Good**: If options truly never change

**2. `no-store` (Always Fresh)**:

```typescript
export const dynamic = 'force-dynamic';
```

❌ **Problem**: Database query on every page load (slow + high load)
✅ **When Good**: If options change every minute (real-time)

**3. React `cache()` (Request-Level)**:

```typescript
import { cache } from 'react';

export const getFilterOptions = cache(async () => {
  /* ... */
});
```

❌ **Problem**: Cache only lasts for single request (doesn't help across page loads)
✅ **When Good**: Preventing duplicate queries within same render

---

## Count Query Optimization

### Current Implementation (Already Optimal!) ✅

**From `issues/page.tsx`**:

```typescript
async function getFilterCounts() {
  const [statusCounts, priorityCounts, moduleCounts] = await Promise.all([
    prisma.issue.groupBy({ by: ['status'], _count: true }),
    prisma.issue.groupBy({ by: ['priority'], _count: true }),
    prisma.issue.groupBy({ by: ['module'], _count: true }),
  ]);

  return {
    status: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
    priority: Object.fromEntries(priorityCounts.map((p) => [p.priority, p._count])),
    module: Object.fromEntries(
      moduleCounts.filter((m) => m.module).map((m) => [m.module!, m._count])
    ),
  };
}
```

**Analysis**: ✅ ALREADY OPTIMAL

**Why This Is Good**:

1. ✅ **Parallel Execution**: `Promise.all()` runs all 3 queries concurrently
   - Total time = slowest query (~50ms)
   - Serial would be ~150ms (3x slower)

2. ✅ **Efficient Query**: `groupBy` with `_count` is PostgreSQL `GROUP BY`
   - Single table scan per query
   - No joins, no subqueries
   - PostgreSQL optimizes these well

3. ✅ **Minimal Data Transfer**: Only sends aggregated counts
   - Not fetching full issue records
   - Result size: ~100 bytes per query

**Performance Metrics** (estimated):

- Single `groupBy` query: ~30-50ms (depends on table size)
- Three in parallel: ~50-70ms (network overhead)
- **Total overhead**: <100ms (acceptable)

### Alternative: Single Query with CASE (Slightly Better)

**For Future Optimization** (only if counts become slow):

```typescript
async function getFilterCounts() {
  const result = await prisma.$queryRaw`
    SELECT
      json_build_object(
        'status', json_object_agg(status, status_count),
        'priority', json_object_agg(priority, priority_count),
        'module', json_object_agg(module, module_count)
      ) as counts
    FROM (
      SELECT
        status,
        COUNT(*) FILTER (WHERE true) as status_count,
        priority,
        COUNT(*) FILTER (WHERE true) as priority_count,
        module,
        COUNT(*) FILTER (WHERE true) as module_count
      FROM "Issue"
      GROUP BY status, priority, module
    ) subquery
  `;

  return result[0].counts;
}
```

**Trade-offs**:

- ✅ **Single Query**: One round-trip to database (~30ms)
- ✅ **Single Table Scan**: More efficient for large tables
- ❌ **Complex SQL**: Harder to read and maintain
- ❌ **Raw Query**: Loses Prisma type safety

**Recommendation**: Keep current implementation ✅

- **When to optimize**: If Issue table grows to >100K records and counts become slow
- **Current scale**: <10K issues = current approach is fine

---

## Count Caching Consideration

### Should We Cache Counts? 🤔

**Current Approach**: Counts computed per-request (no cache)

**Analysis**:

**Pros of Caching Counts**:

- ✅ Faster page loads (~50ms savings)
- ✅ Lower database load

**Cons of Caching Counts**:

- ❌ **Stale Data**: Counts out of sync with actual issues
  - User creates issue → Status count doesn't update for 1 hour
  - Confusing UX: "Open (5)" but only 4 issues visible
- ❌ **Cache Invalidation Complexity**: Need to revalidate on every issue mutation
  - Create, update (status/priority/module), delete all invalidate counts
  - More code, more bugs

**Recommendation**: **DON'T Cache Counts** ❌

**Why?**

1. **Counts Change Frequently**: Every issue create/update changes counts
2. **Users Expect Fresh Counts**: Counts are "live data", not configuration
3. **Performance Is Acceptable**: 50-70ms is fast enough
4. **Options vs Counts Different**: Options change rarely (cache OK), counts change often (cache problematic)

**Exception**: If counts become slow (>500ms), consider:

- Materialized views (PostgreSQL)
- Background refresh every 5 minutes
- Approximate counts for very large datasets

---

## URL State Management

### Current Implementation (Optimal) ✅

**From `FilterSidebar.tsx`**:

```typescript
"use client";

export function FilterSidebar({ counts, searchParams }: FilterSidebarProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  const updateFilter = (filterType: string, value: string, checked: boolean) => {
    const params = new URLSearchParams(currentSearchParams?.toString());

    const current = params.get(filterType)?.split(',').filter(Boolean) || [];

    let updated: string[];
    if (checked) {
      updated = [...current, value];
    } else {
      updated = current.filter((v) => v !== value);
    }

    if (updated.length > 0) {
      params.set(filterType, updated.join(','));
    } else {
      params.delete(filterType);
    }

    params.delete('page'); // Reset pagination

    router.push(`/issues?${params.toString()}`);
  };

  return (
    <input
      type="checkbox"
      onChange={(e) => updateFilter('status', 'open', e.target.checked)}
    />
  );
}
```

**Why This Is Optimal**: ✅

1. ✅ **Client Component Only**: URL mutation must be client-side
   - `useRouter()` and `useSearchParams()` are client hooks
   - Server Components can't update URL without full page reload

2. ✅ **CSV Format**: `?status=open,in_progress&priority=high`
   - Clean, readable URLs
   - Multiple values per filter (checkboxes)

3. ✅ **Preserves Other Params**: Doesn't lose `search`, `sort`, etc.
   - Uses `currentSearchParams.toString()` as base

4. ✅ **Resets Pagination**: Logical UX (filtered results start at page 1)

### Server Component Reads URL ✅

**From `issues/page.tsx`**:

```typescript
export default async function IssuesPage({ searchParams }) {
  const params = await searchParams; // ← Server Component reads

  const statusFilter = params.status?.split(',').filter(Boolean) || [];
  const priorityFilter = params.priority?.split(',').filter(Boolean) || [];

  const where: WhereClause = {};
  if (statusFilter.length > 0) {
    where.status = { in: statusFilter };
  }

  const issues = await prisma.issue.findMany({ where });

  return <FilterSidebar searchParams={params} />;
}
```

**Division of Labor**: Perfect! ✅

| Concern               | Component Type   | Why                                                          |
| --------------------- | ---------------- | ------------------------------------------------------------ |
| **Read URL**          | Server Component | Access `searchParams` prop, fetch filtered data              |
| **Write URL**         | Client Component | Use `useRouter().push()` for navigation                      |
| **Display Filter UI** | Client Component | Interactive checkboxes, click handlers                       |
| **Pass URL to Child** | Both             | Server passes as prop, Client reads with `useSearchParams()` |

**No Changes Needed**: Current implementation is optimal ✅

---

## Performance Optimization Tips

### 1. Parallel Data Fetching ✅ (Already Done)

**Current**:

```typescript
const [issuesData, filterCounts, filterOptions] = await Promise.all([
  getIssues(params),
  getFilterCounts(),
  getFilterOptions(),
]);
```

**Impact**: ~150ms → ~70ms (3x faster)

### 2. Selective Field Selection ✅ (Already Done)

**Current** (in `getFilterOptions`):

```typescript
await prisma.label.findMany({
  select: { id: true, name: true, color: true }, // Only needed fields
});
```

**Impact**: Reduces data transfer by ~50%

### 3. Connection Pooling (Check Prisma Config)

**Ensure** `prisma/schema.prisma` has:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 10  // ← Adjust based on server capacity
}
```

**Impact**: Prevents connection exhaustion under load

### 4. Database Indexes (Check After Seed)

**After creating option tables, verify indexes**:

```sql
-- Auto-created by @unique constraint
CREATE UNIQUE INDEX "IssueStatusOption_value_key" ON "IssueStatusOption"("value");

-- Manual index for order sorting (if not auto-created)
CREATE INDEX "IssueStatusOption_order_idx" ON "IssueStatusOption"("order");
```

**Impact**: Faster `orderBy: { order: 'asc' }` queries

### 5. Response Size (Already Optimal)

**Filter options payload**:

- Status: 3 options × ~80 bytes = ~240 bytes
- Priority: 4 options × ~120 bytes = ~480 bytes
- Modules: 4 options × ~50 bytes = ~200 bytes
- **Total**: ~1KB (tiny)

**No optimization needed**: 1KB is negligible for page load

---

## Implementation Checklist

### Phase 1: Database Layer ✅

- [ ] Create Prisma models (IssueStatusOption, IssuePriorityOption, IssueModuleOption)
- [ ] Generate migration: `pnpm prisma migrate dev --name phase4_dynamic_filter_options`
- [ ] Create seed data with exact color classes from current UI
- [ ] Verify seed matches current hardcoded values exactly
- [ ] Run seed: `pnpm prisma db seed`
- [ ] Verify indexes created (especially on `order` field)

### Phase 2: Types Layer ✅

- [ ] Create `apps/web/types/filters.ts`
- [ ] Define `StatusOption`, `PriorityOption`, `ModuleOption` interfaces
- [ ] Define `FiltersDTO` interface (matches API response)
- [ ] Create Zod schemas for API validation (only needed for API endpoint)

### Phase 3: Data Fetching Layer ✅

- [ ] Create `apps/web/lib/filters.ts` helper file
- [ ] Implement `getFilterOptions()` with `unstable_cache()`
- [ ] Configure cache: `revalidate: 3600`, `tags: ['filter-options']`
- [ ] Test cache works: call twice, second should be <5ms

### Phase 4: API Layer ✅ (Optional but Recommended)

- [ ] Create `apps/web/app/api/settings/filters/route.ts`
- [ ] Implement GET handler that **reuses** `getFilterOptions()` helper
- [ ] Add `export const revalidate = 3600` for ISR
- [ ] Handle errors: return `{ error }` with 500 status
- [ ] Test API: `curl http://localhost:3000/api/settings/filters`

### Phase 5: UI Layer ✅

- [ ] Update `FilterSidebar.tsx` props: add `options: FiltersDTO`
- [ ] Replace `STATUS_OPTIONS` with `options.status.map(...)`
- [ ] Replace `PRIORITY_OPTIONS` with `options.priority.map(...)`
- [ ] Replace `MODULE_OPTIONS` with `options.modules.map(...)`
- [ ] Bind color classes from options (not hardcoded)
- [ ] Update `issues/page.tsx` to call `getFilterOptions()`
- [ ] Pass `options` prop to FilterSidebar

### Phase 6: Testing Layer ✅

- [ ] **Unit Test**: `lib/__tests__/filters.test.ts`
  - Test `getFilterOptions()` returns correct shape
  - Test options sorted by `order` field
  - Test cache works (mock Prisma, verify single call)

- [ ] **API Test**: `app/api/settings/filters/__tests__/route.test.ts`
  - Test 200 response with correct data
  - Test 500 response on Prisma error (mock)
  - Test response matches `FiltersDTO` type

- [ ] **Component Test**: `components/issues/__tests__/FilterSidebar.test.tsx`
  - Test renders dynamic options (not hardcoded)
  - Test color classes applied from options
  - Test checkboxes update URL params
  - Test "Clear All" works

- [ ] **E2E Test**: `apps/web/e2e/issues-filters.spec.ts`
  - Test filters work end-to-end
  - Test counts update correctly
  - Test URL reflects selected filters

### Phase 7: Documentation ✅

- [ ] Update `docs/02-DATABASE-SCHEMA.md` with new models
- [ ] Update `.agent/system/api-catalog.md` with `/api/settings/filters`
- [ ] Update `STATUS.md` with Phase 4 completion
- [ ] Update `DEVELOPMENT_PLAN.md` with Phase 4 status
- [ ] Create `docs/COMPLETION_phase4_dynamic_filters.md`

---

## Code Examples

### 1. Helper Function (`lib/filters.ts`)

```typescript
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import type { FiltersDTO } from '@/types/filters';

/**
 * Fetches filter options from database
 * Cached for 1 hour, can be revalidated with tag 'filter-options'
 */
export const getFilterOptions = unstable_cache(
  async (): Promise<FiltersDTO> => {
    const [statusOptions, priorityOptions, moduleOptions, labels] = await Promise.all([
      prisma.issueStatusOption.findMany({
        orderBy: { order: 'asc' },
        select: { value: true, label: true, colorClass: true },
      }),
      prisma.issuePriorityOption.findMany({
        orderBy: { order: 'asc' },
        select: { value: true, label: true, dotColorClass: true, badgeColorClass: true },
      }),
      prisma.issueModuleOption.findMany({
        orderBy: { order: 'asc' },
        select: { value: true, label: true },
      }),
      prisma.label.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, color: true },
      }),
    ]);

    return {
      status: statusOptions.map((o) => ({
        value: o.value,
        label: o.label,
        colorClass: o.colorClass || undefined,
      })),
      priority: priorityOptions.map((o) => ({
        value: o.value,
        label: o.label,
        dotColorClass: o.dotColorClass || undefined,
        badgeColorClass: o.badgeColorClass || undefined,
      })),
      modules: moduleOptions.map((o) => ({
        value: o.value,
        label: o.label,
      })),
      labels: labels.map((l) => ({
        id: l.id.toString(),
        name: l.name,
        color: l.color,
      })),
    };
  },
  ['filter-options'],
  {
    revalidate: 3600, // 1 hour
    tags: ['filter-options'],
  }
);
```

### 2. Updated Issues Page

```typescript
// apps/web/app/issues/page.tsx

import { getFilterOptions } from '@/lib/filters';

export default async function IssuesPage({ searchParams }) {
  const params = await searchParams;

  // Fetch in parallel: issues, counts, options
  const [issuesData, filterCounts, filterOptions] = await Promise.all([
    getIssues(params),
    getFilterCounts(),
    getFilterOptions(), // ← NEW
  ]);

  return (
    <main>
      <FilterSidebar
        counts={filterCounts}
        options={filterOptions} // ← NEW PROP
        searchParams={params}
      />
      {/* ... rest of page ... */}
    </main>
  );
}
```

### 3. Updated FilterSidebar

```typescript
// apps/web/components/issues/FilterSidebar.tsx
"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import type { FiltersDTO } from '@/types/filters';

interface FilterSidebarProps {
  counts: FilterCounts;
  options: FiltersDTO; // ← NEW
  searchParams: Record<string, string | undefined>;
}

export function FilterSidebar({ counts, options, searchParams }: FilterSidebarProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  // ... (updateFilter, clearAllFilters unchanged) ...

  return (
    <div className="neu-raised rounded-3xl p-6">
      {/* Status Filter */}
      <div className="mb-6">
        <h4 className="mb-3 font-semibold text-white">Status</h4>
        <div className="space-y-3">
          {options.status.map((option) => {
            const count = counts.status[option.value] || 0;
            const isChecked = currentStatus.includes(option.value);

            return (
              <label key={option.value} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => updateFilter('status', option.value, e.target.checked)}
                />
                <span className="flex-1">{option.label}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    count > 0 && isChecked
                      ? `${option.colorClass || 'bg-gray-500'} text-white`
                      : 'neu-pressed text-slate'
                  }`}
                >
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Priority Filter */}
      <div className="mb-6">
        <h4 className="mb-3 font-semibold text-white">Priority</h4>
        <div className="space-y-3">
          {options.priority.map((option) => {
            const count = counts.priority[option.value] || 0;
            const isChecked = currentPriority.includes(option.value);

            return (
              <label key={option.value} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => updateFilter('priority', option.value, e.target.checked)}
                />
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${option.dotColorClass || 'bg-gray-400'}`} />
                  {option.label}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    count > 0 && isChecked
                      ? `${option.badgeColorClass || 'bg-gray-500'} text-white`
                      : 'neu-pressed text-slate'
                  }`}
                >
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Module Filter */}
      <div>
        <h4 className="mb-3 font-semibold text-white">Module</h4>
        <div className="space-y-3">
          {options.modules.map((option) => {
            const count = counts.module[option.value] || 0;
            const isChecked = currentModule.includes(option.value);

            return (
              <label key={option.value} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => updateFilter('module', option.value, e.target.checked)}
                />
                <span className="flex-1">{option.label}</span>
                <span className="neu-pressed rounded-full px-2.5 py-1 text-xs font-semibold text-slate">
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

### 4. API Endpoint (Optional)

```typescript
// apps/web/app/api/settings/filters/route.ts

import { NextResponse } from 'next/server';
import { getFilterOptions } from '@/lib/filters';

export const revalidate = 3600; // 1 hour ISR

/**
 * GET /api/settings/filters
 * Returns filter options for issues list
 */
export async function GET() {
  try {
    const data = await getFilterOptions();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Filters API error:', error);
    return NextResponse.json({ error: 'Failed to fetch filter options' }, { status: 500 });
  }
}
```

### 5. Type Definitions

```typescript
// apps/web/types/filters.ts

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

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Browser                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  FilterSidebar (Client Component)                         │  │
│  │  - Receives options via props                             │  │
│  │  - Manages URL state (useRouter, useSearchParams)         │  │
│  │  - Renders checkboxes with dynamic options                │  │
│  │  - Updates URL on user interaction                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ▲                                      │
│                           │ Props: { options, counts }           │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            │ Server-rendered HTML
                            │
┌───────────────────────────┼──────────────────────────────────────┐
│                     Next.js Server                               │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │  issues/page.tsx (Server Component)                       │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  await Promise.all([                                │  │  │
│  │  │    getIssues(params),        ← Prisma query         │  │  │
│  │  │    getFilterCounts(),        ← Prisma groupBy       │  │  │
│  │  │    getFilterOptions()        ← Prisma + Cache       │  │  │
│  │  │  ])                                                  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           │ Direct function call                 │
│                           ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  lib/filters.ts                                           │  │
│  │  getFilterOptions() with unstable_cache()                 │  │
│  │  - Cache key: 'filter-options'                            │  │
│  │  - Revalidate: 3600s (1 hour)                             │  │
│  │  - Tags: ['filter-options']                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           │ Cache miss → Query                   │
│                           ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Prisma Client                                            │  │
│  │  - issueStatusOption.findMany()                           │  │
│  │  - issuePriorityOption.findMany()                         │  │
│  │  - issueModuleOption.findMany()                           │  │
│  │  - label.findMany()                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            │ SQL queries
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  IssueStatusOption (3 rows)                               │  │
│  │  IssuePriorityOption (4 rows)                             │  │
│  │  IssueModuleOption (4 rows)                               │  │
│  │  Label (N rows)                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

OPTIONAL API ENDPOINT (for future client-side use):
┌─────────────────────────────────────────────────────────────────┐
│  GET /api/settings/filters                                       │
│  - Reuses getFilterOptions() helper                              │
│  - Same caching (1 hour ISR)                                     │
│  - Returns { data: FiltersDTO }                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Decisions Summary

### 1. **Server Component Data Fetching** ✅ CHOSEN

**Decision**: Fetch filter options in `issues/page.tsx` (Server Component) and pass as props

**Why**:

- Zero client bundle impact (options serialized as props)
- Single round-trip (parallel fetch with issues + counts)
- Perfect for static options (change rarely)
- SEO-friendly (options in initial HTML)
- Follows Next.js "Server First" principle

**Trade-off**: Options not available to other client components (mitigated by optional API)

---

### 2. **Direct Prisma Queries** ✅ CHOSEN

**Decision**: Use direct Prisma queries in Server Component, not API fetch

**Why**:

- No network overhead (same process)
- Built-in caching with `unstable_cache()`
- Type safety from Prisma
- Simpler code (one function call)
- Better error handling

**Trade-off**: Need separate API endpoint for future client-side use (easy to add)

---

### 3. **1-Hour Cache with Tag Revalidation** ✅ CHOSEN

**Decision**: Cache options for 3600 seconds, allow on-demand revalidation via tags

**Why**:

- Options change rarely (admin edits only)
- Fast reads (<5ms from cache)
- Reduces DB load by ~99%
- Tag revalidation allows instant updates when needed

**Trade-off**: Slight staleness (max 1 hour) acceptable for configuration data

---

### 4. **Don't Cache Counts** ✅ CHOSEN

**Decision**: Compute filter counts per-request, no caching

**Why**:

- Counts change frequently (every issue create/update)
- Users expect fresh counts (live data)
- Performance acceptable (50-70ms)
- Cache invalidation would be complex

**Trade-off**: ~50ms overhead per page load (acceptable)

---

### 5. **Client Component for URL State** ✅ KEEP AS-IS

**Decision**: Keep FilterSidebar as Client Component with `useRouter()` + `useSearchParams()`

**Why**:

- URL mutation requires client-side hooks
- Interactive checkboxes need event handlers
- Clean separation: Server reads URL, Client writes URL

**Trade-off**: None (this is the only correct approach)

---

### 6. **Provide Optional API Endpoint** ✅ RECOMMENDED

**Decision**: Create `/api/settings/filters` that reuses `getFilterOptions()` helper

**Why**:

- Future-proof (other client components can use it)
- Consistent API contract
- No duplication (reuses helper)
- Minimal cost (ISR cached)

**Trade-off**: Extra code to maintain (but minimal)

---

## Next Steps for Parent Agent

1. **Create Database Models** (Prisma)
   - Add IssueStatusOption, IssuePriorityOption, IssueModuleOption models
   - Ensure `order` field for sorting
   - Match color classes to current hardcoded values exactly

2. **Create Helper Function** (`lib/filters.ts`)
   - Implement `getFilterOptions()` with `unstable_cache()`
   - Configure 1-hour revalidation with tags

3. **Create Types** (`types/filters.ts`)
   - Define StatusOption, PriorityOption, ModuleOption interfaces
   - Define FiltersDTO interface

4. **Update Issues Page** (`app/issues/page.tsx`)
   - Call `getFilterOptions()` in parallel with existing queries
   - Pass `options` prop to FilterSidebar

5. **Update FilterSidebar** (`components/issues/FilterSidebar.tsx`)
   - Add `options: FiltersDTO` to props
   - Replace hardcoded arrays with `options.status.map(...)` etc.
   - Bind color classes from options

6. **Create API Endpoint** (optional but recommended)
   - Create `app/api/settings/filters/route.ts`
   - Reuse `getFilterOptions()` helper
   - Add ISR caching

7. **Write Tests**
   - Unit test for `getFilterOptions()`
   - API test for `/api/settings/filters`
   - Component test for FilterSidebar with dynamic options
   - E2E test for filter functionality

8. **Update Documentation**
   - Database schema docs
   - API catalog
   - STATUS.md and DEVELOPMENT_PLAN.md

---

## Success Criteria

**Functional**:

- ✅ FilterSidebar renders options from database (not hardcoded)
- ✅ Color classes applied correctly (matches current UI exactly)
- ✅ Filter counts work correctly (unchanged behavior)
- ✅ URL state management works (unchanged behavior)
- ✅ Options cached for 1 hour (fast subsequent loads)

**Performance**:

- ✅ Initial page load time unchanged (<100ms overhead)
- ✅ Cached options served in <5ms
- ✅ No client bundle size increase

**Code Quality**:

- ✅ Strict TypeScript (no `any` types)
- ✅ Test coverage ≥80%
- ✅ Follows project conventions (API patterns, naming, etc.)

**Documentation**:

- ✅ Database schema updated
- ✅ API catalog updated
- ✅ Completion doc created

---

**Report Complete**: 2025-10-29 17:17

**Key Recommendation**: Fetch options in Server Component with direct Prisma queries, cache for 1 hour, pass as props to Client Component. Don't cache counts (compute per-request).
