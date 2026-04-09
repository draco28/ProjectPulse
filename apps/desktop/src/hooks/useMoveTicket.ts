import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@/lib/api-client';
import type { KanbanBoard, MoveTicketRequest, TicketStatus } from '@/types/kanban';

interface MoveParams {
  ticketId: number;
  status: TicketStatus;
  displayOrder: number;
}

// Statuses that can only be set by agent sessions, not manual drag
const AGENT_ONLY_TARGETS: TicketStatus[] = ['in-progress'];
const AGENT_ONLY_SOURCES: TicketStatus[] = ['in-progress'];

export function isRestrictedMove(from: TicketStatus, to: TicketStatus): boolean {
  if (from === to) return false;
  if (AGENT_ONLY_TARGETS.includes(to) && from === 'todo') return true;
  if (AGENT_ONLY_SOURCES.includes(from) && to === 'in-review') return true;
  return false;
}

export function useMoveTicket(sprintId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, status, displayOrder }: MoveParams) =>
      apiPatch(`/tickets/${ticketId}/move`, {
        status,
        displayOrder,
      } satisfies MoveTicketRequest),

    onMutate: async ({ ticketId, status, displayOrder }) => {
      await queryClient.cancelQueries({ queryKey: ['kanban', sprintId] });

      const previous = queryClient.getQueryData<KanbanBoard>(['kanban', sprintId]);

      if (previous) {
        const updated = structuredClone(previous);

        // Remove ticket from source column
        let ticket = null;
        for (const col of updated.columns) {
          const idx = col.tickets.findIndex((t) => t.id === ticketId);
          if (idx !== -1) {
            ticket = col.tickets.splice(idx, 1)[0];
            col.count = col.tickets.length;
            break;
          }
        }

        // Add to destination column
        if (ticket) {
          ticket.display_order = displayOrder;
          const destCol = updated.columns.find((c) => c.status === status);
          if (destCol) {
            destCol.tickets.splice(displayOrder, 0, ticket);
            destCol.count = destCol.tickets.length;
          }
        }

        queryClient.setQueryData(['kanban', sprintId], updated);
      }

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['kanban', sprintId], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', sprintId] });
    },
  });
}
