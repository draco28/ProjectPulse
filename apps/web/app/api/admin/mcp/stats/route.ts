/**
 * MCP Statistics API
 * Sprint 11.5: Overall MCP usage statistics for admin dashboard
 *
 * GET /api/admin/mcp/stats - Get MCP statistics
 *
 * Returns:
 * - Tool call counts (24h, 7d, 30d)
 * - Error rates
 * - Top tools by usage
 * - Active token count
 * - Emergency shutdown status
 * - Blocked tools list
 *
 * Security: Requires ADMIN role
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for efficiency
    const [
      calls24h,
      calls7d,
      calls30d,
      errors24h,
      topTools,
      activeTokens,
      emergencyStatus,
      blockedToolsSetting,
    ] = await Promise.all([
      // Tool calls in last 24 hours
      prisma.mCPToolLog.count({
        where: { createdAt: { gte: last24h } },
      }),

      // Tool calls in last 7 days
      prisma.mCPToolLog.count({
        where: { createdAt: { gte: last7d } },
      }),

      // Tool calls in last 30 days
      prisma.mCPToolLog.count({
        where: { createdAt: { gte: last30d } },
      }),

      // Errors in last 24 hours
      prisma.mCPToolLog.count({
        where: { createdAt: { gte: last24h }, success: false },
      }),

      // Top 10 tools (last 7 days)
      prisma.mCPToolLog.groupBy({
        by: ['toolName'],
        where: { createdAt: { gte: last7d } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Active tokens count
      prisma.projectToken.count({
        where: {
          isRevoked: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
      }),

      // Emergency shutdown status
      prisma.setting.findUnique({
        where: { key: 'mcp_emergency_shutdown' },
      }),

      // Blocked tools
      prisma.setting.findUnique({
        where: { key: 'mcp_blocked_tools' },
      }),
    ]);

    const errorRate24h = calls24h > 0
      ? ((errors24h / calls24h) * 100).toFixed(2)
      : '0';

    // Type-safe extraction of emergency status
    const emergencyValue = emergencyStatus?.value as {
      enabled?: boolean;
      reason?: string;
      enabledAt?: string;
    } | null;

    // Type-safe extraction of blocked tools
    const blockedToolsValue = blockedToolsSetting?.value as string[] | null;

    return NextResponse.json({
      toolCalls: {
        last24h: calls24h,
        last7d: calls7d,
        last30d: calls30d,
      },
      errors: {
        last24h: errors24h,
        errorRate24h: parseFloat(errorRate24h),
      },
      topTools: topTools.map((t) => ({
        name: t.toolName,
        count: t._count.id,
      })),
      tokens: {
        active: activeTokens,
      },
      emergency: {
        enabled: emergencyValue?.enabled ?? false,
        reason: emergencyValue?.reason ?? null,
        enabledAt: emergencyValue?.enabledAt ?? null,
      },
      blockedTools: blockedToolsValue ?? [],
    });
  } catch (error) {
    console.error('[Admin MCP Stats] Error:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.startsWith('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch MCP statistics' },
      { status: 500 }
    );
  }
}
