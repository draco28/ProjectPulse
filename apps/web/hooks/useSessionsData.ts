/**
 * useSessionsData Hook - Sprint 15 Phase F
 *
 * React Query hook for fetching and managing agent sessions.
 * Provides:
 * - Parallel queries for sessions by status (active, paused, completed)
 * - Ticket enrichment for active session pipelines
 * - Mutations for pause/resume actions
 *
 * @example
 * ```tsx
 * const {
 *   activeSessions,
 *   pausedSessions,
 *   completedSessions,
 *   counts,
 *   pauseSession,
 *   resumeSession,
 *   isLoading,
 * } = useSessionsData(projectId);
 * ```
 */

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import type {
  AgentSession,
  SessionWithTickets,
  SessionCounts,
  SessionStatus,
  SessionTodo,
} from '@/types/sessions';
import type { KanbanTicket } from '@/types/kanban';

// ============================================================================
// Types
// ============================================================================

interface UseSessionsDataReturn {
  /** Active (IN_PROGRESS) sessions with enriched ticket data */
  activeSessions: SessionWithTickets[];
  /** Paused sessions */
  pausedSessions: AgentSession[];
  /** Recently completed sessions (last 7 days) */
  completedSessions: AgentSession[];
  /** Aggregate counts */
  counts: SessionCounts;
  /** Pause an active session */
  pauseSession: (sessionId: string) => Promise<void>;
  /** Resume a paused session */
  resumeSession: (sessionId: string) => Promise<void>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refetch all sessions */
  refetch: () => void;
}

interface SessionApiResponse {
  sessions: AgentSession[];
  total: number;
}

interface TicketApiResponse {
  data?: {
    tickets?: KanbanTicket[];
  };
  tickets?: KanbanTicket[];
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch sessions by status from API.
 */
async function fetchSessionsByStatus(
  projectId: number,
  status: SessionStatus,
  limit: number = 20
): Promise<AgentSession[]> {
  const params = new URLSearchParams({
    projectId: String(projectId),
    status,
    limit: String(limit),
  });

  const res = await fetch(`/api/agent-sessions?${params}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch sessions' }));
    throw new Error(error.error || 'Failed to fetch sessions');
  }

  const data: SessionApiResponse = await res.json();
  return data.sessions || [];
}

/**
 * Fetch tickets by IDs for session enrichment.
 * @param ticketIds - Array of ticket IDs to fetch
 * @param projectId - Project ID for authorization (defense-in-depth)
 */
async function fetchTicketsByIds(ticketIds: number[], projectId: number): Promise<KanbanTicket[]> {
  if (ticketIds.length === 0) return [];

  // Use ticket search with IDs filter
  const params = new URLSearchParams();
  params.set('projectId', String(projectId)); // SECURITY: Add projectId for auth
  ticketIds.forEach((id) => params.append('ids', String(id)));

  const res = await fetch(`/api/tickets?${params}`);
  if (!res.ok) {
    console.warn('[useSessionsData] Failed to fetch tickets:', res.status);
    return [];
  }

  const data: TicketApiResponse = await res.json();
  return data.data?.tickets || data.tickets || [];
}

/**
 * Update session status (pause or resume).
 */
async function updateSessionStatus(
  sessionId: string,
  status: 'IN_PROGRESS' | 'PAUSED'
): Promise<void> {
  const res = await fetch(`/api/agent-sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to update session' }));
    throw new Error(error.error || 'Failed to update session');
  }
}

// ============================================================================
// Enrichment Helpers
// ============================================================================

/**
 * Enrich a session with ticket data, grouping into pipeline stages.
 * Uses todo status to determine working vs queued.
 */
function enrichSessionWithTickets(
  session: AgentSession,
  tickets: KanbanTicket[]
): SessionWithTickets {
  // Parse activeTicketIds (stored as strings)
  const activeIds = new Set(session.activeTicketIds.map((id) => parseInt(id, 10)));

  // Filter to tickets that belong to this session
  const sessionTickets = tickets.filter((t) => activeIds.has(t.id));

  // Get ticket IDs that are currently being worked on (in_progress todos)
  const workingTicketIds = new Set(
    (session.todos || [])
      .filter((todo: SessionTodo) => todo.status === 'in_progress' && todo.ticketId)
      .map((todo: SessionTodo) => todo.ticketId)
  );

  // Get ticket IDs that are completed (completed todos)
  const completedTicketIds = new Set(
    (session.todos || [])
      .filter((todo: SessionTodo) => todo.status === 'completed' && todo.ticketId)
      .map((todo: SessionTodo) => todo.ticketId)
  );

  // Group tickets into pipeline stages
  const pipeline = {
    queued: [] as KanbanTicket[],
    working: [] as KanbanTicket[],
    completed: [] as KanbanTicket[],
  };

  for (const ticket of sessionTickets) {
    if (completedTicketIds.has(ticket.id)) {
      pipeline.completed.push(ticket);
    } else if (workingTicketIds.has(ticket.id)) {
      pipeline.working.push(ticket);
    } else {
      pipeline.queued.push(ticket);
    }
  }

  return {
    ...session,
    tickets: pipeline,
  };
}

// ============================================================================
// Hook
// ============================================================================

export function useSessionsData(projectId: number): UseSessionsDataReturn {
  const queryClient = useQueryClient();

  // --------------------------------------------------------------------------
  // Parallel queries for each status
  // --------------------------------------------------------------------------
  const sessionQueries = useQueries({
    queries: [
      {
        queryKey: ['sessions', projectId, 'IN_PROGRESS'],
        queryFn: () => fetchSessionsByStatus(projectId, 'IN_PROGRESS', 10),
        enabled: projectId > 0,
        staleTime: 30_000,
      },
      {
        queryKey: ['sessions', projectId, 'PAUSED'],
        queryFn: () => fetchSessionsByStatus(projectId, 'PAUSED', 10),
        enabled: projectId > 0,
        staleTime: 30_000,
      },
      {
        queryKey: ['sessions', projectId, 'COMPLETED'],
        queryFn: () => fetchSessionsByStatus(projectId, 'COMPLETED', 20),
        enabled: projectId > 0,
        staleTime: 60_000,
      },
    ],
  });

  const [activeQuery, pausedQuery, completedQuery] = sessionQueries;

  // Collect all active ticket IDs for enrichment
  const activeTicketIds = useMemo(() => {
    const activeSessions = activeQuery.data || [];
    const ids = new Set<number>();
    for (const session of activeSessions) {
      for (const id of session.activeTicketIds) {
        ids.add(parseInt(id, 10));
      }
    }
    return Array.from(ids);
  }, [activeQuery.data]);

  // --------------------------------------------------------------------------
  // Query for ticket enrichment (only for active sessions)
  // --------------------------------------------------------------------------
  const ticketsQuery = useQuery({
    queryKey: ['session-tickets', projectId, activeTicketIds],
    queryFn: () => fetchTicketsByIds(activeTicketIds, projectId),
    enabled: activeTicketIds.length > 0 && projectId > 0,
    staleTime: 30_000,
  });

  // --------------------------------------------------------------------------
  // Enrich active sessions with ticket data
  // --------------------------------------------------------------------------
  const activeSessions = useMemo<SessionWithTickets[]>(() => {
    const sessions = activeQuery.data || [];
    const tickets = ticketsQuery.data || [];

    return sessions.map((session) => enrichSessionWithTickets(session, tickets));
  }, [activeQuery.data, ticketsQuery.data]);

  // --------------------------------------------------------------------------
  // Aggregate counts
  // --------------------------------------------------------------------------
  const counts = useMemo<SessionCounts>(() => {
    return {
      active: activeQuery.data?.length || 0,
      paused: pausedQuery.data?.length || 0,
      completed: completedQuery.data?.length || 0,
    };
  }, [activeQuery.data, pausedQuery.data, completedQuery.data]);

  // --------------------------------------------------------------------------
  // Mutations
  // --------------------------------------------------------------------------
  const pauseMutation = useMutation({
    mutationFn: (sessionId: string) => updateSessionStatus(sessionId, 'PAUSED'),
    onSuccess: () => {
      // Invalidate both active and paused queries
      queryClient.invalidateQueries({ queryKey: ['sessions', projectId, 'IN_PROGRESS'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', projectId, 'PAUSED'] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (sessionId: string) => updateSessionStatus(sessionId, 'IN_PROGRESS'),
    onSuccess: () => {
      // Invalidate both paused and active queries
      queryClient.invalidateQueries({ queryKey: ['sessions', projectId, 'PAUSED'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', projectId, 'IN_PROGRESS'] });
    },
  });

  // --------------------------------------------------------------------------
  // Exposed methods
  // --------------------------------------------------------------------------
  const pauseSession = useCallback(
    async (sessionId: string) => {
      await pauseMutation.mutateAsync(sessionId);
    },
    [pauseMutation]
  );

  const resumeSession = useCallback(
    async (sessionId: string) => {
      await resumeMutation.mutateAsync(sessionId);
    },
    [resumeMutation]
  );

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['sessions', projectId] });
  }, [queryClient, projectId]);

  // --------------------------------------------------------------------------
  // Loading and error states
  // --------------------------------------------------------------------------
  const isLoading = sessionQueries.some((q) => q.isLoading);
  const error = sessionQueries.find((q) => q.error)?.error || null;

  return {
    activeSessions,
    pausedSessions: pausedQuery.data || [],
    completedSessions: completedQuery.data || [],
    counts,
    pauseSession,
    resumeSession,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

export default useSessionsData;
