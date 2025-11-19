'use client';

/**
 * RoadmapTree Component - Sprint 8.5
 *
 * Displays collapsible 5-level hierarchy tree with neumorphic design
 * - Phase → Sprint → Week → Day → Task
 * - Expandable/collapsible sections
 * - Progress visualization
 * - Status badges
 * - Coral theme matching Agent Personas
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Map } from 'lucide-react';
import { PhaseCard } from './PhaseCard';
import { SprintCard } from './SprintCard';
import { WeekCard } from './WeekCard';
import { DayCard } from './DayCard';
import { TaskCard } from './TaskCard';
import type { RoadmapWithRelations } from '@/types/roadmap';
import type { RoadmapFilterState} from './RoadmapFilters';

interface RoadmapTreeProps {
  roadmap: RoadmapWithRelations;
  filters?: RoadmapFilterState;
}

export function RoadmapTree({ roadmap, filters }: RoadmapTreeProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

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
    setExpandedPhases(prev => {
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
    setExpandedSprints(prev => {
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
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekId)) {
        next.delete(weekId);
      } else {
        next.add(weekId);
      }
      return next;
    });
  };

  const toggleDay = (dayId: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayId)) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }
      return next;
    });
  };

  if (roadmap.phases_rel.length === 0) {
    return (
      <div className="neu-raised rounded-3xl p-12 text-center">
        <div className="icon-coral heartbeat flex h-16 w-16 items-center justify-center rounded-2xl mx-auto mb-4">
          <Map className="h-8 w-8 text-white" />
        </div>
        <p className="text-white text-lg font-semibold mb-2">
          No roadmap data available
        </p>
        <p className="text-sm text-slate">
          Run materialization to create Phase/Sprint/Week/Day records
        </p>
      </div>
    );
  }

  if (filteredPhases.length === 0) {
    return (
      <div className="neu-raised rounded-3xl p-12 text-center">
        <div className="icon-coral flex h-16 w-16 items-center justify-center rounded-2xl mx-auto mb-4">
          <Map className="h-8 w-8 text-white" />
        </div>
        <p className="text-white text-lg font-semibold mb-2">
          No results match your filters
        </p>
        <p className="text-sm text-slate">
          Try adjusting your search query or status filter
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredPhases.map((phase) => {
        const isPhaseExpanded = expandedPhases.has(phase.id);

        return (
          <div key={phase.id} className="neu-raised rounded-3xl overflow-hidden">
            {/* Phase Card */}
            <div
              className="cursor-pointer hover:bg-white/5 smooth-transition"
              onClick={() => togglePhase(phase.id)}
            >
              <div className="flex items-start gap-3 p-6">
                <button className="neu-flat smooth-transition h-8 w-8 rounded-xl flex items-center justify-center hover:shadow-lg flex-shrink-0">
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
              <div className="bg-dark-card/50 border-t border-white/5">
                {phase.sprints.map((sprint) => {
                  const isSprintExpanded = expandedSprints.has(sprint.id);

                  return (
                    <div key={sprint.id} className="border-l-4 border-coral/30 ml-6 mb-4 last:mb-6">
                      {/* Sprint Card */}
                      <div
                        className="cursor-pointer hover:bg-white/5 smooth-transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSprint(sprint.id);
                        }}
                      >
                        <div className="flex items-start gap-3 p-5">
                          <button className="neu-flat smooth-transition h-8 w-8 rounded-xl flex items-center justify-center hover:shadow-lg flex-shrink-0">
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
                        <div className="bg-dark-lighter/30 ml-6">
                          {sprint.weeks.map((week) => {
                            const isWeekExpanded = expandedWeeks.has(week.id);

                            return (
                              <div key={week.id} className="mb-3 last:mb-4">
                                {/* Week Card */}
                                <div
                                  className="cursor-pointer hover:bg-white/5 smooth-transition rounded-xl"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWeek(week.id);
                                  }}
                                >
                                  <div className="flex items-start gap-3 p-4">
                                    <button className="neu-flat smooth-transition h-8 w-8 rounded-xl flex items-center justify-center hover:shadow-lg flex-shrink-0">
                                      {isWeekExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-coral" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-slate" />
                                      )}
                                    </button>
                                    <WeekCard week={week} />
                                  </div>
                                </div>

                                {/* Days (collapsible) - Sprint 8.5: Full 5-level hierarchy */}
                                {isWeekExpanded && week.days && (
                                  <div className="ml-12 space-y-2 mt-3 mb-4">
                                    {week.days.map((day) => {
                                      const isDayExpanded = expandedDays.has(day.id);
                                      
                                      return (
                                        <DayCard
                                          key={day.id}
                                          day={day}
                                          isExpanded={isDayExpanded}
                                          onToggle={() => toggleDay(day.id)}
                                        />
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
            )}
          </div>
        );
      })}
    </div>
  );
}
