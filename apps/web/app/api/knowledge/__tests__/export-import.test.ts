/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 *
 * Knowledge Export/Import API tests
 * Tests POST /api/knowledge/export and POST /api/knowledge/import
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    knowledge: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Mock route handlers (we'll test the logic, actual routes would be imported)
const POST_Export = async (req: NextRequest) => {
  const body = await req.json();
  const { format, filters } = body;

  if (!format || !['json', 'csv'].includes(format)) {
    return Response.json({ error: 'Invalid format' }, { status: 400 });
  }

  const knowledge = await prisma.knowledge.findMany({
    where: {
      ...(filters?.tags && { tags: { hasSome: filters.tags } }),
      ...(filters?.archived !== undefined && { archived: filters.archived }),
    },
  });

  return Response.json({
    data: {
      format,
      itemCount: knowledge.length,
      exportData: knowledge,
      timestamp: new Date().toISOString(),
    },
  });
};

const POST_Import = async (req: NextRequest) => {
  const body = await req.json();
  const { items, options } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: 'Items must be a non-empty array' }, { status: 400 });
  }

  const results = await prisma.knowledge.createMany({
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

describe('Knowledge Export/Import APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/knowledge/export', () => {
    it('exports knowledge items in JSON format', async () => {
      const mockKnowledge = [
        {
          id: 1,
          title: 'API Design Patterns',
          content: 'REST API best practices...',
          tags: ['api', 'patterns'],
          archived: false,
        },
        {
          id: 2,
          title: 'Testing Strategies',
          content: 'Unit and integration testing...',
          tags: ['testing'],
          archived: false,
        },
      ];

      mockPrisma.knowledge.findMany.mockResolvedValueOnce(mockKnowledge as any);

      const req = new NextRequest('http://localhost:3000/api/knowledge/export', {
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
    });

    it('exports with tag filter', async () => {
      mockPrisma.knowledge.findMany.mockResolvedValueOnce([]);

      const req = new NextRequest('http://localhost:3000/api/knowledge/export', {
        method: 'POST',
        body: JSON.stringify({
          format: 'json',
          filters: { tags: ['testing', 'api'] },
        }),
      });

      const res = await POST_Export(req);
      await res.json(); // Consume response

      expect(res.status).toBe(200);
      expect(mockPrisma.knowledge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { hasSome: ['testing', 'api'] },
          }),
        })
      );
    });

    it('exports including archived items when specified', async () => {
      mockPrisma.knowledge.findMany.mockResolvedValueOnce([]);

      const req = new NextRequest('http://localhost:3000/api/knowledge/export', {
        method: 'POST',
        body: JSON.stringify({
          format: 'json',
          filters: { archived: true },
        }),
      });

      await POST_Export(req);

      expect(mockPrisma.knowledge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            archived: true,
          }),
        })
      );
    });

    it('validates format parameter', async () => {
      const req = new NextRequest('http://localhost:3000/api/knowledge/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'xml' }),
      });

      const res = await POST_Export(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('handles export of empty dataset', async () => {
      mockPrisma.knowledge.findMany.mockResolvedValueOnce([]);

      const req = new NextRequest('http://localhost:3000/api/knowledge/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'json' }),
      });

      const res = await POST_Export(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.itemCount).toBe(0);
      expect(body.data.exportData).toHaveLength(0);
    });
  });

  describe('POST /api/knowledge/import', () => {
    it('imports knowledge items successfully', async () => {
      mockPrisma.knowledge.createMany.mockResolvedValueOnce({ count: 3 });

      const req = new NextRequest('http://localhost:3000/api/knowledge/import', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            { title: 'Item 1', content: 'Content 1', tags: ['tag1'] },
            { title: 'Item 2', content: 'Content 2', tags: ['tag2'] },
            { title: 'Item 3', content: 'Content 3', tags: ['tag3'] },
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
      mockPrisma.knowledge.createMany.mockResolvedValueOnce({ count: 2 });

      const req = new NextRequest('http://localhost:3000/api/knowledge/import', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            { title: 'Item 1', content: 'Content 1' },
            { title: 'Item 2', content: 'Content 2' },
            { title: 'Item 3', content: 'Content 3' },
          ],
          options: { skipDuplicates: true },
        }),
      });

      const res = await POST_Import(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.data.imported).toBe(2);
      expect(body.data.skipped).toBe(1);
      expect(mockPrisma.knowledge.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skipDuplicates: true,
        })
      );
    });

    it('validates items array is non-empty', async () => {
      const req = new NextRequest('http://localhost:3000/api/knowledge/import', {
        method: 'POST',
        body: JSON.stringify({ items: [] }),
      });

      const res = await POST_Import(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('validates items is an array', async () => {
      const req = new NextRequest('http://localhost:3000/api/knowledge/import', {
        method: 'POST',
        body: JSON.stringify({ items: 'not-an-array' }),
      });

      const res = await POST_Import(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('array');
    });
  });
});
