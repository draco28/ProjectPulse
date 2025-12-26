/**
 * ChildTicketsSection Component
 *
 * Sprint 14: Display child tickets in parent ticket detail page
 *
 * Features:
 * - Shows all child tickets with hierarchical display IDs
 * - Progress indicator (X of Y completed)
 * - Quick status badges
 * - Links to child ticket detail pages
 */
'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { TICKET_STATUSES } from '@/lib/constants/status';

interface ChildTicket {
  id: number;
  title: string;
  status: string;
  priority: string;
  kind: string;
  assignee: string | null;
  createdAt: Date | string;
}

interface ChildTicketsSectionProps {
  parentId: number;
  childTickets: ChildTicket[];
  projectId: number;
}

const STATUS_ICONS: Record<string, typeof Circle> = {
  open: Circle,
  'in-progress': Clock,
  closed: CheckCircle2,
  blocked: AlertCircle,
};

const STATUS_COLORS: Record<string, string> = {
  open: 'text-green-400',
  'in-progress': 'text-yellow-400',
  closed: 'text-slate',
  blocked: 'text-red-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-blue-500/20 text-blue-400',
  low: 'bg-gray-500/20 text-gray-400',
};

const KIND_COLORS: Record<string, string> = {
  task: 'bg-green-500/20 text-green-400',
  bug: 'bg-red-500/20 text-red-400',
  issue: 'bg-yellow-500/20 text-yellow-400',
  tech_debt: 'bg-gray-500/20 text-gray-400',
};

export function ChildTicketsSection({
  parentId,
  childTickets,
  projectId,
}: ChildTicketsSectionProps) {
  if (!childTickets || childTickets.length === 0) {
    return null;
  }

  // Calculate progress (Sprint 15: use status constant)
  const completedCount = childTickets.filter(
    (t) => t.status === TICKET_STATUSES.DONE
  ).length;
  const progressPercent = Math.round((completedCount / childTickets.length) * 100);

  return (
    <div
      className="neu-raised smooth-transition rounded-3xl p-6"
      data-testid="child-tickets-section"
    >
      {/* Header with progress */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">Subtasks</h3>
          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
            {childTickets.length} {childTickets.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-[#2A2A2A]">
            <div
              className="h-full bg-coral transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-slate">
            {completedCount}/{childTickets.length}
          </span>
        </div>
      </div>

      {/* Child tickets list */}
      <div className="space-y-2">
        {childTickets.map((child, index) => {
          const displayId = `${parentId}.${index + 1}`;
          const StatusIcon = STATUS_ICONS[child.status] || Circle;
          const statusColor = STATUS_COLORS[child.status] || 'text-slate';
          const priorityColor = PRIORITY_COLORS[child.priority] || PRIORITY_COLORS.low;
          const kindColor = KIND_COLORS[child.kind] || 'bg-gray-500/20 text-gray-400';
          // Sprint 15: Use status constant for completion check
          const isClosed = child.status === TICKET_STATUSES.DONE;

          return (
            <Link
              key={child.id}
              href={`/tickets/${child.id}?project=${projectId}`}
              className={cn(
                'group flex items-center gap-3 rounded-xl p-3 transition-all',
                'hover:bg-white/5',
                isClosed && 'opacity-60'
              )}
              data-testid={`child-ticket-${child.id}`}
            >
              {/* Status icon */}
              <StatusIcon className={cn('h-5 w-5 flex-shrink-0', statusColor)} />

              {/* Display ID */}
              <span className="font-mono text-sm font-semibold text-coral">#{displayId}</span>

              {/* Kind badge */}
              <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', kindColor)}>
                {child.kind}
              </span>

              {/* Title */}
              <span
                className={cn('flex-1 truncate text-sm text-white', isClosed && 'line-through')}
              >
                {child.title}
              </span>

              {/* Priority badge */}
              <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', priorityColor)}>
                {child.priority}
              </span>

              {/* Assignee */}
              {child.assignee && <span className="text-xs text-slate">{child.assignee}</span>}

              {/* Arrow */}
              <ChevronRight className="h-4 w-4 text-slate opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          );
        })}
      </div>

      {/* Status summary */}
      <div className="mt-4 flex flex-wrap gap-4 border-t border-[#2A2A2A] pt-4">
        {Object.entries(
          childTickets.reduce(
            (acc, t) => {
              acc[t.status] = (acc[t.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          )
        ).map(([status, count]) => {
          const StatusIcon = STATUS_ICONS[status] || Circle;
          const color = STATUS_COLORS[status] || 'text-slate';
          return (
            <div key={status} className="flex items-center gap-1.5 text-xs">
              <StatusIcon className={cn('h-3.5 w-3.5', color)} />
              <span className="text-slate">
                {count} {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
