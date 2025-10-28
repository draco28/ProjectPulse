'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  initialSearch?: string;
}

export function SearchBar({ initialSearch = '' }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchMode, setSearchMode] = useState('hybrid'); // hybrid, fulltext, semantic

  // Debounce search query (300ms delay)
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Update URL when debounced search changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString());

    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    } else {
      params.delete('search');
    }

    // Reset to page 1 when search changes
    params.delete('page');

    router.push(`/knowledge?${params.toString()}`);
  }, [debouncedSearch, router, searchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleModeChange = (mode: string) => {
    setSearchMode(mode);
    // TODO: Implement different search modes (hybrid/fulltext/semantic)
    // For now, just visual state change
  };

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      {/* Search Input */}
      <div className="relative mb-4">
        <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-lg text-slate"></i>
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
            className={`smooth-transition rounded-xl px-4 py-2 text-sm font-semibold ${
              searchMode === 'hybrid'
                ? 'coral-gradient text-white shadow-lg'
                : 'neu-raised text-slate hover:text-white'
            }`}
          >
            <i className="fas fa-brain mr-2"></i>
            Hybrid Search
          </button>
          <button
            onClick={() => handleModeChange('fulltext')}
            className={`smooth-transition rounded-xl px-4 py-2 text-sm font-semibold ${
              searchMode === 'fulltext'
                ? 'coral-gradient text-white shadow-lg'
                : 'neu-raised text-slate hover:text-white'
            }`}
          >
            <i className="fas fa-font mr-2"></i>
            Full-Text Only
          </button>
          <button
            onClick={() => handleModeChange('semantic')}
            className={`smooth-transition rounded-xl px-4 py-2 text-sm font-semibold ${
              searchMode === 'semantic'
                ? 'coral-gradient text-white shadow-lg'
                : 'neu-raised text-slate hover:text-white'
            }`}
          >
            <i className="fas fa-magic mr-2"></i>
            Semantic Only
          </button>
        </div>
        <div className="text-sm text-slate">
          <i className="fas fa-info-circle mr-2 text-coral"></i>
          <span>Hybrid: 60% keywords + 40% meaning</span>
        </div>
      </div>
    </div>
  );
}
