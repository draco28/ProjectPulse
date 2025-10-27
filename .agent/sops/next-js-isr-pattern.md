# SOP: Next.js ISR (Incremental Static Regeneration) Pattern

## Purpose

Standard procedure for implementing Incremental Static Regeneration (ISR) in Next.js 14+ App Router. This pattern combines the speed of Static Site Generation (SSG) with the freshness of Server-Side Rendering (SSR), providing fast page loads while keeping content reasonably up-to-date.

## When to Use

**Use ISR for content that:**

- Changes infrequently (hours/days, not seconds)
- Is public (not user-specific)
- Benefits from fast initial load (CDN cached)
- Can tolerate slight staleness (seconds to hours)
- Has predictable patterns (e.g., documentation, blog posts)

**Examples from codebase:**

- Wiki pages: Documentation changes infrequently, cached for 1 hour
- Blog posts: Content stable after publish, revalidate every 30 minutes
- Product pages: Inventory updates hourly, not real-time

**Don't use when:**

- Real-time data required (stock prices, live scores)
- User-specific content (dashboards, profiles)
- Frequently updated content (<1 minute changes)
- Content changes affect many pages simultaneously

## Prerequisites

- Next.js 14+ with App Router
- Understanding of SSG vs SSR vs ISR tradeoffs
- Prisma ORM configured
- TypeScript for type safety

## Procedure

### Step 1: Add revalidate Export

Add `revalidate` export to your page component to enable ISR.

**Example from apps/web/app/wiki/[slug]/page.tsx:**

```typescript
// ISR: Revalidate every hour (3600 seconds)
export const revalidate = 3600;
```

**Revalidate Values:**

- `false` or `0`: No revalidation (pure SSG)
- `60`: Revalidate every minute
- `3600`: Revalidate every hour (1 hour)
- `86400`: Revalidate every day (24 hours)
- `Infinity`: Never revalidate after build

**Best Practices:**

- Choose revalidate time based on content update frequency
- Longer revalidate = better performance, less fresh
- Shorter revalidate = more fresh, higher server load
- Document why you chose specific interval

**Common Intervals:**

- **News articles**: 300-600 seconds (5-10 minutes)
- **Documentation**: 3600 seconds (1 hour)
- **Blog posts**: 1800-3600 seconds (30 minutes - 1 hour)
- **Product catalogs**: 900-1800 seconds (15-30 minutes)
- **Legal/terms pages**: 86400 seconds (1 day)

**Gotcha**: `revalidate` is in **seconds**, not milliseconds!

### Step 2: Implement generateStaticParams

Specify which dynamic routes to pre-render at build time.

**Example from apps/web/app/wiki/[slug]/page.tsx:**

```typescript
export async function generateStaticParams() {
  const pages = await prisma.wikiPage.findMany({
    select: { path: true },
    take: 50, // Limit for build time
  });

  return pages.map((page) => ({
    slug: page.path.replace(/^\//, ''), // Remove leading slash
  }));
}
```

**Purpose:**

- Pre-renders popular/important pages at build time
- Other pages render on-demand (first request)
- Improves first load for common pages

**Best Practices:**

- Limit to most popular pages (top 20-100)
- Order by popularity/views if data available
- Don't pre-render all pages (slow builds)
- Consider time limit (build timeout)

**Dynamic Route Mapping:**

```typescript
// URL: /wiki/getting-started
// File: app/wiki/[slug]/page.tsx
// Return: { slug: 'getting-started' }

// URL: /blog/2024/10/my-post
// File: app/blog/[year]/[month]/[slug]/page.tsx
// Return: { year: '2024', month: '10', slug: 'my-post' }
```

**Gotcha**: Make sure slug format matches your URL structure (with/without slashes, encoding, etc.)

### Step 3: Implement Server Component Data Fetching

Fetch data in async Server Component (no `getServerSideProps` in App Router).

**Example from apps/web/app/wiki/[slug]/page.tsx:**

```typescript
async function getWikiPage(slug: string) {
  const page = await prisma.wikiPage.findUnique({
    where: { path: `/${slug}` },
    select: {
      id: true,
      title: true,
      content: true,
      path: true,
      createdAt: true,
      updatedAt: true,
      outgoingLinks: {
        select: {
          targetPage: {
            select: {
              id: true,
              title: true,
              path: true,
            },
          },
        },
        take: 5,
      },
    },
  });

  if (!page) {
    return null;
  }

  // Transform dates to strings (JSON serializable)
  return {
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export default async function WikiPage({ params }: PageProps) {
  const page = await getWikiPage(params.slug);

  if (!page) {
    notFound(); // Triggers 404 page
  }

  return (
    <div>
      <h1>{page.title}</h1>
      <div>{page.content}</div>
    </div>
  );
}
```

**Best Practices:**

- Create helper function for data fetching (reusable, testable)
- Use Prisma select to limit fields (performance)
- Transform non-serializable data (Dates → ISO strings)
- Call `notFound()` for missing content (proper 404)
- Fetch only what you need (avoid over-fetching)

**Gotcha**: Dates must be serialized to strings (Prisma returns Date objects, but components need strings).

### Step 4: Handle Missing Content

Show proper 404 page when content doesn't exist.

**Example from apps/web/app/wiki/[slug]/page.tsx:**

```typescript
import { notFound } from 'next/navigation';

export default async function WikiPage({ params }: PageProps) {
  const page = await getWikiPage(params.slug);

  if (!page) {
    notFound(); // Renders app/wiki/[slug]/not-found.tsx
  }

  // ... render page
}
```

**Create custom 404 page:**

```typescript
// app/wiki/[slug]/not-found.tsx
export default function WikiNotFound() {
  return (
    <div>
      <h1>Wiki Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/wiki">Browse all pages</a>
    </div>
  );
}
```

**Best Practices:**

- Always call `notFound()` for missing content (not custom 404 UI)
- Create route-specific not-found pages
- Include helpful navigation (back to list, search)
- Log 404s for analytics (broken links)

**Gotcha**: Don't throw errors for missing content - use `notFound()` to return proper 404 status.

### Step 5: Configure Caching Strategy

Understand how ISR caching works and configure appropriately.

**ISR Caching Flow:**

```
1. Build time:
   - Generate static HTML for pages in generateStaticParams
   - Cache on CDN/filesystem

2. First request after revalidate time:
   - Serve stale content (fast)
   - Trigger background revalidation
   - Generate fresh HTML

3. Subsequent requests:
   - Serve fresh content from cache
   - Repeat after next revalidate interval
```

**Example Timeline (revalidate: 3600):**

```
T+0min:  Request → Serve from build cache (stale but fast)
T+60min: Request → Serve stale, trigger revalidation in background
T+61min: Request → Serve fresh (regenerated in background)
T+120min: Request → Serve cached fresh, trigger revalidation
```

**Best Practices:**

- Document expected staleness in code comments
- Monitor cache hit rates
- Consider user expectations (real-time vs eventual consistency)
- Use shorter revalidate for critical content

**Configuration Options:**

```typescript
// Option 1: Time-based revalidation (ISR)
export const revalidate = 3600; // 1 hour

// Option 2: On-demand revalidation (manual trigger)
// In Server Action or API route:
import { revalidatePath } from 'next/cache';
revalidatePath('/wiki/getting-started');

// Option 3: Force dynamic (no caching)
export const dynamic = 'force-dynamic';
```

### Step 6: Implement On-Demand Revalidation (Optional)

Trigger revalidation manually when content changes.

**Example Server Action:**

```typescript
// app/admin/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function updateWikiPage(slug: string, data: any) {
  // Update in database
  await prisma.wikiPage.update({
    where: { path: `/${slug}` },
    data,
  });

  // Immediately revalidate the page
  revalidatePath(`/wiki/${slug}`);

  return { success: true };
}
```

**When to Use:**

- Content edited via admin panel
- Triggered by webhook (CMS update)
- Scheduled jobs (e.g., daily import)
- Critical updates that can't wait for interval

**Best Practices:**

- Revalidate after mutations (create, update, delete)
- Revalidate related pages (e.g., list page when item added)
- Use `revalidateTag` for bulk updates
- Don't overuse (can cause server load spikes)

**Gotcha**: `revalidatePath` only works in Server Actions or Route Handlers, not Client Components!

### Step 7: Monitor and Optimize

Track ISR performance and adjust configuration.

**Metrics to Monitor:**

- **Cache hit rate**: How often pages served from cache
- **Revalidation frequency**: How often background regeneration runs
- **Page load time**: First contentful paint (FCP)
- **Server load**: Background revalidation impact

**Optimization Strategies:**

```typescript
// Strategy 1: Longer revalidate for stable content
export const revalidate = 86400; // 1 day for stable docs

// Strategy 2: Fetch minimum data
const page = await prisma.page.findUnique({
  select: { title: true, content: true }, // Only what's needed
});

// Strategy 3: Parallel queries for related data
const [page, relatedPages] = await Promise.all([
  prisma.page.findUnique({ where: { slug } }),
  prisma.page.findMany({ where: { category: 'related' }, take: 5 }),
]);

// Strategy 4: Cache expensive computations
const tocItems = extractHeadings(page.content); // Server-side only
```

**Best Practices:**

- Start with longer revalidate, reduce if needed
- Use CDN for additional caching layer
- Monitor error rates during revalidation
- Set up alerts for failed revalidations

## Verification

After implementation, verify:

- [ ] Page loads fast on first visit (cached)
- [ ] Content updates after revalidate interval
- [ ] 404 pages work for missing content
- [ ] generateStaticParams pre-renders expected pages
- [ ] Background revalidation doesn't block requests
- [ ] On-demand revalidation works (if implemented)
- [ ] Cache headers correct (s-maxage, stale-while-revalidate)
- [ ] TypeScript compiles with no errors
- [ ] No runtime errors during revalidation

## Common Pitfalls

### Issue: Content Never Updates

**Symptom**: Page shows stale content even after revalidate time
**Cause**: Forgot to export `revalidate` or used wrong value

```typescript
// ❌ WRONG - No revalidate export
export default async function Page() {
  /* ... */
}

// ❌ WRONG - revalidate: false (never updates)
export const revalidate = false;

// ✅ CORRECT
export const revalidate = 3600;
```

### Issue: Pages Not Pre-Rendered

**Symptom**: Slow first load for all pages
**Cause**: `generateStaticParams` not implemented or returns empty array

```typescript
// ❌ WRONG - No generateStaticParams
export default async function Page({ params }) {
  /* ... */
}

// ❌ WRONG - Returns empty array
export async function generateStaticParams() {
  return [];
}

// ✅ CORRECT
export async function generateStaticParams() {
  const pages = await prisma.page.findMany({ take: 50 });
  return pages.map((p) => ({ slug: p.slug }));
}
```

### Issue: Date Serialization Error

**Symptom**: Error "Date object cannot be serialized"
**Cause**: Passing Date objects directly to Client Components

```typescript
// ❌ WRONG - Date objects not serializable
return {
  ...page,
  createdAt: page.createdAt, // Date object
};

// ✅ CORRECT - Convert to ISO string
return {
  ...page,
  createdAt: page.createdAt.toISOString(),
};
```

### Issue: 404 Returns 200 Status

**Symptom**: Missing pages return 200 status, not 404
**Cause**: Not calling `notFound()` for missing content

```typescript
// ❌ WRONG - Returns 200 with error message
if (!page) {
  return <div>Page not found</div>;
}

// ✅ CORRECT - Returns 404 status
if (!page) {
  notFound();
}
```

### Issue: Revalidation Not Working

**Symptom**: On-demand revalidation doesn't update page
**Cause**: Wrong path or used in wrong context

```typescript
// ❌ WRONG - Path doesn't match
revalidatePath('/wiki'); // Should be specific page

// ❌ WRONG - Called in Client Component
('use client');
const handleUpdate = () => {
  revalidatePath('/wiki/page'); // Won't work!
};

// ✅ CORRECT - Server Action with correct path
('use server');
export async function updatePage(slug: string) {
  await updateDatabase(slug);
  revalidatePath(`/wiki/${slug}`);
}
```

### Issue: Slow Builds

**Symptom**: Build takes 10+ minutes
**Cause**: Pre-rendering too many pages in `generateStaticParams`

```typescript
// ❌ WRONG - All pages (1000+)
export async function generateStaticParams() {
  const pages = await prisma.page.findMany(); // All pages!
  return pages.map((p) => ({ slug: p.slug }));
}

// ✅ CORRECT - Limit to popular pages
export async function generateStaticParams() {
  const pages = await prisma.page.findMany({
    orderBy: { views: 'desc' },
    take: 50, // Only top 50
  });
  return pages.map((p) => ({ slug: p.slug }));
}
```

## Testing Strategy

### Unit Testing Data Fetching

```typescript
describe('getWikiPage', () => {
  it('fetches page by slug', async () => {
    const page = await getWikiPage('getting-started');

    expect(page).not.toBeNull();
    expect(page.title).toBe('Getting Started');
    expect(typeof page.createdAt).toBe('string'); // ISO string
  });

  it('returns null for missing page', async () => {
    const page = await getWikiPage('nonexistent');

    expect(page).toBeNull();
  });

  it('includes related pages', async () => {
    const page = await getWikiPage('getting-started');

    expect(page.relatedPages).toBeDefined();
    expect(page.relatedPages.length).toBeLessThanOrEqual(5);
  });
});
```

### E2E Testing ISR

```typescript
import { test, expect } from '@playwright/test';

test.describe('Wiki ISR', () => {
  test('serves cached page fast', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/wiki/getting-started');
    const loadTime = Date.now() - startTime;

    // Should be fast (cached)
    expect(loadTime).toBeLessThan(500);
  });

  test('updates content after revalidation', async ({ page, request }) => {
    // Visit page (cached)
    await page.goto('/wiki/getting-started');
    const oldContent = await page.textContent('h1');

    // Update content via API
    await request.post('/api/admin/wiki', {
      data: { slug: 'getting-started', title: 'Updated Title' },
    });

    // Trigger revalidation
    await request.post('/api/revalidate', {
      data: { path: '/wiki/getting-started' },
    });

    // Wait a bit for revalidation
    await page.waitForTimeout(1000);

    // Visit again (should be fresh)
    await page.reload();
    const newContent = await page.textContent('h1');

    expect(newContent).toBe('Updated Title');
  });

  test('shows 404 for missing page', async ({ page }) => {
    const response = await page.goto('/wiki/nonexistent-page');

    expect(response.status()).toBe(404);
    expect(await page.textContent('h1')).toContain('Not Found');
  });
});
```

## Performance Considerations

### ISR vs SSR vs SSG Comparison

| Metric          | SSG (Static)          | ISR                               | SSR (Dynamic)               |
| --------------- | --------------------- | --------------------------------- | --------------------------- |
| **First load**  | ⚡ Fast (instant)     | ⚡ Fast (cached)                  | 🐌 Slow (render on request) |
| **Freshness**   | ❌ Stale (build-time) | ⚠️ Eventual (revalidate interval) | ✅ Always fresh             |
| **Server load** | ✅ None (CDN)         | ⚠️ Low (periodic regen)           | ❌ High (every request)     |
| **Scalability** | ✅ Excellent          | ✅ Good                           | ⚠️ Limited                  |
| **Cost**        | ✅ Low (CDN)          | ✅ Low                            | ❌ High (servers)           |

### When to Use Each

**Use SSG (revalidate: false):**

- Content never changes (legal, terms)
- Historical content (old blog posts)
- Marketing pages (landing, about)

**Use ISR (this SOP):**

- Content changes hourly/daily (docs, blog)
- Public pages (not user-specific)
- High traffic (needs caching)

**Use SSR (dynamic: 'force-dynamic'):**

- Real-time data (dashboards, live scores)
- User-specific (profiles, settings)
- Frequently updated (every minute)

### CDN Caching

**ISR works best with CDN:**

```typescript
// Next.js automatically sets these headers:
Cache-Control: s-maxage=3600, stale-while-revalidate
```

- `s-maxage=3600`: CDN caches for 1 hour
- `stale-while-revalidate`: Serve stale while fetching fresh

**CDN Benefits:**

- Global edge caching (users worldwide get fast loads)
- Automatic invalidation after revalidate
- Reduced server load (requests don't hit origin)

## Related Documentation

- [Next.js ISR Docs](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [Next.js revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md](../../COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md) - Implementation
- [Next.js Expert Consultation](../../.agent/task/current-session-20251028-1600.md) - Architectural decision

## Examples from Codebase

- **[apps/web/app/wiki/[slug]/page.tsx](../../apps/web/app/wiki/[slug]/page.tsx)** - Complete ISR implementation
  - Line 15: revalidate export (1 hour)
  - Lines 92-101: generateStaticParams
  - Lines 45-89: Server-side data fetching
  - Lines 103-155: Page component

- **[apps/web/app/wiki/[slug]/not-found.tsx](../../apps/web/app/wiki/[slug]/not-found.tsx)** - Custom 404

## Notes

- **Why ISR for Wiki?** - Documentation changes infrequently (hours/days), but benefits from fast CDN loads. 1-hour cache provides 99% fresh content while maintaining <100ms page loads.
- **Stale-While-Revalidate** - Users always get fast response (stale cache), while fresh content generates in background. Best of both worlds!
- **Cost Efficiency** - ISR reduces server costs by 90%+ compared to SSR while maintaining content freshness.
- **User Experience** - Sub-second page loads (cached) + reasonably fresh content (1-hour staleness acceptable for docs).

---

**Last Updated**: 2025-10-28
**Created From**: Wiki page implementation (Phase 3 Days 5-6)
**Pattern Origin**: Next.js Expert recommendation for infrequently-changing content
