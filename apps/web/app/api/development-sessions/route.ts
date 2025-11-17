import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * GET /api/development-sessions
 *
 * Query development sessions by projectId and optional status filter
 *
 * Query Parameters:
 * - projectId: number (required) - Project ID
 * - status: string (optional) - Filter by status ("IN_PROGRESS" | "COMPLETED")
 *
 * Response:
 * - 200: Array of development sessions
 * - 400: Validation error (missing projectId)
 * - 500: Server error
 *
 * @see CurrentWorkModal component
 * @see Sprint 8.5 Phase 1: Roadmap UI with current work tracking
 */
export const dynamic = 'force-dynamic'; // No caching for session queries

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectIdParam = searchParams.get('projectId');
    const statusParam = searchParams.get('status');

    if (!projectIdParam) {
      return NextResponse.json(
        { error: 'projectId query parameter required' },
        { status: 400 }
      );
    }

    const projectId = parseInt(projectIdParam, 10);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'projectId must be a valid integer' },
        { status: 400 }
      );
    }

    // Build query filter
    const where: any = { projectId };

    if (statusParam) {
      where.status = statusParam;
    }

    // Query development sessions
    const sessions = await db.developmentSession.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 20, // Limit to most recent 20 sessions
    });

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/development-sessions] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch development sessions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
