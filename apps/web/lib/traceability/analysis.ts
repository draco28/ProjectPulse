/**
 * Traceability Analysis Engine
 *
 * Cross-references parsed documents to calculate coverage metrics:
 * - FR coverage: % of FRs referenced by backlog items
 * - Backlog coverage: % of backlog items assigned to sprints in project plan
 * - Plan mapping: % of sprint scopes that reference backlog items
 *
 * Identifies gaps:
 * - FRs not covered by any backlog item
 * - Backlog items not in any sprint scope
 * - Invalid PRD references in SRS
 */

import type {
  DocumentSet,
  ParsedPRD,
  ParsedSRS,
  ParsedBacklog,
  ParsedProjectPlan,
  SRSRequirement,
  BacklogItem,
  SprintScope,
} from './parsers';

// ============================================================================
// TYPES
// ============================================================================

export interface CoverageMetrics {
  frCoveragePercent: number;
  backlogItemCoveragePercent: number;
  planMappingCoveragePercent: number;
}

export interface NFRSummary {
  total: number;
  referenced: number;
  unreferenced: string[];
}

export interface TraceabilityGaps {
  missingFrRefsInBacklog: string[];
  missingBacklogInPlan: string[];
  invalidPrdRefs: Array<{
    requirementId: string;
    invalidRef: string;
  }>;
  orphanedBacklogItems: string[];
  backlogWithoutSprint: string[];
}

export interface TraceabilityMatrix {
  coverage: CoverageMetrics;
  nfrSummary: NFRSummary;
  gaps: TraceabilityGaps;
  details: {
    totalFRs: number;
    coveredFRs: number;
    totalBacklogItems: number;
    coveredBacklogItems: number;
    totalSprints: number;
    sprintsWithScope: number;
  };
}

export interface AnalysisOptions {
  strict?: boolean;
  strictNfr?: boolean;
}

// ============================================================================
// ANALYSIS ENGINE
// ============================================================================

/**
 * Analyze document set for traceability coverage
 */
export function analyzeTraceability(
  docs: DocumentSet,
  options: AnalysisOptions = {}
): TraceabilityMatrix {
  const { strict = true, strictNfr = false } = options;

  // Get all requirement IDs from SRS
  const allFRs = docs.srs?.functionalRequirements.map((fr) => fr.id) || [];
  const allNFRs = docs.srs?.nonFunctionalRequirements.map((nfr) => nfr.id) || [];

  // Get all backlog items
  const allBacklogItems = docs.backlog?.items || [];
  const allBacklogItemIds = allBacklogItems.map((item) => item.id);

  // Get all PRD sections
  const allPRDSections = docs.prd?.sections.map((s) => s.number) || [];

  // Get all sprint scopes
  const allSprints = docs.projectPlan?.sprints || [];

  // =========================================================================
  // 1. FR Coverage Analysis
  // =========================================================================

  // Find which FRs are referenced by backlog items
  const coveredFRs = new Set<string>();
  for (const item of allBacklogItems) {
    for (const fr of item.frTraces) {
      coveredFRs.add(fr);
    }
  }

  const missingFRs = allFRs.filter((fr) => !coveredFRs.has(fr));
  const frCoveragePercent = allFRs.length > 0 ? (coveredFRs.size / allFRs.length) * 100 : 100;

  // =========================================================================
  // 2. NFR Analysis
  // =========================================================================

  const referencedNFRs = new Set<string>();
  for (const item of allBacklogItems) {
    for (const nfr of item.nfrTraces) {
      referencedNFRs.add(nfr);
    }
  }

  const unreferencedNFRs = allNFRs.filter((nfr) => !referencedNFRs.has(nfr));

  const nfrSummary: NFRSummary = {
    total: allNFRs.length,
    referenced: referencedNFRs.size,
    unreferenced: unreferencedNFRs,
  };

  // =========================================================================
  // 3. Backlog → Sprint Plan Mapping
  // =========================================================================

  // Collect all backlog item IDs referenced in any sprint scope
  const backlogInPlan = new Set<string>();
  for (const sprint of allSprints) {
    for (const itemId of sprint.backlogItems) {
      backlogInPlan.add(itemId);
    }
  }

  // Check which backlog items have sprint assignment (from backlog doc)
  const backlogWithSprint = allBacklogItems.filter((item) => item.sprintNumber !== null);

  // Backlog items that are neither in plan scope nor have sprint assigned
  const missingBacklogInPlan = allBacklogItemIds.filter(
    (id) =>
      !backlogInPlan.has(id) &&
      !allBacklogItems.find((item) => item.id === id && item.sprintNumber !== null)
  );

  // Backlog items without any sprint assignment
  const backlogWithoutSprint = allBacklogItems
    .filter((item) => item.sprintNumber === null && !backlogInPlan.has(item.id))
    .map((item) => item.id);

  // Coverage: % of backlog items that are mapped to a sprint (either via scope or assignment)
  const mappedBacklogItems = new Set([
    ...backlogInPlan,
    ...backlogWithSprint.map((item) => item.id),
  ]);

  const backlogCoveragePercent =
    allBacklogItemIds.length > 0 ? (mappedBacklogItems.size / allBacklogItemIds.length) * 100 : 100;

  // =========================================================================
  // 4. Sprint Scope Quality
  // =========================================================================

  // % of sprints that have scope sections
  const sprintsWithScope = allSprints.filter((sprint) => sprint.backlogItems.length > 0).length;

  const planMappingCoveragePercent =
    allSprints.length > 0 ? (sprintsWithScope / allSprints.length) * 100 : 100;

  // =========================================================================
  // 5. PRD Reference Validation
  // =========================================================================

  const invalidPrdRefs: Array<{ requirementId: string; invalidRef: string }> = [];

  if (docs.srs && docs.prd) {
    const allRequirements = [
      ...docs.srs.functionalRequirements,
      ...docs.srs.nonFunctionalRequirements,
    ];

    for (const req of allRequirements) {
      for (const prdRef of req.prdTraces) {
        // Check if this PRD section exists (partial match - 2.3 should match 2.3.1)
        const refExists = allPRDSections.some(
          (section) => section === prdRef || section.startsWith(`${prdRef}.`)
        );

        if (!refExists) {
          invalidPrdRefs.push({
            requirementId: req.id,
            invalidRef: prdRef,
          });
        }
      }
    }
  }

  // =========================================================================
  // 6. Orphaned Backlog Items (no FR traces)
  // =========================================================================

  const orphanedBacklogItems = allBacklogItems
    .filter((item) => item.frTraces.length === 0)
    .map((item) => item.id);

  // =========================================================================
  // Build Result
  // =========================================================================

  return {
    coverage: {
      frCoveragePercent: Math.round(frCoveragePercent * 10) / 10,
      backlogItemCoveragePercent: Math.round(backlogCoveragePercent * 10) / 10,
      planMappingCoveragePercent: Math.round(planMappingCoveragePercent * 10) / 10,
    },
    nfrSummary,
    gaps: {
      missingFrRefsInBacklog: missingFRs,
      missingBacklogInPlan,
      invalidPrdRefs,
      orphanedBacklogItems,
      backlogWithoutSprint,
    },
    details: {
      totalFRs: allFRs.length,
      coveredFRs: coveredFRs.size,
      totalBacklogItems: allBacklogItemIds.length,
      coveredBacklogItems: mappedBacklogItems.size,
      totalSprints: allSprints.length,
      sprintsWithScope: sprintsWithScope,
    },
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if traceability validation passes based on options
 */
export function isValidationPassing(
  matrix: TraceabilityMatrix,
  options: AnalysisOptions = {}
): boolean {
  const { strict = true, strictNfr = false } = options;

  // In strict mode, require 100% FR coverage
  if (strict && matrix.coverage.frCoveragePercent < 100) {
    return false;
  }

  // In strictNfr mode, require all NFRs to be referenced
  if (strictNfr && matrix.nfrSummary.unreferenced.length > 0) {
    return false;
  }

  // Always fail if there are invalid PRD references
  if (matrix.gaps.invalidPrdRefs.length > 0) {
    return false;
  }

  return true;
}

/**
 * Generate validation summary message
 */
export function getValidationSummary(
  matrix: TraceabilityMatrix,
  options: AnalysisOptions = {}
): string {
  const { strict = true, strictNfr = false } = options;
  const lines: string[] = [];

  // FR Coverage
  if (matrix.coverage.frCoveragePercent === 100) {
    lines.push(
      `✅ FR Coverage: ${matrix.coverage.frCoveragePercent}% (${matrix.details.coveredFRs}/${matrix.details.totalFRs})`
    );
  } else if (strict) {
    lines.push(
      `❌ FR Coverage: ${matrix.coverage.frCoveragePercent}% (${matrix.details.coveredFRs}/${matrix.details.totalFRs}) - ${matrix.gaps.missingFrRefsInBacklog.length} uncovered`
    );
  } else {
    lines.push(
      `⚠️ FR Coverage: ${matrix.coverage.frCoveragePercent}% (${matrix.details.coveredFRs}/${matrix.details.totalFRs})`
    );
  }

  // Backlog Coverage
  if (matrix.coverage.backlogItemCoveragePercent === 100) {
    lines.push(
      `✅ Backlog Mapped: ${matrix.coverage.backlogItemCoveragePercent}% (${matrix.details.coveredBacklogItems}/${matrix.details.totalBacklogItems})`
    );
  } else {
    lines.push(
      `⚠️ Backlog Mapped: ${matrix.coverage.backlogItemCoveragePercent}% (${matrix.details.coveredBacklogItems}/${matrix.details.totalBacklogItems})`
    );
  }

  // Plan Scopes
  if (matrix.coverage.planMappingCoveragePercent === 100) {
    lines.push(
      `✅ Sprint Scopes: ${matrix.coverage.planMappingCoveragePercent}% (${matrix.details.sprintsWithScope}/${matrix.details.totalSprints})`
    );
  } else {
    lines.push(
      `⚠️ Sprint Scopes: ${matrix.coverage.planMappingCoveragePercent}% (${matrix.details.sprintsWithScope}/${matrix.details.totalSprints})`
    );
  }

  // NFR Summary
  if (strictNfr && matrix.nfrSummary.unreferenced.length > 0) {
    lines.push(`❌ NFRs: ${matrix.nfrSummary.referenced}/${matrix.nfrSummary.total} referenced`);
  } else {
    lines.push(
      `ℹ️ NFRs: ${matrix.nfrSummary.referenced}/${matrix.nfrSummary.total} referenced (informational)`
    );
  }

  // Invalid PRD refs
  if (matrix.gaps.invalidPrdRefs.length > 0) {
    lines.push(`❌ Invalid PRD References: ${matrix.gaps.invalidPrdRefs.length}`);
  }

  return lines.join('\n');
}

// ============================================================================
// COVERAGE THRESHOLD HELPERS
// ============================================================================

export interface CoverageThresholds {
  minFrCoverage: number;
  minBacklogCoverage: number;
  minPlanMapping: number;
  maxOrphanedBacklog: number;
}

export const DEFAULT_THRESHOLDS: CoverageThresholds = {
  minFrCoverage: 100,
  minBacklogCoverage: 80,
  minPlanMapping: 100,
  maxOrphanedBacklog: 0,
};

/**
 * Check if matrix meets custom thresholds
 */
export function meetsThresholds(
  matrix: TraceabilityMatrix,
  thresholds: Partial<CoverageThresholds> = {}
): { passes: boolean; violations: string[] } {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const violations: string[] = [];

  if (matrix.coverage.frCoveragePercent < t.minFrCoverage) {
    violations.push(
      `FR coverage ${matrix.coverage.frCoveragePercent}% < ${t.minFrCoverage}% threshold`
    );
  }

  if (matrix.coverage.backlogItemCoveragePercent < t.minBacklogCoverage) {
    violations.push(
      `Backlog coverage ${matrix.coverage.backlogItemCoveragePercent}% < ${t.minBacklogCoverage}% threshold`
    );
  }

  if (matrix.coverage.planMappingCoveragePercent < t.minPlanMapping) {
    violations.push(
      `Plan mapping ${matrix.coverage.planMappingCoveragePercent}% < ${t.minPlanMapping}% threshold`
    );
  }

  if (matrix.gaps.orphanedBacklogItems.length > t.maxOrphanedBacklog) {
    violations.push(
      `${matrix.gaps.orphanedBacklogItems.length} orphaned backlog items > ${t.maxOrphanedBacklog} threshold`
    );
  }

  return {
    passes: violations.length === 0,
    violations,
  };
}
