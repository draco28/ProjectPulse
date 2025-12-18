/**
 * MCP Tool: Document Traceability Validation
 *
 * Validates traceability across Session 2 generated documents:
 * PRD → SRS → Backlog → Project Plan
 *
 * Stores results as a Knowledge Item for future retrieval.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
}

interface CoverageMetrics {
  frCoveragePercent: number;
  backlogItemCoveragePercent: number;
  planMappingCoveragePercent: number;
}

interface NFRSummary {
  total: number;
  referenced: number;
  unreferenced: string[];
}

interface TraceabilityGaps {
  missingFrRefsInBacklog: string[];
  missingBacklogInPlan: string[];
  invalidPrdRefs: Array<{
    requirementId: string;
    invalidRef: string;
  }>;
  orphanedBacklogItems: string[];
  backlogWithoutSprint: string[];
}

interface TraceabilityDetails {
  totalFRs: number;
  coveredFRs: number;
  totalBacklogItems: number;
  coveredBacklogItems: number;
  totalSprints: number;
  sprintsWithScope: number;
}

interface ValidateResponse {
  coverage: CoverageMetrics;
  nfrSummary: NFRSummary;
  gaps: TraceabilityGaps;
  details: TraceabilityDetails;
  knowledgeItemId: number;
  generatedAt: string;
  message: string;
}

const validateSchema = z.object({
  force: z
    .boolean()
    .optional()
    .default(false)
    .describe('Re-validate even if recent result exists'),
  strict: z
    .boolean()
    .optional()
    .default(true)
    .describe('Require 100% FR coverage (default: true)'),
  strictNfr: z
    .boolean()
    .optional()
    .default(false)
    .describe('Require all NFRs to be referenced (default: false)'),
});

type ValidateInput = z.infer<typeof validateSchema>;

function buildErrorPayload(message: string, code = 'ERROR', details?: unknown) {
  return JSON.stringify(
    { status: 'error', error: { code, message, details } },
    null,
    2
  );
}

async function handler(input: ValidateInput, context: ToolContext): Promise<string> {
  const { httpClient, logger } = context;

  try {
    const response = await httpClient.post<ApiResponse<ValidateResponse>>(
      '/api/traceability/validate-documents',
      {
        force: input.force,
        strict: input.strict,
        strictNfr: input.strictNfr,
      }
    );

    if (!response.data) {
      return buildErrorPayload(
        response.error?.message ?? 'Failed to validate document traceability',
        response.error?.code,
        response.error?.details
      );
    }

    const { coverage, nfrSummary, gaps, details, knowledgeItemId, generatedAt } = response.data;

    logger.info('[traceability.validateDocuments] Validation complete', {
      frCoverage: coverage.frCoveragePercent,
      backlogCoverage: coverage.backlogItemCoveragePercent,
      knowledgeItemId,
    });

    // Calculate total gaps
    const totalGaps =
      gaps.missingFrRefsInBacklog.length +
      gaps.missingBacklogInPlan.length +
      gaps.orphanedBacklogItems.length +
      gaps.invalidPrdRefs.length;

    // Build concise response for agent
    return JSON.stringify({
      success: true,
      summary: {
        frCoveragePercent: coverage.frCoveragePercent,
        backlogCoveragePercent: coverage.backlogItemCoveragePercent,
        planMappingPercent: coverage.planMappingCoveragePercent,
        totalFRs: details.totalFRs,
        coveredFRs: details.coveredFRs,
        totalBacklogItems: details.totalBacklogItems,
        totalSprints: details.totalSprints,
        totalGaps,
        generatedAt,
      },
      nfrSummary: {
        total: nfrSummary.total,
        referenced: nfrSummary.referenced,
        unreferencedCount: nfrSummary.unreferenced.length,
      },
      gaps: {
        uncoveredFRs: gaps.missingFrRefsInBacklog.slice(0, 10),
        uncoveredFRsTotal: gaps.missingFrRefsInBacklog.length,
        unmappedBacklog: gaps.missingBacklogInPlan.slice(0, 10),
        unmappedBacklogTotal: gaps.missingBacklogInPlan.length,
        orphanedBacklog: gaps.orphanedBacklogItems.slice(0, 10),
        orphanedBacklogTotal: gaps.orphanedBacklogItems.length,
        invalidPrdRefsTotal: gaps.invalidPrdRefs.length,
        invalidPrdRefs: gaps.invalidPrdRefs.slice(0, 5),
      },
      knowledgeItem: {
        id: knowledgeItemId,
        retrievalTip: 'Use projectpulse_knowledge_search with category=traceability to retrieve full matrix',
      },
      actionItems: generateActionItems(gaps, coverage),
    }, null, 2);
  } catch (error) {
    logger.error('[traceability.validateDocuments] Unexpected error', { error });
    return buildErrorPayload(
      error instanceof Error ? error.message : 'Unexpected error'
    );
  }
}

function generateActionItems(
  gaps: TraceabilityGaps,
  coverage: CoverageMetrics
): string[] {
  const items: string[] = [];

  if (coverage.frCoveragePercent < 100) {
    items.push(
      `Create backlog items for ${gaps.missingFrRefsInBacklog.length} uncovered FRs`
    );
  }

  if (gaps.orphanedBacklogItems.length > 0) {
    items.push(
      `Add FR traces to ${gaps.orphanedBacklogItems.length} orphaned backlog items`
    );
  }

  if (gaps.missingBacklogInPlan.length > 0) {
    items.push(
      `Assign ${gaps.missingBacklogInPlan.length} backlog items to sprints in project plan`
    );
  }

  if (gaps.invalidPrdRefs.length > 0) {
    items.push(
      `Fix ${gaps.invalidPrdRefs.length} invalid PRD section references in SRS`
    );
  }

  if (items.length === 0) {
    items.push('All traceability checks passed - ready for roadmap materialization');
  }

  return items;
}

export const traceabilityValidateDocumentsTool: ToolDefinition = {
  name: 'projectpulse_traceability_validate_documents',
  description: `[ACTION] Validate document-level traceability across Session 2 planning documents.

Cross-references PRD → SRS → Backlog → Project Plan to ensure:
1. All FRs are covered by backlog items
2. All backlog items are assigned to sprints
3. Sprint scopes reference backlog items
4. SRS requirements trace to valid PRD sections

WHEN TO USE:
- After completing onboarding Session 2 (before Session 3)
- Before materializing roadmap to verify planning completeness
- When auditing document quality
- Before starting sprint execution

INPUT:
- force (optional): Re-validate even if recent result exists
- strict (optional): Require 100% FR coverage (default: true)
- strictNfr (optional): Require all NFRs referenced (default: false)

OUTPUT:
- Coverage percentages (FR, Backlog, Plan)
- Gap analysis (uncovered FRs, unmapped backlog, invalid refs)
- Knowledge Item ID for full matrix retrieval
- Action items to fix gaps

PREREQUISITES:
- Session 2 must be complete with all 4 planning documents:
  - 01-PRD.md (Product Requirements)
  - 02-SRS.md (Software Requirements Specification)
  - 12-Backlog.md (Product Backlog)
  - 13-Project-Plan.md (Project Plan)

Related:
→ projectpulse_traceability_generate - Validate ticket backlogRefs (post-materialization)
→ projectpulse_knowledge_search - Retrieve full matrix details
→ projectpulse_roadmap_materialize - Create roadmap after validation passes`,
  schema: validateSchema,
  inputSchema: {
    type: 'object',
    properties: {
      force: {
        type: 'boolean',
        description: 'Re-validate even if recent result exists (default: false)',
      },
      strict: {
        type: 'boolean',
        description: 'Require 100% FR coverage (default: true)',
      },
      strictNfr: {
        type: 'boolean',
        description: 'Require all NFRs to be referenced (default: false)',
      },
    },
  },
  execute: async (params: unknown, context: ToolContext) => {
    const parsed = validateSchema.parse(params ?? {});
    const result = await handler(parsed, context);
    return { content: [{ type: 'text', text: result }] };
  },
};
