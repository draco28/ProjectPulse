'use client';

/**
 * SprintKanbanBoard Component - Main kanban board for sprint view
 *
 * This is the primary component that renders the full kanban board with:
 * - 5 status columns (backlog → todo → in-progress → in-review → done)
 * - Drag and drop between columns and within columns
 * - Optimistic updates with undo capability
 * - Parent/child tickets rendered independently (children with indentation)
 *
 * @example
 * ```tsx
 * <SprintKanbanBoard
 *   sprintId="abc123"
 *   onTicketClick={(ticket) => openDrawer(ticket)}
 * />
 * ```
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragOverlay, closestCenter, MeasuringStrategy } from '@dnd-kit/core';
import type { KanbanTicket, KanbanBoardResponse } from '@/types/kanban';
import type { TicketStatus } from '@/lib/constants/status';
import { TICKET_STATUS_VALUES } from '@/lib/constants/status';
import { useKanbanBoard } from '@/hooks/useKanbanBoard';
import { useKanbanDragDrop, type MoveOperation } from '@/hooks/useKanbanDragDrop';
import { useUndoToast } from '@/hooks/useUndoToast';
import { cn } from '@/lib/utils';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import FeatureCard from './FeatureCard';
import { ChildCard } from './ChildCard';
import SprintKanbanHeader from './SprintKanbanHeader';

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
  const router = useRouter();

  // Data fetching and mutations
  const { boardQuery, moveTicket, batchMoveTickets, refetch } = useKanbanBoard(sprintId);

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
  const stats = boardData?.stats;
  const sprint = boardData?.sprint;

  // Handler for New Ticket button
  const handleNewTicket = useCallback(() => {
    const params = new URLSearchParams();
    if (projectId) params.set('project', String(projectId));
    if (sprint?.sprintNumber) params.set('sprint', String(sprint.sprintNumber));
    router.push(`/tickets/create?${params.toString()}`);
  }, [router, projectId, sprint?.sprintNumber]);

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

  // Handle batch move (parent + children)
  const handleBatchMove = useCallback(
    async (moves: MoveOperation[]) => {
      if (moves.length === 0) return;

      // Store first ticket's original position for undo
      const firstMove = moves[0]!; // Safe: checked length > 0 above
      let fromStatus: TicketStatus | null = null;
      let fromOrder = 0;

      for (const s of TICKET_STATUS_VALUES) {
        const col = columns[s as TicketStatus];
        const idx = col?.findIndex((t) => t.id === firstMove.ticketId);
        if (idx !== undefined && idx !== -1) {
          fromStatus = s as TicketStatus;
          fromOrder = idx;
          break;
        }
      }

      if (fromStatus) {
        setPreviousMove({ ticketId: firstMove.ticketId, fromStatus, fromOrder });
      }

      try {
        await batchMoveTickets({ moves });

        // Show undo toast
        const ticketCount = moves.length;
        showUndoToast({
          message: `Moved ${ticketCount} ticket${ticketCount > 1 ? 's' : ''}`,
          onUndo: async () => {
            // For undo, we'd need to track all previous positions
            // For now, refetch to get accurate state
            refetch();
          },
        });
      } catch (error) {
        console.error('[SprintKanbanBoard] Batch move failed:', error);
      }
    },
    [columns, batchMoveTickets, showUndoToast, refetch]
  );

  // Drag and drop handlers
  const { dragState, sensors, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel } =
    useKanbanDragDrop({
      columns,
      onMove: handleMove,
      onBatchMove: handleBatchMove,
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
    const isChildTicket = !!ticket.parentTicketId;

    if (hasChildren) {
      // Parent/feature card (children are rendered independently)
      return <FeatureCard ticket={ticket} isOverlay />;
    }
    if (isChildTicket) {
      // Child ticket being dragged independently
      return <ChildCard ticket={ticket} isOverlay />;
    }
    // Standalone task ticket
    return <TaskCard ticket={ticket} isOverlay />;
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      {sprint && <SprintKanbanHeader sprint={sprint} projectId={projectId} stats={stats} onNewTicket={handleNewTicket} />}

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
        <div className="flex gap-4 overflow-x-auto scrollbar-auto-hide p-6 pt-2 flex-1 min-h-0">
          {TICKET_STATUS_VALUES.map((status) => (
            <KanbanColumn
              key={status}
              status={status as TicketStatus}
              tickets={columns[status as TicketStatus] ?? []}
              onTicketClick={onTicketClick}
            />
          ))}
        </div>

        {/* Drag Overlay - follows cursor during drag */}
        <DragOverlay>{renderDragOverlay()}</DragOverlay>
      </DndContext>
    </div>
  );
}

// ============================================================================
// Skeleton Loader
// ============================================================================

function KanbanBoardSkeleton() {
  return (
    <div className="flex gap-4 p-6 overflow-x-auto scrollbar-auto-hide animate-pulse">
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
