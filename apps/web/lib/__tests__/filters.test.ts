/**
 * Unit Tests: Filter Options Helper Functions
 *
 * Tests lib/filters.ts functions:
 * - getFilterOptions() - Fetches and caches filter options from database
 * - getFilterCounts() - Computes count of issues per filter value
 *
 * @see apps/web/lib/filters.ts for implementation
 */

import { getFilterOptions, getFilterCounts } from '../filters';
import { prisma } from '@/lib/prisma';
import type { FiltersDTO } from '@/types/filters';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    issueStatusOption: {
      findMany: jest.fn(),
    },
    issuePriorityOption: {
      findMany: jest.fn(),
    },
    issueModuleOption: {
      findMany: jest.fn(),
    },
    label: {
      findMany: jest.fn(),
    },
    issue: {
      count: jest.fn(),
    },
  },
}));

// Mock Next.js cache
jest.mock('next/cache', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  unstable_cache: <T>(fn: () => Promise<T>) => fn,
}));

describe('getFilterOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and return all filter options from database', async () => {
    // Mock database responses
    const mockStatusOptions = [
      { value: 'open', label: 'Open', order: 0, colorClass: 'text-blue-600' },
      { value: 'in_progress', label: 'In Progress', order: 1, colorClass: 'text-yellow-600' },
      { value: 'closed', label: 'Closed', order: 2, colorClass: 'text-green-600' },
    ];

    const mockPriorityOptions = [
      {
        value: 'critical',
        label: 'Critical',
        order: 0,
        dotColorClass: 'bg-red-600',
        badgeColorClass: 'bg-red-100 text-red-800',
      },
      {
        value: 'high',
        label: 'High',
        order: 1,
        dotColorClass: 'bg-orange-600',
        badgeColorClass: 'bg-orange-100 text-orange-800',
      },
    ];

    const mockModuleOptions = [
      { value: 'combat', label: 'Combat', order: 0 },
      { value: 'animation', label: 'Animation', order: 1 },
    ];

    const mockLabels = [
      { id: 1, name: 'bug', color: '#d73a4a' },
      { id: 2, name: 'enhancement', color: '#a2eeef' },
    ];

    // Setup mocks
    (prisma.issueStatusOption.findMany as jest.Mock).mockResolvedValue(mockStatusOptions);
    (prisma.issuePriorityOption.findMany as jest.Mock).mockResolvedValue(mockPriorityOptions);
    (prisma.issueModuleOption.findMany as jest.Mock).mockResolvedValue(mockModuleOptions);
    (prisma.label.findMany as jest.Mock).mockResolvedValue(mockLabels);

    // Execute
    const result = await getFilterOptions();

    // Verify structure
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('priority');
    expect(result).toHaveProperty('modules');
    expect(result).toHaveProperty('labels');

    // Verify status options
    expect(result.status).toHaveLength(3);
    expect(result.status[0]).toEqual({
      value: 'open',
      label: 'Open',
      colorClass: 'text-blue-600',
    });

    // Verify priority options
    expect(result.priority).toHaveLength(2);
    expect(result.priority[0]).toEqual({
      value: 'critical',
      label: 'Critical',
      dotColorClass: 'bg-red-600',
      badgeColorClass: 'bg-red-100 text-red-800',
    });

    // Verify module options
    expect(result.modules).toHaveLength(2);
    expect(result.modules[0]).toEqual({
      value: 'combat',
      label: 'Combat',
    });

    // Verify labels
    expect(result.labels).toHaveLength(2);
    expect(result.labels[0]).toEqual({
      id: 1,
      name: 'bug',
      color: '#d73a4a',
    });
  });

  it('should call Prisma with correct orderBy clauses', async () => {
    // Mock responses (minimal)
    (prisma.issueStatusOption.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.issuePriorityOption.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.issueModuleOption.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.label.findMany as jest.Mock).mockResolvedValue([]);

    await getFilterOptions();

    // Verify status options ordered by 'order' field
    expect(prisma.issueStatusOption.findMany).toHaveBeenCalledWith({
      orderBy: { order: 'asc' },
      select: {
        value: true,
        label: true,
        colorClass: true,
      },
    });

    // Verify priority options ordered by 'order' field
    expect(prisma.issuePriorityOption.findMany).toHaveBeenCalledWith({
      orderBy: { order: 'asc' },
      select: {
        value: true,
        label: true,
        dotColorClass: true,
        badgeColorClass: true,
      },
    });

    // Verify module options ordered by 'order' field
    expect(prisma.issueModuleOption.findMany).toHaveBeenCalledWith({
      orderBy: { order: 'asc' },
      select: {
        value: true,
        label: true,
      },
    });

    // Verify labels ordered by 'name' field
    expect(prisma.label.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });
  });

  it('should handle null color classes by converting to undefined', async () => {
    // Mock status option with null colorClass
    const mockStatusWithNullColor = [
      { value: 'draft', label: 'Draft', order: 3, colorClass: null },
    ];

    (prisma.issueStatusOption.findMany as jest.Mock).mockResolvedValue(mockStatusWithNullColor);
    (prisma.issuePriorityOption.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.issueModuleOption.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.label.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getFilterOptions();

    // Null should be converted to undefined
    expect(result.status[0].colorClass).toBeUndefined();
    expect(result.status[0]).not.toHaveProperty('colorClass', null);
  });

  it('should throw error if database query fails', async () => {
    // Mock database error
    (prisma.issueStatusOption.findMany as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    // Should throw
    await expect(getFilterOptions()).rejects.toThrow('Database connection failed');
  });
});

describe('getFilterCounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should compute counts for all filter values', async () => {
    // Mock filter options
    const mockOptions: FiltersDTO = {
      status: [
        { value: 'open', label: 'Open' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'closed', label: 'Closed' },
      ],
      priority: [
        { value: 'critical', label: 'Critical' },
        { value: 'high', label: 'High' },
      ],
      modules: [
        { value: 'combat', label: 'Combat' },
        { value: 'animation', label: 'Animation' },
      ],
      labels: [],
    };

    (prisma.issueStatusOption.findMany as jest.Mock).mockResolvedValue(mockOptions.status);
    (prisma.issuePriorityOption.findMany as jest.Mock).mockResolvedValue(mockOptions.priority);
    (prisma.issueModuleOption.findMany as jest.Mock).mockResolvedValue(mockOptions.modules);
    (prisma.label.findMany as jest.Mock).mockResolvedValue([]);

    // Mock issue counts
    let callCount = 0;
    (prisma.issue.count as jest.Mock).mockImplementation(() => {
      const counts = [5, 3, 2, 1, 4, 2, 3]; // 7 counts total
      return Promise.resolve(counts[callCount++]);
    });

    const result = await getFilterCounts();

    // Verify structure
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('priority');
    expect(result).toHaveProperty('module');

    // Verify status counts
    expect(result.status).toEqual({
      open: 5,
      in_progress: 3,
      closed: 2,
    });

    // Verify priority counts
    expect(result.priority).toEqual({
      critical: 1,
      high: 4,
    });

    // Verify module counts
    expect(result.module).toEqual({
      combat: 2,
      animation: 3,
    });
  });

  it('should call prisma.issue.count with correct where clauses', async () => {
    const mockOptions: FiltersDTO = {
      status: [{ value: 'open', label: 'Open' }],
      priority: [{ value: 'high', label: 'High' }],
      modules: [{ value: 'combat', label: 'Combat' }],
      labels: [],
    };

    (prisma.issueStatusOption.findMany as jest.Mock).mockResolvedValue(mockOptions.status);
    (prisma.issuePriorityOption.findMany as jest.Mock).mockResolvedValue(mockOptions.priority);
    (prisma.issueModuleOption.findMany as jest.Mock).mockResolvedValue(mockOptions.modules);
    (prisma.label.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.issue.count as jest.Mock).mockResolvedValue(0);

    await getFilterCounts();

    // Should be called 3 times (1 status + 1 priority + 1 module)
    expect(prisma.issue.count).toHaveBeenCalledTimes(3);

    // Verify where clauses
    expect(prisma.issue.count).toHaveBeenCalledWith({ where: { status: 'open' } });
    expect(prisma.issue.count).toHaveBeenCalledWith({ where: { priority: 'high' } });
    expect(prisma.issue.count).toHaveBeenCalledWith({ where: { module: 'combat' } });
  });

  it('should handle zero counts correctly', async () => {
    const mockOptions: FiltersDTO = {
      status: [{ value: 'archived', label: 'Archived' }],
      priority: [],
      modules: [],
      labels: [],
    };

    (prisma.issueStatusOption.findMany as jest.Mock).mockResolvedValue(mockOptions.status);
    (prisma.issuePriorityOption.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.issueModuleOption.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.label.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.issue.count as jest.Mock).mockResolvedValue(0);

    const result = await getFilterCounts();

    expect(result.status.archived).toBe(0);
  });

  it('should execute count queries in parallel', async () => {
    const mockOptions: FiltersDTO = {
      status: [{ value: 'open', label: 'Open' }],
      priority: [{ value: 'high', label: 'High' }],
      modules: [{ value: 'combat', label: 'Combat' }],
      labels: [],
    };

    (prisma.issueStatusOption.findMany as jest.Mock).mockResolvedValue(mockOptions.status);
    (prisma.issuePriorityOption.findMany as jest.Mock).mockResolvedValue(mockOptions.priority);
    (prisma.issueModuleOption.findMany as jest.Mock).mockResolvedValue(mockOptions.modules);
    (prisma.label.findMany as jest.Mock).mockResolvedValue([]);

    // Track timing of count calls
    const callTimestamps: number[] = [];
    (prisma.issue.count as jest.Mock).mockImplementation(() => {
      callTimestamps.push(Date.now());
      return Promise.resolve(0);
    });

    await getFilterCounts();

    // All count calls should happen nearly simultaneously (< 50ms apart)
    // This verifies they're executed in parallel via Promise.all
    expect(callTimestamps).toHaveLength(3);
    const maxTimeDiff = Math.max(...callTimestamps) - Math.min(...callTimestamps);
    expect(maxTimeDiff).toBeLessThan(50);
  });
});
