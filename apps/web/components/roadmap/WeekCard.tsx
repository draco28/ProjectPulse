'use client';

/**
 * WeekCard Component - DEPRECATED
 *
 * Sprint 15: Week/Day models removed (Ticket #80)
 * This component is stubbed for backward compatibility.
 * Roadmap hierarchy is now 2-level: Phase -> Sprint
 *
 * @deprecated Use SprintCard instead. This file will be removed in a future release.
 */

interface WeekCardProps {
  week?: unknown; // Keep prop for backward compatibility
}

/**
 * @deprecated Sprint 15: Week model removed (Ticket #80)
 * Roadmap is now 2-level hierarchy: Phase -> Sprint
 */
export function WeekCard({ week: _week }: WeekCardProps) {
  // Sprint 15: Week/Day removed - return null for backward compatibility
  return null;
}
