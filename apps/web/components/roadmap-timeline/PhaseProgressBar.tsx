'use client';

/**
 * PhaseProgressBar - Progress bar with sprint milestone markers
 *
 * Sprint 15 Phase E: Part of the new Phase Timeline view.
 * Shows overall phase progress with vertical markers indicating
 * sprint boundaries and a gradient fill from green to coral.
 *
 * @see mockups/alternatives/COMBINED-01-phase-timeline.html
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { PhaseProgressBarProps } from '@/types/phase-timeline';

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

export function PhaseProgressBar({
  phase,
  currentGlobalSprintNumber,
}: PhaseProgressBarProps) {
  const { sprints, progress, startDate, endDate } = phase;

  // Calculate sprint positions as percentages
  const sprintMarkers = useMemo(() => {
    if (sprints.length <= 1) return [];

    const totalSprints = sprints.length;
    return sprints.slice(0, -1).map((sprint, index) => ({
      id: sprint.id,
      globalSprintNumber: sprint.globalSprintNumber,
      position: ((index + 1) / totalSprints) * 100,
      isCompleted: sprint.status === 'COMPLETED',
      isCurrent: sprint.globalSprintNumber === currentGlobalSprintNumber,
    }));
  }, [sprints, currentGlobalSprintNumber]);

  // Sprint labels for the bottom row (using globalSprintNumber for display)
  const sprintLabels = sprints.map((sprint) => {
    const isCompleted = sprint.status === 'COMPLETED';
    const isCurrent = sprint.globalSprintNumber === currentGlobalSprintNumber;

    return {
      id: sprint.id,
      label: `Sprint ${sprint.globalSprintNumber}`,
      progress: sprint.progress,
      isCompleted,
      isCurrent,
    };
  });

  return (
    <div className="neu-card p-4 mb-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-slate-light font-medium">{phase.title} Progress</span>
          {/* suppressHydrationWarning: Date formatting may differ between server/client timezones */}
          <span
            className="text-xs text-slate bg-dark-pressed px-2 py-1 rounded"
            suppressHydrationWarning
          >
            {formatDateRange(startDate, endDate)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-coral font-bold text-lg">{progress}%</span>
          <span className="text-slate text-sm">
            {phase.sprints.reduce((sum, s) => sum + s.ticketCounts.done, 0)}/
            {phase.sprints.reduce((sum, s) => sum + s.ticketCounts.total, 0)} tickets
          </span>
        </div>
      </div>

      {/* Progress bar with sprint markers */}
      <div className="relative h-3 bg-dark-pressed rounded-full overflow-hidden">
        {/* Progress fill with gradient */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--accent-green), var(--coral))',
          }}
        />

        {/* Sprint boundary markers */}
        {sprintMarkers.map((marker) => (
          <div
            key={marker.id}
            className="absolute top-0 bottom-0 w-0.5 bg-white/30"
            style={{ left: `${marker.position}%` }}
          />
        ))}
      </div>

      {/* Sprint labels row */}
      <div className="flex justify-between mt-2 text-xs">
        {sprintLabels.map((sprint) => (
          <span
            key={sprint.id}
            className={cn(
              'transition-colors',
              sprint.isCompleted && 'text-accent-green',
              sprint.isCurrent && 'text-coral font-medium',
              !sprint.isCompleted && !sprint.isCurrent && 'text-slate'
            )}
          >
            {sprint.label}{' '}
            <span className="opacity-60">({sprint.progress}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}
