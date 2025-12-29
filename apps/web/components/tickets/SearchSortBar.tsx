/**
 * SearchSortBar Component
 *
 * Search input, sort dropdown, and view toggles for issues list
 * Reference: mockups/Default theme/02-issues-dark-neumorphic-coral.html lines 494-519
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, List, Grid3x3 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useProject } from '@/lib/project';

interface SearchSortBarProps {
  searchParams: Record<string, string | undefined>;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Sort: Newest' },
  { value: 'oldest', label: 'Sort: Oldest' },
  { value: 'priority', label: 'Sort: Priority' },
  { value: 'updated', label: 'Sort: Updated' },
];

export function SearchSortBar({ searchParams }: SearchSortBarProps) {
  const { updateSearchParams } = useProject();
  const isFirstRender = useRef(true);

  // Local state for search input (for immediate feedback)
  const [searchValue, setSearchValue] = useState(searchParams.search || '');

  // Debounced search value (update URL after 300ms)
  const debouncedSearch = useDebounce(searchValue, 300);

  // Update URL when debounced search changes
  useEffect(() => {
    // Skip on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debouncedSearch) {
      updateSearchParams({ search: debouncedSearch, page: null });
    } else {
      updateSearchParams({ search: null, page: null });
    }
  }, [debouncedSearch, updateSearchParams]);

  const handleSortChange = (sortValue: string) => {
    updateSearchParams({ sort: sortValue, page: null });
  };

  const currentSort = searchParams.sort || 'newest';

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-4">
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          {!searchValue && (
            <Search
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate"
              aria-hidden="true"
            />
          )}
          <input
            type="text"
            placeholder="     Search issues..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="neu-pressed smooth-transition w-full rounded-2xl py-3 pl-11 pr-4 text-white focus:outline-none"
          />
        </div>

        {/* Sort Dropdown */}
        <select
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="neu-pressed smooth-transition cursor-pointer rounded-2xl px-4 py-3 text-white hover:shadow-lg focus:outline-none"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* View Toggles */}
        <div className="flex gap-2">
          {/* List View (Active) */}
          <button
            className="coral-gradient smooth-transition flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
            aria-label="List view"
            aria-pressed="true"
          >
            <List className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Grid View (Inactive - Future Feature) */}
          <button
            className="neu-raised smooth-transition flex h-12 w-12 items-center justify-center rounded-2xl text-slate hover:text-white"
            aria-label="Grid view"
            aria-pressed="false"
            disabled
          >
            <Grid3x3 className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
