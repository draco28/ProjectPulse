'use client';

/**
 * SessionTicketPipeline - 3-column ticket pipeline for active sessions
 *
 * Sprint 15 Phase F
 *
 * Layout:
 * - Queued | Currently Working | Completed
 * - Status dot + count in each header
 * - "Currently Working" column is wider (flex-[1.5])
 * - Horizontal scroll on mobile
 */

import { memo } from 'react';
import type { KanbanTicket } from '@/types/kanban';
import { SessionTicketCard } from './SessionTicketCard';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface SessionTicketPipelineProps {
  /** Tickets grouped by pipeline stage */
  tickets: {
    queued: KanbanTicket[];
    working: KanbanTicket[];
    completed: KanbanTicket[];
  };
  /** Handler for ticket click */
  onTicketClick?: (ticket: KanbanTicket) => void;
}

// ============================================================================
// Helper Components
// ============================================================================

interface PipelineColumnProps {
  title: string;
  tickets: KanbanTicket[];
  statusColor: string;
  isWorkingColumn?: boolean;
  onTicketClick?: (ticket: KanbanTicket) => void;
}

function PipelineColumn({
  title,
  tickets,
  statusColor,
  isWorkingColumn = false,
  onTicketClick,
}: PipelineColumnProps) {
  return (
    <div className={cn('flex-1 min-w-[200px]', isWorkingColumn && 'flex-[1.5]')}>
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
        <span className={cn('w-2.5 h-2.5 rounded-full', statusColor)} />
        <span className="text-xs font-medium text-slate uppercase tracking-wide">{title}</span>
        <span className="text-xs text-slate/60 ml-auto">{tickets.length}</span>
      </div>

      {/* Tickets */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {tickets.length === 0 ? (
          <p className="text-xs text-slate/40 text-center py-4 italic">No tickets</p>
        ) : (
          tickets.map((ticket) => (
            <SessionTicketCard
              key={ticket.id}
              ticket={ticket}
              isWorking={isWorkingColumn}
              onClick={onTicketClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export const SessionTicketPipeline = memo(function SessionTicketPipeline({
  tickets,
  onTicketClick,
}: SessionTicketPipelineProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {/* Queued Column */}
      <PipelineColumn
        title="Queued"
        tickets={tickets.queued}
        statusColor="bg-slate"
        onTicketClick={onTicketClick}
      />

      {/* Currently Working Column */}
      <PipelineColumn
        title="Currently Working"
        tickets={tickets.working}
        statusColor="bg-coral animate-pulse"
        isWorkingColumn
        onTicketClick={onTicketClick}
      />

      {/* Completed Column */}
      <PipelineColumn
        title="Completed"
        tickets={tickets.completed}
        statusColor="bg-green-500"
        onTicketClick={onTicketClick}
      />
    </div>
  );
});

SessionTicketPipeline.displayName = 'SessionTicketPipeline';

export default SessionTicketPipeline;
