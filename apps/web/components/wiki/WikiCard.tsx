/**
 * WikiCard Component
 *
 * Individual wiki page preview card
 * Memoized with React.memo for list performance
 */

'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { memo } from 'react';

interface WikiCardProps {
  page: {
    id: string;
    title: string;
    excerpt: string;
    category: string;
    path: string;
    updatedAt: Date;
  };
}

export const WikiCard = memo(function WikiCard({ page }: WikiCardProps) {
  const { id, title, excerpt, category, path, updatedAt } = page;

  // Format timestamp (relative time)
  const formatDistanceToNow = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  };

  const timeAgo = formatDistanceToNow(updatedAt);

  return (
    <article className="neu-raised smooth-transition group rounded-3xl p-6 hover:-translate-y-1 hover:shadow-2xl">
      <Link
        href={`/wiki${path}`}
        className="block focus:outline-none focus:ring-2 focus:ring-coral/50 rounded-2xl"
      >
        {/* Category Badge */}
        {category && category !== 'Uncategorized' && (
          <div className="mb-3">
            <span
              className="inline-block rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral"
              aria-label={`Category: ${category}`}
            >
              {category}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="mb-2 text-xl font-bold text-white group-hover:text-coral smooth-transition">
          {title}
        </h3>

        {/* Excerpt (truncated to 3 lines) */}
        {excerpt && (
          <p className="mb-4 line-clamp-3 text-sm text-slate">
            {excerpt}
          </p>
        )}

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-xs text-slate">
          <Clock className="h-3 w-3" aria-hidden="true" />
          <time dateTime={new Date(updatedAt).toISOString()}>Updated {timeAgo}</time>
        </div>
      </Link>
    </article>
  );
});
