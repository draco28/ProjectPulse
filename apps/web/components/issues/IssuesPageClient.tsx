/**
 * IssuesPageClient Component
 *
 * Client wrapper for issues page that handles mobile filter drawer state
 * This keeps the main page.tsx as a Server Component for performance
 *
 * Features:
 * - Manages mobile filter drawer state
 * - Provides FAB (Floating Action Button) trigger on mobile/tablet
 * - Passes state to FilterSidebar for mobile drawer mode
 * - Desktop: FilterSidebar always visible, no FAB
 */
'use client';

import { useState } from 'react';
import { FilterSidebar } from '@/components/issues/FilterSidebar';
import type { FiltersDTO, FilterCounts } from '@/types/filters';
import { SlidersHorizontal } from 'lucide-react';

interface IssuesPageClientProps {
  options: FiltersDTO;
  counts: FilterCounts;
  searchParams: Record<string, string | undefined>;
}

export function IssuesPageClient({ options, counts, searchParams }: IssuesPageClientProps) {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar (Hidden on mobile) */}
      <FilterSidebar
        options={options}
        counts={counts}
        searchParams={searchParams}
      />

      {/* FAB - Floating Action Button (Mobile/Tablet only) */}
      <button
        onClick={() => setIsFilterDrawerOpen(true)}
        className="neu-raised smooth-transition fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl text-slate shadow-2xl hover:text-white lg:hidden"
        aria-label="Open filters"
        aria-expanded={isFilterDrawerOpen}
      >
        <SlidersHorizontal className="h-6 w-6" />
      </button>

      {/* Mobile Filter Drawer (Hidden on desktop) */}
      <FilterSidebar
        options={options}
        counts={counts}
        searchParams={searchParams}
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
      />
    </>
  );
}
