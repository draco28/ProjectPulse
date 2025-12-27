'use client';

/**
 * EmptyBoardState Component - Shown when sprint has no tickets
 *
 * Displays a friendly message with CTA to create the first ticket.
 */

import { memo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyBoardStateProps {
  sprintId: string;
  projectId?: number;
  className?: string;
}

export const EmptyBoardState = memo(function EmptyBoardState({
  sprintId,
  projectId,
  className,
}: EmptyBoardStateProps) {
  // Build roadmap link with project context
  const roadmapHref = projectId ? `/roadmap?project=${projectId}` : '/roadmap';

  return (
    <div
      className={cn(
        'flex-1 flex flex-col items-center justify-center p-12 text-center',
        className
      )}
    >
      {/* Illustration */}
      <div className="w-32 h-32 mb-6 rounded-full bg-dark-card flex items-center justify-center">
        <svg
          className="w-16 h-16 text-slate/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold mb-2">No tickets in this sprint</h2>

      {/* Description */}
      <p className="text-slate max-w-md mb-6">
        This sprint is ready for work. Create your first ticket or drag existing tickets from the
        backlog to get started.
      </p>

      {/* CTAs */}
      <div className="flex items-center gap-4">
        <button className="btn-coral px-6 py-3 rounded-xl font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create First Ticket
        </button>

        <Link
          href={roadmapHref}
          className="px-6 py-3 rounded-xl font-medium text-slate hover:text-white border border-slate/30 hover:border-slate/50 transition"
        >
          View Roadmap
        </Link>
      </div>

      {/* Tip */}
      <p className="text-xs text-slate/60 mt-8">
        Tip: You can also use MCP tools to create tickets programmatically
      </p>
    </div>
  );
});

EmptyBoardState.displayName = 'EmptyBoardState';

export default EmptyBoardState;
