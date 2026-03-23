'use client';

/**
 * SessionsPageRedesigned - Main sessions page with new UI
 *
 * Sprint 15 Phase F
 *
 * Layout sections:
 * 1. Header with status counts and actions
 * 2. Active Sessions (full-width lanes)
 * 3. Paused Sessions (responsive grid)
 * 4. Recently Completed (3-col grid)
 * 5. Unassigned Tickets (horizontal scroll)
 *
 * Features:
 * - URL sync for ?ticket=123, ?history=true
 * - Keyboard: Escape closes modals/drawers
 * - All drawers/modals via portals
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { KanbanTicket } from '@/types/kanban';
import type { SessionCounts, AgentSession } from '@/types/sessions';
import { useSessionsData } from '@/hooks/useSessionsData';

// Components
import { SessionStatusCounts } from './SessionStatusCounts';
import { ActiveSessionLane } from './ActiveSessionLane';
import { PausedSessionCard } from './PausedSessionCard';
import { CompletedSessionCard } from './CompletedSessionCard';
import { UnassignedTicketsRow } from './UnassignedTicketsRow';
import { NewSessionModal } from './NewSessionModal';
import { SessionHistoryDrawer } from './SessionHistoryDrawer';
import { TicketDetailDrawer } from '@/components/kanban/TicketDetailDrawer';

// ============================================================================
// Types
// ============================================================================

interface SessionsPageRedesignedProps {
  projectId: number;
  projectName: string;
  initialCounts?: SessionCounts;
}

// ============================================================================
// Component
// ============================================================================

export function SessionsPageRedesigned({
  projectId,
  projectName,
  initialCounts,
}: SessionsPageRedesignedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Modal/Drawer state
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<KanbanTicket | null>(null);
  const [isTicketDrawerOpen, setIsTicketDrawerOpen] = useState(false);

  // Fetch sessions data
  const {
    activeSessions,
    pausedSessions,
    completedSessions,
    counts,
    pauseSession,
    resumeSession,
    isLoading,
  } = useSessionsData(projectId);

  // Use initial counts while loading, then real counts
  const displayCounts = isLoading && initialCounts ? initialCounts : counts;

  // URL sync for history drawer
  useEffect(() => {
    const historyParam = searchParams.get('history');
    if (historyParam === 'true') {
      setIsHistoryDrawerOpen(true);
    }
  }, [searchParams]);

  // URL sync for ticket drawer
  useEffect(() => {
    const ticketParam = searchParams.get('ticket');
    if (ticketParam) {
      // We'd need to fetch the ticket, but for now just open the drawer
      // The actual ticket fetch would happen via API
      setIsTicketDrawerOpen(true);
    }
  }, [searchParams]);

  // Handlers
  const handleOpenHistory = useCallback(() => {
    setIsHistoryDrawerOpen(true);
    // Update URL without navigation
    const params = new URLSearchParams(searchParams.toString());
    params.set('history', 'true');
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleCloseHistory = useCallback(() => {
    setIsHistoryDrawerOpen(false);
    // Remove history from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('history');
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [router, searchParams]);

  const handleTicketClick = useCallback((ticket: KanbanTicket) => {
    setSelectedTicket(ticket);
    setIsTicketDrawerOpen(true);
  }, []);

  const handleCloseTicketDrawer = useCallback(() => {
    setIsTicketDrawerOpen(false);
    setSelectedTicket(null);
    // Remove ticket from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('ticket');
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [router, searchParams]);

  const handlePauseSession = useCallback(
    async (sessionId: string) => {
      try {
        await pauseSession(sessionId);
      } catch (error) {
        console.error('Failed to pause session:', error);
      }
    },
    [pauseSession]
  );

  const handleResumeSession = useCallback(
    async (sessionId: string) => {
      try {
        await resumeSession(sessionId);
      } catch (error) {
        console.error('Failed to resume session:', error);
      }
    },
    [resumeSession]
  );

  const handleHistoryTicketClick = useCallback((ticketId: number) => {
    // Create a minimal ticket object to open drawer
    // In production, we'd fetch the full ticket
    setSelectedTicket({ id: ticketId } as KanbanTicket);
    setIsTicketDrawerOpen(true);
  }, []);

  const handleViewSessionFromTicket = useCallback((_sessionId: string) => {
    // Close ticket drawer and scroll to session
    setIsTicketDrawerOpen(false);
    // For now, just close - we could scroll to the session
  }, []);

  const handleCompletedSessionClick = useCallback(
    (_session: AgentSession) => {
      // Open history drawer when clicking a completed session
      handleOpenHistory();
    },
    [handleOpenHistory]
  );

  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-6 p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Sessions</h1>
          <p className="mt-1 text-sm text-slate">{projectName}</p>
        </div>

        <div className="flex items-center gap-4">
          <SessionStatusCounts counts={displayCounts} isLoading={isLoading} />

          <button
            onClick={handleOpenHistory}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            History
          </button>

          <button
            onClick={() => setIsNewSessionModalOpen(true)}
            className="btn-coral flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Session
          </button>
        </div>
      </header>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate">
            Active Sessions
          </h2>
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <ActiveSessionLane
                key={session.id}
                session={session}
                onPause={handlePauseSession}
                onTicketClick={handleTicketClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* Paused Sessions */}
      {pausedSessions.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate">
            Paused Sessions
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pausedSessions.map((session) => (
              <PausedSessionCard
                key={session.id}
                session={session}
                onResume={handleResumeSession}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently Completed */}
      {completedSessions.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wide text-slate">
              Recently Completed
            </h2>
            <button
              onClick={handleOpenHistory}
              className="text-xs text-coral transition hover:text-coral-light"
            >
              View All →
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedSessions.slice(0, 6).map((session) => (
              <CompletedSessionCard
                key={session.id}
                session={session}
                onClick={handleCompletedSessionClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* Unassigned Tickets */}
      <section>
        <UnassignedTicketsRow projectId={projectId} onTicketClick={handleTicketClick} />
      </section>

      {/* Empty State */}
      {!isLoading &&
        activeSessions.length === 0 &&
        pausedSessions.length === 0 &&
        completedSessions.length === 0 && (
          <div className="neu-raised rounded-2xl p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <svg
                className="h-8 w-8 text-slate"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">No Agent Sessions Yet</h3>
            <p className="mx-auto mb-6 max-w-md text-sm text-slate">
              Sessions track Claude Code work periods. Start a session using MCP tools to see your
              AI work here.
            </p>
            <button
              onClick={() => setIsNewSessionModalOpen(true)}
              className="btn-coral rounded-lg px-6 py-2.5 font-medium"
            >
              Learn How to Start a Session
            </button>
          </div>
        )}

      {/* Modals & Drawers */}
      <NewSessionModal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        projectId={projectId}
      />

      <SessionHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={handleCloseHistory}
        projectId={projectId}
        onTicketClick={handleHistoryTicketClick}
      />

      <TicketDetailDrawer
        ticket={selectedTicket}
        isOpen={isTicketDrawerOpen}
        onClose={handleCloseTicketDrawer}
        onViewSession={handleViewSessionFromTicket}
      />
    </div>
  );
}

export default SessionsPageRedesigned;
