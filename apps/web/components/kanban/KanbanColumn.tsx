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
import type { KanbanTicket, GhostCard as GhostCardType } from '@/types/kanban';
import type { TicketStatus } from '@/lib/constants/status';
import { TicketStatusSystem, TICKET_STATUSES } from '@/lib/constants/status';
import { cn } from '@/lib/utils';
import { SortableTaskCard } from './TaskCard';
import { SortableFeatureCard } from './FeatureCard';
import GhostCard from './GhostCard';
import EmptyColumnState from './EmptyColumnState';

// ============================================================================
// Types
// ============================================================================

interface KanbanColumnProps {
  /** Status this column represents */
  status: TicketStatus;
  /** Tickets in this column */
  tickets: KanbanTicket[];
  /** Ghost cards to display (tickets from other columns) */
  ghosts?: GhostCardType[];
  /** Handler when a ticket card is clicked */
  onTicketClick?: (ticket: KanbanTicket) => void;
  /** Handler when a ghost card is clicked (scroll to actual ticket) */
  onGhostClick?: (ghost: GhostCardType) => void;
  /** Handler when a feature card is expanded/collapsed */
  onFeatureToggle?: (ticketId: number, expanded: boolean) => void;
  /** Set of expanded feature IDs */
  expandedFeatures?: Set<number>;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Status Colors
// ============================================================================

const STATUS_COLORS: Record<TicketStatus, { dot: string; border: string; pulse?: boolean }> = {
  [TICKET_STATUSES.BACKLOG]: { dot: 'bg-slate', border: '' },
  [TICKET_STATUSES.TODO]: { dot: 'bg-coral', border: 'border-l-4 border-coral' },
  [TICKET_STATUSES.IN_PROGRESS]: { dot: 'bg-accent-yellow', border: 'border-l-4 border-accent-yellow', pulse: true },
  [TICKET_STATUSES.IN_REVIEW]: { dot: 'bg-accent-purple', border: 'border-l-4 border-accent-purple' },
  [TICKET_STATUSES.DONE]: { dot: 'bg-accent-green', border: 'border-l-4 border-accent-green' },
};

// ============================================================================
// Component
// ============================================================================

export const KanbanColumn = memo(function KanbanColumn({
  status,
  tickets,
  ghosts = [],
  onTicketClick,
  onGhostClick,
  onFeatureToggle,
  expandedFeatures = new Set(),
  className,
}: KanbanColumnProps) {
  // Droppable setup - column can receive dropped tickets
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  // Get status display info
  const label = TicketStatusSystem.getLabel(status);
  const colors = STATUS_COLORS[status];

  // Separate features (tickets with children) from standalone tickets
  const { features, standaloneTickets } = useMemo(() => {
    const features: KanbanTicket[] = [];
    const standaloneTickets: KanbanTicket[] = [];

    for (const ticket of tickets) {
      if (ticket.childTickets && ticket.childTickets.length > 0) {
        features.push(ticket);
      } else if (!ticket.parentTicketId) {
        // Only standalone if it has no parent AND no children
        standaloneTickets.push(ticket);
      }
      // Skip child tickets - they render inside their parent FeatureCard
    }

    return { features, standaloneTickets };
  }, [tickets]);

  // Get ghosts for this column
  const columnGhosts = useMemo(
    () => ghosts.filter((g) => g.ghostInStatus === status),
    [ghosts, status]
  );

  // Sortable IDs for @dnd-kit
  const sortableIds = useMemo(
    () => [...features, ...standaloneTickets].map((t) => String(t.id)),
    [features, standaloneTickets]
  );

  return (
    <div className={cn('kanban-column flex flex-col', className)}>
      {/* Column Header */}
      <div className={cn('column-header', colors.border)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn('w-2.5 h-2.5 rounded-full', colors.dot, colors.pulse && 'animate-pulse')}
            />
            <h3 className="font-semibold">{label}</h3>
          </div>
          <span className="text-slate text-sm bg-dark-pressed px-2 py-0.5 rounded">
            {tickets.length}
          </span>
        </div>
      </div>

      {/* Column Content - Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn(
          'column-content flex-1 overflow-y-auto scrollbar-thin space-y-3',
          isOver && 'bg-coral/5 ring-2 ring-coral/20 ring-inset'
        )}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {/* Ghost Cards */}
          {columnGhosts.map((ghost) => (
            <GhostCard key={`ghost-${ghost.ticketId}`} ghost={ghost} onClick={onGhostClick} />
          ))}

          {/* Feature Cards (expandable with children) */}
          {features.map((ticket) => (
            <SortableFeatureCard
              key={ticket.id}
              id={ticket.id}
              ticket={ticket}
              isExpanded={expandedFeatures.has(ticket.id)}
              onToggle={(expanded) => onFeatureToggle?.(ticket.id, expanded)}
              onClick={() => onTicketClick?.(ticket)}
              onChildClick={(childId) => {
                const child = ticket.childTickets?.find((c) => c.id === childId);
                if (child) {
                  // Find full ticket data - for now just use what we have
                  onTicketClick?.({ ...ticket, id: childId } as KanbanTicket);
                }
              }}
            />
          ))}

          {/* Standalone Tickets */}
          {standaloneTickets.map((ticket) => (
            <SortableTaskCard
              key={ticket.id}
              id={ticket.id}
              ticket={ticket}
              onClick={() => onTicketClick?.(ticket)}
            />
          ))}

          {/* Empty State */}
          {tickets.length === 0 && columnGhosts.length === 0 && (
            <EmptyColumnState status={status} />
          )}
        </SortableContext>
      </div>
    </div>
  );
});

KanbanColumn.displayName = 'KanbanColumn';

export default KanbanColumn;
