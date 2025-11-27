/**
 * Comment List Component
 *
 * Displays all comments for an issue with author info and timestamps
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html (lines 516-591)
 */

'use client';

import { formatDistanceToNow } from 'date-fns';
import type { CommentProps } from '@/types/issue';

interface CommentListProps {
  issueId: string;
  initialComments: CommentProps[];
}

export function CommentList({ issueId: _issueId, initialComments }: CommentListProps) {
  if (initialComments.length === 0) {
    return (
      <div className="neu-pressed rounded-2xl p-8 text-center">
        <i className="fas fa-comments mb-3 text-4xl text-slate"></i>
        <p className="text-slate">No activity yet. Be the first to add a reply!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="comments-list">
      {initialComments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}

/**
 * Individual Comment Item
 * Displays single comment with avatar, author, timestamp, content, and actions
 */
function CommentItem({ comment }: { comment: CommentProps }) {
  const commentDate = new Date(comment.createdAt);
  const isUpdated = comment.updatedAt !== comment.createdAt;

  return (
    <div className="comment-item smooth-transition neu-pressed flex gap-4 rounded-2xl p-4" data-testid="comment-item">
      {/* Avatar */}
      <div className="icon-coral flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
        <i className="fas fa-user text-white"></i>
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {comment.author || 'Anonymous'}
            </span>
            <span className="text-xs text-slate">
              {formatDistanceToNow(commentDate, { addSuffix: true })}
            </span>
            {isUpdated && <span className="text-xs text-slate">(edited)</span>}
          </div>
          <button className="smooth-transition text-sm text-slate hover:text-coral">
            <i className="fas fa-reply mr-1"></i>Reply
          </button>
        </div>

        {/* Comment Content */}
        <div className="text-sm leading-relaxed text-slate">
          <CommentContent content={comment.content} />
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-4 text-xs">
          <button className="smooth-transition text-slate hover:text-coral">
            <i className="fas fa-thumbs-up mr-1"></i>
            <span>Like</span>
          </button>
          <button className="smooth-transition text-slate hover:text-coral">
            <i className="fas fa-edit mr-1"></i>
            <span>Edit</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Comment Content Parser
 * Handles code blocks and inline code formatting
 */
function CommentContent({ content }: { content: string }) {
  // Simple inline code detection: `code`
  const parts = content.split(/(`[^`]+`)/g);

  return (
    <p>
      {parts.map((part, index) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          // Inline code
          const code = part.slice(1, -1);
          return (
            <code key={index} className="rounded bg-[#1A1A1A] px-2 py-0.5 text-xs text-coral">
              {code}
            </code>
          );
        }
        // Regular text
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
}
