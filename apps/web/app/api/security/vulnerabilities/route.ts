import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

/**
 * GET /api/security/vulnerabilities
 *
 * Fetch security findings with filtering and pagination
 *
 * Query params:
 * - severity: Filter by severity ('ERROR' | 'WARNING' | 'INFO')
 * - status: Filter by status ('open' | 'fixed' | 'false_positive')
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 */
export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const searchParams = request.nextUrl.searchParams;
    const severity = searchParams.get('severity') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    // Build where clause
    const where: Prisma.SecurityFindingWhereInput = {};

    if (severity) {
      where.severity = severity;
    }

    if (status) {
      where.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with count for pagination
    const [findings, total] = await Promise.all([
      prisma.securityFinding.findMany({
        where,
        orderBy: [
          { severity: 'asc' }, // ERROR first, then WARNING, then INFO
          { scanDate: 'desc' }, // Most recent first within each severity
        ],
        skip,
        take: limit,
        select: {
          id: true,
          ruleId: true,
          severity: true,
          message: true,
          filePath: true,
          lineNumber: true,
          codeSnippet: true,
          status: true,
          scanDate: true,
          // Sprint 10: Use ticket instead of issue
          ticket: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.securityFinding.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      data: {
        findings,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore,
        },
      },
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to fetch vulnerabilities'
    );
    return NextResponse.json({ error: 'Failed to fetch vulnerabilities' }, { status: 500 });
  }
}
