/**
 * ActiveSessionsWidget Component
 *
 * Sprint 14: Dashboard widget showing active agent work sessions
 * Supports multi-instance: shows all IN_PROGRESS and PAUSED sessions
 *
 * Features:
 * - neu-raised container with rounded-3xl
 * - Session cards with status badges
 * - Copy session ID button
 * - Progress indicator (todos completed/total)
 * - View all link to /sessions page
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Play, Pause, Clock } from 'lucide-react';

interface SessionData {
  id: string;
  name: string | null;
  status: 'IN_PROGRESS' | 'PAUSED';
  startedAt: string;
  todosCompleted: number;
  todosTotal: number;
  activeTicketIds: string[];
}

interface ActiveSessionsWidgetProps {
  sessions: SessionData[];
  projectId: number;
}

export function ActiveSessionsWidget({ sessions, projectId }: ActiveSessionsWidgetProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const displayedSessions = sessions.slice(0, 3);
  const activeCount = sessions.filter(s => s.status === 'IN_PROGRESS').length;
  const pausedCount = sessions.filter(s => s.status === 'PAUSED').length;

  const copyToClipboard = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (sessions.length === 0) {
    return (
      <div className="neu-raised smooth-transition rounded-3xl p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Agent Sessions</h3>
        <div className="glass-dark rounded-2xl p-4 text-center">
          <Clock className="mx-auto mb-2 h-8 w-8 text-slate" />
          <p className="text-sm text-slate">No active sessions</p>
          <p className="mt-1 text-xs text-slate/70">
            Sessions will appear here when agents start working
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Agent Sessions</h3>
        <div className="flex items-center gap-2 text-xs">
          {activeCount > 0 && (
            <span className="flex items-center gap-1 text-green-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              {activeCount} active
            </span>
          )}
          {pausedCount > 0 && (
            <span className="flex items-center gap-1 text-yellow-400">
              <Pause className="h-3 w-3" />
              {pausedCount} paused
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {displayedSessions.map((session) => (
          <div
            key={session.id}
            className="glass-dark smooth-transition rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {session.status === 'IN_PROGRESS' ? (
                    <Play className="h-4 w-4 shrink-0 text-green-400" />
                  ) : (
                    <Pause className="h-4 w-4 shrink-0 text-yellow-400" />
                  )}
                  <p className="truncate text-sm font-semibold text-white">
                    {session.name || 'Unnamed Session'}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate">
                  Started {formatTimeAgo(session.startedAt)}
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(session.id)}
                className="smooth-transition flex shrink-0 items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-xs text-slate hover:bg-white/10 hover:text-white"
                title="Copy session ID for resume"
              >
                {copiedId === session.id ? (
                  <>
                    <Check className="h-3 w-3 text-green-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    ID
                  </>
                )}
              </button>
            </div>

            {/* Progress bar */}
            {session.todosTotal > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-slate">
                  <span>Progress</span>
                  <span>{session.todosCompleted}/{session.todosTotal} todos</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-coral to-coralLight transition-all"
                    style={{
                      width: `${Math.round((session.todosCompleted / session.todosTotal) * 100)}%`
                    }}
                  />
                </div>
              </div>
            )}

            {/* Active tickets */}
            {session.activeTicketIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {session.activeTicketIds.slice(0, 3).map((ticketId) => (
                  <span
                    key={ticketId}
                    className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-slate"
                  >
                    #{ticketId}
                  </span>
                ))}
                {session.activeTicketIds.length > 3 && (
                  <span className="text-xs text-slate">
                    +{session.activeTicketIds.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {sessions.length > 3 && (
        <Link
          href={`/sessions?project=${projectId}`}
          className="mt-4 block text-center text-sm font-semibold text-coral hover:text-coralLight smooth-transition"
        >
          View all {sessions.length} sessions →
        </Link>
      )}
    </div>
  );
}
