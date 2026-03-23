/**
 * React Query hook for Kanban Board data and mutations
 *
 * Provides:
 * - Board data fetching with caching
 * - Move ticket mutation with optimistic updates
 * - Bulk reorder mutation for rapid consecutive moves
 *
 * @example
 * ```tsx
 * const { boardQuery, moveTicket, isMoving } = useKanbanBoard(sprintId);
 *
 * // Access board data
 * const { columns, ghosts, stats } = boardQuery.data;
 *
 * // Move a ticket
 * moveTicket({ ticketId: 123, status: 'in-progress', displayOrder: 0 });
 * ```
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  KanbanBoardResponse,
  KanbanTicket,
  MoveTicketRequest,
  MoveTicketResponse,
} from '@/types/kanban';
import type { TicketStatus } from '@/lib/constants/status';

// ============================================================================
// Types
// ============================================================================

interface MoveTicketParams {
  ticketId: number;
  status: TicketStatus;
  displayOrder: number;
}

/** Batch move operation for moving multiple tickets atomically */
export interface BatchMoveParams {
  moves: MoveTicketParams[];
}

interface UseKanbanBoardReturn {
  /** Board data query result */
  boardQuery: ReturnType<typeof useQuery<KanbanBoardResponse>>;
  /** Move a ticket to a new status/position */
  moveTicket: (params: MoveTicketParams) => Promise<MoveTicketResponse | undefined>;
  /** Batch move multiple tickets atomically (e.g., parent + all children) */
  batchMoveTickets: (params: BatchMoveParams) => Promise<void>;
  /** Whether a move is currently in progress */
  isMoving: boolean;
  /** Invalidate and refetch board data */
  refetch: () => void;
}

// ============================================================================
// Optimistic Update Helper
// ============================================================================

/**
 * Move a ticket in the local state optimistically.
 * Returns new columns object with ticket moved.
 */
function moveTicketInColumns(
  columns: Record<TicketStatus, KanbanTicket[]>,
  ticketId: number,
  newStatus: TicketStatus,
  newDisplayOrder: number
): Record<TicketStatus, KanbanTicket[]> {
  // Clone columns to avoid mutation
  const newColumns = { ...columns };

  // Find and remove ticket from current column
  let movedTicket: KanbanTicket | undefined;
  for (const status of Object.keys(newColumns) as TicketStatus[]) {
    const index = newColumns[status].findIndex((t) => t.id === ticketId);
    if (index !== -1) {
      const original = newColumns[status][index];
      movedTicket = { ...original } as KanbanTicket;
      newColumns[status] = [
        ...newColumns[status].slice(0, index),
        ...newColumns[status].slice(index + 1),
      ];
      break;
    }
  }

  if (!movedTicket) return columns;

  // Update ticket status and displayOrder
  movedTicket.status = newStatus;
  movedTicket.displayOrder = newDisplayOrder;

  // Insert ticket at new position in target column
  const targetColumn = [...newColumns[newStatus]];

  // Clamp displayOrder to valid range
  const insertIndex = Math.min(Math.max(0, newDisplayOrder), targetColumn.length);
  targetColumn.splice(insertIndex, 0, movedTicket);

  // Update displayOrder for all tickets in target column
  newColumns[newStatus] = targetColumn.map((ticket, idx) => ({
    ...ticket,
    displayOrder: idx,
  }));

  return newColumns;
}

// ============================================================================
// Hook
// ============================================================================

export function useKanbanBoard(sprintId: string): UseKanbanBoardReturn {
  const queryClient = useQueryClient();
  const queryKey = ['kanban-board', sprintId];

  // --------------------------------------------------------------------------
  // Query: Fetch board data
  // --------------------------------------------------------------------------
  const boardQuery = useQuery<KanbanBoardResponse>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/sprints/${sprintId}/kanban`);
      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ error: { message: 'Failed to fetch board' } }));
        throw new Error(error.error?.message || 'Failed to fetch kanban board');
      }
      const data = await res.json();
      return data.data as KanbanBoardResponse;
    },
    enabled: !!sprintId,
    staleTime: 30_000, // 30 seconds - reduce refetches during drag operations
    refetchOnWindowFocus: false, // Don't refetch when user switches tabs
  });

  // --------------------------------------------------------------------------
  // Mutation: Move ticket with optimistic update
  // --------------------------------------------------------------------------
  const moveTicketMutation = useMutation<
    MoveTicketResponse,
    Error,
    MoveTicketParams,
    { previousData: KanbanBoardResponse | undefined }
  >({
    mutationFn: async ({ ticketId, status, displayOrder }) => {
      const request: MoveTicketRequest = { status, displayOrder };
      const res = await fetch(`/api/tickets/${ticketId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: { message: 'Move failed' } }));
        throw new Error(error.error?.message || 'Failed to move ticket');
      }

      return res.json();
    },

    // Optimistic update - update UI before API response
    onMutate: async ({ ticketId, status, displayOrder }) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data for rollback
      const previousData = queryClient.getQueryData<KanbanBoardResponse>(queryKey);

      // Optimistically update
      if (previousData) {
        const newColumns = moveTicketInColumns(
          previousData.columns,
          ticketId,
          status,
          displayOrder
        );
        queryClient.setQueryData<KanbanBoardResponse>(queryKey, {
          ...previousData,
          columns: newColumns,
        });
      }

      return { previousData };
    },

    // Rollback on error
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },

    // Refetch after settle to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // --------------------------------------------------------------------------
  // Mutation: Batch move tickets (parent + children) with optimistic update
  // --------------------------------------------------------------------------
  const batchMoveMutation = useMutation<
    void,
    Error,
    BatchMoveParams,
    { previousData: KanbanBoardResponse | undefined }
  >({
    mutationFn: async ({ moves }) => {
      const res = await fetch('/api/tickets/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moves }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: { message: 'Batch move failed' } }));
        throw new Error(error.error?.message || 'Failed to batch move tickets');
      }
    },

    // Optimistic update - move all tickets before API response
    onMutate: async ({ moves }) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data for rollback
      const previousData = queryClient.getQueryData<KanbanBoardResponse>(queryKey);

      // Optimistically update all tickets
      if (previousData) {
        let newColumns = { ...previousData.columns };
        for (const move of moves) {
          newColumns = moveTicketInColumns(
            newColumns,
            move.ticketId,
            move.status,
            move.displayOrder
          );
        }
        queryClient.setQueryData<KanbanBoardResponse>(queryKey, {
          ...previousData,
          columns: newColumns,
        });
      }

      return { previousData };
    },

    // Rollback on error
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },

    // Refetch after settle to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // --------------------------------------------------------------------------
  // Exposed methods
  // --------------------------------------------------------------------------
  const moveTicket = useCallback(
    async (params: MoveTicketParams) => {
      try {
        return await moveTicketMutation.mutateAsync(params);
      } catch (error) {
        console.error('[useKanbanBoard] Move failed:', error);
        throw error;
      }
    },
    [moveTicketMutation]
  );

  const batchMoveTickets = useCallback(
    async (params: BatchMoveParams) => {
      try {
        await batchMoveMutation.mutateAsync(params);
      } catch (error) {
        console.error('[useKanbanBoard] Batch move failed:', error);
        throw error;
      }
    },
    [batchMoveMutation]
  );

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    boardQuery,
    moveTicket,
    batchMoveTickets,
    isMoving: moveTicketMutation.isPending || batchMoveMutation.isPending,
    refetch,
  };
}
