'use client';

/**
 * SessionHistoryDrawer - Slide-in drawer for session history
 *
 * Sprint 15 Phase F
 *
 * Features:
 * - Portal-based (480px width)
 * - Search input with neumorphic styling
 * - Filter pills: All | Today | Last 7 days | Last 30 days
 * - Grouped by date (Today, Yesterday, This Week, Earlier)
 * - Footer with total sessions and token usage
 * - Escape key + click outside to close
 */

import { memo, useEffect, useCallback, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import type { AgentSession, SessionHistoryFilter, SessionHistoryGroup } from '@/types/sessions';
import { SessionHistoryEntry } from './SessionHistoryEntry';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface SessionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  /** Handler for ticket link click */
  onTicketClick?: (ticketId: number) => void;
}

interface SessionsResponse {
  sessions: AgentSession[];
  total: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function groupSessionsByDate(sessions: AgentSession[]): SessionHistoryGroup[] {
  const groups: {
    Today: AgentSession[];
    Yesterday: AgentSession[];
    'This Week': AgentSession[];
    Earlier: AgentSession[];
  } = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Earlier: [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  for (const session of sessions) {
    const completedDate = session.completedAt
      ? new Date(session.completedAt)
      : new Date(session.updatedAt);
    const sessionDate = new Date(
      completedDate.getFullYear(),
      completedDate.getMonth(),
      completedDate.getDate()
    );

    if (sessionDate.getTime() === today.getTime()) {
      groups['Today'].push(session);
    } else if (sessionDate.getTime() === yesterday.getTime()) {
      groups['Yesterday'].push(session);
    } else if (sessionDate >= weekAgo) {
      groups['This Week'].push(session);
    } else {
      groups['Earlier'].push(session);
    }
  }

  // Convert to array and filter empty groups
  return Object.entries(groups)
    .filter(([, sessions]) => sessions.length > 0)
    .map(([label, sessions]) => ({ label, sessions }));
}

function getFilterDateRange(filter: SessionHistoryFilter): { from: Date | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case 'today':
      return { from: today };
    case '7days': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { from: weekAgo };
    }
    case '30days': {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return { from: monthAgo };
    }
    default:
      return { from: null };
  }
}

// ============================================================================
// Filter Pills
// ============================================================================

const FILTER_OPTIONS: { value: SessionHistoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
];

// ============================================================================
// Component
// ============================================================================

export const SessionHistoryDrawer = memo(function SessionHistoryDrawer({
  isOpen,
  onClose,
  projectId,
  onTicketClick,
}: SessionHistoryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<SessionHistoryFilter>('all');

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside to close
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Fetch completed sessions
  const sessionsQuery = useQuery({
    queryKey: ['session-history', projectId],
    queryFn: async () => {
      const params = new URLSearchParams({
        projectId: String(projectId),
        status: 'COMPLETED',
        limit: '100',
      });

      const res = await fetch(`/api/agent-sessions?${params}`);
      if (!res.ok) throw new Error('Failed to fetch sessions');

      const data: SessionsResponse = await res.json();
      return data.sessions || [];
    },
    enabled: isOpen && projectId > 0,
    staleTime: 60_000,
  });

  // Filter sessions by date and search
  const filteredSessions = useMemo(() => {
    let sessions = sessionsQuery.data || [];

    // Apply date filter
    const dateRange = getFilterDateRange(filter);
    if (dateRange.from) {
      sessions = sessions.filter((s) => {
        const date = new Date(s.completedAt || s.updatedAt);
        return date >= dateRange.from!;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      sessions = sessions.filter(
        (s) => s.name?.toLowerCase().includes(query) || s.progress?.toLowerCase().includes(query)
      );
    }

    return sessions;
  }, [sessionsQuery.data, filter, searchQuery]);

  // Group by date
  const groupedSessions = useMemo(() => {
    return groupSessionsByDate(filteredSessions);
  }, [filteredSessions]);

  // Calculate totals for footer
  const totals = useMemo(() => {
    const sessions = sessionsQuery.data || [];
    const totalTokens = sessions.reduce((sum, s) => sum + (s.tokenCount || 0), 0);
    return {
      count: sessions.length,
      tokens: totalTokens,
    };
  }, [sessionsQuery.data]);

  // Don't render if not open
  if (!isOpen) return null;

  const drawerContent = (
    <div
      className={cn('drawer-overlay', isOpen && 'open')}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div className="drawer-panel">
        {/* Header */}
        <div className="sticky top-0 z-10 space-y-4 border-b border-white/10 bg-dark-card p-4">
          {/* Title + Close */}
          <div className="flex items-center justify-between">
            <h2 id="drawer-title" className="text-lg font-semibold text-white">
              Session History
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate transition hover:bg-white/5 hover:text-white"
              aria-label="Close drawer"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="neu-inset rounded-lg">
            <div className="flex items-center gap-2 px-3 py-2">
              <svg
                className="h-4 w-4 flex-shrink-0 text-slate"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate/50 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="rounded p-1 text-slate hover:bg-white/5 hover:text-white"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="scrollbar-auto-hide flex gap-2 overflow-x-auto pb-1">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={cn('filter-pill', filter === option.value && 'active')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="scrollbar-auto-hide flex-1 overflow-y-auto">
          {sessionsQuery.isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-coral border-t-transparent" />
            </div>
          ) : groupedSessions.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center px-4 text-center">
              <svg
                className="mb-3 h-12 w-12 text-slate/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-slate">
                {searchQuery ? 'No sessions match your search' : 'No completed sessions yet'}
              </p>
            </div>
          ) : (
            groupedSessions.map((group) => (
              <div key={group.label}>
                {/* Date Group Header */}
                <div className="sticky top-0 border-b border-white/5 bg-dark/90 px-4 py-2 backdrop-blur-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate">
                    {group.label}
                  </p>
                </div>

                {/* Entries */}
                {group.sessions.map((session) => (
                  <SessionHistoryEntry
                    key={session.id}
                    session={session}
                    onTicketClick={onTicketClick}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-white/10 bg-dark-card p-4">
          <div className="flex items-center justify-between text-xs text-slate">
            <span>{totals.count} total sessions</span>
            <span>{(totals.tokens / 1000).toFixed(1)}k tokens this month</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render via portal
  if (typeof window === 'undefined') return null;
  return createPortal(drawerContent, document.body);
});

SessionHistoryDrawer.displayName = 'SessionHistoryDrawer';

export default SessionHistoryDrawer;
