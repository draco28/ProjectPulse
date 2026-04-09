import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import type { SearchResponse } from '@/types/search';

interface SearchParams {
  query: string;
  projectId?: number;
  limit?: number;
  sourceTypes?: string;
}

export function useSearch(params: SearchParams) {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.set('query', params.query);
  searchParams.set('projectId', String(params.projectId ?? 6));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.sourceTypes) searchParams.set('sourceTypes', params.sourceTypes);
  searchParams.set('includeRelations', 'true');

  const qs = searchParams.toString();

  return useQuery({
    queryKey: ['search', params],
    queryFn: () => apiGet<SearchResponse>(`/rag/search?${qs}`),
    enabled: params.query.length >= 2,
  });
}
