/**
 * /api/onboarding/documents
 * 
 * Sprint 8.6 Phase 2 - Session 2 Document Storage API (Agent-Side AI)
 * 
 * POST: Store ONE agent-generated document (called 15 times by agent)
 * GET: List all stored documents from Session 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { syncOnboardingToWiki } from '@/lib/wiki/sync-onboarding';

// ============================================================================
// POST: Store Document
// ============================================================================

const storeDocumentSchema = z.object({
  projectId: z.number().int().positive('Project ID must be positive'),
  filename: z.string().regex(/^\d{2}-[A-Za-z-]+\.md$/, 'Filename must match pattern: 01-Name.md'),
  content: z.string()
    .min(500, 'Content must be at least 500 characters')
    .max(50000, 'Content must not exceed 50000 characters'),
  category: z.enum(['planning', 'architecture', 'implementation', 'operations']),
  wordCount: z.number().int().positive().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = storeDocumentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.format()
        },
        { status: 400 }
      );
    }
    
    const { projectId, filename, content, category, wordCount: providedWordCount } = validation.data;
    
    // Verify Session 1 is complete
    const session1 = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 1 }
      }
    });
    
    if (!session1 || session1.status !== 'complete') {
      return NextResponse.json(
        {
          error: 'Session 1 must be complete before storing documents',
          status: session1?.status || 'not_found'
        },
        { status: 400 }
      );
    }
    
    // Check for duplicate filename
    const existingDoc = await prisma.document.findFirst({
      where: {
        onboardingSessionId: session1.id,
        filename
      }
    });
    
    if (existingDoc) {
      return NextResponse.json(
        {
          error: 'Document with this filename already exists',
          filename,
          existingDocId: existingDoc.id,
          hint: 'Use a different filename or delete the existing document first'
        },
        { status: 409 }
      );
    }
    
    // Calculate word count if not provided
    const wordCount = providedWordCount || content.split(/\s+/).filter(w => w.length > 0).length;
    
    console.log(`[Session 2] Storing document: ${filename} (${wordCount} words)`);
    
    // Create Document record
    const document = await prisma.document.create({
      data: {
        onboardingSessionId: session1.id,
        filename,
        content,
        wordCount,
        category,
        tags: ['onboarding', 'session-2', category],
        generatedAt: new Date()
      }
    });
    
    // Count total documents stored
    const documentsStored = await prisma.document.count({
      where: { onboardingSessionId: session1.id }
    });
    
    const isComplete = documentsStored >= 15;
    
    console.log(`[Session 2] Document stored: ${filename}, progress: ${documentsStored}/15`);
    
    // Create or update Session 2
    await prisma.onboardingSession.upsert({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 2 }
      },
      update: {
        response: {
          documentsGenerated: documentsStored,
          lastDocumentStored: filename,
          lastUpdated: new Date().toISOString()
        },
        status: isComplete ? 'complete' : 'in_progress',
        completedAt: isComplete ? new Date() : null
      },
      create: {
        projectId,
        sessionNumber: 2,
        status: isComplete ? 'complete' : 'in_progress',
        response: {
          documentsGenerated: documentsStored,
          lastDocumentStored: filename,
          createdAt: new Date().toISOString()
        },
        startedAt: new Date(),
        completedAt: isComplete ? new Date() : null
      }
    });
    
    if (isComplete) {
      console.log('[Session 2] All 15 documents stored - Session 2 COMPLETE! ✅');
      // Sync to Wiki (Sprint 9 Fix)
      syncOnboardingToWiki(projectId).catch(err => 
        console.error('[POST /api/onboarding/documents] Failed to sync wiki:', err)
      );
    }
    
    return NextResponse.json({
      success: true,
      stored: true,
      document: {
        id: document.id,
        filename: document.filename,
        wordCount: document.wordCount,
        category: document.category,
        generatedAt: document.generatedAt
      },
      progress: {
        documentsStored,
        totalDocuments: 15,
        percentComplete: Math.round((documentsStored / 15) * 100),
        isComplete
      }
    });
    
  } catch (error) {
    console.error('[POST /api/onboarding/documents] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to store document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET: List Documents
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectIdParam = searchParams.get('projectId');
    
    if (!projectIdParam) {
      return NextResponse.json(
        { error: 'projectId query parameter required' },
        { status: 400 }
      );
    }
    
    const projectId = parseInt(projectIdParam, 10);
    
    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        { error: 'projectId must be a positive integer' },
        { status: 400 }
      );
    }
    
    // Fetch Session 2 to get the onboardingSessionId for documents
    // Sprint 9 Refactor: Documents are now linked to Session 2, not Session 1
    const session2 = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 2 }
      }
    });

    if (!session2) {
      return NextResponse.json(
        { error: 'Session 2 not found or no documents stored yet' },
        { status: 404 }
      );
    }

    // Fetch all documents for this project's Session 2
    const documents = await prisma.document.findMany({
      where: {
        onboardingSessionId: session2.id
      },
      select: {
        id: true,
        filename: true,
        wordCount: true,
        category: true,
        tags: true,
        generatedAt: true
        // Note: NOT including content (too large for list view)
      },
      orderBy: {
        filename: 'asc'
      }
    });
    
    const totalWordCount = documents.reduce((sum, doc) => sum + doc.wordCount, 0);

    return NextResponse.json({
      documents,
      totalDocuments: documents.length,
      totalWordCount,
      status: session2.status,
      session2Id: session2.id
    });
    
  } catch (error) {
    console.error('[GET /api/onboarding/documents] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to list documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
