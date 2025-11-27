/**
 * Personas List API - Sprint 11 (EPIC-013: Client Agent Integration)
 * 
 * GET /api/personas - List all agent personas for a project (metadata only)
 * 
 * Token Efficiency: Excludes systemPrompt in list view
 * Multi-tenancy: Filtered by projectId
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

//=============================================================================
// VALIDATION SCHEMA
//=============================================================================

const querySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  isActive: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional()
  ),
});

//=============================================================================
// GET /api/personas
//=============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. Validate query params
    const validation = querySchema.safeParse({
      projectId: searchParams.get('projectId'),
      isActive: searchParams.get('isActive'),
    });
    
    if (!validation.success) {
      console.error('[GET /api/personas] Validation failed', validation.error);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const { projectId, isActive } = validation.data;
    
    console.log('[GET /api/personas] Listing personas', { projectId, isActive });
    
    // 2. Query personas (metadata only, no systemPrompt)
    const personas = await prisma.agentPersona.findMany({
      where: {
        projectId,
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
        expertise: true,
        isActive: true,
        isBuiltIn: true,
        createdAt: true,
        updatedAt: true,
        // Exclude systemPrompt, skills, tools, rules for token efficiency
      },
      orderBy: { name: 'asc' },
    });
    
    console.log('[GET /api/personas] Found personas', {
      projectId,
      count: personas.length,
    });
    
    return NextResponse.json({
      personas,
      count: personas.length,
      projectId,
    });
    
  } catch (error) {
    console.error('[GET /api/personas] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list personas',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
