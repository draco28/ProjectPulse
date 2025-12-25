/**
 * Traceability Pattern Definitions
 *
 * Regex patterns for parsing Session 2 documents to extract:
 * - Functional Requirements (FR-###)
 * - Non-Functional Requirements (NFR-###)
 * - Epics (EPIC-### or "Epic N:")
 * - User Stories / Backlog Items (US-### or "Feature X.Y")
 * - PRD Section References
 * - Sprint Assignments
 * - Trace Lines
 */

// ============================================================================
// REQUIREMENT PATTERNS
// ============================================================================

/**
 * Functional Requirements: FR-001, FR-1, FR-123
 * Captures the numeric ID
 */
export const FR_PATTERN = /\bFR-(\d+)\b/gi;

/**
 * Non-Functional Requirements: NFR-001, NFR-1, NFR-123
 * Captures the numeric ID
 */
export const NFR_PATTERN = /\bNFR-(\d+)\b/gi;

// ============================================================================
// BACKLOG PATTERNS
// ============================================================================

/**
 * Epics: EPIC-001, EPIC-1, or "Epic 1:", "Epic 1 -", "Epic 1"
 * Captures the numeric ID from either format
 */
export const EPIC_PATTERN = /\b(?:EPIC-(\d+)|Epic\s+(\d+)(?:[\s:,-]|$))/gi;

/**
 * User Stories / Backlog Items:
 * - US-001, US-1, US-1.1, US-1.1.1
 * - Feature 1.1, Feature 2.3.1
 * Captures the full identifier
 */
export const BACKLOG_ITEM_PATTERN = /\b(?:US-[\d.]+|Feature\s+[\d.]+)\b/gi;

/**
 * Combined pattern to extract backlog item ID (US-### or Feature X.Y)
 * More specific capture groups
 */
export const BACKLOG_ITEM_ID_PATTERN = /\b(US-[\d.]+|Feature\s+[\d.]+)\b/gi;

// ============================================================================
// REFERENCE PATTERNS
// ============================================================================

/**
 * PRD Section References: "PRD Section 2.3", "PRD 2.3.1", "PRD Section 2"
 * Captures the section number
 */
export const PRD_SECTION_PATTERN = /\bPRD\s+(?:Section\s+)?([\d.]+)\b/gi;

/**
 * Sprint Assignment: "Sprint 1", "Sprint: 1", "Sprint 1 (Weeks 1-2)"
 * Captures the sprint number
 */
export const SPRINT_PATTERN = /\bSprint[:\s]+(\d+)/gi;

/**
 * Sprint Assignment in field format: "**Sprint:** 1" or "Sprint: 1"
 * More specific for backlog item fields
 * Handles: Sprint: 5, **Sprint:** 5, **Sprint**: 5, Sprint 5
 */
export const SPRINT_FIELD_PATTERN = /\*{0,2}Sprint:?\*{0,2}:?\s*(\d+)/gi;

// ============================================================================
// TRACE LINE PATTERNS
// ============================================================================

/**
 * Trace line: "Traces to: FR-001, FR-002" or "Traces to: PRD Section 2.3"
 * Captures everything after "Traces to:"
 */
export const TRACE_LINE_PATTERN = /Traces?\s+to:\s*(.+?)(?:\n|$)/gi;

/**
 * Extract FRs from a trace line content
 */
export const TRACE_FR_PATTERN = /FR-(\d+)/gi;

/**
 * Extract NFRs from a trace line content
 */
export const TRACE_NFR_PATTERN = /NFR-(\d+)/gi;

// ============================================================================
// PROJECT PLAN PATTERNS
// ============================================================================

/**
 * Sprint Header: "### Sprint 1:", "## Sprint 2", "Sprint 1: Foundation"
 * Captures sprint number and optional title
 */
export const SPRINT_HEADER_PATTERN = /^#{2,4}\s*Sprint\s+(\d+)[:\s-]*(.*)$/gim;

/**
 * Scope section: "**Scope (Backlog Items):**" followed by list items
 * Captures the entire scope section until next header or double newline
 */
export const SCOPE_SECTION_PATTERN =
  /\*\*Scope\s*\(Backlog\s*Items?\)\*?\*?:\*?\*?\s*\n((?:[-*]\s*.+\n?)+)/gi;

/**
 * Individual scope item: "- EPIC-001 / US-001 (FR-001, FR-002)"
 * Captures the line content
 */
export const SCOPE_ITEM_PATTERN = /^[-*]\s*(.+)$/gm;

// ============================================================================
// SECTION PATTERNS (for PRD)
// ============================================================================

/**
 * Numbered section header: "## 2.3 User Authentication", "### 3.1.2 Login Flow"
 * Captures section number and title
 */
export const NUMBERED_SECTION_PATTERN = /^#{2,4}\s*([\d.]+)\s+(.+)$/gm;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract all unique matches for a pattern from text
 */
export function extractAllMatches(text: string, pattern: RegExp): string[] {
  const results: string[] = [];
  let match: RegExpExecArray | null;

  // Create a new regex to avoid state issues
  const regex = new RegExp(pattern.source, pattern.flags);

  while ((match = regex.exec(text)) !== null) {
    // Get the first capturing group, or the full match if no groups
    const value = match[1] || match[0];
    if (!results.includes(value)) {
      results.push(value);
    }
  }

  return results;
}

/**
 * Extract FR IDs from text (returns normalized format: "FR-001", "FR-002", etc.)
 */
export function extractFRs(text: string): string[] {
  const matches = extractAllMatches(text, FR_PATTERN);
  return matches.map((id) => `FR-${id.padStart(3, '0')}`);
}

/**
 * Extract NFR IDs from text (returns normalized format: "NFR-001", "NFR-002", etc.)
 */
export function extractNFRs(text: string): string[] {
  const matches = extractAllMatches(text, NFR_PATTERN);
  return matches.map((id) => `NFR-${id.padStart(3, '0')}`);
}

/**
 * Extract Epic IDs from text (returns normalized format: "EPIC-001", "EPIC-002", etc.)
 */
export function extractEpics(text: string): string[] {
  const results: string[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(EPIC_PATTERN.source, EPIC_PATTERN.flags);

  while ((match = regex.exec(text)) !== null) {
    // match[1] is from EPIC-N format, match[2] is from "Epic N:" format
    const id = match[1] || match[2];
    if (id) {
      const normalized = `EPIC-${id.padStart(3, '0')}`;
      if (!results.includes(normalized)) {
        results.push(normalized);
      }
    }
  }

  return results;
}

/**
 * Extract backlog item IDs from text (US-### or Feature X.Y)
 */
export function extractBacklogItems(text: string): string[] {
  const results: string[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(BACKLOG_ITEM_ID_PATTERN.source, BACKLOG_ITEM_ID_PATTERN.flags);

  while ((match = regex.exec(text)) !== null) {
    const matchContent = match[1];
    if (!matchContent) continue;
    const item = matchContent.replace(/\s+/g, ' ').trim();
    if (!results.includes(item)) {
      results.push(item);
    }
  }

  return results;
}

/**
 * Extract sprint number from text
 */
export function extractSprintNumber(text: string): number | null {
  const regex = new RegExp(SPRINT_FIELD_PATTERN.source, SPRINT_FIELD_PATTERN.flags);
  const match = regex.exec(text);
  const sprintNum = match?.[1];
  return sprintNum ? parseInt(sprintNum, 10) : null;
}

/**
 * Extract PRD section references from text
 */
export function extractPRDSections(text: string): string[] {
  return extractAllMatches(text, PRD_SECTION_PATTERN);
}

/**
 * Parse a trace line and extract all referenced requirements
 */
export function parseTraceLine(line: string): {
  frs: string[];
  nfrs: string[];
  prdSections: string[];
} {
  return {
    frs: extractFRs(line),
    nfrs: extractNFRs(line),
    prdSections: extractPRDSections(line),
  };
}

// ============================================================================
// SPRINT 15: FLEXIBLE SCOPE SECTION PATTERNS
// ============================================================================

/**
 * Array of patterns to try for extracting scope sections from Project Plan.
 * Tried in order - first match wins.
 *
 * Supports various document formats:
 * - Original: **Scope (Backlog Items):** followed by bullet list
 * - User Stories inline: **User Stories:** US-001 to US-014
 * - Backlog Items inline: **Backlog Items:** US-001, US-002
 * - Features inline: **Features:** Feature 1.1, Feature 1.2
 * - Simple scope: **Scope:** followed by content
 */
export const SCOPE_SECTION_PATTERNS: readonly RegExp[] = [
  // Original pattern (backward compatible) - bullet list format
  /\*\*Scope\s*\(Backlog\s*Items?\)\*?\*?:\*?\*?\s*\n((?:[-*]\s*.+\n?)+)/gi,
  // User Stories inline: "**User Stories:** US-001 to US-014"
  /\*\*User\s+Stories:?\*?\*?\s*(.+?)(?=\n\*\*|\n#{2,}|\n\n|$)/gis,
  // Backlog Items inline
  /\*\*Backlog(?:\s+Items)?:?\*?\*?\s*(.+?)(?=\n\*\*|\n#{2,}|\n\n|$)/gis,
  // Features inline
  /\*\*Features:?\*?\*?\s*(.+?)(?=\n\*\*|\n#{2,}|\n\n|$)/gis,
  // Scope without parenthetical - bullet list
  /\*\*Scope:?\*?\*?\s*\n((?:[-*]\s*.+\n?)+)/gi,
  // Scope without parenthetical - inline
  /\*\*Scope:?\*?\*?\s*([^\n]+?)(?=\n\*\*|\n#{2,}|\n\n|$)/gi,
] as const;

/**
 * Expand range notation like "US-001 to US-014" into individual item IDs.
 * Also extracts any individually listed items.
 *
 * @example
 * expandBacklogRange("US-001 to US-003, US-010")
 * // Returns: ["US-001", "US-002", "US-003", "US-010"]
 */
export function expandBacklogRange(text: string): string[] {
  const results: string[] = [];

  // Pattern for range: US-001 to US-014
  const usRangePattern = /US-(\d+)\s+to\s+US-(\d+)/gi;
  let match: RegExpExecArray | null;

  while ((match = usRangePattern.exec(text)) !== null) {
    const startStr = match[1];
    const endStr = match[2];
    if (!startStr || !endStr) continue;

    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    const padding = startStr.length;

    // Handle both ascending and descending ranges
    const min = Math.min(start, end);
    const max = Math.max(start, end);

    for (let i = min; i <= max; i++) {
      results.push(`US-${String(i).padStart(padding, '0')}`);
    }
  }

  // Also extract any individually listed items
  const individualItems = extractBacklogItems(text);

  // Combine and dedupe
  return [...new Set([...results, ...individualItems])];
}
