/**
 * Admin Stats API
 * Sprint 11.5: Aggregate statistics for admin dashboard
 *
 * GET /api/admin/stats - Returns system-wide statistics
 *
 * Security: Requires ADMIN role
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    // Get aggregate stats in parallel
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      totalProjects,
      totalTickets,
      recentSignups,
      totalTokens,
      activeTokens,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.project.count(),
      prisma.ticket.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      prisma.projectToken.count(),
      prisma.projectToken.count({ where: { isRevoked: false } }),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        admins: adminUsers,
        recentSignups,
      },
      projects: {
        total: totalProjects,
      },
      tickets: {
        total: totalTickets,
      },
      tokens: {
        total: totalTokens,
        active: activeTokens,
      },
    });
  } catch (error) {
    console.error('[Admin Stats] Error:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.startsWith('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
