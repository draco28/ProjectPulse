/**
 * MCP Tool: Traceability Matrix Generation (Sprint 13)
 *
 * Generate a traceability matrix from backlogRefs across all tickets
 * and store it as a Knowledge Item for future retrieval.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

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

interface KnowledgeItemSummary {
  id: number;
  title: string;
  category: string;
  tags: string[];
  createdAt: string;
}

interface GenerateResponse {
  matrix: TraceabilityMatrix;
  knowledgeItem: KnowledgeItemSummary;
  message: string;
}

const generateSchema = z.object({
  expectedRefs: z
    .array(z.string().max(50))
    .max(500)
    .optional()
    .describe('Optional list of expected backlog refs to check coverage against'),
});

type GenerateInput = z.infer<typeof generateSchema>;

function buildErrorPayload(message: string, code = 'ERROR') {
  return JSON.stringify({ status: 'error', error: { code, message } }, null, 2);
}

async function handler(input: GenerateInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;

  try {
    const response = await httpClient.post<ApiResponse<GenerateResponse>>(
      '/api/traceability/generate',
      { expectedRefs: input.expectedRefs }
    );

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to generate traceability matrix',
        response.error?.code
      );
    }

    const { matrix, knowledgeItem } = response.data;

    logger.info('[traceability.generate] Matrix generated', {
      totalRefs: matrix.stats.totalRefs,
      coverage: matrix.stats.coveragePercent,
      knowledgeItemId: knowledgeItem.id,
    });

    // Return a concise summary suitable for agent consumption
    return JSON.stringify({
      success: true,
      summary: {
        totalRequirements: matrix.stats.totalRefs,
        coveredRequirements: matrix.stats.coveredRefs,
        uncoveredRequirements: matrix.uncovered.length,
        coveragePercent: Number(matrix.stats.coveragePercent.toFixed(1)),
        ticketsWithRefs: matrix.stats.ticketsWithRefs,
        generatedAt: matrix.generatedAt,
      },
      knowledgeItem: {
        id: knowledgeItem.id,
        title: knowledgeItem.title,
        category: knowledgeItem.category,
        tags: knowledgeItem.tags,
      },
      // Include uncovered list for quick action
      uncoveredRefs: matrix.uncovered.slice(0, 20), // Limit to prevent response bloat
      uncoveredTotal: matrix.uncovered.length,
      // Include top covered refs with ticket counts
      topCovered: matrix.covered
        .sort((a, b) => b.tickets.length - a.tickets.length)
        .slice(0, 10)
        .map((c) => ({
          ref: c.backlogRef,
          ticketCount: c.tickets.length,
          statuses: c.tickets.reduce((acc, t) => {
            acc[t.status] = (acc[t.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        })),
    }, null, 2);
  } catch (error) {
    logger.error('[traceability.generate] Unexpected error', { error });
    return buildErrorPayload(error instanceof Error ? error.message : 'Unexpected error');
  }
}

export const traceabilityGenerateTool: ToolDefinition = {
  name: 'projectpulse_traceability_generate',
  description: `[ACTION] Generate a traceability matrix from ticket backlogRefs.

Scans all tickets in the project, extracts backlogRefs (e.g., "FR-001", "NFR-003"),
and generates a coverage matrix showing which requirements have tickets.

The matrix is automatically stored as a Knowledge Item for future retrieval.

WHEN TO USE:
- After completing onboarding Session 3 to verify coverage
- When planning a new sprint to identify gaps
- When auditing requirement coverage
- Before release to ensure all requirements are addressed

INPUT:
- expectedRefs (optional): List of all expected requirement IDs
  If provided, shows which are uncovered
  If not provided, only shows discovered refs from tickets

OUTPUT:
- Coverage summary with percentages
- Knowledge Item ID for full matrix retrieval
- List of uncovered requirements (for action)
- Top covered requirements with ticket counts

Related:
→ projectpulse_knowledge_search - Retrieve full matrix later
→ projectpulse_ticket_create - Create tickets for uncovered refs
→ projectpulse_ticket_search - Find tickets by backlogRefs (search text)`,
  schema: generateSchema,
  inputSchema: {
    type: 'object',
    properties: {
      expectedRefs: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional list of expected backlog refs (e.g., ["FR-001", "FR-002", "NFR-001"]). If provided, shows uncovered refs.',
      },
    },
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = generateSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
