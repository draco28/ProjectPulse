'use client';

/**
 * TimelineHeader Component
 *
 * Date scale header showing months and week markers
 */

import { format, eachWeekOfInterval, differenceInDays } from 'date-fns';

interface TimelineHeaderProps {
  startDate: Date;
  endDate: Date;
  months: Date[];
  totalDays: number;
}

export function TimelineHeader({ startDate, endDate, months, totalDays }: TimelineHeaderProps) {
  // Calculate weeks for fine grid
  const weeks = eachWeekOfInterval({ start: startDate, end: endDate });

  return (
    <div className="bg-dark-surface sticky top-0 z-10 border-b border-dark-pressed">
      {/* Month Row */}
      <div className="flex h-8">
        {/* Label Column */}
        <div className="flex w-48 flex-shrink-0 items-center border-r border-dark-pressed px-4">
          <span className="text-xs font-medium text-slate">Phase / Sprint</span>
        </div>

        {/* Months */}
        <div className="relative flex flex-1">
          {months.map((month, index) => {
            const monthStart = index === 0 ? startDate : month;
            const nextMonth = months[index + 1];
            const monthEnd = nextMonth ? new Date(nextMonth.getTime() - 1) : endDate;

            const startOffset = differenceInDays(monthStart, startDate);
            const duration = differenceInDays(monthEnd, monthStart) + 1;
            const widthPercent = (duration / totalDays) * 100;
            const leftPercent = (startOffset / totalDays) * 100;

            return (
              <div
                key={month.toISOString()}
                className="absolute flex h-full items-center justify-center border-r border-dark-pressed"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                }}
              >
                <span className="text-xs font-semibold text-white">
                  {format(month, 'MMM yyyy')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Week Row (smaller) */}
      <div className="flex h-6 bg-dark-pressed/50">
        {/* Label Column (empty) */}
        <div className="w-48 flex-shrink-0 border-r border-dark-pressed" />

        {/* Week markers */}
        <div className="relative flex flex-1">
          {weeks.map((week, index) => {
            const weekStart = index === 0 ? startDate : week;
            const startOffset = differenceInDays(weekStart, startDate);
            const leftPercent = (startOffset / totalDays) * 100;

            // Only show every other week label to avoid crowding
            const showLabel = index % 2 === 0;

            return (
              <div
                key={week.toISOString()}
                className="absolute h-full border-l border-dark-pressed/50"
                style={{ left: `${leftPercent}%` }}
              >
                {showLabel && (
                  <span className="absolute left-1 top-1 text-[10px] text-slate/50">
                    W{index + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
