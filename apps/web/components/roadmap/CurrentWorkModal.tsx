/**
 * CurrentWorkModal Component - Sprint 8.5
 *
 * Modal showing current DevelopmentSession details with neumorphic design:
 * - Glass overlay with backdrop blur
 * - Neumorphic modal container
 * - Section containers with neu-pressed styling
 * - Todos list with glass-dark items
 * - Color-coded status badges
 */

'use client';

import { useEffect, useState } from 'react';
import { X, Target, CheckCircle2, FileText, TrendingUp } from 'lucide-react';
import { formatDateTime } from '@/lib/date-utils';

interface DevelopmentSession {
  id: string;
  phase: string;
  goals: string[];
  plan: string | null;
  todos: any;
  progress: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CurrentWorkModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function CurrentWorkModal({ projectId, isOpen, onClose }: CurrentWorkModalProps) {
  const [session, setSession] = useState<DevelopmentSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchSession() {
      setLoading(true);
      setError(null);

      try {
        // Fetch current IN_PROGRESS session for this project
        const response = await fetch(`/api/development-sessions?projectId=${projectId}&status=IN_PROGRESS`);

        if (!response.ok) {
          throw new Error('Failed to fetch current session');
        }

        const data = await response.json();

        // Get the most recent IN_PROGRESS session
        const sessions = data.sessions || [];
        const currentSession = sessions.find((s: DevelopmentSession) => s.status === 'IN_PROGRESS');

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
      : 'badge-slate';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="neu-raised rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-border-subtle p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Current Development Session</h2>
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
              <p className="text-white mb-2">No active development session found.</p>
              <p className="text-sm text-slate">
                Start a new session to track your current work.
              </p>
            </div>
          )}

          {!loading && !error && session && (
            <div className="space-y-4">
              {/* Phase */}
              <div className="neu-pressed rounded-2xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-coral" />
                  Phase
                </h3>
                <p className="text-white">{session.phase}</p>
              </div>

              {/* Goals */}
              {session.goals && session.goals.length > 0 && (
                <div className="neu-pressed rounded-2xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-coral" />
                    Goals
                  </h3>
                  <ul className="space-y-2">
                    {session.goals.map((goal, index) => (
                      <li key={index} className="flex items-start gap-2 text-white">
                        <span className="text-coral mt-1">•</span>
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
              {session.todos && (
                <div className="neu-pressed rounded-2xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-coral" />
                    Todos
                  </h3>
                  <div className="space-y-2">
                    {Array.isArray(session.todos) ? (
                      session.todos.map((todo: any, index: number) => (
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
                          <span className={todo.status === 'completed' ? 'line-through text-slate' : 'text-white'}>
                            {todo.content}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="bg-dark-pressed rounded-xl p-4">
                        <pre className="text-sm font-mono text-slate">
                          {JSON.stringify(session.todos, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Progress */}
              {session.progress && (
                <div className="neu-pressed rounded-2xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-coral" />
                    Progress
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
                <p>Created: {formatDateTime(session.createdAt)}</p>
                <p>Updated: {formatDateTime(session.updatedAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
