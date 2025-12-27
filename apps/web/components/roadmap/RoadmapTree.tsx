'use client';

/**
 * RoadmapTree Component
 *
 * Sprint 15: Week/Day removed - simplified 2-level hierarchy (Ticket #80)
 * Displays collapsible 2-level hierarchy tree with neumorphic design
 * - Phase -> Sprint (Sprints are leaf nodes with tickets)
 * - Expandable/collapsible sections
 * - Progress visualization
 * - Status badges
 * - Coral theme matching Agent Personas
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Map } from 'lucide-react';
import { PhaseCard } from './PhaseCard';
import { SprintCard } from './SprintCard';
import type { RoadmapWithRelations } from '@/types/roadmap';
import type { RoadmapFilterState } from './RoadmapFilters';

interface RoadmapTreeProps {
  roadmap: RoadmapWithRelations;
  filters?: RoadmapFilterState;
}

export function RoadmapTree({ roadmap, filters }: RoadmapTreeProps) {
  // Sprint 15: 2-level hierarchy (Phase -> Sprint)
  // Sprints are now leaf nodes
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  // Filter helper function
  const matchesFilters = (item: { title: string; description?: string | null; status: string }) => {
    // Status filter
    if (filters?.status && filters.status !== 'ALL' && item.status !== filters.status) {
      return false;
    }

    // Search filter
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const titleMatch = item.title.toLowerCase().includes(query);
      const descMatch = item.description?.toLowerCase().includes(query);
      if (!titleMatch && !descMatch) {
        return false;
      }
    }

    return true;
  };

  // Filter phases (and recursively filter children)
  const filteredPhases = useMemo(() => {
    if (!filters) return roadmap.phases_rel;

    return roadmap.phases_rel.filter((phase) => {
      const phaseMatches = matchesFilters(phase);

      // If phase matches, include it
      if (phaseMatches) return true;

      // If any sprint matches, include the phase
      const hasMatchingChildren = phase.sprints?.some((sprint) => matchesFilters(sprint));

      return hasMatchingChildren;
    });
  }, [roadmap.phases_rel, filters]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  if (roadmap.phases_rel.length === 0) {
    return (
      <div className="neu-raised rounded-3xl p-12 text-center">
        <div className="icon-coral heartbeat mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Map className="h-8 w-8 text-white" />
        </div>
        <p className="mb-2 text-lg font-semibold text-white">No roadmap data available</p>
        <p className="text-sm text-slate">
          Run materialization to create Phase/Sprint records
        </p>
      </div>
    );
  }

  if (filteredPhases.length === 0) {
    return (
      <div className="neu-raised rounded-3xl p-12 text-center">
        <div className="icon-coral mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Map className="h-8 w-8 text-white" />
        </div>
        <p className="mb-2 text-lg font-semibold text-white">No results match your filters</p>
        <p className="text-sm text-slate">Try adjusting your search query or status filter</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredPhases.map((phase) => {
        const isPhaseExpanded = expandedPhases.has(phase.id);

        return (
          <div key={phase.id} className="neu-raised overflow-hidden rounded-3xl">
            {/* Phase Card */}
            <div
              className="smooth-transition cursor-pointer hover:bg-white/5"
              onClick={() => togglePhase(phase.id)}
            >
              <div className="flex items-start gap-3 p-6">
                <button className="neu-flat smooth-transition flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl hover:shadow-lg">
                  {isPhaseExpanded ? (
                    <ChevronDown className="h-4 w-4 text-coral" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate" />
                  )}
                </button>
                <PhaseCard phase={phase} />
              </div>
            </div>

            {/* Sprint 15: Sprints are now leaf nodes (Week/Day removed - Ticket #80) */}
            {isPhaseExpanded && phase.sprints && (
              <div className="border-t border-white/5 bg-dark-card/50">
                {phase.sprints.map((sprint) => (
                  <div key={sprint.id} className="mb-4 ml-6 border-l-4 border-coral/30 last:mb-6">
                    {/* Sprint Card - Now a leaf node */}
                    <div className="p-5">
                      <SprintCard sprint={sprint} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
