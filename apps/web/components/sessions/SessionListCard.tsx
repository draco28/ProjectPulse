/**
 * SessionListCard Component
 *
 * Sprint 14: Card for displaying agent session in list view
 * Shows session name, status, progress, timestamps, and action buttons
 */
'use client';

import { useState } from 'react';
import { Copy, Check, Play, Pause, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionListCardProps {
  session: {
    id: string;
    name: string | null;
    status: 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
    startedAt: string;
    completedAt: string | null;
    plan: string | null;
    progress: string | null;
    todosCompleted: number;
    todosTotal: number;
    activeTicketIds: string[];
  };
  projectId: number;
}

export function SessionListCard({ session, projectId: _projectId }: SessionListCardProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(session.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = () => {
    switch (session.status) {
      case 'IN_PROGRESS':
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            Active
          </span>
        );
      case 'PAUSED':
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-400">
            <Pause className="h-3 w-3" />
            Paused
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-slate/20 px-3 py-1 text-xs font-medium text-slate">
            <Check className="h-3 w-3" />
            Completed
          </span>
        );
    }
  };

  const progressPercent =
    session.todosTotal > 0 ? Math.round((session.todosCompleted / session.todosTotal) * 100) : 0;

  // Get first 150 chars of plan for preview
  const planPreview = session.plan
    ? session.plan.slice(0, 150) + (session.plan.length > 150 ? '...' : '')
    : null;

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {session.status === 'IN_PROGRESS' ? (
              <Play className="h-5 w-5 shrink-0 text-green-400" />
            ) : session.status === 'PAUSED' ? (
              <Pause className="h-5 w-5 shrink-0 text-yellow-400" />
            ) : (
              <Clock className="h-5 w-5 shrink-0 text-slate" />
            )}
            <h3 className="truncate text-lg font-semibold text-white">
              {session.name || 'Unnamed Session'}
            </h3>
            {getStatusBadge()}
          </div>
          <p className="mt-1 text-sm text-slate">
            Started {formatTimeAgo(session.startedAt)}
            {session.completedAt && ` • Completed ${formatTimeAgo(session.completedAt)}`}
          </p>
        </div>

        {/* Copy Session ID Button */}
        <button
          onClick={copyToClipboard}
          className={cn(
            'smooth-transition flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
            copiedId
              ? 'bg-green-500/20 text-green-400'
              : 'bg-white/5 text-slate hover:bg-white/10 hover:text-white'
          )}
          title="Copy session ID for MCP resume"
        >
          {copiedId ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy ID
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {session.todosTotal > 0 && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-slate">
            <span>Progress</span>
            <span>
              {session.todosCompleted}/{session.todosTotal} todos ({progressPercent}%)
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="to-coralLight h-full rounded-full bg-gradient-to-r from-coral transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Active Tickets */}
      {session.activeTicketIds.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {session.activeTicketIds.slice(0, 5).map((ticketId) => (
            <span key={ticketId} className="rounded-lg bg-white/5 px-2 py-1 text-xs text-slate">
              #{ticketId}
            </span>
          ))}
          {session.activeTicketIds.length > 5 && (
            <span className="text-xs text-slate">+{session.activeTicketIds.length - 5} more</span>
          )}
        </div>
      )}

      {/* Plan Preview (collapsed by default) */}
      {planPreview && (
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="smooth-transition hover:text-coralLight flex w-full items-center gap-2 text-left text-sm font-medium text-coral"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isExpanded ? 'Hide Plan' : 'Show Plan'}
          </button>

          {isExpanded && (
            <div className="glass-dark mt-3 max-h-96 overflow-auto rounded-2xl p-4">
              <pre className="whitespace-pre-wrap text-xs text-slate">{session.plan}</pre>
            </div>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-4 flex items-center gap-4 border-t border-white/5 pt-4 text-xs text-slate">
        <span>Started: {formatDate(session.startedAt)}</span>
        {session.completedAt && <span>Completed: {formatDate(session.completedAt)}</span>}
      </div>
    </div>
  );
}
