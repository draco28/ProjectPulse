'use client';

/**
 * SessionHistoryEntry - Expandable history entry for completed sessions
 *
 * Sprint 15 Phase F
 *
 * Features:
 * - Collapsed: avatar, name, stats (tickets, duration, tokens)
 * - Expanded: Start/end times, ticket list with links
 * - Chevron rotation animation
 */

import { memo, useState, useMemo } from 'react';
import type { AgentSession } from '@/types/sessions';
import { calculateSessionDuration } from '@/hooks/useSessionDuration';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface SessionHistoryEntryProps {
  session: AgentSession;
  /** Handler for ticket link click */
  onTicketClick?: (ticketId: number) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ============================================================================
// Component
// ============================================================================

export const SessionHistoryEntry = memo(function SessionHistoryEntry({
  session,
  onTicketClick,
}: SessionHistoryEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate duration
  const duration = useMemo(() => {
    if (!session.completedAt) return { duration: '—', durationShort: '—', durationMs: 0 };
    return calculateSessionDuration(session.startedAt, session.completedAt);
  }, [session.startedAt, session.completedAt]);

  // Count completed todos
  const completedTodos = useMemo(() => {
    if (!session.todos) return 0;
    return session.todos.filter((t) => t.status === 'completed').length;
  }, [session.todos]);

  // Parse ticket IDs
  const ticketIds = useMemo(() => {
    return session.activeTicketIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
  }, [session.activeTicketIds]);

  return (
    <div className="border-b border-white/5 last:border-b-0">
      {/* Collapsed Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-white/[0.02]"
      >
        {/* Avatar */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500/60 to-green-600/60 text-xs font-bold text-white">
          ✓
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium text-white">
            {session.name || 'Unnamed Session'}
          </h4>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate">
            <span>{completedTodos} tasks</span>
            <span className="text-slate/30">•</span>
            <span>{duration.durationShort}</span>
            {session.tokenCount && (
              <>
                <span className="text-slate/30">•</span>
                <span>{(session.tokenCount / 1000).toFixed(1)}k tokens</span>
              </>
            )}
          </div>
        </div>

        {/* Chevron */}
        <svg
          className={cn(
            'h-4 w-4 text-slate transition-transform duration-200',
            isExpanded && 'rotate-90'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="animate-fade-in space-y-3 px-3 pb-3">
          {/* Timestamps */}
          <div className="space-y-1.5 rounded-lg bg-white/[0.02] p-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate">Started</span>
              <span className="text-white">{formatDateTime(session.startedAt)}</span>
            </div>
            {session.completedAt && (
              <div className="flex justify-between text-xs">
                <span className="text-slate">Completed</span>
                <span className="text-white">{formatDateTime(session.completedAt)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-slate">Duration</span>
              <span className="text-white">{duration.duration}</span>
            </div>
          </div>

          {/* Tickets */}
          {ticketIds.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate">Tickets Worked</p>
              <div className="flex flex-wrap gap-1.5">
                {ticketIds.map((id) => (
                  <button
                    key={id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTicketClick?.(id);
                    }}
                    className="rounded bg-white/[0.03] px-2 py-1 font-mono text-xs text-coral transition hover:bg-white/[0.06] hover:text-coral-light"
                  >
                    #{id}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Todos Summary */}
          {session.todos && session.todos.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate">Completed Todos</p>
              <ul className="space-y-1">
                {session.todos
                  .filter((t) => t.status === 'completed')
                  .slice(0, 5)
                  .map((todo, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate/80">
                      <svg
                        className="h-3 w-3 flex-shrink-0 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="truncate">{todo.content}</span>
                    </li>
                  ))}
                {session.todos.filter((t) => t.status === 'completed').length > 5 && (
                  <li className="text-xs italic text-slate/50">
                    +{session.todos.filter((t) => t.status === 'completed').length - 5} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SessionHistoryEntry.displayName = 'SessionHistoryEntry';

export default SessionHistoryEntry;
