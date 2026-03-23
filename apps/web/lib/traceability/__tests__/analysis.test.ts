/**
 * Tests for Traceability Analysis Engine
 */

import { analyzeTraceability, isValidationPassing, meetsThresholds } from '../analysis';
import type { DocumentSet } from '../parsers';

describe('Traceability Analysis', () => {
  describe('analyzeTraceability', () => {
    it('calculates 100% FR coverage when all FRs are traced', () => {
      const docs: DocumentSet = {
        prd: {
          sections: [{ number: '2.1', title: 'Feature', level: 2 }],
          rawContent: '',
        },
        srs: {
          functionalRequirements: [
            { id: 'FR-001', type: 'FR', title: 'Test', prdTraces: ['2.1'], rawBlock: '' },
            { id: 'FR-002', type: 'FR', title: 'Test2', prdTraces: ['2.1'], rawBlock: '' },
          ],
          nonFunctionalRequirements: [],
          rawContent: '',
        },
        backlog: {
          epics: [],
          items: [
            {
              id: 'US-001',
              title: 'Story',
              epicId: null,
              frTraces: ['FR-001', 'FR-002'],
              nfrTraces: [],
              sprintNumber: 1,
              rawBlock: '',
            },
          ],
          rawContent: '',
        },
        projectPlan: {
          sprints: [
            {
              sprintNumber: 1,
              title: 'Sprint 1',
              backlogItems: ['US-001'],
              frRefs: [],
              nfrRefs: [],
              rawBlock: '',
            },
          ],
          rawContent: '',
        },
      };

      const result = analyzeTraceability(docs);

      expect(result.coverage.frCoveragePercent).toBe(100);
      expect(result.gaps.missingFrRefsInBacklog).toEqual([]);
    });

    it('identifies uncovered FRs', () => {
      const docs: DocumentSet = {
        prd: {
          sections: [{ number: '2.1', title: 'Feature', level: 2 }],
          rawContent: '',
        },
        srs: {
          functionalRequirements: [
            { id: 'FR-001', type: 'FR', title: 'Test', prdTraces: ['2.1'], rawBlock: '' },
            { id: 'FR-002', type: 'FR', title: 'Test2', prdTraces: ['2.1'], rawBlock: '' },
            { id: 'FR-003', type: 'FR', title: 'Test3', prdTraces: ['2.1'], rawBlock: '' },
          ],
          nonFunctionalRequirements: [],
          rawContent: '',
        },
        backlog: {
          epics: [],
          items: [
            {
              id: 'US-001',
              title: 'Story',
              epicId: null,
              frTraces: ['FR-001'],
              nfrTraces: [],
              sprintNumber: 1,
              rawBlock: '',
            },
          ],
          rawContent: '',
        },
        projectPlan: {
          sprints: [],
          rawContent: '',
        },
      };

      const result = analyzeTraceability(docs);

      expect(result.coverage.frCoveragePercent).toBeCloseTo(33.3, 0);
      expect(result.gaps.missingFrRefsInBacklog).toContain('FR-002');
      expect(result.gaps.missingFrRefsInBacklog).toContain('FR-003');
    });

    it('calculates backlog coverage based on sprint assignment', () => {
      const docs: DocumentSet = {
        prd: null,
        srs: null,
        backlog: {
          epics: [],
          items: [
            {
              id: 'US-001',
              title: 'Story1',
              epicId: null,
              frTraces: [],
              nfrTraces: [],
              sprintNumber: 1,
              rawBlock: '',
            },
            {
              id: 'US-002',
              title: 'Story2',
              epicId: null,
              frTraces: [],
              nfrTraces: [],
              sprintNumber: null,
              rawBlock: '',
            },
            {
              id: 'US-003',
              title: 'Story3',
              epicId: null,
              frTraces: [],
              nfrTraces: [],
              sprintNumber: null,
              rawBlock: '',
            },
          ],
          rawContent: '',
        },
        projectPlan: {
          sprints: [
            {
              sprintNumber: 1,
              title: 'Sprint 1',
              backlogItems: ['US-001', 'US-003'],
              frRefs: [],
              nfrRefs: [],
              rawBlock: '',
            },
          ],
          rawContent: '',
        },
      };

      const result = analyzeTraceability(docs);

      // US-001 has sprintNumber=1, US-003 is in plan scope
      // US-002 is neither assigned nor in scope
      expect(result.coverage.backlogItemCoveragePercent).toBeCloseTo(66.7, 0);
      expect(result.gaps.missingBacklogInPlan).toContain('US-002');
    });

    it('identifies orphaned backlog items without FR traces', () => {
      const docs: DocumentSet = {
        prd: null,
        srs: {
          functionalRequirements: [
            { id: 'FR-001', type: 'FR', title: 'Test', prdTraces: [], rawBlock: '' },
          ],
          nonFunctionalRequirements: [],
          rawContent: '',
        },
        backlog: {
          epics: [],
          items: [
            {
              id: 'US-001',
              title: 'Story1',
              epicId: null,
              frTraces: ['FR-001'],
              nfrTraces: [],
              sprintNumber: 1,
              rawBlock: '',
            },
            {
              id: 'US-002',
              title: 'Orphan',
              epicId: null,
              frTraces: [],
              nfrTraces: [],
              sprintNumber: 1,
              rawBlock: '',
            },
          ],
          rawContent: '',
        },
        projectPlan: null,
      };

      const result = analyzeTraceability(docs);

      expect(result.gaps.orphanedBacklogItems).toContain('US-002');
      expect(result.gaps.orphanedBacklogItems).not.toContain('US-001');
    });

    it('identifies invalid PRD references', () => {
      const docs: DocumentSet = {
        prd: {
          sections: [
            { number: '2.1', title: 'Feature A', level: 2 },
            { number: '2.2', title: 'Feature B', level: 2 },
          ],
          rawContent: '',
        },
        srs: {
          functionalRequirements: [
            { id: 'FR-001', type: 'FR', title: 'Test', prdTraces: ['2.1'], rawBlock: '' },
            { id: 'FR-002', type: 'FR', title: 'Test', prdTraces: ['9.9'], rawBlock: '' }, // Invalid!
          ],
          nonFunctionalRequirements: [],
          rawContent: '',
        },
        backlog: null,
        projectPlan: null,
      };

      const result = analyzeTraceability(docs);

      expect(result.gaps.invalidPrdRefs).toHaveLength(1);
      expect(result.gaps.invalidPrdRefs[0]).toEqual({
        requirementId: 'FR-002',
        invalidRef: '9.9',
      });
    });

    it('tracks NFR summary correctly', () => {
      const docs: DocumentSet = {
        prd: null,
        srs: {
          functionalRequirements: [],
          nonFunctionalRequirements: [
            { id: 'NFR-001', type: 'NFR', title: 'Perf', prdTraces: [], rawBlock: '' },
            { id: 'NFR-002', type: 'NFR', title: 'Sec', prdTraces: [], rawBlock: '' },
            { id: 'NFR-003', type: 'NFR', title: 'A11y', prdTraces: [], rawBlock: '' },
          ],
          rawContent: '',
        },
        backlog: {
          epics: [],
          items: [
            {
              id: 'US-001',
              title: 'Story',
              epicId: null,
              frTraces: [],
              nfrTraces: ['NFR-001'],
              sprintNumber: 1,
              rawBlock: '',
            },
          ],
          rawContent: '',
        },
        projectPlan: null,
      };

      const result = analyzeTraceability(docs);

      expect(result.nfrSummary.total).toBe(3);
      expect(result.nfrSummary.referenced).toBe(1);
      expect(result.nfrSummary.unreferenced).toContain('NFR-002');
      expect(result.nfrSummary.unreferenced).toContain('NFR-003');
    });
  });

  describe('isValidationPassing', () => {
    it('passes when all metrics are 100%', () => {
      const matrix = {
        coverage: {
          frCoveragePercent: 100,
          backlogItemCoveragePercent: 100,
          planMappingCoveragePercent: 100,
        },
        nfrSummary: { total: 2, referenced: 2, unreferenced: [] },
        gaps: {
          missingFrRefsInBacklog: [],
          missingBacklogInPlan: [],
          invalidPrdRefs: [],
          orphanedBacklogItems: [],
          backlogWithoutSprint: [],
        },
        details: {
          totalFRs: 5,
          coveredFRs: 5,
          totalBacklogItems: 10,
          coveredBacklogItems: 10,
          totalSprints: 3,
          sprintsWithScope: 3,
        },
      };

      expect(isValidationPassing(matrix, { strict: true })).toBe(true);
    });

    it('fails in strict mode when FR coverage < 100%', () => {
      const matrix = {
        coverage: {
          frCoveragePercent: 90,
          backlogItemCoveragePercent: 100,
          planMappingCoveragePercent: 100,
        },
        nfrSummary: { total: 0, referenced: 0, unreferenced: [] },
        gaps: {
          missingFrRefsInBacklog: ['FR-010'],
          missingBacklogInPlan: [],
          invalidPrdRefs: [],
          orphanedBacklogItems: [],
          backlogWithoutSprint: [],
        },
        details: {
          totalFRs: 10,
          coveredFRs: 9,
          totalBacklogItems: 10,
          coveredBacklogItems: 10,
          totalSprints: 3,
          sprintsWithScope: 3,
        },
      };

      expect(isValidationPassing(matrix, { strict: true })).toBe(false);
      expect(isValidationPassing(matrix, { strict: false })).toBe(true);
    });

    it('fails when there are invalid PRD refs', () => {
      const matrix = {
        coverage: {
          frCoveragePercent: 100,
          backlogItemCoveragePercent: 100,
          planMappingCoveragePercent: 100,
        },
        nfrSummary: { total: 0, referenced: 0, unreferenced: [] },
        gaps: {
          missingFrRefsInBacklog: [],
          missingBacklogInPlan: [],
          invalidPrdRefs: [{ requirementId: 'FR-001', invalidRef: '9.9' }],
          orphanedBacklogItems: [],
          backlogWithoutSprint: [],
        },
        details: {
          totalFRs: 5,
          coveredFRs: 5,
          totalBacklogItems: 10,
          coveredBacklogItems: 10,
          totalSprints: 3,
          sprintsWithScope: 3,
        },
      };

      expect(isValidationPassing(matrix)).toBe(false);
    });
  });

  describe('meetsThresholds', () => {
    it('passes with custom thresholds', () => {
      const matrix = {
        coverage: {
          frCoveragePercent: 80,
          backlogItemCoveragePercent: 70,
          planMappingCoveragePercent: 90,
        },
        nfrSummary: { total: 0, referenced: 0, unreferenced: [] },
        gaps: {
          missingFrRefsInBacklog: [],
          missingBacklogInPlan: [],
          invalidPrdRefs: [],
          orphanedBacklogItems: [],
          backlogWithoutSprint: [],
        },
        details: {
          totalFRs: 10,
          coveredFRs: 8,
          totalBacklogItems: 10,
          coveredBacklogItems: 7,
          totalSprints: 10,
          sprintsWithScope: 9,
        },
      };

      const { passes, violations } = meetsThresholds(matrix, {
        minFrCoverage: 80,
        minBacklogCoverage: 70,
        minPlanMapping: 90,
      });

      expect(passes).toBe(true);
      expect(violations).toEqual([]);
    });

    it('fails when below thresholds', () => {
      const matrix = {
        coverage: {
          frCoveragePercent: 70,
          backlogItemCoveragePercent: 60,
          planMappingCoveragePercent: 100, // Pass this one
        },
        nfrSummary: { total: 0, referenced: 0, unreferenced: [] },
        gaps: {
          missingFrRefsInBacklog: [],
          missingBacklogInPlan: [],
          invalidPrdRefs: [],
          orphanedBacklogItems: ['US-001'],
          backlogWithoutSprint: [],
        },
        details: {
          totalFRs: 10,
          coveredFRs: 7,
          totalBacklogItems: 10,
          coveredBacklogItems: 6,
          totalSprints: 10,
          sprintsWithScope: 10,
        },
      };

      const { passes, violations } = meetsThresholds(matrix, {
        minFrCoverage: 80,
        minBacklogCoverage: 80,
        maxOrphanedBacklog: 0,
      });

      expect(passes).toBe(false);
      expect(violations).toHaveLength(3); // FR, backlog, orphaned
      expect(violations[0]).toContain('FR coverage');
      expect(violations[1]).toContain('Backlog coverage');
      expect(violations[2]).toContain('orphaned');
    });
  });
});
