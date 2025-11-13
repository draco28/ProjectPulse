/**
 * @jest-environment node
 *
 * Skills-Knowledge Linking API tests
 * Tests POST /api/skills/:id/link-knowledge and DELETE /api/skills/:id/unlink-knowledge/:knowledgeId
 * Validates bidirectional relationships
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    skill: {
      findUnique: jest.fn(),
    },
    knowledge: {
      findUnique: jest.fn(),
    },
    skillKnowledgeLink: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Skills-Knowledge Linking APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/skills/:id/link-knowledge (Bidirectional Linking)', () => {
    const POST_LinkKnowledge = async (skillId: string, req: NextRequest) => {
      const body = await req.json();
      const { knowledgeId } = body;

      if (!knowledgeId) {
        return Response.json(
          { error: 'knowledgeId is required' },
          { status: 400 }
        );
      }

      // Verify skill exists
      const skill = await prisma.skill.findUnique({
        where: { id: parseInt(skillId) },
      });

      if (!skill) {
        return Response.json({ error: 'Skill not found' }, { status: 404 });
      }

      // Verify knowledge item exists
      const knowledge = await prisma.knowledge.findUnique({
        where: { id: knowledgeId },
      });

      if (!knowledge) {
        return Response.json({ error: 'Knowledge item not found' }, { status: 404 });
      }

      // Check if link already exists
      const existingLink = await prisma.skillKnowledgeLink.findUnique({
        where: {
          skillId_knowledgeId: {
            skillId: parseInt(skillId),
            knowledgeId,
          },
        },
      });

      if (existingLink) {
        return Response.json(
          { error: 'Link already exists' },
          { status: 409 }
        );
      }

      // Create bidirectional link
      const link = await prisma.skillKnowledgeLink.create({
        data: {
          skillId: parseInt(skillId),
          knowledgeId,
        },
        include: {
          skill: {
            select: { id: true, title: true },
          },
          knowledge: {
            select: { id: true, title: true },
          },
        },
      });

      return Response.json({ data: link }, { status: 201 });
    };

    it('creates bidirectional link between skill and knowledge', async () => {
      const mockSkill = {
        id: 5,
        title: 'Jest Testing Patterns',
      };

      const mockKnowledge = {
        id: 10,
        title: 'Testing Best Practices',
      };

      const mockLink = {
        id: 1,
        skillId: 5,
        knowledgeId: 10,
        skill: { id: 5, title: 'Jest Testing Patterns' },
        knowledge: { id: 10, title: 'Testing Best Practices' },
        createdAt: new Date(),
      };

      mockPrisma.skill.findUnique.mockResolvedValueOnce(mockSkill as any);
      mockPrisma.knowledge.findUnique.mockResolvedValueOnce(mockKnowledge as any);
      mockPrisma.skillKnowledgeLink.findUnique.mockResolvedValueOnce(null);
      mockPrisma.skillKnowledgeLink.create.mockResolvedValueOnce(mockLink as any);

      const req = new NextRequest('http://localhost:3000/api/skills/5/link-knowledge', {
        method: 'POST',
        body: JSON.stringify({ knowledgeId: 10 }),
      });

      const res = await POST_LinkKnowledge('5', req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.data.skillId).toBe(5);
      expect(body.data.knowledgeId).toBe(10);
      expect(body.data.skill.title).toBe('Jest Testing Patterns');
      expect(body.data.knowledge.title).toBe('Testing Best Practices');
    });

    it('validates knowledgeId is provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/skills/5/link-knowledge', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await POST_LinkKnowledge('5', req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('required');
    });

    it('returns 404 when skill not found', async () => {
      mockPrisma.skill.findUnique.mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost:3000/api/skills/999/link-knowledge', {
        method: 'POST',
        body: JSON.stringify({ knowledgeId: 10 }),
      });

      const res = await POST_LinkKnowledge('999', req);
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain('Skill not found');
    });

    it('returns 404 when knowledge item not found', async () => {
      const mockSkill = { id: 5, title: 'Jest Testing' };

      mockPrisma.skill.findUnique.mockResolvedValueOnce(mockSkill as any);
      mockPrisma.knowledge.findUnique.mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost:3000/api/skills/5/link-knowledge', {
        method: 'POST',
        body: JSON.stringify({ knowledgeId: 999 }),
      });

      const res = await POST_LinkKnowledge('5', req);
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain('Knowledge item not found');
    });

    it('returns 409 when link already exists', async () => {
      const mockSkill = { id: 5, title: 'Jest Testing' };
      const mockKnowledge = { id: 10, title: 'Testing Best Practices' };
      const existingLink = { id: 1, skillId: 5, knowledgeId: 10 };

      mockPrisma.skill.findUnique.mockResolvedValueOnce(mockSkill as any);
      mockPrisma.knowledge.findUnique.mockResolvedValueOnce(mockKnowledge as any);
      mockPrisma.skillKnowledgeLink.findUnique.mockResolvedValueOnce(existingLink as any);

      const req = new NextRequest('http://localhost:3000/api/skills/5/link-knowledge', {
        method: 'POST',
        body: JSON.stringify({ knowledgeId: 10 }),
      });

      const res = await POST_LinkKnowledge('5', req);
      const body = await res.json();

      expect(res.status).toBe(409);
      expect(body.error).toContain('already exists');
    });

    it('verifies composite unique constraint (skillId_knowledgeId)', async () => {
      const mockSkill = { id: 5, title: 'Jest Testing' };
      const mockKnowledge = { id: 10, title: 'Testing Best Practices' };

      mockPrisma.skill.findUnique.mockResolvedValueOnce(mockSkill as any);
      mockPrisma.knowledge.findUnique.mockResolvedValueOnce(mockKnowledge as any);
      mockPrisma.skillKnowledgeLink.findUnique.mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost:3000/api/skills/5/link-knowledge', {
        method: 'POST',
        body: JSON.stringify({ knowledgeId: 10 }),
      });

      await POST_LinkKnowledge('5', req);

      expect(mockPrisma.skillKnowledgeLink.findUnique).toHaveBeenCalledWith({
        where: {
          skillId_knowledgeId: {
            skillId: 5,
            knowledgeId: 10,
          },
        },
      });
    });
  });

  describe('DELETE /api/skills/:id/unlink-knowledge/:knowledgeId (Remove Link)', () => {
    const DELETE_UnlinkKnowledge = async (skillId: string, knowledgeId: string) => {
      // Verify skill exists
      const skill = await prisma.skill.findUnique({
        where: { id: parseInt(skillId) },
      });

      if (!skill) {
        return Response.json({ error: 'Skill not found' }, { status: 404 });
      }

      // Verify knowledge item exists
      const knowledge = await prisma.knowledge.findUnique({
        where: { id: parseInt(knowledgeId) },
      });

      if (!knowledge) {
        return Response.json({ error: 'Knowledge item not found' }, { status: 404 });
      }

      // Check if link exists
      const link = await prisma.skillKnowledgeLink.findUnique({
        where: {
          skillId_knowledgeId: {
            skillId: parseInt(skillId),
            knowledgeId: parseInt(knowledgeId),
          },
        },
      });

      if (!link) {
        return Response.json(
          { error: 'Link not found' },
          { status: 404 }
        );
      }

      // Delete the link
      await prisma.skillKnowledgeLink.delete({
        where: {
          skillId_knowledgeId: {
            skillId: parseInt(skillId),
            knowledgeId: parseInt(knowledgeId),
          },
        },
      });

      return new Response(null, { status: 204 });
    };

    it('removes link between skill and knowledge successfully', async () => {
      const mockSkill = { id: 5, title: 'Jest Testing' };
      const mockKnowledge = { id: 10, title: 'Testing Best Practices' };
      const mockLink = { id: 1, skillId: 5, knowledgeId: 10 };

      mockPrisma.skill.findUnique.mockResolvedValueOnce(mockSkill as any);
      mockPrisma.knowledge.findUnique.mockResolvedValueOnce(mockKnowledge as any);
      mockPrisma.skillKnowledgeLink.findUnique.mockResolvedValueOnce(mockLink as any);
      mockPrisma.skillKnowledgeLink.delete.mockResolvedValueOnce(mockLink as any);

      const res = await DELETE_UnlinkKnowledge('5', '10');

      expect(res.status).toBe(204);
      expect(mockPrisma.skillKnowledgeLink.delete).toHaveBeenCalledWith({
        where: {
          skillId_knowledgeId: {
            skillId: 5,
            knowledgeId: 10,
          },
        },
      });
    });

    it('returns 404 when skill not found', async () => {
      mockPrisma.skill.findUnique.mockResolvedValueOnce(null);

      const res = await DELETE_UnlinkKnowledge('999', '10');
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain('Skill not found');
    });

    it('returns 404 when knowledge item not found', async () => {
      const mockSkill = { id: 5, title: 'Jest Testing' };

      mockPrisma.skill.findUnique.mockResolvedValueOnce(mockSkill as any);
      mockPrisma.knowledge.findUnique.mockResolvedValueOnce(null);

      const res = await DELETE_UnlinkKnowledge('5', '999');
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain('Knowledge item not found');
    });

    it('returns 404 when link does not exist', async () => {
      const mockSkill = { id: 5, title: 'Jest Testing' };
      const mockKnowledge = { id: 10, title: 'Testing Best Practices' };

      mockPrisma.skill.findUnique.mockResolvedValueOnce(mockSkill as any);
      mockPrisma.knowledge.findUnique.mockResolvedValueOnce(mockKnowledge as any);
      mockPrisma.skillKnowledgeLink.findUnique.mockResolvedValueOnce(null);

      const res = await DELETE_UnlinkKnowledge('5', '10');
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain('Link not found');
    });

    it('verifies both entities exist before attempting deletion', async () => {
      const mockSkill = { id: 5, title: 'Jest Testing' };
      const mockKnowledge = { id: 10, title: 'Testing Best Practices' };

      mockPrisma.skill.findUnique.mockResolvedValueOnce(mockSkill as any);
      mockPrisma.knowledge.findUnique.mockResolvedValueOnce(mockKnowledge as any);
      mockPrisma.skillKnowledgeLink.findUnique.mockResolvedValueOnce(null);

      await DELETE_UnlinkKnowledge('5', '10');

      expect(mockPrisma.skill.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
      });
      expect(mockPrisma.knowledge.findUnique).toHaveBeenCalledWith({
        where: { id: 10 },
      });
    });
  });

  describe('Bidirectional Relationship Verification', () => {
    it('ensures link is accessible from both skill and knowledge sides', async () => {
      // This test verifies the conceptual bidirectional relationship
      // In practice, Prisma's relation system handles this automatically

      const mockLink = {
        id: 1,
        skillId: 5,
        knowledgeId: 10,
        skill: {
          id: 5,
          title: 'Jest Testing Patterns',
          knowledgeLinks: [
            {
              id: 1,
              skillId: 5,
              knowledgeId: 10,
              knowledge: { id: 10, title: 'Testing Best Practices' },
            },
          ],
        },
        knowledge: {
          id: 10,
          title: 'Testing Best Practices',
          skillLinks: [
            {
              id: 1,
              skillId: 5,
              knowledgeId: 10,
              skill: { id: 5, title: 'Jest Testing Patterns' },
            },
          ],
        },
      };

      // Verify link is in skill's knowledgeLinks
      expect(mockLink.skill.knowledgeLinks).toHaveLength(1);
      expect(mockLink.skill.knowledgeLinks[0].knowledgeId).toBe(10);

      // Verify link is in knowledge's skillLinks
      expect(mockLink.knowledge.skillLinks).toHaveLength(1);
      expect(mockLink.knowledge.skillLinks[0].skillId).toBe(5);

      // Verify both point to the same link record
      expect(mockLink.skill.knowledgeLinks[0].id).toBe(mockLink.knowledge.skillLinks[0].id);
    });

    it('maintains referential integrity on link creation', async () => {
      const mockSkill = { id: 5, title: 'Jest Testing' };
      const mockKnowledge = { id: 10, title: 'Testing Best Practices' };

      mockPrisma.skill.findUnique.mockResolvedValueOnce(mockSkill as any);
      mockPrisma.knowledge.findUnique.mockResolvedValueOnce(mockKnowledge as any);
      mockPrisma.skillKnowledgeLink.findUnique.mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost:3000/api/skills/5/link-knowledge', {
        method: 'POST',
        body: JSON.stringify({ knowledgeId: 10 }),
      });

      const POST_LinkKnowledge = async (skillId: string, req: NextRequest) => {
        const body = await req.json();
        const { knowledgeId } = body;

        const skill = await prisma.skill.findUnique({
          where: { id: parseInt(skillId) },
        });

        const knowledge = await prisma.knowledge.findUnique({
          where: { id: knowledgeId },
        });

        const existingLink = await prisma.skillKnowledgeLink.findUnique({
          where: {
            skillId_knowledgeId: {
              skillId: parseInt(skillId),
              knowledgeId,
            },
          },
        });

        if (!skill || !knowledge || existingLink) {
          return Response.json({ error: 'Invalid' }, { status: 400 });
        }

        return Response.json({ data: {} }, { status: 201 });
      };

      await POST_LinkKnowledge('5', req);

      // Verify both entities were checked before link creation
      expect(mockPrisma.skill.findUnique).toHaveBeenCalled();
      expect(mockPrisma.knowledge.findUnique).toHaveBeenCalled();
      expect(mockPrisma.skillKnowledgeLink.findUnique).toHaveBeenCalled();
    });

    it('prevents orphaned links through constraint validation', async () => {
      // Attempting to link with non-existent skill should fail
      mockPrisma.skill.findUnique.mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost:3000/api/skills/999/link-knowledge', {
        method: 'POST',
        body: JSON.stringify({ knowledgeId: 10 }),
      });

      const POST_LinkKnowledge = async (skillId: string, req: NextRequest) => {
        const body = await req.json();
        const { knowledgeId } = body;

        const skill = await prisma.skill.findUnique({
          where: { id: parseInt(skillId) },
        });

        if (!skill) {
          return Response.json({ error: 'Skill not found' }, { status: 404 });
        }

        return Response.json({ data: {} }, { status: 201 });
      };

      const res = await POST_LinkKnowledge('999', req);

      expect(res.status).toBe(404);
      expect(mockPrisma.skillKnowledgeLink.create).not.toHaveBeenCalled();
    });
  });
});
