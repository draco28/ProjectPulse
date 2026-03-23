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
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

// Type definitions for session metrics
interface SessionMetrics {
  tokensUsed?: number;
  batchesComplete?: number;
  lastBatchAt?: string;
  [key: string]: unknown;
}

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
  const log = createRequestLogger(getRequestId(request));
  log.info({}, 'Storing document batch');

  try {
    // 1. Validate request
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      log.warn({ error: validation.error }, 'Validation failed');

      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { projectId, documents }: BatchDocumentsRequest = validation.data;

    log.info(
      { projectId, documentCount: documents.length, filenames: documents.map((d) => d.filename) },
      'Request validated'
    );

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
      log.info({}, 'Creating new Session 2');

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

      log.info({ sessionId: session.id }, 'Session 2 created');
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
      log.warn({ duplicates: existingDocs.map((d) => d.filename) }, 'Duplicate filenames found');

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
    log.info({}, 'Bulk inserting documents');

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

    log.info(
      { count: createdDocs.length, filenames: createdDocs.map((d) => d.filename) },
      'Documents created'
    );

    // 5. Update metrics and mark complete if all 15 documents stored
    const currentMetrics = (session.metrics as SessionMetrics | null) || {
      tokensUsed: 0,
      batchesComplete: 0,
    };
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
      log.info({}, 'Session 2 marked complete (15 documents stored)');

      // Sync documents to Wiki (Sprint 9 Fix)
      // Fire and forget to avoid blocking response
      syncOnboardingToWiki(projectId).catch((err) =>
        log.error(
          { error: err instanceof Error ? err.message : String(err) },
          'Failed to sync wiki'
        )
      );
    }

    // 6. Calculate progress

    log.info(
      { projectId, created: documents.length, batchesComplete, totalDocuments, progress },
      'Batch stored successfully'
    );

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
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to store document batch'
    );

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to store document batch', message: errorMessage },
      { status: 500 }
    );
  }
}
