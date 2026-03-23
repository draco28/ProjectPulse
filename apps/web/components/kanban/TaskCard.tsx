'use client';

/**
 * TaskCard Component - Draggable ticket card for Kanban board
 *
 * Renders a standalone ticket (no children) with:
 * - Priority border color
 * - AI badge for agent-assigned tickets
 * - Status-appropriate styling
 *
 * @example
 * ```tsx
 * <TaskCard
 *   ticket={ticket}
 *   onClick={() => openDrawer(ticket)}
 *   isDragging={false}
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

interface TaskCardProps {
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
 * AI Badge - Shows when ticket is assigned to an agent
 */
function AIBadge() {
  return (
    <div
      className="flex h-5 w-5 items-center justify-center rounded-full bg-coral text-[8px] font-bold text-white"
      title="Agent assigned"
    >
      AI
    </div>
  );
}

/**
 * Priority Badge - Color-coded priority indicator
 */
function PriorityBadge({ priority }: { priority: string }) {
  const priorityColors: Record<string, string> = {
    critical: 'bg-red-500/20 text-accent-red border-l-4 border-accent-red',
    high: 'bg-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/20 text-accent-yellow',
    low: 'bg-slate/20 text-slate',
  };

  const colorClass = priorityColors[priority.toLowerCase()] || priorityColors.medium;

  return (
    <span className={cn('rounded px-2 py-0.5 text-[10px] font-bold uppercase', colorClass)}>
      {priority}
    </span>
  );
}

/**
 * Kind Badge - Shows ticket type
 */
function KindBadge({ kind }: { kind: string }) {
  const kindColors: Record<string, string> = {
    feature: 'bg-emerald-500/20 text-emerald-400',
    task: 'bg-slate/20 text-slate',
    bug: 'bg-red-500/20 text-accent-red',
    issue: 'bg-orange-500/20 text-orange-400',
    tech_debt: 'bg-purple-500/20 text-accent-purple',
    epic: 'bg-blue-500/20 text-accent-blue',
  };

  const colorClass = kindColors[kind.toLowerCase()] || kindColors.task;
  const displayName = kind.replace('_', ' ').toUpperCase();

  return (
    <span className={cn('rounded px-2 py-0.5 text-[10px] font-bold', colorClass)}>
      {displayName}
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * TaskCard - Base card for standalone tickets (no children)
 */
export const TaskCard = memo(
  forwardRef<HTMLDivElement, TaskCardProps>(function TaskCard(
    { ticket, onClick, isDragging, isOverlay, className },
    ref
  ) {
    const isCritical = ticket.priority?.toLowerCase() === 'critical';
    const isAgentAssigned = ticket.assigneeType === 'agent_persona';

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          // Base styles
          'standalone-ticket cursor-pointer p-3',
          // Critical priority gets left border
          isCritical && 'border-l-4 border-accent-red',
          // Dragging states
          isDragging && 'rotate-2 scale-105 opacity-50',
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
        aria-label={`Ticket ${ticket.id}: ${ticket.title}`}
      >
        {/* Header: ID + Priority */}
        <div className="mb-2 flex items-start justify-between">
          <span className="font-mono text-xs text-slate">#{ticket.ticketNumber}</span>
          <PriorityBadge priority={ticket.priority} />
        </div>

        {/* Title */}
        <p className="mb-2 line-clamp-2 text-sm font-medium">{ticket.title}</p>

        {/* Tags Row: Kind + Module */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <KindBadge kind={ticket.kind} />
          {ticket.epicRef && (
            <span className="rounded bg-dark-pressed px-2 py-0.5 text-xs text-slate">
              {ticket.epicRef}
            </span>
          )}
        </div>

        {/* Footer: Estimate + AI Badge */}
        {isAgentAssigned && (
          <div className="mt-2 flex items-center justify-end">
            <AIBadge />
          </div>
        )}
      </div>
    );
  })
);

TaskCard.displayName = 'TaskCard';

// ============================================================================
// Sortable Wrapper
// ============================================================================

interface SortableTaskCardProps extends TaskCardProps {
  /** Unique ID for sortable */
  id: string | number;
}

/**
 * SortableTaskCard - TaskCard wrapped with @dnd-kit/sortable
 */
export function SortableTaskCard({ id, ...props }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard {...props} isDragging={isDragging} />
    </div>
  );
}

export default TaskCard;
