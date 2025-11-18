/**
 * Project Plan Markdown Parser
 *
 * Parses 13-Project-Plan.md from Document table
 * Extracts Phase → Sprint → Week hierarchy for Roadmap creation
 */

import { PrismaClient } from '@prisma/client';
import type { ParsedRoadmap } from './types.js';

const prisma = new PrismaClient();

/**
 * Parse 13-Project-Plan.md from Document table
 *
 * @param documentId - Document.id for 13-Project-Plan.md
 * @returns Parsed roadmap structure
 * @throws Error if document not found
 */
export async function parseProjectPlan(documentId: string): Promise<ParsedRoadmap> {
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

  // Parse Phase headers: ## Phase A: Name (Weeks X-Y, Sprints X-Y)
  const phaseRegex = /^## (Phase [A-Z]: .+?) \(Weeks (\d+)-(\d+), Sprints (\d+)-(\d+)\)/gm;

  let phaseMatch;
  while ((phaseMatch = phaseRegex.exec(markdown)) !== null) {
    // Add null checks for TypeScript strict mode
    const phaseName = phaseMatch[1] ?? 'Unknown Phase';
    const weekStart = parseInt(phaseMatch[2] ?? '1', 10);
    const weekEnd = parseInt(phaseMatch[3] ?? '1', 10);
    const sprintStart = parseInt(phaseMatch[4] ?? '1', 10);
    const sprintEnd = parseInt(phaseMatch[5] ?? '1', 10);

    const duration = `${weekEnd - weekStart + 1} weeks`;
    const sprints: ParsedRoadmap['phases'][0]['sprints'] = [];

    // Parse Sprint headers: ### Sprint N (Weeks X-Y): Name - XX points
    const sprintRegex = new RegExp(
      `### Sprint ([${sprintStart}-${sprintEnd}]) \\(Weeks ([\\d-]+)\\): (.+?) - (\\d+) points`,
      'g'
    );

    // Get phase content substring
    const phaseStartIndex = phaseMatch.index;
    const nextPhaseMatch = markdown.substring(phaseStartIndex + 1).search(/^## Phase /m);
    const phaseEndIndex = nextPhaseMatch === -1
      ? markdown.length
      : phaseStartIndex + 1 + nextPhaseMatch;
    const phaseContent = markdown.substring(phaseStartIndex, phaseEndIndex);

    let sprintMatch;
    while ((sprintMatch = sprintRegex.exec(phaseContent)) !== null) {
      const sprintNum = sprintMatch[1] ?? '1';
      const weeks = sprintMatch[2] ?? 'Weeks 1-2';
      const sprintName = sprintMatch[3] ?? 'Unknown Sprint';
      const storyPoints = parseInt(sprintMatch[4] ?? '0', 10);

      // Calculate sprint duration with null safety
      const weekParts = weeks.split('-');
      const wStart = parseInt(weekParts[0]?.replace('Weeks ', '') ?? '1', 10);
      const wEnd = parseInt(weekParts[1] ?? String(wStart), 10);
      const sprintDuration = `${wEnd - wStart + 1} weeks`;

      // Extract goals and deliverables
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
 */
function extractListItems(markdown: string, section: string, marker: string): string[] {
  try {
    const sectionStart = markdown.indexOf(section);
    if (sectionStart === -1) return [];

    const sectionEnd = markdown.indexOf('###', sectionStart + section.length);
    const sectionText = sectionEnd === -1
      ? markdown.substring(sectionStart)
      : markdown.substring(sectionStart, sectionEnd);

    const markerIndex = sectionText.indexOf(marker);
    if (markerIndex === -1) return [];

    const listStart = markerIndex + marker.length;
    const remainingText = sectionText.substring(listStart);

    const listEndMatches = [
      remainingText.search(/\n\n/),
      remainingText.search(/\n#/),
      remainingText.search(/\n\*/),
    ].filter(idx => idx !== -1);

    const listEnd = listEndMatches.length > 0 ? Math.min(...listEndMatches) : remainingText.length;
    const listText = remainingText.substring(0, listEnd);

    return listText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-') || line.startsWith('*'))
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .filter(line => line.length > 0);
  } catch (error) {
    console.error(`Error extracting list items for "${section}", marker "${marker}":`, error);
    return [];
  }
}
