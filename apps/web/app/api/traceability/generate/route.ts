/**
 * Traceability Matrix Generation API (Sprint 13)
 *
 * POST /api/traceability/generate - Generate traceability matrix from backlogRefs
 *
 * Scans all tickets in a project, extracts backlogRefs, and generates a coverage matrix
 * showing which requirements are covered by tickets.
 *
 * The matrix is stored as a Knowledge Item for agent retrieval.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';
import { generateEmbedding } from '@/lib/embeddings';

export const dynamic = 'force-dynamic';

const GenerateRequestSchema = z.object({
  projectId: z.number().int().positive().optional(),
  // Optional: List of expected backlog refs to check coverage against
  expectedRefs: z.array(z.string().max(50)).max(500).optional(),
});

interface CoverageEntry {
  backlogRef: string;
  tickets: Array<{
    id: number;
    title: string;
    kind: string;
    status: string;
    sprintNumber: number | null;
  }>;
}

interface TraceabilityMatrix {
  covered: CoverageEntry[];
  uncovered: string[];
  stats: {
    totalRefs: number;
    coveredRefs: number;
    coveragePercent: number;
    ticketsWithRefs: number;
  };
  generatedAt: string;
}

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
  return Response.json(
    { data: null, error: { code, message, details } },
    { status }
  );
}

/**
 * Generate markdown table for the traceability matrix
 */
function generateMarkdownMatrix(matrix: TraceabilityMatrix, projectName: string): string {
  const lines: string[] = [];

  lines.push(`# Traceability Matrix - ${projectName}`);
  lines.push('');
  lines.push(`Generated: ${matrix.generatedAt}`);
  lines.push('');
  lines.push('## Coverage Summary');
  lines.push('');
  lines.push(`- **Total Requirements**: ${matrix.stats.totalRefs}`);
  lines.push(`- **Covered**: ${matrix.stats.coveredRefs} (${matrix.stats.coveragePercent.toFixed(1)}%)`);
  lines.push(`- **Uncovered**: ${matrix.uncovered.length}`);
  lines.push(`- **Tickets with Refs**: ${matrix.stats.ticketsWithRefs}`);
  lines.push('');

  if (matrix.covered.length > 0) {
    lines.push('## Covered Requirements');
    lines.push('');
    lines.push('| Requirement | Tickets | Status Summary |');
    lines.push('|-------------|---------|----------------|');

    for (const entry of matrix.covered) {
      const ticketLinks = entry.tickets
        .map((t) => `#${t.id} (${t.kind})`)
        .join(', ');
      const statusSummary = entry.tickets
        .reduce((acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      const statusStr = Object.entries(statusSummary)
        .map(([s, c]) => `${s}: ${c}`)
        .join(', ');

      lines.push(`| ${entry.backlogRef} | ${ticketLinks} | ${statusStr} |`);
    }
    lines.push('');
  }

  if (matrix.uncovered.length > 0) {
    lines.push('## Uncovered Requirements');
    lines.push('');
    lines.push('These requirements have no associated tickets:');
    lines.push('');
    for (const ref of matrix.uncovered) {
      lines.push(`- ${ref}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const data = GenerateRequestSchema.parse(payload);

    // Authenticate and get project
    const { projectId } = await getAuthorizedProjectId(request, data.projectId);

    // Get project name for the matrix title
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

    // Fetch all tickets with backlogRefs in the project
    const ticketsWithRefs = await prisma.ticket.findMany({
      where: {
        projectId,
        backlogRefs: { isEmpty: false },
      },
      select: {
        id: true,
        title: true,
        kind: true,
        status: true,
        sprintNumber: true,
        backlogRefs: true,
      },
    });

    // Build coverage map: backlogRef -> tickets
    const coverageMap = new Map<string, CoverageEntry['tickets']>();

    for (const ticket of ticketsWithRefs) {
      for (const ref of ticket.backlogRefs) {
        if (!coverageMap.has(ref)) {
          coverageMap.set(ref, []);
        }
        coverageMap.get(ref)!.push({
          id: ticket.id,
          title: ticket.title,
          kind: ticket.kind,
          status: ticket.status,
          sprintNumber: ticket.sprintNumber,
        });
      }
    }

    // Get all unique refs from the coverage map
    const allDiscoveredRefs = Array.from(coverageMap.keys());

    // If expectedRefs provided, use those as the total set
    // Otherwise, use discovered refs (only shows covered)
    const allRefs = data.expectedRefs && data.expectedRefs.length > 0
      ? [...new Set([...data.expectedRefs, ...allDiscoveredRefs])]
      : allDiscoveredRefs;

    // Build covered and uncovered lists
    const covered: CoverageEntry[] = [];
    const uncovered: string[] = [];

    for (const ref of allRefs.sort()) {
      const tickets = coverageMap.get(ref);
      if (tickets && tickets.length > 0) {
        covered.push({ backlogRef: ref, tickets });
      } else {
        uncovered.push(ref);
      }
    }

    const generatedAt = new Date().toISOString();

    const matrix: TraceabilityMatrix = {
      covered,
      uncovered,
      stats: {
        totalRefs: allRefs.length,
        coveredRefs: covered.length,
        coveragePercent: allRefs.length > 0 ? (covered.length / allRefs.length) * 100 : 0,
        ticketsWithRefs: ticketsWithRefs.length,
      },
      generatedAt,
    };

    // Generate markdown content for Knowledge Item
    const markdownContent = generateMarkdownMatrix(matrix, project.name);

    // Prepare knowledge item data
    const title = `Traceability Matrix - ${new Date().toISOString().split('T')[0]}`;
    const category = 'traceability';
    const tags = ['matrix', 'coverage', 'backlog', 'requirements'];

    // Generate embedding for semantic search
    const embeddingText = `${title}\n\n${markdownContent}`;
    const embeddingResult = await generateEmbedding(embeddingText);
    const embeddingVector = `[${embeddingResult.embedding.join(',')}]`;

    // Store as Knowledge Item using raw SQL (Prisma doesn't support vector type)
    const result = await prisma.$queryRaw<Array<{
      id: number;
      title: string;
      category: string;
      tags: string[];
      createdAt: Date;
    }>>`
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
        ${JSON.stringify({ matrix })}::jsonb,
        NOW(),
        NOW()
      )
      RETURNING id, title, category, tags, "createdAt"
    `;

    if (!result || result.length === 0) {
      return failure({
        code: 'CREATION_FAILED',
        message: 'Failed to create knowledge item',
        status: 500,
      });
    }

    const knowledgeItem = result[0];

    return success({
      matrix,
      knowledgeItem,
      message: `Traceability matrix generated with ${matrix.stats.coveragePercent.toFixed(1)}% coverage (${covered.length}/${allRefs.length} refs)`,
    }, 201);
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

    console.error('[API] POST /api/traceability/generate failed', error);
    return failure({ code: 'INTERNAL_ERROR', message: 'Failed to generate traceability matrix', status: 500 });
  }
}
