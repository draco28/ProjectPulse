/**
 * Admin Audit Logging
 * Sprint 11.5: Track all admin actions for accountability
 */

import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

export type AdminAction =
  | 'ACTIVATE_USER'
  | 'DEACTIVATE_USER'
  | 'PROMOTE_TO_ADMIN'
  | 'DEMOTE_FROM_ADMIN'
  | 'RESET_PASSWORD'
  | 'UPDATE_USER'
  | 'REVOKE_TOKEN'
  | 'BLOCK_MCP_TOOL'
  | 'UNBLOCK_MCP_TOOL'
  | 'EMERGENCY_SHUTDOWN'
  | 'SYSTEM_SETTING_CHANGE';

export type TargetType = 'USER' | 'PROJECT_TOKEN' | 'MCP_TOOL' | 'SYSTEM';

interface LogAdminActionParams {
  adminId: string;
  action: AdminAction;
  targetType: TargetType;
  targetId: string;
  metadata?: Record<string, unknown>;
  request?: Request;
}

/**
 * Log an admin action to the audit log
 * Call this after any admin action that modifies state
 */
export async function logAdminAction(params: LogAdminActionParams): Promise<void> {
  const { adminId, action, targetType, targetId, metadata, request } = params;

  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        metadata: metadata as Prisma.InputJsonValue | undefined,
        ipAddress: request?.headers.get('x-forwarded-for') ?? request?.headers.get('x-real-ip') ?? null,
        userAgent: request?.headers.get('user-agent') ?? null,
      },
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('[Audit] Failed to log admin action:', error);
  }
}

/**
 * Get recent audit logs for display in admin dashboard
 */
export async function getRecentAuditLogs(limit = 50) {
  return prisma.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get audit logs for a specific target (user, token, etc.)
 */
export async function getAuditLogsForTarget(targetType: TargetType, targetId: string) {
  return prisma.adminAuditLog.findMany({
    where: { targetType, targetId },
    orderBy: { createdAt: 'desc' },
  });
}
