/**
 * Unit Tests: withProjectAuth.ts
 *
 * Tests for the server-side auth + project resolution utility:
 * - withProjectAuth()
 * - withProjectOnly()
 */

import { withProjectAuth, withProjectOnly } from '../withProjectAuth';

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

const mockGetCurrentUser = jest.fn();
jest.mock('@/lib/auth-server', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

const mockGetActiveProjectForUser = jest.fn();
jest.mock('@/lib/project-context', () => ({
  getActiveProjectForUser: (userId: string, projectParam?: string) =>
    mockGetActiveProjectForUser(userId, projectParam),
}));

// ============================================================================
// Test Data
// ============================================================================

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
};

const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'ADMIN',
};

const mockProject = {
  id: 3,
  name: 'Test Project',
  ownerId: 'user-123',
};

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================================
// withProjectAuth() Tests
// ============================================================================

describe('withProjectAuth()', () => {
  describe('authentication', () => {
    it('should redirect to /login when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      await expect(withProjectAuth()).rejects.toThrow('NEXT_REDIRECT:/login');
      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });

    it('should not redirect when user is authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetActiveProjectForUser.mockResolvedValue({
        project: mockProject,
        projectId: mockProject.id,
      });

      const result = await withProjectAuth();

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(result.user.id).toBe(mockUser.id);
    });
  });

  describe('admin requirement', () => {
    it('should redirect to /app when requireAdmin=true and user is not admin', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser); // Regular user

      await expect(withProjectAuth(undefined, { requireAdmin: true })).rejects.toThrow(
        'NEXT_REDIRECT:/app'
      );

      expect(mockRedirect).toHaveBeenCalledWith('/app');
    });

    it('should not redirect when requireAdmin=true and user is admin', async () => {
      mockGetCurrentUser.mockResolvedValue(mockAdminUser);
      mockGetActiveProjectForUser.mockResolvedValue({
        project: mockProject,
        projectId: mockProject.id,
      });

      const result = await withProjectAuth(undefined, { requireAdmin: true });

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(result.user.role).toBe('ADMIN');
    });

    it('should allow regular users when requireAdmin is not set', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetActiveProjectForUser.mockResolvedValue({
        project: mockProject,
        projectId: mockProject.id,
      });

      const result = await withProjectAuth();

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(result.user.role).toBe('USER');
    });
  });

  describe('project resolution', () => {
    it('should pass searchParamsProject to getActiveProjectForUser', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetActiveProjectForUser.mockResolvedValue({
        project: mockProject,
        projectId: mockProject.id,
      });

      await withProjectAuth('42');

      expect(mockGetActiveProjectForUser).toHaveBeenCalledWith(mockUser.id, '42');
    });

    it('should pass undefined when no project param provided', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetActiveProjectForUser.mockResolvedValue({
        project: mockProject,
        projectId: mockProject.id,
      });

      await withProjectAuth();

      expect(mockGetActiveProjectForUser).toHaveBeenCalledWith(mockUser.id, undefined);
    });
  });

  describe('return value', () => {
    it('should return correct ProjectAuthContext structure', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetActiveProjectForUser.mockResolvedValue({
        project: mockProject,
        projectId: mockProject.id,
      });

      const result = await withProjectAuth('3');

      expect(result).toEqual({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
        },
        project: mockProject,
        projectId: 3,
      });
    });

    it('should handle null user name', async () => {
      const userWithNullName = { ...mockUser, name: null };
      mockGetCurrentUser.mockResolvedValue(userWithNullName);
      mockGetActiveProjectForUser.mockResolvedValue({
        project: mockProject,
        projectId: mockProject.id,
      });

      const result = await withProjectAuth();

      expect(result.user.name).toBeNull();
    });
  });
});

// ============================================================================
// withProjectOnly() Tests
// ============================================================================

describe('withProjectOnly()', () => {
  it('should call getActiveProjectForUser with provided userId', async () => {
    mockGetActiveProjectForUser.mockResolvedValue({
      project: mockProject,
      projectId: mockProject.id,
    });

    await withProjectOnly('user-456', '3');

    expect(mockGetActiveProjectForUser).toHaveBeenCalledWith('user-456', '3');
  });

  it('should return project context directly', async () => {
    const projectContext = {
      project: mockProject,
      projectId: mockProject.id,
    };
    mockGetActiveProjectForUser.mockResolvedValue(projectContext);

    const result = await withProjectOnly('user-456');

    expect(result).toEqual(projectContext);
  });

  it('should handle undefined searchParamsProject', async () => {
    mockGetActiveProjectForUser.mockResolvedValue({
      project: mockProject,
      projectId: mockProject.id,
    });

    await withProjectOnly('user-456');

    expect(mockGetActiveProjectForUser).toHaveBeenCalledWith('user-456', undefined);
  });
});
