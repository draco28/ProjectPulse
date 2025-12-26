'use client';

/**
 * CompletedSessionCard - Small card for recently completed sessions
 *
 * Sprint 15 Phase F
 *
 * Features:
 * - Checkmark icon + session name + completion time
 * - Stats: X tickets • Y hours • Z tokens
 * - Click opens history drawer
 * - Muted styling (opacity-70)
 */

import { memo, useMemo } from 'react';
import type { AgentSession } from '@/types/sessions';
import { calculateSessionDuration } from '@/hooks/useSessionDuration';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface CompletedSessionCardProps {
  session: AgentSession;
  /** Handler for card click (open history) */
  onClick?: (session: AgentSession) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCompletedTime(completedAt: string): string {
  const date = new Date(completedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 0) {
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// Component
// ============================================================================

export const CompletedSessionCard = memo(function CompletedSessionCard({
  session,
  onClick,
}: CompletedSessionCardProps) {
  // Calculate session duration
  const duration = useMemo(() => {
    if (!session.completedAt) return { durationShort: '—' };
    return calculateSessionDuration(session.startedAt, session.completedAt);
  }, [session.startedAt, session.completedAt]);

  // Format completion time
  const completedTime = useMemo(() => {
    if (!session.completedAt) return '—';
    return formatCompletedTime(session.completedAt);
  }, [session.completedAt]);

  // Count completed todos
  const completedTodos = useMemo(() => {
    if (!session.todos) return 0;
    return session.todos.filter((t) => t.status === 'completed').length;
  }, [session.todos]);

  return (
    <button
      onClick={() => onClick?.(session)}
      className={cn(
        'w-full text-left p-4 rounded-xl transition-all',
        'bg-white/[0.02] hover:bg-white/[0.04]',
        'border border-white/5 hover:border-white/10',
        'opacity-70 hover:opacity-100'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkmark Icon */}
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Session Name */}
          <h4 className="text-sm font-medium text-white truncate">
            {session.name || 'Unnamed Session'}
          </h4>

          {/* Completion Time */}
          <p className="text-xs text-slate mt-0.5">{completedTime}</p>

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs text-slate/70 mt-2">
            <span>{completedTodos} tasks</span>
            <span className="text-slate/30">•</span>
            <span>{duration.durationShort}</span>
            {session.tokenCount && (
              <>
                <span className="text-slate/30">•</span>
                <span>{(session.tokenCount / 1000).toFixed(1)}k</span>
              </>
            )}
          </div>
        </div>

        {/* Chevron */}
        <svg className="w-4 h-4 text-slate flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
});

CompletedSessionCard.displayName = 'CompletedSessionCard';

export default CompletedSessionCard;
