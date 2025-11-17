/**
 * Project Plan Markdown Parser
 *
 * Sprint 8.5: Parses 13-Project-Plan.md from Document table
 * Extracts Phase → Sprint → Week hierarchy for Roadmap creation
 *
 * Data Source: Document table (Session 2 stores markdown content here)
 * Output: JSON structure for Roadmap.phases field (JSONB)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Parsed roadmap structure (for Roadmap.phases JSONB field)
 */
export interface ParsedRoadmap {
  phases: Array<{
    name: string;       // "Phase A: Foundation & Core Infrastructure"
    duration: string;   // "6 weeks"
    sprints: Array<{
      name: string;     // "Sprint 1: Foundation Setup"
      duration: string; // "2 weeks"
      weeks: string;    // "Weeks 1-2"
      goals: string[];
      deliverables: string[];
      storyPoints: number;
    }>;
  }>;
}

/**
 * Parse 13-Project-Plan.md from Document table
 *
 * Algorithm:
 * 1. Fetch document content from Document table
 * 2. Parse ## Phase headers (## Phase A: Name (Weeks X-Y, Sprints X-Y))
 * 3. Parse ### Sprint headers (### Sprint N (Weeks X-Y): Name - XX points)
 * 4. Extract goals/deliverables lists for each sprint
 * 5. Return structured JSON for Roadmap.phases
 *
 * @param documentId - Document.id for 13-Project-Plan.md
 * @returns Parsed roadmap structure
 * @throws Error if document not found
 */
export async function parseProjectPlan(documentId: string): Promise<ParsedRoadmap> {
  // 1. Fetch 13-Project-Plan.md CONTENT from Document table
  // Note: This is markdown string stored by Session 2, NOT a file
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { content: true, filename: true },
  });

  if (!doc) {
    throw new Error(`Document not found: ${documentId}`);
  }

  if (!doc.filename.includes('13-Project-Plan')) {
    console.warn(`Warning: Expected 13-Project-Plan.md, got ${doc.filename}`);
  }

  const markdown = doc.content;
  const phases: ParsedRoadmap['phases'] = [];

  // 2. Parse Phase headers
  // Pattern: ## Phase A: Foundation & Core Infrastructure (Weeks 1-6, Sprints 1-3)
  const phaseRegex = /^## (Phase [A-Z]: .+?) \(Weeks (\d+)-(\d+), Sprints (\d+)-(\d+)\)/gm;

  let phaseMatch;
  while ((phaseMatch = phaseRegex.exec(markdown)) !== null) {
    const phaseName = phaseMatch[1];
    const weekStart = parseInt(phaseMatch[2], 10);
    const weekEnd = parseInt(phaseMatch[3], 10);
    const sprintStart = parseInt(phaseMatch[4], 10);
    const sprintEnd = parseInt(phaseMatch[5], 10);

    const duration = `${weekEnd - weekStart + 1} weeks`;
    const sprints: ParsedRoadmap['phases'][0]['sprints'] = [];

    // 3. Parse Sprint headers within this phase
    // Pattern: ### Sprint 1 (Weeks 1-2): Foundation Setup - 12 points
    // Create regex that matches sprints in the range for this phase
    const sprintRegex = new RegExp(
      `### Sprint ([${sprintStart}-${sprintEnd}]) \\(Weeks ([\\d-]+)\\): (.+?) - (\\d+) points`,
      'g'
    );

    // Get the substring for this phase (from current phase header to next phase or end)
    const phaseStartIndex = phaseMatch.index;
    const nextPhaseMatch = markdown.substring(phaseStartIndex + 1).search(/^## Phase /m);
    const phaseEndIndex = nextPhaseMatch === -1
      ? markdown.length
      : phaseStartIndex + 1 + nextPhaseMatch;
    const phaseContent = markdown.substring(phaseStartIndex, phaseEndIndex);

    let sprintMatch;
    while ((sprintMatch = sprintRegex.exec(phaseContent)) !== null) {
      const sprintNum = sprintMatch[1];
      const weeks = sprintMatch[2];
      const sprintName = sprintMatch[3];
      const storyPoints = parseInt(sprintMatch[4], 10);

      // Calculate sprint duration from weeks range
      const [wStart, wEnd] = weeks.split('-').map(Number);
      const sprintDuration = `${wEnd - wStart + 1} weeks`;

      // 4. Extract goals and deliverables for this sprint
      const goals = extractListItems(phaseContent, `Sprint ${sprintNum}`, '**Goals:**');
      const deliverables = extractListItems(phaseContent, `Sprint ${sprintNum}`, '**Deliverables:**');

      sprints.push({
        name: `Sprint ${sprintNum}: ${sprintName}`,
        duration: sprintDuration,
        weeks,
        goals,
        deliverables,
        storyPoints,
      });
    }

    phases.push({
      name: phaseName,
      duration,
      sprints,
    });
  }

  return { phases };
}

/**
 * Extract bullet-point list items after a marker within a section
 *
 * Example:
 *   **Goals:**
 *   - Set up development environment
 *   - Initialize database schema
 *
 * extractListItems(markdown, "Sprint 1", "**Goals:**") => ["Set up development environment", "Initialize database schema"]
 *
 * @param markdown - Full or section markdown content
 * @param section - Section identifier (e.g., "Sprint 1")
 * @param marker - List marker (e.g., "**Goals:**")
 * @returns Array of list items (without bullet points)
 */
function extractListItems(markdown: string, section: string, marker: string): string[] {
  try {
    // Find section boundaries
    const sectionStart = markdown.indexOf(section);
    if (sectionStart === -1) return [];

    // Find end of section (next ### header or end of content)
    const sectionEnd = markdown.indexOf('###', sectionStart + section.length);
    const sectionText = sectionEnd === -1
      ? markdown.substring(sectionStart)
      : markdown.substring(sectionStart, sectionEnd);

    // Find marker within section
    const markerIndex = sectionText.indexOf(marker);
    if (markerIndex === -1) return [];

    // Extract list content (from marker to next blank line or section end)
    const listStart = markerIndex + marker.length;
    const remainingText = sectionText.substring(listStart);

    // Find end of list (double newline, new markdown header, or end of text)
    const listEndMatches = [
      remainingText.search(/\n\n/),
      remainingText.search(/\n#/),
      remainingText.search(/\n\*/),
    ].filter(idx => idx !== -1);

    const listEnd = listEndMatches.length > 0 ? Math.min(...listEndMatches) : remainingText.length;
    const listText = remainingText.substring(0, listEnd);

    // Extract bullet points
    return listText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-') || line.startsWith('*'))
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .filter(line => line.length > 0);
  } catch (error) {
    console.error(`Error extracting list items for section "${section}", marker "${marker}":`, error);
    return [];
  }
}

/**
 * Get the 13-Project-Plan.md document ID for a project
 *
 * Helper function to find the document by filename pattern
 *
 * @param projectId - Project ID
 * @returns Document ID or null if not found
 */
export async function getProjectPlanDocumentId(projectId: number): Promise<string | null> {
  const doc = await prisma.document.findFirst({
    where: {
      onboardingSession: {
        projectId,
      },
      filename: {
        contains: '13-Project-Plan',
      },
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' }, // Latest if multiple
  });

  return doc?.id ?? null;
}

/**
 * Parse project plan for a given project
 *
 * Convenience function that finds the document and parses it
 *
 * @param projectId - Project ID
 * @returns Parsed roadmap structure
 * @throws Error if document not found
 */
export async function parseProjectPlanByProjectId(projectId: number): Promise<ParsedRoadmap> {
  const documentId = await getProjectPlanDocumentId(projectId);

  if (!documentId) {
    throw new Error(`13-Project-Plan.md not found for project ${projectId}`);
  }

  return parseProjectPlan(documentId);
}
