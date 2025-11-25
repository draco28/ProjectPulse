'use client';

/**
 * EditablePhaseCard Component - Standalone Roadmap UI Phase E
 *
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
  const { updateTitle, updateStatus, isUpdating: isEntityUpdating } = useEntityUpdate(
    'phases',
    phase.id
  );
  const { updateProgress, isUpdating: isProgressUpdating } = useProgressUpdate(
    'phases',
    phase.id
  );

  const isUpdating = isEntityUpdating || isProgressUpdating;

  // Calculate stats
  const sprintCount = phase.sprints?.length || 0;
  const weekCount = phase.sprints?.reduce((acc, sprint) => acc + (sprint.weeks?.length || 0), 0) || 0;
  const dayCount = phase.sprints?.reduce(
    (acc, sprint) =>
      acc + (sprint.weeks?.reduce((wAcc, week) => wAcc + (week.days?.length || 0), 0) || 0),
    0
  ) || 0;

  return (
    <div className={`flex-1 ${isUpdating ? 'opacity-75' : ''}`}>
      {/* Header with Icon + Title + Status */}
      <div className="flex items-start gap-3 mb-4">
        {/* Icon Container */}
        <div className="icon-coral flex h-12 w-12 items-center justify-center rounded-2xl flex-shrink-0">
          <Layers className="h-6 w-6 text-white" />
        </div>

        {/* Title and Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
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
              <StatusDropdown
                value={phase.status}
                onChange={updateStatus}
                size="md"
              />
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
            <p className="text-sm text-slate leading-relaxed">{phase.description}</p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {(sprintCount > 0 || weekCount > 0 || dayCount > 0) && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="neu-pressed rounded-2xl p-3 text-center">
            <div className="text-2xl font-bold text-coral mb-1">{sprintCount}</div>
            <div className="text-xs text-slate font-medium">
              {sprintCount === 1 ? 'Sprint' : 'Sprints'}
            </div>
          </div>
          <div className="neu-pressed rounded-2xl p-3 text-center">
            <div className="text-2xl font-bold text-coral mb-1">{weekCount}</div>
            <div className="text-xs text-slate font-medium">
              {weekCount === 1 ? 'Week' : 'Weeks'}
            </div>
          </div>
          <div className="neu-pressed rounded-2xl p-3 text-center">
            <div className="text-2xl font-bold text-coral mb-1">{dayCount}</div>
            <div className="text-xs text-slate font-medium">
              {dayCount === 1 ? 'Day' : 'Days'}
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate">Progress</span>
        </div>
        {isEditable ? (
          <ProgressSlider
            value={phase.progress}
            onCommit={updateProgress}
            size="md"
          />
        ) : (
          <>
            <div className="flex justify-end mb-1">
              <span className="text-xs font-bold text-coral">{phase.progress}%</span>
            </div>
            <div className="neu-pressed rounded-full h-2 overflow-hidden">
              <div
                className="coral-gradient h-2 rounded-full smooth-transition"
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
