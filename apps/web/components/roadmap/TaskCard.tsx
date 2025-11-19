'use client';

/**
 * TaskCard Component - Sprint 8.5 Phase 1B
 *
 * Displays individual task in roadmap hierarchy (5th level - leaf node)
 * - No expand/collapse (leaf node)
 * - Task title + status badge
 * - Session count
 * - Priority indicator
 */

import { CheckCircle2, Circle, AlertCircle, Ban } from 'lucide-react';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    progress: number;
    sessions?: Array<{ id: string }>;
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const sessionCount = task.sessions?.length || 0;

  // Status icon mapping
  const statusIcons = {
    COMPLETE: CheckCircle2,
    IN_PROGRESS: Circle,
    BLOCKED: Ban,
    PENDING: Circle,
  };

  const StatusIcon = statusIcons[task.status as keyof typeof statusIcons] || Circle;

  // Status color mapping
  const statusColors = {
    COMPLETE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    BLOCKED: 'bg-red-500/10 text-red-400 border-red-500/30',
    PENDING: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  const statusColor = statusColors[task.status as keyof typeof statusColors] || statusColors.PENDING;

  return (
    <div className="neu-inset rounded-xl p-3 border border-slate-800/50 hover:border-slate-700/50 transition-all group">
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <StatusIcon className={`h-4 w-4 ${statusColor.split(' ')[1]}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h5 className="font-medium text-white text-sm truncate group-hover:text-coral-400 transition-colors">
            {task.title}
          </h5>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-3 mt-2">
            {/* Status Badge */}
            <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${statusColor}`}>
              {task.status}
            </span>

            {/* Progress */}
            {task.status === 'IN_PROGRESS' && (
              <span className="text-xs text-slate-400">
                {task.progress}% complete
              </span>
            )}

            {/* Session Count */}
            {sessionCount > 0 && (
              <span className="text-xs text-slate-500">
                {sessionCount} session{sessionCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
