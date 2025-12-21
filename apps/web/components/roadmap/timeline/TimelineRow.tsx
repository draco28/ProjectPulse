'use client';

/**
 * TimelineRow Component
 *
 * Single row for phase or sprint with progress bar
 */

import { ChevronDown, ChevronRight } from 'lucide-react';
import { TimelineBar } from './TimelineBar';

type Status = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';

interface TimelineRowProps {
  type: 'phase' | 'sprint';
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: Status;
  timelineStart: Date;
  totalDays: number;
  isCurrent?: boolean;
  isExpanded?: boolean;
  isNested?: boolean;
  hasChildren?: boolean;
  onToggle?: () => void;
}

export function TimelineRow({
  type,
  title,
  startDate,
  endDate,
  progress,
  status,
  timelineStart,
  totalDays,
  isCurrent = false,
  isExpanded = false,
  isNested = false,
  hasChildren = false,
  onToggle,
}: TimelineRowProps) {
  const rowHeight = type === 'phase' ? 'h-14' : 'h-10';

  return (
    <div
      className={`
        flex ${rowHeight}
        ${isNested ? 'bg-dark-pressed/30' : ''}
        ${isCurrent ? 'border-l-2 border-coral bg-coral/5' : ''}
        transition-colors hover:bg-dark-pressed/50
      `}
    >
      {/* Label Column */}
      <div
        className={`
          flex w-48 flex-shrink-0 items-center gap-2 border-r border-dark-pressed px-4
          ${isNested ? 'pl-10' : ''}
        `}
      >
        {/* Expand/Collapse Toggle */}
        {hasChildren && onToggle && (
          <button
            onClick={onToggle}
            className="rounded p-0.5 transition-colors hover:bg-dark-pressed"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-coral" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate" />
            )}
          </button>
        )}

        {/* Title */}
        <div className="min-w-0 flex-1">
          <span
            className={`
              block truncate
              ${type === 'phase' ? 'text-sm font-semibold text-white' : 'text-xs text-slate'}
              ${isCurrent ? 'text-coral' : ''}
            `}
            title={title}
          >
            {title}
          </span>
          {type === 'phase' && <span className="text-[10px] text-slate">{progress}% complete</span>}
        </div>
      </div>

      {/* Bar Area */}
      <div className="relative flex flex-1 items-center px-2">
        <TimelineBar
          startDate={startDate}
          endDate={endDate}
          progress={progress}
          status={status}
          timelineStart={timelineStart}
          totalDays={totalDays}
          type={type}
          isCurrent={isCurrent}
        />
      </div>
    </div>
  );
}
