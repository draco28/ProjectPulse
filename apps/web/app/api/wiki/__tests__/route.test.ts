/**
 * @jest-environment node
 *
 * Tests for GET /api/wiki covering pagination and tsvector search behaviour
 *
 * Ticket #132: Updated for per-project path uniqueness
 * - Added auth mock (getAuthorizedProjectId)
 * - findUnique → findFirst
 * - Added projectId to where clauses
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

jest.mock('@/lib/prisma', () => ({
  prisma: {
    wikiPage: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET } from '../route';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('GET /api/wiki', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated wiki pages when no search term is provided', async () => {
    const timestamp = new Date('2025-11-11T10:00:00Z');
    mockPrisma.wikiPage.findMany.mockResolvedValueOnce([
      {
        id: 1,
        title: 'Getting Started',
        path: '/getting-started',
        category: 'guides',
        excerpt: 'Learn how to get started',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ] as any);
    mockPrisma.wikiPage.count.mockResolvedValueOnce(1);

    const request = new NextRequest('http://localhost/api/wiki?limit=5&offset=0');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.wikiPage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 6 },
        take: 5,
        skip: 0,
      })
    );
    expect(body.pages).toEqual([
      {
        id: 1,
        title: 'Getting Started',
        path: '/getting-started',
        category: 'guides',
        excerpt: 'Learn how to get started',
        createdAt: timestamp.toISOString(),
        updatedAt: timestamp.toISOString(),
      },
    ]);
    expect(body.pagination).toEqual({
      total: 1,
      limit: 5,
      offset: 0,
      hasMore: false,
    });
  });

  it('applies category filter for basic list queries', async () => {
    mockPrisma.wikiPage.findMany.mockResolvedValueOnce([] as any);
    mockPrisma.wikiPage.count.mockResolvedValueOnce(0);

    const request = new NextRequest('http://localhost/api/wiki?category=guides');
    await GET(request);

    expect(mockPrisma.wikiPage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 6, category: 'guides' },
      })
    );
    expect(mockPrisma.wikiPage.count).toHaveBeenCalledWith({ where: { projectId: 6, category: 'guides' } });
  });

  it('uses tsvector search and highlights results when search term is provided', async () => {
    const createdAt = new Date('2025-11-11T09:00:00Z');
    const updatedAt = new Date('2025-11-11T10:00:00Z');
    const rows = [
      {
        id: 42,
        title: 'Installation Guide',
        path: '/getting-started',
        category: 'guides',
        excerpt: null,
        createdAt,
        updatedAt,
        highlight: '**Installation** steps',
        rank: 0.91,
      },
    ];

    mockPrisma.$queryRaw.mockResolvedValueOnce(rows as any);
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ count: 1 }] as any);

    const request = new NextRequest(
      'http://localhost/api/wiki?search=installation&limit=10&offset=0'
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    expect(body.pages).toEqual([
      {
        id: 42,
        title: 'Installation Guide',
        path: '/getting-started',
        category: 'guides',
        excerpt: '**Installation** steps',
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        highlight: '**Installation** steps',
      },
    ]);
    expect(body.pagination).toEqual({
      total: 1,
      limit: 10,
      offset: 0,
      hasMore: false,
    });
  });

  it('returns 500 when the query fails', async () => {
    mockPrisma.wikiPage.findMany.mockRejectedValueOnce(new Error('database unavailable'));

    const request = new NextRequest('http://localhost/api/wiki');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: 'Internal server error',
      message: 'Failed to fetch wiki pages. Please try again.',
    });
  });
});
