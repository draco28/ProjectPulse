/**
 * Admin MCP Log Cleanup API
 * Sprint 11.5: Trigger manual cleanup of old MCP logs and generate aggregates
 *
 * POST /api/admin/mcp/cleanup - Run cleanup job (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { runMCPLogCleanup } from '@/lib/jobs/mcp-log-cleanup';
import { logAdminAction } from '@/lib/audit';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

export async function POST(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const admin = await requireAdmin();

    const result = await runMCPLogCleanup();

    // Log the cleanup action
    await logAdminAction({
      adminId: admin.id,
      action: 'SYSTEM_SETTING_CHANGE',
      targetType: 'SYSTEM',
      targetId: 'mcp_log_cleanup',
      metadata: {
        deletedLogs: result.deletedLogs,
        aggregatesCreated: result.aggregatesCreated,
        errors: result.errors,
      },
      request,
    });

    return NextResponse.json({
      success: result.errors.length === 0,
      deletedLogs: result.deletedLogs,
      aggregatesCreated: result.aggregatesCreated,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to run MCP cleanup job');

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to run cleanup job' }, { status: 500 });
  }
}
