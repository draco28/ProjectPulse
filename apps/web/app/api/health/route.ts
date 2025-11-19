import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { healthCheck as sessionHealthCheck } from '@/lib/mcp/session-manager';

/**
 * Health check endpoint
 * 
 * Returns system status including database and session store (Redis/in-memory).
 * Used by:
 * - Kubernetes liveness/readiness probes
 * - Docker health checks
 * - Monitoring systems
 *
 * @returns JSON response with status and component health
 */
export async function GET() {
  let database: 'connected' | 'error' = 'connected';
  let redis = { healthy: false, type: 'unknown' };

  // Database health check
  try {
    // Lightweight connectivity check; parameterized to avoid SQL injection risks
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = await prisma.$queryRaw<unknown[]>`SELECT 1`;
    database = 'connected';
  } catch (_err) {
    database = 'error';
  }

  // Redis/session store health check
  try {
    redis = await sessionHealthCheck();
  } catch (err) {
    console.error('[Health] Session health check failed:', err);
    redis = { healthy: false, type: 'error' };
  }

  // Overall health: both database and session store must be healthy
  const healthy = database === 'connected' && redis.healthy;

  return NextResponse.json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database,
    redis: redis.healthy,
    sessionStore: redis.type,
  }, {
    status: healthy ? 200 : 503,
  });
}
