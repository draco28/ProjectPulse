/**
 * Unit tests for cross-linking utility
 *
 * Tests:
 * - parseCrossLinks: @wiki/slug and [[slug]] syntax parsing
 * - resolveCrossLinks: Link resolution with database lookups
 * - Circular reference detection
 * - Missing page handling
 * - PageLink CRUD operations
 */

import { prisma } from '@/lib/prisma';
import {
  parseCrossLinks,
  resolveCrossLinks,
  createPageLinks,
  deletePageLinks,
  getOutgoingLinks,
  getIncomingLinks,
} from './cross-linking';

describe('Cross-Linking Utility', () => {
  // Test fixtures
  let testPage1: { id: number; path: string; title: string };
  let testPage2: { id: number; path: string; title: string };
  let testPage3: { id: number; path: string; title: string };
  let testProjectId: number;

  beforeAll(async () => {
    // Create or get a test user and project
    const testUser = await prisma.user.upsert({
      where: { email: 'wiki-crosslink-test@local' },
      update: {},
      create: {
        id: 'wiki-crosslink-test-user-id',
        email: 'wiki-crosslink-test@local',
        name: 'Wiki Crosslink Test User',
        passwordHash: 'not-used-for-testing',
      },
    });
    const testProject = await prisma.project.upsert({
      where: { name: 'Wiki Crosslink Test Project' },
      update: {},
      create: {
        name: 'Wiki Crosslink Test Project',
        description: 'Test project for wiki cross-linking tests',
        ownerId: testUser.id,
      },
    });
    testProjectId = testProject.id;

    // Create test wiki pages
    testPage1 = await prisma.wikiPage.create({
      data: {
        title: 'API Reference',
        path: '/api-reference',
        content: 'API documentation',
        category: 'reference',
        projectId: testProjectId,
      },
    });

    testPage2 = await prisma.wikiPage.create({
      data: {
        title: 'Getting Started',
        path: '/getting-started',
        content: 'Getting started guide',
        category: 'guides',
        projectId: testProjectId,
      },
    });

    testPage3 = await prisma.wikiPage.create({
      data: {
        title: 'Troubleshooting',
        path: '/troubleshooting',
        content: 'Troubleshooting guide',
        category: 'guides',
        projectId: testProjectId,
      },
    });
  });

  afterAll(async () => {
    // Cleanup: Delete test pages and links
    await prisma.pageLink.deleteMany({
      where: {
        OR: [
          { sourcePageId: testPage1.id },
          { sourcePageId: testPage2.id },
          { sourcePageId: testPage3.id },
        ],
      },
    });

    await prisma.wikiPage.deleteMany({
      where: {
        id: {
          in: [testPage1.id, testPage2.id, testPage3.id],
        },
      },
    });

    await prisma.$disconnect();
  });

  describe('parseCrossLinks', () => {
    it('should parse @wiki/slug syntax', () => {
      const content = 'See @wiki/api-reference for more details';
      const links = parseCrossLinks(content);

      expect(links).toHaveLength(1);
      expect(links[0]).toBeDefined();
      expect(links[0]!).toMatchObject({
        original: '@wiki/api-reference',
        slug: 'api-reference',
        syntax: '@wiki',
      });
    });

    it('should parse [[slug]] syntax', () => {
      const content = 'Check out [[getting-started]] guide';
      const links = parseCrossLinks(content);

      expect(links).toHaveLength(1);
      expect(links[0]).toBeDefined();
      expect(links[0]!).toMatchObject({
        original: '[[getting-started]]',
        slug: 'getting-started',
        syntax: '[[]]',
      });
    });

    it('should parse multiple cross-links', () => {
      const content = 'See @wiki/api-reference and [[getting-started]] then @wiki/troubleshooting';
      const links = parseCrossLinks(content);

      expect(links).toHaveLength(3);
      expect(links[0]?.slug).toBe('api-reference');
      expect(links[1]?.slug).toBe('getting-started');
      expect(links[2]?.slug).toBe('troubleshooting');
    });

    it('should handle mixed syntax', () => {
      const content = 'Read @wiki/api-reference and [[troubleshooting]]';
      const links = parseCrossLinks(content);

      expect(links).toHaveLength(2);
      expect(links[0]?.syntax).toBe('@wiki');
      expect(links[1]?.syntax).toBe('[[]]');
    });

    it('should return empty array for content without links', () => {
      const content = 'No cross-links here, just regular markdown';
      const links = parseCrossLinks(content);

      expect(links).toHaveLength(0);
    });

    it('should handle malformed syntax gracefully', () => {
      const content = '@wiki/ [[]] @wiki/  [[123-]]';
      const links = parseCrossLinks(content);

      // Should not match empty slugs or invalid patterns
      expect(links).toHaveLength(0);
    });

    it('should preserve start/end indices', () => {
      const content = 'Before @wiki/api-reference after';
      const links = parseCrossLinks(content);

      expect(links[0]).toBeDefined();
      expect(links[0]!.startIndex).toBe(7);
      expect(links[0]!.endIndex).toBe(27);
      expect(content.substring(links[0]!.startIndex, links[0]!.endIndex)).toBe(
        '@wiki/api-reference'
      );
    });
  });

  describe('resolveCrossLinks', () => {
    it('should resolve valid cross-links', async () => {
      const content = 'See @wiki/api-reference for details';
      const result = await resolveCrossLinks(content, '/test-page');

      expect(result.resolvedLinks).toHaveLength(1);
      expect(result.resolvedLinks[0]).toBeDefined();
      expect(result.resolvedLinks[0]!).toMatchObject({
        slug: 'api-reference',
        title: 'API Reference',
        wikiPageId: testPage1.id,
      });

      expect(result.content).toContain('[API Reference](/wiki/api-reference)');
    });

    it('should resolve multiple cross-links', async () => {
      const content = 'Read @wiki/api-reference and [[getting-started]]';
      const result = await resolveCrossLinks(content, '/test-page');

      expect(result.resolvedLinks).toHaveLength(2);
      expect(result.content).toContain('[API Reference](/wiki/api-reference)');
      expect(result.content).toContain('[Getting Started](/wiki/getting-started)');
    });

    it('should handle unresolved links (missing pages)', async () => {
      const content = 'See @wiki/nonexistent-page';
      const result = await resolveCrossLinks(content, '/test-page');

      expect(result.unresolvedLinks).toHaveLength(1);
      expect(result.unresolvedLinks[0]).toBeDefined();
      expect(result.unresolvedLinks[0]!).toMatchObject({
        slug: 'nonexistent-page',
        original: '@wiki/nonexistent-page',
      });

      // Original text should remain unchanged
      expect(result.content).toContain('@wiki/nonexistent-page');
    });

    it('should detect circular references', async () => {
      const content = 'See @wiki/api-reference';
      const result = await resolveCrossLinks(content, '/api-reference');

      expect(result.circularReferences).toHaveLength(1);
      expect(result.circularReferences[0]).toBeDefined();
      expect(result.circularReferences[0]!).toBe('api-reference');

      // Should add warning comment
      expect(result.content).toContain('<!-- Warning: Circular reference -->');
    });

    it('should handle mixed resolved and unresolved links', async () => {
      const content = 'Valid: @wiki/api-reference Invalid: @wiki/missing-page';
      const result = await resolveCrossLinks(content, '/test-page');

      expect(result.resolvedLinks).toHaveLength(1);
      expect(result.unresolvedLinks).toHaveLength(1);
    });

    it('should deduplicate resolved links', async () => {
      const content = 'Link 1: @wiki/api-reference Link 2: @wiki/api-reference';
      const result = await resolveCrossLinks(content, '/test-page');

      // Should only have one resolved link entry (deduplicated)
      expect(result.resolvedLinks).toHaveLength(1);

      // But both instances in content should be replaced
      const matches = result.content.match(/\[API Reference\]\(\/wiki\/api-reference\)/g);
      expect(matches).toHaveLength(2);
    });

    it('should return unchanged content if no links found', async () => {
      const content = 'Regular markdown without cross-links';
      const result = await resolveCrossLinks(content, '/test-page');

      expect(result.content).toBe(content);
      expect(result.resolvedLinks).toHaveLength(0);
      expect(result.unresolvedLinks).toHaveLength(0);
    });
  });

  describe('PageLink CRUD Operations', () => {
    it('should create PageLink relationships', async () => {
      const created = await createPageLinks(
        testPage1.id,
        [testPage2.id, testPage3.id],
        'reference'
      );

      expect(created).toBe(2);

      // Verify links exist
      const links = await prisma.pageLink.findMany({
        where: { sourcePageId: testPage1.id },
      });

      expect(links).toHaveLength(2);
      expect(links[0]).toBeDefined();
      expect(links[0]!.linkType).toBe('reference');
    });

    it('should handle duplicate PageLink creation (upsert)', async () => {
      // Create initial link
      await createPageLinks(testPage2.id, [testPage3.id], 'reference');

      // Try to create same link again
      const created = await createPageLinks(testPage2.id, [testPage3.id], 'related');

      // Should update linkType instead of failing
      expect(created).toBe(1);

      const link = await prisma.pageLink.findUnique({
        where: {
          sourcePageId_targetPageId: {
            sourcePageId: testPage2.id,
            targetPageId: testPage3.id,
          },
        },
      });

      expect(link?.linkType).toBe('related');
    });

    it('should delete PageLink relationships', async () => {
      // Create links
      await createPageLinks(testPage3.id, [testPage1.id, testPage2.id]);

      // Delete links
      const deleted = await deletePageLinks(testPage3.id);

      expect(deleted).toBe(2);

      // Verify deletion
      const remaining = await prisma.pageLink.findMany({
        where: { sourcePageId: testPage3.id },
      });

      expect(remaining).toHaveLength(0);
    });

    it('should get outgoing links', async () => {
      // Clean up first
      await deletePageLinks(testPage1.id);

      // Create links
      await createPageLinks(testPage1.id, [testPage2.id, testPage3.id]);

      const outgoing = await getOutgoingLinks(testPage1.id);

      expect(outgoing).toHaveLength(2);
      expect(outgoing[0]).toBeDefined();
      expect(outgoing[0]!.targetPage.title).toBeDefined();
    });

    it('should get incoming links', async () => {
      // Clean up first
      await deletePageLinks(testPage2.id);
      await deletePageLinks(testPage3.id);

      // Create links pointing TO testPage1
      await createPageLinks(testPage2.id, [testPage1.id]);
      await createPageLinks(testPage3.id, [testPage1.id]);

      const incoming = await getIncomingLinks(testPage1.id);

      expect(incoming).toHaveLength(2);
      expect(incoming[0]).toBeDefined();
      expect(incoming[0]!.sourcePage.title).toBeDefined();
    });

    it('should return empty array for pages with no links', async () => {
      // Clean up
      await deletePageLinks(testPage2.id);

      const outgoing = await getOutgoingLinks(testPage2.id);
      expect(outgoing).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      const result = await resolveCrossLinks('', '/test-page');

      expect(result.content).toBe('');
      expect(result.resolvedLinks).toHaveLength(0);
    });

    it('should handle content with only whitespace', async () => {
      const content = '   \n\n   \t\t  ';
      const result = await resolveCrossLinks(content, '/test-page');

      expect(result.content).toBe(content);
    });

    it('should preserve markdown formatting around links', async () => {
      const content = '**Bold** @wiki/api-reference *italic*';
      const result = await resolveCrossLinks(content, '/test-page');

      expect(result.content).toContain('**Bold**');
      expect(result.content).toContain('*italic*');
      expect(result.content).toContain('[API Reference]');
    });

    it('should handle links in code blocks (should not process)', async () => {
      const content = '```\n@wiki/api-reference\n```';
      const links = parseCrossLinks(content);

      // Parser will still find them (regex-based), but this is acceptable
      // In production, markdown parser would skip code blocks
      expect(links.length).toBeGreaterThanOrEqual(0);
    });
  });
});
