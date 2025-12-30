'use client';

/**
 * ChildCard Component - Draggable child ticket card for Kanban board
 *
 * Renders a child ticket (has parentTicketId) with:
 * - Visual indentation to show hierarchy
 * - Parent reference indicator
 * - Priority and kind badges
 * - useSortable wrapper for independent drag-drop
 *
 * @example
 * ```tsx
 * <SortableChildCard
 *   id={ticket.id}
 *   ticket={ticket}
 *   onClick={() => openDrawer(ticket)}
 * />
 * ```
 */

import { forwardRef, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanTicket } from '@/types/kanban';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface ChildCardProps {
  /** Ticket data to display */
  ticket: KanbanTicket;
  /** Click handler (opens detail drawer) */
  onClick?: () => void;
  /** Whether the card is currently being dragged */
  isDragging?: boolean;
  /** Whether to show as a drag overlay (floating) */
  isOverlay?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Kind Badge - Color-coded type indicator
 */
function KindBadge({ kind }: { kind: string }) {
  const kindColors: Record<string, string> = {
    task: 'bg-slate/20 text-slate',
    bug: 'bg-red-500/20 text-accent-red',
    issue: 'bg-orange-500/20 text-orange-400',
    tech_debt: 'bg-purple-500/20 text-accent-purple',
  };

  const colorClass = kindColors[kind.toLowerCase()] || kindColors.task;
  const displayName = kind.replace('_', ' ');

  return (
    <span className={cn('px-1.5 py-0.5 text-[10px] rounded capitalize', colorClass)}>
      {displayName}
    </span>
  );
}

/**
 * Priority Dot - Small colored dot for priority
 */
function PriorityDot({ priority }: { priority: string }) {
  const priorityColors: Record<string, string> = {
    critical: 'bg-accent-red',
    high: 'bg-orange-400',
    medium: 'bg-accent-yellow',
    low: 'bg-slate',
  };

  const colorClass = priorityColors[priority.toLowerCase()] || priorityColors.medium;

  return (
    <div className={cn('w-2 h-2 rounded-full', colorClass)} title={`Priority: ${priority}`} />
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ChildCard - Card for child tickets (tickets with parentTicketId)
 * Visually indented to show hierarchy, independently draggable
 */
export const ChildCard = memo(
  forwardRef<HTMLDivElement, ChildCardProps>(function ChildCard(
    { ticket, onClick, isDragging, isOverlay, className },
    ref
  ) {
    const isAgentAssigned = ticket.assigneeType === 'agent_persona';
    // Sprint 16: Session linkage indicator
    const isLinkedToSession = !!ticket.linkedSessionId;

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          // Indentation and child-specific styling
          'child-ticket-card ml-6 p-3 cursor-pointer',
          'bg-gradient-to-br from-dark-card to-dark-lighter',
          'rounded-lg border-l-2',
          // Sprint 16: Session linkage styling
          isLinkedToSession
            ? 'border-emerald-500 ring-1 ring-emerald-500/30'
            : 'border-slate/40',
          'hover:border-coral/60 hover:translate-x-1 transition-all',
          // Dragging states
          isDragging && 'opacity-50 rotate-1 scale-105',
          isOverlay && 'shadow-2xl ring-2 ring-coral/50',
          className
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
        aria-label={`Child ticket ${ticket.id}: ${ticket.title}`}
      >
        {/* Header: ID + Parent Ref + Priority */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate">#{ticket.ticketNumber}</span>
            {ticket.parentTicket && (
              <span className="text-[9px] text-slate/60">
                ↳ #{ticket.parentTicket.ticketNumber}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <PriorityDot priority={ticket.priority} />
            {/* Sprint 16: Session linkage indicator */}
            {isLinkedToSession && (
              <div
                className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[7px] flex items-center justify-center font-bold animate-pulse"
                title={`Linked to session: ${ticket.linkedSessionId?.slice(0, 8)}...`}
              >
                ⚡
              </div>
            )}
            {isAgentAssigned && !isLinkedToSession && (
              <div
                className="w-4 h-4 rounded-full bg-coral text-white text-[7px] flex items-center justify-center font-bold"
                title="Agent assigned"
              >
                AI
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <p className="text-xs font-medium mb-1.5 line-clamp-2">{ticket.title}</p>

        {/* Kind Badge */}
        <div className="flex items-center gap-1">
          <KindBadge kind={ticket.kind} />
        </div>
      </div>
    );
  })
);

ChildCard.displayName = 'ChildCard';

// ============================================================================
// Sortable Wrapper
// ============================================================================

interface SortableChildCardProps extends ChildCardProps {
  /** Unique ID for sortable */
  id: string | number;
}

/**
 * SortableChildCard - ChildCard wrapped with @dnd-kit/sortable
 * Enables independent drag-drop for child tickets
 */
export function SortableChildCard({ id, ...props }: SortableChildCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ChildCard {...props} isDragging={isDragging} />
    </div>
  );
}

export default ChildCard;
