import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import type { TicketResponse } from '@/types/ticket';

export function useTicketDetail(ticketId: number | undefined) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => apiGet<TicketResponse>(`/tickets/${ticketId}`),
    enabled: !!ticketId,
  });
}
