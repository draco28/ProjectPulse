'use client';

/**
 * NextPhasePreview - Teaser card for the upcoming phase
 *
 * Sprint 15 Phase E: Part of the new Phase Timeline view.
 * Shows a preview of what's coming next with sprint count and
 * call-to-action to view the phase.
 *
 * @see mockups/alternatives/COMBINED-01-phase-timeline.html
 */

import { ArrowRight, Calendar } from 'lucide-react';
import type { PhaseOverview } from '@/types/kanban';
import { cn } from '@/lib/utils';

interface NextPhasePreviewProps {
  phase: PhaseOverview;
  onPhaseSelect: (phaseId: string) => void;
}

/**
 * Format date for display.
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'TBD';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NextPhasePreview({ phase, onPhaseSelect }: NextPhasePreviewProps) {
  const totalTickets = phase.sprints.reduce((sum, sprint) => sum + sprint.ticketCounts.total, 0);

  return (
    <div className="neu-card mt-6 p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-slate-light">Coming Up Next</span>
          <span className={cn('rounded px-2 py-0.5 text-xs font-medium', 'bg-slate/15 text-slate')}>
            Up Next
          </span>
        </div>
        <button
          onClick={() => onPhaseSelect(phase.id)}
          className="flex items-center gap-1 text-sm font-medium text-coral transition hover:underline"
        >
          View Phase <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Phase info */}
      <div className="flex items-center gap-6">
        {/* Phase title */}
        <div className="flex-1">
          <h3 className="mb-1 text-xl font-bold text-text-primary">{phase.title}</h3>
          <div className="flex items-center gap-4 text-sm text-slate">
            <span className="flex items-center gap-1.5" suppressHydrationWarning>
              <Calendar className="h-4 w-4" />
              Starts {formatDate(phase.startDate)}
            </span>
            <span>{phase.sprints.length} sprints planned</span>
            <span>{totalTickets} tickets</span>
          </div>
        </div>

        {/* Sprint thumbnails */}
        <div className="flex gap-2">
          {phase.sprints.slice(0, 4).map((sprint) => (
            <div
              key={sprint.id}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg bg-dark-pressed/50',
                'text-xs font-medium text-slate',
                'border border-white/5'
              )}
            >
              S{sprint.sprintNumber}
            </div>
          ))}
          {phase.sprints.length > 4 && (
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg bg-dark-pressed/50',
                'text-xs font-medium text-slate',
                'border border-white/5'
              )}
            >
              +{phase.sprints.length - 4}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
