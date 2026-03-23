/**
 * Admin Password Reset API
 * Sprint 11.5: Reset user password
 *
 * POST /api/admin/users/[id]/reset-password
 *
 * Body:
 * - newPassword: Optional. If not provided, generates a temporary password.
 *
 * Security:
 * - Requires ADMIN role
 * - Cannot reset own password (self-protection)
 * - Action is audit logged
 *
 * Returns:
 * - success: boolean
 * - temporaryPassword: string (only if password was generated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-server';
import { logAdminAction } from '@/lib/audit';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

export const dynamic = 'force-dynamic';

const resetSchema = z.object({
  newPassword: z.string().min(8).max(128).optional(),
});

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;

    // Self-protection: Cannot reset own password
    if (id === admin.id) {
      return NextResponse.json(
        { error: 'Cannot reset your own password. Use the profile settings instead.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { newPassword } = resetSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate or use provided password
    const passwordToSet = newPassword ?? generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(passwordToSet, 12);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    // Audit log
    await logAdminAction({
      adminId: admin.id,
      action: 'RESET_PASSWORD',
      targetType: 'USER',
      targetId: id,
      metadata: {
        userEmail: user.email,
        wasTemporary: !newPassword,
      },
      request,
    });

    // Return response
    if (newPassword) {
      // Admin provided the password, don't send it back
      return NextResponse.json({
        success: true,
        message: 'Password has been reset',
      });
    } else {
      // Generated temporary password, send it back (one-time display)
      return NextResponse.json({
        success: true,
        message: 'Temporary password generated. Share this with the user securely.',
        temporaryPassword: passwordToSet,
      });
    }
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to reset password'
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

    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
