/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically loaded by Next.js 14+ when the server starts.
 * It runs ONCE before the first request is handled.
 *
 * Part of Phase 4: Operations Excellence (Ticket #147)
 *
 * Purpose:
 * - Register graceful shutdown handlers for SIGTERM/SIGINT
 * - Set up uncaughtException/unhandledRejection handlers
 * - Ensure clean process termination with proper connection cleanup
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * @module instrumentation
 */

/**
 * Register instrumentation handlers.
 *
 * This function is called by Next.js at server startup.
 * We use dynamic imports to ensure the shutdown module is only
 * loaded on the Node.js runtime (not Edge runtime).
 */
export async function register(): Promise<void> {
  // Only run on Node.js runtime, not Edge
  // Edge runtime doesn't support process signals or long-lived connections
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamic import to avoid loading in Edge runtime
    // This also ensures proper module resolution at runtime
    const { setupGracefulShutdown } = await import('@/lib/shutdown');

    // Register shutdown handlers with default configuration:
    // - 10s grace period for in-flight requests
    // - 15s cleanup timeout before force exit
    setupGracefulShutdown();
  }
}
