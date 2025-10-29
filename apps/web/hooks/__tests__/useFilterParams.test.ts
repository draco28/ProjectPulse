/**
 * Unit Tests: useFilterParams Hook
 *
 * Tests hooks/useFilterParams.ts custom hook for URL-based filter state management.
 * Covers:
 * - CSV parameter parsing
 * - Filter activation checking
 * - updateFilter function (add/remove values)
 * - clearAllFilters function
 * - hasActiveFilters computed value
 *
 * @see apps/web/hooks/useFilterParams.ts for implementation
 */

import { renderHook, act } from '@testing-library/react';
import { useFilterParams } from '../useFilterParams';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockUseSearchParams(),
}));

describe('useFilterParams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  describe('currentFilters parsing', () => {
    it('should parse empty search params to empty arrays', () => {
      const searchParams = {};
      const { result } = renderHook(() => useFilterParams(searchParams));

      expect(result.current.currentFilters).toEqual({
        status: [],
        priority: [],
        module: [],
      });
    });

    it('should parse single value CSV params', () => {
      const searchParams = {
        status: 'open',
        priority: 'high',
        module: 'combat',
      };

      const { result } = renderHook(() => useFilterParams(searchParams));

      expect(result.current.currentFilters).toEqual({
        status: ['open'],
        priority: ['high'],
        module: ['combat'],
      });
    });

    it('should parse multiple value CSV params', () => {
      const searchParams = {
        status: 'open,in_progress',
        priority: 'critical,high,medium',
        module: 'combat,animation',
      };

      const { result } = renderHook(() => useFilterParams(searchParams));

      expect(result.current.currentFilters).toEqual({
        status: ['open', 'in_progress'],
        priority: ['critical', 'high', 'medium'],
        module: ['combat', 'animation'],
      });
    });

    it('should filter out empty strings from CSV', () => {
      const searchParams = {
        status: 'open,,in_progress,',
      };

      const { result } = renderHook(() => useFilterParams(searchParams));

      // Empty strings should be filtered out
      expect(result.current.currentFilters.status).toEqual(['open', 'in_progress']);
      expect(result.current.currentFilters.status).not.toContain('');
    });

    it('should handle undefined params', () => {
      const searchParams = {
        status: undefined,
        priority: undefined,
        module: undefined,
      };

      const { result } = renderHook(() => useFilterParams(searchParams));

      expect(result.current.currentFilters).toEqual({
        status: [],
        priority: [],
        module: [],
      });
    });
  });

  describe('isActive', () => {
    it('should return true if value is in current filters', () => {
      const searchParams = {
        status: 'open,closed',
        priority: 'high',
      };

      const { result } = renderHook(() => useFilterParams(searchParams));

      expect(result.current.isActive('status', 'open')).toBe(true);
      expect(result.current.isActive('status', 'closed')).toBe(true);
      expect(result.current.isActive('priority', 'high')).toBe(true);
    });

    it('should return false if value is not in current filters', () => {
      const searchParams = {
        status: 'open',
      };

      const { result } = renderHook(() => useFilterParams(searchParams));

      expect(result.current.isActive('status', 'closed')).toBe(false);
      expect(result.current.isActive('priority', 'high')).toBe(false);
      expect(result.current.isActive('module', 'combat')).toBe(false);
    });

    it('should return false for empty filters', () => {
      const searchParams = {};

      const { result } = renderHook(() => useFilterParams(searchParams));

      expect(result.current.isActive('status', 'open')).toBe(false);
      expect(result.current.isActive('priority', 'high')).toBe(false);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return true if any filters are active', () => {
      const searchParams = {
        status: 'open',
      };

      const { result } = renderHook(() => useFilterParams(searchParams));

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should return false if no filters are active', () => {
      const searchParams = {};

      const { result } = renderHook(() => useFilterParams(searchParams));

      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('should return true if multiple filter types are active', () => {
      const searchParams = {
        status: 'open',
        priority: 'high',
        module: 'combat',
      };

      const { result } = renderHook(() => useFilterParams(searchParams));

      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  describe('updateFilter', () => {
    it('should add a new filter value when checked=true', () => {
      const searchParams = {};
      mockUseSearchParams.mockReturnValue(new URLSearchParams());

      const { result } = renderHook(() => useFilterParams(searchParams));

      act(() => {
        result.current.updateFilter('status', 'open', true);
      });

      // Should navigate to URL with new filter
      expect(mockPush).toHaveBeenCalledWith('/issues?status=open');
    });

    it('should add multiple values to same filter type', () => {
      const searchParams = {
        status: 'open',
      };
      mockUseSearchParams.mockReturnValue(new URLSearchParams('status=open'));

      const { result } = renderHook(() => useFilterParams(searchParams));

      act(() => {
        result.current.updateFilter('status', 'closed', true);
      });

      // Should navigate to URL with CSV values
      expect(mockPush).toHaveBeenCalledWith('/issues?status=open%2Cclosed');
    });

    it('should remove a filter value when checked=false', () => {
      const searchParams = {
        status: 'open,closed',
      };
      mockUseSearchParams.mockReturnValue(new URLSearchParams('status=open,closed'));

      const { result } = renderHook(() => useFilterParams(searchParams));

      act(() => {
        result.current.updateFilter('status', 'open', false);
      });

      // Should navigate to URL with remaining value
      expect(mockPush).toHaveBeenCalledWith('/issues?status=closed');
    });

    it('should delete param when last value is removed', () => {
      const searchParams = {
        status: 'open',
      };
      mockUseSearchParams.mockReturnValue(new URLSearchParams('status=open'));

      const { result } = renderHook(() => useFilterParams(searchParams));

      act(() => {
        result.current.updateFilter('status', 'open', false);
      });

      // Should navigate to URL without status param
      expect(mockPush).toHaveBeenCalledWith('/issues?');
    });

    it('should reset page to 1 when filter changes', () => {
      const searchParams = {
        status: 'open',
      };
      mockUseSearchParams.mockReturnValue(new URLSearchParams('status=open&page=5'));

      const { result } = renderHook(() => useFilterParams(searchParams));

      act(() => {
        result.current.updateFilter('priority', 'high', true);
      });

      // Page param should be removed
      expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining('page='));
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('priority=high'));
    });

    it('should not add duplicate values', () => {
      const searchParams = {
        status: 'open',
      };
      mockUseSearchParams.mockReturnValue(new URLSearchParams('status=open'));

      const { result } = renderHook(() => useFilterParams(searchParams));

      act(() => {
        result.current.updateFilter('status', 'open', true);
      });

      // Should not add duplicate 'open'
      expect(mockPush).toHaveBeenCalledWith('/issues?status=open');
    });

    it('should preserve other filter types when updating one', () => {
      const searchParams = {
        status: 'open',
        priority: 'high',
      };
      mockUseSearchParams.mockReturnValue(new URLSearchParams('status=open&priority=high'));

      const { result } = renderHook(() => useFilterParams(searchParams));

      act(() => {
        result.current.updateFilter('module', 'combat', true);
      });

      // Should preserve status and priority
      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain('status=open');
      expect(callArg).toContain('priority=high');
      expect(callArg).toContain('module=combat');
    });
  });

  describe('clearAllFilters', () => {
    it('should remove all filter params', () => {
      const searchParams = {
        status: 'open',
        priority: 'high',
        module: 'combat',
      };
      mockUseSearchParams.mockReturnValue(
        new URLSearchParams('status=open&priority=high&module=combat')
      );

      const { result } = renderHook(() => useFilterParams(searchParams));

      act(() => {
        result.current.clearAllFilters();
      });

      // Should navigate to base issues URL
      expect(mockPush).toHaveBeenCalledWith('/issues');
    });

    it('should preserve non-filter params when clearing', () => {
      const searchParams = {
        status: 'open',
        q: 'search term',
      };
      mockUseSearchParams.mockReturnValue(new URLSearchParams('status=open&q=search+term'));

      const { result } = renderHook(() => useFilterParams(searchParams));

      act(() => {
        result.current.clearAllFilters();
      });

      // Should preserve search query
      expect(mockPush).toHaveBeenCalledWith('/issues?q=search+term');
    });

    it('should reset page when clearing filters', () => {
      const searchParams = {
        status: 'open',
      };
      mockUseSearchParams.mockReturnValue(new URLSearchParams('status=open&page=3'));

      const { result } = renderHook(() => useFilterParams(searchParams));

      act(() => {
        result.current.clearAllFilters();
      });

      // Page param should be removed
      expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining('page='));
    });
  });

  describe('memoization', () => {
    it('should memoize currentFilters when searchParams unchanged', () => {
      const searchParams = {
        status: 'open',
      };

      const { result, rerender } = renderHook(() => useFilterParams(searchParams));

      const firstFilters = result.current.currentFilters;

      // Rerender without changing searchParams
      rerender();

      const secondFilters = result.current.currentFilters;

      // Should be same object reference (memoized)
      expect(firstFilters).toBe(secondFilters);
    });

    it('should update currentFilters when searchParams change', () => {
      const initialParams = { status: 'open' };
      const { result, rerender } = renderHook(({ params }) => useFilterParams(params), {
        initialProps: { params: initialParams },
      });

      const firstFilters = result.current.currentFilters;

      // Change searchParams
      const newParams = { status: 'closed' };
      rerender({ params: newParams });

      const secondFilters = result.current.currentFilters;

      // Should be different object reference
      expect(firstFilters).not.toBe(secondFilters);
      expect(secondFilters.status).toEqual(['closed']);
    });
  });
});
