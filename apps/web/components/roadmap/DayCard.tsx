'use client';

/**
 * DayCard Component - Sprint 8.5 Phase 1B
 *
 * Displays individual day in roadmap hierarchy (4th level)
 * - Collapsible with task list
 * - Progress visualization
 * - Task count
 * - Slate theme (consistent with WeekCard)
 */

import { ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Day } from '@prisma/client';

interface DayWithTasks extends Day {
  tasks?: Array<{
    id: string;
    title: string;
    description?: string | null;
    status: string;
    progress: number;
    sessions?: Array<{ id: string }>;
  }>;
}

interface DayCardProps {
  day: DayWithTasks;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function DayCard({ day, isExpanded = false, onToggle }: DayCardProps) {
  const taskCount = day.tasks?.length || 0;
  const completedTasks = day.tasks?.filter(t => t.status === 'COMPLETE').length || 0;
  const taskProgress = taskCount > 0 ? (completedTasks / taskCount) * 100 : 0;

  // Status color mapping
  const statusColors = {
    COMPLETE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    BLOCKED: 'bg-red-500/20 text-red-400 border-red-500/30',
    PENDING: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const statusColor = statusColors[day.status as keyof typeof statusColors] || statusColors.PENDING;

  return (
    <div className="neu-flat rounded-2xl p-4 border border-slate-700/30 hover:border-slate-600/50 transition-all">
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Expand/Collapse Icon */}
          <button
            className="neu-flat w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-700/30 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {/* Day Icon */}
          <div className="neu-flat w-10 h-10 rounded-xl flex items-center justify-center bg-slate-700/30">
            <Calendar className="h-5 w-5 text-slate-400" />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate">{day.title}</h4>
            {day.description && (
              <p className="text-sm text-slate-400 truncate">{day.description}</p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${statusColor}`}>
          {day.status}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 h-2 neu-inset rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-slate-500 to-slate-400 transition-all duration-300"
            style={{ width: `${day.progress}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-400 min-w-[3rem] text-right">
          {day.progress}%
        </span>
      </div>

      {/* Task Count */}
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <span className="font-medium text-slate-300">{taskCount}</span>
          <span>task{taskCount !== 1 ? 's' : ''}</span>
        </div>
        {taskCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="font-medium text-emerald-400">{completedTasks}</span>
            <span>complete</span>
            <span className="text-slate-500">·</span>
            <span className="font-medium text-slate-300">{Math.round(taskProgress)}%</span>
          </div>
        )}
      </div>

      {/* Collapsible Task List */}
      {isExpanded && taskCount > 0 && (
        <div className="mt-4 space-y-2 pl-2 border-l-2 border-slate-700/50">
          {day.tasks?.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {isExpanded && taskCount === 0 && (
        <div className="mt-4 text-center py-6 text-sm text-slate-500">
          No tasks scheduled for this day
        </div>
      )}
    </div>
  );
}
