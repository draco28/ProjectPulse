'use client';

/**
 * PausedSessionCard - Collapsed card for paused sessions
 *
 * Sprint 15 Phase F
 *
 * Features:
 * - Compact grid layout
 * - Shows: avatar, name, time paused, tokens
 * - "Awaiting: #120 title" + "+3 queued"
 * - "Resume Session" button (yellow)
 */

import { memo, useMemo } from 'react';
import type { AgentSession } from '@/types/sessions';
import { useSessionDuration } from '@/hooks/useSessionDuration';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface PausedSessionCardProps {
  session: AgentSession;
  /** Handler for resume button */
  onResume?: (sessionId: string) => void;
  /** Handler for card click (view details) */
  onClick?: (session: AgentSession) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatPausedDuration(updatedAt: string): string {
  const pausedMs = Date.now() - new Date(updatedAt).getTime();
  const hours = Math.floor(pausedMs / (1000 * 60 * 60));
  const minutes = Math.floor((pausedMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ago`;
  }
  return `${minutes}m ago`;
}

// ============================================================================
// Component
// ============================================================================

export const PausedSessionCard = memo(function PausedSessionCard({
  session,
  onResume,
  onClick,
}: PausedSessionCardProps) {
  // Get work duration (from start to last update)
  const { durationShort } = useSessionDuration(session.startedAt, false);

  // Calculate paused duration
  const pausedTime = useMemo(() => formatPausedDuration(session.updatedAt), [session.updatedAt]);

  // Count queued tickets
  const queuedCount = session.activeTicketIds.length;

  // Get first pending todo for "Awaiting" display
  const pendingTodo = useMemo(() => {
    if (!session.todos) return null;
    return session.todos.find((t) => t.status === 'pending' || t.status === 'in_progress');
  }, [session.todos]);

  return (
    <div className="session-collapsed status-paused p-4 cursor-pointer" onClick={() => onClick?.(session)}>
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/80 to-yellow-600/80 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          AI
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Session Name */}
          <h4 className="text-base font-medium text-white truncate">
            {session.name || 'Unnamed Session'}
          </h4>

          {/* Status Line */}
          <div className="flex items-center gap-2 text-sm text-slate mt-0.5">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Paused {pausedTime}
            </span>
            <span className="text-slate/40">•</span>
            <span>{durationShort} worked</span>
            {session.tokenCount && (
              <>
                <span className="text-slate/40">•</span>
                <span>{(session.tokenCount / 1000).toFixed(1)}k tokens</span>
              </>
            )}
          </div>

          {/* Awaiting / Queued */}
          {(pendingTodo || queuedCount > 0) && (
            <p className="text-sm text-yellow-400/80 mt-1 truncate">
              {pendingTodo ? (
                <span>
                  Awaiting: {pendingTodo.content}
                  {queuedCount > 1 && (
                    <span className="text-slate/60 ml-1">+{queuedCount - 1} more</span>
                  )}
                </span>
              ) : (
                <span>{queuedCount} tickets queued</span>
              )}
            </p>
          )}
        </div>

        {/* Resume Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onResume?.(session.id);
          }}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0',
            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
            'hover:bg-yellow-500/30 hover:border-yellow-500/50'
          )}
        >
          Resume
        </button>
      </div>
    </div>
  );
});

PausedSessionCard.displayName = 'PausedSessionCard';

export default PausedSessionCard;
