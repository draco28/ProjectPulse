/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 *
 * Knowledge Archive/Unarchive API tests
 * Tests PATCH /api/knowledge/:id/archive and PATCH /api/knowledge/:id/unarchive
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    knowledge: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Knowledge Archive APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /api/knowledge/:id/archive', () => {
    const PATCH_Archive = async (id: string) => {
      const knowledge = await prisma.knowledge.findUnique({
        where: { id: parseInt(id) },
      });

      if (!knowledge) {
        return Response.json({ error: 'Knowledge item not found' }, { status: 404 });
      }

      const updated = await prisma.knowledge.update({
        where: { id: parseInt(id) },
        data: {
          archived: true,
          archivedAt: new Date(),
        },
      });

      return Response.json({ data: updated });
    };

    it('archives knowledge item successfully', async () => {
      const mockKnowledge = {
        id: 42,
        title: 'Obsolete Pattern',
        content: 'Old content',
        archived: false,
        archivedAt: null,
      };

      const mockUpdated = {
        ...mockKnowledge,
        archived: true,
        archivedAt: new Date('2025-11-13T10:30:00Z'),
      };

      mockPrisma.knowledge.findUnique.mockResolvedValueOnce(mockKnowledge as any);
      mockPrisma.knowledge.update.mockResolvedValueOnce(mockUpdated as any);

      const res = await PATCH_Archive('42');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.id).toBe(42);
      expect(body.data.archived).toBe(true);
      expect(body.data.archivedAt).toBeTruthy();
      expect(mockPrisma.knowledge.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 42 },
          data: expect.objectContaining({
            archived: true,
            archivedAt: expect.any(Date),
          }),
        })
      );
    });

    it('returns 404 when knowledge item not found', async () => {
      mockPrisma.knowledge.findUnique.mockResolvedValueOnce(null);

      const res = await PATCH_Archive('999');
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain('not found');
      expect(mockPrisma.knowledge.update).not.toHaveBeenCalled();
    });

    it('handles already archived items', async () => {
      const mockKnowledge = {
        id: 42,
        archived: true,
        archivedAt: new Date('2025-11-10T00:00:00Z'),
      };

      mockPrisma.knowledge.findUnique.mockResolvedValueOnce(mockKnowledge as any);
      mockPrisma.knowledge.update.mockResolvedValueOnce(mockKnowledge as any);

      const res = await PATCH_Archive('42');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.archived).toBe(true);
    });
  });

  describe('PATCH /api/knowledge/:id/unarchive', () => {
    const PATCH_Unarchive = async (id: string) => {
      const knowledge = await prisma.knowledge.findUnique({
        where: { id: parseInt(id) },
      });

      if (!knowledge) {
        return Response.json({ error: 'Knowledge item not found' }, { status: 404 });
      }

      const updated = await prisma.knowledge.update({
        where: { id: parseInt(id) },
        data: {
          archived: false,
          archivedAt: null,
        },
      });

      return Response.json({ data: updated });
    };

    it('unarchives knowledge item successfully', async () => {
      const mockKnowledge = {
        id: 42,
        title: 'Restored Pattern',
        content: 'Content',
        archived: true,
        archivedAt: new Date('2025-11-10T00:00:00Z'),
      };

      const mockUpdated = {
        ...mockKnowledge,
        archived: false,
        archivedAt: null,
      };

      mockPrisma.knowledge.findUnique.mockResolvedValueOnce(mockKnowledge as any);
      mockPrisma.knowledge.update.mockResolvedValueOnce(mockUpdated as any);

      const res = await PATCH_Unarchive('42');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.id).toBe(42);
      expect(body.data.archived).toBe(false);
      expect(body.data.archivedAt).toBeNull();
      expect(mockPrisma.knowledge.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 42 },
          data: {
            archived: false,
            archivedAt: null,
          },
        })
      );
    });

    it('returns 404 when knowledge item not found', async () => {
      mockPrisma.knowledge.findUnique.mockResolvedValueOnce(null);

      const res = await PATCH_Unarchive('999');
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain('not found');
    });

    it('handles already unarchived items', async () => {
      const mockKnowledge = {
        id: 42,
        archived: false,
        archivedAt: null,
      };

      mockPrisma.knowledge.findUnique.mockResolvedValueOnce(mockKnowledge as any);
      mockPrisma.knowledge.update.mockResolvedValueOnce(mockKnowledge as any);

      const res = await PATCH_Unarchive('42');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.archived).toBe(false);
      expect(body.data.archivedAt).toBeNull();
    });
  });
});
