/**
 * Admin Controls for MCP Server
 * Sprint 11.5: Integrates with Next.js API for emergency shutdown, tool blocking, and logging
 *
 * Features:
 * - Emergency shutdown check (5-second cache)
 * - Global tool blocklist check (5-second cache)
 * - Tool call logging (fire-and-forget)
 *
 * Security:
 * - Uses x-internal-request header for internal API calls
 * - Fails open on errors (availability over security for non-critical checks)
 */

import { config } from './config.js';
import { createLogger } from './logger.js';

const logger = createLogger(config.logLevel);
const API_BASE = config.apiBaseUrl;

// ============================================================================
// Types
// ============================================================================

export interface EmergencyStatus {
  enabled: boolean;
  reason?: string;
  enabledAt?: string;
}

export interface ToolCallLogParams {
  tokenId: number;
  projectId: number;
  toolName: string;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Cache Configuration
// ============================================================================

const CACHE_TTL = 5000; // 5 seconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let emergencyCache: CacheEntry<EmergencyStatus> | null = null;
let blockedToolsCache: CacheEntry<string[]> | null = null;

// ============================================================================
// Emergency Shutdown
// ============================================================================

/**
 * Check if MCP emergency shutdown is enabled
 * Uses 5-second cache to reduce API calls
 * Fails open (returns disabled) on errors for availability
 */
export async function checkEmergencyShutdown(): Promise<EmergencyStatus> {
  const now = Date.now();

  // Return cached value if still valid
  if (emergencyCache && (now - emergencyCache.timestamp) < CACHE_TTL) {
    return emergencyCache.data;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/mcp/emergency`, {
      headers: { 'x-internal-request': 'true' },
    });

    if (!res.ok) {
      logger.warn('Emergency status check failed', { status: res.status });
      return { enabled: false }; // Fail open
    }

    const data = await res.json() as EmergencyStatus;
    emergencyCache = { data, timestamp: now };

    if (data.enabled) {
      logger.warn('Emergency shutdown is ENABLED', { reason: data.reason });
    }

    return data;
  } catch (error) {
    logger.error('Failed to check emergency shutdown', {
      error: error instanceof Error ? error.message : error,
    });
    return { enabled: false }; // Fail open
  }
}

// ============================================================================
// Global Tool Blocklist
// ============================================================================

/**
 * Check if a tool is globally blocked by admin
 * Uses 5-second cache to reduce API calls
 * Fails open (returns not blocked) on errors for availability
 */
export async function checkBlockedTool(toolName: string): Promise<boolean> {
  const now = Date.now();

  // Return from cache if still valid
  if (blockedToolsCache && (now - blockedToolsCache.timestamp) < CACHE_TTL) {
    return blockedToolsCache.data.includes(toolName);
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/mcp/blocked-tools`, {
      headers: { 'x-internal-request': 'true' },
    });

    if (!res.ok) {
      logger.warn('Blocked tools check failed', { status: res.status });
      return false; // Fail open
    }

    const data = await res.json() as { blockedTools: string[] };
    blockedToolsCache = { data: data.blockedTools || [], timestamp: now };

    const isBlocked = blockedToolsCache.data.includes(toolName);

    if (isBlocked) {
      logger.warn('Tool is globally blocked', { toolName });
    }

    return isBlocked;
  } catch (error) {
    logger.error('Failed to check blocked tools', {
      error: error instanceof Error ? error.message : error,
    });
    return false; // Fail open
  }
}

/**
 * Get the full list of blocked tools (for debugging/logging)
 */
export async function getBlockedTools(): Promise<string[]> {
  const now = Date.now();

  if (blockedToolsCache && (now - blockedToolsCache.timestamp) < CACHE_TTL) {
    return blockedToolsCache.data;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/mcp/blocked-tools`, {
      headers: { 'x-internal-request': 'true' },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json() as { blockedTools: string[] };
    blockedToolsCache = { data: data.blockedTools || [], timestamp: now };
    return blockedToolsCache.data;
  } catch (error) {
    return [];
  }
}

// ============================================================================
// Tool Call Logging
// ============================================================================

/**
 * Log a tool call to the database (fire-and-forget)
 * Non-blocking to avoid impacting response latency
 * Errors are logged but don't throw
 */
export async function logToolCall(params: ToolCallLogParams): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/mcp/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-request': 'true',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      logger.warn('Tool call logging failed', {
        status: res.status,
        toolName: params.toolName,
      });
    }
  } catch (error) {
    logger.error('Failed to log tool call', {
      error: error instanceof Error ? error.message : error,
      toolName: params.toolName,
    });
  }
}

// ============================================================================
// Cache Management (for testing)
// ============================================================================

/**
 * Clear all caches (useful for testing or forcing refresh)
 */
export function clearAdminCaches(): void {
  emergencyCache = null;
  blockedToolsCache = null;
  logger.debug('Admin control caches cleared');
}
