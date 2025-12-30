/**
 * TicketListCard Component
 *
 * Individual ticket card for the tickets list page
 * Sprint 10.5: Renamed from IssueListCard
 *
 * Features:
 * - Checkbox for selection
 * - Ticket number, priority, module, status badges
 * - Title with line-through for closed tickets
 * - Description preview (2 lines)
 * - Metadata (author, time, comments, attachments)
 * - Menu button
 * - Hover effect (translateY -2px)
 * - Opacity 60% for closed tickets
 */
'use client';

import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { MoreVertical, User, Clock, MessageSquare, Paperclip } from 'lucide-react';
import { LabelBadgeList } from '@/components/ui/LabelBadge';
import { TICKET_STATUSES, type TicketStatus } from '@/lib/constants/status';

type Priority = 'critical' | 'high' | 'medium' | 'low';
// Sprint 15: Use centralized TicketStatus type
type Status = TicketStatus;

interface Label {
  id: number | string;
  name: string;
  color: string;
}

interface TicketListCardProps {
  ticket: {
    id: number;  // Global ID for routing/API
    ticketNumber: number;  // Sprint 17: Project-scoped number for display
    title: string;
    description: string;
    priority: Priority;
    module: string;
    status: Status;
    assignee: string;
    createdAt: Date;
    commentsCount: number;
    attachmentsCount: number;
    labels?: Label[];
  };
  projectId: number;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-red-500 text-white shadow-md' },
  high: { label: 'High', className: 'bg-orange-500 text-white shadow-md' },
  medium: { label: 'Medium', className: 'bg-blue-400 text-white shadow-md' },
  low: { label: 'Low', className: 'neu-pressed text-slate' },
};

// Sprint 15: Updated for 5-status kanban workflow
const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  backlog: { label: 'Backlog', className: 'neu-pressed text-slate' },
  todo: { label: 'To Do', className: 'bg-slate-500 text-white shadow-md' },
  'in-progress': { label: 'In Progress', className: 'bg-yellow-500 text-white shadow-md' },
  'in-review': { label: 'In Review', className: 'bg-purple-500 text-white shadow-md' },
  done: { label: 'Done', className: 'bg-green-500 text-white shadow-md' },
};

export function TicketListCard({ ticket, projectId }: TicketListCardProps) {
  const priorityInfo = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.low;
  const statusInfo = STATUS_CONFIG[ticket.status] || {
    label: ticket.status,
    className: 'neu-pressed text-slate',
  };
  // Sprint 15: Use status constant for completion check
  const isClosed = ticket.status === TICKET_STATUSES.DONE;

  // Format time ago
  const timeAgo = formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true });

  return (
    <div
      className={cn(
        'neu-raised issue-card smooth-transition rounded-3xl p-6',
        isClosed && 'opacity-60'
      )}
      data-testid="ticket-card"
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input type="checkbox" className="mt-1 flex-shrink-0" />

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Top Row: Ticket Number + Badges + Menu */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {/* Ticket Number - Sprint 17: Use project-scoped ticketNumber */}
              <span className="font-mono text-sm font-semibold text-slate">#{ticket.ticketNumber}</span>

              {/* Priority Badge */}
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold',
                  priorityInfo.className
                )}
                data-testid="priority-badge"
              >
                {priorityInfo.label}
              </span>

              {/* Module Badge - only show if module is set */}
              {ticket.module && (
                <span className="rounded-full bg-coral px-3 py-1 text-xs font-semibold text-white shadow-md">
                  {ticket.module}
                </span>
              )}

              {/* Status Badge */}
              <span
                className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusInfo.className)}
                data-testid="status-badge"
              >
                {statusInfo.label}
              </span>
            </div>

            {/* Menu Button */}
            <button
              className="smooth-transition text-slate hover:text-coral"
              aria-label="More options"
            >
              <MoreVertical className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Labels (Sprint 11.7) */}
          {ticket.labels && ticket.labels.length > 0 && (
            <div className="mb-3" data-testid="ticket-labels">
              <LabelBadgeList labels={ticket.labels} maxVisible={3} size="sm" />
            </div>
          )}

          {/* Title */}
          <h3 className={cn('mb-2 text-lg font-bold text-white', isClosed && 'line-through')}>
            <Link
              href={`/tickets/${ticket.id}?project=${projectId}`}
              className="smooth-transition hover:text-coral"
            >
              {ticket.title}
            </Link>
          </h3>

          {/* Description */}
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate">
            {ticket.description}
          </p>

          {/* Metadata Row */}
          <div className="flex items-center gap-6 text-sm text-slate">
            {/* Author */}
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" aria-hidden="true" />
              {ticket.assignee}
            </span>

            {/* Time */}
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {timeAgo}
            </span>

            {/* Comments */}
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              {ticket.commentsCount} {ticket.commentsCount === 1 ? 'comment' : 'comments'}
            </span>

            {/* Attachments */}
            {ticket.attachmentsCount > 0 && (
              <span className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" aria-hidden="true" />
                {ticket.attachmentsCount} {ticket.attachmentsCount === 1 ? 'file' : 'files'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
