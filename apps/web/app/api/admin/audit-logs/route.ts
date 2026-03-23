/**
 * Admin Audit Logs API
 * Sprint 11.5: View audit logs
 *
 * GET /api/admin/audit-logs - Get recent audit logs
 *
 * Query params:
 * - limit: Number of logs to return (default 50, max 100)
 *
 * Security: Requires ADMIN role
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-server';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    await requireAdmin();

    const url = new URL(request.url);
    const { limit } = querySchema.parse({
      limit: url.searchParams.get('limit') ?? undefined,
    });

    const logs = await prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to fetch audit logs'
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
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

    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
