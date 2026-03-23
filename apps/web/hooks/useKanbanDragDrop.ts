/**
 * Drag and Drop state management hook for Kanban board
 *
 * Handles @dnd-kit events and state for the kanban board:
 * - Active ticket tracking during drag
 * - Target column detection
 * - Drop index calculation
 *
 * @example
 * ```tsx
 * const {
 *   dragState,
 *   sensors,
 *   handleDragStart,
 *   handleDragOver,
 *   handleDragEnd,
 *   handleDragCancel,
 * } = useKanbanDragDrop({
 *   columns: boardData.columns,
 *   onMove: (ticketId, status, displayOrder) => moveTicket({ ticketId, status, displayOrder }),
 * });
 *
 * <DndContext sensors={sensors} onDragStart={handleDragStart} ...>
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import type { KanbanTicket } from '@/types/kanban';
import type { TicketStatus } from '@/lib/constants/status';
import { TICKET_STATUS_VALUES, TICKET_STATUSES } from '@/lib/constants/status';

// Sprint 16: Allowed user-initiated transitions
// Only certain moves are allowed via UI drag-drop
// Agent workflow handles: todo → in-progress (session_start) → in-review (session_end)
const ALLOWED_USER_MOVES: Record<string, string[]> = {
  [TICKET_STATUSES.BACKLOG]: [TICKET_STATUSES.TODO], // User preps work
  [TICKET_STATUSES.IN_REVIEW]: [TICKET_STATUSES.DONE], // User verifies work
  // All other transitions require agent workflow
};

/**
 * Check if a status transition is allowed via UI drag-drop
 * Returns true if allowed, false with message if blocked
 */
function validateMoveAllowed(
  fromStatus: TicketStatus,
  toStatus: TicketStatus,
  ticketId: number
): { allowed: boolean; message?: string } {
  // Same column reordering is always allowed
  if (fromStatus === toStatus) {
    return { allowed: true };
  }

  const allowedTargets = ALLOWED_USER_MOVES[fromStatus] || [];
  if (allowedTargets.includes(toStatus)) {
    return { allowed: true };
  }

  // Build helpful message based on the move type
  let message: string;
  if (toStatus === TICKET_STATUSES.IN_PROGRESS) {
    message = `To move ticket #${ticketId} to in-progress, command your agent: "Start a session with ticket ${ticketId}"`;
  } else if (fromStatus === TICKET_STATUSES.IN_PROGRESS && toStatus === TICKET_STATUSES.IN_REVIEW) {
    message = `To move ticket #${ticketId} to in-review, command your agent: "End the current session"`;
  } else if (fromStatus === TICKET_STATUSES.IN_PROGRESS) {
    message = `Ticket #${ticketId} is being worked on by an agent session. Cannot move manually.`;
  } else if (fromStatus === TICKET_STATUSES.TODO) {
    message = `To work on ticket #${ticketId}, command your agent: "Start a session with ticket ${ticketId}"`;
  } else {
    message = `This move requires agent workflow. Only backlog→todo and in-review→done are allowed via drag-drop.`;
  }

  return { allowed: false, message };
}

// ============================================================================
// Types
// ============================================================================

export interface DragState {
  /** The ticket currently being dragged */
  activeTicket: KanbanTicket | null;
  /** The column currently being hovered over */
  overColumn: TicketStatus | null;
  /** The index position where the ticket would be dropped */
  overIndex: number | null;
}

/** Single move operation */
export interface MoveOperation {
  ticketId: number;
  status: TicketStatus;
  displayOrder: number;
}

interface UseKanbanDragDropParams {
  /** Current columns data from the board */
  columns: Record<TicketStatus, KanbanTicket[]>;
  /** Callback when a single ticket is dropped in a new position */
  onMove: (ticketId: number, status: TicketStatus, displayOrder: number) => void;
  /** Callback when a parent with children is dropped (batch move) */
  onBatchMove?: (moves: MoveOperation[]) => void;
  /** Callback when drag starts (for undo preparation) */
  onDragStart?: (ticket: KanbanTicket) => void;
}

interface UseKanbanDragDropReturn {
  /** Current drag state */
  dragState: DragState;
  /** DnD sensors for DndContext */
  sensors: ReturnType<typeof useSensors>;
  /** Handler for drag start event */
  handleDragStart: (event: DragStartEvent) => void;
  /** Handler for drag over event */
  handleDragOver: (event: DragOverEvent) => void;
  /** Handler for drag end event */
  handleDragEnd: (event: DragEndEvent) => void;
  /** Handler for drag cancel event */
  handleDragCancel: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find a ticket by ID across all columns
 */
function findTicketById(
  columns: Record<TicketStatus, KanbanTicket[]>,
  ticketId: number
): KanbanTicket | undefined {
  for (const status of TICKET_STATUS_VALUES) {
    const ticket = columns[status as TicketStatus]?.find((t) => t.id === ticketId);
    if (ticket) return ticket;
  }
  return undefined;
}

/**
 * Determine which column an ID belongs to.
 * IDs can be either column names (string) or ticket IDs (number).
 */
function getColumnFromId(
  id: string | number,
  columns: Record<TicketStatus, KanbanTicket[]>
): TicketStatus | null {
  // If ID is a column status string
  if (typeof id === 'string' && (TICKET_STATUS_VALUES as readonly string[]).includes(id)) {
    return id as TicketStatus;
  }

  // If ID is a ticket ID, find which column it's in
  const ticketId = typeof id === 'string' ? parseInt(id, 10) : id;
  if (!isNaN(ticketId)) {
    for (const status of TICKET_STATUS_VALUES) {
      const found = columns[status as TicketStatus]?.some((t) => t.id === ticketId);
      if (found) return status as TicketStatus;
    }
  }

  return null;
}

/**
 * Calculate the drop index for a ticket in a column.
 */
function calculateDropIndex(
  column: KanbanTicket[],
  overId: string | number | undefined,
  activeId: number
): number {
  if (!overId) return column.length;

  // If dropping on the column itself, add to end
  if (typeof overId === 'string' && (TICKET_STATUS_VALUES as readonly string[]).includes(overId)) {
    return column.length;
  }

  // Find the index of the ticket we're hovering over
  const overTicketId = typeof overId === 'string' ? parseInt(overId, 10) : overId;
  const overIndex = column.findIndex((t) => t.id === overTicketId);

  if (overIndex === -1) return column.length;

  // If dragging from same column, adjust index
  const activeIndex = column.findIndex((t) => t.id === activeId);
  if (activeIndex !== -1 && activeIndex < overIndex) {
    return overIndex;
  }

  return overIndex;
}

// ============================================================================
// Hook
// ============================================================================

export function useKanbanDragDrop({
  columns,
  onMove,
  onBatchMove,
  onDragStart: onDragStartCallback,
}: UseKanbanDragDropParams): UseKanbanDragDropReturn {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------
  const [dragState, setDragState] = useState<DragState>({
    activeTicket: null,
    overColumn: null,
    overIndex: null,
  });

  // --------------------------------------------------------------------------
  // Sensors
  // --------------------------------------------------------------------------
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8px of movement before starting drag
      // Prevents accidental drags on clicks
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --------------------------------------------------------------------------
  // Event Handlers
  // --------------------------------------------------------------------------

  /**
   * Handle drag start - store the active ticket
   */
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const ticketId =
        typeof event.active.id === 'string' ? parseInt(event.active.id, 10) : event.active.id;
      const ticket = findTicketById(columns, ticketId as number);

      if (ticket) {
        setDragState({
          activeTicket: ticket,
          overColumn: ticket.status,
          overIndex: null,
        });
        onDragStartCallback?.(ticket);
      }
    },
    [columns, onDragStartCallback]
  );

  /**
   * Handle drag over - track which column we're hovering
   */
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;

      if (!over || !dragState.activeTicket) return;

      const overColumn = getColumnFromId(over.id, columns);
      if (overColumn) {
        const column = columns[overColumn] || [];
        const overIndex = calculateDropIndex(column, over.id, dragState.activeTicket.id);

        setDragState((prev) => ({
          ...prev,
          overColumn,
          overIndex,
        }));
      }
    },
    [columns, dragState.activeTicket]
  );

  /**
   * Handle drag end - trigger the move callback
   * For parent tickets with children, moves all children together using onBatchMove
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || !dragState.activeTicket) {
        setDragState({ activeTicket: null, overColumn: null, overIndex: null });
        return;
      }

      const ticket = dragState.activeTicket;
      const ticketId = ticket.id;
      const targetColumn = getColumnFromId(over.id, columns);

      if (!targetColumn) {
        setDragState({ activeTicket: null, overColumn: null, overIndex: null });
        return;
      }

      const column = columns[targetColumn] || [];
      const dropIndex = calculateDropIndex(column, over.id, ticketId);

      // Only proceed if actually changing position
      const currentStatus = ticket.status;
      const currentIndex = columns[currentStatus]?.findIndex((t) => t.id === ticketId) ?? -1;

      const isStatusChange = targetColumn !== currentStatus;
      const isOrderChange = !isStatusChange && dropIndex !== currentIndex;

      if (isStatusChange || isOrderChange) {
        // Sprint 16: Validate move is allowed via UI drag-drop
        // Only backlog→todo and in-review→done are allowed
        // All other moves require agent workflow
        if (isStatusChange) {
          const validation = validateMoveAllowed(currentStatus, targetColumn, ticketId);
          if (!validation.allowed) {
            toast.error(validation.message || 'This move requires agent workflow', {
              duration: 5000,
            });
            setDragState({ activeTicket: null, overColumn: null, overIndex: null });
            return;
          }
        }

        // Check if this is a parent ticket with children
        const hasChildren = ticket.childTickets && ticket.childTickets.length > 0;

        if (hasChildren && onBatchMove) {
          // Batch move: parent + all children to the same column
          const moves: MoveOperation[] = [
            // Parent move
            { ticketId, status: targetColumn, displayOrder: dropIndex },
            // Children moves - place after parent
            ...ticket.childTickets!.map((child, idx) => ({
              ticketId: child.id,
              status: targetColumn,
              displayOrder: dropIndex + 1 + idx,
            })),
          ];
          onBatchMove(moves);
        } else {
          // Single ticket move (child or standalone)
          onMove(ticketId, targetColumn, dropIndex);
        }
      }

      setDragState({ activeTicket: null, overColumn: null, overIndex: null });
    },
    [columns, dragState.activeTicket, onMove, onBatchMove]
  );

  /**
   * Handle drag cancel - reset state
   */
  const handleDragCancel = useCallback(() => {
    setDragState({ activeTicket: null, overColumn: null, overIndex: null });
  }, []);

  return {
    dragState,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
