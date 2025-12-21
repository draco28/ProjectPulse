/**
 * MCP Emergency Shutdown API
 * Sprint 11.5: Enable/disable emergency shutdown for all MCP operations
 *
 * GET /api/admin/mcp/emergency - Check emergency shutdown status
 * POST /api/admin/mcp/emergency - Enable emergency shutdown
 * DELETE /api/admin/mcp/emergency - Disable emergency shutdown
 *
 * When enabled, ALL MCP tool calls are rejected with admin message
 * Storage: Setting table with key 'mcp_emergency_shutdown'
 * Security: Requires ADMIN role
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-server';
import { logAdminAction } from '@/lib/audit';
import type { Prisma } from '@prisma/client';

const SETTING_KEY = 'mcp_emergency_shutdown';

interface EmergencyValue {
  enabled: boolean;
  reason?: string;
  enabledAt?: string;
  enabledBy?: string;
}

const enableSchema = z.object({
  reason: z.string().min(1).max(500),
});

export async function GET(request: NextRequest) {
  try {
    // Allow internal requests without admin check (for MCP server)
    const isInternal = request.headers.get('x-internal-request') === 'true';

    if (!isInternal) {
      await requireAdmin();
    }

    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    const value = setting?.value as EmergencyValue | null;

    return NextResponse.json({
      enabled: value?.enabled ?? false,
      reason: value?.reason ?? null,
      enabledAt: value?.enabledAt ?? null,
      enabledBy: value?.enabledBy ?? null,
    });
  } catch (error) {
    console.error('[Admin Emergency GET] Error:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.startsWith('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Failed to fetch emergency status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { reason } = enableSchema.parse(body);

    const value: EmergencyValue = {
      enabled: true,
      reason,
      enabledAt: new Date().toISOString(),
      enabledBy: admin.id,
    };

    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: {
        value: value as unknown as Prisma.InputJsonValue,
        updatedBy: admin.id,
      },
      create: {
        key: SETTING_KEY,
        value: value as unknown as Prisma.InputJsonValue,
        category: 'mcp',
        description: 'Emergency shutdown for all MCP operations',
        updatedBy: admin.id,
      },
    });

    // Audit log
    await logAdminAction({
      adminId: admin.id,
      action: 'EMERGENCY_SHUTDOWN',
      targetType: 'SYSTEM',
      targetId: 'mcp',
      metadata: { action: 'enable', reason },
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Emergency shutdown enabled. All MCP tool calls will be rejected.',
      enabled: true,
      reason,
      enabledAt: value.enabledAt,
    });
  } catch (error) {
    console.error('[Admin Emergency POST] Error:', error);

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

    return NextResponse.json({ error: 'Failed to enable emergency shutdown' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const value: EmergencyValue = { enabled: false };

    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: {
        value: value as unknown as Prisma.InputJsonValue,
        updatedBy: admin.id,
      },
      create: {
        key: SETTING_KEY,
        value: value as unknown as Prisma.InputJsonValue,
        category: 'mcp',
        description: 'Emergency shutdown for all MCP operations',
        updatedBy: admin.id,
      },
    });

    // Audit log
    await logAdminAction({
      adminId: admin.id,
      action: 'EMERGENCY_SHUTDOWN',
      targetType: 'SYSTEM',
      targetId: 'mcp',
      metadata: { action: 'disable' },
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Emergency shutdown disabled. MCP operations resumed.',
      enabled: false,
    });
  } catch (error) {
    console.error('[Admin Emergency DELETE] Error:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.startsWith('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Failed to disable emergency shutdown' }, { status: 500 });
  }
}
