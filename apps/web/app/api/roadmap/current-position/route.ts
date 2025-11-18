/**
 * GET /api/roadmap/current-position
 *
 * Sprint 8.5 Phase 4 - Task A.2
 *
 * Returns agent's current position in 5-level hierarchy
 * Single query with nested includes (replaces 5 sequential calls)
 *
 * Query Parameters:
 * - projectId: number (required) - Project ID to query
 *
 * Response:
 * - 200: Current position with full hierarchy breadcrumb
 * - 400: Validation error (missing/invalid projectId)
 * - 500: Server error
 *
 * @see Sprint 8.5 Phase 4 - getCurrentPosition MCP tool
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get projectId from query params
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
    
    // Query latest IN_PROGRESS task with full 5-level hierarchy
    // Uses nested includes for single query (no N+1 problem)
    const task = await prisma.task.findFirst({
      where: {
        status: 'IN_PROGRESS',
        day: {
          week: {
            sprint: {
              phase: {
                roadmap: {
                  projectId: projectIdNum
                }
              }
            }
          }
        }
      },
      include: {
        day: {
          include: {
            week: {
              include: {
                sprint: {
                  include: {
                    phase: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    // No active task found
    if (!task) {
      return NextResponse.json({
        currentPosition: null,
        message: 'No IN_PROGRESS task found for this project',
        suggestions: [
          'Complete Session 3 onboarding to create roadmap',
          'Call projectpulse.task.create() to create a task',
          'Set task status to IN_PROGRESS'
        ],
        projectId: projectIdNum
      });
    }
    
    // Extract hierarchy from nested structure
    const day = task.day;
    const week = day.week;
    const sprint = week.sprint;
    const phase = sprint.phase;
    
    // Build position response
    const position = {
      phase: {
        id: phase.id,
        title: phase.title,
        status: phase.status,
        progress: phase.progress
      },
      sprint: {
        id: sprint.id,
        title: sprint.title,
        status: sprint.status,
        progress: sprint.progress
      },
      week: {
        id: week.id,
        title: week.title,
        status: week.status,
        progress: week.progress
      },
      day: {
        id: day.id,
        title: day.title,
        status: day.status,
        progress: day.progress
      },
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        progress: task.progress,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    };
    
    return NextResponse.json(position);
    
  } catch (error) {
    console.error('[GET /api/roadmap/current-position] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get current position',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
