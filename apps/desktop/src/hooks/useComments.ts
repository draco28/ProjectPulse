import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api-client';
import type { CommentResponse } from '@/types/ticket';

export function useComments(ticketId: number | undefined) {
  return useQuery({
    queryKey: ['comments', ticketId],
    queryFn: () => apiGet<CommentResponse[]>(`/tickets/${ticketId}/comments`),
    enabled: !!ticketId,
  });
}

export function useAddComment(ticketId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => {
      if (!ticketId) return Promise.reject(new Error('ticketId is required'));
      return apiPost(`/tickets/${ticketId}/comments`, {
        content,
        author: 'Desktop User',
        authorType: 'human',
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] });
    },
  });
}
