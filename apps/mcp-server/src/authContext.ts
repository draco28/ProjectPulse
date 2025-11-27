/**
 * MCP Server Auth Context (Sprint 10: Security Architecture)
 *
 * Provides request-scoped authentication context using AsyncLocalStorage.
 * Enables httpClient to access the authenticated agent's credentials
 * without passing them through every function call.
 *
 * Architecture:
 * - Express middleware validates token and calls authContext.run()
 * - All code within that context can access getAgentAuth()
 * - httpClient uses this to inject Authorization headers
 */

import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Agent authentication context stored per-request
 */
export interface AgentAuth {
  /** Project ID the token is scoped to */
  projectId: number;
  /** Token record ID for audit logging */
  tokenId: number;
  /** Token name for logging */
  tokenName: string;
  /** Raw token string for forwarding to APIs */
  rawToken: string;
  /** Tools this token is NOT allowed to execute */
  blockedTools?: string[];
  /** If non-empty, ONLY these tools can be executed */
  allowedTools?: string[];
}

/**
 * AsyncLocalStorage instance for request-scoped auth context
 */
export const authContext = new AsyncLocalStorage<AgentAuth>();

/**
 * Get the current request's agent authentication context
 * Returns undefined if called outside of an authenticated request
 */
export const getAgentAuth = (): AgentAuth | undefined => authContext.getStore();

/**
 * Check if a tool is allowed for the current agent
 * @param toolName - Name of the tool to check
 * @returns true if allowed, false if blocked
 */
export function isToolAllowed(toolName: string): boolean {
  const auth = getAgentAuth();
  
  if (!auth) {
    // No auth context - should not happen in normal flow
    return false;
  }
  
  // Check blocklist first
  if (auth.blockedTools?.includes(toolName)) {
    return false;
  }
  
  // If allowlist exists and is non-empty, tool must be in it
  if (auth.allowedTools && auth.allowedTools.length > 0) {
    return auth.allowedTools.includes(toolName);
  }
  
  // Default: allow
  return true;
}
