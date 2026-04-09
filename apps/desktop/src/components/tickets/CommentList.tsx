import type { CommentResponse } from '@/types/ticket';

interface CommentListProps {
  comments: CommentResponse[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">No comments yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="rounded-lg bg-surface-raised border border-gray-700/40 p-3"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-gray-300">
              {comment.author}
            </span>
            <span className="text-xs text-gray-500">
              {timeAgo(comment.created_at)}
            </span>
          </div>
          <p className="text-sm text-gray-400 whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>
      ))}
    </div>
  );
}
