/**
 * PhaseCard Component - Sprint 8.5
 *
 * Displays phase information with premium neumorphic design:
 * - Icon container with coral accent
 * - Title and color-coded status badge
 * - Description
 * - Stats grid (sprints, weeks, days)
 * - Coral gradient progress bar
 * - Date range with calendar icon
 */

import { Layers, Calendar } from 'lucide-react';
import type { RoadmapPhase } from '@/types/roadmap';
import { formatDateRange } from '@/lib/date-utils';

interface PhaseCardProps {
  phase: RoadmapPhase;
}

export function PhaseCard({ phase }: PhaseCardProps) {
  // Calculate stats from nested data
  const sprintCount = phase.sprints?.length || 0;
  const weekCount =
    phase.sprints?.reduce((acc, sprint) => acc + (sprint.weeks?.length || 0), 0) || 0;
  const dayCount =
    phase.sprints?.reduce(
      (acc, sprint) =>
        acc + (sprint.weeks?.reduce((wAcc, week) => wAcc + (week.days?.length || 0), 0) || 0),
      0
    ) || 0;

  // Badge class based on status
  const badgeClass =
    phase.status === 'COMPLETED'
      ? 'badge-green'
      : phase.status === 'IN_PROGRESS'
        ? 'badge-blue'
        : 'badge-slate';

  return (
    <div className="flex-1">
      {/* Header with Icon + Title + Badge */}
      <div className="mb-4 flex items-start gap-3">
        {/* Icon Container */}
        <div className="icon-coral flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl">
          <Layers className="h-6 w-6 text-white" />
        </div>

        {/* Title and Badge */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h2 className="text-2xl font-bold text-white">{phase.title}</h2>
            <span className={`${badgeClass} flex-shrink-0`}>{phase.status.replace('_', ' ')}</span>
          </div>

          {/* Description */}
          {phase.description && (
            <p className="text-sm leading-relaxed text-slate">{phase.description}</p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {(sprintCount > 0 || weekCount > 0 || dayCount > 0) && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          {/* Sprint Count */}
          <div className="neu-pressed rounded-2xl p-3 text-center">
            <div className="mb-1 text-2xl font-bold text-coral">{sprintCount}</div>
            <div className="text-xs font-medium text-slate">
              {sprintCount === 1 ? 'Sprint' : 'Sprints'}
            </div>
          </div>

          {/* Week Count */}
          <div className="neu-pressed rounded-2xl p-3 text-center">
            <div className="mb-1 text-2xl font-bold text-coral">{weekCount}</div>
            <div className="text-xs font-medium text-slate">
              {weekCount === 1 ? 'Week' : 'Weeks'}
            </div>
          </div>

          {/* Day Count */}
          <div className="neu-pressed rounded-2xl p-3 text-center">
            <div className="mb-1 text-2xl font-bold text-coral">{dayCount}</div>
            <div className="text-xs font-medium text-slate">{dayCount === 1 ? 'Day' : 'Days'}</div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {phase.progress > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate">Progress</span>
            <span className="text-xs font-bold text-coral">{phase.progress}%</span>
          </div>
          <div className="neu-pressed h-2 overflow-hidden rounded-full">
            <div
              className="coral-gradient smooth-transition h-2 rounded-full"
              style={{ width: `${phase.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Date Range */}
      <div className="flex items-center gap-2 text-xs text-slate">
        <Calendar className="h-3.5 w-3.5" />
        <span>{formatDateRange(phase.startDate, phase.endDate)}</span>
      </div>
    </div>
  );
}
