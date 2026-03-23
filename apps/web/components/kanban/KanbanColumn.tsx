'use client';

/**
 * KanbanColumn Component - Droppable column for kanban board
 *
 * Features:
 * - Status-colored header with count badge
 * - Droppable area for ticket cards
 * - Virtualized list for performance (when many tickets)
 * - Empty state placeholder
 *
 * @example
 * ```tsx
 * <KanbanColumn
 *   status="in-progress"
 *   tickets={tickets}
 *   ghosts={ghosts}
 *   onTicketClick={handleTicketClick}
 * />
 * ```
 */

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { memo, useMemo } from 'react';
import type { KanbanTicket } from '@/types/kanban';
import type { TicketStatus } from '@/lib/constants/status';
import { TicketStatusSystem, TICKET_STATUSES } from '@/lib/constants/status';
import { cn } from '@/lib/utils';
import { SortableTaskCard } from './TaskCard';
import { SortableFeatureCard } from './FeatureCard';
import { SortableChildCard } from './ChildCard';
import EmptyColumnState from './EmptyColumnState';

// ============================================================================
// Types
// ============================================================================

interface KanbanColumnProps {
  /** Status this column represents */
  status: TicketStatus;
  /** Tickets in this column */
  tickets: KanbanTicket[];
  /** Handler when a ticket card is clicked */
  onTicketClick?: (ticket: KanbanTicket) => void;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Status Colors
// ============================================================================

const STATUS_COLORS: Record<TicketStatus, { dot: string; border: string; pulse?: boolean }> = {
  [TICKET_STATUSES.BACKLOG]: { dot: 'bg-slate', border: '' },
  [TICKET_STATUSES.TODO]: { dot: 'bg-coral', border: 'border-l-4 border-coral' },
  [TICKET_STATUSES.IN_PROGRESS]: {
    dot: 'bg-accent-yellow',
    border: 'border-l-4 border-accent-yellow',
    pulse: true,
  },
  [TICKET_STATUSES.IN_REVIEW]: {
    dot: 'bg-accent-purple',
    border: 'border-l-4 border-accent-purple',
  },
  [TICKET_STATUSES.DONE]: { dot: 'bg-accent-green', border: 'border-l-4 border-accent-green' },
};

// ============================================================================
// Component
// ============================================================================

export const KanbanColumn = memo(function KanbanColumn({
  status,
  tickets,
  onTicketClick,
  className,
}: KanbanColumnProps) {
  // Droppable setup - column can receive dropped tickets
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  // Get status display info
  const label = TicketStatusSystem.getLabel(status);
  const colors = STATUS_COLORS[status];

  // Categorize tickets: features (parents), children, and standalone
  // ALL tickets are now independently draggable
  const { features, childTickets, standaloneTickets } = useMemo(() => {
    const features: KanbanTicket[] = [];
    const childTickets: KanbanTicket[] = [];
    const standaloneTickets: KanbanTicket[] = [];

    // Build set of ticket IDs in this column for parent lookup (reserved for future use)
    const _ticketIdsInColumn = new Set(tickets.map((t) => t.id));

    for (const ticket of tickets) {
      if (ticket.childTickets && ticket.childTickets.length > 0) {
        // Has children - this is a feature/parent ticket
        features.push(ticket);
      } else if (!ticket.parentTicketId) {
        // No parent, no children - standalone ticket
        standaloneTickets.push(ticket);
      } else {
        // Has parent - this is a child ticket, render independently
        // Child tickets are now rendered independently (not hidden inside parent)
        childTickets.push(ticket);
      }
    }

    return { features, childTickets, standaloneTickets };
  }, [tickets]);

  // Sortable IDs for @dnd-kit - ALL tickets are now draggable
  const sortableIds = useMemo(
    () => [...features, ...childTickets, ...standaloneTickets].map((t) => String(t.id)),
    [features, childTickets, standaloneTickets]
  );

  return (
    <div className={cn('kanban-column flex flex-col', className)}>
      {/* Column Header */}
      <div className={cn('column-header', colors.border)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                colors.dot,
                colors.pulse && 'animate-pulse'
              )}
            />
            <h3 className="font-semibold">{label}</h3>
          </div>
          <span className="rounded bg-dark-pressed px-2 py-0.5 text-sm text-slate">
            {tickets.length}
          </span>
        </div>
      </div>

      {/* Column Content - Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn(
          'column-content scrollbar-thin flex-1 space-y-3 overflow-y-auto',
          isOver && 'bg-coral/5 ring-2 ring-inset ring-coral/20'
        )}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {/* Feature Cards (parent tickets with children) */}
          {features.map((ticket) => (
            <SortableFeatureCard
              key={ticket.id}
              id={ticket.id}
              ticket={ticket}
              onClick={() => onTicketClick?.(ticket)}
            />
          ))}

          {/* Child Tickets (independently draggable) */}
          {childTickets.map((ticket) => (
            <SortableChildCard
              key={ticket.id}
              id={ticket.id}
              ticket={ticket}
              onClick={() => onTicketClick?.(ticket)}
            />
          ))}

          {/* Standalone Tickets (no parent, no children) */}
          {standaloneTickets.map((ticket) => (
            <SortableTaskCard
              key={ticket.id}
              id={ticket.id}
              ticket={ticket}
              onClick={() => onTicketClick?.(ticket)}
            />
          ))}

          {/* Empty State */}
          {tickets.length === 0 && <EmptyColumnState status={status} />}
        </SortableContext>
      </div>
    </div>
  );
});

KanbanColumn.displayName = 'KanbanColumn';

export default KanbanColumn;
