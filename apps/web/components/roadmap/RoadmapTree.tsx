'use client';

/**
 * RoadmapTree Component - Sprint 12
 *
 * Displays collapsible 4-level hierarchy tree with neumorphic design
 * - Phase → Sprint → Week → Day (Days are leaf nodes)
 * - Expandable/collapsible sections
 * - Progress visualization
 * - Status badges
 * - Coral theme matching Agent Personas
 *
 * Sprint 12: Task model removed - Days are now leaf nodes
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Map } from 'lucide-react';
import { PhaseCard } from './PhaseCard';
import { SprintCard } from './SprintCard';
import { WeekCard } from './WeekCard';
import { DayCard } from './DayCard';
import type { RoadmapWithRelations } from '@/types/roadmap';
import type { RoadmapFilterState } from './RoadmapFilters';

interface RoadmapTreeProps {
  roadmap: RoadmapWithRelations;
  filters?: RoadmapFilterState;
}

export function RoadmapTree({ roadmap, filters }: RoadmapTreeProps) {
  // Sprint 12: 4-level hierarchy (Phase → Sprint → Week → Day)
  // Days are now leaf nodes, no expandedDays state needed
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

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

      // If any child matches, include the phase
      const hasMatchingChildren = phase.sprints?.some((sprint) => {
        const sprintMatches = matchesFilters(sprint);
        if (sprintMatches) return true;

        // Check weeks
        return sprint.weeks?.some((week) => matchesFilters(week));
      });

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

  const toggleSprint = (sprintId: string) => {
    setExpandedSprints((prev) => {
      const next = new Set(prev);
      if (next.has(sprintId)) {
        next.delete(sprintId);
      } else {
        next.add(sprintId);
      }
      return next;
    });
  };

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) {
        next.delete(weekId);
      } else {
        next.add(weekId);
      }
      return next;
    });
  };

  // Sprint 12: toggleDay removed - Days are now leaf nodes

  if (roadmap.phases_rel.length === 0) {
    return (
      <div className="neu-raised rounded-3xl p-12 text-center">
        <div className="icon-coral heartbeat mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Map className="h-8 w-8 text-white" />
        </div>
        <p className="mb-2 text-lg font-semibold text-white">No roadmap data available</p>
        <p className="text-sm text-slate">
          Run materialization to create Phase/Sprint/Week/Day records
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

            {/* Sprints (collapsible) */}
            {isPhaseExpanded && phase.sprints && (
              <div className="border-t border-white/5 bg-dark-card/50">
                {phase.sprints.map((sprint) => {
                  const isSprintExpanded = expandedSprints.has(sprint.id);

                  return (
                    <div key={sprint.id} className="mb-4 ml-6 border-l-4 border-coral/30 last:mb-6">
                      {/* Sprint Card */}
                      <div
                        className="smooth-transition cursor-pointer hover:bg-white/5"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSprint(sprint.id);
                        }}
                      >
                        <div className="flex items-start gap-3 p-5">
                          <button className="neu-flat smooth-transition flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl hover:shadow-lg">
                            {isSprintExpanded ? (
                              <ChevronDown className="h-4 w-4 text-coral" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate" />
                            )}
                          </button>
                          <SprintCard sprint={sprint} />
                        </div>
                      </div>

                      {/* Weeks (collapsible) */}
                      {isSprintExpanded && sprint.weeks && (
                        <div className="ml-6 bg-dark-lighter/30">
                          {sprint.weeks.map((week) => {
                            const isWeekExpanded = expandedWeeks.has(week.id);

                            return (
                              <div key={week.id} className="mb-3 last:mb-4">
                                {/* Week Card */}
                                <div
                                  className="smooth-transition cursor-pointer rounded-xl hover:bg-white/5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWeek(week.id);
                                  }}
                                >
                                  <div className="flex items-start gap-3 p-4">
                                    <button className="neu-flat smooth-transition flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl hover:shadow-lg">
                                      {isWeekExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-coral" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-slate" />
                                      )}
                                    </button>
                                    <WeekCard week={week} />
                                  </div>
                                </div>

                                {/* Days - Sprint 12: 4-level hierarchy (Days are leaf nodes) */}
                                {isWeekExpanded && week.days && (
                                  <div className="mb-4 ml-12 mt-3 space-y-2">
                                    {week.days.map((day) => (
                                      <DayCard key={day.id} day={day} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
