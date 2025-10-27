import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/security/score
 *
 * Calculate security score based on open findings
 * Score = 100 - totalPenalty
 * Penalties: ERROR=10, WARNING=4, INFO=1
 *
 * Returns:
 * - score: 0-100
 * - breakdown: Count by severity
 * - trend: Score change over time (future feature)
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch all open findings with severity counts
    const findings = await prisma.securityFinding.findMany({
      where: { status: 'open' },
      select: { severity: true },
    });

    // Calculate severity counts
    const stats = {
      critical: findings.filter((f) => f.severity === 'ERROR').length,
      medium: findings.filter((f) => f.severity === 'WARNING').length,
      low: findings.filter((f) => f.severity === 'INFO').length,
    };

    // Calculate total penalty
    const totalPenalty =
      stats.critical * 10 + stats.medium * 4 + stats.low * 1;

    // Calculate score (0-100)
    const score = Math.max(0, 100 - totalPenalty);

    // Calculate trend (mock for now - in production, compare with previous scan)
    const trend = 0; // Positive = improving, negative = worsening

    return NextResponse.json({
      success: true,
      data: {
        score: Math.round(score),
        breakdown: stats,
        trend,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to calculate security score:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate security score',
      },
      { status: 500 }
    );
  }
}
