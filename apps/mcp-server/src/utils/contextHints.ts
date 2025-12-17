/**
 * Context Hints Utility
 * Self-Guiding MCP Architecture - Phase 3
 *
 * Provides self-healing context hints for MCP tool responses.
 * Guides external agents toward correct usage patterns.
 *
 * Usage:
 * 1. Call getContextStatus() to check session state
 * 2. Use addContextHintsToJson() or addContextHintsToMarkdown() to add hints
 */

import type { HttpClient } from '../httpClient.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Context status information for hints
 */
export interface ContextStatus {
  /** Whether an active session exists for the project */
  sessionActive: boolean;
  /** Name of the active session (if any) */
  sessionName: string | null;
  /** Hint message to guide the agent */
  hint: string | null;
}

/**
 * Response structure for _context field in JSON responses
 */
export interface ContextHintField {
  sessionActive: boolean;
  sessionName: string | null;
  hint: string | null;
}

/**
 * API response for agent sessions list
 */
interface SessionsListResponse {
  sessions: Array<{
    id: string;
    name: string | null;
    status: string;
  }>;
  pagination: {
    total: number;
  };
}

// ============================================================================
// Hint Messages (Verbose for Dumb Models)
// ============================================================================

/**
 * Generate hint for when no active session is detected
 */
export function getNoSessionHint(): string {
  return '💡 Hint: No active work session detected. Consider calling projectpulse_context_load first to load project context, then projectpulse_agent_session_start to track your work.';
}

/**
 * Generate hint for when an active session exists
 */
export function getActiveSessionHint(sessionName: string): string {
  return `💡 Hint: Active session '${sessionName}' found. Call projectpulse_context_load to see full context including your current todos and progress.`;
}

/**
 * Generate tip for resource tools (personas, skills, SOPs)
 */
export function getResourceTip(resourceType: 'personas' | 'skills' | 'SOPs'): string {
  return `💡 Tip: projectpulse_context_load shows available ${resourceType} in its response. Call it first for a complete overview.`;
}

/**
 * Generate tip for knowledge search tools
 */
export function getKnowledgeTip(): string {
  return '💡 Tip: Use projectpulse_context_load first to see project context, then search knowledge for specific topics.';
}

/**
 * Generate hint for batch tools during Session 3 bootstrap
 * Reminds agents to call syncSession3 when done creating artifacts
 */
export function getOnboardingSyncHint(): string {
  return '💡 Onboarding Hint: After creating all bootstrap artifacts (personas, skills, workflows, SOPs), call projectpulse_onboarding_syncSession3 to mark Session 3 as complete. This updates the web UI to show onboarding is finished.';
}

// ============================================================================
// Context Status Detection
// ============================================================================

/**
 * Check for active sessions and generate context status
 *
 * @param projectId - Project ID to check sessions for
 * @param httpClient - HTTP client for API calls
 * @returns Context status with session info and hints
 */
export async function getContextStatus(
  projectId: number,
  httpClient: HttpClient
): Promise<ContextStatus> {
  try {
    // Check for active sessions
    const response = await httpClient.get<SessionsListResponse>(
      `/api/agent-sessions?projectId=${projectId}&status=IN_PROGRESS&limit=1`
    );

    const sessions = response.sessions || [];
    const firstSession = sessions[0];
    if (firstSession) {
      const sessionName = firstSession.name || 'Unnamed session';
      return {
        sessionActive: true,
        sessionName,
        hint: getActiveSessionHint(sessionName),
      };
    }

    return {
      sessionActive: false,
      sessionName: null,
      hint: getNoSessionHint(),
    };
  } catch {
    // On error, return neutral status (no hints)
    // Don't let hint generation failures break tool execution
    return {
      sessionActive: false,
      sessionName: null,
      hint: null,
    };
  }
}

// ============================================================================
// Response Integration Helpers
// ============================================================================

/**
 * Add context hints to a JSON response object
 *
 * @param responseObj - The response object to add hints to
 * @param status - Context status from getContextStatus()
 * @returns Response object with _context field added
 */
export function addContextHintsToJson<T extends Record<string, unknown>>(
  responseObj: T,
  status: ContextStatus
): T & { _context: ContextHintField } {
  return {
    ...responseObj,
    _context: {
      sessionActive: status.sessionActive,
      sessionName: status.sessionName,
      hint: status.hint,
    },
  };
}

/**
 * Add context hints to a markdown response
 *
 * @param markdown - The markdown string to add hints to
 * @param status - Context status from getContextStatus()
 * @returns Markdown with hints section appended
 */
export function addContextHintsToMarkdown(
  markdown: string,
  status: ContextStatus
): string {
  if (!status.hint) {
    return markdown;
  }

  return `${markdown}\n\n---\n**${status.hint}**`;
}

/**
 * Add a resource-specific tip to markdown response
 *
 * @param markdown - The markdown string to add tip to
 * @param resourceType - Type of resource for the tip
 * @returns Markdown with tip appended
 */
export function addResourceTipToMarkdown(
  markdown: string,
  resourceType: 'personas' | 'skills' | 'SOPs'
): string {
  const tip = getResourceTip(resourceType);
  return `${markdown}\n\n---\n**${tip}**`;
}

/**
 * Create a _context field for JSON stringification
 *
 * @param status - Context status
 * @returns Object suitable for adding to JSON response
 */
export function createContextField(status: ContextStatus): ContextHintField {
  return {
    sessionActive: status.sessionActive,
    sessionName: status.sessionName,
    hint: status.hint,
  };
}
