/**
 * TicketKindFilters Component
 *
 * Sprint 10: Multi-select kind filter pills for tickets page
 *
 * Features:
 * - Multi-select kind pills (toggle on/off)
 * - URL persistence with comma-separated values
 * - Filter count indicator
 * - Clear all filters button
 * - Active filter badges
 * - Browser history support
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { X } from 'lucide-react';

// Kind configuration
const kindConfig: Record<string, { label: string; color: string; activeColor: string }> = {
  feature: {
    label: 'Feature',
    color: 'bg-surface-dark text-slate hover:text-white',
    activeColor: 'bg-blue-500/20 text-blue-400',
  },
  task: {
    label: 'Task',
    color: 'bg-surface-dark text-slate hover:text-white',
    activeColor: 'bg-green-500/20 text-green-400',
  },
  epic: {
    label: 'Epic',
    color: 'bg-surface-dark text-slate hover:text-white',
    activeColor: 'bg-purple-500/20 text-purple-400',
  },
  issue: {
    label: 'Issue',
    color: 'bg-surface-dark text-slate hover:text-white',
    activeColor: 'bg-yellow-500/20 text-yellow-400',
  },
  bug: {
    label: 'Bug',
    color: 'bg-surface-dark text-slate hover:text-white',
    activeColor: 'bg-red-500/20 text-red-400',
  },
  scanner_finding: {
    label: 'Scanner Finding',
    color: 'bg-surface-dark text-slate hover:text-white',
    activeColor: 'bg-orange-500/20 text-orange-400',
  },
  tech_debt: {
    label: 'Tech Debt',
    color: 'bg-surface-dark text-slate hover:text-white',
    activeColor: 'bg-gray-500/20 text-gray-400',
  },
};

interface TicketKindFiltersProps {
  projectId: number;
  counts: Record<string, number>;
  totalCount: number;
}

export function TicketKindFilters({ projectId, counts, totalCount }: TicketKindFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current selected kinds from URL
  const selectedKinds = useMemo(() => {
    const kindParam = searchParams.get('kind');
    return kindParam ? kindParam.split(',').filter(Boolean) : [];
  }, [searchParams]);

  // Count active filters (including other filters like status, priority)
  const activeFilterCount = useMemo(() => {
    let count = selectedKinds.length;
    if (searchParams.get('status')) count += searchParams.get('status')!.split(',').length;
    if (searchParams.get('priority')) count += searchParams.get('priority')!.split(',').length;
    if (searchParams.get('module')) count++;
    if (searchParams.get('search')) count++;
    return count;
  }, [searchParams, selectedKinds]);

  // Toggle a kind filter
  const toggleKind = useCallback(
    (kind: string) => {
      const newParams = new URLSearchParams(searchParams.toString());

      let newKinds: string[];
      if (selectedKinds.includes(kind)) {
        // Remove kind
        newKinds = selectedKinds.filter((k) => k !== kind);
      } else {
        // Add kind
        newKinds = [...selectedKinds, kind];
      }

      if (newKinds.length > 0) {
        newParams.set('kind', newKinds.join(','));
      } else {
        newParams.delete('kind');
      }

      // Ensure project is preserved
      newParams.set('project', projectId.toString());

      // Reset to page 1 when filters change
      newParams.delete('page');

      router.push(`/tickets?${newParams.toString()}`);
    },
    [router, searchParams, selectedKinds, projectId]
  );

  // Clear all kind filters
  const clearKindFilters = useCallback(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('kind');
    newParams.set('project', projectId.toString());
    newParams.delete('page');
    router.push(`/tickets?${newParams.toString()}`);
  }, [router, searchParams, projectId]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    router.push(`/tickets?project=${projectId}`);
  }, [router, projectId]);

  return (
    <div className="space-y-3" data-testid="kind-filters">
      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {/* All button */}
        <button
          onClick={clearKindFilters}
          data-testid="kind-pill-all"
          className={`rounded-full px-3 py-1 text-sm transition-colors ${
            selectedKinds.length === 0
              ? 'bg-coral text-white'
              : 'bg-surface-dark text-slate hover:text-white'
          }`}
        >
          All ({totalCount})
        </button>

        {/* Kind pills */}
        {Object.entries(counts).map(([kind, count]) => {
          const config = kindConfig[kind] || {
            label: kind,
            color: 'bg-surface-dark text-slate',
            activeColor: 'bg-coral text-white',
          };
          const isActive = selectedKinds.includes(kind);

          return (
            <button
              key={kind}
              onClick={() => toggleKind(kind)}
              data-testid={`kind-pill-${kind}`}
              data-kind={kind}
              aria-pressed={isActive}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                isActive ? config.activeColor : config.color
              }`}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2" data-testid="active-filters">
          <span className="text-xs text-slate" data-testid="filter-count">
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
          </span>

          {/* Active kind badges */}
          {selectedKinds.map((kind) => {
            const config = kindConfig[kind];
            return (
              <button
                key={kind}
                onClick={() => toggleKind(kind)}
                data-testid={`active-filter-${kind}`}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${config?.activeColor || 'bg-coral/20 text-coral'}`}
              >
                {config?.label || kind}
                <X className="h-3 w-3" />
              </button>
            );
          })}

          {/* Clear all button */}
          <button
            onClick={clearAllFilters}
            data-testid="clear-all-filters"
            className="text-xs text-coral transition-colors hover:text-coral-light"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
