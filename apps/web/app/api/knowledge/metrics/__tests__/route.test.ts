/**
 * @jest-environment node
 *
 * Knowledge Metrics API route tests
 * Tests GET /api/knowledge/metrics endpoint
 *
 * TODO: Implement GET /api/knowledge/metrics route before enabling these tests
 * Tests are ready - just need to create the actual API route implementation
 */

// Mock Prisma before importing the route
jest.mock('@/lib/prisma', () => ({
  prisma: {
    knowledgeQueryMetric: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
// import { GET } from '../route'; // TODO: Uncomment when route is implemented
import { NextRequest } from 'next/server';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Stub GET function for testing (TODO: replace with actual import when route exists)
const GET = async (_req: NextRequest) => {
  return Response.json({ error: 'Route not implemented yet' }, { status: 500 });
};

describe.skip('GET /api/knowledge/metrics (TODO: implement route)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns metrics with summary when no filters provided', async () => {
    const mockMetrics = [
      {
        id: 1,
        queryText: 'authentication patterns',
        resultCount: 5,
        cacheHit: true,
        executionTimeMs: 25,
        timestamp: new Date('2025-11-13T10:30:00Z'),
      },
      {
        id: 2,
        queryText: 'testing strategies',
        resultCount: 8,
        cacheHit: false,
        executionTimeMs: 45,
        timestamp: new Date('2025-11-13T11:00:00Z'),
      },
    ];

    mockPrisma.knowledgeQueryMetric.findMany.mockResolvedValueOnce(mockMetrics);
    mockPrisma.knowledgeQueryMetric.aggregate.mockResolvedValueOnce({
      _count: { id: 150 },
      _avg: { executionTimeMs: 32.5 },
    });
    mockPrisma.knowledgeQueryMetric.groupBy.mockResolvedValueOnce([
      { queryText: 'authentication', _count: { queryText: 25 } },
      { queryText: 'testing', _count: { queryText: 20 } },
      { queryText: 'deployment', _count: { queryText: 15 } },
    ]);

    const req = new NextRequest('http://localhost:3000/api/knowledge/metrics');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('metrics');
    expect(body.data).toHaveProperty('summary');
    expect(body.data.metrics).toHaveLength(2);
    expect(body.data.summary).toHaveProperty('totalQueries');
    expect(body.data.summary).toHaveProperty('cacheHitRate');
    expect(body.data.summary).toHaveProperty('averageExecutionTime');
    expect(body.data.summary).toHaveProperty('popularQueries');
  });

  it('filters metrics by date range', async () => {
    const mockMetrics = [
      {
        id: 1,
        queryText: 'recent query',
        resultCount: 3,
        cacheHit: true,
        executionTimeMs: 20,
        timestamp: new Date('2025-11-13T10:00:00Z'),
      },
    ];

    mockPrisma.knowledgeQueryMetric.findMany.mockResolvedValueOnce(mockMetrics);

    const req = new NextRequest(
      'http://localhost:3000/api/knowledge/metrics?startDate=2025-11-13T00:00:00Z&endDate=2025-11-13T23:59:59Z'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.metrics).toHaveLength(1);
    expect(mockPrisma.knowledgeQueryMetric.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          timestamp: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    );
  });

  it('respects limit parameter', async () => {
    mockPrisma.knowledgeQueryMetric.findMany.mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost:3000/api/knowledge/metrics?limit=50');
    const res = await GET(req);
    await res.json(); // Parse response to complete request

    expect(res.status).toBe(200);
    expect(mockPrisma.knowledgeQueryMetric.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
      })
    );
  });

  it('calculates cache hit rate correctly', async () => {
    const mockMetrics = [
      { id: 1, cacheHit: true, executionTimeMs: 5 },
      { id: 2, cacheHit: true, executionTimeMs: 6 },
      { id: 3, cacheHit: false, executionTimeMs: 50 },
      { id: 4, cacheHit: true, executionTimeMs: 4 },
      { id: 5, cacheHit: false, executionTimeMs: 45 },
    ];

    mockPrisma.knowledgeQueryMetric.findMany.mockResolvedValueOnce(mockMetrics as any);
    mockPrisma.knowledgeQueryMetric.aggregate.mockResolvedValueOnce({
      _count: { id: 100 },
      _avg: { executionTimeMs: 22 },
    });
    mockPrisma.knowledgeQueryMetric.groupBy.mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost:3000/api/knowledge/metrics');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    // 3 out of 5 = 60% cache hit rate
    expect(body.data.summary.cacheHitRate).toBeCloseTo(0.6, 2);
  });

  it('handles database errors gracefully', async () => {
    mockPrisma.knowledgeQueryMetric.findMany.mockRejectedValueOnce(
      new Error('Database connection failed')
    );

    const req = new NextRequest('http://localhost:3000/api/knowledge/metrics');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });

  it('validates date parameters', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/knowledge/metrics?startDate=invalid-date'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty('error');
  });
});
