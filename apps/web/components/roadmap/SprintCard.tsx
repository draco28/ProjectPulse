/**
 * SprintCard Component - Sprint 8.5
 *
 * Displays sprint information with mid-level neumorphic design:
 * - Icon container with blue accent
 * - Title and color-coded status badge
 * - Description
 * - Mini stats (week count)
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
  const weekCount = sprint.weeks?.length || 0;

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
      <div className="flex items-start gap-3 mb-3">
        {/* Icon Container */}
        <div className="icon-blue flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0">
          <Target className="h-5 w-5 text-white" />
        </div>

        {/* Title and Badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-xl font-semibold text-white">{sprint.title}</h3>
            <span className={`${badgeClass} flex-shrink-0 text-xs`}>
              {sprint.status.replace('_', ' ')}
            </span>
          </div>

          {/* Description */}
          {sprint.description && (
            <p className="text-sm text-slate leading-relaxed">{sprint.description}</p>
          )}
        </div>
      </div>

      {/* Mini Stats */}
      {weekCount > 0 && (
        <div className="flex gap-2 mb-3">
          {/* Week Count */}
          <div className="neu-pressed rounded-xl px-3 py-2 flex items-center gap-2">
            <div className="text-base font-bold text-white">{weekCount}</div>
            <div className="text-xs text-slate font-medium">
              {weekCount === 1 ? 'Week' : 'Weeks'}
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {sprint.progress > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate">Progress</span>
            <span className="text-xs font-semibold text-blue-400">{sprint.progress}%</span>
          </div>
          <div className="neu-pressed rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-1.5 rounded-full smooth-transition"
              style={{ width: `${sprint.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Date Range */}
      <div className="text-xs text-slate">
        {formatDateRange(sprint.startDate, sprint.endDate)}
      </div>
    </div>
  );
}
