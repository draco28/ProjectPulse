'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Brain, Type, Wand2, Info } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useProject } from '@/lib/project';

interface SearchBarProps {
  initialSearch?: string;
}

export function SearchBar({ initialSearch = '' }: SearchBarProps) {
  const { updateSearchParams } = useProject();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchMode, setSearchMode] = useState(
    searchParams?.get('mode') || 'hybrid' // Read from URL or default to hybrid
  );

  // Debounce search query (300ms delay)
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearch) {
      updateSearchParams({ search: debouncedSearch, page: null });
    } else {
      updateSearchParams({ search: null, page: null });
    }
  }, [debouncedSearch, updateSearchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleModeChange = (mode: string) => {
    setSearchMode(mode);
    updateSearchParams({ mode });
  };

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      {/* Search Input */}
      <div className="relative mb-4">
        <Search
          className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search knowledge base... (Try: 'FSM state machine patterns')"
          value={searchQuery}
          onChange={handleSearchChange}
          className="neu-pressed smooth-transition w-full rounded-2xl py-4 pl-14 pr-4 text-lg text-white focus:outline-none"
        />
      </div>

      {/* Search Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => handleModeChange('hybrid')}
            className={`smooth-transition flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
              searchMode === 'hybrid'
                ? 'coral-gradient text-white shadow-lg'
                : 'neu-raised text-slate hover:text-white'
            }`}
          >
            <Brain className="h-4 w-4" aria-hidden="true" />
            Hybrid Search
          </button>
          <button
            onClick={() => handleModeChange('fulltext')}
            className={`smooth-transition flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
              searchMode === 'fulltext'
                ? 'coral-gradient text-white shadow-lg'
                : 'neu-raised text-slate hover:text-white'
            }`}
          >
            <Type className="h-4 w-4" aria-hidden="true" />
            Full-Text Only
          </button>
          <button
            onClick={() => handleModeChange('semantic')}
            className={`smooth-transition flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
              searchMode === 'semantic'
                ? 'coral-gradient text-white shadow-lg'
                : 'neu-raised text-slate hover:text-white'
            }`}
          >
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            Semantic Only
          </button>
        </div>
        <div className="flex items-center text-sm text-slate">
          <Info className="mr-2 h-4 w-4 text-coral" aria-hidden="true" />
          <span>Hybrid: 60% keywords + 40% meaning</span>
        </div>
      </div>
    </div>
  );
}
