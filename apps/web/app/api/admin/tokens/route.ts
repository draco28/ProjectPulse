/**
 * Admin Token Management API
 * Sprint 11.5: List all project tokens with pagination and filters
 *
 * GET /api/admin/tokens - List tokens
 *
 * Query params:
 * - page: Page number (default 1)
 * - pageSize: Items per page (default 20, max 100)
 * - projectId: Filter by project ID
 * - status: Filter by status (active, revoked, expired, all)
 * - search: Search by token name
 * - sortBy: Sort field (createdAt, lastUsedAt, name)
 * - sortDirection: asc or desc
 *
 * Security: Requires ADMIN role
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-server';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  projectId: z.coerce.number().int().positive().optional(),
  status: z.enum(['active', 'revoked', 'expired', 'all']).default('all'),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'lastUsedAt', 'name']).default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    await requireAdmin();

    const url = new URL(request.url);
    const rawParams = {
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
      projectId: url.searchParams.get('projectId') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
      sortBy: url.searchParams.get('sortBy') ?? undefined,
      sortDirection: url.searchParams.get('sortDirection') ?? undefined,
    };

    const params = querySchema.parse(rawParams);
    const { page, pageSize, projectId, status, search, sortBy, sortDirection } = params;

    // Build where clause
    const where: Prisma.ProjectTokenWhereInput = {};
    const now = new Date();

    if (projectId) {
      where.projectId = projectId;
    }

    if (status !== 'all') {
      switch (status) {
        case 'active':
          where.isRevoked = false;
          where.OR = [{ expiresAt: null }, { expiresAt: { gt: now } }];
          break;
        case 'revoked':
          where.isRevoked = true;
          break;
        case 'expired':
          where.isRevoked = false;
          where.expiresAt = { lt: now };
          break;
      }
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Build orderBy
    const orderBy: Prisma.ProjectTokenOrderByWithRelationInput = {
      [sortBy]: sortDirection,
    };

    // Get tokens with pagination
    const [tokens, totalCount] = await Promise.all([
      prisma.projectToken.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              toolLogs: true,
            },
          },
        },
      }),
      prisma.projectToken.count({ where }),
    ]);

    // Transform response (exclude tokenHash for security)
    const transformedTokens = tokens.map((t) => ({
      id: t.id,
      name: t.name,
      projectId: t.projectId,
      projectName: t.project.name,
      isRevoked: t.isRevoked,
      expiresAt: t.expiresAt,
      lastUsedAt: t.lastUsedAt,
      createdAt: t.createdAt,
      toolCallCount: t._count.toolLogs,
      blockedTools: t.blockedTools,
      allowedTools: t.allowedTools,
    }));

    return NextResponse.json({
      tokens: transformedTokens,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to fetch tokens');

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

    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
}
