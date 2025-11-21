'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export interface SidebarCounts {
  issues?: number;
  health?: number;
  knowledge?: number;
  wiki?: number;
}

export function useSidebarCounts() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const [counts, setCounts] = useState<SidebarCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchCounts = async () => {
      try {
        const response = await fetch(`/api/sidebar-counts?project=${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setCounts(data);
        }
      } catch (error) {
        console.error('Failed to fetch sidebar counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [projectId]);

  return { counts, loading, projectId: projectId ? parseInt(projectId, 10) : undefined };
}
