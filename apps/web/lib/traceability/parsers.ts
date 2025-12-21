/**
 * Document Parsers for Traceability Validation
 *
 * Parses Session 2 generated documents to extract structured data:
 * - PRD: Numbered sections
 * - SRS: FRs and NFRs with PRD traces
 * - Backlog: User stories with FR/NFR traces and sprint assignments
 * - Project Plan: Sprint scopes with backlog item references
 */

import {
  extractFRs,
  extractNFRs,
  extractEpics,
  extractBacklogItems,
  extractSprintNumber,
  extractPRDSections,
  parseTraceLine,
  NUMBERED_SECTION_PATTERN,
  TRACE_LINE_PATTERN,
  SPRINT_HEADER_PATTERN,
  SCOPE_SECTION_PATTERN,
  SCOPE_ITEM_PATTERN,
} from './patterns';

// ============================================================================
// TYPES
// ============================================================================

export interface PRDSection {
  number: string; // e.g., "2.3"
  title: string;
  level: number; // Header depth (2, 3, 4)
}

export interface ParsedPRD {
  sections: PRDSection[];
  rawContent: string;
}

export interface SRSRequirement {
  id: string; // e.g., "FR-001" or "NFR-001"
  type: 'FR' | 'NFR';
  title: string;
  prdTraces: string[]; // PRD section references
  rawBlock: string;
}

export interface ParsedSRS {
  functionalRequirements: SRSRequirement[];
  nonFunctionalRequirements: SRSRequirement[];
  rawContent: string;
}

export interface BacklogItem {
  id: string; // e.g., "US-001" or "Feature 1.1"
  title: string;
  epicId: string | null;
  frTraces: string[]; // e.g., ["FR-001", "FR-002"]
  nfrTraces: string[]; // e.g., ["NFR-001"]
  sprintNumber: number | null;
  rawBlock: string;
}

export interface ParsedBacklog {
  epics: Array<{ id: string; title: string }>;
  items: BacklogItem[];
  rawContent: string;
}

export interface SprintScope {
  sprintNumber: number;
  title: string;
  backlogItems: string[]; // IDs referenced in scope
  frRefs: string[]; // FRs mentioned in scope
  nfrRefs: string[]; // NFRs mentioned in scope
  rawBlock: string;
}

export interface ParsedProjectPlan {
  sprints: SprintScope[];
  rawContent: string;
}

// ============================================================================
// PRD PARSER
// ============================================================================

/**
 * Parse PRD document to extract numbered sections
 */
export function parsePRD(content: string): ParsedPRD {
  const sections: PRDSection[] = [];
  const regex = new RegExp(NUMBERED_SECTION_PATTERN.source, NUMBERED_SECTION_PATTERN.flags);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const sectionNum = match[1];
    const sectionTitle = match[2];
    if (!sectionNum || !sectionTitle) continue;

    // Count # characters to determine header level
    const headerMatch = match[0].match(/^(#+)/);
    const level = headerMatch?.[1]?.length ?? 2;

    sections.push({
      number: sectionNum,
      title: sectionTitle.trim(),
      level,
    });
  }

  return {
    sections,
    rawContent: content,
  };
}

// ============================================================================
// SRS PARSER
// ============================================================================

/**
 * Parse SRS document to extract functional and non-functional requirements
 */
export function parseSRS(content: string): ParsedSRS {
  const functionalRequirements: SRSRequirement[] = [];
  const nonFunctionalRequirements: SRSRequirement[] = [];

  // Split content by requirement headers (### FR-### or ### NFR-### or ## FR-### etc.)
  // Pattern captures the header and all content until the next requirement header
  const reqHeaderPattern = /^(#{2,4})\s*((?:FR|NFR)-\d+)[:\s-]+(.+)$/gm;
  const headers: Array<{ type: 'FR' | 'NFR'; id: string; title: string; index: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = reqHeaderPattern.exec(content)) !== null) {
    const reqId = match[2];
    const reqTitle = match[3];
    if (!reqId || !reqTitle) continue;

    const reqType = reqId.toUpperCase().startsWith('FR') ? 'FR' : 'NFR';
    headers.push({
      type: reqType,
      id: reqId.toUpperCase(),
      title: reqTitle.trim(),
      index: match.index,
    });
  }

  // Extract content for each requirement
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (!header) continue;

    const nextHeader = headers[i + 1];
    const nextIndex = nextHeader ? nextHeader.index : content.length;
    const rawBlock = content.slice(header.index, nextIndex);

    // Extract trace lines from the block
    const traceRegex = new RegExp(TRACE_LINE_PATTERN.source, TRACE_LINE_PATTERN.flags);
    const prdTraces: string[] = [];
    let traceMatch: RegExpExecArray | null;

    while ((traceMatch = traceRegex.exec(rawBlock)) !== null) {
      const traceContent = traceMatch[1];
      if (traceContent) {
        prdTraces.push(...extractPRDSections(traceContent));
      }
    }

    const requirement: SRSRequirement = {
      id: normalizeRequirementId(header.id),
      type: header.type,
      title: header.title,
      prdTraces,
      rawBlock,
    };

    if (header.type === 'FR') {
      functionalRequirements.push(requirement);
    } else {
      nonFunctionalRequirements.push(requirement);
    }
  }

  return {
    functionalRequirements,
    nonFunctionalRequirements,
    rawContent: content,
  };
}

// ============================================================================
// BACKLOG PARSER
// ============================================================================

/**
 * Parse Backlog document to extract epics and user stories
 */
export function parseBacklog(content: string): ParsedBacklog {
  const epics: Array<{ id: string; title: string }> = [];
  const items: BacklogItem[] = [];

  // First, find all headers (epics and user stories)
  // Pattern matches: ## EPIC-001:, ## Epic 1:, ### US-001:, ### Feature 1.1:
  const headerPattern =
    /^(#{2,4})\s*((?:EPIC-\d+|Epic\s+\d+|US-[\d.]+|Feature\s+[\d.]+))[:\s-]+(.+)$/gim;
  const headers: Array<{
    type: 'epic' | 'item';
    rawId: string;
    title: string;
    index: number;
  }> = [];
  let match: RegExpExecArray | null;

  while ((match = headerPattern.exec(content)) !== null) {
    const rawId = match[2];
    const titleMatch = match[3];
    if (!rawId || !titleMatch) continue;

    const rawIdTrimmed = rawId.trim();
    const isEpic = /^(EPIC-|Epic\s+)/i.test(rawIdTrimmed);
    headers.push({
      type: isEpic ? 'epic' : 'item',
      rawId: rawIdTrimmed,
      title: titleMatch.trim(),
      index: match.index,
    });
  }

  // Process each header
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (!header) continue;

    const nextHeader = headers[i + 1];
    const nextIndex = nextHeader ? nextHeader.index : content.length;
    const rawBlock = content.slice(header.index, nextIndex);

    if (header.type === 'epic') {
      // Extract epic
      const epicIds = extractEpics(header.rawId);
      const firstEpicId = epicIds[0];
      if (firstEpicId) {
        epics.push({
          id: firstEpicId,
          title: header.title,
        });
      }
    } else {
      // Extract user story / feature
      // Extract traces from block content
      const traceRegex = new RegExp(TRACE_LINE_PATTERN.source, TRACE_LINE_PATTERN.flags);
      const frTraces: string[] = [];
      const nfrTraces: string[] = [];
      let traceMatch: RegExpExecArray | null;

      while ((traceMatch = traceRegex.exec(rawBlock)) !== null) {
        const traceContent = traceMatch[1];
        if (traceContent) {
          frTraces.push(...extractFRs(traceContent));
          nfrTraces.push(...extractNFRs(traceContent));
        }
      }

      // Also check for inline FR/NFR mentions in the entire block
      if (frTraces.length === 0) {
        frTraces.push(...extractFRs(rawBlock));
      }
      if (nfrTraces.length === 0) {
        nfrTraces.push(...extractNFRs(rawBlock));
      }

      // Extract epic reference from the block content
      const epicRefPattern = /\*?\*?Epic:?\*?\*?:?\s*([^\n,]+)/i;
      const epicMatch = rawBlock.match(epicRefPattern);
      let epicId: string | null = null;
      if (epicMatch?.[1]) {
        const epicIds = extractEpics(epicMatch[1]);
        epicId = epicIds[0] ?? null;
      }

      // Extract sprint number
      const sprintNumber = extractSprintNumber(rawBlock);

      items.push({
        id: normalizeBacklogItemId(header.rawId),
        title: header.title,
        epicId,
        frTraces: [...new Set(frTraces)],
        nfrTraces: [...new Set(nfrTraces)],
        sprintNumber,
        rawBlock,
      });
    }
  }

  return {
    epics,
    items,
    rawContent: content,
  };
}

// ============================================================================
// PROJECT PLAN PARSER
// ============================================================================

/**
 * Parse Project Plan document to extract sprint scopes
 */
export function parseProjectPlan(content: string): ParsedProjectPlan {
  const sprints: SprintScope[] = [];

  // Split by sprint headers
  const sprintHeaderRegex = new RegExp(SPRINT_HEADER_PATTERN.source, SPRINT_HEADER_PATTERN.flags);
  const headers: Array<{ number: number; title: string; index: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = sprintHeaderRegex.exec(content)) !== null) {
    const sprintNum = match[1];
    const sprintTitle = match[2];
    if (!sprintNum) continue;

    headers.push({
      number: parseInt(sprintNum, 10),
      title: sprintTitle?.trim() ?? '',
      index: match.index,
    });
  }

  // Extract content for each sprint
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (!header) continue;

    const nextHeader = headers[i + 1];
    const nextIndex = nextHeader ? nextHeader.index : content.length;
    const sprintContent = content.slice(header.index, nextIndex);

    // Look for Scope section
    const scopeRegex = new RegExp(SCOPE_SECTION_PATTERN.source, SCOPE_SECTION_PATTERN.flags);
    const scopeMatch = scopeRegex.exec(sprintContent);

    const backlogItems: string[] = [];
    const frRefs: string[] = [];
    const nfrRefs: string[] = [];

    if (scopeMatch?.[1]) {
      const scopeContent = scopeMatch[1];

      // Extract each line item
      const itemRegex = new RegExp(SCOPE_ITEM_PATTERN.source, SCOPE_ITEM_PATTERN.flags);
      let itemMatch: RegExpExecArray | null;

      while ((itemMatch = itemRegex.exec(scopeContent)) !== null) {
        const lineContent = itemMatch[1];
        if (!lineContent) continue;

        // Extract backlog item IDs
        backlogItems.push(...extractBacklogItems(lineContent));

        // Also include epic references as backlog items
        backlogItems.push(...extractEpics(lineContent));

        // Extract FR/NFR references
        frRefs.push(...extractFRs(lineContent));
        nfrRefs.push(...extractNFRs(lineContent));
      }
    }

    sprints.push({
      sprintNumber: header.number,
      title: header.title,
      backlogItems: [...new Set(backlogItems)],
      frRefs: [...new Set(frRefs)],
      nfrRefs: [...new Set(nfrRefs)],
      rawBlock: sprintContent,
    });
  }

  return {
    sprints,
    rawContent: content,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize requirement ID to FR-### or NFR-### format with zero padding
 */
function normalizeRequirementId(id: string): string {
  const match = id.match(/(FR|NFR)-(\d+)/i);
  const reqType = match?.[1];
  const reqNum = match?.[2];
  if (reqType && reqNum) {
    return `${reqType.toUpperCase()}-${reqNum.padStart(3, '0')}`;
  }
  return id.toUpperCase();
}

/**
 * Normalize backlog item ID
 */
function normalizeBacklogItemId(id: string): string {
  // Normalize "Feature 1.1" format
  if (id.toLowerCase().startsWith('feature')) {
    return id.replace(/feature\s+/i, 'Feature ');
  }
  // US-### format is kept as-is (already uppercase)
  return id.toUpperCase();
}

// ============================================================================
// DOCUMENT SET PARSER
// ============================================================================

export interface DocumentSet {
  prd: ParsedPRD | null;
  srs: ParsedSRS | null;
  backlog: ParsedBacklog | null;
  projectPlan: ParsedProjectPlan | null;
}

export interface RawDocumentSet {
  prd?: string;
  srs?: string;
  backlog?: string;
  projectPlan?: string;
}

/**
 * Parse all documents in a set
 */
export function parseDocumentSet(docs: RawDocumentSet): DocumentSet {
  return {
    prd: docs.prd ? parsePRD(docs.prd) : null,
    srs: docs.srs ? parseSRS(docs.srs) : null,
    backlog: docs.backlog ? parseBacklog(docs.backlog) : null,
    projectPlan: docs.projectPlan ? parseProjectPlan(docs.projectPlan) : null,
  };
}
