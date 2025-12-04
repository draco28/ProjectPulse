/**
 * Internal MCP Tool Logging API
 * Sprint 11.5: Called by MCP server to log tool invocations
 *
 * POST /api/mcp/log - Log a tool call
 *
 * Security:
 * - Only accepts requests with x-internal-request header
 * - Fire-and-forget from MCP server (non-blocking)
 * - No auth required (internal only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

const logSchema = z.object({
  tokenId: z.number().int().positive(),
  projectId: z.number().int().positive(),
  toolName: z.string().min(1).max(100),
  duration: z.number().int().nonnegative(),
  success: z.boolean(),
  error: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  // Only allow internal requests
  if (request.headers.get('x-internal-request') !== 'true') {
    return NextResponse.json(
      { error: 'Forbidden: Internal use only' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data = logSchema.parse(body);

    // Create log entry
    await prisma.mCPToolLog.create({
      data: {
        tokenId: data.tokenId,
        projectId: data.projectId,
        toolName: data.toolName,
        duration: data.duration,
        success: data.success,
        error: data.error,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    // Update token's lastUsedAt
    await prisma.projectToken.update({
      where: { id: data.tokenId },
      data: { lastUsedAt: new Date() },
    }).catch(() => {
      // Ignore if token doesn't exist (shouldn't happen)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MCP Log] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to log tool call' },
      { status: 500 }
    );
  }
}
