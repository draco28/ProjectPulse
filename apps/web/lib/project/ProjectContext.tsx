'use client';

/**
 * Project Context Provider
 *
 * Provides project-aware utilities to all client components:
 * - projectId: Current active project
 * - buildHref(): Build URLs with project param preserved
 * - navigateTo(): Navigate while preserving project
 * - updateSearchParams(): Update URL params without losing project
 *
 * USAGE:
 *
 * // In layout.tsx
 * <ProjectProvider projectId={projectId}>
 *   {children}
 * </ProjectProvider>
 *
 * // In any client component
 * const { projectId, buildHref, navigateTo } = useProject();
 */

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

// ============================================================================
// Types
// ============================================================================

export interface ProjectContextValue {
  /** Current project ID (null if not in project context) */
  projectId: number | null;

  /** Project name (if available from server) */
  projectName: string | null;

  /**
   * Build a URL with project context preserved.
   *
   * @param path - The base path (e.g., '/wiki', '/tickets')
   * @param params - Additional query params to include
   * @returns Full URL with ?project=X and any additional params
   *
   * @example
   * buildHref('/wiki') // => '/wiki?project=1'
   * buildHref('/tickets', { status: 'open' }) // => '/tickets?project=1&status=open'
   */
  buildHref: (
    path: string,
    params?: Record<string, string | number | undefined>
  ) => string;

  /**
   * Navigate to a path while preserving project context.
   *
   * @param path - The base path to navigate to
   * @param params - Additional query params to include
   *
   * @example
   * navigateTo('/wiki');
   * navigateTo('/tickets', { status: 'open' });
   */
  navigateTo: (
    path: string,
    params?: Record<string, string | number | undefined>
  ) => void;

  /**
   * Update search params on current page without losing project context.
   * Pass null as value to remove a param.
   *
   * @param updates - Key-value pairs to update
   *
   * @example
   * updateSearchParams({ q: 'search term', page: '2' });
   * updateSearchParams({ q: null }); // Removes q param
   */
  updateSearchParams: (
    updates: Record<string, string | number | null | undefined>
  ) => void;

  /**
   * Clear all search params except project and navigate to current path.
   */
  clearSearchParams: () => void;
}

// ============================================================================
// Context
// ============================================================================

const ProjectContext = createContext<ProjectContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface ProjectProviderProps {
  children: ReactNode;
  /** Project ID from server (takes precedence over URL) */
  projectId?: number;
  /** Project name from server */
  projectName?: string;
}

export function ProjectProvider({
  children,
  projectId: serverProjectId,
  projectName: serverProjectName,
}: ProjectProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Resolve projectId: server prop > URL param > null
  const projectId = useMemo(() => {
    if (serverProjectId) return serverProjectId;
    const urlProject = searchParams.get('project');
    if (urlProject) {
      const parsed = parseInt(urlProject, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }, [serverProjectId, searchParams]);

  const projectName = serverProjectName ?? null;

  // Build href with project context
  const buildHref = useCallback(
    (
      path: string,
      params: Record<string, string | number | undefined> = {}
    ) => {
      const urlParams = new URLSearchParams();

      // ALWAYS include project if we have one
      if (projectId) {
        urlParams.set('project', projectId.toString());
      }

      // Add additional params (skip undefined values)
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlParams.set(key, String(value));
        }
      });

      const queryString = urlParams.toString();
      return queryString ? `${path}?${queryString}` : path;
    },
    [projectId]
  );

  // Navigate with project context
  const navigateTo = useCallback(
    (
      path: string,
      params: Record<string, string | number | undefined> = {}
    ) => {
      router.push(buildHref(path, params));
    },
    [router, buildHref]
  );

  // Update search params while preserving project
  // Bug fix (Ticket #172): Read from window.location.search directly to avoid
  // stale searchParams from useSearchParams() during SSR/hydration with Suspense
  //
  // IMPORTANT: searchParams is intentionally NOT in the dependency array because:
  // 1. We read params from window.location.search (fresh on every call)
  // 2. Including searchParams causes callback recreation on every URL change
  // 3. Which triggers SearchSortBar's useEffect and resets pagination
  const updateSearchParams = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      // Read current params from window.location to get the freshest state
      // This fixes pagination issues where useSearchParams() returns stale data
      const currentSearch = typeof window !== 'undefined'
        ? window.location.search
        : '';  // SSR fallback - empty params is fine, will be set on client
      const params = new URLSearchParams(currentSearch);

      // Ensure project is preserved
      if (projectId && !params.has('project')) {
        params.set('project', projectId.toString());
      }

      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      router.push(`${pathname}?${params.toString()}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchParams omitted intentionally, see comment above
    [router, pathname, projectId]
  );

  // Clear all params except project
  const clearSearchParams = useCallback(() => {
    if (projectId) {
      router.push(`${pathname}?project=${projectId}`);
    } else {
      router.push(pathname);
    }
  }, [router, pathname, projectId]);

  const value = useMemo<ProjectContextValue>(
    () => ({
      projectId,
      projectName,
      buildHref,
      navigateTo,
      updateSearchParams,
      clearSearchParams,
    }),
    [
      projectId,
      projectName,
      buildHref,
      navigateTo,
      updateSearchParams,
      clearSearchParams,
    ]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Access project context in any client component.
 *
 * @throws Error if used outside of ProjectProvider
 *
 * @example
 * function MyComponent() {
 *   const { projectId, buildHref, navigateTo } = useProject();
 *
 *   return (
 *     <button onClick={() => navigateTo('/tickets')}>
 *       View Tickets
 *     </button>
 *   );
 * }
 */
export function useProject(): ProjectContextValue {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error(
      'useProject must be used within a ProjectProvider. ' +
        'Wrap your component tree with <ProjectProvider projectId={...}>.'
    );
  }

  return context;
}

/**
 * Optional hook that returns null instead of throwing if outside provider.
 * Useful for components that may or may not be in project context.
 */
export function useProjectOptional(): ProjectContextValue | null {
  return useContext(ProjectContext);
}
