'use client';

/**
 * DayCard Component - DEPRECATED
 *
 * Sprint 15: Week/Day models removed (Ticket #80)
 * This component is stubbed for backward compatibility.
 * Roadmap hierarchy is now 2-level: Phase -> Sprint
 *
 * @deprecated Use SprintCard instead. This file will be removed in a future release.
 */

interface DayCardProps {
  day?: unknown; // Keep prop for backward compatibility
}

/**
 * @deprecated Sprint 15: Day model removed (Ticket #80)
 * Roadmap is now 2-level hierarchy: Phase -> Sprint
 */
export function DayCard({ day: _day }: DayCardProps) {
  // Sprint 15: Week/Day removed - return null for backward compatibility
  return null;
}
