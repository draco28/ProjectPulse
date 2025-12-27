'use client';

/**
 * SprintCard - Individual sprint card with three variants
 *
 * Sprint 15 Phase E: Part of the new Phase Timeline view.
 *
 * Variants:
 * - completed: Compact, checkmark icon, lower opacity, opens drawer
 * - current: Expanded (col-span-2), coral border, mini-kanban preview
 * - planned: Compact, shows planned count, navigates to kanban
 *
 * @see mockups/alternatives/COMBINED-01-phase-timeline.html
 */

import { Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SprintCardProps } from '@/types/phase-timeline';
import { MiniKanbanPreview } from './MiniKanbanPreview';

/**
 * Format date range for display.
 */
function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return '';

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : 'Ongoing';

  return `${start} - ${end}`;
}

/**
 * Compact card for completed/planned sprints.
 */
function CompactSprintCard({
  sprint,
  variant,
  onClick,
}: Omit<SprintCardProps, 'showMiniKanban'>) {
  const isCompleted = variant === 'completed';

  return (
    <button
      onClick={onClick}
      className={cn(
        'sprint-block p-4 text-left transition-all duration-300',
        'hover:translate-y-[-2px]',
        isCompleted && 'opacity-70',
        !isCompleted && 'opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isCompleted && (
            <span className="text-accent-green text-lg">
              <Check className="w-5 h-5" />
            </span>
          )}
          <h3 className="font-bold">Sprint {sprint.globalSprintNumber}</h3>
        </div>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded font-medium',
            isCompleted && 'bg-accent-green/15 text-accent-green',
            !isCompleted && 'bg-dark-pressed text-slate'
          )}
        >
          {isCompleted ? 'Complete' : 'Planned'}
        </span>
      </div>

      {/* Date range */}
      <div className="text-xs text-slate mb-4" suppressHydrationWarning>
        {formatDateRange(sprint.startDate, sprint.endDate)}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-dark-pressed rounded-lg p-2.5 text-center">
          <div
            className={cn(
              'text-xl font-bold',
              isCompleted ? 'text-accent-green' : 'text-slate'
            )}
          >
            {sprint.ticketCounts.done}
          </div>
          <div className="text-[10px] text-slate uppercase tracking-wide">
            Done
          </div>
        </div>
        <div className="bg-dark-pressed rounded-lg p-2.5 text-center">
          <div className="text-xl font-bold text-slate">
            {sprint.ticketCounts.total - sprint.ticketCounts.done}
          </div>
          <div className="text-[10px] text-slate uppercase tracking-wide">
            Open
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/5 text-center">
        <span className="text-xs text-slate hover:text-coral transition flex items-center justify-center gap-1">
          {isCompleted ? 'View Details' : `${sprint.ticketCounts.total} tickets planned`}
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}

/**
 * Expanded card for current sprint with mini-kanban preview.
 */
function CurrentSprintCard({
  sprint,
  onClick,
  showMiniKanban,
}: Omit<SprintCardProps, 'variant'>) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'sprint-block current p-5 col-span-2 text-left',
        'border-coral transition-all duration-300',
        'hover:translate-y-[-2px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Pulsing coral dot */}
          <div className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse" />
          <h3 className="font-bold text-xl">Sprint {sprint.globalSprintNumber}</h3>
          <span className="text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wide bg-coral/15 text-coral">
            Current
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate" suppressHydrationWarning>
            {formatDateRange(sprint.startDate, sprint.endDate)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-coral font-bold text-lg">{sprint.progress}%</span>
            <span className="text-xs text-slate">
              {sprint.ticketCounts.done}/{sprint.ticketCounts.total} tickets
            </span>
          </div>
        </div>
      </div>

      {/* Mini Kanban Preview */}
      {showMiniKanban && <MiniKanbanPreview sprintId={sprint.id} />}

      {/* Footer with feature progress and CTA */}
      <div className="flex gap-6 text-xs border-t border-white/10 pt-4 mt-4">
        {/* Quick stats */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded bg-accent-yellow" />
          <span className="text-slate-light">In Progress</span>
          <span className="text-accent-yellow font-bold">
            {sprint.ticketCounts.inProgress}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded bg-accent-purple" />
          <span className="text-slate-light">In Review</span>
          <span className="text-accent-purple font-bold">
            {sprint.ticketCounts.inReview}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded bg-slate" />
          <span className="text-slate-light">Backlog</span>
          <span className="text-slate font-bold">
            {sprint.ticketCounts.backlog + sprint.ticketCounts.todo}
          </span>
        </div>

        {/* CTA */}
        <div className="ml-auto">
          <span className="text-coral hover:underline font-medium flex items-center gap-1">
            View Full Board <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </button>
  );
}

/**
 * Main SprintCard component that renders the appropriate variant.
 */
export function SprintCard({
  sprint,
  variant,
  onClick,
  showMiniKanban = false,
}: SprintCardProps) {
  if (variant === 'current') {
    return (
      <CurrentSprintCard
        sprint={sprint}
        onClick={onClick}
        showMiniKanban={showMiniKanban}
      />
    );
  }

  return (
    <CompactSprintCard
      sprint={sprint}
      variant={variant}
      onClick={onClick}
    />
  );
}
