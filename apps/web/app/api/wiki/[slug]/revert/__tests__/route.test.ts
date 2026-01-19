/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 *
 * Wiki page revert API route tests
 * Tests transactional revert logic, validation, actor metadata, and error handling
 *
 * Ticket #132: Updated for per-project path uniqueness
 * - findUnique → findFirst
 * - Added projectId to where clauses
 * - Mock getAuthorizedProjectId
 */

// Mock auth before importing the route
jest.mock('@/lib/auth/validateRequest', () => ({
  getAuthorizedProjectId: jest.fn().mockResolvedValue({ projectId: 6 }),
  AuthError: class AuthError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

// Mock Next.js cache utilities
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock Prisma before importing the route
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { POST } from '../route';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

// Mock page and revision data
const mockPage = {
  id: 1,
  title: 'Current Title',
  content: 'Current content',
  excerpt: 'Current excerpt',
  version: 3,
};

const mockTargetRevision = {
  title: 'Old Title',
  content: 'Old content',
  excerpt: 'Old excerpt',
};

const mockUpdatedPage = {
  id: 1,
  title: 'Old Title',
  content: 'Old content',
  category: 'getting-started',
  excerpt: 'Old excerpt',
  path: '/getting-started',
  version: 4,
  updatedAt: new Date('2025-11-11T17:00:00Z'),
};

describe('POST /api/wiki/[slug]/revert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success cases', () => {
    it('should revert wiki page to specified version', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
            update: jest.fn().mockResolvedValue(mockUpdatedPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
            create: jest.fn(),
          },
          wikiPageEvent: {
            create: jest.fn(),
          },
        } as any);
      });

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({ version: 1, reason: 'Reverting incorrect changes' }),
      });

      const response = await POST(request, { params: { slug: 'getting-started' } });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toMatchObject({
        id: mockUpdatedPage.id,
        title: mockUpdatedPage.title,
        content: mockUpdatedPage.content,
        category: mockUpdatedPage.category,
        excerpt: mockUpdatedPage.excerpt,
        path: mockUpdatedPage.path,
        version: mockUpdatedPage.version,
      });
    });

    it('should normalize slug path with leading slash', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
            update: jest.fn().mockResolvedValue(mockUpdatedPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
            create: jest.fn(),
          },
          wikiPageEvent: {
            create: jest.fn(),
          },
        };
        await callback(mockTx as any);
        return mockUpdatedPage;
      });

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({ version: 1 }),
      });

      await POST(request, { params: { slug: 'getting-started' } });

      const txCallback = (mockPrisma.$transaction as jest.Mock).mock.calls[0][0];
      const mockTx = {
        wikiPage: {
          findFirst: jest.fn().mockResolvedValue(mockPage),
          update: jest.fn(),
        },
        wikiRevision: {
          findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
          create: jest.fn(),
        },
        wikiPageEvent: {
          create: jest.fn(),
        },
      };

      await txCallback(mockTx);

      expect(mockTx.wikiPage.findFirst).toHaveBeenCalledWith({
        where: { path: '/getting-started', projectId: 6 },
        select: expect.any(Object),
      });
    });

    it('should create revision snapshot before reverting', async () => {
      let revisionCreateSpy: jest.Mock;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
            update: jest.fn().mockResolvedValue(mockUpdatedPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
            create: jest.fn(),
          },
          wikiPageEvent: {
            create: jest.fn(),
          },
        };
        revisionCreateSpy = mockTx.wikiRevision.create;
        await callback(mockTx as any);
        return mockUpdatedPage;
      });

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({ version: 1, reason: 'Test revert' }),
      });

      await POST(request, { params: { slug: 'getting-started' } });

      expect(revisionCreateSpy!).toHaveBeenCalledWith({
        data: {
          wikiPageId: 1,
          version: 3,
          title: 'Current Title',
          excerpt: 'Current excerpt',
          content: 'Current content',
          diffSummary: 'Reverted to v1: Test revert',
          createdBy: 'Unknown Editor',
          createdByType: 'human',
        },
      });
    });

    it('should log WikiPageEvent for audit trail', async () => {
      let eventCreateSpy: jest.Mock;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
            update: jest.fn().mockResolvedValue(mockUpdatedPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
            create: jest.fn(),
          },
          wikiPageEvent: {
            create: jest.fn(),
          },
        };
        eventCreateSpy = mockTx.wikiPageEvent.create;
        await callback(mockTx as any);
        return mockUpdatedPage;
      });

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({ version: 1, reason: 'Reverting changes' }),
      });

      await POST(request, { params: { slug: 'getting-started' } });

      expect(eventCreateSpy!).toHaveBeenCalledWith({
        data: {
          wikiPageId: 1,
          type: 'REVISION',
          actor: 'Unknown Editor',
          metadata: {
            action: 'REVERT',
            targetVersion: 1,
            reason: 'Reverting changes',
          },
        },
      });
    });

    it('should increment version counter on revert', async () => {
      let updateSpy: jest.Mock;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
            update: jest.fn().mockResolvedValue(mockUpdatedPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
            create: jest.fn(),
          },
          wikiPageEvent: {
            create: jest.fn(),
          },
        };
        updateSpy = mockTx.wikiPage.update;
        await callback(mockTx as any);
        return mockUpdatedPage;
      });

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({ version: 1 }),
      });

      await POST(request, { params: { slug: 'getting-started' } });

      expect(updateSpy!).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: { increment: 1 },
            revisions: { increment: 1 },
          }),
        })
      );
    });

    it('should revalidate paths after successful revert', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
            update: jest.fn().mockResolvedValue(mockUpdatedPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
            create: jest.fn(),
          },
          wikiPageEvent: {
            create: jest.fn(),
          },
        } as any);
      });

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({ version: 1 }),
      });

      await POST(request, { params: { slug: 'getting-started' } });

      expect(mockRevalidatePath).toHaveBeenCalledWith('/wiki');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/wiki/getting-started');
    });
  });

  describe('Actor metadata handling', () => {
    it('should use updatedBy from request body', async () => {
      let revisionCreateSpy: jest.Mock;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
            update: jest.fn().mockResolvedValue(mockUpdatedPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
            create: jest.fn(),
          },
          wikiPageEvent: {
            create: jest.fn(),
          },
        };
        revisionCreateSpy = mockTx.wikiRevision.create;
        await callback(mockTx as any);
        return mockUpdatedPage;
      });

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({
          version: 1,
          updatedBy: 'Jane Doe',
          updatedByType: 'human',
        }),
      });

      await POST(request, { params: { slug: 'getting-started' } });

      expect(revisionCreateSpy!).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createdBy: 'Jane Doe',
            createdByType: 'human',
          }),
        })
      );
    });

    it('should use x-projectpulse-actor header if body field missing', async () => {
      let revisionCreateSpy: jest.Mock;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
            update: jest.fn().mockResolvedValue(mockUpdatedPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
            create: jest.fn(),
          },
          wikiPageEvent: {
            create: jest.fn(),
          },
        };
        revisionCreateSpy = mockTx.wikiRevision.create;
        await callback(mockTx as any);
        return mockUpdatedPage;
      });

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        headers: {
          'x-projectpulse-actor': 'MCP Agent',
          'x-projectpulse-actor-type': 'agent',
        },
        body: JSON.stringify({ version: 1 }),
      });

      await POST(request, { params: { slug: 'getting-started' } });

      expect(revisionCreateSpy!).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createdBy: 'MCP Agent',
            createdByType: 'agent',
          }),
        })
      );
    });

    it('should default to "Unknown Editor" and "human" if no actor provided', async () => {
      let revisionCreateSpy: jest.Mock;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
            update: jest.fn().mockResolvedValue(mockUpdatedPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
            create: jest.fn(),
          },
          wikiPageEvent: {
            create: jest.fn(),
          },
        };
        revisionCreateSpy = mockTx.wikiRevision.create;
        await callback(mockTx as any);
        return mockUpdatedPage;
      });

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({ version: 1 }),
      });

      await POST(request, { params: { slug: 'getting-started' } });

      expect(revisionCreateSpy!).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createdBy: 'Unknown Editor',
            createdByType: 'human',
          }),
        })
      );
    });

    it('should prioritize body updatedBy over header', async () => {
      let revisionCreateSpy: jest.Mock;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
            update: jest.fn().mockResolvedValue(mockUpdatedPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
            create: jest.fn(),
          },
          wikiPageEvent: {
            create: jest.fn(),
          },
        };
        revisionCreateSpy = mockTx.wikiRevision.create;
        await callback(mockTx as any);
        return mockUpdatedPage;
      });

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        headers: { 'x-projectpulse-actor': 'Header Actor' },
        body: JSON.stringify({
          version: 1,
          updatedBy: 'Body Actor',
        }),
      });

      await POST(request, { params: { slug: 'getting-started' } });

      expect(revisionCreateSpy!).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createdBy: 'Body Actor',
          }),
        })
      );
    });
  });

  describe('Validation', () => {
    it('should return 400 when version is missing', async () => {
      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request, { params: { slug: 'getting-started' } });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Validation failed');
      expect(body.details.version).toBeDefined();
    });

    it('should return 400 when version is not a number', async () => {
      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({ version: 'invalid' }),
      });

      const response = await POST(request, { params: { slug: 'getting-started' } });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Validation failed');
    });

    it('should return 400 when version is less than 1', async () => {
      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({ version: 0 }),
      });

      const response = await POST(request, { params: { slug: 'getting-started' } });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Validation failed');
      expect(body.details.version).toContain('Version is required');
    });

    it('should return 400 when reason exceeds 500 characters', async () => {
      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({
          version: 1,
          reason: 'a'.repeat(501),
        }),
      });

      const response = await POST(request, { params: { slug: 'getting-started' } });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Validation failed');
      expect(body.details.reason).toContain('Reason must be less than 500 characters');
    });

    it('should accept valid updatedByType values', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
            update: jest.fn().mockResolvedValue(mockUpdatedPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
            create: jest.fn(),
          },
          wikiPageEvent: {
            create: jest.fn(),
          },
        } as any);
      });

      for (const type of ['human', 'agent', 'system']) {
        const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
          method: 'POST',
          body: JSON.stringify({
            version: 1,
            updatedByType: type,
          }),
        });

        const response = await POST(request, { params: { slug: 'getting-started' } });
        expect(response.status).toBe(200);
      }
    });

    it('should return 400 for invalid updatedByType', async () => {
      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({
          version: 1,
          updatedByType: 'invalid',
        }),
      });

      const response = await POST(request, { params: { slug: 'getting-started' } });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Validation failed');
    });
  });

  describe('Error cases', () => {
    it('should return 404 when wiki page not found', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };
        await callback(mockTx as any);
      });

      const request = new NextRequest('http://localhost/api/wiki/nonexistent/revert', {
        method: 'POST',
        body: JSON.stringify({ version: 1 }),
      });

      const response = await POST(request, { params: { slug: 'nonexistent' } });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('Wiki page not found');
    });

    it('should return 404 when target revision not found', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        await callback(mockTx as any);
      });

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({ version: 999 }),
      });

      const response = await POST(request, { params: { slug: 'getting-started' } });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('Revision not found');
      expect(body.message).toBe('Unable to locate the requested version.');
    });

    it('should return 500 when transaction fails', async () => {
      mockPrisma.$transaction.mockRejectedValueOnce(new Error('Transaction failed'));

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({ version: 1 }),
      });

      const response = await POST(request, { params: { slug: 'getting-started' } });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to revert wiki page');
    });

    it('should handle malformed JSON body', async () => {
      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request, { params: { slug: 'getting-started' } });

      expect(response.status).toBe(500);
    });
  });

  describe('Reason field handling', () => {
    it('should include reason in diffSummary when provided', async () => {
      let revisionCreateSpy: jest.Mock;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
            update: jest.fn().mockResolvedValue(mockUpdatedPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
            create: jest.fn(),
          },
          wikiPageEvent: {
            create: jest.fn(),
          },
        };
        revisionCreateSpy = mockTx.wikiRevision.create;
        await callback(mockTx as any);
        return mockUpdatedPage;
      });

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({
          version: 2,
          reason: 'Content was vandalized',
        }),
      });

      await POST(request, { params: { slug: 'getting-started' } });

      expect(revisionCreateSpy!).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            diffSummary: 'Reverted to v2: Content was vandalized',
          }),
        })
      );
    });

    it('should use default diffSummary when reason not provided', async () => {
      let revisionCreateSpy: jest.Mock;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
            update: jest.fn().mockResolvedValue(mockUpdatedPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
            create: jest.fn(),
          },
          wikiPageEvent: {
            create: jest.fn(),
          },
        };
        revisionCreateSpy = mockTx.wikiRevision.create;
        await callback(mockTx as any);
        return mockUpdatedPage;
      });

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({ version: 2 }),
      });

      await POST(request, { params: { slug: 'getting-started' } });

      expect(revisionCreateSpy!).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            diffSummary: 'Reverted to v2',
          }),
        })
      );
    });

    it('should include reason in event metadata', async () => {
      let eventCreateSpy: jest.Mock;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
            update: jest.fn().mockResolvedValue(mockUpdatedPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
            create: jest.fn(),
          },
          wikiPageEvent: {
            create: jest.fn(),
          },
        };
        eventCreateSpy = mockTx.wikiPageEvent.create;
        await callback(mockTx as any);
        return mockUpdatedPage;
      });

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({
          version: 1,
          reason: 'Bad formatting',
        }),
      });

      await POST(request, { params: { slug: 'getting-started' } });

      expect(eventCreateSpy!).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: {
              action: 'REVERT',
              targetVersion: 1,
              reason: 'Bad formatting',
            },
          }),
        })
      );
    });

    it('should set reason to null in metadata when not provided', async () => {
      let eventCreateSpy: jest.Mock;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          wikiPage: {
            findFirst: jest.fn().mockResolvedValue(mockPage),
            update: jest.fn().mockResolvedValue(mockUpdatedPage),
          },
          wikiRevision: {
            findUnique: jest.fn().mockResolvedValue(mockTargetRevision),
            create: jest.fn(),
          },
          wikiPageEvent: {
            create: jest.fn(),
          },
        };
        eventCreateSpy = mockTx.wikiPageEvent.create;
        await callback(mockTx as any);
        return mockUpdatedPage;
      });

      const request = new NextRequest('http://localhost/api/wiki/getting-started/revert', {
        method: 'POST',
        body: JSON.stringify({ version: 1 }),
      });

      await POST(request, { params: { slug: 'getting-started' } });

      expect(eventCreateSpy!).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: {
              action: 'REVERT',
              targetVersion: 1,
              reason: null,
            },
          }),
        })
      );
    });
  });
});
