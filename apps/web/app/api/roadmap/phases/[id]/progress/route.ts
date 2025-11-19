/**
 * GET /api/roadmap/phases/[id]/progress
 *
 * Sprint 8.5 Phase 4 - Task B.2
 *
 * Returns full phase progress with nested sprints, weeks, days, and tasks
 * Single query with 4-level nested includes (replaces 10+ sequential calls)
 *
 * Query Parameters:
 * - projectId: number (required) - Project ID for security validation
 *
 * Path Parameters:
 * - id: string (required) - Phase ID (UUID)
 *
 * Response:
 * - 200: Phase with full nested tree (sprints → weeks → days → tasks)
 * - 400: Validation error (missing/invalid projectId)
 * - 404: Phase not found or doesn't belong to project
 * - 500: Server error
 *
 * Security: Validates phase belongs to projectId (prevents cross-project access)
 *
 * @see Sprint 8.5 Phase 4 - getPhaseProgress MCP tool
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get projectId from query params (REQUIRED for security)
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter required' },
        { status: 400 }
      );
    }
    
    const projectIdNum = parseInt(projectId, 10);
    if (isNaN(projectIdNum) || projectIdNum <= 0) {
      return NextResponse.json(
        { error: 'projectId must be a positive integer' },
        { status: 400 }
      );
    }
    
    // Query phase with full nested tree + projectId validation
    // Single query with 4-level nested includes (no N+1 problem)
    const phase = await prisma.phase.findFirst({
      where: {
        id: params.id,
        roadmap: {
          projectId: projectIdNum  // Security: Validate ownership
        }
      },
      include: {
        sprints: {
          include: {
            weeks: {
              include: {
                days: {
                  include: {
                    tasks: {
                      select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                        progress: true,
                        startDate: true,
                        endDate: true,
                        createdAt: true,
                        updatedAt: true,
                      }
                    }
                  },
                  orderBy: {
                    title: 'asc'  // Monday, Tuesday, Wednesday...
                  }
                }
              },
              orderBy: {
                title: 'asc'  // Week 1, Week 2, Week 3...
              }
            }
          },
          orderBy: {
            title: 'asc'  // Sprint 1, Sprint 2, Sprint 3...
          }
        }
      }
    });
    
    // Phase not found or doesn't belong to project
    if (!phase) {
      return NextResponse.json(
        {
          error: 'Phase not found',
          message: `Phase ${params.id} does not exist or does not belong to project ${projectIdNum}`
        },
        { status: 404 }
      );
    }
    
    // Return full nested tree
    return NextResponse.json(phase);
    
  } catch (error) {
    console.error('[GET /api/roadmap/phases/[id]/progress] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get phase progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
