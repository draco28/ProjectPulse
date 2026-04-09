import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import type { KanbanBoard } from '@/types/kanban';

export function useKanbanBoard(sprintId: string | undefined) {
  return useQuery({
    queryKey: ['kanban', sprintId],
    queryFn: () => apiGet<KanbanBoard>(`/sprints/${sprintId}/kanban`),
    enabled: !!sprintId,
  });
}
