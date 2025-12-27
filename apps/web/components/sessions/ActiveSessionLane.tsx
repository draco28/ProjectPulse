'use client';

/**
 * ActiveSessionLane - Full-width lane for active (IN_PROGRESS) sessions
 *
 * Sprint 15 Phase F
 *
 * Features:
 * - Agent avatar with pulse ring animation
 * - Session name + "LIVE" badge
 * - "Working on: [ticket title]" indicator
 * - Duration timer + Token count
 * - Pause button
 * - Embedded SessionTicketPipeline
 */

import { memo, useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { SessionWithTickets } from '@/types/sessions';
import type { KanbanTicket } from '@/types/kanban';
import { SessionDurationTimer } from './SessionDurationTimer';
import { SessionTicketPipeline } from './SessionTicketPipeline';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface ActiveSessionLaneProps {
  session: SessionWithTickets;
  /** Handler for pause button */
  onPause?: (sessionId: string) => void;
  /** Handler for ticket click */
  onTicketClick?: (ticket: KanbanTicket) => void;
}

// ============================================================================
// Helper Components
// ============================================================================

function AgentAvatar() {
  return (
    <div className="relative flex-shrink-0">
      {/* Pulse ring */}
      <div className="absolute inset-0 rounded-full pulse-ring" />
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-coral-dark flex items-center justify-center text-white text-sm font-bold">
        AI
      </div>
    </div>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      Live
    </span>
  );
}

function TokenCount({ count }: { count: number | null }) {
  if (!count) return null;

  // Format large numbers with k suffix
  const formatted = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString();

  return (
    <span className="text-sm text-slate" title={`${count.toLocaleString()} tokens used`}>
      {formatted} tokens
    </span>
  );
}

// ============================================================================
// Component
// ============================================================================

export const ActiveSessionLane = memo(function ActiveSessionLane({
  session,
  onPause,
  onTicketClick,
}: ActiveSessionLaneProps) {
  // Copy ID state
  const [copiedId, setCopiedId] = useState(false);

  // Get currently working ticket for header display
  const workingTicket = useMemo(() => {
    return session.tickets.working[0] || null;
  }, [session.tickets.working]);

  // Copy session ID to clipboard
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(session.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="session-lane status-live p-6 space-y-4">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Avatar + Session Info */}
        <div className="flex items-start gap-4">
          <AgentAvatar />
          <div className="space-y-1">
            {/* Session Name + Live Badge + Copy ID */}
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white">
                {session.name || 'Unnamed Session'}
              </h3>
              <LiveBadge />
              {/* Copy ID Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard();
                }}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate hover:bg-white/10 transition-colors"
                title="Copy session ID"
              >
                {copiedId ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span className="font-mono">{copiedId ? 'Copied!' : session.id.slice(-8)}</span>
              </button>
            </div>

            {/* Working On */}
            {workingTicket ? (
              <p className="text-sm text-slate">
                Working on:{' '}
                <span className="text-white">
                  #{workingTicket.id} {workingTicket.title}
                </span>
              </p>
            ) : (
              <p className="text-sm text-slate italic">No active ticket</p>
            )}
          </div>
        </div>

        {/* Right: Stats + Actions */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Duration */}
          <div className="text-right">
            <SessionDurationTimer startedAt={session.startedAt} size="lg" />
            <TokenCount count={session.tokenCount} />
          </div>

          {/* Pause Button */}
          <button
            onClick={() => onPause?.(session.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
              'hover:bg-yellow-500/20 hover:border-yellow-500/50'
            )}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Pause
            </span>
          </button>
        </div>
      </div>

      {/* Ticket Pipeline */}
      <SessionTicketPipeline tickets={session.tickets} onTicketClick={onTicketClick} />

      {/* Todos Summary (if any) */}
      {session.todos && session.todos.length > 0 && (
        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate">
            <span className="font-medium uppercase tracking-wide">Todos:</span>
            <span>
              {session.todos.filter((t) => t.status === 'completed').length}/{session.todos.length}{' '}
              completed
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

ActiveSessionLane.displayName = 'ActiveSessionLane';

export default ActiveSessionLane;
