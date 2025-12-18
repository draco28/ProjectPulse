/**
 * Tests for Traceability Pattern Definitions
 */

import {
  extractFRs,
  extractNFRs,
  extractEpics,
  extractBacklogItems,
  extractSprintNumber,
  extractPRDSections,
  parseTraceLine,
  extractAllMatches,
  FR_PATTERN,
  NFR_PATTERN,
} from '../patterns';

describe('Pattern Extraction', () => {
  describe('extractFRs', () => {
    it('extracts FR-### format', () => {
      const text = 'This implements FR-001 and FR-002 requirements';
      expect(extractFRs(text)).toEqual(['FR-001', 'FR-002']);
    });

    it('extracts FR-# format with padding', () => {
      const text = 'See FR-1, FR-2, FR-10';
      expect(extractFRs(text)).toEqual(['FR-001', 'FR-002', 'FR-010']);
    });

    it('handles case insensitivity', () => {
      const text = 'fr-001 and FR-002 and Fr-003';
      expect(extractFRs(text)).toEqual(['FR-001', 'FR-002', 'FR-003']);
    });

    it('returns empty array for no matches', () => {
      expect(extractFRs('No requirements here')).toEqual([]);
    });

    it('deduplicates matches', () => {
      const text = 'FR-001 is mentioned twice: FR-001';
      expect(extractFRs(text)).toEqual(['FR-001']);
    });
  });

  describe('extractNFRs', () => {
    it('extracts NFR-### format', () => {
      const text = 'Performance NFR-001 and security NFR-002';
      expect(extractNFRs(text)).toEqual(['NFR-001', 'NFR-002']);
    });

    it('extracts NFR-# format with padding', () => {
      const text = 'NFR-1, NFR-12, NFR-123';
      expect(extractNFRs(text)).toEqual(['NFR-001', 'NFR-012', 'NFR-123']);
    });
  });

  describe('extractEpics', () => {
    it('extracts EPIC-### format', () => {
      const text = 'Part of EPIC-001 and EPIC-002';
      expect(extractEpics(text)).toEqual(['EPIC-001', 'EPIC-002']);
    });

    it('extracts "Epic N:" format', () => {
      const text = 'Epic 1: User Management\nEpic 2: Authentication';
      expect(extractEpics(text)).toEqual(['EPIC-001', 'EPIC-002']);
    });

    it('extracts mixed formats', () => {
      const text = 'EPIC-003 and Epic 4: Dashboard';
      expect(extractEpics(text)).toEqual(['EPIC-003', 'EPIC-004']);
    });
  });

  describe('extractBacklogItems', () => {
    it('extracts US-### format', () => {
      const text = 'User stories US-001, US-002';
      expect(extractBacklogItems(text)).toEqual(['US-001', 'US-002']);
    });

    it('extracts US-#.# format', () => {
      const text = 'Story US-1.1 and US-1.2.3';
      expect(extractBacklogItems(text)).toEqual(['US-1.1', 'US-1.2.3']);
    });

    it('extracts "Feature X.Y" format', () => {
      const text = 'Feature 1.1 and Feature 2.3.1';
      expect(extractBacklogItems(text)).toEqual(['Feature 1.1', 'Feature 2.3.1']);
    });

    it('extracts mixed formats', () => {
      const text = 'US-001, Feature 1.2, US-2.1';
      expect(extractBacklogItems(text)).toEqual(['US-001', 'Feature 1.2', 'US-2.1']);
    });
  });

  describe('extractSprintNumber', () => {
    it('extracts "Sprint N" format', () => {
      expect(extractSprintNumber('Sprint 1')).toBe(1);
      expect(extractSprintNumber('Sprint 12')).toBe(12);
    });

    it('extracts "Sprint: N" format', () => {
      expect(extractSprintNumber('Sprint: 3')).toBe(3);
    });

    it('extracts "**Sprint:** N" format', () => {
      expect(extractSprintNumber('**Sprint:** 5')).toBe(5);
      expect(extractSprintNumber('**Sprint**: 5')).toBe(5);
    });

    it('returns null for no match', () => {
      expect(extractSprintNumber('No sprint here')).toBeNull();
    });
  });

  describe('extractPRDSections', () => {
    it('extracts "PRD Section X.Y" format', () => {
      const text = 'Traces to: PRD Section 2.3';
      expect(extractPRDSections(text)).toEqual(['2.3']);
    });

    it('extracts "PRD X.Y" format', () => {
      const text = 'See PRD 2.3.1 for details';
      expect(extractPRDSections(text)).toEqual(['2.3.1']);
    });

    it('extracts multiple sections', () => {
      const text = 'PRD Section 2.1, PRD 2.2, PRD Section 3.1';
      expect(extractPRDSections(text)).toEqual(['2.1', '2.2', '3.1']);
    });
  });

  describe('parseTraceLine', () => {
    it('parses trace line with FRs', () => {
      const line = 'Traces to: FR-001, FR-002';
      const result = parseTraceLine(line);
      expect(result.frs).toEqual(['FR-001', 'FR-002']);
      expect(result.nfrs).toEqual([]);
      expect(result.prdSections).toEqual([]);
    });

    it('parses trace line with mixed refs', () => {
      const line = 'Traces to: FR-001, NFR-002, PRD Section 2.3';
      const result = parseTraceLine(line);
      expect(result.frs).toEqual(['FR-001']);
      expect(result.nfrs).toEqual(['NFR-002']);
      expect(result.prdSections).toEqual(['2.3']);
    });

    it('parses trace line with PRD only', () => {
      const line = 'Traces to: PRD Section 2.1';
      const result = parseTraceLine(line);
      expect(result.frs).toEqual([]);
      expect(result.nfrs).toEqual([]);
      expect(result.prdSections).toEqual(['2.1']);
    });
  });
});
