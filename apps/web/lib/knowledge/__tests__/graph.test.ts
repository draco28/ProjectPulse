/**
 * @jest-environment node
 *
 * Knowledge Graph Service Layer Unit Tests
 * Sprint 9 Phase 5.1: Test projectId filtering in graph traversal
 */

import { findRelatedKnowledgeItems, GraphError } from '../graph';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    knowledgeItem: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Knowledge Graph Service Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findRelatedKnowledgeItems', () => {
    it('requires projectId parameter', async () => {
      await expect(
        findRelatedKnowledgeItems(1, {
          projectId: 0, // Invalid
          maxDepth: 2,
        })
      ).rejects.toThrow(GraphError);

      await expect(
        findRelatedKnowledgeItems(1, {
          projectId: -1, // Invalid
          maxDepth: 2,
        })
      ).rejects.toThrow(GraphError);
    });

    it('validates projectId is positive integer', async () => {
      try {
        await findRelatedKnowledgeItems(1, {
          projectId: 0,
          maxDepth: 2,
        });
        fail('Should have thrown GraphError');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphError);
        expect((error as GraphError).code).toBe('INVALID_PROJECT_ID');
        expect((error as GraphError).statusCode).toBe(400);
      }
    });

    it('verifies source item belongs to projectId', async () => {
      // Mock source item not found
      mockPrisma.knowledgeItem.findFirst.mockResolvedValue(null);

      await expect(
        findRelatedKnowledgeItems(1, {
          projectId: 3,
          maxDepth: 2,
        })
      ).rejects.toThrow(GraphError);

      // Verify findFirst was called with projectId filter
      expect(mockPrisma.knowledgeItem.findFirst).toHaveBeenCalledWith({
        where: { id: 1, projectId: 3 },
        select: { id: true, title: true },
      });
    });

    it('includes projectId in 1-hop SQL WHERE clause', async () => {
      // Mock source item found
      mockPrisma.knowledgeItem.findFirst.mockResolvedValue({
        id: 1,
        title: 'Source Item',
      });

      // Mock 1-hop results
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          related_id: 2,
          related_title: 'Related Item',
          strength: 0.8,
          relationship_type: 'references',
        },
      ]);

      // Mock intermediate items (empty for maxDepth=1)
      mockPrisma.knowledgeItem.findMany.mockResolvedValue([]);

      await findRelatedKnowledgeItems(1, {
        projectId: 3,
        maxDepth: 1,
        limit: 10,
      });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      
      const callArgs = mockPrisma.$queryRaw.mock.calls[0];
      const sqlQuery = String(callArgs[0]);
      
      // Verify projectId filter in 1-hop query
      expect(sqlQuery).toContain('ki."projectId" = 3');
      expect(sqlQuery).toContain('ki."archivedAt" IS NULL');
    });

    it('includes projectId in 2-hop SQL WHERE clause', async () => {
      // Mock source item found
      mockPrisma.knowledgeItem.findFirst.mockResolvedValue({
        id: 1,
        title: 'Source Item',
      });

      // Mock 1-hop results
      const oneHopResults = [
        {
          related_id: 2,
          related_title: 'Related Item 1',
          strength: 0.8,
          relationship_type: 'references',
        },
      ];

      // Mock 2-hop results
      const twoHopResults = [
        {
          related_id: 3,
          related_title: 'Related Item 2',
          strength: 0.6,
          relationship_type: 'references',
        },
      ];

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(oneHopResults) // 1-hop
        .mockResolvedValueOnce(twoHopResults); // 2-hop

      // Mock intermediate items for 2-hop path
      mockPrisma.knowledgeItem.findMany.mockResolvedValue([
        { id: 2, title: 'Intermediate' },
      ]);

      await findRelatedKnowledgeItems(1, {
        projectId: 3,
        maxDepth: 2,
        limit: 10,
      });

      // Should call $queryRaw twice (1-hop + 2-hop)
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
      
      // Both calls should include projectId filter
      mockPrisma.$queryRaw.mock.calls.forEach((call) => {
        const sqlQuery = String(call[0]);
        expect(sqlQuery).toContain('ki."projectId" = 3');
        expect(sqlQuery).toContain('ki."archivedAt" IS NULL');
      });
    });

    it('filters intermediate items by projectId', async () => {
      mockPrisma.knowledgeItem.findFirst.mockResolvedValue({
        id: 1,
        title: 'Source Item',
      });

      mockPrisma.$queryRaw
        .mockResolvedValueOnce([
          {
            related_id: 2,
            related_title: 'Related 1',
            strength: 0.8,
            relationship_type: 'references',
          },
        ])
        .mockResolvedValueOnce([
          {
            related_id: 3,
            related_title: 'Related 2',
            strength: 0.6,
            relationship_type: 'references',
            intermediate_id: 2,
            intermediate_title: 'Intermediate',
          },
        ]);

      mockPrisma.knowledgeItem.findMany.mockResolvedValue([
        { id: 2, title: 'Intermediate' },
      ]);

      await findRelatedKnowledgeItems(1, {
        projectId: 3,
        maxDepth: 2,
        limit: 10,
        includePath: true,
      });

      // Verify findMany was called with projectId filter for intermediates
      expect(mockPrisma.knowledgeItem.findMany).toHaveBeenCalledWith({
        where: { id: { in: [2] }, projectId: 3 },
        select: { id: true, title: true },
      });
    });

    it('filters by relationship types when provided', async () => {
      mockPrisma.knowledgeItem.findFirst.mockResolvedValue({
        id: 1,
        title: 'Source Item',
      });

      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.knowledgeItem.findMany.mockResolvedValue([]);

      await findRelatedKnowledgeItems(1, {
        projectId: 3,
        maxDepth: 1,
        relationshipTypes: ['references', 'mentions'],
      });

      const callArgs = mockPrisma.$queryRaw.mock.calls[0];
      const sqlQuery = String(callArgs[0]);
      
      expect(sqlQuery).toContain('kr."type" IN');
    });

    it('filters by minimum strength', async () => {
      mockPrisma.knowledgeItem.findFirst.mockResolvedValue({
        id: 1,
        title: 'Source Item',
      });

      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.knowledgeItem.findMany.mockResolvedValue([]);

      await findRelatedKnowledgeItems(1, {
        projectId: 3,
        maxDepth: 1,
        minStrength: 0.7,
      });

      const callArgs = mockPrisma.$queryRaw.mock.calls[0];
      const sqlQuery = String(callArgs[0]);
      
      expect(sqlQuery).toContain('kr."strength" >=');
    });

    it('returns empty array when source item not in projectId', async () => {
      mockPrisma.knowledgeItem.findFirst.mockResolvedValue(null);

      await expect(
        findRelatedKnowledgeItems(1, {
          projectId: 3,
          maxDepth: 2,
        })
      ).rejects.toThrow('Source knowledge item not found or not in this project');
    });

    it('prevents cross-project data leakage', async () => {
      // Source item in project 3
      mockPrisma.knowledgeItem.findFirst.mockResolvedValue({
        id: 1,
        title: 'Source Item',
      });

      // Mock results (would be filtered by projectId in SQL)
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.knowledgeItem.findMany.mockResolvedValue([]);

      await findRelatedKnowledgeItems(1, {
        projectId: 3,
        maxDepth: 2,
      });

      // Verify all queries include projectId filter
      expect(mockPrisma.knowledgeItem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 3 }),
        })
      );

      mockPrisma.$queryRaw.mock.calls.forEach((call) => {
        const sqlQuery = String(call[0]);
        expect(sqlQuery).toContain('ki."projectId" = 3');
      });
    });
  });

  describe('GraphError', () => {
    it('includes error code and status code', () => {
      const error = new GraphError('Test error', 'TEST_CODE', 400);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error).toBeInstanceOf(Error);
    });
  });
});
