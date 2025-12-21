'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackButtonsProps {
  pageId: number;
  slug: string;
}

type FeedbackValue = 'helpful' | 'not-helpful' | null;

export function FeedbackButtons({ pageId, slug }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<FeedbackValue>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storageKey = `wiki-feedback-${pageId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored === 'helpful' || stored === 'not-helpful') {
        setFeedback(stored);
      }
    } catch (error) {
      // Silently fail if localStorage is unavailable (private browsing, security restrictions)
      console.warn('Failed to load feedback from localStorage:', error);
    }
  }, [pageId]);

  const handleFeedback = async (value: FeedbackValue) => {
    setIsLoading(true);

    // Update local state
    setFeedback(value);

    // Persist to localStorage with error handling
    try {
      const storageKey = `wiki-feedback-${pageId}`;
      if (value) {
        localStorage.setItem(storageKey, value);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      // Handle quota exceeded, security errors, or private browsing mode
      console.warn('Failed to save feedback to localStorage:', error);
      // User feedback still saved in React state, so UI remains functional
    }

    if (value) {
      try {
        await fetch(`/api/wiki/${slug}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: value === 'helpful' ? 'FEEDBACK_POSITIVE' : 'FEEDBACK_NEGATIVE',
            metadata: { source: 'feedback-buttons' },
          }),
        });
      } catch (error) {
        console.warn('Failed to record feedback event', error);
      }
    }

    setIsLoading(false);
  };

  const isHelpful = feedback === 'helpful';
  const isNotHelpful = feedback === 'not-helpful';

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleFeedback(isHelpful ? null : 'helpful')}
        disabled={isLoading}
        className={`smooth-transition flex-1 rounded-xl px-4 py-2 text-sm ${
          isHelpful
            ? 'bg-green-500 text-white shadow-lg'
            : 'neu-raised hover:bg-green-500 hover:text-white'
        }`}
        aria-label="Mark as helpful"
        aria-pressed={isHelpful}
      >
        <ThumbsUp className="mr-2 inline-block h-4 w-4" aria-hidden="true" />
        Yes
      </button>
      <button
        onClick={() => handleFeedback(isNotHelpful ? null : 'not-helpful')}
        disabled={isLoading}
        className={`smooth-transition flex-1 rounded-xl px-4 py-2 text-sm ${
          isNotHelpful
            ? 'bg-red-500 text-white shadow-lg'
            : 'neu-raised hover:bg-red-500 hover:text-white'
        }`}
        aria-label="Mark as not helpful"
        aria-pressed={isNotHelpful}
      >
        <ThumbsDown className="mr-2 inline-block h-4 w-4" aria-hidden="true" />
        No
      </button>
    </div>
  );
}
