/**
 * Graceful Shutdown Manager
 *
 * Handles process signals (SIGTERM, SIGINT) and unhandled errors
 * to ensure clean shutdown with proper connection cleanup.
 *
 * Part of Phase 4: Operations Excellence (Ticket #147)
 *
 * Features:
 * - 10s grace period for in-flight requests
 * - Ordered cleanup: Redis → Circuit Breakers → Prisma
 * - Idempotent shutdown (safe to call multiple times)
 * - Force exit timeout (15s) to prevent hung cleanup
 * - Fatal-level logging for uncaught errors
 *
 * @module lib/shutdown
 */

import { prisma } from '@/lib/prisma';
import { closeRedisConnection } from '@/lib/redis';
import { clearBreakers } from '@/lib/circuit-breaker';
import { logger, createLogger } from '@/lib/logger';

const log = createLogger({ module: 'Shutdown' });

/**
 * Configuration for graceful shutdown behavior
 */
export interface ShutdownConfig {
  /** Time to wait for in-flight requests to complete (default: 10000ms) */
  gracePeriodMs: number;
  /** Maximum time for cleanup before force exit (default: 15000ms) */
  cleanupTimeoutMs: number;
}

const DEFAULT_CONFIG: ShutdownConfig = {
  gracePeriodMs: 10_000, // 10 seconds per ticket requirement
  cleanupTimeoutMs: 15_000, // 15 seconds total timeout
};

// Shutdown state
let isShuttingDown = false;
let shutdownPromise: Promise<void> | null = null;
let config: ShutdownConfig = DEFAULT_CONFIG;

/**
 * Check if shutdown is currently in progress.
 *
 * Use this in health endpoints to return 503 during shutdown,
 * allowing load balancers to stop routing new traffic.
 *
 * @returns true if shutdown has been initiated
 *
 * @example
 * ```typescript
 * if (isShutdownInProgress()) {
 *   return NextResponse.json({ status: 'shutting_down' }, { status: 503 });
 * }
 * ```
 */
export function isShutdownInProgress(): boolean {
  return isShuttingDown;
}

/**
 * Configure and register graceful shutdown handlers.
 *
 * Call ONCE at application startup from instrumentation.ts.
 * Registers handlers for:
 * - SIGTERM (Docker/Kubernetes stop)
 * - SIGINT (Ctrl+C during development)
 * - uncaughtException (unhandled sync errors)
 * - unhandledRejection (unhandled async errors)
 *
 * @param userConfig - Optional configuration overrides
 *
 * @example
 * ```typescript
 * // In instrumentation.ts
 * export async function register() {
 *   if (process.env.NEXT_RUNTIME === 'nodejs') {
 *     const { setupGracefulShutdown } = await import('@/lib/shutdown');
 *     setupGracefulShutdown();
 *   }
 * }
 * ```
 */
export function setupGracefulShutdown(userConfig?: Partial<ShutdownConfig>): void {
  // Allow disabling for testing or debugging
  if (process.env.DISABLE_GRACEFUL_SHUTDOWN === 'true') {
    log.warn('Graceful shutdown disabled via DISABLE_GRACEFUL_SHUTDOWN env var');
    return;
  }

  config = { ...DEFAULT_CONFIG, ...userConfig };

  // Register signal handlers
  process.on('SIGTERM', () => void handleSignal('SIGTERM'));
  process.on('SIGINT', () => void handleSignal('SIGINT'));

  // Register error handlers
  process.on('uncaughtException', handleUncaughtException);
  process.on('unhandledRejection', handleUnhandledRejection);

  log.info(
    {
      gracePeriodMs: config.gracePeriodMs,
      cleanupTimeoutMs: config.cleanupTimeoutMs,
    },
    'Graceful shutdown handlers registered'
  );
}

/**
 * Handle a process signal by initiating graceful shutdown.
 */
async function handleSignal(signal: string): Promise<void> {
  log.info({ signal }, 'Received shutdown signal');
  await performShutdown(signal);
}

/**
 * Handle uncaught exceptions with fatal-level logging.
 */
function handleUncaughtException(error: Error): void {
  // Log with fatal level as required by ticket
  logger.fatal(
    {
      error: error.message,
      stack: error.stack,
      type: 'uncaughtException',
    },
    'Uncaught exception - initiating shutdown'
  );
  void performShutdown('uncaughtException');
}

/**
 * Handle unhandled promise rejections with fatal-level logging.
 */
function handleUnhandledRejection(reason: unknown): void {
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;

  // Log with fatal level as required by ticket
  logger.fatal(
    {
      reason: message,
      stack,
      type: 'unhandledRejection',
    },
    'Unhandled rejection - initiating shutdown'
  );
  void performShutdown('unhandledRejection');
}

/**
 * Perform the graceful shutdown sequence.
 *
 * Cleanup order (by dependency):
 * 1. Wait grace period for in-flight requests
 * 2. Close Redis (session store)
 * 3. Clear circuit breakers (in-memory state)
 * 4. Disconnect Prisma (database)
 * 5. Exit process
 *
 * @param signal - The signal or error type that triggered shutdown
 */
async function performShutdown(signal: string): Promise<void> {
  // Idempotency: return existing promise if already shutting down
  if (isShuttingDown && shutdownPromise) {
    log.debug({ signal }, 'Shutdown already in progress, returning existing promise');
    return shutdownPromise;
  }

  isShuttingDown = true;

  shutdownPromise = (async () => {
    const startTime = Date.now();

    // Set a hard timeout to force exit if cleanup hangs
    const forceExitTimeout = setTimeout(() => {
      log.error({ timeoutMs: config.cleanupTimeoutMs }, 'Cleanup timeout exceeded, forcing exit');
      process.exit(1);
    }, config.cleanupTimeoutMs);

    try {
      log.info({ signal, gracePeriodMs: config.gracePeriodMs }, 'Graceful shutdown initiated');

      // Step 1: Wait for in-flight requests (grace period)
      log.info({ gracePeriodMs: config.gracePeriodMs }, 'Waiting for in-flight requests');
      await sleep(config.gracePeriodMs);

      // Step 2: Close Redis (session store, can close first)
      try {
        await closeRedisConnection();
        log.info('Redis connection closed');
      } catch (error) {
        log.error(
          { error: error instanceof Error ? error.message : String(error) },
          'Error closing Redis connection'
        );
      }

      // Step 3: Clear circuit breakers (in-memory state)
      try {
        clearBreakers();
        log.info('Circuit breakers cleared');
      } catch (error) {
        log.error(
          { error: error instanceof Error ? error.message : String(error) },
          'Error clearing circuit breakers'
        );
      }

      // Step 4: Disconnect Prisma (database - close last)
      try {
        await prisma.$disconnect();
        log.info('Prisma disconnected');
      } catch (error) {
        log.error(
          { error: error instanceof Error ? error.message : String(error) },
          'Error disconnecting Prisma'
        );
      }

      // Log completion
      const durationMs = Date.now() - startTime;
      log.info({ signal, durationMs }, 'Graceful shutdown complete');

      clearTimeout(forceExitTimeout);
      process.exit(0);
    } catch (error) {
      clearTimeout(forceExitTimeout);
      log.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Unexpected error during shutdown'
      );
      process.exit(1);
    }
  })();

  return shutdownPromise;
}

/**
 * Sleep utility for grace period.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reset shutdown state (for testing only).
 * @internal
 */
export function _resetForTesting(): void {
  isShuttingDown = false;
  shutdownPromise = null;
  config = DEFAULT_CONFIG;
}
