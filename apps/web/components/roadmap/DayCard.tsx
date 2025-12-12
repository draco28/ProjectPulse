'use client';

/**
 * DayCard Component - Sprint 12
 *
 * Displays individual day in roadmap hierarchy (4th level - LEAF NODE)
 * - Progress visualization
 * - Status badge
 * - Slate theme (consistent with WeekCard)
 *
 * Sprint 12: Task model removed - Day is now a leaf node
 * No expand/collapse, no tasks to render
 */

import { Calendar } from 'lucide-react';
import type { Day } from '@prisma/client';

interface DayCardProps {
  day: Day;
}

export function DayCard({ day }: DayCardProps) {
  // Status color mapping
  const statusColors = {
    COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    BLOCKED: 'bg-red-500/20 text-red-400 border-red-500/30',
    NOT_STARTED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    CANCELLED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };

  const statusColor = statusColors[day.status as keyof typeof statusColors] || statusColors.NOT_STARTED;

  return (
    <div className="neu-flat rounded-2xl p-4 border border-slate-700/30 hover:border-slate-600/50 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
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
          {day.status.replace('_', ' ')}
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
    </div>
  );
}
