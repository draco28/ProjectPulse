/**
 * WeekCard Component - Sprint 8.5
 *
 * Displays week information with compact neumorphic design:
 * - Icon container with slate accent
 * - Title and status badge
 * - Date range
 * - Days count indicator
 * - Slate progress bar
 */

import { Calendar } from 'lucide-react';
import type { RoadmapWeek } from '@/types/roadmap';
import { formatDateRange } from '@/lib/date-utils';

interface WeekCardProps {
  week: RoadmapWeek;
}

export function WeekCard({ week }: WeekCardProps) {
  const daysCount = week.days?.length || 0;

  // Badge class based on status
  const badgeClass =
    week.status === 'COMPLETED'
      ? 'badge-green'
      : week.status === 'IN_PROGRESS'
      ? 'badge-blue'
      : 'badge-slate';

  // Get day range (e.g., "Mon-Fri")
  const getDayRange = () => {
    if (daysCount === 0) return '';
    if (daysCount === 1) return '(1 day)';
    return `(${daysCount} days)`;
  };

  return (
    <div className="flex-1">
      {/* Header with Icon + Title */}
      <div className="flex items-start gap-2.5 mb-2">
        {/* Icon Container */}
        <div className="icon-slate flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0">
          <Calendar className="h-4 w-4 text-white" />
        </div>

        {/* Title and Badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-medium text-white">{week.title}</h4>
            <span className={`${badgeClass} flex-shrink-0 text-xs`}>
              {week.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div className="text-xs text-slate mb-2 ml-10.5">
        {formatDateRange(week.startDate, week.endDate)}
      </div>

      {/* Days Count */}
      {daysCount > 0 && (
        <p className="text-xs text-slate mb-2 ml-10.5">
          {daysCount} {daysCount === 1 ? 'day' : 'days'}
        </p>
      )}

      {/* Progress Bar */}
      {week.progress > 0 && (
        <div className="ml-10.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate">Progress</span>
            <span className="text-xs font-medium text-slate">{week.progress}%</span>
          </div>
          <div className="neu-pressed rounded-full h-1 overflow-hidden">
            <div
              className="bg-slate h-1 rounded-full smooth-transition"
              style={{ width: `${week.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
