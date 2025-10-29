# React Implementation Plan: FilterSidebar Dynamic Options Refactor

**Created**: 2025-10-29 17:17
**Type**: Component Refactor (Client Component)
**Phase**: Week 15 Phase 4 - Dynamic Issue Filters
**Consultant**: react-expert

---

## Executive Summary

This plan provides the React component architecture for refactoring FilterSidebar from hardcoded filter options to DB-driven dynamic options. The component will remain a Client Component but accept dynamic options via props while maintaining existing URL state management and count badge functionality.

**Key Decisions**:

1. **Props Structure**: Flat, typed interface with separate option arrays
2. **URL State Management**: Custom hook `useFilterParams` to encapsulate CSV param logic
3. **Color Class Binding**: Safe dynamic className using template literals (Tailwind safelist)
4. **Performance**: Selective memoization (only option rendering, not entire component)
5. **Accessibility**: Enhanced keyboard nav and ARIA attributes

---

## Component Architecture

### Component Tree

```
issues/page.tsx (Server Component)
└── FilterSidebar (Client Component)
    ├── useFilterParams() - Custom hook for URL state
    ├── FilterSection (Status)
    │   └── FilterOption × N (memoized)
    ├── FilterSection (Priority)
    │   └── FilterOption × N (memoized)
    └── FilterSection (Module)
        └── FilterOption × N (memoized)
```

### State Management

**Local State (Component)**:

- None needed - URL params are source of truth
- Checkboxes read from URL via `useFilterParams` hook

**Derived State**:

- `currentStatus`, `currentPriority`, `currentModule` - Parsed from URL (computed in hook)
- `hasActiveFilters` - Boolean flag for "Clear All" button visibility

**Shared State**:

- URL search params (via Next.js router)

**Context**:

- Not needed for this component (isolated filtering logic)

---

## 1. Props Design

### Recommended Props Structure

**Optimal approach**: Flat, typed interface with separate arrays

```typescript
// types/filters.ts
export interface StatusOption {
  value: string;
  label: string;
  colorClass?: string; // e.g., "bg-green-500"
}

export interface PriorityOption {
  value: string;
  label: string;
  dotColorClass?: string; // e.g., "bg-red-500"
  badgeColorClass?: string; // e.g., "bg-red-500"
}

export interface ModuleOption {
  value: string;
  label: string;
}

export interface FiltersDTO {
  status: StatusOption[];
  priority: PriorityOption[];
  modules: ModuleOption[];
  labels: { id: string; name: string; color: string }[]; // Future use
}

// Component props
interface FilterSidebarProps {
  options: FiltersDTO;
  counts: FilterCounts; // Existing shape
  searchParams: Record<string, string | undefined>; // From Next.js page
}
```

**Why flat structure?**

- ✅ TypeScript autocomplete for each option type
- ✅ Easy to access specific arrays (`options.status`, `options.priority`)
- ✅ Matches API response shape (no transformation needed)
- ✅ Future-proof (can add labels without restructuring)

**Why not nested/grouped?**

- ❌ `options.filters.status` is more verbose
- ❌ Doesn't match natural API response structure
- ❌ Harder to destructure in component

**Performance Considerations**:

- Props are passed from Server Component (stable reference)
- Options change rarely (cached 1 hour) → minimal re-renders
- Counts change on every page load → expected re-render trigger
- No need to memoize props object (Server Component creates fresh on each request anyway)

---

## 2. URL State Management

### Current Implementation Analysis

**Existing pattern** (lines 42-76):

```typescript
const router = useRouter();
const currentSearchParams = useSearchParams();

// Parse current filters
const currentStatus = searchParams.status?.split(',').filter(Boolean) || [];

// Update filter
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
```

**Issues with current approach**:

- ❌ Repetitive parsing logic across 3 filter types
- ❌ `updateFilter` is recreated on every render (no useCallback)
- ❌ Couples parsing and updating logic
- ⚠️ Could benefit from abstraction for reusability

### Recommended Pattern: Custom Hook

**Create `useFilterParams` hook** (new file: `hooks/useFilterParams.ts`):

```typescript
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

type FilterType = 'status' | 'priority' | 'module';

interface UseFilterParamsReturn {
  // Current filter values (parsed from URL)
  currentFilters: {
    status: string[];
    priority: string[];
    module: string[];
  };

  // Check if a specific value is active
  isActive: (filterType: FilterType, value: string) => boolean;

  // Update a filter (add/remove value)
  updateFilter: (filterType: FilterType, value: string, checked: boolean) => void;

  // Clear all filters
  clearAllFilters: () => void;

  // Check if any filters are active
  hasActiveFilters: boolean;
}

export function useFilterParams(
  searchParams: Record<string, string | undefined>
): UseFilterParamsReturn {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  // Parse current filter values (memoized)
  const currentFilters = useMemo(
    () => ({
      status: searchParams.status?.split(',').filter(Boolean) || [],
      priority: searchParams.priority?.split(',').filter(Boolean) || [],
      module: searchParams.module?.split(',').filter(Boolean) || [],
    }),
    [searchParams.status, searchParams.priority, searchParams.module]
  );

  // Check if a value is active
  const isActive = useCallback(
    (filterType: FilterType, value: string) => {
      return currentFilters[filterType].includes(value);
    },
    [currentFilters]
  );

  // Update filter (add or remove value)
  const updateFilter = useCallback(
    (filterType: FilterType, value: string, checked: boolean) => {
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

      // Reset pagination when filters change
      params.delete('page');

      router.push(`/issues?${params.toString()}`);
    },
    [currentSearchParams, router]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(currentSearchParams?.toString());
    params.delete('status');
    params.delete('priority');
    params.delete('module');
    params.delete('page');

    router.push(`/issues?${params.toString()}`);
  }, [currentSearchParams, router]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(
    () =>
      currentFilters.status.length > 0 ||
      currentFilters.priority.length > 0 ||
      currentFilters.module.length > 0,
    [currentFilters]
  );

  return {
    currentFilters,
    isActive,
    updateFilter,
    clearAllFilters,
    hasActiveFilters,
  };
}
```

**Usage in FilterSidebar**:

```typescript
export function FilterSidebar({ options, counts, searchParams }: FilterSidebarProps) {
  const { currentFilters, isActive, updateFilter, clearAllFilters, hasActiveFilters } =
    useFilterParams(searchParams);

  return (
    <div className="flex w-72 flex-col gap-4 overflow-auto">
      <div className="neu-raised smooth-transition rounded-3xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="smooth-transition hover:text-coralLight text-xs font-semibold text-coral"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Status Filter */}
        <FilterSection
          title="Status"
          icon="fa-circle-notch"
          options={options.status}
          counts={counts.status}
          currentValues={currentFilters.status}
          onToggle={(value, checked) => updateFilter('status', value, checked)}
        />

        {/* Similar for Priority and Module... */}
      </div>
    </div>
  );
}
```

**Benefits**:

- ✅ Encapsulates URL parsing and updating logic
- ✅ Stable function references via `useCallback` (prevents child re-renders)
- ✅ Testable in isolation (mock router/searchParams)
- ✅ Reusable across other filter components
- ✅ Single source of truth for filter state

**Debouncing**:

- ❌ **NOT recommended** for this use case
- Filters should update immediately (user expects instant feedback)
- URL updates are fast (client-side navigation)
- Server Component re-fetches data on URL change (expected behavior)

**Alternative**: If debouncing is needed later (e.g., search input), use separate hook:

```typescript
const debouncedUpdateFilter = useMemo(() => debounce(updateFilter, 300), [updateFilter]);
```

---

## 3. Color Class Binding

### Current Implementation

**Hardcoded classes** (lines 130-134):

```typescript
<span
  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
    count > 0 && isChecked
      ? `${option.color} text-white`
      : 'neu-pressed text-slate'
  }`}
>
  {count}
</span>
```

### Recommended Approach: Template Literals with Safelist

**Dynamic className binding** (safe with Tailwind JIT):

```typescript
// Status badge
<span
  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
    count > 0 && isChecked && option.colorClass
      ? `${option.colorClass} text-white`
      : 'neu-pressed text-slate'
  }`}
>
  {count}
</span>

// Priority dot
<span className={`h-2 w-2 rounded-full ${option.dotColorClass || 'bg-gray-500'}`} />

// Priority badge
<span
  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
    count > 0 && isChecked && option.badgeColorClass
      ? `${option.badgeColorClass} text-white`
      : 'neu-pressed text-slate'
  }`}
>
  {count}
</span>
```

**Is this safe with Tailwind JIT?**

✅ **YES**, if classes are in **safelist** or used elsewhere in codebase

**Why it works**:

- Tailwind JIT scans files for class names at build time
- String interpolation `${option.colorClass}` is **detected** if:
  1. Class exists in safelist
  2. Class is used in other files (e.g., seed data with `bg-green-500` literal)
  3. Class is in content paths scanned by Tailwind

**Safelist Configuration** (recommended):

```typescript
// tailwind.config.ts
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './types/**/*.{ts}', // Scan types for color class constants
  ],
  safelist: [
    // Status colors
    'bg-green-500',
    'bg-yellow-500',

    // Priority colors
    'bg-red-500',
    'bg-orange-400',
    'bg-blue-400',

    // Text colors
    'text-green-600',
    'text-yellow-600',
    'text-red-800',
    'text-orange-800',

    // Badge backgrounds
    'bg-red-100',
    'bg-orange-100',
    'bg-yellow-100',
    'bg-gray-100',
  ],
  // ...
};
```

**Alternative**: Use `clsx` for conditional classes (optional, no real benefit here):

```typescript
import clsx from 'clsx';

<span
  className={clsx(
    'rounded-full px-2.5 py-1 text-xs font-semibold',
    count > 0 && isChecked && option.colorClass
      ? [option.colorClass, 'text-white']
      : ['neu-pressed', 'text-slate']
  )}
>
  {count}
</span>
```

**Recommendation**: Stick with template literals (simpler, no extra dependency)

**CSS Purging Concerns**:

- ⚠️ **Production builds** may purge unused classes
- ✅ **Mitigation**: Add all DB-seeded color classes to safelist
- ✅ **Future-proof**: Document safelist in seed file comments

```typescript
// prisma/seed/filterOptions.ts
/**
 * IMPORTANT: Color classes used here must be added to tailwind.config.ts safelist
 * to prevent purging in production builds.
 *
 * Current classes:
 * - Status: bg-green-500, bg-yellow-500, neu-pressed
 * - Priority: bg-red-500, bg-orange-400, bg-blue-400, etc.
 */
const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', colorClass: 'bg-green-500' },
  // ...
];
```

---

## 4. Performance Optimization

### Re-Render Triggers

**FilterSidebar will re-render when**:

1. ✅ **URL params change** (expected - user clicked filter)
2. ✅ **Counts update** (expected - new page load from Server Component)
3. ❌ **Options change** (rare - cached 1 hour, only if admin edits)

### Optimization Strategy: Selective Memoization

**DO NOT memoize the entire FilterSidebar component**:

- ❌ `React.memo(FilterSidebar)` would prevent necessary re-renders
- Counts and URL params SHOULD trigger re-renders (that's the point!)
- Parent (Server Component) creates new props on each request anyway

**DO memoize individual filter option rendering**:

```typescript
// Memoized filter option component
const FilterOption = React.memo(function FilterOption({
  option,
  count,
  isChecked,
  onToggle,
  renderBadge,
}: {
  option: StatusOption | PriorityOption | ModuleOption;
  count: number;
  isChecked: boolean;
  onToggle: (value: string, checked: boolean) => void;
  renderBadge?: (option: any, count: number, isChecked: boolean) => React.ReactNode;
}) {
  return (
    <label className="smooth-transition group flex cursor-pointer items-center gap-3 text-slate hover:text-white">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => onToggle(option.value, e.target.checked)}
      />
      <span className="flex-1">{option.label}</span>
      {renderBadge ? renderBadge(option, count, isChecked) : (
        <span className="neu-pressed rounded-full px-2.5 py-1 text-xs font-semibold text-slate">
          {count}
        </span>
      )}
    </label>
  );
});
```

**Use useMemo for computed values** (already in `useFilterParams`):

```typescript
// ✅ Already memoized in hook
const currentFilters = useMemo(
  () => ({
    status: searchParams.status?.split(',').filter(Boolean) || [],
    priority: searchParams.priority?.split(',').filter(Boolean) || [],
    module: searchParams.module?.split(',').filter(Boolean) || [],
  }),
  [searchParams.status, searchParams.priority, searchParams.module]
);

const hasActiveFilters = useMemo(
  () =>
    currentFilters.status.length > 0 ||
    currentFilters.priority.length > 0 ||
    currentFilters.module.length > 0,
  [currentFilters]
);
```

**Use useCallback for event handlers** (already in `useFilterParams`):

```typescript
// ✅ Already memoized in hook
const updateFilter = useCallback(
  (filterType: FilterType, value: string, checked: boolean) => {
    // ...
  },
  [currentSearchParams, router]
);
```

**Avoid over-optimization**:

- ❌ Don't memoize `options.status.map(...)` (array is already stable from Server Component)
- ❌ Don't memoize simple comparisons (`isActive` check)
- ❌ Don't use `useMemo` for cheap operations (<5ms)

### Performance Measurement

**Before optimizing**, measure with React DevTools Profiler:

```typescript
// Add profiling in development
if (process.env.NODE_ENV === 'development') {
  console.time('FilterSidebar render');
}

return (
  <div className="flex w-72 flex-col gap-4 overflow-auto">
    {/* ... */}
  </div>
);

if (process.env.NODE_ENV === 'development') {
  console.timeEnd('FilterSidebar render');
}
```

**Expected results**:

- First render: ~10-20ms (acceptable)
- Re-render on filter click: ~5-10ms (acceptable)
- Re-render on counts update: ~5-10ms (acceptable)

**If >50ms**: Consider virtualizing option lists (unlikely with <10 options per filter)

---

## 5. Accessibility & UX

### Current Accessibility Issues

1. **Missing ARIA labels** on checkboxes
2. **No keyboard shortcuts** for common actions (Clear All)
3. **No focus management** after filter updates
4. **Missing role attributes** for filter sections

### Recommended Improvements

**1. ARIA Labels and Roles**:

```typescript
<div className="flex w-72 flex-col gap-4 overflow-auto" role="complementary" aria-label="Filter sidebar">
  <div className="neu-raised smooth-transition rounded-3xl p-6">
    {/* Header */}
    <div className="mb-6 flex items-center justify-between">
      <h3 id="filters-heading" className="text-sm font-bold uppercase tracking-wider text-white">
        Filters
      </h3>
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="smooth-transition hover:text-coralLight text-xs font-semibold text-coral"
          aria-label="Clear all active filters"
        >
          Clear All
        </button>
      )}
    </div>

    {/* Status Filter */}
    <fieldset className="mb-6" aria-labelledby="status-filter-heading">
      <legend id="status-filter-heading" className="mb-3 flex items-center gap-2 font-semibold text-white">
        <i className="fas fa-circle-notch text-sm text-coral" aria-hidden="true"></i>
        Status
      </legend>
      <div className="space-y-3" role="group">
        {options.status.map((option) => {
          const count = counts.status[option.value] || 0;
          const isChecked = isActive('status', option.value);

          return (
            <label
              key={option.value}
              className="smooth-transition group flex cursor-pointer items-center gap-3 text-slate hover:text-white"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => updateFilter('status', option.value, e.target.checked)}
                aria-label={`Filter by ${option.label} status (${count} issues)`}
              />
              <span className="flex-1">{option.label}</span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  count > 0 && isChecked && option.colorClass
                    ? `${option.colorClass} text-white`
                    : 'neu-pressed text-slate'
                }`}
                aria-label={`${count} issues`}
              >
                {count}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  </div>
</div>
```

**2. Keyboard Navigation**:

```typescript
// Add keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Escape to clear all filters
    if (e.key === 'Escape' && hasActiveFilters) {
      e.preventDefault();
      clearAllFilters();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [hasActiveFilters, clearAllFilters]);
```

**3. Focus Management** (after filter update):

```typescript
const updateFilter = useCallback(
  (filterType: FilterType, value: string, checked: boolean) => {
    // ... existing logic ...
    router.push(`/issues?${params.toString()}`);

    // Announce change to screen readers
    const announcement = checked
      ? `${value} filter applied`
      : `${value} filter removed`;

    // Use live region for announcement (add to component)
    setLiveAnnouncement(announcement);
  },
  [currentSearchParams, router]
);

// In component:
const [liveAnnouncement, setLiveAnnouncement] = useState('');

return (
  <>
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {liveAnnouncement}
    </div>

    <div className="flex w-72 flex-col gap-4 overflow-auto">
      {/* ... */}
    </div>
  </>
);
```

**4. Loading State** (optional, for better UX):

```typescript
const [isUpdating, setIsUpdating] = useState(false);

const updateFilter = useCallback(
  (filterType: FilterType, value: string, checked: boolean) => {
    setIsUpdating(true);

    // ... existing logic ...
    router.push(`/issues?${params.toString()}`);

    // Reset after navigation (Next.js handles this automatically)
    // But we can add visual feedback during transition
  },
  [currentSearchParams, router]
);

// Add loading indicator
{isUpdating && (
  <div className="absolute inset-0 bg-deepDarkBg/50 flex items-center justify-center">
    <i className="fas fa-spinner fa-spin text-coral"></i>
  </div>
)}
```

### Accessibility Checklist

- [x] **Semantic HTML**: Use `<fieldset>`, `<legend>`, `<label>` correctly
- [x] **ARIA labels**: Descriptive labels for all interactive elements
- [x] **Keyboard navigation**: Tab order, Escape to clear
- [x] **Focus management**: Logical focus flow, visible focus indicators
- [x] **Screen reader support**: Live regions for filter changes
- [x] **Color contrast**: Ensure badge colors meet WCAG AA (4.5:1 ratio)
- [x] **Touch targets**: Min 44×44px for mobile (checkboxes + labels)

---

## TypeScript Types

### Complete Type Definitions

```typescript
// types/filters.ts

/**
 * Status filter option from DB
 */
export interface StatusOption {
  value: string; // e.g., "open", "in_progress", "closed"
  label: string; // e.g., "Open", "In Progress", "Closed"
  colorClass?: string; // Tailwind class, e.g., "bg-green-500"
}

/**
 * Priority filter option from DB
 */
export interface PriorityOption {
  value: string; // e.g., "critical", "high", "medium", "low"
  label: string; // e.g., "Critical", "High", "Medium", "Low"
  dotColorClass?: string; // Tailwind class for priority dot, e.g., "bg-red-500"
  badgeColorClass?: string; // Tailwind class for badge, e.g., "bg-red-100 text-red-800"
}

/**
 * Module filter option from DB
 */
export interface ModuleOption {
  value: string; // e.g., "combat", "animation", "core", "ui"
  label: string; // e.g., "Combat", "Animation", "Core", "UI"
}

/**
 * Complete filter options DTO returned by API
 */
export interface FiltersDTO {
  status: StatusOption[];
  priority: PriorityOption[];
  modules: ModuleOption[];
  labels: { id: string; name: string; color: string }[]; // Future use
}

/**
 * Filter counts by value (computed from Issue data)
 */
export interface FilterCounts {
  status: Record<string, number>; // e.g., { open: 5, in_progress: 3, closed: 10 }
  priority: Record<string, number>; // e.g., { critical: 2, high: 5, medium: 8, low: 3 }
  module: Record<string, number>; // e.g., { Combat: 4, Animation: 6, Core: 2, UI: 5 }
}

/**
 * FilterSidebar component props
 */
export interface FilterSidebarProps {
  options: FiltersDTO;
  counts: FilterCounts;
  searchParams: Record<string, string | undefined>; // From Next.js page
}

/**
 * Filter type (used by useFilterParams hook)
 */
export type FilterType = 'status' | 'priority' | 'module';

/**
 * useFilterParams hook return type
 */
export interface UseFilterParamsReturn {
  currentFilters: {
    status: string[];
    priority: string[];
    module: string[];
  };
  isActive: (filterType: FilterType, value: string) => boolean;
  updateFilter: (filterType: FilterType, value: string, checked: boolean) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}
```

---

## Implementation Steps for Parent Agent

### Step 1: Create Custom Hook

**File**: `apps/web/hooks/useFilterParams.ts`

```typescript
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

type FilterType = 'status' | 'priority' | 'module';

interface UseFilterParamsReturn {
  currentFilters: {
    status: string[];
    priority: string[];
    module: string[];
  };
  isActive: (filterType: FilterType, value: string) => boolean;
  updateFilter: (filterType: FilterType, value: string, checked: boolean) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}

export function useFilterParams(
  searchParams: Record<string, string | undefined>
): UseFilterParamsReturn {
  // Implementation from section 2 above
}
```

### Step 2: Update FilterSidebar Component

**File**: `apps/web/components/issues/FilterSidebar.tsx`

**Changes**:

1. Import `FiltersDTO` type and `useFilterParams` hook
2. Update props interface to accept `options: FiltersDTO`
3. Replace hardcoded arrays with `options.status`, `options.priority`, `options.modules`
4. Use `useFilterParams` hook instead of inline logic
5. Bind color classes from options dynamically
6. Add accessibility improvements (ARIA labels, keyboard shortcuts)

**Diff preview**:

```diff
- const STATUS_OPTIONS = [...]
- const PRIORITY_OPTIONS = [...]
- const MODULE_OPTIONS = [...]

+ import { useFilterParams } from '@/hooks/useFilterParams';
+ import type { FiltersDTO, FilterCounts } from '@/types/filters';

  interface FilterSidebarProps {
+   options: FiltersDTO;
    counts: FilterCounts;
    searchParams: Record<string, string | undefined>;
  }

- export function FilterSidebar({ counts, searchParams }: FilterSidebarProps) {
+ export function FilterSidebar({ options, counts, searchParams }: FilterSidebarProps) {
-   const router = useRouter();
-   const currentSearchParams = useSearchParams();
-   const currentStatus = searchParams.status?.split(',').filter(Boolean) || [];
-   // ... more parsing logic

+   const { currentFilters, isActive, updateFilter, clearAllFilters, hasActiveFilters } =
+     useFilterParams(searchParams);

    return (
-     <div className="flex w-72 flex-col gap-4 overflow-auto">
+     <div className="flex w-72 flex-col gap-4 overflow-auto" role="complementary" aria-label="Filter sidebar">
        {/* ... */}
-       {STATUS_OPTIONS.map((option) => {
+       {options.status.map((option) => {
-         const isChecked = currentStatus.includes(option.value);
+         const isChecked = isActive('status', option.value);
          // ...
```

### Step 3: Update issues/page.tsx

**File**: `apps/web/app/issues/page.tsx`

**Changes**:

1. Fetch filter options (via Prisma or API)
2. Pass `options` prop to FilterSidebar

```typescript
// In issues/page.tsx (Server Component)
import { prisma } from '@/lib/prisma';
import type { FiltersDTO } from '@/types/filters';

async function getFilterOptions(): Promise<FiltersDTO> {
  const [status, priority, modules, labels] = await Promise.all([
    prisma.issueStatusOption.findMany({ orderBy: { order: 'asc' } }),
    prisma.issuePriorityOption.findMany({ orderBy: { order: 'asc' } }),
    prisma.issueModuleOption.findMany({ orderBy: { order: 'asc' } }),
    prisma.label.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return {
    status,
    priority,
    modules,
    labels: labels.map(l => ({ id: l.id, name: l.name, color: l.color })),
  };
}

export default async function IssuesPage({ searchParams }: PageProps) {
  const options = await getFilterOptions();
  const counts = await computeFilterCounts(); // Existing function

  return (
    <div className="flex gap-6">
      <FilterSidebar
        options={options}
        counts={counts}
        searchParams={searchParams}
      />
      {/* ... */}
    </div>
  );
}
```

### Step 4: Add Tailwind Safelist

**File**: `tailwind.config.ts`

```typescript
export default {
  // ...
  safelist: [
    // Status colors
    'bg-green-500',
    'bg-yellow-500',

    // Priority colors
    'bg-red-500',
    'bg-orange-400',
    'bg-blue-400',
    'bg-slate',

    // Text colors
    'text-green-600',
    'text-yellow-600',

    // Badge backgrounds
    'bg-red-100',
    'bg-orange-100',
    'bg-yellow-100',
    'bg-gray-100',

    // Badge text colors
    'text-red-800',
    'text-orange-800',
    'text-yellow-800',
    'text-gray-800',
  ],
  // ...
};
```

### Step 5: Add Tests

**Component tests** (`FilterSidebar.test.tsx`):

1. Renders dynamic options from props
2. Updates URL params when filter toggled
3. Applies color classes correctly
4. Clear All resets filters
5. Keyboard shortcuts work (Escape)

**Hook tests** (`useFilterParams.test.ts`):

1. Parses URL params correctly
2. `isActive` returns correct boolean
3. `updateFilter` updates URL correctly
4. `clearAllFilters` removes all filter params
5. `hasActiveFilters` computes correctly

---

## Testing Recommendations

### Unit Tests (Jest + RTL)

**File**: `apps/web/hooks/__tests__/useFilterParams.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { useFilterParams } from '../useFilterParams';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('useFilterParams', () => {
  it('parses URL params correctly', () => {
    const searchParams = {
      status: 'open,in_progress',
      priority: 'high',
      module: 'Combat',
    };

    const { result } = renderHook(() => useFilterParams(searchParams));

    expect(result.current.currentFilters).toEqual({
      status: ['open', 'in_progress'],
      priority: ['high'],
      module: ['Combat'],
    });
  });

  it('isActive returns true for active filters', () => {
    const searchParams = { status: 'open' };
    const { result } = renderHook(() => useFilterParams(searchParams));

    expect(result.current.isActive('status', 'open')).toBe(true);
    expect(result.current.isActive('status', 'closed')).toBe(false);
  });

  // ... more tests
});
```

**File**: `apps/web/components/issues/__tests__/FilterSidebar.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterSidebar } from '../FilterSidebar';
import type { FiltersDTO, FilterCounts } from '@/types/filters';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('FilterSidebar', () => {
  const mockOptions: FiltersDTO = {
    status: [
      { value: 'open', label: 'Open', colorClass: 'bg-green-500' },
      { value: 'closed', label: 'Closed', colorClass: 'bg-gray-500' },
    ],
    priority: [
      { value: 'high', label: 'High', dotColorClass: 'bg-red-500', badgeColorClass: 'bg-red-100 text-red-800' },
    ],
    modules: [
      { value: 'Combat', label: 'Combat' },
    ],
    labels: [],
  };

  const mockCounts: FilterCounts = {
    status: { open: 5, closed: 10 },
    priority: { high: 3 },
    module: { Combat: 4 },
  };

  it('renders dynamic options with counts', () => {
    render(<FilterSidebar options={mockOptions} counts={mockCounts} searchParams={{}} />);

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // count badge
  });

  it('applies color classes correctly', () => {
    render(<FilterSidebar options={mockOptions} counts={mockCounts} searchParams={{ status: 'open' }} />);

    const badge = screen.getByText('5').closest('span');
    expect(badge).toHaveClass('bg-green-500');
  });

  // ... more tests
});
```

### Component Test Checklist

- [ ] Renders all option types (status, priority, module)
- [ ] Displays correct counts for each option
- [ ] Applies color classes dynamically from options
- [ ] Checkbox checked state reflects URL params
- [ ] Clicking checkbox updates URL
- [ ] "Clear All" button removes all filters
- [ ] "Clear All" button hidden when no filters active
- [ ] Keyboard shortcut (Escape) clears filters
- [ ] ARIA labels present and correct
- [ ] Screen reader announcements work

### E2E Test Checklist

- [ ] Applying filter updates results list
- [ ] Filter updates URL params correctly
- [ ] Multiple filters combined correctly (AND logic)
- [ ] Count badges reflect actual issue counts
- [ ] Pagination resets when filter changes
- [ ] Browser back button restores previous filters
- [ ] Direct URL navigation with filters works

---

## Performance Considerations Summary

### Optimization Strategy

1. **Custom hook** (`useFilterParams`):
   - ✅ Memoize parsed filter values
   - ✅ Use `useCallback` for event handlers
   - ✅ Avoid recreating functions on every render

2. **Component rendering**:
   - ❌ Don't memoize entire FilterSidebar (counts SHOULD trigger re-renders)
   - ✅ Consider memoizing individual filter options (if >20 options per filter)
   - ✅ Use stable keys (`option.value`) in `.map()`

3. **Color classes**:
   - ✅ Dynamic className is safe (classes in safelist)
   - ✅ Template literals are fine (no performance impact)
   - ❌ Don't use inline styles (breaks Tailwind purging)

4. **URL updates**:
   - ✅ Immediate updates (no debouncing needed)
   - ✅ Next.js handles client-side navigation efficiently
   - ✅ Server Component refetches data automatically

### Performance Metrics

**Expected render times**:

- First render: <20ms
- Re-render on filter click: <10ms
- Re-render on counts update: <10ms

**If >50ms**: Investigate with React DevTools Profiler

---

## Next Steps for Parent Agent

### Implementation Sequence

1. **Create custom hook** (`useFilterParams.ts`)
   - Implement hook with memoization
   - Export types

2. **Update FilterSidebar component**
   - Add `options` prop
   - Replace hardcoded arrays with dynamic options
   - Use `useFilterParams` hook
   - Add accessibility improvements

3. **Update issues/page.tsx**
   - Fetch filter options
   - Pass to FilterSidebar

4. **Add Tailwind safelist**
   - Document classes in config
   - Add comment linking to seed file

5. **Write tests**
   - Hook tests (useFilterParams)
   - Component tests (FilterSidebar)
   - E2E tests (issues filters)

6. **Verify**
   - All tests pass
   - Accessibility audit (axe DevTools)
   - Visual regression check
   - Performance profiling

---

## Summary for Parent Agent

**Key Architectural Decisions**:

1. **Props Design**: Flat `FiltersDTO` structure with typed option arrays → Easy access, matches API shape
2. **URL State Management**: Custom `useFilterParams` hook → Encapsulates CSV parsing/updating, stable references
3. **Color Classes**: Template literals with Tailwind safelist → Safe dynamic binding, no purging issues
4. **Performance**: Selective memoization (hook internals only) → No over-optimization, re-renders when expected
5. **Accessibility**: ARIA labels, keyboard shortcuts, screen reader support → WCAG AA compliance

**Files to Create/Modify**:

- `apps/web/hooks/useFilterParams.ts` (new)
- `apps/web/components/issues/FilterSidebar.tsx` (modify)
- `apps/web/app/issues/page.tsx` (modify)
- `tailwind.config.ts` (modify safelist)
- Test files (new)

**No Blockers**: All patterns are standard React + Next.js. TypeScript types align with Prisma models. Performance is optimal without over-engineering.

**Recommendation**: Proceed with implementation per steps above. Test thoroughly with RTL + Playwright. Verify color classes in production build.
