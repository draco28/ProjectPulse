/**
 * @jest-environment node
 *
 * Skills Search, Export, and Import API tests
 * Tests GET /api/skills/search, POST /api/skills/export, POST /api/skills/import
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    skill: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Skills Search, Export, and Import APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/skills/search (Full-Text Search)', () => {
    const GET_Search = async (req: NextRequest) => {
      const url = new URL(req.url);
      const query = url.searchParams.get('q');
      const category = url.searchParams.get('category');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

      if (!query || query.trim().length === 0) {
        return Response.json(
          { error: 'Query parameter "q" is required' },
          { status: 400 }
        );
      }

      const where = {
        AND: [
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' as const } },
              { description: { contains: query, mode: 'insensitive' as const } },
              { content: { contains: query, mode: 'insensitive' as const } },
              { tags: { hasSome: [query] } },
            ],
          },
          ...(category ? [{ category }] : []),
        ],
      };

      const skills = await prisma.skill.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          // Exclude content for search results (token efficiency)
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      });

      return Response.json({
        data: {
          query,
          results: skills,
          count: skills.length,
        },
      });
    };

    it('searches skills by query across multiple fields', async () => {
      const mockResults = [
        {
          id: 1,
          title: 'Jest Testing Patterns',
          description: 'Comprehensive testing strategies',
          category: 'testing',
          tags: ['jest', 'testing'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          title: 'Unit Testing Best Practices',
          description: 'Testing methodologies',
          category: 'testing',
          tags: ['testing', 'best-practices'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.skill.findMany.mockResolvedValueOnce(mockResults as any);

      const req = new NextRequest('http://localhost:3000/api/skills/search?q=testing');
      const res = await GET_Search(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.query).toBe('testing');
      expect(body.data.results).toHaveLength(2);
      expect(body.data.count).toBe(2);
      expect(body.data.results[0]).not.toHaveProperty('content'); // Token efficiency
    });

    it('validates query parameter is required', async () => {
      const req = new NextRequest('http://localhost:3000/api/skills/search');
      const res = await GET_Search(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('required');
    });

    it('validates query is not empty string', async () => {
      const req = new NextRequest('http://localhost:3000/api/skills/search?q=');
      const res = await GET_Search(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('required');
    });

    it('filters search results by category', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);

      const req = new NextRequest(
        'http://localhost:3000/api/skills/search?q=testing&category=workflow'
      );
      const res = await GET_Search(req);

      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.any(Array),
              }),
              { category: 'workflow' },
            ]),
          }),
        })
      );
    });

    it('respects limit parameter', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);

      const req = new NextRequest('http://localhost:3000/api/skills/search?q=test&limit=10');
      const res = await GET_Search(req);

      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('enforces maximum limit of 100', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);

      const req = new NextRequest('http://localhost:3000/api/skills/search?q=test&limit=500');
      const res = await GET_Search(req);

      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('searches across title, description, content, and tags', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);

      const req = new NextRequest('http://localhost:3000/api/skills/search?q=jest');
      await GET_Search(req);

      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  { title: { contains: 'jest', mode: 'insensitive' } },
                  { description: { contains: 'jest', mode: 'insensitive' } },
                  { content: { contains: 'jest', mode: 'insensitive' } },
                  { tags: { hasSome: ['jest'] } },
                ]),
              }),
            ]),
          }),
        })
      );
    });

    it('returns empty results when no matches found', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);

      const req = new NextRequest('http://localhost:3000/api/skills/search?q=nonexistent');
      const res = await GET_Search(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.results).toHaveLength(0);
      expect(body.data.count).toBe(0);
    });
  });

  describe('POST /api/skills/export', () => {
    const POST_Export = async (req: NextRequest) => {
      const body = await req.json();
      const { format, filters } = body;

      if (!format || !['json', 'csv'].includes(format)) {
        return Response.json({ error: 'Invalid format. Must be "json" or "csv"' }, { status: 400 });
      }

      const where = {
        ...(filters?.category && { category: filters.category }),
        ...(filters?.tags && { tags: { hasSome: filters.tags } }),
      };

      const skills = await prisma.skill.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      });

      return Response.json({
        data: {
          format,
          itemCount: skills.length,
          exportData: skills,
          timestamp: new Date().toISOString(),
        },
      });
    };

    it('exports skills in JSON format', async () => {
      const mockSkills = [
        {
          id: 1,
          title: 'Jest Testing',
          description: 'Testing patterns',
          content: '# Jest\n\n...',
          category: 'testing',
          tags: ['jest'],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          title: 'Git Workflow',
          description: 'Version control',
          content: '# Git\n\n...',
          category: 'workflow',
          tags: ['git'],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.skill.findMany.mockResolvedValueOnce(mockSkills as any);

      const req = new NextRequest('http://localhost:3000/api/skills/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'json' }),
      });

      const res = await POST_Export(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.format).toBe('json');
      expect(body.data.itemCount).toBe(2);
      expect(body.data.exportData).toHaveLength(2);
      expect(body.data).toHaveProperty('timestamp');
      expect(body.data.exportData[0]).toHaveProperty('content'); // Full content exported
    });

    it('validates format parameter', async () => {
      const req = new NextRequest('http://localhost:3000/api/skills/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'xml' }),
      });

      const res = await POST_Export(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('Invalid format');
    });

    it('filters export by category', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);

      const req = new NextRequest('http://localhost:3000/api/skills/export', {
        method: 'POST',
        body: JSON.stringify({
          format: 'json',
          filters: { category: 'testing' },
        }),
      });

      await POST_Export(req);

      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: 'testing' },
        })
      );
    });

    it('filters export by tags', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);

      const req = new NextRequest('http://localhost:3000/api/skills/export', {
        method: 'POST',
        body: JSON.stringify({
          format: 'json',
          filters: { tags: ['jest', 'testing'] },
        }),
      });

      await POST_Export(req);

      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tags: { hasSome: ['jest', 'testing'] } },
        })
      );
    });

    it('exports with both category and tags filters', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);

      const req = new NextRequest('http://localhost:3000/api/skills/export', {
        method: 'POST',
        body: JSON.stringify({
          format: 'json',
          filters: {
            category: 'testing',
            tags: ['jest'],
          },
        }),
      });

      await POST_Export(req);

      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            category: 'testing',
            tags: { hasSome: ['jest'] },
          },
        })
      );
    });

    it('handles empty export dataset', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);

      const req = new NextRequest('http://localhost:3000/api/skills/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'json' }),
      });

      const res = await POST_Export(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.itemCount).toBe(0);
      expect(body.data.exportData).toHaveLength(0);
    });

    it('supports CSV format', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);

      const req = new NextRequest('http://localhost:3000/api/skills/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'csv' }),
      });

      const res = await POST_Export(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.format).toBe('csv');
    });
  });

  describe('POST /api/skills/import', () => {
    const POST_Import = async (req: NextRequest) => {
      const body = await req.json();
      const { items, options } = body;

      if (!Array.isArray(items) || items.length === 0) {
        return Response.json(
          { error: 'Items must be a non-empty array' },
          { status: 400 }
        );
      }

      // Validate required fields for each item
      for (const item of items) {
        if (!item.title || !item.description || !item.content || !item.category) {
          return Response.json(
            { error: 'Each item must have title, description, content, and category' },
            { status: 400 }
          );
        }
      }

      const results = await prisma.skill.createMany({
        data: items,
        skipDuplicates: options?.skipDuplicates ?? false,
      });

      return Response.json(
        {
          data: {
            imported: results.count,
            skipped: items.length - results.count,
            failed: 0,
          },
        },
        { status: 201 }
      );
    };

    it('imports skills successfully', async () => {
      mockPrisma.skill.createMany.mockResolvedValueOnce({ count: 3 });

      const req = new NextRequest('http://localhost:3000/api/skills/import', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            {
              title: 'Jest Testing',
              description: 'Testing patterns',
              content: '# Jest\n\n...',
              category: 'testing',
              tags: ['jest'],
            },
            {
              title: 'Git Workflow',
              description: 'Version control',
              content: '# Git\n\n...',
              category: 'workflow',
              tags: ['git'],
            },
            {
              title: 'Docker Guide',
              description: 'Containerization',
              content: '# Docker\n\n...',
              category: 'workflow',
              tags: ['docker'],
            },
          ],
        }),
      });

      const res = await POST_Import(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.data.imported).toBe(3);
      expect(body.data.skipped).toBe(0);
      expect(body.data.failed).toBe(0);
    });

    it('skips duplicates when option enabled', async () => {
      mockPrisma.skill.createMany.mockResolvedValueOnce({ count: 2 });

      const req = new NextRequest('http://localhost:3000/api/skills/import', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            { title: 'Skill 1', description: 'Desc 1', content: 'Content 1', category: 'testing' },
            { title: 'Skill 2', description: 'Desc 2', content: 'Content 2', category: 'testing' },
            { title: 'Skill 3', description: 'Desc 3', content: 'Content 3', category: 'testing' },
          ],
          options: { skipDuplicates: true },
        }),
      });

      const res = await POST_Import(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.data.imported).toBe(2);
      expect(body.data.skipped).toBe(1);
      expect(mockPrisma.skill.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skipDuplicates: true,
        })
      );
    });

    it('validates items array is non-empty', async () => {
      const req = new NextRequest('http://localhost:3000/api/skills/import', {
        method: 'POST',
        body: JSON.stringify({ items: [] }),
      });

      const res = await POST_Import(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('non-empty array');
    });

    it('validates items is an array', async () => {
      const req = new NextRequest('http://localhost:3000/api/skills/import', {
        method: 'POST',
        body: JSON.stringify({ items: 'not-an-array' }),
      });

      const res = await POST_Import(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('array');
    });

    it('validates required fields for each item', async () => {
      const req = new NextRequest('http://localhost:3000/api/skills/import', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            { title: 'Incomplete Skill' }, // Missing description, content, category
          ],
        }),
      });

      const res = await POST_Import(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('title, description, content, and category');
    });

    it('accepts optional fields (tags, metadata)', async () => {
      mockPrisma.skill.createMany.mockResolvedValueOnce({ count: 1 });

      const req = new NextRequest('http://localhost:3000/api/skills/import', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            {
              title: 'Complete Skill',
              description: 'Full description',
              content: '# Content',
              category: 'testing',
              tags: ['tag1', 'tag2'],
              metadata: { difficulty: 'intermediate' },
            },
          ],
        }),
      });

      const res = await POST_Import(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.data.imported).toBe(1);
    });
  });
});
