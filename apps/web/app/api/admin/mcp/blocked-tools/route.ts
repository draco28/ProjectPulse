/**
 * Global MCP Tool Blocklist API
 * Sprint 11.5: Manage globally blocked MCP tools
 *
 * GET /api/admin/mcp/blocked-tools - List blocked tools
 * POST /api/admin/mcp/blocked-tools - Add tool to blocklist
 * DELETE /api/admin/mcp/blocked-tools - Remove tool from blocklist
 *
 * Storage: Setting table with key 'mcp_blocked_tools'
 * Security: Requires ADMIN role
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-server';
import { logAdminAction } from '@/lib/audit';

const SETTING_KEY = 'mcp_blocked_tools';

const addToolSchema = z.object({
  toolName: z.string().min(1).max(100),
  reason: z.string().max(500).optional(),
});

const removeToolSchema = z.object({
  toolName: z.string().min(1).max(100),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    const blockedTools = (setting?.value as string[]) ?? [];

    return NextResponse.json({
      blockedTools,
    });
  } catch (error) {
    console.error('[Admin Blocked Tools GET] Error:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.startsWith('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch blocked tools' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { toolName, reason } = addToolSchema.parse(body);

    // Get current blocklist
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    const currentList: string[] = (setting?.value as string[]) ?? [];

    if (currentList.includes(toolName)) {
      return NextResponse.json(
        { error: 'Tool is already blocked' },
        { status: 400 }
      );
    }

    // Add to blocklist
    const newList = [...currentList, toolName];

    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: {
        value: newList,
        updatedBy: admin.id,
      },
      create: {
        key: SETTING_KEY,
        value: newList,
        category: 'mcp',
        description: 'Globally blocked MCP tools',
        updatedBy: admin.id,
      },
    });

    // Audit log
    await logAdminAction({
      adminId: admin.id,
      action: 'BLOCK_MCP_TOOL',
      targetType: 'MCP_TOOL',
      targetId: toolName,
      metadata: { reason },
      request,
    });

    return NextResponse.json({
      success: true,
      message: `Tool "${toolName}" has been blocked`,
      blockedTools: newList,
    });
  } catch (error) {
    console.error('[Admin Blocked Tools POST] Error:', error);

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

    return NextResponse.json(
      { error: 'Failed to block tool' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { toolName } = removeToolSchema.parse(body);

    // Get current blocklist
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    const currentList: string[] = (setting?.value as string[]) ?? [];

    if (!currentList.includes(toolName)) {
      return NextResponse.json(
        { error: 'Tool is not blocked' },
        { status: 400 }
      );
    }

    // Remove from blocklist
    const newList = currentList.filter((t) => t !== toolName);

    await prisma.setting.update({
      where: { key: SETTING_KEY },
      data: {
        value: newList,
        updatedBy: admin.id,
      },
    });

    // Audit log
    await logAdminAction({
      adminId: admin.id,
      action: 'UNBLOCK_MCP_TOOL',
      targetType: 'MCP_TOOL',
      targetId: toolName,
      request,
    });

    return NextResponse.json({
      success: true,
      message: `Tool "${toolName}" has been unblocked`,
      blockedTools: newList,
    });
  } catch (error) {
    console.error('[Admin Blocked Tools DELETE] Error:', error);

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

    return NextResponse.json(
      { error: 'Failed to unblock tool' },
      { status: 500 }
    );
  }
}
