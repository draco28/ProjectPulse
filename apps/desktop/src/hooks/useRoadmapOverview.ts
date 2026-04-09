import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';

export interface PhaseOverview {
  id: string;
  title: string;
  progress: number;
  status: string;
  sprint_count: number;
}

export function useRoadmapOverview(projectId = 6) {
  return useQuery({
    queryKey: ['roadmap-overview', projectId],
    queryFn: () => apiGet<PhaseOverview[]>(`/roadmap/overview?projectId=${projectId}`),
  });
}
