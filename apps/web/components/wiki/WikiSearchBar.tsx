/**
 * WikiSearchBar Component
 *
 * Combined search input + sort dropdown for wiki list page
 */

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

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title', label: 'Title (A-Z)' },
  { value: 'updated', label: 'Recently Updated' },
];

export function WikiSearchBar({ searchParams }: WikiSearchBarProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.search || '');
  const sortBy = searchParams.sort || 'newest';

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

  const handleClear = () => {
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
      e.currentTarget.blur();
    }
  };

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

      {/* Sort Dropdown */}
      <div className="flex items-center gap-3">
        <label htmlFor="wiki-sort" className="text-sm font-semibold text-slate">
          Sort by:
        </label>
        <select
          id="wiki-sort"
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="neu-pressed rounded-xl px-4 py-3 text-white focus:border-coral focus:ring-2 focus:ring-coral/20 bg-dark-pressed border-0"
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
