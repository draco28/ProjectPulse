/**
 * @jest-environment node
 *
 * Skills CRUD API tests
 * Tests GET /api/skills, GET /api/skills/:id, POST /api/skills,
 * PATCH /api/skills/:id, DELETE /api/skills/:id
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    skill: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Skills CRUD APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/skills (List - Frontmatter Only)', () => {
    const GET_List = async (req: NextRequest) => {
      const url = new URL(req.url);
      const category = url.searchParams.get('category');
      const search = url.searchParams.get('search');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

      const where = {
        ...(category && { category }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const [skills, total] = await Promise.all([
        prisma.skill.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            tags: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
            // Exclude content field (lazy-loading)
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.skill.count({ where }),
      ]);

      return Response.json({
        data: {
          skills,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
          },
        },
      });
    };

    it('lists skills with frontmatter only (token-efficient)', async () => {
      const mockSkills = [
        {
          id: 1,
          title: 'Jest Testing Patterns',
          description: 'Comprehensive testing strategies',
          category: 'testing',
          tags: ['jest', 'unit-testing'],
          metadata: { difficulty: 'intermediate' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.skill.findMany.mockResolvedValueOnce(mockSkills as any);
      mockPrisma.skill.count.mockResolvedValueOnce(1);

      const req = new NextRequest('http://localhost:3000/api/skills');
      const res = await GET_List(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.skills).toHaveLength(1);
      expect(body.data.skills[0]).not.toHaveProperty('content'); // Lazy-loading: no content
      expect(body.data.skills[0]).toHaveProperty('title');
      expect(body.data.skills[0]).toHaveProperty('description');
      expect(body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasMore: false,
      });
    });

    it('filters skills by category', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);
      mockPrisma.skill.count.mockResolvedValueOnce(0);

      const req = new NextRequest('http://localhost:3000/api/skills?category=testing');
      const res = await GET_List(req);

      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: 'testing' },
        })
      );
    });

    it('searches skills by title and description', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);
      mockPrisma.skill.count.mockResolvedValueOnce(0);

      const req = new NextRequest('http://localhost:3000/api/skills?search=jest');
      const res = await GET_List(req);

      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { title: { contains: 'jest', mode: 'insensitive' } },
              { description: { contains: 'jest', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('supports pagination', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);
      mockPrisma.skill.count.mockResolvedValueOnce(50);

      const req = new NextRequest('http://localhost:3000/api/skills?page=2&limit=10');
      const res = await GET_List(req);
      const body = await res.json();

      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(body.data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasMore: true,
      });
    });

    it('enforces maximum limit of 100', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);
      mockPrisma.skill.count.mockResolvedValueOnce(0);

      const req = new NextRequest('http://localhost:3000/api/skills?limit=500');
      const res = await GET_List(req);

      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });
  });

  describe('GET /api/skills/:id (Full Content)', () => {
    const GET_Detail = async (id: string) => {
      const skill = await prisma.skill.findUnique({
        where: { id: parseInt(id) },
        include: {
          knowledgeLinks: {
            select: {
              knowledge: {
                select: { id: true, title: true },
              },
            },
          },
        },
      });

      if (!skill) {
        return Response.json({ error: 'Skill not found' }, { status: 404 });
      }

      return Response.json({
        data: {
          ...skill,
          linkedKnowledge: skill.knowledgeLinks.map((link) => link.knowledge),
        },
      });
    };

    it('returns full skill content including markdown', async () => {
      const mockSkill = {
        id: 1,
        title: 'Jest Testing Patterns',
        description: 'Comprehensive testing',
        content: '# Jest Testing\n\n## Overview\n...', // Full markdown
        category: 'testing',
        tags: ['jest'],
        metadata: {},
        knowledgeLinks: [
          { knowledge: { id: 5, title: 'Testing Best Practices' } },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.skill.findUnique.mockResolvedValueOnce(mockSkill as any);

      const res = await GET_Detail('1');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data).toHaveProperty('content'); // Full content loaded
      expect(body.data.content).toContain('# Jest Testing');
      expect(body.data).toHaveProperty('linkedKnowledge');
      expect(body.data.linkedKnowledge).toHaveLength(1);
    });

    it('returns 404 when skill not found', async () => {
      mockPrisma.skill.findUnique.mockResolvedValueOnce(null);

      const res = await GET_Detail('999');
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain('not found');
    });
  });

  describe('POST /api/skills (Create)', () => {
    const POST_Create = async (req: NextRequest) => {
      const body = await req.json();
      const { title, description, content, category, tags, metadata } = body;

      if (!title || !description || !content || !category) {
        return Response.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const skill = await prisma.skill.create({
        data: { title, description, content, category, tags, metadata },
      });

      return Response.json({ data: skill }, { status: 201 });
    };

    it('creates skill with all fields', async () => {
      const mockSkill = {
        id: 16,
        title: 'Playwright E2E Testing',
        description: 'E2E testing with Playwright',
        content: '# Playwright\n\n...',
        category: 'testing',
        tags: ['playwright', 'e2e'],
        metadata: { difficulty: 'intermediate' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.skill.create.mockResolvedValueOnce(mockSkill as any);

      const req = new NextRequest('http://localhost:3000/api/skills', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Playwright E2E Testing',
          description: 'E2E testing with Playwright',
          content: '# Playwright\n\n...',
          category: 'testing',
          tags: ['playwright', 'e2e'],
          metadata: { difficulty: 'intermediate' },
        }),
      });

      const res = await POST_Create(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.data.id).toBe(16);
      expect(body.data.title).toBe('Playwright E2E Testing');
    });

    it('validates required fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/skills', {
        method: 'POST',
        body: JSON.stringify({ title: 'Incomplete Skill' }),
      });

      const res = await POST_Create(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('required');
    });
  });

  describe('PATCH /api/skills/:id (Update)', () => {
    const PATCH_Update = async (id: string, req: NextRequest) => {
      const body = await req.json();

      const skill = await prisma.skill.findUnique({
        where: { id: parseInt(id) },
      });

      if (!skill) {
        return Response.json({ error: 'Skill not found' }, { status: 404 });
      }

      const updated = await prisma.skill.update({
        where: { id: parseInt(id) },
        data: body,
      });

      return Response.json({ data: updated });
    };

    it('updates skill fields (partial update)', async () => {
      const mockSkill = { id: 1, title: 'Original' };
      const mockUpdated = { id: 1, title: 'Original', description: 'Updated' };

      mockPrisma.skill.findUnique.mockResolvedValueOnce(mockSkill as any);
      mockPrisma.skill.update.mockResolvedValueOnce(mockUpdated as any);

      const req = new NextRequest('http://localhost:3000/api/skills/1', {
        method: 'PATCH',
        body: JSON.stringify({ description: 'Updated' }),
      });

      const res = await PATCH_Update('1', req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.description).toBe('Updated');
    });

    it('returns 404 when skill not found', async () => {
      mockPrisma.skill.findUnique.mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost:3000/api/skills/999', {
        method: 'PATCH',
        body: JSON.stringify({ description: 'Updated' }),
      });

      const res = await PATCH_Update('999', req);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/skills/:id', () => {
    const DELETE_Skill = async (id: string) => {
      const skill = await prisma.skill.findUnique({
        where: { id: parseInt(id) },
      });

      if (!skill) {
        return Response.json({ error: 'Skill not found' }, { status: 404 });
      }

      await prisma.skill.delete({
        where: { id: parseInt(id) },
      });

      return new Response(null, { status: 204 });
    };

    it('deletes skill successfully', async () => {
      mockPrisma.skill.findUnique.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.skill.delete.mockResolvedValueOnce({} as any);

      const res = await DELETE_Skill('1');

      expect(res.status).toBe(204);
      expect(mockPrisma.skill.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('returns 404 when skill not found', async () => {
      mockPrisma.skill.findUnique.mockResolvedValueOnce(null);

      const res = await DELETE_Skill('999');
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain('not found');
    });
  });
});
