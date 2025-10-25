/**
 * FilterSidebar Component
 *
 * Filter panel for issues list
 * Reference: mockups/Default theme/02-issues-dark-neumorphic-coral.html lines 384-489
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface FilterCounts {
  status: Record<string, number>;
  priority: Record<string, number>;
  module: Record<string, number>;
}

interface FilterSidebarProps {
  counts: FilterCounts;
  searchParams: Record<string, string | undefined>;
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', color: 'bg-green-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'closed', label: 'Closed', color: 'neu-pressed' },
];

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical', dotColor: 'bg-red-500', badgeColor: 'bg-red-500' },
  { value: 'high', label: 'High', dotColor: 'bg-orange-400', badgeColor: 'bg-orange-500' },
  { value: 'medium', label: 'Medium', dotColor: 'bg-blue-400', badgeColor: 'neu-pressed' },
  { value: 'low', label: 'Low', dotColor: 'bg-slate', badgeColor: 'neu-pressed' },
];

const MODULE_OPTIONS = [
  { value: 'Combat', label: 'Combat' },
  { value: 'Animation', label: 'Animation' },
  { value: 'Core', label: 'Core' },
  { value: 'UI', label: 'UI' },
];

export function FilterSidebar({ counts, searchParams }: FilterSidebarProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  // Get current filter values
  const currentStatus = searchParams.status?.split(',').filter(Boolean) || [];
  const currentPriority = searchParams.priority?.split(',').filter(Boolean) || [];
  const currentModule = searchParams.module?.split(',').filter(Boolean) || [];

  const updateFilter = (filterType: string, value: string, checked: boolean) => {
    const params = new URLSearchParams(currentSearchParams?.toString());

    // Get current values
    const current = params.get(filterType)?.split(',').filter(Boolean) || [];

    // Add or remove value
    let updated: string[];
    if (checked) {
      updated = [...current, value];
    } else {
      updated = current.filter((v) => v !== value);
    }

    // Update or remove param
    if (updated.length > 0) {
      params.set(filterType, updated.join(','));
    } else {
      params.delete(filterType);
    }

    // Reset to page 1 when filters change
    params.delete('page');

    router.push(`/issues?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(currentSearchParams?.toString());
    params.delete('status');
    params.delete('priority');
    params.delete('module');
    params.delete('page');

    router.push(`/issues?${params.toString()}`);
  };

  const hasActiveFilters =
    currentStatus.length > 0 || currentPriority.length > 0 || currentModule.length > 0;

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
            {STATUS_OPTIONS.map((option) => {
              const count = counts.status[option.value] || 0;
              const isChecked = currentStatus.includes(option.value);

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
                        ? `${option.color} text-white`
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
            {PRIORITY_OPTIONS.map((option) => {
              const count = counts.priority[option.value] || 0;
              const isChecked = currentPriority.includes(option.value);

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
                    <span className={`h-2 w-2 rounded-full ${option.dotColor}`} />
                    {option.label}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      count > 0 && isChecked
                        ? `${option.badgeColor} text-white`
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
            {MODULE_OPTIONS.map((option) => {
              const count = counts.module[option.value] || 0;
              const isChecked = currentModule.includes(option.value);

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
