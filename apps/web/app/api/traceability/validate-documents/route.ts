/**
 * Document Traceability Validation API
 *
 * POST /api/traceability/validate-documents
 *
 * Validates traceability across Session 2 generated documents:
 * PRD → SRS → Backlog → Project Plan
 *
 * The matrix is stored as a Knowledge Item for agent retrieval.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';
import { generateEmbedding } from '@/lib/embeddings';
import { parseDocumentSet, type RawDocumentSet } from '@/lib/traceability/parsers';
import { analyzeTraceability } from '@/lib/traceability/analysis';
import { generateTraceabilityMarkdown } from '@/lib/traceability/markdown';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

export const dynamic = 'force-dynamic';

const ValidateRequestSchema = z.object({
  projectId: z.number().int().positive().optional(),
  force: z.boolean().default(false),
  strict: z.boolean().default(true),
  strictNfr: z.boolean().default(false),
});

function success<T>(data: T, status = 200) {
  return Response.json({ data, error: null }, { status });
}

function failure({
  code,
  message,
  status = 400,
  details,
}: {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}) {
  return Response.json({ data: null, error: { code, message, details } }, { status });
}

// Document filename patterns
const DOC_PATTERNS = {
  prd: '01-PRD',
  srs: '02-SRS',
  backlog: '12-Backlog',
  projectPlan: '13-Project-Plan',
} as const;

type DocType = keyof typeof DOC_PATTERNS;

/**
 * Find the latest completed Session 2 for a project
 */
async function findLatestSession2(projectId: number) {
  return prisma.onboardingSession.findFirst({
    where: {
      projectId,
      sessionNumber: 2,
      status: 'complete',
    },
    orderBy: {
      completedAt: 'desc',
    },
    select: {
      id: true,
      completedAt: true,
    },
  });
}

/**
 * Load Session 2 documents by filename pattern
 */
async function loadSession2Documents(
  sessionId: number
): Promise<{ docs: RawDocumentSet; missing: string[]; found: string[] }> {
  const documents = await prisma.document.findMany({
    where: {
      onboardingSessionId: sessionId,
    },
    select: {
      filename: true,
      content: true,
    },
  });

  const rawDocs: RawDocumentSet = {};
  const found: string[] = [];
  const missing: string[] = [];

  // Match documents by filename pattern
  for (const [key, pattern] of Object.entries(DOC_PATTERNS)) {
    const doc = documents.find((d) => d.filename.toLowerCase().includes(pattern.toLowerCase()));

    if (doc) {
      rawDocs[key as DocType] = doc.content;
      found.push(doc.filename);
    } else {
      missing.push(pattern);
    }
  }

  return { docs: rawDocs, missing, found };
}

export async function POST(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const payload = await request.json();
    const data = ValidateRequestSchema.parse(payload);

    // Authenticate and get project
    const { projectId } = await getAuthorizedProjectId(request, data.projectId);

    // Get project info
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    });

    if (!project) {
      return failure({
        code: 'PROJECT_NOT_FOUND',
        message: `Project ${projectId} not found`,
        status: 404,
      });
    }

    // Find latest completed Session 2
    const session2 = await findLatestSession2(projectId);

    if (!session2) {
      return failure({
        code: 'NO_SESSION_2',
        message: 'No completed Session 2 found for this project. Run onboarding Session 2 first.',
        status: 404,
        details: { projectId },
      });
    }

    // Load documents
    const { docs, missing, found } = await loadSession2Documents(session2.id);

    if (missing.length > 0) {
      return failure({
        code: 'MISSING_DOCUMENTS',
        message: 'Required Session 2 documents not found',
        status: 422,
        details: {
          missing,
          found,
          sessionId: session2.id,
          sessionCompletedAt: session2.completedAt,
        },
      });
    }

    // Parse documents
    const parsedDocs = parseDocumentSet(docs);

    // Sprint 14: Store backlog items in database for agent-consumable queries
    let backlogItemsStored = 0;
    if (parsedDocs.backlog?.items && parsedDocs.backlog.items.length > 0) {
      const backlogItems = parsedDocs.backlog.items;

      // Upsert each backlog item (update if exists, create if not)
      for (const item of backlogItems) {
        await prisma.backlogItem.upsert({
          where: {
            projectId_itemId: {
              projectId,
              itemId: item.id,
            },
          },
          update: {
            title: item.title,
            epicRef: item.epicId, // Parser uses epicId, DB uses epicRef
            frTraces: item.frTraces,
            nfrTraces: item.nfrTraces,
            sprintNumber: item.sprintNumber,
            sourceDoc: '12-Backlog.md',
            rawBlock: item.rawBlock,
            updatedAt: new Date(),
          },
          create: {
            projectId,
            itemId: item.id,
            title: item.title,
            epicRef: item.epicId,
            frTraces: item.frTraces,
            nfrTraces: item.nfrTraces,
            sprintNumber: item.sprintNumber,
            sourceDoc: '12-Backlog.md',
            rawBlock: item.rawBlock,
          },
        });
        backlogItemsStored++;
      }
    }

    // Analyze traceability
    const matrix = analyzeTraceability(parsedDocs, {
      strict: data.strict,
      strictNfr: data.strictNfr,
    });

    // Generate markdown for storage
    const generatedAt = new Date().toISOString();
    const markdownContent = generateTraceabilityMarkdown(matrix, parsedDocs, {
      projectName: project.name,
      generatedAt,
      includeDetails: true,
    });

    // Store as Knowledge Item
    const title = `Document Traceability Matrix - ${new Date().toISOString().split('T')[0]}`;
    const category = 'traceability';
    const tags = ['document-traceability', 'prd', 'srs', 'backlog', 'project-plan'];

    // Generate embedding for semantic search
    const embeddingText = `${title}\n\n${markdownContent}`;
    const embeddingResult = await generateEmbedding(embeddingText);
    const embeddingVector = `[${embeddingResult.embedding.join(',')}]`;

    // Store using raw SQL (Prisma doesn't support vector type)
    const result = await prisma.$queryRaw<
      Array<{
        id: number;
        title: string;
        category: string;
        tags: string[];
        createdAt: Date;
      }>
    >`
      INSERT INTO knowledge_items (
        "projectId",
        title,
        content,
        category,
        tags,
        embedding,
        "contentTsvector",
        metadata,
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${projectId},
        ${title},
        ${markdownContent},
        ${category},
        ${tags}::text[],
        ${embeddingVector}::vector(768),
        setweight(to_tsvector('english', ${title}), 'A') ||
        setweight(to_tsvector('english', ${markdownContent}), 'B'),
        ${JSON.stringify({
          type: 'document-traceability',
          sessionId: session2.id,
          matrix,
        })}::jsonb,
        NOW(),
        NOW()
      )
      RETURNING id, title, category, tags, "createdAt"
    `;

    const knowledgeItem = result?.[0];
    if (!knowledgeItem) {
      return failure({
        code: 'STORAGE_FAILED',
        message: 'Failed to store traceability matrix as knowledge item',
        status: 500,
      });
    }

    return success(
      {
        coverage: matrix.coverage,
        nfrSummary: matrix.nfrSummary,
        gaps: matrix.gaps,
        details: matrix.details,
        knowledgeItemId: knowledgeItem.id,
        backlogItemsStored, // Sprint 14: Number of backlog items stored in database
        generatedAt,
        message: `Document traceability validated: FR ${matrix.coverage.frCoveragePercent}%, Backlog ${matrix.coverage.backlogItemCoveragePercent}%, Plan ${matrix.coverage.planMappingCoveragePercent}%. ${backlogItemsStored} backlog items stored.`,
      },
      201
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return failure({ code: error.code, message: error.message, status: error.status });
    }

    if (error instanceof z.ZodError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: error.flatten(),
      });
    }

    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to validate document traceability');
    return failure({
      code: 'INTERNAL_ERROR',
      message: 'Failed to validate document traceability',
      status: 500,
    });
  }
}
