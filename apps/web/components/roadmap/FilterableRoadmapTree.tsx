/**
 * FilterableRoadmapTree Component - Sprint 8.5
 *
 * Client Component wrapper that combines:
 * - RoadmapFilters (for filter controls)
 * - RoadmapTree (for roadmap visualization with filtering)
 *
 * This keeps the parent page as Server Component while enabling
 * client-side filtering functionality.
 */

'use client';

import { useState } from 'react';
import { RoadmapFilters, type RoadmapFilterState } from './RoadmapFilters';
import { RoadmapTree } from './RoadmapTree';
import type { RoadmapWithRelations } from '@/types/roadmap';

interface FilterableRoadmapTreeProps {
  roadmap: RoadmapWithRelations;
}

export function FilterableRoadmapTree({ roadmap }: FilterableRoadmapTreeProps) {
  const [filters, setFilters] = useState<RoadmapFilterState>({
    status: 'ALL',
    searchQuery: '',
  });

  return (
    <>
      <RoadmapFilters onFilterChange={setFilters} />
      <RoadmapTree roadmap={roadmap} filters={filters} />
    </>
  );
}
