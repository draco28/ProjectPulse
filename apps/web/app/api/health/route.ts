import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check endpoint
 * Returns system status and current timestamp
 *
 * @returns JSON response with status and ISO timestamp
 */
export async function GET() {
  let database: 'connected' | 'error' = 'connected';

  try {
    // Lightweight connectivity check; parameterized to avoid SQL injection risks
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = await prisma.$queryRaw<unknown[]>`SELECT 1`;
    database = 'connected';
  } catch (_err) {
    database = 'error';
  }

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database,
  });
}
