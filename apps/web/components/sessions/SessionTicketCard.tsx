'use client';

/**
 * SessionTicketCard - Mini ticket card for session pipeline display
 *
 * Sprint 15 Phase F
 *
 * Features:
 * - Compact display: #ID, kind badge, title, priority
 * - Click opens TicketDetailDrawer
 * - "Currently working" state with coral ring + progress bar
 */

import { memo } from 'react';
import type { KanbanTicket } from '@/types/kanban';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface SessionTicketCardProps {
  ticket: KanbanTicket;
  /** Whether this ticket is currently being worked on */
  isWorking?: boolean;
  /** Click handler to open ticket details */
  onClick?: (ticket: KanbanTicket) => void;
}

// ============================================================================
// Helper Components
// ============================================================================

function KindBadge({ kind }: { kind: string }) {
  const kindColors: Record<string, string> = {
    feature: 'bg-emerald-500/20 text-emerald-400',
    task: 'bg-slate/20 text-slate',
    bug: 'bg-red-500/20 text-accent-red',
    issue: 'bg-orange-500/20 text-orange-400',
    tech_debt: 'bg-purple-500/20 text-accent-purple',
    epic: 'bg-blue-500/20 text-accent-blue',
  };

  const colorClass = kindColors[kind?.toLowerCase()] || kindColors.task;
  const displayName = kind?.replace('_', ' ').slice(0, 3).toUpperCase() || 'TSK';

  return (
    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase', colorClass)}>
      {displayName}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const priorityColors: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-400',
    medium: 'bg-yellow-400',
    low: 'bg-slate',
  };

  const colorClass = priorityColors[priority?.toLowerCase()] || priorityColors.medium;

  return (
    <span
      className={cn('h-2 w-2 flex-shrink-0 rounded-full', colorClass)}
      title={`Priority: ${priority}`}
    />
  );
}

// ============================================================================
// Component
// ============================================================================

export const SessionTicketCard = memo(function SessionTicketCard({
  ticket,
  isWorking = false,
  onClick,
}: SessionTicketCardProps) {
  return (
    <button
      onClick={() => onClick?.(ticket)}
      className={cn(
        'w-full rounded-lg p-3 text-left transition-all',
        'bg-white/[0.03] hover:bg-white/[0.06]',
        'border border-white/5 hover:border-white/10',
        isWorking && 'border-coral/30 bg-coral/5 ring-2 ring-coral/50'
      )}
    >
      {/* Header: ID + Kind + Priority */}
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate">#{ticket.id}</span>
          <KindBadge kind={ticket.kind} />
        </div>
        <PriorityDot priority={ticket.priority} />
      </div>

      {/* Title */}
      <p className="line-clamp-2 text-sm leading-snug text-white">{ticket.title}</p>

      {/* Working indicator - animated progress bar */}
      {isWorking && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-dark">
          <div className="h-full w-3/4 animate-pulse rounded-full bg-coral/60" />
        </div>
      )}
    </button>
  );
});

SessionTicketCard.displayName = 'SessionTicketCard';

export default SessionTicketCard;
