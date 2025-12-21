/**
 * RoadmapFilters Component - Sprint 8.5
 *
 * Provides filtering controls for roadmap visualization:
 * - Status filter (ALL, NOT_STARTED, IN_PROGRESS, COMPLETED)
 * - Search filter (by title/description)
 * - Neumorphic design matching Agent Personas theme
 */

'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

export type RoadmapFilterStatus = 'ALL' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface RoadmapFilterState {
  status: RoadmapFilterStatus;
  searchQuery: string;
}

interface RoadmapFiltersProps {
  onFilterChange: (filters: RoadmapFilterState) => void;
}

export function RoadmapFilters({ onFilterChange }: RoadmapFiltersProps) {
  const [filters, setFilters] = useState<RoadmapFilterState>({
    status: 'ALL',
    searchQuery: '',
  });

  const handleStatusChange = (status: RoadmapFilterStatus) => {
    const newFilters = { ...filters, status };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (query: string) => {
    const newFilters = { ...filters, searchQuery: query };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="neu-raised mb-6 rounded-3xl p-6">
      <h3 className="mb-4 text-lg font-bold text-white">Filters</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Status Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value as RoadmapFilterStatus)}
            className="neu-pressed smooth-transition w-full rounded-xl bg-transparent px-4 py-3 text-white focus:ring-2 focus:ring-coral"
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* Search Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate">Search</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search phases, sprints, weeks..."
              className="neu-pressed smooth-transition w-full rounded-xl bg-transparent py-3 pl-11 pr-4 text-white placeholder-slate focus:ring-2 focus:ring-coral"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(filters.status !== 'ALL' || filters.searchQuery) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate">Active:</span>
          {filters.status !== 'ALL' && (
            <span className="rounded-full border border-coral/30 bg-coral/20 px-3 py-1 text-xs font-semibold text-coral">
              Status: {filters.status.replace('_', ' ')}
            </span>
          )}
          {filters.searchQuery && (
            <span className="rounded-full border border-coral/30 bg-coral/20 px-3 py-1 text-xs font-semibold text-coral">
              Search: &quot;{filters.searchQuery}&quot;
            </span>
          )}
          <button
            onClick={() => {
              const resetFilters = { status: 'ALL' as RoadmapFilterStatus, searchQuery: '' };
              setFilters(resetFilters);
              onFilterChange(resetFilters);
            }}
            className="smooth-transition ml-auto text-xs font-medium text-coral hover:text-coral-light"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
