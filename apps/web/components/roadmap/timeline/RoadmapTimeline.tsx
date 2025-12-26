'use client';

/**
 * @deprecated Sprint 15 Phase E - Replaced by components/roadmap-timeline/
 * This component will be removed in Sprint 16.
 * The new Phase Timeline view replaces the Gantt-style timeline.
 *
 * RoadmapTimeline Component - Standalone Roadmap UI Phase D
 *
 * Horizontal Gantt-style timeline visualization
 * Shows phases and sprints with progress bars
 *
 * @see .agent/task/roadmap-ui/ROADMAP-TIMELINE-DESIGN.md
 */

import { useMemo, useState } from 'react';
import {
  differenceInDays,
  addDays,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  format,
  min,
  max,
} from 'date-fns';
import type { RoadmapPhase } from '@/types/roadmap';
import { TimelineHeader } from './TimelineHeader';
import { TimelineRow } from './TimelineRow';
import { TimelineLegend } from './TimelineLegend';

interface RoadmapTimelineProps {
  phases: RoadmapPhase[];
  currentPhase?: string | null;
  currentSprint?: string | null;
}

export function RoadmapTimeline({ phases, currentPhase, currentSprint }: RoadmapTimelineProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    new Set(phases.map((p) => p.id))
  );

  // Calculate timeline bounds from all phases/sprints
  const { startDate, endDate, totalDays, months } = useMemo(() => {
    const allDates: Date[] = [];

    phases.forEach((phase) => {
      if (phase.startDate) allDates.push(new Date(phase.startDate));
      if (phase.endDate) allDates.push(new Date(phase.endDate));

      phase.sprints?.forEach((sprint) => {
        if (sprint.startDate) allDates.push(new Date(sprint.startDate));
        if (sprint.endDate) allDates.push(new Date(sprint.endDate));
      });
    });

    if (allDates.length === 0) {
      // Default to current month if no dates
      const now = new Date();
      const start = startOfMonth(now);
      const end = endOfMonth(addDays(now, 90));
      return {
        startDate: start,
        endDate: end,
        totalDays: differenceInDays(end, start) + 1,
        months: eachMonthOfInterval({ start, end }),
      };
    }

    const minDate = startOfMonth(min(allDates));
    const maxDate = endOfMonth(max(allDates));
    const days = differenceInDays(maxDate, minDate) + 1;

    return {
      startDate: minDate,
      endDate: maxDate,
      totalDays: days,
      months: eachMonthOfInterval({ start: minDate, end: maxDate }),
    };
  }, [phases]);

  // Toggle phase expansion
  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  if (phases.length === 0) {
    return (
      <div className="neu-raised rounded-3xl p-8 text-center">
        <p className="text-slate">No phases to display in timeline</p>
      </div>
    );
  }

  return (
    <div className="neu-raised overflow-hidden rounded-3xl">
      {/* Legend */}
      <div className="border-b border-dark-pressed px-6 py-4">
        <TimelineLegend />
      </div>

      {/* Timeline Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header with date scale */}
          <TimelineHeader
            startDate={startDate}
            endDate={endDate}
            months={months}
            totalDays={totalDays}
          />

          {/* Rows */}
          <div className="divide-y divide-dark-pressed">
            {phases.map((phase) => {
              const isExpanded = expandedPhases.has(phase.id);
              const isCurrent = phase.title === currentPhase;

              return (
                <div key={phase.id}>
                  {/* Phase Row */}
                  <TimelineRow
                    type="phase"
                    id={phase.id}
                    title={phase.title}
                    startDate={phase.startDate ? new Date(phase.startDate) : startDate}
                    endDate={phase.endDate ? new Date(phase.endDate) : endDate}
                    progress={phase.progress}
                    status={phase.status}
                    timelineStart={startDate}
                    totalDays={totalDays}
                    isCurrent={isCurrent}
                    isExpanded={isExpanded}
                    hasChildren={(phase.sprints?.length || 0) > 0}
                    onToggle={() => togglePhase(phase.id)}
                  />

                  {/* Sprint Rows (if expanded) */}
                  {isExpanded &&
                    phase.sprints?.map((sprint) => {
                      const isCurrentSprint = isCurrent && sprint.title === currentSprint;

                      return (
                        <TimelineRow
                          key={sprint.id}
                          type="sprint"
                          id={sprint.id}
                          title={sprint.title}
                          startDate={sprint.startDate ? new Date(sprint.startDate) : startDate}
                          endDate={sprint.endDate ? new Date(sprint.endDate) : endDate}
                          progress={sprint.progress}
                          status={sprint.status}
                          timelineStart={startDate}
                          totalDays={totalDays}
                          isCurrent={isCurrentSprint}
                          isNested
                        />
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="border-t border-dark-pressed bg-dark-pressed/30 px-6 py-3">
        <p className="text-center text-xs text-slate">
          Timeline: {format(startDate, 'MMM d, yyyy')} → {format(endDate, 'MMM d, yyyy')} •{' '}
          {totalDays} days • {phases.length} phase{phases.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
