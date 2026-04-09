import { useParams } from 'react-router-dom';
import { useTicketDetail } from '@/hooks/useTicketDetail';
import { useComments, useAddComment } from '@/hooks/useComments';
import { TicketHeader } from '@/components/tickets/TicketHeader';
import { TicketMetadata } from '@/components/tickets/TicketMetadata';
import { CommentList } from '@/components/tickets/CommentList';
import { CommentForm } from '@/components/tickets/CommentForm';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileQuestion } from 'lucide-react';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const ticketId = id ? Number(id) : undefined;

  const { data: ticket, isLoading: ticketLoading } = useTicketDetail(ticketId);
  const { data: comments, isLoading: commentsLoading } = useComments(ticketId);
  const addComment = useAddComment(ticketId);

  if (ticketLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Ticket not found"
        description={`No ticket found with ID ${id}`}
      />
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <TicketHeader ticket={ticket} />

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          {ticket.description && (
            <div className="rounded-lg bg-surface-raised border border-gray-700/50 p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>
          )}

          {/* Child tickets */}
          {ticket.children_count > 0 && (
            <div className="rounded-lg bg-surface-raised border border-gray-700/50 p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Child Tickets ({ticket.children_count})
              </h3>
              <p className="text-xs text-gray-500">
                View children in the ticket list with parent filter.
              </p>
            </div>
          )}

          {/* Comments */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">
              Comments {comments ? `(${comments.length})` : ''}
            </h3>
            {commentsLoading ? (
              <Spinner size="sm" />
            ) : (
              <CommentList comments={comments ?? []} />
            )}
            <div className="mt-3">
              <CommentForm
                onSubmit={(content) => addComment.mutate(content)}
                isSubmitting={addComment.isPending}
              />
            </div>
          </div>
        </div>

        {/* Sidebar metadata */}
        <div className="col-span-1">
          <TicketMetadata ticket={ticket} />
        </div>
      </div>
    </div>
  );
}
