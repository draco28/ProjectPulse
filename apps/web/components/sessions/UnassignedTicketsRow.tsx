'use client';

/**
 * UnassignedTicketsRow - Horizontal scroll row of unassigned tickets
 *
 * Sprint 15 Phase F
 *
 * Features:
 * - Queries tickets where assignee IS NULL and status in (backlog, todo)
 * - Horizontal scroll container
 * - Each ticket shows: ID, kind badge, title, priority
 * - Click opens TicketDetailDrawer
 */

import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { KanbanTicket } from '@/types/kanban';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface UnassignedTicketsRowProps {
  projectId: number;
  /** Handler for ticket click */
  onTicketClick?: (ticket: KanbanTicket) => void;
}

interface TicketsResponse {
  data?: {
    tickets?: KanbanTicket[];
  };
  tickets?: KanbanTicket[];
}

// ============================================================================
// Helper Components
// ============================================================================

function KindBadge({ kind }: { kind: string }) {
  const kindColors: Record<string, string> = {
    feature: 'bg-emerald-500/20 text-emerald-400',
    task: 'bg-slate/20 text-slate',
    bug: 'bg-red-500/20 text-accent-red',
    issue: 'bg-orange-500/20 text-orange-400',
    tech_debt: 'bg-purple-500/20 text-accent-purple',
    epic: 'bg-blue-500/20 text-accent-blue',
  };

  const colorClass = kindColors[kind?.toLowerCase()] || kindColors.task;

  return (
    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase', colorClass)}>
      {kind?.replace('_', ' ').slice(0, 4) || 'TASK'}
    </span>
  );
}

function PriorityIndicator({ priority }: { priority: string }) {
  const priorityColors: Record<string, string> = {
    critical: 'border-l-red-500',
    high: 'border-l-orange-400',
    medium: 'border-l-yellow-400',
    low: 'border-l-slate/50',
  };

  const colorClass = priorityColors[priority?.toLowerCase()] || priorityColors.medium;

  return <div className={cn('absolute bottom-0 left-0 top-0 w-0.5 rounded-l', colorClass)} />;
}

function UnassignedTicketCard({
  ticket,
  onClick,
}: {
  ticket: KanbanTicket;
  onClick?: (ticket: KanbanTicket) => void;
}) {
  return (
    <button
      onClick={() => onClick?.(ticket)}
      className={cn(
        'relative w-64 flex-shrink-0 rounded-lg p-3 text-left transition-all',
        'bg-white/[0.02] hover:bg-white/[0.05]',
        'border border-white/5 hover:border-white/10',
        'border-l-2'
      )}
    >
      <PriorityIndicator priority={ticket.priority} />

      {/* Header */}
      <div className="mb-1.5 flex items-center gap-2">
        <span className="font-mono text-xs text-slate">#{ticket.id}</span>
        <KindBadge kind={ticket.kind} />
      </div>

      {/* Title */}
      <p className="line-clamp-2 text-sm leading-snug text-white">{ticket.title}</p>

      {/* Sprint info */}
      {ticket.sprintNumber && (
        <p className="mt-2 text-xs text-slate/60">Sprint {ticket.sprintNumber}</p>
      )}
    </button>
  );
}

// ============================================================================
// Component
// ============================================================================

export const UnassignedTicketsRow = memo(function UnassignedTicketsRow({
  projectId,
  onTicketClick,
}: UnassignedTicketsRowProps) {
  // Fetch unassigned tickets
  const ticketsQuery = useQuery({
    queryKey: ['unassigned-tickets', projectId],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: 'backlog,todo',
        assignee: '', // Empty = unassigned
        pageSize: '20',
      });

      const res = await fetch(`/api/tickets?${params}`);
      if (!res.ok) throw new Error('Failed to fetch tickets');

      const data: TicketsResponse = await res.json();
      // Filter to only unassigned tickets
      const tickets = data.data?.tickets || data.tickets || [];
      return tickets.filter((t) => !t.assignee);
    },
    enabled: projectId > 0,
    staleTime: 60_000,
  });

  const tickets = ticketsQuery.data || [];

  // Don't render if no unassigned tickets
  if (!ticketsQuery.isLoading && tickets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate">
          Unassigned Tickets
        </h3>
        <span className="text-xs text-slate/60">
          {ticketsQuery.isLoading ? '...' : `${tickets.length} tickets`}
        </span>
      </div>

      {/* Scrollable Row */}
      <div className="relative">
        <div className="custom-scrollbar -mx-2 flex gap-3 overflow-x-auto px-2 pb-2">
          {ticketsQuery.isLoading
            ? // Loading skeletons
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 w-64 flex-shrink-0 animate-pulse rounded-lg bg-white/[0.02]"
                />
              ))
            : tickets.map((ticket) => (
                <UnassignedTicketCard key={ticket.id} ticket={ticket} onClick={onTicketClick} />
              ))}
        </div>

        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-dark to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-dark to-transparent" />
      </div>
    </div>
  );
});

UnassignedTicketsRow.displayName = 'UnassignedTicketsRow';

export default UnassignedTicketsRow;
