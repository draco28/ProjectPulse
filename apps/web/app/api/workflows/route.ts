import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  getAuthorizedProjectId,
  AuthError,
  authErrorResponse,
} from '@/lib/auth/validateRequest';

/**
 * GET /api/workflows
 * List workflow templates with optional filtering
 *
 * Query params:
 * - category?: string (development, project-management, knowledge)
 * - isActive?: boolean (default: true)
 *
 * @returns {templates: Array<WorkflowTemplate>}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const isActiveParam = searchParams.get('isActive');

    // SECURITY: Authenticate and get authorized project
    const requestedProjectId = searchParams.get('projectId');
    const { projectId } = await getAuthorizedProjectId(
      request,
      requestedProjectId ? parseInt(requestedProjectId, 10) : undefined
    );

    const isActive = isActiveParam === 'false' ? false : true;

    const templates = await prisma.workflowTemplate.findMany({
      where: {
        projectId, // SECURITY: Filter by authorized project
        ...(category && { category }),
        isActive,
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        steps: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Add stepCount to each template
    const templatesWithCount = templates.map((t) => {
      const stepsArray = Array.isArray(t.steps) ? t.steps : [];
      return {
        ...t,
        stepCount: stepsArray.length,
      };
    });

    return NextResponse.json({
      data: { templates: templatesWithCount },
      error: null,
    });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
    console.error('Error fetching workflow templates:', error);
    return NextResponse.json(
      {
        data: null,
        error: 'Failed to fetch workflow templates',
      },
      { status: 500 }
    );
  }
}
