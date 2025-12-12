/**
 * CurrentWorkModal Component - Sprint 12
 *
 * Modal showing current AgentSession details with neumorphic design:
 * - Glass overlay with backdrop blur
 * - Neumorphic modal container
 * - Section containers with neu-pressed styling
 * - Todos list with glass-dark items
 * - Color-coded status badges
 *
 * Sprint 12: Updated from DevelopmentSession to AgentSession
 * - New model uses name instead of phase/goals
 * - Uses /api/agent-sessions endpoint
 */

'use client';

import { useEffect, useState } from 'react';
import { X, Bot, CheckCircle2, FileText, TrendingUp, Ticket } from 'lucide-react';
import { formatDateTime } from '@/lib/date-utils';

interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  ticketId?: number | null;
}

interface AgentSession {
  id: string;
  projectId: number;
  name: string | null;
  plan: string | null;
  todos: TodoItem[] | null;
  progress: string | null;
  activeTicketIds: number[];
  status: string;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
}

interface CurrentWorkModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function CurrentWorkModal({ projectId, isOpen, onClose }: CurrentWorkModalProps) {
  const [session, setSession] = useState<AgentSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchSession() {
      setLoading(true);
      setError(null);

      try {
        // Fetch current IN_PROGRESS session for this project
        const response = await fetch(`/api/agent-sessions?projectId=${projectId}&status=IN_PROGRESS`);

        if (!response.ok) {
          throw new Error('Failed to fetch current session');
        }

        const data = await response.json();

        // Get the most recent IN_PROGRESS session
        const sessions = data.sessions || [];
        const currentSession = sessions.find((s: AgentSession) => s.status === 'IN_PROGRESS');

        setSession(currentSession || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  // Status badge class
  const statusBadgeClass =
    session?.status === 'IN_PROGRESS'
      ? 'badge-blue'
      : session?.status === 'COMPLETED'
      ? 'badge-green'
      : session?.status === 'PAUSED'
      ? 'badge-yellow'
      : 'badge-slate';

  // Count todos by status
  const todoStats = session?.todos
    ? {
        total: session.todos.length,
        completed: session.todos.filter((t) => t.status === 'completed').length,
        inProgress: session.todos.filter((t) => t.status === 'in_progress').length,
        pending: session.todos.filter((t) => t.status === 'pending').length,
      }
    : null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="neu-raised rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-border-subtle p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Current Agent Session</h2>
          <button
            onClick={onClose}
            className="neu-flat smooth-transition p-2 rounded-xl hover:bg-white/5"
          >
            <X className="h-5 w-5 text-slate" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
          {loading && (
            <div className="text-center py-12">
              <p className="text-slate">Loading session...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-400">Error: {error}</p>
            </div>
          )}

          {!loading && !error && !session && (
            <div className="text-center py-12">
              <p className="text-white mb-2">No active agent session found.</p>
              <p className="text-sm text-slate">
                Start a new session via MCP to track your current work.
              </p>
            </div>
          )}

          {!loading && !error && session && (
            <div className="space-y-4">
              {/* Session Name */}
              <div className="neu-pressed rounded-2xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-coral" />
                  Session
                </h3>
                <p className="text-white">{session.name || 'Unnamed Session'}</p>
              </div>

              {/* Plan */}
              {session.plan && (
                <div className="neu-pressed rounded-2xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-coral" />
                    Plan
                  </h3>
                  <div className="bg-dark-pressed rounded-xl p-4">
                    <pre className="whitespace-pre-wrap text-sm font-mono text-slate">{session.plan}</pre>
                  </div>
                </div>
              )}

              {/* Todos */}
              {session.todos && session.todos.length > 0 && (
                <div className="neu-pressed rounded-2xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-coral" />
                    Todos
                    {todoStats && (
                      <span className="text-sm font-normal text-slate ml-auto">
                        {todoStats.completed}/{todoStats.total} complete
                      </span>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {session.todos.map((todo, index) => (
                      <div
                        key={index}
                        className="glass-dark rounded-xl p-3 flex items-center gap-3"
                      >
                        <input
                          type="checkbox"
                          checked={todo.status === 'completed'}
                          readOnly
                          className="h-4 w-4 rounded border-slate accent-coral"
                        />
                        <span className={
                          todo.status === 'completed'
                            ? 'line-through text-slate'
                            : todo.status === 'in_progress'
                            ? 'text-blue-400'
                            : 'text-white'
                        }>
                          {todo.content}
                        </span>
                        {todo.ticketId && (
                          <span className="text-xs text-slate bg-slate-800 px-2 py-0.5 rounded">
                            #{todo.ticketId}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Tickets */}
              {session.activeTicketIds && session.activeTicketIds.length > 0 && (
                <div className="neu-pressed rounded-2xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-coral" />
                    Active Tickets
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {session.activeTicketIds.map((ticketId) => (
                      <span
                        key={ticketId}
                        className="px-3 py-1 bg-coral/20 text-coral rounded-lg text-sm font-medium"
                      >
                        #{ticketId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress */}
              {session.progress && (
                <div className="neu-pressed rounded-2xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-coral" />
                    Progress Notes
                  </h3>
                  <div className="bg-dark-pressed rounded-xl p-4">
                    <pre className="whitespace-pre-wrap text-sm font-mono text-slate">{session.progress}</pre>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="neu-pressed rounded-2xl p-4">
                <div className="text-sm font-medium text-slate mb-2">Status</div>
                <span className={statusBadgeClass}>
                  {session.status.replace('_', ' ')}
                </span>
              </div>

              {/* Timestamps */}
              <div className="text-xs text-slate border-t border-border-subtle pt-4">
                <p>Started: {formatDateTime(session.startedAt)}</p>
                <p>Updated: {formatDateTime(session.updatedAt)}</p>
                {session.completedAt && (
                  <p>Completed: {formatDateTime(session.completedAt)}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
