import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { healthCheck as sessionHealthCheck } from '@/lib/mcp/session-manager';
import { createLogger } from '@/lib/logger';

// Module-level logger for health checks (no request context)
const log = createLogger({ module: 'health' });

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
  let seedStatus = { ready: false, questions: 0, templates: 0 };

  // Database health check
  try {
    // Lightweight connectivity check
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = await prisma.$queryRaw<unknown[]>`SELECT 1`;
    database = 'connected';

    // Check seed data status
    const [questions, templates] = await Promise.all([
      prisma.onboardingQuestion.count(),
      prisma.onboardingPromptTemplate.count(),
    ]);

    // Thresholds based on current seed content (96 questions, 16 templates)
    // Using >= to allow for future additions without breaking health check
    seedStatus = {
      ready: questions >= 96 && templates >= 16,
      questions,
      templates,
    };
  } catch (err) {
    log.error({ error: err instanceof Error ? err.message : String(err) }, 'Database health check failed');
    database = 'error';
  }

  // Redis/session store health check
  try {
    redis = await sessionHealthCheck();
  } catch (err) {
    log.error({ error: err instanceof Error ? err.message : String(err) }, 'Session health check failed');
    redis = { healthy: false, type: 'error' };
  }

  // Overall health: database connected, seed data ready, and session store healthy
  const healthy = database === 'connected' && seedStatus.ready && redis.healthy;

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database,
      seed: seedStatus,
      redis: redis.healthy,
      sessionStore: redis.type,
    },
    {
      status: healthy ? 200 : 503,
    }
  );
}
