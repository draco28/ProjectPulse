import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';

export interface SprintProgress {
  id: string;
  title: string;
  sprint_number: number;
  progress: number;
  status: string;
  ticket_count: number;
  done_count: number;
}

export interface PhaseProgressResponse {
  phase: {
    id: string;
    title: string;
    progress: number;
    status: string;
  };
  sprints: SprintProgress[];
}

export function usePhaseProgress(phaseId: string | undefined) {
  return useQuery({
    queryKey: ['phase-progress', phaseId],
    queryFn: () => apiGet<PhaseProgressResponse>(`/roadmap/phases/${phaseId}/progress`),
    enabled: !!phaseId,
  });
}
