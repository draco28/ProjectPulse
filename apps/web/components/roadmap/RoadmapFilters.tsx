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
    <div className="neu-raised rounded-3xl p-6 mb-6">
      <h3 className="text-lg font-bold text-white mb-4">Filters</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-slate mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value as RoadmapFilterStatus)}
            className="neu-pressed w-full rounded-xl px-4 py-3 text-white bg-transparent focus:ring-2 focus:ring-coral smooth-transition"
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* Search Filter */}
        <div>
          <label className="block text-sm font-medium text-slate mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search phases, sprints, weeks..."
              className="neu-pressed w-full rounded-xl pl-11 pr-4 py-3 text-white bg-transparent placeholder-slate focus:ring-2 focus:ring-coral smooth-transition"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(filters.status !== 'ALL' || filters.searchQuery) && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate">Active:</span>
          {filters.status !== 'ALL' && (
            <span className="px-3 py-1 bg-coral/20 text-coral border border-coral/30 rounded-full text-xs font-semibold">
              Status: {filters.status.replace('_', ' ')}
            </span>
          )}
          {filters.searchQuery && (
            <span className="px-3 py-1 bg-coral/20 text-coral border border-coral/30 rounded-full text-xs font-semibold">
              Search: "{filters.searchQuery}"
            </span>
          )}
          <button
            onClick={() => {
              const resetFilters = { status: 'ALL' as RoadmapFilterStatus, searchQuery: '' };
              setFilters(resetFilters);
              onFilterChange(resetFilters);
            }}
            className="ml-auto text-xs text-coral hover:text-coral-light smooth-transition font-medium"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
