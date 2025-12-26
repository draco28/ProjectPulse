/**
 * Phase Timeline Components - Sprint 15 Phase E
 *
 * New roadmap UI with Sprint Grid and mini-kanban preview.
 * Replaces the old 4-level tree view with a more focused
 * phase-based timeline approach.
 *
 * @see mockups/alternatives/COMBINED-01-phase-timeline.html
 */

// Main client component
export { PhaseTimelineClient } from './PhaseTimelineClient';

// Phase-level components
export { PhaseSelector } from './PhaseSelector';
export { PhaseProgressBar } from './PhaseProgressBar';
export { PhaseStatsBar } from './PhaseStatsBar';

// Sprint-level components
export { SprintGrid } from './SprintGrid';
export { SprintCard } from './SprintCard';
export { MiniKanbanPreview } from './MiniKanbanPreview';

// Navigation components
export { NextPhasePreview } from './NextPhasePreview';
export { SprintHistoryDrawer } from './SprintHistoryDrawer';
