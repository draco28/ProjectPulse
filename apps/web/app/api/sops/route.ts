/**
 * SOPs List API - Sprint 11 (EPIC-013: Client Agent Integration)
 * 
 * GET /api/sops - List all SOPs for a project (metadata only)
 * 
 * Token Efficiency: Excludes content in list view
 * Multi-tenancy: Filtered by projectId
 * Security: Requires authentication (user session OR agent token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

//=============================================================================
// VALIDATION SCHEMA
//=============================================================================

const querySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  category: z.string().nullish(), // Allow null from searchParams.get()
});

//=============================================================================
// GET /api/sops
//=============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. Validate query params
    const validation = querySchema.safeParse({
      projectId: searchParams.get('projectId'),
      category: searchParams.get('category'),
    });
    
    if (!validation.success) {
      console.error('[GET /api/sops] Validation failed', validation.error);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const { projectId: requestedProjectId, category } = validation.data;
    
    // 2. Authenticate and validate project access
    const { projectId } = await getAuthorizedProjectId(request, requestedProjectId);
    
    console.log('[GET /api/sops] Listing SOPs', { projectId, category });
    
    // 3. Query SOPs (metadata only, no content)
    const sops = await prisma.sOP.findMany({
      where: {
        projectId,
        ...(category && { category }),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        category: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        // Exclude content for token efficiency
      },
      orderBy: { title: 'asc' },
    });
    
    console.log('[GET /api/sops] Found SOPs', {
      projectId,
      count: sops.length,
    });
    
    return NextResponse.json({
      sops,
      count: sops.length,
      projectId,
    });
    
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    
    console.error('[GET /api/sops] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list SOPs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
