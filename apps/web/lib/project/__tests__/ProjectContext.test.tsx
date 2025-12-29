/**
 * Unit Tests: ProjectContext.tsx
 *
 * Tests for the project context provider and hooks:
 * - ProjectProvider
 * - useProject() hook
 * - useProjectOptional() hook
 * - buildHref(), navigateTo(), updateSearchParams(), clearSearchParams()
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import {
  ProjectProvider,
  useProject,
  useProjectOptional,
  type ProjectContextValue,
} from '../ProjectContext';

// ============================================================================
// Mocks
// ============================================================================

const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/tickets',
}));

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  // Reset search params
  mockSearchParams.delete('project');
  mockSearchParams.delete('status');
  mockSearchParams.delete('q');
});

// ============================================================================
// Test Helpers
// ============================================================================

interface WrapperProps {
  children: React.ReactNode;
  projectId?: number;
  projectName?: string;
}

function createWrapper(projectId?: number, projectName?: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ProjectProvider projectId={projectId} projectName={projectName}>
        {children}
      </ProjectProvider>
    );
  };
}

// ============================================================================
// useProject() Hook Tests
// ============================================================================

describe('useProject() hook', () => {
  describe('when used outside ProjectProvider', () => {
    it('should throw a descriptive error', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useProject());
      }).toThrow(
        'useProject must be used within a ProjectProvider. ' +
          'Wrap your component tree with <ProjectProvider projectId={...}>.'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('when used inside ProjectProvider', () => {
    it('should return project context with projectId', () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: createWrapper(3, 'Test Project'),
      });

      expect(result.current.projectId).toBe(3);
      expect(result.current.projectName).toBe('Test Project');
    });

    it('should return null projectId when not provided', () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: createWrapper(),
      });

      expect(result.current.projectId).toBeNull();
      expect(result.current.projectName).toBeNull();
    });

    it('should prioritize server projectId over URL param', () => {
      // Set URL param
      mockSearchParams.set('project', '999');

      const { result } = renderHook(() => useProject(), {
        wrapper: createWrapper(3), // Server provides 3
      });

      // Should use server value (3), not URL value (999)
      expect(result.current.projectId).toBe(3);
    });
  });
});

// ============================================================================
// useProjectOptional() Hook Tests
// ============================================================================

describe('useProjectOptional() hook', () => {
  it('should return null when used outside ProjectProvider', () => {
    const { result } = renderHook(() => useProjectOptional());

    expect(result.current).toBeNull();
  });

  it('should return context when used inside ProjectProvider', () => {
    const { result } = renderHook(() => useProjectOptional(), {
      wrapper: createWrapper(5, 'Optional Project'),
    });

    expect(result.current).not.toBeNull();
    expect(result.current?.projectId).toBe(5);
    expect(result.current?.projectName).toBe('Optional Project');
  });
});

// ============================================================================
// buildHref() Tests
// ============================================================================

describe('buildHref()', () => {
  it('should add project param to path', () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(3),
    });

    const href = result.current.buildHref('/wiki');

    expect(href).toBe('/wiki?project=3');
  });

  it('should merge additional params', () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(3),
    });

    const href = result.current.buildHref('/tickets', { status: 'open', priority: 'high' });

    expect(href).toContain('project=3');
    expect(href).toContain('status=open');
    expect(href).toContain('priority=high');
  });

  it('should handle numeric params', () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(3),
    });

    const href = result.current.buildHref('/tickets', { page: 2, limit: 10 });

    expect(href).toContain('page=2');
    expect(href).toContain('limit=10');
  });

  it('should skip undefined values', () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(3),
    });

    const href = result.current.buildHref('/tickets', {
      status: 'open',
      priority: undefined,
    });

    expect(href).toContain('status=open');
    expect(href).not.toContain('priority');
  });

  it('should skip null values', () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(3),
    });

    const href = result.current.buildHref('/tickets', {
      status: 'open',
      priority: null as unknown as undefined,
    });

    expect(href).toContain('status=open');
    expect(href).not.toContain('priority');
  });

  it('should return path without query string when no projectId', () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(),
    });

    const href = result.current.buildHref('/wiki');

    expect(href).toBe('/wiki');
  });

  it('should include only additional params when no projectId', () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(),
    });

    const href = result.current.buildHref('/tickets', { status: 'open' });

    expect(href).toBe('/tickets?status=open');
  });
});

// ============================================================================
// navigateTo() Tests
// ============================================================================

describe('navigateTo()', () => {
  it('should call router.push with correct URL', () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(3),
    });

    act(() => {
      result.current.navigateTo('/wiki');
    });

    expect(mockPush).toHaveBeenCalledWith('/wiki?project=3');
  });

  it('should include additional params in navigation', () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(3),
    });

    act(() => {
      result.current.navigateTo('/tickets', { status: 'open' });
    });

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('project=3'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('status=open'));
  });
});

// ============================================================================
// updateSearchParams() Tests
// ============================================================================

describe('updateSearchParams()', () => {
  it('should preserve project param when updating', () => {
    mockSearchParams.set('project', '3');

    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(3),
    });

    act(() => {
      result.current.updateSearchParams({ q: 'search term' });
    });

    const calledUrl = mockPush.mock.calls[0][0];
    expect(calledUrl).toContain('project=3');
    expect(calledUrl).toContain('q=search+term');
  });

  it('should add project param if missing from URL', () => {
    // No project in URL params
    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(3), // But we have it from server
    });

    act(() => {
      result.current.updateSearchParams({ status: 'open' });
    });

    const calledUrl = mockPush.mock.calls[0][0];
    expect(calledUrl).toContain('project=3');
    expect(calledUrl).toContain('status=open');
  });

  it('should remove params when value is null', () => {
    mockSearchParams.set('project', '3');
    mockSearchParams.set('q', 'old search');

    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(3),
    });

    act(() => {
      result.current.updateSearchParams({ q: null });
    });

    const calledUrl = mockPush.mock.calls[0][0];
    expect(calledUrl).toContain('project=3');
    expect(calledUrl).not.toContain('q=');
  });

  it('should remove params when value is undefined', () => {
    mockSearchParams.set('project', '3');
    mockSearchParams.set('status', 'open');

    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(3),
    });

    act(() => {
      result.current.updateSearchParams({ status: undefined });
    });

    const calledUrl = mockPush.mock.calls[0][0];
    expect(calledUrl).toContain('project=3');
    expect(calledUrl).not.toContain('status=');
  });

  it('should handle multiple updates at once', () => {
    mockSearchParams.set('project', '3');
    mockSearchParams.set('oldParam', 'remove me');

    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(3),
    });

    act(() => {
      result.current.updateSearchParams({
        newParam: 'add me',
        oldParam: null,
        anotherNew: 'also add',
      });
    });

    const calledUrl = mockPush.mock.calls[0][0];
    expect(calledUrl).toContain('project=3');
    expect(calledUrl).toContain('newParam=add+me');
    expect(calledUrl).toContain('anotherNew=also+add');
    expect(calledUrl).not.toContain('oldParam=');
  });
});

// ============================================================================
// clearSearchParams() Tests
// ============================================================================

describe('clearSearchParams()', () => {
  it('should keep only project param', () => {
    mockSearchParams.set('project', '3');
    mockSearchParams.set('status', 'open');
    mockSearchParams.set('q', 'search');

    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(3),
    });

    act(() => {
      result.current.clearSearchParams();
    });

    expect(mockPush).toHaveBeenCalledWith('/tickets?project=3');
  });

  it('should navigate to path only when no projectId', () => {
    mockSearchParams.set('status', 'open');

    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.clearSearchParams();
    });

    expect(mockPush).toHaveBeenCalledWith('/tickets');
  });
});

// ============================================================================
// Project Resolution Tests
// ============================================================================

describe('Project Resolution', () => {
  it('should parse project from URL when server prop not provided', () => {
    mockSearchParams.set('project', '42');

    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(), // No server projectId
    });

    expect(result.current.projectId).toBe(42);
  });

  it('should return null for invalid URL project param', () => {
    mockSearchParams.set('project', 'invalid');

    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(),
    });

    expect(result.current.projectId).toBeNull();
  });

  it('should return null for empty URL project param', () => {
    mockSearchParams.set('project', '');

    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(),
    });

    expect(result.current.projectId).toBeNull();
  });

  it('should handle negative numbers as valid project IDs', () => {
    mockSearchParams.set('project', '-1');

    const { result } = renderHook(() => useProject(), {
      wrapper: createWrapper(),
    });

    // parseInt parses -1 successfully (actual validation happens elsewhere)
    expect(result.current.projectId).toBe(-1);
  });
});
