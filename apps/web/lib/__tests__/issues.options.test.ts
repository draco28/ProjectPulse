import {
  getIssueOptionSets,
  resolveModuleValue,
  resolvePriorityValue,
  resolveStatusValue,
  clearIssueOptionCache,
} from '@/lib/issues/options';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    ticketStatusOption: { findMany: jest.fn() },
    ticketPriorityOption: { findMany: jest.fn() },
    ticketModuleOption: { findMany: jest.fn() },
  },
}));

const mockStatusFind = prisma.ticketStatusOption.findMany as unknown as jest.Mock;
const mockPriorityFind = prisma.ticketPriorityOption.findMany as unknown as jest.Mock;
const mockModuleFind = prisma.ticketModuleOption.findMany as unknown as jest.Mock;

describe('issues/options', () => {
  beforeEach(() => {
    clearIssueOptionCache();
    jest.clearAllMocks();
  });

  it('loads options from prisma and caches results', async () => {
    mockStatusFind.mockResolvedValue([
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ]);
    mockPriorityFind.mockResolvedValue([
      { value: 'high', label: 'High' },
      { value: 'low', label: 'Low' },
    ]);
    mockModuleFind.mockResolvedValue([{ value: 'API', label: 'API' }]);

    const first = await getIssueOptionSets();
    const second = await getIssueOptionSets();

    expect(first.statuses).toHaveLength(2);
    expect(second.priorities[0].value).toBe('high');
    expect(mockStatusFind).toHaveBeenCalledTimes(1);
  });

  it('throws when status options missing', async () => {
    mockStatusFind.mockResolvedValue([]);
    mockPriorityFind.mockResolvedValue([{ value: 'high', label: 'High' }]);
    mockModuleFind.mockResolvedValue([]);

    await expect(getIssueOptionSets()).rejects.toThrow('Issue status options not configured');
  });

  it('resolves values and rejects invalid inputs', async () => {
    mockStatusFind.mockResolvedValue([{ value: 'open', label: 'Open' }]);
    mockPriorityFind.mockResolvedValue([{ value: 'high', label: 'High' }]);
    mockModuleFind.mockResolvedValue([{ value: 'API', label: 'API' }]);

    await resolveStatusValue('open');
    await expect(resolvePriorityValue('high')).resolves.toBe('high');
    await expect(resolveModuleValue('API')).resolves.toBe('API');
    await expect(resolvePriorityValue('invalid')).rejects.toThrow('Invalid priority value');
  });
});
