'use client';

/**
 * FeatureCard Component - Expandable parent ticket card
 *
 * Features:
 * - Expandable/collapsible to show child tasks
 * - Progress bar showing child completion %
 * - Active work indicator (coral ring) when agent is working
 * - Nested ChildTaskCard components
 *
 * Full implementation coming in Phase D4.
 */

import { forwardRef, memo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanTicket } from '@/types/kanban';
import { cn } from '@/lib/utils';
import { TICKET_STATUSES } from '@/lib/constants/status';
import type { TicketStatus } from '@/lib/constants/status';

// ============================================================================
// Types
// ============================================================================

interface FeatureCardProps {
  /** Feature ticket data */
  ticket: KanbanTicket;
  /** Whether children are visible */
  isExpanded?: boolean;
  /** Toggle expand/collapse */
  onToggle?: (expanded: boolean) => void;
  /** Click on the feature card header */
  onClick?: () => void;
  /** Click on a child task */
  onChildClick?: (childId: number) => void;
  /** Whether card is being dragged */
  isDragging?: boolean;
  /** Whether showing as drag overlay */
  isOverlay?: boolean;
}

// ============================================================================
// Child Task Card (inline - small nested card)
// ============================================================================

interface ChildTaskCardProps {
  childId: number;
  status: TicketStatus;
  title?: string;
  onClick?: () => void;
}

const CHILD_STATUS_COLORS: Record<TicketStatus, { border: string; text: string; label: string }> = {
  [TICKET_STATUSES.DONE]: { border: 'border-accent-green', text: 'text-accent-green', label: '✓ Done' },
  [TICKET_STATUSES.IN_PROGRESS]: { border: 'border-accent-yellow', text: 'text-accent-yellow', label: 'In Progress' },
  [TICKET_STATUSES.IN_REVIEW]: { border: 'border-accent-purple', text: 'text-accent-purple', label: 'Review' },
  [TICKET_STATUSES.TODO]: { border: 'border-coral', text: 'text-coral', label: 'To Do' },
  [TICKET_STATUSES.BACKLOG]: { border: 'border-slate', text: 'text-slate', label: 'Backlog' },
};

const DEFAULT_COLORS = { border: 'border-slate', text: 'text-slate', label: 'Unknown' };

function ChildTaskCard({ childId, status, title, onClick }: ChildTaskCardProps) {
  const colors = CHILD_STATUS_COLORS[status] ?? DEFAULT_COLORS;
  const isDone = status === TICKET_STATUSES.DONE;

  return (
    <div
      className={cn(
        'child-task p-3 border-l-3',
        colors.border,
        isDone && 'opacity-60',
        'hover:translate-x-1 transition-transform cursor-pointer'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onClick?.();
        }
      }}
    >
      <div className="flex justify-between mb-1">
        <span className="text-[10px] font-mono text-slate">#{childId}</span>
        <span className={cn('text-xs', colors.text)}>{colors.label}</span>
      </div>
      {title && <p className={cn('text-xs', isDone && 'line-through')}>{title || `Task #${childId}`}</p>}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export const FeatureCard = memo(
  forwardRef<HTMLDivElement, FeatureCardProps>(function FeatureCard(
    { ticket, isExpanded = false, onToggle, onClick, onChildClick, isDragging, isOverlay },
    ref
  ) {
    const [localExpanded, setLocalExpanded] = useState(isExpanded);
    const expanded = isExpanded ?? localExpanded;

    const hasChildren = ticket.childTickets && ticket.childTickets.length > 0;
    const childCount = ticket.childTickets?.length ?? 0;
    const progress = ticket.childProgress ?? 0;

    // Check if any agent is working on this feature's children
    const isAgentWorking = ticket.assigneeType === 'agent_persona';

    // Progress bar color based on status
    const progressColor =
      progress === 100
        ? 'bg-accent-green'
        : progress > 50
          ? 'bg-accent-yellow'
          : progress > 0
            ? 'bg-coral'
            : 'bg-slate';

    const handleToggle = () => {
      const newExpanded = !expanded;
      setLocalExpanded(newExpanded);
      onToggle?.(newExpanded);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'feature-card',
          expanded && 'expanded',
          isAgentWorking && 'active-work',
          isDragging && 'opacity-50 rotate-2',
          isOverlay && 'shadow-2xl ring-2 ring-coral/50'
        )}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        aria-expanded={expanded}
        aria-label={`Feature ${ticket.id}: ${ticket.title}`}
      >
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Expand chevron */}
              <svg
                className={cn(
                  'w-4 h-4 expand-icon transition-transform',
                  expanded ? 'text-coral rotate-90' : 'text-slate'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-xs font-mono text-slate">#{ticket.id}</span>
            </div>
            <span
              className={cn(
                'px-2 py-0.5 text-[10px] rounded font-bold',
                isAgentWorking ? 'bg-coral/20 text-coral' : 'bg-emerald-500/20 text-emerald-400'
              )}
            >
              FEATURE
            </span>
          </div>

          {/* Title */}
          <p className="font-semibold text-sm mb-3">{ticket.title}</p>

          {/* Progress */}
          {hasChildren && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate">{childCount} tasks</span>
                <div className="w-16 h-1 bg-dark rounded-full overflow-hidden">
                  <div className={cn('h-full', progressColor)} style={{ width: `${progress}%` }} />
                </div>
              </div>
              <span className={cn('text-xs font-bold', progress > 0 ? 'text-coral' : 'text-slate')}>
                {progress}%
              </span>
            </div>
          )}
        </div>

        {/* Children Container (collapsible) */}
        {hasChildren && (
          <div className="children-container">
            <div className="px-4 pb-4 space-y-2">
              {ticket.childTickets?.map((child) => (
                <ChildTaskCard
                  key={child.id}
                  childId={child.id}
                  status={child.status}
                  onClick={() => onChildClick?.(child.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  })
);

FeatureCard.displayName = 'FeatureCard';

// ============================================================================
// Sortable Wrapper
// ============================================================================

interface SortableFeatureCardProps extends FeatureCardProps {
  id: string | number;
}

export function SortableFeatureCard({ id, ...props }: SortableFeatureCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <FeatureCard {...props} isDragging={isDragging} />
    </div>
  );
}

export default FeatureCard;
