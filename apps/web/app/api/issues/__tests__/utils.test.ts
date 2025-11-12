const mockNextResponse = {
  json: jest.fn((value: unknown) => value),
};

jest.mock('next/server', () => ({
  NextResponse: mockNextResponse,
}));

class MockGlobalResponse {
  constructor(public body?: unknown, public init?: ResponseInit) {}
}

(global as unknown as { Response: typeof Response }).Response = MockGlobalResponse as unknown as typeof Response;

import type { IssueFilters } from '@/lib/validations/issue';
import { prisma } from '@/lib/prisma';
import { buildIssueOrderBy, buildIssueWhere, resolveProjectId } from '../_utils';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

const mockedProjectFindUnique = prisma.project.findUnique as jest.Mock;
const mockedProjectFindFirst = prisma.project.findFirst as jest.Mock;

describe('issues/_utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveProjectId', () => {
    it('returns provided projectId when project exists', async () => {
      mockedProjectFindUnique.mockResolvedValue({ id: 42 });

      await expect(resolveProjectId(42)).resolves.toBe(42);

      expect(mockedProjectFindUnique).toHaveBeenCalledWith({
        where: { id: 42 },
        select: { id: true },
      });
      expect(mockedProjectFindFirst).not.toHaveBeenCalled();
    });

    it('falls back to first project when no projectId is provided', async () => {
      mockedProjectFindFirst.mockResolvedValue({ id: 7 });

      await expect(resolveProjectId()).resolves.toBe(7);

      expect(mockedProjectFindFirst).toHaveBeenCalledWith({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('throws when requested project does not exist', async () => {
      mockedProjectFindUnique.mockResolvedValue(null);

      await expect(resolveProjectId(999)).rejects.toThrow('Project 999 not found');
    });

    it('throws when no projects exist at all', async () => {
      mockedProjectFindFirst.mockResolvedValue(null);

      await expect(resolveProjectId()).rejects.toThrow('No projects available');
    });
  });

  describe('buildIssueWhere', () => {
    const baseFilters: IssueFilters = {
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    };

    it('builds where clause with provided filters', () => {
      const where = buildIssueWhere(
        {
          ...baseFilters,
          status: ['open', 'in_progress'],
          priority: ['high'],
          module: ['API'],
          assignee: ['agent'],
          tags: ['bug'],
          search: 'token',
          createdFrom: '2025-11-01T00:00:00.000Z',
          createdTo: '2025-11-10T00:00:00.000Z',
        },
        123
      );

      expect(where).toMatchObject({
        projectId: 123,
        status: { in: ['open', 'in_progress'] },
        priority: { in: ['high'] },
        module: { in: ['API'] },
        assignee: { in: ['agent'] },
        labels: { some: { name: { in: ['bug'] } } },
        OR: [
          { title: { contains: 'token', mode: 'insensitive' } },
          { description: { contains: 'token', mode: 'insensitive' } },
        ],
      });
      expect(where.createdAt).toMatchObject({
        gte: new Date('2025-11-01T00:00:00.000Z'),
        lte: new Date('2025-11-10T00:00:00.000Z'),
      });
    });

    it('omits optional filters when not provided', () => {
      const where = buildIssueWhere(baseFilters, 55);

      expect(where).toEqual({ projectId: 55 });
    });
  });

  describe('buildIssueOrderBy', () => {
    it('respects sortBy and sortDirection', () => {
      expect(
        buildIssueOrderBy({
          sortBy: 'updatedAt',
          sortDirection: 'asc',
        } as IssueFilters)
      ).toEqual({ updatedAt: 'asc' });

      expect(
        buildIssueOrderBy({
          sortBy: 'priority',
          sortDirection: 'desc',
        } as IssueFilters)
      ).toEqual({ priority: 'desc' });

      expect(buildIssueOrderBy({} as IssueFilters)).toEqual({ createdAt: 'desc' });
    });
  });
});
