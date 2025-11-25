'use client';

/**
 * EditableWeekCard Component - Standalone Roadmap UI Phase E
 *
 * Week card with inline editing capabilities:
 * - Double-click title to edit
 * - Progress slider
 * - Status dropdown
 */

import { CalendarDays } from 'lucide-react';
import type { RoadmapWeek } from '@/types/roadmap';
import { formatDateRange } from '@/lib/date-utils';
import { InlineEditForm } from './InlineEditForm';
import { ProgressSlider } from './ProgressSlider';
import { StatusDropdown } from './StatusDropdown';
import { useEntityUpdate, useProgressUpdate } from '@/hooks/useEntityUpdate';

interface EditableWeekCardProps {
  week: RoadmapWeek;
  isEditable?: boolean;
}

export function EditableWeekCard({ week, isEditable = true }: EditableWeekCardProps) {
  const { updateTitle, updateStatus, isUpdating: isEntityUpdating } = useEntityUpdate(
    'weeks',
    week.id
  );
  const { updateProgress, isUpdating: isProgressUpdating } = useProgressUpdate(
    'weeks',
    week.id
  );

  const isUpdating = isEntityUpdating || isProgressUpdating;
  const dayCount = week.days?.length || 0;

  return (
    <div className={`flex-1 ${isUpdating ? 'opacity-75' : ''}`}>
      {/* Header with Icon + Title + Status */}
      <div className="flex items-start gap-2 mb-2">
        {/* Icon Container */}
        <div className="icon-slate flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0">
          <CalendarDays className="h-4 w-4 text-white" />
        </div>

        {/* Title and Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            {/* Editable Title */}
            {isEditable ? (
              <InlineEditForm
                value={week.title}
                onSave={updateTitle}
                placeholder="Week name"
                className="text-base font-medium text-white"
              />
            ) : (
              <h4 className="text-base font-medium text-white">{week.title}</h4>
            )}

            {/* Status Dropdown */}
            {isEditable ? (
              <StatusDropdown
                value={week.status}
                onChange={updateStatus}
                size="sm"
              />
            ) : (
              <span
                className={`
                  flex-shrink-0 text-xs px-2 py-0.5 rounded
                  ${week.status === 'COMPLETED' ? 'badge-green' : ''}
                  ${week.status === 'IN_PROGRESS' ? 'badge-blue' : ''}
                  ${week.status === 'NOT_STARTED' ? 'badge-slate' : ''}
                  ${week.status === 'BLOCKED' ? 'badge-red' : ''}
                `}
              >
                {week.status.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Day count and Progress in single row */}
      <div className="flex items-center gap-4">
        {/* Day Count */}
        <div className="text-xs text-slate">
          {dayCount} {dayCount === 1 ? 'day' : 'days'}
        </div>

        {/* Progress */}
        <div className="flex-1">
          {isEditable ? (
            <ProgressSlider
              value={week.progress}
              onCommit={updateProgress}
              size="sm"
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 neu-pressed rounded-full h-1 overflow-hidden">
                <div
                  className="bg-slate-400 h-1 rounded-full smooth-transition"
                  style={{ width: `${week.progress}%` }}
                />
              </div>
              <span className="text-xs text-slate">{week.progress}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Date Range */}
      <div className="text-xs text-slate/70 mt-1">
        {formatDateRange(week.startDate, week.endDate)}
      </div>
    </div>
  );
}
