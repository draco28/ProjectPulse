import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import type { SprintListItem } from '@/types/kanban';

interface HierarchyResponse {
  results: SprintListItem[];
  level: string;
}

export function useSprints(projectId = 6) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () =>
      apiGet<HierarchyResponse>(
        `/hierarchy/query?projectId=${projectId}&level=sprint`,
      ).then((r) => r.results),
  });
}
