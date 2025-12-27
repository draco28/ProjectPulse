'use client';

/**
 * SprintKanbanBoard Component - Main kanban board for sprint view
 *
 * This is the primary component that renders the full kanban board with:
 * - 5 status columns (backlog → todo → in-progress → in-review → done)
 * - Drag and drop between columns and within columns
 * - Optimistic updates with undo capability
 * - Ghost cards for parent/child relationships
 *
 * @example
 * ```tsx
 * <SprintKanbanBoard
 *   sprintId="abc123"
 *   onTicketClick={(ticket) => openDrawer(ticket)}
 * />
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import { DndContext, DragOverlay, closestCenter, MeasuringStrategy } from '@dnd-kit/core';
import type { KanbanTicket, KanbanBoardResponse } from '@/types/kanban';
import type { TicketStatus } from '@/lib/constants/status';
import { TICKET_STATUS_VALUES } from '@/lib/constants/status';
import { useKanbanBoard } from '@/hooks/useKanbanBoard';
import { useKanbanDragDrop } from '@/hooks/useKanbanDragDrop';
import { useUndoToast } from '@/hooks/useUndoToast';
import { cn } from '@/lib/utils';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import FeatureCard from './FeatureCard';
import SprintKanbanHeader from './SprintKanbanHeader';
import BoardStatsBar from './BoardStatsBar';
// EmptyBoardState removed - we now always render 5 columns with EmptyColumnState per column

// ============================================================================
// Types
// ============================================================================

interface SprintKanbanBoardProps {
  /** Sprint ID to load kanban data for */
  sprintId: string;
  /** Project ID for navigation context */
  projectId?: number;
  /** Callback when a ticket card is clicked */
  onTicketClick?: (ticket: KanbanTicket) => void;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SprintKanbanBoard({ sprintId, projectId, onTicketClick, className }: SprintKanbanBoardProps) {
  // Data fetching and mutations
  const { boardQuery, moveTicket, isMoving, refetch } = useKanbanBoard(sprintId);

  // Track expanded feature cards
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(new Set());

  // Store previous state for undo
  const [previousMove, setPreviousMove] = useState<{
    ticketId: number;
    fromStatus: TicketStatus;
    fromOrder: number;
  } | null>(null);

  // Undo toast
  const { showUndoToast } = useUndoToast();

  // Extract board data
  const boardData = boardQuery.data;
  const columns = boardData?.columns ?? ({} as KanbanBoardResponse['columns']);
  const ghosts = boardData?.ghosts ?? [];
  const stats = boardData?.stats;
  const sprint = boardData?.sprint;

  // Handle move with undo capability
  const handleMove = useCallback(
    async (ticketId: number, status: TicketStatus, displayOrder: number) => {
      // Find current position for undo
      let fromStatus: TicketStatus | null = null;
      let fromOrder = 0;

      for (const s of TICKET_STATUS_VALUES) {
        const col = columns[s as TicketStatus];
        const idx = col?.findIndex((t) => t.id === ticketId);
        if (idx !== undefined && idx !== -1) {
          fromStatus = s as TicketStatus;
          fromOrder = idx;
          break;
        }
      }

      if (!fromStatus) return;

      // Store for undo
      setPreviousMove({ ticketId, fromStatus, fromOrder });

      // Execute move
      try {
        await moveTicket({ ticketId, status, displayOrder });

        // Show undo toast
        showUndoToast({
          message: `Moved ticket #${ticketId}`,
          onUndo: async () => {
            // Revert to previous position
            if (previousMove) {
              await moveTicket({
                ticketId: previousMove.ticketId,
                status: previousMove.fromStatus,
                displayOrder: previousMove.fromOrder,
              });
            }
          },
        });
      } catch (error) {
        console.error('[SprintKanbanBoard] Move failed:', error);
        // Query will auto-rollback via onError
      }
    },
    [columns, moveTicket, showUndoToast, previousMove]
  );

  // Drag and drop handlers
  const { dragState, sensors, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel } =
    useKanbanDragDrop({
      columns,
      onMove: handleMove,
      onDragStart: (ticket) => {
        // Store original position for potential undo
        const currentCol = columns[ticket.status];
        const idx = currentCol?.findIndex((t) => t.id === ticket.id) ?? 0;
        setPreviousMove({
          ticketId: ticket.id,
          fromStatus: ticket.status,
          fromOrder: idx,
        });
      },
    });

  // Feature toggle handler
  const handleFeatureToggle = useCallback((ticketId: number, expanded: boolean) => {
    setExpandedFeatures((prev) => {
      const next = new Set(prev);
      if (expanded) {
        next.add(ticketId);
      } else {
        next.delete(ticketId);
      }
      return next;
    });
  }, []);

  // Collapse all features
  const handleCollapseAll = useCallback(() => {
    setExpandedFeatures(new Set());
  }, []);

  // Ghost card click - scroll to actual ticket
  const handleGhostClick = useCallback(
    (ghost: { ticketId: number; actualStatus: TicketStatus }) => {
      // Find the actual ticket element and scroll to it
      const element = document.querySelector(`[data-ticket-id="${ghost.ticketId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Flash highlight
        element.classList.add('ring-2', 'ring-coral');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-coral');
        }, 2000);
      }
    },
    []
  );

  // Note: isEmpty check removed - we always render 5 columns now
  // Each KanbanColumn handles its own empty state via EmptyColumnState

  // Loading state
  if (boardQuery.isLoading) {
    return <KanbanBoardSkeleton />;
  }

  // Error state
  if (boardQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <p className="text-accent-red mb-4">Failed to load kanban board</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral-dark transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Note: We no longer short-circuit for empty boards.
  // The 5-column layout always renders, and each KanbanColumn
  // shows EmptyColumnState when it has no tickets.
  // This matches the mockup design and allows drag-drop into empty sprints.

  // Determine drag overlay content
  const renderDragOverlay = () => {
    if (!dragState.activeTicket) return null;

    const ticket = dragState.activeTicket;
    const hasChildren = ticket.childTickets && ticket.childTickets.length > 0;

    if (hasChildren) {
      return <FeatureCard ticket={ticket} isExpanded={false} isOverlay />;
    }
    return <TaskCard ticket={ticket} isOverlay />;
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      {sprint && (
        <SprintKanbanHeader sprint={sprint} projectId={projectId} stats={stats} onCollapseAll={handleCollapseAll} />
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
      >
        <div className="flex gap-4 overflow-x-auto p-6 pt-2 flex-1 min-h-0">
          {TICKET_STATUS_VALUES.map((status) => (
            <KanbanColumn
              key={status}
              status={status as TicketStatus}
              tickets={columns[status as TicketStatus] ?? []}
              ghosts={ghosts}
              onTicketClick={onTicketClick}
              onGhostClick={handleGhostClick}
              onFeatureToggle={handleFeatureToggle}
              expandedFeatures={expandedFeatures}
            />
          ))}
        </div>

        {/* Drag Overlay - follows cursor during drag */}
        <DragOverlay>{renderDragOverlay()}</DragOverlay>
      </DndContext>

      {/* Stats Bar */}
      {stats && <BoardStatsBar stats={stats} isMoving={isMoving} />}
    </div>
  );
}

// ============================================================================
// Skeleton Loader
// ============================================================================

function KanbanBoardSkeleton() {
  return (
    <div className="flex gap-4 p-6 overflow-x-auto animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="kanban-column flex flex-col">
          {/* Header skeleton */}
          <div className="column-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate/30" />
                <div className="h-4 w-20 bg-slate/20 rounded" />
              </div>
              <div className="h-5 w-8 bg-slate/20 rounded" />
            </div>
          </div>
          {/* Content skeleton */}
          <div className="column-content flex-1 space-y-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-24 bg-dark-card/50 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SprintKanbanBoard;
