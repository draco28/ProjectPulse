import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import type { TicketResponse, TicketListParams } from '@/types/ticket';

interface TicketListResponse {
  tickets: TicketResponse[];
  total: number;
  page: number;
  limit: number;
}

export function useTickets(params: TicketListParams) {
  const searchParams = new URLSearchParams();
  if (params.projectId) searchParams.set('projectId', String(params.projectId));
  if (params.status) searchParams.set('status', params.status);
  if (params.priority) searchParams.set('priority', params.priority);
  if (params.kind) searchParams.set('kind', params.kind);
  if (params.module) searchParams.set('module', params.module);
  if (params.sprintNumber) searchParams.set('sprintNumber', String(params.sprintNumber));
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const qs = searchParams.toString();

  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => apiGet<TicketListResponse>(`/tickets${qs ? `?${qs}` : ''}`),
  });
}
