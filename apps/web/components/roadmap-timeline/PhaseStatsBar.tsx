'use client';

/**
 * PhaseStatsBar - Bottom statistics bar for phase summary
 *
 * Sprint 15 Phase E: Part of the new Phase Timeline view.
 * Displays key metrics: completion rate, active work, velocity indicators.
 *
 * @see mockups/alternatives/COMBINED-01-phase-timeline.html
 */

import { TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { PhaseOverview } from '@/types/kanban';
import { cn } from '@/lib/utils';

interface PhaseStatsBarProps {
  phase: PhaseOverview;
}

/**
 * Single stat item with icon and value.
 */
function StatItem({
  icon: Icon,
  label,
  value,
  colorClass = 'text-slate-light',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  colorClass?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn('h-4 w-4', colorClass)} />
      <span className="text-xs text-slate">{label}</span>
      <span className={cn('text-sm font-bold', colorClass)}>{value}</span>
    </div>
  );
}

export function PhaseStatsBar({ phase }: PhaseStatsBarProps) {
  // Calculate aggregate stats from all sprints
  const totals = phase.sprints.reduce(
    (acc, sprint) => ({
      total: acc.total + sprint.ticketCounts.total,
      done: acc.done + sprint.ticketCounts.done,
      inProgress: acc.inProgress + sprint.ticketCounts.inProgress,
      inReview: acc.inReview + sprint.ticketCounts.inReview,
    }),
    { total: 0, done: 0, inProgress: 0, inReview: 0 }
  );

  const completedSprints = phase.sprints.filter((s) => s.status === 'COMPLETED').length;

  const activeTickets = totals.inProgress + totals.inReview;

  // Calculate velocity (tickets completed per sprint)
  const velocity = completedSprints > 0 ? Math.round(totals.done / completedSprints) : 0;

  return (
    <div className="neu-card mt-6 p-4">
      <div className="flex items-center justify-between">
        {/* Left: Key metrics */}
        <div className="flex items-center gap-8">
          <StatItem
            icon={CheckCircle2}
            label="Completed"
            value={`${totals.done}/${totals.total}`}
            colorClass="text-accent-green"
          />
          <StatItem
            icon={Clock}
            label="Active"
            value={activeTickets}
            colorClass="text-accent-yellow"
          />
          <StatItem
            icon={AlertCircle}
            label="Remaining"
            value={totals.total - totals.done - activeTickets}
            colorClass="text-slate"
          />
        </div>

        {/* Right: Velocity and sprint progress */}
        <div className="flex items-center gap-8">
          <StatItem
            icon={TrendingUp}
            label="Velocity"
            value={`${velocity} tickets/sprint`}
            colorClass="text-coral"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate">Sprints</span>
            <span className="text-sm font-bold text-slate-light">
              {completedSprints}/{phase.sprints.length}
            </span>
            <div className="ml-2 flex gap-1">
              {phase.sprints.map((sprint) => (
                <div
                  key={sprint.id}
                  className={cn(
                    'h-2 w-2 rounded-full',
                    sprint.status === 'COMPLETED' && 'bg-accent-green',
                    sprint.status === 'IN_PROGRESS' && 'animate-pulse bg-coral',
                    sprint.status === 'NOT_STARTED' && 'bg-slate/30'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
