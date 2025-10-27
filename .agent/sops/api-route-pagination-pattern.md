# SOP: API Route Pagination Pattern

## Purpose

Standard procedure for implementing consistent pagination in Next.js API routes. This pattern provides clients with complete pagination metadata (page, limit, total, totalPages, hasMore) and follows best practices for efficient database queries using Prisma.

## When to Use

**Use this pattern for:**

- List endpoints with potentially large result sets
- Search results that need pagination
- Filtered data listings (with search/filter params)
- Any endpoint that returns arrays of items

**Examples from codebase:**

- GET /api/knowledge - Article listing with search and tags
- GET /api/security/vulnerabilities - Filtered vulnerability list
- GET /api/issues - Issue listing (if created)

**Don't use when:**

- Single item endpoints (GET /api/issues/:id)
- Small datasets (<50 items total)
- Real-time streaming data
- Infinite scroll with cursor-based pagination (use cursor pattern instead)

## Prerequisites

- Next.js 14+ App Router
- Prisma ORM configured
- TypeScript for type safety
- Understanding of SQL OFFSET/LIMIT concepts

## Procedure

### Step 1: Define Query Parameters

Accept pagination and filter parameters from query string.

**Example from apps/web/app/api/knowledge/route.ts:**

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Pagination params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  // Filter params (specific to your endpoint)
  const search = searchParams.get('search') || '';
  const tag = searchParams.get('tag') || '';
  const sort = searchParams.get('sort') || 'newest';

  // ... rest of implementation
}
```

**Query Parameters Explained:**

- `page`: Current page number (default: 1)
- `limit`: Items per page (default: 20, max: 50)
- `search`, `tag`, `sort`: Domain-specific filters

**Best Practices:**

- Always parse query params with fallback defaults
- Enforce maximum limit (prevent abuse, e.g., max 50)
- Use `parseInt` with radix 10 for numbers
- Validate page and limit are positive integers
- Provide sensible defaults (page 1, limit 20)

**Gotcha**: Don't trust client input! Always validate and cap the limit.

### Step 2: Build Prisma Where Clause

Construct dynamic where clause based on filter parameters.

**Example from apps/web/app/api/knowledge/route.ts:**

```typescript
// Build where clause
const where: any = {};

if (search) {
  where.OR = [
    { title: { contains: search, mode: 'insensitive' as const } },
    { content: { contains: search, mode: 'insensitive' as const } },
  ];
}

if (tag) {
  where.tags = { has: tag }; // Array filtering
}
```

**Prisma Where Patterns:**

- **Text search**: `{ field: { contains: query, mode: 'insensitive' } }`
- **Array contains**: `{ arrayField: { has: value } }`
- **Multiple conditions (OR)**: `{ OR: [{ ... }, { ... }] }`
- **Multiple conditions (AND)**: `{ field1: ..., field2: ... }` (implicit AND)
- **Enum filtering**: `{ status: 'OPEN' }`

**Best Practices:**

- Use `mode: 'insensitive'` for case-insensitive search
- Type where clause as `any` (Prisma types are complex)
- Build where object conditionally (only add filters if provided)
- Use `OR` for search across multiple fields

**Gotcha**: `mode: 'insensitive'` only works with PostgreSQL/MySQL. For SQLite, use lowercase conversion.

### Step 3: Calculate Skip and Take

Compute OFFSET and LIMIT for Prisma query.

**Example from apps/web/app/api/knowledge/route.ts:**

```typescript
// Calculate pagination
const skip = (page - 1) * limit;

// Example:
// Page 1, limit 20: skip = 0, take = 20 (items 1-20)
// Page 2, limit 20: skip = 20, take = 20 (items 21-40)
// Page 3, limit 20: skip = 40, take = 20 (items 41-60)
```

**Formula:**

```
skip = (page - 1) × limit
take = limit
```

**Best Practices:**

- Always calculate skip (don't hardcode)
- Validate page is >= 1 before calculation
- Store limit in variable (reused in response)

### Step 4: Execute Parallel Queries

Use `Promise.all` to fetch data and count in parallel.

**Example from apps/web/app/api/knowledge/route.ts:**

```typescript
// Execute query with count for pagination
const [articles, total] = await Promise.all([
  // Query for data
  prisma.knowledgeItem.findMany({
    where,
    orderBy: sort === 'newest' ? { createdAt: 'desc' } : { updatedAt: 'desc' },
    skip,
    take: limit,
    select: {
      id: true,
      title: true,
      content: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  // Query for total count
  prisma.knowledgeItem.count({ where }),
]);
```

**Why Promise.all?**

- Runs both queries concurrently (not sequentially)
- Saves ~50-100ms per request
- Uses same where clause (consistent results)

**Best Practices:**

- Always include orderBy for consistent results
- Use select to limit fields (performance)
- Share where clause between findMany and count
- Use Promise.all for parallel execution

**Gotcha**: Don't forget to pass `where` to both queries, or count will be total records (not filtered)!

### Step 5: Transform Response Data

Apply any necessary transformations to the data.

**Example from apps/web/app/api/knowledge/route.ts:**

```typescript
// Generate excerpts (first 150 characters)
const articlesWithExcerpts = articles.map((article) => ({
  ...article,
  excerpt: article.content.slice(0, 150) + (article.content.length > 150 ? '...' : ''),
}));
```

**Common Transformations:**

- Generate excerpts from long text
- Format dates to ISO strings (already done by Prisma)
- Add computed fields (e.g., `isActive`, `daysAgo`)
- Remove sensitive fields (e.g., internal IDs, private data)
- Flatten nested relations

**Best Practices:**

- Keep transformations lightweight (don't do heavy computation)
- Use map for array transformations
- Spread operator for adding fields
- Consider doing transformations in Prisma select if possible

### Step 6: Calculate Pagination Metadata

Compute metadata for client-side pagination UI.

**Example from apps/web/app/api/knowledge/route.ts:**

```typescript
// Calculate pagination metadata
const totalPages = Math.ceil(total / limit);
const hasMore = page < totalPages;
```

**Metadata Fields:**

- `page`: Current page number (from query)
- `limit`: Items per page (from query)
- `total`: Total number of items matching filters
- `totalPages`: Total number of pages (calculated)
- `hasMore`: Boolean indicating if more pages exist (calculated)

**Formulas:**

```
totalPages = Math.ceil(total / limit)
hasMore = page < totalPages
```

**Best Practices:**

- Always use Math.ceil (rounds up for partial pages)
- Include all 5 metadata fields consistently
- Calculate hasMore for infinite scroll UI
- Include current page/limit for verification

**Gotcha**: `totalPages` can be 0 if `total` is 0. Handle this in client UI.

### Step 7: Return Standardized Response

Return JSON response with consistent structure.

**Example from apps/web/app/api/knowledge/route.ts:**

```typescript
return NextResponse.json({
  success: true,
  data: {
    articles: articlesWithExcerpts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore,
    },
  },
});
```

**Response Structure:**

```typescript
{
  success: true,
  data: {
    [resourceName]: T[],        // Array of items
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number,
      hasMore: boolean,
    }
  }
}
```

**Best Practices:**

- Always include `success: true` (consistent with error responses)
- Nest items under descriptive key (`articles`, `issues`, `findings`)
- Group all pagination metadata under `pagination` key
- Use plural resource names (`articles`, not `article`)

**Gotcha**: Don't forget to wrap in `data` object (consistent with error responses that have `error` object).

### Step 8: Add Error Handling

Wrap everything in try-catch for consistent error responses.

**Example from apps/web/app/api/knowledge/route.ts:**

```typescript
export async function GET(request: NextRequest) {
  try {
    // ... all implementation from steps 1-7

    return NextResponse.json({
      success: true,
      data: {
        /* ... */
      },
    });
  } catch (error) {
    console.error('Failed to fetch knowledge articles:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch knowledge articles',
      },
      { status: 500 }
    );
  }
}
```

**Best Practices:**

- Wrap entire route handler in try-catch
- Log errors to console (server logs)
- Return user-friendly error messages (don't leak details)
- Use 500 status code for unexpected errors
- Include `success: false` in error responses

## Verification

After implementation, verify:

- [ ] Page 1 returns first N items
- [ ] Page 2 returns next N items (no overlap)
- [ ] Last page returns remaining items (may be < limit)
- [ ] Empty page (beyond last) returns empty array
- [ ] totalPages calculated correctly
- [ ] hasMore is true when more pages exist
- [ ] hasMore is false on last page
- [ ] Filter parameters work correctly
- [ ] Sort parameters work correctly
- [ ] Max limit enforced (can't request 1000 items)
- [ ] Negative page numbers handled gracefully
- [ ] TypeScript compiles with no errors

## Common Pitfalls

### Issue: Page/Limit Not Parsed as Numbers

**Symptom**: Pagination doesn't work, NaN errors
**Cause**: Query params are strings, not parsed to integers

```typescript
// ❌ WRONG
const page = searchParams.get('page') || 1; // '1' (string!)
const limit = searchParams.get('limit') || 20; // '20' (string!)

// ✅ CORRECT
const page = parseInt(searchParams.get('page') || '1', 10);
const limit = parseInt(searchParams.get('limit') || '20', 10);
```

### Issue: No Maximum Limit

**Symptom**: Client can request 10,000 items, crashes database
**Cause**: No cap on limit parameter

```typescript
// ❌ WRONG
const limit = parseInt(searchParams.get('limit') || '20', 10);

// ✅ CORRECT
const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
```

### Issue: Sequential Queries (Slow)

**Symptom**: API takes 200ms+ to respond
**Cause**: Running queries sequentially instead of parallel

```typescript
// ❌ WRONG - Sequential (slow)
const articles = await prisma.knowledgeItem.findMany({
  /* ... */
});
const total = await prisma.knowledgeItem.count({
  /* ... */
});
// Takes: queryTime1 + queryTime2

// ✅ CORRECT - Parallel (fast)
const [articles, total] = await Promise.all([
  prisma.knowledgeItem.findMany({
    /* ... */
  }),
  prisma.knowledgeItem.count({
    /* ... */
  }),
]);
// Takes: Math.max(queryTime1, queryTime2)
```

### Issue: Inconsistent Where Clause

**Symptom**: Count doesn't match filtered results
**Cause**: Different where clause for findMany and count

```typescript
// ❌ WRONG - Different filters
const articles = await prisma.item.findMany({
  where: { status: 'OPEN' },
  skip,
  take: limit,
});
const total = await prisma.item.count(); // No filter!

// ✅ CORRECT - Same filter
const where = { status: 'OPEN' };
const [articles, total] = await Promise.all([
  prisma.item.findMany({ where, skip, take: limit }),
  prisma.item.count({ where }),
]);
```

### Issue: Missing orderBy

**Symptom**: Results in different order each request
**Cause**: No orderBy specified (database returns arbitrary order)

```typescript
// ❌ WRONG - No consistent order
const articles = await prisma.item.findMany({ where, skip, take: limit });

// ✅ CORRECT - Explicit ordering
const articles = await prisma.item.findMany({
  where,
  orderBy: { createdAt: 'desc' },
  skip,
  take: limit,
});
```

### Issue: Wrong Skip Calculation

**Symptom**: Duplicate items across pages or missing items
**Cause**: Incorrect skip formula

```typescript
// ❌ WRONG - Skip calculation errors
const skip = page * limit; // Off by one page!

// ✅ CORRECT
const skip = (page - 1) * limit;
```

## Testing Strategy

### Unit Testing Pagination Logic

```typescript
describe('GET /api/knowledge', () => {
  it('returns first page with default limit', async () => {
    const response = await GET(new NextRequest('http://localhost/api/knowledge'));
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.pagination.page).toBe(1);
    expect(data.data.pagination.limit).toBe(20);
    expect(data.data.articles.length).toBeLessThanOrEqual(20);
  });

  it('returns second page with correct offset', async () => {
    const response = await GET(new NextRequest('http://localhost/api/knowledge?page=2&limit=10'));
    const data = await response.json();

    expect(data.data.pagination.page).toBe(2);
    expect(data.data.pagination.limit).toBe(10);
    // Verify skip worked correctly (check IDs don't overlap with page 1)
  });

  it('enforces maximum limit', async () => {
    const response = await GET(new NextRequest('http://localhost/api/knowledge?limit=1000'));
    const data = await response.json();

    expect(data.data.pagination.limit).toBe(50); // Capped at 50
    expect(data.data.articles.length).toBeLessThanOrEqual(50);
  });

  it('calculates hasMore correctly', async () => {
    // Create 25 items, request limit 10
    const response1 = await GET(new NextRequest('http://localhost/api/knowledge?limit=10'));
    const data1 = await response1.json();

    expect(data1.data.pagination.hasMore).toBe(true); // Page 1 of 3

    const response3 = await GET(new NextRequest('http://localhost/api/knowledge?page=3&limit=10'));
    const data3 = await response3.json();

    expect(data3.data.pagination.hasMore).toBe(false); // Last page
  });

  it('handles search with pagination', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/knowledge?search=test&page=1&limit=5')
    );
    const data = await response.json();

    expect(
      data.data.articles.every((a) => a.title.includes('test') || a.content.includes('test'))
    ).toBe(true);
    expect(data.data.articles.length).toBeLessThanOrEqual(5);
    expect(data.data.pagination.total).toBeLessThanOrEqual(/* total items in db */);
  });
});
```

### E2E Testing

```typescript
import { test, expect } from '@playwright/test';

test.describe('Knowledge API Pagination', () => {
  test('navigates through pages', async ({ request }) => {
    // Fetch page 1
    const page1 = await request.get('/api/knowledge?page=1&limit=5');
    const data1 = await page1.json();

    expect(data1.data.pagination.page).toBe(1);
    const firstPageIds = data1.data.articles.map((a) => a.id);

    // Fetch page 2
    const page2 = await request.get('/api/knowledge?page=2&limit=5');
    const data2 = await page2.json();

    expect(data2.data.pagination.page).toBe(2);
    const secondPageIds = data2.data.articles.map((a) => a.id);

    // Verify no overlap
    const overlap = firstPageIds.filter((id) => secondPageIds.includes(id));
    expect(overlap).toHaveLength(0);
  });
});
```

## Performance Considerations

### Database Indexes

**Create indexes for:**

- Sort columns (createdAt, updatedAt)
- Filter columns (status, tags)
- Search columns (title, content) - use full-text search

**Example Prisma schema:**

```prisma
model KnowledgeItem {
  id        Int      @id @default(autoincrement())
  title     String
  content   String   @db.Text
  createdAt DateTime @default(now())

  @@index([createdAt]) // For sorting
  @@index([tags]) // For filtering
}
```

### Query Performance

- **Use select** to limit fields (don't fetch all columns)
- **Avoid N+1 queries** (use include for relations)
- **Cache total count** if it changes infrequently
- **Consider cursor pagination** for large datasets (>10K items)

### When to Use Cursor Pagination Instead

**Switch to cursor pagination when:**

- Dataset has >10,000 items
- Real-time data (items added/removed frequently)
- Infinite scroll UI (no page numbers)
- Deep pagination is common (page 100+)

**Offset pagination (this SOP) is fine for:**

- <10K items
- Relatively stable data
- Page-based UI (1, 2, 3, ... 10)
- Shallow pagination (pages 1-20)

## Related Documentation

- [Prisma Pagination Docs](https://www.prisma.io/docs/concepts/components/prisma-client/pagination)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md](../../COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md) - Implementation details
- [.agent/system/api-catalog.md](../system/api-catalog.md) - All API endpoints

## Examples from Codebase

- **[apps/web/app/api/knowledge/route.ts](../../apps/web/app/api/knowledge/route.ts)** - Full pagination implementation
  - Lines 16-94: Complete GET handler with pagination

- **[apps/web/app/api/security/vulnerabilities/route.ts](../../apps/web/app/api/security/vulnerabilities/route.ts)** - Another example
  - Lines 15-95: Pagination with filtering

## Notes

- **Consistency is key** - All paginated endpoints should return the same metadata structure
- **Client-side pagination UI** - Use pagination metadata to build prev/next buttons, page numbers, "Load more"
- **Infinite scroll** - Use `hasMore` to determine when to stop loading
- **Empty results** - Return empty array with pagination metadata (total: 0, hasMore: false)

---

**Last Updated**: 2025-10-28
**Created From**: Knowledge and Security API implementations (Phase 3 Days 5-6)
**Pattern Origin**: Prisma Expert recommendation for efficient pagination
