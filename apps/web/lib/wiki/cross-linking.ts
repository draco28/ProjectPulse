/**
 * Cross-linking utility for wiki pages
 *
 * Supports two syntaxes:
 * - @wiki/slug - ProjectPulse-specific syntax
 * - [[slug]] - Wiki-standard double-bracket syntax
 *
 * Features:
 * - Automatic link resolution (slug → title)
 * - Missing page handling (graceful degradation)
 * - Circular reference detection
 * - PageLink relationship tracking
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Represents a parsed cross-link found in wiki content
 */
export interface ParsedCrossLink {
  /** Original match in content (e.g., "@wiki/api-reference" or "[[api-reference]]") */
  original: string;
  /** Extracted slug (e.g., "api-reference") */
  slug: string;
  /** Syntax type used */
  syntax: '@wiki' | '[[]]';
  /** Start index in content */
  startIndex: number;
  /** End index in content */
  endIndex: number;
}

/**
 * Result of cross-link resolution
 */
export interface CrossLinkResolution {
  /** Processed content with links replaced */
  content: string;
  /** Successfully resolved links (for PageLink creation) */
  resolvedLinks: Array<{
    slug: string;
    title: string;
    wikiPageId: number;
  }>;
  /** Links that couldn't be resolved (missing pages) */
  unresolvedLinks: Array<{
    slug: string;
    original: string;
  }>;
  /** Detected circular references */
  circularReferences: string[];
}

/**
 * Parse all cross-links in wiki content
 *
 * @param content - Wiki markdown content
 * @returns Array of parsed cross-links
 *
 * @example
 * parseCrossLinks("See @wiki/api-docs and [[getting-started]]")
 * // Returns: [
 * //   { original: "@wiki/api-docs", slug: "api-docs", syntax: "@wiki", ... },
 * //   { original: "[[getting-started]]", slug: "getting-started", syntax: "[[]]", ... }
 * // ]
 */
export function parseCrossLinks(content: string): ParsedCrossLink[] {
  const links: ParsedCrossLink[] = [];

  // Regex for @wiki/slug syntax
  const atWikiRegex = /@wiki\/([a-z0-9-]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = atWikiRegex.exec(content)) !== null) {
    if (match[1]) {
      links.push({
        original: match[0],
        slug: match[1],
        syntax: '@wiki',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // Regex for [[slug]] syntax
  const doubleBracketRegex = /\[\[([a-z0-9-]+)\]\]/gi;

  while ((match = doubleBracketRegex.exec(content)) !== null) {
    if (match[1]) {
      links.push({
        original: match[0],
        slug: match[1],
        syntax: '[[]]',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // Sort by startIndex to process in order
  return links.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Resolve cross-links in wiki content
 *
 * Replaces @wiki/slug and [[slug]] with proper markdown links [Title](/wiki/slug)
 *
 * @param content - Wiki markdown content with cross-links
 * @param sourcePagePath - Path of the source page (for circular reference detection)
 * @param projectId - Project ID (for multi-tenancy, optional)
 * @returns Resolution result with processed content and metadata
 *
 * @example
 * await resolveCrossLinks("See @wiki/api-docs", "/getting-started")
 * // Returns: {
 * //   content: "See [API Documentation](/wiki/api-docs)",
 * //   resolvedLinks: [{ slug: "api-docs", title: "API Documentation", wikiPageId: 5 }],
 * //   unresolvedLinks: [],
 * //   circularReferences: []
 * // }
 */
export async function resolveCrossLinks(
  content: string,
  sourcePagePath: string,
  projectId?: number
): Promise<CrossLinkResolution> {
  // Parse all cross-links
  const parsedLinks = parseCrossLinks(content);

  if (parsedLinks.length === 0) {
    return {
      content,
      resolvedLinks: [],
      unresolvedLinks: [],
      circularReferences: [],
    };
  }

  // Extract unique slugs
  const uniqueSlugs = Array.from(new Set(parsedLinks.map((link) => link.slug)));

  // Query database for wiki pages matching slugs
  const wikiPages = await prisma.wikiPage.findMany({
    where: {
      path: {
        in: uniqueSlugs.map((slug) => `/${slug}`), // Add leading slash for path matching
      },
    },
    select: {
      id: true,
      title: true,
      path: true,
    },
  });

  // Create slug → page mapping
  const slugToPage = new Map<string, (typeof wikiPages)[0]>();
  wikiPages.forEach((page) => {
    const slug = page.path.replace(/^\//, ''); // Remove leading slash
    slugToPage.set(slug, page);
  });

  // Detect circular references
  const circularReferences: string[] = [];
  const sourceSlug = sourcePagePath.replace(/^\//, '');

  for (const slug of uniqueSlugs) {
    if (slug === sourceSlug) {
      circularReferences.push(slug);
    }
  }

  // Process content with replacements (process in reverse to maintain indices)
  let processedContent = content;
  const resolvedLinks: CrossLinkResolution['resolvedLinks'] = [];
  const unresolvedLinks: CrossLinkResolution['unresolvedLinks'] = [];

  // Process links in reverse order to preserve indices
  for (let i = parsedLinks.length - 1; i >= 0; i--) {
    const link = parsedLinks[i];
    if (!link) continue; // Safety check

    const page = slugToPage.get(link.slug);

    if (page) {
      // Circular reference check
      if (circularReferences.includes(link.slug)) {
        // Keep original text but add warning comment
        const replacement = `${link.original} <!-- Warning: Circular reference -->`;
        processedContent =
          processedContent.slice(0, link.startIndex) +
          replacement +
          processedContent.slice(link.endIndex);
        continue;
      }

      // Replace with proper markdown link
      const replacement = `[${page.title}](/wiki${page.path})`;
      processedContent =
        processedContent.slice(0, link.startIndex) +
        replacement +
        processedContent.slice(link.endIndex);

      // Track resolved link (avoid duplicates)
      if (!resolvedLinks.find((r) => r.slug === link.slug)) {
        resolvedLinks.push({
          slug: link.slug,
          title: page.title,
          wikiPageId: page.id,
        });
      }
    } else {
      // Page not found - leave original text and log
      unresolvedLinks.push({
        slug: link.slug,
        original: link.original,
      });
    }
  }

  return {
    content: processedContent,
    resolvedLinks,
    unresolvedLinks,
    circularReferences,
  };
}

/**
 * Create PageLink relationships in database
 *
 * @param sourcePageId - ID of the source wiki page
 * @param targetPageIds - IDs of target wiki pages
 * @param linkType - Type of link (default: 'reference')
 * @returns Number of links created
 *
 * @example
 * await createPageLinks(5, [10, 12, 15], 'reference')
 * // Creates 3 PageLink records
 */
export async function createPageLinks(
  sourcePageId: number,
  targetPageIds: number[],
  linkType: string = 'reference'
): Promise<number> {
  if (targetPageIds.length === 0) {
    return 0;
  }

  // Use upsert to handle duplicate prevention (unique constraint exists)
  const results = await Promise.allSettled(
    targetPageIds.map((targetPageId) =>
      prisma.pageLink.upsert({
        where: {
          sourcePageId_targetPageId: {
            sourcePageId,
            targetPageId,
          },
        },
        update: {
          linkType, // Update link type if already exists
        },
        create: {
          sourcePageId,
          targetPageId,
          linkType,
        },
      })
    )
  );

  // Count successful creations
  const successCount = results.filter((r) => r.status === 'fulfilled').length;
  return successCount;
}

/**
 * Remove all PageLink relationships for a source page
 *
 * Used before recreating links (on wiki page update)
 *
 * @param sourcePageId - ID of the source wiki page
 * @returns Number of links deleted
 */
export async function deletePageLinks(sourcePageId: number): Promise<number> {
  const result = await prisma.pageLink.deleteMany({
    where: {
      sourcePageId,
    },
  });

  return result.count;
}

/**
 * Get all outgoing links for a wiki page
 *
 * @param sourcePageId - ID of the source wiki page
 * @returns Array of linked pages with metadata
 */
export async function getOutgoingLinks(sourcePageId: number) {
  return prisma.pageLink.findMany({
    where: {
      sourcePageId,
    },
    include: {
      targetPage: {
        select: {
          id: true,
          title: true,
          path: true,
          excerpt: true,
        },
      },
    },
  });
}

/**
 * Get all incoming links for a wiki page
 *
 * @param targetPageId - ID of the target wiki page
 * @returns Array of pages linking to this page
 */
export async function getIncomingLinks(targetPageId: number) {
  return prisma.pageLink.findMany({
    where: {
      targetPageId,
    },
    include: {
      sourcePage: {
        select: {
          id: true,
          title: true,
          path: true,
          excerpt: true,
        },
      },
    },
  });
}
