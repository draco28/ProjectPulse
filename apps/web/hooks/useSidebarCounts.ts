'use client';

import { useEffect, useState } from 'react';

export interface SidebarCounts {
  issues?: number;
  health?: number;
  knowledge?: number;
  wiki?: number;
}

export function useSidebarCounts() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [counts, setCounts] = useState<SidebarCounts | null>(null);
  const [loading, setLoading] = useState(true);

  // Read projectId from URL once on mount (avoids useSearchParams re-render loop)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('project');
    setProjectId(id);
  }, []); // Empty deps - run only once on mount

  // Fetch counts when projectId is available
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchCounts() {
      try {
        const response = await fetch(`/api/sidebar-counts?project=${projectId}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          setCounts(data);
        }
      } catch (error) {
        // Ignore abort errors (expected when request is cancelled)
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Failed to fetch sidebar counts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCounts();

    // Cleanup: abort pending request when projectId changes or component unmounts
    return () => {
      controller.abort();
    };
  }, [projectId]); // Only re-fetch when projectId changes

  return { counts, loading, projectId: projectId ? parseInt(projectId, 10) : undefined };
}
