/**
 * FilterSidebar Component
 *
 * Filter panel for issues list with dynamic DB-driven options
 * Reference: mockups/Default theme/02-issues-dark-neumorphic-coral.html lines 384-489
 */
'use client';

import { useFilterParams } from '@/hooks/useFilterParams';
import type { FiltersDTO } from '@/types/filters';

interface FilterCounts {
  status: Record<string, number>;
  priority: Record<string, number>;
  module: Record<string, number>;
}

interface FilterSidebarProps {
  options: FiltersDTO; // Dynamic filter options from database
  counts: FilterCounts;
  searchParams: Record<string, string | undefined>;
}

export function FilterSidebar({ options, counts, searchParams }: FilterSidebarProps) {
  // Use custom hook for filter state management
  const { currentFilters, isActive, updateFilter, clearAllFilters, hasActiveFilters } =
    useFilterParams(searchParams);

  return (
    <div className="flex w-72 flex-col gap-4 overflow-auto">
      <div className="neu-raised smooth-transition rounded-3xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="smooth-transition hover:text-coralLight text-xs font-semibold text-coral"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <h4 className="mb-3 flex items-center gap-2 font-semibold text-white">
            <i className="fas fa-circle-notch text-sm text-coral"></i>
            Status
          </h4>
          <div className="space-y-3">
            {options.status.map((option) => {
              const count = counts.status[option.value] || 0;
              const isChecked = isActive('status', option.value);

              return (
                <label
                  key={option.value}
                  className="smooth-transition group flex cursor-pointer items-center gap-3 text-slate hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => updateFilter('status', option.value, e.target.checked)}
                  />
                  <span className="flex-1">{option.label}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      count > 0 && isChecked
                        ? `${option.colorClass || 'bg-coral'} text-white`
                        : 'neu-pressed text-slate'
                    }`}
                  >
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Priority Filter */}
        <div className="mb-6">
          <h4 className="mb-3 flex items-center gap-2 font-semibold text-white">
            <i className="fas fa-exclamation-circle text-sm text-coral"></i>
            Priority
          </h4>
          <div className="space-y-3">
            {options.priority.map((option) => {
              const count = counts.priority[option.value] || 0;
              const isChecked = isActive('priority', option.value);

              return (
                <label
                  key={option.value}
                  className="smooth-transition group flex cursor-pointer items-center gap-3 text-slate hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => updateFilter('priority', option.value, e.target.checked)}
                  />
                  <span className="flex flex-1 items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${option.dotColorClass || 'bg-gray-500'}`}
                    />
                    {option.label}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      count > 0 && isChecked
                        ? `${option.badgeColorClass || 'bg-coral text-white'}`
                        : 'neu-pressed text-slate'
                    }`}
                  >
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Module Filter */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 font-semibold text-white">
            <i className="fas fa-cube text-sm text-coral"></i>
            Module
          </h4>
          <div className="space-y-3">
            {options.modules.map((option) => {
              const count = counts.module[option.value] || 0;
              const isChecked = isActive('module', option.value);

              return (
                <label
                  key={option.value}
                  className="smooth-transition group flex cursor-pointer items-center gap-3 text-slate hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => updateFilter('module', option.value, e.target.checked)}
                  />
                  <span className="flex-1">{option.label}</span>
                  <span className="neu-pressed rounded-full px-2.5 py-1 text-xs font-semibold text-slate">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
