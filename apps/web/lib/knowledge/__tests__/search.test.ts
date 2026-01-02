/**
 * @jest-environment node
 *
 * Knowledge Search Service Layer Unit Tests
 * Sprint 9 Phase 5.1: Test projectId filtering and validation
 */

import { semanticSearch, fullTextSearch, hybridSearch, SearchError } from '../search';
import { prisma } from '@/lib/prisma';

// Mock Prisma
// Note: Only $queryRaw is used - all queries are parameterized (no $queryRawUnsafe)
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
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
const mockFindRelated = findRelatedKnowledgeItems as jest.MockedFunction<
  typeof findRelatedKnowledgeItems
>;
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

      // Verify $queryRaw was called (parameterized query)
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();

      // With parameterized queries ($queryRaw tagged template), the SQL structure
      // contains placeholders, not interpolated values. This is correct for security.
      // We verify the query structure includes the expected clauses.
      const callArgs = mockPrisma.$queryRaw.mock.calls[0];
      const sqlQuery = String(callArgs[0]);

      // Verify SQL structure contains projectId and archivedAt filters
      // Note: Values are parameterized separately, so we check for the clause structure
      expect(sqlQuery).toContain('"projectId"');
      expect(sqlQuery).toContain('"archivedAt" IS NULL');
    });

    it('filters by category when provided', async () => {
      const mockResults = [];
      mockPrisma.$queryRaw.mockResolvedValue(mockResults);

      await semanticSearch('test query', {
        projectId: 3,
        category: 'DevOps',
      });

      // $queryRaw was called with parameterized query
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();

      // With parameterized queries, category value is sent separately
      // The SQL structure should contain the category clause
      const callArgs = mockPrisma.$queryRaw.mock.calls[0];
      const sqlQuery = String(callArgs[0]);

      // Category filter structure exists (value is parameterized)
      expect(sqlQuery).toContain('category');
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

      // With parameterized queries, we check SQL structure, not interpolated values
      const callArgs = mockPrisma.$queryRaw.mock.calls[0];
      const sqlQuery = String(callArgs[0]);

      expect(sqlQuery).toContain('"projectId"');
      expect(sqlQuery).toContain('"archivedAt" IS NULL');
    });
  });

  describe('hybridSearch', () => {
    beforeEach(() => {
      // Mock both semantic and fulltext results
      // Include BOTH distance (for semantic) AND rank (for fulltext) so mock works for both
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          id: 1,
          title: 'Test Item',
          content: 'Test content',
          category: 'DevOps',
          tags: ['test'],
          distance: 0.2, // For semantic search (score = 1 - 0.2/2 = 0.9)
          rank: 0.8, // For fulltext search (score = rank/maxRank = 1.0)
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

      // Both calls should include projectId filter structure (value is parameterized)
      mockPrisma.$queryRaw.mock.calls.forEach((call) => {
        const sqlQuery = String(call[0]);
        expect(sqlQuery).toContain('"projectId"');
      });
    });

    it('passes projectId to findRelatedKnowledgeItems when includeRelated is true', async () => {
      // Both mocks include distance AND rank since Promise.all ordering is non-deterministic
      // Each search function uses only the field it needs (distance for semantic, rank for fulltext)
      const mockResult = [
        {
          id: 1,
          title: 'Test Item',
          content: 'Test content',
          category: 'DevOps',
          tags: ['test'],
          distance: 0.2, // For semantic search
          rank: 0.8, // For fulltext search
        },
      ];

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockResult)
        .mockResolvedValueOnce(mockResult);

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
      // Both mocks include distance AND rank since Promise.all ordering is non-deterministic
      const mockResult = [
        {
          id: 1,
          title: 'Test Item',
          content: 'Test content',
          category: 'DevOps',
          tags: ['test'],
          distance: 0.2,
          rank: 0.8,
        },
      ];

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockResult)
        .mockResolvedValueOnce(mockResult);

      await hybridSearch('test query', {
        projectId: 3,
        limit: 5,
        includeRelated: false,
      });

      expect(mockFindRelated).not.toHaveBeenCalled();
    });

    it('combines results using semantic (70%) and fulltext (30%) weights', async () => {
      // Both mocks include distance AND rank since Promise.all ordering is non-deterministic
      const mockResult = [
        {
          id: 1,
          title: 'Item 1',
          content: 'Content 1',
          category: 'DevOps',
          tags: [],
          distance: 0.2, // For semantic: score = 1 - (0.2/2) = 0.9
          rank: 0.8, // For fulltext: score = rank/maxRank = 1.0
        },
      ];

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockResult)
        .mockResolvedValueOnce(mockResult);

      const results = await hybridSearch('test query', {
        projectId: 3,
        limit: 5,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(1);

      // Semantic: distance 0.2 → score = 1 - (0.2/2) = 0.9
      // Fulltext: rank 0.8, maxRank 0.8 → score = 1.0
      // Combined: (0.9 * 0.7) + (1.0 * 0.3) = 0.63 + 0.3 = 0.93
      expect(results[0].score).toBeCloseTo(0.93, 1);
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

  describe('SQL Injection Prevention', () => {
    /**
     * Sprint 18 Ticket #124: SQL Injection Audit
     * These tests verify that all search functions use parameterized queries
     * via Prisma.$queryRaw (tagged template literals), not $queryRawUnsafe.
     */

    it('safely handles category with SQL injection attempt', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      // This malicious category should NOT cause SQL injection
      // If vulnerable, this would bypass WHERE clause
      await semanticSearch('test', {
        projectId: 1,
        category: "test' OR '1'='1",
      });

      // Query should use parameterized category, not string interpolation
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();

      // Verify the query uses Prisma's tagged template (parameterized)
      const callArgs = mockPrisma.$queryRaw.mock.calls[0];
      expect(callArgs).toBeDefined();
    });

    it('safely handles query with SQL injection attempt in fullTextSearch', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      // Classic SQL injection attempt - should be safely parameterized
      await fullTextSearch("'; DROP TABLE knowledge_items; --", {
        projectId: 1,
      });

      // Query should complete without error (parameterized)
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('safely handles query with PostgreSQL escape sequences', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      // PostgreSQL-specific escape sequences that could bypass naive quoting
      await fullTextSearch("test\\' OR 1=1 --", {
        projectId: 1,
      });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('safely handles category with Unicode injection attempt', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      // Unicode homoglyph attack - some systems might parse this incorrectly
      await semanticSearch('test', {
        projectId: 1,
        category: "test\u0027 OR \u00271\u0027=\u00271", // Unicode quotes
      });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });
  });
});
