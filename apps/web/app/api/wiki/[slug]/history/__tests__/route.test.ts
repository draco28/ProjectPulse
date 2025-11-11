/**
 * @jest-environment node
 *
 * Wiki revision history API route tests
 * Tests pagination, cursor-based navigation, and error handling
 */

// Mock Prisma before importing the route
jest.mock('@/lib/prisma', () => ({
  prisma: {
    wikiPage: {
      findUnique: jest.fn(),
    },
    wikiRevision: {
      findMany: jest.fn(),
    },
  },
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET } from '../route';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Mock revision data
const mockRevisions = [
  {
    version: 3,
    title: 'Updated Title',
    excerpt: 'Updated excerpt',
    createdBy: 'Jane Doe',
    createdByType: 'human',
    createdAt: new Date('2025-11-11T16:00:00Z'),
    diffSummary: 'Updated content and formatting',
  },
  {
    version: 2,
    title: 'Second Version',
    excerpt: 'Second excerpt',
    createdBy: 'MCP Agent',
    createdByType: 'agent',
    createdAt: new Date('2025-11-11T15:00:00Z'),
    diffSummary: 'Added new section',
  },
  {
    version: 1,
    title: 'Initial Title',
    excerpt: 'Initial excerpt',
    createdBy: 'John Doe',
    createdByType: 'human',
    createdAt: new Date('2025-11-11T14:00:00Z'),
    diffSummary: null,
  },
];

describe('GET /api/wiki/[slug]/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success cases', () => {
    it('should return revision history for existing wiki page', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.wikiRevision.findMany.mockResolvedValueOnce(mockRevisions);

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history');
      const response = await GET(request, { params: { slug: 'getting-started' } });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(3);
      expect(body.data[0].version).toBe(3);
      expect(body.pagination).toEqual({
        limit: 10,
        nextCursor: null,
        hasMore: false,
      });
    });

    it('should normalize slug path with leading slash', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.wikiRevision.findMany.mockResolvedValueOnce(mockRevisions);

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history');
      await GET(request, { params: { slug: 'getting-started' } });

      expect(mockPrisma.wikiPage.findUnique).toHaveBeenCalledWith({
        where: { path: '/getting-started' },
        select: { id: true },
      });
    });

    it('should accept slug with leading slash', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.wikiRevision.findMany.mockResolvedValueOnce(mockRevisions);

      const request = new NextRequest('http://localhost/api/wiki//getting-started/history');
      await GET(request, { params: { slug: '/getting-started' } });

      expect(mockPrisma.wikiPage.findUnique).toHaveBeenCalledWith({
        where: { path: '/getting-started' },
        select: { id: true },
      });
    });

    it('should return revisions in descending order by version', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.wikiRevision.findMany.mockResolvedValueOnce(mockRevisions);

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history');
      await GET(request, { params: { slug: 'getting-started' } });

      expect(mockPrisma.wikiRevision.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { version: 'desc' },
        })
      );
    });
  });

  describe('Pagination', () => {
    it('should use default limit of 10 when not specified', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.wikiRevision.findMany.mockResolvedValueOnce(mockRevisions);

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history');
      await GET(request, { params: { slug: 'getting-started' } });

      expect(mockPrisma.wikiRevision.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should accept custom limit parameter', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.wikiRevision.findMany.mockResolvedValueOnce(mockRevisions.slice(0, 5));

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history?limit=5');
      await GET(request, { params: { slug: 'getting-started' } });

      expect(mockPrisma.wikiRevision.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it('should enforce maximum limit of 50', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.wikiRevision.findMany.mockResolvedValueOnce(mockRevisions);

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history?limit=100');
      await GET(request, { params: { slug: 'getting-started' } });

      expect(mockPrisma.wikiRevision.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it('should enforce minimum limit of 1', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.wikiRevision.findMany.mockResolvedValueOnce(mockRevisions.slice(0, 1));

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history?limit=-5');
      await GET(request, { params: { slug: 'getting-started' } });

      expect(mockPrisma.wikiRevision.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
        })
      );
    });

    it('should handle invalid limit parameter', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.wikiRevision.findMany.mockResolvedValueOnce(mockRevisions);

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history?limit=invalid');
      await GET(request, { params: { slug: 'getting-started' } });

      expect(mockPrisma.wikiRevision.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10, // Falls back to default
        })
      );
    });

    it('should return nextCursor when more results available', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);

      // Return exactly 3 results when limit is 3
      const limitedRevisions = mockRevisions.slice(0, 3);
      mockPrisma.wikiRevision.findMany.mockResolvedValueOnce(limitedRevisions);

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history?limit=3');
      const response = await GET(request, { params: { slug: 'getting-started' } });
      const body = await response.json();

      expect(body.pagination.hasMore).toBe(true);
      expect(body.pagination.nextCursor).toBe(limitedRevisions[2].version);
    });

    it('should handle cursor-based pagination', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.wikiRevision.findMany.mockResolvedValueOnce(mockRevisions.slice(1));

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history?cursor=3');
      await GET(request, { params: { slug: 'getting-started' } });

      expect(mockPrisma.wikiRevision.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 1,
          cursor: {
            wikiPageId_version: {
              wikiPageId: 1,
              version: 3,
            },
          },
        })
      );
    });

    it('should not skip when no cursor provided', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.wikiRevision.findMany.mockResolvedValueOnce(mockRevisions);

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history');
      await GET(request, { params: { slug: 'getting-started' } });

      expect(mockPrisma.wikiRevision.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          cursor: undefined,
        })
      );
    });
  });

  describe('Error cases', () => {
    it('should return 404 when wiki page not found', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/wiki/nonexistent/history');
      const response = await GET(request, { params: { slug: 'nonexistent' } });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('Wiki page not found');
    });

    it('should return 500 when database query fails', async () => {
      mockPrisma.wikiPage.findUnique.mockRejectedValueOnce(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history');
      const response = await GET(request, { params: { slug: 'getting-started' } });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch wiki history');
    });

    it('should return 500 when revision query fails', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.wikiRevision.findMany.mockRejectedValueOnce(new Error('Query error'));

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history');
      const response = await GET(request, { params: { slug: 'getting-started' } });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch wiki history');
    });
  });

  describe('Data selection', () => {
    it('should return only required revision fields', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.wikiRevision.findMany.mockResolvedValueOnce(mockRevisions);

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history');
      await GET(request, { params: { slug: 'getting-started' } });

      expect(mockPrisma.wikiRevision.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            version: true,
            title: true,
            excerpt: true,
            createdBy: true,
            createdByType: true,
            createdAt: true,
            diffSummary: true,
          },
        })
      );
    });

    it('should handle revisions with null diffSummary', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.wikiRevision.findMany.mockResolvedValueOnce([mockRevisions[2]]); // Initial version has null diffSummary

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history');
      const response = await GET(request, { params: { slug: 'getting-started' } });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data[0].diffSummary).toBeNull();
    });

    it('should return empty array when no revisions exist', async () => {
      mockPrisma.wikiPage.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.wikiRevision.findMany.mockResolvedValueOnce([]);

      const request = new NextRequest('http://localhost/api/wiki/getting-started/history');
      const response = await GET(request, { params: { slug: 'getting-started' } });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual([]);
      expect(body.pagination.hasMore).toBe(false);
      expect(body.pagination.nextCursor).toBeNull();
    });
  });
});
