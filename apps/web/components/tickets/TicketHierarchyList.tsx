/**
 * TicketHierarchyList Component
 *
 * Sprint 14: Collapsible parent-child ticket display
 *
 * Features:
 * - Expand/collapse parent tickets to show children
 * - Hierarchical display IDs (#30.1, #30.2)
 * - Visual indentation for child tickets
 * - Remembers expanded state per session
 */
'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  MoreVertical,
  User,
  Clock,
  MessageSquare,
  Paperclip,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { LabelBadgeList } from '@/components/ui/LabelBadge';

type Priority = 'critical' | 'high' | 'medium' | 'low';
type Status = 'open' | 'in-progress' | 'closed';

interface Label {
  id: number | string;
  name: string;
  color: string;
}

interface ChildTicket {
  id: number;
  title: string;
  status: string;
  priority: string;
  kind: string;
  module: string | null;
  assignee: string | null;
  createdAt: Date;
  description: string | null;
  labels: Label[];
  comments: { id: number }[];
  attachments: { id: number }[];
}

interface ParentTicket {
  id: number;
  title: string;
}

export interface HierarchyTicket {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  module: string | null;
  status: string;
  kind: string;
  assignee: string | null;
  createdAt: Date;
  comments: { id: number }[];
  attachments: { id: number }[];
  labels: Label[];
  parentTicket: ParentTicket | null;
  childTickets: ChildTicket[];
}

interface TicketHierarchyListProps {
  tickets: HierarchyTicket[];
  projectId: number;
  kindLabels: Record<string, string>;
  kindColors: Record<string, string>;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-red-500 text-white shadow-md' },
  high: { label: 'High', className: 'bg-orange-500 text-white shadow-md' },
  medium: { label: 'Medium', className: 'bg-blue-400 text-white shadow-md' },
  low: { label: 'Low', className: 'neu-pressed text-slate' },
};

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-green-500 text-white shadow-md' },
  'in-progress': { label: 'In Progress', className: 'bg-yellow-500 text-white shadow-md' },
  closed: { label: 'Closed', className: 'neu-pressed text-slate' },
};

// Compute displayId for a ticket
function getDisplayId(ticket: { id: number }, parentId?: number, childIndex?: number): string {
  if (parentId !== undefined && childIndex !== undefined) {
    return `${parentId}.${childIndex + 1}`;
  }
  return `${ticket.id}`;
}

interface TicketCardProps {
  ticket: {
    id: number;
    title: string;
    description: string | null;
    priority: string;
    module: string | null;
    status: string;
    kind: string;
    assignee: string | null;
    createdAt: Date;
    labels: Label[];
    commentsCount: number;
    attachmentsCount: number;
  };
  displayId: string;
  projectId: number;
  kindLabel: string;
  kindColor: string;
  isChild?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  childrenCount?: number;
}

function TicketCard({
  ticket,
  displayId,
  projectId,
  kindLabel,
  kindColor,
  isChild = false,
  hasChildren = false,
  isExpanded = false,
  onToggleExpand,
  childrenCount = 0,
}: TicketCardProps) {
  const priorityInfo =
    PRIORITY_CONFIG[ticket.priority as Priority] || PRIORITY_CONFIG.low;
  const statusInfo =
    STATUS_CONFIG[ticket.status as Status] || {
      label: ticket.status,
      className: 'neu-pressed text-slate',
    };
  const isClosed = ticket.status === 'closed';
  const timeAgo = formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true });

  return (
    <div
      className={cn(
        'neu-raised issue-card smooth-transition rounded-3xl p-6',
        isClosed && 'opacity-60',
        isChild && 'ml-8 border-l-2 border-coral/30'
      )}
      data-testid="ticket-card"
    >
      <div className="flex items-start gap-4">
        {/* Expand/Collapse Button or Checkbox */}
        {hasChildren ? (
          <button
            onClick={onToggleExpand}
            className="mt-1 flex-shrink-0 text-slate hover:text-coral transition-colors"
            aria-label={isExpanded ? 'Collapse children' : 'Expand children'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        ) : (
          <input type="checkbox" className="mt-1 flex-shrink-0" />
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Top Row: Ticket Number + Badges + Menu */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {/* Display ID (hierarchical for children) */}
              <span className={cn(
                'font-mono text-sm font-semibold',
                isChild ? 'text-coral' : 'text-slate'
              )}>
                #{displayId}
              </span>

              {/* Kind Badge */}
              <span className={cn('rounded px-2 py-0.5 text-xs font-medium', kindColor)}>
                {kindLabel}
              </span>

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

              {/* Module Badge */}
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

              {/* Children count badge */}
              {hasChildren && childrenCount > 0 && (
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
                  {childrenCount} {childrenCount === 1 ? 'subtask' : 'subtasks'}
                </span>
              )}
            </div>

            {/* Menu Button */}
            <button
              className="smooth-transition text-slate hover:text-coral"
              aria-label="More options"
            >
              <MoreVertical className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Labels */}
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
          {ticket.description && (
            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate">
              {ticket.description}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex items-center gap-6 text-sm text-slate">
            {/* Author */}
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" aria-hidden="true" />
              {ticket.assignee || 'Unassigned'}
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

export function TicketHierarchyList({
  tickets,
  projectId,
  kindLabels,
  kindColors,
}: TicketHierarchyListProps) {
  // Track which parent tickets are expanded
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpanded = useCallback((ticketId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  }, []);

  if (tickets.length === 0) {
    return (
      <div className="neu-raised smooth-transition flex flex-col items-center justify-center rounded-3xl p-12 text-center">
        <p className="text-lg font-semibold text-white">No tickets found</p>
        <p className="text-sm text-slate">Try adjusting your filters or search term</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => {
        // Skip tickets that have a parent (they'll be shown under their parent)
        if (ticket.parentTicket) {
          return null;
        }

        const hasChildren = ticket.childTickets && ticket.childTickets.length > 0;
        const isExpanded = expandedIds.has(ticket.id);

        return (
          <div key={ticket.id}>
            {/* Parent Ticket */}
            <TicketCard
              ticket={{
                id: ticket.id,
                title: ticket.title,
                description: ticket.description,
                priority: ticket.priority,
                module: ticket.module,
                status: ticket.status,
                kind: ticket.kind,
                assignee: ticket.assignee,
                createdAt: ticket.createdAt,
                labels: ticket.labels,
                commentsCount: ticket.comments.length,
                attachmentsCount: ticket.attachments.length,
              }}
              displayId={getDisplayId(ticket)}
              projectId={projectId}
              kindLabel={kindLabels[ticket.kind] || ticket.kind}
              kindColor={kindColors[ticket.kind] || 'bg-gray-500/20 text-gray-400'}
              hasChildren={hasChildren}
              isExpanded={isExpanded}
              onToggleExpand={() => toggleExpanded(ticket.id)}
              childrenCount={ticket.childTickets?.length || 0}
            />

            {/* Child Tickets (when expanded) */}
            {hasChildren && isExpanded && (
              <div className="mt-2 space-y-2">
                {ticket.childTickets.map((child, index) => (
                  <TicketCard
                    key={child.id}
                    ticket={{
                      id: child.id,
                      title: child.title,
                      description: child.description,
                      priority: child.priority,
                      module: child.module,
                      status: child.status,
                      kind: child.kind,
                      assignee: child.assignee,
                      createdAt: child.createdAt,
                      labels: child.labels,
                      commentsCount: child.comments.length,
                      attachmentsCount: child.attachments.length,
                    }}
                    displayId={getDisplayId(child, ticket.id, index)}
                    projectId={projectId}
                    kindLabel={kindLabels[child.kind] || child.kind}
                    kindColor={kindColors[child.kind] || 'bg-gray-500/20 text-gray-400'}
                    isChild
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
