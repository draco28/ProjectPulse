import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@/lib/api-client';
import type { ReorderRequest, TicketStatus } from '@/types/kanban';

interface ReorderParams {
  ticketIds: number[];
  status: TicketStatus;
}

export function useReorderTickets(sprintId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketIds, status }: ReorderParams) =>
      apiPatch('/tickets/reorder', {
        ticketIds,
        status,
      } satisfies ReorderRequest),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', sprintId] });
    },
  });
}
