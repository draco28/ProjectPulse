'use client';

/**
 * SprintKanbanHeader Component - Header for sprint kanban board
 *
 * Shows:
 * - Back link to Phase Timeline
 * - Sprint title with status indicator
 * - Progress bar
 * - Collapse All button
 * - New Ticket button
 */

import { memo } from 'react';
import Link from 'next/link';
import type { SprintContext, BoardStats } from '@/types/kanban';
import { cn } from '@/lib/utils';

interface SprintKanbanHeaderProps {
  sprint: SprintContext;
  stats?: BoardStats;
  onCollapseAll?: () => void;
  onNewTicket?: () => void;
}

export const SprintKanbanHeader = memo(function SprintKanbanHeader({
  sprint,
  stats,
  onCollapseAll,
  onNewTicket,
}: SprintKanbanHeaderProps) {
  const progress = stats?.progress ?? sprint.progress ?? 0;
  const isCurrentSprint = sprint.status === 'IN_PROGRESS';

  return (
    <div className="p-6 pb-0">
      {/* Top Row: Navigation + Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Back to Phase Timeline */}
          <Link
            href="/roadmap"
            className="p-2 rounded-lg hover:bg-white/5 text-slate transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                'w-2.5 h-2.5 rounded-full',
                isCurrentSprint ? 'bg-coral animate-pulse' : 'bg-slate'
              )}
            />
            <h1 className="text-2xl font-bold">{sprint.title || `Sprint ${sprint.sprintNumber}`}</h1>
            {isCurrentSprint && (
              <span className="text-xs text-coral bg-coral/15 px-2.5 py-1 rounded font-bold uppercase tracking-wide">
                Current
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Progress Card */}
          <div className="neu-card px-4 py-2 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate text-sm">Progress</span>
              <span className="text-coral font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="w-32 h-2 bg-dark-pressed rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-coral to-coral-dark rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Collapse All */}
          <button
            onClick={onCollapseAll}
            className="neu-card px-3 py-2 text-sm text-slate hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
              Collapse All
            </span>
          </button>

          {/* New Ticket */}
          <button
            onClick={onNewTicket}
            className="btn-coral px-4 py-2 rounded-xl font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="flex items-center gap-6 text-sm text-slate mb-4">
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
