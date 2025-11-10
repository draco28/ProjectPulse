# SOP: Debounced Search Pattern

## Purpose

Document the client-side debounced search pattern to prevent URL thrashing and excessive server requests when users type quickly in search inputs.

## When to Use

**Use debounced search when:**
- Search input updates URL query params
- Each keystroke would trigger navigation
- Backend search is expensive (database full-text search)
- UX feels laggy with instant search
- Input has high typing frequency (> 3 chars/second)

**Example use cases:**
- Wiki/documentation search ✅
- Product search (e-commerce) ✅
- User search (typeahead) ✅
- Full-text content search ✅

**DO NOT use debounced search when:**
- Search is purely client-side (filter array)
- Instant feedback critical (autocomplete dropdown)
- Backend search is fast (< 10ms, indexed)
- Search doesn't update URL

**Example non-debounced cases:**
- Filter dropdown (instant) ❌
- Client-side array filter ❌
- Autocomplete with local data ❌

## Prerequisites

- Next.js 14+ with App Router
- Client Component (`'use client'`)
- Understanding of useEffect cleanup
- React hooks (useState, useEffect)

## Procedure

### Step 1: Set Up Client Component State

Create controlled input with local state (not URL as source of truth).

**Example:**
```typescript
// apps/web/components/wiki/WikiSearchBar.tsx (lines 7-32)
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface WikiSearchBarProps {
  searchParams: {
    search?: string;
    sort?: string;
    [key: string]: string | undefined;
  };
}

export function WikiSearchBar({ searchParams }: WikiSearchBarProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.search || '');
  const sortBy = searchParams.sort || 'newest';
  // ...
}
```

**Why local state first?**
- Immediate UI feedback (no lag)
- Debounce before URL update
- User sees what they type instantly

**Gotcha**: Initialize state from `searchParams.search` to handle direct URL access (e.g., `/wiki?search=api`).

### Step 2: Implement Debounced Effect

Use `useEffect` with `setTimeout` to delay URL updates by 300ms.

**Example:**
```typescript
// apps/web/components/wiki/WikiSearchBar.tsx (lines 34-52)
// Debounced search (300ms delay)
useEffect(() => {
  const handler = setTimeout(() => {
    const params = new URLSearchParams(currentSearchParams?.toString());

    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }

    // Reset to page 1 when searching
    params.delete('page');

    router.push(`/wiki?${params.toString()}`);
  }, 300);

  return () => clearTimeout(handler);
}, [search, router, currentSearchParams]);
```

**How it works:**
1. User types "a" → state updates → timeout starts (300ms)
2. User types "p" (100ms later) → state updates → **previous timeout canceled** → new timeout starts
3. User types "i" (100ms later) → state updates → **previous timeout canceled** → new timeout starts
4. User stops typing → timeout completes (300ms) → URL updates → server refetch

**Why 300ms?**
- Balance between UX and performance
- Feels instant to user (< 400ms threshold)
- Reduces server requests by ~80% (5 keystrokes = 1 request)

**Alternative delays:**
- **150ms**: Very responsive, more requests
- **500ms**: Fewer requests, feels sluggish
- **1000ms**: Too slow, user thinks it's broken

**Gotcha**: MUST return cleanup function (`clearTimeout`) to cancel previous timeout when user types again.

### Step 3: Handle URL Search Params Correctly

Preserve other URL params (category, sort, page) when updating search.

**Example:**
```typescript
// apps/web/components/wiki/WikiSearchBar.tsx (lines 36-48)
const handler = setTimeout(() => {
  const params = new URLSearchParams(currentSearchParams?.toString());

  if (search) {
    params.set('search', search);
  } else {
    params.delete('search');
  }

  // Reset to page 1 when searching
  params.delete('page');

  router.push(`/wiki?${params.toString()}`);
}, 300);
```

**URLSearchParams manipulation:**
- `new URLSearchParams(currentSearchParams?.toString())` - Copy current params
- `params.set('search', search)` - Add/update search param
- `params.delete('search')` - Remove search param (empty input)
- `params.delete('page')` - Reset pagination
- `params.toString()` - Serialize to query string

**Why reset pagination?**
- User expects to see results from page 1 (not page 5 of old results)
- Prevents "No results" on page 5 of new filtered results

**Gotcha**: Always delete page when ANY filter changes (search, category, sort).

### Step 4: Implement Clear/Reset Functionality

Add escape key handler and clear button to reset search.

**Example:**
```typescript
// apps/web/components/wiki/WikiSearchBar.tsx (lines 54-63)
const handleClear = () => {
  setSearch('');
};

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Escape') {
    handleClear();
    e.currentTarget.blur();
  }
};
```

**Why blur on Escape?**
- Consistent with browser behavior
- Returns focus to page (keyboard navigation)
- User expects Escape to "exit" search mode

**Clear button (X icon):**
```typescript
// apps/web/components/wiki/WikiSearchBar.tsx (lines 96-104)
{search && (
  <button
    onClick={handleClear}
    className="absolute inset-y-0 right-4 flex items-center text-slate hover:text-white smooth-transition"
    aria-label="Clear search"
  >
    <X className="h-5 w-5" />
  </button>
)}
```

**Gotcha**: Only show clear button when `search` has value (conditional rendering).

### Step 5: Integrate with Next.js Router

Use `useRouter()` and `useSearchParams()` hooks for navigation.

**Example:**
```typescript
// apps/web/components/wiki/WikiSearchBar.tsx (lines 28-30)
const router = useRouter();
const currentSearchParams = useSearchParams();
const [search, setSearch] = useState(searchParams.search || '');
```

**Hook purposes:**
- `useRouter()` - Navigate programmatically (`router.push()`)
- `useSearchParams()` - Read current URL params
- `useState()` - Local state for controlled input

**Why not use URL as single source of truth?**
- URL updates cause navigation (expensive)
- Debouncing requires local state first
- URL is eventual destination, not immediate state

### Step 6: Implement Search Input with Accessibility

Create accessible search input with icon and aria labels.

**Example:**
```typescript
// apps/web/components/wiki/WikiSearchBar.tsx (lines 80-105)
<div className="neu-raised smooth-transition flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-center">
  {/* Search Input */}
  <div className="relative flex-1">
    <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
      <Search className="h-5 w-5 text-slate" aria-hidden="true" />
    </div>
    <input
      type="search"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Search wiki pages..."
      className="neu-pressed w-full rounded-xl py-3 pl-12 pr-12 text-white placeholder-slate focus:border-coral focus:ring-2 focus:ring-coral/20 bg-dark-pressed border-0"
      aria-label="Search wiki pages"
    />
    {search && (
      <button
        onClick={handleClear}
        className="absolute inset-y-0 right-4 flex items-center text-slate hover:text-white smooth-transition"
        aria-label="Clear search"
      >
        <X className="h-5 w-5" />
      </button>
    )}
  </div>
  {/* ... */}
</div>
```

**Accessibility requirements:**
- `type="search"` - Semantic HTML (screen readers)
- `aria-label="Search wiki pages"` - Screen reader description
- `aria-label="Clear search"` - Clear button description
- `aria-hidden="true"` - Hide decorative icon from screen readers
- `placeholder` - Hint text (but NOT replacement for label)

**Gotcha**: `aria-label` is invisible. Ensure it's descriptive ("Search wiki pages" not "Search").

### Step 7: Handle Sort Without Debouncing

Dropdown changes don't need debouncing (single selection, not typing).

**Example:**
```typescript
// apps/web/components/wiki/WikiSearchBar.tsx (lines 65-78)
const handleSortChange = (newSort: string) => {
  const params = new URLSearchParams(currentSearchParams?.toString());

  if (newSort !== 'newest') {
    params.set('sort', newSort);
  } else {
    params.delete('sort');
  }

  // Reset to page 1 when sorting changes
  params.delete('page');

  router.push(`/wiki?${params.toString()}`);
};
```

**Why no debouncing?**
- Dropdown is single action (not rapid input)
- User expects immediate response
- No performance benefit from debouncing

**Default sort handling:**
- Delete `sort` param when value is "newest" (default)
- Keeps URL clean (`/wiki` instead of `/wiki?sort=newest`)

## Verification

After implementation, verify:

- [ ] Typing doesn't trigger immediate navigation
- [ ] URL updates ~300ms after last keystroke
- [ ] Escape key clears input and removes focus
- [ ] Clear button (X) appears when input has value
- [ ] Pagination resets when search changes
- [ ] Other params (category, sort) preserved
- [ ] Direct URL access works (`/wiki?search=api`)
- [ ] Accessible (keyboard navigation, screen reader)

## Troubleshooting

### Issue: Multiple Navigations on Fast Typing

**Symptom**: URL updates multiple times when typing quickly
**Cause**: Missing cleanup function in useEffect
**Solution**: Always return `() => clearTimeout(handler)` in useEffect

### Issue: Stale Search Results

**Symptom**: Search shows old results when switching between pages
**Cause**: State not initialized from URL params
**Solution**: Initialize state with `searchParams.search` (line 31)

### Issue: Page Param Not Resetting

**Symptom**: User sees "No results" on page 5 after new search
**Cause**: Forgot to delete page param
**Solution**: Add `params.delete('page')` before router.push (line 46)

### Issue: Input Loses Focus After Typing

**Symptom**: Input unfocuses after each keystroke
**Cause**: Component re-rendering from parent
**Solution**: Ensure component is memoized or parent doesn't re-render

### Issue: Debounce Not Working (Instant Updates)

**Symptom**: URL updates on every keystroke
**Cause**: useEffect dependencies wrong (missing search)
**Solution**: Include `[search, router, currentSearchParams]` in dependency array

## Performance Impact

**Without debouncing** (typing "documentation"):
- 13 keystrokes = 13 navigations = 13 server requests
- Total time: ~2.6s (13 × 200ms per request)
- Perceived lag: High (URL updates constantly)

**With debouncing (300ms)**:
- 13 keystrokes = 1 navigation = 1 server request
- Total time: ~500ms (300ms debounce + 200ms request)
- Perceived lag: None (feels instant)

**Server load reduction**: ~92% (13 → 1 requests)

## Related Documentation

- [React useEffect Docs](https://react.dev/reference/react/useEffect)
- [Next.js useRouter Docs](https://nextjs.org/docs/app/api-reference/functions/use-router)
- [.agent/system/component-patterns.md](../system/component-patterns.md) - React patterns
- [multi-select-url-filter-pattern.md](./multi-select-url-filter-pattern.md) - URL state management
- [isr-wiki-list-pattern.md](./isr-wiki-list-pattern.md) - Server Component integration

## Examples from Codebase

- [apps/web/components/wiki/WikiSearchBar.tsx](../../apps/web/components/wiki/WikiSearchBar.tsx) - Full implementation
- [apps/web/components/issues/IssueSearchBar.tsx](../../apps/web/components/issues/IssueSearchBar.tsx) - Similar pattern for issues

## Alternative Patterns

### 1. Lodash Debounce (External Library)

```typescript
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () =>
    debounce((value: string) => {
      const params = new URLSearchParams(currentSearchParams?.toString());
      if (value) params.set('search', value);
      else params.delete('search');
      router.push(`/wiki?${params.toString()}`);
    }, 300),
  [router, currentSearchParams]
);

const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearch(e.target.value);
  debouncedSearch(e.target.value);
};
```

**Pros**: More features (leading, trailing, maxWait)
**Cons**: External dependency (~100KB), overkill for simple debounce

### 2. Custom useDebounce Hook

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  const params = new URLSearchParams(currentSearchParams?.toString());
  if (debouncedSearch) params.set('search', debouncedSearch);
  else params.delete('search');
  router.push(`/wiki?${params.toString()}`);
}, [debouncedSearch, router, currentSearchParams]);
```

**Pros**: Reusable, clean separation
**Cons**: More complexity, extra render cycle

**Recommendation**: Use inline setTimeout for simple cases (current implementation). Use custom hook for 3+ debounced inputs.

---

**Last Updated**: 2025-11-10
**Created From**: Sprint 2 Day 2 wiki search implementation
**Key Insight**: 300ms debounce reduces server load by 92% with zero perceived lag
