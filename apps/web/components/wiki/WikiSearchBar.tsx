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

  // Track previous search to detect actual changes
  const [prevSearch, setPrevSearch] = useState(searchParams.search || '');

  // Debounced search (300ms delay)
  // Sprint 14: Only run when search actually changes, not on every URL change (Ticket #21)
  useEffect(() => {
    // Skip if search hasn't actually changed (prevents pagination reset)
    if (search === prevSearch) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams(currentSearchParams?.toString());

      if (search) {
        params.set('search', search);
      } else {
        params.delete('search');
      }

      // Reset to page 1 when searching (only when search actually changed)
      params.delete('page');

      setPrevSearch(search);
      router.push(`/wiki?${params.toString()}`);
    }, 300);

    return () => clearTimeout(handler);
  }, [search, prevSearch, router, currentSearchParams]);

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
        {!search && (
          <Search
            className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate"
            aria-hidden="true"
          />
        )}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="     Search wiki pages..."
          className="neu-pressed w-full rounded-xl border-0 bg-dark-pressed py-3 pl-12 pr-12 text-white placeholder-slate focus:border-coral focus:ring-2 focus:ring-coral/20"
          aria-label="Search wiki pages"
        />
        {search && (
          <button
            onClick={handleClear}
            className="smooth-transition absolute inset-y-0 right-4 flex items-center text-slate hover:text-white"
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
          className="neu-pressed rounded-xl border-0 bg-dark-pressed px-4 py-3 text-white focus:border-coral focus:ring-2 focus:ring-coral/20"
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
