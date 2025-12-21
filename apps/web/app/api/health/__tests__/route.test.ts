/**
 * @jest-environment node
 *
 * Health API route tests
 */

// Mock Prisma before importing the route
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { GET } from '../route';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('GET /api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns healthy with database connected when query succeeds', async () => {
    (mockPrisma.$queryRaw as unknown as jest.Mock).mockResolvedValueOnce([{ '?column?': 1 }]);

    const res = await GET();
    const body = await res.json();

    expect(body.status).toBe('healthy');
    expect(body.database).toBe('connected');
    expect(typeof body.timestamp).toBe('string');
  });

  it('returns healthy with database error when query fails', async () => {
    (mockPrisma.$queryRaw as unknown as jest.Mock).mockRejectedValueOnce(new Error('db down'));

    const res = await GET();
    const body = await res.json();

    expect(body.status).toBe('healthy');
    expect(body.database).toBe('error');
    expect(typeof body.timestamp).toBe('string');
  });
});
