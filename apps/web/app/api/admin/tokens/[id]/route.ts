/**
 * Single Token API
 * Sprint 11.5: Get token details and revoke tokens
 *
 * GET /api/admin/tokens/[id] - Get token details with recent activity
 * PATCH /api/admin/tokens/[id] - Revoke token (cannot un-revoke for security)
 *
 * Security: Requires ADMIN role
 * Note: Token hash is NEVER exposed
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-server';
import { logAdminAction } from '@/lib/audit';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

const revokeSchema = z.object({
  isRevoked: z.literal(true), // Can only revoke, not un-revoke
  reason: z.string().min(1).max(500).optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const log = createRequestLogger(getRequestId(request));
  try {
    await requireAdmin();
    const tokenId = parseInt(params.id);

    if (isNaN(tokenId)) {
      return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
    }

    const token = await prisma.projectToken.findUnique({
      where: { id: tokenId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        toolLogs: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            toolName: true,
            success: true,
            duration: true,
            createdAt: true,
          },
        },
      },
    });

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Get usage stats
    const [stats, errorCount] = await Promise.all([
      prisma.mCPToolLog.aggregate({
        where: { tokenId },
        _count: { id: true },
        _avg: { duration: true },
      }),
      prisma.mCPToolLog.count({
        where: { tokenId, success: false },
      }),
    ]);

    const totalCalls = stats._count.id;
    const avgDuration = Math.round(stats._avg.duration || 0);
    const errorRate = totalCalls > 0 ? ((errorCount / totalCalls) * 100).toFixed(1) : '0';

    return NextResponse.json({
      token: {
        id: token.id,
        name: token.name,
        projectId: token.projectId,
        projectName: token.project.name,
        ownerName: token.project.owner?.name,
        ownerEmail: token.project.owner?.email,
        isRevoked: token.isRevoked,
        expiresAt: token.expiresAt,
        lastUsedAt: token.lastUsedAt,
        createdAt: token.createdAt,
        blockedTools: token.blockedTools,
        allowedTools: token.allowedTools,
      },
      stats: {
        totalCalls,
        avgDuration,
        errorCount,
        errorRate,
      },
      recentActivity: token.toolLogs,
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to fetch token details'
    );

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.startsWith('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Failed to fetch token details' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const admin = await requireAdmin();
    const tokenId = parseInt(params.id);

    if (isNaN(tokenId)) {
      return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
    }

    const body = await request.json();
    const data = revokeSchema.parse(body);

    // Check token exists
    const token = await prisma.projectToken.findUnique({
      where: { id: tokenId },
      include: {
        project: {
          select: { name: true },
        },
      },
    });

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    if (token.isRevoked) {
      return NextResponse.json({ error: 'Token is already revoked' }, { status: 400 });
    }

    // Revoke the token
    await prisma.projectToken.update({
      where: { id: tokenId },
      data: { isRevoked: true },
    });

    // Audit log
    await logAdminAction({
      adminId: admin.id,
      action: 'REVOKE_TOKEN',
      targetType: 'PROJECT_TOKEN',
      targetId: tokenId.toString(),
      metadata: {
        tokenName: token.name,
        projectName: token.project.name,
        reason: data.reason,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      message: `Token "${token.name}" has been revoked`,
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to revoke token'
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.startsWith('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 });
  }
}
