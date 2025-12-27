'use client';

/**
 * PhaseTimelineClient - Main client component for Phase Timeline view
 *
 * Sprint 15 Phase E: Orchestrates all Phase Timeline components.
 * Manages phase selection state, drawer visibility, and renders the
 * complete Phase Timeline UI.
 *
 * @see mockups/alternatives/COMBINED-01-phase-timeline.html
 */

import { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import type { PhaseTimelineClientProps } from '@/types/phase-timeline';
import type { SprintOverview, PhaseOverview } from '@/types/kanban';
import { PhaseSelector } from './PhaseSelector';
import { PhaseProgressBar } from './PhaseProgressBar';
import { SprintGrid } from './SprintGrid';
import { NextPhasePreview } from './NextPhasePreview';
import { PhaseStatsBar } from './PhaseStatsBar';
import { SprintHistoryDrawer } from './SprintHistoryDrawer';

export function PhaseTimelineClient({
  projectId,
  initialData,
}: PhaseTimelineClientProps) {
  const { phases, currentPhaseId, currentGlobalSprintNumber } = initialData;

  // Phase selection state - default to current phase from API
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(
    currentPhaseId ?? phases[0]?.id ?? ''
  );

  // Drawer state for completed sprint history
  const [drawerSprint, setDrawerSprint] = useState<SprintOverview | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Get selected phase
  const selectedPhase = useMemo(
    () => phases.find((p) => p.id === selectedPhaseId) ?? phases[0],
    [phases, selectedPhaseId]
  );

  // Find next phase for preview (if any)
  const nextPhase = useMemo(() => {
    if (!selectedPhase) return null;
    const currentIndex = phases.findIndex((p) => p.id === selectedPhase.id);
    if (currentIndex < 0 || currentIndex >= phases.length - 1) return null;
    return phases[currentIndex + 1];
  }, [phases, selectedPhase]);

  // Handlers
  const handlePhaseChange = useCallback((phaseId: string) => {
    setSelectedPhaseId(phaseId);
  }, []);

  const handleCompletedSprintClick = useCallback((sprint: SprintOverview) => {
    setDrawerSprint(sprint);
    setIsDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
    // Delay clearing sprint data to allow close animation
    setTimeout(() => setDrawerSprint(null), 300);
  }, []);

  // Guard against no phases
  if (!selectedPhase) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate">No phases found. Create a roadmap to get started.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-text-primary">Roadmap</h1>
          <PhaseSelector
            phases={phases}
            selectedPhaseId={selectedPhaseId}
            onPhaseChange={handlePhaseChange}
          />
        </div>

        {/* New Ticket Button */}
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-coral hover:bg-coral/90 text-white font-medium transition-colors"
          onClick={() => {
            // Navigate to ticket creation with project context and current global sprint
            window.location.href = `/tickets/new?project=${projectId}&sprintNumber=${currentGlobalSprintNumber ?? 1}`;
          }}
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* Phase Progress Bar */}
      <PhaseProgressBar
        phase={selectedPhase}
        currentGlobalSprintNumber={currentGlobalSprintNumber}
      />

      {/* Sprint Grid */}
      <SprintGrid
        projectId={projectId}
        sprints={selectedPhase.sprints}
        currentGlobalSprintNumber={currentGlobalSprintNumber}
        onCompletedSprintClick={handleCompletedSprintClick}
      />

      {/* Next Phase Preview (if not on last phase) */}
      {nextPhase && (
        <NextPhasePreview
          phase={nextPhase}
          onPhaseSelect={handlePhaseChange}
        />
      )}

      {/* Phase Stats Bar */}
      <PhaseStatsBar phase={selectedPhase} />

      {/* Sprint History Drawer */}
      <SprintHistoryDrawer
        projectId={projectId}
        sprint={drawerSprint}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
      />
    </div>
  );
}
