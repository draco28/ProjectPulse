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

  // Parse Phase headers: ### Phase A: Name (Weeks X-Y, Sprints X-Y)
  const phaseRegex = /^### (Phase [A-Z]: .+?) \(Weeks (\d+)-(\d+), Sprints (\d+)-(\d+)\)/gm;

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

    // Get phase content substring
    const phaseStartIndex = phaseMatch.index;
    const nextPhaseMatch = markdown.substring(phaseStartIndex + 1).search(/^### Phase /m);
    const phaseEndIndex = nextPhaseMatch === -1
      ? markdown.length
      : phaseStartIndex + 1 + nextPhaseMatch;
    const phaseContent = markdown.substring(phaseStartIndex, phaseEndIndex);

    // Parse Sprint headers with multiple fallback patterns for flexibility
    // Pattern 1 (Primary): ### Sprint N (Weeks X-Y): Name - XX points
    // Pattern 2 (Fallback): ### Sprint N: Name (Weeks X-Y) - no points, weeks after name
    // Pattern 3 (Fallback): ### Sprint N (Weeks X-Y): Name - no points at end
    
    const sprintPatterns = [
      // Pattern 1: ### Sprint 1 (Weeks 1-2): Database Setup - 20 points (PRIMARY)
      new RegExp(
        `### Sprint ([${sprintStart}-${sprintEnd}]) \\(Weeks ([\\d-]+)\\): (.+?) - (\\d+) points`,
        'g'
      ),
      // Pattern 2: ### Sprint 1: Database Setup (Weeks 1-2) - 20 points
      new RegExp(
        `### Sprint ([${sprintStart}-${sprintEnd}]): (.+?) \\(Weeks ([\\d-]+)\\)(?: - (\\d+) points)?`,
        'g'
      ),
      // Pattern 3: ### Sprint 1 (Weeks 1-2): Database Setup (no points)
      new RegExp(
        `### Sprint ([${sprintStart}-${sprintEnd}]) \\(Weeks ([\\d-]+)\\): (.+?)$`,
        'gm'
      ),
    ];

    // Try ALL patterns and collect matches from all of them (not just first matching pattern)
    const sprintMatches: Array<{
      sprintNum: string;
      weeks: string;
      sprintName: string;
      storyPoints: number;
    }> = [];

    for (const pattern of sprintPatterns) {
      pattern.lastIndex = 0; // Reset regex state
      let sprintMatch;
      
      while ((sprintMatch = pattern.exec(phaseContent)) !== null) {
        // Extract fields based on capture groups (different patterns have different orders)
        let sprintNum: string;
        let weeks: string;
        let sprintName: string;
        let storyPoints: number;

        if (sprintMatch[4] && sprintMatch[4].match(/^\d+$/)) {
          // Pattern 1 or 2 with points: Sprint, Weeks/Name (order varies), Points
          if (sprintMatch[2]?.match(/^\d+-\d+$/)) {
            // Pattern 1: Sprint, Weeks, Name, Points
            sprintNum = sprintMatch[1] ?? '1';
            weeks = sprintMatch[2] ?? 'Weeks 1-2';
            sprintName = sprintMatch[3] ?? 'Unknown Sprint';
            storyPoints = parseInt(sprintMatch[4] ?? '0', 10);
          } else {
            // Pattern 2: Sprint, Name, Weeks, Points
            sprintNum = sprintMatch[1] ?? '1';
            sprintName = sprintMatch[2] ?? 'Unknown Sprint';
            weeks = sprintMatch[3] ?? 'Weeks 1-2';
            storyPoints = parseInt(sprintMatch[4] ?? '0', 10);
          }
        } else {
          // Pattern 3 (no points): Sprint, Weeks, Name
          sprintNum = sprintMatch[1] ?? '1';
          weeks = sprintMatch[2] ?? 'Weeks 1-2';
          sprintName = sprintMatch[3]?.trim() ?? 'Unknown Sprint';
          storyPoints = 0; // Default when no points specified
        }

        // Check if we already added this sprint (avoid duplicates from multiple patterns)
        const isDuplicate = sprintMatches.some(m => m.sprintNum === sprintNum);
        if (!isDuplicate) {
          sprintMatches.push({ sprintNum, weeks, sprintName, storyPoints });
        }
      }
      
      // Note: Continue to try all patterns to catch different sprint header formats in same phase
    }

    // Convert matches to sprint objects
    for (const match of sprintMatches) {
      const { sprintNum, weeks, sprintName, storyPoints } = match;

      // Calculate sprint duration with null safety
      const weekParts = weeks.split('-');
      const wStart = parseInt(weekParts[0]?.replace(/Weeks?\s*/, '') ?? '1', 10);
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
