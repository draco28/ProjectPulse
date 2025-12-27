/**
 * SprintCard Component
 *
 * Sprint 15: Week/Day removed - simplified 2-level hierarchy (Ticket #80)
 * Displays sprint information with mid-level neumorphic design:
 * - Icon container with blue accent
 * - Title and color-coded status badge
 * - Description
 * - Mini stats (ticket count)
 * - Blue progress bar
 * - Date range
 */

import { Target } from 'lucide-react';
import type { RoadmapSprint } from '@/types/roadmap';
import { formatDateRange } from '@/lib/date-utils';

interface SprintCardProps {
  sprint: RoadmapSprint;
}

export function SprintCard({ sprint }: SprintCardProps) {
  // Calculate stats from nested data
  // Sprint 15: Week/Day removed - now count tickets directly (Ticket #80)
  const ticketCount = sprint.tickets?.length || 0;

  // Badge class based on status
  const badgeClass =
    sprint.status === 'COMPLETED'
      ? 'badge-green'
      : sprint.status === 'IN_PROGRESS'
        ? 'badge-blue'
        : 'badge-slate';

  return (
    <div className="flex-1">
      {/* Header with Icon + Title + Badge */}
      <div className="mb-3 flex items-start gap-3">
        {/* Icon Container */}
        <div className="icon-blue flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
          <Target className="h-5 w-5 text-white" />
        </div>

        {/* Title and Badge */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="text-xl font-semibold text-white">{sprint.title}</h3>
            <span className={`${badgeClass} flex-shrink-0 text-xs`}>
              {sprint.status.replace('_', ' ')}
            </span>
          </div>

          {/* Description */}
          {sprint.description && (
            <p className="text-sm leading-relaxed text-slate">{sprint.description}</p>
          )}
        </div>
      </div>

      {/* Mini Stats - Sprint 15: Week/Day removed (Ticket #80) */}
      {ticketCount > 0 && (
        <div className="mb-3 flex gap-2">
          {/* Ticket Count */}
          <div className="neu-pressed flex items-center gap-2 rounded-xl px-3 py-2">
            <div className="text-base font-bold text-white">{ticketCount}</div>
            <div className="text-xs font-medium text-slate">
              {ticketCount === 1 ? 'Ticket' : 'Tickets'}
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {sprint.progress > 0 && (
        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-slate">Progress</span>
            <span className="text-xs font-semibold text-blue-400">{sprint.progress}%</span>
          </div>
          <div className="neu-pressed h-1.5 overflow-hidden rounded-full">
            <div
              className="smooth-transition h-1.5 rounded-full bg-blue-500"
              style={{ width: `${sprint.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Date Range */}
      <div className="text-xs text-slate">{formatDateRange(sprint.startDate, sprint.endDate)}</div>
    </div>
  );
}
