'use client';

/**
 * EmptyColumnState Component - Placeholder for empty kanban columns
 *
 * Shows a subtle placeholder message when a column has no tickets.
 * Acts as a valid drop target for drag operations.
 */

import { memo } from 'react';
import type { TicketStatus } from '@/lib/constants/status';
import { TICKET_STATUSES } from '@/lib/constants/status';
import { cn } from '@/lib/utils';

interface EmptyColumnStateProps {
  status: TicketStatus;
  className?: string;
}

const EMPTY_MESSAGES: Record<TicketStatus, string> = {
  [TICKET_STATUSES.BACKLOG]: 'No tickets in backlog',
  [TICKET_STATUSES.TODO]: 'Ready to start? Drop tickets here',
  [TICKET_STATUSES.IN_PROGRESS]: 'No active work',
  [TICKET_STATUSES.IN_REVIEW]: 'Nothing in review',
  [TICKET_STATUSES.DONE]: 'No completed tickets yet',
};

export const EmptyColumnState = memo(function EmptyColumnState({
  status,
  className,
}: EmptyColumnStateProps) {
  const message = EMPTY_MESSAGES[status] || 'No tickets';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4',
        'text-center text-slate/40',
        'border-2 border-dashed border-slate/10 rounded-lg',
        'transition-colors',
        className
      )}
    >
      {/* Icon */}
      <svg
        className="w-8 h-8 mb-2 opacity-30"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>

      {/* Message */}
      <p className="text-xs">{message}</p>

      {/* Hint for drag-drop */}
      <p className="text-[10px] mt-1 opacity-50">Drag tickets here</p>
    </div>
  );
});

EmptyColumnState.displayName = 'EmptyColumnState';

export default EmptyColumnState;
