/**
 * useFilterParams Hook
 *
 * Custom hook for managing URL-based filter state in FilterSidebar.
 * Handles CSV parsing, updating, and clearing of filter parameters.
 *
 * Usage:
 * ```tsx
 * const { currentFilters, isActive, updateFilter, clearAllFilters, hasActiveFilters } =
 *   useFilterParams(searchParams);
 * ```
 *
 * @see apps/web/components/issues/FilterSidebar.tsx for usage
 */

'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

/**
 * Filter type discriminator
 * Sprint 11.7: Added 'label' for label filtering
 */
export type FilterType = 'kind' | 'status' | 'priority' | 'module' | 'label';

/**
 * Parsed filter values from URL params
 */
export interface CurrentFilters {
  kind: string[];
  status: string[];
  priority: string[];
  module: string[];
  label: string[]; // Sprint 11.7: Label IDs as strings
}

/**
 * Return type for useFilterParams hook
 */
export interface UseFilterParamsReturn {
  /**
   * Currently active filter values (parsed from URL)
   */
  currentFilters: CurrentFilters;

  /**
   * Check if a specific filter value is currently active
   *
   * @param filterType - Type of filter (kind, status, priority, module)
   * @param value - Value to check (e.g., "feature", "open", "high")
   * @returns {boolean} True if value is active
   */
  isActive: (filterType: FilterType, value: string) => boolean;

  /**
   * Update a filter (add or remove a value)
   *
   * @param filterType - Type of filter to update
   * @param value - Value to add/remove
   * @param checked - True to add, false to remove
   */
  updateFilter: (filterType: FilterType, value: string, checked: boolean) => void;

  /**
   * Clear all active filters
   */
  clearAllFilters: () => void;

  /**
   * Check if any filters are currently active
   */
  hasActiveFilters: boolean;
}

/**
 * Custom hook for managing filter URL parameters
 *
 * Parses CSV-formatted filter params from URL and provides helpers
 * for updating and clearing filters.
 *
 * @param searchParams - Search params from Server Component (issues/page.tsx)
 * @returns {UseFilterParamsReturn} Filter state and update functions
 *
 * @example
 * ```tsx
 * // In FilterSidebar component
 * const { currentFilters, isActive, updateFilter } = useFilterParams(searchParams);
 *
 * // Check if "open" status is active
 * const isOpenActive = isActive('status', 'open');
 *
 * // Update status filter
 * updateFilter('status', 'open', true); // Add "open"
 * updateFilter('status', 'closed', false); // Remove "closed"
 * ```
 */
export function useFilterParams(
  searchParams: Record<string, string | undefined>
): UseFilterParamsReturn {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const pathname = usePathname();

  /**
   * Parse current filter values from URL params
   * Memoized to avoid re-parsing on every render
   */
  const currentFilters = useMemo(
    (): CurrentFilters => ({
      kind: searchParams.kind?.split(',').filter(Boolean) || [],
      status: searchParams.status?.split(',').filter(Boolean) || [],
      priority: searchParams.priority?.split(',').filter(Boolean) || [],
      module: searchParams.module?.split(',').filter(Boolean) || [],
      label: searchParams.label?.split(',').filter(Boolean) || [], // Sprint 11.7
    }),
    [
      searchParams.kind,
      searchParams.status,
      searchParams.priority,
      searchParams.module,
      searchParams.label,
    ]
  );

  /**
   * Check if any filters are currently active
   */
  const hasActiveFilters = useMemo(
    () =>
      currentFilters.kind.length > 0 ||
      currentFilters.status.length > 0 ||
      currentFilters.priority.length > 0 ||
      currentFilters.module.length > 0 ||
      currentFilters.label.length > 0, // Sprint 11.7
    [currentFilters]
  );

  /**
   * Check if a specific filter value is active
   */
  const isActive = useCallback(
    (filterType: FilterType, value: string): boolean => {
      return currentFilters[filterType].includes(value);
    },
    [currentFilters]
  );

  /**
   * Update a filter parameter
   *
   * Handles adding/removing values from CSV list and updating URL.
   * Resets pagination to page 1 when filters change.
   */
  const updateFilter = useCallback(
    (filterType: FilterType, value: string, checked: boolean) => {
      // Create new URLSearchParams from current params
      const params = new URLSearchParams(currentSearchParams?.toString());

      // Get current values for this filter type
      const current = params.get(filterType)?.split(',').filter(Boolean) || [];

      // Add or remove the value
      let updated: string[];
      if (checked) {
        // Add value if not already present
        updated = current.includes(value) ? current : [...current, value];
      } else {
        // Remove value
        updated = current.filter((v) => v !== value);
      }

      // Update or delete the param
      if (updated.length > 0) {
        params.set(filterType, updated.join(','));
      } else {
        params.delete(filterType);
      }

      // Reset pagination when filters change
      params.delete('page');

      // Navigate to updated URL
      router.push(`${pathname}?${params.toString()}`);
    },
    [currentSearchParams, router, pathname]
  );

  /**
   * Clear all active filters
   *
   * Removes all filter params from URL while preserving other params (e.g., search query).
   */
  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(currentSearchParams?.toString());

    // Remove all filter params
    params.delete('kind');
    params.delete('status');
    params.delete('priority');
    params.delete('module');
    params.delete('label'); // Sprint 11.7

    // Reset pagination
    params.delete('page');

    // Navigate to cleaned URL
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }, [currentSearchParams, router, pathname]);

  return {
    currentFilters,
    isActive,
    updateFilter,
    clearAllFilters,
    hasActiveFilters,
  };
}
