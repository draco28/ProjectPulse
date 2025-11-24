/**
 * @jest-environment node
 *
 * Knowledge Search Service Layer Unit Tests
 * Sprint 9 Phase 5.1: Test projectId filtering and validation
 */

import { semanticSearch, fullTextSearch, hybridSearch, SearchError } from '../search';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  },
}));

// Mock findRelatedKnowledgeItems (used by hybridSearch)
jest.mock('../graph', () => ({
  findRelatedKnowledgeItems: jest.fn(),
  GraphError: class GraphError extends Error {},
}));

// Mock embedding generation service
jest.mock('@/lib/embeddings', () => ({
  generateEmbedding: jest.fn(),
}));

import { findRelatedKnowledgeItems } from '../graph';
import { generateEmbedding } from '@/lib/embeddings';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockFindRelated = findRelatedKnowledgeItems as jest.MockedFunction<typeof findRelatedKnowledgeItems>;
const mockGenerateEmbedding = generateEmbedding as jest.MockedFunction<typeof generateEmbedding>;

describe('Knowledge Search Service Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock embedding generation to return correct structure
    mockGenerateEmbedding.mockResolvedValue({
      embedding: new Array(768).fill(0.1), // Mock 768-dimensional vector
      model: 'test-model',
      usage: { tokens: 10 },
    });
  });

  describe('semanticSearch', () => {
    it('requires projectId parameter', async () => {
      await expect(
        semanticSearch('test query', {
          projectId: 0, // Invalid
        })
      ).rejects.toThrow(SearchError);

      await expect(
        semanticSearch('test query', {
          projectId: -1, // Invalid
        })
      ).rejects.toThrow(SearchError);
    });

    it('validates projectId is positive integer', async () => {
      try {
        await semanticSearch('test query', {
          projectId: 0,
        });
        fail('Should have thrown SearchError');
      } catch (error) {
        expect(error).toBeInstanceOf(SearchError);
        expect((error as SearchError).code).toBe('INVALID_PROJECT_ID');
        expect((error as SearchError).statusCode).toBe(400);
      }
    });

    it('includes projectId in SQL WHERE clause', async () => {
      const mockResults = [
        {
          id: 1,
          title: 'Test Item',
          content: 'Test content',
          category: 'DevOps',
          tags: ['test'],
          distance: 0.2,
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockResults);

      await semanticSearch('test query', {
        projectId: 3,
        limit: 5,
        threshold: 0.7,
      });

      // Verify $queryRaw was called
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      
      // Get the SQL query string from the call
      const callArgs = mockPrisma.$queryRaw.mock.calls[0];
      const sqlQuery = String(callArgs[0]);
      
      // Verify projectId filter is in the query
      expect(sqlQuery).toContain('"projectId" = 3');
      expect(sqlQuery).toContain('"archivedAt" IS NULL');
    });

    it('filters by category when provided', async () => {
      const mockResults = [];
      mockPrisma.$queryRaw.mockResolvedValue(mockResults);

      await semanticSearch('test query', {
        projectId: 3,
        category: 'DevOps',
      });

      const callArgs = mockPrisma.$queryRaw.mock.calls[0];
      const sqlQuery = String(callArgs[0]);
      
      expect(sqlQuery).toContain('category =');
    });
  });

  describe('fullTextSearch', () => {
    it('requires projectId parameter', async () => {
      await expect(
        fullTextSearch('test query', {
          projectId: 0,
        })
      ).rejects.toThrow(SearchError);
    });

    it('includes projectId in SQL WHERE clause', async () => {
      const mockResults = [
        {
          id: 1,
          title: 'Test Item',
          content: 'Test content',
          category: 'DevOps',
          tags: ['test'],
          rank: 0.5,
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockResults);

      await fullTextSearch('test query', {
        projectId: 3,
        limit: 5,
      });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      
      const callArgs = mockPrisma.$queryRaw.mock.calls[0];
      const sqlQuery = String(callArgs[0]);
      
      expect(sqlQuery).toContain('"projectId" = 3');
      expect(sqlQuery).toContain('"archivedAt" IS NULL');
    });
  });

  describe('hybridSearch', () => {
    beforeEach(() => {
      // Mock both semantic and fulltext results
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          id: 1,
          title: 'Test Item',
          content: 'Test content',
          category: 'DevOps',
          tags: ['test'],
          distance: 0.2,
        },
      ]);
    });

    it('requires projectId parameter', async () => {
      await expect(
        hybridSearch('test query', {
          projectId: 0,
        })
      ).rejects.toThrow(SearchError);
    });

    it('passes projectId to both semantic and fulltext searches', async () => {
      await hybridSearch('test query', {
        projectId: 3,
        limit: 5,
      });

      // Should call $queryRaw twice (once for semantic, once for fulltext)
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
      
      // Both calls should include projectId filter
      mockPrisma.$queryRaw.mock.calls.forEach((call) => {
        const sqlQuery = String(call[0]);
        expect(sqlQuery).toContain('"projectId" = 3');
      });
    });

    it('passes projectId to findRelatedKnowledgeItems when includeRelated is true', async () => {
      const mockResults = [
        {
          id: 1,
          title: 'Test Item',
          content: 'Test content',
          category: 'DevOps',
          tags: ['test'],
          score: 0.8,
        },
      ];

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockResults) // Semantic results
        .mockResolvedValueOnce(mockResults); // Fulltext results

      mockFindRelated.mockResolvedValue([]);

      await hybridSearch('test query', {
        projectId: 3,
        limit: 5,
        includeRelated: true,
      });

      // Verify findRelatedKnowledgeItems was called with projectId
      expect(mockFindRelated).toHaveBeenCalledWith(
        1, // topResult.id
        expect.objectContaining({
          projectId: 3,
          maxDepth: 2,
          limit: 5,
          minStrength: 0.6,
        })
      );
    });

    it('does not call findRelatedKnowledgeItems when includeRelated is false', async () => {
      const mockResults = [
        {
          id: 1,
          title: 'Test Item',
          content: 'Test content',
          category: 'DevOps',
          tags: ['test'],
          score: 0.8,
        },
      ];

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockResults)
        .mockResolvedValueOnce(mockResults);

      await hybridSearch('test query', {
        projectId: 3,
        limit: 5,
        includeRelated: false,
      });

      expect(mockFindRelated).not.toHaveBeenCalled();
    });

    it('combines results using semantic (60%) and fulltext (40%) weights', async () => {
      const semanticResults = [
        { id: 1, title: 'Item 1', content: 'Content 1', category: 'DevOps', tags: [], distance: 0.2 },
      ];

      const fulltextResults = [
        { id: 1, title: 'Item 1', content: 'Content 1', category: 'DevOps', tags: [], rank: 0.8 },
      ];

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(semanticResults)
        .mockResolvedValueOnce(fulltextResults);

      const results = await hybridSearch('test query', {
        projectId: 3,
        limit: 5,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(1);
      
      // Score should be: (0.8 * 0.6) + (0.8 * 0.4) = 0.48 + 0.32 = 0.8
      // Semantic score = 1 - distance = 1 - 0.2 = 0.8
      expect(results[0].score).toBeCloseTo(0.8, 1);
    });
  });

  describe('SearchError', () => {
    it('includes error code and status code', () => {
      const error = new SearchError('Test error', 'TEST_CODE', 400);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error).toBeInstanceOf(Error);
    });
  });
});
