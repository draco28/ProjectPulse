'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackButtonsProps {
  pageId: number;
}

type FeedbackValue = 'helpful' | 'not-helpful' | null;

export function FeedbackButtons({ pageId }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<FeedbackValue>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storageKey = `wiki-feedback-${pageId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored === 'helpful' || stored === 'not-helpful') {
      setFeedback(stored);
    }
  }, [pageId]);

  const handleFeedback = async (value: FeedbackValue) => {
    setIsLoading(true);

    // Update local state
    setFeedback(value);

    // Persist to localStorage
    const storageKey = `wiki-feedback-${pageId}`;
    if (value) {
      localStorage.setItem(storageKey, value);
    } else {
      localStorage.removeItem(storageKey);
    }

    // TODO (US-023): Send to API
    // try {
    //   await fetch('/api/wiki/feedback', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ pageId, value })
    //   });
    // } catch (error) {
    //   console.error('Failed to submit feedback:', error);
    // }

    setIsLoading(false);
  };

  const isHelpful = feedback === 'helpful';
  const isNotHelpful = feedback === 'not-helpful';

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleFeedback(isHelpful ? null : 'helpful')}
        disabled={isLoading}
        className={`flex-1 px-4 py-2 rounded-xl smooth-transition text-sm ${
          isHelpful
            ? 'bg-green-500 text-white shadow-lg'
            : 'neu-raised hover:bg-green-500 hover:text-white'
        }`}
        aria-label="Mark as helpful"
        aria-pressed={isHelpful}
      >
        <ThumbsUp className="inline-block mr-2 h-4 w-4" aria-hidden="true" />
        Yes
      </button>
      <button
        onClick={() => handleFeedback(isNotHelpful ? null : 'not-helpful')}
        disabled={isLoading}
        className={`flex-1 px-4 py-2 rounded-xl smooth-transition text-sm ${
          isNotHelpful
            ? 'bg-red-500 text-white shadow-lg'
            : 'neu-raised hover:bg-red-500 hover:text-white'
        }`}
        aria-label="Mark as not helpful"
        aria-pressed={isNotHelpful}
      >
        <ThumbsDown className="inline-block mr-2 h-4 w-4" aria-hidden="true" />
        No
      </button>
    </div>
  );
}