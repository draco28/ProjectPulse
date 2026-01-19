/**
 * Progress Bank Parser
 * Self-Guiding MCP Architecture - Phase 2
 *
 * Handles structured parsing and generation of PROGRESS memory bank content.
 * Implements rolling window pruning to stay within 2K token budget.
 *
 * PROGRESS Bank Structure:
 * ```markdown
 * # Progress
 *
 * ## Sprint Summary
 * Total: X sessions | Y todos completed | Z tickets closed
 *
 * ### Sprint N (Status)
 * - X sessions, Y todos, Z tickets
 *
 * ## Recent Sessions (Last 5)
 *
 * ### Session Name (Date)
 * - Tickets: X | Completed: Y/Z | Summary...
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Individual session entry in PROGRESS bank
 */
export interface SessionEntry {
  name: string;
  date: string;
  duration: string;
  tickets: string[];
  completedTodos: number;
  totalTodos: number;
  summary: string;
}

/**
 * Sprint summary for aggregated historical data
 */
export interface SprintSummary {
  title: string;
  status: string; // 'Completed' | 'In Progress'
  sessionCount: number;
  todosCompleted: number;
  ticketsClosed: number;
}

/**
 * Total stats across all sprints
 */
export interface TotalStats {
  sessions: number;
  todos: number;
  tickets: number;
}

/**
 * Parsed PROGRESS bank structure
 */
export interface ParsedProgressBank {
  totalStats: TotalStats;
  sprintSummaries: SprintSummary[];
  recentSessions: SessionEntry[];
}

// ============================================================================
// Constants
// ============================================================================

const MAX_RECENT_SESSIONS = 5;
const DEFAULT_SPRINT_TITLE = 'Current Sprint';

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Parse PROGRESS bank markdown into structured data
 *
 * @param content - Raw markdown content from PROGRESS bank
 * @returns Parsed structure with stats, summaries, and recent sessions
 */
export function parseProgressBank(content: string): ParsedProgressBank {
  const result: ParsedProgressBank = {
    totalStats: { sessions: 0, todos: 0, tickets: 0 },
    sprintSummaries: [],
    recentSessions: [],
  };

  if (!content || content.trim() === '') {
    return result;
  }

  const lines = content.split('\n');
  let currentSection: 'none' | 'summary' | 'sprint' | 'sessions' | 'session' = 'none';
  let currentSprintSummary: SprintSummary | null = null;
  let currentSession: Partial<SessionEntry> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine === undefined) continue;
    const line = rawLine.trim();

    // Skip empty lines
    if (!line) continue;

    // Detect section headers
    if (line === '## Sprint Summary') {
      currentSection = 'summary';
      continue;
    }

    if (line.startsWith('## Recent Sessions')) {
      currentSection = 'sessions';
      // Save any pending sprint summary
      if (currentSprintSummary) {
        result.sprintSummaries.push(currentSprintSummary);
        currentSprintSummary = null;
      }
      continue;
    }

    // Parse total stats line (e.g., "Total: 23 sessions | 112 todos completed | 28 tickets closed")
    if (currentSection === 'summary' && line.startsWith('Total:')) {
      const statsMatch = line.match(
        /Total:\s*(\d+)\s*sessions?\s*\|\s*(\d+)\s*todos?\s*completed\s*\|\s*(\d+)\s*tickets?\s*closed/i
      );
      if (statsMatch && statsMatch[1] && statsMatch[2] && statsMatch[3]) {
        result.totalStats = {
          sessions: parseInt(statsMatch[1], 10),
          todos: parseInt(statsMatch[2], 10),
          tickets: parseInt(statsMatch[3], 10),
        };
      }
      continue;
    }

    // Parse sprint summary header (e.g., "### Sprint 11 (Completed: 2025-12-01)")
    if (currentSection === 'summary' && line.startsWith('### ')) {
      // Save previous sprint summary
      if (currentSprintSummary) {
        result.sprintSummaries.push(currentSprintSummary);
      }

      const sprintMatch = line.match(/###\s+(.+?)\s*\(([^)]+)\)/);
      if (sprintMatch && sprintMatch[1] && sprintMatch[2]) {
        currentSprintSummary = {
          title: sprintMatch[1],
          status: sprintMatch[2],
          sessionCount: 0,
          todosCompleted: 0,
          ticketsClosed: 0,
        };
        currentSection = 'sprint';
      }
      continue;
    }

    // Parse sprint stats line (e.g., "- 15 sessions, 67 todos, 18 tickets")
    if (currentSection === 'sprint' && currentSprintSummary && line.startsWith('-')) {
      const sprintStatsMatch = line.match(
        /-\s*(\d+)\s*sessions?,\s*(\d+)\s*todos?,\s*(\d+)\s*tickets?/i
      );
      if (sprintStatsMatch && sprintStatsMatch[1] && sprintStatsMatch[2] && sprintStatsMatch[3]) {
        currentSprintSummary.sessionCount = parseInt(sprintStatsMatch[1], 10);
        currentSprintSummary.todosCompleted = parseInt(sprintStatsMatch[2], 10);
        currentSprintSummary.ticketsClosed = parseInt(sprintStatsMatch[3], 10);
      }
      continue;
    }

    // Parse session header (e.g., "### Implementing TICK-46 (12/15/2025)")
    if (currentSection === 'sessions' && line.startsWith('### ')) {
      // Save previous session
      if (currentSession && currentSession.name) {
        result.recentSessions.push(currentSession as SessionEntry);
      }

      const sessionMatch = line.match(/###\s+(.+?)\s*\(([^)]+)\)/);
      if (sessionMatch && sessionMatch[1] && sessionMatch[2]) {
        currentSession = {
          name: sessionMatch[1],
          date: sessionMatch[2],
          duration: '',
          tickets: [],
          completedTodos: 0,
          totalTodos: 0,
          summary: '',
        };
        currentSection = 'session';
      }
      continue;
    }

    // Parse session details line (e.g., "- Duration: 2h 15m | Tickets: TICK-46 | Completed: 5/7 | Summary...")
    // Or simpler format: "- Tickets: TICK-46 | Completed: 5/7 | Summary..."
    if (currentSection === 'session' && currentSession && line.startsWith('-')) {
      // Parse duration if present
      const durationMatch = line.match(/Duration:\s*([^|]+)/i);
      if (durationMatch && durationMatch[1]) {
        currentSession.duration = durationMatch[1].trim();
      }

      // Parse tickets
      const ticketsMatch = line.match(/Tickets:\s*([^|]+)/i);
      if (ticketsMatch && ticketsMatch[1]) {
        const ticketStr = ticketsMatch[1].trim();
        if (ticketStr.toLowerCase() !== 'none') {
          currentSession.tickets = ticketStr
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        } else {
          currentSession.tickets = [];
        }
      }

      // Parse completed todos
      const completedMatch = line.match(/Completed:\s*(\d+)\/(\d+)/i);
      if (completedMatch && completedMatch[1] && completedMatch[2]) {
        currentSession.completedTodos = parseInt(completedMatch[1], 10);
        currentSession.totalTodos = parseInt(completedMatch[2], 10);
      }

      // Parse summary (everything after the last | or after "Summary:")
      const summaryMatch = line.match(/\|\s*([^|]+)$/);
      if (summaryMatch && summaryMatch[1] && !summaryMatch[1].includes(':')) {
        currentSession.summary = summaryMatch[1].trim();
      }
      continue;
    }
  }

  // Save final pending items
  if (currentSprintSummary) {
    result.sprintSummaries.push(currentSprintSummary);
  }
  if (currentSession && currentSession.name) {
    result.recentSessions.push(currentSession as SessionEntry);
  }

  return result;
}

// ============================================================================
// Generation Functions
// ============================================================================

/**
 * Generate PROGRESS bank markdown from structured data
 *
 * @param parsed - Parsed progress bank structure
 * @returns Markdown string for PROGRESS bank
 */
export function generateProgressMarkdown(parsed: ParsedProgressBank): string {
  const lines: string[] = [];

  lines.push('# Progress');
  lines.push('');

  // Sprint Summary section
  lines.push('## Sprint Summary');
  lines.push(
    `Total: ${parsed.totalStats.sessions} sessions | ${parsed.totalStats.todos} todos completed | ${parsed.totalStats.tickets} tickets closed`
  );
  lines.push('');

  // Individual sprint summaries
  for (const sprint of parsed.sprintSummaries) {
    lines.push(`### ${sprint.title} (${sprint.status})`);
    lines.push(
      `- ${sprint.sessionCount} sessions, ${sprint.todosCompleted} todos, ${sprint.ticketsClosed} tickets`
    );
    lines.push('');
  }

  // Recent Sessions section
  lines.push('## Recent Sessions (Last 5)');
  lines.push('');

  for (const session of parsed.recentSessions) {
    lines.push(`### ${session.name} (${session.date})`);
    const ticketStr = session.tickets.length > 0 ? session.tickets.join(', ') : 'None';
    const detailParts = [];
    if (session.duration) {
      detailParts.push(`Duration: ${session.duration}`);
    }
    detailParts.push(`Tickets: ${ticketStr}`);
    detailParts.push(`Completed: ${session.completedTodos}/${session.totalTodos}`);
    if (session.summary) {
      detailParts.push(session.summary);
    }
    lines.push(`- ${detailParts.join(' | ')}`);
    lines.push('');
  }

  return lines.join('\n').trim();
}

/**
 * Create a new session entry from AgentSession data
 *
 * @param session - Agent session data
 * @param formattedDate - Pre-formatted date string
 * @param duration - Pre-calculated duration string
 * @param summary - Extracted summary from progress notes
 * @returns SessionEntry for PROGRESS bank
 */
export function createSessionEntry(
  session: {
    name: string | null;
    todos: unknown;
    activeTicketIds: string[];
  },
  formattedDate: string,
  duration: string,
  summary: string
): SessionEntry {
  // Parse todos array
  const todos = Array.isArray(session.todos)
    ? (session.todos as Array<{ content: string; status: string; ticketId?: number | null }>)
    : [];

  const completedTodos = todos.filter((t) => t.status === 'completed').length;
  const totalTodos = todos.length;

  // Format ticket IDs
  const tickets = session.activeTicketIds.map((id) => `TICK-${id}`);

  return {
    name: session.name || 'Unnamed Session',
    date: formattedDate,
    duration,
    tickets,
    completedTodos,
    totalTodos,
    summary,
  };
}

/**
 * Aggregate a session entry into sprint summaries
 * Used when pruning old sessions from recent list
 *
 * @param summaries - Current sprint summaries array (modified in place)
 * @param entry - Session entry to aggregate
 * @param totalStats - Total stats to update (modified in place)
 */
export function aggregateIntoSprintSummary(
  summaries: SprintSummary[],
  entry: SessionEntry,
  _totalStats: TotalStats
): void {
  // Find or create "Current Sprint" summary for aggregated sessions
  let currentSprint = summaries.find((s) => s.title === DEFAULT_SPRINT_TITLE);
  if (!currentSprint) {
    currentSprint = {
      title: DEFAULT_SPRINT_TITLE,
      status: 'In Progress',
      sessionCount: 0,
      todosCompleted: 0,
      ticketsClosed: 0,
    };
    summaries.push(currentSprint);
  }

  // Update sprint summary stats
  currentSprint.sessionCount += 1;
  currentSprint.todosCompleted += entry.completedTodos;
  currentSprint.ticketsClosed += entry.tickets.length;

  // Note: totalStats is NOT updated here - it's updated when adding new sessions
}

/**
 * Add a new session and apply pruning if needed
 *
 * @param parsed - Current parsed progress bank (modified in place)
 * @param newEntry - New session entry to add
 */
export function addSessionWithPruning(parsed: ParsedProgressBank, newEntry: SessionEntry): void {
  // Update total stats
  parsed.totalStats.sessions += 1;
  parsed.totalStats.todos += newEntry.completedTodos;
  parsed.totalStats.tickets += newEntry.tickets.length;

  // Check if pruning is needed
  while (parsed.recentSessions.length >= MAX_RECENT_SESSIONS) {
    // Remove oldest session (first in array)
    const oldest = parsed.recentSessions.shift();
    if (oldest) {
      // Aggregate into sprint summary (but don't double-count in totalStats)
      aggregateIntoSprintSummary(parsed.sprintSummaries, oldest, parsed.totalStats);
    }
  }

  // Add new session to recent list
  parsed.recentSessions.push(newEntry);
}

/**
 * Estimate token count for generated progress markdown
 *
 * @param parsed - Parsed progress bank structure
 * @returns Estimated token count
 */
export function estimateProgressTokens(parsed: ParsedProgressBank): number {
  const markdown = generateProgressMarkdown(parsed);
  // 1 token ≈ 4 characters (matches lib/skills/metrics.ts pattern)
  return Math.ceil(markdown.length / 4);
}
