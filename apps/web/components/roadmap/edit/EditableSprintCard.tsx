'use client';

/**
 * EditableSprintCard Component - Standalone Roadmap UI Phase E
 *
 * Sprint card with inline editing capabilities:
 * - Double-click title to edit
 * - Progress slider
 * - Status dropdown
 */

import { Target } from 'lucide-react';
import type { RoadmapSprint } from '@/types/roadmap';
import { formatDateRange } from '@/lib/date-utils';
import { InlineEditForm } from './InlineEditForm';
import { ProgressSlider } from './ProgressSlider';
import { StatusDropdown } from './StatusDropdown';
import { useEntityUpdate, useProgressUpdate } from '@/hooks/useEntityUpdate';

interface EditableSprintCardProps {
  sprint: RoadmapSprint;
  isEditable?: boolean;
}

export function EditableSprintCard({ sprint, isEditable = true }: EditableSprintCardProps) {
  const {
    updateTitle,
    updateStatus,
    isUpdating: isEntityUpdating,
  } = useEntityUpdate('sprints', sprint.id);
  const { updateProgress, isUpdating: isProgressUpdating } = useProgressUpdate(
    'sprints',
    sprint.id
  );

  const isUpdating = isEntityUpdating || isProgressUpdating;
  const weekCount = sprint.weeks?.length || 0;

  return (
    <div className={`flex-1 ${isUpdating ? 'opacity-75' : ''}`}>
      {/* Header with Icon + Title + Status */}
      <div className="mb-3 flex items-start gap-3">
        {/* Icon Container */}
        <div className="icon-blue flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
          <Target className="h-5 w-5 text-white" />
        </div>

        {/* Title and Status */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-3">
            {/* Editable Title */}
            {isEditable ? (
              <InlineEditForm
                value={sprint.title}
                onSave={updateTitle}
                placeholder="Sprint name"
                className="text-xl font-semibold text-white"
              />
            ) : (
              <h3 className="text-xl font-semibold text-white">{sprint.title}</h3>
            )}

            {/* Status Dropdown */}
            {isEditable ? (
              <StatusDropdown value={sprint.status} onChange={updateStatus} size="sm" />
            ) : (
              <span
                className={`
                  flex-shrink-0 rounded-lg px-2 py-1 text-xs
                  ${sprint.status === 'COMPLETED' ? 'badge-green' : ''}
                  ${sprint.status === 'IN_PROGRESS' ? 'badge-blue' : ''}
                  ${sprint.status === 'NOT_STARTED' ? 'badge-slate' : ''}
                  ${sprint.status === 'BLOCKED' ? 'badge-red' : ''}
                `}
              >
                {sprint.status.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Description */}
          {sprint.description && (
            <p className="text-sm leading-relaxed text-slate">{sprint.description}</p>
          )}
        </div>
      </div>

      {/* Mini Stats */}
      {weekCount > 0 && (
        <div className="mb-3 flex gap-2">
          <div className="neu-pressed flex items-center gap-2 rounded-xl px-3 py-2">
            <div className="text-base font-bold text-white">{weekCount}</div>
            <div className="text-xs font-medium text-slate">
              {weekCount === 1 ? 'Week' : 'Weeks'}
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-slate">Progress</span>
        </div>
        {isEditable ? (
          <ProgressSlider value={sprint.progress} onCommit={updateProgress} size="sm" />
        ) : (
          <div className="neu-pressed h-1.5 overflow-hidden rounded-full">
            <div
              className="smooth-transition h-1.5 rounded-full bg-blue-500"
              style={{ width: `${sprint.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Date Range */}
      <div className="text-xs text-slate">{formatDateRange(sprint.startDate, sprint.endDate)}</div>
    </div>
  );
}
