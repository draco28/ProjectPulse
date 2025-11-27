/**
 * SOP Get by Slug API - Sprint 11 (EPIC-013: Client Agent Integration)
 * 
 * GET /api/sops/by-slug/[slug] - Get full SOP details by slug
 * 
 * Multi-tenancy: Validates projectId ownership
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

//=============================================================================
// VALIDATION SCHEMA
//=============================================================================

const querySchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

//=============================================================================
// GET /api/sops/by-slug/[slug]
//=============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    if (!slug || slug.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid SOP slug' },
        { status: 400 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // 1. Validate query params
    const validation = querySchema.safeParse({
      projectId: searchParams.get('projectId'),
    });
    
    if (!validation.success) {
      console.error('[GET /api/sops/by-slug/[slug]] Validation failed', validation.error);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const { projectId } = validation.data;
    
    console.log('[GET /api/sops/by-slug/[slug]] Getting SOP', { slug, projectId });
    
    // 2. Query SOP with ownership validation
    const sop = await prisma.sOP.findFirst({
      where: {
        slug,
        projectId, // Validate ownership
      },
    });
    
    if (!sop) {
      return NextResponse.json(
        { error: 'SOP not found', slug, projectId },
        { status: 404 }
      );
    }
    
    console.log('[GET /api/sops/by-slug/[slug]] Found SOP', {
      slug,
      title: sop.title,
      projectId,
    });
    
    return NextResponse.json(sop);
    
  } catch (error) {
    console.error('[GET /api/sops/by-slug/[slug]] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get SOP',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
