'use client';

/**
 * BoardStatsBar Component - Fixed bottom bar with board statistics
 *
 * Shows:
 * - Total tickets
 * - Completed count
 * - In Progress count
 * - In Review count
 * - Moving indicator
 */

import { memo } from 'react';
import type { BoardStats } from '@/types/kanban';
import { cn } from '@/lib/utils';

interface BoardStatsBarProps {
  stats: BoardStats;
  isMoving?: boolean;
}

export const BoardStatsBar = memo(function BoardStatsBar({ stats, isMoving }: BoardStatsBarProps) {
  return (
    <div
      className={cn(
        // Glass effect background
        'fixed bottom-0 left-0 right-0 z-30',
        'bg-dark-card/80 backdrop-blur-md border-t border-white/5',
        'px-6 py-3'
      )}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Stats */}
        <div className="flex items-center gap-6">
          {/* Total */}
          <div className="flex items-center gap-2">
            <span className="text-slate text-sm">Total</span>
            <span className="font-bold text-white">{stats.total}</span>
          </div>

          {/* Completed */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-green" />
            <span className="text-slate text-sm">Completed</span>
            <span className="font-bold text-accent-green">{stats.done}</span>
          </div>

          {/* In Progress */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-yellow animate-pulse" />
            <span className="text-slate text-sm">In Progress</span>
            <span className="font-bold text-accent-yellow">{stats.inProgress}</span>
          </div>

          {/* In Review */}
          {stats.columns && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-purple" />
              <span className="text-slate text-sm">Review</span>
              <span className="font-bold text-accent-purple">
                {stats.columns.find((c) => c.status === 'in-review')?.count ?? 0}
              </span>
            </div>
          )}
        </div>

        {/* Right: Progress + Moving indicator */}
        <div className="flex items-center gap-4">
          {/* Moving indicator */}
          {isMoving && (
            <div className="flex items-center gap-2 text-coral">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm">Updating...</span>
            </div>
          )}

          {/* Progress percentage */}
          <div className="flex items-center gap-3">
            <div className="w-24 h-2 bg-dark-pressed rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-coral to-accent-green rounded-full transition-all duration-500"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <span className="font-bold text-coral min-w-[3rem] text-right">
              {Math.round(stats.progress)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

BoardStatsBar.displayName = 'BoardStatsBar';

export default BoardStatsBar;
