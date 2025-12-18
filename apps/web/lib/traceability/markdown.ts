/**
 * Markdown Generation for Traceability Matrix
 *
 * Generates a markdown representation of the traceability analysis
 * suitable for storage as a KnowledgeItem.
 */

import type { TraceabilityMatrix } from './analysis';
import type { DocumentSet } from './parsers';

// ============================================================================
// MARKDOWN GENERATOR
// ============================================================================

export interface MarkdownOptions {
  projectName: string;
  generatedAt: string;
  includeDetails?: boolean;
}

/**
 * Generate markdown content for the traceability matrix
 */
export function generateTraceabilityMarkdown(
  matrix: TraceabilityMatrix,
  docs: DocumentSet,
  options: MarkdownOptions
): string {
  const { projectName, generatedAt, includeDetails = true } = options;
  const lines: string[] = [];

  // Header
  lines.push(`# Document Traceability Matrix - ${projectName}`);
  lines.push('');
  lines.push(`**Generated:** ${generatedAt}`);
  lines.push(`**Analysis Type:** Document-Level Validation (PRD → SRS → Backlog → Project Plan)`);
  lines.push('');

  // Coverage Summary
  lines.push('## Coverage Summary');
  lines.push('');
  lines.push('| Metric | Coverage | Status |');
  lines.push('|--------|----------|--------|');
  lines.push(
    `| FR Coverage | ${matrix.coverage.frCoveragePercent}% (${matrix.details.coveredFRs}/${matrix.details.totalFRs}) | ${getStatusEmoji(matrix.coverage.frCoveragePercent, 100)} |`
  );
  lines.push(
    `| Backlog Mapped | ${matrix.coverage.backlogItemCoveragePercent}% (${matrix.details.coveredBacklogItems}/${matrix.details.totalBacklogItems}) | ${getStatusEmoji(matrix.coverage.backlogItemCoveragePercent, 80)} |`
  );
  lines.push(
    `| Sprint Scopes | ${matrix.coverage.planMappingCoveragePercent}% (${matrix.details.sprintsWithScope}/${matrix.details.totalSprints}) | ${getStatusEmoji(matrix.coverage.planMappingCoveragePercent, 100)} |`
  );
  lines.push('');

  // NFR Summary
  lines.push('## NFR Summary (Informational)');
  lines.push('');
  lines.push(`- **Total NFRs:** ${matrix.nfrSummary.total}`);
  lines.push(`- **Referenced:** ${matrix.nfrSummary.referenced}`);
  if (matrix.nfrSummary.unreferenced.length > 0) {
    lines.push(`- **Unreferenced:** ${matrix.nfrSummary.unreferenced.join(', ')}`);
  }
  lines.push('');

  // Gaps Section
  if (hasGaps(matrix)) {
    lines.push('## Gaps Identified');
    lines.push('');

    if (matrix.gaps.missingFrRefsInBacklog.length > 0) {
      lines.push('### FRs Not Covered by Backlog Items');
      lines.push('');
      lines.push('These functional requirements are not referenced by any backlog item:');
      lines.push('');
      for (const fr of matrix.gaps.missingFrRefsInBacklog) {
        lines.push(`- ${fr}`);
      }
      lines.push('');
    }

    if (matrix.gaps.missingBacklogInPlan.length > 0) {
      lines.push('### Backlog Items Not in Sprint Plan');
      lines.push('');
      lines.push('These backlog items are not assigned to any sprint:');
      lines.push('');
      for (const item of matrix.gaps.missingBacklogInPlan) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }

    if (matrix.gaps.orphanedBacklogItems.length > 0) {
      lines.push('### Orphaned Backlog Items (No FR Traces)');
      lines.push('');
      lines.push('These backlog items do not trace to any functional requirement:');
      lines.push('');
      for (const item of matrix.gaps.orphanedBacklogItems) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }

    if (matrix.gaps.invalidPrdRefs.length > 0) {
      lines.push('### Invalid PRD References');
      lines.push('');
      lines.push('These requirements reference non-existent PRD sections:');
      lines.push('');
      lines.push('| Requirement | Invalid Reference |');
      lines.push('|-------------|-------------------|');
      for (const ref of matrix.gaps.invalidPrdRefs) {
        lines.push(`| ${ref.requirementId} | PRD Section ${ref.invalidRef} |`);
      }
      lines.push('');
    }
  } else {
    lines.push('## Validation Status');
    lines.push('');
    lines.push('✅ **All traceability checks passed!**');
    lines.push('');
  }

  // Detailed Breakdown (optional)
  if (includeDetails && docs.srs && docs.backlog) {
    lines.push('## Detailed Traceability');
    lines.push('');

    // FR → Backlog mapping
    lines.push('### FR to Backlog Item Mapping');
    lines.push('');
    lines.push('| FR | Backlog Items |');
    lines.push('|----|---------------|');

    const frToBacklog = new Map<string, string[]>();

    // Initialize all FRs
    for (const fr of docs.srs.functionalRequirements) {
      frToBacklog.set(fr.id, []);
    }

    // Map backlog items to FRs
    if (docs.backlog) {
      for (const item of docs.backlog.items) {
        for (const fr of item.frTraces) {
          const items = frToBacklog.get(fr) || [];
          items.push(item.id);
          frToBacklog.set(fr, items);
        }
      }
    }

    for (const [fr, items] of frToBacklog) {
      const itemList = items.length > 0 ? items.join(', ') : '*(none)*';
      lines.push(`| ${fr} | ${itemList} |`);
    }
    lines.push('');

    // Sprint Scope Summary
    if (docs.projectPlan && docs.projectPlan.sprints.length > 0) {
      lines.push('### Sprint Scope Summary');
      lines.push('');

      for (const sprint of docs.projectPlan.sprints) {
        lines.push(`**Sprint ${sprint.sprintNumber}:** ${sprint.title || 'Untitled'}`);
        if (sprint.backlogItems.length > 0) {
          lines.push(`- Backlog Items: ${sprint.backlogItems.join(', ')}`);
        } else {
          lines.push('- *No scope section found*');
        }
        lines.push('');
      }
    }
  }

  // Metadata
  lines.push('---');
  lines.push('');
  lines.push('*This matrix validates document-level traceability between Session 2 planning documents.*');
  lines.push('*For ticket-level traceability, use `projectpulse_traceability_generate`.*');

  return lines.join('\n');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusEmoji(value: number, threshold: number): string {
  if (value >= threshold) return '✅';
  if (value >= threshold * 0.8) return '⚠️';
  return '❌';
}

function hasGaps(matrix: TraceabilityMatrix): boolean {
  return (
    matrix.gaps.missingFrRefsInBacklog.length > 0 ||
    matrix.gaps.missingBacklogInPlan.length > 0 ||
    matrix.gaps.orphanedBacklogItems.length > 0 ||
    matrix.gaps.invalidPrdRefs.length > 0
  );
}

/**
 * Generate a concise summary for MCP tool response
 */
export function generateConciseSummary(matrix: TraceabilityMatrix): string {
  const lines: string[] = [];

  lines.push('Document Traceability Validation Results:');
  lines.push('');
  lines.push(`FR Coverage: ${matrix.coverage.frCoveragePercent}%`);
  lines.push(`Backlog Mapped: ${matrix.coverage.backlogItemCoveragePercent}%`);
  lines.push(`Sprint Scopes: ${matrix.coverage.planMappingCoveragePercent}%`);

  const totalGaps =
    matrix.gaps.missingFrRefsInBacklog.length +
    matrix.gaps.missingBacklogInPlan.length +
    matrix.gaps.orphanedBacklogItems.length +
    matrix.gaps.invalidPrdRefs.length;

  if (totalGaps > 0) {
    lines.push('');
    lines.push(`Gaps Found: ${totalGaps}`);
    if (matrix.gaps.missingFrRefsInBacklog.length > 0) {
      lines.push(`- Uncovered FRs: ${matrix.gaps.missingFrRefsInBacklog.slice(0, 5).join(', ')}${matrix.gaps.missingFrRefsInBacklog.length > 5 ? '...' : ''}`);
    }
    if (matrix.gaps.missingBacklogInPlan.length > 0) {
      lines.push(`- Unmapped Backlog: ${matrix.gaps.missingBacklogInPlan.slice(0, 5).join(', ')}${matrix.gaps.missingBacklogInPlan.length > 5 ? '...' : ''}`);
    }
  } else {
    lines.push('');
    lines.push('✅ All traceability checks passed!');
  }

  return lines.join('\n');
}
