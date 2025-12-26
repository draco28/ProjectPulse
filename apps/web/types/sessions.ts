/**
 * Agent Session Type Definitions - Sprint 15 Phase F
 *
 * Types for the redesigned agent sessions page.
 * Sessions represent Claude Code work periods with ticket pipelines,
 * real-time timers, and token tracking.
 *
 * @see components/sessions/ for UI components
 * @see hooks/useSessionsData.ts for data fetching
 */

import type { KanbanTicket } from './kanban';

/**
 * Session status enum for type safety.
 */
export type SessionStatus = 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';

/**
 * Todo item within a session.
 */
export interface SessionTodo {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  ticketId?: number | null;
}

/**
 * Base agent session from API.
 */
export interface AgentSession {
  id: string;
  projectId: number;
  name: string | null;
  plan: string | null;
  todos: SessionTodo[] | null;
  progress: string | null;
  activeTicketIds: string[];
  status: SessionStatus;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  tokenCount: number | null;
}

/**
 * Session with enriched ticket data.
 * Used for active session lanes with ticket pipelines.
 */
export interface SessionWithTickets extends AgentSession {
  /** Enriched ticket data grouped by pipeline stage */
  tickets: {
    /** Tickets waiting to be worked on */
    queued: KanbanTicket[];
    /** Tickets currently being worked on (typically 1) */
    working: KanbanTicket[];
    /** Tickets completed in this session */
    completed: KanbanTicket[];
  };
}

/**
 * Status counts for session header.
 */
export interface SessionCounts {
  active: number;
  paused: number;
  completed: number;
}

/**
 * Filter options for session history.
 */
export type SessionHistoryFilter = 'all' | 'today' | '7days' | '30days';

/**
 * Grouped sessions by date for history drawer.
 */
export interface SessionHistoryGroup {
  label: string; // "Today", "Yesterday", "This Week", "Earlier"
  sessions: AgentSession[];
}

/**
 * Session context for ticket detail drawer.
 * Shows which session a ticket is being worked on in.
 */
export interface TicketSessionContext {
  sessionId: string;
  sessionName: string;
  agentName: string;
  workingDuration: string; // "45 minutes", "2 hours"
}

/**
 * Agent session list response from API.
 */
export interface SessionListResponse {
  sessions: AgentSession[];
  total: number;
  hasMore: boolean;
}

/**
 * Pause/resume mutation params.
 */
export interface SessionActionParams {
  sessionId: string;
}

/**
 * Stats for a completed session (history view).
 */
export interface SessionStats {
  ticketsCompleted: number;
  durationMs: number;
  durationFormatted: string; // "2h 34m"
  tokenCount: number | null;
}
