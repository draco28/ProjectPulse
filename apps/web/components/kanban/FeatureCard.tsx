'use client';

/**
 * FeatureCard Component - Parent ticket card showing summary
 *
 * Features:
 * - Progress bar showing child completion %
 * - Active work indicator (coral ring) when agent is working
 * - Task count summary
 *
 * Note: Children are rendered separately as SortableChildCard components
 * in the column, not nested inside this card.
 */

import { forwardRef, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanTicket } from '@/types/kanban';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface FeatureCardProps {
  /** Feature ticket data */
  ticket: KanbanTicket;
  /** Click handler - opens ticket drawer */
  onClick?: () => void;
  /** Whether card is being dragged */
  isDragging?: boolean;
  /** Whether showing as drag overlay */
  isOverlay?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export const FeatureCard = memo(
  forwardRef<HTMLDivElement, FeatureCardProps>(function FeatureCard(
    { ticket, onClick, isDragging, isOverlay },
    ref
  ) {
    const hasChildren = ticket.childTickets && ticket.childTickets.length > 0;
    const childCount = ticket.childTickets?.length ?? 0;
    const progress = ticket.childProgress ?? 0;

    // Check if any agent is working on this feature's children
    const isAgentWorking = ticket.assigneeType === 'agent_persona';

    // Sprint 16: Session linkage indicator
    const isLinkedToSession = !!ticket.linkedSessionId;

    // Progress bar color based on status
    const progressColor =
      progress === 100
        ? 'bg-accent-green'
        : progress > 50
          ? 'bg-accent-yellow'
          : progress > 0
            ? 'bg-coral'
            : 'bg-slate';

    return (
      <div
        ref={ref}
        className={cn(
          'feature-card',
          isAgentWorking && 'active-work',
          // Sprint 16: Session linkage styling
          isLinkedToSession && 'ring-2 ring-emerald-500/50',
          isDragging && 'opacity-50 rotate-2',
          isOverlay && 'shadow-2xl ring-2 ring-coral/50'
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
        aria-label={`Feature ${ticket.id}: ${ticket.title}`}
      >
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-slate">#{ticket.id}</span>
              {/* Sprint 16: Session linkage indicator */}
              {isLinkedToSession && (
                <div
                  className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[7px] flex items-center justify-center font-bold animate-pulse"
                  title={`Linked to session: ${ticket.linkedSessionId?.slice(0, 8)}...`}
                >
                  ⚡
                </div>
              )}
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
