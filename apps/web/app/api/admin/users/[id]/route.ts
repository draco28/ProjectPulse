/**
 * Admin Single User API
 * Sprint 11.5: Get and update individual users
 *
 * GET /api/admin/users/[id] - Get user details
 * PATCH /api/admin/users/[id] - Update user (isActive, role, name)
 *
 * Security:
 * - Requires ADMIN role
 * - Cannot modify own account (self-protection)
 * - Cannot demote if last admin (last-admin protection)
 * - All changes are audit logged
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-server';
import { logAdminAction } from '@/lib/audit';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const log = createRequestLogger(getRequestId(request));
  try {
    await requireAdmin();
    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id },
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
            onboardingSessions: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to fetch user');

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.startsWith('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;

    // Self-protection: Cannot modify own account
    if (id === admin.id) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    // Get current user state for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true, isActive: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Last admin protection: Cannot demote if last admin
    if (data.role === 'USER' && currentUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot demote the last admin' }, { status: 400 });
      }
    }

    // Last admin protection: Cannot deactivate if last admin
    if (data.isActive === false && currentUser.role === 'ADMIN') {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (activeAdminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot deactivate the last active admin' },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit logging
    if (data.isActive !== undefined && data.isActive !== currentUser.isActive) {
      await logAdminAction({
        adminId: admin.id,
        action: data.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        targetType: 'USER',
        targetId: id,
        metadata: { previousState: currentUser.isActive },
        request,
      });
    }

    if (data.role !== undefined && data.role !== currentUser.role) {
      await logAdminAction({
        adminId: admin.id,
        action: data.role === 'ADMIN' ? 'PROMOTE_TO_ADMIN' : 'DEMOTE_FROM_ADMIN',
        targetType: 'USER',
        targetId: id,
        metadata: { previousRole: currentUser.role },
        request,
      });
    }

    if (data.name !== undefined && data.name !== currentUser.name) {
      await logAdminAction({
        adminId: admin.id,
        action: 'UPDATE_USER',
        targetType: 'USER',
        targetId: id,
        metadata: { field: 'name', previousValue: currentUser.name },
        request,
      });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to update user');

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

    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
