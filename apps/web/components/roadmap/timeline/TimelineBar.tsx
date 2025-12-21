'use client';

/**
 * TimelineBar Component
 *
 * Horizontal progress bar with status coloring
 */

import { useState } from 'react';
import { differenceInDays } from 'date-fns';
import { TimelineTooltip } from './TimelineTooltip';

type Status = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';

interface TimelineBarProps {
  startDate: Date;
  endDate: Date;
  progress: number;
  status: Status;
  timelineStart: Date;
  totalDays: number;
  type: 'phase' | 'sprint';
  isCurrent?: boolean;
}

// Status colors
const STATUS_COLORS: Record<Status, { bg: string; fill: string }> = {
  NOT_STARTED: { bg: 'bg-slate-700/50', fill: 'bg-slate-500' },
  IN_PROGRESS: { bg: 'bg-blue-900/50', fill: 'bg-blue-500' },
  COMPLETED: { bg: 'bg-green-900/50', fill: 'bg-green-500' },
  BLOCKED: { bg: 'bg-red-900/50', fill: 'bg-red-500' },
  CANCELLED: { bg: 'bg-gray-800/50', fill: 'bg-gray-500' },
};

export function TimelineBar({
  startDate,
  endDate,
  progress,
  status,
  timelineStart,
  totalDays,
  type,
  isCurrent = false,
}: TimelineBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Calculate position and width
  const startOffset = Math.max(0, differenceInDays(startDate, timelineStart));
  const duration = Math.max(1, differenceInDays(endDate, startDate) + 1);

  const leftPercent = (startOffset / totalDays) * 100;
  const widthPercent = (duration / totalDays) * 100;

  const colors = STATUS_COLORS[status] || STATUS_COLORS.NOT_STARTED;
  const barHeight = type === 'phase' ? 'h-6' : 'h-4';

  // Duration text
  const durationText =
    duration === 1
      ? '1 day'
      : duration < 7
        ? `${duration} days`
        : `${Math.ceil(duration / 7)} weeks`;

  return (
    <div
      className="absolute"
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Bar Container */}
      <div
        className={`
          relative ${barHeight} overflow-hidden rounded-md
          ${colors.bg}
          ${isCurrent ? 'ring-offset-dark-surface ring-2 ring-coral ring-offset-1' : ''}
          cursor-pointer transition-all hover:brightness-110
        `}
      >
        {/* Progress Fill */}
        <div
          className={`absolute inset-y-0 left-0 ${colors.fill} transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />

        {/* Progress Text (only for phase or wide bars) */}
        {(type === 'phase' || widthPercent > 8) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-medium text-white drop-shadow-sm">
              {progress > 0 && `${progress}%`}
            </span>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <TimelineTooltip
          title={type === 'phase' ? 'Phase' : 'Sprint'}
          startDate={startDate}
          endDate={endDate}
          duration={durationText}
          progress={progress}
          status={status}
        />
      )}
    </div>
  );
}
