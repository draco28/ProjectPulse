/**
 * Agent Token Validation Endpoint (Sprint 9)
 *
 * Internal API used by MCP server to validate agent bearer tokens.
 * Returns projectId and token metadata on success, 401 on failure.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateProjectToken } from '@/lib/agent-tokens';

const validateRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * POST /api/agent-auth/validate
 *
 * Validate an agent bearer token and return project context.
 * Called by MCP server on every authenticated request.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = validateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { token } = validationResult.data;

    // Validate token (throws on invalid/expired/revoked)
    const result = await validateProjectToken(token);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    // Log error for debugging but don't expose details
    console.error('[Agent Auth] Validation failed:', error.message);

    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}
