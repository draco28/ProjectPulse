/**
 * Comment Form Component
 *
 * Form for adding new comments to an issue
 * Features: Real-time validation, optimistic UI, error handling
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html (lines 594-627)
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiResponse } from '@/types/issue';

interface CommentFormProps {
  ticketId: string;
}

export function CommentForm({ ticketId }: CommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (content.length > 10000) {
      setError('Comment cannot exceed 10,000 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          author: 'Moksha Dev', // TODO: Get from auth session
        }),
      });

      const result: ApiResponse<unknown> = await res.json();

      if (result.error) {
        setError(result.error);
        return;
      }

      // Success - clear form and refresh page
      setContent('');
      router.refresh(); // Re-fetch Server Component data
    } catch (err) {
      console.error('Comment submission error:', err);
      setError('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-4">
      {/* User Avatar */}
      <div className="icon-coral flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
        <i className="fas fa-user text-white"></i>
      </div>

      {/* Form Content */}
      <div className="flex-1">
        {/* Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Add a comment..."
          className="neu-pressed smooth-transition mb-3 w-full resize-none rounded-2xl px-4 py-3 text-white focus:outline-none disabled:opacity-50"
          disabled={isSubmitting}
          data-testid="comment-textarea"
        />

        {/* Error Message */}
        {error && (
          <p className="mb-3 text-sm text-red-400">
            <i className="fas fa-exclamation-circle mr-1"></i>
            {error}
          </p>
        )}

        {/* Formatting Toolbar + Submit Button */}
        <div className="flex items-center justify-between">
          {/* Formatting Buttons (UI only for now) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="smooth-transition text-sm text-slate hover:text-white"
              title="Bold"
            >
              <i className="fas fa-bold"></i>
            </button>
            <button
              type="button"
              className="smooth-transition text-sm text-slate hover:text-white"
              title="Italic"
            >
              <i className="fas fa-italic"></i>
            </button>
            <button
              type="button"
              className="smooth-transition text-sm text-slate hover:text-white"
              title="Code"
            >
              <i className="fas fa-code"></i>
            </button>
            <button
              type="button"
              className="smooth-transition text-sm text-slate hover:text-white"
              title="Link"
            >
              <i className="fas fa-link"></i>
            </button>
            <button
              type="button"
              className="smooth-transition text-sm text-slate hover:text-white"
              title="Attach file"
            >
              <i className="fas fa-paperclip"></i>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="coral-gradient smooth-transition rounded-2xl px-4 py-2 text-sm text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="submit-comment"
          >
            <i className="fas fa-paper-plane mr-2"></i>
            {isSubmitting ? 'Posting...' : 'Comment'}
          </button>
        </div>

        {/* Character Counter (subtle) */}
        {content.length > 9000 && (
          <p className="mt-2 text-right text-xs text-slate">{content.length} / 10,000 characters</p>
        )}
      </div>
    </form>
  );
}
