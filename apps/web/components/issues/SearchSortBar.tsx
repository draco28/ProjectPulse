/**
 * SearchSortBar Component
 *
 * Search input, sort dropdown, and view toggles for issues list
 * Reference: mockups/Default theme/02-issues-dark-neumorphic-coral.html lines 494-519
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, List, Grid } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

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
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  // Local state for search input (for immediate feedback)
  const [searchValue, setSearchValue] = useState(searchParams.search || '');

  // Debounced search value (update URL after 300ms)
  const debouncedSearch = useDebounce(searchValue, 300);

  // Update URL when debounced search changes
  useEffect(() => {
    const params = new URLSearchParams(currentSearchParams?.toString());

    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    } else {
      params.delete('search');
    }

    // Reset to page 1 when search changes
    params.delete('page');

    router.push(`/issues?${params.toString()}`);
  }, [debouncedSearch, currentSearchParams, router]);

  const handleSortChange = (sortValue: string) => {
    const params = new URLSearchParams(currentSearchParams?.toString());
    params.set('sort', sortValue);
    params.delete('page');

    router.push(`/issues?${params.toString()}`);
  };

  const currentSort = searchParams.sort || 'newest';

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-4">
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate" />
          <input
            type="text"
            placeholder="Search issues..."
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
          <button className="coral-gradient smooth-transition flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg">
            <List className="h-5 w-5" />
          </button>

          {/* Grid View (Inactive - Future Feature) */}
          <button className="neu-raised smooth-transition flex h-12 w-12 items-center justify-center rounded-2xl text-slate hover:text-white">
            <Grid className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
