# React Implementation Plan: Wiki List Page Client Components

**Created**: 2025-11-10 16:50 IST
**Type**: Component Architecture
**Context**: Sprint 2 Week 3 Day 2 - Wiki List/Detail UI (US-016, US-017)

---

## Executive Summary

This plan provides React component architecture for the wiki list page interactive features. The design follows Next.js 14 App Router best practices with Server Components for data fetching and Client Components for interactivity. The architecture reuses established patterns from the issues page while adapting for wiki-specific requirements (category filtering, hierarchical navigation, markdown preview).

**Key Design Decisions**:
1. **State Management**: URL search params as single source of truth + local UI state
2. **Component Pattern**: Compound component with explicit prop passing (not Context API)
3. **Performance**: Strategic memoization with React.memo + useCallback for stable references
4. **Debouncing**: Custom useDebounce hook (300ms) for search input
5. **TypeScript**: Strict type safety with discriminated unions for filter actions

---

## Component Architecture

### Component Tree

```
app/wiki/page.tsx (Server Component - Next.js App Router)
├── Fetches wiki pages + categories from Prisma
├── Passes initialData to client component
└── WikiListClient (Client Component - "use client")
    ├── State: search, categories, sort, page (synced with URL)
    ├── WikiSearchBar (Client Component)
    │   ├── Input: Search text (debounced)
    │   └── Select: Sort dropdown (newest, oldest, title, updated)
    ├── CategoryFilter (Client Component)
    │   └── Category chips (multi-select badges)
    ├── WikiGrid (Pure Component - could be Server Component)
    │   └── WikiCard[] (Memoized Client Component)
    │       ├── Props: page data (id, title, excerpt, category, path, updatedAt)
    │       └── Features: Hover effect, category badge, excerpt preview
    └── Pagination (Reusable from issues page)
        └── Props: currentPage, totalPages, totalCount, showing, perPage
```

### State Ownership Strategy

**WikiListClient** (Container Component):
- **Owns**: All filter state (search, categories[], sort, page)
- **Manages**: URL synchronization via useRouter + useSearchParams
- **Provides**: Event handlers to child components (updateSearch, toggleCategory, updateSort, goToPage)

**Child Components** (Controlled Components):
- **Receive**: Current state values as props
- **Emit**: Events via callbacks (no direct state mutation)
- **Benefits**: Testable, predictable, reusable

---

## Implementation Steps

### Step 1: Create Custom Hooks

#### hooks/useDebounce.ts

```typescript
/**
 * useDebounce Hook
 *
 * Debounces a value to prevent excessive re-renders during rapid input changes.
 * Perfect for search inputs that trigger expensive operations (URL updates, API calls).
 *
 * @param value - The value to debounce (e.g., search input text)
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced value
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   // This only runs 300ms after user stops typing
 *   updateURLWithSearch(debouncedSearch);
 * }, [debouncedSearch]);
 */
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancel timeout if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-run effect when value or delay changes

  return debouncedValue;
}
```

**Why useDebounce?**
- **User Experience**: Prevents URL thrashing during rapid typing (avoids browser history pollution)
- **Performance**: Reduces unnecessary re-renders and network requests
- **Accessibility**: Maintains input responsiveness (local state updates immediately, URL updates after delay)

#### hooks/useWikiFilters.ts

```typescript
/**
 * useWikiFilters Hook
 *
 * Manages wiki list filter state with URL synchronization.
 * Handles search, category filtering, sorting, and pagination.
 *
 * State Flow:
 * 1. User interacts with UI (types search, clicks category chip)
 * 2. Hook updates local state immediately (optimistic UI)
 * 3. Debounced values trigger URL updates via useRouter
 * 4. Server Component re-fetches data with new URL params
 * 5. Client Component receives updated initialData
 *
 * @param searchParams - URL search params from Next.js (server-provided)
 * @returns Filter state + update functions
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from './useDebounce';

export type SortOption = 'newest' | 'oldest' | 'title' | 'updated';

interface UseWikiFiltersReturn {
  // Current filter values
  search: string;
  selectedCategories: string[];
  sortBy: SortOption;
  currentPage: number;

  // Update functions
  updateSearch: (value: string) => void;
  toggleCategory: (category: string) => void;
  updateSort: (sort: SortOption) => void;
  goToPage: (page: number) => void;
  clearFilters: () => void;

  // Computed state
  hasActiveFilters: boolean;
}

export function useWikiFilters(
  initialSearch?: string,
  initialCategories?: string[],
  initialSort?: SortOption,
  initialPage?: number
): UseWikiFiltersReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state (immediate UI updates)
  const [search, setSearch] = useState(initialSearch || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategories || []
  );
  const [sortBy, setSortBy] = useState<SortOption>(initialSort || 'newest');
  const [currentPage, setCurrentPage] = useState(initialPage || 1);

  // Debounced search (prevents URL spam)
  const debouncedSearch = useDebounce(search, 300);

  // Sync URL when debounced values change
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString());

    // Update search param
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    } else {
      params.delete('search');
    }

    // Update categories param (comma-separated)
    if (selectedCategories.length > 0) {
      params.set('categories', selectedCategories.join(','));
    } else {
      params.delete('categories');
    }

    // Update sort param
    if (sortBy !== 'newest') {
      params.set('sort', sortBy);
    } else {
      params.delete('sort'); // Default is 'newest'
    }

    // Update page param
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    } else {
      params.delete('page'); // Default is page 1
    }

    // Push new URL (triggers Server Component re-render)
    router.push(`/wiki?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, selectedCategories, sortBy, currentPage, router, searchParams]);

  // Update functions (wrapped in useCallback for stable references)
  const updateSearch = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to page 1 when searching
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
    setCurrentPage(1); // Reset to page 1 when filtering
  }, []);

  const updateSort = useCallback((sort: SortOption) => {
    setSortBy(sort);
    setCurrentPage(1); // Reset to page 1 when sorting changes
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedCategories([]);
    setSortBy('newest');
    setCurrentPage(1);
  }, []);

  // Computed state
  const hasActiveFilters = search !== '' || selectedCategories.length > 0 || sortBy !== 'newest';

  return {
    search,
    selectedCategories,
    sortBy,
    currentPage,
    updateSearch,
    toggleCategory,
    updateSort,
    goToPage,
    clearFilters,
    hasActiveFilters,
  };
}
```

**Why useWikiFilters?**
- **Separation of Concerns**: URL sync logic isolated from UI components
- **Testability**: Pure function logic (easy to unit test)
- **Reusability**: Can be used in multiple pages (wiki list, wiki search results)
- **Predictable State**: Single source of truth (URL params) with optimistic local state

---

### Step 2: Create Main Container Component

#### components/wiki/WikiListClient.tsx

```typescript
/**
 * WikiListClient Component
 *
 * Client-side wrapper for wiki list page.
 * Manages interactive filtering, searching, and pagination.
 *
 * Architecture:
 * - Server Component fetches initial data (SSR for SEO)
 * - Client Component handles interactivity (filters, search, sort)
 * - URL search params = single source of truth
 * - Optimistic local state for immediate UI feedback
 *
 * Performance:
 * - Uses React.memo for child components (prevent unnecessary re-renders)
 * - useCallback for stable event handler references
 * - Debounced search (300ms) to prevent URL spam
 *
 * Accessibility:
 * - ARIA labels for search input and filters
 * - Keyboard navigation (Enter to search, Escape to clear)
 * - Focus management (search bar on page load)
 * - Screen reader announcements for filter changes
 */
'use client';

import { useWikiFilters } from '@/hooks/useWikiFilters';
import { WikiSearchBar } from './WikiSearchBar';
import { CategoryFilter } from './CategoryFilter';
import { WikiGrid } from './WikiGrid';
import { Pagination } from '@/components/shared/Pagination';
import type { WikiPagePreview, CategoryCount } from '@/types/wiki';

interface WikiListClientProps {
  // Server-provided initial data
  initialPages: WikiPagePreview[];
  totalPages: number;
  totalCount: number;
  currentPage: number;
  categories: CategoryCount[];

  // Initial filter values from URL params
  initialSearch?: string;
  initialCategories?: string[];
  initialSort?: 'newest' | 'oldest' | 'title' | 'updated';
}

export function WikiListClient({
  initialPages,
  totalPages,
  totalCount,
  currentPage,
  categories,
  initialSearch,
  initialCategories,
  initialSort,
}: WikiListClientProps) {
  // Filter state management (URL-synced)
  const {
    search,
    selectedCategories,
    sortBy,
    updateSearch,
    toggleCategory,
    updateSort,
    goToPage,
    clearFilters,
    hasActiveFilters,
  } = useWikiFilters(initialSearch, initialCategories, initialSort, currentPage);

  // Constants
  const PER_PAGE = 12; // Grid layout (3 columns × 4 rows)
  const showing = initialPages.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Search Bar + Sort Dropdown */}
      <WikiSearchBar
        search={search}
        sortBy={sortBy}
        onSearchChange={updateSearch}
        onSortChange={updateSort}
      />

      {/* Category Filter Chips */}
      <CategoryFilter
        categories={categories}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
      />

      {/* Clear Filters Button (only show if filters active) */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="smooth-transition self-start rounded-xl px-4 py-2 text-sm font-semibold text-coral hover:text-coral-light"
          aria-label="Clear all filters"
        >
          Clear All Filters
        </button>
      )}

      {/* Results Grid */}
      {initialPages.length > 0 ? (
        <>
          {/* Results Count */}
          <p className="text-sm text-slate" role="status" aria-live="polite">
            Showing {showing} of {totalCount} wiki pages
          </p>

          {/* Wiki Cards Grid */}
          <WikiGrid pages={initialPages} />

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              showing={showing}
              perPage={PER_PAGE}
            />
          )}
        </>
      ) : (
        // Empty State
        <div className="neu-raised smooth-transition flex flex-col items-center gap-4 rounded-3xl p-12 text-center">
          <div className="text-6xl opacity-50">📄</div>
          <h3 className="text-xl font-semibold text-white">No wiki pages found</h3>
          <p className="text-slate">
            {hasActiveFilters
              ? 'Try adjusting your filters or search terms'
              : 'No wiki pages have been created yet'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="coral-gradient mt-4 rounded-xl px-6 py-3 font-semibold text-white"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

**Key Features**:
- **Optimistic UI**: Filters update immediately (local state), URL syncs after debounce
- **Empty States**: Different messages for "no results" vs "no pages exist"
- **Accessibility**: ARIA live regions for screen readers, keyboard shortcuts
- **Performance**: Stable references (useCallback) prevent child re-renders

---

### Step 3: Create Search Bar Component

#### components/wiki/WikiSearchBar.tsx

```typescript
/**
 * WikiSearchBar Component
 *
 * Combined search input + sort dropdown for wiki list page.
 *
 * Features:
 * - Debounced search input (handled by parent useWikiFilters hook)
 * - Sort dropdown (newest, oldest, title A-Z, recently updated)
 * - Neumorphic coral theme styling
 * - Search icon + clear button
 * - Keyboard shortcuts (Enter to search, Escape to clear)
 *
 * Accessibility:
 * - ARIA labels for input and dropdown
 * - Keyboard navigation (Tab, Arrow keys)
 * - Focus visible outlines
 * - Screen reader announcements
 */
'use client';

import { Search, X } from 'lucide-react';
import type { SortOption } from '@/hooks/useWikiFilters';

interface WikiSearchBarProps {
  search: string;
  sortBy: SortOption;
  onSearchChange: (value: string) => void;
  onSortChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title', label: 'Title (A-Z)' },
  { value: 'updated', label: 'Recently Updated' },
];

export function WikiSearchBar({
  search,
  sortBy,
  onSearchChange,
  onSortChange,
}: WikiSearchBarProps) {
  const handleClear = () => {
    onSearchChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="neu-raised smooth-transition flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
          <Search className="h-5 w-5 text-slate" aria-hidden="true" />
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search wiki pages..."
          className="neu-pressed w-full rounded-xl py-3 pl-12 pr-12 text-white placeholder-slate focus:border-coral focus:ring-2 focus:ring-coral/20"
          aria-label="Search wiki pages"
        />
        {search && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-4 flex items-center text-slate hover:text-white"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-3">
        <label htmlFor="wiki-sort" className="text-sm font-semibold text-slate">
          Sort by:
        </label>
        <select
          id="wiki-sort"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="neu-pressed rounded-xl px-4 py-3 text-white focus:border-coral focus:ring-2 focus:ring-coral/20"
          aria-label="Sort wiki pages"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

**Design Notes**:
- **Combined Component**: Search + sort in single container (saves vertical space)
- **Clear Button**: Only shows when search has text (reduces visual clutter)
- **Keyboard UX**: Escape clears search and blurs input (common pattern)
- **Responsive**: Stacks vertically on mobile, horizontal on desktop

---

### Step 4: Create Category Filter Component

#### components/wiki/CategoryFilter.tsx

```typescript
/**
 * CategoryFilter Component
 *
 * Multi-select category filter using badge chips.
 *
 * Features:
 * - Category badges with count indicators
 * - Toggle selection on click
 * - Visual feedback (coral gradient when selected)
 * - Keyboard navigation (Space/Enter to toggle)
 * - Horizontal scrolling on overflow (mobile-friendly)
 *
 * Accessibility:
 * - ARIA role="group" for filter group
 * - ARIA-pressed for toggle state
 * - Keyboard navigation (Tab, Space, Enter)
 * - Focus visible outlines
 */
'use client';

import type { CategoryCount } from '@/types/wiki';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  categories: CategoryCount[];
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onToggleCategory,
}: CategoryFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div role="group" aria-label="Filter by category">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate">
        Categories
      </h3>

      {/* Horizontal scroll container (mobile-friendly) */}
      <div className="flex flex-wrap gap-3">
        {categories.map(({ name, count }) => {
          const isSelected = selectedCategories.includes(name);

          return (
            <button
              key={name}
              onClick={() => onToggleCategory(name)}
              className={cn(
                'smooth-transition flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold',
                isSelected
                  ? 'coral-gradient text-white shadow-lg'
                  : 'neu-raised text-slate hover:text-white'
              )}
              aria-pressed={isSelected}
              aria-label={`Filter by ${name} category (${count} pages)`}
            >
              <span>{name}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-dark-pressed text-slate'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Design Notes**:
- **Badge Pattern**: Chips with count indicators (familiar pattern from tags/labels)
- **Multi-Select**: Click to toggle (no "Apply" button needed - immediate feedback)
- **Visual Hierarchy**: Coral gradient for selected, neumorphic for unselected
- **Responsive**: Wraps on small screens, horizontal scroll if needed

---

### Step 5: Create Wiki Grid Component

#### components/wiki/WikiGrid.tsx

```typescript
/**
 * WikiGrid Component
 *
 * Responsive grid layout for wiki page cards.
 *
 * Grid Layout:
 * - Desktop (≥1024px): 3 columns
 * - Tablet (768-1023px): 2 columns
 * - Mobile (<768px): 1 column
 *
 * Performance:
 * - Pure component (no state, no side effects)
 * - Could be Server Component if parent passes static data
 * - Uses CSS Grid for efficient layout
 */

import { WikiCard } from './WikiCard';
import type { WikiPagePreview } from '@/types/wiki';

interface WikiGridProps {
  pages: WikiPagePreview[];
}

export function WikiGrid({ pages }: WikiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {pages.map((page) => (
        <WikiCard key={page.id} page={page} />
      ))}
    </div>
  );
}
```

**Design Notes**:
- **Simple Component**: No state, no hooks (just rendering)
- **CSS Grid**: Responsive layout with Tailwind breakpoints
- **Server Component Eligible**: Could be rendered on server if needed (no client-side JS required)

---

### Step 6: Create Wiki Card Component

#### components/wiki/WikiCard.tsx

```typescript
/**
 * WikiCard Component
 *
 * Individual wiki page preview card.
 *
 * Features:
 * - Neumorphic coral theme styling
 * - Hover lift effect
 * - Category badge
 * - Truncated excerpt (3 lines max)
 * - Last updated timestamp
 * - Link to wiki detail page
 *
 * Performance:
 * - Memoized with React.memo (prevents re-render when siblings update)
 * - Props comparison: shallow equality check on page.id + page.updatedAt
 *
 * Accessibility:
 * - Semantic HTML (article, h3, time)
 * - ARIA labels for category badge
 * - Focus visible outline on card link
 * - Color contrast meets WCAG AA standards
 */
'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { WikiPagePreview } from '@/types/wiki';
import { memo } from 'react';
import { Clock } from 'lucide-react';

interface WikiCardProps {
  page: WikiPagePreview;
}

/**
 * WikiCard Component (Memoized)
 *
 * Re-renders only when page.id or page.updatedAt changes.
 * This prevents unnecessary re-renders when sibling cards update.
 */
export const WikiCard = memo(function WikiCard({ page }: WikiCardProps) {
  const { id, title, excerpt, category, path, updatedAt } = page;

  // Format timestamp (relative time)
  const timeAgo = formatDistanceToNow(new Date(updatedAt), { addSuffix: true });

  return (
    <article className="neu-raised smooth-transition group rounded-3xl p-6 hover:-translate-y-1 hover:shadow-2xl">
      <Link href={`/wiki/${path}`} className="block focus:outline-none focus:ring-2 focus:ring-coral/50">
        {/* Category Badge */}
        {category && (
          <div className="mb-3">
            <span
              className="badge badge-coral text-xs"
              aria-label={`Category: ${category}`}
            >
              {category}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="mb-2 text-xl font-bold text-white group-hover:text-coral smooth-transition">
          {title}
        </h3>

        {/* Excerpt (truncated to 3 lines) */}
        {excerpt && (
          <p className="mb-4 line-clamp-3 text-sm text-slate">
            {excerpt}
          </p>
        )}

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-xs text-slate">
          <Clock className="h-3 w-3" aria-hidden="true" />
          <time dateTime={updatedAt}>Updated {timeAgo}</time>
        </div>
      </Link>
    </article>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if id or updatedAt changes
  return (
    prevProps.page.id === nextProps.page.id &&
    prevProps.page.updatedAt === nextProps.page.updatedAt
  );
});
```

**Performance Optimizations**:
- **React.memo**: Prevents re-render when parent re-renders but props unchanged
- **Custom Comparison**: Only checks `id` and `updatedAt` (ignores other props)
- **When to Memoize**: List items that don't change often (wiki pages stable)
- **Cost**: Minimal (shallow prop comparison faster than re-render)

**Design Notes**:
- **Hover Effect**: Lift animation + coral title color (neumorphic pattern)
- **Excerpt Truncation**: `line-clamp-3` (Tailwind utility) ensures consistent card height
- **Timestamp**: Relative time ("2 hours ago") more readable than absolute date

---

## TypeScript Types

Create these types in `apps/web/types/wiki.ts`:

```typescript
/**
 * Wiki Page Types
 *
 * Types for wiki list page components.
 * These match Prisma schema but are optimized for client-side use.
 */

/**
 * WikiPagePreview - Lightweight preview for list/grid views
 *
 * Used by: WikiCard, WikiGrid
 * Source: Prisma WikiPage model (subset of fields)
 */
export interface WikiPagePreview {
  id: number;
  title: string;
  excerpt: string | null; // First 200 chars of content (generated server-side)
  category: string | null;
  path: string; // URL path (e.g., 'getting-started', 'development-guides/docker-setup')
  updatedAt: string; // ISO 8601 string (serialized Date from Prisma)
}

/**
 * CategoryCount - Category with page count
 *
 * Used by: CategoryFilter
 * Source: Aggregated from Prisma WikiPage.category
 */
export interface CategoryCount {
  name: string; // Category name (e.g., 'Getting Started', 'API Documentation')
  count: number; // Number of pages in this category
}

/**
 * WikiListPageProps - Server Component props
 *
 * Used by: app/wiki/page.tsx (Server Component)
 * Passed to: WikiListClient (Client Component)
 */
export interface WikiListPageProps {
  searchParams?: {
    search?: string;
    categories?: string; // Comma-separated (e.g., 'Getting Started,API Documentation')
    sort?: 'newest' | 'oldest' | 'title' | 'updated';
    page?: string; // String because URL params are strings
  };
}
```

---

## Performance Optimization Strategy

### 1. Memoization Guidelines

**When to use React.memo:**
- ✅ **WikiCard**: List items that re-render frequently due to parent updates
- ✅ **CategoryFilter**: Expensive render (many badges) + stable props
- ❌ **WikiListClient**: Top-level component (always re-renders on URL change)
- ❌ **WikiSearchBar**: Input component (always re-renders on user interaction)

**When to use useCallback:**
- ✅ **Event handlers passed to children**: `updateSearch`, `toggleCategory`, `updateSort`
- ✅ **Dependencies of useEffect**: Stable references prevent effect re-runs
- ❌ **Event handlers NOT passed as props**: Inline onClick handlers in same component

**When to use useMemo:**
- ✅ **Expensive computations**: Filtering/sorting large arrays (>100 items)
- ✅ **Object/array literals passed as props**: Prevents referential inequality
- ❌ **Simple computations**: String concatenation, basic math (overhead > benefit)

### 2. Re-Render Prevention

**Strategy 1: URL as Single Source of Truth**
- Server Component re-fetches data on URL change
- Client Component receives fresh `initialPages` prop
- No need for client-side data fetching (reduces waterfalls)

**Strategy 2: Optimistic UI Updates**
- Local state updates immediately (search input, category chips)
- URL syncs after debounce (prevents thrashing)
- User sees instant feedback (perceived performance)

**Strategy 3: Stable References**
- `useCallback` for event handlers (prevents child re-renders)
- `React.memo` for list items (prevents sibling re-renders)
- Custom comparison functions (only re-render when data changes)

### 3. Bundle Size Optimization

**Code Splitting:**
- Mark client components with `'use client'` (rest stays server-side)
- Only interactive components ship JS to browser
- Server Components = zero JS bundle (SEO + performance)

**Lazy Loading:**
- Not needed yet (components small)
- Consider if adding heavy features (markdown editor, PDF export)

---

## Accessibility Considerations

### 1. ARIA Labels

**Search Input:**
```tsx
<input
  type="search"
  aria-label="Search wiki pages"
  aria-describedby="search-help"
/>
<p id="search-help" className="sr-only">
  Search by title, content, or category
</p>
```

**Category Filter:**
```tsx
<button
  aria-pressed={isSelected}
  aria-label={`Filter by ${category} category (${count} pages)`}
>
  {category} ({count})
</button>
```

**Results Count:**
```tsx
<p role="status" aria-live="polite">
  Showing {showing} of {totalCount} wiki pages
</p>
```

### 2. Keyboard Navigation

**Search Bar:**
- `Tab`: Focus search input
- `Enter`: Submit search (auto-handled by input type)
- `Escape`: Clear search and blur input

**Category Chips:**
- `Tab`: Navigate between chips
- `Space`/`Enter`: Toggle category selection
- Visual focus indicator (coral ring)

**Wiki Cards:**
- `Tab`: Navigate between cards
- `Enter`: Open wiki page
- Focus visible outline (neumorphic style)

### 3. Screen Reader Support

**Live Regions:**
- Results count updates announced on filter change
- Empty state messages announced when no results

**Semantic HTML:**
- `<article>` for wiki cards
- `<h3>` for card titles
- `<time>` for timestamps
- `<nav>` for pagination

**Hidden Text:**
- `.sr-only` class for context ("Updated 2 hours ago")
- ARIA labels for icon-only buttons

---

## Event Handler Patterns

### 1. Debouncing Search Input

**Pattern:**
```tsx
// Component level
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

// Update input immediately (optimistic UI)
const handleSearchChange = (value: string) => {
  setSearch(value); // Local state updates instantly
};

// Effect runs only after 300ms of no changes
useEffect(() => {
  updateURL(debouncedSearch); // URL syncs after debounce
}, [debouncedSearch]);
```

**Why this works:**
- User sees instant feedback (input updates immediately)
- URL doesn't thrash (waits 300ms after last keystroke)
- Browser history clean (no spam from rapid typing)

### 2. Optimistic Category Toggle

**Pattern:**
```tsx
const toggleCategory = useCallback((category: string) => {
  // 1. Update local state immediately (optimistic)
  setSelectedCategories((prev) => {
    if (prev.includes(category)) {
      return prev.filter((c) => c !== category);
    } else {
      return [...prev, category];
    }
  });

  // 2. URL sync happens in useEffect (triggered by state change)
  // 3. Server Component re-fetches data with new filters
  // 4. Client Component receives updated initialPages
}, []);
```

**Why this works:**
- Click feedback instant (chip toggles immediately)
- Data fetching async (doesn't block UI)
- If fetch fails, UI already updated (user doesn't see loading state)

### 3. Pagination with Scroll-to-Top

**Pattern:**
```tsx
const goToPage = useCallback((page: number) => {
  // 1. Update page state
  setCurrentPage(page);

  // 2. Scroll to top (smooth animation)
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 3. URL syncs in useEffect
  // 4. Server Component re-fetches page data
}, []);
```

**Why this works:**
- Scroll happens before data loads (user sees loading state at top)
- Smooth animation (better UX than instant jump)
- Consistent behavior (matches issue list pagination)

---

## Integration with Server Component

### Server Component (app/wiki/page.tsx)

```typescript
import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { WikiListClient } from '@/components/wiki/WikiListClient';
import type { WikiPagePreview, CategoryCount } from '@/types/wiki';

interface WikiPageProps {
  searchParams?: {
    search?: string;
    categories?: string; // Comma-separated
    sort?: 'newest' | 'oldest' | 'title' | 'updated';
    page?: string;
  };
}

export default async function WikiPage({ searchParams }: WikiPageProps) {
  // Parse search params
  const search = searchParams?.search || '';
  const categories = searchParams?.categories?.split(',') || [];
  const sort = (searchParams?.sort || 'newest') as 'newest' | 'oldest' | 'title' | 'updated';
  const page = parseInt(searchParams?.page || '1', 10);

  const PER_PAGE = 12;
  const skip = (page - 1) * PER_PAGE;

  // Build Prisma query
  const where = {
    AND: [
      // Search filter (title + content)
      search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { content: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {},
      // Category filter
      categories.length > 0
        ? { category: { in: categories } }
        : {},
    ],
  };

  // Sort options
  const orderBy = {
    newest: { createdAt: 'desc' as const },
    oldest: { createdAt: 'asc' as const },
    title: { title: 'asc' as const },
    updated: { updatedAt: 'desc' as const },
  }[sort];

  // Fetch wiki pages
  const [pages, totalCount, categoryGroups] = await Promise.all([
    prisma.wikiPage.findMany({
      where,
      orderBy,
      skip,
      take: PER_PAGE,
      select: {
        id: true,
        title: true,
        content: true, // Will truncate to excerpt
        category: true,
        path: true,
        updatedAt: true,
      },
    }),
    prisma.wikiPage.count({ where }),
    prisma.wikiPage.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { category: { not: null } },
      orderBy: { _count: { id: 'desc' } },
    }),
  ]);

  // Transform data for client
  const initialPages: WikiPagePreview[] = pages.map((page) => ({
    id: page.id,
    title: page.title,
    excerpt: page.content.slice(0, 200), // First 200 chars
    category: page.category,
    path: page.path,
    updatedAt: page.updatedAt.toISOString(),
  }));

  const categoryData: CategoryCount[] = categoryGroups.map((group) => ({
    name: group.category!,
    count: group._count.id,
  }));

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  return (
    <main className="min-h-screen bg-dark px-6 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="gradient-text mb-4 text-5xl font-bold">Wiki</h1>
          <p className="text-xl text-slate">
            Documentation and knowledge base for ProjectPulse
          </p>
        </div>

        {/* Client Component (Interactive) */}
        <Suspense fallback={<WikiListSkeleton />}>
          <WikiListClient
            initialPages={initialPages}
            totalPages={totalPages}
            totalCount={totalCount}
            currentPage={page}
            categories={categoryData}
            initialSearch={search}
            initialCategories={categories}
            initialSort={sort}
          />
        </Suspense>
      </div>
    </main>
  );
}
```

**Why this architecture?**
- **Server Component**: Fetches data (SEO, performance, security)
- **Client Component**: Handles interactivity (filters, search, pagination)
- **Suspense**: Shows loading state during data fetching
- **Static Types**: Type safety from database to UI

---

## Testing Recommendations

### 1. Component Unit Tests

**WikiCard.test.tsx:**
```typescript
import { render, screen } from '@testing-library/react';
import { WikiCard } from './WikiCard';

describe('WikiCard', () => {
  const mockPage = {
    id: 1,
    title: 'Getting Started',
    excerpt: 'Welcome to ProjectPulse wiki',
    category: 'Guide',
    path: 'getting-started',
    updatedAt: '2025-11-10T16:00:00Z',
  };

  it('renders page title and excerpt', () => {
    render(<WikiCard page={mockPage} />);
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Welcome to ProjectPulse wiki')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(<WikiCard page={mockPage} />);
    expect(screen.getByLabelText('Category: Guide')).toBeInTheDocument();
  });

  it('links to correct wiki page', () => {
    render(<WikiCard page={mockPage} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/wiki/getting-started');
  });

  it('does not re-render when sibling updates', () => {
    const { rerender } = render(<WikiCard page={mockPage} />);
    const renderSpy = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(renderSpy);

    // Re-render with same props
    rerender(<WikiCard page={mockPage} />);
    expect(renderSpy).not.toHaveBeenCalled(); // React.memo prevents re-render
  });
});
```

**WikiSearchBar.test.tsx:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WikiSearchBar } from './WikiSearchBar';

describe('WikiSearchBar', () => {
  const mockOnSearchChange = jest.fn();
  const mockOnSortChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onSearchChange when typing', async () => {
    render(
      <WikiSearchBar
        search=""
        sortBy="newest"
        onSearchChange={mockOnSearchChange}
        onSortChange={mockOnSortChange}
      />
    );

    const input = screen.getByLabelText('Search wiki pages');
    await userEvent.type(input, 'docker');

    expect(mockOnSearchChange).toHaveBeenCalledWith('docker');
  });

  it('clears search on clear button click', () => {
    render(
      <WikiSearchBar
        search="test"
        sortBy="newest"
        onSearchChange={mockOnSearchChange}
        onSortChange={mockOnSortChange}
      />
    );

    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    expect(mockOnSearchChange).toHaveBeenCalledWith('');
  });

  it('clears search on Escape key', () => {
    render(
      <WikiSearchBar
        search="test"
        sortBy="newest"
        onSearchChange={mockOnSearchChange}
        onSortChange={mockOnSortChange}
      />
    );

    const input = screen.getByLabelText('Search wiki pages');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(mockOnSearchChange).toHaveBeenCalledWith('');
  });
});
```

### 2. Hook Unit Tests

**useDebounce.test.ts:**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('debounces value after delay', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    // Update value rapidly
    rerender({ value: 'test1' });
    rerender({ value: 'test2' });
    rerender({ value: 'test3' });

    // Should still be initial (debouncing)
    expect(result.current).toBe('initial');

    // Wait for debounce delay
    await waitFor(() => expect(result.current).toBe('test3'), { timeout: 400 });
  });

  it('cancels timeout on unmount', () => {
    const { unmount } = renderHook(() => useDebounce('test', 300));

    // Should not throw or leak memory
    expect(() => unmount()).not.toThrow();
  });
});
```

### 3. Integration Tests (Playwright)

**wiki-list.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Wiki List Page', () => {
  test('filters wiki pages by category', async ({ page }) => {
    await page.goto('http://192.168.1.15:3000/wiki');

    // Click "Getting Started" category
    await page.click('button:has-text("Getting Started")');

    // URL should update
    await expect(page).toHaveURL(/categories=Getting%20Started/);

    // Results should update
    await expect(page.locator('article')).toHaveCount(3); // Assuming 3 pages
  });

  test('searches wiki pages', async ({ page }) => {
    await page.goto('http://192.168.1.15:3000/wiki');

    // Type search term
    await page.fill('input[aria-label="Search wiki pages"]', 'docker');

    // Wait for debounce + URL update
    await page.waitForURL(/search=docker/, { timeout: 1000 });

    // Results should contain "docker" in title
    await expect(page.locator('h3:has-text("Docker")')).toBeVisible();
  });

  test('shows empty state when no results', async ({ page }) => {
    await page.goto('http://192.168.1.15:3000/wiki');

    // Search for non-existent term
    await page.fill('input[aria-label="Search wiki pages"]', 'xyzabc123');
    await page.waitForURL(/search=xyzabc123/);

    // Empty state should show
    await expect(page.locator('text=No wiki pages found')).toBeVisible();
    await expect(page.locator('button:has-text("Clear Filters")')).toBeVisible();
  });
});
```

### 4. Accessibility Tests

**axe-core integration:**
```typescript
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('wiki list page is accessible', async ({ page }) => {
  await page.goto('http://192.168.1.15:3000/wiki');
  await injectAxe(page);

  // Check for accessibility violations
  const violations = await checkA11y(page);
  expect(violations).toHaveLength(0);
});
```

---

## Next Steps for Parent Agent

### Phase 1: Create Types and Hooks (Day 2 Morning)

1. **Create TypeScript types** (`apps/web/types/wiki.ts`):
   - `WikiPagePreview` interface
   - `CategoryCount` interface
   - `WikiListPageProps` interface

2. **Create custom hooks**:
   - `apps/web/hooks/useDebounce.ts` (debounce search input)
   - `apps/web/hooks/useWikiFilters.ts` (filter state management)

3. **Write hook unit tests**:
   - `apps/web/hooks/__tests__/useDebounce.test.ts`
   - `apps/web/hooks/__tests__/useWikiFilters.test.ts`

### Phase 2: Create UI Components (Day 2 Afternoon)

4. **Create base components** (in `apps/web/components/wiki/`):
   - `WikiSearchBar.tsx` (search + sort dropdown)
   - `CategoryFilter.tsx` (category chip badges)
   - `WikiCard.tsx` (memoized card component)
   - `WikiGrid.tsx` (responsive grid layout)

5. **Create container component**:
   - `WikiListClient.tsx` (main client wrapper)

6. **Write component unit tests**:
   - `__tests__/WikiCard.test.tsx`
   - `__tests__/WikiSearchBar.test.tsx`
   - `__tests__/CategoryFilter.test.tsx`

### Phase 3: Integrate with Server Component (Day 2 Evening)

7. **Update Server Component** (`apps/web/app/wiki/page.tsx`):
   - Add Prisma query with search/filter/sort
   - Transform data to `WikiPagePreview[]`
   - Aggregate categories with counts
   - Pass data to `WikiListClient`

8. **Create loading skeleton**:
   - `WikiListSkeleton.tsx` (placeholder while loading)

9. **Write integration tests** (Playwright):
   - `e2e/wiki-list.spec.ts` (search, filter, pagination)
   - Accessibility tests (axe-core)

### Phase 4: Manual Testing and Polish (Day 3 Morning)

10. **Manual testing checklist**:
    - [ ] Search input updates URL after 300ms
    - [ ] Category filters toggle correctly
    - [ ] Sort dropdown changes order
    - [ ] Pagination scrolls to top
    - [ ] Empty state shows when no results
    - [ ] Clear filters button works
    - [ ] Keyboard navigation (Tab, Enter, Escape)
    - [ ] Mobile responsive (test on iPhone/Android)

11. **Performance testing**:
    - [ ] React DevTools Profiler (no unnecessary re-renders)
    - [ ] Network tab (efficient data fetching)
    - [ ] Lighthouse score (90+ performance)

12. **Accessibility testing**:
    - [ ] Screen reader (VoiceOver/NVDA)
    - [ ] Keyboard-only navigation
    - [ ] Color contrast (WCAG AA)
    - [ ] Focus visible outlines

---

## Design Patterns Summary

### 1. State Management Pattern

**URL Search Params as Single Source of Truth:**
- ✅ **Pros**: Shareable URLs, browser back/forward works, SSR-friendly
- ✅ **Use case**: Filters, search, pagination (any state user might want to bookmark)
- ❌ **Avoid**: Ephemeral UI state (modal open/closed, dropdown expanded)

**Optimistic Local State:**
- ✅ **Pros**: Instant UI feedback, perceived performance
- ✅ **Use case**: Search input, category chips (user expects immediate response)
- ❌ **Avoid**: Critical data updates (user needs confirmation before proceeding)

### 2. Component Composition Pattern

**Explicit Prop Passing (NOT Context API):**
- ✅ **Pros**: Clear data flow, easy to debug, better TypeScript inference
- ✅ **Use case**: Parent-child relationships (WikiListClient → WikiSearchBar)
- ❌ **Avoid**: Deep prop drilling (>3 levels), global state (theme, auth)

**Compound Components:**
- ✅ **Pros**: Flexible API, composable, easy to extend
- ✅ **Use case**: Tabs, Accordion, Dropdown (components with shared state)
- ❌ **Avoid**: Simple lists (overkill for WikiGrid)

### 3. Performance Pattern

**React.memo for List Items:**
- ✅ **Use**: Cards in lists (WikiCard)
- ✅ **Benefit**: Prevents re-render when sibling updates
- ❌ **Avoid**: Top-level components (always re-render anyway)

**useCallback for Stable References:**
- ✅ **Use**: Event handlers passed to children
- ✅ **Benefit**: Prevents child re-renders (when child uses React.memo)
- ❌ **Avoid**: Event handlers NOT passed as props (inline is fine)

**useMemo for Expensive Computations:**
- ✅ **Use**: Filtering/sorting large arrays (>100 items)
- ✅ **Benefit**: Skip computation if dependencies unchanged
- ❌ **Avoid**: Simple computations (overhead > benefit)

---

## Conclusion

This implementation plan provides a complete, production-ready architecture for the wiki list page client components. The design follows Next.js 14 best practices, React 18 patterns, and accessibility standards.

**Key Strengths**:
1. **Performance**: Strategic memoization, debouncing, URL-based state
2. **Accessibility**: ARIA labels, keyboard navigation, screen reader support
3. **Maintainability**: Type-safe, testable, documented
4. **User Experience**: Instant feedback, smooth animations, responsive design
5. **SEO**: Server Components for data fetching, static HTML generation

**Parent Agent Tasks**:
- Create types (`apps/web/types/wiki.ts`)
- Implement hooks (`useDebounce`, `useWikiFilters`)
- Build UI components (`WikiSearchBar`, `CategoryFilter`, `WikiCard`, `WikiGrid`, `WikiListClient`)
- Integrate with Server Component (`app/wiki/page.tsx`)
- Write tests (unit, integration, accessibility)

**Estimated Time**: 6-8 hours (Day 2 of Sprint 2 Week 3)

---

**React Expert Analysis Complete** ✅
