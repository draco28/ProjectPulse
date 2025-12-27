'use client';

/**
 * EditablePhaseCard Component - Standalone Roadmap UI Phase E
 *
 * Sprint 15: Week/Day removed - simplified 2-level hierarchy (Ticket #80)
 * Phase card with inline editing capabilities:
 * - Double-click title to edit
 * - Progress slider
 * - Status dropdown
 */

import { Layers, Calendar } from 'lucide-react';
import type { RoadmapPhase } from '@/types/roadmap';
import { formatDateRange } from '@/lib/date-utils';
import { InlineEditForm } from './InlineEditForm';
import { ProgressSlider } from './ProgressSlider';
import { StatusDropdown } from './StatusDropdown';
import { useEntityUpdate, useProgressUpdate } from '@/hooks/useEntityUpdate';

interface EditablePhaseCardProps {
  phase: RoadmapPhase;
  isEditable?: boolean;
}

export function EditablePhaseCard({ phase, isEditable = true }: EditablePhaseCardProps) {
  const {
    updateTitle,
    updateStatus,
    isUpdating: isEntityUpdating,
  } = useEntityUpdate('phases', phase.id);
  const { updateProgress, isUpdating: isProgressUpdating } = useProgressUpdate('phases', phase.id);

  const isUpdating = isEntityUpdating || isProgressUpdating;

  // Calculate stats - Sprint 15: Week/Day removed (Ticket #80)
  const sprintCount = phase.sprints?.length || 0;
  const ticketCount =
    phase.sprints?.reduce((acc, sprint) => acc + (sprint.tickets?.length || 0), 0) || 0;

  return (
    <div className={`flex-1 ${isUpdating ? 'opacity-75' : ''}`}>
      {/* Header with Icon + Title + Status */}
      <div className="mb-4 flex items-start gap-3">
        {/* Icon Container */}
        <div className="icon-coral flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl">
          <Layers className="h-6 w-6 text-white" />
        </div>

        {/* Title and Status */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-3">
            {/* Editable Title */}
            {isEditable ? (
              <InlineEditForm
                value={phase.title}
                onSave={updateTitle}
                placeholder="Phase name"
                className="text-2xl font-bold text-white"
              />
            ) : (
              <h2 className="text-2xl font-bold text-white">{phase.title}</h2>
            )}

            {/* Status Dropdown */}
            {isEditable ? (
              <StatusDropdown value={phase.status} onChange={updateStatus} size="md" />
            ) : (
              <span
                className={`
                  flex-shrink-0
                  ${phase.status === 'COMPLETED' ? 'badge-green' : ''}
                  ${phase.status === 'IN_PROGRESS' ? 'badge-blue' : ''}
                  ${phase.status === 'NOT_STARTED' ? 'badge-slate' : ''}
                  ${phase.status === 'BLOCKED' ? 'badge-red' : ''}
                `}
              >
                {phase.status.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Description */}
          {phase.description && (
            <p className="text-sm leading-relaxed text-slate">{phase.description}</p>
          )}
        </div>
      </div>

      {/* Stats Grid - Sprint 15: Week/Day removed (Ticket #80) */}
      {(sprintCount > 0 || ticketCount > 0) && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="neu-pressed rounded-2xl p-3 text-center">
            <div className="mb-1 text-2xl font-bold text-coral">{sprintCount}</div>
            <div className="text-xs font-medium text-slate">
              {sprintCount === 1 ? 'Sprint' : 'Sprints'}
            </div>
          </div>
          <div className="neu-pressed rounded-2xl p-3 text-center">
            <div className="mb-1 text-2xl font-bold text-coral">{ticketCount}</div>
            <div className="text-xs font-medium text-slate">
              {ticketCount === 1 ? 'Ticket' : 'Tickets'}
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-slate">Progress</span>
        </div>
        {isEditable ? (
          <ProgressSlider value={phase.progress} onCommit={updateProgress} size="md" />
        ) : (
          <>
            <div className="mb-1 flex justify-end">
              <span className="text-xs font-bold text-coral">{phase.progress}%</span>
            </div>
            <div className="neu-pressed h-2 overflow-hidden rounded-full">
              <div
                className="coral-gradient smooth-transition h-2 rounded-full"
                style={{ width: `${phase.progress}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-2 text-xs text-slate">
        <Calendar className="h-3.5 w-3.5" />
        <span>{formatDateRange(phase.startDate, phase.endDate)}</span>
      </div>
    </div>
  );
}
