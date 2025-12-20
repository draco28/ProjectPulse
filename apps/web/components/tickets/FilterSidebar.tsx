/**
 * FilterSidebar Component
 *
 * Filter panel for issues list with dynamic DB-driven options
 * Reference: mockups/Default theme/02-issues-dark-neumorphic-coral.html lines 384-489
 *
 * Features:
 * - Desktop: Static sidebar (always visible)
 * - Mobile: Bottom sheet drawer (slide-up animation)
 * - Touch-friendly close button and drag handle
 * - Focus trap when drawer is open
 * - Body scroll lock on mobile
 */
'use client';

import { useFilterParams } from '@/hooks/useFilterParams';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { FiltersDTO, FilterCounts } from '@/types/filters';
import { X, RefreshCw, AlertCircle, Box, Layers, Tag, ChevronDown } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Sprint 14: Semantic badge colors for filter counts (Ticket #23)
const STATUS_BADGE_COLORS: Record<string, string> = {
  open: 'bg-emerald-500',
  'in-progress': 'bg-amber-500',
  closed: 'bg-slate-500',
};

const PRIORITY_BADGE_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-slate-400',
};

const KIND_BADGE_COLORS: Record<string, string> = {
  feature: 'bg-blue-500',
  task: 'bg-green-500',
  epic: 'bg-purple-500',
  issue: 'bg-yellow-500',
  bug: 'bg-red-500',
  scanner_finding: 'bg-orange-500',
  tech_debt: 'bg-gray-500',
};

const MODULE_BADGE_COLOR = 'bg-teal-500';

// Kind configuration for display
const kindConfig: Record<string, { label: string }> = {
  feature: { label: 'Feature' },
  task: { label: 'Task' },
  epic: { label: 'Epic' },
  issue: { label: 'Issue' },
  bug: { label: 'Bug' },
  scanner_finding: { label: 'Scanner Finding' },
  tech_debt: { label: 'Tech Debt' },
};

// Sprint 14: Collapsible filter section component (Ticket #23)
interface FilterSectionProps {
  title: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  testId?: string;
}

function FilterSection({ title, icon, defaultOpen = false, children, testId }: FilterSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="mb-6" data-testid={testId}>
      <CollapsibleTrigger className="group mb-3 flex w-full items-center justify-between">
        <h4 className="flex items-center gap-2 font-semibold text-white">
          {icon}
          {title}
        </h4>
        <ChevronDown
          className="h-4 w-4 text-slate transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface FilterSidebarProps {
  options: FiltersDTO; // Dynamic filter options from database
  counts: FilterCounts;
  searchParams: Record<string, string | undefined>;
  // Mobile drawer props (optional - desktop mode if not provided)
  isOpen?: boolean;
  onClose?: () => void;
}

export function FilterSidebar({
  options,
  counts,
  searchParams,
  isOpen = true,
  onClose,
}: FilterSidebarProps) {
  // Use custom hook for filter state management
  const { currentFilters, isActive, updateFilter, clearAllFilters, hasActiveFilters } =
    useFilterParams(searchParams);

  // Mobile drawer functionality
  const isMobileDrawer = onClose !== undefined;
  const drawerRef = useFocusTrap(isMobileDrawer && isOpen);
  useBodyScrollLock(isMobileDrawer && isOpen);

  // Close drawer on Escape key (mobile only)
  useEffect(() => {
    if (!isMobileDrawer || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileDrawer, isOpen, onClose]);

  // Render filter content (shared between desktop and mobile)
  const filterContent = (
    <>
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

        {/* Type (Kind) Filter - Collapsed by default */}
        {options.kinds && options.kinds.length > 0 && (
          <FilterSection
            title="Type"
            icon={<Layers className="h-4 w-4 text-coral" aria-hidden="true" />}
            defaultOpen={false}
            testId="kind-filter"
          >
            {options.kinds.map((kind) => {
              const count = counts.kind?.[kind] || 0;
              const isChecked = isActive('kind', kind);
              const label = kindConfig[kind]?.label || kind;
              const badgeColor = KIND_BADGE_COLORS[kind] || 'bg-gray-500';

              return (
                <label
                  key={kind}
                  data-testid={`kind-option-${kind}`}
                  className="smooth-transition group flex cursor-pointer items-center gap-3 text-slate hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => updateFilter('kind', kind, e.target.checked)}
                  />
                  <span className="flex-1">{label}</span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-semibold',
                      count > 0 ? `${badgeColor} text-white` : 'neu-pressed text-slate'
                    )}
                  >
                    {count}
                  </span>
                </label>
              );
            })}
          </FilterSection>
        )}

        {/* Status Filter - Expanded by default */}
        <FilterSection
          title="Status"
          icon={<RefreshCw className="h-4 w-4 text-coral" aria-hidden="true" />}
          defaultOpen={true}
          testId="status-filter"
        >
          {options.status.map((option) => {
            const count = counts.status[option.value] || 0;
            const isChecked = isActive('status', option.value);
            const badgeColor = STATUS_BADGE_COLORS[option.value] || 'bg-gray-500';

            return (
              <label
                key={option.value}
                data-testid={`status-option-${option.value}`}
                className="smooth-transition group flex cursor-pointer items-center gap-3 text-slate hover:text-white"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => updateFilter('status', option.value, e.target.checked)}
                />
                <span className="flex-1">{option.label}</span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-semibold',
                    count > 0 ? `${badgeColor} text-white` : 'neu-pressed text-slate'
                  )}
                >
                  {count}
                </span>
              </label>
            );
          })}
        </FilterSection>

        {/* Priority Filter - Expanded by default */}
        <FilterSection
          title="Priority"
          icon={<AlertCircle className="h-4 w-4 text-coral" aria-hidden="true" />}
          defaultOpen={true}
          testId="priority-filter"
        >
          {options.priority.map((option) => {
            const count = counts.priority[option.value] || 0;
            const isChecked = isActive('priority', option.value);
            const badgeColor = PRIORITY_BADGE_COLORS[option.value] || 'bg-gray-500';

            return (
              <label
                key={option.value}
                data-testid={`priority-option-${option.value}`}
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
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-semibold',
                    count > 0 ? `${badgeColor} text-white` : 'neu-pressed text-slate'
                  )}
                >
                  {count}
                </span>
              </label>
            );
          })}
        </FilterSection>

        {/* Labels Filter - Collapsed by default */}
        {options.labels && options.labels.length > 0 && (
          <FilterSection
            title="Labels"
            icon={<Tag className="h-4 w-4 text-coral" aria-hidden="true" />}
            defaultOpen={false}
            testId="label-filter"
          >
            {options.labels.map((label) => {
              const labelId = String(label.id);
              const count = counts.label?.[labelId] || 0;
              const isChecked = isActive('label', labelId);

              return (
                <label
                  key={label.id}
                  data-testid={`label-option-${label.id}`}
                  className="smooth-transition group flex cursor-pointer items-center gap-3 text-slate hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => updateFilter('label', labelId, e.target.checked)}
                  />
                  <span className="flex flex-1 items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-semibold',
                      count > 0 ? 'text-white' : 'neu-pressed text-slate'
                    )}
                    style={count > 0 ? { backgroundColor: label.color } : undefined}
                  >
                    {count}
                  </span>
                </label>
              );
            })}
          </FilterSection>
        )}

        {/* Module Filter - Collapsed by default */}
        <FilterSection
          title="Module"
          icon={<Box className="h-4 w-4 text-coral" aria-hidden="true" />}
          defaultOpen={false}
          testId="module-filter"
        >
          {options.modules.map((option) => {
            const count = counts.module[option.value] || 0;
            const isChecked = isActive('module', option.value);

            return (
              <label
                key={option.value}
                data-testid={`module-option-${option.value}`}
                className="smooth-transition group flex cursor-pointer items-center gap-3 text-slate hover:text-white"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => updateFilter('module', option.value, e.target.checked)}
                />
                <span className="flex-1">{option.label}</span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-semibold',
                    count > 0 ? `${MODULE_BADGE_COLOR} text-white` : 'neu-pressed text-slate'
                  )}
                >
                  {count}
                </span>
              </label>
            );
          })}
        </FilterSection>
      </div>
    </>
  );

  // Desktop mode: always visible sidebar
  if (!isMobileDrawer) {
    return <div className="hidden w-72 flex-col gap-4 overflow-auto lg:flex">{filterContent}</div>;
  }

  // Mobile mode: bottom sheet drawer
  return (
    <>
      {/* Overlay - Only renders when drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Bottom Sheet Drawer */}
      <aside
        ref={drawerRef}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col gap-4 overflow-auto rounded-t-3xl bg-background p-6 transition-transform duration-300 lg:hidden',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        aria-label="Filters drawer"
        role="dialog"
        aria-modal="true"
      >
        {/* Drag Handle */}
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate opacity-50" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="neu-raised smooth-transition absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-slate hover:text-white"
          aria-label="Close filters"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Filter Content */}
        {filterContent}
      </aside>
    </>
  );
}
