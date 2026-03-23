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
function CompactSprintCard({ sprint, variant, onClick }: Omit<SprintCardProps, 'showMiniKanban'>) {
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
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCompleted && (
            <span className="text-lg text-accent-green">
              <Check className="h-5 w-5" />
            </span>
          )}
          <h3 className="font-bold">Sprint {sprint.globalSprintNumber}</h3>
        </div>
        <span
          className={cn(
            'rounded px-2 py-0.5 text-xs font-medium',
            isCompleted && 'bg-accent-green/15 text-accent-green',
            !isCompleted && 'bg-dark-pressed text-slate'
          )}
        >
          {isCompleted ? 'Complete' : 'Planned'}
        </span>
      </div>

      {/* Date range */}
      <div className="mb-4 text-xs text-slate" suppressHydrationWarning>
        {formatDateRange(sprint.startDate, sprint.endDate)}
      </div>

      {/* Stats grid */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-dark-pressed p-2.5 text-center">
          <div
            className={cn('text-xl font-bold', isCompleted ? 'text-accent-green' : 'text-slate')}
          >
            {sprint.ticketCounts.done}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-slate">Done</div>
        </div>
        <div className="rounded-lg bg-dark-pressed p-2.5 text-center">
          <div className="text-xl font-bold text-slate">
            {sprint.ticketCounts.total - sprint.ticketCounts.done}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-slate">Open</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 border-t border-white/5 pt-3 text-center">
        <span className="flex items-center justify-center gap-1 text-xs text-slate transition hover:text-coral">
          {isCompleted ? 'View Details' : `${sprint.ticketCounts.total} tickets planned`}
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}

/**
 * Expanded card for current sprint with mini-kanban preview.
 */
function CurrentSprintCard({ sprint, onClick, showMiniKanban }: Omit<SprintCardProps, 'variant'>) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'sprint-block current col-span-2 p-5 text-left',
        'border-coral transition-all duration-300',
        'hover:translate-y-[-2px]'
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Pulsing coral dot */}
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-coral" />
          <h3 className="text-xl font-bold">Sprint {sprint.globalSprintNumber}</h3>
          <span className="rounded bg-coral/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-coral">
            Current
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate" suppressHydrationWarning>
            {formatDateRange(sprint.startDate, sprint.endDate)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-coral">{sprint.progress}%</span>
            <span className="text-xs text-slate">
              {sprint.ticketCounts.done}/{sprint.ticketCounts.total} tickets
            </span>
          </div>
        </div>
      </div>

      {/* Mini Kanban Preview */}
      {showMiniKanban && <MiniKanbanPreview sprintId={sprint.id} />}

      {/* Footer with feature progress and CTA */}
      <div className="mt-4 flex gap-6 border-t border-white/10 pt-4 text-xs">
        {/* Quick stats */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded bg-accent-yellow" />
          <span className="text-slate-light">In Progress</span>
          <span className="font-bold text-accent-yellow">{sprint.ticketCounts.inProgress}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded bg-accent-purple" />
          <span className="text-slate-light">In Review</span>
          <span className="font-bold text-accent-purple">{sprint.ticketCounts.inReview}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded bg-slate" />
          <span className="text-slate-light">Backlog</span>
          <span className="font-bold text-slate">
            {sprint.ticketCounts.backlog + sprint.ticketCounts.todo}
          </span>
        </div>

        {/* CTA */}
        <div className="ml-auto">
          <span className="flex items-center gap-1 font-medium text-coral hover:underline">
            View Full Board <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </button>
  );
}

/**
 * Main SprintCard component that renders the appropriate variant.
 */
export function SprintCard({ sprint, variant, onClick, showMiniKanban = false }: SprintCardProps) {
  if (variant === 'current') {
    return <CurrentSprintCard sprint={sprint} onClick={onClick} showMiniKanban={showMiniKanban} />;
  }

  return <CompactSprintCard sprint={sprint} variant={variant} onClick={onClick} />;
}
