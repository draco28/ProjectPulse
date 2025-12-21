/**
 * POST /api/onboarding/documents/batch
 *
 * Sprint 9 Refactor: Bulk store documents after agent generation
 * Stores multiple documents atomically in a single transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { syncOnboardingToWiki } from '@/lib/wiki/sync-onboarding';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const documentSchema = z.object({
  filename: z.string().min(1),
  content: z.string().min(500).max(50000),
  category: z.enum(['planning', 'architecture', 'implementation', 'operations']),
  wordCount: z.number().int().positive(),
});

const requestSchema = z.object({
  projectId: z.number().int().positive(),
  documents: z.array(documentSchema).min(1).max(5),
});

type BatchDocumentsRequest = z.infer<typeof requestSchema>;

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  console.log('[POST /api/onboarding/documents/batch] Storing document batch...');

  try {
    // 1. Validate request
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      console.error('[POST /api/onboarding/documents/batch] Validation failed:', validation.error);

      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { projectId, documents }: BatchDocumentsRequest = validation.data;

    console.log('[POST /api/onboarding/documents/batch] Request validated', {
      projectId,
      documentCount: documents.length,
      filenames: documents.map((d) => d.filename),
    });

    // 2. Get or create Session 2
    let session = await prisma.onboardingSession.findUnique({
      where: {
        projectId_sessionNumber: { projectId, sessionNumber: 2 },
      },
      select: {
        id: true,
        metrics: true,
        documents: {
          select: { id: true },
        },
      },
    });

    if (!session) {
      console.log('[POST /api/onboarding/documents/batch] Creating new Session 2...');

      session = await prisma.onboardingSession.create({
        data: {
          projectId,
          sessionNumber: 2,
          status: 'in_progress',
          startedAt: new Date(),
          metrics: {
            tokensUsed: 0,
            batchesComplete: 0,
          },
        },
        select: {
          id: true,
          metrics: true,
          documents: {
            select: { id: true },
          },
        },
      });

      console.log('[POST /api/onboarding/documents/batch] Session 2 created', {
        sessionId: session.id,
      });
    }

    // 3. Check for duplicate filenames
    const existingDocs = await prisma.document.findMany({
      where: {
        onboardingSessionId: session.id,
        filename: { in: documents.map((d) => d.filename) },
      },
      select: { filename: true },
    });

    if (existingDocs.length > 0) {
      console.error(
        '[POST /api/onboarding/documents/batch] Duplicate filenames found:',
        existingDocs
      );

      return NextResponse.json(
        {
          error: 'Duplicate filenames',
          duplicates: existingDocs.map((d) => d.filename),
          hint: 'These documents already exist. Use different filenames or delete existing ones first.',
        },
        { status: 409 }
      );
    }

    // 4. Bulk insert documents in transaction
    console.log('[POST /api/onboarding/documents/batch] Bulk inserting documents...');

    const createdDocs = await prisma.$transaction(
      documents.map((doc) =>
        prisma.document.create({
          data: {
            onboardingSessionId: session!.id,
            filename: doc.filename,
            content: doc.content,
            wordCount: doc.wordCount,
            category: doc.category,
            tags: [], // Can be added later if needed
            generatedAt: new Date(),
          },
          select: { id: true, filename: true },
        })
      )
    );

    console.log('[POST /api/onboarding/documents/batch] Documents created', {
      count: createdDocs.length,
      filenames: createdDocs.map((d) => d.filename),
    });

    // 5. Update metrics and mark complete if all 15 documents stored
    const currentMetrics = (session.metrics as any) || { tokensUsed: 0, batchesComplete: 0 };
    const batchesComplete = (currentMetrics.batchesComplete || 0) + 1;
    const totalDocuments = session.documents.length + documents.length;
    const progress = Math.round((totalDocuments / 15) * 100);
    const isComplete = totalDocuments >= 15;

    await prisma.onboardingSession.update({
      where: { id: session.id },
      data: {
        metrics: {
          ...currentMetrics,
          batchesComplete,
          lastBatchAt: new Date().toISOString(),
        },
        status: isComplete ? 'complete' : 'in_progress',
        completedAt: isComplete ? new Date() : undefined,
      },
    });

    if (isComplete) {
      console.log(
        '[POST /api/onboarding/documents/batch] Session 2 marked complete (15 documents stored)'
      );

      // Sync documents to Wiki (Sprint 9 Fix)
      // Fire and forget to avoid blocking response
      syncOnboardingToWiki(projectId).catch((err) =>
        console.error('[POST /api/onboarding/documents/batch] Failed to sync wiki:', err)
      );
    }

    // 6. Calculate progress

    console.log('[POST /api/onboarding/documents/batch] Batch stored successfully', {
      projectId,
      created: documents.length,
      batchesComplete,
      totalDocuments,
      progress,
    });

    return NextResponse.json({
      success: true,
      projectId,
      created: documents.length,
      batchesComplete,
      totalDocuments,
      progress,
      message: `Batch ${batchesComplete} stored ✅. ${totalDocuments}/15 documents complete.${batchesComplete === 4 ? ' Session 2 complete!' : ` Proceed to batch ${batchesComplete + 1}.`}`,
    });
  } catch (error) {
    console.error('[POST /api/onboarding/documents/batch] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to store document batch', message: errorMessage },
      { status: 500 }
    );
  }
}
