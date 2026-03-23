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
import { requireOnboardingAuth, handleAuthError, AuthError } from '@/lib/onboarding-auth';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

// ============================================================================
// POST: Store Document
// ============================================================================

const storeDocumentSchema = z.object({
  projectId: z.number().int().positive('Project ID must be positive'),
  filename: z.string().regex(/^\d{2}-[A-Za-z-]+\.md$/, 'Filename must match pattern: 01-Name.md'),
  content: z
    .string()
    .min(500, 'Content must be at least 500 characters')
    .max(50000, 'Content must not exceed 50000 characters'),
  category: z.enum(['planning', 'architecture', 'implementation', 'operations']),
  wordCount: z.number().int().positive().optional(),
  overwrite: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const body = await request.json();
    const validation = storeDocumentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      projectId,
      filename,
      content,
      category,
      wordCount: providedWordCount,
      overwrite,
    } = validation.data;

    // Sprint 12: Require authentication (session OR bearer token)
    await requireOnboardingAuth(request, projectId);

    // Verify Session 1 is complete
    const session1 = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 1 },
      },
    });

    if (!session1 || session1.status !== 'complete') {
      return NextResponse.json(
        {
          error: 'Session 1 must be complete before storing documents',
          status: session1?.status || 'not_found',
        },
        { status: 400 }
      );
    }

    // Get or create Session 2 (documents belong to Session 2, not Session 1)
    let session2 = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 2 },
      },
    });

    if (!session2) {
      session2 = await prisma.onboardingSession.create({
        data: {
          projectId,
          sessionNumber: 2,
          status: 'in_progress',
          response: {
            documentsGenerated: 0,
            createdAt: new Date().toISOString(),
          },
          startedAt: new Date(),
        },
      });
    }

    // Check for existing document (in Session 2)
    const existingDoc = await prisma.document.findFirst({
      where: {
        onboardingSessionId: session2.id,
        filename,
      },
    });

    // Calculate word count if not provided
    const wordCount = providedWordCount || content.split(/\s+/).filter((w) => w.length > 0).length;

    let document;

    if (existingDoc) {
      if (!overwrite) {
        return NextResponse.json(
          {
            error: 'Document with this filename already exists',
            filename,
            existingDocId: existingDoc.id,
            hint: 'Use a different filename or set overwrite=true',
          },
          { status: 409 }
        );
      }

      // Update existing document
      log.info({ filename, wordCount, session: 2 }, 'Overwriting document');
      document = await prisma.document.update({
        where: { id: existingDoc.id },
        data: {
          content,
          wordCount,
          category,
          tags: ['onboarding', 'session-2', category],
          generatedAt: new Date(),
        },
      });
    } else {
      // Create new Document record
      log.info({ filename, wordCount, session: 2 }, 'Storing new document');
      document = await prisma.document.create({
        data: {
          onboardingSessionId: session2.id,
          filename,
          content,
          wordCount,
          category,
          tags: ['onboarding', 'session-2', category],
          generatedAt: new Date(),
        },
      });
    }

    // Count total documents stored
    const documentsStored = await prisma.document.count({
      where: { onboardingSessionId: session2.id },
    });

    const isComplete = documentsStored >= 15;

    log.info({ filename, documentsStored, session: 2 }, 'Document stored');

    // Update Session 2 progress (session2 was created/fetched earlier)
    await prisma.onboardingSession.update({
      where: { id: session2.id },
      data: {
        response: {
          documentsGenerated: documentsStored,
          lastDocumentStored: filename,
          lastUpdated: new Date().toISOString(),
        },
        status: isComplete ? 'complete' : 'in_progress',
        completedAt: isComplete ? new Date() : null,
      },
    });

    if (isComplete) {
      log.info({ session: 2 }, 'All 15 documents stored - Session 2 COMPLETE');
      // Sync to Wiki (Sprint 9 Fix)
      syncOnboardingToWiki(projectId).catch((err) =>
        log.error(
          { error: err instanceof Error ? err.message : String(err) },
          'Failed to sync wiki'
        )
      );
    } else if (overwrite) {
      // If overwriting, also trigger sync to update Wiki (Sprint 9 Update: allow updates after completion)
      log.info({ session: 2 }, 'Overwriting document - Triggering Wiki Sync');
      syncOnboardingToWiki(projectId).catch((err) =>
        log.error(
          { error: err instanceof Error ? err.message : String(err) },
          'Failed to sync wiki on overwrite'
        )
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
        generatedAt: document.generatedAt,
      },
      progress: {
        documentsStored,
        totalDocuments: 15,
        percentComplete: Math.round((documentsStored / 15) * 100),
        isComplete,
      },
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to store document'
    );

    // Sprint 12: Handle auth errors
    if (error instanceof AuthError) {
      return handleAuthError(error);
    }

    return NextResponse.json(
      {
        error: 'Failed to store document',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET: List Documents
// ============================================================================

export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectIdParam = searchParams.get('projectId');

    if (!projectIdParam) {
      return NextResponse.json({ error: 'projectId query parameter required' }, { status: 400 });
    }

    const projectId = parseInt(projectIdParam, 10);

    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json({ error: 'projectId must be a positive integer' }, { status: 400 });
    }

    // Sprint 12: Require authentication (session OR bearer token)
    await requireOnboardingAuth(request, projectId);

    // Fetch Session 2 to get the onboardingSessionId for documents
    // Sprint 9 Refactor: Documents are now linked to Session 2, not Session 1
    const session2 = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 2 },
      },
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
        onboardingSessionId: session2.id,
      },
      select: {
        id: true,
        filename: true,
        wordCount: true,
        category: true,
        tags: true,
        generatedAt: true,
        // Note: NOT including content (too large for list view)
      },
      orderBy: {
        filename: 'asc',
      },
    });

    const totalWordCount = documents.reduce((sum, doc) => sum + doc.wordCount, 0);

    return NextResponse.json({
      documents,
      totalDocuments: documents.length,
      totalWordCount,
      status: session2.status,
      session2Id: session2.id,
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to list documents'
    );

    // Sprint 12: Handle auth errors
    if (error instanceof AuthError) {
      return handleAuthError(error);
    }

    return NextResponse.json(
      {
        error: 'Failed to list documents',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
