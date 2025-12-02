/**
 * Admin Users API
 * Sprint 11.5: List users with pagination and filters
 * 
 * GET /api/admin/users - List users
 * 
 * Query params:
 * - page: Page number (default 1)
 * - pageSize: Items per page (default 20, max 100)
 * - search: Search by email or name
 * - role: Filter by role (USER, ADMIN)
 * - isActive: Filter by active status (true, false)
 * - sortBy: Sort field (email, name, createdAt, role)
 * - sortDirection: asc or desc
 * 
 * Security: Requires ADMIN role
 * Privacy: Does NOT return passwordHash
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-server';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['email', 'name', 'createdAt', 'role']).default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const url = new URL(request.url);
    const rawParams = {
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
      role: url.searchParams.get('role') ?? undefined,
      isActive: url.searchParams.get('isActive') ?? undefined,
      sortBy: url.searchParams.get('sortBy') ?? undefined,
      sortDirection: url.searchParams.get('sortDirection') ?? undefined,
    };

    const params = querySchema.parse(rawParams);
    const { page, pageSize, search, role, isActive, sortBy, sortDirection } = params;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Build orderBy
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortDirection,
    };

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('[Admin Users] Error:', error);

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

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
