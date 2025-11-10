# SOP: Multi-Select URL Filter Pattern

## Purpose

Document the pattern for implementing multi-select filters with URL as single source of truth, enabling shareable filter states and browser history support.

## When to Use

**Use URL-based filters when:**
- Filters need to be shareable (copy URL = share filter state)
- Browser back/forward should restore filter state
- SEO important (crawlers see different filtered views)
- Multiple independent filters (category, status, priority)
- Filters persist across page refreshes

**Example use cases:**
- Wiki category filters ✅
- Issue status/priority/module filters ✅
- E-commerce faceted search ✅
- Admin dashboards with complex filters ✅

**DO NOT use URL filters when:**
- Filters are temporary UI state (expand/collapse)
- Filters shouldn't be shareable (user preferences)
- Too many filter combinations (URL gets huge)
- Real-time updates needed (websockets)

**Example non-URL cases:**
- Sort direction toggle (client state) ❌
- Sidebar collapse state ❌
- Theme preference (localStorage) ❌

## Prerequisites

- Next.js 14+ with App Router
- Server Components for list page
- Client Components for filter UI
- Understanding of URLSearchParams API

## Procedure

### Step 1: Define URL Schema for Multi-Select

Use comma-separated values for multi-select filters in URL.

**Example URL structure:**
```
/wiki?category=guides,reference,api&search=setup&sort=newest&page=1
```

**URL Schema:**
- `category`: Comma-separated categories (multi-select)
- `search`: Search term (single value)
- `sort`: Sort order (single value)
- `page`: Pagination (single value, number)

**Why comma-separated?**
- ✅ Clean, readable URLs
- ✅ Single query param (not `?category=guides&category=api`)
- ✅ Easy to parse with `split(',')`.filter(Boolean)
- ✅ Standard pattern (Google, Amazon use this)

**Alternative (array syntax):**
```
/wiki?category[]=guides&category[]=reference
```
❌ Harder to parse, uglier URLs

### Step 2: Parse URL Params on Server

Extract and parse filter values from URL in Server Component.

**Example:**
```typescript
// apps/web/app/wiki/page.tsx (lines 26-32, 42-48)
interface SearchParams {
  category?: string;
  search?: string;
  sort?: string;
  page?: string;
  [key: string]: string | undefined;
}

async function getWikiPages(searchParams: SearchParams) {
  // Parse filters from URL
  const categoryFilter = searchParams.category?.split(',').filter(Boolean) || [];
  const searchTerm = searchParams.search || '';
  const sortBy = searchParams.sort || 'newest';
  const page = parseInt(searchParams.page || '1', 10);
  const perPage = 10;
  // ...
}
```

**Parsing logic:**
- `split(',')` - Split comma-separated string into array
- `.filter(Boolean)` - Remove empty strings (handles trailing comma)
- `|| []` - Default to empty array if undefined
- `parseInt(x, 10)` - Parse page number (base 10)

**Gotcha**: Always `.filter(Boolean)` after split to handle edge cases (`"guides,"` → `['guides', '']` → `['guides']`).

### Step 3: Create Client Component for Filter UI

Desktop sidebar + mobile drawer pattern with shared filter content.

**Example:**
```typescript
// apps/web/components/wiki/WikiListClient.tsx (lines 1-26)
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';

interface WikiListClientProps {
  categoryStats: Record<string, number>;
  searchParams: {
    category?: string;
    [key: string]: string | undefined;
  };
}

export function WikiListClient({ categoryStats, searchParams }: WikiListClientProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Parse active categories from URL
  const activeCategories = searchParams.category?.split(',').filter(Boolean) || [];

  // Get all unique categories (sorted alphabetically)
  const allCategories = Object.keys(categoryStats).sort();
  // ...
}
```

**Props:**
- `categoryStats` - Category counts from server (`{ guides: 12, api: 5 }`)
- `searchParams` - Current URL params (passed from Server Component)

**State:**
- `isDrawerOpen` - Mobile drawer open/closed (client-only UI state)
- `activeCategories` - Parsed from URL (derived, not local state)

**Gotcha**: Don't duplicate URL state in local state. Parse from URL on every render.

### Step 4: Implement Toggle Logic for Multi-Select

Add/remove category from array, update URL.

**Example:**
```typescript
// apps/web/components/wiki/WikiListClient.tsx (lines 33-58)
/**
 * Toggle category filter
 * Handles multi-select logic (comma-separated categories in URL)
 */
const toggleCategory = (category: string) => {
  const params = new URLSearchParams(currentSearchParams?.toString());

  if (activeCategories.includes(category)) {
    // Remove category
    const newCategories = activeCategories.filter((c) => c !== category);
    if (newCategories.length === 0) {
      params.delete('category');
    } else {
      params.set('category', newCategories.join(','));
    }
  } else {
    // Add category
    const newCategories = [...activeCategories, category];
    params.set('category', newCategories.join(','));
  }

  // Reset to page 1 when filter changes
  params.delete('page');

  router.push(`/wiki?${params.toString()}`);
};
```

**Toggle logic:**
1. If category active → Remove from array
2. If array becomes empty → Delete param entirely (clean URL)
3. If category inactive → Add to array
4. Join array with commas → Update URL

**Why delete param when empty?**
- Cleaner URLs (`/wiki` instead of `/wiki?category=`)
- Default behavior (no filters = show all)

**Gotcha**: ALWAYS reset pagination when filters change (line 55).

### Step 5: Build URL with URLSearchParams

Preserve existing params while updating filters.

**Example:**
```typescript
// apps/web/components/wiki/WikiListClient.tsx (lines 38, 41-52, 57)
const params = new URLSearchParams(currentSearchParams?.toString());

if (activeCategories.includes(category)) {
  // Remove category
  const newCategories = activeCategories.filter((c) => c !== category);
  if (newCategories.length === 0) {
    params.delete('category');
  } else {
    params.set('category', newCategories.join(','));
  }
} else {
  // Add category
  const newCategories = [...activeCategories, category];
  params.set('category', newCategories.join(','));
}

router.push(`/wiki?${params.toString()}`);
```

**URLSearchParams methods:**
- `new URLSearchParams(currentSearchParams?.toString())` - Copy current params
- `params.set(key, value)` - Add/update param
- `params.delete(key)` - Remove param
- `params.toString()` - Serialize to query string

**Why copy current params?**
- Preserves other filters (search, sort)
- Only updates the filter being toggled
- Browser history works correctly

### Step 6: Implement Clear All Filters

Reset to default state (no filters).

**Example:**
```typescript
// apps/web/components/wiki/WikiListClient.tsx (lines 60-65)
/**
 * Clear all filters
 */
const clearFilters = () => {
  router.push('/wiki');
};
```

**Why `router.push('/wiki')` instead of deleting params?**
- Simpler (one line)
- Clears ALL params (category, search, sort, page)
- Returns to canonical URL

**Alternative (selective clear):**
```typescript
const clearFilters = () => {
  const params = new URLSearchParams(currentSearchParams?.toString());
  params.delete('category');
  params.delete('page');
  // Keep search and sort
  router.push(`/wiki?${params.toString()}`);
};
```

### Step 7: Desktop Sidebar + Mobile Drawer Architecture

Shared filter content between desktop and mobile viewports.

**Example:**
```typescript
// apps/web/components/wiki/WikiListClient.tsx (lines 67-106, 108-182)
// Render filter content (shared between desktop and mobile)
const filterContent = (
  <div className="neu-raised smooth-transition rounded-3xl p-6">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Filters</h3>
      {activeCategories.length > 0 && (
        <button
          onClick={clearFilters}
          className="text-xs font-semibold text-coral hover:text-coral-light smooth-transition"
        >
          Clear
        </button>
      )}
    </div>

    {/* Category Filters */}
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate">Category</h4>
      {allCategories.length === 0 ? (
        <p className="text-sm text-slate">No categories yet</p>
      ) : (
        allCategories.map((category) => (
          <label
            key={category}
            className="flex cursor-pointer items-center gap-2 text-sm text-slate hover:text-white smooth-transition group"
          >
            <input
              type="checkbox"
              checked={activeCategories.includes(category)}
              onChange={() => toggleCategory(category)}
              className="h-4 w-4 rounded border-slate-600 bg-dark-pressed text-coral focus:ring-coral focus:ring-offset-navy smooth-transition"
            />
            <span className="flex-1 capitalize group-hover:text-white">{category.replace(/-/g, ' ')}</span>
            <span className="text-xs text-slate">({categoryStats[category]})</span>
          </label>
        ))
      )}
    </div>
  </div>
);

return (
  <>
    {/* Desktop Sidebar */}
    <aside className="hidden w-64 flex-shrink-0 lg:block">{filterContent}</aside>

    {/* Mobile FAB */}
    <button
      onClick={() => setIsDrawerOpen(true)}
      className="neu-raised smooth-transition fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl text-slate shadow-2xl hover:text-white lg:hidden"
      aria-label="Open filters"
      aria-expanded={isDrawerOpen}
    >
      <SlidersHorizontal className="h-6 w-6" />
    </button>

    {/* Mobile Drawer */}
    {isDrawerOpen && (
      <div className="fixed inset-0 z-50 lg:hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 smooth-transition"
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />

        {/* Drawer */}
        <div className="absolute bottom-0 left-0 right-0 neu-raised rounded-t-3xl p-6 smooth-transition animate-slide-up">
          {/* Mobile Header */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Filters</h3>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-slate hover:text-white smooth-transition"
              aria-label="Close filters"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Filter content (duplicated for mobile) */}
          {/* ... same filter checkboxes ... */}
        </div>
      </div>
    )}
  </>
);
```

**Desktop sidebar:**
- Always visible on lg+ screens (`hidden lg:block`)
- Fixed width (w-64 = 256px)
- Vertical scroll if many filters

**Mobile FAB (Floating Action Button):**
- Visible on < lg screens (`lg:hidden`)
- Fixed position (bottom-right)
- Opens drawer on tap

**Mobile drawer:**
- Bottom sheet (slides up from bottom)
- Backdrop overlay (dark transparent)
- Close on backdrop click or X button

**Gotcha**: Duplicate filter content between desktop and mobile (or extract to separate component).

### Step 8: Display Category Counts

Show item count for each category using GroupBy stats.

**Example:**
```typescript
// apps/web/components/wiki/WikiListClient.tsx (lines 99-100)
<span className="flex-1 capitalize">{category.replace(/-/g, ' ')}</span>
<span className="text-xs text-slate">({categoryStats[category]})</span>
```

**CategoryStats structure:**
```typescript
{
  'guides': 12,
  'reference': 8,
  'api': 5,
  'troubleshooting': 3
}
```

**Why show counts?**
- User knows how many results to expect
- Empty categories visible but grayed out
- Helps decide which filters to apply

**Gotcha**: Use `categoryStats[category]` (not hardcoded). Counts update automatically.

## Verification

After implementation, verify:

- [ ] URL updates when filter toggled
- [ ] Browser back/forward restores filter state
- [ ] Copy URL → paste in new tab → filters restored
- [ ] Multiple categories can be selected
- [ ] Deselecting all categories removes param
- [ ] Clear button removes all filters
- [ ] Pagination resets when filter changes
- [ ] Desktop sidebar visible on large screens
- [ ] Mobile FAB + drawer visible on small screens
- [ ] Category counts display correctly

## Troubleshooting

### Issue: Filters Don't Persist on Refresh

**Symptom**: Page refresh loses filter state
**Cause**: Using local state instead of URL
**Solution**: Always parse filters from `searchParams`, never store in useState

### Issue: URL Has Trailing Comma

**Symptom**: URL like `/wiki?category=guides,`
**Cause**: Not filtering empty strings after split
**Solution**: Use `.split(',').filter(Boolean)` (line 44)

### Issue: Page Shows Wrong Results

**Symptom**: User on page 5 with new filters shows "No results"
**Cause**: Forgot to reset pagination
**Solution**: Add `params.delete('page')` when filters change (line 55)

### Issue: Mobile Drawer Doesn't Close on Filter

**Symptom**: Drawer stays open after selecting category
**Cause**: Missing `setIsDrawerOpen(false)` in toggle handler
**Solution**: Close drawer after filter applied (or keep open for multi-select)

### Issue: Browser History Broken

**Symptom**: Back button doesn't restore previous filter state
**Cause**: Using `router.replace()` instead of `router.push()`
**Solution**: Always use `router.push()` for filter changes (line 57)

## Performance Considerations

**URL vs Local State:**
- URL: Shareable, SEO-friendly, slower (navigation)
- Local state: Fast, but not shareable, lost on refresh

**When to use URL:**
- Filters persist across sessions ✅
- Shareable filter combinations ✅
- SEO important (filtered views) ✅

**When to use local state:**
- Temporary UI (expand/collapse) ✅
- High-frequency updates (slider dragging) ✅
- Private user preferences ✅

## Related Documentation

- [URLSearchParams MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- [Next.js useSearchParams Docs](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- [.agent/system/component-patterns.md](../system/component-patterns.md) - React patterns
- [debounced-search-pattern.md](./debounced-search-pattern.md) - Search implementation
- [isr-wiki-list-pattern.md](./isr-wiki-list-pattern.md) - Server Component integration

## Examples from Codebase

- [apps/web/components/wiki/WikiListClient.tsx](../../apps/web/components/wiki/WikiListClient.tsx) - Full implementation
- [apps/web/components/issues/IssuesPageClient.tsx](../../apps/web/components/issues/IssuesPageClient.tsx) - Complex filters (status, priority, module)

## Advanced: Multiple Filter Types

**For complex filters (status + priority + category):**

```typescript
// URL: /issues?status=open,in-progress&priority=high,critical&module=auth

const parseMultiSelectParams = (params: SearchParams) => ({
  status: params.status?.split(',').filter(Boolean) || [],
  priority: params.priority?.split(',').filter(Boolean) || [],
  module: params.module?.split(',').filter(Boolean) || [],
});

const toggleFilter = (type: 'status' | 'priority' | 'module', value: string) => {
  const current = parseMultiSelectParams(searchParams);
  const params = new URLSearchParams(currentSearchParams?.toString());

  if (current[type].includes(value)) {
    // Remove
    const newValues = current[type].filter((v) => v !== value);
    if (newValues.length === 0) params.delete(type);
    else params.set(type, newValues.join(','));
  } else {
    // Add
    const newValues = [...current[type], value];
    params.set(type, newValues.join(','));
  }

  params.delete('page');
  router.push(`/issues?${params.toString()}`);
};
```

**See**: [apps/web/components/issues/IssuesPageClient.tsx](../../apps/web/components/issues/IssuesPageClient.tsx) for production example.

---

**Last Updated**: 2025-11-10
**Created From**: Sprint 2 Day 2 wiki filter implementation
**Key Insight**: URL as single source of truth = shareable, SEO-friendly, browser-history-aware filters
