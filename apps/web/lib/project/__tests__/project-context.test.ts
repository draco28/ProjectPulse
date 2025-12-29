/**
 * Unit Tests: project-context.ts
 *
 * Tests for the project resolution utility:
 * - getActiveProjectForUser()
 *
 * Edge cases tested:
 * 1. Invalid project ID (non-numeric string like "invalid", "abc")
 * 2. Negative project ID ("-1")
 * 3. Project not found (999999)
 * 4. Project not owned by user (unauthorized access)
 * 5. No project param + user has projects (fallback behavior)
 * 6. No project param + user has no projects (redirect)
 * 7. Valid project ID owned by user (success case)
 */

import { getActiveProjectForUser } from '@/lib/project-context';

// ============================================================================
// Mocks
// ============================================================================

// Mock redirect to throw a specific error we can catch
const mockRedirect = jest.fn((path: string) => {
  const error = new Error(`NEXT_REDIRECT:${path}`);
  (error as Error & { digest: string }).digest = `NEXT_REDIRECT;${path}`;
  throw error;
});

jest.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}));

// Mock Prisma client
const mockPrismaProjectFindUnique = jest.fn();
const mockPrismaProjectFindFirst = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: (...args: unknown[]) => mockPrismaProjectFindUnique(...args),
      findFirst: (...args: unknown[]) => mockPrismaProjectFindFirst(...args),
    },
  },
}));

// ============================================================================
// Test Data
// ============================================================================

const mockUser1Id = 'user-123';
const mockUser2Id = 'user-456';

const mockProject = {
  id: 3,
  name: 'Test Project',
  ownerId: mockUser1Id,
};

const mockProject2 = {
  id: 5,
  name: 'Another Project',
  ownerId: mockUser2Id,
};

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================================
// getActiveProjectForUser() Tests
// ============================================================================

describe('getActiveProjectForUser()', () => {
  describe('invalid project ID formats', () => {
    it('should redirect to /app for non-numeric project ID "invalid"', async () => {
      await expect(getActiveProjectForUser(mockUser1Id, 'invalid')).rejects.toThrow(
        'NEXT_REDIRECT:/app'
      );

      expect(mockRedirect).toHaveBeenCalledWith('/app');
      expect(mockPrismaProjectFindUnique).not.toHaveBeenCalled();
    });

    it('should redirect to /app for non-numeric project ID "abc"', async () => {
      await expect(getActiveProjectForUser(mockUser1Id, 'abc')).rejects.toThrow(
        'NEXT_REDIRECT:/app'
      );

      expect(mockRedirect).toHaveBeenCalledWith('/app');
    });

    it('should redirect to /app for empty string project ID', async () => {
      await expect(getActiveProjectForUser(mockUser1Id, '')).rejects.toThrow(
        'NEXT_REDIRECT:/app'
      );

      expect(mockRedirect).toHaveBeenCalledWith('/app');
    });

    it('should redirect to /app for project ID with spaces', async () => {
      await expect(getActiveProjectForUser(mockUser1Id, '  ')).rejects.toThrow(
        'NEXT_REDIRECT:/app'
      );

      expect(mockRedirect).toHaveBeenCalledWith('/app');
    });

    it('should redirect to /app for mixed alphanumeric project ID "123abc"', async () => {
      // Note: parseInt('123abc') returns 123, so this will query DB
      // This tests that even partial numeric parsing works
      mockPrismaProjectFindUnique.mockResolvedValue(null);

      await expect(getActiveProjectForUser(mockUser1Id, '123abc')).rejects.toThrow(
        'NEXT_REDIRECT:/app'
      );
    });
  });

  describe('negative project ID', () => {
    it('should redirect to /app for negative project ID "-1"', async () => {
      // parseInt('-1') returns -1, which is a valid number
      // The project won't be found in DB
      mockPrismaProjectFindUnique.mockResolvedValue(null);

      await expect(getActiveProjectForUser(mockUser1Id, '-1')).rejects.toThrow(
        'NEXT_REDIRECT:/app'
      );

      expect(mockPrismaProjectFindUnique).toHaveBeenCalledWith({
        where: { id: -1 },
        select: { id: true, name: true, ownerId: true },
      });
    });

    it('should redirect to /app for zero project ID "0"', async () => {
      mockPrismaProjectFindUnique.mockResolvedValue(null);

      await expect(getActiveProjectForUser(mockUser1Id, '0')).rejects.toThrow(
        'NEXT_REDIRECT:/app'
      );
    });
  });

  describe('project not found', () => {
    it('should redirect to /app when project does not exist (999999)', async () => {
      mockPrismaProjectFindUnique.mockResolvedValue(null);

      await expect(getActiveProjectForUser(mockUser1Id, '999999')).rejects.toThrow(
        'NEXT_REDIRECT:/app'
      );

      expect(mockPrismaProjectFindUnique).toHaveBeenCalledWith({
        where: { id: 999999 },
        select: { id: true, name: true, ownerId: true },
      });
      expect(mockRedirect).toHaveBeenCalledWith('/app');
    });

    it('should redirect to /app for very large project ID', async () => {
      mockPrismaProjectFindUnique.mockResolvedValue(null);

      await expect(
        getActiveProjectForUser(mockUser1Id, '9999999999')
      ).rejects.toThrow('NEXT_REDIRECT:/app');
    });
  });

  describe('unauthorized access (project not owned by user)', () => {
    it('should redirect to /app when project exists but user does not own it', async () => {
      // Project exists but is owned by a different user
      mockPrismaProjectFindUnique.mockResolvedValue(mockProject2);

      await expect(getActiveProjectForUser(mockUser1Id, '5')).rejects.toThrow(
        'NEXT_REDIRECT:/app'
      );

      expect(mockPrismaProjectFindUnique).toHaveBeenCalledWith({
        where: { id: 5 },
        select: { id: true, name: true, ownerId: true },
      });
      expect(mockRedirect).toHaveBeenCalledWith('/app');
    });

    it('should succeed when project is owned by the requesting user', async () => {
      mockPrismaProjectFindUnique.mockResolvedValue(mockProject);

      const result = await getActiveProjectForUser(mockUser1Id, '3');

      expect(result).toEqual({
        project: mockProject,
        projectId: 3,
      });
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('fallback behavior (no project param)', () => {
    it('should return first owned project when no project param provided', async () => {
      mockPrismaProjectFindFirst.mockResolvedValue(mockProject);

      const result = await getActiveProjectForUser(mockUser1Id, undefined);

      expect(result).toEqual({
        project: mockProject,
        projectId: 3,
      });
      expect(mockPrismaProjectFindFirst).toHaveBeenCalledWith({
        where: { ownerId: mockUser1Id },
        select: { id: true, name: true, ownerId: true },
      });
      expect(mockPrismaProjectFindUnique).not.toHaveBeenCalled();
    });

    it('should redirect to /app when user has no projects', async () => {
      mockPrismaProjectFindFirst.mockResolvedValue(null);

      await expect(getActiveProjectForUser(mockUser1Id, undefined)).rejects.toThrow(
        'NEXT_REDIRECT:/app'
      );

      expect(mockRedirect).toHaveBeenCalledWith('/app');
    });
  });

  describe('valid project ID', () => {
    it('should return project context for valid owned project', async () => {
      mockPrismaProjectFindUnique.mockResolvedValue(mockProject);

      const result = await getActiveProjectForUser(mockUser1Id, '3');

      expect(result).toEqual({
        project: mockProject,
        projectId: 3,
      });
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should parse string project ID to number', async () => {
      mockPrismaProjectFindUnique.mockResolvedValue(mockProject);

      const result = await getActiveProjectForUser(mockUser1Id, '3');

      expect(result.projectId).toBe(3);
      expect(typeof result.projectId).toBe('number');
    });
  });
});
