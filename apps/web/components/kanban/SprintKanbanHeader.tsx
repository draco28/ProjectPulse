'use client';

/**
 * SprintKanbanHeader Component - Header for sprint kanban board
 *
 * Shows:
 * - Back link to Phase Timeline
 * - Sprint title with status indicator
 * - Progress bar
 * - New Ticket button
 */

import { memo } from 'react';
import Link from 'next/link';
import type { SprintContext, BoardStats } from '@/types/kanban';
import { cn } from '@/lib/utils';

interface SprintKanbanHeaderProps {
  sprint: SprintContext;
  projectId?: number;
  stats?: BoardStats;
  onNewTicket?: () => void;
}

export const SprintKanbanHeader = memo(function SprintKanbanHeader({
  sprint,
  projectId,
  stats,
  onNewTicket,
}: SprintKanbanHeaderProps) {
  const progress = stats?.progress ?? sprint.progress ?? 0;
  const isCurrentSprint = sprint.status === 'IN_PROGRESS';

  // Build back link with project context
  const backHref = projectId ? `/roadmap?project=${projectId}` : '/roadmap';

  return (
    <div className="p-6 pb-0">
      {/* Top Row: Navigation + Actions */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Back to Phase Timeline */}
          <Link
            href={backHref}
            className="flex items-center gap-2 rounded-lg p-2 text-slate transition hover:bg-white/5"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="text-sm">{sprint.phase.title}</span>
          </Link>

          <span className="text-slate">/</span>

          {/* Sprint Title */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                isCurrentSprint ? 'animate-pulse bg-coral' : 'bg-slate'
              )}
            />
            <h1 className="text-2xl font-bold">
              {sprint.title || `Sprint ${sprint.sprintNumber}`}
            </h1>
            {isCurrentSprint && (
              <span className="rounded bg-coral/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-coral">
                Current
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Progress Card */}
          <div className="neu-flat flex items-center gap-4 rounded-xl px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate">Progress</span>
              <span className="font-bold text-coral">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-dark-pressed">
              <div
                className="h-full rounded-full bg-gradient-to-r from-coral to-coral-dark transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* New Ticket */}
          <button
            onClick={onNewTicket}
            className="btn-coral flex items-center gap-2 rounded-xl px-4 py-2 font-medium"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Ticket
          </button>
        </div>
      </div>

      {/* Info Bar */}
      {stats && (
        <div className="mb-4 flex items-center gap-6 text-sm text-slate">
          <span>
            {stats.done}/{stats.total} tickets done
          </span>
          <span>•</span>
          <span>{stats.inProgress} in progress</span>
          {stats.blocked > 0 && (
            <>
              <span>•</span>
              <span className="text-accent-red">{stats.blocked} blocked</span>
            </>
          )}
        </div>
      )}
    </div>
  );
});

SprintKanbanHeader.displayName = 'SprintKanbanHeader';

export default SprintKanbanHeader;
