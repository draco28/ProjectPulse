/**
 * Unit tests for Agent Server Actions
 * Tests slug collision handling and createAgent robustness
 */

// Mock Next.js cache functions BEFORE imports
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    agentPersona: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { createAgent } from '../actions';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('createAgent Server Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates agent with generated slug from name', async () => {
    (mockPrisma.agentPersona.findUnique as jest.Mock).mockResolvedValue(null); // Slug available
    (mockPrisma.agentPersona.create as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Code Reviewer',
      slug: 'code-reviewer',
      description: 'Reviews code',
      expertise: ['security'],
      personality: null,
      systemPrompt: 'You are Code Reviewer. Reviews code',
      skills: [],
      tools: [],
      rules: [],
      isActive: false,
      isBuiltIn: false,
      autoActivate: false,
      activationConditions: null,
      icon: null,
      templateId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createAgent({
      name: 'Code Reviewer',
      description: 'Reviews code',
      expertise: ['security'],
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.agentPersona.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Code Reviewer',
        slug: 'code-reviewer',
        description: 'Reviews code',
      }),
    });
  });

  it('handles slug collision by appending -2', async () => {
    // First slug is taken
    (mockPrisma.agentPersona.findUnique as jest.Mock)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValueOnce({ id: 1 } as any) // Slug 'code-reviewer' taken
      .mockResolvedValueOnce(null); // Slug 'code-reviewer-2' available

    (mockPrisma.agentPersona.create as jest.Mock).mockResolvedValue({
      id: 2,
      name: 'Code Reviewer',
      slug: 'code-reviewer-2',
      description: 'Another reviewer',
      expertise: ['testing'],
      personality: null,
      systemPrompt: 'You are Code Reviewer. Another reviewer',
      skills: [],
      tools: [],
      rules: [],
      isActive: false,
      isBuiltIn: false,
      autoActivate: false,
      activationConditions: null,
      icon: null,
      templateId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createAgent({
      name: 'Code Reviewer',
      description: 'Another reviewer',
      expertise: ['testing'],
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.agentPersona.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: 'code-reviewer-2',
      }),
    });
  });

  it('handles multiple slug collisions', async () => {
    // First 3 slugs are taken
    (mockPrisma.agentPersona.findUnique as jest.Mock)
      /* eslint-disable @typescript-eslint/no-explicit-any */
      .mockResolvedValueOnce({ id: 1 } as any) // 'test-agent' taken
      .mockResolvedValueOnce({ id: 2 } as any) // 'test-agent-2' taken
      .mockResolvedValueOnce({ id: 3 } as any) // 'test-agent-3' taken
      /* eslint-enable @typescript-eslint/no-explicit-any */
      .mockResolvedValueOnce(null); // 'test-agent-4' available

    (mockPrisma.agentPersona.create as jest.Mock).mockResolvedValue({
      id: 4,
      name: 'Test Agent',
      slug: 'test-agent-4',
      description: 'Fourth agent',
      expertise: [],
      personality: null,
      systemPrompt: 'You are Test Agent. Fourth agent',
      skills: [],
      tools: [],
      rules: [],
      isActive: false,
      isBuiltIn: false,
      autoActivate: false,
      activationConditions: null,
      icon: null,
      templateId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createAgent({
      name: 'Test Agent',
      description: 'Fourth agent',
      expertise: [],
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.agentPersona.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: 'test-agent-4',
      }),
    });
  });

  it('returns error after max attempts (10)', async () => {
    // All 11 slugs are taken (base + 10 attempts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockPrisma.agentPersona.findUnique as jest.Mock).mockResolvedValue({ id: 1 } as any);

    const result = await createAgent({
      name: 'Popular Agent',
      description: 'Too many agents with this name',
      expertise: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unable to generate unique slug');
    expect(mockPrisma.agentPersona.create).not.toHaveBeenCalled();
  });

  it('sanitizes slug correctly', async () => {
    (mockPrisma.agentPersona.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.agentPersona.create as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Code & Review!',
      slug: 'code-review',
      description: 'Test',
      expertise: [],
      personality: null,
      systemPrompt: 'You are Code & Review!. Test',
      skills: [],
      tools: [],
      rules: [],
      isActive: false,
      isBuiltIn: false,
      autoActivate: false,
      activationConditions: null,
      icon: null,
      templateId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createAgent({
      name: 'Code & Review!',
      description: 'Test',
      expertise: [],
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.agentPersona.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: 'code-review', // Special characters removed
      }),
    });
  });

  it('includes all required Prisma fields', async () => {
    (mockPrisma.agentPersona.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.agentPersona.create as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Full Agent',
      slug: 'full-agent',
      description: 'Complete agent',
      expertise: ['architecture', 'testing'],
      personality: 'Helpful and thorough',
      systemPrompt: 'You are Full Agent. Complete agent',
      skills: [],
      tools: [],
      rules: [],
      isActive: false,
      isBuiltIn: false,
      autoActivate: false,
      activationConditions: null,
      icon: null,
      templateId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createAgent({
      name: 'Full Agent',
      description: 'Complete agent',
      expertise: ['architecture', 'testing'],
      personality: 'Helpful and thorough',
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.agentPersona.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Full Agent',
        slug: 'full-agent',
        description: 'Complete agent',
        systemPrompt: expect.stringContaining('Full Agent'),
        expertise: ['architecture', 'testing'],
        personality: 'Helpful and thorough',
        skills: [],
        tools: [],
        rules: [],
        isActive: false,
      }),
    });
  });
});
