'use client';

/**
 * TimelineTooltip Component
 *
 * Hover details for timeline bars
 */

import { format } from 'date-fns';
import { Calendar, Clock, TrendingUp } from 'lucide-react';

type Status = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';

interface TimelineTooltipProps {
  title: string;
  startDate: Date;
  endDate: Date;
  duration: string;
  progress: number;
  status: Status;
}

const STATUS_LABELS: Record<Status, { label: string; color: string }> = {
  NOT_STARTED: { label: 'Not Started', color: 'text-slate-400' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-400' },
  COMPLETED: { label: 'Completed', color: 'text-green-400' },
  BLOCKED: { label: 'Blocked', color: 'text-red-400' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-400' },
};

export function TimelineTooltip({
  title,
  startDate,
  endDate,
  duration,
  progress,
  status,
}: TimelineTooltipProps) {
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.NOT_STARTED;

  return (
    <div
      className="
        absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
        w-56 p-3 rounded-xl
        bg-dark-surface border border-dark-pressed shadow-xl
        pointer-events-none
      "
    >
      {/* Arrow */}
      <div
        className="
          absolute top-full left-1/2 -translate-x-1/2
          border-8 border-transparent border-t-dark-surface
        "
      />

      {/* Content */}
      <div className="space-y-2">
        {/* Title & Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate">{title}</span>
          <span className={`text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2 text-xs text-white">
          <Calendar className="h-3 w-3 text-slate" />
          <span>
            {format(startDate, 'MMM d')} → {format(endDate, 'MMM d, yyyy')}
          </span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-xs text-slate">
          <Clock className="h-3 w-3" />
          <span>{duration}</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3 w-3 text-coral" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate">Progress</span>
              <span className="text-xs font-medium text-coral">{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-dark-pressed overflow-hidden">
              <div
                className="h-full rounded-full bg-coral transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
